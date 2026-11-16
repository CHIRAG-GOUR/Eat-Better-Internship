/**
 * Chapter 5.1 — Task A: Capstone Project Creation.
 * 360-degree Go-To-Market Strategy & Project Tracks for Eat Better Co.
 */

export const CHAPTER = {
  module: "Module 5 · Final Capstone Projects",
  number: "5.1",
  title: ["Capstone Task A:", "Project Creation"] as [string, string],
  subtitle:
    "Develop a 360-degree go-to-market strategy or comprehensive brand initiative for Eat Better Co, with rigorous product specs, pricing, distribution, marketing, and unit economics.",
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
      "Design an innovative, 100% clean-label food product tailored for modern urban snacking habits. Solve a specific craving (e.g. roasted seed crunch, guilt-free halwa bites, or vegan protein laddoo) with zero refined sugar, zero preservatives, and premium nuts and seeds.",
    scopeItems: [
      "Product formulation & clean-label Bill of Materials (BOM)",
      "Target customer persona and urban market selection (e.g. Bengaluru tech corridor or Mumbai commuters)",
      "Packaging format, barrier properties, and shelf-life strategy",
      "Pricing model: Price per gram, MRP, and gross margin benchmarking (>= 55%)",
      "Omnichannel distribution roadmap (Quick commerce, D2C, and modern trade)",
      "360-degree launch campaign and 6-month financial projections",
    ],
    deliverables: [
      "Product Specification Sheet with full ingredient disclosure",
      "Unit Economics & Margin Calculation table",
      "Channel Distribution Mix & Quick-Commerce dark store plan",
      "30-day multi-touch launch campaign calendar",
      "6-month P&L and volume forecast",
    ],
    exampleInitiative: {
      title: "Roasted Quinoa Almond Crunch Bar (Bengaluru Launch)",
      description: "A pocket-sized 45g bar sweetened with dark Arabian dates and rolled oats, targeting quick-commerce snackers looking for healthy 4 PM fuel.",
      targetMarket: "Bengaluru white-collar professionals aged 24-38 ordering via Blinkit and Zepto.",
      expectedOutcome: "₹18 lakh first-quarter revenue across 40 dark stores with 62% gross margin.",
    },
  },
  {
    id: "festive-gifting",
    name: "Festive Gifting Box Launch",
    tagline: "Design a luxury Diwali, Raksha Bandhan, or Corporate Gifting hamper with complete packaging, product mix, and B2B/D2C campaign.",
    badge: "High-AOV Track",
    heroImg: `${LIB}/site/corporate-gifting-jar-hamper.webp`,
    overview:
      "Festive gifting and corporate hampers represent massive seasonal revenue spikes for Eat Better. Create a distinctive gifting experience that replaces traditional sugar-laden mithai boxes with premium, artisanal clean-label sweets and savory snacks.",
    scopeItems: [
      "Curated hamper product mix (balancing artisanal laddoos, roasted namkeens, and signature nuts)",
      "Unboxing architecture: rigid keepsake box, sustainable inserts, brass diya/accessory, and custom greeting card",
      "Tiered pricing structure: Entry Corporate (₹499), Royal Festive (₹999), and Luxury Signature (₹1,499)",
      "B2B corporate sales outreach strategy (procurement timelines, bulk discounts, custom branding)",
      "D2C early-bird preorder campaign and festive gifting social rollout",
      "Seasonal logistics and demand forecasting from the Jaipur kitchen facility",
    ],
    deliverables: [
      "Hamper Architecture & Product Mix Matrix",
      "Packaging specification and unboxing journey blueprint",
      "B2B corporate sales pitch one-pager & pricing tier card",
      "D2C Festive Gifting digital ad campaign & influencer seeding plan",
      "Festive production schedule & inventory buffer plan",
    ],
    exampleInitiative: {
      title: "Utsav Royal Heritage Hamper (Diwali 2026 Edition)",
      description: "A dual-tier rigid festive trunk featuring 12 Hazelnut & Almond Laddoos, 2 glass jars of slow-roasted trail mix, and an artisanal brass diya from Jaipur artisans.",
      targetMarket: "Corporate HR heads and affluent families seeking healthy, elegant gifting.",
      expectedOutcome: "₹1.2 crore seasonal gross revenue with ₹1,200 Average Order Value.",
    },
  },
  {
    id: "brand-campaign",
    name: "Brand Campaign Creation",
    tagline: "Build a complete 360° marketing campaign for an Eat Better flagship product: tagline, 30-day calendar, influencers, and budget.",
    badge: "Marketing Track",
    heroImg: `${LIB}/combos/assorted-laddoo-box-24-hero.webp`,
    overview:
      "Transform consumer perception and make healthy snacking irresistible. Build an integrated marketing campaign for a hero Eat Better SKU (such as the Assorted Laddoo Box) that breaks through the noise of legacy sweet brands with punchy storytelling, relatable hooks, and measurable performance.",
    scopeItems: [
      "Campaign big idea, hero tagline, and cultural insight",
      "Audience segmentation: fitness enthusiasts, busy parents, and sweet-tooth switchers",
      "30-day cross-platform content calendar (Instagram, LinkedIn, YouTube Shorts)",
      "Influencer collaboration blueprint: dietitians, fitness creators, and food lifestyle vloggers",
      "Sample creative scripts, visual moodboards, and ad copy variations",
      "₹10 Lakh launch budget allocation across performance ads, creator seeding, and PR",
    ],
    deliverables: [
      "Campaign Concept & Brand Voice Guide",
      "30-Day Multi-Pillar Social Content Calendar",
      "Tiered Influencer Outreach & Gifting Strategy",
      "3 Sample Ad Creative Storyboards (Hook, Hold, Call-to-Action)",
      "Paid Media & Performance Marketing Budget Breakdown",
    ],
    exampleInitiative: {
      title: "'Sweet Without The Cheat' (Assorted Laddoo Campaign)",
      description: "A witty, high-energy campaign exposing the hidden palm oil and 60% white sugar in traditional laddoos, celebrating Eat Better's zero-refined-sugar craftsmanship.",
      targetMarket: "Urban young adults craving authentic Indian sweets without the post-sugar crash.",
      expectedOutcome: "3.2x ROAS on Meta ads, 45,000 website visits, and 25% lift in first-time laddoo buyers.",
    },
  },
  {
    id: "consumer-insights",
    name: "Consumer Insight Report",
    tagline: "Survey 20 to 30 consumers on snacking habits, identify friction points, and deliver strategic recommendations in an executive deck.",
    badge: "Research Track",
    heroImg: `${LIB}/namkeen/assorted-namkeen-combo-of-4-hero.webp`,
    overview:
      "Deeply understand why consumers snack, what triggers guilt, what makes them read nutrition labels, and what stops them from buying healthy alternatives. Execute a primary research survey of 20-30 consumers and translate qualitative and quantitative data into high-conviction product roadmaps.",
    scopeItems: [
      "10-question consumer research survey design covering snack frequency, budget, ingredients, and brand trust",
      "Sample surveying of 20-30 real respondents across diverse age and professional groups",
      "Data synthesis: top snack occasions (e.g. 5 PM office slump, midnight streaming, travel)",
      "Friction point identification: taste skepticism, price sensitivity, portion sizes, or accessibility",
      "Competitive benchmarking against conventional vs health-forward snacking brands",
      "Executive recommendation deck with 4 strategic product and marketing pivots for Eat Better",
    ],
    deliverables: [
      "Survey Questionnaire & Raw Response Data Summary",
      "Consumer Persona Archetypes & Snacking Occasion Map",
      "Key Quantitative Charts & Qualitative Friction Takeaways",
      "Competitive Perceptual Positioning Matrix",
      "Actionable Executive Strategy Recommendations Deck",
    ],
    exampleInitiative: {
      title: "'The 5 PM Snack Conundrum': Urban Snacking Habits Report",
      description: "A primary research study of 28 corporate professionals examining the trade-off between convenience, taste, and clean nutritional profiles.",
      targetMarket: "Working professionals aged 22-45 in Delhi NCR, Mumbai, and Bengaluru.",
      expectedOutcome: "Uncovered unmet demand for single-serve savory crunch packs under ₹99 for office desks.",
    },
  },
  {
    id: "social-content-pack",
    name: "Social Media Content Pack",
    tagline: "Create 5 high-converting posts or reels for Eat Better with complete captions, audio strategy, visual direction, and rationale.",
    badge: "Creative Track",
    heroImg: `${LIB}/site/home-banner-hampers-sold-out.webp`,
    overview:
      "Content is the engine of D2C organic discovery and community building. Develop 5 publication-ready social media assets that educate, entertain, and convert prospective customers into brand advocates by highlighting Eat Better's authentic Jaipur kitchen and clean ingredients.",
    scopeItems: [
      "5 distinct content formats: Ingredient Comparison Reel, 4 PM Snack Swap Carousel, Behind-The-Scenes Kitchen Tour, Customer Review Spotlight, and Interactive Story Poll",
      "Full scriptwriting, on-screen text overlays, and sound/audio recommendations for reels",
      "Compelling storytelling captions with strong call-to-actions (CTAs) and targeted hashtags",
      "Posting schedule, platform distribution (Instagram Reels vs LinkedIn), and optimal timing",
      "Strategic rationale: behavioral psychology and consumer hook behind each piece of content",
    ],
    deliverables: [
      "5 Complete Social Content Briefs (Visual concept, script, text overlay, audio)",
      "Ready-to-publish Captions, CTAs, and Hashtag Architecture",
      "Weekly Posting Cadence & Community Engagement Playbook",
      "Behavioral Rationale & Hook Analysis for each post",
      "KPI Measurement Framework (Saves, Shares, CTR, Profile Visits)",
    ],
    exampleInitiative: {
      title: "'No Sugarcoating' 5-Part Content Series",
      description: "A high-retention video series comparing the ingredients of mass-market snacks vs Eat Better's wholesome recipes in real time.",
      targetMarket: "Instagram health & wellness followers, active online shoppers, and fitness enthusiasts.",
      expectedOutcome: "18% average reel engagement rate, 3,500+ saves, and consistent D2C website referral traffic.",
    },
  },
];

