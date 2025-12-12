import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Truck, AlertCircle } from "lucide-react";

export default function Shipping() {
  const [policy, setPolicy] = useState(null);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "shipping_policy")
      .single()
      .then(({ data }) => {
        if (data) setPolicy(data.value);
      });
  }, []);

  if (!policy)
    return (
      <div className="container" style={{ padding: "80px" }}>
        Loading...
      </div>
    );

  return (
    <div
      className="container"
      style={{ padding: "80px 24px", maxWidth: "800px" }}
    >
      <h1
        style={{
          fontSize: "2.5rem",
          marginBottom: "40px",
          color: "var(--medical-navy)",
        }}
      >
        Shipping & Returns
      </h1>

      <div
        style={{
          background: "white",
          padding: "30px",
          borderRadius: "16px",
          border: "1px solid var(--border)",
          marginBottom: "40px",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <h3 style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Truck className="text-teal" /> Shipping Rates
        </h3>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
            marginTop: "20px",
          }}
        >
          <div
            style={{
              background: "#f8fafc",
              padding: "20px",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "0.9rem",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "1px",
                fontWeight: "bold",
              }}
            >
              Standard
            </div>
            <div
              style={{
                fontSize: "2rem",
                fontWeight: "800",
                color: "var(--medical-navy)",
                margin: "10px 0",
              }}
            >
              ${policy.price_standard}
            </div>
            <div style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
              3-5 Business Days
            </div>
          </div>
          <div
            style={{
              background: "#f0fdfa",
              padding: "20px",
              borderRadius: "12px",
              border: "1px solid #ccfbf1",
              textAlign: "center",
            }}
          >
            <div
              style={{
                fontSize: "0.9rem",
                color: "#0d9488",
                textTransform: "uppercase",
                letterSpacing: "1px",
                fontWeight: "bold",
              }}
            >
              Express
            </div>
            <div
              style={{
                fontSize: "2rem",
                fontWeight: "800",
                color: "#0d9488",
                margin: "10px 0",
              }}
            >
              ${policy.price_express}
            </div>
            <div style={{ fontSize: "0.85rem", color: "#0f766e" }}>
              1-2 Business Days
            </div>
          </div>
        </div>
      </div>

      <div style={{ lineHeight: "1.8", color: "var(--text-main)" }}>
        <h3>Shipping Policy</h3>
        <p style={{ whiteSpace: "pre-wrap" }}>{policy.text}</p>

        <div
          style={{
            marginTop: "40px",
            padding: "20px",
            background: "#fff1f2",
            borderRadius: "12px",
            border: "1px solid #fecdd3",
            display: "flex",
            gap: "15px",
          }}
        >
          <AlertCircle color="#be123c" style={{ flexShrink: 0 }} />
          <div>
            <h4 style={{ margin: "0 0 8px 0", color: "#9f1239" }}>
              Return Policy
            </h4>
            <p style={{ margin: 0, fontSize: "0.95rem", color: "#881337" }}>
              Due to the nature of research chemicals,{" "}
              <strong>we cannot accept returns</strong> once the product has
              left our facility. If you believe there is a quality issue, please
              contact us with your batch number for a certificate of analysis
              review.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
