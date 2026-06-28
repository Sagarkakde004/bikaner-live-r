import { useState } from "react";
import { useCart } from "../../context/CartContext";
import { useToast } from "../../context/ToastContext";
import { db } from "../../utils/firebase";
import { ref, push } from "firebase/database";
import { sendOrderNotification } from "../../utils/notify";

export default function OrderSheet({ tableNo, open, onClose }) {
  const { items, totalPrice, totalQty, addItem, removeItem, clearCart } = useCart();
  const { showToast } = useToast();
  const [name, setName]   = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote]   = useState("");
  const [errors, setErrors] = useState({});
  const [placing, setPlacing] = useState(false);
  const [placed, setPlaced]   = useState(null); // { orderId, total }

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = "Please enter your name";
    if (!/^\d{10}$/.test(phone.trim())) e.phone = "Enter 10-digit mobile number";
    setErrors(e);
    return !Object.keys(e).length;
  };

  const placeOrder = async () => {
    if (!validate()) return;
    setPlacing(true);
    try {
      const order = {
        tableNo,
        customerName:  name.trim(),
        customerPhone: phone.trim(),
        items: items.map(i => ({
          name: i.name, emoji: i.emoji,
          qty: i.qty, price: i.price, subtotal: i.price * i.qty,
        })),
        total:    totalPrice,
        note:     note.trim(),
        status:   "new",
        placedAt: new Date().toISOString(),
      };

      const newRef = await push(ref(db, "orders"), order);
      sendOrderNotification({ ...order, orderId: newRef.key });

      setPlaced({ orderId: newRef.key?.slice(-6).toUpperCase(), total: totalPrice });
      clearCart();
    } catch (err) {
      console.error(err);
      showToast("Could not place order. Please try again.", "error");
    } finally {
      setPlacing(false);
    }
  };

  const handleClose = () => {
    if (placed) {
      setPlaced(null);
      setName(""); setPhone(""); setNote(""); setErrors({});
    }
    onClose();
  };

  if (!open) return null;

  return (
    <>
      <div className="sheet-backdrop" onClick={handleClose} />
      <div className="order-sheet">
        <div className="sheet-drag" />

        {placed ? (
          /* ── Success state ── */
          <div className="sheet-success">
            <div className="success-icon">🎉</div>
            <h3>Order Placed!</h3>
            <div className="placed-order-id">Order #{placed.orderId}</div>
            <p>Your food is being prepared. We'll serve it at Table {tableNo} shortly.</p>
            <div className="placed-total">Total paid: ₹{placed.total}</div>
            <button className="btn btn-primary mt-16" style={{width:"100%"}} onClick={handleClose}>
              + Order More Items
            </button>
          </div>
        ) : (
          <>
            <div className="sheet-header">
              <h2>Your Order <span className="sheet-item-count">{totalQty} item{totalQty !== 1 ? "s" : ""}</span></h2>
              <button className="sheet-close" onClick={handleClose}>✕</button>
            </div>

            <div className="sheet-scroll">
              {/* Cart items with inline qty controls */}
              <div className="order-items">
                {items.map(item => (
                  <div key={item.id} className="order-row">
                    <span className="order-emoji">{item.emoji}</span>
                    <span className="order-name">{item.name}</span>
                    <div className="order-stepper">
                      <button className="order-step-btn" onClick={() => removeItem(item.id)}>−</button>
                      <span className="order-step-count">{item.qty}</span>
                      <button className="order-step-btn" onClick={() => addItem(item)}>+</button>
                    </div>
                    <span className="order-price">₹{item.price * item.qty}</span>
                  </div>
                ))}
                <div className="order-total-row">
                  <span>Total</span>
                  <span>₹{totalPrice}</span>
                </div>
              </div>

              {/* Customer details */}
              <div className="sheet-section">
                <div className="sheet-section-title">Your Details</div>
                <div className="sheet-fields">
                  <div className="field">
                    <label className="field-label">Name *</label>
                    <input
                      className={`field-input ${errors.name ? "field-error" : ""}`}
                      value={name}
                      onChange={e => { setName(e.target.value); setErrors(p => ({...p, name: ""})); }}
                      placeholder="e.g. Rahul"
                      maxLength={40}
                      autoComplete="given-name"
                    />
                    {errors.name && <span className="field-error-msg">{errors.name}</span>}
                  </div>
                  <div className="field">
                    <label className="field-label">Mobile *</label>
                    <input
                      className={`field-input ${errors.phone ? "field-error" : ""}`}
                      value={phone}
                      onChange={e => { setPhone(e.target.value.replace(/\D/g, "")); setErrors(p => ({...p, phone: ""})); }}
                      placeholder="9876543210"
                      maxLength={10}
                      inputMode="numeric"
                      autoComplete="tel"
                    />
                    {errors.phone && <span className="field-error-msg">{errors.phone}</span>}
                  </div>
                </div>
                <div className="field mt-10">
                  <label className="field-label">Special Instructions</label>
                  <textarea
                    className="field-input"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    rows={2}
                    placeholder="Allergies, less spice, extra sauce…"
                  />
                </div>
              </div>
            </div>

            <div className="sheet-foot">
              <button
                className="btn btn-primary w-full"
                onClick={placeOrder}
                disabled={placing || items.length === 0}
              >
                {placing
                  ? <><span className="btn-spinner" /> Placing order…</>
                  : `Confirm Order · ₹${totalPrice}`}
              </button>
            </div>
          </>
        )}
      </div>
    </>
  );
}
