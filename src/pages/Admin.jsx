import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import {
  Package,
  FileText,
  LogOut,
  ShoppingBag,
  MessageSquare,
  Mail,
  Users,
  Atom,
  ArrowRight,
  Lock,
  Tag, // <--- Added Icon
} from "lucide-react";
import ProductManager from "../components/admin/ProductManager";
import ContentEditor from "../components/admin/ContentEditor";
import OrderManager from "../components/admin/OrderManager";
import ReviewManager from "../components/admin/ReviewManager";
import InquiryManager from "../components/admin/InquiryManager";
import SubscriberManager from "../components/admin/SubscriberManager";
import DiscountManager from "../components/admin/DiscountManager"; // <--- Added Component

export default function Admin() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("orders");

  // Login State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setAuthLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    setAuthLoading(false);
    if (error) alert(error.message);
  };

  const handleLogout = () => supabase.auth.signOut();

  // 1. LOADING SCREEN
  if (loading)
    return (
      <div style={styles.centerScreen}>
        <Atom size={48} className="spin-anim" color="var(--primary)" />
      </div>
    );

  // 2. NEW LOGIN SCREEN DESIGN
  if (!session) {
    return (
      <div style={styles.loginContainer}>
        {/* Left Side: Visual/Branding */}
        <div style={styles.loginBanner}>
          <div style={styles.bannerOverlay}>
            <div style={styles.logoArea}>
              <Atom size={40} color="white" className="spin-anim" />
              <h1 style={{ color: "white", margin: 0 }}>Melbourne Peptides</h1>
            </div>
            <div style={styles.bannerText}>
              <h2
                style={{
                  color: "white",
                  fontSize: "2rem",
                  marginBottom: "1rem",
                }}
              >
                Admin Portal
              </h2>
              <p style={{ color: "rgba(255,255,255,0.8)", fontSize: "1.1rem" }}>
                Manage orders, inventory, and customer inquiries securely.
              </p>
            </div>
          </div>
          {/* Background Image */}
          <img
            src="/hero-banner.jpg"
            alt="Lab Background"
            style={styles.bannerImage}
          />
        </div>

        {/* Right Side: Form */}
        <div style={styles.loginFormWrapper}>
          <div style={styles.loginCard}>
            <div style={styles.formHeader}>
              <div style={styles.iconCircle}>
                <Lock size={24} color="var(--primary)" />
              </div>
              <h3>Welcome Back</h3>
              <p style={{ color: "#64748b" }}>
                Please enter your details to sign in.
              </p>
            </div>

            <form onSubmit={handleLogin} style={styles.form}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Email Address</label>
                <input
                  type="email"
                  required
                  placeholder="admin@melbournepeptides.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.input}
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label}>Password</label>
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={styles.input}
                />
              </div>

              <button
                disabled={authLoading}
                style={{
                  ...styles.submitBtn,
                  opacity: authLoading ? 0.7 : 1,
                }}
              >
                {authLoading ? (
                  "Signing In..."
                ) : (
                  <>
                    Sign In <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          </div>
          <div style={styles.footer}>
            &copy; {new Date().getFullYear()} Melbourne Peptides. Secure System.
          </div>
        </div>
      </div>
    );
  }

  // 3. DASHBOARD
  return (
    <div
      className="container"
      style={{ padding: "40px 24px", minHeight: "100vh" }}
    >
      <div style={styles.header}>
        <div>
          <h1 style={{ margin: 0, fontSize: "1.8rem" }}>Dashboard</h1>
          <p style={{ color: "#64748b", margin: "4px 0 0" }}>
            Welcome back, Admin
          </p>
        </div>
        <button onClick={handleLogout} style={styles.logoutBtn}>
          <LogOut size={18} /> Sign Out
        </button>
      </div>

      {/* TABS */}
      <div style={styles.tabContainer}>
        <TabButton
          active={activeTab === "orders"}
          onClick={() => setActiveTab("orders")}
          icon={<ShoppingBag size={18} />}
          label="Orders"
        />
        <TabButton
          active={activeTab === "inquiries"}
          onClick={() => setActiveTab("inquiries")}
          icon={<Mail size={18} />}
          label="Inquiries"
        />
        <TabButton
          active={activeTab === "subscribers"}
          onClick={() => setActiveTab("subscribers")}
          icon={<Users size={18} />}
          label="Subscribers"
        />
        <TabButton
          active={activeTab === "products"}
          onClick={() => setActiveTab("products")}
          icon={<Package size={18} />}
          label="Inventory"
        />
        <TabButton
          active={activeTab === "discounts"} /* <--- Added Discount Tab */
          onClick={() => setActiveTab("discounts")}
          icon={<Tag size={18} />}
          label="Discounts"
        />
        <TabButton
          active={activeTab === "reviews"}
          onClick={() => setActiveTab("reviews")}
          icon={<MessageSquare size={18} />}
          label="Reviews"
        />
        <TabButton
          active={activeTab === "content"}
          onClick={() => setActiveTab("content")}
          icon={<FileText size={18} />}
          label="Site Content"
        />
      </div>

      {/* CONTENT AREA */}
      <div style={styles.contentArea}>
        {activeTab === "orders" && <OrderManager />}
        {activeTab === "inquiries" && <InquiryManager />}
        {activeTab === "subscribers" && <SubscriberManager />}
        {activeTab === "products" && <ProductManager />}
        {activeTab === "discounts" && <DiscountManager />}{" "}
        {/* <--- Added Component Render */}
        {activeTab === "reviews" && <ReviewManager />}
        {activeTab === "content" && <ContentEditor />}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "8px",
        padding: "12px 20px",
        background: "none",
        border: "none",
        borderBottom: active
          ? "3px solid var(--primary)"
          : "3px solid transparent",
        color: active ? "var(--primary)" : "#64748b",
        fontWeight: active ? "700" : "500",
        cursor: "pointer",
        fontSize: "0.95rem",
        whiteSpace: "nowrap",
        transition: "all 0.2s",
      }}
    >
      {icon} {label}
    </button>
  );
}

