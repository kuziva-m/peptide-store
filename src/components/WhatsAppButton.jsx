import { MessageCircle } from "lucide-react";
import { useCart } from "../lib/CartContext";

export default function WhatsAppButton() {
  const { isCartOpen } = useCart();

  // Replace with actual number
  const phoneNumber = "+61468533070";
  const message = "Hi Melbourne Peptides, I have a question about my research.";

  return (
    <a
      href={`https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`}
      target="_blank"
      rel="noreferrer"
      style={{
        position: "fixed",
        bottom: "90px",
        // Logic: If cart is open, move to LEFT. If closed, stay on RIGHT.
        right: isCartOpen ? "auto" : "24px",
        left: isCartOpen ? "24px" : "auto",
        backgroundColor: "#25D366",
        color: "white",
        width: "60px",
        height: "60px",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
        zIndex: 9999, // Ensure it sits above most things
        transition: "transform 0.2s",
      }}
      onMouseOver={(e) => (e.currentTarget.style.transform = "scale(1.1)")}
      onMouseOut={(e) => (e.currentTarget.style.transform = "scale(1)")}
    >
      <MessageCircle size={32} />
    </a>
  );
}
