/**
 * Chapter 4.2 — Competitive Landscape.
 * SOURCE OF TRUTH: chapter content supplied by SkilliZee, saved verbatim in docs/module-4-content.md.
 * The comparison tables are the chapter's own statements; the page presents them as "how this chapter compares them".
 * The source supplies no objective or takeaway: the objective below is a neutral description of what the chapter covers,
 * and the closing idea is the chapter's own "Eat Better's edge" column.
 * Practice numbers used by the activities are made up and labelled in the UI.
 */

export const CHAPTER = {
  module: "Module 4 · Pricing, Competition & Growth",
  number: "4.2",
  title: ["Competitive", "Landscape"] as [string, string],
  subtitle: "Who else sells snacks to the same people, what each one is good at, and where Eat Better stands among them.",
  objective:
    "Compare Eat Better with the other kinds of snack sellers on product, ingredients, price per gram and promise, read a competitive K-Matrix, and see how this chapter places Eat Better against six named health-snack brands.",
};

/* ── 1 · Market comparison (four kinds of seller) ─────────────── */

export type PlayerId = "eb" | "trad" | "health" | "local";
export type MarketRow = { id: PlayerId; name: string; kind: string; focus: string; ingredients: string; tier: string; range: [number, number]; rangeText: string; promise: string };

export const MARKET: MarketRow[] = [
  {
    id: "eb",
    name: "Eat Better Co",
    kind: "D2C / Modern",
    focus: "Date-sweetened Laddoos, Roasted Namkeens, Seed Mixes",
    ingredients: "Dates, almonds, millets, quinoa; roasted, zero palm oil",
    tier: "Premium",
    range: [0.67, 1.55],
    rangeText: "~₹0.67 to ₹1.55/g",
    promise: "“The joy of snacking, made better.” Clean-label, zero refined sugar/palm oil, lab-tested.",
  },
  {
    id: "trad",
    name: "Traditional Brands",
    kind: "Haldiram's, Bikaji",
    focus: "Traditional Bhujia, Sev, Fried Mithai",
    ingredients: "Refined flour, potatoes, dal; deep-fried in palm/vegetable oil, refined sugar",
    tier: "Mass-Market",
    range: [0.15, 0.35],
    rangeText: "~₹0.15 to ₹0.35/g",
    promise: "Authentic heritage taste, wide offline distribution, high affordability.",
  },
  {
    id: "health",
    name: "Direct Health Competitors",
    kind: "Farmley, True Elements",
    focus: "Flavored Dry Fruits, Seed Mixes, Roasted Snacks",
    ingredients: "Nuts, seeds, oats, millets; dry-roasted or light seasoning",
    tier: "Premium",
    range: [0.8, 1.8],
    rangeText: "~₹0.80 to ₹1.80/g",
    promise: "Whole-food nutrition, high protein, clean-label dry fruit innovation.",
  },
  {
    id: "local",
    name: "Local Sweet Shops",
    kind: "Mithai Outlets",
    focus: "Traditional Laddoos, Barfis, Halwa",
    ingredients: "Milk solids (khoya), refined sugar, ghee, refined flour",
    tier: "Mid-to-High",
    range: [0.5, 1.2],
    rangeText: "~₹0.50 to ₹1.20/g",
    promise: "Freshly made local traditional sweets for daily consumption and festive occasions.",
  },
];

/* ── 2 · Competitive K-Matrix (feature competency mapping) ────── */

export const KMATRIX_INTRO =
  "The K-Matrix maps market players across primary customer-choice parameters to highlight product differentiation and capability gaps in the competitive landscape:";

/** Column names exactly as the K-Matrix table gives them. */
export const K_PLAYERS: { id: PlayerId; name: string; short: string }[] = [
  { id: "eb", name: "Eat Better Co", short: "Eat Better" },
  { id: "trad", name: "Traditional Snack Brands", short: "Traditional" },
  { id: "health", name: "Gourmet Health Competitors", short: "Gourmet health" },
  { id: "local", name: "Local Sweet Outlets", short: "Local sweets" },
];

export type Level = "High" | "Medium" | "Low";
export const LEVEL_SCORE: Record<Level, number> = { High: 3, Medium: 2, Low: 1 };

export type ParamId = "clean" | "flavour" | "qcom" | "sweet" | "pack" | "price";
export const KMATRIX: { id: ParamId; param: string; short: string; plain: string; v: Record<PlayerId, Level> }[] = [
  { id: "clean", param: "Clean Label (No Palm Oil / Refined Sugar)", short: "Clean label", plain: "Free of palm oil and refined sugar.", v: { eb: "High", trad: "Low", health: "High", local: "Low" } },
  { id: "flavour", param: "Familiar Indian Flavor Profile", short: "Familiar Indian flavour", plain: "Tastes like the snacks and sweets people grew up with.", v: { eb: "High", trad: "High", health: "Medium", local: "High" } },
  { id: "qcom", param: "Quick Commerce Availability (<15 mins)", short: "Quick commerce (<15 min)", plain: "Can be ordered on a delivery app and arrive in under 15 minutes.", v: { eb: "High", trad: "High", health: "High", local: "Low" } },
  { id: "sweet", param: "Natural Sweetening Innovation (Dates/Dry Fruits)", short: "Natural sweetening", plain: "Sweetened with dates or dry fruits instead of refined sugar.", v: { eb: "High", trad: "Low", health: "Medium", local: "Low" } },
  { id: "pack", param: "Scalable Institutional Packaging & Shelf-Life", short: "Packaging & shelf-life", plain: "Packed so it lasts and can be shipped in bulk.", v: { eb: "High", trad: "High", health: "High", local: "Low" } },
  { id: "price", param: "Mass-Market Price Accessibility", short: "Mass-market price", plain: "Cheap enough for most families to buy every day.", v: { eb: "Medium", trad: "High", health: "Medium", local: "High" } },
];

