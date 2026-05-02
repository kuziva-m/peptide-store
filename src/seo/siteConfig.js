export const SITE = {
  name: "Melbourne Peptides",
  url: "https://melbournepeptides.com.au",
  defaultTitle:
    "Melbourne Peptides | Research Peptides in Australia | Batch-Tested",
  defaultDescription:
    "Australian supplier of research peptides with batch documentation, calculator tools, FAQs, and fast domestic dispatch. Research use only.",
  defaultImage: "https://melbournepeptides.com.au/og/melbourne-peptides-og.jpg",
  locale: "en_AU",
  currency: "AUD",
};

export const INDEXABLE_ROUTES = [
  "/",
  "/shop",
  "/faq",
  "/shipping",
  "/peptide-calculator",
  "/contact",
  "/about",
  "/batch-testing",
  "/research-policy",
];

export const NOINDEX_ROUTES = [
  "/admin",
  "/checkout",
  "/success",
  "/track",
  "/write-review",
  "/landing",
  "/creator-studio",
  "/account",
  "/cart",
  "/search",
];

export function cleanPath(pathname = "/") {
  const pathOnly = pathname.split("?")[0].split("#")[0];
  if (pathOnly === "") return "/";
  if (pathOnly !== "/" && pathOnly.endsWith("/")) {
    return pathOnly.slice(0, -1);
  }
  return pathOnly;
}

export function canonicalUrl(pathname = "/") {
  const path = cleanPath(pathname);
  return path === "/" ? `${SITE.url}/` : `${SITE.url}${path}`;
}

export function isNoIndexRoute(pathname = "/") {
  const path = cleanPath(pathname);
  return NOINDEX_ROUTES.some(
    (route) => path === route || path.startsWith(`${route}/`),
  );
}
