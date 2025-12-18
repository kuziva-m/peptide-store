import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CartDrawer from "./components/CartDrawer";
import ScrollToTop from "./components/ScrollToTop";
import WhatsAppButton from "./components/WhatsAppButton";
import DiscountPopup from "./components/DiscountPopup";
import Toast from "./components/Toast";
import AnnouncementBar from "./components/AnnouncementBar"; // <--- IMPORT THIS

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
import TrackOrder from "./pages/TrackOrder";
import WriteReview from "./pages/WriteReview";

function App() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      {/* NEW: REPLACED OLD STATIC BANNER WITH ANIMATED BAR */}
      <AnnouncementBar />

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
          <Route path="/write-review" element={<WriteReview />} />

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
