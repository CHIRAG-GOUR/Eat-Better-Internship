/**
 * Chapter 5.2 — Task B: E-Commerce Storefront Development.
 * Interactive Storefront Architecture, Packaging Design Guide, and D2C Toolkit for Eat Better Co.
 */

export const CHAPTER = {
  module: "Module 5 · Final Capstone Projects",
  number: "5.2",
  title: ["Capstone Task B:", "E-Commerce Storefront Development"] as [string, string],
  subtitle:
    "Design and develop a complete, visually appealing e-commerce webpage for your proposed Eat Better product or category expansion.",
  objective:
    "Building upon Task A, design and develop a complete, visually appealing e-commerce webpage for the proposed Eat Better product or category expansion. Create original product packaging and product designs, showcase the products with descriptions and pricing, and build a branded shopping experience that reflects Eat Better's identity. The webpage should include product listings, product detail sections, shopping cart functionality, and a clear purchase journey, demonstrating how the proposed product would be presented and sold to customers online.",
};

export const LIB = "/brand/library";

export interface StorefrontArchetype {
  id: string;
  title: string;
  tagline: string;
  badge: string;
  idealFor: string;
  heroImg: string;
  description: string;
  keySections: string[];
  conversionFeature: string;
}

export const STOREFRONT_ARCHETYPES: StorefrontArchetype[] = [
  {
    id: "product-launch-pdp",
    title: "Breakout Product Launch Landing Page",
    tagline: "Dedicated, high-converting product detail page (PDP) for a hero snack variant.",
    badge: "Hero Innovation",
    idealFor: "Interns who designed a new healthy sweet or snack variant in Task A.",
    heroImg: "/chapter-5-2/storefront-product-launch.jpg",
    description:
      "A conversion-focused product detail page (PDP) highlighting clean ingredients, pack sizes, and instant checkout.",
    keySections: [
      "Hero section with 3D stand-up pouch render & flavor badges",
      "Clean ingredient transparency table (0% Refined Sugar, 100% Real Food)",
      "Pack size selector (Single, Pack of 4, Value Box) & Slide-over cart",
    ],
    conversionFeature: "Subscribe & Save 15% recurring delivery toggle + Sticky Add-to-Cart.",
  },
  {
    id: "gifting-hamper-store",
    title: "Festive & Corporate Gifting Boutique",
    tagline: "Luxury storefront for Diwali, Rakhi, and corporate gifting hampers.",
    badge: "High AOV Track",
    idealFor: "Interns who developed the Festive Gifting Hamper in Task A.",
    heroImg: "/chapter-5-2/storefront-gifting-boutique.jpg",
    description:
      "A luxury boutique highlighting gold-embossed packaging, custom hamper builders, and bulk inquiry workflows.",
    keySections: [
      "Festive hamper unboxing hero & lifestyle flat-lay",
      "'Build Your Own Hamper' custom product selector",
      "Tiered corporate pricing table (Save 20% on 50+ boxes) & greeting notes",
    ],
    conversionFeature: "Live bulk discount tier calculator for corporate HR procurement.",
  },
  {
    id: "category-collection",
    title: "Full Category Collection & Webshop",
    tagline: "Multi-product category showcase connecting sweet and savory lines.",
    badge: "Catalog Expansion",
    idealFor: "Interns launching a full product family or city-specific regional catalog.",
    heroImg: "/chapter-5-2/storefront-category-collection.jpg",
    description:
      "A full e-commerce shop catalog with dietary filters, quick-add cards, and impulse cart cross-sells.",
    keySections: [
      "Brand storytelling hero: Jaipur kitchen & clean ingredient pledge",
      "Filterable catalog grid with dietary tags (Gluten-Free, Vegan, Zero Sugar)",
      "Instant 'Quick Add to Cart' & cross-sell pairings drawer",
    ],
    conversionFeature: "'Frequently Bought Together' bundle widget with one-click cart addition.",
  },
];

export interface StorefrontPillar {
  number: string;
  title: string;
  subtitle: string;
  badge: string;
  requirements: string[];
  eatBetterGuidelines: string;
}

export const STOREFRONT_PILLARS: StorefrontPillar[] = [
  {
    number: "01",
    title: "Original Packaging & Product Designs",
    subtitle: "Authentic pouch & box renders communicating clean food",
    badge: "Visual Assets",
    requirements: [
      "Front-of-pack mockup with Eat Better logo, product name, and net weight.",
      "Clear callout badges: '0% Refined Sugar', '100% Real Ingredients', 'No Palm Oil'.",
      "Sensory food photography showing the crunchy roasted or date laddoo texture.",
    ],
    eatBetterGuidelines:
      "Use warm earthy tones, modern typography, and clear windows showing real ingredients.",
  },
  {
    number: "02",
    title: "Product Listings & Detail Sections (PDP)",
    subtitle: "Clear product anatomy turning scrollers into buyers",
    badge: "Merchandising",
    requirements: [
      "Compelling title, sensory tagline, and transparent MRP vs discounted price.",
      "Pack-size selector (Trial Pack ₹149, Pack of 4 ₹499, Box ₹899).",
      "Nutritional facts per 100g and Jaipur mother-led kitchen origin story.",
    ],
    eatBetterGuidelines:
      "Lead with irresistible taste first, then validate with clean health and zero sugar.",
  },
  {
    number: "03",
    title: "Shopping Cart & Purchase Journey",
    subtitle: "Frictionless checkout path with zero conversion drops",
    badge: "UX & Conversion",
    requirements: [
      "Slide-over cart drawer with quantity counters and live subtotal.",
      "Dynamic Free Delivery threshold meter (e.g. 'Add ₹99 for FREE Delivery').",
      "Clear 'Proceed to Checkout' CTA leading to simulated payment.",
    ],
    eatBetterGuidelines:
      "Keep cart clean and transparent with zero hidden fees and clear 24h dispatch promises.",
  },
  {
    number: "04",
    title: "Branded Identity & Trust Architecture",
    subtitle: "Institutional credibility through authentic proof points",
    badge: "Brand Identity",
    requirements: [
      "Header with Eat Better logo, category navigation, search, and cart counter.",
      "Trust badge bar: 'Shark Tank India', '100% Clean Label', 'FSSAI Certified'.",
      "Customer review carousel with real ratings and brand footer.",
    ],
    eatBetterGuidelines:
      "Use Eat Better's palette: Cocoa (#2F1C1A), Orange (#FF5C00), Haldi (#FED300), and Cream (#FFF7F0).",
  },
];

