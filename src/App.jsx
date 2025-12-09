import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer"; // <-- New Import
import Home from "./pages/Home";
import Admin from "./pages/Admin";
import Contact from "./pages/Contact"; // <-- New Import
import Shipping from "./pages/Shipping"; // <-- New Import
import Privacy from "./pages/Privacy"; // <-- New Import
import Terms from "./pages/Terms"; // <-- New Import
import FAQ from "./pages/FAQ"; // <-- New Import
import Toast from "./components/Toast";

function App() {
  return (
    <div
      style={{ display: "flex", flexDirection: "column", minHeight: "100vh" }}
    >
      <Navbar />
      <div style={{ flex: 1 }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/shipping" element={<Shipping />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/faq" element={<FAQ />} />
        </Routes>
      </div>
      <Toast />
      <Footer /> {/* <-- Added Footer */}
    </div>
  );
}

export default App;
