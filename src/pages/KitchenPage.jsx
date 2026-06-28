import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { db } from "../utils/firebase";
import { ref, onValue, update } from "firebase/database";
import { useAuth } from "../context/AuthContext";

const STATUS_CONFIG = {
  new:       { label:"🔔 New",       chip:"chip-new",  next:"preparing", nextLabel:"🍳 Start Preparing", btnCls:"k-btn-new"       },
  preparing: { label:"🍳 Preparing", chip:"chip-prep", next:"ready",     nextLabel:"✅ Mark Ready",       btnCls:"k-btn-preparing" },
  ready:     { label:"✅ Ready",     chip:"chip-ready",next:"done",      nextLabel:"🗑 Clear",            btnCls:"k-btn-ready"     },
};

function timeAgo(iso) {
  const d = Math.floor((Date.now() - new Date(iso)) / 1000);
  if (d < 60) return `${d}s ago`;
  if (d < 3600) return `${Math.floor(d/60)}m ago`;
  return `${Math.floor(d/3600)}h ${Math.floor((d % 3600)/60)}m ago`;
}

function playBeep() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    [0, 180, 360].forEach(delay => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.connect(g); g.connect(ctx.destination);
      o.frequency.value = 880; o.type = "sine";
      g.gain.setValueAtTime(0.4, ctx.currentTime + delay / 1000);
      g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay / 1000 + 0.28);
      o.start(ctx.currentTime + delay / 1000);
      o.stop(ctx.currentTime + delay / 1000 + 0.3);
    });
  } catch (_) {}
}

function OrderCard({ order, onUpdate }) {
  const cfg       = STATUS_CONFIG[order.status] || {};
  const isOverdue = order.status === "new" && (Date.now() - new Date(order.placedAt)) / 60000 > 10;

  return (
    <div className={`k-card k-status-${order.status} ${isOverdue ? "k-overdue" : ""}`}>
      <div className={`k-card-head k-head-${order.status}`}>
        <div>
          <div className="k-table">🪑 Table {order.tableNo}</div>
          <div className="k-customer">{order.customerName} · {order.customerPhone}</div>
        </div>
        <div className="k-card-right">
          <span className={`k-chip ${cfg.chip}`}>{cfg.label}</span>
          <div className="k-timer">{timeAgo(order.placedAt)}</div>
          {isOverdue && <div className="k-overdue-tag">⚠ 10m+</div>}
        </div>
      </div>

      <div className="k-items">
        {(order.items || []).map((item, i) => (
          <div key={i} className="k-item-row">
            <span><span className="k-qty">×{item.qty}</span> {item.emoji} {item.name}</span>
            <span className="k-item-price">₹{item.subtotal}</span>
          </div>
        ))}
      </div>

      {order.note && <div className="k-note">📝 {order.note}</div>}

      <div className="k-total-row">
        <span>Total</span>
        <span>₹{order.total}</span>
      </div>

      {order.status !== "done" && (
        <div className="k-actions">
          <button
            className={`k-btn ${cfg.btnCls}`}
            onClick={() => onUpdate(order.id, cfg.next)}
          >
            {cfg.nextLabel}
          </button>
        </div>
      )}
    </div>
  );
}

