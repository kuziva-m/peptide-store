/* eslint-env node */
/* global process */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SITE = {
  name: "Melbourne Peptides",
  baseUrl: "https://melbournepeptides.com.au",
  defaultImage: "https://melbournepeptides.com.au/android-chrome-512x512.png",
  defaultDescription:
    "Premium research peptides, calculator tools, and laboratory reference guides from Melbourne Peptides.",
  indexRobots: "index, follow",
  noindexRobots: "noindex, follow",
};

const PRODUCT_ACCESSORY_CATEGORIES = new Set([
  "Accessories",
  "Syringes",
  "Prep Pads",
]);

const FALLBACK_LANDING_SLUGS = [
  "semaglutide",
  "tirzepatide",
  "retatrutide",
  "cagrilintide",
  "mazdutide",
  "survodutide",
  "hgh-191aa",
  "igf-1-lr3",
  "bpc-157",
  "tb-500-tb4",
  "epitalon",
  "melanotan-i",
  "melanotan-ii",
  "cjc-1295-with-dac",
  "cjc-1295-no-dac",
  "ghrp-6",
  "ghrp-2",
  "tesamorelin",
  "mots-c",
  "ipamorelin",
  "semax",
  "selank",
  "ghk-cu",
  "kpv",
  "sermorelin",
  "tri-heal-max",
  "glow-blend",
  "klow-blend",
  "wolverine-stack",
  "nad-plus",
  "ll-37",
  "thymosin-alpha-1",
  "pt-141-bremelanotide",
  "aod-9604",
  "oxytocin",
  "dihexa",
  "kisspeptin-10",
  "bpc-157-stable",
  "mots-c-plus",
];

const FALLBACK_CALCULATOR_SLUGS = [
  "bpc-157",
  "tb-500",
  "semaglutide",
  "tirzepatide",
  "ghk-cu",
  "melanotan-2",
  "cjc-1295",
  "ipamorelin",
  "epitalon",
  "hgh-191aa",
];

const FALLBACK_ACCESSORY_PRODUCT_SLUGS = [
  "bacteriostatic-water",
  "peptide-prep-pads",
  "peptide-syringes-1ml",
  "peptide-syringes-0-5ml",
];

const NON_INDEXABLE_ROUTES = [
  "/admin",
  "/checkout",
  "/creator-studio",
  "/landing",
  "/success",
  "/track",
  "/write-review",
];

