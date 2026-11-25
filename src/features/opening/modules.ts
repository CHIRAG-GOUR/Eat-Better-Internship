/**
 * The internship at a glance: five modules, their chapters and experiential activities. Chapter titles and the one-line
 * info come from the chapters themselves (their subtitles) and the activities' own descriptions.
 */
export type ModuleInfo = {
  n: string;
  word: string;
  title: string;
  summary: string;
  color: string;
  chapters: { id: string; title: string; info: string }[];
  activity?: { href: string; title: string; info: string };
};

export const MODULES: ModuleInfo[] = [
  {
    n: "01",
    word: "Discover",
    title: "The Eat Better Story & Product Line",
    summary: "Meet the company: how it started, what it stands for, the problem it solves, the snacks it makes and how every batch is kept safe.",
    color: "#FF5C00",
    chapters: [
      { id: "1.1", title: "About the Company", info: "The story of Eat Better Co, what the brand stands for, what it makes, and how its internet-first business model works." },
      { id: "1.2", title: "Vision, Mission and Values", info: "Where Eat Better wants to go, what it does every day to get there — and the values behind each decision." },
      { id: "1.3", title: "Origin Story and Founders", info: "From a family's snack problem to a national brand — one careful step at a time." },
      { id: "1.4", title: "Problem and Solution Fit", info: "A real problem, a product that solves it — and customers who keep coming back." },
      { id: "1.5", title: "The Product Portfolio", info: "Laddoos, namkeens, nut mixes and gift boxes — how one brand fits a family's whole year." },
      { id: "1.6", title: "Quality, Packaging and Compliance", info: "How a food brand earns trust — batch by batch, label by label, pack by pack." },
    ],
    activity: { href: "/experiential-activity-1", title: "Product Innovation Lab", info: "Build a better-for-you snack, run the six quality checkpoints, design a compliant label and download your project report." },
  },
  {
    n: "02",
    word: "Create",
    title: "Brand Creatives & Marketing",
    summary: "How the brand looks, sounds and speaks: identity, digital marketing and community, positioning, and the Shark Tank India moment.",
    color: "#C8643B",
    chapters: [
      { id: "2.1", title: "Brand Identity, Visuals and Tone", info: "A name, a logo, colours, a pack and a voice — and how together they make people trust a snack." },
      { id: "2.2", title: "Digital Marketing and Community Building", info: "Stories, reviews, community — and a great first order that earns the second." },
      { id: "2.3", title: "Positioning and Target Audience", info: "Who Eat Better is for, where it stands, and why customers choose it." },
      { id: "2.4", title: "Shark Tank India, PR and Campaigns", info: "National TV, funding news, festive hampers and corporate clients — attention the brand earned." },
    ],
    activity: { href: "/experiential-activity-2", title: "Brand Studio", info: "Study the Eat Better brand, design a pack and an honest Instagram creative, test and launch a simulated Meta Ads campaign, and download your campaign kit." },
  },
  {
    n: "03",
    word: "Operate",
    title: "Business Model Canvas & Distribution",
    summary: "The business on one page: customers, resources and partners, money in and out, and how a snack travels from the kitchen to you.",
    color: "#7D7F4A",
    chapters: [
      { id: "3.1", title: "Customers, Promise and Reach", info: "Customer Segments, Value Propositions, Channels and Customer Relationships — the people side of the canvas." },
      { id: "3.2", title: "Key Resources, Activities and Partners", info: "What Eat Better needs, what it does every day, and who it depends on to keep its promise." },
      { id: "3.3", title: "Revenue, Costs and Profit", info: "Revenue Streams, Cost Structure and Profitability — how the money comes in, where it goes, and what one order earns." },
      { id: "3.4", title: "Distribution Network and Logistics", info: "Four ways a snack reaches you, and the work it takes to get it there fresh, fast and whole." },
    ],
    activity: { href: "/experiential-activity-3", title: "Distribution Command Centre", info: "Run Eat Better's distribution centre — channels, receiving, allocation, disruptions and a final mission — and download your strategy report." },
  },
  {
    n: "04",
    word: "Strategize",
    title: "Business Strategy, Financials & Competitive Analysis",
    summary: "Think like a decision-maker: pricing and financial performance, the competitive landscape, and the plan to grow.",
    color: "#B8862F",
    chapters: [
      { id: "4.1", title: "Pricing and Financial Performance", info: "What a gram of Eat Better costs, why it costs that, and what the reported numbers say about growth." },
      { id: "4.2", title: "Competitive Landscape", info: "Who else sells snacks to the same people, what each one is good at, and where Eat Better stands among them." },
      { id: "4.3", title: "Future Growth Strategy and Scalability", info: "How Eat Better plans to grow after its Pre-Series A round: four operational pillars." },
    ],
    activity: { href: "/experiential-activity-4", title: "Build the Eat Better Business", info: "Pricing, unit economics, financial scale, competitive positioning, budget allocation and an investor pitch simulation — then download your strategy report." },
  },
  {
    n: "05",
    word: "Build",
    title: "Final Capstone Projects",
    summary: "Put it all together: a go-to-market project of your own and an e-commerce storefront for Eat Better.",
    color: "#7A1E12",
    chapters: [
      { id: "5.1", title: "Capstone Task A: Project Creation", info: "Develop a 360-degree go-to-market strategy or commercial expansion proposal for Eat Better Co." },
      { id: "5.2", title: "Capstone Task B: E-Commerce Storefront", info: "Design and develop a complete, visually appealing e-commerce webpage for your proposed Eat Better product or category expansion." },
    ],
  },
];
