/**
 * Experiential Activity 4 · Build the Eat Better Business
 * DATA & REFERENCE TRUTH: docs/module-4-content.md (verbatim from internship chapters)
 * Real company facts:
 * - FY23 revenue ~₹5.5 crore, FY24 revenue ~₹14.7 crore (~165% YoY growth)
 * - FY24 net loss ~₹63 lakh (investing in growth / operational leverage)
 * - Order velocity ~2 lakh fulfilled orders/month
 * - Pre-Series A funding round in April 2025 (co-led by Prath Ventures and Spring Marketing Capital)
 * - Centralized 50,000 sq. ft. manufacturing facility in Jaipur
 * - Official SKUs: Assorted Laddoo Box 24 (240g ₹349), Assorted Laddoo Box 42 (420g ₹649),
 *   Ultimate Snack Box (660g ₹749), Assorted Namkeen Combo (400g ₹269)
 * All simulated numbers are explicitly labelled "(simulated)".
 */

const LIB = "/brand/library";

export type SkuId = "l24" | "l42" | "usb" | "nam";

export type SkuItem = {
  id: SkuId;
  name: string;
  short: string;
  grams: number;
  retailPrice: number;
  statedPricePerGram: number;
  img: string;
  alt: string;
  description: string;
  bom: {
    ingredients: number; // simulated baseline BOM
    packaging: number;
    production: number;
  };
};

export const SKUS: Record<SkuId, SkuItem> = {
  l24: {
    id: "l24",
    name: "Assorted Laddoo Box (24 Laddoos)",
    short: "Laddoo Box 24",
    grams: 240,
    retailPrice: 349,
    statedPricePerGram: 1.45,
    img: `${LIB}/combos/assorted-laddoo-box-24-open.webp`,
    alt: "An open Assorted Laddoo Box with six flavours of laddoo pouches",
    description: "6 assorted date-sweetened laddoo varieties. Zero refined sugar, zero palm oil.",
    bom: { ingredients: 110, packaging: 38, production: 28 },
  },
  l42: {
    id: "l42",
    name: "Assorted Laddoo Box (42 Laddoos)",
    short: "Laddoo Box 42",
    grams: 420,
    retailPrice: 649,
    statedPricePerGram: 1.55,
    img: `${LIB}/combos/assorted-laddoo-box-42-open.webp`,
    alt: "An open Assorted Laddoo Box (42 laddoos)",
    description: "Signature gifting box of 42 artisanal date-sweetened laddoos.",
    bom: { ingredients: 195, packaging: 65, production: 45 },
  },
  usb: {
    id: "usb",
    name: "Ultimate Snack Box (12 Packs)",
    short: "Ultimate Snack Box",
    grams: 660,
    retailPrice: 749,
    statedPricePerGram: 1.13,
    img: `${LIB}/combos/ultimate-snack-box-open.webp`,
    alt: "An open Ultimate Snack Box packed with snack pouches",
    description: "12 diverse savoury and sweet snack packs bundled together for family snacking.",
    bom: { ingredients: 240, packaging: 58, production: 52 },
  },
  nam: {
    id: "nam",
    name: "Assorted Namkeen Combo (4 Packs)",
    short: "Namkeen Combo",
    grams: 400,
    retailPrice: 269,
    statedPricePerGram: 0.67,
    img: `${LIB}/namkeen/assorted-namkeen-combo-of-4-bowls.webp`,
    alt: "Four Eat Better millet namkeen pouches with two bowls of namkeen",
    description: "Roasted millets and seed mixes with zero palm oil. Everyday high-volume favourite.",
    bom: { ingredients: 85, packaging: 28, production: 22 },
  },
};

export const SKU_IDS: SkuId[] = ["l24", "l42", "usb", "nam"];

/* ── Financial Facts ────────────────────────────────────────── */

