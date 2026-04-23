import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useCart } from "../lib/CartContext";
import SEO from "../components/SEO";
import {
  ChevronLeft,
  ShieldCheck,
  Truck,
  AlertTriangle,
  ChevronDown,
  FileText,
  ExternalLink,
  Plus,
  Minus,
  Info,
  CheckCircle2,
  Beaker,
  Calculator,
  ArrowRight,
} from "lucide-react";
import { getRelatedProductSlugsForProduct } from "../lib/productRelationships";
import "./Product.css";

// --- PRE-DEFINED PEPTIDE RESEARCH PROFILES ---
const PEPTIDE_PROFILES = {
  retatrutide: {
    overview:
      "Retatrutide is a triple-agonist peptide commonly researched for its role in profound weight loss and metabolic regulation. It targets GLP-1, GIP, and Glucagon receptors, making it one of the most advanced compounds for studying appetite control, fat reduction, and energy balance.",
    dosage: {
      phases: [
        {
          phase: "Week 1–4",
          dose: "0.5mg once per week (or 0.25mg twice per week)",
        },
        {
          phase: "Week 5–8",
          dose: "1.0mg once per week (or 0.5mg twice per week)",
        },
        {
          phase: "Week 9–12",
          dose: "2.0mg once per week (or 1.0mg twice per week)",
        },
      ],
      rules: [
        "Inject once per week only",
        "Increase dose every 4 weeks",
        "Stay at the lowest effective dose",
        "If side effects occur → stay at current dose longer",
      ],
    },
    combos: ["Cagrilintide", "MOTS-c", "AOD-9604"],
  },
  tirzepatide: {
    overview:
      "Tirzepatide is a dual-agonist (GIP and GLP-1) commonly researched for significant weight loss and glycemic control. It is highly studied for its ability to delay gastric emptying, reduce appetite, and improve metabolic markers.",
    dosage: {
      phases: [
        { phase: "Week 1–4", dose: "2.5mg once per week" },
        { phase: "Week 5–8", dose: "5.0mg once per week" },
        { phase: "Week 9–12", dose: "7.5mg once per week" },
      ],
      rules: [
        "Administer once every 7 days",
        "Wait at least 4 weeks before titrating up",
        "Do not skip steps in the titration schedule",
        "Maintain current dose if gastrointestinal distress occurs",
      ],
    },
    combos: ["Cagrilintide", "MOTS-c", "AOD-9604"],
  },
  semaglutide: {
    overview:
      "Semaglutide is a potent GLP-1 receptor agonist primarily researched for appetite suppression, delayed gastric emptying, and steady weight loss. It is a foundational compound in modern metabolic and obesity studies.",
    dosage: {
      phases: [
        { phase: "Week 1–4", dose: "0.25mg once per week" },
        { phase: "Week 5–8", dose: "0.50mg once per week" },
        { phase: "Week 9–12", dose: "1.00mg once per week" },
      ],
      rules: [
        "Administer strictly once per week",
        "Must complete full 4 weeks before increasing",
        "Maximum recommended research dose is 2.4mg",
        "Monitor hydration levels closely",
      ],
    },
    combos: ["BPC-157", "AOD-9604", "MOTS-c"],
  },
  "bpc-157": {
    overview:
      "BPC-157 (Body Protection Compound) is renowned for its rapid regenerative properties. Research focuses heavily on its ability to accelerate the healing of tendons, ligaments, and muscle tissue, while also offering significant gastroprotective and anti-inflammatory benefits.",
    dosage: {
      phases: [
        { phase: "Standard Protocol", dose: "250mcg once or twice daily" },
        {
          phase: "Acute Protocol",
          dose: "500mcg twice daily (morning & night)",
        },
      ],
      rules: [
        "Administer daily for optimal systemic effects",
        "Standard cycle length is 4 to 6 weeks",
        "Allow 2 to 4 weeks off between cycles",
        "Local administration near study site is common but not required",
      ],
    },
    combos: ["TB-500", "GHK-Cu", "CJC-1295 No DAC"],
  },
  "tb-500-tb4": {
    overview:
      "TB-500 is a synthetic version of Thymosin Beta-4. It is widely researched for its role in upregulating actin, promoting cell migration, and accelerating muscle recovery, wound healing, and reducing systemic inflammation.",
    dosage: {
      phases: [
        {
          phase: "Loading Phase (Wk 1-4)",
          dose: "2.5mg twice per week (5mg total)",
        },
        { phase: "Maintenance (Wk 5+)", dose: "2.5mg once per week" },
      ],
      rules: [
        "Best administered systematically (sub-q)",
        "Typically run in 4-6 week cycles",
        "Highly synergistic when researched alongside BPC-157",
      ],
    },
    combos: ["BPC-157", "Ipamorelin", "GHK-Cu"],
  },
  cagrilintide: {
    overview:
      "Cagrilintide is an amylin analog primarily researched as a combination therapy alongside GLP-1 agonists. It targets amylin receptors to significantly delay gastric emptying and enhance feelings of satiety.",
    dosage: {
      phases: [
        { phase: "Week 1–4", dose: "0.25mg once per week" },
        { phase: "Week 5–8", dose: "0.50mg once per week" },
        { phase: "Week 9–12", dose: "1.00mg once per week" },
      ],
      rules: [
        "Administer once weekly",
        "If stacking with Tirzepatide/Semaglutide, dose on a different day",
        "Titrate slowly to avoid severe nausea",
        "Do not exceed 2.4mg per week",
      ],
    },
    combos: ["Retatrutide", "Tirzepatide", "Semaglutide"],
  },
  "aod-9604": {
    overview:
      "AOD-9604 is a modified fragment of Human Growth Hormone (HGH) isolated for its lipolytic (fat-burning) properties. Research indicates it stimulates lipolysis and inhibits lipogenesis without affecting blood sugar or tissue growth.",
    dosage: {
      phases: [
        { phase: "Standard Protocol", dose: "300mcg once daily" },
        {
          phase: "Advanced Protocol",
          dose: "250mcg twice daily (morning & pre-workout)",
        },
      ],
      rules: [
        "Administer fasted for optimal lipid mobilization",
        "Do not consume calories for 30-60 minutes post-administration",
        "Standard cycle length is 8 to 12 weeks",
      ],
    },
    combos: ["Semaglutide", "Tirzepatide", "MOTS-c"],
  },
  "pt-141": {
    overview:
      "PT-141 (Bremelanotide) is a melanocortin receptor agonist developed from Melanotan II. It is primarily researched for its profound effects on sexual arousal and dysfunction in both male and female subjects.",
    dosage: {
      phases: [
        { phase: "Starting Protocol", dose: "1mg to 1.5mg as needed" },
        { phase: "Maximum Protocol", dose: "2mg as needed" },
      ],
      rules: [
        "Administer 2 to 4 hours prior to desired effect",
        "Do not exceed 2mg in a 24-hour period",
        "Do not exceed 8 doses per month",
        "May cause transient nausea upon administration",
      ],
    },
    combos: ["Melanotan II", "Oxytocin Acetate"],
  },
  "mots-c": {
    overview:
      "MOTS-c is a mitochondrial-derived peptide that regulates metabolic homeostasis. It is highly researched for its ability to promote AMP-activated protein kinase (AMPK), improving exercise capacity, insulin sensitivity, and cellular energy.",
    dosage: {
      phases: [
        { phase: "Loading Phase", dose: "5mg to 10mg once per week" },
        { phase: "Maintenance Phase", dose: "5mg every two weeks" },
      ],
      rules: [
        "Administer 30-45 minutes pre-exercise for best systemic uptake",
        "Requires large volumes of bacteriostatic water due to high milligram dosing",
        "Use reconstituted solution immediately or within 14 days",
      ],
    },
    combos: ["SS-31", "Retatrutide", "AOD-9604"],
  },
  "ghk-cu": {
    overview:
      "GHK-Cu (Copper Peptide) is a naturally occurring copper complex. It is actively researched for its profound anti-aging properties, ability to improve skin elasticity, stimulate blood vessel growth, and accelerate systemic wound healing.",
    dosage: {
      phases: [
        { phase: "Standard Protocol", dose: "1.5mg to 2mg once daily" },
        { phase: "Alternative Protocol", dose: "5mg twice per week" },
      ],
      rules: [
        "Cycle for 30 days, followed by 30 days off",
        "Can cause injection site pip (stinging) - dilute with extra Bac water",
        "Monitor systemic zinc levels during extended research periods",
      ],
    },
    combos: ["BPC-157", "Epitalon", "CJC-1295 No DAC"],
  },
  "hgh-191aa": {
    overview:
      "HGH (Somatropin 191aa) is a bio-identical synthetic human growth hormone. It is researched globally for its extensive role in cell regeneration, lean tissue accretion, lipid mobilization, and systemic recovery.",
    dosage: {
      phases: [
        { phase: "Anti-Aging/Recovery", dose: "2 to 3 IU once daily" },
        { phase: "Anabolic/Tissue Accretion", dose: "4 to 6 IU once daily" },
      ],
      rules: [
        "Administer fasted in the morning or immediately before sleep",
        "Cycles typically range from 3 to 6 months minimum",
        "Store lyophilized powder and reconstituted solution in the refrigerator",
      ],
    },
    combos: ["IGF-1 LR3", "Tesamorelin", "BPC-157"],
  },
  "melanotan-ii": {
    overview:
      "Melanotan II (MT2) is a synthetic analog of alpha-melanocyte-stimulating hormone (α-MSH). It is heavily researched for its ability to stimulate melanogenesis (skin pigmentation) and its secondary effects on libido and appetite suppression.",
    dosage: {
      phases: [
        { phase: "Loading Phase", dose: "250mcg daily (prior to UV exposure)" },
        { phase: "Maintenance Phase", dose: "250mcg to 500mcg 1-2x per week" },
      ],
      rules: [
        "Start extremely low (100mcg) to assess nausea tolerance",
        "Requires UV exposure to trigger the pigmentation process",
        "Do not exceed 500mcg per administration",
        "Dose at night to mitigate transient flushing/nausea",
      ],
    },
    combos: ["PT-141", "BPC-157"],
  },
  "cjc-1295-no-dac": {
    overview:
      "CJC-1295 No DAC (Mod GRF 1-29) is a short-acting Growth Hormone Releasing Hormone (GHRH) analog. It is researched for its ability to mimic natural, physiological growth hormone pulses without elevating baseline serum levels long-term.",
    dosage: {
      phases: [{ phase: "Standard Protocol", dose: "100mcg 1-3 times daily" }],
      rules: [
        "Administer strictly on an empty stomach (fasted)",
        "Do not consume carbohydrates or fats for 30 minutes post-dose",
        "Highly synergistic when administered concurrently with a GHRP",
      ],
    },
    combos: ["Ipamorelin", "GHRP-6", "GHRP-2"],
  },
  ipamorelin: {
    overview:
      "Ipamorelin is a selective pentapeptide ghrelin mimetic (GHRP). It stimulates a significant release of growth hormone without severely elevating cortisol or prolactin levels, making it a highly favorable research secretagogue.",
    dosage: {
      phases: [
        {
          phase: "Standard Protocol",
          dose: "100mcg to 200mcg 1-3 times daily",
        },
      ],
      rules: [
        "Administer strictly on an empty stomach (fasted)",
        "Do not consume carbohydrates or fats for 30 minutes post-dose",
        "Typically stacked in the same syringe as CJC-1295",
      ],
    },
    combos: ["CJC-1295 No DAC", "CJC-1295 with DAC"],
  },
  "cjc-1295-no-dac-plus-ipamorelin": {
    overview:
      "The CJC-1295 No DAC + Ipamorelin blend combines a GHRH and a GHRP. This synergistic formulation creates a robust, natural growth hormone pulse, amplifying the restorative properties of both compounds simultaneously.",
    dosage: {
      phases: [
        {
          phase: "Standard Protocol",
          dose: "200mcg total blend (100mcg of each) 1-3 times daily",
        },
      ],
      rules: [
        "Administer strictly on an empty stomach (fasted)",
        "Wait 30 minutes before consuming food",
        "Dosing before bed maximizes the natural nocturnal GH pulse",
      ],
    },
    combos: ["BPC-157", "TB-500", "GHK-Cu"],
  },
  epitalon: {
    overview:
      "Epitalon is a synthetic tetrapeptide heavily researched for its potential to activate telomerase, elongate telomeres, and regulate the circadian rhythm through pineal gland interaction.",
    dosage: {
      phases: [
        { phase: "Standard Protocol", dose: "10mg daily for 10-20 days" },
        { phase: "Micro-Dose Protocol", dose: "1mg to 3mg daily for 30 days" },
      ],
      rules: [
        "Cycles are typically conducted 1 to 2 times per year",
        "Administer in the morning or early afternoon",
        "May improve deep sleep architecture",
      ],
    },
    combos: ["GHK-Cu", "Pinealon", "Thymosin Alpha-1"],
  },
  "igf-1-lr3": {
    overview:
      "IGF-1 LR3 is a highly potent, lengthened analogue of human insulin-like growth factor 1. It has an extended half-life and is researched for profound cellular hyperplasia and metabolic nutrient partitioning.",
    dosage: {
      phases: [{ phase: "Standard Protocol", dose: "20mcg to 50mcg daily" }],
      rules: [
        "Administer daily for a maximum of 4 weeks",
        "Requires 4 to 6 weeks off between cycles to restore receptor sensitivity",
        "Monitor blood glucose levels due to nutrient partitioning effects",
      ],
    },
    combos: ["HGH 191aa", "BPC-157"],
  },
  "wolverine-stack": {
    overview:
      "The Wolverine Stack is the ultimate tissue repair blend, combining TB-500 (systemic healing) and BPC-157 (localized repair). This combination is highly sought after for accelerated recovery from muscular, tendon, and ligament damage.",
    dosage: {
      phases: [
        {
          phase: "Acute Healing Phase",
          dose: "Draw equivalent of 500mcg BPC / 1mg TB-500 daily",
        },
        {
          phase: "Maintenance Phase",
          dose: "Draw equivalent of 250mcg BPC / 500mcg TB-500 daily",
        },
      ],
      rules: [
        "Administer daily during the acute injury phase",
        "Cycle lengths typically range from 4 to 6 weeks",
        "Calculate unit draws carefully based on the specific mg blend ratio in the vial",
      ],
    },
    combos: ["GHK-Cu", "CJC-1295 No DAC", "Ipamorelin"],
  },
  "ll-37": {
    overview:
      "LL-37 is an antimicrobial peptide (cathelicidin) known for its broad-spectrum defense against bacteria, enveloped viruses, and fungi. It is researched for its role in innate immune system regulation and biofilm degradation.",
    dosage: {
      phases: [{ phase: "Standard Protocol", dose: "100mcg once daily" }],
      rules: [
        "Typically cycled for 4 to 6 weeks",
        "Can cause transient injection site irritation",
        "Monitor for systemic inflammatory responses",
      ],
    },
    combos: ["Thymosin Alpha-1", "BPC-157"],
  },
  "thymosin-alpha-1": {
    overview:
      "Thymosin Alpha-1 (TA1) is a naturally occurring peptide produced by the thymus gland. It is widely researched for its ability to modulate the immune system, enhance T-cell function, and combat chronic viral/fungal loads.",
    dosage: {
      phases: [
        { phase: "Standard Protocol", dose: "1.5mg twice per week" },
        { phase: "Acute Protocol", dose: "1mg daily" },
      ],
      rules: [
        "Standard cycle lengths are 4 weeks",
        "Highly stable once reconstituted",
        "Excellent synergistic effects with other antimicrobial peptides",
      ],
    },
    combos: ["LL-37", "BPC-157", "Epitalon"],
  },
  dsip: {
    overview:
      "Delta Sleep-Inducing Peptide (DSIP) is a neuromodulator researched for its ability to normalize sleep architecture, reduce stress, and influence circadian rhythms without the grogginess of traditional sedatives.",
    dosage: {
      phases: [
        { phase: "Standard Protocol", dose: "100mcg to 250mcg as needed" },
      ],
      rules: [
        "Administer 1 to 3 hours prior to sleep",
        "Effects are cumulative; may take 3-4 days of use to observe deep sleep alterations",
        "Do not exceed 500mcg per day",
      ],
    },
    combos: ["Epitalon", "Selank", "Pinealon"],
  },
  "ss-31": {
    overview:
      "SS-31 (Elamipretide) is a novel mitochondrial-targeted peptide. It is uniquely capable of penetrating the inner mitochondrial membrane to restore cardiolipin, reducing oxidative stress and restoring cellular energy production.",
    dosage: {
      phases: [{ phase: "Standard Protocol", dose: "4mg once daily" }],
      rules: [
        "Standard cycles run from 4 to 8 weeks",
        "Often utilized as a precursor cycle before running MOTS-c",
        "Requires large volumes of bacteriostatic water for dilution",
      ],
    },
    combos: ["MOTS-c", "NAD+", "Epitalon"],
  },
  "nad-plus": {
    overview:
      "Nicotinamide Adenine Dinucleotide (NAD+) is an essential coenzyme found in all living cells. Research focuses on its ability to repair DNA, upregulate sirtuins, and restore systemic cellular energy levels.",
    dosage: {
      phases: [
        {
          phase: "Standard Protocol",
          dose: "50mg to 100mg once or twice weekly",
        },
      ],
      rules: [
        "Highly notorious for causing injection site pain and flushing",
        "Must be diluted with significant amounts of bacteriostatic water",
        "Administer very slowly to mitigate discomfort",
      ],
    },
    combos: ["SS-31", "MOTS-c", "Glutathione"],
  },
  glutathione: {
    overview:
      "Glutathione is the body's master antioxidant. It is crucial for neutralizing free radicals, detoxifying hepatic (liver) pathways, and maintaining cellular redox balance during high-stress research protocols.",
    dosage: {
      phases: [
        { phase: "Standard Protocol", dose: "200mg 1-3 times per week" },
      ],
      rules: [
        "Requires large volumes of solvent due to high milligram requirements",
        "Best utilized concurrently with other oxidative-stress inducing compounds",
        "Keep refrigerated immediately upon mixing",
      ],
    },
    combos: ["NAD+", "GHK-Cu", "SS-31"],
  },
  "5-amino-1-mq": {
    overview:
      "5-Amino-1MQ is a small molecule NNMT inhibitor. While technically not a peptide, it is highly researched for its ability to prevent fat cell growth, increase basal metabolic rate, and reverse diet-induced obesity.",
    dosage: {
      phases: [
        {
          phase: "Standard Protocol",
          dose: "50mg to 150mg daily (Oral/Capsule typically)",
        },
      ],
      rules: [
        "Often utilized in oral capsule form rather than subcutaneous injection",
        "Does not require PCT or cycling",
        "Highly synergistic with GLP-1 agonists",
      ],
    },
    combos: ["Retatrutide", "Tirzepatide", "AOD-9604"],
  },
  tesamorelin: {
    overview:
      "Tesamorelin is an extremely potent, stabilized form of Growth Hormone-Releasing Hormone (GHRH). It is FDA-approved under the brand name Egrifta for reducing visceral adipose tissue (visceral belly fat).",
    dosage: {
      phases: [{ phase: "Standard Protocol", dose: "1mg to 2mg once daily" }],
      rules: [
        "Administer strictly on an empty stomach (fasted) before bed",
        "Most studies track visceral fat reduction over 12 to 24 weeks",
        "Do not consume food for at least 60 minutes after administration",
      ],
    },
    combos: ["Ipamorelin", "AOD-9604", "Semaglutide"],
  },
  sermorelin: {
    overview:
      "Sermorelin is a 29-amino acid polypeptide representing the shortest functional fragment of GHRH. It is widely used to gently stimulate the pituitary gland to produce natural pulses of growth hormone.",
    dosage: {
      phases: [
        { phase: "Standard Protocol", dose: "200mcg to 300mcg once daily" },
      ],
      rules: [
        "Administer right before bed on an empty stomach",
        "Usually run in 3 to 6 month cycles for anti-aging observation",
        "Pairs exceptionally well with GHRPs",
      ],
    },
    combos: ["GHRP-2", "GHRP-6", "Ipamorelin"],
  },
  "ghrp-2": {
    overview:
      "GHRP-2 (Pralmorelin) is a synthetic hexapeptide growth hormone secretagogue. It triggers a massive release of growth hormone but also causes slight elevations in prolactin, cortisol, and appetite.",
    dosage: {
      phases: [
        {
          phase: "Standard Protocol",
          dose: "100mcg to 150mcg 1-3 times daily",
        },
      ],
      rules: [
        "Administer fasted for optimal release",
        "Slightly stronger GH pulse than Ipamorelin, but with minor side-effect profiles",
        "Always stack with a GHRH",
      ],
    },
    combos: ["CJC-1295 No DAC", "Sermorelin"],
  },
  "ghrp-6": {
    overview:
      "GHRP-6 is a first-generation growth hormone secretagogue notorious for inducing intense hunger shortly after administration, making it highly valuable for research involving cachexia or mass-accretion.",
    dosage: {
      phases: [
        {
          phase: "Standard Protocol",
          dose: "100mcg to 150mcg 1-3 times daily",
        },
      ],
      rules: [
        "Expect profound hunger 20-30 minutes post-administration",
        "Administer fasted for maximum GH release",
        "Elevates cortisol and prolactin slightly more than GHRP-2",
      ],
    },
    combos: ["CJC-1295 No DAC", "Sermorelin"],
  },
  selank: {
    overview:
      "Selank is a synthetic heptapeptide developed by the Russian Institute of Molecular Genetics. It is heavily researched for its profound anxiolytic (anti-anxiety), neuroprotective, and cognitive-enhancing effects.",
    dosage: {
      phases: [{ phase: "Standard Protocol", dose: "250mcg to 500mcg daily" }],
      rules: [
        "Often researched via intranasal administration due to rapid blood-brain barrier crossing",
        "Can be used systemically (sub-q) with similar efficacy",
        "Cycle for 14-30 days as needed for stress regulation",
      ],
    },
    combos: ["Semax", "DSIP", "Pinealon"],
  },
  semax: {
    overview:
      "Semax is a neuroactive peptide derived from ACTH. It is highly valued in cognitive research for significantly improving memory, focus, neurogenesis, and mitigating the effects of ischemic stroke.",
    dosage: {
      phases: [{ phase: "Standard Protocol", dose: "250mcg to 500mcg daily" }],
      rules: [
        "Often researched via intranasal administration",
        "Can be stimulating; avoid taking immediately before sleep",
        "Cycles generally last 14-30 days",
      ],
    },
    combos: ["Selank", "Pinealon"],
  },
  kpv: {
    overview:
      "KPV is a naturally occurring tripeptide (Lys-Pro-Val) that forms the C-terminal of alpha-MSH. It possesses incredibly potent anti-inflammatory properties, particularly in gastrointestinal and dermatological research.",
    dosage: {
      phases: [{ phase: "Systemic Protocol", dose: "200mcg to 500mcg daily" }],
      rules: [
        "Can be administered sub-q, orally, or topically depending on the research site",
        "Excellent synergistic effects when combined with BPC-157 for gut repair",
        "No known cycle duration limits",
      ],
    },
    combos: ["BPC-157", "TB-500", "GHK-Cu"],
  },
  pinealon: {
    overview:
      "Pinealon is a short, synthetic peptide composed of three amino acids. It interacts directly with DNA to protect brain cells from hypoxia, aging, and oxidative stress, improving cognitive function and memory.",
    dosage: {
      phases: [{ phase: "Standard Protocol", dose: "1mg to 2mg daily" }],
      rules: [
        "Typically administered in short 10 to 20-day cycles",
        "Administer in the morning",
        "Highly effective for central nervous system restoration",
      ],
    },
    combos: ["Semax", "Selank", "Epitalon"],
  },
  "oxytocin-acetate": {
    overview:
      "Oxytocin is a naturally occurring neuro-peptide commonly known as the 'bonding hormone'. In research, it is studied for its role in social bonding, anxiety reduction, and libido enhancement.",
    dosage: {
      phases: [{ phase: "Standard Protocol", dose: "10IU to 20IU as needed" }],
      rules: [
        "Often administered intranasally for rapid psychological effects",
        "Can be administered sub-q for systemic research",
        "Short half-life; effects are transient",
      ],
    },
    combos: ["PT-141", "Selank"],
  },
  "kisspeptin-10": {
    overview:
      "Kisspeptin-10 is a vital neuropeptide responsible for triggering the release of Gonadotropin-Releasing Hormone (GnRH). It is heavily researched for restoring natural testosterone production and fertility pathways.",
    dosage: {
      phases: [
        {
          phase: "Standard Protocol",
          dose: "100mcg to 200mcg 1-3 times per week",
        },
      ],
      rules: [
        "Highly potent stimulator of the HPTA axis",
        "Requires careful cycling to prevent receptor desensitization",
        "Do not over-dilute; small injection volumes are preferred",
      ],
    },
    combos: ["HGH 191aa", "PT-141"],
  },
  "slu-pp-322": {
    overview:
      "SLU-PP-332 is a novel ERR (Estrogen Related Receptor) agonist. Research indicates it mimics the metabolic and cardiovascular effects of rigorous exercise, driving muscle adaptation and fat loss without physical activity.",
    dosage: {
      phases: [
        {
          phase: "Standard Protocol",
          dose: "Dosages vary widely in current literature (novel compound)",
        },
      ],
      rules: [
        "As a highly novel research chemical, observe all subjects closely",
        "Monitor cardiovascular metrics",
        "Synergistic with other mitochondrial up-regulators",
      ],
    },
    combos: ["MOTS-c", "SS-31", "Retatrutide"],
  },
  "glow-blend": {
    overview:
      "The Glow Blend is a targeted regenerative stack combining BPC-157, TB-500, and GHK-Cu. It is formulated to simultaneously upregulate systemic wound healing, reduce inflammation, and drastically improve collagen synthesis.",
    dosage: {
      phases: [
        {
          phase: "Standard Protocol",
          dose: "Varies based on vial concentration",
        },
      ],
      rules: [
        "Due to the high copper content, dilution with extra bacteriostatic water is recommended",
        "Can cause transient site irritation (pip)",
        "Cycle for 4 to 6 weeks",
      ],
    },
    combos: ["Epitalon", "HGH 191aa"],
  },
  "klow-blend": {
    overview:
      "The Klow Blend is the ultimate systemic recovery and anti-inflammatory formulation. It integrates BPC-157, TB-500, GHK-Cu, and KPV, creating a profound multi-pathway response for gut repair, joint recovery, and skin elasticity.",
    dosage: {
      phases: [
        {
          phase: "Standard Protocol",
          dose: "Varies based on vial concentration",
        },
      ],
      rules: [
        "Due to the GHK-Cu content, dilution with extra bacteriostatic water is recommended to prevent stinging",
        "Administer sub-q daily during acute healing phases",
        "Excellent for subjects with auto-immune or systemic inflammation models",
      ],
    },
    combos: ["HGH 191aa", "LL-37"],
  },
};

