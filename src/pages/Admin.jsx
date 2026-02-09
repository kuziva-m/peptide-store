import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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
  Tag,
  Settings,
  Menu,
  X,
  Inbox,
  Home,
  BarChart3,
} from "lucide-react";

// Components
import ProductManager from "../components/admin/ProductManager";
import ContentEditor from "../components/admin/ContentEditor";
import OrderManager from "../components/admin/OrderManager";
import ReviewManager from "../components/admin/ReviewManager";
import InquiryManager from "../components/admin/InquiryManager";
import SubscriberManager from "../components/admin/SubscriberManager";
import DiscountManager from "../components/admin/DiscountManager";
import SettingsManager from "../components/admin/SettingsManager";
import EmailManager from "../components/admin/EmailManager";
import AnalyticsDashboard from "../components/admin/AnalyticsDashboard";

export default function Admin() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("orders");
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
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

  // --- REORGANIZED MENUS ---
  const PRIMARY_MENU = [
    { id: "orders", label: "Orders", icon: ShoppingBag },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "email", label: "Email", icon: Inbox },
    { id: "products", label: "Inventory", icon: Package },
    { id: "discounts", label: "Codes", icon: Tag },
    { id: "subscribers", label: "Users", icon: Users },
    { id: "inquiries", label: "Inbox", icon: Mail },
  ];

  const SECONDARY_MENU = [
    { id: "reviews", label: "Reviews", icon: MessageSquare },
    { id: "content", label: "Content", icon: FileText },
    { id: "settings", label: "Settings", icon: Settings },
  ];

  if (loading)
    return (
      <div style={styles.centerScreen}>
        <Atom size={48} className="spin-anim" color="var(--primary)" />
      </div>
    );

  if (!session) {
    return (
      <div style={styles.loginContainer}>
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
          <img
            src="/hero-banner.jpg"
            alt="Lab Background"
            style={styles.bannerImage}
          />
        </div>
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
                style={{ ...styles.submitBtn, opacity: authLoading ? 0.7 : 1 }}
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

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <nav style={styles.navbar}>
        {/* ROW 1: Branding & Secondary Actions */}
        <div style={styles.topRow}>
          <div style={styles.logoSection}>
            <Atom size={24} color="white" className="spin-anim" />
            <span style={styles.navTitle}>Admin Panel</span>
          </div>

          <div style={styles.rightSection}>
            {/* Secondary Menu (Top Right) */}
            <div
              className="hide-mobile"
              style={{ display: "flex", gap: "4px", marginRight: "16px" }}
            >
              {SECONDARY_MENU.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  style={{
                    ...styles.navLinkSmall,
                    ...(activeTab === item.id ? styles.navLinkActiveSmall : {}),
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>

            <Link to="/" style={styles.homeBtn}>
              <Home size={16} /> <span className="hide-mobile">Site</span>
            </Link>
            <button
              onClick={handleLogout}
              className="logout-btn"
              style={styles.logoutBtnNav}
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>
            <button
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}
              style={styles.mobileToggle}
            >
              {isMobileMenuOpen ? (
                <X size={24} color="white" />
              ) : (
                <Menu size={24} color="white" />
              )}
            </button>
          </div>
        </div>

        {/* ROW 2: Primary Navigation Tabs */}
        <div className="desktop-nav" style={styles.bottomRow}>
          {PRIMARY_MENU.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              style={{
                ...styles.navLink,
                ...(activeTab === item.id ? styles.navLinkActive : {}),
              }}
            >
              <item.icon size={16} />
              {item.label}
            </button>
          ))}
        </div>

        {/* Mobile Dropdown */}
        {isMobileMenuOpen && (
          <div style={styles.mobileMenu}>
            <Link to="/" style={styles.mobileNavLink}>
              <Home size={18} /> Back to Website
            </Link>
            <div
              style={{ borderBottom: "1px solid #334155", margin: "4px 0" }}
            ></div>
            {[...PRIMARY_MENU, ...SECONDARY_MENU].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  setMobileMenuOpen(false);
                }}
                style={{
                  ...styles.mobileNavLink,
                  ...(activeTab === item.id ? styles.mobileNavLinkActive : {}),
                }}
              >
                <item.icon size={18} /> {item.label}
              </button>
            ))}
          </div>
        )}
      </nav>

      {/* MAIN CONTENT */}
      <main style={styles.mainContent}>
        <div style={styles.contentCard}>
          {activeTab === "orders" && <OrderManager />}
          {activeTab === "analytics" && <AnalyticsDashboard />}
          {activeTab === "email" && <EmailManager />}
          {activeTab === "inquiries" && <InquiryManager />}
          {activeTab === "subscribers" && <SubscriberManager />}
          {activeTab === "products" && <ProductManager />}
          {activeTab === "discounts" && <DiscountManager />}
          {activeTab === "reviews" && <ReviewManager />}
          {activeTab === "content" && <ContentEditor />}
          {activeTab === "settings" && <SettingsManager />}
        </div>
      </main>
    </div>
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
  navbar: {
    background: "#0f172a",
    color: "white",
    position: "sticky",
    top: 0,
    zIndex: 50,
    boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
    display: "flex",
    flexDirection: "column",
  },
  topRow: {
    maxWidth: "1400px",
    margin: "0 auto",
    width: "100%",
    padding: "10px 24px",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottom: "1px solid #1e293b",
    height: "60px",
  },
  bottomRow: {
    maxWidth: "1400px",
    margin: "0 auto",
    width: "100%",
    padding: "0 24px",
    display: "flex",
    alignItems: "center",
    gap: "4px",
    height: "50px",
    overflowX: "auto",
  },
  logoSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    fontWeight: "bold",
    fontSize: "1.2rem",
  },
  navTitle: { letterSpacing: "0.5px" },

  // Primary Tabs
  navLink: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "transparent",
    border: "none",
    color: "#94a3b8",
    padding: "0 16px",
    fontSize: "0.9rem",
    fontWeight: "500",
    cursor: "pointer",
    height: "100%",
    borderBottom: "2px solid transparent",
    transition: "all 0.2s",
    whiteSpace: "nowrap",
  },
  navLinkActive: {
    color: "white",
    fontWeight: "600",
    borderBottom: "2px solid var(--primary)",
    background: "rgba(255,255,255,0.03)",
  },

  // Secondary Tabs (Top Right)
  navLinkSmall: {
    background: "transparent",
    border: "none",
    color: "#64748b",
    padding: "6px 12px",
    fontSize: "0.85rem",
    fontWeight: "500",
    cursor: "pointer",
    borderRadius: "6px",
    transition: "all 0.2s",
  },
  navLinkActiveSmall: { color: "white", background: "#1e293b" },

  rightSection: { display: "flex", alignItems: "center", gap: "12px" },
  homeBtn: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#334155",
    color: "white",
    textDecoration: "none",
    padding: "8px 14px",
    borderRadius: "6px",
    fontSize: "0.85rem",
    fontWeight: "500",
    transition: "background 0.2s",
  },
  logoutBtnNav: {
    display: "flex",
    alignItems: "center",
    gap: "8px",
    background: "#b91c1c",
    border: "none",
    color: "white",
    padding: "8px 14px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "0.85rem",
    fontWeight: "600",
    transition: "background 0.2s",
  },
  mobileToggle: {
    background: "transparent",
    border: "none",
    cursor: "pointer",
    padding: "4px",
  },
  mobileMenu: {
    position: "absolute",
    top: "100%",
    left: 0,
    right: 0,
    background: "#1e293b",
    borderTop: "1px solid #334155",
    padding: "16px",
    display: "flex",
    flexDirection: "column",
    gap: "8px",
    boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
    zIndex: 100,
  },
  mobileNavLink: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
    width: "100%",
    padding: "12px",
    background: "transparent",
    border: "none",
    color: "#cbd5e1",
    textAlign: "left",
    fontSize: "1rem",
    fontWeight: "500",
    borderRadius: "8px",
    cursor: "pointer",
    textDecoration: "none",
  },
  mobileNavLinkActive: {
    background: "#334155",
    color: "white",
    fontWeight: "600",
  },
  mainContent: { padding: "24px", maxWidth: "1400px", margin: "0 auto" },
  contentCard: {
    background: "transparent",
    borderRadius: "0",
    boxShadow: "none",
    border: "none",
    minHeight: "500px",
    overflow: "visible",
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
};

// CSS Injection
const styleTag = document.createElement("style");
styleTag.innerHTML = `
  @media (min-width: 1024px) {
    .login-form-wrapper { flex: 0 0 500px !important; border-left: 1px solid #f1f5f9; }
    .mobile-menu-btn { display: none !important; }
  }
  @media (max-width: 1024px) {
    .desktop-nav { display: none !important; }
    .mobile-menu-btn { display: block !important; }
    .logout-text { display: none; }
    .logout-btn { padding: 8px !important; }
    .hide-mobile { display: none !important; }
    main { padding: 16px !important; }
  }
  @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
`;
document.head.appendChild(styleTag);
