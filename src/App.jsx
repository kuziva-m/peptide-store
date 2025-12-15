import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CartDrawer from "./components/CartDrawer";
import ScrollToTop from "./components/ScrollToTop";
import WhatsAppButton from "./components/WhatsAppButton";
import DiscountPopup from "./components/DiscountPopup";
import Toast from "./components/Toast";

// Pages
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Admin from "./pages/Admin";
import Contact from "./pages/Contact";
import Shipping from "./pages/Shipping";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import FAQ from "./pages/FAQ";
import Product from "./pages/Product";
import Success from "./pages/Success";
import Calculator from "./pages/Calculator";
import TrackOrder from "./pages/TrackOrder"; // Ensuring TrackOrder is imported if used

function App() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      {/* --- NEW: SHIPPING BANNER --- */}
      <div
        style={{
          backgroundColor: "#0f172a", // var(--medical-navy)
          color: "white",
          textAlign: "center",
          padding: "10px",
          fontSize: "0.9rem",
          fontWeight: "500",
          letterSpacing: "0.02em",
        }}
      >
        ✈️ Flat Rate Shipping{" "}
        <span style={{ color: "#facc15", fontWeight: "700" }}>$9.99 AUD</span>{" "}
        Australia Wide &nbsp;<span style={{ opacity: 0.5 }}>|</span>&nbsp; ⚡
        24hr Dispatch &nbsp;<span style={{ opacity: 0.5 }}>|</span>&nbsp; 📦 1-3
        Days Delivery
      </div>

      <ScrollToTop />
      <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <CartDrawer />

      <div style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/shop" element={<Shop searchQuery={searchQuery} />} />
          <Route path="/product/:id" element={<Product />} />
          <Route path="/calculator" element={<Calculator />} />
          <Route path="/track" element={<TrackOrder />} />

          <Route path="/admin" element={<Admin />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/shipping" element={<Shipping />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/faq" element={<FAQ />} />
          <Route path="/success" element={<Success />} />
        </Routes>
      </div>

      <Toast />
      <WhatsAppButton />
      <DiscountPopup />
      <Footer />
    </div>
  );
}

export default App;
