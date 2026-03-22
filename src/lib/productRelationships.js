const PRODUCT_RELATIONSHIPS = {
  semaglutide: {
    relatedPeptides: ["tirzepatide", "retatrutide", "cagrilintide"],
    relatedAccessories: [
      "bacteriostatic-water",
      "peptide-syringes-1ml",
      "peptide-prep-pads",
    ],
    futureResearchLinks: [
      { label: "GLP-1 receptor agonist studies" },
      { label: "Semaglutide reconstitution protocols" },
      { label: "Metabolic pathway comparison with Tirzepatide" },
    ],
  },

  tirzepatide: {
    relatedPeptides: ["retatrutide", "semaglutide", "cagrilintide"],
    relatedAccessories: [
      "bacteriostatic-water",
      "peptide-syringes-1ml",
      "peptide-prep-pads",
    ],
    futureResearchLinks: [
      { label: "Dual GIP/GLP-1 agonist studies" },
      { label: "Tirzepatide dosing model comparisons" },
      { label: "Retatrutide vs Tirzepatide research" },
    ],
  },

  retatrutide: {
    relatedPeptides: ["tirzepatide", "semaglutide", "cagrilintide"],
    relatedAccessories: [
      "bacteriostatic-water",
      "peptide-syringes-1ml",
      "peptide-prep-pads",
    ],
    futureResearchLinks: [
      { label: "Triple agonist mechanism studies" },
      { label: "Retatrutide escalation research" },
      { label: "GLP-1/GIP/Glucagon pathway comparisons" },
    ],
  },

  cagrilintide: {
    relatedPeptides: ["semaglutide", "tirzepatide", "retatrutide"],
    relatedAccessories: [
      "bacteriostatic-water",
      "peptide-syringes-0-5ml",
      "peptide-prep-pads",
    ],
    futureResearchLinks: [
      { label: "Amylin analog studies" },
      { label: "Cagrilintide + GLP-1 combination research" },
      { label: "Micro-dosing amylin analog protocols" },
    ],
  },

  "hgh-191aa": {
    relatedPeptides: ["igf-1-lr3", "tesamorelin", "cjc-1295-with-dac"],
    relatedAccessories: [
      "bacteriostatic-water",
      "peptide-syringes-1ml",
      "peptide-prep-pads",
    ],
    futureResearchLinks: [
      { label: "Growth hormone 191aa stability studies" },
      { label: "IU conversion research references" },
      { label: "HGH and IGF signaling pathways" },
    ],
  },

  "igf-1-lr3": {
    relatedPeptides: ["hgh-191aa", "ipamorelin", "cjc-1295-no-dac"],
    relatedAccessories: [
      "bacteriostatic-water",
      "peptide-syringes-0-5ml",
      "peptide-prep-pads",
    ],
    futureResearchLinks: [
      { label: "IGF-1 LR3 stability studies" },
      { label: "IGF receptor signaling references" },
      { label: "IGF-1 LR3 reconstitution methods" },
    ],
  },

  "bpc-157": {
    relatedPeptides: ["tb-500-tb4", "kpv", "wolverine-stack"],
    relatedAccessories: [
      "bacteriostatic-water",
      "peptide-syringes-0-5ml",
      "peptide-prep-pads",
    ],
    futureResearchLinks: [
      { label: "Tendon repair studies" },
      { label: "Gastric protection mechanism papers" },
      { label: "BPC-157 and TB-500 combination studies" },
    ],
  },

  "tb-500-tb4": {
    relatedPeptides: ["bpc-157", "wolverine-stack", "tri-heal-max"],
    relatedAccessories: [
      "bacteriostatic-water",
      "peptide-syringes-1ml",
      "peptide-prep-pads",
    ],
    futureResearchLinks: [
      { label: "Thymosin Beta-4 recovery studies" },
      { label: "TB-500 systemic recovery models" },
      { label: "TB-500 + BPC-157 synergy research" },
    ],
  },

  epitalon: {
    relatedPeptides: ["nad-plus", "mots-c", "thymosin-alpha-1"],
    relatedAccessories: [
      "bacteriostatic-water",
      "peptide-syringes-0-5ml",
      "peptide-prep-pads",
    ],
    futureResearchLinks: [
      { label: "Telomerase activation studies" },
      { label: "Longevity pathway references" },
      { label: "Epitalon cycle design research" },
    ],
  },

  "melanotan-i": {
    relatedPeptides: ["melanotan-ii", "ghk-cu", "nad-plus"],
    relatedAccessories: [
      "bacteriostatic-water",
      "peptide-syringes-0-5ml",
      "peptide-prep-pads",
    ],
    futureResearchLinks: [
      { label: "Melanocortin receptor studies" },
      { label: "Pigmentation pathway references" },
      { label: "Melanotan handling protocols" },
    ],
  },

  "melanotan-ii": {
    relatedPeptides: ["melanotan-i", "ghk-cu", "nad-plus"],
    relatedAccessories: [
      "bacteriostatic-water",
      "peptide-syringes-0-5ml",
      "peptide-prep-pads",
    ],
    futureResearchLinks: [
      { label: "Melanotan II receptor studies" },
      { label: "Melanocortin signaling papers" },
      { label: "MT2 storage and stability references" },
    ],
  },

  "cjc-1295-with-dac": {
    relatedPeptides: ["ipamorelin", "hgh-191aa", "sermorelin"],
    relatedAccessories: [
      "bacteriostatic-water",
      "peptide-syringes-0-5ml",
      "peptide-prep-pads",
    ],
    futureResearchLinks: [
      { label: "DAC pharmacokinetics studies" },
      { label: "GHRH analog research" },
      { label: "Long-acting GH secretagogue references" },
    ],
  },

  "cjc-1295-no-dac": {
    relatedPeptides: [
      "ipamorelin",
      "sermorelin",
      "cjc-1295-no-dac-plus-ipamorelin",
    ],
    relatedAccessories: [
      "bacteriostatic-water",
      "peptide-syringes-0-5ml",
      "peptide-prep-pads",
    ],
    futureResearchLinks: [
      { label: "Mod GRF 1-29 studies" },
      { label: "No DAC pulse-response research" },
      { label: "CJC + Ipamorelin synergy papers" },
    ],
  },

  "ghrp-6": {
    relatedPeptides: ["ipamorelin", "cjc-1295-no-dac", "sermorelin"],
    relatedAccessories: [
      "bacteriostatic-water",
      "peptide-syringes-0-5ml",
      "peptide-prep-pads",
    ],
    futureResearchLinks: [
      { label: "Growth hormone releasing peptide studies" },
      { label: "Ghrelin mimetic pathway references" },
      { label: "GHRP protocol comparisons" },
    ],
  },

  tesamorelin: {
    relatedPeptides: ["hgh-191aa", "igf-1-lr3", "sermorelin"],
    relatedAccessories: [
      "bacteriostatic-water",
      "peptide-syringes-0-5ml",
      "peptide-prep-pads",
    ],
    futureResearchLinks: [
      { label: "Tesamorelin GHRH studies" },
      { label: "Visceral fat research references" },
      { label: "Tesamorelin reconstitution protocols" },
    ],
  },

  "mots-c": {
    relatedPeptides: ["nad-plus", "epitalon", "semaglutide"],
    relatedAccessories: [
      "bacteriostatic-water",
      "peptide-syringes-1ml",
      "peptide-prep-pads",
    ],
    futureResearchLinks: [
      { label: "Mitochondrial peptide studies" },
      { label: "Metabolic homeostasis research" },
      { label: "MOTS-c degradation references" },
    ],
  },

  ipamorelin: {
    relatedPeptides: [
      "cjc-1295-no-dac",
      "sermorelin",
      "cjc-1295-no-dac-plus-ipamorelin",
    ],
    relatedAccessories: [
      "bacteriostatic-water",
      "peptide-syringes-0-5ml",
      "peptide-prep-pads",
    ],
    futureResearchLinks: [
      { label: "Ipamorelin saturation studies" },
      { label: "Ghrelin mimetic research papers" },
      { label: "CJC + Ipamorelin combination references" },
    ],
  },

  semax: {
    relatedPeptides: ["selank", "nad-plus", "mots-c"],
    relatedAccessories: [
      "bacteriostatic-water",
      "peptide-syringes-0-5ml",
      "peptide-prep-pads",
    ],
    futureResearchLinks: [
      { label: "Nootropic peptide studies" },
      { label: "Semax neurogenic references" },
      { label: "Semax vs Selank comparisons" },
    ],
  },

  selank: {
    relatedPeptides: ["semax", "nad-plus", "mots-c"],
    relatedAccessories: [
      "bacteriostatic-water",
      "peptide-syringes-0-5ml",
      "peptide-prep-pads",
    ],
    futureResearchLinks: [
      { label: "Selank anxiolytic research" },
      { label: "Nootropic peptide pathway studies" },
      { label: "Selank vs Semax comparisons" },
    ],
  },

  "ghk-cu": {
    relatedPeptides: ["bpc-157", "glow-blend", "klow-blend"],
    relatedAccessories: [
      "bacteriostatic-water",
      "peptide-syringes-1ml",
      "peptide-prep-pads",
    ],
    futureResearchLinks: [
      { label: "Copper peptide studies" },
      { label: "GHK-Cu wound repair references" },
      { label: "GHK-Cu irritation mitigation research" },
    ],
  },

  kpv: {
    relatedPeptides: ["bpc-157", "tri-heal-max", "klow-blend"],
    relatedAccessories: [
      "bacteriostatic-water",
      "peptide-syringes-0-5ml",
      "peptide-prep-pads",
    ],
    futureResearchLinks: [
      { label: "Anti-inflammatory peptide studies" },
      { label: "KPV mucosal repair references" },
      { label: "KPV blend strategy research" },
    ],
  },

  sermorelin: {
    relatedPeptides: ["ipamorelin", "cjc-1295-no-dac", "hgh-191aa"],
    relatedAccessories: [
      "bacteriostatic-water",
      "peptide-syringes-0-5ml",
      "peptide-prep-pads",
    ],
    futureResearchLinks: [
      { label: "Sermorelin GHRH studies" },
      { label: "Growth hormone pulse references" },
      { label: "Sermorelin vs CJC research" },
    ],
  },

  "tri-heal-max": {
    relatedPeptides: ["bpc-157", "tb-500-tb4", "kpv"],
    relatedAccessories: [
      "bacteriostatic-water",
      "peptide-syringes-1ml",
      "peptide-prep-pads",
    ],
    futureResearchLinks: [
      { label: "Blend dosing studies" },
      { label: "Tri-Heal Max recovery references" },
      { label: "Multi-peptide repair model research" },
    ],
  },

  "glow-blend": {
    relatedPeptides: ["ghk-cu", "bpc-157", "tb-500-tb4"],
    relatedAccessories: [
      "bacteriostatic-water",
      "peptide-syringes-1ml",
      "peptide-prep-pads",
    ],
    futureResearchLinks: [
      { label: "Glow Blend repair studies" },
      { label: "Copper peptide blend references" },
      { label: "GHK-Cu + BPC-157 synergy research" },
    ],
  },

  "klow-blend": {
    relatedPeptides: ["ghk-cu", "bpc-157", "kpv"],
    relatedAccessories: [
      "bacteriostatic-water",
      "peptide-syringes-1ml",
      "peptide-prep-pads",
    ],
    futureResearchLinks: [
      { label: "Klow Blend recovery studies" },
      { label: "Copper peptide combination references" },
      { label: "Multi-pathway repair research" },
    ],
  },

  "wolverine-stack": {
    relatedPeptides: ["bpc-157", "tb-500-tb4", "tri-heal-max"],
    relatedAccessories: [
      "bacteriostatic-water",
      "peptide-syringes-1ml",
      "peptide-prep-pads",
    ],
    futureResearchLinks: [
      { label: "Wolverine Stack combination studies" },
      { label: "BPC + TB-500 synergy references" },
      { label: "Recovery stack dosing models" },
    ],
  },

  "nad-plus": {
    relatedPeptides: ["mots-c", "epitalon", "semax"],
    relatedAccessories: [
      "bacteriostatic-water",
      "peptide-syringes-1ml",
      "peptide-prep-pads",
    ],
    futureResearchLinks: [
      { label: "NAD+ cellular metabolism studies" },
      { label: "NAD+ injection comfort references" },
      { label: "NAD+ and mitochondrial function research" },
    ],
  },

  "ll-37": {
    relatedPeptides: ["thymosin-alpha-1", "bpc-157", "ghk-cu"],
    relatedAccessories: [
      "bacteriostatic-water",
      "peptide-syringes-0-5ml",
      "peptide-prep-pads",
    ],
    futureResearchLinks: [
      { label: "LL-37 antimicrobial peptide studies" },
      { label: "Immune modulation references" },
      { label: "LL-37 tissue repair research" },
    ],
  },

  "thymosin-alpha-1": {
    relatedPeptides: ["ll-37", "epitalon", "nad-plus"],
    relatedAccessories: [
      "bacteriostatic-water",
      "peptide-syringes-0-5ml",
      "peptide-prep-pads",
    ],
    futureResearchLinks: [
      { label: "Thymosin Alpha-1 immune studies" },
      { label: "TA1 pathway references" },
      { label: "Immune peptide comparison papers" },
    ],
  },

  "cjc-1295-no-dac-plus-ipamorelin": {
    relatedPeptides: ["ipamorelin", "cjc-1295-no-dac", "sermorelin"],
    relatedAccessories: [
      "bacteriostatic-water",
      "peptide-syringes-0-5ml",
      "peptide-prep-pads",
    ],
    futureResearchLinks: [
      { label: "CJC + Ipamorelin blend studies" },
      { label: "Secretagogue synergy references" },
      { label: "GH pulse optimization research" },
    ],
  },

  "bacteriostatic-water": {
    relatedPeptides: ["bpc-157", "tirzepatide", "retatrutide"],
    relatedAccessories: [
      "peptide-syringes-1ml",
      "peptide-syringes-0-5ml",
      "peptide-prep-pads",
    ],
    futureResearchLinks: [
      { label: "Bacteriostatic water handling guides" },
      { label: "Peptide reconstitution protocols" },
      { label: "Sterility best practices" },
    ],
  },

  "peptide-prep-pads": {
    relatedPeptides: [],
    relatedAccessories: [
      "bacteriostatic-water",
      "peptide-syringes-1ml",
      "peptide-syringes-0-5ml",
    ],
    futureResearchLinks: [
      { label: "Lab prep and sterile workflow" },
      { label: "Injection site preparation references" },
      { label: "Basic handling protocols" },
    ],
  },

  "peptide-syringes-1ml": {
    relatedPeptides: ["tb-500-tb4", "mots-c", "nad-plus"],
    relatedAccessories: [
      "bacteriostatic-water",
      "peptide-prep-pads",
      "peptide-syringes-0-5ml",
    ],
    futureResearchLinks: [
      { label: "Large-volume peptide draw references" },
      { label: "Syringe sizing best practices" },
      { label: "U-100 conversion guides" },
    ],
  },

  "peptide-syringes-0-5ml": {
    relatedPeptides: ["bpc-157", "ipamorelin", "cjc-1295-no-dac"],
    relatedAccessories: [
      "bacteriostatic-water",
      "peptide-prep-pads",
      "peptide-syringes-1ml",
    ],
    futureResearchLinks: [
      { label: "Micro-dosing syringe references" },
      { label: "Precision draw best practices" },
      { label: "U-100 micro-measurement guides" },
    ],
  },
};

