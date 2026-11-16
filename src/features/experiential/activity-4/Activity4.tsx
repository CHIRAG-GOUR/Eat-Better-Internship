"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  Check,
  CheckCircle2,
  Info,
  Lightbulb,
  Maximize,
  Minimize,
  RotateCcw,
  Sparkles,
  Star,
  Target,
} from "lucide-react";
import {
  BRAND_PEERS,
  BUDGET_AREAS,
  BUDGET_IDS,
  COMPETITOR_CATEGORIES,
  FINANCIAL_FACTS,
  getOrderUnitEconomics,
  GROWTH_PILLARS,
  PITCH_QUESTIONS,
  SKU_IDS,
  SKUS,
} from "./data";
import { buildBusinessReport, downloadFinancialCsv } from "./report";
import { useBusinessStore } from "./store";
import type { BusinessFocus } from "./Business3D";
import { ProjectReadyPopup, useStudent } from "../shared/ProjectReadyPopup";

const Business3D = dynamic(() => import("./Business3D"), {
  ssr: false,
  loading: () => <div className="grid h-full place-items-center text-cocoa-2">Entering the executive strategy suite…</div>,
});

const STAGES = [
  "Discover",
  "Pricing & BOM",
  "Financials",
  "Competition",
  "Growth Budget",
  "Scalability",
  "Investor Pitch",
  "Project",
];

const pct = (x: number) => `${Math.round(x)}%`;

const btn = "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-45";
const primary = `${btn} bg-orange text-white hover:bg-cocoa shadow-[2px_2px_0_0_#2f1c1a]`;
const secondary = `${btn} border border-cocoa/20 bg-white text-cocoa hover:border-cocoa`;

function Kicker({ children }: { children: React.ReactNode }) {
  return <div className="text-[0.78rem] font-extrabold uppercase tracking-[0.14em] text-orange">{children}</div>;
}

function Metric({
  label,
  value,
  sub,
  tone = "neutral",
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: "good" | "bad" | "info" | "neutral";
}) {
  const bg =
    tone === "good"
      ? "bg-success/10 text-success"
      : tone === "bad"
      ? "bg-error/10 text-error"
      : tone === "info"
      ? "bg-orange/10 text-orange"
      : "bg-cream text-cocoa";
  return (
    <div className={`rounded-2xl p-3.5 ${bg}`}>
      <div className="text-[0.72rem] font-extrabold uppercase tracking-[0.08em] opacity-80">{label}</div>
      <div className="font-display text-[1.45rem] font-semibold leading-tight">{value}</div>
      {sub && <div className="mt-0.5 text-[0.78rem] opacity-85">{sub}</div>}
    </div>
  );
}