export const FINANCIAL_FACTS = {
  fy23RevenueCr: 5.5,
  fy24RevenueCr: 14.7,
  yoyGrowthPct: 165,
  fy24NetLossLakh: 63,
  monthlyOrders: 200000,
  fundingRound: "Pre-Series A (April 2025)",
  investors: "Co-led by Prath Ventures and Spring Marketing Capital",
  facilitySqFt: 50000,
  facilityLocation: "Jaipur, Rajasthan",
  avgOrderValue: 620, // simulated representative average order value
};

/* ── Order Unit Economics Breakdown (Simulated Representative Order) ── */

export type UnitEcoItem = {
  label: string;
  pct: number;
  amount: number;
  note: string;
  type: "revenue" | "cogs" | "opex" | "contribution";
};

export function getOrderUnitEconomics(aov: number = 620): UnitEcoItem[] {
  const cogs = Math.round(aov * 0.38);
  const packaging = Math.round(aov * 0.08);
  const shipping = Math.round(aov * 0.16);
  const platformFees = Math.round(aov * 0.12);
  const marketingCac = Math.round(aov * 0.18);
  const contribution = aov - (cogs + packaging + shipping + platformFees + marketingCac);

  return [
    { label: "Gross Order Revenue (AOV)", pct: 100, amount: aov, note: "Average cart value across all sales channels", type: "revenue" },
    { label: "Raw Ingredients (COGS)", pct: 38, amount: cogs, note: "Dates, almonds, cashews, millets, quinoa (clean-label BOM)", type: "cogs" },
    { label: "Packaging & Boxes", pct: 8, amount: packaging, note: "Recyclable pouches, gift box cartons, moisture barrier", type: "cogs" },
    { label: "Logistics & Delivery", pct: 16, amount: shipping, note: "Surface 3PL, dark store drops, last-mile courier", type: "opex" },
    { label: "Marketplace / Platform Fees", pct: 12, amount: platformFees, note: "Quick commerce commissions and gateway processing", type: "opex" },
    { label: "Performance Marketing (CAC)", pct: 18, amount: marketingCac, note: "Blended acquisition cost per order", type: "opex" },
    { label: "Order Contribution Margin", pct: Math.round((contribution / aov) * 100), amount: contribution, note: "Profit per order before fixed corporate overheads", type: "contribution" },
  ];
}

/* ── Competitor Data (strictly from docs/module-4-content.md) ── */

export type CompetitorCategory = {
  id: string;
  name: string;
  kind: string;
  focus: string;
  ingredients: string;
  pricePerGramRange: string;
  corePromise: string;
  cleanLabel: "High" | "Medium" | "Low";
  familiarTaste: "High" | "Medium" | "Low";
  qcomAvailability: "High" | "Medium" | "Low";
  naturalSweetening: "High" | "Medium" | "Low";
  priceAccessibility: "High" | "Medium" | "Low";
};

export const COMPETITOR_CATEGORIES: CompetitorCategory[] = [
  {
    id: "eb",
    name: "Eat Better Co",
    kind: "D2C / Modern Challenger",
    focus: "Date-sweetened Laddoos, Roasted Namkeens, Seed Mixes",
    ingredients: "Dates, almonds, millets, quinoa; roasted, zero palm oil",
    pricePerGramRange: "₹0.67 to ₹1.55 / g",
    corePromise: "“The joy of snacking, made better.” Clean-label, zero refined sugar/palm oil, lab-tested.",
    cleanLabel: "High",
    familiarTaste: "High",
    qcomAvailability: "High",
    naturalSweetening: "High",
    priceAccessibility: "Medium",
  },
  {
    id: "trad",
    name: "Traditional Brands (Haldiram's, Bikaji)",
    kind: "Mass-Market Legacy",
    focus: "Traditional Bhujia, Sev, Fried Mithai",
    ingredients: "Refined flour, potatoes, dal; deep-fried in palm/vegetable oil, refined sugar",
    pricePerGramRange: "₹0.15 to ₹0.35 / g",
    corePromise: "Authentic heritage taste, wide offline distribution, high affordability.",
    cleanLabel: "Low",
    familiarTaste: "High",
    qcomAvailability: "High",
    naturalSweetening: "Low",
    priceAccessibility: "High",
  },
  {
    id: "health",
    name: "Direct Health Competitors (Farmley, True Elements)",
    kind: "Gourmet Health / Whole Foods",
    focus: "Flavored Dry Fruits, Seed Mixes, Roasted Snacks",
    ingredients: "Nuts, seeds, oats, millets; dry-roasted or light seasoning",
    pricePerGramRange: "₹0.80 to ₹1.80 / g",
    corePromise: "Whole-food nutrition, high protein, clean-label dry fruit innovation.",
    cleanLabel: "High",
    familiarTaste: "Medium",
    qcomAvailability: "High",
    naturalSweetening: "Medium",
    priceAccessibility: "Medium",
  },
  {
    id: "local",
    name: "Local Sweet Shops (Mithai Outlets)",
    kind: "Traditional Fresh Retail",
    focus: "Traditional Laddoos, Barfis, Halwa",
    ingredients: "Milk solids (khoya), refined sugar, ghee, refined flour",
    pricePerGramRange: "₹0.50 to ₹1.20 / g",
    corePromise: "Freshly made local traditional sweets for daily consumption and festive occasions.",
    cleanLabel: "Low",
    familiarTaste: "High",
    qcomAvailability: "Low",
    naturalSweetening: "Low",
    priceAccessibility: "High",
  },
];

