import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function upsertHeadTag(selector, createTag, applyAttributes) {
  if (typeof document === "undefined") return;

  let element = document.head.querySelector(selector);

  if (!element) {
    element = document.createElement(createTag);
    element.setAttribute("data-seo-managed", "true");
    document.head.appendChild(element);
  }

  applyAttributes(element);
}

export default function SEO({
  title,
  description,
  type = "website",
  image,
  url,
  noindex = false,
}) {
  const { pathname } = useLocation();
  const siteTitle = "Melbourne Peptides";

  const defaultDesc =
    "Buy premium peptides in stock (10mg/5mg). 99% purity guaranteed (CAS verified), fast shipping Australia. Shop BPC-157, Melanotan 2, and more.";

  const siteUrl = "https://melbournepeptides.com.au";
  const canonicalUrl = url || `${siteUrl}${pathname}`;

  let finalTitle;
  if (title === "Home") {
    finalTitle = "Melbourne Peptides | 99% Purity | In Stock Australia";
  } else if (title) {
    finalTitle = `${title} | ${siteTitle}`;
  } else {
    finalTitle = "Melbourne Peptides | 99% Purity Peptides In Stock";
  }

  const finalDesc = description || defaultDesc;
  const finalImage = image || "/hero-banner.jpeg";

  useEffect(() => {
    if (typeof document === "undefined") return;

    document.title = finalTitle;

    upsertHeadTag('meta[name="description"]', "meta", (element) => {
      element.setAttribute("name", "description");
      element.setAttribute("content", finalDesc);
    });

    upsertHeadTag('link[rel="canonical"]', "link", (element) => {
      element.setAttribute("rel", "canonical");
      element.setAttribute("href", canonicalUrl);
    });

    if (noindex) {
      upsertHeadTag('meta[name="robots"]', "meta", (element) => {
        element.setAttribute("name", "robots");
        element.setAttribute("content", "noindex, follow");
      });
    } else {
      document.head.querySelector('meta[name="robots"]')?.remove();
    }

    const metaProperties = [
      ['meta[property="og:type"]', "og:type", type],
      ['meta[property="og:title"]', "og:title", finalTitle],
      ['meta[property="og:description"]', "og:description", finalDesc],
      ['meta[property="og:image"]', "og:image", finalImage],
      ['meta[property="og:url"]', "og:url", canonicalUrl],
      ['meta[property="og:site_name"]', "og:site_name", siteTitle],
    ];

    metaProperties.forEach(([selector, property, content]) => {
      upsertHeadTag(selector, "meta", (element) => {
        element.setAttribute("property", property);
        element.setAttribute("content", content);
      });
    });

    const twitterMeta = [
      ['meta[name="twitter:card"]', "twitter:card", "summary_large_image"],
      ['meta[name="twitter:title"]', "twitter:title", finalTitle],
      ['meta[name="twitter:description"]', "twitter:description", finalDesc],
      ['meta[name="twitter:image"]', "twitter:image", finalImage],
    ];

    twitterMeta.forEach(([selector, name, content]) => {
      upsertHeadTag(selector, "meta", (element) => {
        element.setAttribute("name", name);
        element.setAttribute("content", content);
      });
    });
  }, [canonicalUrl, finalDesc, finalImage, finalTitle, noindex, siteTitle, type]);

  return null;
}
