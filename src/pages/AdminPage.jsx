import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { ref, onValue, update, remove, set, push } from "firebase/database";
import { createUserWithEmailAndPassword, updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { db, auth } from "../utils/firebase";
import { useAuth } from "../context/AuthContext";
import { MENU_ITEMS, MENU_CATEGORIES } from "../data/menu";

/* ─────────────────── helpers ─────────────────── */
const fmt     = (n) => `₹${Number(n || 0).toLocaleString("en-IN")}`;
const fmtDate = (iso) => !iso ? "—" : new Date(iso).toLocaleString("en-IN", { day:"2-digit", month:"short", hour:"2-digit", minute:"2-digit", hour12:true });
const timeAgo = (iso) => {
  const d = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (d < 60) return `${d}s ago`;
  if (d < 3600) return `${Math.floor(d/60)}m ago`;
  return `${Math.floor(d/3600)}h ago`;
};
const todayKey = () => new Date().toISOString().slice(0, 10);

const STATUS_CFG = {
  new:       { label:"🔔 New",       cls:"chip-new",   next:"preparing", btn:"🍳 Start Preparing", btnCls:"k-btn-new"       },
  preparing: { label:"🍳 Preparing", cls:"chip-prep",  next:"ready",     btn:"✅ Mark Ready",       btnCls:"k-btn-preparing" },
  ready:     { label:"✅ Ready",     cls:"chip-ready", next:"done",      btn:"🗑 Clear",            btnCls:"k-btn-ready"     },
  done:      { label:"✓ Done",       cls:"chip-done",  next:null,        btn:null                                            },
};
const ROLES       = ["owner","manager","kitchen","waiter"];
const ROLE_COLORS = { owner:"#D97706", manager:"#6B5CE7", kitchen:"#22C55E", waiter:"#3B82F6" };

/* ─────────────────── notification sound ─────────────────── */
function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 150, 300].forEach(delay => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = 880;
      o.type = "sine";
      g.gain.setValueAtTime(0.4, ctx.currentTime + delay/1000);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay/1000 + 0.25);
      o.start(ctx.currentTime + delay/1000);
      o.stop(ctx.currentTime + delay/1000 + 0.3);
    });
  } catch (_) {}
}

