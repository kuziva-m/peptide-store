import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import {
  ChevronDown,
  Plus,
  Minus,
  MessageCircle,
  HelpCircle,
  ShieldCheck,
  Truck,
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

  // Helper to get an icon based on category name
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
    <div className="faq-page">
      {/* 1. PROFESSIONAL HERO HEADER */}
      <div className="faq-hero">
        <h1 className="faq-title">Help Center</h1>
        <p className="faq-subtitle">
          Find answers regarding shipping protocols, product storage, and order
          processing.
          <br />
          Professional support for reliable research.
        </p>
      </div>

      {/* 2. MAIN DOCUMENT CONTENT */}
      <div className="faq-content">
        {faqCategories.length > 0 ? (
          faqCategories.map((category, catIndex) => (
            <div key={catIndex} className="faq-category">
              {/* Category Header */}
              <div className="faq-cat-header">
                <div className="faq-icon-wrapper">
                  {getCategoryIcon(category.category)}
                </div>
                <h2 className="faq-cat-title">{category.category}</h2>
              </div>

              {/* Questions List */}
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
                        {/* Use Plus/Minus for a cleaner, medical feel */}
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
          // Skeleton loading state
          <div
            className="faq-category"
            style={{ padding: "40px", textAlign: "center", color: "#94a3b8" }}
          >
            Loading Help Center...
          </div>
        )}

        {/* 3. HUMAN SUPPORT BANNER */}
        <div className="support-banner">
          <div className="support-icon">
            <MessageCircle size={28} />
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
          <p style={{ color: "var(--text-muted)", marginBottom: "0" }}>
            Our team is available to assist with research inquiries and order
            status.
          </p>

          <a href="mailto:melbournepeptides1@gmail.com" className="support-btn">
            Contact Support
          </a>
        </div>
      </div>
    </div>
  );
}
