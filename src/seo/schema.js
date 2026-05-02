import { SITE, canonicalUrl } from "./siteConfig";

export function organizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": ["Organization", "OnlineStore"],
    "@id": `${SITE.url}/#organization`,
    name: SITE.name,
    url: `${SITE.url}/`,
    logo: `${SITE.url}/logo.png`,
    contactPoint: [
      {
        "@type": "ContactPoint",
        contactType: "customer support",
        email: "support@melbournepeptides.com.au",
        availableLanguage: ["en-AU"],
      },
    ],
  };
}

export function websiteSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE.url}/#website`,
    name: SITE.name,
    url: `${SITE.url}/`,
    publisher: {
      "@id": `${SITE.url}/#organization`,
    },
  };
}

export function breadcrumbSchema(items = []) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: canonicalUrl(item.path),
    })),
  };
}

export function productSchema(product) {
  const productUrl = canonicalUrl(`/product/${product.slug}`);

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    "@id": `${productUrl}#product`,
    name: product.name,
    url: productUrl,
    image: product.images?.length ? product.images : [SITE.defaultImage],
    description:
      product.seoDescription ||
      `${product.name} supplied for research use with clear handling, storage, and batch information.`,
    brand: {
      "@type": "Brand",
      name: SITE.name,
    },
    sku: product.sku || product.slug,
    mpn: product.sku || product.slug,
    offers: {
      "@type": "Offer",
      url: productUrl,
      priceCurrency: SITE.currency,
      price: String(product.price),
      availability: product.inStock
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };
}

export function articleSchema(article) {
  const articleUrl = canonicalUrl(article.path);

  return {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${articleUrl}#article`,
    headline: article.title,
    description: article.description,
    url: articleUrl,
    image: article.image || SITE.defaultImage,
    publisher: {
      "@id": `${SITE.url}/#organization`,
    },
    datePublished: article.datePublished,
    dateModified: article.dateModified || article.datePublished,
    mainEntityOfPage: articleUrl,
  };
}

export function faqSchema(faqs = []) {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((faq) => ({
      "@type": "Question",
      name: faq.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: faq.answer,
      },
    })),
  };
}
