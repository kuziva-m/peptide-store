import { useState, useEffect } from "react";
import { X, Gift, ArrowRight, CheckCircle, Mail, Copy } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function DiscountPopup() {
  const [isVisible, setIsVisible] = useState(false);
  const [step, setStep] = useState("form");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "" });

  useEffect(() => {
    const hasSeen = localStorage.getItem("discount_popup_seen");
    if (!hasSeen) {
      const timer = setTimeout(() => {
        setIsVisible(true);
      }, 4000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem("discount_popup_seen", "true");
  };

  const handleOpen = () => {
    setIsVisible(true);
    if (localStorage.getItem("discount_unlocked") === "true") {
      setStep("success");
    } else {
      setStep("form");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error: dbError } = await supabase
        .from("subscribers")
        .insert([formData]);
      if (dbError && dbError.code !== "23505") throw dbError;

      const { error: emailError } = await supabase.functions.invoke(
        "send-discount",
        {
          body: { name: formData.name, email: formData.email },
        }
      );
      if (emailError) console.error("Email error:", emailError);

      setStep("success");
      localStorage.setItem("discount_popup_seen", "true");
      localStorage.setItem("discount_unlocked", "true");
    } catch (err) {
      console.error(err);
      alert("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    navigator.clipboard.writeText("WELCOME10");
    alert("Code copied to clipboard!");
  };

  if (!isVisible) {
    return (
      <button onClick={handleOpen} style={floatingBtnStyle}>
        <Gift size={18} color="#fbbf24" /> Get Welcome Discount
      </button>
    );
  }

  return (
    <>
      <div onClick={handleClose} style={backdropStyle} />
      <div style={modalStyle}>
        <button onClick={handleClose} style={closeBtnStyle}>
          <X size={20} />
        </button>

        <div className="popup-image-side" style={imageSideStyle}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(15, 23, 42, 0.75)",
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
              Unlock Discount
            </h2>
            <p style={{ fontSize: "1.1rem", opacity: 0.9 }}>
              Join our exclusive community for member-only purity reports and
              special offers.
            </p>
          </div>
        </div>

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
                  marginTop: 0,
                }}
              >
                Get your code
              </h3>
              <p style={{ color: "#64748b", marginBottom: "30px" }}>
                Enter your details to receive your discount.
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
                  {loading ? "Sending..." : "Unlock Discount"}{" "}
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
                We respect your privacy. No spam.
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
                  WELCOME10
                </span>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    fontSize: "0.9rem",
                    color: "#4f46e5",
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
                Close & Continue Shopping
              </button>
            </div>
          )}
        </div>
      </div>
      <style>{`@media (max-width: 768px) { .popup-image-side { display: none !important; } } @keyframes slideUp { from { opacity: 0; transform: translate(-50%, -40%); } to { opacity: 1; transform: translate(-50%, -50%); } } @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }`}</style>
    </>
  );
}

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
const floatingBtnStyle = {
  position: "fixed",
  bottom: "24px",
  left: "24px",
  backgroundColor: "#0f172a",
  color: "white",
  padding: "12px 20px",
  borderRadius: "50px",
  border: "1px solid rgba(255,255,255,0.1)",
  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  display: "flex",
  alignItems: "center",
  gap: "10px",
  cursor: "pointer",
  zIndex: 9990,
  fontWeight: "600",
  fontSize: "0.9rem",
  transition: "transform 0.2s, box-shadow 0.2s",
  animation: "fadeIn 0.5s ease",
};
const backdropStyle = {
  position: "fixed",
  top: 0,
  left: 0,
  width: "100%",
  height: "100%",
  backgroundColor: "rgba(15, 23, 42, 0.6)",
  backdropFilter: "blur(4px)",
  zIndex: 99999,
  animation: "fadeIn 0.3s ease",
};
const modalStyle = {
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
  animation: "slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
};
const closeBtnStyle = {
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
  zIndex: 10,
};
const imageSideStyle = {
  flex: 1,
  backgroundColor: "#0f172a",
  backgroundImage: "url('/hero-banner.jpeg')",
  backgroundSize: "cover",
  backgroundPosition: "center",
  position: "relative",
  minHeight: "400px",
};
