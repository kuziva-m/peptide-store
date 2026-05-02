import { Helmet } from "react-helmet-async";
import { SITE, canonicalUrl, isNoIndexRoute } from "../seo/siteConfig";

export default function SEO({
  title = SITE.defaultTitle,
  description = SITE.defaultDescription,
  path = "/",
  image = SITE.defaultImage,
  type = "website",
  schema = [],
  noindex = false,
}) {
  const canonical = canonicalUrl(path);
  const shouldNoIndex = noindex || isNoIndexRoute(path);
  const schemaArray = Array.isArray(schema)
    ? schema.filter(Boolean)
    : [schema].filter(Boolean);

  return (
    <Helmet>
      <title>{title}</title>

      <meta name="description" content={description} />
      <link rel="canonical" href={canonical} />

      {shouldNoIndex ? (
        <meta name="robots" content="noindex,nofollow" />
      ) : (
        <meta name="robots" content="index,follow" />
      )}

      <meta property="og:site_name" content={SITE.name} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:type" content={type} />
      <meta property="og:image" content={image} />
      <meta property="og:locale" content={SITE.locale} />

      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />

      {schemaArray.map((item, index) => (
        <script key={index} type="application/ld+json">
          {JSON.stringify(item)}
        </script>
      ))}
    </Helmet>
  );
}