const PRODUCT_ALIAS_MAP = {
  "tb-500": "tb-500-tb4",
  "melanotan-2": "melanotan-ii",
  "cjc-1295": "cjc-1295-no-dac",
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");

function loadEnv() {
  const envFiles = [
    ".env",
    ".env.local",
    ".env.production",
    ".env.production.local",
  ];

  for (const file of envFiles) {
    const fullPath = path.join(repoRoot, file);
    if (!fs.existsSync(fullPath)) continue;

    const lines = fs.readFileSync(fullPath, "utf8").split(/\r?\n/);
    for (const line of lines) {
      if (!line || line.trim().startsWith("#") || !line.includes("=")) continue;
      const index = line.indexOf("=");
      const key = line.slice(0, index).trim();
      const rawValue = line.slice(index + 1).trim();
      if (!key || process.env[key]) continue;
      process.env[key] = rawValue.replace(/^['"]|['"]$/g, "");
    }
  }
}

function escapeHtml(value = "") {
  return String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function escapeXml(value = "") {
  return escapeHtml(value);
}

function slugToTitle(slug = "") {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) =>
      /^\d/.test(part)
        ? part.toUpperCase()
        : part.length <= 3
          ? part.toUpperCase()
          : part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join(" ")
    .replace(/ Ii\b/g, " II")
    .replace(/ Iii\b/g, " III");
}

function buildUrl(routePath) {
  if (routePath === "/") return `${SITE.baseUrl}/`;
  return `${SITE.baseUrl}${routePath}`;
}

function getAbsoluteImage(imageUrl) {
  if (!imageUrl) return SITE.defaultImage;
  if (/^https?:\/\//.test(imageUrl)) return imageUrl;
  if (imageUrl.startsWith("/")) return `${SITE.baseUrl}${imageUrl}`;
  return `${SITE.baseUrl}/${imageUrl}`;
}

function truncateDescription(text, max = 155) {
  if (!text) return SITE.defaultDescription;
  const clean = String(text).replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  return `${clean.slice(0, max - 1).trimEnd()}…`;
}

function createWebPageJsonLd(meta) {
  return {
    "@context": "https://schema.org",
    "@type": "WebPage",
    name: meta.title,
    description: meta.description,
    url: meta.canonical,
  };
}

function createBreadcrumbJsonLd(items) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

function createMeta({
  path: routePath,
  title,
  description,
  canonical,
  robots = SITE.indexRobots,
  type = "website",
  image,
  jsonLd = [],
  indexable = true,
  lastmod,
}) {
  return {
    path: routePath,
    title,
    description: truncateDescription(description),
    canonical: canonical || buildUrl(routePath),
    robots,
    type,
    image: getAbsoluteImage(image),
    jsonLd,
    indexable,
    lastmod,
  };
}

function buildStaticRoutes(faqCategories = []) {
  const faqJsonLd = faqCategories.length
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqCategories.flatMap((category) =>
          (category.questions || []).map((item) => ({
            "@type": "Question",
            name: item.q,
            acceptedAnswer: {
              "@type": "Answer",
              text: item.a,
            },
          })),
        ),
      }
    : null;

  const baseStatic = [
    createMeta({
      path: "/",
      title: "Melbourne Peptides | 99% Purity | In Stock Australia",
      description:
        "Australia's source for premium research peptides, calculator tools, and laboratory guides with fast dispatch from Melbourne.",
      image: "/hero-banner.jpeg",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "Organization",
          name: SITE.name,
          url: `${SITE.baseUrl}/`,
          logo: SITE.defaultImage,
        },
        {
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: SITE.name,
          url: `${SITE.baseUrl}/`,
        },
      ],
    }),
    createMeta({
      path: "/shop",
      title:
        "Shop Peptides Australia | HPLC Tested 99% Purity | Melbourne Peptides",
      description:
        "Browse Melbourne Peptides' catalog of research peptides, blends, and accessories with a self-referencing canonical shop URL.",
      type: "website",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          name: "Research Peptide Catalog",
          url: `${SITE.baseUrl}/shop`,
        },
      ],
    }),
    createMeta({
      path: "/contact",
      title: "Contact Support | Melbourne Peptides",
      description:
        "Contact Melbourne Peptides for product support, wholesale inquiries, and dispatch assistance in Australia.",
      jsonLd: [
        createWebPageJsonLd({
          title: "Contact Support | Melbourne Peptides",
          description:
            "Contact Melbourne Peptides for product support, wholesale inquiries, and dispatch assistance in Australia.",
          canonical: `${SITE.baseUrl}/contact`,
        }),
      ],
    }),
    createMeta({
      path: "/shipping",
      title: "Shipping & Returns | Melbourne Peptides",
      description:
        "Review Melbourne Peptides shipping rates, dispatch timing, and returns guidance for Australian research orders.",
      jsonLd: [
        createWebPageJsonLd({
          title: "Shipping & Returns | Melbourne Peptides",
          description:
            "Review Melbourne Peptides shipping rates, dispatch timing, and returns guidance for Australian research orders.",
          canonical: `${SITE.baseUrl}/shipping`,
        }),
      ],
    }),
    createMeta({
      path: "/faq",
      title: "Help Center & FAQ | Melbourne Peptides",
      description:
        "Answers to common peptide research questions about storage, shipping, purity, and laboratory handling.",
      jsonLd: faqJsonLd
        ? [faqJsonLd]
        : [
            createWebPageJsonLd({
              title: "Help Center & FAQ | Melbourne Peptides",
              description:
                "Answers to common peptide research questions about storage, shipping, purity, and laboratory handling.",
              canonical: `${SITE.baseUrl}/faq`,
            }),
          ],
    }),
    createMeta({
      path: "/privacy",
      title: "Privacy Policy | Melbourne Peptides",
      description:
        "Read the Melbourne Peptides privacy policy covering customer data, order information, and website usage.",
      jsonLd: [
        createWebPageJsonLd({
          title: "Privacy Policy | Melbourne Peptides",
          description:
            "Read the Melbourne Peptides privacy policy covering customer data, order information, and website usage.",
          canonical: `${SITE.baseUrl}/privacy`,
        }),
      ],
    }),
    createMeta({
      path: "/terms",
      title: "Terms of Service | Melbourne Peptides",
      description:
        "Read the Melbourne Peptides terms of service for research-use-only products, orders, shipping, and liability.",
      jsonLd: [
        createWebPageJsonLd({
          title: "Terms of Service | Melbourne Peptides",
          description:
            "Read the Melbourne Peptides terms of service for research-use-only products, orders, shipping, and liability.",
          canonical: `${SITE.baseUrl}/terms`,
        }),
      ],
    }),
    createMeta({
      path: "/peptide-calculator",
      title:
        "Peptide Dosage Calculator | BPC-157, TB-500 Reconstitution | Melbourne Peptides",
      description:
        "Calculate research peptide dilution ratios and syringe units with Melbourne Peptides' peptide dosage calculator.",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "WebApplication",
          name: "Peptide Dosage Calculator",
          url: `${SITE.baseUrl}/peptide-calculator`,
          applicationCategory: "HealthApplication",
          operatingSystem: "All",
          offers: {
            "@type": "Offer",
            price: "0",
            priceCurrency: "AUD",
          },
        },
      ],
    }),
    createMeta({
      path: "/peptide-reconstitution-guide",
      title:
        "How to Reconstitute Peptides | Step-by-Step Guide | Melbourne Peptides",
      description:
        "Learn how to reconstitute research peptides with bacteriostatic water, dilution ratios, and storage best practices.",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "How much bacteriostatic water do I mix with a 10mg peptide vial?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "A standard laboratory protocol is to mix 2ml of bacteriostatic water with a 10mg peptide vial, yielding a concentration of 5mg/ml.",
              },
            },
            {
              "@type": "Question",
              name: "Do I shake the peptide vial to mix it?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "No. Gently roll or swirl the vial rather than shaking it to protect the peptide's molecular structure.",
              },
            },
          ],
        },
      ],
    }),
    createMeta({
      path: "/peptide-half-life-chart",
      title: "Peptide Half-Life Chart (30+ Compounds) | Melbourne Peptides",
      description:
        "Reference chart for peptide half-life estimates including BPC-157, Semaglutide, TB-500, and Tirzepatide.",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: [
            {
              "@type": "Question",
              name: "What is peptide half-life?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "Peptide half-life is the time required for a compound's active concentration to reduce by 50%.",
              },
            },
            {
              "@type": "Question",
              name: "Why does half-life matter in peptide research?",
              acceptedAnswer: {
                "@type": "Answer",
                text: "It helps researchers evaluate dosing intervals, stability, and pharmacokinetics in laboratory studies.",
              },
            },
          ],
        },
      ],
    }),
  ];

  const nonIndexableRoutes = NON_INDEXABLE_ROUTES.map((routePath) =>
    createMeta({
      path: routePath,
      title: `${slugToTitle(routePath.replace(/^\//, "").replace(/\//g, " "))} | Melbourne Peptides`,
      description: SITE.defaultDescription,
      robots: SITE.noindexRobots,
      indexable: false,
      jsonLd: [],
    }),
  );

  return [...baseStatic, ...nonIndexableRoutes];
}

