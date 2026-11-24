"use client";

import { buildReport, type ReportBlock, type Student } from "../shared/pdf";
import {
  BAG_GOAL,
  BASE,
  BUDGET_CR,
  COIN_LAKH,
  COINS,
  COSTS,
  DELIVERY,
  DEPTS,
  FACILITY_CAP,
  FIXED,
  FIXED_GROWTH,
  FREE_SHIP,
  GROWTH_GOAL,
  KMATRIX,
  K_PLAYERS,
  ORDERS_NOW,
  PAY_FEE,
  PILLARS,
  RANK_TRUTH,
  SKUS,
  bagOutcome,
  budgetOutcome,
  cogsOf,
  investorQuestions,
  moneyStars,
  plNext,
  ppg,
  supportedOrders,
} from "./data";
import type { useBiz } from "./store";

type St = ReturnType<typeof useBiz.getState>;
const rs = (n: number) => `Rs ${Math.round(n).toLocaleString("en-IN")}`;
const cr = (n: number) => `Rs ${n.toFixed(2)} cr`;
const fileStem = (s: Student) => (s.name.trim() || "student").replace(/\s+/g, "-");
const short = (id: string) => SKUS.find((k) => k.id === id)?.short ?? id;

export function starsOf(s: St) {
  const bo = budgetOutcome(s.coins);
  const supported = supportedOrders(bo.served);
  const targetOk = s.target > ORDERS_NOW && s.target <= FACILITY_CAP && s.target <= supported;
  return [
    !s.rankDone ? 0 : s.rankTries === 0 ? 3 : s.rankTries === 1 ? 2 : 1,
    moneyStars(s.levers),
    !K_PLAYERS.every((p) => s.grid[p.id]?.x && s.grid[p.id]?.y) ? 0 : s.gridMistakes === 0 ? 3 : s.gridMistakes <= 2 ? 2 : 1,
    !bo.ok ? 0 : bo.served >= 55 ? 3 : bo.served >= 45 ? 2 : 1,
    !targetOk ? 0 : s.target >= 4 ? 3 : s.target >= 3 ? 2 : 1,
  ];
}

/* ── feedback from Eat Better × SkilliZee ───────────────────────── */

export type MissionFeedback = { name: string; stars: number; why: string; next: string };

