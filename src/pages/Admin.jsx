import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { Package, FileText, LogOut, Lock, ShoppingBag } from "lucide-react";
import ProductManager from "../components/admin/ProductManager";
import ContentEditor from "../components/admin/ContentEditor";
import OrderManager from "../components/admin/OrderManager";

export default function Admin() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("orders"); // Default to Orders for quick access

  // Login State
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

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
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) alert(error.message);
  };

  const handleLogout = () => supabase.auth.signOut();

  if (loading)
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        Loading...
      </div>
    );

  if (!session) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          marginTop: "100px",
        }}
      >
        <div
          style={{
            background: "white",
            padding: "40px",
            borderRadius: "16px",
            boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
            maxWidth: "400px",
            width: "100%",
            textAlign: "center",
          }}
        >
          <div
            style={{
              background: "#f1f5f9",
              width: "60px",
              height: "60px",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 20px",
            }}
          >
            <Lock size={30} color="var(--medical-navy)" />
          </div>
          <h2 style={{ marginBottom: "20px" }}>Admin Login</h2>
          <form
            onSubmit={handleLogin}
            style={{ display: "flex", flexDirection: "column", gap: "15px" }}
          >
            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
              }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                padding: "12px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
              }}
            />
            <button
              style={{
                padding: "12px",
                background: "var(--primary)",
                color: "white",
                border: "none",
                borderRadius: "8px",
                fontWeight: "bold",
                cursor: "pointer",
              }}
            >
              Sign In
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div
      className="container"
      style={{ padding: "40px 24px", minHeight: "100vh" }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "40px",
        }}
      >
        <h1 style={{ margin: 0 }}>Dashboard</h1>
        <button
          onClick={handleLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 16px",
            background: "#f1f5f9",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          <LogOut size={18} /> Sign Out
        </button>
      </div>

      {/* TABS */}
      <div
        style={{
          display: "flex",
          gap: "20px",
          marginBottom: "30px",
          borderBottom: "1px solid #e2e8f0",
          overflowX: "auto",
        }}
      >
        <TabButton
          active={activeTab === "orders"}
          onClick={() => setActiveTab("orders")}
          icon={<ShoppingBag size={18} />}
          label="Orders"
        />
        <TabButton
          active={activeTab === "products"}
          onClick={() => setActiveTab("products")}
          icon={<Package size={18} />}
          label="Inventory"
        />
        <TabButton
          active={activeTab === "content"}
          onClick={() => setActiveTab("content")}
          icon={<FileText size={18} />}
          label="Site Content"
        />
      </div>

      {/* CONTENT AREA */}
      <div>
        {activeTab === "orders" && <OrderManager />}
        {activeTab === "products" && <ProductManager />}
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
        fontSize: "1rem",
        whiteSpace: "nowrap",
      }}
    >
      {icon} {label}
    </button>
  );
}
