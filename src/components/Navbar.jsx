import { Link } from "react-router-dom";
import { ShoppingCart, Search } from "lucide-react";
import { useCart } from "../lib/CartContext";
import "./Navbar.css";

export default function Navbar({ searchQuery, setSearchQuery }) {
  const { cartCount } = useCart();

  return (
    <nav className="navbar">
      <div className="container nav-top-bar">
        {" "}
        {/* New Top Bar */}
        {/* Logo */}
        <Link to="/" className="nav-logo">
          PEPTIDE<span style={{ color: "var(--medical-navy)" }}>STORE</span>
        </Link>
        {/* Search Input (New Location) */}
        <div className="search-widget">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input-header"
          />
        </div>
        {/* Cart & Login Placeholder */}
        <div className="nav-actions">
          {/* Cart Button */}
          <button
            className="cart-btn"
            onClick={() => alert("Checkout feature coming soon!")}
          >
            <ShoppingCart size={20} strokeWidth={2.5} />
            <span className="cart-count-badge">{cartCount}</span>
          </button>
        </div>
      </div>

      <div className="nav-bottom-bar">
        {" "}
        {/* New Bottom Bar for Links */}
        <div className="container nav-links-container">
          <Link to="/" className="nav-link">
            Home
          </Link>
          <Link to="/" className="nav-link">
            Shop
          </Link>
          <Link to="/shipping" className="nav-link">
            Shipping & Returns
          </Link>
          <Link to="/contact" className="nav-link">
            Contact Us
          </Link>
          <Link to="/faq" className="nav-link">
            FAQ
          </Link>
        </div>
      </div>
    </nav>
  );
}
