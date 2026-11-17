"use client";

import { buildReport, type ReportBlock, type Student } from "../shared/pdf";
import { BASE, BUDGET_CR, CHANNEL_FEES, DEPTS, FACILITY_CAP, FIXED, FIN, K_PLAYERS, KMATRIX, ORDERS_NOW, PILLARS, SKUS, budgetOutcome, contribution, investorQuestions, plNext, ppg, unitEconomics, type ChannelId } from "./data";
import type { useBiz } from "./store";

type St = ReturnType<typeof useBiz.getState>;
const rs = (n: number) => `Rs ${Math.round(n).toLocaleString("en-IN")}`;
const cr = (n: number) => `Rs ${n.toFixed(2)} cr`;
const pc = (x: number) => `${(x * 100).toFixed(1)}%`;
const fileStem = (s: Student) => (s.name.trim() || "student").replace(/\s+/g, "-");

export function basketOf(s: St) {
  const lines = SKUS.filter((k) => (s.basket[k.id] ?? 0) > 0).map((k) => {
    const q = s.basket[k.id];
    const ue = unitEconomics(k.price, s.costs[k.id]);
    return { k, q, value: k.price * q, cogs: ue.cogs * q };
  });
  const value = lines.reduce((a, l) => a + l.value, 0);
  const cogs = lines.reduce((a, l) => a + l.cogs, 0);
  return { lines, value, cogs };
}

