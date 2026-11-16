/**
 * Chapter 5.1 — Task A: Capstone Project Creation.
 * 360-degree Go-To-Market Strategy & Project Tracks for Eat Better Co.
 */

export const CHAPTER = {
  module: "Module 5 · Final Capstone Projects",
  number: "5.1",
  title: ["Capstone Task A:", "Project Creation"] as [string, string],
  subtitle:
    "Develop a 360-degree go-to-market strategy or commercial expansion proposal for Eat Better Co.",
  objective:
    "Develop a 360-degree go-to-market strategy for a new Eat Better product or category expansion (e.g., a new healthy sweet or snack variant for a new city), covering product specification, pricing, distribution, a full marketing campaign and a basic financial plan.",
};

export const LIB = "/brand/library";

export interface ProjectTrack {
  id: string;
  name: string;
  tagline: string;
  badge: string;
  heroImg: string;
  overview: string;
  scopeItems: string[];
  deliverables: string[];
  exampleInitiative: {
    title: string;
    description: string;
    targetMarket: string;
    expectedOutcome: string;
  };
}

export const CAPSTONE_TRACKS: ProjectTrack[] = [
  {
    id: "product-expansion",
    name: "New Product / Category Expansion",
    tagline: "Formulate a new clean-label sweet or savory snack variant and launch it in a target city.",
    badge: "Core GTM Track",
    heroImg: `${LIB}/combos/ultimate-snack-box-hero.webp`,
    overview:
      "Design an innovative, 100% clean-label food product solving modern urban cravings with zero refined sugar, zero preservatives, and premium nuts and seeds.",
    scopeItems: [
      "Clean-label formulation & ingredient Bill of Materials (BOM)",
      "Target customer persona & urban launch city selection",
      "Packaging specification, net weight & barrier shelf-life",
      "Unit economics: Price-per-gram, MRP & gross margin (>= 55%)",
    ],
    deliverables: [
      "Product Specification & Clean Ingredient Disclosure",
      "Unit Economics & Margin Calculation Table",
      "Omnichannel Distribution & Dark Store Allocation",
      "30-Day Multi-Touch Launch Campaign Calendar",
    ],
    exampleInitiative: {
      title: "Roasted Quinoa Almond Crunch Bar (Bengaluru Launch)",
      description: "Pocket-sized 45g bar sweetened with dark dates and rolled oats for 4 PM office cravings.",
      targetMarket: "Tech professionals in Bengaluru ordering via Blinkit & Zepto.",
      expectedOutcome: "₹18 Lakh quarterly revenue across 40 dark stores at 62% gross margin.",
    },
  },
  {
    id: "festive-gifting",
    name: "Festive Gifting Box Launch",
    tagline: "Design a luxury Diwali, Raksha Bandhan, or Corporate Gifting hamper with complete packaging and campaign.",
    badge: "High-AOV Track",
    heroImg: `${LIB}/site/corporate-gifting-jar-hamper.webp`,
    overview:
      "Capitalize on high-margin seasonal gifting spikes by curating a luxury hamper replacing traditional sugar-heavy sweets with clean-label artisanal treats.",
    scopeItems: [
      "Curated hamper product mix (laddoos, roasted nuts, trail mixes)",
      "Premium unboxing packaging: rigid keepsake box & custom greeting",
      "Tiered pricing: Corporate Entry (₹499), Royal (₹999), Luxury (₹1,499)",
      "B2B corporate sales pitch & D2C festive social campaign",
    ],
    deliverables: [
      "Hamper Product Mix & Unboxing Blueprint",
      "Packaging Specification & Custom Insert Design",
      "B2B Corporate Pitch Sheet & Tiered Pricing Matrix",
      "Festive Social Media & Influencer Rollout Plan",
    ],
    exampleInitiative: {
      title: "Utsav Royal Heritage Hamper (Diwali Edition)",
      description: "Dual-tier rigid trunk with 12 Hazelnut Laddoos, 2 glass snack jars, and artisanal Jaipur brass diya.",
      targetMarket: "Corporate HR procurement and families seeking healthy festive gifting.",
      expectedOutcome: "₹1.2 Crore seasonal gross revenue with ₹1,200 Average Order Value.",
    },
  },
  {
    id: "brand-campaign",
    name: "Brand Campaign Creation",
    tagline: "Build a complete 360° marketing campaign for an Eat Better flagship product: tagline, calendar, creators, and budget.",
    badge: "Marketing Track",
    heroImg: `${LIB}/combos/assorted-laddoo-box-24-hero.webp`,
    overview:
      "Build an integrated, high-retention marketing campaign for a hero Eat Better SKU with punchy cultural hooks, creator partnerships, and measurable ROAS.",
    scopeItems: [
      "Campaign big idea, cultural insight & hero tagline",
      "Audience targeting: fitness lovers, parents & sweet-cravers",
      "30-day cross-platform social calendar (Reels, Shorts, LinkedIn)",
      "Tiered influencer seeding strategy & ₹10 Lakh budget split",
    ],
    deliverables: [
      "Campaign Concept & Brand Voice Playbook",
      "30-Day Multi-Platform Content Calendar",
      "Influencer Seeding & Gifting Architecture",
      "3 Sample Ad Storyboards with Hooks & CTAs",
    ],
    exampleInitiative: {
      title: "'Sweet Without The Cheat' Campaign",
      description: "High-energy video series exposing hidden palm oil in conventional sweets while celebrating zero-sugar laddoos.",
      targetMarket: "Health-conscious urban youth seeking guilt-free traditional tastes.",
      expectedOutcome: "3.2x Meta ad ROAS, 45,000 site visits, and 25% new customer lift.",
    },
  },
  {
    id: "consumer-insights",
    name: "Consumer Insight Report",
    tagline: "Survey 20 to 30 consumers on snacking habits, identify friction points, and deliver strategic recommendations.",
    badge: "Research Track",
    heroImg: `${LIB}/namkeen/assorted-namkeen-combo-of-4-hero.webp`,
    overview:
      "Survey 20–30 real consumers to uncover snacking triggers, guilt factors, and label awareness, translating raw data into strategic growth opportunities.",
    scopeItems: [
      "10-question survey covering frequency, budget & label trust",
      "Sampling 20–30 real respondents across diverse age demographics",
      "Quantitative chart synthesis & friction point analysis",
      "Executive strategic recommendations deck for Eat Better leadership",
    ],
    deliverables: [
      "Survey Questionnaire & Raw Response Dataset",
      "Consumer Persona Map & Occasion Breakdown",
      "Key Friction Insights & Perceptual Matrix",
      "Executive Recommendations Slide Deck",
    ],
    exampleInitiative: {
      title: "'The 5 PM Snack Conundrum' Report",
      description: "Field study of 28 working professionals analyzing the trade-off between convenience, price, and clean nutrition.",
      targetMarket: "Corporate professionals aged 22-45 in metro tech hubs.",
      expectedOutcome: "Identified unmet demand for savory crunch single-packs under ₹99.",
    },
  },
  {
    id: "social-content-pack",
    name: "Social Media Content Pack",
    tagline: "Create 5 high-converting posts or reels for Eat Better with complete captions, audio direction, and rationale.",
    badge: "Creative Track",
    heroImg: `${LIB}/site/home-banner-hampers-sold-out.webp`,
    overview:
      "Produce 5 publication-ready social media assets highlighting Eat Better's authentic Jaipur kitchen, clean recipes, and humorous snack hacks.",
    scopeItems: [
      "5 distinct formats: Ingredient Comparison, Kitchen Tour, Taste Test, Review, & Poll",
      "Complete scriptwriting, on-screen text hooks & trending audio recommendations",
      "Storytelling captions, targeted hashtag strategy & clear CTAs",
      "Psychological hook analysis & conversion rationale per post",
    ],
    deliverables: [
      "5 Publication-Ready Content Briefs with Scripts & Visual Direction",
      "Complete Captions, Hashtag Architecture & CTAs",
      "Weekly Posting Schedule & Optimal Timing Cadence",
      "KPI Tracking Matrix (Saves, Shares, CTR, Profile Visits)",
    ],
    exampleInitiative: {
      title: "'No Sugarcoating' 5-Part Reel Series",
      description: "High-retention video series comparing mass-market snack ingredient labels against Eat Better recipes.",
      targetMarket: "Instagram wellness followers and online clean food buyers.",
      expectedOutcome: "18% reel engagement rate, 3,500+ saves, and consistent site traffic.",
    },
  },
];

