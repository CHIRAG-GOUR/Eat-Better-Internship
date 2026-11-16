"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Building2,
  Check,
  CheckCircle2,
  Maximize,
  Minimize,
  RotateCcw,
  Sparkles,
  Star,
  Target,
} from "lucide-react";
import {
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
  loading: () => <div className="grid h-full place-items-center text-cocoa-2">Opening the strategy suite…</div>,
});

const STAGES = [
  "Discover",
  "Pricing",
  "Financials",
  "Competition",
  "Budget",
  "Scalability",
  "Pitch",
  "Project",
];

const pct = (x: number) => `${Math.round(x)}%`;

const btn = "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-45 text-[0.88rem]";
const primary = `${btn} bg-orange text-white hover:bg-cocoa shadow-[2px_2px_0_0_#2f1c1a]`;
const secondary = `${btn} border border-cocoa/20 bg-white text-cocoa hover:border-cocoa`;

function Kicker({ children }: { children: React.ReactNode }) {
  return <div className="text-[0.75rem] font-extrabold uppercase tracking-[0.14em] text-orange">{children}</div>;
}

function StatPill({ label, val, sub, tone = "neutral" }: { label: string; val: string; sub?: string; tone?: "good" | "bad" | "info" | "neutral" }) {
  const bg =
    tone === "good"
      ? "bg-success/12 text-success border-success/30"
      : tone === "bad"
      ? "bg-error/12 text-error border-error/30"
      : tone === "info"
      ? "bg-orange/12 text-orange border-orange/30"
      : "bg-cream text-cocoa border-cocoa/15";
  return (
    <div className={`rounded-xl border p-2.5 ${bg}`}>
      <div className="text-[0.68rem] font-extrabold uppercase tracking-wider opacity-75">{label}</div>
      <div className="font-display text-[1.25rem] font-bold leading-tight">{val}</div>
      {sub && <div className="text-[0.72rem] opacity-85">{sub}</div>}
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
    // eslint-disable-next-line react-hooks/set-state-in-effect -- hydrate
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
      (s.stage >= 2 ? 20 : 10) +
        (s.selectedMoat ? 15 : 5) +
        (budgetValid ? 25 : 10) +
        (s.growthStrategy.rationale.length > 15 ? 15 : 5) +
        totalPitchScore * 0.25,
    ),
  );

  const starCount = overallScore >= 85 ? 3 : overallScore >= 65 ? 2 : 1;

  if (!hydrated) {
    return <div className="grid min-h-screen place-items-center bg-cream text-cocoa-2">Loading strategy suite…</div>;
  }

  return (
    <div className="relative flex min-h-screen flex-col bg-cream text-cocoa">
      {/* Top Header bar matching Activity 3 */}
      <header className="sticky top-0 z-30 border-b border-cocoa/10 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-3 py-2 sm:px-5">
          <Image
            src="/brand/eat-better-x-skillizee-600x400.png"
            alt="Eat Better Co × SkilliZee"
            width={90}
            height={60}
            className="h-10 w-auto"
          />
          <div className="min-w-0 flex-1">
            <div className="font-display text-[1.05rem] font-semibold leading-tight">
              Eat Better Strategy & Executive Suite
            </div>
            <div className="text-[0.78rem] text-cocoa-2">Module 4 · Experiential Activity 4</div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => {
                if (confirm("Restart this activity?")) s.restart();
              }}
              title="Restart Activity"
              className="rounded-lg p-2 text-cocoa-2 transition-colors hover:bg-cocoa/10"
            >
              <RotateCcw className="size-4" />
            </button>
            <button
              onClick={toggleFull}
              title={full ? "Exit fullscreen" : "Enter fullscreen"}
              className="rounded-lg p-2 text-cocoa-2 transition-colors hover:bg-cocoa/10"
            >
              {full ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
            </button>
          </div>
        </div>

        {/* Stage progress pills */}
        <ol className="no-scrollbar mx-auto flex max-w-[1600px] gap-1.5 overflow-x-auto px-3 pb-2 sm:px-5">
          {STAGES.map((t, i) => (
            <li
              key={t}
              onClick={() => go(i)}
              className={`flex shrink-0 cursor-pointer items-center gap-1.5 rounded-full px-3 py-1 text-[0.8rem] font-bold transition-all ${
                i === s.stage
                  ? "bg-orange text-white shadow-sm"
                  : i < s.stage
                  ? "bg-success/15 text-success hover:bg-success/25"
                  : "bg-white text-cocoa-2/70 hover:text-cocoa"
              }`}
            >
              {i < s.stage ? (
                <Check className="size-3.5" strokeWidth={3} />
              ) : (
                <span className="size-4 rounded-full border border-current text-center text-[0.68rem] leading-4">
                  {i + 1}
                </span>
              )}
              {t}
            </li>
          ))}
        </ol>
      </header>

      {/* Fullscreen 3D Scene in background */}
      <div className="fixed inset-0 z-0">
        {webgl ? (
          <Business3D
            focus={focus}
            selectedSku={s.selectedSku}
            onPickSku={(id) => {
              s.set({ selectedSku: id });
              if (s.stage !== 1) go(1);
            }}
            onSelectFocus={(f) => {
              if (f === "pricing") go(1);
              else if (f === "finance") go(2);
              else if (f === "competitor") go(3);
              else if (f === "budget") go(4);
              else if (f === "growth") go(5);
              else if (f === "pitch") go(6);
              else go(0);
            }}
          />
        ) : (
          <div className="grid h-full place-items-center p-6 text-center text-cocoa-2">
            3D isn&apos;t available on this device.
          </div>
        )}
      </div>

      {/* Main split grid: Left 60% open for 3D world, Right 40% compact control panel */}
      <div className="pointer-events-none relative z-10 mx-auto grid w-full max-w-[1600px] flex-1 gap-3 p-3 sm:p-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(420px,0.85fr)]">
        {/* Left transparent spacer */}
        <div className="h-[36vh] lg:h-auto" aria-hidden />

        {/* Right floating interactive drawer */}
        <section className="pointer-events-auto min-w-0 self-start rounded-[22px] border border-cocoa/15 bg-white/95 p-4 shadow-[0_24px_60px_-30px_rgba(47,28,26,0.55)] backdrop-blur sm:p-5 lg:max-h-[calc(100dvh-130px)] lg:overflow-y-auto">
          
          {/* ── STAGE 0: DISCOVER ─────────────────────────────────── */}
          {s.stage === 0 && (
            <div className="space-y-3.5">
              <Kicker>Executive Brief · Management & Strategy</Kicker>
              <h2 className="font-display text-[1.45rem] font-bold leading-tight">
                Build the Eat Better Business
              </h2>
              <p className="text-[0.9rem] leading-relaxed text-cocoa-2">
                Join the leadership team following the April 2025 Pre-Series A round (co-led by <em>Prath Ventures</em> & <em>Spring Marketing Capital</em>).
              </p>

              <div className="grid grid-cols-3 gap-2">
                <StatPill label="FY24 Revenue" val="Rs 14.7 Cr" sub="+165% YoY" tone="good" />
                <StatPill label="Orders / Mo" val="2,00,000+" sub="High velocity" tone="info" />
                <StatPill label="Jaipur Hub" val="50k sq.ft" sub="In-house mfg" tone="good" />
              </div>

              <div className="rounded-xl border border-cocoa/10 bg-cream/70 p-3 text-[0.85rem] text-cocoa-2">
                <div className="flex items-center gap-1.5 font-bold text-cocoa">
                  <Target className="size-4 text-orange" /> Strategy Objectives:
                </div>
                <div className="mt-1.5 flex flex-wrap gap-1.5">
                  <span className="rounded-md bg-white px-2 py-0.5 text-[0.75rem] font-semibold">1. SKU Price/Gram & BOM</span>
                  <span className="rounded-md bg-white px-2 py-0.5 text-[0.75rem] font-semibold">2. Financial Scale & Leverage</span>
                  <span className="rounded-md bg-white px-2 py-0.5 text-[0.75rem] font-semibold">3. Competitor K-Matrix</span>
                  <span className="rounded-md bg-white px-2 py-0.5 text-[0.75rem] font-semibold">4. Rs 10 Cr Capital Plan</span>
                  <span className="rounded-md bg-white px-2 py-0.5 text-[0.75rem] font-semibold">5. Investor Due Diligence</span>
                </div>
              </div>

              <div className="flex justify-end pt-1">
                <button onClick={() => go(1)} className={primary}>
                  Inspect Pricing & BOM <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── STAGE 1: PRICING & BOM ─────────────────────────────── */}
          {s.stage === 1 && (
            <div className="space-y-3.5">
              <div className="flex items-center justify-between">
                <Kicker>Stage 1 · Pricing & BOM</Kicker>
                <span className="text-[0.75rem] font-bold text-orange">Tap 3D plinths to switch SKU</span>
              </div>
              <h2 className="font-display text-[1.35rem] font-bold">SKU Price-Per-Gram & Unit Margin</h2>

              {/* SKU selector pills */}
              <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4">
                {SKU_IDS.map((id) => {
                  const itm = SKUS[id];
                  const active = s.selectedSku === id;
                  return (
                    <button
                      key={id}
                      onClick={() => s.set({ selectedSku: id })}
                      className={`flex flex-col items-center rounded-xl border p-2 text-center transition-all ${
                        active
                          ? "border-orange bg-orange/10 font-bold"
                          : "border-cocoa/15 bg-white hover:border-cocoa/30"
                      }`}
                    >
                      <span className="truncate text-[0.82rem]">{itm.short}</span>
                      <span className="text-[0.75rem] font-extrabold text-orange">Rs {itm.retailPrice}</span>
                      <span className="text-[0.68rem] text-cocoa-2">Rs {itm.statedPricePerGram.toFixed(2)}/g</span>
                    </button>
                  );
                })}
              </div>

              {/* Active SKU Breakdown */}
              <div className="rounded-xl border border-cocoa/15 bg-cream/70 p-3 space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-display text-[1rem] font-bold">{curSku.name}</span>
                  <span className="text-[0.75rem] font-bold text-cocoa-2">{curSku.grams}g pack</span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-[0.8rem]">
                  <div className="rounded-lg bg-white p-2 text-center border border-cocoa/10">
                    <div className="text-[0.68rem] font-bold text-cocoa-2">Ingredients</div>
                    <div className="font-bold">Rs {curCost.ingredients}</div>
                  </div>
                  <div className="rounded-lg bg-white p-2 text-center border border-cocoa/10">
                    <div className="text-[0.68rem] font-bold text-cocoa-2">Packaging</div>
                    <div className="font-bold">Rs {curCost.packaging}</div>
                  </div>
                  <div className="rounded-lg bg-white p-2 text-center border border-cocoa/10">
                    <div className="text-[0.68rem] font-bold text-cocoa-2">Labour</div>
                    <div className="font-bold">Rs {effProductionCost}</div>
                  </div>
                </div>

                {/* Efficiency Lever */}
                <button
                  onClick={() => s.set({ productionLever: !s.productionLever })}
                  className={`w-full flex items-center justify-between rounded-xl border p-2 text-[0.78rem] font-bold transition-all ${
                    s.productionLever
                      ? "border-success bg-success/15 text-success"
                      : "border-orange/30 bg-orange/5 text-cocoa hover:border-orange"
                  }`}
                >
                  <span className="flex items-center gap-1.5">
                    <Sparkles className="size-4 text-orange" /> In-House Jaipur Hub Lever (-20% labour)
                  </span>
                  <span>{s.productionLever ? "Active" : "Apply"}</span>
                </button>

                {/* Metrics */}
                <div className="grid grid-cols-3 gap-2">
                  <StatPill label="Total COGS" val={`Rs ${totalCogs}`} sub={`${Math.round((totalCogs / curSku.retailPrice) * 100)}%`} />
                  <StatPill label="Gross Profit" val={`Rs ${grossProfit}`} sub="Per box" tone="good" />
                  <StatPill label="Gross Margin" val={pct(grossMarginPct)} sub={grossMarginPct >= 50 ? "Healthy" : "Low"} tone={grossMarginPct >= 50 ? "good" : "bad"} />
                </div>
              </div>

              <div className="flex justify-between pt-1">
                <button onClick={() => go(0)} className={secondary}>
                  Back
                </button>
                <button onClick={() => go(2)} className={primary}>
                  Financials <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── STAGE 2: FINANCIAL PERFORMANCE ─────────────────────── */}
          {s.stage === 2 && (
            <div className="space-y-3.5">
              <Kicker>Stage 2 · Financials & Leverage</Kicker>
              <h2 className="font-display text-[1.35rem] font-bold">Top-Line Expansion vs Net Loss</h2>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                <StatPill label="FY23 Top-Line" val="Rs 5.5 Cr" sub="Base year" />
                <StatPill label="FY24 Top-Line" val="Rs 14.7 Cr" sub="+165% YoY" tone="good" />
                <StatPill label="Net Loss FY24" val="Rs 63 Lakh" sub="Growth opex" tone="info" />
                <StatPill label="Order Velocity" val="2,00,000/mo" sub="High volume" tone="good" />
              </div>

              {/* Order Waterfall */}
              <div className="rounded-xl border border-cocoa/15 bg-cream/70 p-3">
                <div className="text-[0.75rem] font-bold uppercase text-cocoa-2 mb-2">
                  Unit Waterfall (Avg Order: Rs {FINANCIAL_FACTS.avgOrderValue})
                </div>
                <div className="space-y-1.5 text-[0.8rem]">
                  {getOrderUnitEconomics(FINANCIAL_FACTS.avgOrderValue).map((itm) => (
                    <div key={itm.label} className="flex items-center justify-between rounded-lg bg-white px-2.5 py-1.5 border border-cocoa/10">
                      <span className="font-semibold">{itm.label}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[0.72rem] text-cocoa-2">{itm.pct}%</span>
                        <span className={`font-mono font-bold ${itm.type === "contribution" ? "text-success" : ""}`}>
                          Rs {itm.amount}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Knowledge check */}
              <button
                onClick={() => s.set({ financeUnderstood: !s.financeUnderstood })}
                className={`w-full rounded-xl border-2 p-2.5 text-left text-[0.82rem] transition-all ${
                  s.financeUnderstood
                    ? "border-success bg-success/10 font-bold text-success"
                    : "border-cocoa/15 bg-white text-cocoa hover:border-cocoa/30"
                }`}
              >
                <div className="flex items-center gap-1.5 font-bold">
                  <CheckCircle2 className="size-4" /> Operational Leverage Principle:
                </div>
                <p className="mt-1 text-[0.78rem] text-cocoa-2">
                  Fixed capex (Jaipur facility, brand ads) are front-loaded. Scaling past Rs 25 Cr absorbs fixed SG&A, flipping the Rs 63L loss into profit.
                </p>
              </button>

              <div className="flex justify-between pt-1">
                <button onClick={() => go(1)} className={secondary}>
                  Back
                </button>
                <button onClick={() => go(3)} className={primary}>
                  Competition <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── STAGE 3: COMPETITION ───────────────────────────────── */}
          {s.stage === 3 && (
            <div className="space-y-3.5">
              <Kicker>Stage 3 · Competitive Landscape</Kicker>
              <h2 className="font-display text-[1.35rem] font-bold">Competitive Positioning & Moat</h2>

              {/* 4 Category Cards */}
              <div className="grid grid-cols-2 gap-2">
                {COMPETITOR_CATEGORIES.map((cat) => {
                  const active = s.selectedCompetitor === cat.id;
                  return (
                    <div
                      key={cat.id}
                      onClick={() => s.set({ selectedCompetitor: cat.id })}
                      className={`cursor-pointer rounded-xl border-2 p-2.5 text-[0.8rem] transition-all ${
                        active
                          ? "border-orange bg-orange/10 font-bold"
                          : "border-cocoa/15 bg-white hover:border-cocoa/30"
                      }`}
                    >
                      <div className="flex justify-between font-bold">
                        <span className="truncate">{cat.name}</span>
                      </div>
                      <div className="text-[0.72rem] text-orange font-semibold">{cat.pricePerGramRange}</div>
                      <div className="mt-1 text-[0.7rem] text-cocoa-2">Clean: {cat.cleanLabel} · Desi: {cat.familiarTaste}</div>
                    </div>
                  );
                })}
              </div>

              {/* Moat selection */}
              <div className="rounded-xl border border-cocoa/15 bg-cream/70 p-3">
                <div className="text-[0.75rem] font-bold uppercase text-cocoa-2 mb-2">Select Eat Better&apos;s Strategic Moat:</div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <button
                    onClick={() => s.set({ selectedMoat: "clean_taste" })}
                    className={`rounded-xl border p-2 text-left text-[0.78rem] transition-all ${
                      s.selectedMoat === "clean_taste"
                        ? "border-orange bg-orange text-white font-bold"
                        : "border-cocoa/15 bg-white text-cocoa"
                    }`}
                  >
                    Familiar Taste + Clean Purity
                    <span className="block mt-0.5 text-[0.7rem] opacity-80">Dates/millets with zero refined sugar & palm oil</span>
                  </button>

                  <button
                    onClick={() => s.set({ selectedMoat: "cost_leadership" })}
                    className={`rounded-xl border p-2 text-left text-[0.78rem] transition-all ${
                      s.selectedMoat === "cost_leadership"
                        ? "border-orange bg-orange text-white font-bold"
                        : "border-cocoa/15 bg-white text-cocoa"
                    }`}
                  >
                    Mass Price Undercutting
                    <span className="block mt-0.5 text-[0.7rem] opacity-80">Compete on Rs 10 bhujia pouches</span>
                  </button>
                </div>
              </div>

              <div className="flex justify-between pt-1">
                <button onClick={() => go(2)} className={secondary}>
                  Back
                </button>
                <button onClick={() => go(4)} className={primary}>
                  Budget <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── STAGE 4: BUDGET ALLOCATION ─────────────────────────── */}
          {s.stage === 4 && (
            <div className="space-y-3.5">
              <Kicker>Stage 4 · Capital Allocation</Kicker>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-[1.35rem] font-bold">Allocate Rs 10 Cr Capital</h2>
                <span className={`font-mono text-[0.85rem] font-bold ${budgetValid ? "text-success" : "text-error"}`}>
                  {totalBudgetPct}% / 100%
                </span>
              </div>

              <div className="space-y-2">
                {BUDGET_IDS.map((id) => {
                  const area = BUDGET_AREAS[id];
                  const val = s.budget[id] ?? area.defaultPct;
                  return (
                    <div key={id} className="rounded-xl border border-cocoa/15 bg-white p-2.5">
                      <div className="flex items-center justify-between text-[0.82rem]">
                        <span className="font-bold text-cocoa">{area.title}</span>
                        <span className="font-mono font-bold text-orange">{val}% (Rs {(val / 10).toFixed(2)} Cr)</span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="40"
                        value={val}
                        onChange={(e) => s.setBudget(id, parseInt(e.target.value, 10))}
                        className="mt-1 h-1.5 w-full accent-orange"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between pt-1">
                <button onClick={() => go(3)} className={secondary}>
                  Back
                </button>
                <button disabled={!budgetValid} onClick={() => go(5)} className={primary}>
                  Growth Pillars <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── STAGE 5: SCALABILITY & JAIPUR HUB ──────────────────── */}
          {s.stage === 5 && (
            <div className="space-y-3.5">
              <Kicker>Stage 5 · Scalability Roadmap</Kicker>
              <h2 className="font-display text-[1.35rem] font-bold">The 4 Growth Pillars & Jaipur Hub</h2>

              <div className="grid grid-cols-2 gap-2">
                {GROWTH_PILLARS.map((p) => {
                  const active = s.growthStrategy.primaryPillar === p.id;
                  return (
                    <div
                      key={p.id}
                      onClick={() =>
                        s.set({ growthStrategy: { ...s.growthStrategy, primaryPillar: p.id } })
                      }
                      className={`cursor-pointer rounded-xl border-2 p-2.5 text-[0.8rem] transition-all ${
                        active
                          ? "border-orange bg-orange/10 font-bold"
                          : "border-cocoa/15 bg-white hover:border-cocoa/30"
                      }`}
                    >
                      <div className="font-bold">{p.title}</div>
                      <p className="mt-1 text-[0.72rem] text-cocoa-2 line-clamp-2">{p.tagline}</p>
                    </div>
                  );
                })}
              </div>

              {/* Rationale text box */}
              <div className="rounded-xl border border-cocoa/15 bg-cream/70 p-3">
                <div className="flex items-center gap-1.5 font-bold text-[0.82rem] text-cocoa mb-1">
                  <Building2 className="size-4 text-orange" /> Jaipur 50k Hub Roadmap Rationale:
                </div>
                <textarea
                  rows={2}
                  value={s.growthStrategy.rationale}
                  onChange={(e) =>
                    s.set({ growthStrategy: { ...s.growthStrategy, rationale: e.target.value } })
                  }
                  className="w-full rounded-lg border border-cocoa/20 p-2 text-[0.82rem] text-cocoa outline-none focus:border-orange bg-white"
                  placeholder="In-housing production expands gross margins and protects quality..."
                />
              </div>

              <div className="flex justify-between pt-1">
                <button onClick={() => go(4)} className={secondary}>
                  Back
                </button>
                <button onClick={() => go(6)} className={primary}>
                  Investor Pitch <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── STAGE 6: INVESTOR PITCH ────────────────────────────── */}
          {s.stage === 6 && (
            <div className="space-y-3.5">
              <Kicker>Stage 6 · Investor Pitch Due Diligence</Kicker>
              <div className="flex items-center justify-between">
                <h2 className="font-display text-[1.35rem] font-bold">Boardroom Shark Q&A</h2>
                <span className="font-mono text-[0.8rem] font-bold text-orange">
                  {pitchAnsweredCount}/4 Answered
                </span>
              </div>

              <div className="space-y-2.5">
                {PITCH_QUESTIONS.map((q, idx) => {
                  const pickedId = s.pitchAnswers[q.id];
                  const pickedOpt = q.options.find((o) => o.id === pickedId);
                  return (
                    <div key={q.id} className="rounded-xl border border-cocoa/15 bg-white p-3 space-y-1.5">
                      <div className="flex justify-between text-[0.72rem] text-cocoa-2 font-bold uppercase">
                        <span>Q{idx + 1} · {q.firm}</span>
                        {pickedOpt && (
                          <span className={pickedOpt.score >= 20 ? "text-success" : "text-orange"}>
                            +{pickedOpt.score} pts
                          </span>
                        )}
                      </div>
                      <div className="font-bold text-[0.86rem] text-cocoa">&ldquo;{q.question}&rdquo;</div>
                      <div className="grid gap-1">
                        {q.options.map((opt) => (
                          <button
                            key={opt.id}
                            onClick={() => s.setPitchAnswer(q.id, opt.id)}
                            className={`rounded-lg border p-2 text-left text-[0.76rem] transition-all ${
                              pickedId === opt.id
                                ? "border-orange bg-orange/10 font-bold"
                                : "border-cocoa/10 bg-cream/40 hover:border-cocoa/30"
                            }`}
                          >
                            {opt.text}
                          </button>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex justify-between pt-1">
                <button onClick={() => go(5)} className={secondary}>
                  Back
                </button>
                <button disabled={!pitchAllAnswered} onClick={() => go(7)} className={primary}>
                  Project Evaluation <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          )}

          {/* ── STAGE 7: EVALUATE & PROJECT READY ──────────────────── */}
          {s.stage === 7 && (
            <div className="space-y-4">
              <Kicker>Stage 7 · Project Evaluation & Deliverables</Kicker>
              <div className="flex items-center gap-4 rounded-2xl bg-cream p-4">
                <div className="grid size-16 place-items-center rounded-full border-4 border-success bg-white font-display text-[1.4rem] font-bold text-success">
                  {overallScore}
                </div>
                <div>
                  <div className="font-display text-[1.1rem] font-bold">Commercial Scorecard</div>
                  <div className="flex gap-1 text-[#C9A400]">
                    {[0, 1, 2].map((i) => (
                      <Star key={i} className={`size-4 ${i < starCount ? "fill-[#C9A400]" : "text-cocoa/20"}`} />
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-[0.8rem]">
                <StatPill label="Gross Margin" val={pct(grossMarginPct)} sub="SKU Economics" tone="good" />
                <StatPill label="Pitch Score" val={`${totalPitchScore}/100`} sub="Investor Due Diligence" tone="good" />
              </div>

              <div className="mt-3">
                <ProjectReadyPopup
                  student={student}
                  setStudent={setStudent}
                  reflection={s.reflection}
                  setReflection={(r) => s.set({ reflection: r })}
                  reflectionPrompt="What did you learn about product pricing, in-house manufacturing, and unit economics to scale a food brand profitably?"
                  submitWhat="Submit your Strategy Report (PDF) & Financial Model (CSV) on the SkilliZee portal."
                  activity="Experiential Activity 4 · Build the Eat Better Business"
                  files={[
                    `EatBetter-SkilliZee-Business-Strategy-Report-${(student.name || "Student").replace(/\s+/g, "-")}.pdf`,
                    `EatBetter-Financial-Model-${(student.name || "Student").replace(/\s+/g, "-")}.csv`,
                  ]}
                  downloads={[
                    {
                      label: "Download Strategy Report (PDF)",
                      sub: "Complete Strategy Report with unit economics & scorecard",
                      kind: "pdf",
                      run: async () => {
                        await buildBusinessReport(s, student);
                      },
                    },
                    {
                      label: "Download Financial Model (CSV)",
                      sub: "Spreadsheet export of SKU BOMs & capital budget",
                      kind: "csv",
                      run: () => downloadFinancialCsv(s, student),
                    },
                  ]}
                />
              </div>

              <div className="flex justify-start pt-1">
                <button onClick={() => go(6)} className={secondary}>
                  Review Pitch
                </button>
              </div>
            </div>
          )}

        </section>
      </div>
    </div>
  );
}