function buildLandingRoutes(landingPages, productById) {
  return landingPages.map((page) => {
    const product = productById.get(page.product_id);
    const canonical = buildUrl(`/${page.slug}`);
    const jsonLd = [
      createWebPageJsonLd({
        title: `${page.h1_title} | Melbourne Peptides`,
        description: page.meta_description,
        canonical,
      }),
    ];

    if (Array.isArray(page.faqs) && page.faqs.length > 0) {
      jsonLd.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: page.faqs.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.a,
          },
        })),
      });
    }

    jsonLd.push(
      createBreadcrumbJsonLd([
        { name: SITE.name, url: `${SITE.baseUrl}/` },
        { name: page.h1_title, url: canonical },
      ]),
    );

    return createMeta({
      path: `/${page.slug}`,
      title: `${page.h1_title} | Melbourne Peptides`,
      description:
        page.meta_description ||
        `Research guide, dosing references, and FAQ for ${page.h1_title}.`,
      image: product?.image_url,
      jsonLd,
      lastmod: page.updated_at,
    });
  });
}

function buildFallbackLandingRoutes(slugs) {
  return slugs.map((slug) => {
    const title = `${slugToTitle(slug)} Research Guide | Melbourne Peptides`;
    const canonical = buildUrl(`/${slug}`);
    return createMeta({
      path: `/${slug}`,
      title,
      description: `Research overview, handling guidance, and internal references for ${slugToTitle(slug)}.`,
      jsonLd: [
        createWebPageJsonLd({
          title,
          description: `Research overview, handling guidance, and internal references for ${slugToTitle(slug)}.`,
          canonical,
        }),
      ],
    });
  });
}

