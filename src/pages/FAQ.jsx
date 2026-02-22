import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  Plus,
  Minus,
  MessageCircle,
  HelpCircle,
  ShieldCheck,
  Truck,
  Instagram,
} from "lucide-react";
import "./FAQ.css";

export default function FAQ() {
  const [faqCategories, setFaqCategories] = useState([]);
  const [openSection, setOpenSection] = useState({});

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "faq_list")
      .single()
      .then(({ data }) => {
        if (data && data.value) {
          setFaqCategories(data.value);
        }
      });
  }, []);

  const toggleQuestion = (catIndex, qIndex) => {
    const key = `${catIndex}-${qIndex}`;
    setOpenSection((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const getCategoryIcon = (categoryName) => {
    const lower = categoryName.toLowerCase();
    if (lower.includes("shipping") || lower.includes("delivery"))
      return <Truck size={22} />;
    if (lower.includes("returns") || lower.includes("refunds"))
      return <ShieldCheck size={22} />;
    if (lower.includes("product") || lower.includes("storage"))
      return <HelpCircle size={22} />;
    return <MessageCircle size={22} />;
  };

  return (
    <div className="page-wrapper">
      <div
        className="container"
        style={{ padding: "80px 24px", maxWidth: "900px" }}
      >
        {/* 1. HEADER (Matches Shop & Contact Page) */}
        <div style={{ textAlign: "center", marginBottom: "60px" }}>
          <h1
            style={{
              fontSize: "2.5rem",
              marginBottom: "16px",
              color: "var(--medical-navy)", // Navy Text
              fontWeight: "700",
            }}
          >
            Help Center
          </h1>
          <p
            style={{
              color: "var(--text-muted)", // Grey Text
              fontSize: "1.1rem",
              maxWidth: "600px",
              margin: "0 auto",
              lineHeight: "1.6",
            }}
          >
            Find answers regarding shipping protocols, product storage, and
            order processing. Professional support for reliable service.
          </p>
        </div>

        {/* 2. FAQ CONTENT */}
        <div style={{ display: "flex", flexDirection: "column", gap: "30px" }}>
          {faqCategories.length > 0 ? (
            faqCategories.map((category, catIndex) => (
              <div key={catIndex} className="faq-category">
                <div className="faq-cat-header">
                  <div className="faq-icon-wrapper">
                    {getCategoryIcon(category.category)}
                  </div>
                  <h2 className="faq-cat-title">{category.category}</h2>
                </div>

                <div className="faq-list">
                  {category.questions.map((item, qIndex) => {
                    const key = `${catIndex}-${qIndex}`;
                    const isOpen = openSection[key];

                    return (
                      <div key={qIndex} className="faq-item">
                        <button
                          className="faq-trigger"
                          onClick={() => toggleQuestion(catIndex, qIndex)}
                          aria-expanded={isOpen}
                        >
                          <span>{item.q}</span>
                          {isOpen ? (
                            <Minus size={18} color="var(--primary)" />
                          ) : (
                            <Plus size={18} color="#94a3b8" />
                          )}
                        </button>

                        <div className={`faq-answer ${isOpen ? "open" : ""}`}>
                          {item.a}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))
          ) : (
            <div
              className="faq-category"
              style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}
            >
              Loading Help Center...
            </div>
          )}
        </div>

        {/* 3. SUPPORT BANNER (Instagram) */}
        <div className="support-banner">
          <div className="support-icon">
            <Instagram size={28} />
          </div>
          <h3
            style={{
              fontSize: "1.5rem",
              marginBottom: "10px",
              color: "var(--medical-navy)",
            }}
          >
            Need technical assistance?
          </h3>
          <p style={{ color: "var(--text-muted)", marginBottom: "20px" }}>
            Our team is available to assist with inquiries and order status via
            Instagram.
          </p>

          <a
            href="https://ig.me/m/mpresearch.au"
            target="_blank"
            rel="noopener noreferrer"
            className="support-btn"
            style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
          >
            <Instagram size={18} /> Chat on Instagram
          </a>
        </div>
      </div>
    </div>
  );
}
