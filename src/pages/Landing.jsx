import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import SEO from "../components/SEO";
import { Info, Instagram, FileText } from "lucide-react";
import "./Landing.css";

import LandingHero from "../components/landing/LandingHero";
import ProductSpotlight from "../components/landing/ProductSpotlight";
import ResearchInfo from "../components/landing/ResearchInfo";
import LandingOverlay from "../components/landing/LandingOverlay";

export default function Landing() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const heroRef = useRef(null);
  const compoundsRef = useRef(null);
  const protocolsRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) entry.target.classList.add("animate-in");
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -100px 0px" },
    );
    document
      .querySelectorAll(".animate-on-scroll")
      .forEach((el) => observer.observe(el));
    return () => observer.disconnect();
  }, []);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    if (!email.includes("@")) {
      setError("Please enter a valid email address.");
      setLoading(false);
      return;
    }
    try {
      const { error: dbError } = await supabase
        .from("subscribers")
        .insert({ email, name: "Research Access User" });
      if (dbError && !dbError.message.includes("unique")) throw dbError;
      navigate("/shop");
    } catch (err) {
      console.error(err);
      setError("Access error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="landing-wrapper">
      <SEO
        title="Melbourne Peptides | Premium Research Peptides Australia"
        description="Premium peptides for laboratory use. Third-party tested for purity and stability. Free express shipping over $150."
        url="https://melbournepeptides.com.au"
      />

      <div className="particles-container">
        {[...Array(20)].map((_, i) => (
          <div key={i} className="particle" style={{ "--i": i }}></div>
        ))}
      </div>

      <LandingOverlay
        heroRef={heroRef}
        compoundsRef={compoundsRef}
        protocolsRef={protocolsRef}
      />

      <div className="landing-container">
        <LandingHero
          heroRef={heroRef}
          handleSubscribe={handleSubscribe}
          email={email}
          setEmail={setEmail}
          loading={loading}
          error={error}
        />

        {/* Removed Scroll Indicator from here - moved to LandingHero */}

        <div className="content-body">
          <ProductSpotlight compoundsRef={compoundsRef} />

          <hr className="divider" />

          <ResearchInfo protocolsRef={protocolsRef} />
        </div>

        <footer className="landing-footer">
          <div className="warning-box">
            <Info size={24} className="info-icon-svg pulse-subtle" />
            <p>
              <strong>RESEARCH USE ONLY:</strong> All products sold by Melbourne
              Peptides are intended strictly for laboratory and research
              purposes. They are not therapeutic goods and are{" "}
              <strong>not for human or veterinary consumption</strong>. By
              purchasing, you confirm compliance with all applicable laws.
            </p>
          </div>

          <div className="footer-contact">
            <div className="footer-section">
              <h4>Contact Us</h4>
              <a
                href="https://ig.me/m/mpresearch.au"
                target="_blank"
                rel="noopener noreferrer"
                className="instagram-link"
              >
                <Instagram size={18} />
                <span>@mpresearch.au</span>
              </a>
            </div>
          </div>

          <div className="footer-links">
            <span>© {new Date().getFullYear()} Melbourne Peptides</span>
            <span>
              <FileText
                size={12}
                style={{ display: "inline", marginRight: 4 }}
              />
              Terms of Service
            </span>
            <span>Research Use Only</span>
          </div>
        </footer>
      </div>
    </div>
  );
}