/* ── 3 · Brand comparison (six named brands) ─────────────────── */

export type BrandId = "eb" | "yoga" | "true" | "nourish" | "lo" | "evolve";
export const BRAND_ROWS = [
  { key: "hq", label: "HQ / Founded" },
  { key: "category", label: "Core category" },
  { key: "positioning", label: "Positioning" },
  { key: "usp", label: "Key USP" },
  { key: "price", label: "Price feel" },
  { key: "channels", label: "Main channels" },
  { key: "edge", label: "Eat Better’s edge" },
] as const;
export type BrandRowKey = (typeof BRAND_ROWS)[number]["key"];

export const BRANDS: { id: BrandId; name: string; rows: Record<BrandRowKey, string>; channels: string[]; priceFeel: 1 | 2 | 3 }[] = [
  {
    id: "eb",
    name: "Eat Better Co",
    rows: {
      hq: "Jaipur, 2020",
      category: "Dry-fruit laddoos, millet namkeen, nut mixes, gift boxes",
      positioning: "Homemade-style Indian snacks, “better-for-you”",
      usp: "No added sugar, no palm oil, roasted not fried, familiar Indian taste",
      price: "Premium, but small trial packs (₹22 to ₹89)",
      channels: "D2C website, quick-commerce, corporate gifting",
      edge: "Traditional Indian formats (laddoo, namkeen, bhel), family-friendly",
    },
    channels: ["D2C website", "Quick-commerce", "Corporate gifting"],
    priceFeel: 3,
  },
  {
    id: "yoga",
    name: "Yoga Bar",
    rows: { hq: "Mumbai", category: "Bars, muesli, oats", positioning: "Fitness and breakfast nutrition", usp: "Protein and fibre focus", price: "Mid to premium", channels: "Online, modern retail", edge: "Eat Better is stronger in festive and gifting" },
    channels: ["Online", "Modern retail"],
    priceFeel: 2,
  },
  {
    id: "true",
    name: "True Elements",
    rows: { hq: "Pune, 2013", category: "Cereals, seeds, snacks, supplements", positioning: "Wide health-food range", usp: "Range and trust of a long-running brand", price: "Mid to premium", channels: "Online, retail", edge: "Eat Better is more indulgent and “desi”" },
    channels: ["Online", "Retail"],
    priceFeel: 2,
  },
  {
    id: "nourish",
    name: "Nourish You",
    rows: { hq: "Hyderabad, 2014", category: "Seeds, superfoods, plant-based snacks", positioning: "Plant-based and seed-focused", usp: "Superseeds and clean-label", price: "Mid to premium", channels: "Mostly online", edge: "Eat Better has a wider taste appeal" },
    channels: ["Mostly online"],
    priceFeel: 2,
  },
  {
    id: "lo",
    name: "Lo! Foods",
    rows: { hq: "Mumbai", category: "Low-carb / keto-style foods", positioning: "Diet-specific (low carb)", usp: "Low-carb alternatives", price: "Premium", channels: "Online", edge: "Eat Better serves the mass family market" },
    channels: ["Online"],
    priceFeel: 3,
  },
  {
    id: "evolve",
    name: "Evolve Snacks",
    rows: { hq: "Delhi, 2015", category: "Gluten-free, vegan, high-protein snacks", positioning: "Diet-specific (weight-loss, protein)", usp: "Dietary-preference variety", price: "Mid", channels: "Online", edge: "Eat Better has a stronger story and brand" },
    channels: ["Online"],
    priceFeel: 1,
  },
];

/** The closing idea: the chapter's own "Eat Better's edge" for Eat Better's column. */
export const EDGE_LINE = "Eat Better’s edge: traditional Indian formats (laddoo, namkeen, bhel), family-friendly.";

/* ── 4.1's four SKUs (used by the Price Ladder, from Chapter 4.1's pricing table) ── */
export const SKUS = [
  { id: "l24", name: "Assorted Laddoo Box (24 Laddoos)", short: "Laddoo Box 24", grams: 240, price: 349, perGram: 1.45, img: "/brand/library/combos/assorted-laddoo-box-24-hero.webp" },
  { id: "l42", name: "Assorted Laddoo Box (42 Laddoos)", short: "Laddoo Box 42", grams: 420, price: 649, perGram: 1.55, img: "/brand/library/combos/assorted-laddoo-box-42-hero.webp" },
  { id: "usb", name: "Ultimate Snack Box (12 Packs)", short: "Ultimate Snack Box", grams: 660, price: 749, perGram: 1.13, img: "/brand/library/combos/ultimate-snack-box-hero.webp" },
  { id: "nmk", name: "Assorted Namkeen Combo (4 Packs)", short: "Namkeen Combo", grams: 400, price: 269, perGram: 0.67, img: "/brand/library/namkeen/assorted-namkeen-combo-of-4-hero.webp" },
] as const;