export type BrandPeer = {
  name: string;
  hq: string;
  founded: string;
  category: string;
  positioning: string;
  usp: string;
  eatBetterEdge: string;
};

export const BRAND_PEERS: BrandPeer[] = [
  {
    name: "Yoga Bar",
    hq: "Mumbai",
    founded: "2014",
    category: "Bars, muesli, oats",
    positioning: "Fitness and breakfast nutrition",
    usp: "Protein and fibre focus",
    eatBetterEdge: "Eat Better is stronger in festive indulgence, traditional sweets, and corporate gifting.",
  },
  {
    name: "True Elements",
    hq: "Pune",
    founded: "2013",
    category: "Cereals, seeds, snacks",
    positioning: "Wide health-food range",
    usp: "Range and trust of a long-running brand",
    eatBetterEdge: "Eat Better is more indulgent, 'desi', and appeals to mainstream family tastes.",
  },
  {
    name: "Nourish You",
    hq: "Hyderabad",
    founded: "2014",
    category: "Seeds, superfoods, plant-based",
    positioning: "Plant-based and seed-focused",
    usp: "Superseeds and clean-label purity",
    eatBetterEdge: "Eat Better has wider mainstream taste appeal with date laddoos and roasted namkeens.",
  },
  {
    name: "Lo! Foods",
    hq: "Mumbai",
    founded: "2019",
    category: "Low-carb / keto foods",
    positioning: "Diet-specific health snacking",
    usp: "Low-carb and diabetes-friendly alternatives",
    eatBetterEdge: "Eat Better serves the mass family market without requiring clinical diet restrictions.",
  },
  {
    name: "Evolve Snacks",
    hq: "Delhi",
    founded: "2015",
    category: "Gluten-free, vegan snacks",
    positioning: "Dietary-preference variety",
    usp: "High-protein and allergen-free snack varieties",
    eatBetterEdge: "Eat Better has a much stronger founder storytelling brand and nationwide gifting moat.",
  },
];

/* ── Budget Allocation Functional Areas (Simulated Growth Capital) ── */

export type BudgetId = "portfolio" | "marketing" | "mfg" | "qcom" | "b2b" | "tech";

export type BudgetArea = {
  id: BudgetId;
  title: string;
  short: string;
  defaultPct: number;
  description: string;
  impactGain: string;
  riskIfIgnored: string;
  strategicPillar: string;
};