export interface BrandColorToken {
  name: string;
  hex: string;
  usage: string;
}

export const BRAND_TOKENS: BrandColorToken[] = [
  { name: "Jaipur Cocoa", hex: "#2F1C1A", usage: "Headings, primary text & dark buttons" },
  { name: "Sunset Orange", hex: "#FF5C00", usage: "Primary CTAs, add-to-cart & accents" },
  { name: "Haldi Gold", hex: "#FED300", usage: "Highlight ribbons, star ratings & badges" },
  { name: "Warm Cream", hex: "#FFF7F0", usage: "Page background & card surfaces" },
  { name: "Peach Accent", hex: "#FFE5D4", usage: "Subtle hover states & pills" },
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

export const RECOMMENDED_TOOLS_TASK_B: ToolCategory[] = [
  {
    category: "No-Code Storefront Builders",
    badge: "Live Web Sites",
    description: "Build an interactive, clickable e-commerce webpage without code.",
    tools: [
      {
        id: "shopify",
        name: "Shopify Storefront",
        description: "Leading D2C platform with built-in product pages and cart.",
        highlight: "Industry standard with free partner trial.",
        badge: "Industry Standard",
      },
      {
        id: "framer",
        name: "Framer",
        description: "Visual builder for silky-smooth responsive e-commerce landing pages.",
        highlight: "Best for award-winning micro-interactions.",
        badge: "Top Design Choice",
      },
      {
        id: "webflow",
        name: "Webflow / Wix",
        description: "Pixel-perfect visual design with responsive layouts and cart drawers.",
        highlight: "Full control over desktop and mobile breakpoints.",
      },
    ],
  },
  {
    category: "UI/UX & Packaging Mockups",
    badge: "Design Assets",
    description: "Design screens or generate realistic 3D packaging renders.",
    tools: [
      {
        id: "figma",
        name: "Figma",
        description: "Industry UI standard for interactive clickable web prototypes.",
        highlight: "Share prototype link directly with evaluators.",
        badge: "Most Popular",
      },
      {
        id: "placeit",
        name: "Placeit / Smartmockups",
        description: "Instant 3D packaging mockup renders for snack pouches and boxes.",
        highlight: "Realistic packaging on studio flatlays.",
      },
      {
        id: "canva",
        name: "Canva Websites",
        description: "Drag-and-drop web storefront builder with free hosting domain.",
        highlight: "Fastest single-page visual setup.",
      },
    ],
  },
  {
    category: "Submission & Sharing",
    badge: "Deliverables",
    description: "Publish your storefront and submit public link into the portal.",
    tools: [
      {
        id: "live-url",
        name: "Live Web Link",
        description: "Public URL of your published store (Shopify, Framer, Webflow, Canva).",
        highlight: "Directly interactive for evaluators.",
        badge: "Recommended",
      },
      {
        id: "figma",
        name: "Figma Public Link",
        description: "Shareable Figma prototype link with public viewing enabled.",
        highlight: "Best for UX & mobile flow reviews.",
      },
    ],
  },
];

export const SUBMISSION_CHECKLIST_TASK_B = [
  {
    id: "check-packaging",
    label: "Original Product Packaging & Renders",
    desc: "Original mockups created with Eat Better branding, clean callouts, and net weight.",
  },
  {
    id: "check-listings",
    label: "Product Listings & Pricing Anatomy",
    desc: "Clear product title, sensory description, MRP, selling price, and pack selector.",
  },
  {
    id: "check-pdp",
    label: "Detailed Product Information Sections",
    desc: "Nutritional table per 100g, 100% clean ingredients, and Jaipur origin story.",
  },
  {
    id: "check-cart",
    label: "Shopping Cart & Purchase Flow",
    desc: "Cart drawer with item counters, free shipping meter, and checkout CTA.",
  },
  {
    id: "check-link",
    label: "Publicly Accessible Link",
    desc: "Live website link or Figma prototype with public view permissions enabled.",
  },
];

export const TAKEAWAY_5_2 = {
  title: "Capstone Completed: You Built the Eat Better D2C Future",
  quote:
    "A great product idea only becomes a thriving enterprise when backed by disciplined unit economics (Task A) and a magnetic digital storefront (Task B). You have mastered the full lifecycle of modern Indian D2C.",
  author: "Eat Better Co × Skillizee Internship Board",
};
