import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react";
import { useCart } from "../lib/CartContext";
import "./Navbar.css";

export default function Navbar() {
  const { cartCount } = useCart();

  return (
    <nav className="navbar">
      <div className="container nav-inner">
        <Link to="/" className="nav-logo">
          Peptide<span>Store</span>
        </Link>

        <div className="nav-links">
          <Link to="/">Home</Link>
          <Link to="/">Shop</Link>
          <Link to="/contact">Contact Us</Link>

          <button
            className="cart-btn"
            onClick={() => alert("Checkout feature coming soon!")}
          >
            <ShoppingCart size={20} strokeWidth={2.5} />
            <span className="cart-count-badge">{cartCount}</span>
          </button>
        </div>
      </div>
    </nav>
  );
}
