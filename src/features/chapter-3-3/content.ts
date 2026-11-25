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


export const PROFIT = {
  fy22: 0.67,
  fy23: 5.33,
  fy24: 14.47,
  fy25: 23.9,
  growth: "about 171.5% in FY24, 63% in FY25",
  loss: "Rs 62.96 lakh",
  text: "Revenue grew from Rs 67 lakh in FY22 to Rs 5.33 crore in FY23, Rs 14.47 crore in FY24 and Rs 23.90 crore in FY25 (reported growth 63%): about 35 times in three years. In FY24 the business spent Rs 15.30 crore against Rs 14.47 crore of revenue, a net loss of Rs 62.96 lakh. That loss was about 46.6% smaller than the Rs 1.18 crore lost in FY23.",
  unit: "Unit economics means looking at what one order earns after the cost of making and delivering it.",
};

export const TAKEAWAY = "Growth and profit are different things. A brand can grow fast and still be working towards profitability.";

export const THINK = {
  q1: "Why might a quick-commerce sale earn less per pack than a website sale?",
  q2: "List three ways a brand could improve profitability without raising prices.",
};