export const GTM_BLUEPRINT_PILLARS = [
  {
    number: "01",
    title: "Product & Market Opportunity",
    subtitle: "Identify consumer friction & target city",
    points: [
      "Define specific consumer persona & target city pin codes.",
      "Articulate unique clean-label proposition vs sugar-loaded alternatives.",
    ],
  },
  {
    number: "02",
    title: "Formulation & Packaging (BOM)",
    subtitle: "100% clean ingredients & barrier pack",
    points: [
      "Specify whole food Bill of Materials (zero refined sugar, zero palm oil).",
      "Determine pack weight, recyclable barrier foil & shelf-life.",
    ],
  },
  {
    number: "03",
    title: "Pricing & Unit Economics",
    subtitle: "Price-per-gram & sustainable margins",
    points: [
      "Calculate ingredient BOM and packaging cost per unit.",
      "Benchmark price-per-gram (₹1.13–1.55/g) targeting >= 55% gross margin.",
    ],
  },
  {
    number: "04",
    title: "Omnichannel Distribution Mix",
    subtitle: "Volume split across channels",
    points: [
      "Allocate volume: Quick-Commerce (impulse), D2C webstore (bundles), Amazon.",
      "Dark store inventory replenishment & packaging durability.",
    ],
  },
  {
    number: "05",
    title: "360° Launch & Media Campaign",
    subtitle: "High-impact storytelling & creator seeding",
    points: [
      "Craft memorable campaign tagline, teaser phase & influencer gifting.",
      "Allocate paid media budget across Meta ads and sampling.",
    ],
  },
  {
    number: "06",
    title: "Financial Forecast & Scalability",
    subtitle: "6-month P&L & unit milestone targets",
    points: [
      "Model 6-month unit sales, revenue, and gross contribution.",
      "Identify operational break-even and kitchen batch capacity.",
    ],
  },
];

