import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import imageCompression from "browser-image-compression";
import {
  TrendingUp,
  DollarSign,
  Package,
  LogOut,
  Lock,
  Tag,
  User,
  TestTube,
  Star,
  Sparkles,
  Beaker,
  Microscope,
  Activity,
  Zap,
  Banknote,
  X,
  CheckCircle,
  Settings,
  Camera,
  Save,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import SEO from "../components/SEO";

export default function CreatorStudio() {
  // Login State
  const [code, setCode] = useState("");
  const [pin, setPin] = useState("");
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [error, setError] = useState(null);

  // Dashboard State
  const [affiliate, setAffiliate] = useState(null);
  const [orders, setOrders] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [activeView, setActiveView] = useState("dashboard"); // "dashboard" | "profile"

  // Profile Form State
  const [profileData, setProfileData] = useState({
    bank_account_name: "",
    bank_bsb: "",
    bank_account_number: "",
    new_pin: "",
    confirm_pin: "",
  });

  const [selectedImageFile, setSelectedImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);

  const [isSavingImage, setIsSavingImage] = useState(false);
  const [isSavingPin, setIsSavingPin] = useState(false);
  const [isSavingPayment, setIsSavingPayment] = useState(false);

  const [profileMessage, setProfileMessage] = useState({ type: "", text: "" });

  // Payout State
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [isSubmittingPayout, setIsSubmittingPayout] = useState(false);
  const [payoutSuccess, setPayoutSuccess] = useState(false);

  // Animation States
  const [playIntro, setPlayIntro] = useState(false);
  const [isAnimating, setIsAnimating] = useState(true);
  const [mountOverlay, setMountOverlay] = useState(true);

  // Check for saved session on load
  useEffect(() => {
    const savedCode = localStorage.getItem("creator_code");
    const savedPin = localStorage.getItem("creator_pin");
    if (savedCode && savedPin) {
      handleLogin(savedCode, savedPin);
    }
  }, []);

  // Handle Animation Timers when playIntro is triggered
  useEffect(() => {
    if (playIntro) {
      const exitTimer = setTimeout(() => {
        setIsAnimating(false);
      }, 500);

      const unmountTimer = setTimeout(() => {
        setMountOverlay(false);
      }, 900);

      return () => {
        clearTimeout(exitTimer);
        clearTimeout(unmountTimer);
      };
    }
  }, [playIntro]);

  const handleLogin = async (loginCode = code, loginPin = pin) => {
    setIsLoggingIn(true);
    setError(null);

    try {
      const { data: affiliateData, error: affiliateError } = await supabase
        .from("affiliates")
        .select("*")
        .ilike("discount_code", loginCode.trim())
        .eq("pin", loginPin.trim())
        .single();

      if (affiliateError || !affiliateData) {
        throw new Error("Invalid discount code or PIN.");
      }

      setAffiliate(affiliateData);

      // Pre-fill profile data
      setProfileData({
        bank_account_name: affiliateData.bank_account_name || "",
        bank_bsb: affiliateData.bank_bsb || "",
        bank_account_number: affiliateData.bank_account_number || "",
        new_pin: "",
        confirm_pin: "",
      });

      localStorage.setItem("creator_code", loginCode.trim());
      localStorage.setItem("creator_pin", loginPin.trim());

      setIsLoadingData(true);
      const { data: ordersData, error: ordersError } = await supabase
        .from("orders")
        .select("created_at, customer_name, total_amount")
        .ilike("discount_code", loginCode.trim())
        .order("created_at", { ascending: false });

      if (!ordersError && ordersData) {
        setOrders(ordersData);
      }

      setPlayIntro(true);
    } catch (err) {
      setError(err.message);
      localStorage.removeItem("creator_code");
      localStorage.removeItem("creator_pin");
    } finally {
      setIsLoggingIn(false);
      setIsLoadingData(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("creator_code");
    localStorage.removeItem("creator_pin");
    setAffiliate(null);
    setOrders([]);
    setCode("");
    setPin("");
    setActiveView("dashboard");
    setPlayIntro(false);
    setIsAnimating(true);
    setMountOverlay(true);
  };

  const totalSales = orders.reduce(
    (sum, order) => sum + Number(order.total_amount || 0),
    0,
  );
  const totalEarnings = totalSales * Number(affiliate?.commission_rate || 0);
  const commissionPercentage = (
    Number(affiliate?.commission_rate || 0) * 100
  ).toFixed(0);

  const formatName = (fullName) => {
    if (!fullName) return "Guest";
    const parts = fullName.trim().split(" ");
    if (parts.length > 1) {
      return `${parts[0]} ${parts[parts.length - 1][0]}.`;
    }
    return parts[0];
  };

  // ==========================================
  // PROFILE LOGIC (ISOLATED ACTIONS)
  // ==========================================
  const showMessage = (type, text) => {
    setProfileMessage({ type, text });
    setTimeout(() => setProfileMessage({ type: "", text: "" }), 5000);
  };

  const handleImageSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSaveImage = async () => {
    if (!selectedImageFile) return;

    setIsSavingImage(true);
    setProfileMessage({ type: "", text: "" });

    try {
      const options = {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 800,
        useWebWorker: true,
      };
      const compressedFile = await imageCompression(selectedImageFile, options);
      const fileExt = compressedFile.name.split(".").pop();
      const fileName = `avatar_${affiliate.id}_${Math.random().toString(36).substring(7)}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("product-images")
        .upload(fileName, compressedFile);

      if (uploadError) throw uploadError;

      const { data } = supabase.storage
        .from("product-images")
        .getPublicUrl(fileName);

      const { error: dbError } = await supabase
        .from("affiliates")
        .update({ profile_image_url: data.publicUrl })
        .eq("id", affiliate.id);

      if (dbError) throw dbError;

      setAffiliate({ ...affiliate, profile_image_url: data.publicUrl });
      setSelectedImageFile(null);
      showMessage("success", "Profile picture saved successfully!");
    } catch (err) {
      console.error(err);
      showMessage("error", "Failed to upload image. Please try again.");
    } finally {
      setIsSavingImage(false);
    }
  };

  const handleSavePin = async () => {
    setProfileMessage({ type: "", text: "" });

    if (profileData.new_pin !== profileData.confirm_pin) {
      showMessage("error", "PINs do not match. Please try again.");
      return;
    }

    if (profileData.new_pin.length < 4) {
      showMessage("error", "PIN must be at least 4 characters long.");
      return;
    }

    setIsSavingPin(true);

    const { error } = await supabase
      .from("affiliates")
      .update({ pin: profileData.new_pin.trim() })
      .eq("id", affiliate.id);

    setIsSavingPin(false);

    if (error) {
      showMessage("error", "Failed to save new PIN.");
    } else {
      setAffiliate({ ...affiliate, pin: profileData.new_pin.trim() });
      localStorage.setItem("creator_pin", profileData.new_pin.trim());
      setProfileData((prev) => ({ ...prev, new_pin: "", confirm_pin: "" }));
      showMessage("success", "Access PIN changed successfully!");
    }
  };

  const handleSavePayment = async () => {
    setIsSavingPayment(true);
    setProfileMessage({ type: "", text: "" });

    const updates = {
      bank_account_name: profileData.bank_account_name,
      bank_bsb: profileData.bank_bsb,
      bank_account_number: profileData.bank_account_number,
    };

    const { error } = await supabase
      .from("affiliates")
      .update(updates)
      .eq("id", affiliate.id);

    setIsSavingPayment(false);

    if (error) {
      showMessage("error", "Failed to save payment details.");
    } else {
      setAffiliate({ ...affiliate, ...updates });
      showMessage("success", "Payment details saved successfully!");
    }
  };

  // ==========================================
  // PAYOUT LOGIC
  // ==========================================
  const isProfileComplete =
    affiliate?.bank_account_name &&
    affiliate?.bank_bsb &&
    affiliate?.bank_account_number;

  const handleRequestPayout = async () => {
    setIsSubmittingPayout(true);

    const { error } = await supabase.functions.invoke("send-email", {
      body: {
        to: "info@melbournepeptides.com.au",
        subject: `Payout Request: ${affiliate.name} (${affiliate.discount_code})`,
        html: `
          <div style="font-family: sans-serif; color: #0f172a;">
            <h2 style="margin-bottom: 20px;">New Creator Payout Request</h2>
            <p><strong>Creator Name:</strong> ${affiliate.name}</p>
            <p><strong>Discount Code:</strong> ${affiliate.discount_code}</p>
            <p><strong>Requested Amount:</strong> <span style="color: #10b981; font-weight: bold; font-size: 18px;">$${totalEarnings.toFixed(2)}</span></p>
            <br/>
            <h3 style="color: #475569; border-bottom: 1px solid #e2e8f0; padding-bottom: 8px;">Verified Banking Details</h3>
            <div style="background-color: #f8fafc; padding: 16px; border-radius: 8px; border: 1px solid #e2e8f0; font-family: monospace; font-size: 14px;">
              <p style="margin:0 0 5px 0;"><strong>Account Name:</strong> ${affiliate.bank_account_name}</p>
              <p style="margin:0 0 5px 0;"><strong>BSB:</strong> ${affiliate.bank_bsb}</p>
              <p style="margin:0;"><strong>Account Number:</strong> ${affiliate.bank_account_number}</p>
            </div>
            <br/>
            <p style="color: #64748b; font-size: 14px;">Please process this payment via your banking portal within 48 hours.</p>
          </div>
        `,
      },
    });

    setIsSubmittingPayout(false);

    if (error) {
      alert(
        "Failed to send request. Please check your connection and try again.",
      );
    } else {
      setPayoutSuccess(true);
      setTimeout(() => {
        setShowPayoutModal(false);
        setPayoutSuccess(false);
      }, 5000);
    }
  };

  // ==========================================
  // RENDER SPLIT-SCREEN LOGIN VIEW
  // ==========================================
  if (!affiliate) {
    return (
      <div className="login-split-container">
        <SEO
          title="Creator Studio Login"
          description="Partner dashboard for Melbourne Peptides creators."
        />

        <div className="login-left gradient-bg-anim">
          <div className="fade-in-ui login-card">
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "24px",
              }}
            >
              <div
                style={{
                  width: "72px",
                  height: "72px",
                  background: "#f0f4ff",
                  borderRadius: "20px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "2px solid #e0e7ff",
                }}
              >
                <TrendingUp size={36} color="#4635de" />
              </div>
            </div>
            <h1
              style={{
                fontSize: "1.8rem",
                fontWeight: 800,
                textAlign: "center",
                color: "#0f172a",
                marginBottom: "8px",
                letterSpacing: "-0.5px",
              }}
            >
              Creator Studio
            </h1>
            <p
              style={{
                textAlign: "center",
                color: "#64748b",
                marginBottom: "32px",
                fontSize: "0.95rem",
              }}
            >
              Enter your partner details to access your portal.
            </p>

            {error && (
              <div
                style={{
                  background: "#fef2f2",
                  color: "#ef4444",
                  padding: "12px",
                  borderRadius: "12px",
                  fontSize: "0.9rem",
                  textAlign: "center",
                  marginBottom: "24px",
                  border: "1px solid #fecaca",
                  fontWeight: 600,
                }}
              >
                {error}
              </div>
            )}

            <div
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: "#334155",
                    marginBottom: "8px",
                  }}
                >
                  Discount Code
                </label>
                <div style={{ position: "relative" }}>
                  <Tag
                    style={{
                      position: "absolute",
                      left: "14px",
                      top: "12px",
                      color: "#94a3b8",
                    }}
                    size={18}
                  />
                  <input
                    type="text"
                    placeholder="e.g. SARAH15"
                    style={{
                      width: "100%",
                      padding: "12px 16px 12px 42px",
                      borderRadius: "12px",
                      border: "1px solid #cbd5e1",
                      fontSize: "1rem",
                      outline: "none",
                      textTransform: "uppercase",
                      transition: "border 0.2s",
                      boxSizing: "border-box",
                    }}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  />
                </div>
              </div>

              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    color: "#334155",
                    marginBottom: "8px",
                  }}
                >
                  Access PIN
                </label>
                <div style={{ position: "relative" }}>
                  <Lock
                    style={{
                      position: "absolute",
                      left: "14px",
                      top: "12px",
                      color: "#94a3b8",
                    }}
                    size={18}
                  />
                  <input
                    type="password"
                    placeholder="Enter your PIN"
                    style={{
                      width: "100%",
                      padding: "12px 16px 12px 42px",
                      borderRadius: "12px",
                      border: "1px solid #cbd5e1",
                      fontSize: "1rem",
                      outline: "none",
                      transition: "border 0.2s",
                      boxSizing: "border-box",
                    }}
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleLogin()}
                  />
                </div>
              </div>

              <button
                onClick={() => handleLogin()}
                disabled={isLoggingIn || !code || !pin}
                style={{
                  width: "100%",
                  background: "#4635de",
                  color: "white",
                  fontWeight: 800,
                  padding: "14px",
                  borderRadius: "12px",
                  border: "none",
                  cursor:
                    isLoggingIn || !code || !pin ? "not-allowed" : "pointer",
                  opacity: isLoggingIn || !code || !pin ? 0.7 : 1,
                  fontSize: "1rem",
                  marginTop: "8px",
                  transition: "background 0.2s",
                  boxShadow: "0 4px 12px rgba(70, 53, 222, 0.2)",
                }}
              >
                {isLoggingIn ? "Authenticating..." : "Access Dashboard"}
              </button>
            </div>
          </div>
        </div>

        <div
          className="login-right hide-on-mobile"
          style={{ position: "relative", flex: 1.2, height: "100%" }}
        >
          <img
            src="https://images.unsplash.com/photo-1598550880863-4e8aa3d0edb4?q=80&w=1400&auto=format&fit=crop"
            alt="Content Creator Studio Setup"
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              objectPosition: "center",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(to bottom right, rgba(15,23,42,0.4), rgba(70,53,222,0.7))",
            }}
          ></div>

          <div
            style={{
              position: "absolute",
              bottom: "60px",
              left: "60px",
              zIndex: 20,
            }}
          >
            <h3
              style={{
                color: "white",
                fontSize: "2.4rem",
                fontWeight: 900,
                margin: "0 0 12px 0",
                letterSpacing: "-1px",
                textShadow: "0 4px 12px rgba(0,0,0,0.5)",
              }}
            >
              Partner with Science
            </h3>
            <p
              style={{
                color: "rgba(255,255,255,0.9)",
                fontSize: "1.2rem",
                fontWeight: 500,
                margin: 0,
                textShadow: "0 2px 8px rgba(0,0,0,0.5)",
              }}
            >
              Premium research compounds. Elite creator tracking.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ==========================================
  // RENDER MAIN DASHBOARD
  // ==========================================
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f8fafc",
        paddingBottom: "80px",
      }}
    >
      <SEO
        title={`${affiliate.name}'s Studio`}
        description="Creator Studio Dashboard"
      />

      {/* --- THE HYPER-KINETIC INTRO ANIMATION OVERLAY --- */}
      {playIntro && mountOverlay && (
        <div
          className={`gradient-bg-anim ${isAnimating ? "slide-down-enter" : "fade-slide-up-exit"}`}
          style={styles.fullScreenOverlay}
        >
          <div style={styles.animationCenterBox}>
            <div className="icon-bounce-1" style={styles.absoluteIconZero}>
              <TestTube size={110} color="#ffffff" strokeWidth={1.5} />
            </div>
            <div className="icon-bounce-2" style={styles.absoluteIconZero}>
              <Beaker size={96} color="#e0f2fe" strokeWidth={1.5} />
            </div>
            <div className="icon-bounce-3" style={styles.absoluteIconZero}>
              <Sparkles size={84} color="#bae6fd" strokeWidth={1.5} />
            </div>
            <div className="icon-bounce-4" style={styles.absoluteIconZero}>
              <Microscope size={72} color="#7dd3fc" strokeWidth={1.5} />
            </div>
            <div className="icon-bounce-5" style={styles.absoluteIconZero}>
              <Activity size={60} color="#38bdf8" strokeWidth={2} />
            </div>
            <div className="icon-bounce-6" style={styles.absoluteIconZero}>
              <Star size={52} color="#0ea5e9" strokeWidth={2} />
            </div>
            <div className="icon-bounce-7" style={styles.absoluteIconZero}>
              <Zap size={44} color="#0284c7" strokeWidth={2.5} />
            </div>

            <div className="pulse-glow-intense" style={styles.mainLogoBox}>
              <img
                src="/logo.png"
                alt="Melbourne Peptides"
                style={{
                  width: "90px",
                  height: "90px",
                  objectFit: "contain",
                  zIndex: 10,
                }}
              />
            </div>

            <h2 className="fade-in-text" style={styles.animationText}>
              Creator Studio
            </h2>
            <p className="fade-in-text-delay" style={styles.animationSubtext}>
              Syncing partner data and analytics...
            </p>
          </div>
        </div>
      )}

      {/* --- PAYOUT MODAL OVERLAY --- */}
      {showPayoutModal && (
        <div style={styles.modalOverlay}>
          <div className="fade-in-ui" style={styles.modalContent}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "20px 24px",
                borderBottom: "1px solid #e2e8f0",
              }}
            >
              <h3
                style={{
                  margin: 0,
                  fontSize: "1.3rem",
                  color: "#0f172a",
                  fontWeight: 800,
                }}
              >
                Request Payout
              </h3>
              <button
                onClick={() => !isSubmittingPayout && setShowPayoutModal(false)}
                style={styles.closeBtn}
              >
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: "24px" }}>
              {payoutSuccess ? (
                <div
                  className="fade-in-text"
                  style={{ textAlign: "center", padding: "20px 10px 40px" }}
                >
                  <div
                    style={{
                      width: "70px",
                      height: "70px",
                      background: "#dcfce7",
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      margin: "0 auto 20px",
                    }}
                  >
                    <CheckCircle size={36} color="#16a34a" />
                  </div>
                  <h4
                    style={{
                      fontSize: "1.4rem",
                      color: "#0f172a",
                      margin: "0 0 12px 0",
                      fontWeight: 800,
                    }}
                  >
                    Request Sent Successfully!
                  </h4>
                  <p
                    style={{
                      color: "#64748b",
                      margin: 0,
                      lineHeight: "1.5",
                      fontSize: "1.05rem",
                    }}
                  >
                    Your payment will be processed via your saved bank details
                    within 48 hours.
                  </p>
                </div>
              ) : (
                <>
                  <div
                    style={{
                      background: "#f8fafc",
                      padding: "20px",
                      borderRadius: "12px",
                      marginBottom: "24px",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      border: "1px solid #e2e8f0",
                    }}
                  >
                    <span style={{ fontWeight: 700, color: "#64748b" }}>
                      Available Balance
                    </span>
                    <span
                      style={{
                        fontSize: "1.8rem",
                        fontWeight: 900,
                        color: "#0f172a",
                        letterSpacing: "-0.5px",
                      }}
                    >
                      ${totalEarnings.toFixed(2)}
                    </span>
                  </div>

                  {!isProfileComplete ? (
                    <div
                      style={{
                        background: "#fff7ed",
                        border: "1px solid #fdba74",
                        padding: "20px",
                        borderRadius: "12px",
                        textAlign: "center",
                        marginBottom: "24px",
                      }}
                    >
                      <AlertCircle
                        size={32}
                        color="#ea580c"
                        style={{ marginBottom: "10px" }}
                      />
                      <h4 style={{ margin: "0 0 8px 0", color: "#9a3412" }}>
                        Banking Details Required
                      </h4>
                      <p
                        style={{
                          fontSize: "0.9rem",
                          color: "#c2410c",
                          margin: "0 0 16px 0",
                        }}
                      >
                        You must complete your payment profile before requesting
                        a payout.
                      </p>
                      <button
                        onClick={() => {
                          setShowPayoutModal(false);
                          setActiveView("profile");
                        }}
                        style={{
                          background: "#ea580c",
                          color: "white",
                          border: "none",
                          padding: "10px 20px",
                          borderRadius: "8px",
                          fontWeight: "bold",
                          cursor: "pointer",
                        }}
                      >
                        Update Profile Now
                      </button>
                    </div>
                  ) : (
                    <>
                      <div style={{ marginBottom: "24px" }}>
                        <label
                          style={{
                            display: "block",
                            fontSize: "0.9rem",
                            fontWeight: 700,
                            color: "#334155",
                            marginBottom: "10px",
                          }}
                        >
                          Sending Payment To:
                        </label>
                        <div
                          style={{
                            background: "#f1f5f9",
                            padding: "16px",
                            borderRadius: "8px",
                            border: "1px solid #cbd5e1",
                          }}
                        >
                          <p
                            style={{
                              margin: "0 0 4px 0",
                              color: "#0f172a",
                              fontWeight: "600",
                            }}
                          >
                            {affiliate.bank_account_name}
                          </p>
                          <p
                            style={{
                              margin: "0 0 4px 0",
                              color: "#475569",
                              fontSize: "0.9rem",
                            }}
                          >
                            BSB: {affiliate.bank_bsb}
                          </p>
                          <p
                            style={{
                              margin: 0,
                              color: "#475569",
                              fontSize: "0.9rem",
                            }}
                          >
                            ACC: {affiliate.bank_account_number}
                          </p>
                        </div>
                        <button
                          onClick={() => {
                            setShowPayoutModal(false);
                            setActiveView("profile");
                          }}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#4635de",
                            fontSize: "0.8rem",
                            fontWeight: "bold",
                            marginTop: "8px",
                            cursor: "pointer",
                            padding: 0,
                          }}
                        >
                          Need to change these details?
                        </button>
                      </div>

                      <button
                        onClick={handleRequestPayout}
                        disabled={isSubmittingPayout || totalEarnings <= 0}
                        style={{
                          width: "100%",
                          background: "#4635de",
                          color: "white",
                          fontWeight: 800,
                          padding: "16px",
                          borderRadius: "12px",
                          border: "none",
                          cursor:
                            isSubmittingPayout || totalEarnings <= 0
                              ? "not-allowed"
                              : "pointer",
                          opacity:
                            isSubmittingPayout || totalEarnings <= 0 ? 0.7 : 1,
                          transition: "all 0.2s",
                          fontSize: "1.05rem",
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          gap: "8px",
                        }}
                      >
                        {isSubmittingPayout ? (
                          "Sending Request..."
                        ) : (
                          <>
                            <Banknote size={20} /> Confirm & Cash Out
                          </>
                        )}
                      </button>
                    </>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* FIXED HEADER */}
      <div
        style={{
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid #e2e8f0",
          position: "sticky",
          top: 0,
          zIndex: 50,
          padding: "16px 24px",
          boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
        }}
      >
        <div
          className="dashboard-header-inner"
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            {affiliate.profile_image_url ? (
              <img
                src={affiliate.profile_image_url}
                alt={affiliate.name}
                style={{
                  width: "48px",
                  height: "48px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "2px solid #e2e8f0",
                }}
              />
            ) : (
              <div
                style={{
                  width: "48px",
                  height: "48px",
                  background: "#4635de",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "white",
                  fontWeight: 800,
                  fontSize: "1.2rem",
                  boxShadow: "inset 0 2px 4px rgba(255,255,255,0.3)",
                }}
              >
                {affiliate.name.charAt(0)}
              </div>
            )}
            <div>
              <h1
                className="dashboard-title"
                style={{
                  margin: 0,
                  fontSize: "1.2rem",
                  fontWeight: 800,
                  color: "#0f172a",
                  lineHeight: "1.2",
                }}
              >
                Welcome, {affiliate.name}
              </h1>
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  background: "#f0f4ff",
                  color: "#4635de",
                  padding: "2px 8px",
                  borderRadius: "6px",
                  fontSize: "0.8rem",
                  fontWeight: 700,
                  marginTop: "4px",
                }}
              >
                <Tag size={12} /> Code: {affiliate.discount_code.toUpperCase()}{" "}
                ({commissionPercentage}%)
              </div>
            </div>
          </div>

          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <button
              onClick={() =>
                setActiveView(
                  activeView === "dashboard" ? "profile" : "dashboard",
                )
              }
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background:
                  activeView === "profile" ? "#e2e8f0" : "transparent",
                color: "#475569",
                border: "1px solid #cbd5e1",
                padding: "8px 16px",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "0.9rem",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              {activeView === "dashboard" ? (
                <>
                  <Settings size={16} />{" "}
                  <span className="hide-on-mobile">Settings</span>
                </>
              ) : (
                <>
                  <ArrowLeft size={16} /> Dashboard
                </>
              )}
            </button>

            <button
              onClick={handleLogout}
              className="logout-btn"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                background: "#f1f5f9",
                color: "#475569",
                border: "none",
                padding: "8px 16px",
                borderRadius: "8px",
                fontWeight: 600,
                fontSize: "0.9rem",
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <LogOut size={16} />{" "}
              <span className="hide-on-mobile">Logout</span>
            </button>
          </div>
        </div>
      </div>

      {/* --- CONTENT AREA (DASHBOARD OR PROFILE) --- */}
      <div
        className="dashboard-content-wrapper"
        style={{
          maxWidth: "1100px",
          margin: "40px auto 0",
          padding: "0 24px",
        }}
      >
        {activeView === "profile" ? (
          /* ========================================== */
          /* PROFILE SETTINGS VIEW                      */
          /* ========================================== */
          <div className="fade-in-ui">
            <h2
              style={{
                color: "#0f172a",
                marginBottom: "24px",
                fontSize: "1.8rem",
                fontWeight: "800",
              }}
            >
              Profile & Settings
            </h2>

            {profileMessage.text && (
              <div
                style={{
                  background:
                    profileMessage.type === "error" ? "#fef2f2" : "#f0fdf4",
                  color:
                    profileMessage.type === "error" ? "#ef4444" : "#16a34a",
                  border: `1px solid ${profileMessage.type === "error" ? "#fecaca" : "#bbf7d0"}`,
                  padding: "16px",
                  borderRadius: "12px",
                  marginBottom: "24px",
                  fontWeight: "bold",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                {profileMessage.type === "success" ? (
                  <CheckCircle size={18} />
                ) : (
                  <AlertCircle size={18} />
                )}
                {profileMessage.text}
              </div>
            )}

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr",
                gap: "24px",
                "@media(min-width: 768px)": { gridTemplateColumns: "1fr 1fr" },
              }}
            >
              {/* Photo & Security */}
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "24px",
                }}
              >
                <div
                  style={{
                    background: "white",
                    padding: "24px",
                    borderRadius: "16px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                  }}
                >
                  <h3
                    style={{
                      margin: "0 0 20px 0",
                      fontSize: "1.2rem",
                      color: "#0f172a",
                    }}
                  >
                    Profile Photo
                  </h3>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "20px",
                      flexWrap: "wrap",
                    }}
                  >
                    {imagePreview || affiliate.profile_image_url ? (
                      <img
                        src={imagePreview || affiliate.profile_image_url}
                        alt="Profile"
                        style={{
                          width: "80px",
                          height: "80px",
                          borderRadius: "50%",
                          objectFit: "cover",
                          border: "3px solid #f1f5f9",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "80px",
                          height: "80px",
                          background: "#f1f5f9",
                          borderRadius: "50%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "#94a3b8",
                        }}
                      >
                        <Camera size={32} />
                      </div>
                    )}
                    <div
                      style={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "8px",
                        alignItems: "flex-start",
                      }}
                    >
                      <label
                        style={{
                          background: "#f1f5f9",
                          color: "#0f172a",
                          padding: "8px 16px",
                          borderRadius: "8px",
                          fontWeight: "600",
                          fontSize: "0.9rem",
                          cursor: "pointer",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "8px",
                          border: "1px solid #e2e8f0",
                        }}
                      >
                        Select New Photo
                        <input
                          type="file"
                          hidden
                          accept="image/*"
                          onChange={handleImageSelect}
                        />
                      </label>
                      {selectedImageFile && (
                        <button
                          onClick={handleSaveImage}
                          disabled={isSavingImage}
                          style={{
                            background: "#16a34a",
                            color: "white",
                            padding: "8px 16px",
                            borderRadius: "8px",
                            border: "none",
                            fontWeight: "bold",
                            fontSize: "0.9rem",
                            cursor: isSavingImage ? "not-allowed" : "pointer",
                            opacity: isSavingImage ? 0.7 : 1,
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                          }}
                        >
                          {isSavingImage ? (
                            "Saving..."
                          ) : (
                            <>
                              <Save size={16} /> Save Profile Picture
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div
                  style={{
                    background: "white",
                    padding: "24px",
                    borderRadius: "16px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                  }}
                >
                  <h3
                    style={{
                      margin: "0 0 20px 0",
                      fontSize: "1.2rem",
                      color: "#0f172a",
                      display: "flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    <Lock size={20} /> Security Settings
                  </h3>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.9rem",
                        fontWeight: "600",
                        color: "#334155",
                        marginBottom: "8px",
                      }}
                    >
                      New 4-Digit PIN
                    </label>
                    <input
                      type="password"
                      placeholder="Enter new 4-digit PIN"
                      value={profileData.new_pin}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          new_pin: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        boxSizing: "border-box",
                        fontSize: "1rem",
                        marginBottom: "12px",
                      }}
                    />
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.9rem",
                        fontWeight: "600",
                        color: "#334155",
                        marginBottom: "8px",
                      }}
                    >
                      Confirm New PIN
                    </label>
                    <input
                      type="password"
                      placeholder="Confirm new 4-digit PIN"
                      value={profileData.confirm_pin}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          confirm_pin: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        boxSizing: "border-box",
                        fontSize: "1rem",
                      }}
                    />
                    <button
                      onClick={handleSavePin}
                      disabled={
                        isSavingPin ||
                        !profileData.new_pin ||
                        !profileData.confirm_pin
                      }
                      style={{
                        marginTop: "16px",
                        width: "100%",
                        background: "#0f172a",
                        color: "white",
                        padding: "12px",
                        borderRadius: "8px",
                        border: "none",
                        fontWeight: "bold",
                        fontSize: "0.95rem",
                        cursor:
                          isSavingPin ||
                          !profileData.new_pin ||
                          !profileData.confirm_pin
                            ? "not-allowed"
                            : "pointer",
                        opacity:
                          isSavingPin ||
                          !profileData.new_pin ||
                          !profileData.confirm_pin
                            ? 0.7
                            : 1,
                        display: "flex",
                        justifyContent: "center",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      {isSavingPin ? (
                        "Saving..."
                      ) : (
                        <>
                          <Save size={16} /> Save PIN
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>

              {/* Bank Details */}
              <div
                style={{
                  background: "white",
                  padding: "24px",
                  borderRadius: "16px",
                  border: "1px solid #e2e8f0",
                  boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
                }}
              >
                <h3
                  style={{
                    margin: "0 0 20px 0",
                    fontSize: "1.2rem",
                    color: "#0f172a",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Banknote size={20} /> Payment Details
                </h3>
                <p
                  style={{
                    fontSize: "0.9rem",
                    color: "#64748b",
                    margin: "0 0 20px 0",
                  }}
                >
                  We need your accurate banking details to process your
                  commission payouts.
                </p>

                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                  }}
                >
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.9rem",
                        fontWeight: "600",
                        color: "#334155",
                        marginBottom: "8px",
                      }}
                    >
                      Account Name (Full Name)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. John Smith"
                      value={profileData.bank_account_name}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          bank_account_name: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        boxSizing: "border-box",
                        fontSize: "1rem",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.9rem",
                        fontWeight: "600",
                        color: "#334155",
                        marginBottom: "8px",
                      }}
                    >
                      BSB Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 062-123"
                      value={profileData.bank_bsb}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          bank_bsb: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        boxSizing: "border-box",
                        fontSize: "1rem",
                      }}
                    />
                  </div>
                  <div>
                    <label
                      style={{
                        display: "block",
                        fontSize: "0.9rem",
                        fontWeight: "600",
                        color: "#334155",
                        marginBottom: "8px",
                      }}
                    >
                      Account Number
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 12345678"
                      value={profileData.bank_account_number}
                      onChange={(e) =>
                        setProfileData({
                          ...profileData,
                          bank_account_number: e.target.value,
                        })
                      }
                      style={{
                        width: "100%",
                        padding: "12px",
                        borderRadius: "8px",
                        border: "1px solid #cbd5e1",
                        boxSizing: "border-box",
                        fontSize: "1rem",
                      }}
                    />
                  </div>
                </div>

                <button
                  onClick={handleSavePayment}
                  disabled={isSavingPayment}
                  style={{
                    marginTop: "24px",
                    width: "100%",
                    background: "#4635de",
                    color: "white",
                    padding: "14px",
                    borderRadius: "8px",
                    border: "none",
                    fontWeight: "bold",
                    fontSize: "1rem",
                    cursor: isSavingPayment ? "not-allowed" : "pointer",
                    opacity: isSavingPayment ? 0.7 : 1,
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  {isSavingPayment ? (
                    "Saving Details..."
                  ) : (
                    <>
                      <Save size={18} /> Save Payment Details
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ========================================== */
          /* MAIN DASHBOARD VIEW                        */
          /* ========================================== */
          <>
            <div
              className="metrics-grid"
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
                gap: "24px",
                marginBottom: "32px",
              }}
            >
              {/* Total Earnings Card */}
              <div style={styles.metricCard}>
                <div
                  style={{
                    position: "absolute",
                    right: "-20px",
                    top: "-20px",
                    width: "100px",
                    height: "100px",
                    background: "#ecfdf5",
                    borderRadius: "50%",
                    opacity: 0.5,
                  }}
                ></div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    position: "relative",
                    zIndex: 10,
                  }}
                >
                  <div>
                    <p style={styles.metricLabel}>Total Earnings</p>
                    <h2 style={styles.metricValue}>
                      ${totalEarnings.toFixed(2)}
                    </h2>
                  </div>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      background: "#d1fae5",
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <DollarSign size={24} color="#059669" />
                  </div>
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    position: "relative",
                    zIndex: 10,
                    marginTop: "16px",
                    borderTop: "1px solid #e2e8f0",
                    paddingTop: "16px",
                  }}
                >
                  <p style={styles.metricDesc}>Your lifetime commission</p>
                  <button
                    onClick={() => setShowPayoutModal(true)}
                    style={{
                      background: "#0f172a",
                      color: "white",
                      padding: "8px 16px",
                      borderRadius: "8px",
                      border: "none",
                      fontSize: "0.85rem",
                      fontWeight: "700",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "6px",
                      transition: "all 0.2s",
                    }}
                  >
                    <Banknote size={16} /> Cash Out
                  </button>
                </div>
              </div>

              {/* Code Usage Card */}
              <div style={styles.metricCard}>
                <div
                  style={{
                    position: "absolute",
                    right: "-20px",
                    top: "-20px",
                    width: "100px",
                    height: "100px",
                    background: "#eff6ff",
                    borderRadius: "50%",
                    opacity: 0.5,
                  }}
                ></div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "16px",
                    position: "relative",
                    zIndex: 10,
                  }}
                >
                  <div>
                    <p style={styles.metricLabel}>Code Usage</p>
                    <h2 style={styles.metricValue}>{orders.length}</h2>
                  </div>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      background: "#dbeafe",
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Package size={24} color="#2563eb" />
                  </div>
                </div>
                <p style={{ ...styles.metricDesc, marginTop: "24px" }}>
                  Total orders using your code
                </p>
              </div>

              {/* Sales Driven Card */}
              <div style={styles.metricCard}>
                <div
                  style={{
                    position: "absolute",
                    right: "-20px",
                    top: "-20px",
                    width: "100px",
                    height: "100px",
                    background: "#faf5ff",
                    borderRadius: "50%",
                    opacity: 0.5,
                  }}
                ></div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    marginBottom: "16px",
                    position: "relative",
                    zIndex: 10,
                  }}
                >
                  <div>
                    <p style={styles.metricLabel}>Sales Driven</p>
                    <h2 style={styles.metricValue}>${totalSales.toFixed(2)}</h2>
                  </div>
                  <div
                    style={{
                      width: "48px",
                      height: "48px",
                      background: "#f3e8ff",
                      borderRadius: "12px",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <TrendingUp size={24} color="#9333ea" />
                  </div>
                </div>
                <p style={{ ...styles.metricDesc, marginTop: "24px" }}>
                  Total revenue generated for store
                </p>
              </div>
            </div>

            {/* Orders Table */}
            <div
              style={{
                background: "white",
                borderRadius: "16px",
                border: "1px solid #e2e8f0",
                overflow: "hidden",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
              }}
            >
              <div
                style={{
                  padding: "20px 24px",
                  borderBottom: "1px solid #e2e8f0",
                  background: "#f8fafc",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h3
                  style={{
                    margin: 0,
                    fontSize: "1.1rem",
                    fontWeight: 800,
                    color: "#0f172a",
                  }}
                >
                  Recent Referrals
                </h3>
                <span
                  style={{
                    fontSize: "0.85rem",
                    color: "#64748b",
                    fontWeight: 600,
                  }}
                >
                  {orders.length} Valid Orders
                </span>
              </div>

              <div
                className="table-responsive-wrapper"
                style={{ overflowX: "auto", width: "100%" }}
              >
                <table
                  style={{
                    width: "100%",
                    borderCollapse: "collapse",
                    textAlign: "left",
                    minWidth: "500px",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom: "2px solid #f1f5f9",
                        background: "white",
                      }}
                    >
                      <th style={styles.th}>Date</th>
                      <th style={styles.th}>Customer</th>
                      <th style={styles.th}>Order Total</th>
                      <th style={{ ...styles.th, textAlign: "right" }}>
                        Your Cut ({commissionPercentage}%)
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {isLoadingData ? (
                      <tr>
                        <td
                          colSpan="4"
                          style={{
                            padding: "40px",
                            textAlign: "center",
                            color: "#94a3b8",
                          }}
                        >
                          Loading your data...
                        </td>
                      </tr>
                    ) : orders.length === 0 ? (
                      <tr>
                        <td
                          colSpan="4"
                          style={{ padding: "60px 20px", textAlign: "center" }}
                        >
                          <div
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                            }}
                          >
                            <Package
                              size={48}
                              color="#cbd5e1"
                              style={{ marginBottom: "16px" }}
                            />
                            <p
                              style={{
                                fontSize: "1.1rem",
                                fontWeight: 600,
                                color: "#475569",
                                margin: "0 0 8px 0",
                              }}
                            >
                              No orders yet.
                            </p>
                            <p
                              style={{
                                fontSize: "0.9rem",
                                color: "#94a3b8",
                                margin: 0,
                              }}
                            >
                              Share your code{" "}
                              <strong style={{ color: "#4635de" }}>
                                {affiliate.discount_code}
                              </strong>{" "}
                              to start earning!
                            </p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      orders.map((order, idx) => {
                        const orderDate = new Date(
                          order.created_at,
                        ).toLocaleDateString("en-AU", {
                          month: "short",
                          day: "numeric",
                          year: "numeric",
                        });

                        const commission =
                          Number(order.total_amount || 0) *
                          Number(affiliate.commission_rate);

                        return (
                          <tr key={idx} style={styles.trBody}>
                            <td style={styles.td}>
                              <span
                                style={{
                                  color: "#64748b",
                                  fontSize: "0.9rem",
                                  fontWeight: 500,
                                }}
                              >
                                {orderDate}
                              </span>
                            </td>
                            <td style={styles.td}>
                              <div
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "10px",
                                }}
                              >
                                <div
                                  style={{
                                    width: "28px",
                                    height: "28px",
                                    background: "#f1f5f9",
                                    borderRadius: "50%",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    color: "#94a3b8",
                                    flexShrink: 0,
                                  }}
                                >
                                  <User size={14} />
                                </div>
                                <span
                                  style={{
                                    fontSize: "0.95rem",
                                    fontWeight: 600,
                                    color: "#0f172a",
                                    whiteSpace: "nowrap",
                                  }}
                                >
                                  {formatName(order.customer_name)}
                                </span>
                              </div>
                            </td>
                            <td
                              style={{
                                ...styles.td,
                                fontWeight: 700,
                                color: "#334155",
                              }}
                            >
                              ${Number(order.total_amount || 0).toFixed(2)}
                            </td>
                            <td style={{ ...styles.td, textAlign: "right" }}>
                              <span
                                style={{
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "4px",
                                  background: "#ecfdf5",
                                  color: "#059669",
                                  fontWeight: 800,
                                  padding: "6px 12px",
                                  borderRadius: "20px",
                                  fontSize: "0.9rem",
                                  whiteSpace: "nowrap",
                                }}
                              >
                                +${commission.toFixed(2)}
                              </span>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// --- CSS INJECTIONS & STYLES ---
const styles = {
  // Dashboard Styles
  metricCard: {
    background: "white",
    padding: "24px",
    borderRadius: "16px",
    border: "1px solid #e2e8f0",
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
    position: "relative",
    overflow: "hidden",
  },
  metricLabel: {
    fontSize: "0.85rem",
    fontWeight: 800,
    color: "#64748b",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    margin: "0 0 8px 0",
  },
  metricValue: {
    fontSize: "2.4rem",
    fontWeight: 900,
    color: "#0f172a",
    margin: 0,
    letterSpacing: "-1px",
  },
  metricDesc: {
    fontSize: "0.85rem",
    color: "#94a3b8",
    margin: 0,
    position: "relative",
    zIndex: 10,
    fontWeight: 500,
  },

  th: {
    padding: "16px 24px",
    fontSize: "0.8rem",
    color: "#64748b",
    fontWeight: "800",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
    whiteSpace: "nowrap",
  },
  trBody: { borderBottom: "1px solid #f1f5f9", transition: "background 0.2s" },
  td: { padding: "16px 24px", verticalAlign: "middle" },

  // Payout Modal Styles
  modalOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    background: "rgba(15, 23, 42, 0.7)",
    backdropFilter: "blur(4px)",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 100000,
    padding: "20px",
  },
  modalContent: {
    background: "white",
    borderRadius: "20px",
    width: "100%",
    maxWidth: "450px",
    boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
  },
  closeBtn: {
    background: "none",
    border: "none",
    color: "#94a3b8",
    cursor: "pointer",
    display: "flex",
    padding: 0,
  },

  // Full Screen Animation Styles
  fullScreenOverlay: {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    zIndex: 99999,
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  animationCenterBox: {
    position: "relative",
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    width: "100%",
    height: "100%",
  },
  absoluteIconZero: {
    position: "absolute",
    left: "50%",
    top: "50%",
    marginLeft: "-50px",
    marginTop: "-50px",
    zIndex: 5,
  },
  mainLogoBox: {
    width: "140px",
    height: "140px",
    background: "#ffffff",
    borderRadius: "35px",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 20,
    border: "2px solid #e2e8f0",
    boxShadow:
      "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 40px rgba(255,255,255,0.2)",
  },
  animationText: {
    fontSize: "2.8rem",
    fontWeight: 900,
    color: "white",
    margin: "24px 0 8px 0",
    letterSpacing: "-0.5px",
    textShadow: "0 4px 12px rgba(0,0,0,0.5)",
    zIndex: 20,
  },
  animationSubtext: {
    fontSize: "1.2rem",
    color: "rgba(255,255,255,0.8)",
    margin: 0,
    zIndex: 20,
  },
};

const styleTag = document.createElement("style");
styleTag.innerHTML = `
  /* LIQUID GRADIENT BACKGROUND */
  .gradient-bg-anim {
    background: linear-gradient(-45deg, #0f172a, #1e1b4b, #4635de, #0284c7, #0f172a);
    background-size: 400% 400%;
    animation: gradientShift 4s ease infinite;
  }
  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  /* STRICT VIEWPORT-LOCKED SPLIT SCREEN */
  .login-split-container {
    display: flex;
    height: 100vh;
    width: 100%;
    background: #0f172a;
    overflow: hidden;
  }
  .login-left {
    flex: 1;
    display: flex;
    justify-content: center;
    align-items: center;
    padding: 20px;
    z-index: 10;
    box-shadow: 20px 0 50px rgba(0,0,0,0.3);
    overflow-y: auto;
  }
  .login-card {
    background: rgba(255, 255, 255, 0.98);
    backdrop-filter: blur(10px);
    padding: 48px;
    border-radius: 24px;
    box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    width: 100%;
    max-width: 440px;
    border: 1px solid rgba(255,255,255,0.8);
    margin: auto 0;
  }

  .slide-down-enter { animation: slideDown 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  .fade-slide-up-exit { animation: slideUpFadeOut 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  
  @keyframes slideDown { 0% { transform: translateY(-100%); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }
  @keyframes slideUpFadeOut { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(-20px); opacity: 0; visibility: hidden; } }
  
  .pulse-glow-intense { animation: pulseGlowIntense 0.6s infinite alternate cubic-bezier(0.4, 0, 0.2, 1); }
  @keyframes pulseGlowIntense { 
    0% { box-shadow: 0 0 0 0 rgba(70, 53, 222, 0.9), 0 20px 40px rgba(0,0,0,0.5); transform: scale(1); } 
    100% { box-shadow: 0 0 0 50px rgba(70, 53, 222, 0), 0 20px 40px rgba(0,0,0,0.5); transform: scale(1.05); } 
  }
  
  .icon-bounce-1 { animation: smash1 1.1s cubic-bezier(0.175, 0.885, 0.32, 1.275) infinite alternate; }
  .icon-bounce-2 { animation: smash2 1.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) infinite alternate 0.1s; }
  .icon-bounce-3 { animation: smash3 1.0s cubic-bezier(0.175, 0.885, 0.32, 1.275) infinite alternate 0.2s; }
  .icon-bounce-4 { animation: smash4 1.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) infinite alternate 0.15s; }
  .icon-bounce-5 { animation: smash5 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) infinite alternate 0.25s; }
  .icon-bounce-6 { animation: smash6 1.1s cubic-bezier(0.175, 0.885, 0.32, 1.275) infinite alternate 0.05s; }
  .icon-bounce-7 { animation: smash7 1.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) infinite alternate 0.3s; }
  
  @keyframes smash1 { 0% { transform: translate(-450px, -350px) scale(0.8) rotate(0deg); } 50% { transform: translate(-220px, -200px) scale(1.1) rotate(15deg); } 100% { transform: translate(-380px, -100px) scale(0.9) rotate(-5deg); } }
  @keyframes smash2 { 0% { transform: translate(400px, -400px) scale(0.9) rotate(0deg); } 50% { transform: translate(220px, -180px) scale(1.2) rotate(-15deg); } 100% { transform: translate(350px, -50px) scale(1) rotate(10deg); } }
  @keyframes smash3 { 0% { transform: translate(-500px, 400px) scale(1) rotate(-10deg); } 50% { transform: translate(-220px, 220px) scale(1.3) rotate(5deg); } 100% { transform: translate(-300px, 450px) scale(0.8) rotate(15deg); } }
  @keyframes smash4 { 0% { transform: translate(450px, 350px) scale(0.8) rotate(10deg); } 50% { transform: translate(240px, 250px) scale(1.1) rotate(-5deg); } 100% { transform: translate(400px, 150px) scale(1) rotate(-15deg); } }
  @keyframes smash5 { 0% { transform: translate(-600px, 0px) scale(0.9) rotate(0deg); } 50% { transform: translate(-280px, 50px) scale(1.2) rotate(18deg); } 100% { transform: translate(-550px, 200px) scale(0.8) rotate(-10deg); } }
  @keyframes smash6 { 0% { transform: translate(600px, 100px) scale(1) rotate(-5deg); } 50% { transform: translate(280px, -50px) scale(1.3) rotate(-18deg); } 100% { transform: translate(500px, -250px) scale(0.9) rotate(12deg); } }
  @keyframes smash7 { 0% { transform: translate(0px, -500px) scale(0.8) rotate(0deg); } 50% { transform: translate(80px, -240px) scale(1.1) rotate(-12deg); } 100% { transform: translate(-100px, -450px) scale(1) rotate(15deg); } }
  
  .fade-in-text { opacity: 0; animation: fadeInText 0.3s ease-out forwards 0.1s; }
  .fade-in-text-delay { opacity: 0; animation: fadeInText 0.3s ease-out forwards 0.3s; }
  @keyframes fadeInText { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
  
  .fade-in-ui { opacity: 0; animation: popInUI 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards 0.3s; }
  @keyframes popInUI { 
    0% { opacity: 0; transform: scale(0.98) translateY(10px); } 
    100% { opacity: 1; transform: scale(1) translateY(0); } 
  }
  
  input:focus, select:focus, textarea:focus { border-color: #4635de !important; box-shadow: 0 0 0 3px rgba(70, 53, 222, 0.1) !important; }

  @media (max-width: 1024px) {
    .hide-on-mobile { display: none !important; }
    .dashboard-content-wrapper { margin-top: 24px !important; padding: 0 16px !important; }
    .metrics-grid { gap: 16px !important; }
    .dashboard-title { font-size: 1rem !important; }
    .logout-btn { padding: 8px 12px !important; }
    .login-card { padding: 32px !important; }
    .login-split-container { height: auto; min-height: 100vh; overflow: visible; }
    .login-left { height: auto; min-height: 100vh; overflow: visible; }
  }
`;
document.head.appendChild(styleTag);
