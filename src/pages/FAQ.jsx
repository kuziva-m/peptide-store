import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function FAQ() {
  const [faqs, setFaqs] = useState([]);
  const [openIndex, setOpenIndex] = useState(null);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "faq_list")
      .single()
      .then(({ data }) => {
        if (data) setFaqs(data.value || []);
      });
  }, []);

  return (
    <div
      className="container"
      style={{ padding: "80px 24px", maxWidth: "800px" }}
    >
      <h1>Frequently Asked Questions</h1>
      <div
        style={{
          marginTop: "40px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {faqs.map((item, index) => (
          <div
            key={index}
            style={{
              border: "1px solid var(--border)",
              borderRadius: "12px",
              background: "white",
              overflow: "hidden",
            }}
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              style={{
                width: "100%",
                padding: "20px",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "none",
                border: "none",
                cursor: "pointer",
                textAlign: "left",
                fontWeight: "600",
                fontSize: "1rem",
                color: "var(--medical-navy)",
              }}
            >
              {item.q}
              {openIndex === index ? (
                <ChevronUp size={20} />
              ) : (
                <ChevronDown size={20} />
              )}
            </button>
            {openIndex === index && (
              <div
                style={{
                  padding: "0 20px 20px 20px",
                  color: "var(--text-muted)",
                  lineHeight: "1.6",
                }}
              >
                {item.a}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