export interface ToolCategory {
  category: string;
  badge: string;
  description: string;
  tools: {
    id: string;
    name: string;
    description: string;
    highlight: string;
    badge?: string;
  }[];
}

export const RECOMMENDED_TOOLS_TASK_A: ToolCategory[] = [
  {
    category: "Presentation & Pitch Decks",
    badge: "Recommended",
    description: "Build an executive slide deck (10–15 slides) presenting your complete strategy.",
    tools: [
      {
        id: "google-slides",
        name: "Google Slides",
        description: "Cloud-based collaborative deck builder with easy PDF export.",
        highlight: "Ideal for teamwork and quick sharing.",
        badge: "Most Popular",
      },
      {
        id: "canva",
        name: "Canva",
        description: "Rich pitch deck templates, product mockups, and graphic assets.",
        highlight: "Best for high visual impact and packaging mockups.",
        badge: "Design Favorite",
      },
      {
        id: "gamma",
        name: "Gamma / Pitch",
        description: "AI-assisted slide layouts with sleek modern typography.",
        highlight: "Fastest formatting for clean executive decks.",
      },
      {
        id: "powerpoint",
        name: "Microsoft PowerPoint",
        description: "Standard corporate presentation software with detailed charts.",
        highlight: "Best for offline desktop editing.",
      },
    ],
  },
  {
    category: "Financial Modeling & Economics",
    badge: "Quantitative",
    description: "Model your BOM cost, pricing benchmarks, and 6-month sales forecast.",
    tools: [
      {
        id: "google-sheets",
        name: "Google Sheets",
        description: "Cloud spreadsheet with formulas for margin and AOV modeling.",
        highlight: "Embed live charts directly into Google Slides.",
        badge: "Essential",
      },
      {
        id: "excel",
        name: "Microsoft Excel",
        description: "Industry-standard workbook software for detailed unit economics.",
        highlight: "Ideal for multi-channel margin sensitivity tables.",
      },
    ],
  },
  {
    category: "Strategy Documents & Research",
    badge: "Documentation",
    description: "Write executive dossiers or collect consumer survey responses.",
    tools: [
      {
        id: "notion",
        name: "Notion / Google Docs",
        description: "Clean workspace for organizing strategy briefs and launch timelines.",
        highlight: "Structured documentation with embedded tables.",
      },
      {
        id: "google-forms",
        name: "Google Forms / Typeform",
        description: "Survey creator for gathering consumer insights from 20-30 respondents.",
        highlight: "Instant response collection and automated charts.",
      },
    ],
  },
];

export const CAPSTONE_RUBRIC = [
  {
    title: "Strategic Clarity & Problem Formulation",
    weight: "25%",
    criteria: "Clear target customer persona, authentic clean-label value proposition, and compelling brand fit with Eat Better Co.",
  },
  {
    title: "Unit Economics & Commercial Viability",
    weight: "25%",
    criteria: "Accurate Bill of Materials (BOM), competitive price-per-gram benchmark, and healthy gross margin (>= 55%).",
  },
  {
    title: "Execution Rigor & Actionable Roadmap",
    weight: "25%",
    criteria: "Realistic omnichannel distribution split, 30-day marketing launch calendar, and creator outreach strategy.",
  },
  {
    title: "Professional Polish & Communication",
    weight: "25%",
    criteria: "Clean visual presentation, coherent slide storytelling, legible charts, and adherence to clean-label principles.",
  },
];

export const TAKEAWAY_5_1 = {
  title: "From Kitchen Recipes to Scalable Enterprise",
  quote:
    "A breakout food brand isn't built on wishful thinking — it thrives at the exact intersection of delicious culinary integrity, disciplined unit economics, and magnetic storytelling.",
  author: "Eat Better Co × Skillizee Internship Board",
};
