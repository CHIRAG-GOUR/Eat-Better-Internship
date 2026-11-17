/**
 * Experiential Activity 4 — Build the Eat Better Business: the business model.
 * REPORTED facts (from the Module 4 chapters): the four SKU prices and weights, FY23 ~₹5.5 crore, FY24 ~₹14.7 crore,
 * FY24 net loss ~₹63 lakh, ~2 lakh orders a month, the K-Matrix, the growth pillars and the 50,000 sq. ft. facility.
 * Everything else here (costs, commissions, budgets, capacity, response curves) is HYPOTHETICAL practice data,
 * labelled as such in the interface, the PDF and the CSV.
 */
import { SKUS as SKU41 } from "@/features/chapter-4-1/content";
import { FIN } from "@/features/chapter-4-1/content";
import { KMATRIX, K_PLAYERS, type Level } from "@/features/chapter-4-2/content";
import { PILLARS } from "@/features/chapter-4-3/content";

export { FIN, KMATRIX, K_PLAYERS, PILLARS };
export type { Level };

export const SKUS = SKU41.map((s) => ({ id: s.id, name: s.name, short: s.short, grams: s.grams, price: s.price, tex: s.tex, img: s.img }));
export type SkuId = (typeof SKUS)[number]["id"];
export const ppg = (price: number, grams: number) => price / grams;

/* ── stage 1: unit economics (hypothetical cost sheet) ───────── */
export type Costs = { ingredient: number; packaging: number; production: number }; // ₹ per pack
export const DEFAULT_COSTS: Record<string, Costs> = {
  l24: { ingredient: 120, packaging: 38, production: 30 },
  l42: { ingredient: 215, packaging: 55, production: 48 },
  usb: { ingredient: 250, packaging: 70, production: 60 },
  nam: { ingredient: 80, packaging: 28, production: 26 },
};
export const CHANNEL_FEES = {
  d2c: { name: "Own website", commission: 0.02, perOrder: 70, note: "2% payment fee + ₹70 courier per order" },
  mkt: { name: "Marketplace", commission: 0.18, perOrder: 45, note: "18% commission + ₹45 fulfilment fee" },
  qc: { name: "Quick commerce", commission: 0.25, perOrder: 0, note: "25% platform margin, delivery by the platform" },
} as const;
export type ChannelId = keyof typeof CHANNEL_FEES;

export function unitEconomics(price: number, c: Costs) {
  const cogs = c.ingredient + c.packaging + c.production;
  const gross = price - cogs;
  return { cogs, gross, grossPct: gross / price };
}
/** Contribution of one order of `qty` packs (₹ value `basket`) on a channel after its fees. */
export function contribution(basket: number, cogs: number, ch: ChannelId) {
  const f = CHANNEL_FEES[ch];
  const fees = basket * f.commission + f.perOrder;
  const c = basket - cogs - fees;
  return { fees, contribution: c, pct: basket ? c / basket : 0 };
}
export const FREE_SHIP = 499; // hypothetical free-shipping threshold

/* ── stage 2: the FY24 lever lab (hypothetical split of the reported totals) ── */
export const BASE = {
  revenue: FIN.revenueCrore, // ₹ crore (reported)
  netLoss: FIN.netLossLakh / 100, // ₹ crore (reported, ~0.63)
  gm: 0.4, // hypothetical gross margin
  mk: 0.22, // hypothetical marketing + platform fees as % of revenue
};
/** fixed overheads implied so that the hypothetical split reproduces the reported net loss */
export const FIXED = +(BASE.revenue * (BASE.gm - BASE.mk) + BASE.netLoss).toFixed(2);
export type Levers = { growth: number; gmGain: number; mk: number; fixedGrowth: number }; // % values
export const DEFAULT_LEVERS: Levers = { growth: 0, gmGain: 0, mk: 22, fixedGrowth: 0 };
/** Growth needs marketing: in this practice model each 1 point of marketing % supports ~4 points of growth. */
export const growthCap = (mk: number) => Math.round(mk * 4);
export function plNext(l: Levers) {
  const rev = BASE.revenue * (1 + l.growth / 100);
  const gm = BASE.gm + l.gmGain / 100;
  const gross = rev * gm;
  const marketing = rev * (l.mk / 100);
  const fixed = FIXED * (1 + l.fixedGrowth / 100);
  const net = gross - marketing - fixed;
  return { rev, gross, marketing, fixed, net, netPct: net / rev };
}

/* ── stage 3: positioning ───────────────────────────────────── */
export const LEVEL_IDX: Record<Level, number> = { Low: 0, Medium: 1, High: 2 };
export const LEVELS: Level[] = ["Low", "Medium", "High"];

