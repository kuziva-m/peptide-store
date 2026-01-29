import { useState } from "react";
import { Instagram, X } from "lucide-react";

export default function WhatsAppButton() {
  const [isVisible, setIsVisible] = useState(true);

  // Your Instagram username from the link provided
  const INSTAGRAM_USERNAME = "mpresearch.au";

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
        href={`https://ig.me/m/${INSTAGRAM_USERNAME}`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          backgroundColor: "#0f172a", // Navy (Matches theme)
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
        {/* Hollow Instagram Icon */}
        <Instagram size={20} />
        Chat on Insta
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
        
        /* Mobile: Ensure it stays on the RIGHT side */
        @media (max-width: 768px) {
          .whatsapp-float-container {
            left: auto; /* Reset left */
            right: 24px; /* Force Right */
            bottom: 80px; /* Stacks above bottom elements if needed */
          }
        }
      `}</style>
    </div>
  );
}
