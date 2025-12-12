import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { supabase } from "../lib/supabase";

export default function DiscountPopup() {
  const [show, setShow] = useState(false);
  const [content, setContent] = useState(null);

  useEffect(() => {
    async function fetchSettings() {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "discount_popup")
        .single();

      if (data?.value?.active) {
        // Check if user already dismissed it in this session
        if (!sessionStorage.getItem("popupDismissed")) {
          setContent(data.value);
          setTimeout(() => setShow(true), 2000); // 2 second delay
        }
      }
    }
    fetchSettings();
  }, []);

  const handleClose = () => {
    setShow(false);
    sessionStorage.setItem("popupDismissed", "true");
  };

  if (!show || !content) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "20px",
        left: "20px", // Bottom left
        maxWidth: "300px",
        background: "white",
        padding: "20px",
        borderRadius: "12px",
        boxShadow: "0 10px 30px rgba(0,0,0,0.2)",
        zIndex: 10000,
        border: "1px solid var(--primary)",
        animation: "slideUp 0.5s ease",
      }}
    >
      <button
        onClick={handleClose}
        style={{
          position: "absolute",
          top: "8px",
          right: "8px",
          background: "none",
          border: "none",
          cursor: "pointer",
        }}
      >
        <X size={16} />
      </button>
      <h4 style={{ color: "var(--primary)", marginTop: 0 }}>Special Offer</h4>
      <p style={{ fontSize: "0.9rem", color: "#334155" }}>{content.text}</p>
      <div
        style={{
          background: "#f1f5f9",
          padding: "8px",
          textAlign: "center",
          fontWeight: "bold",
          border: "1px dashed var(--primary)",
          borderRadius: "6px",
        }}
      >
        Code: {content.code}
      </div>
    </div>
  );
}
