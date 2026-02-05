import { useState } from "react";
import { supabase } from "../lib/supabase";
import SEO from "../components/SEO"; // Added Import
import {
  Mail,
  MapPin,
  Send,
  Loader,
  CheckCircle,
  Instagram,
} from "lucide-react";

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
    <>
      <SEO
        title="Contact Support"
        description="Contact Melbourne Peptides for support, product inquiries, or bulk order information. We respond within 24 hours."
        url="https://melbournepeptides.com.au/contact"
      />

      <div
        className="container"
        style={{ padding: "80px 24px", maxWidth: "1100px" }}
      >
        {/* HEADER */}
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <h1
            style={{
              fontSize: "2.5rem",
              marginBottom: "16px",
              color: "var(--medical-navy)",
            }}
          >
            Contact Support
          </h1>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "1.1rem",
              maxWidth: "600px",
              margin: "0 auto",
            }}
          >
            Our specialists are available to assist with product specifications,
            bulk orders, and shipping inquiries.
          </p>
        </div>

        {/* RESPONSIVE LAYOUT CONTAINER */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "40px",
            alignItems: "flex-start",
          }}
        >
          {/* LEFT COLUMN: INFO CARDS */}
          <div style={{ flex: "1 1 350px" }}>
            <div
              style={{ display: "flex", flexDirection: "column", gap: "20px" }}
            >
              {/* Card 1: Email */}
              <div style={infoCardStyle}>
                <div style={iconBoxStyle}>
                  <Mail size={24} color="var(--medical-navy)" />
                </div>
                <div>
                  <h3 style={cardTitleStyle}>Email Us</h3>
                  <p style={cardTextStyle}>
                    For general inquiries & order status
                  </p>
                  <a href="inf0@melbournepeptides.com.au" style={linkStyle}>
                    info@melbournepeptides.com.au
                  </a>
                </div>
              </div>

              {/* Card 2: Instagram */}
              <div style={infoCardStyle}>
                <div style={iconBoxStyle}>
                  <Instagram size={24} color="var(--medical-navy)" />
                </div>
                <div>
                  <h3 style={cardTitleStyle}>Instagram Support</h3>
                  <p style={cardTextStyle}>Quick questions & updates</p>
                  <a
                    href="https://ig.me/m/mpresearch.au"
                    target="_blank"
                    rel="noreferrer"
                    style={linkStyle}
                  >
                    @mpresearch.au
                  </a>
                </div>
              </div>

              {/* Card 3: Location */}
              <div style={infoCardStyle}>
                <div style={iconBoxStyle}>
                  <MapPin size={24} color="var(--medical-navy)" />
                </div>
                <div>
                  <h3 style={cardTitleStyle}>Facility</h3>
                  <p style={cardTextStyle}>Melbourne, Australia</p>
                  <span
                    style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}
                  >
                    Dispatch Centre Only
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: CONTACT FORM */}
          <div
            style={{
              flex: "1 1 400px",
              background: "white",
              padding: "40px",
              borderRadius: "16px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
            }}
          >
            <h2
              style={{
                fontSize: "1.5rem",
                color: "var(--medical-navy)",
                marginBottom: "24px",
              }}
            >
              Send an Inquiry
            </h2>

            {success ? (
              <div style={{ textAlign: "center", padding: "60px 20px" }}>
                <CheckCircle
                  size={60}
                  color="#10b981"
                  style={{ margin: "0 auto 20px" }}
                />
                <h3
                  style={{ color: "var(--medical-navy)", marginBottom: "10px" }}
                >
                  Message Received
                </h3>
                <p style={{ color: "var(--text-muted)", marginBottom: "30px" }}>
                  Our team will review your inquiry and respond within 24 hours.
                </p>
                <button
                  onClick={() => setSuccess(false)}
                  style={{
                    padding: "10px 24px",
                    background: "#f1f5f9",
                    border: "none",
                    borderRadius: "8px",
                    color: "var(--medical-navy)",
                    fontWeight: "600",
                    cursor: "pointer",
                  }}
                >
                  Send Another
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleSubmit}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                    gap: "20px",
                  }}
                >
                  <div>
                    <label style={labelStyle}>Your Name</label>
                    <input
                      required
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      type="text"
                      placeholder="John Doe"
                      style={inputStyle}
                    />
                  </div>
                  <div>
                    <label style={labelStyle}>Email Address</label>
                    <input
                      required
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      type="email"
                      placeholder="John@example.com"
                      style={inputStyle}
                    />
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>Subject</label>
                  <input
                    required
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    type="text"
                    placeholder="Product Inquiry..."
                    style={inputStyle}
                  />
                </div>

                <div>
                  <label style={labelStyle}>Message</label>
                  <textarea
                    required
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    rows="5"
                    placeholder="How can we assist you?"
                    style={{ ...inputStyle, resize: "vertical" }}
                  ></textarea>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="buy-btn"
                  style={{
                    marginTop: "10px",
                    width: "100%",
                    padding: "16px",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    gap: "10px",
                    fontSize: "1rem",
                  }}
                >
                  {loading ? (
                    <Loader className="spin-anim" size={20} />
                  ) : (
                    <>
                      <Send size={18} /> Send Message
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

// STYLES
const infoCardStyle = {
  background: "white",
  padding: "24px",
  borderRadius: "12px",
  border: "1px solid #e2e8f0",
  display: "flex",
  alignItems: "center",
  gap: "20px",
  transition: "transform 0.2s ease",
};

const iconBoxStyle = {
  width: "50px",
  height: "50px",
  background: "#f1f5f9",
  borderRadius: "12px",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  flexShrink: 0,
};

const cardTitleStyle = {
  margin: "0 0 4px 0",
  fontSize: "1.1rem",
  color: "var(--medical-navy)",
  fontWeight: "700",
};

const cardTextStyle = {
  margin: "0 0 4px 0",
  color: "var(--text-muted)",
  fontSize: "0.9rem",
};

const linkStyle = {
  color: "var(--primary)",
  fontWeight: "600",
  textDecoration: "none",
  fontSize: "0.95rem",
};

const labelStyle = {
  display: "block",
  marginBottom: "8px",
  fontSize: "0.9rem",
  fontWeight: "600",
  color: "#475569",
};

const inputStyle = {
  width: "100%",
  padding: "12px 16px",
  border: "1px solid #cbd5e1",
  borderRadius: "8px",
  fontSize: "1rem",
  outline: "none",
  background: "#f8fafc",
  transition: "all 0.2s",
  fontFamily: "inherit",
};
