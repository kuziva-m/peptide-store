import { useState, useEffect } from "react";
import {
  Atom,
  Dna,
  FlaskConical,
  Sparkles,
  TrendingUp,
  Lock,
  ArrowRight,
  ShieldCheck,
  ChevronDown,
} from "lucide-react";

export default function LandingHero({
  heroRef,
  handleSubscribe,
  email,
  setEmail,
  loading,
  error,
}) {
  const [currentDate, setCurrentDate] = useState("");
  const [researcherCount, setResearcherCount] = useState(0);

  useEffect(() => {
    const date = new Date();
    setCurrentDate(
      date.toLocaleDateString("en-US", { month: "long", year: "numeric" }),
    );

    let current = 0;
    const counterInterval = setInterval(() => {
      current += 20;
      if (current >= 1200) {
        setResearcherCount(1200);
        clearInterval(counterInterval);
      } else {
        setResearcherCount(Math.floor(current));
      }
    }, 33);

    return () => clearInterval(counterInterval);
  }, []);

  return (
    <header className="landing-hero" ref={heroRef}>
      <div className="hero-gradient-overlay"></div>

      <div className="floating-molecules">
        <div className="molecule mol-1">
          <Atom size={40} />
        </div>
        <div className="molecule mol-2">
          <Dna size={35} />
        </div>
        <div className="molecule mol-3">
          <FlaskConical size={38} />
        </div>
      </div>

      <div className="issue-badge animate-fade-in">
        <Sparkles size={12} />
        Research Catalog • {currentDate}
      </div>

      <div className="landing-logo animate-scale-in">
        <img
          src="/logo.png"
          alt="Melbourne Peptides Logo"
          className="hero-logo-img"
        />
        <h1 className="gradient-text">Melbourne Peptides</h1>
        <span className="hero-tag pulse-glow">Laboratory Supply</span>
      </div>

      <div className="hero-content">
        <h2 className="landing-title">Premium Peptides for Laboratory Use</h2>
        <p className="landing-subtitle">
          Third-party tested for purity and stability. Strictly for research
          purposes. Join{" "}
          <strong className="highlight-count">
            <TrendingUp size={16} className="inline-icon" />
            {researcherCount.toLocaleString()}+ Australian researchers
          </strong>{" "}
          accessing our catalog.
        </p>
      </div>

      <div className="hero-form-card glass-morphism animate-float">
        <div className="form-glow-effect"></div>
        <div className="form-header">
          <Lock size={16} />
          <span>View Product Catalog</span>
        </div>
        <form onSubmit={handleSubscribe} className="landing-form">
          <div className="input-group">
            <input
              type="email"
              placeholder="Enter your email to view products"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              required
              className="input-glow"
            />
            <button
              type="submit"
              disabled={loading}
              className="btn-primary ripple-effect"
            >
              {loading ? (
                <span className="loading-spinner">
                  <div className="spinner"></div>Verifying...
                </span>
              ) : (
                <>
                  View Products <ArrowRight size={18} className="arrow-slide" />
                </>
              )}
            </button>
          </div>
          {error && <p className="error-msg animate-shake">{error}</p>}
        </form>
        <p className="form-note">
          <ShieldCheck size={12} /> Secure Entry • Research Use Only
        </p>
      </div>

      {/* MOVED SCROLL INDICATOR INSIDE HERO */}
      <div className="scroll-indicator">
        <ChevronDown size={24} className="bounce-arrow" />
        <span>Explore Our Range</span>
      </div>
    </header>
  );
}
