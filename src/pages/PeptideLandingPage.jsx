import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";

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
      document.title = `${seo.h1_title} | Australian Research Peptides`;

      const metaDesc = document.querySelector('meta[name="description"]');
      if (metaDesc)
        metaDesc.setAttribute("content", seo.meta_description || "");

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

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center text-xl font-bold text-gray-400">
        Loading research database...
      </div>
    );
  if (!pageData)
    return (
      <div className="min-h-screen flex items-center justify-center text-xl font-bold text-red-500">
        Research page not found.
      </div>
    );

  const productImage =
    product?.image_url || product?.image || "/placeholder.png";

  const faqSchema =
    pageData.faqs && pageData.faqs.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: pageData.faqs.map((faq) => ({
            "@type": "Question",
            name: faq.q,
            acceptedAnswer: { "@type": "Answer", text: faq.a },
          })),
        }
      : null;

  const formatText = (text) => {
    if (!text) return null;
    return text.split("\n").map((line, i) => {
      const parts = line.split(/\*\*(.*?)\*\*/g);
      return (
        <p key={i} className="mb-4 last:mb-0">
          {parts.map((part, j) =>
            j % 2 === 1 ? (
              <strong key={j} className="font-bold text-gray-900">
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
    <div className="bg-gray-50 min-h-screen pb-20 font-sans">
      {faqSchema && (
        <script type="application/ld+json">{JSON.stringify(faqSchema)}</script>
      )}

      {/* Hero Header */}
      <div className="bg-white border-b border-gray-200 py-12 px-4 sm:px-6 lg:px-8 mb-10 text-center shadow-sm">
        <div className="max-w-4xl mx-auto">
          <span className="text-blue-600 font-bold tracking-widest uppercase text-xs sm:text-sm mb-3 block">
            Comprehensive Research Guide
          </span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-gray-900 tracking-tight mb-6 leading-tight">
            {pageData.h1_title}
          </h1>
          <p className="text-lg sm:text-xl text-gray-600 font-light leading-relaxed max-w-3xl mx-auto">
            {pageData.meta_description}
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
        {/* Main Content Column */}
        <div className="lg:col-span-8 space-y-12">
          {/* Introduction */}
          {pageData.introduction && (
            <section className="bg-white p-6 sm:p-10 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-100">
                What is {pageData.h1_title.split(" ")[0]}?
              </h2>

              {/* Image 1: Amino Acid Sequence */}
              {pageData.image_amino_sequence && (
                <div className="mb-8">
                  <img
                    src={pageData.image_amino_sequence}
                    alt={`${pageData.h1_title.split(" ")[0]} amino acid sequence`}
                    className="w-full h-auto rounded-xl shadow-sm border border-gray-100 object-cover"
                  />
                </div>
              )}

              <div className="text-gray-700 text-base sm:text-lg leading-relaxed space-y-4">
                {formatText(pageData.introduction)}
              </div>
            </section>
          )}

          {/* Mechanism of Action */}
          {pageData.mechanism_text && (
            <section className="bg-white p-6 sm:p-10 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-100">
                Mechanism of Action
              </h2>

              {/* Image 2: Molecular Structure */}
              {pageData.image_molecular_structure && (
                <div className="mb-8 p-4 bg-gray-50 rounded-xl border border-gray-100 flex justify-center">
                  <img
                    src={pageData.image_molecular_structure}
                    alt={`${pageData.h1_title.split(" ")[0]} peptide molecular structure`}
                    className="max-w-full h-auto rounded-lg mix-blend-multiply"
                  />
                </div>
              )}

              <div className="text-gray-700 text-base sm:text-lg leading-relaxed">
                {formatText(pageData.mechanism_text)}
              </div>
            </section>
          )}

          {/* Key Studies */}
          {pageData.research_studies &&
            pageData.research_studies.length > 0 && (
              <section className="bg-white p-6 sm:p-10 rounded-2xl shadow-sm border border-gray-100">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-100">
                  Key Research Studies
                </h2>
                <div className="space-y-6">
                  {pageData.research_studies.map((study, index) => (
                    <div
                      key={index}
                      className="bg-blue-50/50 border border-blue-100 p-5 sm:p-6 rounded-xl border-l-4 border-l-blue-600"
                    >
                      <h3 className="font-bold text-lg sm:text-xl text-gray-900 mb-2">
                        {study.title}
                      </h3>
                      <p className="text-gray-700 leading-relaxed text-sm sm:text-base">
                        {study.summary}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            )}

          {/* FAQs */}
          {pageData.faqs && pageData.faqs.length > 0 && (
            <section className="bg-white p-6 sm:p-10 rounded-2xl shadow-sm border border-gray-100">
              <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-6 pb-4 border-b border-gray-100">
                Frequently Asked Questions
              </h2>
              <div className="space-y-4">
                {pageData.faqs.map((faq, index) => (
                  <div
                    key={index}
                    className="bg-gray-50 p-5 rounded-xl border border-gray-200"
                  >
                    <h3 className="font-bold text-gray-900 text-base sm:text-lg mb-2">
                      {faq.q}
                    </h3>
                    <p className="text-gray-700 text-sm sm:text-base">
                      {faq.a}
                    </p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* References */}
          {pageData.references && (
            <section className="bg-gray-100 p-6 sm:p-10 rounded-2xl border border-gray-200">
              <h2 className="text-lg sm:text-xl font-bold text-gray-900 mb-4">
                Research References
              </h2>
              <ul className="list-decimal list-inside space-y-2 text-xs sm:text-sm text-gray-600">
                {pageData.references.map((ref, index) => (
                  <li key={index} className="leading-relaxed">
                    {ref}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>

        {/* Sticky Sidebar Column */}
        <div className="lg:col-span-4 space-y-6 lg:space-y-8">
          {/* Product Box */}
          {product && (
            <div className="bg-white rounded-2xl shadow-md border border-gray-200 p-6 lg:sticky lg:top-6">
              <div className="bg-gray-50 rounded-xl mb-6 p-4 border border-gray-100 flex justify-center">
                <img
                  src={productImage}
                  alt={`${product.name} lyophilized research vial`}
                  className="w-48 h-48 sm:w-56 sm:h-56 object-contain drop-shadow-md"
                />
              </div>
              <div className="text-center mb-6">
                <span className="text-xs font-bold tracking-widest text-blue-600 uppercase mb-1 block">
                  Available For Research
                </span>
                <h2 className="text-2xl font-bold text-gray-900 mb-2">
                  {product.name}
                </h2>
                <p className="text-gray-500 text-xs sm:text-sm">
                  Strictly for scientific research and laboratory use.
                </p>
              </div>
              <Link
                to={`/product/${product.id}`}
                className="flex items-center justify-center w-full bg-blue-600 text-white py-3 sm:py-4 rounded-xl font-bold text-sm sm:text-base hover:bg-blue-700 transition shadow-sm hover:shadow-md"
              >
                View Pricing & Availability →
              </Link>
            </div>
          )}

          {/* Reconstitution Funnel */}
          {pageData.reconstitution_example && (
            <div className="bg-gray-900 text-white rounded-2xl shadow-md p-6">
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                🧪 Reconstitution Example
              </h3>
              <p className="text-gray-300 text-xs sm:text-sm leading-relaxed mb-6 font-mono bg-gray-800 p-3 rounded-md">
                {pageData.reconstitution_example}
              </p>
              <Link
                to="/peptide-calculator"
                className="block w-full text-center bg-white text-gray-900 py-3 rounded-xl font-bold text-sm hover:bg-gray-100 transition"
              >
                Open Peptide Calculator →
              </Link>
            </div>
          )}

          {/* Storage Box with Vial Image */}
          {pageData.storage_guidelines && (
            <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
              <h3 className="text-base font-bold text-gray-900 mb-4 flex items-center gap-2">
                ❄️ Storage Guidelines
              </h3>
              {pageData.image_vial && (
                <div className="mb-4 bg-gray-50 rounded-lg p-2 flex justify-center">
                  <img
                    src={pageData.image_vial}
                    alt={`${pageData.h1_title.split(" ")[0]} lyophilized peptide vial`}
                    className="w-32 h-32 object-cover rounded-md"
                  />
                </div>
              )}
              <p className="text-gray-600 text-xs sm:text-sm leading-relaxed">
                {pageData.storage_guidelines}
              </p>
            </div>
          )}

          {/* Related Peptides */}
          {pageData.related_peptides && (
            <div className="bg-white border border-gray-200 p-6 rounded-2xl shadow-sm">
              <h3 className="text-base font-bold text-gray-900 mb-4">
                Related Research
              </h3>
              <ul className="space-y-4">
                {pageData.related_peptides.map((pep, index) => (
                  <li
                    key={index}
                    className="border-b border-gray-100 pb-3 last:border-0 last:pb-0"
                  >
                    <Link
                      to={`/${pep.slug}`}
                      className="text-blue-600 font-bold hover:underline text-sm flex items-center gap-1"
                    >
                      {pep.name} <span className="text-xs">→</span>
                    </Link>
                    <p className="text-xs text-gray-500 mt-1">{pep.reason}</p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
