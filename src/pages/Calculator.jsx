import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Beaker,
  Info,
  Calculator as CalcIcon,
  Syringe,
  TestTube,
  Zap,
} from "lucide-react";
import SEO from "../components/SEO";
import "./Calculator.css";

const SYRINGE_SIZES = [
  { size: 0.3, label: "0.3ml (30 Units)", short: "0.3ml" },
  { size: 0.5, label: "0.5ml (50 Units)", short: "0.5ml" },
  { size: 1.0, label: "1.0ml (100 Units)", short: "1.0ml" },
];

export default function Calculator() {
  // Inputs
  const [syringeSize, setSyringeSize] = useState(SYRINGE_SIZES[2]);
  const [vialSizeMg, setVialSizeMg] = useState(5);
  const [waterAmountMl, setWaterAmountMl] = useState(2);
  const [doseMcg, setDoseMcg] = useState(250);

  // Calculations
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

  return (
    <div className="calc-container pb-20 bg-gray-50 font-sans">
      <SEO
        title="Peptide Reconstitution Calculator | BPC-157, TB-500 & More"
        description="Accurately calculate your research peptide dosage. Includes specific dilution calculators for BPC-157, Semaglutide, TB-500, GHK-Cu, CJC-1295, and Melanotan."
        url="https://melbournepeptides.com.au/peptide-calculator"
      />

      {/* SEO UPDATE: JSON-LD WebApplication Schema */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Peptide Reconstitution Calculator",
          url: "https://melbournepeptides.com.au/peptide-calculator",
          description:
            "Accurately calculate your research peptide dosage and bacteriostatic water requirements.",
          applicationCategory: "HealthAndFitnessApplication",
          operatingSystem: "All",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "AUD",
          },
        })}
      </script>

      <div className="calc-page-header bg-white border-b border-gray-200 py-12 px-4 shadow-sm text-center mb-10">
        <div className="max-w-4xl mx-auto flex flex-col items-center">
          <div className="bg-blue-100 p-4 rounded-full mb-4">
            <CalcIcon size={40} className="text-blue-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-4">
            Peptide Dosage Calculator
          </h1>
          <p className="text-lg text-gray-600 font-light max-w-2xl">
            Accurate reconstitution ratios and tick-mark measurements for
            laboratory research.
          </p>
        </div>
      </div>

      <div className="calc-grid mb-16 max-w-6xl mx-auto px-4 gap-8">
        {/* INPUT CARD */}
        <div className="calc-card input-section bg-white p-6 sm:p-8 rounded-2xl shadow-md border border-gray-200">
          <div className="text-lg font-bold text-gray-900 mb-6 border-b pb-2">
            Configuration
          </div>

          <div className="selector-container mb-6">
            <label className="block text-sm font-bold text-gray-700 mb-3">
              1. Select Syringe Volume
            </label>
            <div className="grid grid-cols-3 gap-3 mb-3">
              {SYRINGE_SIZES.map((s) => (
                <button
                  key={s.size}
                  className={`flex flex-col items-center justify-center p-3 rounded-xl border-2 transition-all ${syringeSize.size === s.size ? "border-blue-600 bg-blue-50 text-blue-700" : "border-gray-200 hover:border-blue-300 text-gray-600"}`}
                  onClick={() => setSyringeSize(s)}
                >
                  <Syringe size={20} className="mb-1" />
                  <span className="text-sm font-bold">{s.short}</span>
                </button>
              ))}
            </div>
            <div className="text-xs text-gray-500 text-right">
              Capacity:{" "}
              <span className="font-bold text-gray-700">
                {syringeSize.label}
              </span>
            </div>
          </div>

          <div className="border-t border-gray-100 my-6"></div>

          <div className="space-y-6">
            <div className="input-group">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                2. Vial Quantity (Powder)
              </label>
              <div className="relative">
                <input
                  type="number"
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold text-lg"
                  value={vialSizeMg}
                  onChange={(e) =>
                    setVialSizeMg(Math.max(0, parseFloat(e.target.value)))
                  }
                  step="1"
                />
                <span className="absolute right-4 top-3 text-gray-500 font-bold">
                  mg
                </span>
              </div>
            </div>

            <div className="input-group">
              <label className="block text-sm font-bold text-gray-700 mb-2">
                3. Bacteriostatic Water Added
              </label>
              <div className="relative">
                <input
                  type="number"
                  className="w-full bg-gray-50 border border-gray-300 rounded-lg py-3 px-4 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-bold text-lg"
                  value={waterAmountMl}
                  onChange={(e) =>
                    setWaterAmountMl(Math.max(0.1, parseFloat(e.target.value)))
                  }
                  step="0.1"
                />
                <span className="absolute right-4 top-3 text-gray-500 font-bold">
                  ml
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-2 flex items-center gap-1">
                <Beaker size={12} /> Standard amounts: 1ml, 2ml, 3ml
              </p>
            </div>

            <div className="input-group bg-blue-50 p-4 rounded-xl border border-blue-100">
              <label className="block text-sm font-bold text-blue-900 mb-2">
                4. Desired Subject Dose
              </label>
              <div className="relative">
                <input
                  type="number"
                  className="w-full bg-white border-2 border-blue-400 rounded-lg py-3 px-4 focus:ring-2 focus:ring-blue-600 focus:border-blue-600 font-bold text-lg text-blue-900"
                  value={doseMcg}
                  onChange={(e) =>
                    setDoseMcg(Math.max(0, parseFloat(e.target.value)))
                  }
                  step="50"
                />
                <span className="absolute right-4 top-3 text-blue-700 font-bold bg-blue-100 px-2 rounded">
                  mcg
                </span>
              </div>
              <p className="text-xs text-blue-700 mt-2 flex items-center gap-1">
                <Info size={12} /> 1000mcg = 1mg
              </p>
            </div>
          </div>
        </div>

        {/* RESULT CARD */}
        <div className="result-column">
          <div className="result-card bg-gray-900 text-white p-6 sm:p-8 rounded-2xl shadow-xl sticky top-6">
            <div className="border-b border-gray-700 pb-4 mb-6">
              <span className="bg-blue-600 text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                Result
              </span>
              <h3 className="text-xl font-bold mt-3">
                Reconstitution Solution
              </h3>
              <p className="text-gray-400 text-sm mt-1">
                Concentration:{" "}
                <strong className="text-white text-base">
                  {result.concentration} mg/ml
                </strong>
              </p>
            </div>

            <div className="text-center mb-8">
              <span className="text-gray-400 text-sm block mb-2">
                Draw to Tick Mark:
              </span>
              <div
                className={`text-6xl font-black tracking-tighter ${result.isOverfill ? "text-red-500 text-4xl" : "text-green-400"}`}
              >
                {result.isOverfill ? "EXCEEDS SYRINGE" : result.units}
              </div>
              {!result.isOverfill && (
                <div className="text-gray-300 font-bold uppercase tracking-widest mt-1">
                  Units (IU)
                </div>
              )}
              <p className="text-gray-500 text-xs mt-3">
                on a {syringeSize.short} U-100 Insulin Syringe
              </p>
            </div>

            <div className="bg-gray-800 rounded-xl p-4 mb-8 flex justify-between items-center border border-gray-700">
              <div>
                <span className="block text-xs text-gray-400">Dose</span>
                <strong className="text-lg">{doseMcg} mcg</strong>
              </div>
              <div className="w-px h-8 bg-gray-600"></div>
              <div className="text-right">
                <span className="block text-xs text-gray-400">Volume</span>
                <strong className="text-lg text-blue-400">
                  {result.volumeMl} ml
                </strong>
              </div>
            </div>

            {/* SYRINGE VISUAL (Kept original CSS logic) */}
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

      {/* SEO SECTION: MAIN PEPTIDE ANCHORS */}
      <div className="max-w-6xl mx-auto mt-16 px-4 border-t border-gray-200 pt-16">
        <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">
          Specific Peptide Calculators & Examples
        </h2>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {/* Main 5 Peptides... */}
          <div
            id="bpc157"
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 scroll-mt-24"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
              <TestTube className="text-blue-600" size={20} /> BPC-157
              Calculator
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Commonly supplied in 5mg or 10mg lyophilized vials for tissue
              repair models.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm border border-gray-200 mb-4">
              10mg BPC-157 + 2ml Water ={" "}
              <strong className="text-green-600">5mg/ml concentration</strong>
            </div>
            <Link
              to="/bpc-157"
              className="text-blue-600 font-bold text-sm hover:underline"
            >
              View BPC-157 Research →
            </Link>
          </div>

          <div
            id="semaglutide"
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 scroll-mt-24"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
              <TestTube className="text-blue-600" size={20} /> Semaglutide
              Calculator
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Requires precise micro-dosing dilutions for GLP-1 receptor
              studies.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm border border-gray-200 mb-4">
              5mg Semaglutide + 2ml Water ={" "}
              <strong className="text-green-600">2.5mg/ml concentration</strong>
            </div>
            <Link
              to="/semaglutide"
              className="text-blue-600 font-bold text-sm hover:underline"
            >
              View Semaglutide Research →
            </Link>
          </div>

          <div
            id="tirzepatide"
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 scroll-mt-24"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
              <TestTube className="text-blue-600" size={20} /> Tirzepatide
              Calculator
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Often reconstituted from larger 10mg or 15mg vials for
              dual-agonist models.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm border border-gray-200 mb-4">
              10mg Tirzepatide + 2ml Water ={" "}
              <strong className="text-green-600">5mg/ml concentration</strong>
            </div>
            <Link
              to="/tirzepatide"
              className="text-blue-600 font-bold text-sm hover:underline"
            >
              View Tirzepatide Research →
            </Link>
          </div>

          <div
            id="tb500"
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 scroll-mt-24"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
              <TestTube className="text-blue-600" size={20} /> TB-500 Calculator
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Thymosin Beta-4 requires careful volumetric calculations for
              systemic models.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm border border-gray-200 mb-4">
              5mg TB-500 + 2ml Water ={" "}
              <strong className="text-green-600">2.5mg/ml concentration</strong>
            </div>
            <Link
              to="/tb-500-tb4"
              className="text-blue-600 font-bold text-sm hover:underline"
            >
              View TB-500 Research →
            </Link>
          </div>

          <div
            id="ghkcu"
            className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 scroll-mt-24 lg:col-span-2"
          >
            <h3 className="text-xl font-bold text-gray-900 mb-3 flex items-center gap-2">
              <TestTube className="text-blue-600" size={20} /> GHK-Cu Calculator
            </h3>
            <p className="text-gray-600 text-sm mb-4">
              Requires significantly higher dilution volumes (up to 5ml water)
              due to its 50mg raw vial size to prevent subject tissue
              irritation.
            </p>
            <div className="bg-gray-50 p-4 rounded-lg font-mono text-sm border border-gray-200 mb-4">
              50mg GHK-Cu + 5ml Water ={" "}
              <strong className="text-green-600">10mg/ml concentration</strong>
            </div>
            <Link
              to="/ghk-cu"
              className="text-blue-600 font-bold text-sm hover:underline"
            >
              View GHK-Cu Research →
            </Link>
          </div>
        </div>

        {/* SEO QUICK INDEX (The Fix for the other 30 keywords!) */}
        <h3 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
          <Zap className="text-blue-500" /> Quick Calculator Index
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div
            id="melanotan2"
            className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm scroll-mt-24 hover:border-blue-300 transition"
          >
            <h4 className="font-bold text-gray-900 text-sm mb-1">
              Melanotan 2
            </h4>
            <p className="text-xs text-gray-500 font-mono mb-2">
              10mg + 2ml ={" "}
              <span className="text-green-600 font-bold">5mg/ml</span>
            </p>
            <Link
              to="/melanotan-ii"
              className="text-blue-600 text-xs font-bold hover:underline"
            >
              MT-2 Guide →
            </Link>
          </div>

          <div
            id="cjc1295"
            className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm scroll-mt-24 hover:border-blue-300 transition"
          >
            <h4 className="font-bold text-gray-900 text-sm mb-1">
              CJC-1295 (No DAC)
            </h4>
            <p className="text-xs text-gray-500 font-mono mb-2">
              2mg + 1ml ={" "}
              <span className="text-green-600 font-bold">2mg/ml</span>
            </p>
            <Link
              to="/cjc-1295-no-dac"
              className="text-blue-600 text-xs font-bold hover:underline"
            >
              CJC Guide →
            </Link>
          </div>

          <div
            id="ipamorelin"
            className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm scroll-mt-24 hover:border-blue-300 transition"
          >
            <h4 className="font-bold text-gray-900 text-sm mb-1">Ipamorelin</h4>
            <p className="text-xs text-gray-500 font-mono mb-2">
              5mg + 2ml ={" "}
              <span className="text-green-600 font-bold">2.5mg/ml</span>
            </p>
            <Link
              to="/ipamorelin"
              className="text-blue-600 text-xs font-bold hover:underline"
            >
              Ipamorelin Guide →
            </Link>
          </div>

          <div
            id="epitalon"
            className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm scroll-mt-24 hover:border-blue-300 transition"
          >
            <h4 className="font-bold text-gray-900 text-sm mb-1">Epitalon</h4>
            <p className="text-xs text-gray-500 font-mono mb-2">
              10mg + 2ml ={" "}
              <span className="text-green-600 font-bold">5mg/ml</span>
            </p>
            <Link
              to="/epitalon"
              className="text-blue-600 text-xs font-bold hover:underline"
            >
              Epitalon Guide →
            </Link>
          </div>

          <div
            id="retatrutide"
            className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm scroll-mt-24 hover:border-blue-300 transition"
          >
            <h4 className="font-bold text-gray-900 text-sm mb-1">
              Retatrutide
            </h4>
            <p className="text-xs text-gray-500 font-mono mb-2">
              10mg + 2ml ={" "}
              <span className="text-green-600 font-bold">5mg/ml</span>
            </p>
            <Link
              to="/retatrutide"
              className="text-blue-600 text-xs font-bold hover:underline"
            >
              Retatrutide Guide →
            </Link>
          </div>

          <div
            id="hgh"
            className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm scroll-mt-24 hover:border-blue-300 transition"
          >
            <h4 className="font-bold text-gray-900 text-sm mb-1">
              HGH (191aa)
            </h4>
            <p className="text-xs text-gray-500 font-mono mb-2">
              10IU + 1ml ={" "}
              <span className="text-green-600 font-bold">10IU/ml</span>
            </p>
            <Link
              to="/hgh-191aa"
              className="text-blue-600 text-xs font-bold hover:underline"
            >
              HGH Guide →
            </Link>
          </div>

          <div
            id="igf1"
            className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm scroll-mt-24 hover:border-blue-300 transition"
          >
            <h4 className="font-bold text-gray-900 text-sm mb-1">IGF-1 LR3</h4>
            <p className="text-xs text-gray-500 font-mono mb-2">
              1mg + 1ml ={" "}
              <span className="text-green-600 font-bold">1mg/ml</span>
            </p>
            <Link
              to="/igf-1-lr3"
              className="text-blue-600 text-xs font-bold hover:underline"
            >
              IGF-1 Guide →
            </Link>
          </div>

          <div
            id="pt141"
            className="bg-white p-4 rounded-xl border border-gray-200 shadow-sm scroll-mt-24 hover:border-blue-300 transition opacity-50"
          >
            <h4 className="font-bold text-gray-900 text-sm mb-1">PT-141</h4>
            <p className="text-xs text-gray-500 font-mono mb-2">Coming Soon</p>
          </div>
        </div>
      </div>
    </div>
  );
}