function unique(items = []) {
  return [...new Set(items.filter(Boolean))];
}

export function getRelationshipConfig(slug) {
  return (
    PRODUCT_RELATIONSHIPS[slug] || {
      relatedPeptides: [],
      relatedAccessories: [],
      futureResearchLinks: [],
    }
  );
}

export function getRelatedProductSlugsForProduct(slug) {
  const config = getRelationshipConfig(slug);
  return unique([
    ...config.relatedAccessories,
    ...config.relatedPeptides,
  ]).slice(0, 6);
}

export function getSuggestedProductSlugsForCart(cartItems = []) {
  const cartSlugs = new Set(cartItems.map((item) => item.slug).filter(Boolean));
  const suggestions = [];

  cartItems.forEach((item) => {
    const config = getRelationshipConfig(item.slug);
    const related = [
      ...(config.relatedAccessories || []),
      ...(config.relatedPeptides || []),
    ];

    related.forEach((slug) => {
      if (!cartSlugs.has(slug)) {
        suggestions.push(slug);
      }
    });
  });

  return unique(suggestions).slice(0, 6);
}

export function getRelatedResearchItems(slug) {
  const config = getRelationshipConfig(slug);
  return (config.relatedPeptides || []).slice(0, 3).map((relatedSlug) => ({
    slug: relatedSlug,
    name: slugToDisplayName(relatedSlug),
    reason: `Related ${slugToDisplayName(slug)} research pathway.`,
  }));
}

export function getFutureResearchLinks(slug) {
  return getRelationshipConfig(slug).futureResearchLinks || [];
}

export function slugToDisplayName(slug = "") {
  return slug
    .split("-")
    .filter(Boolean)
    .map((part) =>
      part.length <= 3
        ? part.toUpperCase()
        : part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join(" ")
    .replace(/\bIi\b/g, "II")
    .replace(/\bCu\b/g, "Cu")
    .replace(/\bLr3\b/g, "LR3")
    .replace(/\bGhk\b/g, "GHK")
    .replace(/\bMots\b/g, "MOTS")
    .replace(/\bTb\b/g, "TB")
    .replace(/\bCjc\b/g, "CJC")
    .replace(/\bBpc\b/g, "BPC")
    .replace(/\bNad\b/g, "NAD");
}
