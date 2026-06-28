import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";
import { VegDot } from "../ui";

const BANNER_COLORS = {
  starters: "linear-gradient(135deg, #2d1200, #7a2e00)",
  main:     "linear-gradient(135deg, #1a0a00, #6b2500)",
  biryani:  "linear-gradient(135deg, #1a1000, #5a3800)",
  breads:   "linear-gradient(135deg, #0a0800, #3d2800)",
  desserts: "linear-gradient(135deg, #1a0010, #6b0040)",
  drinks:   "linear-gradient(135deg, #001020, #003060)",
  default:  "linear-gradient(135deg, #0a0a0a, #2a2a2a)",
};

const TAG_CONFIG = {
  popular: { label: "⭐ Popular", cls: "tag-popular" },
  spicy:   { label: "🌶 Spicy",  cls: "tag-spicy"   },
  veg:     { label: "Pure Veg",  cls: "tag-veg"      },
};

export default function MenuCard({ item }) {
  const { cart, addItem, removeItem } = useCart();
  const { showToast } = useToast();
  const qty = cart[item.id]?.qty || 0;
  const bg  = BANNER_COLORS[item.category] || BANNER_COLORS.default;

  const handleAdd    = () => { addItem(item); showToast(`${item.emoji} ${item.name} added`); };
  const handleRemove = () => removeItem(item.id);

  return (
    <div className={`menu-card ${qty > 0 ? "in-cart" : ""}`}>
      {/* Banner */}
      <div className="menu-card-banner" style={{ background: bg }}>
        <span className="menu-card-emoji">{item.emoji}</span>
        {item.tags?.includes("popular") && <span className="popular-ribbon">Popular</span>}
        {item.isCustom && <span className="custom-tag">Today</span>}
        <div className="banner-overlay" />
        {qty > 0 && <div className="banner-qty-chip">{qty} in cart</div>}
      </div>

      {/* Body */}
      <div className="menu-card-body">
        <div className="menu-card-header">
          <VegDot veg={item.veg} />
          <div className="menu-card-name">{item.name}</div>
          <div className="menu-card-price">₹{item.price}</div>
        </div>

        <p className="menu-card-desc">{item.desc}</p>

        <div className="menu-card-tags">
          {(item.tags || []).filter(t => TAG_CONFIG[t]).map(t => (
            <span key={t} className={`tag ${TAG_CONFIG[t].cls}`}>{TAG_CONFIG[t].label}</span>
          ))}
        </div>

        <div className="menu-card-footer">
          {qty === 0 ? (
            <button className="add-btn" onClick={handleAdd}>
              <span className="add-btn-plus">+</span> Add
            </button>
          ) : (
            <div className="stepper">
              <button className="step-btn" onClick={handleRemove} aria-label="Remove one">−</button>
              <span className="step-count">{qty}</span>
              <button className="step-btn step-add" onClick={handleAdd} aria-label="Add one">+</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
