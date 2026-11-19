"use client";

import { useState } from "react";
import Image from "next/image";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  Palette,
  PackageCheck,
  ShoppingCart,
  Sparkles,
  Store,
} from "lucide-react";
import { Panel } from "@/components/chapter/Panel";
import { SectionIntro } from "@/components/chapter/SectionIntro";
import { ToolIcon } from "@/components/ui/ToolIcon";
import {
  BRAND_TOKENS,
  RECOMMENDED_TOOLS_TASK_B,
  STOREFRONT_ARCHETYPES,
  STOREFRONT_PILLARS,
  SUBMISSION_CHECKLIST_TASK_B,
  TAKEAWAY_5_2,
} from "./content";

const sectionCls = "relative scroll-mt-4 px-3 py-4 sm:px-6 sm:py-6";

/* ── 1. Storefront Hub & 3 Archetypes ──────────────────────────── */

export function TaskBStorefrontHub() {
  const [activeArchetypeId, setActiveArchetypeId] = useState<string>("product-launch-pdp");
  const activeArchetype = STOREFRONT_ARCHETYPES.find((a) => a.id === activeArchetypeId) || STOREFRONT_ARCHETYPES[0];

  return (
    <section id="storefront-hub" className={sectionCls}>
      <Panel tone="light" reveal="up" width="max-w-7xl">
        <SectionIntro
          index="1"
          kicker="Final Capstone · Task B"
          title="E-Commerce Storefront Development"
        >
          Design a branded D2C e-commerce webpage for your proposed Eat Better expansion.
        </SectionIntro>

        {/* 4 Feature Badges */}
        <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="flex items-center gap-2 rounded-xl border border-cocoa/15 bg-cream/70 p-2 text-[0.8rem] font-bold text-cocoa">
            <PackageCheck className="size-4 text-orange shrink-0" /> Original Packaging
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-cocoa/15 bg-cream/70 p-2 text-[0.8rem] font-bold text-cocoa">
            <Store className="size-4 text-orange shrink-0" /> Product Detail (PDP)
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-cocoa/15 bg-cream/70 p-2 text-[0.8rem] font-bold text-cocoa">
            <ShoppingCart className="size-4 text-orange shrink-0" /> Cart & Checkout Flow
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-cocoa/15 bg-cream/70 p-2 text-[0.8rem] font-bold text-cocoa">
            <Palette className="size-4 text-orange shrink-0" /> Eat Better Brand UI
          </div>
        </div>

        {/* Archetype Selector Cards */}
        <div className="mt-3.5">
          <div className="flex items-center justify-between">
            <span className="text-[0.8rem] font-bold uppercase tracking-wider text-cocoa">
              Select Your Storefront Type:
            </span>
            <span className="text-[0.76rem] font-bold text-orange">Click card to inspect</span>
          </div>

          <div className="mt-2 grid grid-cols-1 sm:grid-cols-3 gap-2.5">
            {STOREFRONT_ARCHETYPES.map((arch) => {
              const isSelected = arch.id === activeArchetypeId;
              return (
                <button
                  key={arch.id}
                  onClick={() => setActiveArchetypeId(arch.id)}
                  className={`group flex flex-col overflow-hidden rounded-xl border text-left transition-all ${
                    isSelected
                      ? "border-orange bg-cream shadow-[3px_3px_0_0_#ff5c00] scale-[1.01]"
                      : "border-cocoa/20 bg-white hover:border-cocoa/40 hover:bg-peach/20"
                  }`}
                >
                  <div className="relative aspect-[16/9] w-full overflow-hidden bg-cocoa/5">
                    <Image
                      src={arch.heroImg}
                      alt={arch.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, 33vw"
                    />
                    <div className="absolute left-2 top-2 rounded-md bg-cocoa/85 px-2 py-0.5 text-[0.72rem] font-bold text-cream backdrop-blur-xs">
                      {arch.badge}
                    </div>
                  </div>
                  <div className="p-2.5 flex flex-col justify-between flex-1">
                    <div>
                      <h4 className="font-display text-[0.92rem] font-bold leading-tight text-cocoa">
                        {arch.title}
                      </h4>
                      <p className="mt-0.5 text-[0.8rem] leading-snug text-cocoa-2">
                        {arch.tagline}
                      </p>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[0.72rem] font-bold">
                      <span className={isSelected ? "text-orange" : "text-cocoa/60"}>
                        {isSelected ? "Active Blueprint" : "Click to View"}
                      </span>
                      <ArrowRight className={`size-3 transition-transform ${isSelected ? "text-orange translate-x-1" : "text-cocoa/40"}`} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Archetype Showcase */}
          <div className="mt-3 overflow-hidden rounded-[18px] border border-cocoa bg-white shadow-[2px_2px_0_0_#2f1c1a]">
            <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
              <div className="relative min-h-[200px] lg:min-h-[260px] bg-cocoa/5 lg:col-span-6">
                <Image
                  src={activeArchetype.heroImg}
                  alt={activeArchetype.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
                <div className="absolute left-2.5 top-2.5 rounded-md bg-cocoa/90 px-2.5 py-0.5 text-[0.7rem] font-bold text-cream backdrop-blur-sm">
                  {activeArchetype.badge} · Storefront Preview
                </div>
              </div>

              <div className="p-4 lg:col-span-6 space-y-2.5">
                <div>
                  <span className="text-[0.72rem] font-bold uppercase tracking-wider text-orange">
                    Ideal For: {activeArchetype.idealFor}
                  </span>
                  <h4 className="font-display text-[1.2rem] font-bold text-cocoa">
                    {activeArchetype.title}
                  </h4>
                </div>

                <div className="rounded-xl border border-cocoa/10 bg-cream/60 p-2.5">
                  <span className="text-[0.75rem] font-bold uppercase tracking-wide text-cocoa">
                    Must-Include Sections:
                  </span>
                  <ul className="mt-1 space-y-1">
                    {activeArchetype.keySections.map((sec, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-[0.8rem] text-cocoa">
                        <CheckCircle2 className="size-3.5 shrink-0 text-orange mt-0.5" />
                        <span>{sec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-orange/20 bg-orange/5 p-2 text-[0.78rem] font-bold text-cocoa flex items-center gap-2">
                  <Sparkles className="size-3.5 text-orange shrink-0" />
                  <span><strong>Conversion Booster:</strong> {activeArchetype.conversionFeature}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Panel>
    </section>
  );
}

/* ── 2. Storefront Pillars & Brand Tokens ──────────────────────── */

export function StorefrontPillars() {
  const [activePillarIndex, setActivePillarIndex] = useState<number>(0);
  const activePillar = STOREFRONT_PILLARS[activePillarIndex];

  return (
    <section id="storefront-pillars" className={sectionCls}>
      <Panel tone="light" reveal="up" width="max-w-7xl">
        <SectionIntro
          index="2"
          kicker="Storefront Anatomy"
          title="The 4 Pillars of an Eat Better Storefront"
        >
          Core commercial elements for your digital storefront.
        </SectionIntro>

        {/* 4 Pillars Stepper */}
        <div className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {STOREFRONT_PILLARS.map((p, i) => (
            <button
              key={p.number}
              onClick={() => setActivePillarIndex(i)}
              className={`rounded-xl border p-2 text-left transition-all ${
                i === activePillarIndex
                  ? "border-cocoa bg-cocoa text-cream shadow-[2px_2px_0_0_#ff5c00]"
                  : "border-cocoa/15 bg-white text-cocoa hover:border-cocoa/40 hover:bg-peach/20"
              }`}
            >
              <span className={`text-[0.72rem] font-bold ${i === activePillarIndex ? "text-orange" : "text-cocoa/60"}`}>
                Pillar {p.number}
              </span>
              <div className="mt-0.5 font-display text-[0.85rem] font-bold leading-tight">
                {p.title}
              </div>
            </button>
          ))}
        </div>

        {/* Active Pillar Card */}
        <div className="mt-3 rounded-[18px] border border-cocoa bg-white p-4 shadow-[2px_2px_0_0_#2f1c1a]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-2 border-b border-cocoa/10">
            <div>
              <span className="text-[0.72rem] font-bold uppercase tracking-wider text-orange">
                Pillar {activePillar.number} · {activePillar.badge}
              </span>
              <h3 className="font-display text-[1.15rem] font-bold text-cocoa">
                {activePillar.title}
              </h3>
            </div>
            <span className="text-[0.8rem] font-medium text-cocoa-2">
              {activePillar.subtitle}
            </span>
          </div>

          <div className="mt-2.5 grid gap-2.5 lg:grid-cols-12 items-center">
            <div className="space-y-1.5 lg:col-span-7">
              {activePillar.requirements.map((req, idx) => (
                <div
                  key={idx}
                  className="flex items-start gap-2 rounded-xl border border-cocoa/10 bg-cream/50 p-2 text-[0.82rem] text-cocoa"
                >
                  <span className="grid size-4.5 shrink-0 place-items-center rounded-full bg-orange text-[0.68rem] font-bold text-white">
                    {idx + 1}
                  </span>
                  <span>{req}</span>
                </div>
              ))}
            </div>

            <div className="rounded-xl border border-cocoa/15 bg-peach/40 p-3 lg:col-span-5 space-y-1">
              <span className="text-[0.72rem] font-bold uppercase tracking-wider text-orange">
                Brand Guidance
              </span>
              <p className="text-[0.82rem] leading-relaxed text-cocoa">
                {activePillar.eatBetterGuidelines}
              </p>
            </div>
          </div>
        </div>

        {/* Compact Brand Color Token Bar */}
        <div className="mt-3 rounded-[16px] border border-cocoa bg-cream p-3 shadow-xs">
          <div className="flex items-center justify-between pb-1.5 border-b border-cocoa/10">
            <div className="flex items-center gap-1.5 font-display text-[0.88rem] font-bold text-cocoa">
              <Palette className="size-3.5 text-orange" /> Eat Better Brand Color Tokens
            </div>
            <span className="text-[0.72rem] font-bold text-orange">5 Core Codes</span>
          </div>

          <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-5">
            {BRAND_TOKENS.map((token) => (
              <div
                key={token.name}
                className="flex items-center gap-2 rounded-lg border border-cocoa/10 bg-white p-1.5"
              >
                <div
                  className="size-5 shrink-0 rounded-md border border-cocoa/15"
                  style={{ backgroundColor: token.hex }}
                />
                <div className="min-w-0">
                  <div className="truncate font-display text-[0.76rem] font-bold text-cocoa leading-tight">
                    {token.name}
                  </div>
                  <div className="font-mono text-[0.7rem] font-bold text-orange">
                    {token.hex}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </Panel>
    </section>
  );
}

/* ── 3. Recommended Tools, Checklist & Wrap-Up ─────────────────── */

export function RecommendedStorefrontToolsAndChecklist() {
  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>({});

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const completedCount = Object.values(checkedIds).filter(Boolean).length;
  const totalCount = SUBMISSION_CHECKLIST_TASK_B.length;

  return (
    <section id="tools-and-checklist" className={sectionCls}>
      <Panel tone="light" reveal="up" width="max-w-7xl">
        <SectionIntro
          index="3"
          kicker="Execution & Verification"
          title="Recommended Storefront Tools & Quality Checklist"
        >
          Build externally in your preferred tool and submit your link.
        </SectionIntro>

        {/* Compact Tools Grid */}
        <div className="mt-3 grid grid-cols-1 gap-2.5 sm:grid-cols-2 lg:grid-cols-3">
          {RECOMMENDED_TOOLS_TASK_B.map((cat) => (
            <div
              key={cat.category}
              className="rounded-xl border border-cocoa bg-cream p-3 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-1.5 border-b border-cocoa/10">
                  <h4 className="font-display text-[0.92rem] font-bold text-cocoa">
                    {cat.category}
                  </h4>
                  <span className="rounded-full bg-orange/15 px-2 py-0.5 text-[0.72rem] font-bold text-orange">
                    {cat.badge}
                  </span>
                </div>
                <div className="mt-2 space-y-1.5">
                  {cat.tools.map((t) => (
                    <div
                      key={t.name}
                      className="flex items-center gap-2 rounded-lg border border-cocoa/10 bg-white p-2 shadow-xs"
                    >
                      <ToolIcon id={t.id} className="size-5.5 shrink-0 rounded-md" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="min-w-0 truncate font-display text-[0.84rem] font-bold text-cocoa">
                            {t.name}
                          </span>
                          {t.badge && (
                            <span className="shrink-0 rounded bg-haldi/40 px-1.5 py-0.5 text-[0.7rem] font-bold text-cocoa">
                              {t.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[0.8rem] leading-snug text-cocoa-2">
                          {t.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Compact Verification Checklist */}
        <div className="mt-3 rounded-[16px] border border-cocoa bg-white p-3.5 shadow-sm">
          <div className="flex items-center justify-between pb-1.5 border-b border-cocoa/10">
            <h4 className="font-display text-[0.94rem] font-bold text-cocoa">
              Pre-Submission Storefront Checklist
            </h4>
            <span className="rounded-full bg-peach px-2 py-0.5 text-[0.72rem] font-bold text-cocoa">
              {completedCount} of {totalCount} verified
            </span>
          </div>

          <div className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {SUBMISSION_CHECKLIST_TASK_B.map((item) => {
              const isChecked = !!checkedIds[item.id];
              return (
                <button
                  key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  className={`flex items-center gap-2 rounded-lg border p-2 text-left transition-all ${
                    isChecked
                      ? "border-orange bg-orange/5 text-cocoa"
                      : "border-cocoa/10 bg-cream/40 text-cocoa hover:bg-cream/70"
                  }`}
                >
                  <span
                    className={`grid size-4.5 shrink-0 place-items-center rounded-md border transition-colors ${
                      isChecked
                        ? "border-orange bg-orange text-white"
                        : "border-cocoa/30 bg-white"
                    }`}
                  >
                    {isChecked && <CheckCircle2 className="size-3.5" />}
                  </span>
                  <span className="font-display text-[0.86rem] font-bold leading-snug">
                    {item.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Graduation / Course Completion Banner (Clean, No Buttons, Minimal Text) */}
        <div className="mt-3 flex items-center justify-between rounded-xl border border-cocoa bg-cocoa px-4 py-3 text-cream shadow-[2px_2px_0_0_#ff5c00]">
          <div className="flex items-center gap-3">
            <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-orange text-white">
              <Award className="size-4" />
            </span>
            <div>
              <div className="text-[0.72rem] font-bold uppercase tracking-wider text-orange">
                Virtual Internship Milestone
              </div>
              <h3 className="font-display text-[1rem] font-bold text-cream">
                {TAKEAWAY_5_2.title}
              </h3>
            </div>
          </div>
        </div>
      </Panel>
    </section>
  );
}
