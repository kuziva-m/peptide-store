import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase"; // Ensure this path matches your project structure
import { Microscope, Loader } from "lucide-react";

export default function ProductSpotlight({ compoundsRef }) {
  const [flippedCards, setFlippedCards] = useState({});
  const [products, setProducts] = useState({});
  const [loading, setLoading] = useState(true);

  // Fetch product images from Supabase
  useEffect(() => {
    async function fetchImages() {
      try {
        const { data } = await supabase
          .from("products")
          .select("name, image_url")
          .in("name", ["Retatrutide", "BPC-157", "GHK-Cu"]); // Make sure exact names match DB

        if (data) {
          const productMap = {};
          data.forEach((p) => {
            // Normalize keys for easy lookup
            if (p.name.includes("Retatrutide"))
              productMap["reta"] = p.image_url;
            if (p.name.includes("BPC")) productMap["bpc"] = p.image_url;
            if (p.name.includes("GHK")) productMap["ghk"] = p.image_url;
          });
          setProducts(productMap);
        }
      } catch (error) {
        console.error("Error loading spotlight images:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchImages();
  }, []);

  const handleCardFlip = (cardId) => {
    setFlippedCards((prev) => ({ ...prev, [cardId]: !prev[cardId] }));
  };

  return (
    <section
      className="newsletter-section spotlight-section-bg"
      ref={compoundsRef}
    >
      <div className="section-header animate-on-scroll">
        <Microscope size={32} className="section-icon pulse-subtle" />
        <div>
          <h3>Featured Research Compounds</h3>
          <p className="section-subtitle">
            Third-party tested • Quality verified • Australian stock
          </p>
        </div>
      </div>

      <p className="section-intro animate-on-scroll">
        All products are third-party tested for purity and stability. Intended
        strictly for laboratory and research purposes only.
      </p>

      <div className="product-spotlight-grid">
        {/* Card 1: Retatrutide */}
        <div
          className={`spotlight-card flip-card animate-on-scroll ${flippedCards["reta"] ? "flipped" : ""}`}
          onClick={() => handleCardFlip("reta")}
        >
          <div className="flip-card-inner">
            <div className="flip-card-front">
              <div className="product-image-container">
                {loading ? (
                  <Loader className="spin-continuous text-muted" />
                ) : products["reta"] ? (
                  <img
                    src={products["reta"]}
                    alt="Retatrutide"
                    className="spotlight-product-img"
                  />
                ) : (
                  <div className="placeholder-img blue-theme">No Image</div>
                )}
              </div>
              <h4>Retatrutide</h4>
              <div className="specs">
                <span>GLP-1</span>
                <span>GIP</span>
                <span>GCGR</span>
              </div>
              <p>Triple-receptor agonist for advanced metabolic research.</p>
              <div className="purity-bar">
                <div className="purity-label">
                  <span>Tested Purity</span>
                  <span className="purity-value">99.8%+</span>
                </div>
                <div className="purity-track">
                  <div className="purity-fill blue-fill"></div>
                </div>
              </div>
              <div className="card-hint">
                <span>Click for specifications</span>
              </div>
            </div>
            <div className="flip-card-back blue-theme">
              <h4>Research Specifications</h4>
              <div className="tech-specs">
                <div className="tech-row">
                  <span>Format:</span>
                  <span>Lyophilized Powder</span>
                </div>
                <div className="tech-row">
                  <span>Storage:</span>
                  <span>-20°C (Sealed)</span>
                </div>
                <div className="tech-row">
                  <span>Purpose:</span>
                  <span>Research Only</span>
                </div>
              </div>
              <div className="card-hint">
                <span>Click to return</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 2: BPC-157 */}
        <div
          className={`spotlight-card flip-card animate-on-scroll ${flippedCards["bpc"] ? "flipped" : ""}`}
          onClick={() => handleCardFlip("bpc")}
          style={{ animationDelay: "0.1s" }}
        >
          <div className="flip-card-inner">
            <div className="flip-card-front">
              <div className="product-image-container">
                {loading ? (
                  <Loader className="spin-continuous text-muted" />
                ) : products["bpc"] ? (
                  <img
                    src={products["bpc"]}
                    alt="BPC-157"
                    className="spotlight-product-img"
                  />
                ) : (
                  <div className="placeholder-img green-theme">No Image</div>
                )}
              </div>
              <h4>BPC-157</h4>
              <div className="specs">
                <span>Pentadecapeptide</span>
                <span>15-AA</span>
              </div>
              <p>
                Research-grade pentadecapeptide sequence for tissue repair
                studies.
              </p>
              <div className="purity-bar">
                <div className="purity-label">
                  <span>Tested Purity</span>
                  <span className="purity-value">99.9%+</span>
                </div>
                <div className="purity-track">
                  <div className="purity-fill green-fill"></div>
                </div>
              </div>
              <div className="card-hint">
                <span>Click for specifications</span>
              </div>
            </div>
            <div className="flip-card-back green-theme">
              <h4>Research Specifications</h4>
              <div className="tech-specs">
                <div className="tech-row">
                  <span>Format:</span>
                  <span>Lyophilized Powder</span>
                </div>
                <div className="tech-row">
                  <span>Storage:</span>
                  <span>-20°C (Sealed)</span>
                </div>
              </div>
              <div className="card-hint">
                <span>Click to return</span>
              </div>
            </div>
          </div>
        </div>

        {/* Card 3: GHK-Cu */}
        <div
          className={`spotlight-card flip-card animate-on-scroll ${flippedCards["ghk"] ? "flipped" : ""}`}
          onClick={() => handleCardFlip("ghk")}
          style={{ animationDelay: "0.2s" }}
        >
          <div className="flip-card-inner">
            <div className="flip-card-front">
              <div className="product-image-container">
                {loading ? (
                  <Loader className="spin-continuous text-muted" />
                ) : products["ghk"] ? (
                  <img
                    src={products["ghk"]}
                    alt="GHK-Cu"
                    className="spotlight-product-img"
                  />
                ) : (
                  <div className="placeholder-img orange-theme">No Image</div>
                )}
              </div>
              <h4>GHK-Cu</h4>
              <div className="specs">
                <span>Copper Complex</span>
                <span>Tripeptide</span>
              </div>
              <p>
                Copper-binding tripeptide complex for extracellular matrix
                studies.
              </p>
              <div className="purity-bar">
                <div className="purity-label">
                  <span>Tested Purity</span>
                  <span className="purity-value">99.7%+</span>
                </div>
                <div className="purity-track">
                  <div className="purity-fill orange-fill"></div>
                </div>
              </div>
              <div className="card-hint">
                <span>Click for specifications</span>
              </div>
            </div>
            <div className="flip-card-back orange-theme">
              <h4>Research Specifications</h4>
              <div className="tech-specs">
                <div className="tech-row">
                  <span>Format:</span>
                  <span>Blue Crystal/Powder</span>
                </div>
                <div className="tech-row">
                  <span>Bond:</span>
                  <span>High Affinity</span>
                </div>
              </div>
              <div className="card-hint">
                <span>Click to return</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
