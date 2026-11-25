/**
 * Experiential Activity 4 — Run the Eat Better Business (kid-friendly game version).
 * REPORTED facts (from the Module 4 chapters): the four product prices and weights, FY23 ₹5.33 crore, FY24 ₹14.47 crore,
 * FY24 net loss ₹62.96 lakh, ~2 lakh orders a month, the K-Matrix, the growth pillars and the 50,000 sq. ft. facility.
 * Everything else (costs, delivery fee, budgets, capacity, how the money machine responds) is HYPOTHETICAL practice
 * data, labelled as such in the game, the PDF and the CSV.
 */
import { SKUS as SKU41, FIN } from "@/features/chapter-4-1/content";
import { KMATRIX, K_PLAYERS, type Level } from "@/features/chapter-4-2/content";
import { PILLARS } from "@/features/chapter-4-3/content";

export { FIN, KMATRIX, K_PLAYERS, PILLARS };
export type { Level };

export const SKUS = SKU41.map((s) => ({ id: s.id, name: s.name, short: s.short, grams: s.grams, price: s.price, tex: s.tex, img: s.img }));
export type SkuId = (typeof SKUS)[number]["id"];
export const ppg = (price: number, grams: number) => price / grams;
export const skuById = (id: string) => SKUS.find((k) => k.id === id)!;

/* ── mission 1a: price detective ─────────────────────────────── */
/** cheapest per gram first */
export const RANK_TRUTH = [...SKUS].sort((a, b) => ppg(a.price, a.grams) - ppg(b.price, b.grams)).map((k) => k.id);
export const rankHits = (order: string[]) => order.filter((id, i) => RANK_TRUTH[i] === id).length;

/* ── mission 1b: pack a delivery bag (hypothetical costs) ───── */
export type Costs = { ingredient: number; packaging: number; production: number }; // ₹ per box
export const COSTS: Record<string, Costs> = {
  l24: { ingredient: 120, packaging: 38, production: 30 },
  l42: { ingredient: 215, packaging: 55, production: 48 },
  usb: { ingredient: 250, packaging: 70, production: 60 },
  nam: { ingredient: 80, packaging: 28, production: 26 },
};
export const cogsOf = (id: string) => {
  const c = COSTS[id];
  return c.ingredient + c.packaging + c.production;
};
export const DELIVERY = 70; // ₹ courier per order (hypothetical)
export const PAY_FEE = 0.02; // payment fee (hypothetical)
export const FREE_SHIP = 499; // free delivery from (hypothetical)
export const BAG_GOAL = 0.4; // keep 40% as profit
export const BAG_MAX = 4; // boxes of one kind per bag
export function bagOutcome(bag: Record<string, number>) {
  let value = 0;
  let cogs = 0;
  let boxes = 0;
  for (const k of SKUS) {
    const q = bag[k.id] ?? 0;
    value += k.price * q;
    cogs += cogsOf(k.id) * q;
    boxes += q;
  }
  const fees = boxes ? value * PAY_FEE + DELIVERY : 0;
  const profit = value - cogs - fees;
  return { value, cogs, fees, profit, pct: value ? profit / value : 0, boxes, ok: value >= FREE_SHIP && value > 0 && profit / value >= BAG_GOAL };
}

/* ── mission 2: the money machine (hypothetical split of the reported FY24 totals) ── */
export const BASE = {
  revenue: FIN.revenueCrore, // ₹ crore (reported)
  netLoss: FIN.netLossLakh / 100, // ₹ crore (FY24, 0.6296)
  gm: 0.4, // hypothetical: what is left from each sale after making it
  mk: 0.22, // hypothetical: ads and app fees as a share of sales
};
/** fixed costs implied so the hypothetical split reproduces the reported FY24 loss */
export const FIXED = +(BASE.revenue * (BASE.gm - BASE.mk) + BASE.netLoss).toFixed(2);
/** growing needs more people and space: fixed costs rise 10% next year (hypothetical) */
export const FIXED_GROWTH = 10;
export type Levers = { growth: number; mk: number; gmGain: number }; // % values
export const DEFAULT_LEVERS: Levers = { growth: 0, mk: 22, gmGain: 0 };
/** ads bring customers: each 1% of sales spent on ads supports ~4% growth in this practice model */
export const growthCap = (mk: number) => Math.round(mk * 4);
export const GROWTH_GOAL = 30;
export function plNext(l: Levers) {
  const rev = BASE.revenue * (1 + l.growth / 100);
  const gross = rev * (BASE.gm + l.gmGain / 100);
  const marketing = rev * (l.mk / 100);
  const fixed = FIXED * (1 + FIXED_GROWTH / 100);
  const net = gross - marketing - fixed;
  return { rev, gross, marketing, fixed, net, out: marketing + fixed + (rev - gross) };
}
export const moneyStars = (l: Levers) => (plNext(l).net < 0 ? 0 : l.growth >= 60 ? 3 : l.growth >= 45 ? 2 : l.growth >= GROWTH_GOAL ? 1 : 0);