export const GTM_BLUEPRINT_PILLARS = [
  {
    number: "01",
    title: "Product & Market Opportunity",
    subtitle: "Define the core snacking friction and your clean-label solution",
    points: [
      "Identify the specific consumer persona (e.g. 28-year-old software engineer seeking guilt-free 4 PM energy).",
      "Define target launch cities and high-demand pin codes.",
      "Articulate your unique clean-label value proposition against conventional sugar-loaded alternatives.",
    ],
  },
  {
    number: "02",
    title: "Formulation & Packaging Specification",
    subtitle: "Clean ingredient Bill of Materials (BOM) and pack design",
    points: [
      "Specify exact whole food ingredients (dates, almonds, seeds, quinoa, millets). 100% free from refined sugar, artificial preservatives, and palm oil.",
      "Determine net pack weight (e.g. 45g single pack or 350g combo box).",
      "Select sustainable, barrier-certified packaging material (nitrogen-flushed recyclable foil).",
    ],
  },
  {
    number: "03",
    title: "Pricing Architecture & Unit Economics",
    subtitle: "Rigorously model margins and channel feasibility",
    points: [
      "Calculate raw ingredient BOM and packaging cost per unit.",
      "Set Maximum Retail Price (MRP) and evaluate price-per-gram (₹/g benchmark: ₹0.67–₹1.55/g).",
      "Target a Gross Margin >= 55% to comfortably absorb quick-commerce platform commissions (20-25%) and shipping costs.",
    ],
  },
  {
    number: "04",
    title: "Omnichannel Distribution Engine",
    subtitle: "Channel split across D2C, Q-Commerce, Amazon, and Corporate",
    points: [
      "Allocate volume split: Quick Commerce (Blinkit/Zepto/Instamart) for 10-minute impulse discovery.",
      "D2C Webstore (eatbetterco.com) for high-AOV bundles and subscriptions.",
      "Amazon & Corporate Gifting for high-volume nationwide reach.",
    ],
  },
  {
    number: "05",
    title: "360-Degree Marketing & Launch Campaign",
    subtitle: "High-retention storytelling, influencer seeding, and paid media",
    points: [
      "Craft a memorable campaign tagline and hook (e.g. #SnackSmartAt4).",
      "Plan a 30-day launch calendar: Teaser phase, Influencer unboxing seeding, and Meta performance ads.",
      "Allocate a practical marketing budget across paid acquisition, creator gifting, and sampling.",
    ],
  },
  {
    number: "06",
    title: "Financial Forecast & Scalability Milestones",
    subtitle: "Monthly volume targets, gross revenue, and break-even timeline",
    points: [
      "Forecast target monthly units (Eat Better fulfills ~2 lakh orders monthly across channels).",
      "Project gross monthly revenue, net contribution after delivery, and break-even month.",
      "Identify 3 operational risk factors and contingency mitigation strategies.",
    ],
  },
];

