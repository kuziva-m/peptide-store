import { Suspense, lazy, useState } from "react";
import { Routes, Route, useLocation, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import CartDrawer from "./components/CartDrawer";
import ScrollToTop from "./components/ScrollToTop";
import WhatsAppButton from "./components/WhatsAppButton";
import Toast from "./components/Toast";
import AnnouncementBar from "./components/AnnouncementBar";
import DiscountPopup from "./components/DiscountPopup";

// Keep the homepage and SEO-critical public routes eager
import Home from "./pages/Home";
import Product from "./pages/Product";
import Calculator from "./pages/Calculator";
import PeptideLandingPage from "./pages/PeptideLandingPage";
import ReconstitutionGuide from "./pages/ReconstitutionGuide";
import HalfLifeChart from "./pages/HalfLifeChart";

const Shop = lazy(() => import("./pages/Shop"));
const Contact = lazy(() => import("./pages/Contact"));
const Shipping = lazy(() => import("./pages/Shipping"));
const Privacy = lazy(() => import("./pages/Privacy"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Success = lazy(() => import("./pages/Success"));
const TrackOrder = lazy(() => import("./pages/TrackOrder"));
const WriteReview = lazy(() => import("./pages/WriteReview"));
const Terms = lazy(() => import("./pages/Terms"));
const Landing = lazy(() => import("./pages/Landing"));
const Checkout = lazy(() => import("./pages/Checkout"));
const CreatorStudio = lazy(() => import("./pages/CreatorStudio"));

function RouteLoader({ isHiddenPage }) {
  return (
    <div
      style={{
        minHeight: isHiddenPage ? "100vh" : "50vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          width: "min(100%, 380px)",
          background: "rgba(255, 255, 255, 0.92)",
          border: "1px solid rgba(226, 232, 240, 0.95)",
          borderRadius: "20px",
          padding: "24px",
          boxShadow: "0 20px 40px -24px rgba(15, 23, 42, 0.18)",
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: "52px",
            height: "52px",
            borderRadius: "16px",
            margin: "0 auto 16px",
            display: "grid",
            placeItems: "center",
            background: "linear-gradient(135deg, #4635de, #0d9488)",
            color: "white",
            fontWeight: 700,
            boxShadow: "0 16px 32px -20px rgba(70, 53, 222, 0.65)",
          }}
        >
          MP
        </div>
        <p style={{ margin: 0, color: "#64748b" }}>
          Loading Melbourne Peptides...
        </p>
      </div>
    </div>
  );
}

function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();

  // Hide layout on specific pages
  const isHiddenPage =
    location.pathname === "/landing" ||
    location.pathname === "/checkout" ||
    location.pathname === "/creator-studio";

  return (
    <div
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      {!isHiddenPage && <AnnouncementBar />}
      <ScrollToTop />
      {!isHiddenPage && (
        <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      )}
      {!isHiddenPage && <CartDrawer />}

      <div style={{ flex: 1 }}>
        <Suspense fallback={<RouteLoader isHiddenPage={isHiddenPage} />}>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/shop" element={<Shop searchQuery={searchQuery} />} />

            {/* SEO FIX: Use :slug instead of :id */}
            <Route path="/product/:slug" element={<Product />} />

            {/* SEO FIX: Renamed path for search volume */}
            <Route path="/peptide-calculator" element={<Calculator />} />
            {/* SEO SCALING: Dynamic keyword calculator routes */}
            <Route
              path="/peptide-calculator/:peptideId"
              element={<Calculator />}
            />

            {/* REDIRECT: Prevents 404s for anyone using the old /calculator link */}
            <Route
              path="/calculator"
              element={<Navigate to="/peptide-calculator" replace />}
            />

            <Route path="/track" element={<TrackOrder />} />
            <Route path="/write-review" element={<WriteReview />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/shipping" element={<Shipping />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/success" element={<Success />} />
            <Route path="/landing" element={<Landing />} />
            <Route path="/checkout" element={<Checkout />} />
            <Route path="/:peptideSlug" element={<PeptideLandingPage />} />
            <Route
              path="/peptide-reconstitution-guide"
              element={<ReconstitutionGuide />}
            />
            <Route
              path="/peptide-half-life-chart"
              element={<HalfLifeChart />}
            />
            <Route path="/creator-studio" element={<CreatorStudio />} />
          </Routes>
        </Suspense>
      </div>

      <Toast />
      {!isHiddenPage && <DiscountPopup />}
      {!isHiddenPage && <WhatsAppButton />}
      {!isHiddenPage && <Footer />}
    </div>
  );
}

export default App;
