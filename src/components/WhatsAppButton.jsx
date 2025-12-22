import { useState } from "react";
import { MessageCircle, X } from "lucide-react";

export default function WhatsAppButton() {
  const [isVisible, setIsVisible] = useState(true);

  if (!isVisible) return null;

  return (
    <div
      className="whatsapp-float-container"
      style={{
        zIndex: 9990,
        animation: "fadeIn 0.5s ease",
      }}
    >
      <a
        href="https://wa.me/61482087884"
        target="_blank"
        rel="noopener noreferrer"
        style={{
          backgroundColor: "#0f172a", // Navy Background
          color: "white", // White Text & Icon
          padding: "12px 20px",
          borderRadius: "50px",
          border: "1px solid rgba(255,255,255,0.1)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          textDecoration: "none",
          fontWeight: "600",
          fontSize: "0.9rem",
          transition: "transform 0.2s, box-shadow 0.2s",
          height: "45px",
          boxSizing: "border-box",
        }}
      >
        {/* UPDATED: Removed green fill/color to make it hollow/white */}
        <MessageCircle size={20} />
        WhatsApp
      </a>

      <button
        onClick={(e) => {
          e.preventDefault();
          setIsVisible(false);
        }}
        style={{
          position: "absolute",
          top: "-8px",
          right: "-5px",
          background: "white",
          border: "1px solid #e2e8f0",
          borderRadius: "50%",
          width: "22px",
          height: "22px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 2px 5px rgba(0,0,0,0.1)",
          color: "#64748b",
          zIndex: 9992,
        }}
      >
        <X size={12} />
      </button>

      <style>{`
        .whatsapp-float-container {
          position: fixed;
          bottom: 24px;
          right: 24px; /* Default: Bottom Right */
        }
        
        /* Mobile: Stack on Left above Discount Button */
        @media (max-width: 768px) {
          .whatsapp-float-container {
            right: auto;
            left: 24px;
            bottom: 80px; /* Stacks above the discount button */
          }
        }
      `}</style>
    </div>
  );
}