export const BUDGET_AREAS: Record<BudgetId, BudgetArea> = {
  portfolio: {
    id: "portfolio",
    title: "Product Innovation & R&D",
    short: "New SKUs & R&D",
    defaultPct: 15,
    description: "Developing new high-protein sweet & savoury SKUs using ancient grains and clean-label formulations.",
    impactGain: "+8 new high-margin SKUs launched; expands snacking occasions into afternoon office and fitness.",
    riskIfIgnored: "Product fatigue; competitors emulate core laddoo lines while consumer trends shift.",
    strategicPillar: "Product Portfolio Expansion",
  },
  marketing: {
    id: "marketing",
    title: "Brand Marketing & Customer Acquisition",
    short: "Brand & CAC",
    defaultPct: 25,
    description: "Festive campaigns, creator partnerships, high-intent Meta ads, and top-of-funnel storytelling.",
    impactGain: "Drives customer trials, elevates brand recall, and lowers blended CAC via organic word-of-mouth.",
    riskIfIgnored: "Top-line velocity stalls; unable to feed the new factory's production volume.",
    strategicPillar: "Brand Velocity & Scale",
  },
  mfg: {
    id: "mfg",
    title: "Jaipur 50,000 sq. ft. Facility & Automation",
    short: "Jaipur 50k Hub",
    defaultPct: 25,
    description: "Equipping the centralized manufacturing hub with climate-controlled roasting, automated pouch packaging, and clean-room labs.",
    impactGain: "Triples production capacity; reduces unit labour costs by 22% through semi-automation.",
    riskIfIgnored: "Production bottlenecks during Diwali and festive peaks lead to massive lost sales.",
    strategicPillar: "Infrastructure & Scalability",
  },
  qcom: {
    id: "qcom",
    title: "Quick-Commerce Dark-Store Depth",
    short: "Quick Commerce",
    defaultPct: 15,
    description: "Expanding inventory buffers across 1,200+ dark stores in Tier-1 and Tier-2 cities (Blinkit, Zepto, Instamart).",
    impactGain: "Ensures <15 minute availability in 18 metro clusters with zero out-of-stock platform penalties.",
    riskIfIgnored: "Stockouts in fast-selling hubs result in algorithmic demotion on quick-commerce apps.",
    strategicPillar: "Quick-Commerce Acceleration",
  },
  b2b: {
    id: "b2b",
    title: "Corporate & B2B Gifting Infrastructure",
    short: "Corporate B2B",
    defaultPct: 12,
    description: "Dedicated enterprise sales representatives, custom bespoke packaging lines, and year-round corporate wellness programmes.",
    impactGain: "High-AOV (₹2,500+) prepaid orders with 35%+ contribution margins that buffer seasonal dips.",
    riskIfIgnored: "Business remains vulnerable to retail demand fluctuations outside of Diwali.",
    strategicPillar: "Corporate & B2B Gifting Scale",
  },
  tech: {
    id: "tech",
    title: "Omnichannel Tech & Supply Chain Sync",
    short: "Tech & Ops Sync",
    defaultPct: 8,
    description: "Automated demand forecasting software, ERP integration between Jaipur factory and regional 3PL hubs.",
    impactGain: "Cuts inventory holding days from 28 to 18; eliminates waste from near-expiry stock.",
    riskIfIgnored: "Mismatched stock across channels leads to expired stock in slow hubs and shortages in fast hubs.",
    strategicPillar: "Operational Excellence",
  },
};

export const BUDGET_IDS: BudgetId[] = ["portfolio", "marketing", "mfg", "qcom", "b2b", "tech"];

/* ── 4 Strategic Growth Pillars (from docs/module-4-content.md) ── */

export type GrowthPillar = {
  id: string;
  num: string;
  title: string;
  tagline: string;
  sourceFact: string;
  kpis: string[];
};

