import React, { useState, useMemo, useEffect, Fragment } from "react";
import { Link, useParams } from "react-router-dom";
import { supabase } from "../lib/supabase";
import {
  Beaker,
  Info,
  Calculator as CalcIcon,
  Syringe,
  TestTube,
  BookOpen,
  ShieldCheck,
  AlertTriangle,
} from "lucide-react";
import SEO from "../components/SEO";
import "./Calculator.css";

const SYRINGE_SIZES = [
  { size: 0.3, label: "0.3ml (30 Units)", short: "0.3ml" },
  { size: 0.5, label: "0.5ml (50 Units)", short: "0.5ml" },
  { size: 1.0, label: "1.0ml (100 Units)", short: "1.0ml" },
];

const MATH_DEFAULTS = {
  default: { mg: 5, ml: 2, mcg: 250 },
  "bpc-157": { mg: 5, ml: 2, mcg: 250 },
  semaglutide: { mg: 5, ml: 2, mcg: 250 },
  tirzepatide: { mg: 10, ml: 2, mcg: 2500 },
  "tb-500": { mg: 5, ml: 2, mcg: 2500 },
  "tb-500-tb4": { mg: 5, ml: 2, mcg: 2500 },
  "ghk-cu": { mg: 50, ml: 3, mcg: 2000 },
  "melanotan-2": { mg: 10, ml: 2, mcg: 250 },
  "melanotan-ii": { mg: 10, ml: 2, mcg: 250 },
  "cjc-1295": { mg: 2, ml: 1, mcg: 100 },
  "cjc-1295-no-dac": { mg: 2, ml: 1, mcg: 100 },
  ipamorelin: { mg: 5, ml: 2, mcg: 100 },
  epitalon: { mg: 10, ml: 2, mcg: 1000 },
  "hgh-191aa": { mg: 3.33, ml: 1, mcg: 333 },
  "tri-heal-max": { mg: 45, ml: 3, mcg: 250 },
  "wolverine-stack": { mg: 15, ml: 2, mcg: 250 },
  retatrutide: { mg: 10, ml: 2, mcg: 2000 },
  cagrilintide: { mg: 5, ml: 2, mcg: 250 },
  mazdutide: { mg: 10, ml: 2, mcg: 2500 },
  survodutide: { mg: 10, ml: 2, mcg: 2500 },
  "igf-1-lr3": { mg: 1, ml: 1, mcg: 50 },
  "ghrp-6": { mg: 5, ml: 2, mcg: 100 },
  "ghrp-2": { mg: 5, ml: 2, mcg: 100 },
  tesamorelin: { mg: 2, ml: 1, mcg: 1000 },
  "mots-c": { mg: 10, ml: 2, mcg: 5000 },
  semax: { mg: 10, ml: 2, mcg: 1000 },
  selank: { mg: 10, ml: 2, mcg: 1000 },
  kpv: { mg: 10, ml: 2, mcg: 250 },
  sermorelin: { mg: 2, ml: 1, mcg: 200 },
  "glow-blend": { mg: 70, ml: 3, mcg: 1000 },
  "klow-blend": { mg: 80, ml: 3, mcg: 1000 },
  "nad-plus": { mg: 50, ml: 1, mcg: 10000 },
  "ll-37": { mg: 5, ml: 2, mcg: 100 },
  "thymosin-alpha-1": { mg: 10, ml: 2, mcg: 1500 },
  "pt-141-bremelanotide": { mg: 10, ml: 2, mcg: 1500 },
  "cjc-1295-no-dac-plus-ipamorelin": { mg: 10, ml: 2, mcg: 200 },
};