export default function Product() {
  const { slug } = useParams();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [errorMsg, setErrorMsg] = useState("");
  const [relatedProducts, setRelatedProducts] = useState([]);

  useEffect(() => {
    async function fetchProduct() {
      if (!slug || slug === "undefined") {
        setErrorMsg("Invalid Product URL");
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from("products")
        .select(`*, variants (*)`)
        .eq("slug", slug)
        .single();

      if (error) {
        setErrorMsg(error.message);
      }

      if (data) {
        const visibleVariants = (data.variants || []).filter(
          (v) => v.is_hidden !== true && v.is_hidden !== "true",
        );

        if (visibleVariants.length === 0) {
          setErrorMsg("This product is currently unavailable.");
          setProduct(null);
        } else {
          const productWithVisibleVariants = {
            ...data,
            variants: visibleVariants,
          };
          setProduct(productWithVisibleVariants);

          const sorted = [...visibleVariants].sort((a, b) => {
            if (a.is_default && !b.is_default) return -1;
            if (!a.is_default && b.is_default) return 1;
            return (a.price || 0) - (b.price || 0);
          });

          const defaultVariant = sorted.find((v) => v.is_default === true);
          setSelectedVariant(defaultVariant || sorted[0]);
        }
      }
      setLoading(false);
    }
    fetchProduct();
  }, [slug]);

  useEffect(() => {
    async function fetchRelatedProducts() {
      if (!product?.slug) return;
      const relatedSlugs = getRelatedProductSlugsForProduct(product.slug);
      if (!relatedSlugs.length) return;

      const { data, error } = await supabase
        .from("products")
        .select("*, variants (*)")
        .in("slug", relatedSlugs);

      if (!error && data) {
        const ordered = relatedSlugs
          .map((relatedSlug) => data.find((item) => item.slug === relatedSlug))
          .filter(Boolean)
          .map((item) => {
            const visibleVariants = (item.variants || []).filter(
              (v) => v.is_hidden !== true && v.is_hidden !== "true",
            );
            const sortedVariants = [...visibleVariants].sort((a, b) => {
              if (a.is_default && !b.is_default) return -1;
              if (!a.is_default && b.is_default) return 1;
              return (a.price || 0) - (b.price || 0);
            });
            return {
              ...item,
              variants: visibleVariants,
              defaultVariant:
                sortedVariants.find((v) => v.is_default) ||
                sortedVariants[0] ||
                null,
            };
          })
          .filter((item) => item.slug !== product.slug && item.defaultVariant);
        setRelatedProducts(ordered.slice(0, 6));
      }
    }
    fetchRelatedProducts();
  }, [product]);

  const handleAddToCart = () => {
    if (!product || !selectedVariant) return;
    addToCart(
      {
        ...product,
        id: product.id,
        price: selectedVariant.price,
        image: selectedVariant.image_url || product.image_url,
        variantId: selectedVariant.id,
      },
      quantity,
      selectedVariant.size_label,
    );
  };

  const handleAddSuggestedProduct = (suggestedProduct) => {
    if (!suggestedProduct?.defaultVariant) return;
    addToCart(
      {
        ...suggestedProduct,
        id: suggestedProduct.id,
        price: suggestedProduct.defaultVariant.price,
        image:
          suggestedProduct.defaultVariant.image_url ||
          suggestedProduct.image_url,
        variantId: suggestedProduct.defaultVariant.id,
      },
      1,
      suggestedProduct.defaultVariant.size_label,
    );
  };

  const formatPrice = (amount) => {
    return new Intl.NumberFormat("en-AU", {
      style: "currency",
      currency: "AUD",
    }).format(amount);
  };

  if (loading) {
    return (
      <div
        className="container"
        style={{ padding: "80px", textAlign: "center" }}
      >
        Loading Data...
      </div>
    );
  }

  if (!product) {
    return (
      <div
        className="container"
        style={{ padding: "80px", textAlign: "center" }}
      >
        <h2>Product Not Found</h2>
        <p style={{ color: "red" }}>{errorMsg}</p>
        <Link
          to="/shop"
          className="back-link"
          style={{ justifyContent: "center" }}
        >
          Return to Shop
        </Link>
      </div>
    );
  }

  const absoluteUrl = `https://melbournepeptides.com.au/product/${slug}`;
  const displayImage =
    selectedVariant?.image_url ||
    product.image_url ||
    "https://via.placeholder.com/600";
  const isMainProductInStock = product.in_stock !== false;
  const isSelectedVariantInStock = selectedVariant?.in_stock !== false;
  const isPreorder = selectedVariant?.is_preorder === true;
  const isCurrentlyPurchasable =
    isMainProductInStock && (isSelectedVariantInStock || isPreorder);

  // --- THE COA VARIABLE WAS STILL HERE ---
  const activeLabUrl =
    selectedVariant?.lab_result_url || product.lab_result_url;

  const isAccessory =
    product.category === "Accessories" ||
    product.category === "Syringes" ||
    product.category === "Prep Pads";
  const seoCanonicalUrl = isAccessory
    ? absoluteUrl
    : `https://melbournepeptides.com.au/${slug}`;

  // Retrieve Profile if available
  const profile =
    PEPTIDE_PROFILES[slug] ||
    PEPTIDE_PROFILES[product.name.toLowerCase().replace(/\s+/g, "-")];

  const metaDescription = product.description
    ? `${product.description.substring(0, 140)}. Buy ${product.name} research peptide in Australia with fast shipping.`
    : `Buy ${product.name} research peptide in Australia.`;

  return (
    <div className="container product-page">
      <SEO
        title={`Buy ${product.name} Australia`}
        description={metaDescription}
        image={displayImage}
        type="product"
        url={seoCanonicalUrl}
        noindex={!isAccessory}
      />

      <Link to="/shop" className="back-link">
        <ChevronLeft size={16} /> Back to Catalog
      </Link>

      <div className="product-layout">
        <div className="product-gallery">
          <div
            className="main-image-frame"
            style={{
              background:
                "radial-gradient(circle at center, #ffffff 50%, #f1f5f9 100%)",
              borderRadius: "16px",
              padding: "40px",
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            <img
              src={displayImage}
              alt={`${product.name} research peptide vial`}
              loading="lazy"
              decoding="async"
              style={{
                maxWidth: "100%",
                maxHeight: "400px",
                objectFit: "contain",
                filter: "drop-shadow(0 15px 25px rgba(0,0,0,0.15))",
              }}
            />
          </div>
        </div>

        <div className="product-info">
          <h1
            className="p-title"
            style={{
              fontSize: "2.5rem",
              color: "#0f172a",
              marginBottom: "10px",
            }}
          >
            {product.name}
          </h1>

          <div
            className="p-meta"
            style={{ display: "flex", gap: "15px", marginBottom: "20px" }}
          >
            <span
              className="p-badge"
              style={{
                background: "#0d9488",
                color: "white",
                padding: "4px 10px",
                borderRadius: "4px",
                fontSize: "0.8rem",
                fontWeight: "bold",
              }}
            >
              {product.category || "Product"}
            </span>

            {!isAccessory && (
              <>
                <span
                  className="p-cas"
                  style={{
                    background: "#f1f5f9",
                    padding: "4px 10px",
                    borderRadius: "4px",
                    fontSize: "0.8rem",
                    color: "#64748b",
                  }}
                >
                  CAS: {product.cas_number || "Verified"}
                </span>
                <span
                  className="p-purity"
                  style={{
                    background: "#f1f5f9",
                    padding: "4px 10px",
                    borderRadius: "4px",
                    fontSize: "0.8rem",
                    color: "#64748b",
                  }}
                >
                  Purity: &gt;99% (HPLC)
                </span>
              </>
            )}
          </div>

          <div className="p-price-box" style={{ marginBottom: "25px" }}>
            <span
              style={{
                display: "block",
                fontSize: "0.9rem",
                color: "#64748b",
                marginBottom: "4px",
                fontWeight: "600",
              }}
            >
              Price
            </span>
            <span
              className="p-price"
              style={{ fontSize: "2rem", fontWeight: "bold", color: "#4635de" }}
            >
              {selectedVariant
                ? formatPrice(selectedVariant.price)
                : "Unavailable"}
            </span>
          </div>

          <div className="p-variants" style={{ marginBottom: "25px" }}>
            <label
              style={{
                display: "block",
                marginBottom: "10px",
                fontWeight: "600",
                color: "#334155",
              }}
            >
              Select Size:
            </label>
            <div
              className="variant-grid"
              style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}
            >
              {[...(product.variants || [])]
                .sort((a, b) => {
                  if (a.is_default && !b.is_default) return -1;
                  if (!a.is_default && b.is_default) return 1;
                  return (a.price || 0) - (b.price || 0);
                })
                .map((v) => {
                  const isThisVariantInStock = v.in_stock !== false;
                  const isThisVariantPreorder = v.is_preorder === true;

                  return (
                    <button
                      key={v.id}
                      onClick={() => setSelectedVariant(v)}
                      style={{
                        padding: "12px 20px",
                        borderRadius: "8px",
                        border:
                          selectedVariant?.id === v.id
                            ? "2px solid #0f172a"
                            : "1px solid #cbd5e1",
                        background:
                          selectedVariant?.id === v.id ? "#0f172a" : "white",
                        color:
                          selectedVariant?.id === v.id ? "white" : "#64748b",
                        fontWeight: "600",
                        cursor: "pointer",
                        minWidth: "80px",
                        opacity:
                          isThisVariantInStock || isThisVariantPreorder
                            ? 1
                            : 0.5,
                      }}
                    >
                      {v.size_label}
                      {isThisVariantPreorder
                        ? " (Preorder)"
                        : !isThisVariantInStock && " (Out of Stock)"}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* --- RESTORED COA BUTTON INJECTION --- */}
          {activeLabUrl && !isAccessory && (
            <div style={{ marginBottom: "25px" }}>
              <a
                href={activeLabUrl}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "0.9rem",
                  fontWeight: "700",
                  color: "#0f172a",
                  background: "#f8fafc",
                  padding: "8px 16px",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  textDecoration: "none",
                  transition: "background 0.2s",
                }}
              >
                <FileText size={16} color="#4635de" />
                View Certificate of Analysis (COA)
                <ExternalLink size={14} color="#64748b" />
              </a>
            </div>
          )}

          <div style={{ display: "flex", gap: "15px", marginBottom: "30px" }}>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                background: "#f1f5f9",
                borderRadius: "10px",
                padding: "0 10px",
                opacity: isCurrentlyPurchasable ? 1 : 0.5,
                pointerEvents: isCurrentlyPurchasable ? "auto" : "none",
              }}
            >
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "10px",
                }}
              >
                <Minus size={16} />
              </button>
              <span
                style={{
                  fontWeight: "700",
                  minWidth: "20px",
                  textAlign: "center",
                }}
              >
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "10px",
                }}
              >
                <Plus size={16} />
              </button>
            </div>

            <button
              className="p-add-btn"
              onClick={handleAddToCart}
              disabled={!selectedVariant || !isCurrentlyPurchasable}
              style={{
                flex: 1,
                padding: "18px",
                backgroundColor: isCurrentlyPurchasable ? "#4635de" : "#94a3b8",
                color: "white",
                border: "none",
                borderRadius: "10px",
                fontSize: "1.1rem",
                fontWeight: "bold",
                cursor: isCurrentlyPurchasable ? "pointer" : "not-allowed",
                boxShadow: isCurrentlyPurchasable
                  ? "0 4px 10px rgba(70, 53, 222, 0.2)"
                  : "none",
              }}
            >
              {!isMainProductInStock
                ? "Product Out of Stock"
                : !selectedVariant
                  ? "Select a Variant"
                  : isPreorder
                    ? `Pre-order - ${formatPrice(selectedVariant.price * quantity)}`
                    : !isSelectedVariantInStock
                      ? `${selectedVariant.size_label} is Out of Stock`
                      : `Add to Cart - ${formatPrice(selectedVariant.price * quantity)}`}
            </button>
          </div>

          {/* --- NEW: STRUCTURED RESEARCH PROFILE OR FALLBACK --- */}
          {!isAccessory && (
            <div
              className="p-profile-section"
              style={{ display: "flex", flexDirection: "column", gap: "24px" }}
            >
              {/* Overview */}
              <div>
                <h3
                  style={{
                    fontSize: "1.1rem",
                    color: "#0f172a",
                    marginBottom: "8px",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <FileText size={18} color="#4635de" /> Overview
                </h3>
                <p
                  style={{
                    color: "#475569",
                    lineHeight: "1.6",
                    fontSize: "0.95rem",
                    margin: 0,
                  }}
                >
                  {profile ? profile.overview : product.description}
                </p>
              </div>

              {/* Dosage Protocol (Only if profile exists) */}
              {profile && profile.dosage && (
                <div
                  style={{
                    background: "#f8fafc",
                    border: "1px solid #e2e8f0",
                    borderRadius: "12px",
                    overflow: "hidden",
                  }}
                >
                  <div style={{ background: "#e2e8f0", padding: "12px 16px" }}>
                    <h3
                      style={{
                        fontSize: "1rem",
                        color: "#0f172a",
                        margin: 0,
                        display: "flex",
                        alignItems: "center",
                        gap: "8px",
                      }}
                    >
                      <AlertTriangle size={16} color="#0f172a" /> Dosage
                      Protocol (Research Only)
                    </h3>
                  </div>
                  <div style={{ padding: "16px" }}>
                    {profile.dosage.phases.map((phase, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          paddingBottom: "12px",
                          marginBottom: "12px",
                          borderBottom:
                            idx !== profile.dosage.phases.length - 1
                              ? "1px dashed #cbd5e1"
                              : "none",
                        }}
                      >
                        <span style={{ fontWeight: "700", color: "#334155" }}>
                          {phase.phase}
                        </span>
                        <span
                          style={{
                            color: "#4635de",
                            fontWeight: "600",
                            textAlign: "right",
                          }}
                        >
                          {phase.dose}
                        </span>
                      </div>
                    ))}
                    <div
                      style={{
                        marginTop: "16px",
                        paddingTop: "16px",
                        borderTop: "2px solid #e2e8f0",
                      }}
                    >
                      <h4
                        style={{
                          fontSize: "0.9rem",
                          color: "#0f172a",
                          marginBottom: "10px",
                        }}
                      >
                        Protocol Rules
                      </h4>
                      {profile.dosage.rules.map((rule, idx) => (
                        <div
                          key={idx}
                          style={{
                            display: "flex",
                            alignItems: "flex-start",
                            gap: "8px",
                            marginBottom: "6px",
                          }}
                        >
                          <CheckCircle2
                            size={14}
                            color="#10b981"
                            style={{ marginTop: "3px", flexShrink: 0 }}
                          />
                          <span
                            style={{ fontSize: "0.9rem", color: "#475569" }}
                          >
                            {rule}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Reconstitution */}
              <div
                style={{
                  background: "#f0fdf4",
                  border: "1px solid #bbf7d0",
                  borderRadius: "12px",
                  padding: "16px",
                }}
              >
                <h3
                  style={{
                    fontSize: "1rem",
                    color: "#166534",
                    margin: "0 0 10px 0",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                >
                  <Beaker size={18} /> Reconstitution
                </h3>
                <p
                  style={{
                    color: "#15803d",
                    fontSize: "0.9rem",
                    lineHeight: "1.5",
                    margin: "0 0 12px 0",
                  }}
                >
                  Reconstitute using bacteriostatic water. The amount of water
                  added will depend on your target dosage and study
                  requirements.
                </p>
                <Link
                  to={`/peptide-calculator/${slug}`}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px",
                    background: "#16a34a",
                    color: "white",
                    padding: "8px 16px",
                    borderRadius: "8px",
                    fontSize: "0.9rem",
                    fontWeight: "600",
                    textDecoration: "none",
                  }}
                >
                  <Calculator size={16} /> Open Peptide Calculator
                </Link>
              </div>

              {/* Combos */}
              {profile && profile.combos && (
                <div>
                  <h3
                    style={{
                      fontSize: "1rem",
                      color: "#0f172a",
                      marginBottom: "12px",
                    }}
                  >
                    Common Research Combinations
                  </h3>
                  <div
                    style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}
                  >
                    {profile.combos.map((combo, idx) => (
                      <Link
                        key={idx}
                        to={`/product/${combo.toLowerCase().replace(/\s+/g, "-")}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          background: "#f1f5f9",
                          color: "#334155",
                          padding: "6px 12px",
                          borderRadius: "20px",
                          fontSize: "0.85rem",
                          fontWeight: "600",
                          textDecoration: "none",
                          border: "1px solid #cbd5e1",
                        }}
                      >
                        {combo} <ArrowRight size={12} />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Trust Badges */}
          <div
            className="p-trust"
            style={{
              marginTop: "40px",
              display: "flex",
              gap: "20px",
              padding: "20px",
              background: "#f8fafc",
              borderRadius: "12px",
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "0.9rem",
                color: "#475569",
              }}
            >
              <ShieldCheck size={20} color="#0d9488" />
              <span>Verified Quality</span>
            </div>
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                fontSize: "0.9rem",
                color: "#475569",
              }}
            >
              <Truck size={20} color="#0d9488" />
              <span>Same-day Shipping</span>
            </div>
            {!isAccessory && (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "0.9rem",
                  color: "#b91c1c",
                }}
              >
                <AlertTriangle size={20} color="#b91c1c" />
                <span>Research Only</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* RELATED PRODUCTS */}
      {relatedProducts.length > 0 && (
        <div style={{ marginTop: "60px" }}>
          <h3
            style={{
              margin: "0 0 24px 0",
              color: "#0f172a",
              fontSize: "1.5rem",
              fontWeight: "800",
            }}
          >
            Frequently Researched Together
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
              gap: "20px",
            }}
          >
            {relatedProducts.map((related) => (
              <div
                key={related.id}
                style={{
                  background: "white",
                  border: "1px solid #e2e8f0",
                  borderRadius: "12px",
                  padding: "16px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "12px",
                }}
              >
                <Link
                  to={`/product/${related.slug}`}
                  style={{ textDecoration: "none", color: "inherit" }}
                >
                  <div
                    style={{
                      background:
                        "radial-gradient(circle at center, #ffffff 50%, #f1f5f9 100%)",
                      borderRadius: "10px",
                      padding: "14px",
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      minHeight: "140px",
                    }}
                  >
                    <img
                      src={
                        related.defaultVariant?.image_url ||
                        related.image_url ||
                        "https://via.placeholder.com/300"
                      }
                      alt={related.name}
                      loading="lazy"
                      style={{
                        maxWidth: "100%",
                        maxHeight: "110px",
                        objectFit: "contain",
                      }}
                    />
                  </div>
                </Link>
                <div>
                  <Link
                    to={`/product/${related.slug}`}
                    style={{
                      color: "#0f172a",
                      textDecoration: "none",
                      fontWeight: "700",
                      lineHeight: "1.4",
                    }}
                  >
                    {related.name}
                  </Link>
                  <p
                    style={{
                      margin: "6px 0 0 0",
                      color: "#64748b",
                      fontSize: "0.9rem",
                    }}
                  >
                    {related.defaultVariant?.size_label} ·{" "}
                    {formatPrice(related.defaultVariant?.price || 0)}
                  </p>
                </div>
                <button
                  onClick={() => handleAddSuggestedProduct(related)}
                  style={{
                    border: "none",
                    background: "#4635de",
                    color: "white",
                    borderRadius: "10px",
                    padding: "12px",
                    fontWeight: "700",
                    cursor: "pointer",
                    marginTop: "auto",
                  }}
                >
                  Add to Cart
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