/** Why the learner earned each mission's stars, what would earn more, and an overall message for their total. */
export function feedbackOf(s: St) {
  const stars = starsOf(s);
  const total = stars.reduce((a, x) => a + x, 0);
  const pl = plNext(s.levers);
  const bo = budgetOutcome(s.coins);
  const supported = supportedOrders(bo.served);
  const g = s.levers.growth;
  const served = Math.round(bo.served);

  const m: MissionFeedback[] = [
    {
      name: "Price detective",
      stars: stars[0],
      why: !s.rankDone
        ? "The podium was not finished, so this mission has no stars yet."
        : s.rankTries === 0
          ? "You ranked all four boxes by price per gram on your very first try."
          : `You got the order right after ${s.rankTries} wrong ${s.rankTries === 1 ? "try" : "tries"}.`,
      next: stars[0] === 3 ? "Perfect. Price per gram (price divided by grams) is how smart shoppers compare packs." : "Work out price divided by grams for every box before you place any. Getting it right first time earns 3 stars.",
    },
    {
      name: "Money machine",
      stars: stars[1],
      why:
        pl.net < 0
          ? "Next year's plan made a loss: money out was bigger than money in."
          : g < GROWTH_GOAL
            ? `You stayed in profit, but sales grew only ${g}%, below the ${GROWTH_GOAL}% goal.`
            : `You stayed in profit while growing sales ${g}%.`,
      next:
        stars[1] === 3
          ? "Brilliant: fast growth AND a profit is the hardest balance in business."
          : pl.net < 0
            ? "Spend a little less on ads or use smarter buying until money in beats money out."
            : g < 45
              ? "Keep the profit and push growth to 45% for 2 stars, or 60% for 3."
              : "Keep the profit and push growth to 60% for 3 stars.",
    },
    {
      name: "Rival radar",
      stars: stars[2],
      why: !K_PLAYERS.every((p) => s.grid[p.id]?.x && s.grid[p.id]?.y)
        ? "Not every rival was placed on the map yet."
        : s.gridMistakes === 0
          ? "You placed every rival on the right square without a single mistake."
          : `You placed every rival correctly, with ${s.gridMistakes} wrong ${s.gridMistakes === 1 ? "try" : "tries"} on the way.`,
      next: stars[2] === 3 ? "Great reading of the K-Matrix: you know where each rival stands." : "Read each rival's two K-Matrix rows (price for everyone and natural sweetening) before you place it.",
    },
    {
      name: "Budget coins",
      stars: stars[3],
      why: !bo.ok
        ? bo.used < COINS
          ? `You shared out ${bo.used} of the ${COINS} coins, so the budget was not finished.`
          : `The budget had a problem: ${bo.warnings.join(" ")}`
        : `Your teams could serve about ${served}% more customers.`,
      next:
        stars[3] === 3
          ? "Excellent balance between finding customers and making the snacks for them."
          : !bo.ok
            ? "Use every coin, give the kitchen and tech at least 2 coins each, and keep customers and kitchen in balance."
            : `Balance the coins that bring customers (marketing, shops) with the kitchen that makes the snacks: ${served >= 45 ? "55%" : "45%"} or more earns the next star.`,
    },
    {
      name: "Grow & pitch",
      stars: stars[4],
      why:
        s.target <= ORDERS_NOW
          ? `Your target of ${s.target} lakh orders is not more than today's ~${ORDERS_NOW} lakh, so it is not growth.`
          : s.target > FACILITY_CAP
            ? `Your target of ${s.target} lakh is more than the ${FACILITY_CAP} lakh the kitchen can make in a month.`
            : s.target > supported
              ? `Your target of ${s.target} lakh is more than your budget supports (about ${supported} lakh).`
              : `You aimed for ${s.target} lakh orders a month, a target your kitchen and budget can really deliver.`,
      next:
        stars[4] === 3
          ? "A bold target that is still realistic: exactly what investors want to see."
          : stars[4] === 0
            ? "Pick a target above today's orders that your budget and kitchen can support."
            : `A bigger but still realistic target earns more: ${s.target >= 3 ? "4" : "3"} lakh or more, as long as your budget supports it.`,
    },
  ];

  const best = m.reduce((a, x) => (x.stars > a.stars ? x : a), m[0]);
  const gap = m.reduce((a, x) => (x.stars < a.stars ? x : a), m[0]);
  const headline =
    total === 15 ? "A perfect run: 15 of 15 stars!" : total >= 12 ? "Excellent manager!" : total >= 8 ? "Good work, with room to grow" : total >= 4 ? "A solid start" : total >= 1 ? "You have made a start" : "Let's give it another go";
  const even = m.every((x) => x.stars === m[0].stars);
  const summary =
    total === 15
      ? "Every mission earned full stars. You priced, planned, compared rivals, budgeted and pitched like a real business manager."
      : even
        ? `Every mission earned ${m[0].stars} of 3 stars, so each one has more to win. A good place to start: ${m[0].name}. ${m[0].next}`
        : `Your strongest mission was ${best.name} (${best.stars} of 3). The most stars to win next time are in ${gap.name} (${gap.stars} of 3): ${gap.next}`;
  return { total, headline, summary, missions: m };
}