// --- NEW COMPREHENSIVE CATEGORIZED DOSAGE DATA ---
const PROTOCOL_CATEGORIES = [
  {
    category: "Anti Aging",
    peptides: [
      {
        name: "Epitalon",
        recommended: "5–10mg per day",
        frequency: "Daily",
        cycle: "10–20 days",
      },
      {
        name: "FOXO4",
        recommended: "1–3mg per cycle",
        frequency: "Intermittent",
        cycle: "Single-cycle protocols",
      },
      {
        name: "MOTS-c",
        recommended: "5–15mg per week",
        frequency: "2–3× weekly",
        cycle: "4–8 weeks",
      },
      {
        name: "NAD+",
        recommended: "250–500mg per week",
        frequency: "Weekly",
        cycle: "4–8 weeks",
      },
      {
        name: "PE-22-28",
        recommended: "50–200 mcg per day",
        frequency: "Once daily or protocol dependent",
        cycle: "2–6 weeks",
      },
      {
        name: "SNAP-8",
        recommended: "100–300 mcg per day",
        frequency: "Once daily or divided doses, protocol dependent",
        cycle: "4–8 weeks",
      },
      {
        name: "SS-31",
        recommended: "5–20mg per week",
        frequency: "2–3× weekly",
        cycle: "4–8 weeks",
      },
    ],
  },
  {
    category: "Blends",
    peptides: [
      {
        name: "BPC-157 / TB4 Blend",
        recommended: "250–500mcg daily",
        frequency: "Daily",
        cycle: "4–8 weeks",
      },
      {
        name: "CJC-1295 no DAC / Ipamorelin Blend",
        recommended: "300–600mcg nightly",
        frequency: "Daily",
        cycle: "8–16 weeks",
      },
      {
        name: "GLOW Blend",
        recommended: "2–4mg per week",
        frequency: "Weekly",
        cycle: "4–8 weeks",
      },
      {
        name: "Klow Blend",
        recommended: "0.5mg-1.5mg",
        frequency: "Once daily or divided doses, protocol dependent",
        cycle: "4–8 weeks",
      },
      {
        name: "Tesamorelin / Ipamorelin Blend",
        recommended: "500–1000mcg nightly",
        frequency: "Daily",
        cycle: "8–16 weeks",
      },
    ],
  },
  {
    category: "Cognitive",
    peptides: [
      {
        name: "ARA-290",
        recommended: "2–8 mg per day",
        frequency: "Once daily or protocol dependent",
        cycle: "4–8 weeks",
      },
      {
        name: "Adamax",
        recommended: "300–600mcg daily",
        frequency: "Daily",
        cycle: "10–30 days",
      },
      {
        name: "Cyanocobalamin (Vitamin B12)",
        recommended: "1mg per dose",
        frequency: "1–3x weekly",
        cycle: "8–12 weeks",
      },
      {
        name: "IllumiNeuro",
        recommended: "500–1000mcg per day",
        frequency: "Daily",
        cycle: "30 days",
      },
      {
        name: "NA Selank",
        recommended: "300–600mcg per day",
        frequency: "Daily",
        cycle: "10–30 days",
      },
      {
        name: "NA Semax",
        recommended: "300–600mcg per day",
        frequency: "Daily",
        cycle: "10–30 days",
      },
      {
        name: "Selank",
        recommended: "300–600mcg per day",
        frequency: "Daily",
        cycle: "10–30 days",
      },
      {
        name: "Semax",
        recommended: "300–600mcg per day",
        frequency: "Daily",
        cycle: "10–30 days",
      },
    ],
  },
  {
    category: "Healing Repair",
    peptides: [
      {
        name: "AHK-Cu",
        recommended: "1–2mg per week",
        frequency: "2–3× weekly",
        cycle: "8–12 weeks",
      },
      {
        name: "Abaloparatide",
        recommended: "80mcg daily",
        frequency: "Daily",
        cycle: "8–12 weeks",
      },
      {
        name: "BPC-157",
        recommended: "200–500mcg per day",
        frequency: "Daily",
        cycle: "4–8 weeks",
      },
      {
        name: "GHK-Cu",
        recommended: "1–2mg per week",
        frequency: "2–3× weekly",
        cycle: "8–12 weeks",
      },
      {
        name: "TB-500 (tb4)",
        recommended: "2–5mg per week",
        frequency: "1–2× weekly",
        cycle: "4–6 weeks",
      },
      {
        name: "TB-500 FRAG",
        recommended: "2–5mg per week",
        frequency: "Weekly",
        cycle: "4–6 weeks",
      },
      {
        name: "Teriparatide",
        recommended: "20mcg daily",
        frequency: "Daily",
        cycle: "8–12 weeks",
      },
      {
        name: "Tri-Heal Max",
        recommended: "2–4mg per week",
        frequency: "Weekly",
        cycle: "4–6 weeks",
      },
    ],
  },
  {
    category: "Immune Support",
    peptides: [
      {
        name: "KPV",
        recommended: "100–500 mcg per day",
        frequency: "Once daily or divided doses, protocol dependent",
        cycle: "4–8 week",
      },
      {
        name: "Thymosin Alpha-1",
        recommended: "1–2mg per week",
        frequency: "2× weekly",
        cycle: "6–12 weeks",
      },
      {
        name: "Thymulin",
        recommended: "1–2mg per week",
        frequency: "Weekly",
        cycle: "6–12 weeks",
      },
    ],
  },
  {
    category: "Muscle Growth",
    peptides: [
      {
        name: "CJC-1295 no DAC",
        recommended: "100–300mcg per dose",
        frequency: "1–3x daily",
        cycle: "8–16 weeks",
      },
      {
        name: "CJC-1295 with DAC",
        recommended: "1–2mg per week",
        frequency: "Weekly",
        cycle: "12–24 weeks",
      },
      {
        name: "GHRP-2",
        recommended: "100–300mcg",
        frequency: "1–3x daily",
        cycle: "8–12 weeks",
      },
      {
        name: "GHRP-6",
        recommended: "100–300mcg",
        frequency: "1–3x daily",
        cycle: "8–12 weeks",
      },
      {
        name: "HGH 10IU",
        recommended: "1–4 IU per day",
        frequency: "Daily",
        cycle: "12–24 weeks",
      },
      {
        name: "HGH Fragment 176–191",
        recommended: "250–500mcg per day",
        frequency: "Daily",
        cycle: "8–12 weeks",
      },
      {
        name: "IGF-1 LR3",
        recommended: "20–50mcg per day",
        frequency: "Daily",
        cycle: "4–6 weeks",
      },
      {
        name: "Ipamorelin",
        recommended: "200–300mcg",
        frequency: "1–2x daily",
        cycle: "8–16 weeks",
      },
      {
        name: "L-Carnitine",
        recommended: "500–2000mg per day",
        frequency: "Daily",
        cycle: "8–16 weeks",
      },
      {
        name: "Sermorelin",
        recommended: "200–300mcg per day",
        frequency: "Daily",
        cycle: "12–24 weeks",
      },
      {
        name: "Tesamorelin",
        recommended: "1–2mg per day",
        frequency: "Daily",
        cycle: "12–24 weeks",
      },
    ],
  },
  {
    category: "Sexual Health",
    peptides: [
      {
        name: "Kisspeptin",
        recommended: "100–300mcg per dose",
        frequency: "2–3× weekly",
        cycle: "4–8 weeks",
      },
      {
        name: "Oxytocin",
        recommended: "50–200mcg",
        frequency: "As needed",
        cycle: "Intermittent",
      },
      {
        name: "PT-141",
        recommended: "1–2mg per use",
        frequency: "As needed",
        cycle: "Research dependent",
      },
    ],
  },
  {
    category: "Skin Pigmentation",
    peptides: [
      {
        name: "Melanotan I (MT1)",
        recommended: "250–500mcg per day",
        frequency: "Daily",
        cycle: "2–4 weeks",
      },
      {
        name: "Melanotan II (MT2)",
        recommended: "250–1000mcg per day",
        frequency: "Daily",
        cycle: "2–4 weeks",
      },
    ],
  },
  {
    category: "Sleep",
    peptides: [
      {
        name: "DSIP",
        recommended: "100–300mcg before sleep",
        frequency: "Nightly",
        cycle: "2–4 weeks",
      },
    ],
  },
  {
    category: "Weight Loss",
    peptides: [
      {
        name: "5-Amino-1MQ",
        recommended: "25 mg per day",
        frequency: "Daily",
        cycle: "4–6 weeks",
      },
      {
        name: "Adipotide",
        recommended: "1–2mg daily",
        frequency: "Daily",
        cycle: "2–4 weeks",
      },
      {
        name: "Cagrilintide",
        recommended: "0.3–4.5mg per week",
        frequency: "Once weekly",
        cycle: "12–20 weeks",
      },
      {
        name: "Mazdutide",
        recommended: "3–9mg per week",
        frequency: "Once weekly",
        cycle: "12–20 weeks",
      },
      {
        name: "PNC-27",
        recommended: "100–300 mcg",
        frequency: "Once daily or protocol dependent",
        cycle: "4–6 weeks",
      },
      {
        name: "Retatrutide",
        recommended: "2–12mg per week",
        frequency: "Once weekly",
        cycle: "12–24 weeks",
      },
      {
        name: "Semaglutide",
        recommended: "0.25–2.4mg per week",
        frequency: "Once weekly",
        cycle: "16–20 weeks",
      },
      {
        name: "Survodutide",
        recommended: "2–8mg per week",
        frequency: "Once weekly",
        cycle: "12–20 weeks",
      },
      {
        name: "Tirzepatide",
        recommended: "2.5–15mg per week",
        frequency: "Once weekly",
        cycle: "16–24 weeks",
      },
      {
        name: "VIP",
        recommended: "25–100 mcg per day",
        frequency: "Once daily or divided doses, depending on protocol",
        cycle: "4–12 weeks",
      },
    ],
  },
];

