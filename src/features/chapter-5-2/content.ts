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
    tagline: "A dedicated, conversion-focused product page for a hero snack variant.",
    badge: "Hero Innovation",
    idealFor: "Interns who designed a specific healthy snack or sweet variant in Task A.",
    heroImg: "/chapter-5-2/storefront-product-launch.jpg",
    description:
      "A high-impact direct-to-consumer product detail page (PDP) that sells the problem-solution story: ditching fake 'diet' snacks for 100% wholesome Jaipur-made clean indulgence.",
    keySections: [
      "Dynamic Hero Banner with high-res packaging render, flavor badges & quick 'Add to Cart'",
      "Visual Ingredient Transparency: Macro-breakdown (0g Refined Sugar, 100% Dates & Nuts)",
      "Interactive Pack Selector (Single 45g pouch vs Pack of 6 vs Family Value Tub)",
      "Customer Reviews & Social Proof Wall (Shark Tank feature + 4.8★ verified ratings)",
      "Slide-Over Cart Drawer with dynamic Free Shipping progress bar",
    ],
    conversionFeature: "Subscribe & Save 15% recurring delivery toggle + Quick-Buy sticky bar on mobile.",
  },
  {
    id: "gifting-hamper-store",
    title: "Festive & Corporate Gifting Boutique",
    tagline: "A premium luxury storefront for Diwali, Rakhi, and corporate hampers.",
    badge: "High AOV Track",
    idealFor: "Interns who developed the Festive Gifting Hamper in Task A.",
    heroImg: "/chapter-5-2/storefront-gifting-boutique.jpg",
    description:
      "An elegant digital boutique highlighting festive craftsmanship, gold-embossed packaging, personalized gift notes, and corporate bulk ordering inquiry workflows.",
    keySections: [
      "Atmospheric Gifting Hero with lifestyle hamper flat-lay and festive countdown",
      "'Build Your Own Hamper' custom product bundle selector",
      "Corporate Bulk Order Tiered Pricing Calculator (50 to 5,000+ hampers)",
      "Unboxing Experience Preview (Video / 3D packaging open carousel)",
      "Express Multi-Address Checkout for corporate gift dispatch",
    ],
    conversionFeature: "Live Bulk Discount Tier table (Save 10% on 20+ boxes, 20% on 100+ boxes).",
  },
  {
    id: "category-collection",
    title: "Full Category Collection & Webshop",
    tagline: "A multi-product category showcase connecting sweet and savory lines.",
    badge: "Catalog Expansion",
    idealFor: "Interns launching a full product family or city-specific regional catalog.",
    heroImg: "/chapter-5-2/storefront-category-collection.jpg",
    description:
      "A rich e-commerce catalog layout with smart category filters (Guilt-Free Sweets, Savory Crunch, Protein Seeds, Festive Hampers), quick-view modals, and cart cross-sells.",
    keySections: [
      "Brand Storytelling Hero highlighting Eat Better's Jaipur Kitchen heritage",
      "Filterable Product Grid with dietary tags (Gluten-Free, Vegan, Diabetic-Friendly)",
      "Quick Add-to-Cart directly from product grid cards",
      "Cross-Sell 'Snack Pairings' recommendation engine in the cart drawer",
      "Transparent Shipping, Returns & Clean Food Lab Test Certificates",
    ],
    conversionFeature: "'Frequently Bought Together' bundle widget with one-click 1-second add to cart.",
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
    subtitle: "Create authentic product renders that communicate clean ingredients instantly",
    badge: "Visual Assets",
    requirements: [
      "Front-of-pack mockup featuring the Eat Better logo, product name, and net weight.",
      "Clear callout badges: '0% Refined Sugar', '100% Real Ingredients', 'No Palm Oil'.",
      "Sensory food photography or render showing the actual snack texture (e.g. crunchy roasted seeds, soft date laddoo).",
      "Back-of-pack or sidebar clean ingredient list with zero artificial chemicals.",
    ],
    eatBetterGuidelines:
      "Keep packaging warm, inviting, and premium. Use Eat Better's earthy tones, playful modern typography, and transparent windows where customers can see the real food inside.",
  },
  {
    number: "02",
    title: "Product Listings & Detail Sections (PDP)",
    subtitle: "Turn casual scrollers into confident buyers through clear product anatomy",
    badge: "Merchandising",
    requirements: [
      "Compelling product title, punchy tagline, and short benefit-driven description.",
      "Transparent pricing architecture: MRP, discounted selling price, and ₹/gram benchmark.",
      "Multi-pack size selector (e.g. Trial Pack ₹149, Pack of 4 ₹499, Party Box ₹899).",
      "Nutritional information table per 100g (Calories, Protein, Fiber, Healthy Fats).",
      "Origin story: 'Handmade with love in our mother-led Jaipur kitchen'.",
    ],
    eatBetterGuidelines:
      "Emphasize taste first, health second. Indian consumers want snacks that taste indulgent; reassure them that this delicious flavor comes naturally without refined sugar.",
  },
  {
    number: "03",
    title: "Shopping Cart & Purchase Journey",
    subtitle: "Frictionless path from discovery to checkout with zero conversion leakages",
    badge: "UX & Conversion",
    requirements: [
      "Functional slide-over or dedicated Cart page displaying item names, quantity counter, and subtotal.",
      "Dynamic Free Delivery threshold meter (e.g. 'Add ₹120 more for FREE Express Shipping').",
      "Impulse cross-sell item recommendations inside the cart drawer (AOV booster).",
      "Clear coupon / discount code input box.",
      "Prominent 'Proceed to Checkout' call-to-action button leading to simulated order summary.",
    ],
    eatBetterGuidelines:
      "Keep the cart clean and transparent. No surprise hidden charges at checkout. Clearly state delivery speed: 'Dispatched in 24 hours · Arrives in 2-4 days'.",
  },
  {
    number: "04",
    title: "Branded Experience & Trust Architecture",
    subtitle: "Reassure new visitors with institutional credibility and authentic social proof",
    badge: "Brand Identity",
    requirements: [
      "Header navigation with Eat Better brand logo, category links, search icon, and live cart badge.",
      "Trust badge bar: 'Featured on Shark Tank India', '100% Clean Ingredients', 'FSSAI Certified'.",
      "Social proof carousel with verified customer ratings and real snack photos.",
      "Brand footer with quick links, newsletter signup for 10% off, and Jaipur kitchen address.",
    ],
    eatBetterGuidelines:
      "Adopt Eat Better's signature color palette: Cocoa (`#2F1C1A`), Sunset Orange (`#FF5C00`), Haldi Gold (`#FED300`), and Warm Cream (`#FFF7F0`).",
  },
];

