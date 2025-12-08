import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Admin from "./pages/Admin"; // <-- Import Admin
import Toast from "./components/Toast";

function App() {
  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/admin" element={<Admin />} /> {/* <-- New Route */}
      </Routes>
      <Toast />
    </>
  );
}

export default App;