/* ── mission 3: rival radar ──────────────────────────────────── */
export const LEVEL_IDX: Record<Level, number> = { Low: 0, Medium: 1, High: 2 };
export const LEVELS: Level[] = ["Low", "Medium", "High"];
export const truthOf = (player: string) => ({
  x: KMATRIX.find((r) => r.id === "price")!.v[player as keyof (typeof KMATRIX)[number]["v"]],
  y: KMATRIX.find((r) => r.id === "sweet")!.v[player as keyof (typeof KMATRIX)[number]["v"]],
});
export const PLAYER_COLORS: Record<string, string> = { eb: "#FF5C00", trad: "#C62828", health: "#2E9E5B", local: "#8A4FD6" };

/* ── mission 4: budget coins (hypothetical ₹10 crore = 20 coins of ₹50 lakh) ── */
export const BUDGET_CR = 10;
export const COINS = 20;
export const COIN_LAKH = 50;
export const DEPTS = [
  { id: "product", name: "New products", color: "#E8B800", lose: "no new snacks this year" },
  { id: "marketing", name: "Marketing", color: "#FF5C00", lose: "fewer people hear about Eat Better" },
  { id: "manufacturing", name: "Kitchen & factory", color: "#2E9E5B", lose: "the kitchen can't keep up with orders" },
  { id: "distribution", name: "Delivery", color: "#2F6FDE", lose: "slower delivery, fewer dark stores" },
  { id: "gifting", name: "Corporate gifts", color: "#8A4FD6", lose: "office gift orders stay only at Diwali" },
  { id: "tech", name: "Tech & tracking", color: "#5D6B78", lose: "orders and stock are tracked by hand" },
] as const;
export type DeptId = (typeof DEPTS)[number]["id"];
export const NO_COINS: Record<DeptId, number> = { product: 0, marketing: 0, manufacturing: 0, distribution: 0, gifting: 0, tech: 0 };
export const pctOf = (coins: Record<DeptId, number>) => Object.fromEntries(DEPTS.map((d) => [d.id, (coins[d.id] ?? 0) * (100 / COINS)])) as Record<DeptId, number>;
export function budgetOutcome(coins: Record<DeptId, number>) {
  const b = pctOf(coins);
  const used = DEPTS.reduce((a, d) => a + (coins[d.id] ?? 0), 0);
  const demand = 0.9 * b.marketing + 0.7 * b.distribution + 0.5 * b.product + 0.6 * b.gifting; // % more customers
  const capacity = 2.6 * b.manufacturing + 0.8 * b.tech; // % more snacks made
  const served = Math.min(demand, capacity);
  const warnings: string[] = [];
  if (used === COINS) {
    if (b.tech < 10) warnings.push("Tech & tracking needs at least 2 coins, or orders get lost.");
    if (b.manufacturing < 10) warnings.push("The kitchen needs at least 2 coins, or it can't cook enough.");
    if (demand > capacity + 10) warnings.push("More customers want snacks than the kitchen can make.");
    if (capacity > demand + 40) warnings.push("The kitchen can make far more than customers want. Machines would sit idle.");
  }
  return { b, used, demand, capacity, served, warnings, ok: used === COINS && warnings.length === 0 };
}

/* ── mission 5: grow & pitch ─────────────────────────────────── */
export const ORDERS_NOW = FIN.ordersLakh; // lakh orders a month (reported, approximate)
export const FACILITY_CAP = 5; // lakh orders a month: HYPOTHETICAL practice capacity of the 50,000 sq. ft. facility
export const supportedOrders = (served: number) => +(ORDERS_NOW * (1 + served / 100)).toFixed(1);

export type PitchInput = { levers: Levers; coins: Record<DeptId, number>; target: number; lead: string | null };
export function investorQuestions(p: PitchInput) {
  const b = pctOf(p.coins);
  const qs: { who: string; q: string }[] = [];
  if (p.levers.growth >= 60) qs.push({ who: "Investor A", q: `You plan to grow ${p.levers.growth}%. What if you only grow half that much?` });
  if (b.marketing >= 30) qs.push({ who: "Investor B", q: `${b.marketing}% of your money goes to marketing. How will you know it brings customers back?` });
  if (p.lead === "qcom") qs.push({ who: "Investor C", q: "Quick-commerce apps keep a big share of each sale. How will you still make money there?" });
  if (p.lead === "b2b") qs.push({ who: "Investor C", q: "Office gifting is big at Diwali. What do you sell to companies the rest of the year?" });
  if (p.lead === "portfolio") qs.push({ who: "Investor C", q: "Which new snack would you launch first, and how many would you sell a month?" });
  if (p.lead === "infra") qs.push({ who: "Investor C", q: "Why spend on the factory now, before you have more customers?" });
  if (p.target >= 4) qs.push({ who: "Investor A", q: `You want ${p.target} lakh orders a month. How many more people will you need to hire?` });
  qs.push({ who: "Investor B", q: "Your snacks cost more per gram than big brands. Why will families keep buying them?" });
  return qs.slice(0, 2);
}

export function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
