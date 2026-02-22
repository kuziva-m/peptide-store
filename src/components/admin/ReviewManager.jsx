import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import {
  Trash2,
  Plus,
  Save,
  Star,
  User,
  Mail,
  CheckCircle,
  XCircle,
} from "lucide-react";

export default function ReviewManager() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReviews();
  }, []);

  async function fetchReviews() {
    const { data } = await supabase
      .from("reviews")
      .select("*")
      .order("created_at", { ascending: false });
    if (data) setReviews(data);
    setLoading(false);
  }

  // Toggle Active Status (Approve/Reject)
  async function toggleActive(id, currentStatus) {
    const newStatus = !currentStatus;
    setReviews(
      reviews.map((r) => (r.id === id ? { ...r, is_active: newStatus } : r))
    );
    await supabase
      .from("reviews")
      .update({ is_active: newStatus })
      .eq("id", id);
  }

  async function updateReview(id, field, value) {
    setReviews(
      reviews.map((r) => (r.id === id ? { ...r, [field]: value } : r))
    );
    await supabase
      .from("reviews")
      .update({ [field]: value })
      .eq("id", id);
  }

  async function deleteReview(id) {
    if (!confirm("Delete this review?")) return;
    setReviews(reviews.filter((r) => r.id !== id));
    await supabase.from("reviews").delete().eq("id", id);
  }

  if (loading) return <div>Loading reviews...</div>;

  return (
    <div style={{ maxWidth: "800px" }}>
      <h2 style={{ marginBottom: "20px", color: "var(--medical-navy)" }}>
        Manage Reviews
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {reviews.map((review) => (
          <div
            key={review.id}
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              opacity: review.is_active ? 1 : 0.7,
              borderLeft: review.is_active
                ? "4px solid #10b981"
                : "4px solid #cbd5e1",
            }}
          >
            {/* Top Bar: Status & Rating */}
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "15px",
              }}
            >
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <span
                  style={{
                    fontSize: "0.8rem",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    color: review.is_active ? "#10b981" : "#94a3b8",
                    background: review.is_active ? "#ecfdf5" : "#f1f5f9",
                    padding: "4px 8px",
                    borderRadius: "4px",
                  }}
                >
                  {review.is_active ? "Published" : "Pending"}
                </span>
                <input
                  type="number"
                  max="5"
                  min="1"
                  value={review.rating}
                  onChange={(e) =>
                    updateReview(review.id, "rating", parseInt(e.target.value))
                  }
                  style={{
                    width: "60px",
                    padding: "6px",
                    borderRadius: "6px",
                    border: "1px solid #ddd",
                  }}
                />
                <Star size={16} fill="#fbbf24" color="#fbbf24" />
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  onClick={() => toggleActive(review.id, review.is_active)}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: review.is_active ? "#f59e0b" : "#10b981",
                    fontWeight: "600",
                    fontSize: "0.9rem",
                  }}
                >
                  {review.is_active ? "Unpublish" : "Approve"}
                </button>
              </div>
            </div>

            {/* Title & Review */}
            <div style={{ marginBottom: "15px" }}>
              <input
                placeholder="Review Title"
                value={review.title || ""}
                onChange={(e) =>
                  updateReview(review.id, "title", e.target.value)
                }
                style={{
                  ...inputStyle,
                  fontWeight: "700",
                  marginBottom: "10px",
                }}
              />
              <textarea
                rows={3}
                value={review.text}
                onChange={(e) =>
                  updateReview(review.id, "text", e.target.value)
                }
                style={textareaStyle}
              />
            </div>

            {/* Author Details */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "15px",
                alignItems: "end",
              }}
            >
              <div>
                <label style={labelStyle}>Reviewer Name</label>
                <input
                  value={review.name}
                  onChange={(e) =>
                    updateReview(review.id, "name", e.target.value)
                  }
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Email (Private)</label>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                    color: "#64748b",
                    fontSize: "0.9rem",
                    padding: "10px",
                    background: "#f8fafc",
                    borderRadius: "6px",
                    border: "1px solid #e2e8f0",
                  }}
                >
                  <Mail size={16} /> {review.email || "No email"}
                </div>
              </div>
            </div>

            {/* Delete */}
            <div style={{ marginTop: "15px", textAlign: "right" }}>
              <button
                onClick={() => deleteReview(review.id)}
                style={{
                  color: "#ef4444",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <Trash2 size={16} /> Delete Review
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  fontSize: "0.8rem",
  color: "#64748b",
  marginBottom: "4px",
  fontWeight: "600",
};
const inputStyle = {
  width: "100%",
  padding: "8px 12px",
  borderRadius: "6px",
  border: "1px solid #cbd5e1",
  fontSize: "0.95rem",
};
const textareaStyle = {
  width: "100%",
  padding: "10px",
  borderRadius: "6px",
  border: "1px solid #cbd5e1",
  fontSize: "0.95rem",
  resize: "vertical",
  fontFamily: "inherit",
};
