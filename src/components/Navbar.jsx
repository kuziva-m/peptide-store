import { Link } from "react-router-dom";
import "./Navbar.css";

export default function Navbar() {
  return (
    <nav className="navbar">
      <div className="nav-container">
        {/* Logo */}
        <Link to="/" className="nav-logo">
          Peptide<span className="logo-highlight">Store</span>
        </Link>

        {/* Links */}
        <div className="nav-links">
          <Link to="/">Shop</Link>
          <a href="#">Contact</a>
          <button
            className="cart-icon-btn"
            onClick={() => alert("Cart coming soon!")}
          >
            Cart (0)
          </button>
        </div>
      </div>
    </nav>
  );
}
