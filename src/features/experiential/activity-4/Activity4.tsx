"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, BadgeCheck, Building2, Check, Coins, Info, Landmark, Maximize, Minimize, Minus, PieChart, Plus, RotateCcw, Scale, Star, Swords, TrendingUp, X } from "lucide-react";
import { BRANDS, BRAND_ROWS } from "@/features/chapter-4-2/content";
import { BASE, BUDGET_CR, CHANNEL_FEES, DEPTS, FACILITY_CAP, FIN, FIXED, FREE_SHIP, KMATRIX, K_PLAYERS, LEVELS, ORDERS_NOW, PILLARS, SKUS, budgetOutcome, contribution, growthCap, investorQuestions, plNext, ppg, unitEconomics, type ChannelId, type Level } from "./data";
import { useBiz } from "./store";
import { basketOf, buildBusinessReport, downloadFinancialCsv } from "./report";
import type { HQFocus } from "./Business3D";
import { ProjectReadyPopup, useStudent } from "../shared/ProjectReadyPopup";

const HQ3D = dynamic(() => import("./Business3D"), { ssr: false, loading: () => <div className="grid h-full place-items-center text-cocoa-2">Opening the head office…</div> });

const STAGES = ["Discover", "Pricing", "Financials", "Competition", "Budget", "Growth", "Investor pitch", "Project"];
type Fb = { tone: "good" | "bad" | "info"; text: string } | null;
const rs = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
const pc = (x: number) => `${(x * 100).toFixed(1)}%`;
const words = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;

const btn = "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-45";
const primary = `${btn} bg-orange text-white hover:bg-cocoa`;
const secondary = `${btn} border border-cocoa/20 bg-white text-cocoa hover:border-cocoa`;

