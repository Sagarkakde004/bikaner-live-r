import { useCart } from "../../context/CartContext";

export default function OrderFAB({ onClick }) {
  const { totalQty, totalPrice } = useCart();

  if (totalQty === 0) return null;

  return (
    <button className="order-fab" onClick={onClick}>
      <div className="fab-left">
        <span className="fab-icon">🛒</span>
        <span>Place Order</span>
        <span className="fab-badge">{totalQty}</span>
      </div>
      <span className="fab-price">₹{totalPrice}</span>
    </button>
  );
}
