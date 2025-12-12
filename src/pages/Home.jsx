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
} from "lucide-react";
import "./Home.css";

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [content, setContent] = useState(null);

  useEffect(() => {
    // Fetch Products
    async function fetchFeatured() {
      const { data } = await supabase
        .from("products")
        .select(`*, variants (*)`)
        .limit(4);
      if (data) setFeaturedProducts(data);
    }

    // Fetch Content
    async function fetchContent() {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "home_content")
        .single();
      if (data) setContent(data.value);
    }

    fetchFeatured();
    fetchContent();
  }, []);

  return (
    <div className="home-page">
      {/* 1. HERO SECTION */}
      <section className="hero-banner-wrapper">
        <div className="container" style={{ padding: 0, maxWidth: "100%" }}>
          {/* Note: In a real "Meta-level" app, we'd make this image dynamic in Admin too */}
          <img
            src="/hero-banner.jpeg"
            alt="Welcome"
            className="hero-banner-img"
          />

          <div className="hero-overlay-actions">
            <Link to="/shop" className="hero-cta-btn">
              {content?.hero_cta || "Shop Online Now"}
            </Link>
          </div>
        </div>
        {/* Optional: Display the dynamic title overlay if needed, currently image has text baked in */}
      </section>

      {/* 2. POPULAR PEPTIDES */}
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

      {/* ... Rest of your Home.jsx components (Categories, Trust, etc) remain unchanged ... */}
      {/* For brevity, I am not repeating static sections unless you want them dynamic too */}

      {/* 3. CATEGORIES (Static) */}
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
    </div>
  );
}
