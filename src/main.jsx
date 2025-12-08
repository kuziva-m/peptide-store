import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { CartProvider } from "./lib/CartContext"; // <-- Import this
import "./index.css";
import App from "./App.jsx";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <CartProvider>
        {" "}
        {/* <-- Wrap App with CartProvider */}
        <App />
      </CartProvider>
    </BrowserRouter>
  </StrictMode>
);