/* ─────────────────── SIDEBAR ─────────────────── */
function Sidebar({ active, setActive, canAccess, profile, onLogout, mobileOpen, onMobileClose, newOrderCount }) {
  const NAV = [
    { id:"dashboard", icon:"📊", label:"Dashboard",  access:"dashboard" },
    { id:"orders",    icon:"📋", label:"All Orders", access:"orders"    },
    { id:"kitchen",   icon:"🍳", label:"Kitchen",    access:"kitchen"   },
    { id:"accounts",  icon:"👥", label:"Accounts",   access:"accounts"  },
    { id:"menu",      icon:"🍽️", label:"Menu",       access:"menu"      },
    { id:"profile",   icon:"⚙️", label:"My Profile", access:null        },
  ].filter(n => n.access === null || canAccess(n.access));

  return (
    <>
      {mobileOpen && <div className="sb-backdrop" onClick={onMobileClose} />}
      <aside className={`sidebar ${mobileOpen ? "sb-open" : ""}`}>
        <div className="sb-brand">
          <div className="sb-logo">🪔</div>
          <div>
            <div className="sb-name">Bikaner Branch</div>
            <div className="sb-sub">Admin Panel</div>
          </div>
        </div>

        <nav className="sb-nav">
          {NAV.map(item => (
            <button
              key={item.id}
              className={`sb-item ${active === item.id ? "active" : ""}`}
              onClick={() => { setActive(item.id); onMobileClose(); }}
            >
              <span className="sb-icon">{item.icon}</span>
              <span style={{flex:1}}>{item.label}</span>
              {item.id === "kitchen" && newOrderCount > 0 && (
                <span className="sb-badge">{newOrderCount}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="sb-footer">
          <div className="sb-profile">
            <div className="sb-avatar" style={{ background: ROLE_COLORS[profile?.role] || "#555" }}>
              {(profile?.name || "U")[0].toUpperCase()}
            </div>
            <div className="sb-profile-info">
              <div className="sb-profile-name">{profile?.name || "Staff"}</div>
              <div className="sb-profile-role">{profile?.role || "—"}</div>
            </div>
          </div>
          <button className="sb-logout" onClick={onLogout} title="Sign out">⏻</button>
        </div>
      </aside>
    </>
  );
}

/* ─────────────────── DASHBOARD ─────────────────── */
function DashboardPanel({ orders }) {
  const allArr     = Object.values(orders || {});
  const today      = todayKey();
  const todayOrds  = allArr.filter(o => (o.placedAt||"").slice(0,10) === today);
  const revenue    = todayOrds.reduce((s,o) => s + (o.total||0), 0);
  const active     = allArr.filter(o => ["new","preparing","ready"].includes(o.status));
  const avgOrder   = todayOrds.length ? Math.round(revenue / todayOrds.length) : 0;
  const doneToday  = todayOrds.filter(o => o.status === "done").length;

  /* last-7-days revenue */
  const last7 = Array.from({length:7}, (_,i) => {
    const d = new Date(); d.setDate(d.getDate() - (6-i));
    const key   = d.toISOString().slice(0,10);
    const label = d.toLocaleDateString("en-IN",{weekday:"short"});
    const rev   = allArr.filter(o=>(o.placedAt||"").slice(0,10)===key).reduce((s,o)=>s+(o.total||0),0);
    const cnt   = allArr.filter(o=>(o.placedAt||"").slice(0,10)===key).length;
    return { key, label, rev, cnt };
  });
  const maxRev = Math.max(...last7.map(d=>d.rev), 1);

  /* top items */
  const itemCount = {};
  todayOrds.forEach(o => (o.items||[]).forEach(i => { itemCount[i.name] = (itemCount[i.name]||0)+i.qty; }));
  const topItems = Object.entries(itemCount).sort((a,b)=>b[1]-a[1]).slice(0,5);

  /* weekly totals */
  const weekRev   = last7.reduce((s,d) => s+d.rev, 0);
  const weekOrds  = last7.reduce((s,d) => s+d.cnt, 0);

  const stats = [
    { label:"Today's Revenue",  value:fmt(revenue),       icon:"💰", color:"var(--gold)"   },
    { label:"Today's Orders",   value:todayOrds.length,   icon:"📋", color:"var(--prep)"   },
    { label:"Active Now",       value:active.length,      icon:"🔥", color:"#F59E0B"        },
    { label:"Avg Order Value",  value:fmt(avgOrder),      icon:"📈", color:"var(--success)" },
    { label:"Week Revenue",     value:fmt(weekRev),       icon:"🗓️", color:"var(--terra)"   },
    { label:"Week Orders",      value:weekOrds,           icon:"📦", color:"#3B82F6"        },
    { label:"Completed Today",  value:doneToday,          icon:"✅", color:"var(--success)" },
    { label:"Total Orders",     value:allArr.length,      icon:"🏪", color:"var(--muted)"   },
  ];

  /* export CSV */
  const exportCSV = () => {
    const rows = [["Date","Table","Customer","Phone","Items","Total","Status","Note"]];
    allArr.forEach(o => {
      rows.push([
        fmtDate(o.placedAt), o.tableNo, o.customerName||"", o.customerPhone||"",
        (o.items||[]).map(i=>`${i.name}x${i.qty}`).join("; "),
        o.total||0, o.status, o.note||""
      ]);
    });
    const csv  = rows.map(r => r.map(c=>`"${String(c).replace(/"/g,'""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], {type:"text/csv"});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `bikaner-orders-${today}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Dashboard</h2>
          <span className="panel-date">{new Date().toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"})}</span>
        </div>
        <button className="export-btn" onClick={exportCSV} title="Export all orders as CSV">⬇ Export CSV</button>
      </div>

      {/* Stat cards */}
      <div className="dash-stats">
        {stats.map(s => (
          <div key={s.label} className="dash-stat-card">
            <div className="dash-stat-icon" style={{background:`${s.color}18`}}>{s.icon}</div>
            <div>
              <div className="dash-stat-value" style={{color:s.color}}>{s.value}</div>
              <div className="dash-stat-label">{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div className="dash-grid-2">
        {/* Revenue bar chart */}
        <div className="dash-card">
          <div className="dash-card-title">Revenue — Last 7 Days</div>
          <div className="bar-chart">
            {last7.map(d => (
              <div key={d.key} className="bar-item">
                <div className="bar-val">{d.rev > 0 ? fmt(d.rev).replace("₹","") : ""}</div>
                <div className="bar-wrap">
                  <div
                    className={`bar-fill ${d.key === today ? "bar-today" : ""}`}
                    style={{ height:`${Math.max(4, Math.round((d.rev/maxRev)*100))}%` }}
                  />
                </div>
                <div className="bar-label">{d.label}</div>
                {d.cnt > 0 && <div className="bar-count">{d.cnt} ord</div>}
              </div>
            ))}
          </div>
        </div>

        {/* Top items */}
        <div className="dash-card">
          <div className="dash-card-title">Top Items Today</div>
          {topItems.length === 0
            ? <div className="dash-empty">No orders placed today yet</div>
            : topItems.map(([name,qty],i) => (
              <div key={name} className="top-item-row">
                <span className="top-item-rank">#{i+1}</span>
                <span className="top-item-name">{name}</span>
                <span className="top-item-qty">{qty} sold</span>
                <div className="top-item-bar" style={{width:`${Math.round((qty/topItems[0][1])*100)}%`}} />
              </div>
            ))
          }
        </div>
      </div>

      {/* Live active orders */}
      {active.length > 0 && (
        <div className="dash-card" style={{marginTop:"14px"}}>
          <div className="dash-card-title" style={{display:"flex",justifyContent:"space-between"}}>
            <span>Active Orders ({active.length})</span>
            <span style={{color:"#22C55E",fontWeight:700,animation:"pulse 1.5s infinite",fontSize:"11px"}}>● LIVE</span>
          </div>
          <div className="active-orders-list">
            {active.sort((a,b)=>new Date(a.placedAt)-new Date(b.placedAt)).map((o,i) => (
              <div key={i} className="active-order-row">
                <span className={`k-chip ${STATUS_CFG[o.status]?.cls}`}>{STATUS_CFG[o.status]?.label}</span>
                <span className="ao-table">T{o.tableNo}</span>
                <span className="ao-name">{o.customerName}</span>
                <span className="ao-items">{(o.items||[]).length} items</span>
                <span className="ao-total">{fmt(o.total)}</span>
                <span className="ao-time">{timeAgo(o.placedAt)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {active.length === 0 && todayOrds.length === 0 && (
        <div className="dash-card" style={{marginTop:"14px",textAlign:"center",padding:"40px"}}>
          <div style={{fontSize:"48px",marginBottom:"12px"}}>🍽️</div>
          <div style={{color:"var(--muted)",fontSize:"15px"}}>No orders yet today. Share your QR code to start receiving orders!</div>
        </div>
      )}
    </div>
  );
}

/* ─────────────────── ALL ORDERS ─────────────────── */
function OrdersPanel({ orders }) {
  const [filter, setFilter]     = useState("all");
  const [search, setSearch]     = useState("");
  const [dateFilter, setDate]   = useState(todayKey());
  const [expandedId, setExp]    = useState(null);
  const [sortBy, setSort]       = useState("newest");

  const allArr = Object.entries(orders||{}).map(([id,o])=>({id,...o}));

  const filtered = useMemo(() => {
    let list = allArr
      .filter(o => filter === "all" || o.status === filter)
      .filter(o => !dateFilter || (o.placedAt||"").slice(0,10) === dateFilter)
      .filter(o => {
        if (!search.trim()) return true;
        const q = search.toLowerCase();
        return (o.customerName||"").toLowerCase().includes(q)
          || (o.customerPhone||"").includes(q)
          || String(o.tableNo).includes(q)
          || (o.items||[]).some(i=>i.name.toLowerCase().includes(q));
      });
    list.sort((a,b) => sortBy === "newest"
      ? new Date(b.placedAt)-new Date(a.placedAt)
      : sortBy === "oldest"
        ? new Date(a.placedAt)-new Date(b.placedAt)
        : (b.total||0)-(a.total||0));
    return list;
  }, [allArr, filter, search, dateFilter, sortBy]);

  const totalRev = filtered.reduce((s,o) => s+(o.total||0), 0);

  const handleStatus = async (id, next) => {
    if (!next) return;
    await update(ref(db, `orders/${id}`), { status:next });
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this order permanently?")) return;
    await remove(ref(db, `orders/${id}`));
  };

  const statusCounts = {
    all: allArr.filter(o=>!dateFilter||(o.placedAt||"").slice(0,10)===dateFilter).length,
    new: allArr.filter(o=>o.status==="new"&&(!dateFilter||(o.placedAt||"").slice(0,10)===dateFilter)).length,
    preparing: allArr.filter(o=>o.status==="preparing"&&(!dateFilter||(o.placedAt||"").slice(0,10)===dateFilter)).length,
    ready: allArr.filter(o=>o.status==="ready"&&(!dateFilter||(o.placedAt||"").slice(0,10)===dateFilter)).length,
    done: allArr.filter(o=>o.status==="done"&&(!dateFilter||(o.placedAt||"").slice(0,10)===dateFilter)).length,
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">All Orders</h2>
          <span className="panel-rev">{fmt(totalRev)} · {filtered.length} orders</span>
        </div>
      </div>

      {/* Filters */}
      <div className="orders-filters">
        <input className="field-input search-input" placeholder="🔍  Name, phone, table, item…" value={search} onChange={e=>setSearch(e.target.value)} />
        <input className="field-input" type="date" value={dateFilter} onChange={e=>setDate(e.target.value)} style={{width:"auto"}}/>
        <select className="field-input" value={sortBy} onChange={e=>setSort(e.target.value)} style={{width:"auto"}}>
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
          <option value="total">Highest value</option>
        </select>
      </div>

      <div className="filter-pills" style={{marginBottom:"16px"}}>
        {["all","new","preparing","ready","done"].map(s => (
          <button key={s} className={`filter-pill ${filter===s?"active":""}`} onClick={()=>setFilter(s)}>
            {s === "all" ? "All" : STATUS_CFG[s]?.label || s}
            <span className="filter-pill-count">{statusCounts[s]||0}</span>
          </button>
        ))}
      </div>

      {/* Orders list */}
      <div className="orders-table-wrap">
        {filtered.length === 0
          ? <div className="dash-empty" style={{padding:"48px 0"}}>No orders match your filters</div>
          : filtered.map(o => (
            <div key={o.id} className={`order-row-card ${o.status}`}>
              <div className="orc-main" onClick={()=>setExp(expandedId===o.id?null:o.id)}>
                <div className="orc-left">
                  <span className={`k-chip ${STATUS_CFG[o.status]?.cls||"chip-done"}`}>
                    {STATUS_CFG[o.status]?.label||"Done"}
                  </span>
                  <span className="orc-table">🪑 T{o.tableNo}</span>
                  <span className="orc-customer">{o.customerName} · {o.customerPhone}</span>
                </div>
                <div className="orc-right">
                  <span className="orc-total">{fmt(o.total)}</span>
                  <span className="orc-time">{fmtDate(o.placedAt)}</span>
                  <span className="orc-expand">{expandedId===o.id?"▲":"▼"}</span>
                </div>
              </div>

              {expandedId===o.id && (
                <div className="orc-detail">
                  <div className="orc-items">
                    {(o.items||[]).map((it,i)=>(
                      <div key={i} className="orc-item">
                        <span>{it.emoji} {it.name} <span style={{color:"var(--muted)"}}>×{it.qty}</span></span>
                        <span>{fmt(it.subtotal)}</span>
                      </div>
                    ))}
                    <div className="orc-item" style={{fontWeight:700,color:"var(--ink)",borderTop:"1px solid var(--border)",paddingTop:"6px",marginTop:"4px"}}>
                      <span>Total</span><span style={{color:"var(--terra)"}}>{fmt(o.total)}</span>
                    </div>
                  </div>
                  {o.note && <div className="orc-note">📝 {o.note}</div>}
                  <div className="orc-actions">
                    {STATUS_CFG[o.status]?.btn && (
                      <button className={`k-btn ${STATUS_CFG[o.status]?.btnCls}`} style={{width:"auto",padding:"8px 20px",fontSize:"13px"}}
                        onClick={()=>handleStatus(o.id, STATUS_CFG[o.status]?.next)}>
                        {STATUS_CFG[o.status]?.btn}
                      </button>
                    )}
                    <button onClick={()=>handleDelete(o.id)} style={{marginLeft:"auto",background:"rgba(185,28,28,0.08)",color:"var(--crimson)",border:"1px solid rgba(185,28,28,0.2)",padding:"8px 14px",borderRadius:"8px",fontSize:"12px",cursor:"pointer"}}>
                      🗑 Delete
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        }
      </div>
    </div>
  );
}

/* ─────────────────── KITCHEN PANEL (inside admin) ─────────────────── */
function KitchenPanel({ orders }) {
  const [activeTab, setActiveTab] = useState("new");
  const [toastMsg, setToastMsg]   = useState(null);
  const allArr = Object.entries(orders||{}).map(([id,o])=>({id,...o}));
  const PRIORITY = { new:0, preparing:1, ready:2, done:3 };

  const tabs = [
    { id:"new",       label:"🔔 New",      count:allArr.filter(o=>o.status==="new").length       },
    { id:"preparing", label:"🍳 Preparing", count:allArr.filter(o=>o.status==="preparing").length },
    { id:"ready",     label:"✅ Ready",    count:allArr.filter(o=>o.status==="ready").length     },
    { id:"all",       label:"All Active",  count:allArr.filter(o=>o.status!=="done").length      },
  ];

  const filtered = (activeTab === "all"
    ? allArr.filter(o=>o.status!=="done")
    : allArr.filter(o=>o.status===activeTab)
  ).sort((a,b)=>(PRIORITY[a.status]||0)-(PRIORITY[b.status]||0)||new Date(a.placedAt)-new Date(b.placedAt));

  const handleUpdate = async (id, next) => {
    if (!next) return;
    await update(ref(db,`orders/${id}`),{status:next});
    const msgs = {preparing:"👨‍🍳 Now preparing!",ready:"✅ Ready to serve!",done:"🗑 Order cleared"};
    setToastMsg(msgs[next]);
    setTimeout(()=>setToastMsg(null),2500);
  };

  return (
    <div className="panel panel-kitchen">
      <div className="panel-header">
        <h2 className="panel-title">Kitchen Display</h2>
        <div style={{display:"flex",gap:"20px"}}>
          {[["new","#F59E0B"],["preparing","#6B5CE7"],["ready","#22C55E"]].map(([s,c])=>(
            <div key={s} className="k-stat">
              <span className="k-stat-num" style={{color:c}}>{allArr.filter(o=>o.status===s).length}</span>
              <span className="k-stat-label" style={{color:"rgba(255,255,255,0.4)"}}>{s}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="k-tabs" style={{padding:"0",borderBottom:"1px solid var(--dk-border)"}}>
        {tabs.map(t=>(
          <button key={t.id} className={`k-tab ${activeTab===t.id?"active":""}`} onClick={()=>setActiveTab(t.id)}>
            {t.label}
            {t.count>0 && <span className="k-tab-count">{t.count}</span>}
          </button>
        ))}
      </div>

      <div className="k-grid" style={{padding:"16px 0"}}>
        {filtered.length===0
          ? <div className="k-empty"><span>🍽️</span><p>Nothing here</p></div>
          : filtered.map(o=>{
            const cfg=STATUS_CFG[o.status]||{};
            const overdue=o.status==="new"&&(Date.now()-new Date(o.placedAt))/60000>10;
            return (
              <div key={o.id} className={`k-card k-status-${o.status} ${overdue?"k-overdue":""}`}>
                <div className={`k-card-head k-head-${o.status}`}>
                  <div>
                    <div className="k-table">🪑 Table {o.tableNo}</div>
                    <div className="k-customer">{o.customerName} · {o.customerPhone}</div>
                  </div>
                  <div className="k-card-right">
                    <span className={`k-chip ${cfg.cls}`}>{cfg.label}</span>
                    <div className="k-timer">{timeAgo(o.placedAt)}</div>
                    {overdue && <div className="k-overdue-tag">⚠ 10m+</div>}
                  </div>
                </div>
                <div className="k-items">
                  {(o.items||[]).map((it,i)=>(
                    <div key={i} className="k-item-row">
                      <span><span className="k-qty">×{it.qty}</span> {it.emoji} {it.name}</span>
                      <span className="k-item-price">₹{it.subtotal}</span>
                    </div>
                  ))}
                </div>
                {o.note&&<div className="k-note">📝 {o.note}</div>}
                <div className="k-total-row"><span>Total</span><span>₹{o.total}</span></div>
                {cfg.btn&&(
                  <div className="k-actions">
                    <button className={`k-btn ${cfg.btnCls}`} onClick={()=>handleUpdate(o.id,cfg.next)}>{cfg.btn}</button>
                  </div>
                )}
              </div>
            );
          })
        }
      </div>
      {toastMsg && <div className="k-toast">{toastMsg}</div>}
    </div>
  );
}

/* ─────────────────── ACCOUNTS ─────────────────── */
function AccountsPanel() {
  const { profile:myProfile } = useAuth();
  const [staff, setStaff]     = useState({});
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm]       = useState({name:"",email:"",password:"",role:"kitchen"});
  const [formErr, setFormErr] = useState("");
  const [creating, setCreating]= useState(false);
  const [successMsg, setSuccessMsg]= useState("");

  useEffect(()=>{
    return onValue(ref(db,"staff"), snap=>setStaff(snap.val()||{}));
  },[]);

  const staffArr = Object.entries(staff).map(([uid,s])=>({uid,...s}))
    .sort((a,b)=>{
      const order={owner:0,manager:1,kitchen:2,waiter:3};
      return (order[a.role]||9)-(order[b.role]||9);
    });

  const handleCreate = async (e)=>{
    e.preventDefault();
    if(!form.name.trim()||!form.email.trim()||form.password.length<6){
      setFormErr("Name and email required. Password must be at least 6 characters."); return;
    }
    setFormErr(""); setCreating(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, form.email.trim(), form.password);
      await updateProfile(cred.user,{displayName:form.name.trim()});
      await set(ref(db,`staff/${cred.user.uid}`),{
        name:form.name.trim(), email:form.email.trim(),
        role:form.role, uid:cred.user.uid,
        createdBy:myProfile?.email||"owner",
        createdAt:new Date().toISOString(),
      });
      setSuccessMsg(`✅ ${form.name} added as ${form.role}. They can now log in at /login`);
      setForm({name:"",email:"",password:"",role:"kitchen"});
      setShowAdd(false);
      setTimeout(()=>setSuccessMsg(""),5000);
    } catch(err){
      const m={
        "auth/email-already-in-use":"This email is already registered.",
        "auth/invalid-email":"Invalid email address.",
        "auth/weak-password":"Password must be at least 6 characters.",
      }[err.code]||err.message;
      setFormErr(m);
    } finally{ setCreating(false); }
  };

  const handleRemove = async(uid,name)=>{
    if(!window.confirm(`Remove ${name} from staff list? Their login will still work — disable from Firebase Console if needed.`)) return;
    await remove(ref(db,`staff/${uid}`));
  };

  const handleRole = async(uid,role)=> await update(ref(db,`staff/${uid}`),{role});

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Staff Accounts</h2>
          <span className="panel-date">{staffArr.length} staff members</span>
        </div>
        {myProfile?.role==="owner" && (
          <button className="btn btn-primary" style={{padding:"8px 18px",fontSize:"13px"}} onClick={()=>setShowAdd(s=>!s)}>
            {showAdd?"✕ Cancel":"+ Add Staff"}
          </button>
        )}
      </div>

      {successMsg && <div className="acc-success">{successMsg}</div>}

      {showAdd && (
        <div className="acc-form-card">
          <div className="dash-card-title">New Staff Member</div>
          <form onSubmit={handleCreate} className="acc-form">
            <div className="acc-form-grid">
              <div className="field">
                <label className="field-label">Full Name *</label>
                <input className="field-input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Ravi Kumar"/>
              </div>
              <div className="field">
                <label className="field-label">Role *</label>
                <select className="field-input" value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value}))}>
                  {ROLES.filter(r=>r!=="owner").map(r=><option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
                </select>
              </div>
              <div className="field">
                <label className="field-label">Email Address *</label>
                <input className="field-input" type="email" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} placeholder="ravi@bikaner.com"/>
              </div>
              <div className="field">
                <label className="field-label">Password (min 6 chars) *</label>
                <input className="field-input" type="password" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} placeholder="••••••••"/>
              </div>
            </div>
            {formErr && <div className="login-error">{formErr}</div>}
            <button type="submit" className="btn btn-primary w-full" disabled={creating}>
              {creating?"Creating account…":"Create Staff Account"}
            </button>
          </form>

          <div className="role-guide">
            <div className="rg-title">Role Permissions</div>
            {[
              {role:"owner",   perms:"Full access: dashboard, orders, kitchen, accounts, menu management"},
              {role:"manager", perms:"Dashboard, orders management, kitchen display, menu management"},
              {role:"kitchen", perms:"Kitchen display only — see and update order statuses"},
              {role:"waiter",  perms:"All orders list — view and update order statuses"},
            ].map(r=>(
              <div key={r.role} className="rg-row">
                <span className="rg-role" style={{color:ROLE_COLORS[r.role]}}>{r.role}</span>
                <span className="rg-perms">{r.perms}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="staff-list">
        {staffArr.length===0
          ? <div className="dash-empty">No staff accounts found</div>
          : staffArr.map(s=>(
            <div key={s.uid} className="staff-card">
              <div className="staff-avatar" style={{background:ROLE_COLORS[s.role]||"#555"}}>
                {(s.name||"?")[0].toUpperCase()}
              </div>
              <div className="staff-info">
                <div className="staff-name">
                  {s.name}
                  {s.uid===myProfile?.uid && <span className="staff-me">you</span>}
                </div>
                <div className="staff-email">{s.email}</div>
                {s.createdAt&&<div className="staff-since">Added {fmtDate(s.createdAt)}{s.createdBy?` by ${s.createdBy}`:""}</div>}
              </div>
              <div className="staff-actions">
                {myProfile?.role==="owner"&&s.uid!==myProfile?.uid ? (
                  <>
                    <select className="field-input staff-role-select" value={s.role} onChange={e=>handleRole(s.uid,e.target.value)}>
                      {ROLES.map(r=><option key={r} value={r}>{r.charAt(0).toUpperCase()+r.slice(1)}</option>)}
                    </select>
                    <button className="staff-remove-btn" onClick={()=>handleRemove(s.uid,s.name)}>Remove</button>
                  </>
                ):(
                  <span className="staff-role-badge" style={{background:ROLE_COLORS[s.role]+"22",color:ROLE_COLORS[s.role]}}>
                    {s.role}
                  </span>
                )}
              </div>
            </div>
          ))
        }
      </div>
    </div>
  );
}

/* ─────────────────── MENU PANEL ─────────────────── */
function MenuPanel() {
  const [customItems, setCustomItems] = useState({});
  const [showAdd, setShowAdd]         = useState(false);
  const [editItem, setEditItem]       = useState(null);
  const [form, setForm]               = useState({name:"",category:"starters",price:"",emoji:"🍽️",desc:"",veg:true,tags:"",available:true});
  const [saving, setSaving]           = useState(false);
  const [search, setSearch]           = useState("");
  const [activeSource, setSource]     = useState("static"); // "static" | "custom"

  const CATS = ["starters","main","biryani","breads","desserts","drinks"];

  useEffect(()=>{
    return onValue(ref(db,"menu"),snap=>setCustomItems(snap.val()||{}));
  },[]);

  const resetForm = ()=>{ setForm({name:"",category:"starters",price:"",emoji:"🍽️",desc:"",veg:true,tags:"",available:true}); setEditItem(null); setShowAdd(false); };

  const handleSave = async(e)=>{
    e.preventDefault();
    if(!form.name.trim()||!form.price){ alert("Name and price are required"); return; }
    setSaving(true);
    const data={
      name:form.name.trim(), category:form.category, price:Number(form.price),
      emoji:form.emoji||"🍽️", desc:form.desc.trim(), veg:form.veg,
      tags:form.tags.split(",").map(t=>t.trim()).filter(Boolean),
      available:form.available, updatedAt:new Date().toISOString(),
    };
    try{
      if(editItem) await update(ref(db,`menu/${editItem}`),data);
      else await push(ref(db,"menu"),{...data,createdAt:new Date().toISOString()});
      resetForm();
    }catch(err){alert("Save failed: "+err.message);}
    setSaving(false);
  };

  const handleEdit=(id,item)=>{
    setForm({name:item.name,category:item.category,price:String(item.price),emoji:item.emoji||"🍽️",
      desc:item.desc||"",veg:!!item.veg,tags:(item.tags||[]).join(", "),available:item.available!==false});
    setEditItem(id); setShowAdd(true); setSource("custom");
  };

  const handleDelete=async(id,name)=>{
    if(!window.confirm(`Delete "${name}"?`)) return;
    await remove(ref(db,`menu/${id}`));
  };

  const toggleAvailable=async(id,current)=> await update(ref(db,`menu/${id}`),{available:!current});

  const customArr = Object.entries(customItems).map(([id,i])=>({id,...i}));
  const staticArr = MENU_ITEMS;

  const displayItems = (activeSource==="static" ? staticArr : customArr)
    .filter(i=>!search||i.name?.toLowerCase().includes(search.toLowerCase())||(i.desc||"").toLowerCase().includes(search.toLowerCase()));

  const groupedStatic = MENU_CATEGORIES.reduce((acc,cat)=>{
    const items=displayItems.filter(i=>i.category===cat.id);
    if(items.length) acc[cat.id]={...cat,items};
    return acc;
  },{});

  const groupedCustom = CATS.reduce((acc,cat)=>{
    const items=displayItems.filter(i=>i.category===cat);
    if(items.length) acc[cat]={label:cat,items};
    return acc;
  },{});

  const grouped = activeSource==="static" ? groupedStatic : groupedCustom;

  return (
    <div className="panel">
      <div className="panel-header">
        <div>
          <h2 className="panel-title">Menu Management</h2>
          <span className="panel-date">Static: {staticArr.length} items · Custom (Firebase): {customArr.length} items</span>
        </div>
        <button className="btn btn-primary" style={{padding:"8px 18px",fontSize:"13px"}}
          onClick={()=>{setShowAdd(s=>!s);if(showAdd)resetForm();}}>
          {showAdd?"✕ Cancel":"+ Add Custom Item"}
        </button>
      </div>

      {showAdd && (
        <div className="acc-form-card">
          <div className="dash-card-title">{editItem?"Edit Item":"Add Custom Menu Item"}</div>
          <form onSubmit={handleSave} className="menu-form">
            <div className="menu-form-row">
              <div className="field" style={{flex:"0 0 70px"}}>
                <label className="field-label">Emoji</label>
                <input className="field-input" value={form.emoji} onChange={e=>setForm(f=>({...f,emoji:e.target.value}))} style={{textAlign:"center",fontSize:"22px",padding:"8px"}} maxLength={2}/>
              </div>
              <div className="field" style={{flex:1}}>
                <label className="field-label">Item Name *</label>
                <input className="field-input" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="e.g. Special Thali"/>
              </div>
            </div>
            <div className="menu-form-row">
              <div className="field" style={{flex:1}}>
                <label className="field-label">Category</label>
                <select className="field-input" value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))}>
                  {CATS.map(c=><option key={c} value={c}>{c.charAt(0).toUpperCase()+c.slice(1)}</option>)}
                </select>
              </div>
              <div className="field" style={{flex:"0 0 130px"}}>
                <label className="field-label">Price (₹) *</label>
                <input className="field-input" type="number" min="0" value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))} placeholder="199"/>
              </div>
            </div>
            <div className="field">
              <label className="field-label">Description</label>
              <textarea className="field-input" rows={2} value={form.desc} onChange={e=>setForm(f=>({...f,desc:e.target.value}))} placeholder="Brief description…"/>
            </div>
            <div className="menu-form-row" style={{alignItems:"center"}}>
              <div className="field" style={{flex:1}}>
                <label className="field-label">Tags (comma separated)</label>
                <input className="field-input" value={form.tags} onChange={e=>setForm(f=>({...f,tags:e.target.value}))} placeholder="popular, spicy"/>
              </div>
              <div className="field veg-toggle-field">
                <label className="field-label">Type</label>
                <div className="veg-toggle">
                  <button type="button" className={`veg-btn ${form.veg?"veg-active":""}`} onClick={()=>setForm(f=>({...f,veg:true}))}>🟢 Veg</button>
                  <button type="button" className={`veg-btn ${!form.veg?"nonveg-active":""}`} onClick={()=>setForm(f=>({...f,veg:false}))}>🔴 Non-Veg</button>
                </div>
              </div>
              <div className="field" style={{flex:"0 0 auto"}}>
                <label className="field-label">Available</label>
                <div className="veg-toggle">
                  <button type="button" className={`veg-btn ${form.available?"veg-active":""}`} onClick={()=>setForm(f=>({...f,available:true}))}>On</button>
                  <button type="button" className={`veg-btn ${!form.available?"nonveg-active":""}`} onClick={()=>setForm(f=>({...f,available:false}))}>Off</button>
                </div>
              </div>
            </div>
            <div className="menu-form-btns">
              <button type="submit" className="btn btn-primary" style={{flex:1}} disabled={saving}>{saving?"Saving…":editItem?"Update Item":"Add to Menu"}</button>
              <button type="button" className="btn btn-secondary" onClick={resetForm}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Source tabs */}
      <div className="source-tabs">
        <button className={`source-tab ${activeSource==="static"?"active":""}`} onClick={()=>setSource("static")}>
          📄 Static Menu ({staticArr.length} items)
        </button>
        <button className={`source-tab ${activeSource==="custom"?"active":""}`} onClick={()=>setSource("custom")}>
          ☁️ Custom (Firebase) ({customArr.length} items)
        </button>
      </div>

      <div style={{marginBottom:"14px"}}>
        <input className="field-input search-input" placeholder="🔍  Search items…" value={search} onChange={e=>setSearch(e.target.value)}/>
      </div>

      {activeSource==="static"&&(
        <div className="panel-hint">
          📌 Static menu is defined in <code>src/data/menu.js</code>. To edit, update that file and redeploy. Use "Custom" tab to add daily specials or extras without code changes.
        </div>
      )}

      {Object.keys(grouped).length===0
        ? <div className="dash-empty" style={{padding:"40px 0"}}>{search?"No items match your search":"No items yet. Click + Add Custom Item to begin."}</div>
        : Object.entries(grouped).map(([catId,group])=>(
          <div key={catId} className="menu-category-group">
            <div className="menu-cat-label">{group.label||catId} <span style={{color:"var(--muted)",fontWeight:400}}>({group.items.length})</span></div>
            {group.items.map(item=>(
              <div key={item.id||item.name} className={`menu-item-row ${item.available===false?"menu-item-unavailable":""}`}>
                <span className="menu-item-emoji">{item.emoji}</span>
                <div className="menu-item-info">
                  <div className="menu-item-name">
                    {item.name}
                    <span className={`veg-dot ${item.veg?"veg":"nonveg"}`}><span/></span>
                    {item.available===false&&<span className="menu-item-off">Unavailable</span>}
                  </div>
                  <div className="menu-item-desc">{item.desc}</div>
                  {(item.tags||[]).length>0&&(
                    <div style={{display:"flex",gap:"4px",flexWrap:"wrap",marginTop:"4px"}}>
                      {item.tags.map(t=><span key={t} className="tag tag-popular" style={{fontSize:"9px"}}>{t}</span>)}
                    </div>
                  )}
                </div>
                <div className="menu-item-price">₹{item.price}</div>
                {activeSource==="custom"&&(
                  <div className="menu-item-actions">
                    <button className="menu-avail-btn" onClick={()=>toggleAvailable(item.id,item.available!==false)} title={item.available===false?"Mark available":"Mark unavailable"}>
                      {item.available===false?"✅":"🚫"}
                    </button>
                    <button className="menu-edit-btn" onClick={()=>handleEdit(item.id,item)}>✏️</button>
                    <button className="menu-del-btn"  onClick={()=>handleDelete(item.id,item.name)}>🗑️</button>
                  </div>
                )}
              </div>
            ))}
          </div>
        ))
      }
    </div>
  );
}

/* ─────────────────── PROFILE PANEL ─────────────────── */
function ProfilePanel() {
  const { user, profile } = useAuth();
  const [pwForm, setPwForm]   = useState({current:"",newPw:"",confirm:""});
  const [pwErr, setPwErr]     = useState("");
  const [pwOk, setPwOk]       = useState("");
  const [saving, setSaving]   = useState(false);
  const [showCur, setShowCur] = useState(false);
  const [showNew, setShowNew] = useState(false);

  const handlePasswordChange = async(e)=>{
    e.preventDefault();
    if(!pwForm.current||!pwForm.newPw||!pwForm.confirm){setPwErr("All fields required"); return;}
    if(pwForm.newPw!==pwForm.confirm){setPwErr("New passwords do not match"); return;}
    if(pwForm.newPw.length<6){setPwErr("Password must be at least 6 characters"); return;}
    setPwErr(""); setSaving(true);
    try{
      const cred=EmailAuthProvider.credential(user.email,pwForm.current);
      await reauthenticateWithCredential(user,cred);
      await updatePassword(user,pwForm.newPw);
      setPwOk("✅ Password changed successfully");
      setPwForm({current:"",newPw:"",confirm:""});
      setTimeout(()=>setPwOk(""),4000);
    }catch(err){
      const m={
        "auth/wrong-password":"Current password is incorrect.",
        "auth/too-many-requests":"Too many attempts. Please try again later.",
      }[err.code]||err.message;
      setPwErr(m);
    }finally{setSaving(false);}
  };

  return (
    <div className="panel">
      <div className="panel-header">
        <h2 className="panel-title">My Profile</h2>
      </div>

      {/* Profile info */}
      <div className="dash-card" style={{marginBottom:"20px"}}>
        <div className="dash-card-title">Account Information</div>
        <div className="profile-info-grid">
          <div className="profile-field">
            <div className="profile-avatar-lg" style={{background:ROLE_COLORS[profile?.role]||"#555"}}>
              {(profile?.name||"U")[0].toUpperCase()}
            </div>
          </div>
          <div className="profile-details">
            <div className="profile-detail-row"><span className="pd-label">Name</span><span className="pd-value">{profile?.name||"—"}</span></div>
            <div className="profile-detail-row"><span className="pd-label">Email</span><span className="pd-value">{user?.email||"—"}</span></div>
            <div className="profile-detail-row">
              <span className="pd-label">Role</span>
              <span className="pd-value" style={{display:"flex",alignItems:"center",gap:"8px"}}>
                <span className="staff-role-badge" style={{background:ROLE_COLORS[profile?.role]+"22",color:ROLE_COLORS[profile?.role]}}>
                  {profile?.role||"—"}
                </span>
              </span>
            </div>
            <div className="profile-detail-row"><span className="pd-label">UID</span><span className="pd-value" style={{fontSize:"11px",color:"var(--muted)",fontFamily:"monospace"}}>{user?.uid}</span></div>
          </div>
        </div>
      </div>

      {/* Change password */}
      <div className="dash-card">
        <div className="dash-card-title">Change Password</div>
        {pwOk&&<div className="acc-success">{pwOk}</div>}
        <form onSubmit={handlePasswordChange} style={{display:"flex",flexDirection:"column",gap:"14px",maxWidth:"400px"}}>
          <div className="field">
            <label className="field-label">Current Password</label>
            <div className="pass-wrap">
              <input className="field-input" type={showCur?"text":"password"} value={pwForm.current} onChange={e=>setPwForm(f=>({...f,current:e.target.value}))} placeholder="••••••••"/>
              <button type="button" className="pass-toggle" onClick={()=>setShowCur(s=>!s)}>{showCur?"🙈":"👁️"}</button>
            </div>
          </div>
          <div className="field">
            <label className="field-label">New Password</label>
            <div className="pass-wrap">
              <input className="field-input" type={showNew?"text":"password"} value={pwForm.newPw} onChange={e=>setPwForm(f=>({...f,newPw:e.target.value}))} placeholder="Min 6 characters"/>
              <button type="button" className="pass-toggle" onClick={()=>setShowNew(s=>!s)}>{showNew?"🙈":"👁️"}</button>
            </div>
          </div>
          <div className="field">
            <label className="field-label">Confirm New Password</label>
            <input className="field-input" type="password" value={pwForm.confirm} onChange={e=>setPwForm(f=>({...f,confirm:e.target.value}))} placeholder="Repeat new password"/>
          </div>
          {pwErr&&<div className="login-error">{pwErr}</div>}
          <button type="submit" className="btn btn-primary" style={{width:"auto",alignSelf:"flex-start",padding:"10px 24px"}} disabled={saving}>
            {saving?"Changing…":"Change Password"}
          </button>
        </form>
      </div>

      {/* App info */}
      <div className="dash-card" style={{marginTop:"20px"}}>
        <div className="dash-card-title">App Information</div>
        <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
          {[
            {label:"Customer Menu URL", value:`${window.location.origin}/menu?table=1`},
            {label:"Kitchen Display URL", value:`${window.location.origin}/kitchen`},
            {label:"Admin Panel URL", value:`${window.location.origin}/admin`},
            {label:"QR Scan Landing", value:`${window.location.origin}/scan?table=1`},
          ].map(r=>(
            <div key={r.label} className="profile-detail-row">
              <span className="pd-label">{r.label}</span>
              <span className="pd-value" style={{fontSize:"12px",fontFamily:"monospace",color:"var(--terra)",wordBreak:"break-all"}}>
                {r.value}
              </span>
            </div>
          ))}
        </div>
        <div style={{marginTop:"16px",padding:"12px 14px",background:"rgba(217,119,6,0.06)",borderRadius:"10px",border:"1px solid rgba(217,119,6,0.15)"}}>
          <div style={{fontSize:"12px",fontWeight:700,color:"var(--gold)",marginBottom:"6px"}}>📱 QR Code per Table</div>
          <div style={{fontSize:"12px",color:"var(--muted)"}}>
            Generate QR codes pointing to <code style={{background:"rgba(0,0,0,0.06)",padding:"1px 5px",borderRadius:"4px"}}>{window.location.origin}/scan?table=N</code> (replace N with table number) using any free QR generator like qr.io or qrcode-monkey.com
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────── MAIN ADMIN PAGE ─────────────────── */
export default function AdminPage() {
  const { profile, canAccess, logout } = useAuth();
  const navigate  = useNavigate();
  const [active, setActive]     = useState("dashboard");
  const [orders, setOrders]     = useState({});
  const [mobileNav, setMobileNav]= useState(false);
  const prevNewCount = useRef(0);

  /* Live orders feed + new order sound */
  useEffect(()=>{
    const unsub = onValue(ref(db,"orders"), snap=>{
      const data = snap.val()||{};
      const newCount = Object.values(data).filter(o=>o.status==="new").length;
      if(newCount > prevNewCount.current && prevNewCount.current >= 0){
        playBeep();
      }
      prevNewCount.current = newCount;
      setOrders(data);
    });
    return unsub;
  },[]);

  /* Set default tab by role */
  useEffect(()=>{
    if(!profile) return;
    if(canAccess("dashboard"))    setActive("dashboard");
    else if(canAccess("orders"))  setActive("orders");
    else if(canAccess("kitchen")) setActive("kitchen");
  },[profile]);

  const handleLogout = async()=>{ await logout(); navigate("/login"); };

  const newOrderCount = Object.values(orders).filter(o=>o.status==="new").length;

  return (
    <div className="admin-layout">
      {/* Mobile topbar */}
      <div className="admin-topbar">
        <button className="topbar-menu-btn" onClick={()=>setMobileNav(true)}>☰</button>
        <span className="topbar-title">Bikaner Admin</span>
        {newOrderCount>0&&<span className="topbar-badge">{newOrderCount} New</span>}
      </div>

      <Sidebar
        active={active} setActive={setActive}
        canAccess={canAccess} profile={profile}
        onLogout={handleLogout}
        mobileOpen={mobileNav}
        onMobileClose={()=>setMobileNav(false)}
        newOrderCount={newOrderCount}
      />

      <main className="admin-main">
        {active==="dashboard" && canAccess("dashboard") && <DashboardPanel orders={orders}/>}
        {active==="orders"    && canAccess("orders")    && <OrdersPanel    orders={orders}/>}
        {active==="kitchen"   && canAccess("kitchen")   && <KitchenPanel   orders={orders}/>}
        {active==="accounts"  && canAccess("accounts")  && <AccountsPanel/>}
        {active==="menu"      && canAccess("menu")      && <MenuPanel/>}
        {active==="profile"   &&                            <ProfilePanel/>}
      </main>
    </div>
  );
}
