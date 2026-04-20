import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Mail, Trash2, CheckCircle, Clock } from "lucide-react";

export default function InquiryManager() {
  const [inquiries, setInquiries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchInquiries();
  }, []);

  async function fetchInquiries() {
    const { data } = await supabase
      .from("inquiries")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setInquiries(data);
    setLoading(false);
  }

  const markAsRead = async (id, currentStatus) => {
    const newStatus = currentStatus === "unread" ? "read" : "unread";

    // Optimistic Update
    setInquiries(
      inquiries.map((i) => (i.id === id ? { ...i, status: newStatus } : i))
    );

    await supabase.from("inquiries").update({ status: newStatus }).eq("id", id);
  };

  const deleteInquiry = async (id) => {
    if (!confirm("Delete this inquiry?")) return;
    setInquiries(inquiries.filter((i) => i.id !== id));
    await supabase.from("inquiries").delete().eq("id", id);
  };

  if (loading) return <div>Loading inquiries...</div>;

  return (
    <div style={{ maxWidth: "800px" }}>
      <h2 style={{ marginBottom: "20px", color: "var(--medical-navy)" }}>
        Customer Inquiries
      </h2>

      {inquiries.length === 0 ? (
        <div
          style={{
            padding: "40px",
            textAlign: "center",
            color: "var(--text-muted)",
            background: "#f8fafc",
            borderRadius: "12px",
          }}
        >
          No inquiries yet.
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          {inquiries.map((item) => (
            <div
              key={item.id}
              style={{
                background: "white",
                padding: "24px",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                borderLeft:
                  item.status === "unread"
                    ? "4px solid var(--primary)"
                    : "1px solid #e2e8f0",
                opacity: item.status === "read" ? 0.7 : 1,
                transition: "all 0.2s",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  marginBottom: "16px",
                }}
              >
                <div>
                  <h4
                    style={{
                      margin: "0 0 4px 0",
                      fontSize: "1.1rem",
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                    }}
                  >
                    {item.subject || "No Subject"}
                    {item.status === "unread" && (
                      <span
                        style={{
                          fontSize: "0.7rem",
                          background: "#fee2e2",
                          color: "#ef4444",
                          padding: "2px 8px",
                          borderRadius: "20px",
                        }}
                      >
                        NEW
                      </span>
                    )}
                  </h4>
                  <div
                    style={{
                      fontSize: "0.9rem",
                      color: "var(--text-muted)",
                      display: "flex",
                      gap: "15px",
                    }}
                  >
                    <span>{item.name}</span>
                    <span>&bull;</span>
                    <a
                      href={`mailto:${item.email}`}
                      style={{ color: "var(--primary)" }}
                    >
                      {item.email}
                    </a>
                    <span>&bull;</span>
                    <span>
                      {new Date(item.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={() => markAsRead(item.id, item.status)}
                    title={
                      item.status === "unread"
                        ? "Mark as Read"
                        : "Mark as Unread"
                    }
                    style={{
                      background: "#f1f5f9",
                      border: "none",
                      padding: "8px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      color: "#64748b",
                    }}
                  >
                    {item.status === "unread" ? (
                      <CheckCircle size={18} />
                    ) : (
                      <Clock size={18} />
                    )}
                  </button>
                  <button
                    onClick={() => deleteInquiry(item.id)}
                    title="Delete"
                    style={{
                      background: "#fef2f2",
                      border: "none",
                      padding: "8px",
                      borderRadius: "6px",
                      cursor: "pointer",
                      color: "#ef4444",
                    }}
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div
                style={{
                  background: "#f8fafc",
                  padding: "16px",
                  borderRadius: "8px",
                  color: "var(--text-main)",
                  lineHeight: "1.6",
                  fontSize: "0.95rem",
                }}
              >
                {item.message}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
