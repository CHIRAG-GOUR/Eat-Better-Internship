"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  ChevronRight,
  ClipboardCopy,
  Coins,
  Download,
  FileCheck,
  Flame,
  Globe,
  Layers,
  Lightbulb,
  Package,
  RotateCcw,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import { Panel } from "@/components/chapter/Panel";
import { SectionIntro } from "@/components/chapter/SectionIntro";
import { GlossaryText } from "@/components/chapter/Glossary";
import {
  CAPSTONE_TRACKS,
  EVALUATION_RUBRIC,
  GTM_STEPS,
  ProjectTrack,
  TAKEAWAY,
} from "./content";
import {
  calculatePlanMetrics,
  generateCapstoneMarkdown,
  useCapstoneStore,
} from "./planner";

const sectionCls = "relative scroll-mt-6 px-3 py-6 sm:px-6 sm:py-10";

/* ── 1. Task A Overview ────────────────────────────────────────── */

export function TaskAOverview() {
  return (
    <section id="task-a-overview" className={sectionCls}>
      <Panel tone="light" reveal="up" width="max-w-7xl">
        <SectionIntro
          index="1"
          kicker="Final Capstone Project · Task A"
          title="360° Go-To-Market & Business Creation"
        />

        <div className="mt-5 grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7 flex flex-col justify-between rounded-[24px] border border-cocoa bg-cream p-6 shadow-[3px_3px_0_0_#2f1c1a]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-orange/30 bg-orange/10 px-3 py-1 text-[0.82rem] font-extrabold uppercase tracking-wider text-orange">
                <Sparkles className="size-4" /> Capstone Objective
              </div>
              <h3 className="mt-3 font-display text-[clamp(1.5rem,3vw,2.1rem)] font-bold leading-tight text-cocoa">
                Develop a 360-Degree Go-To-Market Strategy
              </h3>
              <p className="mt-3 text-[1.05rem] leading-relaxed text-cocoa">
                As the culmination of your internship, apply everything you have learned across clean-label formulation, value chains, unit economics, and scalable brand growth.
              </p>
              <p className="mt-3 text-[0.98rem] leading-relaxed text-cocoa-2">
                You will specify a real clean-label product or campaign, calculate airtight financial unit economics, craft an omnichannel distribution engine, and design a high-converting launch plan.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4 pt-4 border-t border-cocoa/15">
              <div className="rounded-xl bg-white p-3 border border-cocoa/10">
                <div className="text-[0.76rem] font-bold text-orange uppercase">Standard</div>
                <div className="font-display font-bold text-[1.1rem] text-cocoa">100% Clean</div>
                <div className="text-[0.75rem] text-cocoa-2">Zero refined sugar</div>
              </div>
              <div className="rounded-xl bg-white p-3 border border-cocoa/10">
                <div className="text-[0.76rem] font-bold text-orange uppercase">Benchmark</div>
                <div className="font-display font-bold text-[1.1rem] text-cocoa">₹1.13–1.55/g</div>
                <div className="text-[0.75rem] text-cocoa-2">Sweet & savory MRP</div>
              </div>
              <div className="rounded-xl bg-white p-3 border border-cocoa/10">
                <div className="text-[0.76rem] font-bold text-orange uppercase">Gross Margin</div>
                <div className="font-display font-bold text-[1.1rem] text-cocoa">&gt; 55% Target</div>
                <div className="text-[0.75rem] text-cocoa-2">Sustainable scale</div>
              </div>
              <div className="rounded-xl bg-white p-3 border border-cocoa/10">
                <div className="text-[0.76rem] font-bold text-orange uppercase">Deliverable</div>
                <div className="font-display font-bold text-[1.1rem] text-cocoa">Complete Dossier</div>
                <div className="text-[0.75rem] text-cocoa-2">Exportable proposal</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col justify-between rounded-[24px] border border-cocoa bg-cocoa p-6 text-cream shadow-[3px_3px_0_0_#2f1c1a]">
            <div>
              <div className="flex items-center justify-between">
                <span className="text-[0.82rem] font-bold uppercase tracking-wider text-haldi">
                  5 Capstone Tracks Available
                </span>
                <Award className="size-5 text-haldi" />
              </div>
              <h4 className="mt-2 font-display text-[1.35rem] font-semibold text-cream">
                Choose Your Specialty
              </h4>
              <p className="mt-2 text-[0.92rem] text-cream/80 leading-relaxed">
                You can select the flagship New Product GTM track or specialize in Festive Hampers, Brand Campaigns, Consumer Research, or Social Media Packs:
              </p>

              <div className="mt-4 space-y-2.5">
                {CAPSTONE_TRACKS.map((t, idx) => (
                  <div key={t.id} className="flex items-center gap-3 rounded-xl bg-white/10 p-2.5 backdrop-blur-sm">
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-orange text-[0.78rem] font-bold text-white">
                      {idx + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[0.92rem] font-bold text-white">{t.name}</div>
                      <div className="truncate text-[0.75rem] text-cream/70">{t.tagline}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-5 pt-4 border-t border-white/10 text-center">
              <a
                href="#track-selector"
                className="inline-flex items-center gap-2 rounded-xl bg-orange px-5 py-2.5 text-[0.95rem] font-bold text-white shadow hover:bg-orange/90 transition-transform active:scale-95"
              >
                Browse & Pick Track Below <ArrowRight className="size-4" />
              </a>
            </div>
          </div>
        </div>
      </Panel>
    </section>
  );
}

/* ── 2. Track Selector ─────────────────────────────────────────── */

export function TrackSelector() {
  const [selectedId, setSelectedId] = useState<string>("product-expansion");
  const plan = useCapstoneStore((s) => s.plan);
  const setField = useCapstoneStore((s) => s.setField);

  const activeTrack = CAPSTONE_TRACKS.find((t) => t.id === selectedId) || CAPSTONE_TRACKS[0];

  const handleSelectTrack = (track: ProjectTrack) => {
    setSelectedId(track.id);
    setField("selectedTrackId", track.id);
    if (track.id === "festive-gifting") {
      setField("projectName", "Eat Better Royal Utsav Festive Hamper");
      setField("tagline", "Artisanal dry fruit sweets & slow-roasted snacks in a keepsake gift box.");
      setField("mrp", 999);
      setField("ingredientCost", 240);
      setField("packagingCost", 95);
      setField("logisticsCost", 70);
      setField("channelCorporate", 45);
      setField("channelD2C", 35);
      setField("channelQCommerce", 15);
      setField("channelAmazon", 5);
      setField("channelRetail", 0);
    } else if (track.id === "brand-campaign") {
      setField("projectName", "Eat Better 'Sweet Without The Cheat' Campaign");
      setField("tagline", "Real Indian sweets made with Arabian dates & nuts. Zero sugarcoating.");
      setField("campaignHook", "Why eat 60% refined sugar when you can Eat Better?");
      setField("monthlyAdBudget", 350000);
    } else if (track.id === "consumer-insights") {
      setField("projectName", "The 5 PM Snacking Conundrum: Consumer Insight Report");
      setField("tagline", "Primary research across 25 urban snackers revealing clean-label conversion triggers.");
    } else if (track.id === "social-content-pack") {
      setField("projectName", "Eat Better Jaipur Craft & Clean Label Content Series");
      setField("tagline", "5 high-converting reels & carousels spotlighting clean snacking transparency.");
    }
  };

  return (
    <section id="track-selector" className={sectionCls}>
      <Panel tone="light" reveal="up" width="max-w-7xl">
        <SectionIntro
          index="2"
          kicker="Select Your Capstone Track"
          title="Explore the 5 Project Specializations"
        >
          Each track represents an authentic commercial function at Eat Better Co. Explore the scope, deliverables, and benchmark case studies below, then click to apply it to your planner.
        </SectionIntro>

        {/* Track Pills */}
        <div className="mt-6 flex flex-wrap gap-2 sm:gap-3">
          {CAPSTONE_TRACKS.map((t) => {
            const isSelected = t.id === selectedId;
            return (
              <button
                key={t.id}
                onClick={() => handleSelectTrack(t)}
                className={`flex items-center gap-2 rounded-2xl border px-4 py-2.5 text-left text-[0.92rem] font-bold transition-all ${
                  isSelected
                    ? "border-orange bg-orange text-white shadow-[2px_2px_0_0_#2f1c1a]"
                    : "border-cocoa/20 bg-white text-cocoa hover:border-cocoa/50"
                }`}
              >
                <span>{t.name}</span>
                <span
                  className={`rounded-full px-2 py-0.5 text-[0.72rem] font-extrabold ${
                    isSelected ? "bg-white/20 text-white" : "bg-orange/10 text-orange"
                  }`}
                >
                  {t.badge}
                </span>
              </button>
            );
          })}
        </div>

        {/* Active Track Showcase Card */}
        <div className="mt-6 rounded-[24px] border border-cocoa bg-white p-6 shadow-[3px_3px_0_0_#2f1c1a]">
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-5 flex flex-col justify-between">
              <div>
                <div className="relative aspect-video w-full overflow-hidden rounded-2xl border border-cocoa/20 bg-peach/40 shadow-inner">
                  <Image
                    src={activeTrack.heroImg}
                    alt={activeTrack.name}
                    fill
                    className="object-cover transition-transform duration-500 hover:scale-105"
                    sizes="(max-width: 768px) 100vw, 450px"
                  />
                  <div className="absolute top-3 left-3 rounded-lg bg-cocoa/85 px-3 py-1 text-[0.78rem] font-bold uppercase tracking-wider text-haldi backdrop-blur-sm">
                    {activeTrack.badge}
                  </div>
                </div>

                <h3 className="mt-4 font-display text-[1.45rem] font-bold text-cocoa">
                  {activeTrack.name}
                </h3>
                <p className="mt-1 text-[0.92rem] font-semibold text-orange">
                  {activeTrack.tagline}
                </p>
                <p className="mt-3 text-[0.94rem] leading-relaxed text-cocoa-2">
                  {activeTrack.overview}
                </p>
              </div>

              <div className="mt-5 rounded-2xl bg-peach/50 p-4 border border-cocoa/10">
                <div className="text-[0.8rem] font-bold uppercase tracking-wider text-orange">
                  Benchmark Case Study
                </div>
                <div className="mt-1 font-display font-semibold text-[1.05rem] text-cocoa">
                  {activeTrack.exampleInitiative.title}
                </div>
                <p className="mt-1 text-[0.88rem] text-cocoa-2">
                  {activeTrack.exampleInitiative.description}
                </p>
                <div className="mt-2 text-[0.82rem] font-bold text-success">
                  Target Outcome: {activeTrack.exampleInitiative.expectedOutcome}
                </div>
              </div>
            </div>

            <div className="lg:col-span-7 flex flex-col justify-between">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-cocoa/15 bg-cream/70 p-4">
                  <div className="flex items-center gap-2 font-display text-[1.05rem] font-bold text-cocoa">
                    <Layers className="size-4 text-orange" /> Track Scope & Focus
                  </div>
                  <ul className="mt-3 space-y-2">
                    {activeTrack.scopeItems.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-[0.88rem] text-cocoa-2">
                        <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-orange" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-2xl border border-cocoa/15 bg-cream/70 p-4">
                  <div className="flex items-center gap-2 font-display text-[1.05rem] font-bold text-cocoa">
                    <FileCheck className="size-4 text-success" /> Required Deliverables
                  </div>
                  <ul className="mt-3 space-y-2">
                    {activeTrack.deliverables.map((d, idx) => (
                      <li key={idx} className="flex items-start gap-2 text-[0.88rem] text-cocoa-2">
                        <span className="mt-1 size-2 shrink-0 rounded-full bg-success" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-2xl bg-cocoa p-4 text-cream">
                <div>
                  <div className="text-[0.82rem] font-bold uppercase tracking-wider text-haldi">
                    Ready to build this project?
                  </div>
                  <div className="text-[0.95rem] text-cream/90">
                    Active in planner: <strong>{plan.projectName}</strong>
                  </div>
                </div>
                <a
                  href="#gtm-canvas"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-orange px-5 py-2.5 text-[0.95rem] font-bold text-white shadow hover:bg-orange/90 transition-transform active:scale-95"
                >
                  Open 360° GTM Planner <ChevronRight className="size-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </Panel>
    </section>
  );
}

/* ── 3. Interactive 360° GTM Canvas ────────────────────────────── */

export function GTMCanvas() {
  const plan = useCapstoneStore((s) => s.plan);
  const activeStep = useCapstoneStore((s) => s.activeStep);
  const setField = useCapstoneStore((s) => s.setField);
  const setActiveStep = useCapstoneStore((s) => s.setActiveStep);
  const resetToDefaults = useCapstoneStore((s) => s.resetToDefaults);
  const loadSaved = useCapstoneStore((s) => s.loadSaved);

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  const metrics = calculatePlanMetrics(plan);

  return (
    <section id="gtm-canvas" className={sectionCls}>
      <Panel tone="light" reveal="up" width="max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <SectionIntro
              index="3"
              kicker="Interactive Strategy Studio"
              title="360° Go-To-Market Canvas"
            />
            <p className="mt-1 max-w-3xl text-[1rem] text-cocoa-2">
              Fill out each stage to construct your complete commercial blueprint. All metrics calculate live using Eat Better operational formulas.
            </p>
          </div>
          <button
            onClick={resetToDefaults}
            className="inline-flex items-center gap-1.5 self-start rounded-xl border border-cocoa/20 bg-white px-3 py-1.5 text-[0.82rem] font-bold text-cocoa-2 hover:border-cocoa hover:text-cocoa"
          >
            <RotateCcw className="size-3.5" /> Reset Template
          </button>
        </div>

        {/* Step Navigation Bar */}
        <div className="mt-6 flex flex-wrap gap-2 border-b border-cocoa/15 pb-4">
          {GTM_STEPS.map((s) => {
            const active = s.step === activeStep;
            return (
              <button
                key={s.id}
                onClick={() => setActiveStep(s.step)}
                className={`flex items-center gap-2 rounded-xl px-3 py-2 text-[0.88rem] font-bold transition-all ${
                  active
                    ? "bg-cocoa text-cream shadow-[2px_2px_0_0_#ff5c00]"
                    : "bg-white text-cocoa hover:bg-peach/40 border border-cocoa/10"
                }`}
              >
                <span
                  className={`grid size-5 place-items-center rounded-full text-[0.72rem] font-bold ${
                    active ? "bg-orange text-white" : "bg-cocoa/10 text-cocoa"
                  }`}
                >
                  {s.step}
                </span>
                <span>{s.label}</span>
              </button>
            );
          })}
        </div>

        {/* Live Metrics Ribbon */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-6 rounded-2xl bg-cocoa p-4 text-cream">
          <div className="border-r border-cream/15 pr-2">
            <div className="text-[0.72rem] font-bold uppercase tracking-wider text-haldi">MRP</div>
            <div className="font-display font-bold text-[1.2rem] text-white">₹{plan.mrp}</div>
            <div className="text-[0.72rem] text-cream/70">per unit</div>
          </div>
          <div className="border-r border-cream/15 pr-2">
            <div className="text-[0.72rem] font-bold uppercase tracking-wider text-haldi">Price / Gram</div>
            <div className="font-display font-bold text-[1.2rem] text-white">₹{metrics.pricePerGram}/g</div>
            <div className="text-[0.72rem] text-cream/70">{plan.netWeightGrams}g pack</div>
          </div>
          <div className="border-r border-cream/15 pr-2">
            <div className="text-[0.72rem] font-bold uppercase tracking-wider text-haldi">COGS</div>
            <div className="font-display font-bold text-[1.2rem] text-white">₹{metrics.cogs.toFixed(1)}</div>
            <div className="text-[0.72rem] text-cream/70">BOM + Pouch</div>
          </div>
          <div className="border-r border-cream/15 pr-2">
            <div className="text-[0.72rem] font-bold uppercase tracking-wider text-haldi">Gross Margin</div>
            <div className={`font-display font-bold text-[1.2rem] ${metrics.grossMarginPct >= 55 ? "text-success" : "text-orange"}`}>
              {metrics.grossMarginPct}%
            </div>
            <div className="text-[0.72rem] text-cream/70">Target &gt; 55%</div>
          </div>
          <div className="border-r border-cream/15 pr-2">
            <div className="text-[0.72rem] font-bold uppercase tracking-wider text-haldi">Net Contribution</div>
            <div className="font-display font-bold text-[1.2rem] text-white">₹{metrics.netContributionPerUnit}</div>
            <div className="text-[0.72rem] text-cream/70">({metrics.contributionMarginPct}%)</div>
          </div>
          <div>
            <div className="text-[0.72rem] font-bold uppercase tracking-wider text-haldi">Monthly Rev</div>
            <div className="font-display font-bold text-[1.2rem] text-white">
              ₹{(metrics.monthlyGrossRevenue / 100000).toFixed(1)}L
            </div>
            <div className="text-[0.72rem] text-cream/70">{plan.targetMonthlyUnits.toLocaleString()} units</div>
          </div>
        </div>

        {/* Step Content Area */}
        <div className="mt-6 rounded-[24px] border border-cocoa bg-white p-6 shadow-[3px_3px_0_0_#2f1c1a]">
          {activeStep === 1 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-orange font-bold text-[0.85rem] uppercase tracking-wider">
                <Lightbulb className="size-4" /> Step 1 · Product & Market Fit
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[0.85rem] font-bold text-cocoa">Student / Author Name</label>
                  <input
                    type="text"
                    value={plan.studentName}
                    onChange={(e) => setField("studentName", e.target.value)}
                    placeholder="e.g. Priyanshu Sharma"
                    className="mt-1 w-full rounded-xl border border-cocoa/20 p-2.5 text-[0.95rem] focus:border-orange focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[0.85rem] font-bold text-cocoa">Project Initiative Name</label>
                  <input
                    type="text"
                    value={plan.projectName}
                    onChange={(e) => setField("projectName", e.target.value)}
                    className="mt-1 w-full rounded-xl border border-cocoa/20 p-2.5 text-[0.95rem] focus:border-orange focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[0.85rem] font-bold text-cocoa">Core Tagline / Brand Hook</label>
                <input
                  type="text"
                  value={plan.tagline}
                  onChange={(e) => setField("tagline", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-cocoa/20 p-2.5 text-[0.95rem] focus:border-orange focus:outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[0.85rem] font-bold text-cocoa">Target City / Geography</label>
                  <input
                    type="text"
                    value={plan.targetCity}
                    onChange={(e) => setField("targetCity", e.target.value)}
                    className="mt-1 w-full rounded-xl border border-cocoa/20 p-2.5 text-[0.95rem] focus:border-orange focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[0.85rem] font-bold text-cocoa">Target Customer Persona</label>
                  <input
                    type="text"
                    value={plan.targetPersona}
                    onChange={(e) => setField("targetPersona", e.target.value)}
                    className="mt-1 w-full rounded-xl border border-cocoa/20 p-2.5 text-[0.95rem] focus:border-orange focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[0.85rem] font-bold text-cocoa">Specific Snacking Problem Solved</label>
                <textarea
                  rows={2}
                  value={plan.problemSolved}
                  onChange={(e) => setField("problemSolved", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-cocoa/20 p-2.5 text-[0.95rem] focus:border-orange focus:outline-none"
                />
              </div>
            </div>
          )}

          {activeStep === 2 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-orange font-bold text-[0.85rem] uppercase tracking-wider">
                <Package className="size-4" /> Step 2 · Formulation & Packaging Specification
              </div>

              <div>
                <label className="block text-[0.85rem] font-bold text-cocoa">
                  Clean-Label Ingredient Bill of Materials (BOM)
                </label>
                <textarea
                  rows={2}
                  value={plan.cleanIngredients}
                  onChange={(e) => setField("cleanIngredients", e.target.value)}
                  placeholder="e.g. Rolled oats, almonds, Arabian dates, seeds..."
                  className="mt-1 w-full rounded-xl border border-cocoa/20 p-2.5 text-[0.95rem] focus:border-orange focus:outline-none"
                />
                <p className="mt-1 text-[0.8rem] text-cocoa-2">
                  <span className="font-bold text-success">Clean-Label Pledge:</span> Zero refined sugars, zero artificial colors, zero trans-fats, zero palm oil.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-[0.85rem] font-bold text-cocoa">Net Pack Weight (grams)</label>
                  <input
                    type="number"
                    min={10}
                    max={1000}
                    value={plan.netWeightGrams}
                    onChange={(e) => setField("netWeightGrams", Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-cocoa/20 p-2.5 text-[0.95rem] focus:border-orange focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[0.85rem] font-bold text-cocoa">Target Shelf Life (Months)</label>
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={plan.shelfLifeMonths}
                    onChange={(e) => setField("shelfLifeMonths", Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-cocoa/20 p-2.5 text-[0.95rem] focus:border-orange focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[0.85rem] font-bold text-cocoa">Packaging Material</label>
                  <input
                    type="text"
                    value={plan.packagingFormat}
                    onChange={(e) => setField("packagingFormat", e.target.value)}
                    className="mt-1 w-full rounded-xl border border-cocoa/20 p-2.5 text-[0.95rem] focus:border-orange focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          {activeStep === 3 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-orange font-bold text-[0.85rem] uppercase tracking-wider">
                <Coins className="size-4" /> Step 3 · Pricing & Unit Economics Engine
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div className="rounded-2xl border border-cocoa/15 bg-cream/50 p-4">
                  <label className="block text-[0.85rem] font-bold text-cocoa">Retail Price (MRP ₹)</label>
                  <input
                    type="number"
                    min={10}
                    max={5000}
                    value={plan.mrp}
                    onChange={(e) => setField("mrp", Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-cocoa/20 p-2.5 text-[1.1rem] font-bold text-cocoa focus:border-orange focus:outline-none"
                  />
                  <div className="mt-2 text-[0.8rem] text-cocoa-2">
                    Implied Price: <strong>₹{metrics.pricePerGram}/g</strong> (Eat Better benchmark: ₹0.67–₹1.55/g)
                  </div>
                </div>

                <div className="rounded-2xl border border-cocoa/15 bg-cream/50 p-4">
                  <label className="block text-[0.85rem] font-bold text-cocoa">Raw Ingredients BOM (₹)</label>
                  <input
                    type="number"
                    min={1}
                    value={plan.ingredientCost}
                    onChange={(e) => setField("ingredientCost", Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-cocoa/20 p-2.5 text-[1.1rem] font-bold text-cocoa focus:border-orange focus:outline-none"
                  />
                  <div className="mt-2 text-[0.8rem] text-cocoa-2">
                    Nuts, dates, seeds, millets, oats cost per unit
                  </div>
                </div>

                <div className="rounded-2xl border border-cocoa/15 bg-cream/50 p-4">
                  <label className="block text-[0.85rem] font-bold text-cocoa">Packaging & Pouch (₹)</label>
                  <input
                    type="number"
                    min={0.5}
                    step={0.5}
                    value={plan.packagingCost}
                    onChange={(e) => setField("packagingCost", Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-cocoa/20 p-2.5 text-[1.1rem] font-bold text-cocoa focus:border-orange focus:outline-none"
                  />
                  <div className="mt-2 text-[0.8rem] text-cocoa-2">
                    Nitrogen flush pouch, box, barrier film
                  </div>
                </div>

                <div className="rounded-2xl border border-cocoa/15 bg-cream/50 p-4">
                  <label className="block text-[0.85rem] font-bold text-cocoa">Logistics & Shipping (₹)</label>
                  <input
                    type="number"
                    min={1}
                    value={plan.logisticsCost}
                    onChange={(e) => setField("logisticsCost", Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-cocoa/20 p-2.5 text-[1.1rem] font-bold text-cocoa focus:border-orange focus:outline-none"
                  />
                  <div className="mt-2 text-[0.8rem] text-cocoa-2">
                    Dispatch from Jaipur facility to dark store/customer
                  </div>
                </div>

                <div className="rounded-2xl border border-cocoa/15 bg-cream/50 p-4">
                  <label className="block text-[0.85rem] font-bold text-cocoa">Platform / Channel Commission (%)</label>
                  <input
                    type="number"
                    min={2}
                    max={40}
                    value={plan.platformFeePct}
                    onChange={(e) => setField("platformFeePct", Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-cocoa/20 p-2.5 text-[1.1rem] font-bold text-cocoa focus:border-orange focus:outline-none"
                  />
                  <div className="mt-2 text-[0.8rem] text-cocoa-2">
                    Estimated fee: <strong>₹{metrics.commission}</strong> per unit
                  </div>
                </div>

                <div className="rounded-2xl border border-cocoa/15 bg-peach/40 p-4">
                  <div className="text-[0.78rem] font-bold uppercase tracking-wider text-orange">Gross Margin Health</div>
                  <div className={`mt-1 font-display text-[1.6rem] font-bold ${metrics.grossMarginPct >= 55 ? "text-success" : "text-error"}`}>
                    {metrics.grossMarginPct}%
                  </div>
                  <p className="mt-1 text-[0.78rem] text-cocoa-2">
                    {metrics.grossMarginPct >= 55
                      ? "Healthy gross margin! Sufficient cushion for marketing CAC and quick commerce."
                      : "Margin is tight (<55%). Consider adjusting pack weight or ingredient mix."}
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeStep === 4 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-orange font-bold text-[0.85rem] uppercase tracking-wider">
                <Globe className="size-4" /> Step 4 · Omnichannel Distribution Mix (%)
              </div>

              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                <div className="rounded-2xl border border-cocoa/15 bg-white p-3">
                  <label className="block text-[0.82rem] font-bold text-cocoa">D2C Webstore (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={plan.channelD2C}
                    onChange={(e) => setField("channelD2C", Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border p-2 font-bold text-cocoa"
                  />
                  <div className="mt-1 text-[0.75rem] text-cocoa-2">eatbetterco.com</div>
                </div>

                <div className="rounded-2xl border border-cocoa/15 bg-white p-3">
                  <label className="block text-[0.82rem] font-bold text-cocoa">Quick Commerce (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={plan.channelQCommerce}
                    onChange={(e) => setField("channelQCommerce", Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border p-2 font-bold text-cocoa"
                  />
                  <div className="mt-1 text-[0.75rem] text-cocoa-2">Blinkit, Zepto, Instamart</div>
                </div>

                <div className="rounded-2xl border border-cocoa/15 bg-white p-3">
                  <label className="block text-[0.82rem] font-bold text-cocoa">Amazon & Portals (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={plan.channelAmazon}
                    onChange={(e) => setField("channelAmazon", Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border p-2 font-bold text-cocoa"
                  />
                  <div className="mt-1 text-[0.75rem] text-cocoa-2">Marketplace search</div>
                </div>

                <div className="rounded-2xl border border-cocoa/15 bg-white p-3">
                  <label className="block text-[0.82rem] font-bold text-cocoa">Corporate Gifting (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={plan.channelCorporate}
                    onChange={(e) => setField("channelCorporate", Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border p-2 font-bold text-cocoa"
                  />
                  <div className="mt-1 text-[0.75rem] text-cocoa-2">B2B bulk hampers</div>
                </div>

                <div className="rounded-2xl border border-cocoa/15 bg-white p-3">
                  <label className="block text-[0.82rem] font-bold text-cocoa">Modern Trade (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={plan.channelRetail}
                    onChange={(e) => setField("channelRetail", Number(e.target.value))}
                    className="mt-1 w-full rounded-lg border p-2 font-bold text-cocoa"
                  />
                  <div className="mt-1 text-[0.75rem] text-cocoa-2">Gourmet supermarkets</div>
                </div>
              </div>

              {/* Channel Sum Warning */}
              {plan.channelD2C + plan.channelQCommerce + plan.channelAmazon + plan.channelCorporate + plan.channelRetail !== 100 && (
                <div className="rounded-xl border border-orange/40 bg-orange/10 p-3 text-[0.85rem] font-bold text-orange">
                  Current total channel allocation is{" "}
                  {plan.channelD2C + plan.channelQCommerce + plan.channelAmazon + plan.channelCorporate + plan.channelRetail}% (should add up to 100%).
                </div>
              )}
            </div>
          )}

          {activeStep === 5 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-orange font-bold text-[0.85rem] uppercase tracking-wider">
                <Flame className="size-4" /> Step 5 · 360° Launch Campaign & Creative Strategy
              </div>

              <div>
                <label className="block text-[0.85rem] font-bold text-cocoa">Launch Campaign Hook / Big Idea</label>
                <input
                  type="text"
                  value={plan.campaignHook}
                  onChange={(e) => setField("campaignHook", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-cocoa/20 p-2.5 text-[0.95rem] focus:border-orange focus:outline-none"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[0.85rem] font-bold text-cocoa">Core Platforms & Channels</label>
                  <input
                    type="text"
                    value={plan.socialPlatforms}
                    onChange={(e) => setField("socialPlatforms", e.target.value)}
                    className="mt-1 w-full rounded-xl border border-cocoa/20 p-2.5 text-[0.95rem] focus:border-orange focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[0.85rem] font-bold text-cocoa">Monthly Marketing Budget (₹)</label>
                  <input
                    type="number"
                    step={10000}
                    value={plan.monthlyAdBudget}
                    onChange={(e) => setField("monthlyAdBudget", Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-cocoa/20 p-2.5 text-[0.95rem] font-bold focus:border-orange focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[0.85rem] font-bold text-cocoa">
                  Creator & Influencer Seeding Strategy
                </label>
                <textarea
                  rows={2}
                  value={plan.creatorStrategy}
                  onChange={(e) => setField("creatorStrategy", e.target.value)}
                  className="mt-1 w-full rounded-xl border border-cocoa/20 p-2.5 text-[0.95rem] focus:border-orange focus:outline-none"
                />
              </div>
            </div>
          )}

          {activeStep === 6 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-orange font-bold text-[0.85rem] uppercase tracking-wider">
                <TrendingUp className="size-4" /> Step 6 · Financial & Scale Forecast
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-[0.85rem] font-bold text-cocoa">Target Monthly Volume (Units)</label>
                  <input
                    type="number"
                    step={1000}
                    value={plan.targetMonthlyUnits}
                    onChange={(e) => setField("targetMonthlyUnits", Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-cocoa/20 p-2.5 text-[1.1rem] font-bold text-cocoa focus:border-orange focus:outline-none"
                  />
                  <p className="mt-1 text-[0.8rem] text-cocoa-2">Eat Better fulfilled ~2 lakh total orders/month in FY24.</p>
                </div>

                <div>
                  <label className="block text-[0.85rem] font-bold text-cocoa">Target Break-Even Horizon (Months)</label>
                  <input
                    type="number"
                    min={1}
                    max={24}
                    value={plan.breakEvenMonths}
                    onChange={(e) => setField("breakEvenMonths", Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-cocoa/20 p-2.5 text-[1.1rem] font-bold text-cocoa focus:border-orange focus:outline-none"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-cocoa/15 bg-cream/70 p-4">
                <div className="font-display text-[1.1rem] font-bold text-cocoa">Projected Monthly Contribution Summary</div>
                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div className="rounded-xl bg-white p-3 border border-cocoa/10">
                    <div className="text-[0.76rem] font-bold text-cocoa-2 uppercase">Gross Monthly Revenue</div>
                    <div className="font-display font-bold text-[1.25rem] text-cocoa">
                      ₹{metrics.monthlyGrossRevenue.toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div className="rounded-xl bg-white p-3 border border-cocoa/10">
                    <div className="text-[0.76rem] font-bold text-cocoa-2 uppercase">Gross Profit (Pre-marketing)</div>
                    <div className="font-display font-bold text-[1.25rem] text-success">
                      ₹{metrics.monthlyGrossProfit.toLocaleString("en-IN")}
                    </div>
                  </div>
                  <div className="rounded-xl bg-white p-3 border border-cocoa/10">
                    <div className="text-[0.76rem] font-bold text-cocoa-2 uppercase">Net Contribution (Post-logistics)</div>
                    <div className="font-display font-bold text-[1.25rem] text-orange">
                      ₹{metrics.monthlyNetContribution.toLocaleString("en-IN")}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Step Navigation Controls */}
          <div className="mt-6 flex items-center justify-between pt-4 border-t border-cocoa/10">
            <button
              onClick={() => setActiveStep(Math.max(1, activeStep - 1))}
              disabled={activeStep === 1}
              className={`rounded-xl border border-cocoa/20 px-4 py-2 text-[0.88rem] font-bold ${
                activeStep === 1 ? "opacity-40 cursor-not-allowed text-cocoa-2" : "bg-white text-cocoa hover:border-cocoa"
              }`}
            >
              Previous Step
            </button>

            <span className="text-[0.82rem] font-bold text-cocoa-2">
              Step {activeStep} of {GTM_STEPS.length}
            </span>

            {activeStep < GTM_STEPS.length ? (
              <button
                onClick={() => setActiveStep(Math.min(GTM_STEPS.length, activeStep + 1))}
                className="inline-flex items-center gap-1.5 rounded-xl bg-cocoa px-4 py-2 text-[0.88rem] font-bold text-cream hover:bg-cocoa/90"
              >
                Next Step <ArrowRight className="size-4" />
              </button>
            ) : (
              <a
                href="#dossier-export"
                className="inline-flex items-center gap-1.5 rounded-xl bg-orange px-4 py-2 text-[0.88rem] font-bold text-white shadow hover:bg-orange/90"
              >
                Review & Export Dossier <CheckCircle2 className="size-4" />
              </a>
            )}
          </div>
        </div>
      </Panel>
    </section>
  );
}

/* ── 4. Dossier Exporter ───────────────────────────────────────── */

export function DossierExporter() {
  const plan = useCapstoneStore((s) => s.plan);
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);
  const [submissionDate, setSubmissionDate] = useState("November 2026");

  useEffect(() => {
    setSubmissionDate(new Date().toLocaleDateString("en-IN", { dateStyle: "long" }));
  }, []);

  const markdown = generateCapstoneMarkdown(plan, submissionDate);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      //
    }
  };

  const handleDownload = () => {
    const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Eat-Better-Capstone-Task-A-${plan.selectedTrackId}.md`;
    link.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <section id="dossier-export" className={sectionCls}>
      <Panel tone="light" reveal="up" width="max-w-7xl">
        <SectionIntro
          index="4"
          kicker="Proposal Dossier & Export"
          title="Review Your Capstone Submission"
        >
          Your project proposal is compiled and formatted as a formal business proposal ready for review by Eat Better leadership and SkilliZee evaluators.
        </SectionIntro>

        <div className="mt-6 rounded-[24px] border border-cocoa bg-cream p-6 shadow-[3px_3px_0_0_#2f1c1a]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-cocoa/15">
            <div>
              <div className="font-display text-[1.25rem] font-bold text-cocoa">
                {plan.projectName || "Eat Better Capstone Strategy"}
              </div>
              <div className="text-[0.88rem] text-cocoa-2">
                Track: <strong>{plan.selectedTrackId}</strong> · Author:{" "}
                <strong>{plan.studentName || "[Intern Name]"}</strong>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded-xl border border-cocoa/20 bg-white px-3.5 py-2 text-[0.88rem] font-bold text-cocoa hover:border-cocoa transition-all"
              >
                <ClipboardCopy className="size-4" />
                {copied ? "Copied to Clipboard!" : "Copy Markdown"}
              </button>

              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 rounded-xl bg-orange px-4 py-2 text-[0.88rem] font-bold text-white shadow hover:bg-orange/90 transition-all active:scale-95"
              >
                <Download className="size-4" />
                {downloaded ? "Dossier Downloaded!" : "Download Proposal (.md)"}
              </button>
            </div>
          </div>

          {/* Dossier Code/Text Preview */}
          <div className="mt-4 max-h-[380px] overflow-y-auto rounded-2xl border border-cocoa/20 bg-white p-5 font-mono text-[0.82rem] leading-relaxed text-cocoa shadow-inner">
            <pre className="whitespace-pre-wrap">{markdown}</pre>
          </div>
        </div>
      </Panel>
    </section>
  );
}

/* ── 5. Evaluation Rubric ──────────────────────────────────────── */

export function RubricSection() {
  return (
    <section id="rubric" className={sectionCls}>
      <Panel tone="light" reveal="up" width="max-w-7xl">
        <SectionIntro
          index="5"
          kicker="Evaluation Standard"
          title="Capstone Evaluation Rubric"
        >
          Evaluators grade your Task A submission across four equally weighted pillars (25% each).
        </SectionIntro>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {EVALUATION_RUBRIC.map((r, i) => (
            <div
              key={r.category}
              className="flex flex-col justify-between rounded-2xl border border-cocoa bg-white p-5 shadow-[2px_2px_0_0_#2f1c1a]"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[0.78rem] font-extrabold uppercase tracking-wider text-orange">
                    Pillar {i + 1}
                  </span>
                  <span className="rounded-md bg-cocoa px-2 py-0.5 text-[0.75rem] font-bold text-haldi">
                    {r.weight}
                  </span>
                </div>
                <h4 className="mt-2 font-display text-[1.1rem] font-bold leading-tight text-cocoa">
                  {r.category}
                </h4>
                <p className="mt-2 text-[0.88rem] leading-relaxed text-cocoa-2">
                  {r.description}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-cocoa/10 text-[0.8rem] font-semibold text-cocoa/80 italic">
                &ldquo;{r.benchmark}&rdquo;
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </section>
  );
}

/* ── 6. Wrap Up & Next Chapter ─────────────────────────────────── */

export function WrapUp() {
  return (
    <section id="wrap-up" className={sectionCls}>
      <Panel tone="light" reveal="up" width="max-w-7xl">
        <div className="text-[0.85rem] font-extrabold uppercase tracking-[0.16em] text-orange">
          Chapter 5.1 · Wrap-Up
        </div>
        <h2 className="mt-3 font-display text-[clamp(2rem,4vw,3rem)] font-semibold leading-[1.05] text-cocoa">
          Task A Complete: Project Strategy Locked
        </h2>

        <div className="mt-6 rounded-[24px] border border-cocoa bg-cocoa p-6 text-cream shadow-[3px_3px_0_0_#2f1c1a]">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-orange text-white">
              <Sparkles className="size-6" />
            </span>
            <div>
              <div className="text-[0.8rem] font-bold uppercase tracking-wider text-haldi">
                Core Takeaway
              </div>
              <p className="mt-1 font-display text-[1.2rem] leading-snug text-cream">
                <GlossaryText>{TAKEAWAY}</GlossaryText>
              </p>
            </div>
          </div>
        </div>

        {/* Link to Chapter 5.2 */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-[24px] border border-cocoa bg-peach/70 p-6">
          <div>
            <div className="text-[0.8rem] font-bold uppercase tracking-wider text-orange">
              Next Step: Final Capstone Task B
            </div>
            <h3 className="font-display text-[1.35rem] font-bold text-cocoa">
              Chapter 5.2 — Video Pitch / Review
            </h3>
            <p className="mt-1 text-[0.92rem] text-cocoa-2">
              Create a 60–90 second video pitch or product review with the interactive teleprompter studio.
            </p>
          </div>
          <a
            href="/5.2"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-cocoa px-6 py-3 font-bold text-cream shadow-[2px_2px_0_0_#ff5c00] hover:bg-cocoa/90 transition-transform active:scale-95"
          >
            Go to Chapter 5.2 <ArrowRight className="size-5" />
          </a>
        </div>
      </Panel>
    </section>
  );
}
