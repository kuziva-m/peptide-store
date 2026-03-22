import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import SEO from "../components/SEO";
import {
  Dna,
  FlaskConical,
  BookOpen,
  HelpCircle,
  Snowflake,
  Link as LinkIcon,
} from "lucide-react";
import {
  getRelatedResearchItems,
  getFutureResearchLinks,
} from "../lib/productRelationships";

export default function PeptideLandingPage() {
  const { peptideSlug } = useParams();
  const [pageData, setPageData] = useState(null);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPageData() {
      setLoading(true);

      const { data: seo, error: seoError } = await supabase
        .from("seo_landing_pages")
        .select("*")
        .eq("slug", peptideSlug)
        .single();

      if (seoError || !seo) {
        setLoading(false);
        return;
      }

      setPageData(seo);

      if (seo.product_id) {
        const { data: prodData } = await supabase
          .from("products")
          .select("*")
          .eq("id", seo.product_id)
          .single();

        if (prodData) setProduct(prodData);
      }

      setLoading(false);
    }

    fetchPageData();
  }, [peptideSlug]);

  const fallbackRelatedResearch = useMemo(
    () => getRelatedResearchItems(peptideSlug),
    [peptideSlug],
  );

  const fallbackFutureResearchLinks = useMemo(
    () => getFutureResearchLinks(peptideSlug),
    [peptideSlug],
  );

  if (loading) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.2rem",
          fontWeight: "bold",
          color: "#64748b",
        }}
      >
        Loading research database...
      </div>
    );
  }

  if (!pageData) {
    return (
      <div
        style={{
          minHeight: "60vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.2rem",
          fontWeight: "bold",
          color: "#ef4444",
        }}
      >
        Research page not found.
      </div>
    );
  }

  const productImage =
    product?.image_url || product?.image || "https://via.placeholder.com/400";

  const relatedResearchItems =
    pageData.related_peptides && pageData.related_peptides.length > 0
      ? pageData.related_peptides
      : fallbackRelatedResearch;

  const futureResearchItems =
    pageData.future_research_links && pageData.future_research_links.length > 0
      ? pageData.future_research_links
      : fallbackFutureResearchLinks;

  const formatText = (text) => {
    if (!text) return null;

    return text.split("\n").map((line, i) => {
      const parts = line.split(/\*\*(.*?)\*\*/g);

      return (
        <p key={i} className="seo-p">
          {parts.map((part, j) =>
            j % 2 === 1 ? (
              <strong key={j} style={{ color: "#0f172a", fontWeight: "800" }}>
                {part}
              </strong>
            ) : (
              part
            ),
          )}
        </p>
      );
    });
  };

  return (
    <>
      <style>{`
        .seo-landing-bg { background-color: #f8fafc; min-height: 100vh; padding-bottom: 80px; font-family: system-ui, -apple-system, sans-serif; }
        .seo-hero { background: white; border-bottom: 1px solid #e2e8f0; padding: 60px 20px; text-align: center; margin-bottom: 40px; }
        .seo-hero-tag { color: #4635de; font-weight: 800; text-transform: uppercase; font-size: 0.85rem; letter-spacing: 1px; display: block; margin-bottom: 12px; }
        .seo-hero-title { font-size: 3rem; font-weight: 900; color: #0f172a; margin: 0 0 20px 0; letter-spacing: -1px; line-height: 1.2; }
        .seo-hero-desc { font-size: 1.15rem; color: #475569; max-width: 800px; margin: 0 auto; line-height: 1.6; }

        .seo-container { max-width: 1100px; margin: 0 auto; padding: 0 20px; display: grid; grid-template-columns: 1fr 380px; gap: 40px; align-items: start; }

        .seo-main { display: flex; flex-direction: column; gap: 30px; }
        .seo-card { background: white; border-radius: 16px; padding: 40px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .seo-h2 { font-size: 1.8rem; font-weight: 800; color: #0f172a; margin: 0 0 24px 0; padding-bottom: 16px; border-bottom: 2px solid #f1f5f9; display: flex; align-items: center; gap: 12px; }
        .seo-p { font-size: 1.05rem; color: #334155; line-height: 1.8; margin-bottom: 16px; }

        .seo-img-wrapper { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 12px; padding: 20px; display: flex; justify-content: center; margin-bottom: 24px; }
        .seo-img { max-width: 100%; max-height: 300px; object-fit: contain; mix-blend-mode: multiply; border-radius: 8px; }

        .seo-study { background: #f0f4ff; border-left: 4px solid #4635de; padding: 20px; border-radius: 0 12px 12px 0; margin-bottom: 16px; }
        .seo-study h3 { margin: 0 0 8px 0; color: #0f172a; font-size: 1.1rem; }
        .seo-study p { margin: 0; color: #334155; font-size: 0.95rem; line-height: 1.6; }

        .seo-faq { background: #f8fafc; border: 1px solid #e2e8f0; padding: 20px; border-radius: 12px; margin-bottom: 16px; }
        .seo-faq h3 { margin: 0 0 8px 0; color: #0f172a; font-size: 1.1rem; }
        .seo-faq p { margin: 0; color: #475569; font-size: 0.95rem; line-height: 1.6; }

        .seo-sidebar { position: sticky; top: 24px; display: flex; flex-direction: column; gap: 24px; }
        .sidebar-card { background: white; border-radius: 16px; padding: 24px; border: 1px solid #e2e8f0; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05); }
        .sidebar-img-box { background: radial-gradient(circle at center, #ffffff 50%, #f1f5f9 100%); border-radius: 12px; padding: 20px; display: flex; justify-content: center; margin-bottom: 20px; border: 1px solid #e2e8f0; }
        .sidebar-img { max-width: 100%; height: 200px; object-fit: contain; filter: drop-shadow(0 10px 15px rgba(0,0,0,0.1)); }
        .sidebar-btn { display: block; width: 100%; text-align: center; background: #4635de; color: white; padding: 16px; border-radius: 10px; font-weight: 800; text-decoration: none; font-size: 1.05rem; transition: background 0.2s; }
        .sidebar-btn:hover { background: #3729ad; }

        .dark-card { background: #0f172a; color: white; }
        .dark-btn { background: white; color: #0f172a; }
        .dark-btn:hover { background: #f8fafc; }
        .code-block { background: #1e293b; padding: 16px; border-radius: 8px; font-family: monospace; font-size: 0.9rem; color: #e2e8f0; line-height: 1.5; margin-bottom: 20px; border: 1px solid #334155; }

        .ref-list { list-style: decimal inside; padding: 0; margin: 0; color: #475569; font-size: 0.9rem; }
        .ref-list li { margin-bottom: 10px; line-height: 1.6; }

        @media (max-width: 1024px) {
          .seo-container { grid-template-columns: 1fr; }
          .seo-sidebar { position: relative; top: 0; }
          .seo-hero-title { font-size: 2.2rem; }
          .seo-card { padding: 24px; }
        }
      `}</style>

      <div className="seo-landing-bg">
        <SEO
          title={`${pageData.h1_title}`}
          description={pageData.meta_description}
          url={`https://melbournepeptides.com.au/${peptideSlug}`}
        />

        <div className="seo-hero">
          <span className="seo-hero-tag">Comprehensive Research Guide</span>
          <h1 className="seo-hero-title">{pageData.h1_title}</h1>
          <p className="seo-hero-desc">{pageData.meta_description}</p>
        </div>

        <div className="seo-container">
          <div className="seo-main">
            {pageData.introduction && (
              <section className="seo-card">
                <h2 className="seo-h2">
                  <Dna size={28} color="#4635de" />
                  What is {pageData.h1_title.split(" ")[0]}?
                </h2>
                {pageData.image_amino_sequence && (
                  <div className="seo-img-wrapper">
                    <img
                      src={pageData.image_amino_sequence}
                      alt={`${pageData.h1_title.split(" ")[0]} amino sequence`}
                      className="seo-img"
                    />
                  </div>
                )}
                {formatText(pageData.introduction)}
              </section>
            )}

            {pageData.mechanism_text && (
              <section className="seo-card">
                <h2 className="seo-h2">
                  <FlaskConical size={28} color="#4635de" />
                  Mechanism of Action
                </h2>
                {pageData.image_molecular_structure && (
                  <div className="seo-img-wrapper">
                    <img
                      src={pageData.image_molecular_structure}
                      alt="Molecular structure"
                      className="seo-img"
                    />
                  </div>
                )}
                {formatText(pageData.mechanism_text)}
              </section>
            )}

            {pageData.research_studies &&
              pageData.research_studies.length > 0 && (
                <section className="seo-card">
                  <h2 className="seo-h2">
                    <BookOpen size={28} color="#4635de" />
                    Key Research Studies
                  </h2>
                  <div>
                    {pageData.research_studies.map((study, index) => (
                      <div key={index} className="seo-study">
                        <h3>{study.title}</h3>
                        <p>{study.summary}</p>
                      </div>
                    ))}
                  </div>
                </section>
              )}

            {pageData.faqs && pageData.faqs.length > 0 && (
              <section className="seo-card">
                <h2 className="seo-h2">
                  <HelpCircle size={28} color="#4635de" />
                  Frequently Asked Questions
                </h2>
                <div>
                  {pageData.faqs.map((faq, index) => (
                    <div key={index} className="seo-faq">
                      <h3>{faq.q}</h3>
                      <p>{faq.a}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {pageData.references && pageData.references.length > 0 && (
              <section className="seo-card" style={{ background: "#f8fafc" }}>
                <h2
                  className="seo-h2"
                  style={{ border: "none", paddingBottom: 0 }}
                >
                  <LinkIcon size={24} color="#64748b" />
                  References
                </h2>
                <ul className="ref-list">
                  {pageData.references.map((ref, index) => (
                    <li key={index}>{ref}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>

          <div className="seo-sidebar">
            {product && (
              <div className="sidebar-card">
                <div className="sidebar-img-box">
                  <img
                    src={productImage}
                    alt={`${product.name} vial`}
                    className="sidebar-img"
                  />
                </div>
                <div style={{ textAlign: "center", marginBottom: "20px" }}>
                  <span
                    style={{
                      fontSize: "0.75rem",
                      fontWeight: "800",
                      color: "#4635de",
                      textTransform: "uppercase",
                      letterSpacing: "1px",
                    }}
                  >
                    Available For Research
                  </span>
                  <h2
                    style={{
                      fontSize: "1.8rem",
                      fontWeight: "800",
                      color: "#0f172a",
                      margin: "4px 0",
                    }}
                  >
                    {product.name}
                  </h2>
                  <p
                    style={{ fontSize: "0.85rem", color: "#64748b", margin: 0 }}
                  >
                    Strictly for scientific research and laboratory use.
                  </p>
                </div>
                <Link to={`/product/${product.slug}`} className="sidebar-btn">
                  View Pricing & Availability →
                </Link>
              </div>
            )}

            {pageData.reconstitution_example && (
              <div className="sidebar-card dark-card">
                <h3
                  style={{
                    fontSize: "1.2rem",
                    margin: "0 0 16px 0",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  🧪 Reconstitution
                </h3>
                <div className="code-block">
                  {pageData.reconstitution_example}
                </div>
                <Link to="/peptide-calculator" className="sidebar-btn dark-btn">
                  Open Peptide Calculator →
                </Link>
              </div>
            )}

            {pageData.storage_guidelines && (
              <div className="sidebar-card">
                <h3
                  style={{
                    fontSize: "1.2rem",
                    color: "#0f172a",
                    margin: "0 0 16px 0",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Snowflake size={20} color="#0ea5e9" /> Storage Guidelines
                </h3>
                {pageData.image_vial && (
                  <div className="seo-img-wrapper" style={{ padding: "10px" }}>
                    <img
                      src={pageData.image_vial}
                      alt="Vial"
                      style={{
                        height: "120px",
                        objectFit: "contain",
                        mixBlendMode: "multiply",
                      }}
                    />
                  </div>
                )}
                <p
                  style={{
                    fontSize: "0.95rem",
                    color: "#475569",
                    lineHeight: "1.6",
                    margin: 0,
                  }}
                >
                  {pageData.storage_guidelines}
                </p>
              </div>
            )}

            {relatedResearchItems && relatedResearchItems.length > 0 && (
              <div className="sidebar-card">
                <h3
                  style={{
                    fontSize: "1.1rem",
                    color: "#0f172a",
                    margin: "0 0 16px 0",
                    paddingBottom: "10px",
                    borderBottom: "1px solid #e2e8f0",
                  }}
                >
                  Related Research
                </h3>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {relatedResearchItems.map((pep, index) => (
                    <li
                      key={`${pep.slug || pep.name}-${index}`}
                      style={{
                        marginBottom: "12px",
                        borderBottom: "1px solid #f1f5f9",
                        paddingBottom: "12px",
                      }}
                    >
                      {pep.slug ? (
                        <Link
                          to={`/${pep.slug}`}
                          style={{
                            color: "#4635de",
                            fontWeight: "700",
                            textDecoration: "none",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          {pep.name} <span style={{ fontSize: "12px" }}>→</span>
                        </Link>
                      ) : (
                        <span
                          style={{
                            color: "#0f172a",
                            fontWeight: "700",
                            display: "block",
                          }}
                        >
                          {pep.name}
                        </span>
                      )}

                      <p
                        style={{
                          fontSize: "0.85rem",
                          color: "#64748b",
                          margin: "4px 0 0 0",
                        }}
                      >
                        {pep.reason}
                      </p>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {futureResearchItems && futureResearchItems.length > 0 && (
              <div className="sidebar-card">
                <h3
                  style={{
                    fontSize: "1.1rem",
                    color: "#0f172a",
                    margin: "0 0 16px 0",
                    paddingBottom: "10px",
                    borderBottom: "1px solid #e2e8f0",
                  }}
                >
                  Future Research Links
                </h3>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {futureResearchItems.map((item, index) => (
                    <li
                      key={`${item.label || item.name || index}-${index}`}
                      style={{
                        marginBottom: "12px",
                        borderBottom: "1px solid #f1f5f9",
                        paddingBottom: "12px",
                      }}
                    >
                      {item.url ? (
                        <a
                          href={item.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            color: "#4635de",
                            fontWeight: "700",
                            textDecoration: "none",
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                          }}
                        >
                          {item.label || item.name}{" "}
                          <span style={{ fontSize: "12px" }}>↗</span>
                        </a>
                      ) : (
                        <span
                          style={{
                            color: "#0f172a",
                            fontWeight: "700",
                            display: "block",
                          }}
                        >
                          {item.label || item.name}
                        </span>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
