import { Truck, Clock, CheckCircle, AlertCircle } from "lucide-react";
import SEO from "../components/SEO";

export default function Shipping() {
  // Since we are updating the policy to a static one provided by the user,
  // we will render the static content directly instead of fetching from DB.

  return (
    <div
      className="container"
      style={{ padding: "80px 24px", maxWidth: "900px" }}
    >
      <SEO title="Shipping & Returns" />
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

      {/* 1. KEY HIGHLIGHTS GRID */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
          gap: "20px",
          marginBottom: "50px",
        }}
      >
        {/* Card 1: Standard */}
        <div style={cardStyle}>
          <div
            style={{
              ...iconCircleStyle,
              background: "#ede9fe", // Very light purple
            }}
          >
            <Truck size={28} color="var(--primary)" />
          </div>
          <h3 style={cardTitleStyle}>Standard Shipping</h3>
          <p style={{ ...cardValueStyle, color: "var(--primary)" }}>
            $9.99 AUD
          </p>
          <p style={cardSubStyle}>Flat Rate</p>
        </div>

        {/* Card 2: Free Express */}
        <div style={cardStyle}>
          <div
            style={{
              ...iconCircleStyle,
              background: "#ccfbf1", // Light teal
            }}
          >
            <CheckCircle size={28} color="var(--clinical-teal)" />
          </div>
          <h3 style={cardTitleStyle}>Free Express</h3>
          <p style={{ ...cardValueStyle, color: "var(--clinical-teal)" }}>
            Over $150
          </p>
          <p style={cardSubStyle}>Order Value</p>
        </div>

        {/* Card 3: Express Speed */}
        <div style={cardStyle}>
          <div
            style={{
              ...iconCircleStyle,
              background: "#f1f5f9", // Light grey/slate
            }}
          >
            <Clock size={28} color="var(--medical-navy)" />
          </div>
          <h3 style={cardTitleStyle}>Express Speed</h3>
          <p style={{ ...cardValueStyle, color: "var(--medical-navy)" }}>
            1-3 Days
          </p>
          <p style={cardSubStyle}>Metro Areas</p>
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
        {/* SHIPPING POLICY */}
        <h2 style={sectionHeaderStyle}>Shipping Policy</h2>

        <h4 style={subHeaderStyle}>Order Processing & Dispatch</h4>
        <ul style={listStyle}>
          <li>
            All orders are dispatched within 24 hours (business days only).
          </li>
          <li>
            Orders placed on weekends or public holidays are processed on the
            next business day.
          </li>
          <li>
            Once dispatched, you will receive confirmation and tracking details.
          </li>
        </ul>

        <h4 style={subHeaderStyle}>Shipping Locations</h4>
        <ul style={listStyle}>
          <li>We ship within Australia only.</li>
          <li>
            International shipping is not available due to regulatory
            restrictions on research compounds.
          </li>
        </ul>

        <h4 style={subHeaderStyle}>Shipping Rates</h4>
        <ul style={listStyle}>
          <li>
            <strong>Free Express Shipping</strong> on all orders over $150 AUD.
          </li>
          <li>
            <strong>Flat Rate Shipping:</strong> $9.99 AUD Australia-wide for
            orders under $150 AUD.
          </li>
        </ul>

        <h4 style={subHeaderStyle}>Delivery Timeframes (Estimates)</h4>
        <ul style={listStyle}>
          <li>
            <strong>Express Shipping (Metro):</strong> 1–3 business days.
          </li>
          <li>
            Delivery times are estimates only and may vary depending on courier
            performance, location, or seasonal demand.
          </li>
        </ul>

        <h4 style={subHeaderStyle}>Packaging & Handling</h4>
        <ul style={listStyle}>
          <li>All products are packed in secure, tamper-evident packaging.</li>
          <li>
            Orders are handled according to best practices for transporting
            research compounds to maintain product integrity.
          </li>
        </ul>

        <h4 style={subHeaderStyle}>Delays or Lost Shipments</h4>
        <p>
          While most orders arrive on time, delays may occasionally occur. If
          your order is delayed or missing:
        </p>
        <ul style={listStyle}>
          <li>Check your tracking details.</li>
          <li>
            Contact us if your parcel has not arrived after 7 business days.
          </li>
          <li>
            If a shipment is confirmed lost by the courier, we will offer a
            replacement or refund, subject to product availability.
          </li>
        </ul>

        <h4 style={subHeaderStyle}>Incorrect Shipping Information</h4>
        <p>
          Please ensure your shipping details are correct at checkout. Melbourne
          Peptides is not responsible for parcels delivered to incorrect
          addresses provided by the customer.
        </p>

        {/* RETURNS POLICY */}
        <h2 style={{ ...sectionHeaderStyle, marginTop: "40px" }}>
          Returns & Refunds Policy
        </h2>
        <div
          style={{
            background: "#f8fafc",
            padding: "20px",
            borderRadius: "8px",
            marginBottom: "20px",
          }}
        >
          <p style={{ margin: 0, fontStyle: "italic", color: "#64748b" }}>
            Due to the sensitive nature of research compounds, we maintain a
            strict returns policy.
          </p>
        </div>

        <h4 style={subHeaderStyle}>Returns</h4>
        <p>
          Returns and exchanges are <strong>not accepted</strong> once an order
          has been dispatched.
        </p>

        <h4 style={subHeaderStyle}>Refunds</h4>
        <p>Refunds will only be considered in the following circumstances:</p>
        <ul style={listStyle}>
          <li>You received an incorrect item.</li>
          <li>
            Your order arrived damaged or defective (photo evidence required).
          </li>
          <li>
            All issues must be reported within 48 hours of delivery. Claims made
            after this period may not be eligible for review.
          </li>
        </ul>

        <h4 style={subHeaderStyle}>Non-Refundable Situations</h4>
        <p>Refunds will not be issued for:</p>
        <ul style={listStyle}>
          <li>Change of mind.</li>
          <li>Incorrect use of products.</li>
          <li>Incorrect shipping details provided by the customer.</li>
          <li>Delays caused by courier services beyond our control.</li>
        </ul>

        {/* CONTACT US */}
        <div
          style={{
            marginTop: "40px",
            borderTop: "1px solid #f1f5f9",
            paddingTop: "20px",
          }}
        >
          <h3 style={{ fontSize: "1.2rem", color: "var(--medical-navy)" }}>
            Contact Us
          </h3>
          <p>
            For questions regarding shipping, returns, or delivery issues,
            please contact us via Instagram: <strong>@melbournepeptides</strong>
          </p>
          <p>We aim to respond within 1–2 business days.</p>
        </div>

        {/* DISCLAIMER */}
        <div
          style={{
            marginTop: "30px",
            padding: "20px",
            background: "#fff1f2",
            borderRadius: "12px",
            border: "1px solid #fda4af",
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
                color: "#be123c",
                fontSize: "1.1rem",
              }}
            >
              Disclaimer
            </h4>
            <p
              style={{
                margin: 0,
                fontSize: "0.95rem",
                color: "#881337",
                lineHeight: "1.6",
              }}
            >
              All products sold by Melbourne Peptides are intended strictly for
              laboratory and research use only. They are not therapeutic goods
              and are not intended for human or veterinary consumption. By
              purchasing from our store, you confirm that you are a qualified
              researcher or are acting on behalf of a licensed research entity
              and agree to comply with all applicable laws.
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

const sectionHeaderStyle = {
  marginTop: 0,
  marginBottom: "20px",
  fontSize: "1.8rem",
  color: "var(--medical-navy)",
  borderBottom: "1px solid #f1f5f9",
  paddingBottom: "15px",
};

const subHeaderStyle = {
  fontSize: "1.1rem",
  color: "var(--text-dark)",
  marginTop: "20px",
  marginBottom: "10px",
};

const listStyle = {
  paddingLeft: "20px",
  marginBottom: "15px",
  color: "#475569",
};
