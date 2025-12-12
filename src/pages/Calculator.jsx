import { useState, useMemo } from "react";
import { Beaker, Info, Calculator as CalcIcon } from "lucide-react";
import "./Calculator.css";

// Use the exact peptides from your inventory for the visual selector
const PEPTIDES = [
  {
    id: 1,
    name: "Semaglutide",
    image_url:
      "https://lkrgpjouxoxhkqxhsown.supabase.co/storage/v1/object/public/product-images/main_1_1765297359248",
  },
  {
    id: 2,
    name: "Tirzepatide",
    image_url:
      "https://lkrgpjouxoxhkqxhsown.supabase.co/storage/v1/object/public/product-images/main_2_1765297671876",
  },
  {
    id: 3,
    name: "Retatrutide",
    image_url:
      "https://lkrgpjouxoxhkqxhsown.supabase.co/storage/v1/object/public/product-images/main_3_1765297831957",
  },
  {
    id: 9,
    name: "BPC-157",
    image_url:
      "https://lkrgpjouxoxhkqxhsown.supabase.co/storage/v1/object/public/product-images/main_9_1765297857676",
  },
  {
    id: 10,
    name: "TB-500",
    image_url:
      "https://lkrgpjouxoxhkqxhsown.supabase.co/storage/v1/object/public/product-images/main_10_1765297794391",
  },
  {
    id: 13,
    name: "Melanotan II",
    image_url:
      "https://lkrgpjouxoxhkqxhsown.supabase.co/storage/v1/object/public/product-images/main_13_1765297643486",
  },
  {
    id: 23,
    name: "GHK-Cu",
    image_url:
      "https://lkrgpjouxoxhkqxhsown.supabase.co/storage/v1/object/public/product-images/main_23_1765297135432",
  },
];

export default function Calculator() {
  const [selectedPeptide, setSelectedPeptide] = useState(PEPTIDES[0]);

  // Inputs
  const [vialSizeMg, setVialSizeMg] = useState(5); // Default 5mg
  const [waterAmountMl, setWaterAmountMl] = useState(2); // Default 2ml
  const [doseMcg, setDoseMcg] = useState(250); // Default 250mcg

  // Calculations
  const result = useMemo(() => {
    // 1. Calculate Concentration (mg/ml)
    const concentration = vialSizeMg / waterAmountMl;

    // 2. Convert Dose to MG
    const doseMg = doseMcg / 1000;

    // 3. Calculate Volume to Draw (ml)
    const volumeToDraw = doseMg / concentration;

    // 4. Calculate Units (U-100 Syringe)
    const units = volumeToDraw * 100;

    return {
      concentration: isFinite(concentration)
        ? concentration.toFixed(2)
        : "0.00",
      volumeMl: isFinite(volumeToDraw) ? volumeToDraw.toFixed(3) : "0.000",
      units: isFinite(units) ? (Math.round(units * 10) / 10).toFixed(1) : "0.0",
      percentFill: isFinite(units)
        ? Math.min((volumeToDraw / 1) * 100, 100)
        : 0,
    };
  }, [vialSizeMg, waterAmountMl, doseMcg]);

  return (
    <div className="calc-container">
      <div className="calc-page-header">
        <div className="icon-wrapper">
          <CalcIcon size={32} color="var(--primary)" />
        </div>
        <div>
          <h1 className="calc-title">Peptide Dosage Calculator</h1>
          <p className="calc-subtitle">
            Accurate reconstitution ratios for laboratory research.
          </p>
        </div>
      </div>

      <div className="calc-grid">
        {/* --- INPUT CARD --- */}
        <div className="calc-card input-section">
          <div className="section-label">Configuration</div>

          {/* Peptide Selector */}
          <div className="selector-container">
            <label className="input-label">Select Compound (Visual Only)</label>
            <div className="product-select-grid">
              {PEPTIDES.map((p) => (
                <button
                  key={p.id}
                  className={`calc-thumb ${
                    selectedPeptide.id === p.id ? "selected" : ""
                  }`}
                  onClick={() => setSelectedPeptide(p)}
                  title={p.name}
                >
                  <img src={p.image_url} alt={p.name} />
                </button>
              ))}
            </div>
            <div className="selected-name-display">
              Selected: <span>{selectedPeptide.name}</span>
            </div>
          </div>

          <div className="divider"></div>

          {/* Inputs */}
          <div className="inputs-vertical">
            <div className="input-group">
              <label>Vial Quantity (Powder)</label>
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
              <label>Bacteriostatic Water Added</label>
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
                <Beaker size={12} /> Standard amounts: 1ml, 2ml, 3ml
              </div>
            </div>

            <div className="input-group highlight-group">
              <label style={{ color: "var(--primary)" }}>
                Desired Subject Dose
              </label>
              <div className="input-wrapper">
                <input
                  type="number"
                  value={doseMcg}
                  onChange={(e) =>
                    setDoseMcg(Math.max(0, parseFloat(e.target.value)))
                  }
                  step="50"
                  style={{ borderColor: "var(--primary)", fontWeight: "600" }}
                />
                <span
                  className="unit-badge"
                  style={{ color: "var(--primary)", background: "#e0e7ff" }}
                >
                  mcg
                </span>
              </div>
              <div className="helper-text">
                <Info size={12} /> 1000mcg = 1mg
              </div>
            </div>
          </div>
        </div>

        {/* --- RESULT CARD --- */}
        <div className="result-column">
          <div className="result-card">
            <div className="result-header">
              <span className="res-badge">Result</span>
              <h3>{selectedPeptide.name} Solution</h3>
              <p className="concentration-text">
                Concentration: <strong>{result.concentration} mg/ml</strong>
              </p>
            </div>

            <div className="result-main">
              <span className="result-label">Draw to Tick Mark:</span>
              <div className="big-number">{result.units}</div>
              <div className="unit-label">Units (IU)</div>
              <p className="syringe-type-text">
                on a Standard U-100 Insulin Syringe
              </p>
            </div>

            <div className="summary-box">
              <div className="summary-row">
                <span>Dose:</span>
                <strong>{doseMcg} mcg</strong>
              </div>
              <div className="summary-row">
                <span>Volume:</span>
                <strong>{result.volumeMl} ml</strong>
              </div>
            </div>

            {/* Syringe Visual - Hidden on Mobile via CSS */}
            <div className="syringe-wrapper">
              <div className="syringe-container">
                <div className="syringe-ticks"></div>
                <div
                  className="syringe-fill"
                  style={{ width: `${result.percentFill}%` }}
                ></div>
                <div
                  className="syringe-plunger"
                  style={{ left: `${result.percentFill}%` }}
                ></div>
              </div>
              <div className="syringe-labels">
                <span>0</span>
                <span>50</span>
                <span>100 Units (1ml)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
