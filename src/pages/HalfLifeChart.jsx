import { Link } from "react-router-dom";
import SEO from "../components/SEO";
import { Clock, Activity, ShieldAlert, TestTube2 } from "lucide-react";

export default function HalfLifeChart() {
  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "What is peptide half-life?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Peptide half-life refers to the time required for a compound's active concentration in a biological system or solution to reduce by exactly 50%.",
        },
      },
      {
        "@type": "Question",
        name: "Why does half-life matter in peptide research?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Understanding half-life is critical for researchers to determine accurate dosing intervals, assess compound stability, and observe pharmacokinetics in experimental models.",
        },
      },
      {
        "@type": "Question",
        name: "Which research peptide has the longest half-life?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Among standard research peptides, GLP-1 and GIP receptor agonists like Semaglutide (approx. 7 days) and Tirzepatide (approx. 5 days) exhibit the longest half-lives due to structural modifications like fatty acid chains.",
        },
      },
    ],
  };

  const tableData = [
    {
      name: "BPC-157",
      halfLife: "~4 hours",
      category: "Tissue Repair / Healing",
      link: "/bpc-157",
    },
    {
      name: "TB-500",
      halfLife: "~2 - 3 hours",
      category: "Tissue Repair / Actin Regulation",
      link: "/tb-500-tb4",
    },
    {
      name: "GHK-Cu",
      halfLife: "~20 minutes",
      category: "Copper Peptide / Dermal",
      link: "/ghk-cu",
    },
    {
      name: "Semaglutide",
      halfLife: "~7 days",
      category: "GLP-1 Receptor Agonist",
      link: "/semaglutide",
    },
    {
      name: "Tirzepatide",
      halfLife: "~5 days",
      category: "Dual GLP-1 / GIP Agonist",
      link: "/tirzepatide",
    },
    {
      name: "Retatrutide",
      halfLife: "~6 days",
      category: "Triple Agonist (GLP-1/GIP/Glucagon)",
      link: "/retatrutide",
    },
    {
      name: "CJC-1295 (with DAC)",
      halfLife: "~6 - 8 days",
      category: "GHRH Analog",
      link: "/cjc-1295-with-dac",
    },
    {
      name: "CJC-1295 (No DAC)",
      halfLife: "~30 minutes",
      category: "GHRH Analog",
      link: "/cjc-1295-no-dac",
    },
    {
      name: "Ipamorelin",
      halfLife: "~2 hours",
      category: "GHRP Analog",
      link: "/ipamorelin",
    },
    {
      name: "Melanotan II",
      halfLife: "~33 hours",
      category: "Melanocortin Agonist",
      link: "/melanotan-ii",
    },
    {
      name: "Epitalon",
      halfLife: "~15 - 30 minutes",
      category: "Telomerase Activator",
      link: "/epitalon",
    },
    {
      name: "IGF-1 LR3",
      halfLife: "~20 - 30 hours",
      category: "Growth Factor",
      link: "/igf-1-lr3",
    },
  ];

  return (
    <div className="bg-slate-50 min-h-screen pb-20 font-sans">
      <SEO
        title="Peptide Half-Life Chart (30+ Compounds) | Research Reference Guide"
        description="Comprehensive half-life chart for research peptides including BPC-157, Semaglutide, TB-500, and Tirzepatide. Essential pharmacokinetics guide for laboratories."
        url="https://melbournepeptides.com.au/peptide-half-life-chart"
      />
      <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>

      {/* Hero Section */}
      <div className="bg-white border-b border-slate-200 py-16 px-4 sm:px-6 lg:px-8 mb-12 text-center shadow-sm">
        <div className="max-w-4xl mx-auto">
          <span className="text-blue-600 font-bold tracking-widest uppercase text-sm mb-3 block">
            Laboratory Resources
          </span>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight mb-6">
            Peptide Half-Life Chart
          </h1>
          <p className="text-xl text-slate-600 font-light leading-relaxed max-w-3xl mx-auto">
            A comprehensive reference guide detailing the estimated biological
            half-life and degradation rates of standard research peptides.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Main Content */}
        <div className="lg:col-span-8 space-y-12">
          <section className="bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6 flex items-center gap-3">
              <Activity className="text-blue-600" size={32} /> Understanding
              Pharmacokinetics
            </h2>
            <p className="text-slate-700 text-lg leading-relaxed mb-4">
              In experimental research, <strong>peptide half-life</strong>{" "}
              refers to the precise amount of time required for a specific
              compound's active concentration to diminish by 50% within a
              biological system or solution.
            </p>
            <p className="text-slate-700 text-lg leading-relaxed">
              Because native peptides consist of fragile amino acid chains, they
              are highly susceptible to rapid enzymatic degradation
              (proteolysis). Many synthetic research peptides (such as
              Semaglutide or CJC-1295 with DAC) have been specifically
              engineered with molecular modifications—such as fatty acid chains
              or Drug Affinity Complexes—to intentionally prolong their
              half-life for extended observational studies.
            </p>
          </section>

          {/* THE GOLDEN TABLE */}
          <section className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <div className="p-6 sm:p-8 border-b border-slate-200 bg-slate-900 text-white">
              <h2 className="text-2xl font-bold flex items-center gap-3">
                <Clock className="text-blue-400" size={28} /> Estimated
                Half-Life Reference Table
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-slate-700 text-sm uppercase tracking-wider">
                    <th className="p-4 sm:p-6 font-bold">Peptide Compound</th>
                    <th className="p-4 sm:p-6 font-bold">
                      Estimated Half-Life
                    </th>
                    <th className="p-4 sm:p-6 font-bold hidden sm:table-cell">
                      Primary Category
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {tableData.map((row, idx) => (
                    <tr key={idx} className="hover:bg-blue-50 transition">
                      <td className="p-4 sm:p-6 font-bold text-slate-900">
                        <Link
                          to={row.link}
                          className="hover:text-blue-600 hover:underline"
                        >
                          {row.name}
                        </Link>
                      </td>
                      <td className="p-4 sm:p-6 text-slate-700 font-mono font-bold text-sm sm:text-base">
                        {row.halfLife}
                      </td>
                      <td className="p-4 sm:p-6 text-slate-600 hidden sm:table-cell text-sm">
                        {row.category}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 italic">
              *Note: Half-life values are approximations based on available
              preclinical literature. Actual degradation rates vary based on
              administration route, enzymatic activity, and specific in-vitro or
              in-vivo conditions.
            </div>
          </section>

          {/* Expanded SEO Sections */}
          <section className="bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-slate-200 space-y-8">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6 border-b pb-4">
              Key Compound Analysis
            </h2>

            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                BPC-157 Half-Life
              </h3>
              <p className="text-slate-700 leading-relaxed mb-3">
                BPC-157 exhibits a notably short biological half-life of
                approximately 4 hours in preclinical models. Despite this rapid
                clearance, its acute signaling pathways trigger prolonged
                localized angiogenesis and fibroblast migration.
              </p>
              <Link
                to="/bpc-157"
                className="text-blue-600 font-bold text-sm hover:underline"
              >
                Read full BPC-157 research profile →
              </Link>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                Semaglutide Half-Life
              </h3>
              <p className="text-slate-700 leading-relaxed mb-3">
                Unlike native GLP-1 (which degrades in minutes), Semaglutide
                features a C18 fatty diacid chain that binds to albumin,
                delaying renal clearance and extending its half-life to
                approximately 7 days.
              </p>
              <Link
                to="/semaglutide"
                className="text-blue-600 font-bold text-sm hover:underline"
              >
                Read full Semaglutide research profile →
              </Link>
            </div>

            <div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">
                CJC-1295 (DAC vs No DAC)
              </h3>
              <p className="text-slate-700 leading-relaxed mb-3">
                The addition of a Drug Affinity Complex (DAC) allows CJC-1295 to
                bind to plasma proteins, extending its half-life from ~30
                minutes (No DAC / Mod GRF 1-29) to roughly 6 to 8 days, creating
                a continuous rather than pulsatile release.
              </p>
              <Link
                to="/cjc-1295-with-dac"
                className="text-blue-600 font-bold text-sm hover:underline"
              >
                Compare CJC-1295 variants →
              </Link>
            </div>
          </section>

          {/* FAQ Section */}
          <section className="bg-white p-8 sm:p-10 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 mb-6">
              Frequently Asked Questions
            </h2>
            <div className="space-y-4">
              {faqSchema.mainEntity.map((faq, idx) => (
                <div
                  key={idx}
                  className="bg-slate-50 p-5 rounded-xl border border-slate-200"
                >
                  <h3 className="font-bold text-slate-900 text-lg mb-2">
                    {faq.name}
                  </h3>
                  <p className="text-slate-700">{faq.acceptedAnswer.text}</p>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Sticky Sidebar */}
        <div className="lg:col-span-4 space-y-8">
          <div className="bg-white border border-slate-200 p-6 rounded-2xl shadow-sm sticky top-6">
            <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
              <TestTube2 className="text-blue-500" /> Related Tools
            </h3>
            <p className="text-slate-600 text-sm mb-6">
              Need to calculate dilution ratios based on specific compound
              half-lives?
            </p>
            <Link
              to="/peptide-calculator"
              className="block w-full text-center bg-blue-600 text-white py-3 rounded-xl font-bold text-sm hover:bg-blue-700 transition shadow-sm"
            >
              Open Reconstitution Calculator →
            </Link>
            <Link
              to="/peptide-reconstitution-guide"
              className="block w-full text-center bg-slate-100 text-slate-800 py-3 rounded-xl font-bold text-sm hover:bg-slate-200 transition mt-3"
            >
              View Reconstitution Guide
            </Link>
          </div>

          <div className="bg-orange-50 border border-orange-100 p-6 rounded-2xl shadow-sm">
            <h3 className="text-lg font-bold text-orange-900 mb-3 flex items-center gap-2">
              <ShieldAlert className="text-orange-500" size={20} /> Research
              Disclaimer
            </h3>
            <p className="text-orange-800 text-xs leading-relaxed">
              The half-life data provided on this page is compiled from
              available scientific literature and preclinical trials. All
              products supplied by Melbourne Peptides are classified strictly
              for in-vitro laboratory research and analytical use only. They are
              not approved for human or animal consumption.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
