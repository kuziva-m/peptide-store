import { Link } from "react-router-dom";
import { ShoppingCart } from "lucide-react"; // Import icon
import { useCart } from "../lib/CartContext"; // Import cart hook
import "./Navbar.css";

export default function Navbar() {
  const { cartCount } = useCart(); // Get the live count

  return (
    <nav className="navbar">
      <div className="container nav-inner">
        <Link to="/" className="nav-logo">
          Peptide<span>Store</span>
        </Link>

        <div className="nav-links">
          <Link to="/">Shop</Link>
          <Link to="#">Contact</Link>

          {/* Updated Cart Button with Icon */}
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
