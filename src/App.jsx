import { useState } from "react";
import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import Contact from "./pages/Contact";
import Shipping from "./pages/Shipping";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import FAQ from "./pages/FAQ";
import Toast from "./components/Toast";

function App() {
  // New State for global search query, managed here
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <div
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      <Navbar searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
      <div style={{ flex: 1 }}>
        <Routes>
          <Route
            path="/"
            element={
              <Home searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
            }
          />
          <Route path="/admin" element={<Admin />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/shipping" element={<Shipping />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/faq" element={<FAQ />} />
        </Routes>
      </div>
      <Toast />
      <Footer />
    </div>
  );
}

export default App;