export interface BrandColorToken {
  name: string;
  hex: string;
  usage: string;
  contrast: string;
}

export const BRAND_TOKENS: BrandColorToken[] = [
  { name: "Jaipur Cocoa", hex: "#2F1C1A", usage: "Headings, primary body text, dark buttons, borders", contrast: "#FFFFFF" },
  { name: "Sunset Orange", hex: "#FF5C00", usage: "Primary CTAs, add-to-cart buttons, discount badges, accents", contrast: "#FFFFFF" },
  { name: "Haldi Gold", hex: "#FED300", usage: "Highlight ribbons, star ratings, special offer tags", contrast: "#2F1C1A" },
  { name: "Warm Cream", hex: "#FFF7F0", usage: "Page background, card containers, section dividers", contrast: "#2F1C1A" },
  { name: "Peach Accent", hex: "#FFE5D4", usage: "Subtle hover states, feature badges, pill backdrops", contrast: "#2F1C1A" },
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
    category: "No-Code Web & Storefront Builders",
    badge: "Interactive Live Sites",
    description: "Build a real, clickable e-commerce webpage without writing backend code.",
    tools: [
      {
        id: "shopify",
        name: "Shopify Storefront",
        description: "The world's leading D2C e-commerce platform. Use a free trial or Partner account to build a complete store with free themes (Dawn, Sense).",
        highlight: "Industry gold standard for D2C brands. Built-in cart, product detail pages, and checkout.",
        badge: "Industry Standard",
      },
      {
        id: "framer",
        name: "Framer",
        description: "Modern visual website builder that publishes stunning, responsive web pages with silky smooth animations and component variants.",
        highlight: "Best for award-winning visual aesthetics and micro-interactions.",
        badge: "Top Design Choice",
      },
      {
        id: "webflow",
        name: "Webflow E-Commerce",
        description: "Visual web development platform offering pixel-perfect layout control, dynamic CMS collections, and custom cart drawers.",
        highlight: "Full control over responsive breakpoints (Desktop, Tablet, Mobile).",
      },
      {
        id: "wix",
        name: "Wix Studio / Squarespace",
        description: "Beginner-friendly visual website builders with pre-built food & beverage e-commerce store templates.",
        highlight: "Fastest drag-and-drop setup with ready-made shopping cart modules.",
      },
    ],
  },
  {
    category: "UI/UX Design & Prototyping",
    badge: "Interactive Clickable Prototypes",
    description: "Design high-fidelity desktop and mobile wireframes with clickable flows.",
    tools: [
      {
        id: "figma",
        name: "Figma",
        description: "The global standard for product design. Create pixel-perfect e-commerce screens with interactive cart slide-overs and component variants.",
        highlight: "Submit a clickable prototype link where evaluators can test your purchase journey.",
        badge: "Most Popular",
      },
      {
        id: "canva",
        name: "Canva Websites",
        description: "Design and publish a responsive single-page storefront using Canva's rich food e-commerce templates and element library.",
        highlight: "Publish directly to a free Canva web domain with zero coding.",
        badge: "Quick & Easy",
      },
    ],
  },
  {
    category: "Packaging Design & 3D Product Mockups",
    badge: "Original Packaging",
    description: "Generate photorealistic product packaging renders, pouches, and gifting boxes.",
    tools: [
      {
        id: "placeit",
        name: "Placeit / Yellow Images",
        description: "Online 3D mockup generators for stand-up pouches, snack bags, luxury boxes, and jars. Upload your label to see instant 3D previews.",
        highlight: "Instant realistic 3D packaging on studio lighting and kitchen flatlays.",
        badge: "Best Mockups",
      },
      {
        id: "canva",
        name: "Canva Smartmockups",
        description: "Built-in 3D product mockup generator inside Canva. Wrap your packaging artwork around boxes, tins, and snack pouches.",
        highlight: "Free and integrated directly into your Canva workflow.",
      },
      {
        id: "photoshop",
        name: "Adobe Photoshop / Illustrator",
        description: "Professional graphic software for creating packaging dielines, custom vector illustrations, and high-resolution product cutouts.",
        highlight: "Ultimate control over packaging typography, nutrition panels, and color accuracy.",
      },
    ],
  },
  {
    category: "Storefront Submission & Hosting Options",
    badge: "Submission Formats",
    description: "Publish your storefront online and submit the public link into the LMS portal.",
    tools: [
      {
        id: "live-url",
        name: "Live Published Web Link",
        description: "Submit the live URL of your published store (Shopify preview URL, Framer web link, Webflow domain, or Canva website).",
        highlight: "Highest impact format: allows evaluators to interact directly with your live site.",
        badge: "Recommended",
      },
      {
        id: "figma",
        name: "Figma Prototype Public Link",
        description: "Share your Figma prototype link with viewing permissions set to 'Anyone with the link can view and prototype'.",
        highlight: "Ideal for UX-focused interns showcasing mobile and desktop UI flows.",
      },
      {
        id: "google-drive",
        name: "PDF / Video Walkthrough Link",
        description: "Record a short 2-minute Loom/Drive video screen recording walking through your storefront design, or export a multi-page high-res PDF.",
        highlight: "Ensures evaluators see every nuance even without opening design tools.",
      },
    ],
  },
];

