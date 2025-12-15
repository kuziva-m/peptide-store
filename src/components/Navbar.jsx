import { useState } from "react";
import { Link } from "react-router-dom";
import { ShoppingCart, Search, Menu, X } from "lucide-react";
import { useCart } from "../lib/CartContext";
import "./Navbar.css";

export default function Navbar({ searchQuery, setSearchQuery }) {
  const { cartCount, toggleCart } = useCart();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

        {/* 2. IMAGE LOGO */}
        <Link to="/" className="nav-logo-wrapper">
          <img
            src="/logo.png"
            alt="Melbourne Peptides"
            className="nav-logo-img"
          />
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
          <button className="cart-btn" onClick={toggleCart}>
            <ShoppingCart size={18} strokeWidth={2.5} />
            <span className="cart-count-badge">{cartCount}</span>
          </button>
        </div>
      </div>

      {/* DYNAMIC LINKS CONTAINER */}
      <div
        className={`nav-bottom-bar ${isMobileMenuOpen ? "mobile-open" : ""}`}
      >
        <div className="container nav-links-container">
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
          {/* REMOVED Shipping & Returns from here */}
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
        </div>
      </div>
    </nav>
  );
}
