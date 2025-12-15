import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle, Download, Loader, Package } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useCart } from "../lib/CartContext";

export default function Success() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  // Clear cart on load
  const { cartItems, removeFromCart } = useCart();
  useEffect(() => {
    if (cartItems.length > 0) {
      cartItems.forEach((i) => removeFromCart(i.variantId));
    }
  }, []);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    async function fetchOrder() {
      try {
        const { data, error } = await supabase.functions.invoke("checkout", {
          body: { action: "retrieve", session_id: sessionId },
        });

        if (error) throw error;

        const session = data.session;
        setOrder(session);

        // Save order to DB if needed
        if (session) {
          await supabase.from("orders").upsert(
            {
              stripe_session_id: session.id,
              customer_email: session.customer_details?.email,
              customer_name: session.customer_details?.name,
              total_amount: session.amount_total / 100,
              status: "pending",
              shipping_address: session.shipping_details?.address,
              items: session.line_items?.data || [],
            },
            { onConflict: "stripe_session_id" }
          );
        }
      } catch (err) {
        console.error("Error fetching order:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchOrder();
  }, [sessionId]);

  if (loading) {
    return (
      <div
        className="container"
        style={{ padding: "100px 20px", textAlign: "center" }}
      >
        <Loader className="spin-anim" size={40} style={{ margin: "0 auto" }} />
        <p style={{ marginTop: "20px", color: "var(--text-muted)" }}>
          Loading order details...
        </p>
      </div>
    );
  }

  if (!order) {
    return (
      <div
        className="container"
        style={{ padding: "100px 20px", textAlign: "center" }}
      >
        <h1>Order not found</h1>
        <Link
          to="/"
          className="buy-btn"
          style={{ maxWidth: "200px", margin: "20px auto" }}
        >
          Return Home
        </Link>
      </div>
    );
  }

  // Calculate Shipping Cost from Stripe Data
  const shippingCost = order.total_details?.amount_shipping
    ? order.total_details.amount_shipping / 100
    : 0;

  return (
    <div
      className="container"
      style={{ padding: "80px 24px", maxWidth: "800px" }}
    >
      <div style={{ textAlign: "center", marginBottom: "50px" }}>
        <CheckCircle
          size={80}
          color="#10b981"
          style={{ margin: "0 auto 20px" }}
        />
        <h1 style={{ fontSize: "2.5rem", color: "var(--medical-navy)" }}>
          Order Confirmed!
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>
          Thank you, {order.customer_details?.name}. Your order has been
          received.
        </p>
        <div style={{ marginTop: "15px" }}>
          <Link
            to="/track"
            style={{
              color: "var(--primary)",
              fontWeight: "600",
              textDecoration: "underline",
            }}
          >
            Track your order status here
          </Link>
        </div>
      </div>

      <div
        style={{
          background: "white",
          padding: "30px",
          borderRadius: "16px",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #f1f5f9",
            paddingBottom: "20px",
            marginBottom: "20px",
          }}
        >
          <div>
            <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
              Order Number
            </span>
            <h3 style={{ margin: 0, color: "var(--medical-navy)" }}>
              #{order.payment_intent?.slice(-8).toUpperCase()}
            </h3>
          </div>
          {order.invoice_pdf || order.receipt_url ? (
            <a
              href={order.invoice_pdf || order.receipt_url}
              target="_blank"
              className="buy-btn"
              style={{
                width: "auto",
                padding: "10px 20px",
                fontSize: "0.9rem",
                display: "flex",
                gap: "8px",
              }}
            >
              <Download size={16} /> Receipt
            </a>
          ) : null}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {order.line_items?.data.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "12px" }}
              >
                <div
                  style={{
                    background: "#f8fafc",
                    padding: "10px",
                    borderRadius: "8px",
                  }}
                >
                  <Package size={20} color="#64748b" />
                </div>
                <div>
                  <div style={{ fontWeight: "600", color: "var(--text-main)" }}>
                    {item.description}
                  </div>
                  <div
                    style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}
                  >
                    Qty: {item.quantity}
                  </div>
                </div>
              </div>
              <div style={{ fontWeight: "600" }}>
                ${(item.amount_total / 100).toFixed(2)} AUD
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            borderTop: "1px solid #f1f5f9",
            paddingTop: "20px",
            marginTop: "20px",
          }}
        >
          {/* NEW: SHIPPING ROW */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "10px",
              color: "#64748b",
            }}
          >
            <span>Shipping</span>
            <span>${shippingCost.toFixed(2)} AUD</span>
          </div>

          {/* TOTAL ROW */}
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <span style={{ fontWeight: "600" }}>Total Paid</span>
            <span
              style={{
                fontSize: "1.5rem",
                fontWeight: "700",
                color: "var(--primary)",
              }}
            >
              ${(order.amount_total / 100).toFixed(2)} AUD
            </span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: "40px", textAlign: "center" }}>
        <Link
          to="/"
          style={{
            color: "var(--primary)",
            fontWeight: "600",
            textDecoration: "none",
          }}
        >
          Continue Shopping &rarr;
        </Link>
      </div>
    </div>
  );
}
