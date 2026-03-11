import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import {
  Droplets,
  ShieldCheck,
  Calculator,
  ThermometerSnowflake,
  AlertTriangle,
} from "lucide-react";

export default function ReconstitutionGuide() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How much bacteriostatic water do I mix with a 10mg peptide vial?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "A standard laboratory protocol is to mix 2ml of bacteriostatic water with a 10mg peptide vial. This yields a concentration of 5mg/ml.",
        },
      },
      {
        "@type": "Question",
        name: "Do I shake the peptide vial to mix it?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "No. Peptides are fragile amino acid chains. You should gently roll or swirl the vial, never vigorously shake it, as this can damage the molecular structure.",
        },
      },
      {
        "@type": "Question",
        name: "How long do reconstituted peptides last?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Once reconstituted with bacteriostatic water and stored in a refrigerator (2°C to 8°C), research peptides generally remain stable for 3 to 4 weeks.",
        },
      },
    ],
  };

  return (
    <div className="bg-gray-50 min-h-screen pb-20 font-sans">
      <SEO
        title="How to Reconstitute Peptides | Step-by-Step Guide"
        description="Learn exactly how to reconstitute research peptides with bacteriostatic water. Step-by-step instructions, dilution ratios, and storage best practices."
        url="https://melbournepeptides.com.au/peptide-reconstitution-guide"
      />
      <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>

      {/* Hero Section */}
      <div className="bg-white border-b border-gray-200 py-16 px-4 sm:px-6 lg:px-8 mb-12 text-center shadow-sm">
        <div className="max-w-4xl mx-auto">
          <span className="text-blue-600 font-bold tracking-widest uppercase text-sm mb-3 block">
            Laboratory Resources
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-6">
            Peptide Reconstitution Guide
          </h1>
          <p className="text-xl text-gray-600 font-light leading-relaxed max-w-3xl mx-auto">
            A comprehensive, step-by-step guide on how to properly mix
            lyophilized research peptides with bacteriostatic water for accurate
            laboratory studies.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-12">
          <section className="bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <ShieldCheck className="text-blue-600" size={32} /> Step 1:
              Preparation & Sterilization
            </h2>
            <p className="text-gray-700 text-lg leading-relaxed mb-4">
              Before beginning the reconstitution process, ensure your workspace
              is completely sterile. Peptides are highly sensitive to
              contamination.
            </p>
            <ul className="list-disc list-inside text-gray-700 text-lg space-y-3 ml-4">
              <li>Wash hands thoroughly and wear laboratory gloves.</li>
              <li>Wipe down your workspace with an alcohol-based cleaner.</li>
              <li>
                Pop the plastic caps off both the peptide vial and the
                Bacteriostatic Water vial.
              </li>
              <li>
                Use a fresh alcohol prep pad to wipe the rubber stoppers on both
                vials. Let them air dry.
              </li>
            </ul>
          </section>

          <section className="bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Droplets className="text-blue-600" size={32} /> Step 2: Mixing
              the Solution
            </h2>
            <div className="space-y-6 text-gray-700 text-lg leading-relaxed">
              <p>
                Using a sterile syringe, draw the required amount of air into
                the syringe, push the air into the Bacteriostatic Water vial (to
                prevent a vacuum), and draw your desired amount of water.
              </p>
              <div className="bg-blue-50 border border-blue-100 p-6 rounded-xl border-l-4 border-l-blue-600">
                <h3 className="font-bold text-gray-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="text-orange-500" size={20} />{" "}
                  Crucial Rule: Do Not Shake
                </h3>
                <p className="text-sm">
                  Peptide amino acid chains are incredibly fragile. When
                  injecting the water into the peptide vial, aim the needle at
                  the glass wall of the vial, allowing the water to drip down
                  the side gently.{" "}
                  <strong>
                    Never spray water directly onto the powder, and never
                    vigorously shake the vial.
                  </strong>{" "}
                  Gently roll or swirl the vial between your fingers until the
                  powder dissolves and the liquid is perfectly clear.
                </p>
              </div>
            </div>
          </section>

          <section className="bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 flex items-center gap-3">
              <Calculator className="text-blue-600" size={32} /> Understanding
              Dilution Ratios
            </h2>
            <p className="text-gray-700 text-lg leading-relaxed mb-6">
              The amount of bacteriostatic water you add determines the
              concentration of your solution. Here is a standard example used in
              research settings:
            </p>
            <div className="bg-gray-900 text-white rounded-xl p-6 font-mono text-sm leading-relaxed mb-6 shadow-md">
              <p className="text-blue-400 mb-2">// STANDARD 10MG MIXTURE</p>
              <p>Peptide Vial Size: 10mg</p>
              <p>Bacteriostatic Water Added: 2ml</p>
              <p className="mt-2 text-green-400">
                Resulting Concentration: 5mg per 1ml
              </p>
              <p className="text-gray-400 mt-2">
                Drawing 0.1ml (10 units on an insulin syringe) = 500mcg dose.
              </p>
            </div>
          </section>

          {/* FAQ Section for Schema */}
          <section className="bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-gray-100">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                <h3 className="font-bold text-gray-900 text-lg mb-2">
                  Can I use sterile water instead of bacteriostatic water?
                </h3>
                <p className="text-gray-700">
                  Sterile water is only for single-use injections.
                  Bacteriostatic water contains 0.9% benzyl alcohol, which
                  prevents bacterial growth and allows the multi-use vial to
                  remain stable in the fridge for up to 4 weeks.
                </p>
              </div>
              <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                <h3 className="font-bold text-gray-900 text-lg mb-2">
                  Why is the vial pressurized?
                </h3>
                <p className="text-gray-700">
                  Lyophilized peptide vials are packed in a vacuum. When you
                  insert the needle to add water, the vacuum will pull the water
                  in automatically. If the vacuum is too strong, you can safely
                  inject a small amount of air to equalize the pressure.
                </p>
              </div>
            </div>
          </section>
        </div>

        {/* Sticky Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-blue-600 text-white rounded-2xl shadow-lg p-8 text-center sticky top-6">
            <Calculator size={48} className="mx-auto mb-4 text-blue-200" />
            <h3 className="text-2xl font-bold mb-3">Don't guess the math.</h3>
            <p className="text-blue-100 text-sm leading-relaxed mb-6">
              Use our free interactive tool to calculate exact tick marks, water
              ratios, and mcg concentrations instantly.
            </p>
            <Link
              to="/peptide-calculator"
              className="block w-full bg-white text-blue-600 py-4 rounded-xl font-bold text-lg hover:bg-gray-50 transition shadow-md"
            >
              Open Peptide Calculator
            </Link>
          </div>

          <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
              <ThermometerSnowflake className="text-blue-500" /> Storage
              Guidelines
            </h3>
            <ul className="space-y-3 text-sm text-gray-600">
              <li>
                <strong>Unmixed (Powder):</strong> Store in the freezer (-20°C)
                for long-term stability up to 2 years. Keep away from light.
              </li>
              <li>
                <strong>Mixed (Liquid):</strong> Must be stored in the
                refrigerator (2°C to 8°C). Discard after 4 weeks.
              </li>
            </ul>
          </div>

          <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              Required Supplies
            </h3>
            <ul className="space-y-4">
              <li className="border-b border-gray-100 pb-3">
                <Link
                  to="/product/bacteriostatic-water"
                  className="text-blue-600 font-bold hover:underline"
                >
                  Bacteriostatic Water (30ml) →
                </Link>
                <p className="text-xs text-gray-500 mt-1">
                  Essential for multi-use vial preservation.
                </p>
              </li>
              <li className="border-b border-gray-100 pb-3">
                <Link
                  to="/product/peptide-syringes-1ml"
                  className="text-blue-600 font-bold hover:underline"
                >
                  1ml U-100 Syringes →
                </Link>
                <p className="text-xs text-gray-500 mt-1">
                  For drawing water and administering compounds.
                </p>
              </li>
              <li>
                <Link
                  to="/product/peptide-prep-pads"
                  className="text-blue-600 font-bold hover:underline"
                >
                  Sterile Alcohol Prep Pads →
                </Link>
                <p className="text-xs text-gray-500 mt-1">
                  For sterilizing vials and equipment.
                </p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
