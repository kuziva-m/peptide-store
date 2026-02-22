import { useState, useMemo } from "react";
import { Beaker, Info, Calculator as CalcIcon, Syringe } from "lucide-react";
import "./Calculator.css";

const SYRINGE_SIZES = [
  { size: 0.3, label: "0.3ml (30 Units)", short: "0.3ml" },
  { size: 0.5, label: "0.5ml (50 Units)", short: "0.5ml" },
  { size: 1.0, label: "1.0ml (100 Units)", short: "1.0ml" },
];

export default function Calculator() {
  // Inputs
  const [syringeSize, setSyringeSize] = useState(SYRINGE_SIZES[2]); // Default 1.0ml
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

    // 4. Calculate Units (Standard U-100 Insulin Syringe)
    // 1ml = 100 units, regardless of syringe total capacity
    const units = volumeToDraw * 100;

    // 5. Calculate Visual Fill Percentage based on SELECTED syringe size
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

          {/* Syringe Selector */}
          <div className="selector-container">
            <label className="input-label">1. Select Syringe Volume</label>
            <div className="syringe-select-grid">
              {SYRINGE_SIZES.map((s) => (
                <button
                  key={s.size}
                  className={`syringe-option ${
                    syringeSize.size === s.size ? "selected" : ""
                  }`}
                  onClick={() => setSyringeSize(s)}
                >
                  <Syringe
                    size={24}
                    className="syringe-icon"
                    style={{
                      transform:
                        s.size === 0.3
                          ? "scale(0.8)"
                          : s.size === 0.5
                          ? "scale(0.9)"
                          : "scale(1)",
                    }}
                  />
                  <span>{s.short}</span>
                </button>
              ))}
            </div>
            <div className="selected-name-display">
              Capacity: <span>{syringeSize.label}</span>
            </div>
          </div>

          <div className="divider"></div>

          {/* Inputs */}
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
                <Beaker size={12} /> Standard amounts: 1ml, 2ml, 3ml
              </div>
            </div>

            <div className="input-group highlight-group">
              <label style={{ color: "var(--primary)" }}>
                4. Desired Subject Dose
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
              <h3 style={{ fontSize: "1.2rem" }}>Reconstitution Solution</h3>
              <p className="concentration-text">
                Concentration: <strong>{result.concentration} mg/ml</strong>
              </p>
            </div>

            <div className="result-main">
              <span className="result-label">Draw to Tick Mark:</span>
              <div
                className="big-number"
                style={{ color: result.isOverfill ? "#ef4444" : "inherit" }}
              >
                {result.isOverfill ? "EXCEEDS SYRINGE" : result.units}
              </div>
              {!result.isOverfill && (
                <div className="unit-label">Units (IU)</div>
              )}
              <p className="syringe-type-text">
                on a {syringeSize.short} U-100 Insulin Syringe
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

                {/* Liquid Fill */}
                <div
                  className="syringe-fill"
                  style={{
                    width: `${result.percentFill}%`,
                    backgroundColor: result.isOverfill
                      ? "#ef4444"
                      : "rgba(13, 148, 136, 0.7)",
                  }}
                ></div>

                {/* Plunger */}
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
    </div>
  );
}
