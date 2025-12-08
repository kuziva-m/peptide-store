import { useCart } from "../lib/CartContext";
import { CheckCircle } from "lucide-react";
import "./Toast.css"; // Create or add to index.css

export default function Toast() {
  const { notification } = useCart();

  if (!notification) return null;

  return (
    <div className="toast-notification">
      <CheckCircle size={20} color="white" />
      {notification}
    </div>
  );
}
