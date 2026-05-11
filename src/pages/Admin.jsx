import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  Package,
  FileText,
  LogOut,
  ShoppingBag,
  MessageSquare,
  Users,
  Atom,
  ArrowRight,
  Lock,
  Tag,
  Settings,
  Menu,
  X,
  Mail,
  Home,
  Star,
  Globe,
  Ticket,
  BarChart,
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
import CreatorManager from "../components/admin/CreatorManager";
import SeoLandingManager from "../components/admin/SeoLandingManager";
import VoucherManager from "../components/admin/VoucherManager";
import AnalysisBoard from "../components/admin/analysis/AnalysisBoard";

const PRIMARY_MENU = [
  { id: "analysis", label: "Analysis Board", icon: BarChart },
  { id: "orders", label: "Orders", icon: ShoppingBag },
  { id: "products", label: "Inventory", icon: Package },
  { id: "creators", label: "Creators", icon: Star },
  { id: "discounts", label: "Codes", icon: Tag },
  { id: "vouchers", label: "Vouchers", icon: Ticket },
  { id: "subscribers", label: "Users", icon: Users },
  { id: "inquiries", label: "Inbox", icon: Mail },
];

const SECONDARY_MENU = [
  { id: "reviews", label: "Reviews", icon: MessageSquare },
  { id: "content", label: "Content", icon: FileText },
  { id: "seo_pages", label: "SEO Pages", icon: Globe },
  { id: "settings", label: "Settings", icon: Settings },
];

