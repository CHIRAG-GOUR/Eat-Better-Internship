"use client";

import Image from "next/image";
import { useState } from "react";
import {
  ArrowRight,
  Award,
  CheckCircle2,
  ChevronRight,
  FileCheck,
  Layers,
  Sparkles,
} from "lucide-react";
import { Panel } from "@/components/chapter/Panel";
import { SectionIntro } from "@/components/chapter/SectionIntro";
import { GlossaryText } from "@/components/chapter/Glossary";
import { ToolIcon } from "@/components/ui/ToolIcon";
import {
  CAPSTONE_TRACKS,
  EVALUATION_RUBRIC,
  GTM_BLUEPRINT_PILLARS,
  RECOMMENDED_TOOLS_TASK_A,
  TAKEAWAY,
} from "./content";

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
                <Sparkles className="size-4" /> Capstone Brief & Guidelines
              </div>
              <h3 className="mt-3 font-display text-[clamp(1.5rem,3vw,2.1rem)] font-bold leading-tight text-cocoa">
                Develop a 360-Degree Go-To-Market Strategy
              </h3>
              <p className="mt-3 text-[1.05rem] leading-relaxed text-cocoa">
                As the culmination of your Eat Better Co internship, create an executive-level strategic proposal for a new product, category expansion, festive hamper, or marketing initiative.
              </p>
              <p className="mt-3 text-[0.98rem] leading-relaxed text-cocoa-2">
                You will complete this project using professional external tools (such as Google Slides, Canva, Notion, or Excel) and submit your final presentation or document into the SkilliZee LMS portal.
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
                <div className="text-[0.76rem] font-bold text-orange uppercase">Format</div>
                <div className="font-display font-bold text-[1.1rem] text-cocoa">Deck / Doc</div>
                <div className="text-[0.75rem] text-cocoa-2">PDF or live link</div>
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
                Choose 1 of 5 Project Tracks
              </h4>
              <p className="mt-2 text-[0.92rem] text-cream/80 leading-relaxed">
                Select the project specialization that matches your interests in brand marketing, product development, festive commerce, consumer research, or content:
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
                Explore Track Details Below <ArrowRight className="size-4" />
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
  const activeTrack = CAPSTONE_TRACKS.find((t) => t.id === selectedId) || CAPSTONE_TRACKS[0];

  return (
    <section id="track-selector" className={sectionCls}>
      <Panel tone="light" reveal="up" width="max-w-7xl">
        <SectionIntro
          index="2"
          kicker="Select Your Capstone Track"
          title="Explore the 5 Project Specializations"
        >
          Each track represents an authentic commercial function at Eat Better Co. Explore the scope, deliverables, and benchmark case studies below, then select one to base your final Capstone Project on.
        </SectionIntro>

        {/* Track Pills */}
        <div className="mt-6 flex flex-wrap gap-2 sm:gap-3">
          {CAPSTONE_TRACKS.map((t) => {
            const isSelected = t.id === selectedId;
            return (
              <button
                key={t.id}
                onClick={() => setSelectedId(t.id)}
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
                  Benchmark Reference
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
                    <Layers className="size-4 text-orange" /> Required Project Scope
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
                    <FileCheck className="size-4 text-success" /> Key Deliverables in Your Deck
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
                    Ready to build your deck or document?
                  </div>
                  <div className="text-[0.95rem] text-cream/90">
                    Review the 6-pillar framework and recommended tools below.
                  </div>
                </div>
                <a
                  href="#gtm-framework"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-orange px-5 py-2.5 text-[0.95rem] font-bold text-white shadow hover:bg-orange/90 transition-transform active:scale-95"
                >
                  View 6-Pillar Blueprint <ChevronRight className="size-4" />
                </a>
              </div>
            </div>
          </div>
        </div>
      </Panel>
    </section>
  );
}

/* ── 3. 6-Pillar GTM Strategy Blueprint ────────────────────────── */

export function GTMFramework() {
  return (
    <section id="gtm-framework" className={sectionCls}>
      <Panel tone="light" reveal="up" width="max-w-7xl">
        <SectionIntro
          index="3"
          kicker="Capstone Strategy Architecture"
          title="The 6-Pillar Strategy Blueprint"
        >
          Structure your presentation deck or strategy document around these 6 core commercial pillars. Each section addresses key questions that brand founders and investors evaluate.
        </SectionIntro>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {GTM_BLUEPRINT_PILLARS.map((p) => (
            <div
              key={p.number}
              className="flex flex-col justify-between rounded-[22px] border border-cocoa bg-white p-5 shadow-[3px_3px_0_0_#2f1c1a]"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="font-display text-[1.4rem] font-bold text-orange">
                    {p.number}
                  </span>
                  <span className="rounded-md bg-peach px-2 py-0.5 text-[0.75rem] font-extrabold uppercase text-cocoa">
                    Pillar
                  </span>
                </div>

                <h4 className="mt-2 font-display text-[1.2rem] font-bold text-cocoa">
                  {p.title}
                </h4>
                <p className="mt-1 text-[0.84rem] font-semibold text-cocoa-2">
                  {p.subtitle}
                </p>

                <ul className="mt-4 space-y-2 pt-3 border-t border-cocoa/10">
                  {p.points.map((pt, i) => (
                    <li key={i} className="flex items-start gap-2 text-[0.86rem] text-cocoa-2 leading-snug">
                      <span className="mt-1.5 size-1.5 shrink-0 rounded-full bg-orange" />
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </section>
  );
}

/* ── 4. Recommended Tools & Submission Guide ───────────────────── */

export function RecommendedTools() {
  return (
    <section id="recommended-tools" className={sectionCls}>
      <Panel tone="light" reveal="up" width="max-w-7xl">
        <SectionIntro
          index="4"
          kicker="External Execution Toolkit"
          title="Recommended Tools to Complete Task A"
        >
          You do not need to create your project inside this chapter. Use any of the industry-standard tools below to build your deck, financial model, or proposal document, then submit your file or link to the LMS portal.
        </SectionIntro>

        <div className="mt-6 space-y-6">
          {RECOMMENDED_TOOLS_TASK_A.map((cat) => (
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
                          <span className="shrink-0 rounded bg-haldi/40 px-2 py-0.5 text-[0.68rem] font-bold text-cocoa">
                            {t.badge}
                          </span>
                        )}
                      </div>
                      <p className="mt-2.5 text-[0.84rem] text-cocoa-2 leading-relaxed">
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

        {/* Submission Guidelines Box */}
        <div className="mt-6 rounded-[24px] border border-cocoa bg-cocoa p-6 text-cream shadow-[3px_3px_0_0_#2f1c1a]">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-orange text-white">
              <FileCheck className="size-6" />
            </span>
            <div className="space-y-2">
              <div className="text-[0.8rem] font-bold uppercase tracking-wider text-haldi">
                LMS Submission Checklist for Task A
              </div>
              <h4 className="font-display text-[1.25rem] font-bold text-cream">
                How to Submit Your Capstone Project
              </h4>
              <p className="text-[0.92rem] text-cream/80 leading-relaxed">
                Export your work from your chosen tool and upload it to the SkilliZee LMS portal using one of the following formats:
              </p>
              <ul className="grid gap-2 sm:grid-cols-3 pt-2">
                <li className="rounded-xl bg-white/10 p-3 text-[0.86rem] text-cream">
                  <strong>1. PDF Export:</strong> Download your slide deck or document as a high-res PDF (under 25MB) and upload directly.
                </li>
                <li className="rounded-xl bg-white/10 p-3 text-[0.86rem] text-cream">
                  <strong>2. Cloud Link:</strong> Share a view-only link to Google Slides, Notion, or Canva (ensure permission is set to &ldquo;Anyone with link can view&rdquo;).
                </li>
                <li className="rounded-xl bg-white/10 p-3 text-[0.86rem] text-cream">
                  <strong>3. Supporting Sheet:</strong> Attach your Google Sheets or Excel financial unit economics model alongside your presentation.
                </li>
              </ul>
            </div>
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
          Task A Brief Locked · Ready to Execute
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
              Learn the 60–90 second pitch structure, teleprompter tools, and studio filming guidelines.
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
