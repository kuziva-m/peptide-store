import { Routes, Route } from "react-router-dom";
import Navbar from "./components/Navbar"; // <--- Import this
import Home from "./pages/Home";

function App() {
  return (
    <>
      <Navbar /> {/* <--- Add this here */}
      <Routes>
        <Route path="/" element={<Home />} />
      </Routes>
    </>
  );
}

export default App;
