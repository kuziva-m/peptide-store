import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import ProductCard from "../components/ProductCard";
import SEO from "../components/SEO";
import { organizationSchema, websiteSchema } from "../seo/schema"; // 🚨 NEW SCHEMA IMPORTS
import {
  Truck,
  Shield,
  Beaker,
  ArrowRight,
  Star,
  Video,
  Syringe,
} from "lucide-react";
import "./Home.css";

export default function Home() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [content, setContent] = useState(null);

  useEffect(() => {
    // --- INJECT TRUSTPILOT SCRIPT ---
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src =
      "//widget.trustpilot.com/bootstrap/v5/tp.widget.bootstrap.min.js";
    script.async = true;
    document.head.appendChild(script);

    async function fetchData() {
      const [settingsRes, productsRes] = await Promise.all([
        supabase
          .from("site_settings")
          .select("value")
          .eq("key", "home_content")
          .single(),
        supabase.from("products").select(`*, variants (*)`),
      ]);

      if (settingsRes.data) setContent(settingsRes.data.value);

      const allProducts = productsRes.data;
      if (allProducts) {
        const targetNames = ["Retatrutide", "Melanotan", "BPC-157", "GHK-Cu"];
        const sorted = targetNames
          .map((term) => {
            return allProducts.find((p) => {
              const name = p.name.toLowerCase();
              const search = term.toLowerCase();
              return (
                name.includes(search) ||
                (search === "melanotan" && name.includes("melanotan")) ||
                (search === "bpc-157" &&
                  name.replace("-", " ").includes("bpc 157"))
              );
            });
          })
          .filter(Boolean);

        if (sorted.length < 4) {
          const remaining = allProducts.filter((p) => !sorted.includes(p));
          setFeaturedProducts([...sorted, ...remaining].slice(0, 4));
        } else {
          setFeaturedProducts(sorted);
        }
      }
    }

    fetchData();

    // Cleanup script on unmount
    return () => {
      if (document.head.contains(script)) {
        document.head.removeChild(script);
      }
    };
  }, []);

  return (
    <div className="home-page">
      {/* 🚨 NEW AUDIT-COMPLIANT SEO BLOCK */}
      <SEO
        path="/"
        title="Melbourne Peptides | Research Peptides in Australia | Batch-Tested"
        description="Australian supplier of research peptides with batch documentation, calculator tools, FAQs, and fast domestic dispatch. Research use only."
        schema={[organizationSchema(), websiteSchema()]}
      />

      <section className="hero-banner-wrapper">
        <div className="container" style={{ padding: 0, maxWidth: "100%" }}>
          <img
            src="/hero-banner.jpeg"
            alt="Melbourne Peptides premium research compounds"
            className="hero-banner-img"
            width="1920"
            height="600"
            loading="eager"
            fetchPriority="high"
            style={{
              width: "100%",
              height: "auto",
              maxHeight: "80vh",
              display: "block",
            }}
          />
          <div className="hero-overlay-actions">
            {/* 🚨 UPDATED SINGLE H1 TAG */}
            <h1
              style={{
                position: "absolute",
                width: "1px",
                height: "1px",
                padding: "0",
                overflow: "hidden",
                clip: "rect(0,0,0,0)",
                whiteSpace: "nowrap",
                border: "0",
              }}
            >
              Research Peptides in Australia
            </h1>

            <Link to="/shop" className="hero-cta-btn">
              {content?.hero_cta || "Shop Online Now"}
            </Link>
          </div>
        </div>
      </section>

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

            <Link to="/shop?category=Accessories" className="cat-card">
              <div className="cat-icon">
                <Syringe size={32} />
              </div>
              <h3>Accessories</h3>
              <p>Water, Syringes & Alcohol Pads</p>
            </Link>
          </div>
        </div>
      </section>

      <section className="support-banner-dark">
        <div className="container support-flex">
          <div className="support-icon-glow">
            <Video size={40} color="white" />
          </div>
          <div className="support-text">
            <h2>Need guidance? Let's hop on a call.</h2>
            <p>
              Once you receive your research compounds, we are happy to schedule
              a video call to answer your questions and help you get started.
            </p>
          </div>
          <Link to="/contact" className="support-action-btn">
            Book Support Call
          </Link>
        </div>
      </section>

      <section className="section-container">
        <div className="container">
          {/* --- OFFICIAL TRUSTPILOT REVIEW WIDGET BLOCK --- */}
          <div
            style={{
              textAlign: "center",
              background: "#f0fdf4", // Light Trustpilot Green
              padding: "40px",
              borderRadius: "16px",
              border: "2px solid #bbf7d0",
              boxShadow: "0 4px 6px -1px rgba(0, 182, 122, 0.1)",
            }}
          >
            <h3
              style={{
                fontSize: "1.6rem",
                marginBottom: "10px",
                color: "#00b67a", // Official Trustpilot Green
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "10px",
                fontWeight: "bold",
              }}
            >
              <Star size={24} fill="#00b67a" color="#00b67a" />
              Add a Trustpilot Review
            </h3>
            <p
              style={{
                color: "#475569",
                marginBottom: "30px",
                fontSize: "1.1rem",
                maxWidth: "500px",
                margin: "0 auto 30px auto",
              }}
            >
              Have you used our products? Share your experience with the
              community and help us grow.
            </p>

            {/* OFFICIAL TRUSTPILOT WIDGET */}
            <div
              className="trustpilot-widget"
              data-locale="en-US"
              data-template-id="56278e9abfbbba0bdcd568bc"
              data-businessunit-id="6984fbcb52b30924cef9fe4b"
              data-style-height="52px"
              data-style-width="100%"
              data-token="8c086368-2f64-4291-a5be-26fc80b33e80"
              style={{ display: "flex", justifyContent: "center" }}
            >
              <a
                href="https://www.trustpilot.com/review/melbournepeptides.com.au"
                target="_blank"
                rel="noopener noreferrer"
              >
                Trustpilot
              </a>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
