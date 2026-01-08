import { Helmet } from "react-helmet-async";
import { useLocation } from "react-router-dom";

export default function SEO({
  title,
  description,
  type = "website",
  image,
  url,
}) {
  const { pathname } = useLocation();
  const siteTitle = "Melbourne Peptides";

  // UPDATED: Description now includes "Stock", "10mg", "CAS" for SEO consistency
  const defaultDesc =
    "Buy premium peptides in stock (10mg/5mg). 99% purity guaranteed (CAS verified), fast shipping Australia. Shop BPC-157, Melanotan 2, and more.";

  const siteUrl = "https://melbournepeptides.com.au";

  // FIXED: Use the manual URL if provided, otherwise calculate it automatically
  const canonicalUrl = url || `${siteUrl}${pathname}`;

  // FIXED: Logic to keep titles short (~50 chars) but keyword-rich
  let finalTitle;
  if (title === "Home") {
    // Exact match for the audit keywords
    finalTitle = "Melbourne Peptides | 99% Purity | In Stock Australia";
  } else if (title) {
    // e.g. "Shop | Melbourne Peptides"
    finalTitle = `${title} | ${siteTitle}`;
  } else {
    finalTitle = "Melbourne Peptides | 99% Purity Peptides In Stock";
  }

  const finalDesc = description || defaultDesc;
  const finalImage = image || "/hero-banner.jpeg";

  return (
    <Helmet>
      {/* Standard Metadata */}
      <title>{finalTitle}</title>
      <meta name="description" content={finalDesc} />

      {/* CANONICAL TAG - Critical for fixing the Google Console error */}
      <link rel="canonical" href={canonicalUrl} />

      {/* Facebook / Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={finalTitle} />
      <meta property="og:description" content={finalDesc} />
      <meta property="og:image" content={finalImage} />
      <meta property="og:url" content={canonicalUrl} />
      <meta property="og:site_name" content={siteTitle} />

      {/* Twitter Cards */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={finalTitle} />
      <meta name="twitter:description" content={finalDesc} />
      <meta name="twitter:image" content={finalImage} />
    </Helmet>
  );
}