function buildCalculatorRoutes(slugs, productBySlug) {
  return slugs.map((slug) => {
    const lookupSlug = PRODUCT_ALIAS_MAP[slug] || slug;
    const product = productBySlug.get(lookupSlug) || productBySlug.get(slug);
    const productName = product?.name || slugToTitle(slug);
    const title = `${productName} Dosage Calculator | Melbourne Peptides`;
    const canonical = buildUrl(`/peptide-calculator/${slug}`);
    const description =
      product?.calc_description ||
      `Calculate ${productName} research dilution ratios, reconstitution guidance, and syringe-unit conversions.`;
    const jsonLd = [
      {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        name: `${productName} Dosage Calculator`,
        url: canonical,
        description: truncateDescription(description),
        applicationCategory: "HealthApplication",
        operatingSystem: "All",
        offers: {
          "@type": "Offer",
          price: "0",
          priceCurrency: "AUD",
        },
      },
    ];

    if (Array.isArray(product?.calc_faq) && product.calc_faq.length > 0) {
      jsonLd.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: product.calc_faq.map((faq) => ({
          "@type": "Question",
          name: faq.q,
          acceptedAnswer: {
            "@type": "Answer",
            text: faq.a,
          },
        })),
      });
    }

    return createMeta({
      path: `/peptide-calculator/${slug}`,
      title,
      description,
      jsonLd,
      lastmod: product?.updated_at,
    });
  });
}

function buildProductRoutes(products) {
  return products.map((product) => {
    const isAccessory = PRODUCT_ACCESSORY_CATEGORIES.has(product.category);
    const productPath = `/product/${product.slug}`;
    const canonical = isAccessory
      ? buildUrl(productPath)
      : buildUrl(`/${product.slug}`);
    const title = `Buy ${product.name} Australia | Melbourne Peptides`;
    const description = product.description
      ? `${truncateDescription(product.description, 140)} Buy ${product.name} research peptide in Australia with fast shipping.`
      : `Buy ${product.name} research peptide in Australia.`;

    const jsonLd = [
      createBreadcrumbJsonLd([
        { name: SITE.name, url: `${SITE.baseUrl}/` },
        { name: "Shop", url: `${SITE.baseUrl}/shop` },
        {
          name: product.name,
          url: canonical,
        },
      ]),
    ];

    if (isAccessory) {
      jsonLd.unshift({
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        image: getAbsoluteImage(product.image_url),
        description: truncateDescription(description),
        brand: {
          "@type": "Brand",
          name: SITE.name,
        },
        offers: {
          "@type": "Offer",
          url: canonical,
          priceCurrency: "AUD",
          price: product.variants?.find((variant) => variant.price)?.price,
          availability: "https://schema.org/InStock",
        },
      });
    }

    return createMeta({
      path: productPath,
      title,
      description,
      canonical,
      image: product.image_url,
      robots: isAccessory ? SITE.indexRobots : SITE.noindexRobots,
      indexable: isAccessory,
      type: "product",
      jsonLd,
      lastmod: product.created_at,
    });
  });
}

