import { Link } from "react-router-dom";
import "./Footer.css";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-grid">
        <div className="footer-col">
          <h3 className="footer-logo">
            Melbourne<span>Peptides</span>
          </h3>
          <p className="footer-text">
            Premium peptides for laboratory use. Third-party tested for purity
            and stability.
          </p>
        </div>

        <div className="footer-col">
          <h4>Support</h4>
          <ul className="footer-links">
            <li>
              <Link to="/contact">Contact Us</Link>
            </li>
            <li>
              <Link to="/faq">FAQ</Link>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>Legal</h4>
          <ul className="footer-links">
            <li>
              <Link to="/shipping">Shipping & Returns</Link>
            </li>
            <li>
              <Link to="/privacy">Privacy Policy</Link>
            </li>
            {/* ADDED TERMS LINK */}
            <li>
              <Link to="/terms">Terms & Conditions</Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="footer-bottom container">
        <p>
          &copy; {new Date().getFullYear()} Melbourne Peptides. Peptides. Not
          for human consumption.
        </p>
      </div>
    </footer>
  );
}
