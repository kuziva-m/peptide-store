import { useCart } from "../lib/CartContext";
import { CheckCircle } from "lucide-react";

export default function Toast() {
  const { notification } = useCart();

  if (!notification) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px", // Shows at bottom right
        backgroundColor: "#10b981", // Emerald Green
        color: "white",
        padding: "12px 24px",
        borderRadius: "8px",
        boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
        display: "flex",
        alignItems: "center",
        gap: "12px",
        fontWeight: "600",
        zIndex: 9999,
        animation: "slideIn 0.3s ease-out",
        fontSize: "0.95rem",
      }}
    >
      <CheckCircle size={20} color="white" />
      {notification}
    </div>
  );
}