export const GROWTH_PILLARS: GrowthPillar[] = [
  {
    id: "portfolio",
    num: "1",
    title: "Product Portfolio Expansion",
    tagline: "High-protein and ancient grains with zero compromise on clean-label standards",
    sourceFact: "Developing new SKU lines across savory and sweet categories using high-protein and ancient grain bases while maintaining strict clean-label standards.",
    kpis: ["Target 15+ new clean-label SKUs", "Expansion into high-protein seed bites", "Under-₹99 trial pack formats"],
  },
  {
    id: "qcom",
    num: "2",
    title: "Quick-Commerce Acceleration",
    tagline: "Deepening dark-store density to capture impulsive health-snacking demand",
    sourceFact: "Deepening penetration across dark-store networks in Tier-1 and Tier-2 cities to convert high-intent, instant-snacking demand into repeat volume.",
    kpis: ["15-minute delivery in 18+ cities", "Over 2,000 active dark store pods", "45%+ repeat purchase rate"],
  },
  {
    id: "b2b",
    num: "3",
    title: "Corporate & B2B Gifting Scale",
    tagline: "Transforming festive seasonal peaks into year-round enterprise wellness contracts",
    sourceFact: "Expanding year-round enterprise partnerships beyond seasonal peaks, positioning customized clean-label gift hampers as premium corporate wellness deliverables.",
    kpis: ["500+ corporate enterprise clients", "Year-round milestone & wellness gifting", "35%+ gross contribution margin"],
  },
  {
    id: "infra",
    num: "4",
    title: "Jaipur 50,000 sq. ft. Central Manufacturing Facility",
    tagline: "Headroom to scale daily production with strict batch-level quality control",
    sourceFact: "Operationalizing a centralized 50,000 sq. ft. manufacturing facility in Jaipur, giving the brand significant headroom to scale daily output and support multi-channel expansion without compromising quality control.",
    kpis: ["5x peak monthly output capacity", "In-house roasting and nitrogen sealing", "Zero external third-party packing risk"],
  },
];

/* ── Investor Pitch Due Diligence Simulation (Stage 6) ── */

export type PitchQuestion = {
  id: string;
  investor: string;
  firm: string;
  question: string;
  context: string;
  options: {
    id: string;
    text: string;
    strategicRating: "exceptional" | "solid" | "weak";
    score: number;
    feedback: string;
  }[];
};

