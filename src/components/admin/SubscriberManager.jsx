import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Copy, Check, Users } from "lucide-react";

export default function SubscriberManager() {
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(null);

  useEffect(() => {
    fetchSubscribers();
  }, []);

  async function fetchSubscribers() {
    const { data } = await supabase
      .from("subscribers")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setSubscribers(data);
    setLoading(false);
  }

  const copyToClipboard = (email) => {
    navigator.clipboard.writeText(email);
    setCopied(email);
    setTimeout(() => setCopied(null), 2000);
  };

  const copyAllEmails = () => {
    const allEmails = subscribers.map((s) => s.email).join(", ");
    navigator.clipboard.writeText(allEmails);
    alert(
      "All emails copied to clipboard! You can paste them into the BCC field of your email client."
    );
  };

  if (loading) return <div style={{ padding: "20px" }}>Loading list...</div>;

  return (
    <div style={{ maxWidth: "1000px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "20px",
        }}
      >
        <h2
          style={{
            margin: 0,
            color: "var(--medical-navy)",
            display: "flex",
            alignItems: "center",
            gap: "10px",
          }}
        >
          <Users size={24} /> Newsletter Subscribers
        </h2>
        {subscribers.length > 0 && (
          <button
            onClick={copyAllEmails}
            className="buy-btn"
            style={{ padding: "10px 20px", fontSize: "0.9rem" }}
          >
            Copy All Emails
          </button>
        )}
      </div>

      <div
        style={{
          background: "white",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
          boxShadow: "var(--shadow-sm)",
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            textAlign: "left",
          }}
        >
          <thead
            style={{ background: "#f8fafc", borderBottom: "1px solid #e2e8f0" }}
          >
            <tr>
              <th style={thStyle}>Date Joined</th>
              <th style={thStyle}>Name</th>
              <th style={thStyle}>Email</th>
              <th style={thStyle}>Action</th>
            </tr>
          </thead>
          <tbody>
            {subscribers.length === 0 ? (
              <tr>
                <td
                  colSpan="4"
                  style={{
                    padding: "40px",
                    textAlign: "center",
                    color: "#94a3b8",
                  }}
                >
                  No subscribers yet.
                </td>
              </tr>
            ) : (
              subscribers.map((sub) => (
                <tr key={sub.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={tdStyle}>
                    {new Date(sub.created_at).toLocaleDateString()}
                  </td>
                  <td
                    style={{
                      ...tdStyle,
                      fontWeight: "500",
                      color: "var(--medical-navy)",
                    }}
                  >
                    {sub.name}
                  </td>
                  <td style={tdStyle}>{sub.email}</td>
                  <td style={tdStyle}>
                    <button
                      onClick={() => copyToClipboard(sub.email)}
                      style={{
                        background: copied === sub.email ? "#ecfdf5" : "white",
                        border: "1px solid #e2e8f0",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        color: copied === sub.email ? "#10b981" : "#64748b",
                        fontSize: "0.8rem",
                        padding: "6px 12px",
                        borderRadius: "6px",
                        transition: "all 0.2s",
                      }}
                    >
                      {copied === sub.email ? (
                        <Check size={14} />
                      ) : (
                        <Copy size={14} />
                      )}
                      {copied === sub.email ? "Copied" : "Copy"}
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const thStyle = {
  padding: "16px 24px",
  fontSize: "0.85rem",
  fontWeight: "600",
  color: "#64748b",
  textTransform: "uppercase",
  letterSpacing: "0.05em",
};
const tdStyle = { padding: "16px 24px", fontSize: "0.95rem", color: "#334155" };
