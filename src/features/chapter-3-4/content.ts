/**
 * Chapter 3.4 — Distribution Network & Logistics.
 * SOURCE OF TRUTH: chapter content supplied by SkilliZee, saved verbatim in docs/module-3-content.md.
 * Teaching text is kept as given. Practice numbers used by the activities are made up and labelled in the UI.
 */

export const CHAPTER = {
  module: "Module 3",
  number: "3.4",
  title: ["Distribution Network", "& Logistics"] as [string, string],
  subtitle: "Four ways a snack reaches you, and the work it takes to get it there fresh, fast and whole.",
  objective:
    "To analyze Eat Better Co’s omnichannel go-to-market (GTM) strategy, evaluating how direct-to-consumer (D2C) fulfillment, quick-commerce dark stores, multi-channel inventory management, and specialized packaging preserve snack quality and ensure delivery speed.",
};

/* 1 · Go-to-Market (GTM) channel architecture */
export const GTM_DEFINITION = "A Go-to-Market (GTM) strategy defines how a company delivers its value proposition to target customers through aligned distribution and sales channels. Eat Better Co utilizes a four-pillar distribution strategy:";

export const PILLARS = [
  {
    id: "d2c",
    n: 1,
    title: "Own Direct-to-Consumer (D2C) Website",
    short: "Own website",
    text: "Serves as the central brand platform offering pan-India shipping. It captures high-margin orders, customer first-party data, repeat subscription orders, and custom product bundling.",
    gives: ["High-margin orders", "First-party data", "Repeat subscriptions", "Custom bundling"],
  },
  {
    id: "marketplace",
    n: 2,
    title: "E-Commerce Marketplaces",
    short: "Marketplaces",
    text: "Platforms like Amazon and Flipkart expand market reach across Tier-1, Tier-2, and Tier-3 cities, leveraging established search intent and regional fulfillment centers.",
    gives: ["Tier-1, 2 and 3 cities", "Search intent", "Regional fulfilment centres"],
  },
  {
    id: "qcom",
    n: 3,
    title: "Quick Commerce (Q-Commerce)",
    short: "Quick commerce",
    text: "Integration with fast-delivery platforms like Blinkit, Zepto, and Swiggy Instamart. By stocking inventory across urban dark stores (micro-fulfillment hubs), products are delivered to consumers within 10 to 20 minutes. Q-commerce serves as a key driver for impulse snacking and rapid volume growth.",
    gives: ["Urban dark stores", "10 to 20 minutes", "Impulse snacking", "Rapid volume growth"],
  },
  {
    id: "b2b",
    n: 4,
    title: "Bulk & Corporate Channels",
    short: "Bulk & corporate",
    text: "Custom made-to-order gift hampers for corporate clients, festive orders, and institutional events, enabling high-volume unit sales with predictable demand lead times.",
    gives: ["Made-to-order hampers", "Festive & institutional orders", "High volume", "Predictable lead times"],
  },
] as const;
export type PillarId = (typeof PILLARS)[number]["id"];

/* 2 · Channel comparison matrix (verbatim) */
export const MATRIX = [
  { id: "d2c", channel: "Own Website (D2C)", model: "Central Warehouse / 3PL Logistics", speed: "2–5 Days (Pan-India)", objective: "Margin optimization, data collection & brand building", minutes: 3.5 * 24 * 60, speedKind: "days" as const },
  { id: "marketplace", channel: "Marketplaces (Amazon)", model: "Marketplace Fulfillment Centers", speed: "1–2 Days (Express)", objective: "National reach & marketplace search visibility", minutes: 1.5 * 24 * 60, speedKind: "days" as const },
  { id: "qcom", channel: "Quick Commerce", model: "Localized Dark Store Network", speed: "10–20 Minutes", objective: "Instant gratification & impulse snacking market capture", minutes: 15, speedKind: "minutes" as const },
  { id: "b2b", channel: "Corporate / B2B", model: "Direct Freight & Bulk Shipping", speed: "Scheduled / Campaign-based", objective: "High-volume unit sales & B2B social proof", minutes: 0, speedKind: "scheduled" as const },
] as const;

/* 3 · Operational & logistics challenges (verbatim) */
export const CHALLENGES = [
  {
    id: "fresh",
    n: 1,
    title: "Maintaining Freshness & Product Integrity",
    text: "Preserving the crunch, taste, and structural integrity of clean-label snacks (free of artificial preservatives) requires multi-layer protective packaging and temperature-managed handling during long-distance transit.",
    tags: ["Crunch", "Taste", "Structural integrity", "Multi-layer packaging", "Temperature-managed handling"],
  },
  {
    id: "sync",
    n: 2,
    title: "Omnichannel Inventory Synchronization",
    text: "Balancing stock allocation between central warehouses (for D2C/marketplaces) and hyper-local dark stores (for Q-commerce) to prevent stockouts while avoiding over-allocation and shelf-life expiration.",
    tags: ["Central warehouse", "Dark stores", "No stockouts", "No over-allocation", "No expiry"],
  },
  {
    id: "spike",
    n: 3,
    title: "Managing Festive Demand Spikes",
    text: "Seasonal peaks during Rakhi and Diwali cause dramatic surges in order volume. Logistics operations must scale warehousing throughput, packaging speed, and courier capacity without incurring high error rates.",
    tags: ["Rakhi", "Diwali", "Warehouse throughput", "Packaging speed", "Courier capacity", "Low error rates"],
  },
  {
    id: "lastmile",
    n: 4,
    title: "Last-Mile Fulfillment Costs",
    text: "Managing freight expenses, high shipping costs on low-average-order-value (AOV) single packs, and return-to-origin (RTO) friction in cash-on-delivery (COD) orders across pan-India routes.",
    tags: ["Freight expenses", "Low-AOV single packs", "RTO friction", "COD orders", "Pan-India routes"],
  },
] as const;
export type ChallengeId = (typeof CHALLENGES)[number]["id"];

export const TAKEAWAY = "Great snacks do not matter if they arrive late, broken, or stale. In the FMCG and healthy food ecosystem, logistics is an intrinsic part of the core product experience.";
