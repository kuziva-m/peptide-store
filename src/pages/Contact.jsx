import { useState } from "react";
import { supabase } from "../lib/supabase";
import { Mail, Phone, MapPin, Send, Loader, CheckCircle } from "lucide-react";

export default function Contact() {
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.from("inquiries").insert([formData]);
      if (error) throw error;
      setSuccess(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
    } catch (error) {
      alert("Error sending message: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="container"
      style={{ padding: "80px 24px", maxWidth: "900px" }}
    >
      <h1
        style={{
          fontSize: "2.5rem",
          marginBottom: "20px",
          color: "var(--medical-navy)",
          textAlign: "center",
        }}
      >
        Contact Us
      </h1>
      <p
        style={{
          color: "var(--text-muted)",
          marginBottom: "50px",
          textAlign: "center",
          fontSize: "1.1rem",
        }}
      >
        For research inquiries, bulk orders, or technical support.
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1.5fr",
          gap: "50px",
          alignItems: "start",
        }}
      >
        {/* Left: Info */}
        <div
          style={{
            background: "white",
            padding: "30px",
            borderRadius: "16px",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-sm)",
          }}
        >
          <h3 style={{ marginBottom: "20px", color: "var(--medical-navy)" }}>
            Get in Touch
          </h3>

          <div
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
              <div
                style={{
                  background: "#eff6ff",
                  padding: "10px",
                  borderRadius: "50%",
                }}
              >
                <Mail size={20} color="#3b82f6" />
              </div>
              <div>
                <strong
                  style={{
                    display: "block",
                    fontSize: "0.9rem",
                    color: "var(--text-muted)",
                  }}
                >
                  Email
                </strong>
                <span
                  style={{ fontWeight: "600", color: "var(--medical-navy)" }}
                >
                  melbournepeptides1@gmail.com
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
              <div
                style={{
                  background: "#f0fdf4",
                  padding: "10px",
                  borderRadius: "50%",
                }}
              >
                <Phone size={20} color="#10b981" />
              </div>
              <div>
                <strong
                  style={{
                    display: "block",
                    fontSize: "0.9rem",
                    color: "var(--text-muted)",
                  }}
                >
                  Phone / WhatsApp
                </strong>
                <span
                  style={{ fontWeight: "600", color: "var(--medical-navy)" }}
                >
                  +61 468 533 070
                </span>
              </div>
            </div>

            <div style={{ display: "flex", gap: "15px", alignItems: "center" }}>
              <div
                style={{
                  background: "#fefce8",
                  padding: "10px",
                  borderRadius: "50%",
                }}
              >
                <MapPin size={20} color="#eab308" />
              </div>
              <div>
                <strong
                  style={{
                    display: "block",
                    fontSize: "0.9rem",
                    color: "var(--text-muted)",
                  }}
                >
                  Location
                </strong>
                <span
                  style={{ fontWeight: "600", color: "var(--medical-navy)" }}
                >
                  Melbourne, Australia
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div
          style={{
            background: "white",
            padding: "40px",
            borderRadius: "16px",
            border: "1px solid var(--border)",
            boxShadow: "var(--shadow-lg)",
          }}
        >
          {success ? (
            <div style={{ textAlign: "center", padding: "40px 0" }}>
              <CheckCircle
                size={60}
                color="#10b981"
                style={{ margin: "0 auto 20px" }}
              />
              <h3 style={{ color: "var(--medical-navy)" }}>Message Sent!</h3>
              <p style={{ color: "var(--text-muted)" }}>
                We will get back to you shortly.
              </p>
              <button
                onClick={() => setSuccess(false)}
                style={{
                  marginTop: "20px",
                  padding: "10px 20px",
                  background: "none",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  cursor: "pointer",
                  color: "var(--text-muted)",
                }}
              >
                Send another message
              </button>
            </div>
          ) : (
            <form
              onSubmit={handleSubmit}
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "20px",
                }}
              >
                <input
                  required
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  type="text"
                  placeholder="Name"
                  style={inputStyle}
                />
                <input
                  required
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  type="email"
                  placeholder="Email"
                  style={inputStyle}
                />
              </div>
              <input
                required
                name="subject"
                value={formData.subject}
                onChange={handleChange}
                type="text"
                placeholder="Subject"
                style={inputStyle}
              />
              <textarea
                required
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows="6"
                placeholder="How can we help?"
                style={{ ...inputStyle, resize: "vertical" }}
              ></textarea>

              <button
                type="submit"
                disabled={loading}
                className="buy-btn"
                style={{
                  width: "100%",
                  padding: "14px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                {loading ? (
                  <Loader className="spin-anim" size={20} />
                ) : (
                  <>
                    <Send size={18} /> Send Inquiry
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  padding: "12px 16px",
  border: "1px solid var(--border)",
  borderRadius: "8px",
  fontSize: "1rem",
  outline: "none",
  transition: "border-color 0.2s",
  fontFamily: "inherit",
};
