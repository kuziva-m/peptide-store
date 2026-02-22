import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShoppingCart, Search, Menu, X } from "lucide-react";
import { useCart } from "../lib/CartContext";
import "./Navbar.css";

export default function Navbar({ searchQuery, setSearchQuery }) {
  const { cartCount, toggleCart } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearchSubmit = (e) => {
    if (e.key === "Enter") {
      navigate("/shop");
      setIsMobileMenuOpen(false);
    }
  };

  // UPDATED: Clears search AND navigates to Home
  const handleClearSearch = () => {
    setSearchQuery("");
    navigate("/");
    setIsMobileMenuOpen(false);
  };

  return (
    <nav className="navbar">
      <div className="container nav-top-bar">
        {/* 1. MOBILE MENU TOGGLE */}
        <button
          className="mobile-menu-btn"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* 2. LOGO */}
        <Link to="/" className="nav-logo-wrapper">
          <img
            src="/logo.png"
            alt="Melbourne Peptides"
            className="nav-logo-img"
          />
        </Link>

        {/* 3. SEARCH BAR (DESKTOP) */}
        <div className="search-widget">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search for peptides..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchSubmit}
            className="search-input-header"
          />
        </div>

        {/* 4. ACTIONS */}
        <div className="nav-actions">
          <button className="cart-btn" onClick={toggleCart}>
            <ShoppingCart size={26} strokeWidth={1.5} />
            {cartCount > 0 && (
              <span className="cart-count-badge">{cartCount}</span>
            )}
          </button>
        </div>
      </div>

      {/* NEW LOCATION: MOBILE SEARCH BAR (Always visible on mobile) */}
      <div className="mobile-search-wrapper">
        <div className="mobile-search-inner">
          <Search size={18} className="mobile-search-icon" />
          <input
            type="text"
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyDown={handleSearchSubmit}
            className="mobile-search-input"
          />
        </div>

        {/* 'X' Button: Clears search and goes HOME */}
        {searchQuery && (
          <button
            className="mobile-cancel-btn"
            onClick={handleClearSearch}
            aria-label="Clear Search and Go Home"
          >
            <X size={24} strokeWidth={1.5} />
          </button>
        )}
      </div>

      {/* 5. NAVIGATION LINKS (DROPDOWN) */}
      <div
        className={`nav-bottom-bar ${isMobileMenuOpen ? "mobile-open" : ""}`}
      >
        <div className="nav-links-container">
          <Link
            to="/"
            className="nav-link"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Home
          </Link>
          <Link
            to="/shop"
            className="nav-link"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Shop All
          </Link>
          <Link
            to="/calculator"
            className="nav-link"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Peptide Calculator
          </Link>
          <Link
            to="/contact"
            className="nav-link"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Contact
          </Link>
          <Link
            to="/faq"
            className="nav-link"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            FAQ
          </Link>
          <Link
            to="/track"
            className="nav-link"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            Track Order
          </Link>
        </div>
      </div>
    </nav>
  );
}