export const SUBMISSION_CHECKLIST_TASK_B = [
  {
    id: "check-packaging",
    label: "Original Product Packaging & Renders",
    desc: "Original mockups created for your proposed snack/hamper with Eat Better branding, clean ingredients callouts, and net weight.",
  },
  {
    id: "check-listings",
    label: "Product Listings & Pricing Anatomy",
    desc: "Clear product title, sensory descriptions, MRP, selling price, and pack selector.",
  },
  {
    id: "check-pdp",
    label: "Detailed Product Information Sections",
    desc: "Nutritional facts per 100g, 100% clean ingredient breakdown, and Jaipur kitchen origin story.",
  },
  {
    id: "check-cart",
    label: "Shopping Cart & Purchase Journey",
    desc: "Visible cart drawer or checkout page with item counter, free shipping threshold meter, and clear checkout button.",
  },
  {
    id: "check-brand",
    label: "Eat Better Brand Aesthetic",
    desc: "Consistent use of brand tokens (Cocoa, Orange, Haldi, Warm Cream), trust badges (Shark Tank, FSSAI), and social proof.",
  },
  {
    id: "check-link",
    label: "Publicly Accessible Link",
    desc: "Live website link (Shopify/Framer/Webflow) or Figma prototype link with public view permissions enabled.",
  },
];

export const TAKEAWAY_5_2 = {
  title: "Capstone Completion: You Built the Eat Better D2C Future",
  quote:
    "A great product idea only becomes a thriving enterprise when backed by disciplined unit economics (Task A) and a magnetic digital storefront (Task B). You have mastered the full lifecycle of modern Indian D2C.",
  author: "Eat Better Co × Skillizee Internship Board",
};
