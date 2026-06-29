/**
 * Order Notification System
 *
 * TWO methods — both run on every new order:
 *
 * 1. WhatsApp (ZERO setup needed)
 *    Opens a wa.me link that pre-fills the order details.
 *    On a phone this opens WhatsApp directly.
 *    Set WHATSAPP_NUMBER below to your 10-digit number.
 *
 * 2. Email via EmailJS (optional, 200 free emails/month)
 *    Sign up at emailjs.com, fill in the 3 IDs below.
 */

const WHATSAPP_NUMBER = "918767518026"; // Country code + number, no +

// ── EmailJS (optional) ──────────────────────────────────────────────
const EMAILJS_SERVICE_ID = "service_bikaner"; // from emailjs.com
const EMAILJS_TEMPLATE_ID = "template_order"; // from emailjs.com
const EMAILJS_PUBLIC_KEY = "YOUR_PUBLIC_KEY"; // from emailjs.com
const NOTIFY_EMAIL = "sagarkakade033@gmail.com";
// ───────────────────────────────────────────────────────────────────

export async function sendOrderNotification(order) {
  // Always attempt WhatsApp (stores the link in session for staff to open)
  sendWhatsAppNotification(order);

  // Email if configured
  if (EMAILJS_PUBLIC_KEY !== "YOUR_PUBLIC_KEY") {
    sendEmailNotification(order).catch((e) =>
      console.warn("[Notify] Email failed:", e),
    );
  }
}

function sendWhatsAppNotification(order) {
  try {
    const lines = [
      `🔔 *NEW ORDER — Table ${order.tableNo}*`,
      `👤 ${order.customerName} · 📞 ${order.customerPhone}`,
      ``,
      `*Items:*`,
      ...(order.items || []).map(
        (i) => `  ${i.emoji} ${i.name} ×${i.qty}  ₹${i.subtotal}`,
      ),
      ``,
      `💰 *Total: ₹${order.total}*`,
      order.note ? `📝 Note: ${order.note}` : null,
      `⏰ ${new Date(order.placedAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}`,
    ]
      .filter(Boolean)
      .join("\n");

    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(lines)}`;

    // Store in sessionStorage — admin/kitchen can open it
    try {
      const pending = JSON.parse(
        sessionStorage.getItem("wa_notifications") || "[]",
      );
      pending.push({ url, time: Date.now(), table: order.tableNo });
      sessionStorage.setItem(
        "wa_notifications",
        JSON.stringify(pending.slice(-20)),
      );
    } catch (_) {}

    // On mobile devices, auto-open (best-effort)
    if (/Mobi|Android/i.test(navigator.userAgent)) {
      window.open(url, "_blank", "noopener");
    }
  } catch (e) {
    console.warn("[Notify] WhatsApp notification failed:", e);
  }
}

async function sendEmailNotification(order) {
  const emailjs = await import("@emailjs/browser");
  await emailjs.send(
    EMAILJS_SERVICE_ID,
    EMAILJS_TEMPLATE_ID,
    {
      to_email: NOTIFY_EMAIL,
      customer_name: order.customerName,
      customer_phone: order.customerPhone,
      table_no: order.tableNo,
      items: (order.items || [])
        .map((i) => `${i.emoji} ${i.name} ×${i.qty} = ₹${i.subtotal}`)
        .join("\n"),
      total: `₹${order.total}`,
      note: order.note || "—",
      placed_at: new Date(order.placedAt).toLocaleString("en-IN"),
    },
    EMAILJS_PUBLIC_KEY,
  );
}
