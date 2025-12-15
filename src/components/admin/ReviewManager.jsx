import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { Trash2, Plus, Save, Star, User } from "lucide-react";

export default function ReviewManager() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch reviews on load
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

  // Add a blank review
  async function addReview() {
    const newReview = {
      name: "New Reviewer",
      role: "Verified Buyer",
      text: "Write review here...",
      rating: 5,
      avatar_url: "",
      is_active: true,
    };
    const { data, error } = await supabase
      .from("reviews")
      .insert(newReview)
      .select();
    if (data) setReviews([data[0], ...reviews]);
  }

  // Update a specific field for a review
  async function updateReview(id, field, value) {
    // 1. Update local state immediately for snappy UI
    const updatedReviews = reviews.map((r) =>
      r.id === id ? { ...r, [field]: value } : r
    );
    setReviews(updatedReviews);

    // 2. Save to DB
    await supabase
      .from("reviews")
      .update({ [field]: value })
      .eq("id", id);
  }

  // Delete review
  async function deleteReview(id) {
    if (!confirm("Are you sure you want to delete this review?")) return;

    setReviews(reviews.filter((r) => r.id !== id));
    await supabase.from("reviews").delete().eq("id", id);
  }

  if (loading) return <div>Loading reviews...</div>;

  return (
    <div style={{ maxWidth: "800px" }}>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          marginBottom: "20px",
        }}
      >
        <h2 style={{ margin: 0, color: "var(--medical-navy)" }}>
          Manage Reviews
        </h2>
        <button
          onClick={addReview}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 16px",
            background: "var(--primary)",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "600",
          }}
        >
          <Plus size={18} /> Add Review
        </button>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
        {reviews.map((review) => (
          <div
            key={review.id}
            style={{
              background: "white",
              padding: "20px",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 2px 5px rgba(0,0,0,0.05)",
            }}
          >
            {/* Header: Avatar, Name, Role */}
            <div
              style={{
                display: "flex",
                gap: "15px",
                marginBottom: "15px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ flex: 1, minWidth: "200px" }}>
                <label style={labelStyle}>Reviewer Name</label>
                <input
                  value={review.name}
                  onChange={(e) =>
                    updateReview(review.id, "name", e.target.value)
                  }
                  style={inputStyle}
                />
              </div>
              <div style={{ flex: 1, minWidth: "200px" }}>
                <label style={labelStyle}>Role / Badge</label>
                <input
                  value={review.role}
                  onChange={(e) =>
                    updateReview(review.id, "role", e.target.value)
                  }
                  style={inputStyle}
                />
              </div>
              <div style={{ width: "80px" }}>
                <label style={labelStyle}>Rating</label>
                <input
                  type="number"
                  max="5"
                  min="1"
                  value={review.rating}
                  onChange={(e) =>
                    updateReview(review.id, "rating", parseInt(e.target.value))
                  }
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Avatar URL */}
            <div style={{ marginBottom: "15px" }}>
              <label style={labelStyle}>Profile Photo URL (Optional)</label>
              <div
                style={{ display: "flex", gap: "10px", alignItems: "center" }}
              >
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "50%",
                    background: "#f0fdfa",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    border: "1px solid #ddd",
                  }}
                >
                  {review.avatar_url ? (
                    <img
                      src={review.avatar_url}
                      style={{
                        width: "100%",
                        height: "100%",
                        objectFit: "cover",
                      }}
                    />
                  ) : (
                    <User size={20} color="#0d9488" />
                  )}
                </div>
                <input
                  placeholder="https://..."
                  value={review.avatar_url || ""}
                  onChange={(e) =>
                    updateReview(review.id, "avatar_url", e.target.value)
                  }
                  style={{ ...inputStyle, flex: 1 }}
                />
              </div>
              <small style={{ color: "#94a3b8" }}>
                Tip: Right click a photo on Google -> "Copy Image Address" and
                paste here.
              </small>
            </div>

            {/* Review Text */}
            <div style={{ marginBottom: "15px" }}>
              <label style={labelStyle}>Review Content</label>
              <textarea
                rows={3}
                value={review.text}
                onChange={(e) =>
                  updateReview(review.id, "text", e.target.value)
                }
                style={textareaStyle}
              />
            </div>

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => deleteReview(review.id)}
                style={{
                  color: "#ef4444",
                  background: "#fef2f2",
                  border: "none",
                  padding: "8px 12px",
                  borderRadius: "6px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontWeight: "600",
                }}
              >
                <Trash2 size={16} /> Delete
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
  fontSize: "0.85rem",
  color: "#64748b",
  marginBottom: "5px",
  fontWeight: "500",
};
const inputStyle = {
  width: "100%",
  padding: "10px",
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
