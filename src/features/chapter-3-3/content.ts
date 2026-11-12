/**
 * Chapter 3.3 — Revenue Streams, Cost Structure & Profitability.
 * SOURCE OF TRUTH: docs/module-3-content.md. Hedges are kept exactly: the cost structure is typical for a food
 * D2C brand (Eat Better has not published its own breakdown) and the FY figures are rounded ("about", "around").
 */

export const CHAPTER = {
  module: "Module 3 · Business Model Canvas",
  number: "3.3",
  title: ["Revenue, Costs", "& Profit"] as [string, string],
  subtitle: "Revenue Streams, Cost Structure & Profitability — how the money comes in, where it goes, and what one order earns.",
  objective: "Analyse how sales, categories and channels generate revenue, the major cost drivers, and the basics of unit economics.",
};

const L = "/brand/library";

export const STREAMS = [
  { id: "web", title: "Direct sales on the website", note: "Customers buy straight from the brand.", img: `${L}/site/home-banner-better-snacks-bigger-smiles.webp`, ratio: 1100 / 351 },
  { id: "market", title: "Sales through marketplaces and quick commerce", note: "Customers buy on someone else’s platform, which keeps a share.", img: null, ratio: 0 },
  { id: "corp", title: "Corporate gifting and bulk orders", note: "Companies buy many boxes at once.", img: `${L}/site/corporate-gifting-banner-gift-better.webp`, ratio: 1100 / 458 },
] as const;

export const CATEGORIES = [
  { id: "sweets", name: "Sweets and laddoos", img: `${L}/laddoos/vanilla-chocolate-laddoos-front.webp`, alt: "Vanilla Chocolate Laddoos pack" },
  { id: "namkeen", name: "Namkeens", img: `${L}/namkeen/millet-bhel-kolkata-jhalmuri-front.webp`, alt: "Millet Bhel Kolkata Jhalmuri pack" },
  { id: "nuts", name: "Nuts and mixes", img: `${L}/nuts-seeds/better-trail-mix-front.webp`, alt: "Better Trail Mix pack" },
  { id: "combos", name: "Combos and hampers", img: `${L}/combos/assorted-laddoo-box-24-hero.webp`, alt: "Assorted Laddoo Box" },
] as const;

export const COSTS = [
  { id: "ingredients", name: "Ingredients and production", img: `${L}/laddoos/coffee-almond-laddoos-ingredients.webp`, alt: "Ingredients grid of Coffee Almond Laddoos" },
  { id: "packaging", name: "Packaging", img: `${L}/hampers/diwali-ujjwal-open.webp`, alt: "An opened Diwali gift hamper box" },
  { id: "logistics", name: "Logistics and delivery", img: `${L}/combos/ultimate-snack-box-contents.webp`, alt: "Ultimate Snack Box contents packed for shipping" },
  { id: "marketing", name: "Marketing and platform commissions", img: `${L}/chips-puffs/ragi-chips-achari-masti-creative.webp`, alt: "Ragi Chips advertising creative" },
  { id: "team", name: "Team, kitchen and operating costs", img: `${L}/site/kitchen-prepping-dates.webp`, alt: "The Eat Better kitchen preparing dates" },
] as const;

export const COST_NOTE = "Typical for a food D2C brand; Eat Better has not published its own breakdown.";

export const PROFIT = {
  fy23: 5.5,
  fy24: 14.7,
  growth: "around 165%",
  loss: "about Rs 63 lakh",
  text: "Reported FY24 revenue was about Rs 14.7 crore, up around 165% from about Rs 5.5 crore in FY23. The business reported a net loss of about Rs 63 lakh for FY24, which is common for a fast-growing brand that invests in growth.",
  unit: "Unit economics means looking at what one order earns after the cost of making and delivering it.",
};

export const TAKEAWAY = "Growth and profit are different things. A brand can grow fast and still be working towards profitability.";

export const THINK = {
  q1: "Why might a quick-commerce sale earn less per pack than a website sale?",
  q2: "List three ways a brand could improve profitability without raising prices.",
};