export const PITCH_QUESTIONS: PitchQuestion[] = [
  {
    id: "q1_margins",
    investor: "Anupam / Consumer VC Partner",
    firm: "Prath Ventures",
    question: "Quick commerce now drives a big share of your volume, but platform cuts and discounting eat away at margins. How will you protect gross margins as you scale to ₹50 Cr+?",
    context: "Unit economics pressure from fast delivery channels.",
    options: [
      {
        id: "a",
        text: "We bundle multi-packs (like our Ultimate Snack Box at ₹1.13/g) to push AOV above ₹600, while manufacturing in our own 50,000 sq. ft. Jaipur hub to cut production BOM costs by 18%.",
        strategicRating: "exceptional",
        score: 25,
        feedback: "Spot on! Higher AOV dilutes fixed platform delivery fees, and in-house manufacturing protects your gross margin from contract packer markups.",
      },
      {
        id: "b",
        text: "We will increase retail prices on quick commerce by 25% because consumers in a hurry don't check prices.",
        strategicRating: "weak",
        score: 5,
        feedback: "Flawed assumption. High-intent consumers quickly compare prices across apps; an arbitrary price hike damages conversion and platform ranking.",
      },
      {
        id: "c",
        text: "We will balance high-velocity quick commerce with high-margin year-round corporate gifting hampers (35%+ contribution) and D2C subscriber bundles.",
        strategicRating: "solid",
        score: 20,
        feedback: "Very strong portfolio approach! Blending high-velocity low-margin channels with high-margin enterprise gifting stabilizes corporate EBITDA.",
      },
    ],
  },
  {
    id: "q2_moat",
    investor: "Namita / Strategic Growth Partner",
    firm: "Spring Marketing Capital",
    question: "Haldiram's and Bikaji have massive cash reserves and thousands of distributors. What stops them from copying your date-sweetened laddoos and undercutting you by 40%?",
    context: "Defensibility against legacy snack giants.",
    options: [
      {
        id: "a",
        text: "Legacy giants rely on industrial palm-oil fryers and refined sugar formulations with 6-month room-temperature shelf-life. Formulating artisanal date-sweetened products without preservatives disrupts their entire supply chain, while our clean-label brand trust is already proven in tests.",
        strategicRating: "exceptional",
        score: 25,
        feedback: "Masterful competitive insight! Incumbents face an 'innovator's dilemma'—reformulating with whole dates and nuts destroys their mass-market cost structure and shelf-life model.",
      },
      {
        id: "b",
        text: "We have registered patents on date laddoos so no other company in India is legally allowed to make them.",
        strategicRating: "weak",
        score: 0,
        feedback: "Incorrect. Traditional recipes and ingredient combinations cannot be patented. Defensibility comes from process discipline, brand trust, and cold-chain/freshness execution.",
      },
      {
        id: "c",
        text: "Our young modern brand identity and agile D2C community cannot be matched by legacy brands whose target demographic is older.",
        strategicRating: "solid",
        score: 18,
        feedback: "Good point on brand resonance, but operational moat (clean supply chain + lab verification) is what truly prevents legacy encroachment.",
      },
    ],
  },
  {
    id: "q3_capex",
    investor: "Peyush / Operations & Scale Lead",
    firm: "Growth Equity Syndicate",
    question: "You posted a net loss of ~₹63 lakh in FY24, yet you're operationalizing a massive 50,000 sq. ft. facility in Jaipur. Why take on this capex burden now instead of co-packing?",
    context: "Capital expenditure vs third-party manufacturing.",
    options: [
      {
        id: "a",
        text: "Co-packers in India cannot guarantee zero palm-oil cross-contamination or consistent date moisture control. Owning our centralized hub allows batch-level lab testing, protects proprietary roasting techniques, and gives headroom for 2 lakh+ orders/month without quality slips.",
        strategicRating: "exceptional",
        score: 25,
        feedback: "Brilliant operational defence! Clean-label promises live or die by quality control. In-house manufacturing is Eat Better's core brand integrity pillar.",
      },
      {
        id: "b",
        text: "Building a factory always looks impressive in our pitch deck to attract future funding rounds.",
        strategicRating: "weak",
        score: 0,
        feedback: "Unacceptable rationale. Capex must be driven by operational necessity, unit economic leverage, and quality preservation, never cosmetic posturing.",
      },
      {
        id: "c",
        text: "It reduces our rental costs and gives us warehouse space so we never have to pay third-party logistics warehouses in North India.",
        strategicRating: "solid",
        score: 15,
        feedback: "Partially true for regional dispatch, but the primary reason is quality control and production throughput headroom.",
      },
    ],
  },
  {
    id: "q4_profitability",
    investor: "Vineeta / Consumer Brand Investor",
    firm: "Institutional Angel Fund",
    question: "What is your concrete milestone roadmap to transition from FY24's ~₹63 lakh loss into sustainable, profitable net EBITDA?",
    context: "Timeline and operational bridge to profitability.",
    options: [
      {
        id: "a",
        text: "With FY24 revenue at ₹14.7 Cr (+165%), our fixed overheads are already getting absorbed. By scaling past ₹25 Cr revenue while in-housing production at our Jaipur facility, gross margins expand from 54% to 62%, flipping the ₹63L loss into ~₹1.8 Cr net profit.",
        strategicRating: "exceptional",
        score: 25,
        feedback: "Flawless financial understanding! You demonstrate operational leverage: fixed SG&A stays relatively flat while gross profit dollars surge past the break-even threshold.",
      },
      {
        id: "b",
        text: "We will simply stop spending any money on marketing and advertising next month so that all revenue turns directly into profit.",
        strategicRating: "weak",
        score: 5,
        feedback: "Dangerous trap! In high-growth D2C, halting marketing crashes new customer acquisition and reduces production scale, worsening unit costs.",
      },
      {
        id: "c",
        text: "We will expand corporate gifting which generates immediate 35%+ contribution margin and use those cash flows to fund working capital.",
        strategicRating: "solid",
        score: 20,
        feedback: "Very sound cash-flow strategy! Corporate gifting provides upfront working capital and high margins, aiding overall profitability.",
      },
    ],
  },
];
