"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
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

const sectionCls = "relative scroll-mt-6 px-3 py-6 sm:px-6 sm:py-10";

/* ── 1. Task B Overview ────────────────────────────────────────── */

export function TaskBOverview() {
  const [activeArchetypeId, setActiveArchetypeId] = useState<string>("product-launch-pdp");
  const activeArchetype = STOREFRONT_ARCHETYPES.find((a) => a.id === activeArchetypeId) || STOREFRONT_ARCHETYPES[0];

  return (
    <section id="task-b-overview" className={sectionCls}>
      <Panel tone="light" reveal="up" width="max-w-7xl">
        <SectionIntro
          index="1"
          kicker="Executive Mission"
          title="Task B: E-Commerce Storefront Development"
        >
          Building upon your strategy in Task A, design and develop a complete, visually appealing e-commerce webpage for your proposed Eat Better product or category expansion.
        </SectionIntro>

        {/* Executive Task Card */}
        <div className="mt-6 rounded-[24px] border-2 border-cocoa bg-cream p-6 shadow-[4px_4px_0_0_#2f1c1a]">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-orange px-3.5 py-1 text-[0.8rem] font-bold text-white uppercase tracking-wider">
              Capstone Task B
            </span>
            <span className="rounded-full bg-haldi/50 px-3.5 py-1 text-[0.8rem] font-bold text-cocoa">
              Digital Flagship Webstore
            </span>
            <span className="rounded-full bg-cocoa/10 px-3.5 py-1 text-[0.8rem] font-bold text-cocoa">
              Built Upon Task A Strategy
            </span>
          </div>

          <p className="mt-4 text-[1.08rem] font-medium leading-relaxed text-cocoa">
            Create original product packaging and product designs, showcase the products with descriptions and pricing, and build a branded shopping experience that reflects Eat Better&apos;s identity. The webpage should include product listings, product detail sections, shopping cart functionality, and a clear purchase journey, demonstrating how the proposed product would be presented and sold to customers online.
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4 pt-4 border-t border-cocoa/15">
            <div className="flex items-center gap-2 text-[0.86rem] font-bold text-cocoa">
              <PackageCheck className="size-4 text-orange shrink-0" /> Original Packaging
            </div>
            <div className="flex items-center gap-2 text-[0.86rem] font-bold text-cocoa">
              <Store className="size-4 text-orange shrink-0" /> Product Detail (PDP)
            </div>
            <div className="flex items-center gap-2 text-[0.86rem] font-bold text-cocoa">
              <ShoppingCart className="size-4 text-orange shrink-0" /> Cart & Checkout
            </div>
            <div className="flex items-center gap-2 text-[0.86rem] font-bold text-cocoa">
              <Palette className="size-4 text-orange shrink-0" /> Eat Better Brand UI
            </div>
          </div>
        </div>

        {/* Archetype Selector Cards with Generated Images */}
        <div className="mt-8">
          <div className="flex items-center justify-between">
            <h3 className="font-display text-[1.25rem] font-bold text-cocoa">
              Select Your Storefront Type
            </h3>
            <span className="text-[0.82rem] font-bold text-orange">
              3 Archetypes Available · Click to inspect blueprint
            </span>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            {STOREFRONT_ARCHETYPES.map((arch) => {
              const isSelected = arch.id === activeArchetypeId;
              return (
                <button
                  key={arch.id}
                  onClick={() => setActiveArchetypeId(arch.id)}
                  className={`group flex flex-col overflow-hidden rounded-[20px] border-2 text-left transition-all ${
                    isSelected
                      ? "border-orange bg-cream shadow-[4px_4px_0_0_#ff5c00] scale-[1.01]"
                      : "border-cocoa/20 bg-white hover:border-cocoa/50 hover:bg-peach/20"
                  }`}
                >
                  <div className="relative aspect-[16/10] w-full overflow-hidden bg-cocoa/5">
                    <Image
                      src={arch.heroImg}
                      alt={arch.title}
                      fill
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                      sizes="(max-width: 640px) 100vw, 33vw"
                    />
                    <div className="absolute left-2.5 top-2.5 rounded-full bg-cocoa/85 px-2.5 py-0.5 text-[0.7rem] font-bold text-cream backdrop-blur-xs">
                      {arch.badge}
                    </div>
                  </div>
                  <div className="p-3.5 flex flex-col justify-between flex-1">
                    <div>
                      <h4 className="font-display text-[1rem] font-bold leading-tight text-cocoa">
                        {arch.title}
                      </h4>
                      <p className="mt-1 text-[0.8rem] text-cocoa-2 line-clamp-2 leading-snug">
                        {arch.tagline}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[0.76rem] font-bold">
                      <span className={isSelected ? "text-orange" : "text-cocoa/60"}>
                        {isSelected ? "Active Blueprint" : "Click to Explore"}
                      </span>
                      <ArrowRight className={`size-3.5 transition-transform ${isSelected ? "text-orange translate-x-1" : "text-cocoa/40"}`} />
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Active Archetype Showcase */}
          <div className="mt-6 overflow-hidden rounded-[24px] border border-cocoa bg-white shadow-[3px_3px_0_0_#2f1c1a]">
            <div className="grid grid-cols-1 lg:grid-cols-12">
              <div className="relative min-h-[280px] lg:min-h-[420px] bg-cocoa/5 lg:col-span-6">
                <Image
                  src={activeArchetype.heroImg}
                  alt={activeArchetype.title}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                  priority
                />
                <div className="absolute left-3 top-3 rounded-full bg-cocoa/90 px-3 py-1 text-[0.76rem] font-bold text-cream backdrop-blur-sm">
                  {activeArchetype.badge} · Full Storefront Preview
                </div>
              </div>

              <div className="flex flex-col justify-between p-6 lg:col-span-6">
                <div>
                  <span className="text-[0.78rem] font-bold uppercase tracking-wider text-orange">
                    Recommended For: {activeArchetype.idealFor}
                  </span>
                  <h4 className="mt-1 font-display text-[1.4rem] font-bold text-cocoa">
                    {activeArchetype.title}
                  </h4>
                  <p className="mt-2 text-[0.92rem] leading-relaxed text-cocoa-2">
                    {activeArchetype.description}
                  </p>

                  <div className="mt-4">
                    <span className="text-[0.82rem] font-bold uppercase tracking-wide text-cocoa">
                      Must-Include Page Sections:
                    </span>
                    <ul className="mt-2 space-y-1.5">
                      {activeArchetype.keySections.map((sec, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-[0.86rem] text-cocoa">
                          <CheckCircle2 className="size-4 shrink-0 text-orange mt-0.5" />
                          <span>{sec}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                <div className="mt-5 rounded-xl border border-orange/20 bg-orange/5 p-3.5 text-[0.84rem] font-bold text-cocoa flex items-center gap-2">
                  <Sparkles className="size-4 text-orange shrink-0" />
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

/* ── 2. Storefront Architecture Blueprint ──────────────────────── */

export function StorefrontBlueprint() {
  const [activePillarIndex, setActivePillarIndex] = useState<number>(0);
  const activePillar = STOREFRONT_PILLARS[activePillarIndex];

  return (
    <section id="storefront-blueprint" className={sectionCls}>
      <Panel tone="light" reveal="up" width="max-w-7xl">
        <SectionIntro
          index="2"
          kicker="Storefront Anatomy"
          title="The 4 Pillars of an Eat Better Storefront"
        >
          Review the four non-negotiable architectural pillars of your e-commerce webpage before opening your design or no-code builder.
        </SectionIntro>

        {/* Pillars Tab Selector */}
        <div className="mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {STOREFRONT_PILLARS.map((p, i) => (
            <button
              key={p.number}
              onClick={() => setActivePillarIndex(i)}
              className={`rounded-2xl border p-3.5 text-left transition-all ${
                i === activePillarIndex
                  ? "border-cocoa bg-cocoa text-cream shadow-[3px_3px_0_0_#ff5c00]"
                  : "border-cocoa/20 bg-white text-cocoa hover:border-cocoa/50 hover:bg-peach/30"
              }`}
            >
              <span className={`text-[0.75rem] font-bold ${i === activePillarIndex ? "text-orange" : "text-cocoa/60"}`}>
                Pillar {p.number}
              </span>
              <h4 className="mt-1 font-display text-[0.98rem] font-bold leading-tight line-clamp-2">
                {p.title}
              </h4>
            </button>
          ))}
        </div>

        {/* Active Pillar Card */}
        <div className="mt-5 rounded-[24px] border border-cocoa bg-white p-6 shadow-[3px_3px_0_0_#2f1c1a]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-4 border-b border-cocoa/15">
            <div>
              <span className="text-[0.78rem] font-bold uppercase tracking-wider text-orange">
                Pillar {activePillar.number} · {activePillar.badge}
              </span>
              <h3 className="font-display text-[1.4rem] font-bold text-cocoa">
                {activePillar.title}
              </h3>
              <p className="text-[0.92rem] text-cocoa-2">{activePillar.subtitle}</p>
            </div>
          </div>

          <div className="mt-5 grid gap-6 lg:grid-cols-12">
            <div className="space-y-3 lg:col-span-7">
              <h4 className="text-[0.86rem] font-bold uppercase tracking-wider text-cocoa">
                Specific Webpage Requirements:
              </h4>
              <div className="space-y-2.5">
                {activePillar.requirements.map((req, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 rounded-xl border border-cocoa/10 bg-cream/60 p-3 text-[0.88rem] leading-relaxed text-cocoa"
                  >
                    <span className="grid size-6 shrink-0 place-items-center rounded-full bg-orange text-[0.75rem] font-bold text-white">
                      {idx + 1}
                    </span>
                    <span>{req}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col justify-between rounded-2xl border border-cocoa/15 bg-peach/40 p-5 lg:col-span-5">
              <div>
                <span className="text-[0.78rem] font-bold uppercase tracking-wider text-orange">
                  Eat Better Brand Guidance
                </span>
                <p className="mt-2 text-[0.9rem] leading-relaxed text-cocoa">
                  {activePillar.eatBetterGuidelines}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-cocoa/15 text-[0.8rem] text-cocoa-2 font-medium">
                💡 Tip: Use high-contrast headings, rounded card corners (16-24px), and warm shadows to match the Eat Better site aesthetic.
              </div>
            </div>
          </div>
        </div>

        {/* Brand Token Quick Reference */}
        <div className="mt-6 rounded-[22px] border border-cocoa bg-cream p-5 shadow-sm">
          <div className="flex items-center gap-2 pb-3 border-b border-cocoa/15">
            <Palette className="size-5 text-orange" />
            <h4 className="font-display text-[1.1rem] font-bold text-cocoa">
              Eat Better Design System Color Tokens
            </h4>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {BRAND_TOKENS.map((token) => (
              <div
                key={token.name}
                className="rounded-xl border border-cocoa/15 bg-white p-3 shadow-xs"
              >
                <div
                  className="h-9 w-full rounded-lg border border-cocoa/10"
                  style={{ backgroundColor: token.hex }}
                />
                <div className="mt-2 font-display text-[0.92rem] font-bold text-cocoa">
                  {token.name}
                </div>
                <div className="text-[0.78rem] font-mono font-bold text-orange">
                  {token.hex}
                </div>
                <p className="mt-1 text-[0.75rem] text-cocoa-2 line-clamp-2">
                  {token.usage}
                </p>
              </div>
            ))}
          </div>
        </div>
      </Panel>
    </section>
  );
}

/* ── 3. Recommended Tools (With Logos) ─────────────────────────── */

export function RecommendedStorefrontTools() {
  return (
    <section id="recommended-tools" className={sectionCls}>
      <Panel tone="light" reveal="up" width="max-w-7xl">
        <SectionIntro
          index="3"
          kicker="External Execution Toolkit"
          title="Recommended Tools to Complete Task B"
        >
          You do not need to build your webpage inside this chapter. Use any of the industry-standard tools below to design, mockup, and host your storefront, then submit your live URL or prototype link.
        </SectionIntro>

        <div className="mt-6 space-y-6">
          {RECOMMENDED_TOOLS_TASK_B.map((cat) => (
            <div
              key={cat.category}
              className="rounded-[24px] border border-cocoa bg-cream p-6 shadow-[3px_3px_0_0_#2f1c1a]"
            >
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-3 border-b border-cocoa/15">
                <div>
                  <h3 className="font-display text-[1.25rem] font-bold text-cocoa">
                    {cat.category}
                  </h3>
                  <p className="text-[0.88rem] text-cocoa-2">{cat.description}</p>
                </div>
                <span className="self-start rounded-full bg-orange/15 px-3 py-1 text-[0.75rem] font-bold text-orange">
                  {cat.badge}
                </span>
              </div>

              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {cat.tools.map((t) => (
                  <div
                    key={t.name}
                    className="flex flex-col justify-between rounded-2xl border border-cocoa/15 bg-white p-4 shadow-sm hover:border-cocoa/40 transition-colors"
                  >
                    <div>
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <ToolIcon id={t.id} className="size-7 shrink-0 rounded-lg" />
                          <span className="truncate font-display text-[1.02rem] font-bold text-cocoa">
                            {t.name}
                          </span>
                        </div>
                        {t.badge && (
                          <span className="shrink-0 rounded bg-haldi/40 px-2 py-0.5 text-[0.7rem] font-bold text-cocoa">
                            {t.badge}
                          </span>
                        )}
                      </div>
                      <p className="mt-2 text-[0.84rem] text-cocoa-2 leading-relaxed">
                        {t.description}
                      </p>
                    </div>

                    <div className="mt-3 pt-2.5 border-t border-cocoa/10 text-[0.78rem] font-semibold text-orange">
                      💡 {t.highlight}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </section>
  );
}

/* ── 4. Submission Checklist & Graduation ──────────────────────── */

export function SubmissionChecklist() {
  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>({});

  const toggleCheck = (id: string) => {
    setCheckedIds((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const completedCount = Object.values(checkedIds).filter(Boolean).length;
  const totalCount = SUBMISSION_CHECKLIST_TASK_B.length;
  const progressPercent = Math.round((completedCount / totalCount) * 100);

  return (
    <section id="submission-checklist" className={sectionCls}>
      <Panel tone="light" reveal="up" width="max-w-7xl">
        <SectionIntro
          index="4"
          kicker="Final Pre-Submission Review"
          title="Storefront Quality Checklist"
        >
          Check off each requirement to ensure your storefront meets executive standards before submitting your final link.
        </SectionIntro>

        <div className="mt-6 rounded-[24px] border border-cocoa bg-white p-6 shadow-[3px_3px_0_0_#2f1c1a]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-cocoa/15">
            <div>
              <h3 className="font-display text-[1.25rem] font-bold text-cocoa">
                Storefront Deliverable Readiness
              </h3>
              <p className="text-[0.88rem] text-cocoa-2">
                Click each item once verified in your Shopify, Framer, Webflow, or Figma project.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="rounded-full bg-peach px-3 py-1 text-[0.82rem] font-bold text-cocoa">
                {completedCount} of {totalCount} verified
              </span>
              <span className="rounded-full bg-orange px-3 py-1 text-[0.82rem] font-bold text-white">
                {progressPercent}% Complete
              </span>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {SUBMISSION_CHECKLIST_TASK_B.map((item) => {
              const isChecked = !!checkedIds[item.id];
              return (
                <button
                  key={item.id}
                  onClick={() => toggleCheck(item.id)}
                  className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition-all ${
                    isChecked
                      ? "border-orange bg-orange/5 text-cocoa"
                      : "border-cocoa/15 bg-cream/40 text-cocoa hover:bg-cream/80"
                  }`}
                >
                  <span
                    className={`grid size-6 shrink-0 place-items-center rounded-lg border transition-colors ${
                      isChecked
                        ? "border-orange bg-orange text-white"
                        : "border-cocoa/30 bg-white"
                    }`}
                  >
                    {isChecked && <CheckCircle2 className="size-4" />}
                  </span>
                  <div>
                    <h4 className="font-display text-[0.98rem] font-bold">
                      {item.label}
                    </h4>
                    <p className="mt-1 text-[0.82rem] text-cocoa-2 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Graduation / Course Completion Card */}
        <div className="mt-8 rounded-[28px] border-2 border-cocoa bg-cocoa p-8 text-cream shadow-[4px_4px_0_0_#ff5c00]">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div className="space-y-3 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange px-3.5 py-1 text-[0.8rem] font-bold text-white">
                <Award className="size-4" /> Final Capstone Completed
              </span>
              <h3 className="font-display text-[1.8rem] font-bold text-cream">
                {TAKEAWAY_5_2.title}
              </h3>
              <p className="text-[1.05rem] leading-relaxed text-cream/85 italic">
                &ldquo;{TAKEAWAY_5_2.quote}&rdquo;
              </p>
              <div className="text-[0.86rem] font-bold text-haldi">
                — {TAKEAWAY_5_2.author}
              </div>
            </div>

            <div className="flex flex-col gap-3 shrink-0">
              <Link
                href="/5.1"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-cream/30 bg-white/10 px-6 py-3.5 font-display text-[0.95rem] font-bold text-cream hover:bg-white/20 transition-all"
              >
                Review Task A Strategy
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-orange px-6 py-3.5 font-display text-[0.95rem] font-bold text-white shadow-[2px_2px_0_0_#ffffff] hover:brightness-110 transition-all"
              >
                Back to Curriculum Hub <ArrowRight className="size-5" />
              </Link>
            </div>
          </div>
        </div>
      </Panel>
    </section>
  );
}