function buildFallbackProductRoutes(landingSlugs, accessorySlugs) {
  const accessoryRoutes = accessorySlugs.map((slug) =>
    createMeta({
      path: `/product/${slug}`,
      title: `Buy ${slugToTitle(slug)} Australia | Melbourne Peptides`,
      description: `Shop ${slugToTitle(slug)} from Melbourne Peptides with fast Australian dispatch.`,
      canonical: buildUrl(`/product/${slug}`),
      type: "product",
      indexable: true,
      jsonLd: [],
    }),
  );

  const peptideRoutes = landingSlugs.map((slug) =>
    createMeta({
      path: `/product/${slug}`,
      title: `Buy ${slugToTitle(slug)} Australia | Melbourne Peptides`,
      description: `Transactional product page for ${slugToTitle(slug)}. Canonical research content lives on the peptide landing page.`,
      canonical: buildUrl(`/${slug}`),
      robots: SITE.noindexRobots,
      indexable: false,
      type: "product",
      jsonLd: [],
    }),
  );

  return [...accessoryRoutes, ...peptideRoutes];
}

function dedupeRoutes(routes) {
  const map = new Map();
  for (const route of routes) {
    map.set(route.path, route);
  }
  return [...map.values()].sort((a, b) => a.path.localeCompare(b.path));
}

function dedupeJsonLd(jsonLd = []) {
  const seen = new Set();
  return jsonLd.filter((entry) => {
    const serialized = JSON.stringify(entry);
    if (seen.has(serialized)) return false;
    seen.add(serialized);
    return true;
  });
}

