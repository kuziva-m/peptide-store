import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import AnnouncementBar from "./components/AnnouncementBar";
import CartDrawer from "./components/CartDrawer";
import DiscountPopup from "./components/DiscountPopup";
import ScrollToTop from "./components/ScrollToTop";
import WhatsAppButton from "./components/WhatsAppButton";
import { ToastProvider } from "./components/Toast";
import { useState, lazy, Suspense } from "react"; // 1. Import lazy & Suspense
import "./index.css";

// 2. Lazy Import all your pages
// This stops the browser from downloading "Terms.jsx" until someone actually goes there.
const Home = lazy(() => import("./pages/Home"));
const Shop = lazy(() => import("./pages/Shop"));
const Product = lazy(() => import("./pages/Product"));
const Contact = lazy(() => import("./pages/Contact"));
const FAQ = lazy(() => import("./pages/FAQ"));
const Calculator = lazy(() => import("./pages/Calculator"));
const TrackOrder = lazy(() => import("./pages/TrackOrder"));
const Shipping = lazy(() => import("./pages/Shipping"));
const Terms = lazy(() => import("./pages/Terms"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Success = lazy(() => import("./pages/Success"));

// Optional: specific admin page laziness if you have one
// const Admin = lazy(() => import("./pages/Admin"));

// 3. Create a simple "Loading..." spinner for when pages switch
const PageLoader = () => (
  <div
    style={{
      height: "50vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      color: "#64748b",
    }}
  >
    Loading...
  </div>
);

function App() {
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <ToastProvider>
      <div className="app-container">
        <ScrollToTop />
        <AnnouncementBar />
        <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
        <CartDrawer />
        <DiscountPopup />
        <WhatsAppButton />

        <main className="main-content">
          {/* 4. Wrap Routes in Suspense */}
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route
                path="/shop"
                element={<Shop searchQuery={searchQuery} />}
              />
              <Route path="/product/:handle" element={<Product />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/calculator" element={<Calculator />} />
              <Route path="/track" element={<TrackOrder />} />
              <Route path="/shipping" element={<Shipping />} />
              <Route path="/terms" element={<Terms />} />
              <Route path="/privacy" element={<Privacy />} />
              <Route path="/success" element={<Success />} />
            </Routes>
          </Suspense>
        </main>

        <Footer />
      </div>
    </ToastProvider>
  );
}

export default App;