export interface ToolCategory {
  category: string;
  badge: string;
  description: string;
  tools: {
    name: string;
    description: string;
    highlight: string;
    badge?: string;
  }[];
}

export const RECOMMENDED_TOOLS_TASK_A: ToolCategory[] = [
  {
    category: "Presentation & Pitch Decks",
    badge: "Recommended Format",
    description: "Build a polished, 10 to 15-slide executive presentation deck to showcase your strategy.",
    tools: [
      {
        name: "Google Slides",
        description: "Free, web-based, collaborative slide deck tool with seamless PDF export and cloud sharing.",
        highlight: "Best for collaborative work and simple sharing with evaluators.",
        badge: "Most Popular",
      },
      {
        name: "Canva",
        description: "Thousands of modern pitch deck templates, product mockups, typography, and graphic elements.",
        highlight: "Best for high visual impact, beautiful packaging visuals, and campaign mockups.",
        badge: "Design Favorite",
      },
      {
        name: "Gamma.app / Pitch.com",
        description: "AI-accelerated deck builders that generate clean, modern layouts and executive tables in minutes.",
        highlight: "Best for ultra-fast formatting and sleek interactive web presentations.",
      },
      {
        name: "Microsoft PowerPoint",
        description: "The classic corporate presentation standard with robust chart and animation capabilities.",
        highlight: "Best for traditional desktop offline editing.",
      },
    ],
  },
  {
    category: "Financial Modeling & Unit Economics",
    badge: "Quantitative Rigor",
    description: "Construct your Bill of Materials (BOM), pricing calculator, and 6-month sales forecast tables.",
    tools: [
      {
        name: "Google Sheets",
        description: "Cloud spreadsheet with dynamic formulas for gross margin, contribution per unit, and AOV charts.",
        highlight: "Create your unit economics model and embed live charts into your deck.",
        badge: "Essential",
      },
      {
        name: "Microsoft Excel",
        description: "Powerful financial workbook software for deep P&L modeling and scenario planning.",
        highlight: "Ideal for detailed margin sensitivity tables across channels.",
      },
    ],
  },
  {
    category: "Strategy Documents & Proposals",
    badge: "Written Dossier",
    description: "If submitting an executive whitepaper or written proposal instead of or alongside a slide deck.",
    tools: [
      {
        name: "Notion",
        description: "All-in-one modular workspace with database tables, toggle sections, and clean public web links.",
        highlight: "Best for building a comprehensive interactive product wiki or strategy document.",
        badge: "Modern Standard",
      },
      {
        name: "Google Docs",
        description: "Standard formal business proposal editor with real-time commenting and PDF download.",
        highlight: "Clean format for standard written internship report submissions.",
      },
    ],
  },
  {
    category: "Visual Mockups & Campaign Creatives",
    badge: "Visual Polish",
    description: "Bring your product packaging, social media ads, and festive hampers to life visually.",
    tools: [
      {
        name: "Canva Pro / Free",
        description: "Drag-and-drop packaging box mockups, Instagram reel covers, and promotional banners.",
        highlight: "Instant 3D mockup generator for pouches, jars, and gift boxes.",
      },
      {
        name: "Figma",
        description: "Professional UI and visual design canvas for custom packaging layouts and digital ad sets.",
        highlight: "Complete layout freedom for precision graphic assets.",
      },
      {
        name: "Adobe Express",
        description: "Quick asset creation, background removal, and branded campaign templates.",
        highlight: "High quality image editing and typography.",
      },
    ],
  },
  {
    category: "Consumer Surveys & Research (Track 4)",
    badge: "For Track 4",
    description: "Design and circulate your 10-question healthy snacking questionnaire to 20–30 real consumers.",
    tools: [
      {
        name: "Google Forms",
        description: "Free, zero friction, instantly generates visual summary pie charts and Google Sheets integration.",
        highlight: "Fastest way to collect 25+ survey responses.",
        badge: "Recommended",
      },
      {
        name: "Tally.so / Typeform",
        description: "Beautiful, conversational one-question-at-a-time forms with significantly higher completion rates.",
        highlight: "Best user experience for mobile respondents.",
      },
    ],
  },
];