async function fetchSupabaseCollection(endpoint) {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;

  const response = await fetch(`${supabaseUrl}/rest/v1/${endpoint}`, {
    headers: {
      apikey: supabaseKey,
      Authorization: `Bearer ${supabaseKey}`,
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(
      `Supabase request failed for ${endpoint}: ${response.status}`,
    );
  }

  return response.json();
}

async function buildSeoContext() {
  loadEnv();

  let products = [];
  let landingPages = [];
  let faqCategories = [];

  try {
    products =
      (await fetchSupabaseCollection(
        "products?select=id,slug,name,description,category,image_url,created_at,calc_description,calc_faq,variants(price,image_url,in_stock)&order=name.asc",
      )) || [];
  } catch (error) {
    console.warn(
      "SEO prerender: using fallback product routes.",
      error.message,
    );
  }

  try {
    landingPages =
      (await fetchSupabaseCollection(
        "seo_landing_pages?select=slug,h1_title,meta_description,faqs,updated_at,product_id&order=slug.asc",
      )) || [];
  } catch (error) {
    console.warn(
      "SEO prerender: using fallback landing routes.",
      error.message,
    );
  }

  try {
    const faqSetting = await fetchSupabaseCollection(
      "site_settings?select=value&key=eq.faq_list&limit=1",
    );
    faqCategories = faqSetting?.[0]?.value || [];
  } catch (error) {
    console.warn("SEO prerender: FAQ schema fallback in use.", error.message);
  }

  const productBySlug = new Map(
    products.map((product) => [product.slug, product]),
  );
  const productById = new Map(products.map((product) => [product.id, product]));

  const staticRoutes = buildStaticRoutes(faqCategories);
  const landingRoutes = landingPages.length
    ? buildLandingRoutes(landingPages, productById)
    : buildFallbackLandingRoutes(FALLBACK_LANDING_SLUGS);
  const calculatorRoutes = buildCalculatorRoutes(
    FALLBACK_CALCULATOR_SLUGS,
    productBySlug,
  );
  const productRoutes = products.length
    ? buildProductRoutes(products)
    : buildFallbackProductRoutes(
        landingRoutes.map((route) => route.path.replace(/^\//, "")),
        FALLBACK_ACCESSORY_PRODUCT_SLUGS,
      );

  const routes = dedupeRoutes([
    ...staticRoutes,
    ...landingRoutes,
    ...calculatorRoutes,
    ...productRoutes,
  ]);

  return { routes };
}

function injectRouteMeta(template, route) {
  const routeLabel = route.title
    .replace(/\s*\|\s*Melbourne Peptides$/, "")
    .trim();
  const shellTitle =
    route.path === "/"
      ? "Melbourne Peptides"
      : route.path === "/shop"
        ? "Shop Research Peptides"
        : route.path === "/peptide-calculator"
          ? "Peptide Dosage Calculator"
          : routeLabel;
  const shellDescription =
    route.path === "/"
      ? "Loading premium research compounds and peptide resources."
      : route.path === "/shop"
        ? "Loading the Melbourne Peptides catalog of research peptides, blends, and accessories."
        : route.path === "/peptide-calculator"
          ? "Loading the Melbourne Peptides peptide dosage calculator and reconstitution tools."
          : route.path.startsWith("/peptide-calculator/")
            ? `Loading calculator tools and dosage guidance for ${routeLabel.toLowerCase()}.`
            : `Loading ${routeLabel.toLowerCase()} from Melbourne Peptides.`;
  const noscriptTitle =
    route.path === "/"
      ? "Melbourne Peptides"
      : route.path === "/shop"
        ? "Shop Research Peptides"
        : route.path === "/peptide-calculator"
          ? "Peptide Dosage Calculator"
          : routeLabel;
  const noscriptPrimary =
    route.path === "/shop"
      ? "JavaScript is required for the interactive Melbourne Peptides catalog, product filtering, and cart features."
      : route.path === "/peptide-calculator"
        ? "JavaScript is required for the interactive peptide dosage calculator, dilution inputs, and syringe-unit tools."
        : route.path.startsWith("/peptide-calculator/")
          ? `JavaScript is required for the interactive ${routeLabel.toLowerCase()} inputs, dilution calculations, and syringe-unit conversions.`
          : route.path === "/"
            ? "JavaScript is required for the interactive Melbourne Peptides store, calculator tools, and account features."
            : `JavaScript is required for the interactive features on ${routeLabel}.`;
  const noscriptSecondary =
    route.path === "/shop"
      ? "You can still review our shop metadata, canonical URL, and linked research resources from this page source."
      : route.path === "/peptide-calculator"
        ? "You can still review the peptide calculator metadata, canonical URL, and related reference content from this page source."
        : route.path.startsWith("/peptide-calculator/")
          ? `You can still review the calculator metadata and canonical URL for ${routeLabel} at ${route.canonical}.`
          : route.path === "/"
            ? "You can still access our core research pages, contact information, and policy documents directly via their canonical URLs."
            : `You can still access this page directly at ${route.canonical}.`;
  const uniqueJsonLd = dedupeJsonLd(route.jsonLd);
  const jsonLdScripts = uniqueJsonLd.length
    ? `${uniqueJsonLd
        .map(
          (entry) =>
            `<script type="application/ld+json">${JSON.stringify(entry).replace(/<\//g, "<\\/")}</script>`,
        )
        .join("\n    ")}`
    : "";

  return template
    .replaceAll("__SEO_TITLE__", escapeHtml(route.title))
    .replaceAll("__SEO_DESCRIPTION__", escapeHtml(route.description))
    .replaceAll("__SEO_CANONICAL__", escapeHtml(route.canonical))
    .replaceAll("__SEO_ROBOTS__", escapeHtml(route.robots))
    .replaceAll("__SEO_OG_TYPE__", escapeHtml(route.type || "website"))
    .replaceAll(
      "__SEO_OG_IMAGE__",
      escapeHtml(route.image || SITE.defaultImage),
    )
    .replaceAll("__SEO_SHELL_TITLE__", escapeHtml(shellTitle))
    .replaceAll("__SEO_SHELL_DESCRIPTION__", escapeHtml(shellDescription))
    .replaceAll("__SEO_NOSCRIPT_TITLE__", escapeHtml(noscriptTitle))
    .replaceAll("__SEO_NOSCRIPT_PRIMARY__", escapeHtml(noscriptPrimary))
    .replaceAll("__SEO_NOSCRIPT_SECONDARY__", escapeHtml(noscriptSecondary))
    .replaceAll("__SEO_JSON_LD__", jsonLdScripts);
}

function loadPrerenderTemplate(distDir) {
  const sourceTemplatePath = path.join(repoRoot, "index.html");
  const builtIndexPath = path.join(distDir, "index.html");
  const sourceTemplate = fs.readFileSync(sourceTemplatePath, "utf8");
  const builtIndex = fs.readFileSync(builtIndexPath, "utf8");

  const sourceStyleClose = sourceTemplate.lastIndexOf("</style>");
  const sourceHeadClose = sourceTemplate.lastIndexOf("</head>");
  const builtStyleClose = builtIndex.lastIndexOf("</style>");
  const builtHeadClose = builtIndex.lastIndexOf("</head>");

  if (
    sourceStyleClose === -1 ||
    sourceHeadClose === -1 ||
    builtStyleClose === -1 ||
    builtHeadClose === -1
  ) {
    throw new Error("SEO prerender template parsing failed.");
  }

  const builtHeadAssets = builtIndex.slice(
    builtStyleClose + "</style>".length,
    builtHeadClose,
  );

  let finalTemplate = `${sourceTemplate.slice(0, sourceStyleClose + "</style>".length)}${builtHeadAssets}${sourceTemplate.slice(sourceHeadClose)}`;

  // 🚨 FIX: Remove the Vite development script from the production template 🚨
  finalTemplate = finalTemplate.replace(
    /<script type="module" src="\/src\/main\.jsx"><\/script>/g,
    "",
  );

  return finalTemplate;
}

function writeRouteHtml(routes) {
  const distDir = path.join(repoRoot, "dist");
  const template = loadPrerenderTemplate(distDir);

  for (const route of routes) {
    const html = injectRouteMeta(template, route);

    if (route.path === "/") {
      fs.writeFileSync(path.join(distDir, "index.html"), html);
      continue;
    }

    const routePath = route.path.replace(/^\//, "");
    const directoryIndexPath = path.join(distDir, routePath, "index.html");
    const cleanUrlHtmlPath = path.join(distDir, `${routePath}.html`);

    fs.mkdirSync(path.dirname(directoryIndexPath), { recursive: true });
    fs.mkdirSync(path.dirname(cleanUrlHtmlPath), { recursive: true });
    fs.writeFileSync(directoryIndexPath, html);
    fs.writeFileSync(cleanUrlHtmlPath, html);
  }
}

// --- NEW AUDIT-COMPLIANT SITEMAP LOGIC ---

function buildSitemapXml(urls) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function buildSitemapIndexXml(sitemaps) {
  const lines = sitemaps
    .map(
      (s) =>
        `  <sitemap>\n    <loc>${SITE.baseUrl}/${s}</loc>\n    <lastmod>${new Date().toISOString().split("T")[0]}</lastmod>\n  </sitemap>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${lines}\n</sitemapindex>\n`;
}

function formatUrlNode(route) {
  const lastmod = new Date().toISOString().split("T")[0];
  const priority =
    route.path === "/"
      ? "1.0"
      : route.path === "/shop"
        ? "0.9"
        : route.path.startsWith("/peptide-calculator/")
          ? "0.8"
          : route.path.startsWith("/product/")
            ? "0.6"
            : route.path.startsWith("/") && route.path.split("/").length === 2
              ? "0.85"
              : "0.7";
  const changefreq = route.path.startsWith("/product/") ? "weekly" : "monthly";
  return `  <url>\n    <loc>${escapeXml(route.canonical)}</loc>\n    <lastmod>${escapeXml((route.lastmod || lastmod).split("T")[0])}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

function buildRobotsTxt() {
  return `User-agent: *
Allow: /

Disallow: /admin
Disallow: /checkout
Disallow: /success
Disallow: /track
Disallow: /write-review
Disallow: /landing
Disallow: /creator-studio
Disallow: /account
Disallow: /cart
Disallow: /search

Disallow: /*?sort=
Disallow: /*?filter=
Disallow: /*?page=

Sitemap: ${SITE.baseUrl}/sitemap_index.xml
`;
}

function writeCrawlAssets(
  routes,
  { writePublic = true, writeDist = true } = {},
) {
  const indexableRoutes = routes.filter((route) => route.indexable);

  // Split routes per the audit
  const productNodes = indexableRoutes
    .filter((r) => r.path.startsWith("/product/"))
    .map(formatUrlNode)
    .join("\n");
  const guideNodes = indexableRoutes
    .filter(
      (r) =>
        !r.path.startsWith("/product/") &&
        !r.path.startsWith("/peptide-calculator") &&
        r.path !== "/" &&
        r.path !== "/shop" &&
        r.path !== "/faq" &&
        r.path !== "/shipping" &&
        r.path !== "/contact" &&
        r.path !== "/about" &&
        r.path !== "/batch-testing" &&
        r.path !== "/research-policy" &&
        r.path !== "/privacy" &&
        r.path !== "/terms",
    )
    .map(formatUrlNode)
    .join("\n");
  const staticNodes = indexableRoutes
    .filter(
      (r) =>
        r.path === "/" ||
        r.path === "/shop" ||
        r.path === "/faq" ||
        r.path === "/shipping" ||
        r.path === "/contact" ||
        r.path === "/about" ||
        r.path === "/batch-testing" ||
        r.path === "/research-policy" ||
        r.path === "/privacy" ||
        r.path === "/terms" ||
        r.path.startsWith("/peptide-calculator"),
    )
    .map(formatUrlNode)
    .join("\n");

  const sitemapProducts = buildSitemapXml(productNodes);
  const sitemapGuides = buildSitemapXml(guideNodes);
  const sitemapPages = buildSitemapXml(staticNodes);
  const sitemapIndex = buildSitemapIndexXml([
    "sitemap-pages.xml",
    "sitemap-products.xml",
    "sitemap-guides.xml",
  ]);

  const robotsTxt = buildRobotsTxt();

  const writeFiles = (targetDir) => {
    fs.writeFileSync(
      path.join(targetDir, "sitemap-products.xml"),
      sitemapProducts,
    );
    fs.writeFileSync(path.join(targetDir, "sitemap-guides.xml"), sitemapGuides);
    fs.writeFileSync(path.join(targetDir, "sitemap-pages.xml"), sitemapPages);
    fs.writeFileSync(path.join(targetDir, "sitemap_index.xml"), sitemapIndex);
    fs.writeFileSync(path.join(targetDir, "robots.txt"), robotsTxt);

    // Also write a standard sitemap.xml just in case anything hardcoded looks for it
    fs.writeFileSync(path.join(targetDir, "sitemap.xml"), sitemapIndex);
  };

  if (writePublic) writeFiles(path.join(repoRoot, "public"));
  if (writeDist) writeFiles(path.join(repoRoot, "dist"));
}

export async function generateSeoAssets({
  writeHtml = true,
  writePublic = true,
  writeDist = true,
} = {}) {
  const { routes } = await buildSeoContext();
  if (writeHtml) writeRouteHtml(routes);
  writeCrawlAssets(routes, { writePublic, writeDist });
  console.log(`SEO prerender complete for ${routes.length} routes.`);
  return { routes };
}

const isDirectRun =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  generateSeoAssets().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
