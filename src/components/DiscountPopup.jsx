import { useState, useEffect } from "react";
import { X, Gift, ArrowRight, Copy, CheckCircle } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function DiscountPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [step, setStep] = useState("form"); // 'form' | 'success'
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "" });

  useEffect(() => {
    // Check if user has already seen/closed this
    const hasSeenPopup = localStorage.getItem("discount_popup_seen");

    if (!hasSeenPopup) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 4000); // Show after 4 seconds
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    // Don't show again for this session (or set a date for 30 days)
    localStorage.setItem("discount_popup_seen", "true");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Save to Supabase
      const { error } = await supabase.from("subscribers").insert([formData]);

      // Ignore duplicate email errors (just show success anyway so user isn't frustrated)
      if (error && error.code !== "23505") throw error;

      setStep("success");
      // Mark as seen permanently since they subscribed
      localStorage.setItem("discount_popup_seen", "true");
    } catch (err) {
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText("PRIME10");
    alert("Code copied to clipboard!");
  };

  if (!isVisible) return null;

  return (
    <>
      {/* 1. BACKDROP OVERLAY */}
      <div
        onClick={handleClose}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          width: "100%",
          height: "100%",
          backgroundColor: "rgba(15, 23, 42, 0.6)", // Dark Navy transparent
          backdropFilter: "blur(4px)",
          zIndex: 99999,
          animation: "fadeIn 0.5s ease",
        }}
      />

      {/* 2. THE GIANT POPUP */}
      <div
        style={{
          position: "fixed",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "90%",
          maxWidth: "850px",
          backgroundColor: "white",
          borderRadius: "20px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          zIndex: 100000,
          display: "flex",
          overflow: "hidden",
          animation: "slideUp 0.5s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      >
        {/* CLOSE BUTTON */}
        <button
          onClick={handleClose}
          style={{
            position: "absolute",
            top: "20px",
            right: "20px",
            background: "white",
            border: "none",
            borderRadius: "50%",
            width: "36px",
            height: "36px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
            color: "#64748b",
          }}
        >
          <X size={20} />
        </button>

        {/* LEFT SIDE: IMAGE / VISUAL */}
        <div
          style={{
            flex: 1,
            backgroundColor: "#0f172a", // var(--medical-navy)
            backgroundImage: "url('/hero-banner.jpeg')", // Reusing your hero image
            backgroundSize: "cover",
            backgroundPosition: "center",
            position: "relative",
            display: "none", // Hidden on mobile
            minHeight: "400px",
          }}
        >
          {/* Overlay to darken image */}
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(15, 23, 42, 0.7)",
            }}
          ></div>

          <div
            style={{
              position: "relative",
              zIndex: 1,
              padding: "40px",
              height: "100%",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              color: "white",
            }}
          >
            <div
              style={{
                background: "rgba(255,255,255,0.1)",
                width: "fit-content",
                padding: "12px",
                borderRadius: "12px",
                marginBottom: "20px",
              }}
            >
              <Gift size={32} color="#fbbf24" />
            </div>
            <h2
              style={{
                fontSize: "2.5rem",
                lineHeight: "1.1",
                marginBottom: "15px",
                color: "white",
              }}
            >
              Unlock 10% Off Your First Order
            </h2>
            <p style={{ fontSize: "1.1rem", opacity: 0.9 }}>
              Join our exclusive research community and get access to
              member-only purity reports and discounts.
            </p>
          </div>
        </div>

        {/* RIGHT SIDE: CONTENT */}
        <div
          style={{
            flex: 1,
            padding: "50px",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            minWidth: "300px",
          }}
        >
          {step === "form" ? (
            <form onSubmit={handleSubmit}>
              <h3
                style={{
                  fontSize: "1.8rem",
                  color: "#0f172a",
                  marginBottom: "10px",
                }}
              >
                Get your discount code
              </h3>
              <p style={{ color: "#64748b", marginBottom: "30px" }}>
                Enter your details below to reveal your coupon.
              </p>

              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "15px",
                }}
              >
                <input
                  required
                  type="text"
                  placeholder="First Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  style={inputStyle}
                />
                <input
                  required
                  type="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  style={inputStyle}
                />
                <button type="submit" disabled={loading} style={buttonStyle}>
                  {loading ? "Processing..." : "Unlock Discount"}{" "}
                  <ArrowRight size={18} />
                </button>
              </div>
              <p
                style={{
                  fontSize: "0.8rem",
                  color: "#94a3b8",
                  marginTop: "20px",
                  textAlign: "center",
                }}
              >
                We respect your privacy. No spam, strictly science.
              </p>
            </form>
          ) : (
            <div style={{ textAlign: "center", animation: "fadeIn 0.5s ease" }}>
              <CheckCircle
                size={60}
                color="#10b981"
                style={{ margin: "0 auto 20px" }}
              />
              <h3
                style={{
                  fontSize: "1.8rem",
                  color: "#0f172a",
                  marginBottom: "10px",
                }}
              >
                You're In!
              </h3>
              <p style={{ color: "#64748b", marginBottom: "30px" }}>
                Here is your exclusive discount code:
              </p>

              <div
                onClick={copyCode}
                style={{
                  background: "#f1f5f9",
                  padding: "20px",
                  borderRadius: "12px",
                  border: "2px dashed #0f172a",
                  cursor: "pointer",
                  position: "relative",
                  marginBottom: "20px",
                }}
              >
                <span
                  style={{
                    fontSize: "2rem",
                    fontWeight: "800",
                    color: "#0f172a",
                    letterSpacing: "2px",
                  }}
                >
                  PRIME10
                </span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    fontSize: "0.9rem",
                    color: "#4635de",
                    marginTop: "10px",
                    fontWeight: "600",
                  }}
                >
                  <Copy size={14} /> Click to Copy
                </div>
              </div>

              <button
                onClick={handleClose}
                style={{
                  ...buttonStyle,
                  background: "none",
                  border: "1px solid #e2e8f0",
                  color: "#64748b",
                }}
              >
                Continue Shopping
              </button>
            </div>
          )}
        </div>
      </div>

      {/* --- CSS FOR MOBILE & ANIMATION --- */}
      <style>{`
        @media (min-width: 768px) {
          .announcement-bar { display: flex !important; } 
          div[style*="background-image"] { display: flex !important; }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translate(-50%, -40%); }
          to { opacity: 1; transform: translate(-50%, -50%); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
      `}</style>
    </>
  );
}

// STYLES
const inputStyle = {
  width: "100%",
  padding: "16px",
  borderRadius: "8px",
  border: "1px solid #e2e8f0",
  fontSize: "1rem",
  outline: "none",
  transition: "border-color 0.2s",
};

const buttonStyle = {
  width: "100%",
  padding: "16px",
  borderRadius: "8px",
  border: "none",
  backgroundColor: "#0f172a",
  color: "white",
  fontSize: "1rem",
  fontWeight: "600",
  cursor: "pointer",
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  gap: "10px",
  transition: "opacity 0.2s",
};