export const EVALUATION_RUBRIC = [
  {
    category: "Clean-Label & Brand Authenticity",
    weight: "25%",
    description: "Strict adherence to zero refined sugar, zero preservatives, transparent ingredient lists, and authentic Eat Better storytelling.",
    benchmark: "Does this product genuinely respect Eat Better's Jaipur heritage and clean-label manifesto?",
  },
  {
    category: "Financial Rigor & Unit Economics",
    weight: "25%",
    description: "Realistic Bill of Materials (BOM), packaging, shipping, commission buffers, gross margin (>55%), and viable price-per-gram calculation.",
    benchmark: "Are the unit economics sustainable after factoring in quick-commerce margins (20-25%) and delivery costs?",
  },
  {
    category: "Go-To-Market & Channel Clarity",
    weight: "25%",
    description: "Clear customer persona, logical channel mix, quick-commerce dark store readiness, and differentiated launch campaign tactics.",
    benchmark: "Is the launch strategy actionable, targeted, and backed by consumer snacking psychology?",
  },
  {
    category: "Creativity & Execution Quality",
    weight: "25%",
    description: "Originality of the initiative, visual presentation, cohesive copywriting, and comprehensive completeness of the submission.",
    benchmark: "Is the proposal polished enough to present to the founders and executive leadership?",
  },
];

export const TAKEAWAY =
  "A great business strategy balances bold product innovation with disciplined financial mechanics. When clean ingredients, sound unit economics, and targeted distribution align, consumer brands scale sustainably.";