export async function buildBusinessReport(s: St, student: Student) {
  const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const pl = plNext(s.levers);
  const bo = budgetOutcome(s.budget);
  const b = basketOf(s);
  const qs = investorQuestions({ ask: s.ask, levers: s.levers, budget: s.budget, target: s.target, weights: s.weights, weakness: s.swot.weakness });
  const blocks: ReportBlock[] = [
    { kind: "h", text: "Objective" },
    { kind: "p", text: "Act as Eat Better's management team: price the products, read the financials, map the competition, allocate a budget, plan growth within the Jaipur facility's capacity, and pitch the plan to investors." },
    { kind: "h", text: "Learning outcomes" },
    { kind: "bullets", items: ["Calculate price per gram and explain how pack size and bundles change it.", "Build unit economics: cost of goods, gross margin and contribution after channel fees.", "Explain why a fast-growing brand can still report a net loss, and which levers move it to break-even.", "Position Eat Better against competitor types using the K-Matrix.", "Allocate a budget and explain the opportunity cost of each choice.", "Link growth targets to production capacity and justify a funding plan."] },
    { kind: "callout", tone: "info", text: "REPORTED facts (from the Module 4 chapters): the four product prices and weights, FY23 ~Rs 5.5 crore and FY24 ~Rs 14.7 crore revenue, FY24 net loss ~Rs 63 lakh, ~2 lakh orders a month, the K-Matrix, the growth pillars and the 50,000 sq. ft. Jaipur facility. Every cost, commission, budget, capacity figure and outcome below is HYPOTHETICAL practice data." },
    { kind: "h", text: "1. Product pricing calculations" },
    { kind: "table", head: ["Product", "Weight", "Price (reported)", "My Rs/g", "Actual Rs/g"], rows: SKUS.map((k) => [k.name, `${k.grams} g`, rs(k.price), s.ppg[k.id] != null ? s.ppg[k.id].toFixed(2) : "-", ppg(k.price, k.grams).toFixed(2)]), widths: [62, 22, 30, 28, 32] },
    { kind: "p", text: `Price-per-gram attempts that needed correcting: ${s.ppgMistakes}. The 42-laddoo box costs more per gram than the 24-laddoo box, while the Ultimate Snack Box and the namkeen combo bring the price per gram down.` },
    { kind: "h", text: "2. Unit economics (hypothetical cost sheet)" },
    { kind: "table", head: ["Product", "Ingredients", "Packaging", "Production", "COGS", "Gross margin"], rows: SKUS.map((k) => { const c = s.costs[k.id]; const ue = unitEconomics(k.price, c); return [k.short, rs(c.ingredient), rs(c.packaging), rs(c.production), rs(ue.cogs), pc(ue.grossPct)]; }), widths: [38, 28, 26, 26, 24, 32] },
    { kind: "p", text: `My D2C basket: ${b.lines.map((l) => `${l.q} x ${l.k.short}`).join(", ") || "-"}; basket value (average order value for this order) ${rs(b.value)}.` },
    { kind: "table", head: ["Channel", "Fees (hypothetical)", "Fees on my basket", "Contribution", "Contribution %"], rows: (Object.keys(CHANNEL_FEES) as ChannelId[]).map((ch) => { const c = contribution(b.value, b.cogs, ch); return [CHANNEL_FEES[ch].name, CHANNEL_FEES[ch].note, rs(c.fees), rs(c.contribution), pc(c.pct)]; }), widths: [28, 62, 28, 28, 28] },
    { kind: "h", text: "3. Financial performance analysis" },
    { kind: "kv", rows: [["FY23 revenue (reported)", "~Rs 5.5 crore"], ["FY24 revenue (reported)", "~Rs 14.7 crore"], ["Growth (computed)", `${(((FIN.revenueCrore - FIN.priorCrore) / FIN.priorCrore) * 100).toFixed(0)}% from the rounded figures (reported as ~165%)`], ["FY24 net loss (reported)", "~Rs 63 lakh"], ["Implied total costs", `~${cr(BASE.revenue + BASE.netLoss)} (revenue + loss)`], ["Net margin FY24", pc(-BASE.netLoss / BASE.revenue)]] },
    { kind: "p", text: `Hypothetical split used in the lever lab: gross margin ${pc(BASE.gm)}, marketing and platform fees ${pc(BASE.mk)} of revenue, fixed overheads ${cr(FIXED)} (set so the model reproduces the reported loss).` },
    { kind: "table", head: ["Lever", "My setting"], rows: [["Revenue growth", `${s.levers.growth}%`], ["Gross-margin improvement (bundles, sourcing)", `+${s.levers.gmGain} points`], ["Marketing and fees, % of revenue", `${s.levers.mk}%`], ["Growth in fixed overheads", `${s.levers.fixedGrowth}%`]], widths: [110, 64] },
    { kind: "kv", rows: [["Plan revenue", cr(pl.rev)], ["Gross profit", cr(pl.gross)], ["Marketing and fees", cr(pl.marketing)], ["Fixed overheads", cr(pl.fixed)], ["Net result (hypothetical)", `${pl.net >= 0 ? "+" : "-"}${cr(Math.abs(pl.net))} (${pc(pl.netPct)})`]] },
    { kind: "p", text: `Why a growing business can post a loss (my explanation): ${s.plExplain}` },
    { kind: "h", text: "4. Competitive positioning matrix" },
    { kind: "table", head: ["Parameter", ...K_PLAYERS.map((p) => p.short)], rows: KMATRIX.map((r) => [r.short, ...K_PLAYERS.map((p) => r.v[p.id])]), widths: [54, 30, 30, 30, 30] },
    { kind: "table", head: ["Player", "Price accessibility (my map)", "Natural sweetening (my map)"], rows: K_PLAYERS.map((p) => [p.name, s.grid[p.id]?.x ?? "-", s.grid[p.id]?.y ?? "-"]), widths: [62, 56, 56] },
    { kind: "kv", rows: [["Strength", s.swot.strength], ["Weakness", s.swot.weakness], ["Opportunity", s.swot.opportunity], ["Differentiation", s.swot.edge]] },
    { kind: "h", text: `5. Budget and asset allocation (hypothetical Rs ${BUDGET_CR} crore)` },
    { kind: "table", head: ["Department", "Share", "Amount"], rows: DEPTS.map((d) => [d.name, `${s.budget[d.id]}%`, cr((s.budget[d.id] / 100) * BUDGET_CR)]), widths: [90, 40, 44] },
    { kind: "kv", rows: [["Demand growth (simulated)", `${Math.round(bo.demand)}%`], ["Capacity growth (simulated)", `${Math.round(bo.capacity)}%`], ["Growth I can actually serve", `${Math.round(bo.fulfilled)}%`], ["B2B share of sales (simulated)", `${Math.round(bo.b2bShare)}%`]] },
    { kind: "h", text: "6. Growth strategy and scalability" },
    { kind: "table", head: ["Growth pillar", "My weight"], rows: PILLARS.map((p) => [p.title, `${s.weights[p.id] ?? 0}%`]), widths: [130, 44] },
    { kind: "p", text: `Target: ${s.target} lakh orders a month in 12 months (today ~${ORDERS_NOW} lakh, reported). Practice capacity of the 50,000 sq. ft. Jaipur facility in this exercise: ${FACILITY_CAP} lakh a month (hypothetical).` },
    { kind: "p", text: `My justification: ${s.growthWhy}` },
    { kind: "h", text: "7. Investment proposal (learning simulation)" },
    { kind: "kv", rows: [["Funding ask", `Rs ${s.ask} crore (hypothetical)`]] },
    { kind: "table", head: ["Use of funds", "Share", "Amount"], rows: DEPTS.map((d) => [d.name, `${s.budget[d.id]}%`, cr((s.budget[d.id] / 100) * s.ask)]), widths: [90, 40, 44] },
    { kind: "h", text: "8. Investor pitch summary" },
    { kind: "kv", rows: [["The opportunity", s.pitch.opportunity], ["Product differentiation", s.pitch.differentiation], ["Growth strategy", s.pitch.growth]] },
    ...qs.flatMap((q, i): ReportBlock[] => [{ kind: "p", text: `${q.who} (simulated): "${q.q}"` }, { kind: "p", text: `My answer: ${s.answers[i] ?? "-"}`, muted: true }]),
    { kind: "callout", tone: "info", text: "This pitch is a learning simulation. It does not represent Eat Better Co's actual investment terms, investors or plans." },
    { kind: "h", text: "Final decision rationale and reflection" },
    { kind: "p", text: s.reflection },
  ];
  await buildReport({ title: "Business Growth & Financial Strategy Report", activity: "Experiential Activity 4", module: "Module 4 · Business Strategy, Financials & Competitive Analysis", student, date, blocks, filename: `EatBetter-SkilliZee-Business-Strategy-Report-${fileStem(student)}.pdf` });
}

