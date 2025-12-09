import { Link } from "react-router-dom";
import { ShoppingCart, Search } from "lucide-react";
import { useCart } from "../lib/CartContext";
import "./Navbar.css";

export default function Navbar({ searchQuery, setSearchQuery }) {
  const { cartCount, toggleCart } = useCart(); // Use toggleCart from context

  return (
    <nav className="navbar">
      <div className="container nav-top-bar">
        {/* Logo */}
        <Link to="/" className="nav-logo">
          PEPTIDE<span style={{ color: "var(--medical-navy)" }}>STORE</span>
        </Link>

        {/* Search Input */}
        <div className="search-widget">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search for peptides..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input-header"
          />
        </div>

        {/* Actions */}
        <div className="nav-actions">
          <button
            className="cart-btn"
            onClick={toggleCart} // NOW OPENS DRAWER
          >
            <ShoppingCart size={18} strokeWidth={2.5} />
            <span className="cart-count-badge">{cartCount}</span>
          </button>
        </div>
      </div>

      <div className="nav-bottom-bar">
        <div className="container nav-links-container">
          <Link to="/" className="nav-link">
            Home
          </Link>
          <Link to="/" className="nav-link">
            Shop All
          </Link>
          <Link to="/shipping" className="nav-link">
            Shipping & Returns
          </Link>
          <Link to="/contact" className="nav-link">
            Contact
          </Link>
          <Link to="/faq" className="nav-link">
            FAQ
          </Link>
        </div>
      </div>
    </nav>
  );
}
