import { useState } from "react";
import { supabase } from "../lib/supabase";
import { Search, Package, Truck, CheckCircle } from "lucide-react";

export default function TrackOrder() {
  const [orderId, setOrderId] = useState("");
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleTrack = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setOrder(null);

    // UUID validation (basic)
    if (orderId.length < 20) {
      setError(
        "Please enter a valid Order ID (e.g. from your confirmation email)."
      );
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("orders")
      .select("*")
      .eq("id", orderId)
      .single();

    if (error || !data) {
      setError("Order not found. Please check your Order ID.");
    } else {
      setOrder(data);
    }
    setLoading(false);
  };

  return (
    <div
      className="container"
      style={{ padding: "80px 24px", maxWidth: "600px", minHeight: "60vh" }}
    >
      <h1
        style={{
          textAlign: "center",
          marginBottom: "40px",
          color: "var(--medical-navy)",
        }}
      >
        Track Your Order
      </h1>

      <form
        onSubmit={handleTrack}
        style={{ display: "flex", gap: "10px", marginBottom: "40px" }}
      >
        <input
          placeholder="Enter Order ID"
          value={orderId}
          onChange={(e) => setOrderId(e.target.value)}
          style={{
            flex: 1,
            padding: "14px",
            borderRadius: "8px",
            border: "1px solid #cbd5e1",
            fontSize: "1rem",
          }}
        />
        <button
          disabled={loading}
          style={{
            background: "var(--primary)",
            color: "white",
            border: "none",
            padding: "0 24px",
            borderRadius: "8px",
            fontWeight: "bold",
            cursor: "pointer",
          }}
        >
          {loading ? "..." : "Track"}
        </button>
      </form>

      {error && (
        <div
          style={{
            color: "#ef4444",
            textAlign: "center",
            background: "#fef2f2",
            padding: "15px",
            borderRadius: "8px",
          }}
        >
          {error}
        </div>
      )}

      {order && (
        <div
          style={{
            background: "white",
            padding: "30px",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
          }}
        >
          <div style={{ textAlign: "center", marginBottom: "20px" }}>
            <StatusIcon status={order.status} />
            <h2
              style={{
                textTransform: "capitalize",
                marginTop: "15px",
                color: "var(--medical-navy)",
              }}
            >
              {order.status}
            </h2>
            <p style={{ color: "#64748b" }}>
              Order placed on {new Date(order.created_at).toLocaleDateString()}
            </p>
          </div>

          {order.tracking_number && (
            <div
              style={{
                background: "#f8fafc",
                padding: "20px",
                borderRadius: "12px",
                textAlign: "center",
                marginTop: "20px",
              }}
            >
              <p style={{ marginBottom: "10px", fontWeight: "600" }}>
                AusPost Tracking Number:
              </p>
              <div
                style={{
                  fontSize: "1.2rem",
                  fontFamily: "monospace",
                  marginBottom: "15px",
                }}
              >
                {order.tracking_number}
              </div>
              <a
                href={`https://auspost.com.au/mypost/track/#/details/${order.tracking_number}`}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: "inline-block",
                  background: "#DC1928",
                  color: "white",
                  textDecoration: "none",
                  padding: "10px 20px",
                  borderRadius: "50px",
                  fontWeight: "bold",
                }}
              >
                Track on AusPost
              </a>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusIcon({ status }) {
  if (status === "delivered") return <CheckCircle size={64} color="#10b981" />;
  if (status === "shipped") return <Truck size={64} color="#3b82f6" />;
  return <Package size={64} color="#f59e0b" />;
}
