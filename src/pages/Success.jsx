import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  CheckCircle,
  Download,
  Loader,
  Package,
  AlertCircle,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { useCart } from "../lib/CartContext";

export default function Success() {
  const [searchParams] = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState(null);

  // Clear cart on load
  const { cartItems, removeFromCart } = useCart();
  useEffect(() => {
    if (cartItems && cartItems.length > 0) {
      cartItems.forEach((i) => removeFromCart(i.id, i.variant));
    }
  }, []);

  useEffect(() => {
    if (!sessionId) {
      setLoading(false);
      return;
    }

    async function fetchOrder() {
      try {
        // STRATEGY 1: Try the Edge Function (Standard Way)
        const { data, error } = await supabase.functions.invoke("checkout", {
          body: { action: "retrieve", session_id: sessionId },
        });

        if (!error && data?.session) {
          setOrder(data.session);
          return; // Success!
        }

        console.warn(
          "Edge function failed/timed out. Trying fallback...",
          error
        );

        // STRATEGY 2: Fallback - Fetch directly from Database
        // (Useful if the edge function created the order but timed out sending email)
        const { data: dbOrder, error: dbError } = await supabase
          .from("orders")
          .select("*")
          .eq("stripe_session_id", sessionId)
          .single();

        if (dbOrder) {
          // Normalize DB data to match Stripe Session structure for the UI
          setOrder({
            payment_intent: dbOrder.id, // Use DB ID as fallback
            amount_total: Math.round(dbOrder.total_amount * 100), // DB is dollars, UI expects cents
            total_details: {
              amount_shipping: Math.round((dbOrder.shipping_cost || 0) * 100),
            },
            customer_details: {
              name: dbOrder.customer_name,
              email: dbOrder.customer_email,
            },
            line_items: {
              data: Array.isArray(dbOrder.items)
                ? dbOrder.items.map((item) => ({
                    id: item.name, // pseudo-id
                    description: item.name,
                    quantity: item.quantity,
                    amount_total:
                      (item.total || item.unit_price * item.quantity) * 100,
                  }))
                : [],
            },
            receipt_url: null, // Won't have stripe receipt URL in fallback mode
          });
        } else {
          throw new Error("Order could not be verified.");
        }
      } catch (err) {
        console.error("Critical Error fetching order:", err);
        setErrorMsg(
          "We received your payment, but the confirmation details are loading slowly."
        );
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
        <Loader
          className="spin-anim"
          size={40}
          style={{ margin: "0 auto", color: "var(--primary)" }}
        />
        <h3 style={{ marginTop: "20px", color: "var(--medical-navy)" }}>
          Verifying Payment...
        </h3>
        <p style={{ color: "var(--text-muted)" }}>
          Please do not refresh the page.
        </p>
      </div>
    );
  }

  // Fallback UI if order is still null but we know payment likely worked
  if (!order) {
    return (
      <div
        className="container"
        style={{
          padding: "100px 20px",
          textAlign: "center",
          maxWidth: "600px",
        }}
      >
        <AlertCircle
          size={60}
          color="#f59e0b"
          style={{ margin: "0 auto 20px" }}
        />
        <h1 style={{ color: "var(--medical-navy)" }}>Payment Received</h1>
        <p
          style={{
            fontSize: "1.1rem",
            color: "var(--text-main)",
            margin: "20px 0",
          }}
        >
          Your order was successful, but we are taking a moment to generate your
          receipt. Please check your email{" "}
          <strong>{order?.customer_details?.email}</strong> for confirmation.
        </p>
        <div
          style={{
            background: "#f8fafc",
            padding: "15px",
            borderRadius: "8px",
            fontSize: "0.9rem",
            color: "#64748b",
          }}
        >
          Reference: {sessionId.slice(-8)}
        </div>
        <Link
          to="/"
          className="buy-btn"
          style={{ maxWidth: "200px", margin: "30px auto" }}
        >
          Return Home
        </Link>
      </div>
    );
  }

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
            flexWrap: "wrap",
            gap: "10px",
          }}
        >
          <div>
            <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
              Order Reference
            </span>
            <h3
              style={{
                margin: 0,
                color: "var(--medical-navy)",
                fontSize: "1.1rem",
              }}
            >
              #
              {order.payment_intent
                ? order.payment_intent.slice(-8).toUpperCase()
                : sessionId.slice(-8)}
            </h3>
          </div>
          {order.receipt_url && (
            <a
              href={order.receipt_url}
              target="_blank"
              rel="noreferrer"
              className="buy-btn"
              style={{
                width: "auto",
                padding: "8px 16px",
                fontSize: "0.85rem",
                display: "flex",
                gap: "8px",
              }}
            >
              <Download size={16} /> Receipt
            </a>
          )}
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {order.line_items?.data.map((item, idx) => (
            <div
              key={idx}
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