export default function Activity4() {
  const s = useBusinessStore();
  const [hydrated, setHydrated] = useState(false);
  const [student, setStudent] = useStudent();
  const [full, setFull] = useState(false);
  const [webgl, setWebgl] = useState(true);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate from storage
    setHydrated(true);
  }, []);

  useEffect(() => {
    const c = document.createElement("canvas");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time capability check
    setWebgl(!!(c.getContext("webgl2") || c.getContext("webgl")));
    const on = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);

  const toggleFull = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => undefined);
    } else {
      document.exitFullscreen().catch(() => undefined);
    }
  };

  const focus: BusinessFocus =
    s.stage === 0
      ? "overview"
      : s.stage === 1
      ? "pricing"
      : s.stage === 2
      ? "finance"
      : s.stage === 3
      ? "competitor"
      : s.stage === 4
      ? "budget"
      : s.stage === 5
      ? "growth"
      : s.stage === 6
      ? "pitch"
      : "overview";

  const go = (n: number) => {
    s.setStage(n);
  };

  /* ── Calculations for Stage 1 ────────────────────────────── */
  const curSku = SKUS[s.selectedSku];
  const curCost = s.skuCosts[s.selectedSku] ?? curSku.bom;
  const productionDiscount = s.productionLever ? 0.8 : 1.0;
  const effProductionCost = Math.round(curCost.production * productionDiscount);
  const totalCogs = curCost.ingredients + curCost.packaging + effProductionCost;
  const grossProfit = curSku.retailPrice - totalCogs;
  const grossMarginPct = Math.round((grossProfit / curSku.retailPrice) * 100);

  /* ── Calculations for Stage 4 (Budget) ───────────────────── */
  const totalBudgetPct = BUDGET_IDS.reduce((acc, id) => acc + (s.budget[id] ?? 0), 0);
  const budgetValid = totalBudgetPct === 100;

  /* ── Calculations for Stage 6 (Pitch Score) ──────────────── */
  const pitchQuestionsCount = PITCH_QUESTIONS.length;
  const pitchAnsweredCount = Object.keys(s.pitchAnswers).length;
  const pitchAllAnswered = pitchAnsweredCount === pitchQuestionsCount;
  const totalPitchScore = PITCH_QUESTIONS.reduce((acc, q) => {
    const optId = s.pitchAnswers[q.id];
    const opt = q.options.find((o) => o.id === optId);
    return acc + (opt?.score ?? 0);
  }, 0);

  /* ── Overall Evaluation Score ────────────────────────────── */
  const overallScore = Math.min(
    100,
    Math.round(
      (s.stage >= 2 ? 20 : 10) + // pricing & financials understood
        (s.selectedMoat ? 15 : 5) + // competition mapped
        (budgetValid ? 25 : 10) + // balanced capital allocation
        (s.growthStrategy.rationale.length > 20 ? 15 : 5) + // strategic scalability
        (totalPitchScore * 0.25), // investor pitch performance (max 25)
    ),
  );

  const starCount = overallScore >= 85 ? 3 : overallScore >= 65 ? 2 : 1;

  if (!hydrated) {
    return <div className="grid min-h-screen place-items-center bg-[#EDE8E2] text-cocoa-2">Loading executive suite…</div>;
  }

  return (
    <div className="relative min-h-screen w-full overflow-x-hidden bg-[#EDE8E2] text-cocoa font-sans">
      {/* 3D Background */}
      <div className="fixed inset-0 z-0 pointer-events-auto">
        {webgl ? (
          <Business3D focus={focus} selectedSku={s.selectedSku} onPickSku={(id) => s.set({ selectedSku: id })} />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-[#EDE8E2] via-[#E2D9CE] to-[#D5C6B8]" />
        )}
      </div>

      {/* Top Header / Progress Bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-cocoa/15 bg-cream/90 px-4 py-2.5 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 font-display text-[1.1rem] font-bold">
            <span className="text-orange">Eat Better Co</span>
            <span className="text-cocoa/40">×</span>
            <span>SkilliZee</span>
          </div>
          <span className="hidden rounded-full border border-orange/30 bg-orange/10 px-2.5 py-0.5 text-[0.72rem] font-extrabold uppercase tracking-wider text-orange sm:inline-block">
            Activity 4 · Strategy Suite
          </span>
        </div>

        {/* Stage Pills */}
        <nav aria-label="Stages" className="hidden lg:flex items-center gap-1 text-[0.78rem]">
          {STAGES.map((label, idx) => {
            const active = s.stage === idx;
            const completed = s.stage > idx;
            return (
              <button
                key={label}
                onClick={() => go(idx)}
                className={`flex items-center gap-1 rounded-full px-2.5 py-1 font-bold transition-colors ${
                  active
                    ? "bg-orange text-white"
                    : completed
                    ? "bg-cocoa/10 text-cocoa hover:bg-cocoa/20"
                    : "text-cocoa-2 opacity-50 hover:opacity-80"
                }`}
              >
                {completed ? <Check className="size-3" /> : <span>{idx}</span>}
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              if (confirm("Restart this strategy activity from Stage 0?")) s.restart();
            }}
            aria-label="Restart activity"
            title="Restart activity"
            className="rounded-lg p-2 text-cocoa-2 transition-colors hover:bg-cocoa/10"
          >
            <RotateCcw className="size-4" />
          </button>
          <button
            onClick={toggleFull}
            aria-label={full ? "Exit fullscreen" : "Enter fullscreen"}
            title={full ? "Exit fullscreen" : "Enter fullscreen"}
            className="rounded-lg p-2 text-cocoa-2 transition-colors hover:bg-cocoa/10"
          >
            {full ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
          </button>
        </div>
      </header>

      {/* Main Interactive Stage Panel */}
      <div className="relative z-10 flex min-h-[calc(100vh-53px)] items-center justify-center p-3 sm:p-6 pointer-events-none">
        <section className="w-full max-w-4xl rounded-[26px] border border-cocoa/15 bg-white/95 p-4 sm:p-7 shadow-[5px_5px_0_0_#2F1C1A] backdrop-blur-lg pointer-events-auto transition-all">
          
          {/* ── STAGE 0: DISCOVER ─────────────────────────────────── */}
          {s.stage === 0 && (
            <div className="space-y-4">
              <Kicker>Executive Brief · Management & Strategy Role</Kicker>
              <h1 className="font-display text-[1.85rem] font-bold leading-tight sm:text-[2.2rem]">
                Build the Eat Better Business: Pricing, Unit Economics & 3-Year Scale
              </h1>
              <p className="text-[1.02rem] leading-relaxed text-cocoa-2">
                Welcome to the <strong>Eat Better Co Executive Strategy Suite</strong>. Following the April 2025 Pre-Series A funding round co-led by <em>Prath Ventures</em> and <em>Spring Marketing Capital</em>, you join the core commercial leadership team.
              </p>
              <div className="grid gap-3 sm:grid-cols-3">
                <Metric label="FY24 Revenue" value="Rs 14.7 Cr" sub="+165% YoY Expansion" tone="good" />
                <Metric label="Monthly Velocity" value="2,00,000+" sub="Fulfilled Orders / Mo" tone="info" />
                <Metric label="Jaipur Hub" value="50,000 sq.ft" sub="Central Manufacturing" tone="good" />
              </div>
              <div className="rounded-2xl border border-cocoa/15 bg-cream/70 p-4">
                <div className="flex items-center gap-2 font-display text-[1.05rem] font-semibold text-cocoa">
                  <Target className="size-5 text-orange" /> Your Mission as Commercial Strategist:
                </div>
                <ul className="mt-2.5 grid gap-2 text-[0.92rem] text-cocoa-2 sm:grid-cols-2">
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-orange" />
                    <span>Evaluate real SKU price-per-gram metrics & gross margins</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-orange" />
                    <span>Decode why a high-growth brand reports an intentional loss of Rs 63 lakh</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-orange" />
                    <span>Map positioning against Haldiram&apos;s, Bikaji & modern health peers</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <Check className="mt-0.5 size-4 shrink-0 text-orange" />
                    <span>Allocate Rs 10 Cr growth capital & defend your plan to investors</span>
                  </li>
                </ul>
              </div>
              <div className="flex justify-end pt-2">
                <button onClick={() => go(1)} className={primary}>
                  Step into the Boardroom <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── STAGE 1: PRICING & UNIT ECONOMICS ──────────────────── */}
          {s.stage === 1 && (
            <div className="space-y-4">
              <Kicker>Stage 1 · Pricing & Bill of Materials (BOM)</Kicker>
              <h2 className="font-display text-[1.6rem] font-bold">Product Pricing & Price-Per-Gram Metrics</h2>
              <p className="text-[0.95rem] text-cocoa-2">
                Clean-label snacking relies on whole dates, nuts, seeds, and roasted millets—raw materials that cost significantly more than mass-market maida and palm oil. Inspect each real SKU below:
              </p>

              {/* SKU Selector Tabs */}
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {SKU_IDS.map((id) => {
                  const item = SKUS[id];
                  const active = s.selectedSku === id;
                  return (
                    <button
                      key={id}
                      onClick={() => s.set({ selectedSku: id })}
                      className={`flex flex-col rounded-2xl border-2 p-2.5 text-left transition-all ${
                        active
                          ? "border-orange bg-orange/10 shadow-[2px_2px_0_0_#2F1C1A]"
                          : "border-cocoa/15 bg-white hover:border-cocoa/40"
                      }`}
                    >
                      <div className="relative h-16 w-full overflow-hidden rounded-xl bg-cream">
                        <Image src={item.img} alt={item.alt} fill sizes="160px" className="object-cover" />
                      </div>
                      <span className="mt-2 truncate font-display text-[0.88rem] font-bold">{item.short}</span>
                      <span className="text-[0.78rem] text-cocoa-2">
                        {item.grams}g · <strong>Rs {item.retailPrice}</strong>
                      </span>
                      <span className="text-[0.72rem] font-extrabold text-orange">~Rs {item.statedPricePerGram.toFixed(2)}/g</span>
                    </button>
                  );
                })}
              </div>

              {/* SKU Cost & BOM Breakdown Card */}
              <div className="rounded-2xl border border-cocoa/15 bg-cream/70 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cocoa/10 pb-3">
                  <div>
                    <h3 className="font-display text-[1.2rem] font-bold">{curSku.name}</h3>
                    <p className="text-[0.84rem] text-cocoa-2">{curSku.description}</p>
                  </div>
                  <div className="text-right">
                    <span className="block text-[0.75rem] font-bold uppercase tracking-wider text-cocoa-2">Retail Price</span>
                    <span className="font-display text-[1.4rem] font-extrabold text-cocoa">Rs {curSku.retailPrice}</span>
                  </div>
                </div>

                <div className="mt-3 grid gap-4 sm:grid-cols-3">
                  {/* Ingredients BOM */}
                  <div>
                    <label className="text-[0.78rem] font-bold uppercase tracking-wide text-cocoa-2">
                      Raw Ingredients BOM (Simulated)
                    </label>
                    <div className="mt-1 flex items-center justify-between rounded-xl border border-cocoa/20 bg-white p-2.5">
                      <span className="font-bold">Rs {curCost.ingredients}</span>
                      <span className="text-[0.75rem] text-cocoa-2">{Math.round((curCost.ingredients / curSku.retailPrice) * 100)}% of retail</span>
                    </div>
                  </div>

                  {/* Packaging BOM */}
                  <div>
                    <label className="text-[0.78rem] font-bold uppercase tracking-wide text-cocoa-2">
                      Primary & Gift Box Packaging
                    </label>
                    <div className="mt-1 flex items-center justify-between rounded-xl border border-cocoa/20 bg-white p-2.5">
                      <span className="font-bold">Rs {curCost.packaging}</span>
                      <span className="text-[0.75rem] text-cocoa-2">{Math.round((curCost.packaging / curSku.retailPrice) * 100)}% of retail</span>
                    </div>
                  </div>

                  {/* Production & Labour */}
                  <div>
                    <label className="text-[0.78rem] font-bold uppercase tracking-wide text-cocoa-2">
                      Production & Roasting Labour
                    </label>
                    <div className="mt-1 flex items-center justify-between rounded-xl border border-cocoa/20 bg-white p-2.5">
                      <span className="font-bold">Rs {effProductionCost}</span>
                      <span className="text-[0.75rem] text-cocoa-2">{s.productionLever ? "Jaipur Hub (-20%)" : "Standard"}</span>
                    </div>
                  </div>
                </div>

                {/* Efficiency Lever Toggle */}
                <div className="mt-4 flex flex-wrap items-center justify-between gap-2 rounded-xl border border-orange/30 bg-orange/5 p-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="size-5 text-orange" />
                    <span className="text-[0.88rem] font-bold text-cocoa">
                      Simulate In-House Jaipur Hub Production Leverage (-20% labour/batch cost)
                    </span>
                  </div>
                  <button
                    onClick={() => s.set({ productionLever: !s.productionLever })}
                    className={`rounded-xl px-3 py-1.5 text-[0.82rem] font-bold transition-all ${
                      s.productionLever ? "bg-orange text-white" : "border border-cocoa/20 bg-white text-cocoa"
                    }`}
                  >
                    {s.productionLever ? "Lever Active" : "Apply Efficiency"}
                  </button>
                </div>

                {/* Gross Profit & Margin Results */}
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <Metric label="Total Unit COGS" value={`Rs ${totalCogs}`} sub={`${Math.round((totalCogs / curSku.retailPrice) * 100)}% of price`} />
                  <Metric label="Gross Profit" value={`Rs ${grossProfit}`} sub="Per unit sold" tone="good" />
                  <Metric label="Gross Margin" value={pct(grossMarginPct)} sub="Target >50%" tone={grossMarginPct >= 50 ? "good" : "bad"} />
                  <Metric label="Price Per Gram" value={`Rs ${curSku.statedPricePerGram.toFixed(2)}`} sub={`${curSku.grams}g pack size`} tone="info" />
                </div>
              </div>

              {/* Strategic Pricing Principle Box */}
              <div className="rounded-2xl border border-cocoa/15 bg-white p-3.5 text-[0.88rem] leading-relaxed text-cocoa-2">
                <strong>Volume & Bundling Insight:</strong> Notice how the <em>Ultimate Snack Box</em> at <strong>Rs 1.13/g</strong> commands a lower price per gram than the <em>Assorted Laddoo Box 42</em> at <strong>Rs 1.55/g</strong>. Bundling 12 diverse snack packs drives a higher absolute cart value (Rs 749 vs Rs 349), amortizing fixed packaging and shipping costs while expanding transaction margins.
              </div>

              <div className="flex justify-between pt-2">
                <button onClick={() => go(0)} className={secondary}>
                  Back
                </button>
                <button onClick={() => go(2)} className={primary}>
                  Next: Financial Performance <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── STAGE 2: FINANCIAL PERFORMANCE & DASHBOARD ──────────── */}
          {s.stage === 2 && (
            <div className="space-y-4">
              <Kicker>Stage 2 · Financial Performance & Scale Trajectory</Kicker>
              <h2 className="font-display text-[1.6rem] font-bold">Top-Line Expansion vs. Net Profitability</h2>
              <p className="text-[0.95rem] text-cocoa-2">
                High-growth consumer food brands experience a known inflection curve: rapid revenue growth outpaces initial fixed overheads before flipping into sustainable net profit.
              </p>

              {/* Macro Performance Cards */}
              <div className="grid gap-3 sm:grid-cols-4">
                <Metric label="FY23 Revenue" value="Rs 5.5 Cr" sub="Base reported revenue" />
                <Metric label="FY24 Revenue" value="Rs 14.7 Cr" sub="+165% YoY growth" tone="good" />
                <Metric label="FY24 Net Loss" value="Rs 63 Lakh" sub="Growth reinvestment" tone="info" />
                <Metric label="Order Velocity" value="~2,00,000" sub="Orders fulfilled / mo" tone="good" />
              </div>

              {/* Representative Order Waterfall Breakdown */}
              <div className="rounded-2xl border border-cocoa/15 bg-cream/70 p-4">
                <div className="flex items-center justify-between">
                  <h3 className="font-display text-[1.1rem] font-bold">
                    Representative Order Unit Economics Waterfall (AOV: Rs {FINANCIAL_FACTS.avgOrderValue})
                  </h3>
                  <span className="rounded-full bg-orange/10 px-2.5 py-0.5 text-[0.72rem] font-extrabold text-orange">
                    Simulated Blend
                  </span>
                </div>
                <div className="mt-3 space-y-2">
                  {getOrderUnitEconomics(FINANCIAL_FACTS.avgOrderValue).map((item) => (
                    <div key={item.label} className="rounded-xl border border-cocoa/10 bg-white p-2.5">
                      <div className="flex items-center justify-between text-[0.88rem]">
                        <span className="font-semibold text-cocoa">{item.label}</span>
                        <div className="flex items-center gap-3">
                          <span className="text-[0.8rem] font-bold text-cocoa-2">{item.pct}%</span>
                          <span className={`font-mono font-bold ${item.type === "contribution" ? "text-success font-extrabold text-[1rem]" : item.type === "revenue" ? "text-cocoa" : "text-cocoa-2"}`}>
                            Rs {item.amount}
                          </span>
                        </div>
                      </div>
                      <div className="text-[0.75rem] text-cocoa-2 opacity-80">{item.note}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Guided Conceptual Inquiry */}
              <div className="rounded-2xl border border-orange/30 bg-orange/5 p-4">
                <div className="flex items-center gap-2 font-display text-[1rem] font-bold text-orange">
                  <Lightbulb className="size-5" /> Executive Due Diligence Question:
                </div>
                <p className="mt-1 text-[0.92rem] text-cocoa">
                  Why does a business with <strong>165% YoY top-line growth</strong> and <strong>2 lakh orders/month</strong> still post a net loss of Rs 63 lakh?
                </p>
                <div className="mt-3 grid gap-2 sm:grid-cols-2">
                  <button
                    onClick={() => s.set({ financeUnderstood: true })}
                    className={`rounded-xl border-2 p-3 text-left transition-all ${
                      s.financeUnderstood
                        ? "border-success bg-success/10 font-bold text-cocoa"
                        : "border-cocoa/15 bg-white text-cocoa hover:border-cocoa/40"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[0.88rem] font-bold text-success">
                      <CheckCircle2 className="size-4" /> Operational Leverage & Growth Investment
                    </div>
                    <p className="mt-1 text-[0.8rem] text-cocoa-2">
                      Fixed costs (central kitchen capex, brand marketing, new team) are front-loaded. As revenue scales past Rs 20 Cr+, these fixed overheads become a smaller percentage, flipping into net profit.
                    </p>
                  </button>

                  <div className="rounded-xl border border-cocoa/15 bg-white/70 p-3 text-left opacity-60">
                    <div className="text-[0.88rem] font-bold text-error">Broken Business Model</div>
                    <p className="mt-1 text-[0.8rem] text-cocoa-2">
                      The brand is losing money on every single package made and delivered, so more growth leads to deeper bankruptcy.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button onClick={() => go(1)} className={secondary}>
                  Back
                </button>
                <button onClick={() => go(3)} className={primary}>
                  Next: Competitive Landscape <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── STAGE 3: COMPETITIVE INTELLIGENCE ROOM ──────────────── */}
          {s.stage === 3 && (
            <div className="space-y-4">
              <Kicker>Stage 3 · Competitive Landscape & Differentiation</Kicker>
              <h2 className="font-display text-[1.6rem] font-bold">The Competitive K-Matrix & Market Positioning</h2>
              <p className="text-[0.95rem] text-cocoa-2">
                Where does Eat Better Co stand compared to traditional heritage giants, gourmet dry-fruit competitors, and local mithai outlets?
              </p>

              {/* Category Comparison Cards */}
              <div className="grid gap-2.5 sm:grid-cols-2">
                {COMPETITOR_CATEGORIES.map((cat) => {
                  const active = s.selectedCompetitor === cat.id;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => s.set({ selectedCompetitor: cat.id })}
                      className={`cursor-pointer rounded-2xl border-2 p-3.5 transition-all ${
                        active
                          ? "border-orange bg-orange/5 shadow-[2px_2px_0_0_#2F1C1A]"
                          : "border-cocoa/15 bg-white hover:border-cocoa/40"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-display text-[1rem] font-bold text-cocoa">{cat.name}</span>
                        <span className="text-[0.75rem] font-extrabold text-orange">{cat.pricePerGramRange}</span>
                      </div>
                      <div className="mt-1 text-[0.82rem] font-semibold text-cocoa-2">{cat.kind}</div>
                      <p className="mt-1 text-[0.78rem] text-cocoa-2 leading-snug">{cat.ingredients}</p>
                      <div className="mt-2.5 flex flex-wrap gap-1 text-[0.72rem]">
                        <span className="rounded-md bg-cream px-2 py-0.5 font-bold">Clean Label: {cat.cleanLabel}</span>
                        <span className="rounded-md bg-cream px-2 py-0.5 font-bold">Indian Flavour: {cat.familiarTaste}</span>
                        <span className="rounded-md bg-cream px-2 py-0.5 font-bold">Quick Commerce: {cat.qcomAvailability}</span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Peer Brands Benchmarking */}
              <div className="rounded-2xl border border-cocoa/15 bg-cream/70 p-4">
                <h3 className="font-display text-[1.05rem] font-bold text-cocoa">
                  Health & D2C Peer Benchmarking (From Internship Chapters)
                </h3>
                <div className="mt-3 grid gap-2 sm:grid-cols-3">
                  {BRAND_PEERS.slice(0, 3).map((peer) => (
                    <div key={peer.name} className="rounded-xl border border-cocoa/15 bg-white p-3">
                      <div className="flex items-center justify-between font-bold text-[0.92rem]">
                        <span>{peer.name}</span>
                        <span className="text-[0.75rem] text-cocoa-2">{peer.hq}</span>
                      </div>
                      <div className="text-[0.78rem] text-orange font-semibold">{peer.positioning}</div>
                      <p className="mt-1.5 text-[0.75rem] text-cocoa-2 leading-snug">
                        <strong>Eat Better&apos;s Edge:</strong> {peer.eatBetterEdge}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Moat Selection Choice */}
              <div className="rounded-2xl border border-cocoa/15 bg-white p-4">
                <div className="text-[0.84rem] font-bold uppercase tracking-wider text-orange">
                  Formulate Eat Better&apos;s Defensible Moat:
                </div>
                <div className="mt-2 grid gap-2 sm:grid-cols-2">
                  <button
                    onClick={() => s.set({ selectedMoat: "clean_taste" })}
                    className={`rounded-xl border-2 p-3 text-left transition-all ${
                      s.selectedMoat === "clean_taste"
                        ? "border-orange bg-orange/10 font-bold"
                        : "border-cocoa/15 bg-cream hover:border-cocoa/40"
                    }`}
                  >
                    <div className="font-bold text-[0.92rem]">Familiar Indian Indulgence + Clean Label Purity</div>
                    <p className="mt-1 text-[0.78rem] text-cocoa-2">
                      Competitors either offer bland fitness bars or deep-fried sweets. Eat Better captures the mainstream Indian craving for laddoos and bhujia without oil or sugar guilt.
                    </p>
                  </button>

                  <button
                    onClick={() => s.set({ selectedMoat: "cost_leadership" })}
                    className={`rounded-xl border-2 p-3 text-left transition-all ${
                      s.selectedMoat === "cost_leadership"
                        ? "border-orange bg-orange/10 font-bold"
                        : "border-cocoa/15 bg-cream hover:border-cocoa/40"
                    }`}
                  >
                    <div className="font-bold text-[0.92rem]">Lowest Cost Mass-Market Discounting</div>
                    <p className="mt-1 text-[0.78rem] text-cocoa-2">
                      Compete directly with Haldiram&apos;s on Rs 10 bhujia packets by replacing almonds and dates with cheaper fillers.
                    </p>
                  </button>
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button onClick={() => go(2)} className={secondary}>
                  Back
                </button>
                <button onClick={() => go(4)} className={primary}>
                  Next: Growth Budget Allocation <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── STAGE 4: GROWTH BUDGET ALLOCATION ──────────────────── */}
          {s.stage === 4 && (
            <div className="space-y-4">
              <Kicker>Stage 4 · Capital & Asset Allocation</Kicker>
              <h2 className="font-display text-[1.6rem] font-bold">Allocate Rs 10 Crore Growth Capital</h2>
              <p className="text-[0.95rem] text-cocoa-2">
                Following the Pre-Series A round, you must allocate a simulated <strong>Rs 10 Crore growth budget</strong> across six operational divisions. Total allocation must equal <strong>100%</strong>.
              </p>

              {/* Total Allocation Counter */}
              <div
                className={`flex items-center justify-between rounded-2xl border p-3.5 ${
                  budgetValid
                    ? "border-success bg-success/10 text-success"
                    : "border-error bg-error/10 text-error"
                }`}
              >
                <div className="flex items-center gap-2">
                  {budgetValid ? <BadgeCheck className="size-5" /> : <Info className="size-5" />}
                  <span className="font-bold text-[0.95rem]">
                    {budgetValid
                      ? "Budget Perfectly Balanced (100% / Rs 10.00 Cr)"
                      : `Total Allocation: ${totalBudgetPct}% (${totalBudgetPct > 100 ? "Over budget by " + (totalBudgetPct - 100) + "%" : "Remaining to allocate: " + (100 - totalBudgetPct) + "%"})`}
                  </span>
                </div>
                <span className="font-display text-[1.2rem] font-extrabold">{totalBudgetPct}%</span>
              </div>

              {/* Sliders Grid */}
              <div className="grid gap-3 sm:grid-cols-2">
                {BUDGET_IDS.map((id) => {
                  const area = BUDGET_AREAS[id];
                  const currentVal = s.budget[id] ?? area.defaultPct;
                  const crVal = (currentVal / 10).toFixed(2);
                  return (
                    <div key={id} className="rounded-2xl border border-cocoa/15 bg-white p-3.5">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[0.92rem] text-cocoa">{area.title}</span>
                        <div className="flex items-center gap-1.5 font-mono text-[0.9rem] font-bold text-orange">
                          <span>{currentVal}%</span>
                          <span className="text-[0.75rem] text-cocoa-2">(Rs {crVal} Cr)</span>
                        </div>
                      </div>
                      <p className="mt-1 text-[0.78rem] text-cocoa-2 line-clamp-2">{area.description}</p>

                      <div className="mt-2.5 flex items-center gap-3">
                        <input
                          type="range"
                          min="0"
                          max="50"
                          value={currentVal}
                          onChange={(e) => s.setBudget(id, parseInt(e.target.value, 10))}
                          className="h-2 w-full accent-orange"
                        />
                      </div>

                      <div className="mt-2 rounded-lg bg-cream px-2 py-1 text-[0.72rem] text-cocoa-2">
                        <strong>Gain:</strong> {area.impactGain}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between pt-2">
                <button onClick={() => go(3)} className={secondary}>
                  Back
                </button>
                <button disabled={!budgetValid} onClick={() => go(5)} className={primary}>
                  Next: Scalability Roadmap <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── STAGE 5: SCALABILITY & JAIPUR 50K HUB ──────────────── */}
          {s.stage === 5 && (
            <div className="space-y-4">
              <Kicker>Stage 5 · Strategic Scalability</Kicker>
              <h2 className="font-display text-[1.6rem] font-bold">The 4 Growth Pillars & Jaipur 50,000 sq. ft. Hub</h2>
              <p className="text-[0.95rem] text-cocoa-2">
                Eat Better Co&apos;s growth strategy focuses on four operational pillars to scale beyond seasonal peaks and dominate modern retail snacking:
              </p>

              {/* 4 Pillars List */}
              <div className="grid gap-2.5 sm:grid-cols-2">
                {GROWTH_PILLARS.map((p) => {
                  const active = s.growthStrategy.primaryPillar === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() =>
                        s.set({
                          growthStrategy: { ...s.growthStrategy, primaryPillar: p.id },
                        })
                      }
                      className={`cursor-pointer rounded-2xl border-2 p-3.5 transition-all ${
                        active
                          ? "border-orange bg-orange/5 shadow-[2px_2px_0_0_#2F1C1A]"
                          : "border-cocoa/15 bg-white hover:border-cocoa/40"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <span className="grid size-6 shrink-0 place-items-center rounded-full bg-cocoa text-[0.75rem] font-bold text-cream">
                          {p.num}
                        </span>
                        <h3 className="font-display text-[0.98rem] font-bold text-cocoa">{p.title}</h3>
                      </div>
                      <p className="mt-1.5 text-[0.8rem] text-cocoa-2 leading-snug">{p.sourceFact}</p>
                      <ul className="mt-2 space-y-0.5 text-[0.74rem] text-orange font-semibold">
                        {p.kpis.map((kpi, idx) => (
                          <li key={idx} className="flex items-center gap-1">
                            <span className="size-1 rounded-full bg-orange" /> {kpi}
                          </li>
                        ))}
                      </ul>
                    </div>
                  );
                })}
              </div>

              {/* Jaipur Hub Deep-Dive */}
              <div className="rounded-2xl border border-cocoa/15 bg-cream/70 p-4">
                <div className="flex items-center gap-2 font-display text-[1.05rem] font-bold text-cocoa">
                  <Building2 className="size-5 text-orange" /> Centralized 50,000 sq. ft. Hub (Jaipur, Rajasthan)
                </div>
                <p className="mt-1.5 text-[0.85rem] leading-relaxed text-cocoa-2">
                  Operating our own centralized facility in Jaipur eliminates dependence on third-party contract packers. It unlocks batch roasting consistency, strict date moisture control, nitrogen-flush packaging, and provides 5x output headroom.
                </p>

                <div className="mt-3">
                  <label className="text-[0.78rem] font-bold uppercase tracking-wide text-cocoa-2">
                    Strategist Rationale & Roadmap Summary (included in your Executive Report):
                  </label>
                  <textarea
                    rows={3}
                    value={s.growthStrategy.rationale}
                    onChange={(e) =>
                      s.set({
                        growthStrategy: { ...s.growthStrategy, rationale: e.target.value },
                      })
                    }
                    className="mt-1.5 w-full rounded-xl border border-cocoa/20 p-2.5 text-[0.88rem] text-cocoa outline-none focus:border-orange"
                    placeholder="Explain how in-housing production and multi-channel expansion drive profitability..."
                  />
                </div>
              </div>

              <div className="flex justify-between pt-2">
                <button onClick={() => go(4)} className={secondary}>
                  Back
                </button>
                <button onClick={() => go(6)} className={primary}>
                  Next: Investor Pitch Simulation <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── STAGE 6: INVESTOR PITCH SIMULATION ROOM ────────────── */}
          {s.stage === 6 && (
            <div className="space-y-4">
              <Kicker>Stage 6 · Shark / Investor Pitch Due Diligence</Kicker>
              <h2 className="font-display text-[1.6rem] font-bold">Defend the Strategy in the Boardroom</h2>
              <p className="text-[0.95rem] text-cocoa-2">
                Simulate due diligence questions from leading consumer and growth investors. Select the most rigorous commercial answer backed by the data you analyzed.
              </p>

              {/* Questions Accordion / List */}
              <div className="space-y-3">
                {PITCH_QUESTIONS.map((q, idx) => {
                  const selectedOptId = s.pitchAnswers[q.id];
                  const selectedOpt = q.options.find((o) => o.id === selectedOptId);
                  return (
                    <div key={q.id} className="rounded-2xl border border-cocoa/15 bg-white p-4">
                      <div className="flex items-center justify-between">
                        <span className="rounded-full bg-cream px-2.5 py-0.5 text-[0.72rem] font-extrabold uppercase text-cocoa-2">
                          Question {idx + 1} of 4 · {q.firm}
                        </span>
                        {selectedOpt && (
                          <span
                            className={`text-[0.75rem] font-bold uppercase ${
                              selectedOpt.strategicRating === "exceptional"
                                ? "text-success"
                                : selectedOpt.strategicRating === "solid"
                                ? "text-orange"
                                : "text-error"
                            }`}
                          >
                            Score: {selectedOpt.score} / 25
                          </span>
                        )}
                      </div>

                      <div className="mt-1 font-display text-[1rem] font-bold text-cocoa">
                        &ldquo;{q.question}&rdquo;
                      </div>
                      <div className="text-[0.75rem] text-cocoa-2 italic">Partner: {q.investor}</div>

                      <div className="mt-3 space-y-2">
                        {q.options.map((opt) => {
                          const isPicked = selectedOptId === opt.id;
                          return (
                            <button
                              key={opt.id}
                              onClick={() => s.setPitchAnswer(q.id, opt.id)}
                              className={`w-full rounded-xl border-2 p-3 text-left transition-all ${
                                isPicked
                                  ? opt.strategicRating === "exceptional"
                                    ? "border-success bg-success/10 font-medium"
                                    : opt.strategicRating === "solid"
                                    ? "border-orange bg-orange/10 font-medium"
                                    : "border-error bg-error/10 font-medium"
                                  : "border-cocoa/10 bg-cream/50 hover:border-cocoa/30"
                              }`}
                            >
                              <div className="text-[0.85rem] text-cocoa leading-relaxed">{opt.text}</div>
                            </button>
                          );
                        })}
                      </div>

                      {/* Instant Coaching Feedback */}
                      {selectedOpt && (
                        <div
                          className={`mt-3 rounded-xl p-3 text-[0.82rem] leading-snug ${
                            selectedOpt.strategicRating === "exceptional"
                              ? "bg-success/10 text-success"
                              : selectedOpt.strategicRating === "solid"
                              ? "bg-orange/10 text-cocoa"
                              : "bg-error/10 text-error"
                          }`}
                        >
                          <strong>
                            {selectedOpt.strategicRating === "exceptional"
                              ? "Executive Masterstroke! "
                              : selectedOpt.strategicRating === "solid"
                              ? "Good Strategy: "
                              : "Strategic Warning: "}
                          </strong>
                          {selectedOpt.feedback}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between pt-2">
                <button onClick={() => go(5)} className={secondary}>
                  Back
                </button>
                <button disabled={!pitchAllAnswered} onClick={() => go(7)} className={primary}>
                  Complete Activity & Download Project <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── STAGE 7: EVALUATE & PROJECT READY ──────────────────── */}
          {s.stage === 7 && (
            <div className="space-y-4">
              <Kicker>Evaluate & Deliver · Experiential Activity 4</Kicker>
              <h2 className="font-display text-[1.6rem] font-bold">Executive Evaluation & Strategy Artifacts</h2>
              <p className="text-[0.95rem] text-cocoa-2">
                You have completed the commercial and strategic analysis for Eat Better Co. Review your performance scorecard below, fill in your details and reflection, and generate your official deliverables.
              </p>

              {/* Scorecard Hero */}
              <div className="flex flex-wrap items-center gap-5 rounded-[22px] bg-cream p-5">
                <div className="grid size-24 place-items-center rounded-full border-4 border-success bg-white text-center shadow-sm">
                  <div>
                    <div className="font-display text-[1.8rem] font-bold text-success leading-none">{overallScore}</div>
                    <div className="text-[0.7rem] font-bold text-cocoa-2">/ 100</div>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-[1.3rem] font-bold">Commercial Readiness Score</div>
                  <div className="mt-1 flex gap-1">
                    {[0, 1, 2].map((i) => (
                      <Star
                        key={i}
                        className={`size-5 ${
                          i < starCount ? "fill-haldi text-[#C9A400]" : "text-cocoa/20"
                        }`}
                      />
                    ))}
                  </div>
                  <p className="mt-1 text-[0.84rem] text-cocoa-2">
                    Based on your SKU BOM calculations, financial analysis, competitive moat, budget balance, and investor pitch responses.
                  </p>
                </div>
              </div>

              {/* Metrics Breakdown Grid */}
              <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
                <Metric label="Pricing & BOM" value={pct(grossMarginPct)} sub="Gross Margin" tone="good" />
                <Metric label="Growth Capital" value="Rs 10 Cr" sub={budgetValid ? "Balanced" : "Review"} tone={budgetValid ? "good" : "bad"} />
                <Metric label="Jaipur Hub" value="50k sq.ft" sub="Capacity Headroom" tone="good" />
                <Metric label="Investor Pitch" value={`${totalPitchScore}/100`} sub={`${pitchAnsweredCount}/4 Answered`} tone={totalPitchScore >= 75 ? "good" : "info"} />
              </div>

              {/* Project Ready Popup Component */}
              <div className="mt-4">
                <ProjectReadyPopup
                  student={student}
                  setStudent={setStudent}
                  reflection={s.reflection}
                  setReflection={(r) => s.set({ reflection: r })}
                  reflectionPrompt="What did you learn about how product pricing, in-house manufacturing, and unit economics allow a high-growth food brand to scale profitably?"
                  submitWhat="Submit your Business Growth & Financial Strategy Report (PDF) and Financial Model (CSV) in the next submission chapter on the SkilliZee portal."
                  activity="Experiential Activity 4 · Build the Eat Better Business"
                  files={[
                    `EatBetter-SkilliZee-Business-Strategy-Report-${(student.name || "Student").replace(/\s+/g, "-")}.pdf`,
                    `EatBetter-Financial-Model-${(student.name || "Student").replace(/\s+/g, "-")}.csv`,
                  ]}
                  downloads={[
                    {
                      label: "Download Strategy Report (PDF)",
                      sub: "Complete Business Growth & Financial Strategy Report with calculations & scorecard",
                      kind: "pdf",
                      run: async () => {
                        await buildBusinessReport(s, student);
                      },
                    },
                    {
                      label: "Download Financial Model (CSV)",
                      sub: "Interactive spreadsheet export of SKU BOMs, order economics waterfall & capital budget",
                      kind: "csv",
                      run: () => downloadFinancialCsv(s, student),
                    },
                  ]}
                />
              </div>

              <div className="flex justify-start pt-2">
                <button onClick={() => go(6)} className={secondary}>
                  Review Investor Pitch
                </button>
              </div>
            </div>
          )}

        </section>
      </div>
    </div>
  );
}
