/**
 * Chapter 4.3 — Management's Future Growth Strategy & Scalability.
 * SOURCE OF TRUTH: docs/module-4-content.md (user-supplied). The source has no objective or takeaway; the objective below
 * only describes what the chapter covers. The source says "three primary pillars" but lists FOUR; all four are shown.
 */

export const CHAPTER = {
  module: "Module 4 · Pricing, Competition & Growth",
  number: "4.3",
  title: ["Future Growth Strategy", "& Scalability"] as [string, string],
  subtitle: "How Eat Better plans to grow after its Pre-Series A round: four operational pillars.",
  objective: "Describe the four operational growth pillars Eat Better outlined after its April 2025 Pre-Series A round, and how each connects to the business model.",
};

export const TIMELINE = [
  { id: "shark", when: "Shark Tank India", title: "The pitch", text: "Eat Better appeared on Shark Tank India, Season 4 (covered in Chapter 1.3)." },
  { id: "round", when: "April 2025", title: "Pre-Series A round", text: "A Pre-Series A funding round, co-led by Prath Ventures and Spring Marketing Capital. The ₹17 crore round is covered in Chapter 2.4." },
  { id: "plan", when: "After the round", title: "A growth plan", text: "Management outlined its operational growth pillars. Four of them are listed on this page." },
] as const;

export type PillarId = "portfolio" | "qcom" | "b2b" | "infra";

export const PILLARS: { id: PillarId; n: string; title: string; short: string; text: string; keys: string[] }[] = [
  {
    id: "portfolio",
    n: "1",
    title: "Product Portfolio Expansion",
    short: "More products",
    text: "Developing new SKU lines across savory and sweet categories using high-protein and ancient grain bases while maintaining strict clean-label standards.",
    keys: ["New SKU lines", "Savory and sweet", "High-protein and ancient grains", "Clean-label standards"],
  },
  {
    id: "qcom",
    n: "2",
    title: "Quick-Commerce Acceleration",
    short: "Deeper delivery reach",
    text: "Deepening penetration across dark-store networks in Tier-1 and Tier-2 cities to convert high-intent, instant-snacking demand into repeat volume.",
    keys: ["Dark-store networks", "Tier-1 and Tier-2 cities", "Instant-snacking demand", "Repeat volume"],
  },
  {
    id: "b2b",
    n: "3",
    title: "Corporate & B2B Gifting Scale",
    short: "Gifting all year",
    text: "Expanding year-round enterprise partnerships beyond seasonal peaks, positioning customized clean-label gift hampers as premium corporate wellness deliverables.",
    keys: ["Year-round partnerships", "Beyond seasonal peaks", "Customized hampers", "Corporate wellness"],
  },
  {
    id: "infra",
    n: "4",
    title: "Infrastructure & Production Capacity",
    short: "A bigger kitchen",
    text: "Operationalizing a centralized 50,000 sq. ft. manufacturing facility in Jaipur, giving the brand significant headroom to scale daily output and support multi-channel expansion without compromising quality control.",
    keys: ["50,000 sq. ft. in Jaipur", "Headroom to scale daily output", "Multi-channel expansion", "Quality control kept"],
  },
];

type Blk = "value" | "activities" | "resources" | "channels" | "segments" | "relationships" | "revenue";
export const CANVAS_LINKS: Record<PillarId, { highlight: Blk[]; items: Partial<Record<Blk, string[]>>; says: string }> = {
  portfolio: {
    highlight: ["value", "activities"],
    items: { value: ["New savory and sweet SKU lines", "High-protein and ancient-grain bases", "Clean-label standards kept"], activities: ["Developing new products"] },
    says: "New products change what the brand offers (Value Propositions) and what the team does every day (Key Activities).",
  },
  qcom: {
    highlight: ["channels", "segments", "relationships"],
    items: { channels: ["Dark-store networks", "Tier-1 and Tier-2 cities"], segments: ["High-intent, instant-snacking shoppers"], relationships: ["Turning first orders into repeat volume"] },
    says: "Quick commerce is a sales route (Channels) that reaches instant-snacking shoppers and aims at repeat orders.",
  },
  b2b: {
    highlight: ["segments", "channels", "value", "revenue"],
    items: { segments: ["Corporate clients, all year"], channels: ["Enterprise partnerships"], value: ["Customized clean-label hampers as corporate wellness deliverables"], revenue: ["Gifting income beyond seasonal peaks"] },
    says: "Corporate gifting adds a customer group, a route to them, a tailored offer and income outside the festival peaks.",
  },
  infra: {
    highlight: ["resources", "activities"],
    items: { resources: ["50,000 sq. ft. facility in Jaipur"], activities: ["Daily production at scale", "Quality control"] },
    says: "The facility is a Key Resource; running it at scale, with quality control, is a Key Activity.",
  },
};

export const RECAP = "Four pillars carry the plan: more products, deeper quick-commerce reach, year-round corporate gifting, and a larger Jaipur facility with quality control kept in place.";
