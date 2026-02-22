import { useState } from "react";
import { supabase } from "../lib/supabase";
import { Star, Send, CheckCircle, Loader } from "lucide-react";
import { Link } from "react-router-dom";

export default function WriteReview() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hoveredStar, setHoveredStar] = useState(0);

  const [formData, setFormData] = useState({
    rating: 5,
    title: "",
    text: "",
    name: "",
    email: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("reviews").insert([
        {
          ...formData,
          role: "Verified Buyer", // Set a default since we removed the dropdown
          is_active: false, // Pending approval
        },
      ]);

      if (error) throw error;
      setSuccess(true);
    } catch (error) {
      alert("Error submitting review: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="container"
      style={{ padding: "80px 24px", maxWidth: "700px" }}
    >
      <div style={{ textAlign: "center", marginBottom: "40px" }}>
        <h1 style={{ color: "var(--medical-navy)", marginBottom: "10px" }}>
          Write a Review
        </h1>
        <p style={{ color: "var(--text-muted)" }}>
          Share your research findings and experience.
        </p>
      </div>

      <div
        style={{
          background: "white",
          padding: "40px",
          borderRadius: "16px",
          border: "1px solid var(--border)",
          boxShadow: "var(--shadow-md)",
        }}
      >
        {success ? (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <CheckCircle
              size={64}
              color="#10b981"
              style={{ margin: "0 auto 20px" }}
            />
            <h3 style={{ color: "var(--medical-navy)", marginBottom: "10px" }}>
              Review Submitted!
            </h3>
            <p
              style={{
                color: "var(--text-muted)",
                maxWidth: "400px",
                margin: "0 auto 30px",
              }}
            >
              Thank you for your feedback. Your review has been sent for
              moderation and will appear on the site shortly.
            </p>
            <Link to="/" className="buy-btn">
              Return Home
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "24px" }}
          >
            {/* 1. Star Selection */}
            <div style={{ textAlign: "center", marginBottom: "10px" }}>
              <label
                style={{
                  display: "block",
                  marginBottom: "10px",
                  fontWeight: "600",
                  color: "var(--medical-navy)",
                }}
              >
                Overall Rating
              </label>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: "8px",
                  cursor: "pointer",
                }}
              >
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={32}
                    fill={
                      star <= (hoveredStar || formData.rating)
                        ? "#fbbf24"
                        : "none"
                    }
                    color={
                      star <= (hoveredStar || formData.rating)
                        ? "#fbbf24"
                        : "#cbd5e1"
                    }
                    onMouseEnter={() => setHoveredStar(star)}
                    onMouseLeave={() => setHoveredStar(0)}
                    onClick={() => setFormData({ ...formData, rating: star })}
                    style={{ transition: "all 0.1s" }}
                  />
                ))}
              </div>
            </div>

            {/* 2. Review Title */}
            <div>
              <label style={labelStyle}>Review Title</label>
              <input
                required
                type="text"
                placeholder="e.g. Excellent Purity and Fast Shipping"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
                style={inputStyle}
              />
            </div>

            {/* 3. Review Description */}
            <div>
              <label style={labelStyle}>Review Description</label>
              <textarea
                required
                rows="5"
                placeholder="Describe your experience with our products..."
                value={formData.text}
                onChange={(e) =>
                  setFormData({ ...formData, text: e.target.value })
                }
                style={{
                  ...inputStyle,
                  resize: "vertical",
                  fontFamily: "inherit",
                }}
              ></textarea>
            </div>

            {/* 4. Name & Email (Grid) */}
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: "20px",
              }}
            >
              <div>
                <label style={labelStyle}>Name</label>
                <input
                  required
                  type="text"
                  placeholder="e.g. John Doe"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  style={inputStyle}
                />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input
                  required
                  type="email"
                  placeholder="john@example.com"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  style={inputStyle}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="buy-btn"
              style={{
                width: "100%",
                padding: "16px",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "10px",
                fontSize: "1.1rem",
                marginTop: "10px",
              }}
            >
              {loading ? (
                <Loader className="spin-anim" />
              ) : (
                <>
                  <Send size={18} /> Submit Review
                </>
              )}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  fontWeight: "500",
  color: "#64748b",
  fontSize: "0.9rem",
};
const inputStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid var(--border)",
  fontSize: "1rem",
  outline: "none",
};
