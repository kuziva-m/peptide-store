import { useState, useEffect } from "react";
import { Atom, ArrowRight } from "lucide-react";

export default function LandingOverlay({
  heroRef,
  compoundsRef,
  protocolsRef,
}) {
  const [scrollY, setScrollY] = useState(0);
  const [showNav, setShowNav] = useState(false);

  const scrollToSection = (ref) =>
    ref.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  useEffect(() => {
    // Scroll Handling
    const handleScroll = () => {
      setScrollY(window.scrollY);
      setShowNav(window.scrollY > 400);
    };
    window.addEventListener("scroll", handleScroll);

    return () => {
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <>
      {/* Sticky Nav */}
      <nav className={`sticky-nav ${showNav ? "visible" : ""}`}>
        <div className="nav-content">
          <div className="nav-logo">
            <Atom size={24} />
            <span>Melbourne Peptides</span>
          </div>
          <div className="nav-links">
            <button onClick={() => scrollToSection(heroRef)}>Home</button>
            <button onClick={() => scrollToSection(compoundsRef)}>
              Products
            </button>
            <button onClick={() => scrollToSection(protocolsRef)}>
              Storage
            </button>
          </div>
        </div>
      </nav>

      {/* Scroll Progress */}
      <div className="scroll-progress">
        <div
          className="scroll-progress-bar"
          style={{
            width: `${(scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100}%`,
          }}
        ></div>
      </div>

      {/* Back to Top Button */}
      <button
        className="floating-cta"
        onClick={() => scrollToSection(heroRef)}
        title="Back to top"
      >
        <ArrowRight size={20} className="rotate-up" />
      </button>
    </>
  );
}
