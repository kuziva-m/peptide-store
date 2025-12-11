import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        {/* Column 1: Brand */}
        <div className="footer-col">
          <h3 className="footer-logo">
            Melbourne<span>Peptides</span>
          </h3>
          <p className="footer-text">
            Premium research-grade peptides for laboratory use. Third-party
            tested for purity and stability.
          </p>
        </div>

        {/* Column 2: Customer Service */}
        <div className="footer-col">
          <h4>Support</h4>
          <ul className="footer-links">
            <li>
              <Link to="/shipping">Shipping & Returns</Link>
            </li>
            <li>
              <Link to="/contact">Contact Us</Link>
            </li>
            <li>
              <Link to="/faq">FAQ</Link>
            </li>
          </ul>
        </div>

        {/* Column 3: Legal */}
        <div className="footer-col">
          <h4>Legal</h4>
          <ul className="footer-links">
            <li>
              <Link to="/privacy">Privacy Policy</Link>
            </li>
            <li>
              <Link to="/terms">Terms & Conditions</Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom container">
        <p>
          &copy; {new Date().getFullYear()} Melbourne Peptides. Research Use
          Only. Not for human consumption.
        </p>
      </div>
    </footer>
  );
}