export default function Calculator() {
  const { peptideId } = useParams();
  const [dbData, setDbData] = useState(null);

  const canonicalUrl = peptideId
    ? `https://melbournepeptides.com.au/peptide-calculator/${peptideId}`
    : "https://melbournepeptides.com.au/peptide-calculator";

  const initialMath =
    peptideId && MATH_DEFAULTS[peptideId]
      ? MATH_DEFAULTS[peptideId]
      : MATH_DEFAULTS.default;

  const [syringeSize, setSyringeSize] = useState(SYRINGE_SIZES[2]);
  const [vialSizeMg, setVialSizeMg] = useState(initialMath.mg);
  const [waterAmountMl, setWaterAmountMl] = useState(initialMath.ml);
  const [doseMcg, setDoseMcg] = useState(initialMath.mcg);

  useEffect(() => {
    const newDefaults =
      peptideId && MATH_DEFAULTS[peptideId]
        ? MATH_DEFAULTS[peptideId]
        : MATH_DEFAULTS.default;
    setVialSizeMg(newDefaults.mg);
    setWaterAmountMl(newDefaults.ml);
    setDoseMcg(newDefaults.mcg);

    if (!peptideId) {
      setDbData(null);
      return;
    }

    async function fetchSEOData() {
      let searchSlug = peptideId;
      if (peptideId === "tb-500") searchSlug = "tb-500-tb4";
      if (peptideId === "melanotan-2") searchSlug = "melanotan-ii";
      if (peptideId === "cjc-1295") searchSlug = "cjc-1295-no-dac";

      const { data } = await supabase
        .from("products")
        .select("name, calc_description, calc_example, calc_faq")
        .eq("slug", searchSlug)
        .single();

      if (data && data.calc_description) {
        setDbData(data);
      } else {
        setDbData(null);
      }
    }
    fetchSEOData();
  }, [peptideId]);

  const result = useMemo(() => {
    const concentration = vialSizeMg / waterAmountMl;
    const doseMg = doseMcg / 1000;
    const volumeToDraw = doseMg / concentration;
    const units = volumeToDraw * 100;
    const fillPercent = (volumeToDraw / syringeSize.size) * 100;

    return {
      concentration: isFinite(concentration)
        ? concentration.toFixed(2)
        : "0.00",
      volumeMl: isFinite(volumeToDraw) ? volumeToDraw.toFixed(3) : "0.000",
      units: isFinite(units) ? (Math.round(units * 10) / 10).toFixed(1) : "0.0",
      percentFill: isFinite(fillPercent) ? Math.min(fillPercent, 100) : 0,
      isOverfill: fillPercent > 100,
    };
  }, [vialSizeMg, waterAmountMl, doseMcg, syringeSize]);

  const activeTitle = dbData?.name
    ? `${dbData.name} Dosage Calculator | Reconstitution Guide & Protocols`
    : "Peptide Dosage Calculator | BPC-157, TB-500 Reconstitution";

  const activeDesc = dbData?.calc_description
    ? dbData.calc_description.substring(0, 155) + "..."
    : "Accurately calculate your research peptide dosage. Includes specific dilution calculators for BPC-157, Semaglutide, TB-500, GHK-Cu, CJC-1295, and Melanotan.";

  const activeH1 = dbData?.name
    ? `${dbData.name} Dosage Calculator`
    : "Peptide Dosage Calculator";

  return (
    <div className="calc-container pb-20">
      <SEO title={activeTitle} description={activeDesc} url={canonicalUrl} />

      {/* POPPINS FONT INJECTION & TYPOGRAPHY ENFORCEMENT */}
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap');
        
        .calc-container, .calc-container * {
          font-family: 'Poppins', sans-serif !important;
        }
        .calc-container p, .calc-container span, .calc-container td, .calc-container label, .calc-container input, .calc-container div {
          font-weight: 400;
        }
        .calc-container h1, .calc-container h2, .calc-container h3, .calc-container h4, .calc-container strong, .calc-container th, .calc-container .big-number, .calc-container .section-label, .calc-container .calc-title, .calc-container .res-badge, .calc-container .step-number {
          font-weight: 600 !important;
        }
        /* Override specifically for table text so it remains highly readable */
        .premium-table td {
           font-weight: 400 !important;
        }
        .premium-table td:first-child, .premium-table td:last-child span {
           font-weight: 600 !important;
        }
      `,
        }}
      />

      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: activeH1,
          url: canonicalUrl,
          description: activeDesc,
          applicationCategory: "HealthAndFitnessApplication",
          operatingSystem: "All",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "AUD",
          },
        })}
      </script>

      {/* THE AUDITOR'S FAQ SCHEMA INJECTION */}
      {dbData?.calc_faq && dbData.calc_faq.length > 0 && (
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: dbData.calc_faq.map((faq) => ({
              "@type": "Question",
              name: faq.q,
              acceptedAnswer: {
                "@type": "Answer",
                text: faq.a,
              },
            })),
          })}
        </script>
      )}

      <div className="calc-page-header">
        <div className="header-title-row">
          <div className="icon-wrapper">
            <CalcIcon size={24} color="#4635de" />
          </div>
          <h1 className="calc-title">{activeH1}</h1>
        </div>
        <p className="calc-subtitle">
          Accurate reconstitution ratios and tick-mark measurements for
          {dbData?.name ? ` ${dbData.name} ` : " laboratory "} research and
          dilution protocols.
        </p>
      </div>

      <div className="calc-grid">
        {/* INPUT CARD */}
        <div className="calc-card input-section">
          <div className="section-label">Configuration Parameters</div>

          <div className="selector-container">
            <div className="input-group">
              <label>1. Select Syringe Volume</label>
            </div>
            <div className="syringe-select-grid">
              {SYRINGE_SIZES.map((s) => (
                <div
                  key={s.size}
                  className={`syringe-option ${syringeSize.size === s.size ? "selected" : ""}`}
                  onClick={() => setSyringeSize(s)}
                >
                  <Syringe className="syringe-icon" size={22} />
                  <span>{s.short}</span>
                </div>
              ))}
            </div>
            <div className="selected-name-display">
              Capacity: <span>{syringeSize.label}</span>
            </div>
          </div>

          <div className="divider"></div>

          <div className="inputs-vertical">
            <div className="input-group">
              <label>2. Vial Quantity (Powder)</label>
              <div className="input-wrapper">
                <input
                  type="number"
                  value={vialSizeMg}
                  onChange={(e) =>
                    setVialSizeMg(Math.max(0, parseFloat(e.target.value)))
                  }
                  step="1"
                />
                <span className="unit-badge">mg</span>
              </div>
            </div>

            <div className="input-group">
              <label>3. Bacteriostatic Water Added</label>
              <div className="input-wrapper">
                <input
                  type="number"
                  value={waterAmountMl}
                  onChange={(e) =>
                    setWaterAmountMl(Math.max(0.1, parseFloat(e.target.value)))
                  }
                  step="0.1"
                />
                <span className="unit-badge">ml</span>
              </div>
              <div className="helper-text">
                <Beaker size={14} /> Standard amounts: 1ml, 2ml, 3ml
              </div>
            </div>

            <div className="input-group highlight-group">
              <label>4. Desired Subject Dose</label>
              <div className="input-wrapper">
                <input
                  type="number"
                  value={doseMcg}
                  onChange={(e) =>
                    setDoseMcg(Math.max(0, parseFloat(e.target.value)))
                  }
                  step="50"
                />
                <span className="unit-badge">mcg</span>
              </div>
              <div className="helper-text">
                <Info size={14} /> 1000mcg = 1mg
              </div>
            </div>
          </div>
        </div>

        {/* RESULT CARD */}
        <div className="result-column">
          <div className="result-card">
            <div className="result-header">
              <span className="res-badge">Calculation Result</span>
              <h3>Reconstitution Solution</h3>
              <p className="concentration-wrapper">
                Concentration:{" "}
                <span className="concentration-text">
                  {result.concentration} mg/ml
                </span>
              </p>
            </div>

            <div className="result-main">
              <div className="result-label">Draw to Tick Mark:</div>
              <div
                className="big-number"
                style={
                  result.isOverfill
                    ? {
                        background: "none",
                        color: "#ef4444",
                        WebkitTextFillColor: "#ef4444",
                        fontSize: "2.5rem",
                      }
                    : {}
                }
              >
                {result.isOverfill ? "EXCEEDS SYRINGE" : result.units}
              </div>
              {!result.isOverfill && (
                <div className="unit-label">Units (IU)</div>
              )}
              <div className="syringe-type-text">
                on a {syringeSize.short} U-100 Insulin Syringe
              </div>
            </div>

            <div className="summary-box">
              <div className="summary-row">
                <span>Subject Dose</span>
                <strong>{doseMcg} mcg</strong>
              </div>
              <div className="summary-divider"></div>
              <div className="summary-row" style={{ textAlign: "right" }}>
                <span>Extract Volume</span>
                <strong className="volume-highlight">
                  {result.volumeMl} ml
                </strong>
              </div>
            </div>

            <div className="syringe-wrapper">
              <div className="syringe-container">
                <div className="syringe-ticks"></div>
                <div
                  className="syringe-fill"
                  style={{
                    width: `${result.percentFill}%`,
                    backgroundColor: result.isOverfill
                      ? "#ef4444"
                      : "rgba(13, 148, 136, 0.7)",
                  }}
                ></div>
                <div
                  className="syringe-plunger"
                  style={{ left: `${result.percentFill}%` }}
                ></div>
              </div>
              <div className="syringe-labels">
                <span>0</span>
                <span>{syringeSize.size / 2}ml</span>
                <span>{syringeSize.short}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- COMPREHENSIVE DOSAGE PROTOCOL TABLE --- */}
      <div className="seo-section-wrapper" style={{ marginTop: "60px" }}>
        <h2
          className="seo-section-title text-center"
          style={{ marginBottom: "10px" }}
        >
          Standard Dosage Protocols
        </h2>
        <p
          className="calc-subtitle"
          style={{
            margin: "0 auto 40px",
            textAlign: "center",
            maxWidth: "600px",
          }}
        >
          Industry-standard starting protocols based on common research goals.
        </p>

        <div
          className="premium-table-wrapper"
          style={{
            overflowX: "auto",
            background: "white",
            borderRadius: "16px",
            border: "1px solid #e2e8f0",
            boxShadow: "0 4px 6px -1px rgba(0,0,0,0.05)",
          }}
        >
          <table
            className="premium-table"
            style={{
              width: "100%",
              minWidth: "800px",
              borderCollapse: "collapse",
              textAlign: "left",
            }}
          >
            <thead>
              <tr
                style={{
                  background: "#f8fafc",
                  borderBottom: "2px solid #e2e8f0",
                }}
              >
                <th
                  style={{
                    padding: "16px 20px",
                    color: "#64748b",
                    fontSize: "0.85rem",
                    textTransform: "uppercase",
                  }}
                >
                  Peptide Name
                </th>
                <th
                  style={{
                    padding: "16px 20px",
                    color: "#64748b",
                    fontSize: "0.85rem",
                    textTransform: "uppercase",
                  }}
                >
                  Recommended Dose
                </th>
                <th
                  style={{
                    padding: "16px 20px",
                    color: "#64748b",
                    fontSize: "0.85rem",
                    textTransform: "uppercase",
                  }}
                >
                  Frequency
                </th>
                <th
                  style={{
                    padding: "16px 20px",
                    color: "#64748b",
                    fontSize: "0.85rem",
                    textTransform: "uppercase",
                  }}
                >
                  Cycle Length
                </th>
              </tr>
            </thead>
            <tbody>
              {PROTOCOL_CATEGORIES.map((categoryGroup, catIdx) => (
                <Fragment key={catIdx}>
                  {/* Category Header Row */}
                  <tr
                    style={{
                      background: "#f8fafc",
                      borderBottom: "2px solid #e2e8f0",
                      borderTop: catIdx > 0 ? "2px solid #e2e8f0" : "none",
                    }}
                  >
                    <td
                      colSpan={4}
                      style={{
                        padding: "16px 20px",
                        color: "#4635de",
                        fontWeight: "bold",
                        fontSize: "1.1rem",
                      }}
                    >
                      {categoryGroup.category}
                    </td>
                  </tr>

                  {/* Peptide Rows */}
                  {categoryGroup.peptides.map((peptide, pepIdx) => (
                    <tr
                      key={pepIdx}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        transition: "background 0.2s",
                        "&:hover": { background: "#f8fafc" },
                      }}
                    >
                      <td
                        style={{
                          padding: "16px 20px",
                          color: "#0f172a",
                          display: "flex",
                          alignItems: "center",
                          gap: "8px",
                          fontWeight: "600",
                        }}
                      >
                        <TestTube size={16} color="#64748b" /> {peptide.name}
                      </td>
                      <td
                        style={{
                          padding: "16px 20px",
                          color: "#475569",
                        }}
                      >
                        {peptide.recommended}
                      </td>
                      <td
                        style={{
                          padding: "16px 20px",
                          color: "#475569",
                        }}
                      >
                        {peptide.frequency}
                      </td>
                      <td
                        style={{
                          padding: "16px 20px",
                          color: "#0ea5e9",
                          fontWeight: "600",
                        }}
                      >
                        {peptide.cycle}
                      </td>
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* THE DYNAMIC DATABASE CONTENT INJECTION */}
      {dbData && (
        <div
          className="seo-section-wrapper"
          style={{ marginTop: "60px", paddingTop: "20px" }}
        >
          <div
            style={{
              background: "white",
              padding: "32px",
              borderRadius: "20px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
              marginBottom: "32px",
            }}
          >
            <h2
              style={{
                fontSize: "1.6rem",
                color: "#0f172a",
                marginBottom: "16px",
                display: "flex",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <BookOpen size={24} color="#4635de" /> About {dbData.name}{" "}
              Reconstitution
            </h2>
            <p
              style={{
                color: "#475569",
                fontSize: "1rem",
                lineHeight: "1.7",
                marginBottom: "24px",
              }}
            >
              {dbData.calc_description}
            </p>

            {dbData.calc_example && (
              <div
                style={{
                  background: "#f0fdf4",
                  borderLeft: "4px solid #16a34a",
                  padding: "20px",
                  borderRadius: "0 12px 12px 0",
                }}
              >
                <strong
                  style={{
                    display: "block",
                    color: "#166534",
                    marginBottom: "8px",
                    fontSize: "1rem",
                  }}
                >
                  Practical Example:
                </strong>
                <span style={{ color: "#15803d", lineHeight: "1.6" }}>
                  {dbData.calc_example}
                </span>
              </div>
            )}
          </div>

          {/* Dynamic FAQ Render */}
          {dbData.calc_faq && dbData.calc_faq.length > 0 && (
            <div
              style={{
                background: "white",
                padding: "32px",
                borderRadius: "20px",
                border: "1px solid #e2e8f0",
                boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.05)",
              }}
            >
              <h3
                style={{
                  fontSize: "1.4rem",
                  color: "#0f172a",
                  marginBottom: "24px",
                }}
              >
                {dbData.name} Dosing FAQs
              </h3>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "24px",
                }}
              >
                {dbData.calc_faq.map((faq, idx) => (
                  <div
                    key={idx}
                    style={{
                      paddingBottom:
                        idx !== dbData.calc_faq.length - 1 ? "24px" : "0",
                      borderBottom:
                        idx !== dbData.calc_faq.length - 1
                          ? "1px solid #f1f5f9"
                          : "none",
                    }}
                  >
                    <h4
                      style={{
                        color: "#1e293b",
                        marginBottom: "8px",
                        fontSize: "1.05rem",
                      }}
                    >
                      {faq.q}
                    </h4>
                    <p
                      style={{ color: "#475569", lineHeight: "1.6", margin: 0 }}
                    >
                      {faq.a}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="seo-section-wrapper">
        <h2 className="seo-section-title text-center">
          How to Use the Peptide Calculator
        </h2>
        <div className="steps-grid">
          <div className="step-card">
            <div className="step-number">1</div>
            <h4>Select Syringe</h4>
            <p>
              Choose the capacity of your insulin syringe. The standard for
              research is a 1.0ml (100 Unit) U-100 syringe.
            </p>
          </div>
          <div className="step-card">
            <div className="step-number">2</div>
            <h4>Enter Vial Size</h4>
            <p>
              Input the total amount of lyophilized powder in your vial in
              milligrams (e.g., 5mg or 10mg).
            </p>
          </div>
          <div className="step-card">
            <div className="step-number">3</div>
            <h4>Add Bac Water</h4>
            <p>
              Enter the volume of bacteriostatic water (in ml) you intend to
              inject into the vial for reconstitution.
            </p>
          </div>
          <div className="step-card">
            <div className="step-number">4</div>
            <h4>Set Target Dose</h4>
            <p>
              Input the exact microgram (mcg) dosage required for your subject
              to instantly view the required unit draw.
            </p>
          </div>
        </div>
      </div>

      {/* TRUST LAYER CONTENT */}
      <div className="seo-section-wrapper trust-layer">
        <div className="trust-grid">
          <div className="trust-card">
            <BookOpen size={28} className="icon-blue mb-4" />
            <h3>What is Peptide Reconstitution?</h3>
            <p>
              Reconstitution is the process of mixing lyophilized (freeze-dried)
              research peptides with a sterile solvent—most commonly
              Bacteriostatic Water. This transforms the stable powder into a
              liquid solution suitable for laboratory measurement and subject
              administration.
            </p>
          </div>
          <div className="trust-card">
            <ShieldCheck size={28} className="icon-blue mb-4" />
            <h3>Why Accurate Dosage Matters</h3>
            <p>
              In scientific research, precise micro-dosing is critical for
              ensuring data integrity and subject safety. Utilizing a peptide
              dosage calculator eliminates human math errors when converting
              milligrams (mg) to micrograms (mcg) across various syringe
              capacities.
            </p>
          </div>
          <div className="trust-card">
            <AlertTriangle size={28} className="icon-blue mb-4" />
            <h3>Common Mixing Mistakes</h3>
            <p>
              The most frequent error in laboratories is failing to account for
              the displacement volume of the powder itself, or using the wrong
              syringe type (U-40 vs U-100). Always ensure you are calculating
              against a standard U-100 insulin syringe for our formulas.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
