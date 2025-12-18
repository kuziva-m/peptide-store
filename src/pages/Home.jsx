import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import ProductCard from "../components/ProductCard";
import {
  Truck,
  Shield,
  Beaker,
  ArrowRight,
  Star,
  MessageSquarePlus,
  User,
} from "lucide-react";
import "./Home.css";

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [content, setContent] = useState(null);

  // State for Reviews
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    async function fetchData() {
      // 1. Fetch Content Settings
      const { data: settings } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "home_content")
        .single();
      if (settings) setContent(settings.value);

      // 2. Fetch Reviews
      const { data: reviewsData } = await supabase
        .from("reviews")
        .select("*")
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(3);
      if (reviewsData) setReviews(reviewsData);

      // 3. Fetch & Sort Featured Products (Specific Order)
      const { data: allProducts } = await supabase
        .from("products")
        .select(`*, variants (*)`);

      if (allProducts) {
        // The exact list you wanted, in order
        const targetNames = ["Retatrutide", "Melanotan", "BPC-157", "GHK-Cu"];

        const sorted = targetNames
          .map((term) => {
            return allProducts.find((p) => {
              const name = p.name.toLowerCase();
              const search = term.toLowerCase();
              // Handle variations like "Melanotan 2" vs "Melanotan II" or "BPC 157" vs "BPC-157"
              return (
                name.includes(search) ||
                (search === "melanotan" && name.includes("melanotan")) ||
                (search === "bpc-157" &&
                  name.replace("-", " ").includes("bpc 157"))
              );
            });
          })
          .filter(Boolean); // Remove any that weren't found

        // If we found less than 4 specific ones, fill the rest with other products
        if (sorted.length < 4) {
          const remaining = allProducts.filter((p) => !sorted.includes(p));
          setFeaturedProducts([...sorted, ...remaining].slice(0, 4));
        } else {
          setFeaturedProducts(sorted);
        }
      }
    }

    fetchData();
  }, []);

  return (
    <div className="home-page">
      {/* 1. HERO SECTION */}
      <section className="hero-banner-wrapper">
        <div className="container" style={{ padding: 0, maxWidth: "100%" }}>
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
              : // Loading Skeleton
                [1, 2, 3, 4].map((n) => <ProductCard key={n} loading={true} />)}
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
            <Link to="/shop?category=Peptides" className="cat-card">
              <div className="cat-icon">
                <Beaker size={32} />
              </div>
              <h3>Peptides</h3>
              <p>Pure research compounds</p>
            </Link>
            <Link to="/shop?category=Peptide Blends" className="cat-card">
              <div className="cat-icon">
                <Shield size={32} />
              </div>
              <h3>Peptide Blends</h3>
              <p>Pre-mixed research stacks</p>
            </Link>
            <Link to="/shop?category=Mixing Solution" className="cat-card">
              <div className="cat-icon">
                <Truck size={32} />
              </div>
              <h3>Solutions</h3>
              <p>Bacteriostatic water & more</p>
            </Link>
          </div>
        </div>
      </section>

      {/* 4. REVIEWS SECTION */}
      <section className="section-container">
        <div className="container">
          <h2 className="section-title text-center mb-50">
            What Researchers Say
          </h2>

          <div className="reviews-grid">
            {reviews.length > 0 ? (
              reviews.map((review) => (
                <div key={review.id} className="review-card">
                  <div className="review-header">
                    <div className="review-avatar">
                      {review.avatar_url ? (
                        <img
                          src={review.avatar_url}
                          alt={review.name}
                          style={{
                            width: "100%",
                            height: "100%",
                            borderRadius: "50%",
                            objectFit: "cover",
                          }}
                        />
                      ) : (
                        <User size={24} />
                      )}
                    </div>
                    <div className="review-meta">
                      <span className="reviewer-name">{review.name}</span>
                      <span className="verified-badge">{review.role}</span>
                    </div>
                  </div>
                  <div
                    style={{ display: "flex", gap: "2px", margin: "10px 0" }}
                  >
                    {[...Array(review.rating || 5)].map((_, i) => (
                      <Star key={i} size={16} fill="#fbbf24" color="#fbbf24" />
                    ))}
                  </div>
                  <p className="review-text">"{review.text}"</p>
                </div>
              ))
            ) : (
              <p
                className="text-center"
                style={{ color: "var(--text-muted)", width: "100%" }}
              >
                No reviews yet.
              </p>
            )}
          </div>

          {/* WRITE A REVIEW ACTION */}
          <div
            style={{
              marginTop: "60px",
              textAlign: "center",
              background: "#f8fafc",
              padding: "40px",
              borderRadius: "16px",
              border: "1px dashed #e2e8f0",
            }}
          >
            <h3 style={{ fontSize: "1.5rem", marginBottom: "10px" }}>
              Have you conducted research with our products?
            </h3>
            <p style={{ color: "var(--text-muted)", marginBottom: "20px" }}>
              Share your findings and experience with the community.
            </p>
            {/* UPDATED LINK */}
            <Link
              to="/write-review"
              className="trust-btn"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <MessageSquarePlus size={20} /> Write a Review
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
