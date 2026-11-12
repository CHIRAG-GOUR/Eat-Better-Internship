/**
 * Chapter 4.1 — Pricing & Financial Performance.
 * SOURCE OF TRUTH: docs/module-4-content.md (supplied by the user, 2026-11-12). Facts keep their hedges ("~", "reported").
 */
export const CHAPTER = {
  module: "Module 4 · Pricing, Competition & Growth",
  number: "4.1",
  title: ["Pricing &", "Financial Performance"] as [string, string],
  subtitle: "What a gram of Eat Better costs, why it costs that, and what the reported numbers say about growth.",
  objective:
    "To analyze how D2C food brands structure product pricing, evaluate gross margins and Average Order Value (AOV), and interpret financial performance through reported revenue expansion and profit/loss trends.",
};

export const LIB = "/brand/library";

export type Sku = { id: string; name: string; short: string; grams: number; price: number; pg: number; img: string; alt: string; tex: string };

/** The four real SKUs from the source table. pg is the source's stated price per gram (~). */
export const SKUS: Sku[] = [
  { id: "l24", name: "Assorted Laddoo Box (24 Laddoos)", short: "Laddoo Box 24", grams: 240, price: 349, pg: 1.45, img: `${LIB}/combos/assorted-laddoo-box-24-open.webp`, alt: "An open Assorted Laddoo Box with six flavours of laddoo pouches", tex: `${LIB}/combos/assorted-laddoo-box-24-hero.webp` },
  { id: "l42", name: "Assorted Laddoo Box (42 Laddoos)", short: "Laddoo Box 42", grams: 420, price: 649, pg: 1.55, img: `${LIB}/combos/assorted-laddoo-box-42-open.webp`, alt: "An open Assorted Laddoo Box (42 laddoos)", tex: `${LIB}/combos/assorted-laddoo-box-42-hero.webp` },
  { id: "usb", name: "Ultimate Snack Box (12 Packs)", short: "Ultimate Snack Box", grams: 660, price: 749, pg: 1.13, img: `${LIB}/combos/ultimate-snack-box-open.webp`, alt: "An open Ultimate Snack Box packed with snack pouches", tex: `${LIB}/combos/ultimate-snack-box-hero.webp` },
  { id: "nam", name: "Assorted Namkeen Combo (4 Packs)", short: "Namkeen Combo", grams: 400, price: 269, pg: 0.67, img: `${LIB}/namkeen/assorted-namkeen-combo-of-4-bowls.webp`, alt: "Four Eat Better millet namkeen pouches with two bowls of namkeen", tex: `${LIB}/namkeen/assorted-namkeen-combo-of-4-hero.webp` },
];

export const DRIVERS = {
  bom: {
    title: "Raw material Bill of Materials (BOM)",
    text: "Premium ingredients like dates, almonds, cashews, quinoa, and seeds carry a substantially higher unit cost than refined flour (maida), potatoes, or palm oil used in conventional snacks.",
  },
  clean: {
    title: "Clean-label value proposition",
    text: "Eliminating artificial preservatives, bad fats, and refined sugars commands a value-based pricing premium from health-conscious consumers.",
  },
  multi: {
    title: "Volume & multi-pack discounting",
    text: "Larger combo boxes (e.g., Ultimate Snack Box at ₹1.13/g) reduce shipping and primary packaging overhead per unit, allowing brands to offer lower price-per-gram rates on bundled purchases.",
  },
};

export const FIN = {
  revenueCrore: 14.7,
  growthPct: 165,
  /** implied by ~14.7 cr and ~165% growth: 14.7 / 2.65, rounded */
  priorCrore: 5.5,
  netLossLakh: 63,
  ordersLakh: 2,
  text: "Eat Better Co's reported financial metrics illustrate the rapid top-line growth characteristic of high-velocity D2C and quick-commerce brands.",
  revenue: "Reported FY24 operating revenue reached ~₹14.7 crore, representing a ~165% year-on-year growth compared to FY23.",
  loss: "Net loss for FY24 stood at ~₹63 lakh, demonstrating operational leverage as top-line scale outpaces fixed administrative overheads.",
  orders: "Delivery volume expanded to approximately 2 lakh fulfilled orders per month across web, marketplace, and quick-commerce channels.",
};

export const SHARK_TANK_VIDEO = {
  id: "x09Y94ksOY0",
  title: "Eat Better Co के Product पर क्यों हुआ Sharks को Doubt? | Shark Tank India S4 | 100 Crore Valuation",
};

export const TAKEAWAY = "Pricing tells a story. A higher price per gram must be matched by a clearly better product, transparent ingredients, and a trustworthy brand experience.";