export async function buildBusinessReport(s: St, student: Student) {
  const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const bag = bagOutcome(s.bag);
  const pl = plNext(s.levers);
  const bo = budgetOutcome(s.coins);
  const supported = supportedOrders(bo.served);
  const qs = investorQuestions({ levers: s.levers, coins: s.coins, target: s.target, lead: s.lead });
  const stars = starsOf(s);
  const fb = feedbackOf(s);
  const lead = PILLARS.find((p) => p.id === s.lead);
  const blocks: ReportBlock[] = [
    { kind: "h", text: "What I did" },
    { kind: "p", text: "I ran Eat Better's head office for a day in a 3D game: I ranked the snack boxes by price per gram, packed a profitable delivery order, balanced the money machine, mapped the rivals, shared a budget between six teams, and pitched a growth plan to pretend investors." },
    { kind: "kv", rows: [["Stars collected", `${stars.reduce((a, x) => a + x, 0)} of 15`], ...(["Price detective", "Money machine", "Rival radar", "Budget coins", "Grow & pitch"].map((m, i) => [m, `${stars[i]} of 3 stars`]) as [string, string][])] },
    { kind: "h", text: "Feedback from Eat Better × SkilliZee" },
    { kind: "p", text: `${fb.headline} ${fb.summary}` },
    { kind: "table", head: ["Mission", "Stars", "Why", "Next time"], rows: fb.missions.map((x) => [x.name, `${x.stars} of 3`, x.why, x.next]), widths: [30, 18, 66, 66] },
    { kind: "callout", tone: "info", text: "REAL figures (from the Module 4 chapters): the four box prices and weights, FY23 ~Rs 5.5 crore and FY24 ~Rs 14.7 crore sales, FY24 loss ~Rs 63 lakh, ~2 lakh orders a month, the K-Matrix, the growth pillars and the 50,000 sq. ft. Jaipur facility. Every cost, fee, budget, capacity figure and game reaction is a PRACTICE number for learning." },

    { kind: "h", text: "Mission 1 · Price detective" },
    { kind: "table", head: ["Step", "Box", "Price (real)", "Weight (real)", "Price per gram"], rows: RANK_TRUTH.map((id, i) => { const k = SKUS.find((x) => x.id === id)!; return [`${i + 1}`, k.name, rs(k.price), `${k.grams} g`, `Rs ${ppg(k.price, k.grams).toFixed(2)}`]; }), widths: [14, 74, 28, 28, 30] },
    { kind: "p", text: `I solved the podium ${s.rankTries === 0 ? "on my first try" : `after ${s.rankTries} wrong tr${s.rankTries === 1 ? "y" : "ies"}`}. Lesson: a bigger box is not always cheaper per gram. The 42-laddoo box costs more per gram than the 24-laddoo box, while the Namkeen Combo gives the most snack per rupee.` },
    { kind: "p", text: `My delivery bag: ${SKUS.filter((k) => (s.bag[k.id] ?? 0) > 0).map((k) => `${s.bag[k.id]} x ${k.short}`).join(", ") || "-"}.` },
    { kind: "kv", rows: [["Bag value", rs(bag.value)], ["Cost of making the boxes (practice)", rs(bag.cogs)], [`Delivery Rs ${DELIVERY} + ${PAY_FEE * 100}% payment fee (practice)`, rs(bag.fees)], ["Profit kept", `${rs(bag.profit)} (${Math.round(bag.pct * 100)}%; goal ${BAG_GOAL * 100}%)`]] },
    { kind: "p", text: `Lesson: one delivery fee is shared by the whole order, so bigger orders over Rs ${FREE_SHIP} keep more money.`, muted: true },

    { kind: "h", text: "Mission 2 · Money machine" },
    { kind: "p", text: `FY24 (real): sales ~Rs 14.7 crore, loss ~Rs 63 lakh. Practice model: Rs ${BASE.gm * 100} of every Rs 100 of sales is left after making the snacks, ads and app fees take Rs ${BASE.mk * 100}, and rent and salaries (${cr(FIXED)}) grow ${FIXED_GROWTH}% next year.` },
    { kind: "table", head: ["My lever", "Setting"], rows: [["Ads (% of sales)", `${s.levers.mk}%`], ["Grow sales", `+${s.levers.growth}% (goal ${GROWTH_GOAL}%+)`], ["Smarter buying", `+${s.levers.gmGain} points`]], widths: [100, 74] },
    { kind: "kv", rows: [["Next year's sales", cr(pl.rev)], ["Money in (after making the snacks)", cr(pl.gross)], ["Money out: ads", cr(pl.marketing)], ["Money out: rent and salaries", cr(pl.fixed)], ["Result", `${pl.net >= 0 ? "Profit +" : "Loss -"}${cr(Math.abs(pl.net))}`]] },
    { kind: "p", text: "Lesson: a business can grow fast and still lose money when costs grow too. Profit comes from keeping more from each sale and spreading fixed costs over more sales.", muted: true },

    { kind: "h", text: "Mission 3 · Rival radar" },
    { kind: "table", head: ["Rival", "Price for everyone", "Natural sweetening"], rows: K_PLAYERS.map((p) => [p.name, KMATRIX.find((r) => r.id === "price")!.v[p.id], KMATRIX.find((r) => r.id === "sweet")!.v[p.id]]), widths: [70, 52, 52] },
    { kind: "p", text: `Wrong squares before the map was complete: ${s.gridMistakes}.` },
    { kind: "kv", rows: [["Eat Better wins because…", s.edge || "-"]] },

    { kind: "h", text: `Mission 4 · Budget coins (practice Rs ${BUDGET_CR} crore = ${COINS} coins of Rs ${COIN_LAKH} lakh)` },
    { kind: "table", head: ["Team", "Coins", "Share", "Amount"], rows: DEPTS.map((d) => [d.name, `${s.coins[d.id] ?? 0}`, `${bo.b[d.id]}%`, cr(((s.coins[d.id] ?? 0) * COIN_LAKH) / 100)]), widths: [74, 26, 30, 44] },
    { kind: "kv", rows: [["More customers (practice)", `+${Math.round(bo.demand)}%`], ["More snacks the kitchen can make (practice)", `+${Math.round(bo.capacity)}%`], ["Extra orders I can serve", `+${Math.round(bo.served)}%`]] },
    { kind: "p", text: "Lesson: every coin given to one team is a coin another team cannot have. Winning customers you cannot serve wastes money, and so does a kitchen with no customers.", muted: true },

    { kind: "h", text: "Mission 5 · Grow & pitch" },
    { kind: "kv", rows: [["How we grow", lead ? `${lead.title}` : "-"], ["Goal", `${s.target} lakh orders a month (today ~${ORDERS_NOW} lakh, real)`], ["Factory limit (practice)", `${FACILITY_CAP} lakh a month`], ["My budget can serve", `${supported} lakh a month`]] },
    { kind: "kv", rows: [["My pitch", s.pitch || "-"]] },
    ...qs.flatMap((q, i): ReportBlock[] => [{ kind: "p", text: `${q.who} (pretend investor): "${q.q}"` }, { kind: "p", text: `My answer: ${s.answers[i] ?? "-"}`, muted: true }]),
    { kind: "callout", tone: "info", text: "The investors are pretend characters. This pitch is a learning game, not Eat Better Co's real fundraising or plans." },

    { kind: "h", text: "My reflection" },
    { kind: "p", text: s.reflection },
  ];
  await buildReport({ title: "Run the Eat Better Business: My Report", activity: "Experiential Activity 4", module: "Module 4 · Business Strategy, Financials & Competitive Analysis", student, date, blocks, filename: `EatBetter-SkilliZee-Business-Report-${fileStem(student)}.pdf` });
}

