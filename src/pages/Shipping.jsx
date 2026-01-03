import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { Truck, Clock, CheckCircle, AlertCircle } from "lucide-react";

export default function Shipping() {
  const [policyText, setPolicyText] = useState("");

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "shipping_policy")
      .single()
      .then(({ data }) => {
        if (data && data.value && data.value.text) {
          setPolicyText(data.value.text);
        }
      });
  }, []);

  return (
    <div
      className="container"
      style={{ padding: "80px 24px", maxWidth: "900px" }}
    >
      <h1
        style={{
          fontSize: "2.5rem",
          marginBottom: "50px",
          color: "var(--medical-navy)",
          textAlign: "center",
        }}
      >
        Shipping & Returns
      </h1>

      {/* 1. KEY HIGHLIGHTS GRID (Updated Colors) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
          marginBottom: "50px",
        }}
      >
        {/* Card 1: Flat Rate (Primary Purple) */}
        <div style={cardStyle}>
          <div
            style={{
              ...iconCircleStyle,
              background: "#ede9fe", // Very light purple
            }}
          >
            <Truck size={28} color="var(--primary)" />
          </div>
          <h3 style={cardTitleStyle}>Flat Rate Shipping</h3>
          <p style={{ ...cardValueStyle, color: "var(--primary)" }}>
            $9.99 AUD
          </p>
          <p style={cardSubStyle}>Australia Wide</p>
        </div>

        {/* Card 2: Free Shipping (Clinical Teal) */}
        <div style={cardStyle}>
          <div
            style={{
              ...iconCircleStyle,
              background: "#ccfbf1", // Light teal
            }}
          >
            <CheckCircle size={28} color="var(--clinical-teal)" />
          </div>
          <h3 style={cardTitleStyle}>Free Shipping</h3>
          <p style={{ ...cardValueStyle, color: "var(--clinical-teal)" }}>
            Over $150
          </p>
          <p style={cardSubStyle}>Order Value</p>
        </div>

        {/* Card 3: Speed (Medical Navy) */}
        <div style={cardStyle}>
          <div
            style={{
              ...iconCircleStyle,
              background: "#f1f5f9", // Light grey/slate
            }}
          >
            <Clock size={28} color="var(--medical-navy)" />
          </div>
          <h3 style={cardTitleStyle}>Express Delivery</h3>
          <p style={{ ...cardValueStyle, color: "var(--medical-navy)" }}>
            24hr Dispatch
          </p>
          <p style={cardSubStyle}>1-3 Days Delivery Time</p>
        </div>
      </div>

      {/* 2. DETAILED POLICY SECTION */}
      <div
        style={{
          background: "white",
          padding: "40px",
          borderRadius: "16px",
          border: "1px solid var(--border)",
          lineHeight: "1.8",
          color: "var(--text-main)",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <h3
          style={{
            marginTop: 0,
            marginBottom: "20px",
            fontSize: "1.5rem",
            color: "var(--medical-navy)",
            borderBottom: "1px solid #f1f5f9",
            paddingBottom: "15px",
          }}
        >
          Shipping Policy
        </h3>
        <p style={{ whiteSpace: "pre-wrap", color: "#475569" }}>
          {policyText ||
            "We process all orders within 24 hours of payment confirmation to ensure the fastest possible turnaround. All shipments are sent via our express courier network to ensure delivery within 1-3 business days, depending on your location in Australia. You will receive a tracking number via email immediately upon dispatch."}
        </p>

        {/* 3. RETURNS ALERT (Refined Red) */}
        <div
          style={{
            marginTop: "40px",
            padding: "25px",
            background: "#fff1f2",
            borderRadius: "12px",
            border: "1px solid #fda4af", // Softer border
            display: "flex",
            gap: "15px",
            alignItems: "flex-start",
          }}
        >
          <AlertCircle
            color="#be123c"
            size={24}
            style={{ flexShrink: 0, marginTop: "2px" }}
          />
          <div>
            <h4
              style={{
                margin: "0 0 8px 0",
                color: "#be123c", // Dark Rose
                fontSize: "1.1rem",
              }}
            >
              Return Policy
            </h4>
            <p
              style={{
                margin: 0,
                fontSize: "0.95rem",
                color: "#881337", // Deep Rose Text
                lineHeight: "1.6",
              }}
            >
              Due to the sensitive nature of research chemicals and to ensure
              the highest standards of purity for all our clients,{" "}
              <strong>we cannot accept returns</strong> once the product has
              left our facility.
              <br />
              <br />
              If you believe there is a quality issue with your order, please
              contact us immediately with your batch number, and we will review
              the certificate of analysis.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Shared Styles
const cardStyle = {
  background: "white",
  padding: "30px 20px",
  borderRadius: "16px",
  border: "1px solid #e2e8f0",
  textAlign: "center",
  boxShadow: "0 2px 4px rgba(0,0,0,0.02)",
};

const iconCircleStyle = {
  width: "60px",
  height: "60px",
  borderRadius: "50%",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto 20px",
};

const cardTitleStyle = {
  margin: "0 0 8px",
  color: "var(--medical-navy)",
  fontSize: "1.1rem",
};

const cardValueStyle = {
  fontSize: "1.8rem",
  fontWeight: "800",
  margin: "0",
};

const cardSubStyle = {
  color: "#64748b",
  fontSize: "0.9rem",
  margin: "8px 0 0",
  fontWeight: "500",
};