function Kicker({ children }: { children: React.ReactNode }) {
  return <div className="text-[0.8rem] font-extrabold uppercase tracking-[0.14em] text-orange">{children}</div>;
}
function Feedback({ fb }: { fb: Fb }) {
  return (
    <AnimatePresence mode="wait">
      {fb && (
        <motion.div key={fb.text} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="status" className={`mt-3 rounded-2xl px-4 py-3 text-[0.95rem] leading-snug ${fb.tone === "good" ? "bg-success/12" : fb.tone === "bad" ? "bg-error/10" : "bg-peach/70"}`}>
          <strong className={fb.tone === "good" ? "text-success" : fb.tone === "bad" ? "text-error" : "text-orange"}>{fb.tone === "good" ? "Good call. " : fb.tone === "bad" ? "Not quite. " : ""}</strong>
          {fb.text}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
function Metric({ label, value, tone = "neutral", sub }: { label: string; value: string; tone?: "good" | "bad" | "neutral"; sub?: string }) {
  return (
    <div className={`rounded-2xl p-3 ${tone === "good" ? "bg-success/10" : tone === "bad" ? "bg-error/10" : "bg-cream"}`}>
      <div className="text-[0.72rem] font-extrabold uppercase tracking-[0.08em] text-cocoa-2">{label}</div>
      <div className={`font-display text-[1.35rem] font-semibold leading-tight ${tone === "good" ? "text-success" : tone === "bad" ? "text-error" : "text-cocoa"}`}>{value}</div>
      {sub && <div className="text-[0.76rem] text-cocoa-2">{sub}</div>}
    </div>
  );
}
function Check2({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className={`flex items-start gap-2 rounded-xl px-3 py-1.5 text-[0.88rem] ${ok ? "bg-success/10" : "bg-cream text-cocoa-2"}`}>
      <span className={`mt-0.5 grid size-4 shrink-0 place-items-center rounded-full ${ok ? "bg-success text-white" : "border-2 border-cocoa/25"}`}>{ok && <Check className="size-3" strokeWidth={3} />}</span>
      <span>{children}</span>
    </li>
  );
}
function Slider({ label, value, min, max, step = 1, onChange, unit = "", hint }: { label: string; value: number; min: number; max: number; step?: number; onChange: (v: number) => void; unit?: string; hint?: string }) {
  return (
    <label className="block">
      <div className="flex items-baseline justify-between text-[0.88rem]">
        <span className="font-bold">{label}</span>
        <span className="tabular-nums font-bold text-orange">
          {unit === "₹" ? `₹${value}` : `${value}${unit}`}
        </span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="w-full accent-orange" aria-label={label} />
      {hint && <div className="text-[0.76rem] text-cocoa-2">{hint}</div>}
    </label>
  );
}
function Field({ label, value, onChange, rows = 2, placeholder }: { label: string; value: string; onChange: (v: string) => void; rows?: number; placeholder?: string }) {
  return (
    <label className="flex flex-col gap-1 text-[0.88rem] font-bold">
      {label}
      <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={rows} placeholder={placeholder} className="rounded-xl border border-cocoa/20 p-2.5 font-normal outline-none focus:border-orange" />
    </label>
  );
}

const PLAYER_COLORS: Record<string, string> = { eb: "#FF5C00", trad: "#C62828", health: "#2E9E5B", local: "#8A4FD6" };
const kmatrixOf = (param: "price" | "sweet", player: string) => KMATRIX.find((r) => r.id === param)!.v[player as keyof (typeof KMATRIX)[number]["v"]];

export default function Activity4() {
  const s = useBiz();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- wait for the saved attempt to load from this device
    setHydrated(true);
  }, []);
  const [student, setStudent] = useStudent();
  const [fb, setFb] = useState<Fb>(null);
  const [sku, setSku] = useState<string>(SKUS[0].id);
  const [guess, setGuess] = useState(1.0);
  const [player, setPlayer] = useState<string>(K_PLAYERS[0].id);
  const [pitchSent, setPitchSent] = useState(false);
  const [full, setFull] = useState(false);
  const [webgl, setWebgl] = useState(true);
  useEffect(() => {
    const c = document.createElement("canvas");
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time capability check
    setWebgl(!!(c.getContext("webgl2") || c.getContext("webgl")));
    const on = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);

  const stage = s.stage;
  const go = (n: number) => {
    s.set({ stage: n });
    setFb(null);
  };
  const focus: HQFocus = (["overview", "pricing", "finance", "compete", "budget", "growth", "pitch", "overview"] as HQFocus[])[stage] ?? "overview";

  /* ── stage 1 ── */
  const K = SKUS.find((k) => k.id === sku)!;
  const solved = Object.fromEntries(SKUS.map((k) => [k.id, s.ppg[k.id] != null]));
  const checkPpg = () => {
    const actual = ppg(K.price, K.grams);
    if (Math.abs(guess - actual) > 0.015) {
      s.set({ ppgMistakes: s.ppgMistakes + 1 });
      setFb({ tone: "bad", text: `Price per gram = price ÷ weight. ${K.short}: ₹${K.price} ÷ ${K.grams} g. Your ₹${guess.toFixed(2)}/g is ${guess > actual ? "too high" : "too low"}.` });
      return;
    }
    s.set({ ppg: { ...s.ppg, [K.id]: +guess.toFixed(2) } });
    setFb({ tone: "good", text: `₹${K.price} ÷ ${K.grams} g = ₹${actual.toFixed(2)} per gram.` });
    const next = SKUS.find((k) => k.id !== K.id && s.ppg[k.id] == null);
    if (next) setSku(next.id);
  };
  const allPpg = SKUS.every((k) => s.ppg[k.id] != null);
  const ue = unitEconomics(K.price, s.costs[K.id]);
  const setCost = (field: "ingredient" | "packaging" | "production", v: number) => s.set({ costs: { ...s.costs, [K.id]: { ...s.costs[K.id], [field]: v } } });
  const basket = basketOf(s);
  const d2c = contribution(basket.value, basket.cogs, "d2c");
  const basketOk = basket.value >= FREE_SHIP && d2c.pct >= 0.25;
  const grossOk = SKUS.every((k) => unitEconomics(k.price, s.costs[k.id]).grossPct >= 0.2);
  const stage1Ok = allPpg && basketOk && grossOk;

  /* ── stage 2 ── */
  const pl = plNext(s.levers);
  const cap = growthCap(s.levers.mk);
  const growthPct = (((FIN.revenueCrore - FIN.priorCrore) / FIN.priorCrore) * 100).toFixed(0);
  const explainOk = words(s.plExplain) >= 20 && /(fixed|overhead|scale|marketing|invest)/i.test(s.plExplain);
  const stage2Ok = pl.net >= 0 && explainOk;

  /* ── stage 3 ── */
  const placeGrid = (axis: "x" | "y", lv: Level) => {
    const truth = kmatrixOf(axis === "x" ? "price" : "sweet", player);
    const name = K_PLAYERS.find((p) => p.id === player)!.short;
    if (lv !== truth) {
      s.set({ gridMistakes: s.gridMistakes + 1 });
      setFb({ tone: "bad", text: `Check the K-Matrix row "${axis === "x" ? "Mass-market price accessibility" : "Natural sweetening innovation"}" for ${name}: it isn't ${lv}.` });
      return;
    }
    const cur = s.grid[player] ?? { x: null, y: null };
    const nextCell = { ...cur, [axis]: lv };
    s.set({ grid: { ...s.grid, [player]: nextCell } });
    if (nextCell.x && nextCell.y) {
      setFb({ tone: "good", text: `${name} placed: price accessibility ${nextCell.x}, natural sweetening ${nextCell.y}.` });
      const nx = K_PLAYERS.find((p) => p.id !== player && !(s.grid[p.id]?.x && s.grid[p.id]?.y));
      if (nx) setPlayer(nx.id);
    }
  };
  const gridDone = K_PLAYERS.every((p) => s.grid[p.id]?.x && s.grid[p.id]?.y);
  const sw = s.swot;
  const swChecks = {
    strength: words(sw.strength) >= 8 && /(clean|palm|sugar|date|natural|familiar|indian|desi|quick|packag)/i.test(sw.strength),
    weakness: words(sw.weakness) >= 8 && /(price|afford|premium|expens|cost|mass)/i.test(sw.weakness),
    opportunity: words(sw.opportunity) >= 8,
    edge: words(sw.edge) >= 8,
  };
  const stage3Ok = gridDone && Object.values(swChecks).every(Boolean);

  /* ── stage 4 ── */
  const total = DEPTS.reduce((a, d) => a + s.budget[d.id], 0);
  const bo = budgetOutcome(s.budget);
  const lowest = [...DEPTS].sort((a, b) => s.budget[a.id] - s.budget[b.id])[0];
  const stage4Ok = total === 100 && bo.warnings.length === 0;

  /* ── stage 5 ── */
  const wTotal = PILLARS.reduce((a, p) => a + (s.weights[p.id] ?? 0), 0);
  const supported = +(ORDERS_NOW * (1 + bo.fulfilled / 100)).toFixed(1);
  const capOk = s.target <= FACILITY_CAP || ((s.weights.infra ?? 0) >= 35 && s.budget.manufacturing >= 20);
  const budgetOkForTarget = s.target <= supported + 0.25;
  const stage5Ok = wTotal === 100 && capOk && budgetOkForTarget && words(s.growthWhy) >= 25;

  /* ── stage 6 ── */
  const questions = useMemo(() => investorQuestions({ ask: s.ask, levers: s.levers, budget: s.budget, target: s.target, weights: s.weights, weakness: s.swot.weakness }), [s.ask, s.levers, s.budget, s.target, s.weights, s.swot.weakness]);
  const pitchChecks = {
    opportunity: words(s.pitch.opportunity) >= 12,
    differentiation: words(s.pitch.differentiation) >= 12 && /(clean|palm|sugar|date|familiar|indian|roast)/i.test(s.pitch.differentiation),
    growth: words(s.pitch.growth) >= 12 && /(quick|portfolio|product|corporate|gift|b2b|jaipur|facility|capacity)/i.test(s.pitch.growth),
  };
  const answerOk = (i: number) => words(s.answers[i] ?? "") >= 15 && /\d/.test(s.answers[i] ?? "");
  const stage6Ok = Object.values(pitchChecks).every(Boolean) && questions.every((_, i) => answerOk(i));

  /* ── score ── */
  const scores = {
    pricing: Math.max(0, 100 - s.ppgMistakes * 10),
    finance: pl.net >= 0 ? (s.levers.growth <= 60 ? 100 : 80) : 40,
    competition: Math.max(0, 100 - s.gridMistakes * 10),
    budget: Math.round(Math.min(100, (bo.fulfilled / 70) * 100)),
    growth: capOk && budgetOkForTarget ? 100 : 60,
    pitch: stage6Ok ? 100 : 60,
  };
  const overall = Math.round(Object.values(scores).reduce((a, x) => a + x, 0) / Object.keys(scores).length);

  const toggleFull = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      /* not allowed here */
    }
  };

  if (!hydrated) return <div className="grid min-h-screen place-items-center bg-[#EFE6DA] text-cocoa-2">Opening the head office…</div>;
  const stem = (student.name.trim() || "student").replace(/\s+/g, "-");

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-[#EFE6DA] text-cocoa">
      <header className="sticky top-0 z-30 border-b border-cocoa/10 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-3 py-2 sm:px-5">
          <Image src="/brand/eat-better-x-skillizee-600x400.png" alt="Eat Better Co × SkilliZee" width={90} height={60} className="h-10 w-auto" />
          <div className="min-w-0 flex-1">
            <div className="text-[0.72rem] font-extrabold uppercase tracking-[0.14em] text-orange">Experiential Activity 4 · Module 4</div>
            <div className="truncate font-display text-[1.15rem] font-semibold leading-tight">Build the Eat Better Business</div>
          </div>
          <button onClick={() => (s.restart(), setFb(null), setSku(SKUS[0].id), setPlayer(K_PLAYERS[0].id), setPitchSent(false))} className={`${secondary} !px-3 !py-1.5 text-[0.85rem]`}>
            <RotateCcw className="size-4" /> Restart
          </button>
          <button onClick={toggleFull} aria-label={full ? "Exit fullscreen" : "Fullscreen"} className={`${secondary} !px-2.5 !py-1.5`}>
            {full ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
          </button>
        </div>
        <ol className="no-scrollbar mx-auto flex max-w-[1600px] gap-1.5 overflow-x-auto px-3 pb-2 sm:px-5">
          {STAGES.map((t, i) => (
            <li key={t} className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[0.82rem] font-bold ${i === stage ? "bg-orange text-white" : i < stage ? "bg-success/15 text-success" : "bg-white text-cocoa-2/70"}`}>
              {i < stage ? <Check className="size-3.5" strokeWidth={3} /> : <span>{i + 1}</span>}
              {t}
            </li>
          ))}
        </ol>
      </header>

      <div className="fixed inset-0 z-0">
        {webgl ? (
          <HQ3D focus={focus} solved={solved} selectedSku={stage === 1 ? sku : null} onSku={(id) => stage === 1 && setSku(id)} next={stage >= 2 ? { rev: pl.rev, net: pl.net } : null} grid={s.grid} budget={s.budget} target={s.target} ask={s.ask} pitchTitle={s.pitch.opportunity.split(/[.!?]/)[0]?.slice(0, 60) ?? ""} />
        ) : (
          <div className="grid h-full place-items-center p-6 text-center text-cocoa-2">3D isn&apos;t available on this device. Every task still works in the panel.</div>
        )}
      </div>

      <div className="pointer-events-none relative z-10 mx-auto grid w-full max-w-[1600px] flex-1 gap-3 p-3 sm:p-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(430px,0.9fr)]">
        <div className="h-[44vh] lg:h-auto" aria-hidden />
        <section className="pointer-events-auto min-w-0 self-start rounded-[22px] border border-cocoa/15 bg-white/95 p-4 shadow-[0_24px_60px_-30px_rgba(47,28,26,0.55)] backdrop-blur sm:p-5 lg:max-h-[calc(100dvh-130px)] lg:overflow-y-auto">
          {stage === 0 && (
            <div>
              <Kicker>Discover · your role</Kicker>
              <h1 className="mt-1 font-display text-[clamp(1.6rem,3vw,2.1rem)] font-semibold leading-tight">You&apos;ve joined Eat Better&apos;s management team</h1>
              <p className="mt-2 text-[1rem] leading-relaxed">Walk the head office department by department: price the products, read the numbers, map the competition, split a budget, plan growth the Jaipur facility can handle, then pitch it to investors.</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <Metric label="FY24 revenue" value="~₹14.7 cr" sub="reported, ~165% up" />
                <Metric label="FY24 net loss" value="~₹63 lakh" sub="reported" />
                <Metric label="Orders" value="~2 lakh/mo" sub="reported" />
              </div>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {[
                  [Scale, "Pricing", "Work out price per gram for the four real boxes, build a cost sheet and a profitable basket."],
                  [TrendingUp, "Financials", "Explain the loss, then pull levers to reach break-even without raising prices."],
                  [Swords, "Competition", "Place four competitor types on a positioning map from the K-Matrix; write a SWOT."],
                  [PieChart, "Budget", "Split a hypothetical ₹10 crore across six departments and see the trade-offs."],
                  [Building2, "Growth", "Weigh the growth pillars and set a target the facility and budget can support."],
                  [Landmark, "Pitch", "Pitch to three simulated investors and answer the questions your plan raises."],
                ].map(([I, h, t]) => {
                  const Ic = I as typeof Scale;
                  return (
                    <div key={h as string} className="flex gap-2.5 rounded-2xl bg-cream p-3">
                      <Ic className="mt-0.5 size-5 shrink-0 text-orange" />
                      <div>
                        <div className="font-display text-[1rem] font-semibold">{h as string}</div>
                        <p className="text-[0.86rem] leading-snug text-cocoa-2">{t as string}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-3 flex items-start gap-2 rounded-2xl bg-peach/60 p-3 text-[0.86rem]">
                <Info className="mt-0.5 size-4 shrink-0 text-orange" /> Reported facts come from your Module 4 chapters. Costs, fees, budgets, capacity and every outcome are hypothetical practice numbers, labelled as such. This is a learning simulation, not Eat Better&apos;s real plans or investment terms.
              </p>
              <button onClick={() => go(1)} className={`${primary} mt-4`}>
                Enter the head office <ArrowRight className="size-4" />
              </button>
            </div>
          )}

          {stage === 1 && (
            <div>
              <Kicker>Learn & practise · pricing and unit economics</Kicker>
              <h2 className="mt-1 font-display text-[1.45rem] font-semibold">What does a gram really cost the customer?</h2>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {SKUS.map((k) => (
                  <button key={k.id} onClick={() => (setSku(k.id), setGuess(1.0))} className={`overflow-hidden rounded-2xl border-2 text-left ${sku === k.id ? "border-orange" : "border-cocoa/10"}`}>
                    <div className="relative aspect-square bg-cream">
                      <Image src={k.img} alt={k.name} fill sizes="140px" className="object-cover" />
                      {solved[k.id] && <Check className="absolute right-1.5 top-1.5 size-5 rounded-full bg-success p-0.5 text-white" strokeWidth={3} />}
                    </div>
                    <div className="px-2 py-1.5 text-[0.8rem] font-bold leading-tight">
                      {k.short}
                      <span className="block font-normal text-cocoa-2">
                        ₹{k.price} · {k.grams} g
                      </span>
                    </div>
                  </button>
                ))}
              </div>
              <div className="mt-3 rounded-2xl border-2 border-orange/40 p-3">
                <div className="text-[0.85rem] font-bold">1 · Work out the price per gram of {K.name}</div>
                {s.ppg[K.id] != null ? (
                  <p className="mt-1 text-[0.92rem]">
                    ₹{K.price} ÷ {K.grams} g = <strong>₹{ppg(K.price, K.grams).toFixed(2)} per gram</strong>
                  </p>
                ) : (
                  <div className="mt-1 flex flex-wrap items-center gap-3">
                    <input type="range" min={0.4} max={2} step={0.01} value={guess} onChange={(e) => setGuess(+e.target.value)} className="flex-1 accent-orange" aria-label="Price per gram" />
                    <span className="w-20 text-right font-display text-[1.2rem] font-semibold tabular-nums">₹{guess.toFixed(2)}/g</span>
                    <button onClick={checkPpg} className={`${primary} !py-1.5`}>
                      Check
                    </button>
                  </div>
                )}
                {allPpg && <p className="mt-2 rounded-xl bg-cream p-2 text-[0.86rem]">Spot the pattern: the 42-laddoo box costs more per gram (₹1.55) than the 24-laddoo box (₹1.45), while the mixed Ultimate Snack Box (₹1.13) and the namkeen combo (₹0.67) bring the price per gram down.</p>}
              </div>
              <div className="mt-3 rounded-2xl border border-cocoa/10 p-3">
                <div className="text-[0.85rem] font-bold">2 · Cost sheet for {K.short} (hypothetical)</div>
                <div className="mt-2 grid gap-2">
                  <Slider label="Ingredients per box" value={s.costs[K.id].ingredient} min={20} max={Math.round(K.price * 0.6)} step={5} unit="₹" onChange={(v) => setCost("ingredient", v)} hint="Dates, nuts, millets and seeds cost more than maida and palm oil." />
                  <Slider label="Packaging per box" value={s.costs[K.id].packaging} min={10} max={120} step={2} unit="₹" onChange={(v) => setCost("packaging", v)} />
                  <Slider label="Production (labour, energy) per box" value={s.costs[K.id].production} min={10} max={100} step={2} unit="₹" onChange={(v) => setCost("production", v)} />
                </div>
                <div className="mt-2 grid grid-cols-3 gap-2">
                  <Metric label="COGS" value={rs(ue.cogs)} />
                  <Metric label="Gross profit" value={rs(ue.gross)} tone={ue.gross > 0 ? "good" : "bad"} />
                  <Metric label="Gross margin" value={pc(ue.grossPct)} tone={ue.grossPct >= 0.2 ? "good" : "bad"} sub="must stay 20%+" />
                </div>
              </div>
              <div className="mt-3 rounded-2xl border border-cocoa/10 p-3">
                <div className="text-[0.85rem] font-bold">3 · Build a website order that earns at least 25% after fees</div>
                <div className="mt-2 grid gap-1.5">
                  {SKUS.map((k) => (
                    <div key={k.id} className="flex items-center gap-2 text-[0.88rem]">
                      <span className="flex-1 font-bold">{k.short}</span>
                      <button aria-label={`Remove ${k.short}`} onClick={() => s.set({ basket: { ...s.basket, [k.id]: Math.max(0, (s.basket[k.id] ?? 0) - 1) } })} className="rounded-lg bg-cream p-1">
                        <Minus className="size-4" />
                      </button>
                      <span className="w-6 text-center tabular-nums">{s.basket[k.id] ?? 0}</span>
                      <button aria-label={`Add ${k.short}`} onClick={() => s.set({ basket: { ...s.basket, [k.id]: Math.min(6, (s.basket[k.id] ?? 0) + 1) } })} className="rounded-lg bg-cream p-1">
                        <Plus className="size-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  <Metric label="Order value (AOV)" value={rs(basket.value)} tone={basket.value >= FREE_SHIP ? "good" : "bad"} sub={`free shipping from ₹${FREE_SHIP} (hyp.)`} />
                  <Metric label="Website contribution" value={basket.value ? pc(d2c.pct) : "–"} tone={d2c.pct >= 0.25 ? "good" : "bad"} sub={basket.value ? `${rs(d2c.contribution)} after ${rs(d2c.fees)} fees` : "add products"} />
                </div>
                {basket.value > 0 && (
                  <table className="mt-2 w-full text-[0.82rem]">
                    <thead>
                      <tr className="text-left text-cocoa-2">
                        <th className="py-1">Same order on…</th>
                        <th>Fees</th>
                        <th className="text-right">Contribution</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(Object.keys(CHANNEL_FEES) as ChannelId[]).map((ch) => {
                        const c = contribution(basket.value, basket.cogs, ch);
                        return (
                          <tr key={ch} className="border-t border-cocoa/10">
                            <td className="py-1 font-bold">{CHANNEL_FEES[ch].name}</td>
                            <td className="text-cocoa-2">{CHANNEL_FEES[ch].note}</td>
                            <td className={`text-right font-bold ${c.pct >= 0.25 ? "text-success" : "text-error"}`}>{pc(c.pct)}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
              <ul className="mt-3 grid gap-1">
                <Check2 ok={allPpg}>Price per gram worked out for all four boxes</Check2>
                <Check2 ok={grossOk}>Every box keeps at least 20% gross margin on your cost sheet</Check2>
                <Check2 ok={basketOk}>A website order over ₹{FREE_SHIP} earning 25%+ after fees</Check2>
              </ul>
              <Feedback fb={fb} />
              <div className="mt-4 flex justify-end">
                <button disabled={!stage1Ok} onClick={() => go(2)} className={primary}>
                  To finance <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          )}

          {stage === 2 && (
            <div>
              <Kicker>Learn & challenge · financial performance</Kicker>
              <h2 className="mt-1 font-display text-[1.45rem] font-semibold">Growing fast, still making a loss: why?</h2>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Metric label="FY23 revenue" value="~₹5.5 cr" sub="reported" />
                <Metric label="FY24 revenue" value="~₹14.7 cr" sub={`${growthPct}% up from the rounded figures`} />
                <Metric label="FY24 net loss" value="~₹63 lakh" sub={`net margin ${pc(-BASE.netLoss / BASE.revenue)}`} tone="bad" />
                <Metric label="Total costs" value={`~₹${(BASE.revenue + BASE.netLoss).toFixed(2)} cr`} sub="revenue + loss" />
              </div>
              <div className="mt-3 rounded-2xl bg-cream p-3 text-[0.88rem] leading-relaxed">
                <strong>Revenue</strong> is money from sales. <strong>Gross profit</strong> is revenue minus the cost of making the products. <strong>Net profit or loss</strong> is what is left after every other cost: marketing, platform fees, salaries, rent. Growth is how fast revenue rises; profitability is whether anything is left at the end. A young brand often spends ahead of its sales (marketing, people, a bigger facility), so it can grow fast and still post a loss.
              </div>
              <div className="mt-3 rounded-2xl border border-cocoa/10 p-3">
                <div className="text-[0.85rem] font-bold">Lever lab: reach break-even next year without raising prices (hypothetical model)</div>
                <p className="mt-1 text-[0.8rem] text-cocoa-2">
                  Starting point: gross margin {pc(BASE.gm)}, marketing and platform fees {pc(BASE.mk)}, fixed overheads ₹{FIXED} cr, set so the model reproduces the reported ~₹63 lakh loss.
                </p>
                <div className="mt-2 grid gap-2">
                  <Slider label="Marketing and platform fees, % of revenue" value={s.levers.mk} min={10} max={30} onChange={(v) => s.set({ levers: { ...s.levers, mk: v, growth: Math.min(s.levers.growth, growthCap(v)) } })} unit="%" hint={`In this model, ${s.levers.mk}% marketing supports up to ${cap}% growth.`} />
                  <Slider label="Revenue growth" value={s.levers.growth} min={0} max={cap} step={5} onChange={(v) => s.set({ levers: { ...s.levers, growth: v } })} unit="%" />
                  <Slider label="Gross-margin gain from bundles and better sourcing" value={s.levers.gmGain} min={0} max={6} onChange={(v) => s.set({ levers: { ...s.levers, gmGain: v } })} unit=" pts" />
                  <Slider label="Growth in fixed overheads (people, rent)" value={s.levers.fixedGrowth} min={0} max={40} step={5} onChange={(v) => s.set({ levers: { ...s.levers, fixedGrowth: v } })} unit="%" />
                </div>
                <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Metric label="Revenue" value={`₹${pl.rev.toFixed(1)} cr`} />
                  <Metric label="Gross profit" value={`₹${pl.gross.toFixed(2)} cr`} />
                  <Metric label="Fixed costs" value={`₹${pl.fixed.toFixed(2)} cr`} />
                  <Metric label="Net result" value={`${pl.net >= 0 ? "+" : "−"}₹${Math.abs(pl.net).toFixed(2)} cr`} tone={pl.net >= 0 ? "good" : "bad"} sub={pc(pl.netPct)} />
                </div>
              </div>
              <div className="mt-3">
                <Field label="Explain in your own words why a growing brand can post a loss, and what your levers changed (20+ words)" value={s.plExplain} onChange={(v) => s.set({ plExplain: v })} rows={3} />
              </div>
              <ul className="mt-2 grid gap-1">
                <Check2 ok={pl.net >= 0}>Your plan reaches break-even or better</Check2>
                <Check2 ok={explainOk}>Explanation mentions fixed costs, scale, marketing or investment ({words(s.plExplain)}/20 words)</Check2>
              </ul>
              <div className="mt-4 flex justify-between">
                <button onClick={() => go(1)} className={secondary}>
                  <ArrowLeft className="size-4" /> Pricing
                </button>
                <button disabled={!stage2Ok} onClick={() => go(3)} className={primary}>
                  To competition <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          )}

          {stage === 3 && (
            <div>
              <Kicker>Explore · competitive intelligence</Kicker>
              <h2 className="mt-1 font-display text-[1.45rem] font-semibold">Map the market from the K-Matrix</h2>
              <p className="mt-1 text-[0.9rem] text-cocoa-2">Place each player on the map: how accessible its price is, and how much it uses natural sweetening. Read the values off the K-Matrix wall.</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {K_PLAYERS.map((p) => (
                  <button key={p.id} onClick={() => setPlayer(p.id)} className={`flex items-center gap-1.5 rounded-full border-2 px-3 py-1 text-[0.85rem] font-bold ${player === p.id ? "text-white" : "bg-white"}`} style={{ borderColor: PLAYER_COLORS[p.id], background: player === p.id ? PLAYER_COLORS[p.id] : undefined }}>
                    {s.grid[p.id]?.x && s.grid[p.id]?.y && <Check className="size-3.5" strokeWidth={3} />}
                    {p.short}
                  </button>
                ))}
              </div>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                {(["x", "y"] as const).map((axis) => (
                  <div key={axis} className="rounded-2xl bg-cream p-3">
                    <div className="text-[0.82rem] font-bold">{axis === "x" ? "Mass-market price accessibility" : "Natural sweetening innovation"}</div>
                    <div className="mt-2 flex gap-1.5">
                      {LEVELS.map((lv) => (
                        <button key={lv} onClick={() => placeGrid(axis, lv)} className={`flex-1 rounded-xl border px-2 py-1.5 text-[0.85rem] font-bold ${s.grid[player]?.[axis] === lv ? "border-success bg-success text-white" : "border-cocoa/15 bg-white"}`}>
                          {lv}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <details className="mt-3 rounded-2xl border border-cocoa/10 p-3 text-[0.85rem]">
                <summary className="cursor-pointer font-bold">Brand comparison table (from Chapter 4.2)</summary>
                <div className="mt-2 overflow-x-auto">
                  <table className="w-full min-w-[620px] text-[0.78rem]">
                    <thead>
                      <tr>
                        <th className="p-1 text-left">Parameter</th>
                        {BRANDS.map((b) => (
                          <th key={b.id} className="p-1 text-left">
                            {b.name}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {BRAND_ROWS.map((r) => (
                        <tr key={r.key} className="border-t border-cocoa/10 align-top">
                          <td className="p-1 font-bold">{r.label}</td>
                          {BRANDS.map((b) => (
                            <td key={b.id} className="p-1">
                              {b.rows[r.key]}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
              <div className="mt-3 grid gap-2">
                <Field label="Strength: what Eat Better does better (8+ words)" value={sw.strength} onChange={(v) => s.set({ swot: { ...sw, strength: v } })} />
                <Field label="Weakness: where it is weaker (8+ words)" value={sw.weakness} onChange={(v) => s.set({ swot: { ...sw, weakness: v } })} />
                <Field label="Opportunity: a gap it could grow into (8+ words)" value={sw.opportunity} onChange={(v) => s.set({ swot: { ...sw, opportunity: v } })} />
                <Field label="Differentiation: one line on why a customer picks Eat Better (8+ words)" value={sw.edge} onChange={(v) => s.set({ swot: { ...sw, edge: v } })} />
              </div>
              <ul className="mt-2 grid gap-1">
                <Check2 ok={gridDone}>All four players placed correctly on the map</Check2>
                <Check2 ok={swChecks.strength}>Strength uses a K-Matrix strength (clean label, natural sweetening, familiar taste, quick commerce, packaging)</Check2>
                <Check2 ok={swChecks.weakness}>Weakness names the gap the K-Matrix shows (price accessibility)</Check2>
                <Check2 ok={swChecks.opportunity && swChecks.edge}>Opportunity and differentiation written</Check2>
              </ul>
              <Feedback fb={fb} />
              <div className="mt-4 flex justify-between">
                <button onClick={() => go(2)} className={secondary}>
                  <ArrowLeft className="size-4" /> Financials
                </button>
                <button disabled={!stage3Ok} onClick={() => go(4)} className={primary}>
                  To the budget table <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          )}

          {stage === 4 && (
            <div>
              <Kicker>Practise · budget and asset allocation</Kicker>
              <h2 className="mt-1 font-display text-[1.45rem] font-semibold">Split ₹{BUDGET_CR} crore (hypothetical)</h2>
              <p className="mt-1 text-[0.9rem] text-cocoa-2">Every rupee you give one department is a rupee another can&apos;t have. That&apos;s opportunity cost.</p>
              <div className="mt-3 grid gap-2">
                {DEPTS.map((d) => (
                  <Slider key={d.id} label={d.name} value={s.budget[d.id]} min={0} max={50} onChange={(v) => s.set({ budget: { ...s.budget, [d.id]: v } })} unit="%" hint={`₹${((s.budget[d.id] / 100) * BUDGET_CR).toFixed(1)} cr`} />
                ))}
              </div>
              <div className={`mt-2 text-right text-[0.9rem] font-bold ${total === 100 ? "text-success" : "text-error"}`}>Allocated {total}% {total !== 100 && `(${total > 100 ? "remove" : "add"} ${Math.abs(100 - total)}%)`}</div>
              <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <Metric label="Demand growth" value={`${Math.round(bo.demand)}%`} sub="simulated" />
                <Metric label="Capacity growth" value={`${Math.round(bo.capacity)}%`} sub="simulated" />
                <Metric label="Growth you can serve" value={`${Math.round(bo.fulfilled)}%`} tone="good" sub="the smaller of the two" />
                <Metric label="B2B share" value={`${Math.round(bo.b2bShare)}%`} sub="simulated" />
              </div>
              {bo.warnings.length > 0 && (
                <ul className="mt-2 grid gap-1">
                  {bo.warnings.map((w) => (
                    <li key={w} className="flex items-start gap-2 rounded-xl bg-error/8 px-3 py-1.5 text-[0.86rem]">
                      <X className="mt-0.5 size-4 shrink-0 text-error" /> {w}
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-2 rounded-xl bg-cream p-2.5 text-[0.86rem]">
                <strong>Opportunity cost right now:</strong> {lowest.name} has the least ({s.budget[lowest.id]}%), so {lowest.lose}.
              </p>
              <div className="mt-4 flex justify-between">
                <button onClick={() => go(3)} className={secondary}>
                  <ArrowLeft className="size-4" /> Competition
                </button>
                <button disabled={!stage4Ok} onClick={() => go(5)} className={primary}>
                  To growth planning <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          )}

          {stage === 5 && (
            <div>
              <Kicker>Challenge · growth and scalability</Kicker>
              <h2 className="mt-1 font-display text-[1.45rem] font-semibold">How should Eat Better grow?</h2>
              <div className="mt-3 grid gap-2">
                {PILLARS.map((p) => (
                  <div key={p.id} className="rounded-2xl bg-cream p-3">
                    <Slider label={p.title} value={s.weights[p.id] ?? 0} min={0} max={70} step={5} onChange={(v) => s.set({ weights: { ...s.weights, [p.id]: v } })} unit="%" />
                    <p className="text-[0.8rem] text-cocoa-2">{p.text}</p>
                  </div>
                ))}
              </div>
              <div className={`mt-1 text-right text-[0.9rem] font-bold ${wTotal === 100 ? "text-success" : "text-error"}`}>Weights total {wTotal}%</div>
              <div className="mt-2 rounded-2xl border border-cocoa/10 p-3">
                <Slider label="Target orders a month in 12 months (lakh)" value={s.target} min={2} max={8} step={0.5} onChange={(v) => s.set({ target: v })} hint={`Today ~${ORDERS_NOW} lakh a month (reported). Practice capacity of the 50,000 sq. ft. Jaipur facility: ${FACILITY_CAP} lakh (hypothetical). Your budget supports about ${supported} lakh.`} />
              </div>
              <div className="mt-3">
                <Field label="Justify your strategy: which pillar leads, why, and how the facility keeps up (25+ words)" value={s.growthWhy} onChange={(v) => s.set({ growthWhy: v })} rows={3} />
              </div>
              <ul className="mt-2 grid gap-1">
                <Check2 ok={wTotal === 100}>Pillar weights add up to 100%</Check2>
                <Check2 ok={capOk}>Target fits the facility&apos;s practice capacity (or you weight infrastructure 35%+ and give manufacturing 20%+ of the budget)</Check2>
                <Check2 ok={budgetOkForTarget}>Target is no higher than your budget can serve (~{supported} lakh)</Check2>
                <Check2 ok={words(s.growthWhy) >= 25}>Justification written ({words(s.growthWhy)}/25 words)</Check2>
              </ul>
              <div className="mt-4 flex justify-between">
                <button onClick={() => go(4)} className={secondary}>
                  <ArrowLeft className="size-4" /> Budget
                </button>
                <button disabled={!stage5Ok} onClick={() => go(6)} className={primary}>
                  To the boardroom <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          )}

          {stage === 6 && (
            <div>
              <Kicker>Create · investor pitch simulation</Kicker>
              <h2 className="mt-1 font-display text-[1.45rem] font-semibold">Pitch your plan</h2>
              <p className="mt-1 text-[0.86rem] text-cocoa-2">Three simulated investors (fictional, not real people) will question your plan. This is a learning simulation, not Eat Better&apos;s actual fundraising.</p>
              <div className="mt-3 rounded-2xl border border-cocoa/10 p-3">
                <Slider label="Funding ask (hypothetical)" value={s.ask} min={5} max={30} onChange={(v) => s.set({ ask: v })} unit=" cr" />
                <div className="mt-2 text-[0.82rem] font-bold">Use of funds (follows your budget split)</div>
                <div className="mt-1 grid grid-cols-2 gap-1 text-[0.8rem]">
                  {DEPTS.map((d) => (
                    <div key={d.id} className="flex justify-between rounded-lg bg-cream px-2 py-1">
                      <span>{d.name}</span>
                      <span className="font-bold">₹{((s.budget[d.id] / 100) * s.ask).toFixed(1)} cr</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-3 grid gap-2">
                <Field label="The opportunity (12+ words)" value={s.pitch.opportunity} onChange={(v) => s.set({ pitch: { ...s.pitch, opportunity: v } })} />
                <Field label="Product differentiation (12+ words)" value={s.pitch.differentiation} onChange={(v) => s.set({ pitch: { ...s.pitch, differentiation: v } })} />
                <Field label="Growth strategy (12+ words)" value={s.pitch.growth} onChange={(v) => s.set({ pitch: { ...s.pitch, growth: v } })} />
              </div>
              <ul className="mt-2 grid gap-1">
                <Check2 ok={pitchChecks.opportunity}>Opportunity explained</Check2>
                <Check2 ok={pitchChecks.differentiation}>Differentiation names a real edge (clean label, no palm oil or refined sugar, dates, familiar taste, roasted)</Check2>
                <Check2 ok={pitchChecks.growth}>Growth strategy names a pillar</Check2>
              </ul>
              <button disabled={!Object.values(pitchChecks).every(Boolean)} onClick={() => setPitchSent(true)} className={`${primary} mt-3 w-full`}>
                <Landmark className="size-4" /> Present to the investors
              </button>
              {(pitchSent || Object.keys(s.answers).length > 0) && (
                <div className="mt-3 grid gap-2">
                  {questions.map((q, i) => (
                    <div key={i} className="rounded-2xl border-2 border-orange/30 p-3">
                      <div className="text-[0.78rem] font-extrabold uppercase tracking-[0.08em] text-cocoa-2">{q.who} · simulated</div>
                      <p className="mt-0.5 text-[0.95rem] font-semibold leading-snug">“{q.q}”</p>
                      <p className="text-[0.76rem] text-cocoa-2">Why they ask: {q.why}</p>
                      <textarea value={s.answers[i] ?? ""} onChange={(e) => s.set({ answers: { ...s.answers, [i]: e.target.value } })} rows={3} placeholder="Answer from your own numbers and decisions…" className="mt-2 w-full rounded-xl border border-cocoa/20 p-2.5 text-[0.9rem] outline-none focus:border-orange" />
                      <div className={`text-[0.78rem] font-bold ${answerOk(i) ? "text-success" : "text-cocoa-2"}`}>{answerOk(i) ? "Strong answer: specific and backed by a number." : `Use 15+ words and at least one number from your plan (${words(s.answers[i] ?? "")}/15).`}</div>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 flex justify-between">
                <button onClick={() => go(5)} className={secondary}>
                  <ArrowLeft className="size-4" /> Growth
                </button>
                <button disabled={!stage6Ok} onClick={() => go(7)} className={primary}>
                  See my evaluation <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          )}

          {stage === 7 && (
            <div>
              <Kicker>Evaluate · your management plan</Kicker>
              <div className="mt-2 flex flex-wrap items-center gap-4 rounded-[22px] bg-cream p-4">
                <div className="grid size-24 place-items-center rounded-full border-4 border-success bg-white text-center">
                  <div>
                    <div className="font-display text-[1.8rem] font-semibold leading-none text-success">{overall}</div>
                    <div className="text-[0.7rem] font-bold text-cocoa-2">/100</div>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 font-display text-[1.25rem] font-semibold">
                    <BadgeCheck className="size-6 text-success" /> Plan complete
                  </div>
                  <div className="mt-1 flex gap-0.5">{[0, 1, 2].map((i) => <Star key={i} className={`size-5 ${i < (overall >= 85 ? 3 : overall >= 65 ? 2 : 1) ? "fill-haldi text-[#C9A400]" : "text-cocoa/20"}`} />)}</div>
                  <p className="mt-1 text-[0.86rem] text-cocoa-2">Simulation score from your accuracy and the plan&apos;s consistency.</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                <Metric label="Pricing" value={`${scores.pricing}`} sub={`${s.ppgMistakes} wrong tries`} />
                <Metric label="Financials" value={pl.net >= 0 ? "Break-even" : "Loss"} tone={pl.net >= 0 ? "good" : "bad"} sub={`growth ${s.levers.growth}%`} />
                <Metric label="Competition" value={`${scores.competition}`} sub={`${s.gridMistakes} wrong tries`} />
                <Metric label="Budget" value={`${Math.round(bo.fulfilled)}%`} sub="growth you can serve" />
                <Metric label="Growth target" value={`${s.target} lakh`} sub="orders a month" />
                <Metric label="Funding ask" value={`₹${s.ask} cr`} sub="hypothetical" />
              </div>
              <div className="mt-5">
                <ProjectReadyPopup
                  student={student}
                  setStudent={setStudent}
                  reflection={s.reflection}
                  setReflection={(r) => s.set({ reflection: r })}
                  reflectionPrompt="Which decision mattered most in your plan, and what did you learn about growth versus profit?"
                  submitWhat="Submit your Business Growth & Financial Strategy Report (PDF) and your financial model (CSV)."
                  activity="Experiential Activity 4 · Build the Eat Better Business"
                  files={[`EatBetter-SkilliZee-Business-Strategy-Report-${stem}.pdf`, `EatBetter-SkilliZee-Financial-Model-${stem}.csv`]}
                  downloads={[
                    { label: "Download Report (PDF)", sub: "Business Growth & Financial Strategy Report", kind: "pdf", run: () => buildBusinessReport(useBiz.getState(), student) },
                    { label: "Download Financial Model (CSV)", sub: "Your calculations, opens in Excel or Sheets", kind: "csv", run: () => downloadFinancialCsv(useBiz.getState(), student) },
                  ]}
                />
              </div>
              <p className="mt-3 flex items-center gap-2 text-[0.8rem] text-cocoa-2">
                <Coins className="size-4" /> Files download to this device. Your details stay on this device.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

