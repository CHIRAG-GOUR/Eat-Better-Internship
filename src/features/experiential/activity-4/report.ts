"use client";

import { buildReport, type ReportBlock, type Student } from "../shared/pdf";
import { BUDGET_AREAS, BUDGET_IDS, COMPETITOR_CATEGORIES, FINANCIAL_FACTS, PITCH_QUESTIONS, SKU_IDS, SKUS } from "./data";
import type { Activity4State } from "./store";

/**
 * Generates the official "Eat Better Co × SkilliZee — Business Growth & Financial Strategy Report" PDF.
 */
export async function buildBusinessReport(state: Activity4State, student: Student) {
  const blocks: ReportBlock[] = [];

  // 1. Executive Summary
  blocks.push({ kind: "h", text: "1. Executive Summary" });
  blocks.push({
    kind: "p",
    text: `This Business Growth & Financial Strategy Report was formulated by ${student.name || "the Student"} as part of the Eat Better Co x SkilliZee Experiential Internship Programme (Activity 4). It evaluates the commercial foundation, unit economics, competitive moat, capital allocation, and 3-year scalability trajectory of Eat Better Co following its April 2025 Pre-Series A funding round co-led by Prath Ventures and Spring Marketing Capital.`,
  });
  blocks.push({
    kind: "kv",
    rows: [
      ["Executive Strategist", student.name || "Student Strategist"],
      ["Internship Track", "Module 4: Pricing, Competition & Growth"],
      ["Operating Revenue FY24", "Rs 14.7 crore (+165% YoY growth)"],
      ["Operating Scale", "~200,000 orders fulfilled monthly"],
      ["Central Production Facility", "50,000 sq. ft. Hub in Jaipur, Rajasthan"],
      ["Funding Milestone", "Pre-Series A co-led by Prath Ventures & Spring Marketing"],
    ],
  });

  // 2. Product Pricing & Bill of Materials (BOM)
  blocks.push({ kind: "h", text: "2. Product Pricing & Unit Economics Analysis" });
  blocks.push({
    kind: "p",
    text: "Pricing in clean-label FMCG reflects raw material purity and pack format efficiency. Comparing SKUs on a price-per-gram basis demonstrates how bundling drives higher AOV while reducing per-gram packaging and shipping overhead.",
  });

  const skuTableHead = ["SKU Name", "Weight", "Retail Price", "Price / Gram", "Total COGS", "Gross Margin %"];
  const skuTableRows = SKU_IDS.map((id) => {
    const s = SKUS[id];
    const c = state.skuCosts[id] ?? s.bom;
    const totalCogs = c.ingredients + c.packaging + c.production;
    const grossMarginPct = Math.round(((s.retailPrice - totalCogs) / s.retailPrice) * 100);
    return [s.name, `${s.grams} g`, `Rs ${s.retailPrice}`, `Rs ${s.statedPricePerGram.toFixed(2)}/g`, `Rs ${totalCogs}`, `${grossMarginPct}%`];
  });

  blocks.push({
    kind: "table",
    head: skuTableHead,
    rows: skuTableRows,
    widths: [55, 20, 25, 25, 25, 25],
  });

  blocks.push({
    kind: "callout",
    tone: "good",
    text: "BOM Leverage Insight: Bundled formats like the Ultimate Snack Box (Rs 1.13/g) achieve higher absolute gross profit per transaction while delivering value to family snackers, directly expanding order contribution margins.",
  });

  // 3. Financial Performance & Operational Leverage
  blocks.push({ kind: "h", text: "3. Financial Scale & Operational Leverage Analysis" });
  blocks.push({
    kind: "p",
    text: "Between FY23 and FY24, Eat Better Co expanded revenue from Rs 5.5 crore to Rs 14.7 crore (+165% YoY), while maintaining a moderate net loss of Rs 63 lakh. This reflects deliberate growth capital investment rather than structural unprofitability.",
  });

  blocks.push({
    kind: "kv",
    rows: [
      ["FY23 Top-Line Revenue", "Rs 5.5 crore"],
      ["FY24 Top-Line Revenue", "Rs 14.7 crore (+165% YoY)"],
      ["FY24 Net Loss", "Rs 63 lakh (operational investment)"],
      ["Monthly Order Velocity", "~2,00,000 orders/month"],
      ["Fixed Overhead Leverage", "SG&A overheads getting absorbed across 2.6x top-line scale"],
      ["Facility Readiness", "50,000 sq. ft. Jaipur hub transitions co-packing markups into internal gross margin"],
    ],
  });

  blocks.push({
    kind: "callout",
    tone: "info",
    text: "Financial Principle: In high-growth D2C, a net loss during 165% top-line scaling demonstrates reinvestment into customer acquisition and manufacturing infrastructure. As order volumes exceed the fixed-cost break-even threshold, profit margins expand rapidly.",
  });

  // 4. Competitive Landscape & K-Matrix
  blocks.push({ kind: "h", text: "4. Competitive Landscape & Positioning Moat" });
  blocks.push({
    kind: "p",
    text: "Eat Better Co occupies a distinct market quadrant: combining authentic Indian flavour profiles with strict clean-label ingredient integrity (zero palm oil, zero refined sugar).",
  });

  const compTableHead = ["Category / Brand", "Primary Focus", "Key Ingredients & Process", "Price / Gram", "Clean Label", "Indian Flavour"];
  const compTableRows = COMPETITOR_CATEGORIES.map((c) => [c.name, c.focus, c.ingredients, c.pricePerGramRange, c.cleanLabel, c.familiarTaste]);

  blocks.push({
    kind: "table",
    head: compTableHead,
    rows: compTableRows,
    widths: [40, 40, 45, 25, 22, 22],
  });

  blocks.push({
    kind: "callout",
    tone: "good",
    text: "Core Competitive Moat: Traditional incumbents (Haldiram's, Bikaji) are locked into industrial palm-oil fryers, while fitness bars lack festive and desi emotional resonance. Eat Better bridges indulgence with genuine whole-food health.",
  });

  // 5. Strategic Growth Budget Allocation (Rs 10 Cr Capital)
  blocks.push({ kind: "h", text: "5. Strategic Capital Allocation (Rs 10 Crore Growth Budget)" });
  blocks.push({
    kind: "p",
    text: "The student allocated a simulated Rs 10 Crore growth capital budget across six core functional areas to balance top-line acquisition with factory execution and channel depth.",
  });

  const budgetTableHead = ["Functional Area", "Allocation %", "Capital (INR)", "Strategic Impact Gain"];
  const budgetTableRows = BUDGET_IDS.map((id) => {
    const a = BUDGET_AREAS[id];
    const pctVal = state.budget[id] ?? a.defaultPct;
    const crVal = (pctVal / 10).toFixed(2);
    return [a.title, `${pctVal}%`, `Rs ${crVal} Cr`, a.impactGain];
  });

  blocks.push({
    kind: "table",
    head: budgetTableHead,
    rows: budgetTableRows,
    widths: [48, 24, 28, 75],
  });

  // 6. 4-Pillar Growth Roadmap & Jaipur Hub
  blocks.push({ kind: "h", text: "6. Operational Scalability & Jaipur 50,000 sq. ft. Hub" });
  blocks.push({
    kind: "bullets",
    items: [
      "Pillar 1: Product Portfolio Expansion across high-protein sweet & savoury ancient grain formulations.",
      "Pillar 2: Quick-Commerce Acceleration deepening dark-store density across Tier-1 & Tier-2 cities.",
      "Pillar 3: Corporate & B2B Gifting Scale transforming seasonal Diwali spikes into year-round enterprise wellness contracts.",
      "Pillar 4: Jaipur 50,000 sq. ft. Manufacturing Hub providing 5x output headroom with batch-level lab testing.",
    ],
  });
  blocks.push({
    kind: "callout",
    tone: "info",
    text: `Student Strategic Rationale: ${state.growthStrategy.rationale || "Expanding internal manufacturing capacity in Jaipur enables quality consistency while driving significant gross margin expansion across all retail channels."}`,
  });

  // 7. Investor Pitch Due Diligence Scorecard
  blocks.push({ kind: "h", text: "7. Investor Pitch Due Diligence Scorecard" });
  let totalScore = 0;
  const pitchReview = PITCH_QUESTIONS.map((q, idx) => {
    const chosenOptId = state.pitchAnswers[q.id];
    const opt = q.options.find((o) => o.id === chosenOptId) || q.options[0];
    const score = opt.score;
    totalScore += score;
    return `Q${idx + 1} (${q.investor} - ${q.firm}): ${opt.text} [Score: ${score}/25 - ${opt.strategicRating.toUpperCase()}]`;
  });

  blocks.push({
    kind: "bullets",
    items: pitchReview,
  });

  blocks.push({
    kind: "callout",
    tone: totalScore >= 80 ? "good" : "warn",
    text: `Investor Readiness Score: ${totalScore} / 100. ${totalScore >= 80 ? "Outstanding strategic maturity! The student demonstrated executive-level command of unit economics, operational moats, and investor due diligence." : "Solid commercial reasoning with opportunities to tighten gross margin defences and supply chain control."}`,
  });

  // 8. Student Reflection
  blocks.push({ kind: "h", text: "8. Strategist Reflection & Learning Synthesis" });
  blocks.push({
    kind: "p",
    text: state.reflection.trim() || "Through this activity, I evaluated how clean-label FMCG pricing structures, operational leverage, and in-house manufacturing enable a high-velocity brand like Eat Better to build long-term profitability while competing against industrial incumbents.",
  });

  const dateStr = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
  const filename = `EatBetter-SkilliZee-Business-Strategy-Report-${(student.name || "Student").replace(/\s+/g, "-")}.pdf`;

  return await buildReport({
    title: "Business Growth & Financial Strategy Report",
    activity: "Experiential Activity 4",
    module: "Module 4 · Pricing, Competition & Growth",
    student,
    date: dateStr,
    blocks,
    filename,
  });
}