/* ── stage 4: budget allocation (hypothetical ₹10 crore) ────── */
export const BUDGET_CR = 10;
export const DEPTS = [
  { id: "product", name: "Product development", color: "#FED300", lose: "fewer new SKUs, so the portfolio-expansion pillar stalls" },
  { id: "marketing", name: "Marketing", color: "#FF5C00", lose: "fewer new customers find the brand, so growth slows" },
  { id: "manufacturing", name: "Manufacturing", color: "#2E9E5B", lose: "the kitchen can't make enough, so orders are missed" },
  { id: "distribution", name: "Distribution", color: "#2F6FDE", lose: "fewer dark stores and slower delivery" },
  { id: "gifting", name: "Corporate gifting", color: "#8A4FD6", lose: "B2B sales stay seasonal instead of year-round" },
  { id: "tech", name: "Technology & operations", color: "#6B7A88", lose: "stock, quality and order tracking stay manual and error-prone" },
] as const;
export type DeptId = (typeof DEPTS)[number]["id"];
export const DEFAULT_BUDGET: Record<DeptId, number> = { product: 10, marketing: 30, manufacturing: 15, distribution: 20, gifting: 10, tech: 15 };
export function budgetOutcome(b: Record<DeptId, number>) {
  const demand = 0.9 * b.marketing + 0.7 * b.distribution + 0.5 * b.product + 0.6 * b.gifting; // % demand growth
  const capacity = 2.6 * b.manufacturing + 0.8 * b.tech; // % capacity growth
  const fulfilled = Math.min(demand, capacity);
  const b2bShare = 8 + b.gifting * 0.9; // % of sales from B2B
  const warnings: string[] = [];
  if (b.tech < 8) warnings.push("Technology & operations below 8%: quality and order errors rise as volume grows.");
  if (b.manufacturing < 10) warnings.push("Manufacturing below 10%: the kitchen becomes the bottleneck.");
  if (demand > capacity + 10) warnings.push(`Demand grows ${Math.round(demand)}% but capacity only ${Math.round(capacity)}%: you would pay to win customers you can't serve.`);
  if (capacity > demand + 40) warnings.push(`Capacity grows ${Math.round(capacity)}% but demand only ${Math.round(demand)}%: machines would sit idle.`);
  return { demand, capacity, fulfilled, b2bShare, warnings };
}

/* ── stage 5: growth & capacity ─────────────────────────────── */
export const ORDERS_NOW = FIN.ordersLakh; // lakh orders / month (reported, approximate)
export const FACILITY_CAP = 5; // lakh orders / month — HYPOTHETICAL capacity of the 50,000 sq. ft. facility for this exercise

/* ── stage 6: investors ─────────────────────────────────────── */
export type PitchInput = { ask: number; levers: Levers; budget: Record<DeptId, number>; target: number; weights: Record<string, number>; weakness: string };
export function investorQuestions(p: PitchInput) {
  const qs: { who: string; q: string; why: string }[] = [];
  const pl = plNext(p.levers);
  if (p.levers.growth >= 60) qs.push({ who: "Investor A", q: `Your plan needs ${p.levers.growth}% growth to break even. What happens if you only grow half as fast?`, why: "Your break-even depends on very fast growth." });
  if (p.budget.marketing >= 30) qs.push({ who: "Investor B", q: `You put ${p.budget.marketing}% of the budget into marketing. How will you know each rupee brings back a repeat customer?`, why: "Marketing is your biggest spend." });
  if (p.target > FACILITY_CAP) qs.push({ who: "Investor C", q: `You target ${p.target} lakh orders a month, above the ${FACILITY_CAP} lakh our practice model gives the Jaipur facility. Where does the extra capacity come from?`, why: "Your target is above the facility's practice capacity." });
  if (/price|afford|expens|premium|cost/i.test(p.weakness)) qs.push({ who: "Investor A", q: "Your snacks cost more per gram than mass-market brands. Why will families keep paying the premium?", why: "You named price as a weakness." });
  if (pl.net < 0) qs.push({ who: "Investor B", q: "Your own model still shows a loss next year. Which lever will you pull first?", why: "Your lever plan doesn't reach break-even." });
  const fill = [
    { who: "Investor C", q: "What stops a bigger brand from copying your date-sweetened laddoos?", why: "Every pitch must defend its edge." },
    { who: "Investor A", q: "How will you use the money in the first six months?", why: "Investors want a concrete use of funds." },
    { who: "Investor B", q: "Which growth pillar comes first, and why?", why: "Priorities show focus." },
  ];
  for (const f of fill) if (qs.length < 3) qs.push(f);
  return qs.slice(0, 3);
}

export function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