const styles = {
  centerScreen: {
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "#f8fafc",
  },

  // Login Styles
  loginContainer: { display: "flex", minHeight: "100vh", background: "#fff" },
  loginBanner: {
    flex: 1,
    position: "relative",
    display: "none",
    flexDirection: "column",
    justifyContent: "space-between",
    "@media (min-width: 768px)": { display: "flex" },
  },

  bannerImage: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
  },
  bannerOverlay: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(to bottom, rgba(15, 23, 42, 0.9), rgba(15, 23, 42, 0.8))",
    padding: "60px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    zIndex: 1,
  },
  logoArea: { display: "flex", alignItems: "center", gap: "16px" },
  bannerText: { maxWidth: "500px" },

  loginFormWrapper: {
    flex: "0 0 100%",
    maxWidth: "100%",
    padding: "40px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: "#fff",
  },

  loginCard: { width: "100%", maxWidth: "400px" },
  formHeader: { marginBottom: "32px", textAlign: "center" },
  iconCircle: {
    width: "50px",
    height: "50px",
    borderRadius: "12px",
    background: "rgba(70, 53, 222, 0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
  },

  form: { display: "flex", flexDirection: "column", gap: "20px" },
  inputGroup: { display: "flex", flexDirection: "column", gap: "8px" },
  label: { fontSize: "0.9rem", fontWeight: "600", color: "#0f172a" },
  input: {
    padding: "12px 16px",
    borderRadius: "8px",
    border: "1px solid #e2e8f0",
    fontSize: "1rem",
    transition: "border-color 0.2s",
    outline: "none",
  },

  submitBtn: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "10px",
    padding: "14px",
    background: "var(--primary)",
    color: "white",
    border: "none",
    borderRadius: "8px",
    fontWeight: "600",
    fontSize: "1rem",
    cursor: "pointer",
    transition: "background 0.2s",
  },
  footer: {
    marginTop: "40px",
    fontSize: "0.85rem",
    color: "#94a3b8",
    textAlign: "center",
  },

  // Dashboard Styles
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "40px",
  },
  logoutBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    padding: "10px 16px",
    background: "white",
    border: "1px solid #e2e8f0",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "600",
    color: "#ef4444",
    transition: "all 0.2s",
  },
  tabContainer: {
    display: "flex",
    gap: "20px",
    marginBottom: "30px",
    borderBottom: "1px solid #e2e8f0",
    overflowX: "auto",
    paddingBottom: "2px",
  },
  contentArea: { animation: "fadeIn 0.3s ease-out" },
};

// CSS Injection for Media Queries & Animations
const styleTag = document.createElement("style");
styleTag.innerHTML = `
  @media (min-width: 1024px) {
    .login-form-wrapper { flex: 0 0 500px !important; border-left: 1px solid #f1f5f9; }
  }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
`;
document.head.appendChild(styleTag);