/**
 * Generates and triggers the direct browser download of the Financial Model CSV.
 */
export function downloadFinancialCsv(state: Activity4State, student: Student) {
  const lines: string[] = [];
  const safe = (s: string) => `"${s.replace(/"/g, '""')}"`;

  lines.push("EAT BETTER CO x SKILLIZEE — FINANCIAL MODEL & BUSINESS VALUATION EXPORT");
  lines.push(`Strategist,${safe(student.name || "Student")}`);
  lines.push(`Student ID,${safe(student.id || "N/A")}`);
  lines.push(`Date,${safe(new Date().toISOString().split("T")[0])}`);
  lines.push("");

  // Section 1: SKU Unit Economics
  lines.push("SECTION 1: PRODUCT PRICING & BOM BREAKDOWN");
  lines.push("SKU Name,Package Weight (g),Retail Price (INR),Stated Price/Gram (INR),Ingredients BOM (INR),Packaging BOM (INR),Production Cost (INR),Total COGS (INR),Gross Profit (INR),Gross Margin (%)");
  for (const id of SKU_IDS) {
    const s = SKUS[id];
    const c = state.skuCosts[id] ?? s.bom;
    const totalCogs = c.ingredients + c.packaging + c.production;
    const profit = s.retailPrice - totalCogs;
    const margin = Math.round((profit / s.retailPrice) * 100);
    lines.push(
      [safe(s.name), s.grams, s.retailPrice, s.statedPricePerGram, c.ingredients, c.packaging, c.production, totalCogs, profit, `${margin}%`].join(","),
    );
  }
  lines.push("");

  // Section 2: Macro Financials
  lines.push("SECTION 2: REPORTED FINANCIAL PERFORMANCE");
  lines.push("Metric,Value,Unit,Note");
  lines.push(`FY23 Operating Revenue,${FINANCIAL_FACTS.fy23RevenueCr},Crore INR,Base year reported top-line`);
  lines.push(`FY24 Operating Revenue,${FINANCIAL_FACTS.fy24RevenueCr},Crore INR,Reported top-line scale`);
  lines.push(`YoY Revenue Growth,${FINANCIAL_FACTS.yoyGrowthPct},%,High-velocity expansion`);
  lines.push(`FY24 Reported Net Loss,${FINANCIAL_FACTS.fy24NetLossLakh},Lakh INR,Growth investment in operating leverage`);
  lines.push(`Monthly Order Volume,${FINANCIAL_FACTS.monthlyOrders},Orders/Month,Across web quick commerce & marketplaces`);
  lines.push(`Manufacturing Hub Size,${FINANCIAL_FACTS.facilitySqFt},Square Feet,Central facility in Jaipur`);
  lines.push("");

  // Section 3: Representative Order Economics
  lines.push("SECTION 3: REPRESENTATIVE ORDER UNIT ECONOMICS WATERFALL");
  lines.push("Line Item,Percentage of Cart,Amount (INR),Description");
  const aov = FINANCIAL_FACTS.avgOrderValue;
  lines.push(`Gross Order Value (AOV),100%,${aov},Blended order cart size`);
  lines.push(`Raw Materials (COGS),38%,${Math.round(aov * 0.38)},Dates nuts seeds millets`);
  lines.push(`Packaging Materials,8%,${Math.round(aov * 0.08)},Pouch moisture seal carton box`);
  lines.push(`Logistics & Freight,16%,${Math.round(aov * 0.16)},Surface 3PL and courier`);
  lines.push(`Marketplace Commissions,12%,${Math.round(aov * 0.12)},Platform fees and payment gateway`);
  lines.push(`Performance Marketing (CAC),18%,${Math.round(aov * 0.18)},Paid customer acquisition`);
  lines.push(`Order Contribution Margin,8%,${Math.round(aov * 0.08)},Contribution before fixed corporate SG&A`);
  lines.push("");

  // Section 4: Budget Allocation
  lines.push("SECTION 4: STRATEGIC GROWTH BUDGET ALLOCATION (10 CRORE INR)");
  lines.push("Functional Area,Allocation Percentage,Capital Allocated (Crore INR),Strategic Impact");
  for (const id of BUDGET_IDS) {
    const a = BUDGET_AREAS[id];
    const pct = state.budget[id] ?? a.defaultPct;
    const cr = (pct / 10).toFixed(2);
    lines.push([safe(a.title), `${pct}%`, cr, safe(a.impactGain)].join(","));
  }
  lines.push("");

  // Section 5: Investor Pitch Scores
  lines.push("SECTION 5: INVESTOR PITCH DUE DILIGENCE RESULTS");
  lines.push("Question ID,Investor,Partner Firm,Option Selected,Score Awarded (out of 25),Strategic Rating");
  for (const q of PITCH_QUESTIONS) {
    const optId = state.pitchAnswers[q.id];
    const opt = q.options.find((o) => o.id === optId) || q.options[0];
    lines.push([safe(q.id), safe(q.investor), safe(q.firm), safe(opt.text), opt.score, opt.strategicRating].join(","));
  }

  const csvContent = "data:text/csv;charset=utf-8," + encodeURIComponent(lines.join("\n"));
  const link = document.createElement("a");
  link.setAttribute("href", csvContent);
  link.setAttribute("download", `EatBetter-Financial-Model-${(student.name || "Student").replace(/\s+/g, "-")}.csv`);
  document.body.appendChild(link);
  link.click();
  link.remove();
}
