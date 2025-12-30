import { useCart } from "../lib/CartContext";
import { CheckCircle } from "lucide-react";
import "./Toast.css";

// 1. The Toast Component (Internal)
function Toast() {
  const { notification } = useCart();

  if (!notification) return null;

  return (
    <div className="toast-notification">
      <CheckCircle size={20} color="white" />
      {notification}
    </div>
  );
}

// 2. The Provider (Exported)
// This sits in App.jsx and injects the Toast into the page
export function ToastProvider({ children }) {
  return (
    <>
      {children}
      <Toast />
    </>
  );
}

export default Toast;
