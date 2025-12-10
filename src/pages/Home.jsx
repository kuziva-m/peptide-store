import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import ProductCard from "../components/ProductCard";
import {
  CheckCircle,
  Truck,
  Shield,
  Beaker,
  ArrowRight,
  Star,
  User,
} from "lucide-react";
import "./Home.css";

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);

  // Fetch only 4 random/top products for the "Bestsellers" section
  useEffect(() => {
    async function fetchFeatured() {
      const { data } = await supabase
        .from("products")
        .select(`*, variants (*)`)
        .limit(4);
      if (data) setFeaturedProducts(data);
    }
    fetchFeatured();
  }, []);

  return (
    <div className="home-page">
      {/* 1. HERO BANNER */}
      <section className="hero-section">
        <div className="container">
          <h1 className="hero-title">
            Premium Research Peptides <br /> Australia Wide
          </h1>
          <p className="hero-subtitle">
            Independently lab-tested. Fast, discreet shipping. Melbourne pickup
            available.
          </p>
          <div className="hero-actions">
            <Link to="/shop" className="hero-btn primary">
              Shop Now
            </Link>
            <Link to="/shop" className="hero-btn secondary">
              View Catalog
            </Link>
          </div>
        </div>
      </section>

      {/* 2. POPULAR PEPTIDES (BESTSELLERS) */}
      <section className="section-container">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Popular Research Peptides</h2>
            <Link to="/shop" className="view-all-link">
              View All <ArrowRight size={16} />
            </Link>
          </div>
          <div className="products-grid">
            {featuredProducts.length > 0
              ? featuredProducts.map((p) => (
                  <ProductCard key={p.id} product={p} loading={false} />
                ))
              : [1, 2, 3, 4].map((n) => <ProductCard key={n} loading={true} />)}
          </div>
        </div>
      </section>

      {/* 3. CATEGORIES */}
      <section className="section-container bg-grey">
        <div className="container">
          <h2 className="section-title text-center mb-50">
            Browse by Category
          </h2>
          <div className="categories-grid">
            <Link to="/shop" className="cat-card">
              <div className="cat-icon">
                <Beaker size={32} />
              </div>
              <h3>Peptides</h3>
              <p>Pure research compounds</p>
            </Link>
            <Link to="/shop" className="cat-card">
              <div className="cat-icon">
                <Shield size={32} />
              </div>
              <h3>Peptide Blends</h3>
              <p>Pre-mixed research stacks</p>
            </Link>
            <Link to="/shop" className="cat-card">
              <div className="cat-icon">
                <Truck size={32} />
              </div>
              <h3>Solutions</h3>
              <p>Bacteriostatic water & more</p>
            </Link>
          </div>
        </div>
      </section>

      {/* 4. WHY CHOOSE US */}
      <section className="section-container trust-section">
        <div className="container">
          <div className="trust-grid">
            <div className="trust-content">
              <h2 className="section-title">
                Why Leading Researchers Choose Us
              </h2>
              <ul className="trust-list">
                <li>
                  <CheckCircle size={20} className="t-icon" /> Independently
                  lab-tested (COAs available)
                </li>
                <li>
                  <CheckCircle size={20} className="t-icon" /> Premium-grade
                  purity {">"}99%
                </li>
                <li>
                  <CheckCircle size={20} className="t-icon" /> Melbourne pickup
                  + Express AU shipping
                </li>
                <li>
                  <CheckCircle size={20} className="t-icon" /> Discreet, secure
                  packaging
                </li>
              </ul>
              <Link to="/shipping" className="trust-btn">
                Shipping Information
              </Link>
            </div>
            {/* Placeholder for Trust Image - Replace with real image later */}
            <div className="trust-image-placeholder">
              <Shield size={64} opacity={0.2} />
              <span>Lab Certified</span>
            </div>
          </div>
        </div>
      </section>

      {/* 5. EDUCATIONAL */}
      <section className="section-container">
        <div className="container">
          <h2 className="section-title text-center mb-50">
            Research & Education
          </h2>
          <div className="blog-grid">
            <div className="blog-card">
              <div className="blog-img"></div>
              <div className="blog-txt">
                <h4>Handling & Storage Guide</h4>
                <p>Best practices for storing lyophilized peptides.</p>
                <span className="read-more">Read Article</span>
              </div>
            </div>
            <div className="blog-card">
              <div className="blog-img"></div>
              <div className="blog-txt">
                <h4>Understanding COAs</h4>
                <p>How to read HPLC and Mass Spec reports.</p>
                <span className="read-more">Read Article</span>
              </div>
            </div>
            <div className="blog-card">
              <div className="blog-img"></div>
              <div className="blog-txt">
                <h4>Reconstitution 101</h4>
                <p>Proper mixing techniques for research.</p>
                <span className="read-more">Read Article</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. REVIEWS (FIXED) */}
      <section className="section-container bg-navy">
        <div className="container">
          <h2
            className="section-title text-center mb-50"
            style={{ color: "white" }}
          >
            Trusted by Researchers
          </h2>
          <div className="reviews-grid">
            {/* Review 1 */}
            <div className="review-card">
              <div className="review-header">
                <div className="review-avatar">AM</div>
                <div className="review-meta">
                  <span className="reviewer-name">Alex M.</span>
                  <span className="verified-badge">Verified Buyer</span>
                </div>
              </div>
              <div className="stars">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={16} fill="#fbbf24" stroke="#fbbf24" />
                ))}
              </div>
              <p className="review-text">
                "Fastest shipping I've experienced. Products arrived cold and
                well packaged. COAs matched perfectly with my own tests."
              </p>
            </div>

            {/* Review 2 (4 Stars for realism) */}
            <div className="review-card">
              <div className="review-header">
                <div
                  className="review-avatar"
                  style={{ background: "#e0f2fe", color: "#0284c7" }}
                >
                  SJ
                </div>
                <div className="review-meta">
                  <span className="reviewer-name">Sarah J.</span>
                  <span className="verified-badge">Verified Researcher</span>
                </div>
              </div>
              <div className="stars">
                {[1, 2, 3, 4].map((s) => (
                  <Star key={s} size={16} fill="#fbbf24" stroke="#fbbf24" />
                ))}
                <Star size={16} stroke="#cbd5e1" fill="#cbd5e1" />
              </div>
              <p className="review-text">
                "Excellent purity. My research results have been consistent.
                Only giving 4 stars because stock runs out fast!"
              </p>
            </div>

            {/* Review 3 */}
            <div className="review-card">
              <div className="review-header">
                <div
                  className="review-avatar"
                  style={{ background: "#fef3c7", color: "#d97706" }}
                >
                  DK
                </div>
                <div className="review-meta">
                  <span className="reviewer-name">Dr. K</span>
                  <span className="verified-badge">Institution</span>
                </div>
              </div>
              <div className="stars">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star key={s} size={16} fill="#fbbf24" stroke="#fbbf24" />
                ))}
              </div>
              <p className="review-text">
                "Great customer service. Had a technical question about storage
                protocols and they replied within minutes with data."
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
