"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  FileCheck,
  Layers,
} from "lucide-react";
import { Panel } from "@/components/chapter/Panel";
import { SectionIntro } from "@/components/chapter/SectionIntro";
import { ToolIcon } from "@/components/ui/ToolIcon";
import {
  CAPSTONE_RUBRIC,
  CAPSTONE_TRACKS,
  GTM_BLUEPRINT_PILLARS,
  RECOMMENDED_TOOLS_TASK_A,
} from "./content";

const sectionCls = "relative scroll-mt-4 px-3 py-4 sm:px-6 sm:py-6";

/* ── 1. Capstone Brief & Track Selector ────────────────────────── */

export function TaskABriefAndTracks() {
  const [selectedId, setSelectedId] = useState<string>("product-expansion");
  const activeTrack = CAPSTONE_TRACKS.find((t) => t.id === selectedId) || CAPSTONE_TRACKS[0];

  return (
    <section id="task-a-tracks" className={sectionCls}>
      <Panel tone="light" reveal="up" width="max-w-7xl">
        <SectionIntro
          index="1"
          kicker="Final Capstone · Task A"
          title="360° Go-To-Market Strategy & Project Tracks"
        >
          Select one of the 5 commercial tracks below to build your proposal using external tools, then submit your deck to the LMS portal.
        </SectionIntro>

        {/* Executive Benchmark Pills */}
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
          <div className="rounded-xl border border-cocoa/15 bg-cream/70 p-2.5 text-center">
            <span className="text-[0.72rem] font-bold text-orange uppercase">Formulation</span>
            <div className="font-display text-[1rem] font-bold text-cocoa">100% Clean Food</div>
            <span className="text-[0.72rem] text-cocoa-2">Zero refined sugar</span>
          </div>
          <div className="rounded-xl border border-cocoa/15 bg-cream/70 p-2.5 text-center">
            <span className="text-[0.72rem] font-bold text-orange uppercase">Pricing Benchmark</span>
            <div className="font-display text-[1rem] font-bold text-cocoa">₹1.13–1.55/g</div>
            <span className="text-[0.72rem] text-cocoa-2">Sweet & savory MRP</span>
          </div>
          <div className="rounded-xl border border-cocoa/15 bg-cream/70 p-2.5 text-center">
            <span className="text-[0.72rem] font-bold text-orange uppercase">Margin Target</span>
            <div className="font-display text-[1rem] font-bold text-cocoa">&ge; 55% Margin</div>
            <span className="text-[0.72rem] text-cocoa-2">Absorbs 25% Q-Comm</span>
          </div>
          <div className="rounded-xl border border-cocoa/15 bg-cream/70 p-2.5 text-center">
            <span className="text-[0.72rem] font-bold text-orange uppercase">Format</span>
            <div className="font-display text-[1rem] font-bold text-cocoa">10–15 Slides</div>
            <span className="text-[0.72rem] text-cocoa-2">Deck / Strategy Doc</span>
          </div>
        </div>

        {/* Track Pills */}
        <div className="mt-5">
          <div className="flex items-center justify-between">
            <span className="text-[0.82rem] font-bold uppercase tracking-wider text-cocoa">
              Choose Your Specialization (1 of 5):
            </span>
            <span className="text-[0.78rem] font-bold text-orange">Click to inspect</span>
          </div>

          <div className="mt-2.5 flex flex-wrap gap-2">
            {CAPSTONE_TRACKS.map((t) => {
              const isSelected = t.id === selectedId;
              return (
                <button
                  key={t.id}
                  onClick={() => setSelectedId(t.id)}
                  className={`flex items-center gap-2 rounded-xl border px-3.5 py-2 text-left text-[0.86rem] font-bold transition-all ${
                    isSelected
                      ? "border-orange bg-orange text-white shadow-[2px_2px_0_0_#2f1c1a] scale-[1.01]"
                      : "border-cocoa/20 bg-white text-cocoa hover:border-cocoa/50 hover:bg-peach/20"
                  }`}
                >
                  <span>{t.name}</span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-[0.7rem] font-extrabold ${
                      isSelected ? "bg-white/20 text-white" : "bg-orange/10 text-orange"
                    }`}
                  >
                    {t.badge}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Track Detail Card */}
        <div className="mt-4 rounded-[22px] border border-cocoa bg-white p-5 shadow-[3px_3px_0_0_#2f1c1a]">
          <div className="grid gap-5 lg:grid-cols-12 items-center">
            {/* Visual Media & Benchmark */}
            <div className="lg:col-span-5 space-y-3">
              <div className="relative aspect-[16/9] w-full overflow-hidden rounded-xl border border-cocoa/15 bg-peach/40">
                <Image
                  src={activeTrack.heroImg}
                  alt={activeTrack.name}
                  fill
                  className="object-cover"
                  sizes="(max-width: 1024px) 100vw, 40vw"
                  priority
                />
                <div className="absolute top-2.5 left-2.5 rounded-md bg-cocoa/85 px-2.5 py-0.5 text-[0.72rem] font-bold uppercase tracking-wider text-haldi backdrop-blur-xs">
                  {activeTrack.badge}
                </div>
              </div>

              <div className="rounded-xl border border-cocoa/10 bg-peach/40 p-3">
                <div className="flex items-center justify-between text-[0.75rem] font-bold uppercase tracking-wider text-orange">
                  <span>Benchmark Reference</span>
                  <span className="text-cocoa">{activeTrack.exampleInitiative.expectedOutcome}</span>
                </div>
                <div className="mt-1 font-display font-bold text-[0.94rem] text-cocoa">
                  {activeTrack.exampleInitiative.title}
                </div>
                <p className="mt-0.5 text-[0.8rem] text-cocoa-2">
                  {activeTrack.exampleInitiative.description}
                </p>
              </div>
            </div>

            {/* Scope & Deliverables */}
            <div className="lg:col-span-7 space-y-3.5">
              <div>
                <h3 className="font-display text-[1.28rem] font-bold text-cocoa">
                  {activeTrack.name}
                </h3>
                <p className="mt-0.5 text-[0.86rem] font-medium text-orange">
                  {activeTrack.tagline}
                </p>
                <p className="mt-1.5 text-[0.86rem] leading-relaxed text-cocoa-2">
                  {activeTrack.overview}
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl border border-cocoa/10 bg-cream/60 p-3">
                  <div className="flex items-center gap-1.5 text-[0.82rem] font-bold text-cocoa uppercase tracking-wide">
                    <Layers className="size-3.5 text-orange" /> Key Scope Items
                  </div>
                  <ul className="mt-2 space-y-1">
                    {activeTrack.scopeItems.map((s, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-[0.8rem] text-cocoa">
                        <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-orange" />
                        <span>{s}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-xl border border-cocoa/10 bg-cream/60 p-3">
                  <div className="flex items-center gap-1.5 text-[0.82rem] font-bold text-cocoa uppercase tracking-wide">
                    <FileCheck className="size-3.5 text-orange" /> Key Deliverables
                  </div>
                  <ul className="mt-2 space-y-1">
                    {activeTrack.deliverables.map((d, idx) => (
                      <li key={idx} className="flex items-start gap-1.5 text-[0.8rem] text-cocoa">
                        <CheckCircle2 className="mt-0.5 size-3.5 shrink-0 text-orange" />
                        <span>{d}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Panel>
    </section>
  );
}

/* ── 2. 6-Pillar Blueprint ─────────────────────────────────────── */

export function GTMFramework() {
  const [activeStep, setActiveStep] = useState<number>(0);
  const pillar = GTM_BLUEPRINT_PILLARS[activeStep];

  return (
    <section id="gtm-blueprint" className={sectionCls}>
      <Panel tone="light" reveal="up" width="max-w-7xl">
        <SectionIntro
          index="2"
          kicker="Proposal Architecture"
          title="The 6 Pillars of Your Strategic Proposal"
        >
          Ensure your slide deck or document addresses each of these commercial pillars.
        </SectionIntro>

        {/* Stepper Tabs */}
        <div className="mt-4 grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-6">
          {GTM_BLUEPRINT_PILLARS.map((p, i) => (
            <button
              key={p.number}
              onClick={() => setActiveStep(i)}
              className={`rounded-xl border p-2.5 text-left transition-all ${
                i === activeStep
                  ? "border-cocoa bg-cocoa text-cream shadow-[2px_2px_0_0_#ff5c00]"
                  : "border-cocoa/15 bg-white text-cocoa hover:border-cocoa/40 hover:bg-peach/20"
              }`}
            >
              <span className={`text-[0.72rem] font-bold ${i === activeStep ? "text-orange" : "text-cocoa/60"}`}>
                Pillar {p.number}
              </span>
              <div className="mt-0.5 font-display text-[0.86rem] font-bold leading-tight">
                {p.title}
              </div>
            </button>
          ))}
        </div>

        {/* Active Pillar Card */}
        <div className="mt-3.5 rounded-[20px] border border-cocoa bg-white p-5 shadow-[2px_2px_0_0_#2f1c1a]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pb-3 border-b border-cocoa/10">
            <div>
              <span className="text-[0.75rem] font-bold uppercase tracking-wider text-orange">
                Pillar {pillar.number} · Strategic Scope
              </span>
              <h3 className="font-display text-[1.2rem] font-bold text-cocoa">
                {pillar.title}
              </h3>
            </div>
            <span className="self-start text-[0.84rem] font-medium text-cocoa-2">
              {pillar.subtitle}
            </span>
          </div>

          <div className="mt-3.5 grid gap-2.5 sm:grid-cols-2">
            {pillar.points.map((pt, idx) => (
              <div
                key={idx}
                className="flex items-start gap-2.5 rounded-xl border border-cocoa/10 bg-cream/50 p-3 text-[0.86rem] text-cocoa"
              >
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-orange text-[0.7rem] font-bold text-white">
                  {idx + 1}
                </span>
                <span>{pt}</span>
              </div>
            ))}
          </div>
        </div>
      </Panel>
    </section>
  );
}

/* ── 3. Recommended Tools & Submission ─────────────────────────── */

export function RecommendedToolsAndRubric() {
  return (
    <section id="tools-and-rubric" className={sectionCls}>
      <Panel tone="light" reveal="up" width="max-w-7xl">
        <SectionIntro
          index="3"
          kicker="Execution & Grading"
          title="Recommended Tools & Evaluation Rubric"
        >
          Build your project externally in your tool of choice, export as PDF or shareable link, and submit to the portal.
        </SectionIntro>

        {/* Compact Tools Grid */}
        <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {RECOMMENDED_TOOLS_TASK_A.map((cat) => (
            <div
              key={cat.category}
              className="min-w-0 rounded-2xl border border-cocoa bg-cream p-4 shadow-sm flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-cocoa/10">
                  <h4 className="font-display text-[0.98rem] font-bold text-cocoa">
                    {cat.category}
                  </h4>
                  <span className="rounded-full bg-orange/15 px-2 py-0.5 text-[0.72rem] font-bold text-orange">
                    {cat.badge}
                  </span>
                </div>
                <div className="mt-2.5 space-y-2">
                  {cat.tools.map((t) => (
                    <div
                      key={t.name}
                      className="flex items-center gap-2.5 rounded-xl border border-cocoa/10 bg-white p-2.5 shadow-xs"
                    >
                      <ToolIcon id={t.id} className="size-6 shrink-0 rounded-lg" />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="min-w-0 truncate font-display text-[0.88rem] font-bold text-cocoa">
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

        {/* Compact Rubric Row */}
        <div className="mt-4 rounded-[20px] border border-cocoa bg-white p-4 shadow-sm">
          <div className="flex items-center justify-between pb-2 border-b border-cocoa/10">
            <h4 className="font-display text-[1rem] font-bold text-cocoa">
              Evaluation Rubric (100 Points Total)
            </h4>
            <span className="text-[0.78rem] font-bold text-orange">4 Pillars · 25% Each</span>
          </div>

          <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-4">
            {CAPSTONE_RUBRIC.map((r) => (
              <div key={r.title} className="rounded-xl border border-cocoa/10 bg-cream/40 p-2.5">
                <div className="flex items-center justify-between">
                  <span className="font-display text-[0.88rem] font-bold text-cocoa">
                    {r.weight}
                  </span>
                  <Award className="size-3.5 text-orange" />
                </div>
                <div className="mt-1 font-display text-[0.84rem] font-bold text-cocoa leading-tight">
                  {r.title}
                </div>
                <p className="mt-1 text-[0.8rem] leading-snug text-cocoa-2">
                  {r.criteria}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Next Step Link to Task B */}
        <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-[20px] border border-cocoa bg-peach/70 p-4">
          <div>
            <span className="text-[0.72rem] font-bold uppercase tracking-wider text-orange">
              Next Step: Final Capstone Task B
            </span>
            <h4 className="font-display text-[1.15rem] font-bold text-cocoa">
              Chapter 5.2 — E-Commerce Storefront Development
            </h4>
            <p className="text-[0.82rem] text-cocoa-2">
              Take your Task A proposal and build a branded D2C shopping experience.
            </p>
          </div>
          <Link
            href="/5.2"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-cocoa px-5 py-2.5 text-[0.9rem] font-bold text-cream shadow-[2px_2px_0_0_#ff5c00] hover:bg-cocoa/90 transition-transform active:scale-95"
          >
            Go to Task B <ArrowRight className="size-4" />
          </Link>
        </div>
      </Panel>
    </section>
  );
}