export default function KitchenPage() {
  const { profile, canAccess, logout } = useAuth();
  const navigate       = useNavigate();
  const [orders, setOrders]       = useState({});
  const [activeTab, setActiveTab] = useState("new");
  const [connected, setConnected] = useState(false);
  const [toast, setToast]         = useState(null);
  const prevNewCount = useRef(0);

  // Role check: kitchen users should ONLY be here
  // (ProtectedRoute already enforces this, but we also ensure
  //  the "Admin →" shortcut is only shown to non-kitchen roles)
  const isKitchenOnly = profile?.role === "kitchen";
  const canSeeAdmin   = canAccess("dashboard"); // owner + manager only

  useEffect(() => {
    const unsub = onValue(
      ref(db, "orders"),
      snap => {
        const data = snap.val() || {};
        // Sound alert on new orders
        const newCount = Object.values(data).filter(o => o.status === "new").length;
        if (newCount > prevNewCount.current && prevNewCount.current >= 0) {
          playBeep();
        }
        prevNewCount.current = newCount;
        setOrders(data);
        setConnected(true);
      },
      () => setConnected(false)
    );
    return unsub;
  }, []);

  // Re-render timer labels every 30s
  useEffect(() => {
    const t = setInterval(() => setOrders(o => ({ ...o })), 30000);
    return () => clearInterval(t);
  }, []);

  const handleUpdate = async (id, status) => {
    try {
      await update(ref(db, `orders/${id}`), { status });
      const MSG = { preparing:"👨‍🍳 Now preparing!", ready:"✅ Ready to serve!", done:"🗑 Cleared" };
      setToast(MSG[status] || "Updated");
      setTimeout(() => setToast(null), 2500);
    } catch {
      setToast("❌ Update failed — check connection");
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const all      = Object.entries(orders).map(([id, o]) => ({ id, ...o }));
  const PRIORITY = { new:0, preparing:1, ready:2, done:3 };

  const tabs = [
    { id:"new",       label:"🔔 New",      count: all.filter(o => o.status === "new").length       },
    { id:"preparing", label:"🍳 Prep",     count: all.filter(o => o.status === "preparing").length  },
    { id:"ready",     label:"✅ Ready",    count: all.filter(o => o.status === "ready").length      },
    { id:"all",       label:"All Active",  count: all.filter(o => o.status !== "done").length       },
  ];

  const filtered = (activeTab === "all"
    ? all.filter(o => o.status !== "done")
    : all.filter(o => o.status === activeTab)
  ).sort((a, b) =>
    (PRIORITY[a.status] || 0) - (PRIORITY[b.status] || 0) ||
    new Date(a.placedAt) - new Date(b.placedAt)
  );

  return (
    <div className="kitchen-page">
      {/* ── Header ── */}
      <header className="k-header">
        <div className="k-brand">
          <h1>Bikaner Branch</h1>
          {/* Kitchen-only staff see their name; others see the full role */}
          <p>
            {isKitchenOnly
              ? `Kitchen Display · ${profile?.name || "Staff"}`
              : "Kitchen Display · Kanhan"}
          </p>
        </div>

        {/* Live stats */}
        <div className="k-stats-row">
          <div className="k-stat">
            <span className="k-stat-num new-color">{all.filter(o => o.status === "new").length}</span>
            <span className="k-stat-label">New</span>
          </div>
          <div className="k-stat">
            <span className="k-stat-num prep-color">{all.filter(o => o.status === "preparing").length}</span>
            <span className="k-stat-label">Prep</span>
          </div>
          <div className="k-stat">
            <span className="k-stat-num ready-color">{all.filter(o => o.status === "ready").length}</span>
            <span className="k-stat-label">Ready</span>
          </div>
          <div className="k-stat">
            <span className="k-stat-num gold-color">{all.length}</span>
            <span className="k-stat-label">Total</span>
          </div>
        </div>

        {/* Right controls */}
        <div className="k-header-actions">
          {/* Live indicator */}
          <div className={`k-live-pill ${connected ? "live" : "offline"}`}>
            <span className="k-live-dot" />
            {connected ? "Live" : "Offline"}
          </div>

          {/* Admin shortcut — only for owner/manager, NEVER for kitchen role */}
          {canSeeAdmin && (
            <button className="k-action-btn" onClick={() => navigate("/admin")}>
              Admin →
            </button>
          )}

          {/* Sign out */}
          <button className="k-signout-btn" onClick={handleLogout}>
            Sign Out
          </button>
        </div>
      </header>

      {/* ── Tabs ── */}
      <div className="k-tabs">
        {tabs.map(tab => (
          <button
            key={tab.id}
            className={`k-tab ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            {tab.count > 0 && <span className="k-tab-count">{tab.count}</span>}
          </button>
        ))}
      </div>

      {/* ── Order Grid ── */}
      <div className="k-grid">
        {filtered.length === 0 ? (
          <div className="k-empty">
            <span>🍽️</span>
            <p>
              {activeTab === "new"
                ? "No new orders yet"
                : activeTab === "preparing"
                ? "Nothing being prepared"
                : activeTab === "ready"
                ? "Nothing ready to serve"
                : "No active orders"}
            </p>
            <small>Orders appear here in real-time</small>
          </div>
        ) : (
          filtered.map(order => (
            <OrderCard key={order.id} order={order} onUpdate={handleUpdate} />
          ))
        )}
      </div>

      {/* ── Toast ── */}
      {toast && <div className="k-toast">{toast}</div>}
    </div>
  );
}