export default function Admin() {
  const [session, setSession] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState("orders");
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  const verifyAdminAccess = useCallback(
    async (currentSession, options = {}) => {
      const { showLoader = false, keepError = false } = options;

      if (showLoader) setLoading(true);

      if (!currentSession?.user) {
        setSession(null);
        setIsAdmin(false);
        if (!keepError) setAuthError("");
        setLoading(false);
        return false;
      }

      const { data, error } = await supabase.rpc("is_admin");

      if (error || data !== true) {
        await supabase.auth.signOut();

        setSession(null);
        setIsAdmin(false);
        setAuthError(
          "Access denied. This account is not authorised for admin access.",
        );
        setLoading(false);
        return false;
      }

      setSession(currentSession);
      setIsAdmin(true);
      setAuthError("");
      setLoading(false);
      return true;
    },
    [],
  );

  useEffect(() => {
    let mounted = true;

    const loadSession = async () => {
      const {
        data: { session: currentSession },
      } = await supabase.auth.getSession();

      if (!mounted) return;

      await verifyAdminAccess(currentSession, {
        showLoader: true,
      });
    };

    loadSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      if (!mounted) return;

      await verifyAdminAccess(currentSession, {
        showLoader: false,
        keepError: true,
      });
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [verifyAdminAccess]);

  const handleLogin = async (e) => {
    e.preventDefault();

    setAuthLoading(true);
    setAuthError("");

    const cleanEmail = email.trim().toLowerCase();

    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    setPassword("");
    setAuthLoading(false);

    if (error) {
      setAuthError("Invalid email or password.");
      return;
    }

    await verifyAdminAccess(data.session, {
      showLoader: true,
      keepError: true,
    });
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();

    setSession(null);
    setIsAdmin(false);
    setEmail("");
    setPassword("");
    setAuthError("");
    setMobileMenuOpen(false);
  };

  if (loading) {
    return (
      <div style={styles.centerScreen}>
        <Atom size={48} className="spin-anim" color="var(--primary)" />
      </div>
    );
  }

  if (!session || !isAdmin) {
    return (
      <div style={styles.loginContainer}>
        <div className="admin-login-banner" style={styles.loginBanner}>
          <div style={styles.bannerOverlay}>
            <div className="admin-login-logo-area" style={styles.logoArea}>
              <Atom size={40} color="white" className="spin-anim" />
              <h1 style={{ color: "white", margin: 0 }}>Melbourne Peptides</h1>
            </div>

            <div className="admin-login-banner-text" style={styles.bannerText}>
              <h2
                style={{
                  color: "white",
                  fontSize: "2rem",
                  marginBottom: "1rem",
                }}
              >
                Admin Portal
              </h2>
              <p
                style={{
                  color: "rgba(255,255,255,0.8)",
                  fontSize: "1.1rem",
                }}
              >
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

        <div className="login-form-wrapper" style={styles.loginFormWrapper}>
          <div className="admin-login-card" style={styles.loginCard}>
            <div style={styles.formHeader}>
              <div style={styles.iconCircle}>
                <Lock size={24} color="var(--primary)" />
              </div>
              <h3>Welcome Back</h3>
              <p style={{ color: "#64748b" }}>
                Please enter your details to sign in.
              </p>
            </div>

            {authError && <div style={styles.errorBox}>{authError}</div>}

            <form
              onSubmit={handleLogin}
              style={styles.form}
              autoComplete="off"
              noValidate={false}
            >
              <div style={styles.inputGroup}>
                <label style={styles.label} htmlFor="admin-email">
                  Email Address
                </label>
                <input
                  id="admin-email"
                  name="admin_email_field"
                  type="email"
                  required
                  placeholder=""
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={styles.input}
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                  inputMode="email"
                />
              </div>

              <div style={styles.inputGroup}>
                <label style={styles.label} htmlFor="admin-password">
                  Password
                </label>
                <input
                  id="admin-password"
                  name="admin_password_field"
                  type="password"
                  required
                  placeholder=""
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={styles.input}
                  autoComplete="new-password"
                  autoCorrect="off"
                  autoCapitalize="none"
                  spellCheck={false}
                />
              </div>

              <button
                type="submit"
                disabled={authLoading}
                style={{
                  ...styles.submitBtn,
                  opacity: authLoading ? 0.7 : 1,
                  cursor: authLoading ? "not-allowed" : "pointer",
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

          <div className="admin-login-footer" style={styles.footer}>
            &copy; {new Date().getFullYear()} Melbourne Peptides. Secure System.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc" }}>
      <nav style={styles.navbar}>
        <div style={styles.topRow}>
          <div style={styles.logoSection}>
            <Atom size={24} color="white" className="spin-anim" />
            <span style={styles.navTitle}>Admin Panel</span>
          </div>

          <div style={styles.rightSection}>
            <div
              className="hide-mobile"
              style={{ display: "flex", gap: "4px", marginRight: "16px" }}
            >
              {SECONDARY_MENU.map((item) => (
                <button
                  key={item.id}
                  type="button"
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
              type="button"
              onClick={handleLogout}
              className="logout-btn"
              style={styles.logoutBtnNav}
              title="Sign Out"
            >
              <LogOut size={18} />
            </button>

            <button
              type="button"
              className="mobile-menu-btn"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              style={styles.mobileToggle}
              aria-label="Toggle admin menu"
            >
              {isMobileMenuOpen ? (
                <X size={24} color="white" />
              ) : (
                <Menu size={24} color="white" />
              )}
            </button>
          </div>
        </div>

        <div className="desktop-nav" style={styles.bottomRow}>
          {PRIMARY_MENU.map((item) => (
            <button
              key={item.id}
              type="button"
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

        {isMobileMenuOpen && (
          <div style={styles.mobileMenu}>
            <Link to="/" style={styles.mobileNavLink}>
              <Home size={18} /> Back to Website
            </Link>

            <div
              style={{ borderBottom: "1px solid #334155", margin: "4px 0" }}
            />

            {[...PRIMARY_MENU, ...SECONDARY_MENU].map((item) => (
              <button
                key={item.id}
                type="button"
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

      <main style={styles.mainContent}>
        <div style={styles.contentCard}>
          {activeTab === "analysis" && <AnalysisBoard />}
          {activeTab === "orders" && <OrderManager />}
          {activeTab === "creators" && <CreatorManager />}
          {activeTab === "inquiries" && <InquiryManager />}
          {activeTab === "subscribers" && <SubscriberManager />}
          {activeTab === "products" && <ProductManager />}
          {activeTab === "discounts" && <DiscountManager />}
          {activeTab === "vouchers" && <VoucherManager />}
          {activeTab === "reviews" && <ReviewManager />}
          {activeTab === "content" && <ContentEditor />}
          {activeTab === "seo_pages" && <SeoLandingManager />}
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
  navTitle: {
    letterSpacing: "0.5px",
  },

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
  navLinkActiveSmall: {
    color: "white",
    background: "#1e293b",
  },

  rightSection: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
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

  mainContent: {
    padding: "24px",
    maxWidth: "1400px",
    margin: "0 auto",
  },
  contentCard: {
    background: "transparent",
    borderRadius: "0",
    boxShadow: "none",
    border: "none",
    minHeight: "500px",
    overflow: "visible",
  },

  loginContainer: {
    display: "flex",
    minHeight: "100vh",
    background: "#0f172a",
    position: "relative",
    overflow: "hidden",
  },
  loginBanner: {
    flex: 1,
    position: "absolute",
    inset: 0,
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    minHeight: "100vh",
    overflow: "hidden",
  },
  bannerImage: {
    position: "absolute",
    inset: 0,
    width: "100%",
    height: "100%",
    objectFit: "cover",
    objectPosition: "center",
  },
  bannerOverlay: {
    position: "absolute",
    inset: 0,
    background:
      "linear-gradient(180deg, rgba(15, 23, 42, 0.78) 0%, rgba(15, 23, 42, 0.88) 42%, rgba(15, 23, 42, 0.96) 100%)",
    padding: "28px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "space-between",
    zIndex: 1,
  },
  logoArea: {
    display: "flex",
    alignItems: "center",
    gap: "16px",
  },
  bannerText: {
    maxWidth: "500px",
  },
  loginFormWrapper: {
    position: "relative",
    zIndex: 3,
    flex: "1 1 auto",
    width: "100%",
    minHeight: "100vh",
    padding: "24px",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
    alignItems: "center",
    background: "transparent",
  },
  loginCard: {
    width: "100%",
    maxWidth: "420px",
    background: "rgba(255, 255, 255, 0.94)",
    border: "1px solid rgba(255, 255, 255, 0.72)",
    borderRadius: "22px",
    padding: "28px",
    boxShadow:
      "0 28px 80px rgba(2, 6, 23, 0.42), inset 0 1px 0 rgba(255,255,255,0.65)",
    backdropFilter: "blur(18px)",
  },
  formHeader: {
    marginBottom: "28px",
    textAlign: "center",
  },
  iconCircle: {
    width: "50px",
    height: "50px",
    borderRadius: "14px",
    background: "rgba(70, 53, 222, 0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    margin: "0 auto 20px",
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  inputGroup: {
    display: "flex",
    flexDirection: "column",
    gap: "8px",
  },
  label: {
    fontSize: "0.9rem",
    fontWeight: "700",
    color: "#0f172a",
  },
  input: {
    padding: "13px 16px",
    borderRadius: "10px",
    border: "1px solid #cbd5e1",
    fontSize: "1rem",
    transition: "border-color 0.2s, box-shadow 0.2s",
    outline: "none",
    background: "white",
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
    borderRadius: "10px",
    fontWeight: "700",
    fontSize: "1rem",
    cursor: "pointer",
    transition: "background 0.2s",
    boxShadow: "0 12px 24px rgba(70, 53, 222, 0.24)",
  },
  errorBox: {
    background: "#fee2e2",
    color: "#991b1b",
    padding: "12px 14px",
    borderRadius: "10px",
    fontSize: "0.9rem",
    fontWeight: 600,
    marginBottom: "16px",
    border: "1px solid #fecaca",
  },
  footer: {
    marginTop: "28px",
    fontSize: "0.85rem",
    color: "rgba(255,255,255,0.72)",
    textAlign: "center",
    textShadow: "0 1px 2px rgba(0,0,0,0.28)",
  },
};

// CSS Injection - protected from duplicate injection during Vite hot reloads
const ADMIN_STYLE_TAG_ID = "melbourne-peptides-admin-styles";

if (typeof document !== "undefined") {
  let styleTag = document.getElementById(ADMIN_STYLE_TAG_ID);

  if (!styleTag) {
    styleTag = document.createElement("style");
    styleTag.id = ADMIN_STYLE_TAG_ID;
    document.head.appendChild(styleTag);
  }

  styleTag.innerHTML = `
    @media (min-width: 1024px) {
      .admin-login-banner {
        position: relative !important;
        inset: auto !important;
        display: flex !important;
        min-height: 100vh !important;
      }

      .login-form-wrapper {
        flex: 0 0 500px !important;
        max-width: 500px !important;
        background: #ffffff !important;
        border-left: 1px solid #f1f5f9;
        padding: 40px !important;
      }

      .admin-login-card {
        background: transparent !important;
        border: none !important;
        border-radius: 0 !important;
        padding: 0 !important;
        box-shadow: none !important;
        backdrop-filter: none !important;
      }

      .admin-login-footer {
        color: #94a3b8 !important;
        text-shadow: none !important;
      }

      .mobile-menu-btn {
        display: none !important;
      }
    }

    @media (max-width: 1024px) {
      .desktop-nav {
        display: none !important;
      }

      .mobile-menu-btn {
        display: block !important;
      }

      .logout-text {
        display: none;
      }

      .logout-btn {
        padding: 8px !important;
      }

      .hide-mobile {
        display: none !important;
      }

      main {
        padding: 16px !important;
      }
    }

    @media (max-width: 768px) {
      .admin-login-banner {
        display: flex !important;
        position: absolute !important;
        inset: 0 !important;
        min-height: 100svh !important;
      }

      .admin-login-logo-area {
        transform: scale(0.86);
        transform-origin: left top;
      }

      .admin-login-logo-area h1 {
        font-size: 1.15rem !important;
        line-height: 1.2;
      }

      .admin-login-banner-text {
        display: block !important;
        max-width: 320px !important;
        margin-bottom: 22px;
      }

      .admin-login-banner-text h2 {
        font-size: 1.55rem !important;
        margin-bottom: 0.5rem !important;
        letter-spacing: -0.03em;
      }

      .admin-login-banner-text p {
        font-size: 0.92rem !important;
        line-height: 1.45 !important;
        color: rgba(255,255,255,0.76) !important;
      }

      .login-form-wrapper {
        min-height: 100svh !important;
        justify-content: flex-end !important;
        padding: 22px !important;
        padding-top: 96px !important;
        padding-bottom: max(22px, env(safe-area-inset-bottom)) !important;
      }

      .admin-login-card {
        max-width: 100% !important;
        padding: 24px !important;
        border-radius: 22px !important;
        animation: mobileLoginLift 420ms ease both;
      }

      .admin-login-card h3 {
        margin-top: 0;
        margin-bottom: 6px;
        font-size: 1.35rem;
        letter-spacing: -0.02em;
      }

      .admin-login-card input {
        min-height: 46px;
      }

      .admin-login-card button[type="submit"] {
        min-height: 48px;
      }

      .admin-login-footer {
        margin-top: 18px !important;
        font-size: 0.76rem !important;
      }
    }

    @media (max-width: 420px) {
      .admin-login-banner-text {
        max-width: 280px !important;
        margin-bottom: 18px;
      }

      .admin-login-banner-text h2 {
        font-size: 1.35rem !important;
      }

      .admin-login-banner-text p {
        font-size: 0.85rem !important;
      }

      .login-form-wrapper {
        padding-left: 16px !important;
        padding-right: 16px !important;
        padding-top: 88px !important;
      }

      .admin-login-card {
        padding: 20px !important;
        border-radius: 20px !important;
      }
    }

    @media (max-height: 720px) and (max-width: 768px) {
      .admin-login-logo-area {
        display: none !important;
      }

      .admin-login-banner-text {
        display: none !important;
      }

      .login-form-wrapper {
        justify-content: center !important;
        padding-top: 22px !important;
      }
    }

    @keyframes mobileLoginLift {
      from {
        opacity: 0;
        transform: translateY(18px) scale(0.98);
      }

      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @keyframes fadeIn {
      from {
        opacity: 0;
        transform: translateY(10px);
      }

      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
  `;
}