export function downloadFinancialCsv(s: St, student: Student) {
  const rows: (string | number)[][] = [];
  const add = (...r: (string | number)[]) => rows.push(r);
  const bag = bagOutcome(s.bag);
  const pl = plNext(s.levers);
  const bo = budgetOutcome(s.coins);
  const stars = starsOf(s);
  add("Eat Better Co x SkilliZee - Run the Eat Better Business: my numbers");
  add("Student", student.name, "Date", new Date().toISOString().slice(0, 10), "Stars", `${stars.reduce((a, x) => a + x, 0)}/15`);
  add("Note", "Prices, weights and FY figures are REAL; all costs, fees, budgets and game reactions are PRACTICE numbers");
  add();
  add("MISSION 1: PRICE PER GRAM", "Price (Rs, real)", "Weight (g, real)", "Price per gram (Rs)", "Podium step", "Cost to make (Rs, practice)", "In my bag");
  for (const k of SKUS) add(k.name, k.price, k.grams, ppg(k.price, k.grams).toFixed(4), RANK_TRUTH.indexOf(k.id) + 1, cogsOf(k.id), s.bag[k.id] ?? 0);
  add("Wrong podium tries", s.rankTries);
  add("Bag value (Rs)", bag.value, "Cost of boxes (Rs)", bag.cogs, "Delivery + payment fee (Rs)", bag.fees.toFixed(0), "Profit kept (Rs)", bag.profit.toFixed(0), "Profit %", (bag.pct * 100).toFixed(1));
  add("Box costs (practice)", ...SKUS.map((k) => `${short(k.id)}: ingredients ${COSTS[k.id].ingredient} + packaging ${COSTS[k.id].packaging} + making ${COSTS[k.id].production}`));
  add();
  add("MISSION 2: MONEY MACHINE (Rs crore)", "FY24 (real totals)", "My next year (practice)");
  add("Sales", BASE.revenue, pl.rev.toFixed(2));
  add("Money in after making the snacks", (BASE.revenue * BASE.gm).toFixed(2), pl.gross.toFixed(2));
  add("Ads and app fees", (BASE.revenue * BASE.mk).toFixed(2), pl.marketing.toFixed(2));
  add("Rent and salaries", FIXED, pl.fixed.toFixed(2));
  add("Result", (-BASE.netLoss).toFixed(2), pl.net.toFixed(2));
  add("My levers", `ads ${s.levers.mk}%`, `growth ${s.levers.growth}%`, `smarter buying +${s.levers.gmGain}`);
  add();
  add("MISSION 3: RIVAL RADAR", "Price for everyone (K-Matrix)", "Natural sweetening (K-Matrix)");
  for (const p of K_PLAYERS) add(p.name, KMATRIX.find((r) => r.id === "price")!.v[p.id], KMATRIX.find((r) => r.id === "sweet")!.v[p.id]);
  add("Wrong squares", s.gridMistakes);
  add("Eat Better wins because", s.edge);
  add();
  add("MISSION 4: BUDGET COINS (practice)", "Coins", "Share %", "Rs crore");
  for (const d of DEPTS) add(d.name, s.coins[d.id] ?? 0, bo.b[d.id], (((s.coins[d.id] ?? 0) * COIN_LAKH) / 100).toFixed(2));
  add("More customers %", bo.demand.toFixed(0), "More snacks made %", bo.capacity.toFixed(0), "Extra orders served %", bo.served.toFixed(0));
  add();
  add("MISSION 5: GROW & PITCH");
  add("How we grow", PILLARS.find((p) => p.id === s.lead)?.title ?? "");
  add("Goal (lakh orders a month)", s.target, "Today (real, approx.)", ORDERS_NOW, "Factory limit (practice)", FACILITY_CAP, "Budget can serve", supportedOrders(bo.served));
  add("Pitch", s.pitch);
  const esc = (v: string | number) => {
    const t = String(v);
    return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  const csv = "﻿" + rows.map((r) => r.map(esc).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `EatBetter-SkilliZee-Business-Numbers-${fileStem(student)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
