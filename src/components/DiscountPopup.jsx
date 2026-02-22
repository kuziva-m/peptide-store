import { useState, useEffect } from "react";
import { X, Gift, ArrowRight, CheckCircle, Mail } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function DiscountPopup() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isTabVisible, setIsTabVisible] = useState(false);

  const [step, setStep] = useState("form");
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ name: "", email: "" });
  const [errorMessage, setErrorMessage] = useState(""); // New state for error messages

  useEffect(() => {
    // Only check if they have "seen" it to decide whether to auto-open
    // We NO LONGER check if they "unlocked" it, so it always shows the form.
    const hasSeen = localStorage.getItem("discount_popup_seen");

    if (!hasSeen) {
      const timer = setTimeout(() => {
        setIsModalOpen(true);
      }, 4000);
      return () => clearTimeout(timer);
    } else {
      setIsTabVisible(true);
    }
  }, []);

  const handleClose = () => {
    setIsModalOpen(false);
    setTimeout(() => setIsTabVisible(true), 300);
    localStorage.setItem("discount_popup_seen", "true");
    // Reset form when closing so it's ready for a new email next time
    setTimeout(() => {
      setStep("form");
      setErrorMessage("");
      setFormData({ name: "", email: "" });
    }, 500);
  };

  const handleOpen = () => {
    setIsTabVisible(false);
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      // 1. Try to add subscriber to Supabase
      const { error: dbError } = await supabase
        .from("subscribers")
        .insert([formData]);

      // 2. CHECK FOR DUPLICATES (Error 23505 is PostgreSQL unique violation)
      if (dbError) {
        if (dbError.code === "23505") {
          setErrorMessage("This email has already received a discount code.");
          setLoading(false);
          return; // STOP HERE
        } else {
          throw dbError;
        }
      }

      // 3. Send Email (Only if new subscriber)
      const { error: emailError } = await supabase.functions.invoke(
        "send-discount",
        {
          body: { name: formData.name, email: formData.email },
        }
      );
      if (emailError) console.error("Email error:", emailError);

      // 4. Success
      setStep("success");
      // We still mark it as seen, but we don't block them from trying again later
      localStorage.setItem("discount_popup_seen", "true");
    } catch (err) {
      console.error(err);
      setErrorMessage("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* --- SIDE TAB (Moved to LEFT) --- */}
      <button
        className={`discount-tab ${isTabVisible ? "visible" : ""}`}
        onClick={handleOpen}
        style={sideTabStyle}
      >
        <div style={iconCircleStyle}>
          <Gift size={18} color="white" />
        </div>
        <span
          style={{
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            fontSize: "0.85rem",
            fontWeight: 700,
            letterSpacing: "1px",
          }}
        >
          10% OFF
        </span>
      </button>

      {/* --- MODAL --- */}
      {isModalOpen && (
        <>
          <div onClick={handleClose} style={backdropStyle} />
          <div style={modalStyle}>
            <button onClick={handleClose} style={closeBtnStyle}>
              <X size={20} />
            </button>

            {/* Left Image Side */}
            <div className="popup-image-side" style={imageSideStyle}>
              <div style={overlayStyle}></div>
              <div style={contentSideStyle}>
                <div style={giftIconContainerStyle}>
                  <Gift size={32} color="#fbbf24" />
                </div>
                <h2 style={headingStyle}>Unlock 10% Off</h2>
                <p style={{ fontSize: "1.1rem", opacity: 0.9 }}>
                  Join our exclusive community for member-only purity reports
                  and special offers.
                </p>
              </div>
            </div>

            {/* Right Form Side */}
            <div style={formContainerStyle}>
              {step === "form" ? (
                <form onSubmit={handleSubmit}>
                  <h3 style={formHeaderStyle}>Get your code</h3>
                  <p style={{ color: "#64748b", marginBottom: "20px" }}>
                    Enter your details to receive the discount code via email.
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

                    {errorMessage && (
                      <div
                        style={{
                          color: "#ef4444",
                          fontSize: "0.9rem",
                          background: "#fef2f2",
                          padding: "10px",
                          borderRadius: "6px",
                          border: "1px solid #fecaca",
                        }}
                      >
                        {errorMessage}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      style={buttonStyle}
                    >
                      {loading ? "Checking..." : "Unlock Discount"}{" "}
                      <ArrowRight size={18} />
                    </button>
                  </div>
                  <p style={privacyTextStyle}>
                    We respect your privacy. No spam.
                  </p>
                </form>
              ) : (
                <div
                  style={{ textAlign: "center", animation: "fadeIn 0.5s ease" }}
                >
                  <div
                    style={{
                      background: "#dcfce7",
                      width: 80,
                      height: 80,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 20px",
                    }}
                  >
                    <Mail size={40} color="#15803d" />
                  </div>
                  <h3 style={formHeaderStyle}>Check Your Email!</h3>
                  <p
                    style={{
                      color: "#64748b",
                      marginBottom: "30px",
                      lineHeight: "1.6",
                    }}
                  >
                    We've sent your 10% OFF code to{" "}
                    <strong>{formData.email}</strong>.<br />
                    Please check your inbox (and spam folder) to grab it.
                  </p>

                  <button onClick={handleClose} style={secondaryButtonStyle}>
                    Close & Continue Shopping
                  </button>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      <style>{`
        /* Side Tab Animation */
        .discount-tab {
            transform: translateX(-100%); /* Hidden (off-screen LEFT) */
            transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .discount-tab.visible {
            transform: translateX(0); /* Slides in */
        }
        .discount-tab:hover {
            padding-left: 20px !important; /* Peek out more on hover */
        }

        /* Mobile Adjustments */
        @media (max-width: 768px) { 
          .popup-image-side { display: none !important; } 
          /* On mobile, ensure it doesn't overlap bottom nav */
          .discount-tab { bottom: 120px !important; }
        }
        
        @keyframes slideUp { 
          from { opacity: 0; transform: translate(-50%, -40%); } 
          to { opacity: 1; transform: translate(-50%, -50%); } 
        }
      `}</style>
    </>
  );
}

// --- STYLES ---

// SIDE TAB STYLE (Moved to LEFT)
const sideTabStyle = {
  position: "fixed",
  bottom: "100px",
  left: "0", // Changed from right to left
  backgroundColor: "#0f172a",
  color: "white",
  border: "none",
  borderRadius: "0 12px 12px 0", // Rounded on the RIGHT side now
  padding: "12px 14px 12px 10px",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: "8px",
  cursor: "pointer",
  boxShadow: "4px 4px 15px rgba(0,0,0,0.15)", // Shadow direction flipped
  zIndex: 9998,
};

const iconCircleStyle = {
  width: "28px",
  height: "28px",
  borderRadius: "50%",
  backgroundColor: "rgba(255,255,255,0.2)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  marginBottom: "4px",
};

// ... (Rest of the modal styles remain standard)
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

const overlayStyle = {
  position: "absolute",
  inset: 0,
  background: "rgba(15, 23, 42, 0.85)",
};

const contentSideStyle = {
  position: "relative",
  zIndex: 1,
  padding: "40px",
  height: "100%",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  color: "white",
};

const giftIconContainerStyle = {
  background: "rgba(255,255,255,0.1)",
  width: "fit-content",
  padding: "12px",
  borderRadius: "12px",
  marginBottom: "20px",
};

const headingStyle = {
  fontSize: "2.5rem",
  lineHeight: "1.1",
  marginBottom: "15px",
  color: "white",
};

const formContainerStyle = {
  flex: 1,
  padding: "50px",
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  minWidth: "300px",
};

const formHeaderStyle = {
  fontSize: "1.8rem",
  color: "#0f172a",
  marginBottom: "10px",
  marginTop: 0,
};

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

const secondaryButtonStyle = {
  ...buttonStyle,
  background: "white",
  border: "1px solid #e2e8f0",
  color: "#0f172a",
  marginTop: "20px",
};

const privacyTextStyle = {
  fontSize: "0.8rem",
  color: "#94a3b8",
  marginTop: "20px",
  textAlign: "center",
};
