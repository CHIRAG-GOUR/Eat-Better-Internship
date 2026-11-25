/**
 * The internship at a glance: five modules, their chapters and experiential activities (each links to its real route).
 * Chapter titles come from the chapters themselves; module summaries only describe what those chapters cover.
 */
export type ModuleInfo = {
  n: string;
  word: string;
  title: string;
  summary: string;
  color: string;
  chapters: { id: string; title: string }[];
  activity?: { href: string; title: string };
};

export const MODULES: ModuleInfo[] = [
  {
    n: "01",
    word: "Discover",
    title: "The Eat Better Story & Product Line",
    summary: "Meet the company: how it started, what it stands for, the problem it solves, the snacks it makes and how every batch is kept safe.",
    color: "#FF5C00",
    chapters: [
      { id: "1.1", title: "About the Company" },
      { id: "1.2", title: "Vision, Mission and Values" },
      { id: "1.3", title: "Origin Story and Founders" },
      { id: "1.4", title: "Problem and Solution Fit" },
      { id: "1.5", title: "The Product Portfolio" },
      { id: "1.6", title: "Quality, Packaging and Compliance" },
    ],
    activity: { href: "/experiential-activity-1", title: "Product Innovation Lab" },
  },
  {
    n: "02",
    word: "Create",
    title: "Brand Creatives & Marketing",
    summary: "How the brand looks, sounds and speaks: identity, digital marketing and community, positioning, and the Shark Tank India moment.",
    color: "#C8643B",
    chapters: [
      { id: "2.1", title: "Brand Identity, Visuals and Tone" },
      { id: "2.2", title: "Digital Marketing and Community Building" },
      { id: "2.3", title: "Positioning and Target Audience" },
      { id: "2.4", title: "Shark Tank India, PR and Campaigns" },
    ],
    activity: { href: "/experiential-activity-2", title: "Brand Studio" },
  },
  {
    n: "03",
    word: "Operate",
    title: "Business Model Canvas & Distribution",
    summary: "The business on one page: customers, resources and partners, money in and out, and how a snack travels from the kitchen to you.",
    color: "#7D7F4A",
    chapters: [
      { id: "3.1", title: "Customers, Promise and Reach" },
      { id: "3.2", title: "Key Resources, Activities and Partners" },
      { id: "3.3", title: "Revenue, Costs and Profit" },
      { id: "3.4", title: "Distribution Network and Logistics" },
    ],
    activity: { href: "/experiential-activity-3", title: "Distribution Command Centre" },
  },
  {
    n: "04",
    word: "Strategize",
    title: "Business Strategy, Financials & Competitive Analysis",
    summary: "Think like a decision-maker: pricing and financial performance, the competitive landscape, and the plan to grow.",
    color: "#B8862F",
    chapters: [
      { id: "4.1", title: "Pricing and Financial Performance" },
      { id: "4.2", title: "Competitive Landscape" },
      { id: "4.3", title: "Future Growth Strategy and Scalability" },
    ],
    activity: { href: "/experiential-activity-4", title: "Build the Eat Better Business" },
  },
  {
    n: "05",
    word: "Build",
    title: "Final Capstone Projects",
    summary: "Put it all together: a go-to-market project of your own and an e-commerce storefront for Eat Better.",
    color: "#7A1E12",
    chapters: [
      { id: "5.1", title: "Capstone Task A: Project Creation" },
      { id: "5.2", title: "Capstone Task B: E-Commerce Storefront" },
    ],
  },
];
