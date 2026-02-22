import { useState, useEffect } from "react";
import {
  Award,
  Beaker,
  CheckCircle2,
  Truck,
  ShieldCheck,
  Zap,
} from "lucide-react";

export default function ResearchInfo({ protocolsRef }) {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const testimonials = [
    {
      quote: "Outstanding purity standards and reliable delivery.",
      author: "Dr. Sarah Chen",
      institution: "Monash University",
      role: "Lead Researcher",
    },
    {
      quote: "Professional service and transparent testing documentation.",
      author: "Prof. Michael Thompson",
      institution: "University of Sydney",
      role: "Research Director",
    },
    {
      quote: "Fast dispatch and quality products.",
      author: "Dr. Emma Rodriguez",
      institution: "University of Queensland",
      role: "Senior Scientist",
    },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
    }, 6000);
    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <div className="stats-bar animate-fade-in-up">
        <div className="stat-item">
          <Truck size={20} />
          <div className="stat-content">
            <span className="stat-number">Free</span>
            <span className="stat-label">Express Over $150</span>
          </div>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <Zap size={20} />
          <div className="stat-content">
            <span className="stat-number">1-3 Days</span>
            <span className="stat-label">Metro Delivery</span>
          </div>
        </div>
        <div className="stat-divider"></div>
        <div className="stat-item">
          <ShieldCheck size={20} />
          <div className="stat-content">
            <span className="stat-number">24hr</span>
            <span className="stat-label">Dispatch</span>
          </div>
        </div>
      </div>

      <section className="testimonial-section animate-on-scroll">
        <div className="testimonial-carousel">
          <div className="testimonial-header">
            <Award size={24} className="testimonial-icon" />
            <h3>Trusted by Researchers</h3>
          </div>
          <div className="testimonial-track">
            {testimonials.map((t, idx) => (
              <div
                key={idx}
                className={`testimonial-card ${idx === currentTestimonial ? "active" : ""}`}
              >
                <div className="quote-mark">"</div>
                <p className="testimonial-quote">{t.quote}</p>
                <div className="testimonial-author">
                  <div className="author-avatar">
                    {t.author.split(" ")[1].charAt(0)}
                  </div>
                  <div className="author-info">
                    <strong>{t.author}</strong>
                    <span>{t.role}</span>
                    <span className="institution">{t.institution}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <hr className="divider" />

      <section className="newsletter-section" ref={protocolsRef}>
        <div className="section-header animate-on-scroll">
          <Beaker size={32} className="section-icon pulse-subtle" />
          <div>
            <h3>Storage & Handling Protocols</h3>
            <p className="section-subtitle">
              Best practices for maintaining compound stability
            </p>
          </div>
        </div>
        <div className="protocol-grid">
          <div className="protocol-item animate-on-scroll">
            <div className="protocol-number">01</div>
            <h5>
              <CheckCircle2 size={18} className="check-icon check-animated" />{" "}
              Reconstitution
            </h5>
            <p>
              Use bacteriostatic water (0.9% benzyl alcohol). Inject slowly down
              vial wall.
            </p>
          </div>
          <div
            className="protocol-item animate-on-scroll"
            style={{ animationDelay: "0.1s" }}
          >
            <div className="protocol-number">02</div>
            <h5>
              <CheckCircle2 size={18} className="check-icon check-animated" />{" "}
              Lyophilized Storage
            </h5>
            <p>
              Store sealed powder at <strong>-20°C</strong>. Use desiccants to
              prevent moisture.
            </p>
          </div>
          <div
            className="protocol-item animate-on-scroll"
            style={{ animationDelay: "0.2s" }}
          >
            <div className="protocol-number">03</div>
            <h5>
              <CheckCircle2 size={18} className="check-icon check-animated" />{" "}
              After Reconstitution
            </h5>
            <p>
              Store at <strong>4°C</strong> and use within 28 days. Discard if
              cloudy.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
