import { useState, useRef, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { ref, onValue } from "firebase/database";
import { db } from "../utils/firebase";
import { MENU_CATEGORIES, MENU_ITEMS } from "../data/menu";
import MenuCard from "../components/menu/MenuCard";
import OrderFAB from "../components/menu/OrderFAB";
import OrderSheet from "../components/menu/OrderSheet";

export default function MenuPage() {
  const [searchParams]    = useSearchParams();
  const tableNo           = searchParams.get("table") || "1";
  const [activeCat, setActiveCat]   = useState("all");
  const [search, setSearch]         = useState("");
  const [sheetOpen, setSheetOpen]   = useState(false);
  const [customItems, setCustomItems] = useState({});
  const catNavRef = useRef(null);

  // Load custom Firebase menu items
  useEffect(() => {
    const unsub = onValue(ref(db, "menu"), snap => {
      const data = snap.val() || {};
      // Only include available items
      const avail = Object.fromEntries(
        Object.entries(data).filter(([,v]) => v.available !== false)
      );
      setCustomItems(avail);
    });
    return unsub;
  }, []);

  // Merge static + custom items, custom overrides by name if same
  const allItems = [
    ...MENU_ITEMS,
    ...Object.values(customItems).map((it, i) => ({
      id: `custom_${i}`,
      ...it,
      veg: it.veg !== false,
      tags: it.tags || [],
      isCustom: true,
    })),
  ];

  const categories = [
    { id: "all", label: "All", emoji: "🍽️" },
    ...MENU_CATEGORIES,
  ];

  // Filter by category + search
  const filtered = allItems.filter(item => {
    const matchCat = activeCat === "all" || item.category === activeCat;
    const q = search.trim().toLowerCase();
    const matchSearch = !q
      || item.name.toLowerCase().includes(q)
      || (item.desc || "").toLowerCase().includes(q);
    return matchCat && matchSearch;
  });

  // Group for display
  const grouped = MENU_CATEGORIES.reduce((acc, cat) => {
    const items = filtered.filter(i => i.category === cat.id);
    if (items.length) acc[cat.id] = { ...cat, items };
    return acc;
  }, {});

  const handleCatClick = (catId) => {
    setActiveCat(catId);
    setSearch("");
    if (catId !== "all") {
      setTimeout(() => {
        const el = document.getElementById(`section-${catId}`);
        if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 118, behavior: "smooth" });
      }, 50);
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
    // Scroll the cat nav pill into view
    const nav = catNavRef.current;
    if (nav) {
      const btn = nav.querySelector(`[data-cat="${catId}"]`);
      if (btn) btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    }
  };

  const totalItems = allItems.length;
  const searchResultCount = search ? filtered.length : null;

  return (
    <div className="menu-page">
      {/* Hero */}
      <div className="menu-hero">
        <div className="menu-hero-bg" />
        <div className="menu-hero-content">
          <div className="menu-eyebrow">✦ Est. Kanhan · Since 1996 ✦</div>
          <h1 className="menu-hero-title">Bikaner <span>Branch</span></h1>
          <div className="table-chip"><span>🪑</span> Table {tableNo}</div>
        </div>
      </div>

      {/* Search bar */}
      <div className="menu-search-bar">
        <div className="menu-search-wrap">
          <span className="menu-search-icon">🔍</span>
          <input
            className="menu-search-input"
            placeholder={`Search ${totalItems} dishes…`}
            value={search}
            onChange={e => { setSearch(e.target.value); setActiveCat("all"); }}
          />
          {search && (
            <button className="menu-search-clear" onClick={() => setSearch("")}>✕</button>
          )}
        </div>
        {searchResultCount !== null && (
          <div className="menu-search-count">
            {searchResultCount} result{searchResultCount !== 1 ? "s" : ""} for "{search}"
          </div>
        )}
      </div>

      {/* Category Nav */}
      {!search && (
        <nav className="cat-nav" ref={catNavRef}>
          {categories.map(cat => {
            const count = cat.id === "all" ? allItems.length : allItems.filter(i => i.category === cat.id).length;
            return (
              <button
                key={cat.id}
                data-cat={cat.id}
                className={`cat-pill ${activeCat === cat.id ? "active" : ""}`}
                onClick={() => handleCatClick(cat.id)}
              >
                <span>{cat.emoji}</span>
                {cat.label}
                <span className="cat-pill-count">{count}</span>
              </button>
            );
          })}
        </nav>
      )}

      {/* Menu Sections */}
      <div className="menu-sections">
        {Object.keys(grouped).length === 0 ? (
          <div className="menu-no-results">
            <div className="menu-no-results-icon">🔍</div>
            <p>No dishes found for "<strong>{search}</strong>"</p>
            <button className="btn btn-secondary" style={{marginTop:"12px",padding:"8px 20px"}} onClick={() => setSearch("")}>Clear search</button>
          </div>
        ) : (
          Object.values(grouped).map(group => (
            <section key={group.id} id={`section-${group.id}`} className="menu-section">
              <div className="section-title-row">
                <span className="section-emoji">{group.emoji}</span>
                <h2 className="section-title">{group.label}</h2>
                <span className="section-count">{group.items.length}</span>
              </div>
              <div className="menu-grid">
                {group.items.map(item => (
                  <MenuCard key={item.id} item={item} />
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      <div style={{ height: "120px" }} />

      <OrderFAB onClick={() => setSheetOpen(true)} />
      <OrderSheet tableNo={tableNo} open={sheetOpen} onClose={() => setSheetOpen(false)} />
    </div>
  );
}
