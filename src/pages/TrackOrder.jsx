import { useState } from "react";
import { Search, Package, ExternalLink, ArrowRight, Info } from "lucide-react";

export default function TrackOrder() {
  const [trackingNumber, setTrackingNumber] = useState("");

  const handleTrack = (e) => {
    e.preventDefault();
    if (!trackingNumber) return;

    // The Official Deep Link
    const ausPostUrl = `https://auspost.com.au/mypost/track/#/details/${trackingNumber.trim()}`;

    // 'noopener,noreferrer' hides that they came from your site
    // This sometimes reduces the "Verify Device" trigger frequency
    window.open(ausPostUrl, "_blank", "noopener,noreferrer");
  };

  return (
    <div
      className="container"
      style={{ padding: "80px 24px", maxWidth: "600px" }}
    >
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <div
          style={{
            background: "#f1f5f9",
            width: "80px",
            height: "80px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 20px",
          }}
        >
          <Package size={40} color="var(--medical-navy)" />
        </div>
        <h1 style={{ color: "var(--medical-navy)", marginBottom: "10px" }}>
          Track Your Order
        </h1>
        <p style={{ color: "var(--text-muted)" }}>
          Enter your tracking number to see real-time updates.
        </p>
      </div>

      <div
        style={{
          background: "white",
          padding: "40px",
          borderRadius: "16px",
          border: "1px solid #e2e8f0",
          boxShadow: "0 10px 30px -10px rgba(0,0,0,0.1)",
        }}
      >
        <form onSubmit={handleTrack}>
          <label
            style={{
              display: "block",
              marginBottom: "10px",
              fontWeight: "600",
              color: "#64748b",
            }}
          >
            Tracking Number
          </label>

          <div style={{ display: "flex", gap: "10px", marginBottom: "20px" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search
                size={20}
                style={{
                  position: "absolute",
                  left: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  color: "#94a3b8",
                }}
              />
              <input
                type="text"
                placeholder="e.g. 33L76..."
                value={trackingNumber}
                onChange={(e) => setTrackingNumber(e.target.value)}
                style={{
                  width: "100%",
                  padding: "14px 14px 14px 44px",
                  borderRadius: "8px",
                  border: "1px solid #cbd5e1",
                  fontSize: "1.1rem",
                  outline: "none",
                  fontWeight: "500",
                }}
              />
            </div>
          </div>

          <button
            type="submit"
            className="buy-btn"
            style={{
              width: "100%",
              padding: "16px",
              fontSize: "1.1rem",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              gap: "10px",
            }}
          >
            Track Shipment <ExternalLink size={18} />
          </button>
        </form>

        {/* Helpful Tip for the Issue */}
        <div
          style={{
            marginTop: "25px",
            display: "flex",
            gap: "12px",
            background: "#fffbeb",
            padding: "16px",
            borderRadius: "8px",
            border: "1px solid #fcd34d",
          }}
        >
          <Info
            size={20}
            color="#b45309"
            style={{ flexShrink: 0, marginTop: "2px" }}
          />
          <div>
            <h4
              style={{
                margin: "0 0 4px 0",
                color: "#92400e",
                fontSize: "0.95rem",
              }}
            >
              First time tracking?
            </h4>
            <p
              style={{
                margin: 0,
                fontSize: "0.85rem",
                color: "#b45309",
                lineHeight: "1.5",
              }}
            >
              Australia Post may ask you to verify your device for security. If
              the tracking number disappears during this check, simply click
              "Track Shipment" again.
            </p>
          </div>
        </div>

        <div
          style={{
            marginTop: "20px",
            padding: "20px",
            background: "#f8fafc",
            borderRadius: "8px",
            border: "1px dashed #cbd5e1",
          }}
        >
          <h4
            style={{
              margin: "0 0 10px 0",
              color: "var(--medical-navy)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <ArrowRight size={16} /> How it works
          </h4>
          <p
            style={{
              margin: 0,
              fontSize: "0.9rem",
              color: "#64748b",
              lineHeight: "1.6",
            }}
          >
            Clicking "Track Shipment" will open the official Australia Post
            portal in a new secure tab.
          </p>
        </div>
      </div>
    </div>
  );
}
