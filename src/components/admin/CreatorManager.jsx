import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import {
  Plus,
  Trash2,
  Tag,
  Lock,
  User,
  Percent,
  DollarSign,
  TestTube,
  Star,
  Sparkles,
  X,
  Save,
  Beaker,
  Microscope,
  Activity,
  Zap,
} from "lucide-react";

export default function CreatorManager() {
  const [affiliates, setAffiliates] = useState([]);
  const [orders, setOrders] = useState([]);
  const [creatorCodes, setCreatorCodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);

  // Animation States
  const [isAnimating, setIsAnimating] = useState(true);
  const [mountOverlay, setMountOverlay] = useState(true);

  // New Affiliate Form State
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [commission, setCommission] = useState("15");
  const [pin, setPin] = useState("");

  useEffect(() => {
    // 1. Start the exit animation at 0.5s
    const exitTimer = setTimeout(() => {
      setIsAnimating(false);
    }, 500);

    // 2. Unmount the overlay completely at 0.9s (gives the 0.4s exit anim time to play)
    const unmountTimer = setTimeout(() => {
      setMountOverlay(false);
    }, 900);

    fetchData();
    return () => {
      clearTimeout(exitTimer);
      clearTimeout(unmountTimer);
    };
  }, []);

  const fetchData = async () => {
    try {
      const [affiliatesRes, ordersRes, codesRes] = await Promise.all([
        supabase
          .from("affiliates")
          .select("*")
          .order("created_at", { ascending: false }),
        supabase
          .from("orders")
          .select("discount_code, total_price")
          .not("discount_code", "is", null),
        supabase
          .from("discounts")
          .select("code")
          .eq("is_creator_code", true)
          .eq("active", true),
      ]);

      if (affiliatesRes.data) setAffiliates(affiliatesRes.data);
      if (ordersRes.data) setOrders(ordersRes.data);
      if (codesRes.data) {
        setCreatorCodes(codesRes.data);
        if (codesRes.data.length > 0 && !code) {
          setCode(codesRes.data[0].code);
        }
      }
    } catch (error) {
      console.error("Error fetching creator data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAffiliate = async (e) => {
    e.preventDefault();
    if (!code) return alert("Please select a Creator Code first.");

    const rate = parseFloat(commission) / 100;

    const { error } = await supabase.from("affiliates").insert([
      {
        name: name.trim(),
        discount_code: code.trim().toUpperCase(),
        commission_rate: rate,
        pin: pin.trim(),
      },
    ]);

    if (error) {
      alert(`Error adding creator: ${error.message}`);
    } else {
      setIsAdding(false);
      setName("");
      setCommission("15");
      setPin("");
      fetchData();
    }
  };

  const handleDelete = async (id) => {
    if (
      !window.confirm(
        "Are you sure you want to delete this creator? They will lose access to their portal.",
      )
    )
      return;
    await supabase.from("affiliates").delete().eq("id", id);
    fetchData();
  };

  const getAffiliateStats = (discountCode) => {
    const affiliateOrders = orders.filter(
      (o) =>
        o.discount_code &&
        o.discount_code.toUpperCase() === discountCode.toUpperCase(),
    );
    const totalSales = affiliateOrders.reduce(
      (sum, order) => sum + Number(order.total_price || 0),
      0,
    );
    return { usageCount: affiliateOrders.length, totalSales };
  };

  return (
    <>
      {/* --- THE HYPER-KINETIC INTRO ANIMATION OVERLAY --- */}
      {mountOverlay && (
        <div
          className={`gradient-bg-anim ${isAnimating ? "slide-down-enter" : "fade-slide-up-exit"}`}
          style={styles.fullScreenOverlay}
        >
          {/* Main Content Wrapper (Centered) */}
          <div style={styles.animationCenterBox}>
            {/* 7 UNIQUE HIGH-VELOCITY ICONS */}
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

            {/* CENTRAL LOGO (White Box) */}
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

      {/* --- THE MAIN DASHBOARD UI --- */}
      <div
        className="fade-in-ui"
        style={{
          padding: "24px",
          background: "white",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          position: "relative",
          zIndex: 1,
        }}
      >
        {/* HEADER */}
        <div style={styles.header}>
          <h3 style={styles.title}>
            <div style={styles.titleIconWrapper}>
              <Star size={20} color="#4635de" />
            </div>
            Creator Management
          </h3>
          {!isAdding && (
            <button onClick={() => setIsAdding(true)} style={styles.primaryBtn}>
              <Plus size={16} /> Add Creator
            </button>
          )}
        </div>

        <p style={styles.subtitle}>
          Manage influencer codes, commissions, and track global partner
          payouts.
        </p>

        {/* FORM CARD */}
        {isAdding && (
          <div style={styles.formCard}>
            <div style={styles.formHeader}>
              <h4 style={{ margin: 0, color: "#0f172a", fontSize: "1.1rem" }}>
                Register New Creator
              </h4>
              <button
                onClick={() => setIsAdding(false)}
                style={styles.closeBtn}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddAffiliate} style={styles.formGrid}>
              <div>
                <label style={styles.label}>Creator Name</label>
                <div style={styles.inputWrapper}>
                  <User style={styles.inputIcon} size={16} />
                  <input
                    required
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Sarah Fitness"
                    style={styles.inputWithIcon}
                  />
                </div>
              </div>

              <div>
                <label style={styles.label}>Assign Creator Code</label>
                <div style={styles.inputWrapper}>
                  <Tag style={styles.inputIcon} size={16} />
                  {creatorCodes.length > 0 ? (
                    <select
                      required
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      style={styles.selectWithIcon}
                    >
                      {creatorCodes.map((c) => (
                        <option key={c.code} value={c.code}>
                          {c.code}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div style={styles.errorBox}>
                      No Creator Codes found! Make one in Discount Manager.
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label style={styles.label}>Commission Rate (%)</label>
                <div style={styles.inputWrapper}>
                  <Percent style={styles.inputIcon} size={16} />
                  <input
                    required
                    type="number"
                    min="0"
                    max="100"
                    value={commission}
                    onChange={(e) => setCommission(e.target.value)}
                    placeholder="15"
                    style={styles.inputWithIcon}
                  />
                </div>
              </div>

              <div>
                <label style={styles.label}>
                  Login PIN (For their dashboard)
                </label>
                <div style={styles.inputWrapper}>
                  <Lock style={styles.inputIcon} size={16} />
                  <input
                    required
                    type="text"
                    value={pin}
                    onChange={(e) => setPin(e.target.value)}
                    placeholder="e.g. 1234"
                    style={styles.inputWithIcon}
                  />
                </div>
              </div>

              <div
                style={{
                  gridColumn: "1 / -1",
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                  marginTop: "10px",
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsAdding(false)}
                  style={styles.cancelBtn}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!code || creatorCodes.length === 0}
                  style={styles.saveBtn}
                >
                  <Save size={16} /> Save Creator
                </button>
              </div>
            </form>
          </div>
        )}

        {/* TABLE */}
        {loading ? (
          <div
            style={{ padding: "40px", textAlign: "center", color: "#64748b" }}
          >
            Loading creators...
          </div>
        ) : (
          <div style={styles.tableWrapper}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.trHead}>
                  <th style={styles.th}>Creator Partner</th>
                  <th style={styles.th}>Assigned Code</th>
                  <th style={styles.th}>Metrics</th>
                  <th style={styles.th}>Owed Payout</th>
                  <th style={{ ...styles.th, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {affiliates.length === 0 ? (
                  <tr>
                    <td
                      colSpan="5"
                      style={{
                        padding: "40px",
                        textAlign: "center",
                        color: "#94a3b8",
                      }}
                    >
                      No creators added yet. Click "Add Creator" to start.
                    </td>
                  </tr>
                ) : (
                  affiliates.map((aff) => {
                    const stats = getAffiliateStats(aff.discount_code);
                    const totalPayout = stats.totalSales * aff.commission_rate;

                    return (
                      <tr key={aff.id} style={styles.trBody}>
                        <td style={styles.td}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                            }}
                          >
                            <div style={styles.avatarCircle}>
                              {aff.name.charAt(0)}
                            </div>
                            <span style={{ fontWeight: 700, color: "#0f172a" }}>
                              {aff.name}
                            </span>
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.codeBadge}>
                            {aff.discount_code}
                          </div>
                          <div style={styles.pinText}>
                            <Lock size={10} /> PIN: {aff.pin}
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div style={{ fontWeight: 700, color: "#0f172a" }}>
                            ${stats.totalSales.toFixed(2)} Sales
                          </div>
                          <div style={{ fontSize: "0.8rem", color: "#64748b" }}>
                            {stats.usageCount} uses @{" "}
                            {(aff.commission_rate * 100).toFixed(0)}% cut
                          </div>
                        </td>
                        <td style={styles.td}>
                          <div style={styles.payoutBadge}>
                            <DollarSign size={14} />
                            {totalPayout.toFixed(2)}
                          </div>
                        </td>
                        <td style={{ ...styles.td, textAlign: "right" }}>
                          <button
                            onClick={() => handleDelete(aff.id)}
                            style={styles.deleteBtn}
                            title="Remove Creator"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </>
  );
}

// STYLES OBJECT
const styles = {
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "8px",
  },
  title: {
    margin: 0,
    display: "flex",
    alignItems: "center",
    gap: "12px",
    color: "#0f172a",
    fontSize: "1.4rem",
  },
  titleIconWrapper: {
    background: "#f0f4ff",
    padding: "8px",
    borderRadius: "10px",
    display: "flex",
  },
  subtitle: { color: "#64748b", fontSize: "0.95rem", margin: "0 0 24px 0" },
  primaryBtn: {
    background: "#0f172a",
    color: "white",
    padding: "10px 18px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: 600,
    fontSize: "0.95rem",
    transition: "all 0.2s",
  },

  formCard: {
    background: "#f8fafc",
    padding: "24px",
    borderRadius: "16px",
    marginBottom: "32px",
    border: "1px dashed #cbd5e1",
  },
  formHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: 20,
    borderBottom: "1px solid #e2e8f0",
    paddingBottom: 16,
  },
  formGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" },
  label: {
    display: "block",
    fontSize: "0.85rem",
    marginBottom: "8px",
    fontWeight: 600,
    color: "#475569",
  },

  inputWrapper: { position: "relative", display: "flex", alignItems: "center" },
  inputIcon: { position: "absolute", left: "12px", color: "#94a3b8" },
  inputWithIcon: {
    width: "100%",
    padding: "10px 12px 10px 36px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "0.95rem",
    outline: "none",
    transition: "border-color 0.2s",
  },
  selectWithIcon: {
    width: "100%",
    padding: "10px 12px 10px 36px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    fontSize: "0.95rem",
    fontWeight: "bold",
    color: "#4635de",
    background: "white",
    outline: "none",
  },

  errorBox: {
    width: "100%",
    padding: "10px 12px 10px 36px",
    borderRadius: "8px",
    border: "1px solid #fecaca",
    background: "#fef2f2",
    color: "#ef4444",
    fontSize: "0.85rem",
  },
  closeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    color: "#64748b",
  },
  saveBtn: {
    background: "#10b981",
    color: "white",
    padding: "10px 24px",
    borderRadius: "8px",
    border: "none",
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    gap: "8px",
    fontWeight: 600,
    fontSize: "0.95rem",
  },
  cancelBtn: {
    background: "white",
    color: "#64748b",
    padding: "10px 24px",
    borderRadius: "8px",
    border: "1px solid #cbd5e1",
    cursor: "pointer",
    fontWeight: 600,
    fontSize: "0.95rem",
  },

  tableWrapper: {
    overflowX: "auto",
    background: "white",
    borderRadius: "12px",
    border: "1px solid #f1f5f9",
  },
  table: { width: "100%", borderCollapse: "collapse" },
  trHead: {
    background: "#f8fafc",
    borderBottom: "2px solid #f1f5f9",
    textAlign: "left",
  },
  th: {
    padding: "16px",
    fontSize: "0.85rem",
    color: "#64748b",
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: "0.5px",
  },
  trBody: { borderBottom: "1px solid #f1f5f9", transition: "background 0.2s" },
  td: {
    padding: "16px",
    fontSize: "0.95rem",
    color: "#334155",
    verticalAlign: "middle",
  },

  avatarCircle: {
    width: "36px",
    height: "36px",
    background: "#4635de",
    color: "white",
    borderRadius: "50%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: "bold",
    fontSize: "1.1rem",
  },
  codeBadge: {
    display: "inline-flex",
    background: "#fef3c7",
    color: "#b45309",
    padding: "4px 10px",
    borderRadius: "6px",
    fontWeight: 800,
    fontSize: "0.85rem",
    letterSpacing: "0.5px",
    marginBottom: "4px",
  },
  pinText: {
    fontSize: "0.75rem",
    color: "#94a3b8",
    display: "flex",
    alignItems: "center",
    gap: "4px",
  },
  payoutBadge: {
    display: "inline-flex",
    alignItems: "center",
    gap: "2px",
    background: "#ecfdf5",
    color: "#059669",
    padding: "6px 12px",
    borderRadius: "20px",
    fontWeight: 800,
    fontSize: "0.95rem",
  },

  deleteBtn: {
    background: "#fef2f2",
    border: "1px solid #fee2e2",
    color: "#ef4444",
    cursor: "pointer",
    padding: "8px",
    borderRadius: "8px",
    transition: "all 0.2s",
  },

  // --- FULL SCREEN ANIMATION STYLES ---
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
    marginLeft: "-50px", // Align centers approximately
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

// --- CSS INJECTIONS FOR ADVANCED COLLISION/PHYSICS ANIMATIONS ---
const styleTag = document.createElement("style");
styleTag.innerHTML = `
  /* LIQUID GRADIENT BACKGROUND */
  .gradient-bg-anim {
    background: linear-gradient(-45deg, #0f172a, #1e1b4b, #4635de, #0284c7, #0f172a);
    background-size: 400% 400%;
    animation: gradientShift 3s ease infinite;
  }
  @keyframes gradientShift {
    0% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
    100% { background-position: 0% 50%; }
  }

  /* Overlay entry/exit animations */
  .slide-down-enter { animation: slideDown 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  .fade-slide-up-exit { animation: slideUpFadeOut 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  
  @keyframes slideDown {
    0% { transform: translateY(-100%); opacity: 0; }
    100% { transform: translateY(0); opacity: 1; }
  }
  @keyframes slideUpFadeOut {
    0% { transform: translateY(0); opacity: 1; }
    100% { transform: translateY(-20px); opacity: 0; visibility: hidden; }
  }
  
  /* Intense Logo Pulse (Behind the White Box) */
  .pulse-glow-intense { animation: pulseGlowIntense 0.6s infinite alternate cubic-bezier(0.4, 0, 0.2, 1); }
  @keyframes pulseGlowIntense { 
    0% { box-shadow: 0 0 0 0 rgba(70, 53, 222, 0.9), 0 20px 40px rgba(0,0,0,0.5); transform: scale(1); } 
    100% { box-shadow: 0 0 0 50px rgba(70, 53, 222, 0), 0 20px 40px rgba(0,0,0,0.5); transform: scale(1.05); } 
  }
  
  /* STRICT BOUNDARY COLLISION PHYSICS */
  
  .icon-bounce-1 { animation: smash1 1.1s cubic-bezier(0.175, 0.885, 0.32, 1.275) infinite alternate; }
  .icon-bounce-2 { animation: smash2 1.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) infinite alternate 0.1s; }
  .icon-bounce-3 { animation: smash3 1.0s cubic-bezier(0.175, 0.885, 0.32, 1.275) infinite alternate 0.2s; }
  .icon-bounce-4 { animation: smash4 1.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) infinite alternate 0.15s; }
  .icon-bounce-5 { animation: smash5 1.2s cubic-bezier(0.175, 0.885, 0.32, 1.275) infinite alternate 0.25s; }
  .icon-bounce-6 { animation: smash6 1.1s cubic-bezier(0.175, 0.885, 0.32, 1.275) infinite alternate 0.05s; }
  .icon-bounce-7 { animation: smash7 1.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) infinite alternate 0.3s; }
  
  /* 1: Top-Left Attacker */
  @keyframes smash1 {
    0% { transform: translate(-450px, -350px) scale(0.8) rotate(0deg); }
    50% { transform: translate(-220px, -200px) scale(1.1) rotate(15deg); }
    100% { transform: translate(-380px, -100px) scale(0.9) rotate(-5deg); }
  }

  /* 2: Top-Right Attacker */
  @keyframes smash2 {
    0% { transform: translate(400px, -400px) scale(0.9) rotate(0deg); }
    50% { transform: translate(220px, -180px) scale(1.2) rotate(-15deg); }
    100% { transform: translate(350px, -50px) scale(1) rotate(10deg); }
  }

  /* 3: Bottom-Left Attacker */
  @keyframes smash3 {
    0% { transform: translate(-500px, 400px) scale(1) rotate(-10deg); }
    50% { transform: translate(-220px, 220px) scale(1.3) rotate(5deg); }
    100% { transform: translate(-300px, 450px) scale(0.8) rotate(15deg); }
  }

  /* 4: Bottom-Right Attacker */
  @keyframes smash4 {
    0% { transform: translate(450px, 350px) scale(0.8) rotate(10deg); }
    50% { transform: translate(240px, 250px) scale(1.1) rotate(-5deg); }
    100% { transform: translate(400px, 150px) scale(1) rotate(-15deg); }
  }

  /* 5: Far-Left Wall Bouncer */
  @keyframes smash5 {
    0% { transform: translate(-600px, 0px) scale(0.9) rotate(0deg); }
    50% { transform: translate(-280px, 50px) scale(1.2) rotate(18deg); }
    100% { transform: translate(-550px, 200px) scale(0.8) rotate(-10deg); }
  }

  /* 6: Far-Right Wall Bouncer */
  @keyframes smash6 {
    0% { transform: translate(600px, 100px) scale(1) rotate(-5deg); }
    50% { transform: translate(280px, -50px) scale(1.3) rotate(-18deg); }
    100% { transform: translate(500px, -250px) scale(0.9) rotate(12deg); }
  }

  /* 7: Top-Center Ceiling Dropper */
  @keyframes smash7 {
    0% { transform: translate(0px, -500px) scale(0.8) rotate(0deg); }
    50% { transform: translate(80px, -240px) scale(1.1) rotate(-12deg); }
    100% { transform: translate(-100px, -450px) scale(1) rotate(15deg); }
  }
  
  .fade-in-text { opacity: 0; animation: fadeInText 0.3s ease-out forwards 0.1s; }
  .fade-in-text-delay { opacity: 0; animation: fadeInText 0.3s ease-out forwards 0.3s; }
  @keyframes fadeInText { from { opacity: 0; transform: translateY(15px); } to { opacity: 1; transform: translateY(0); } }
  
  /* FIXED: Adjusted animation delay down to 0.5s to sync with the new rapid 0.5s exit timer */
  .fade-in-ui { opacity: 0; animation: popInUI 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards 0.5s; }
  @keyframes popInUI { 
    0% { opacity: 0; transform: scale(0.98) translateY(10px); } 
    100% { opacity: 1; transform: scale(1) translateY(0); } 
  }
  
  input:focus, select:focus { border-color: #4635de !important; box-shadow: 0 0 0 3px rgba(70, 53, 222, 0.1) !important; }
`;
document.head.appendChild(styleTag);