export function downloadFinancialCsv(s: St, student: Student) {
  const rows: (string | number)[][] = [];
  const add = (...r: (string | number)[]) => rows.push(r);
  add("Eat Better Co x SkilliZee - Business Growth & Financial Model");
  add("Student", student.name, "Date", new Date().toISOString().slice(0, 10));
  add("Note", "Prices/weights/FY figures are REPORTED; all costs, fees, budgets and outcomes are HYPOTHETICAL practice data");
  add();
  add("PRICING", "Weight (g)", "Price (Rs, reported)", "My price per g", "Actual price per g", "Ingredients (Rs, hyp.)", "Packaging (Rs, hyp.)", "Production (Rs, hyp.)", "COGS (Rs)", "Gross profit (Rs)", "Gross margin %");
  for (const k of SKUS) {
    const c = s.costs[k.id];
    const ue = unitEconomics(k.price, c);
    add(k.name, k.grams, k.price, s.ppg[k.id] != null ? s.ppg[k.id].toFixed(2) : "", ppg(k.price, k.grams).toFixed(4), c.ingredient, c.packaging, c.production, ue.cogs, ue.gross, (ue.grossPct * 100).toFixed(1));
  }
  add();
  const b = basketOf(s);
  add("D2C BASKET", "Qty", "Value (Rs)");
  for (const l of b.lines) add(l.k.name, l.q, l.value);
  add("Basket value (AOV)", "", b.value);
  add("CHANNEL", "Commission %", "Per-order fee (Rs)", "Fees on basket (Rs)", "Contribution (Rs)", "Contribution %");
  for (const ch of Object.keys(CHANNEL_FEES) as ChannelId[]) {
    const c = contribution(b.value, b.cogs, ch);
    add(CHANNEL_FEES[ch].name, CHANNEL_FEES[ch].commission * 100, CHANNEL_FEES[ch].perOrder, c.fees.toFixed(0), c.contribution.toFixed(0), (c.pct * 100).toFixed(1));
  }
  add();
  const pl = plNext(s.levers);
  add("P&L (Rs crore)", "FY24 reported/implied", "My plan (hypothetical)");
  add("Revenue", BASE.revenue, pl.rev.toFixed(2));
  add("Gross profit", (BASE.revenue * BASE.gm).toFixed(2), pl.gross.toFixed(2));
  add("Marketing + fees", (BASE.revenue * BASE.mk).toFixed(2), pl.marketing.toFixed(2));
  add("Fixed overheads", FIXED, pl.fixed.toFixed(2));
  add("Net result", (-BASE.netLoss).toFixed(2), pl.net.toFixed(2));
  add("Levers", `growth ${s.levers.growth}%`, `margin +${s.levers.gmGain} pts`, `marketing ${s.levers.mk}%`, `fixed +${s.levers.fixedGrowth}%`);
  add();
  const bo = budgetOutcome(s.budget);
  add("BUDGET (hypothetical Rs crore)", "Share %", "Amount (Rs cr)", "Use of funding ask (Rs cr)");
  for (const d of DEPTS) add(d.name, s.budget[d.id], ((s.budget[d.id] / 100) * BUDGET_CR).toFixed(2), ((s.budget[d.id] / 100) * s.ask).toFixed(2));
  add("Simulated demand growth %", bo.demand.toFixed(0), "Simulated capacity growth %", bo.capacity.toFixed(0));
  add();
  add("GROWTH", "Weight %");
  for (const p of PILLARS) add(p.title, s.weights[p.id] ?? 0);
  add("Target lakh orders/month", s.target, "Practice facility capacity", FACILITY_CAP);
  add("Funding ask (Rs crore, hypothetical)", s.ask);
  const esc = (v: string | number) => {
    const t = String(v);
    return /[",\n]/.test(t) ? `"${t.replace(/"/g, '""')}"` : t;
  };
  const csv = "﻿" + rows.map((r) => r.map(esc).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = `EatBetter-SkilliZee-Financial-Model-${fileStem(student)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
