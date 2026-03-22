// src/lib/relatedProducts.js

import { getRelationshipConfig } from "./productRelationships";

function uniqueBySlug(items) {
  const seen = new Set();
  return items.filter((item) => {
    if (!item?.slug || seen.has(item.slug)) return false;
    seen.add(item.slug);
    return true;
  });
}

function slugMap(products = []) {
  return new Map(products.map((product) => [product.slug, product]));
}

function categoryIsAccessory(category = "") {
  return String(category).toLowerCase() === "accessories";
}

export function resolveRelatedProducts({
  currentProduct,
  allProducts = [],
  maxPeptides = 3,
  maxAccessories = 3,
  maxBlends = 3,
}) {
  if (!currentProduct?.slug || !Array.isArray(allProducts)) {
    return {
      relatedPeptides: [],
      relatedAccessories: [],
      relatedBlends: [],
      peopleAlsoBought: [],
    };
  }

  const bySlug = slugMap(allProducts);
  const config = getRelationshipConfig(currentProduct.slug);

  const relatedPeptides = uniqueBySlug(
    (config.relatedPeptides || [])
      .map((slug) => bySlug.get(slug))
      .filter(Boolean),
  ).slice(0, maxPeptides);

  const relatedAccessories = uniqueBySlug(
    (config.relatedAccessories || [])
      .map((slug) => bySlug.get(slug))
      .filter(Boolean),
  ).slice(0, maxAccessories);

  const relatedBlends = uniqueBySlug(
    (config.relatedBlends || [])
      .map((slug) => bySlug.get(slug))
      .filter(Boolean),
  ).slice(0, maxBlends);

  const peopleAlsoBought = uniqueBySlug([
    ...relatedAccessories,
    ...relatedPeptides,
    ...relatedBlends,
  ]).filter((item) => item.slug !== currentProduct.slug);

  return {
    relatedPeptides,
    relatedAccessories,
    relatedBlends,
    peopleAlsoBought,
    futureResearchLinks: config.futureResearchLinks || [],
  };
}

export function resolveCartSuggestions(cartItems = [], allProducts = []) {
  if (!Array.isArray(cartItems) || !Array.isArray(allProducts)) return [];

  const bySlug = slugMap(allProducts);
  const suggestionPool = [];

  for (const cartItem of cartItems) {
    if (!cartItem?.slug) continue;

    const config = getRelationshipConfig(cartItem.slug);

    for (const slug of config.relatedAccessories || []) {
      const product = bySlug.get(slug);
      if (product) suggestionPool.push(product);
    }

    // Optional: if the cart item is an accessory, suggest useful peptides/blends too
    if (categoryIsAccessory(cartItem.category)) {
      for (const slug of config.relatedPeptides || []) {
        const product = bySlug.get(slug);
        if (product) suggestionPool.push(product);
      }
    }
  }

  const cartSlugs = new Set(cartItems.map((item) => item.slug));

  return uniqueBySlug(suggestionPool).filter(
    (product) => !cartSlugs.has(product.slug),
  );
}
