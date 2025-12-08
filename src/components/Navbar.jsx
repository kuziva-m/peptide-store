import { Link } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="container nav-inner">
        <Link to="/" className="nav-logo">
          Peptide<span>Store</span>
        </Link>

        <div className="nav-links">
          <Link to="/">Shop</Link>
          <Link to="#">Lab Results</Link>
          <Link to="#">Support</Link>
          <button className="cart-btn" onClick={() => alert("Cart opening...")}>
            Cart (0)
          </button>
        </div>
      </div>
    </nav>
  );
}
