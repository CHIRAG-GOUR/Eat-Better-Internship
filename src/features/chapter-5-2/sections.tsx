"use client";

import { useState } from "react";
import {
  ArrowRight,
  Award,
  Camera,
  CheckCircle2,
  ChevronRight,
  ClipboardCopy,
  FileCheck,
  Mic,
  Sparkles,
  Video,
  Volume2,
} from "lucide-react";
import { Panel } from "@/components/chapter/Panel";
import { SectionIntro } from "@/components/chapter/SectionIntro";
import { GlossaryText } from "@/components/chapter/Glossary";
import { ToolIcon } from "@/components/ui/ToolIcon";
import {
  FOUR_BEATS,
  PITCH_FORMATS,
  PRODUCTION_TIPS,
  RECOMMENDED_TOOLS_TASK_B,
  TAKEAWAY_5_2,
  VIDEO_SUBMISSION_CHECKLIST,
} from "./content";

const sectionCls = "relative scroll-mt-6 px-3 py-6 sm:px-6 sm:py-10";

/* ── 1. Task B Overview ────────────────────────────────────────── */

export function TaskBOverview() {
  const [activeFormatId, setActiveFormatId] = useState<string>("founder-pitch");

  return (
    <section id="task-b-overview" className={sectionCls}>
      <Panel tone="light" reveal="up" width="max-w-7xl">
        <SectionIntro
          index="1"
          kicker="Final Capstone Project · Task B"
          title="Video Pitch / Product Review (60–90s)"
        />

        <div className="mt-5 grid gap-6 lg:grid-cols-12">
          <div className="lg:col-span-7 flex flex-col justify-between rounded-[24px] border border-cocoa bg-cream p-6 shadow-[3px_3px_0_0_#2f1c1a]">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-orange/30 bg-orange/10 px-3 py-1 text-[0.82rem] font-extrabold uppercase tracking-wider text-orange">
                <Video className="size-4" /> Capstone Deliverable B Brief
              </div>
              <h3 className="mt-3 font-display text-[clamp(1.5rem,3vw,2.1rem)] font-bold leading-tight text-cocoa">
                Present What You Learned About Eat Better
              </h3>
              <p className="mt-3 text-[1.05rem] leading-relaxed text-cocoa">
                Create a short, persuasive <strong>60 to 90-second video pitch or product review</strong> that positively showcases your learnings and strategic thinking about Eat Better Co.
              </p>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-cocoa-2">
                You will record this video using your smartphone or desktop recording tools (such as Loom, CapCut, or OBS) and submit your cloud video link directly into the SkilliZee LMS portal.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 pt-4 border-t border-cocoa/15">
              <div className="rounded-xl bg-white p-3 border border-cocoa/10">
                <div className="text-[0.76rem] font-bold text-orange uppercase">Duration</div>
                <div className="font-display font-bold text-[1.1rem] text-cocoa">60 – 90 Seconds</div>
                <div className="text-[0.75rem] text-cocoa-2">Concise executive limit</div>
              </div>
              <div className="rounded-xl bg-white p-3 border border-cocoa/10">
                <div className="text-[0.76rem] font-bold text-orange uppercase">Speaking Pace</div>
                <div className="font-display font-bold text-[1.1rem] text-cocoa">130–150 WPM</div>
                <div className="text-[0.75rem] text-cocoa-2">~140–190 spoken words</div>
              </div>
              <div className="rounded-xl bg-white p-3 border border-cocoa/10">
                <div className="text-[0.76rem] font-bold text-orange uppercase">Submission</div>
                <div className="font-display font-bold text-[1.1rem] text-cocoa">Cloud Link</div>
                <div className="text-[0.75rem] text-cocoa-2">Loom, YouTube, Drive</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col justify-between rounded-[24px] border border-cocoa bg-cocoa p-6 text-cream shadow-[3px_3px_0_0_#2f1c1a]">
            <div>
              <div className="text-[0.82rem] font-bold uppercase tracking-wider text-haldi">
                Choose 1 of 3 Presentation Angles
              </div>
              <h4 className="mt-2 font-display text-[1.35rem] font-semibold text-cream">
                Select Your Video Angle
              </h4>
              <p className="mt-2 text-[0.88rem] text-cream/80">
                Pick the pitch format that best highlights your strengths:
              </p>

              <div className="mt-4 space-y-2.5">
                {PITCH_FORMATS.map((f) => {
                  const isCurrent = f.id === activeFormatId;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setActiveFormatId(f.id)}
                      className={`w-full text-left rounded-xl p-3 transition-all ${
                        isCurrent
                          ? "bg-orange text-white shadow-[2px_2px_0_0_#ffffff]"
                          : "bg-white/10 text-cream/90 hover:bg-white/15"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-[0.94rem]">{f.title}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[0.72rem] font-extrabold ${
                            isCurrent ? "bg-white text-orange" : "bg-white/20 text-cream"
                          }`}
                        >
                          {f.badge}
                        </span>
                      </div>
                      <p className="mt-1 line-clamp-2 text-[0.8rem] opacity-85">
                        {f.description}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-white/10 text-center">
              <a
                href="#four-beats"
                className="inline-flex items-center gap-2 rounded-xl bg-orange px-5 py-2.5 text-[0.92rem] font-bold text-white shadow hover:bg-orange/90"
              >
                Learn the 4-Beat Formula Below <ChevronRight className="size-4" />
              </a>
            </div>
          </div>
        </div>
      </Panel>
    </section>
  );
}

/* ── 2. The 4-Beat Formula ─────────────────────────────────────── */

export function FourBeatFormula() {
  return (
    <section id="four-beats" className={sectionCls}>
      <Panel tone="light" reveal="up" width="max-w-7xl">
        <SectionIntro
          index="2"
          kicker="Storytelling Mechanics"
          title="The 4-Beat 90-Second Formula"
        >
          High-retention video pitches follow a proven psychological progression: hook attention instantly, reveal the clean-label truth, prove your concept with numbers, and close with high energy.
        </SectionIntro>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {FOUR_BEATS.map((b) => (
            <div
              key={b.beat}
              className="flex flex-col justify-between rounded-[22px] border border-cocoa bg-white p-5 shadow-[3px_3px_0_0_#2f1c1a]"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="grid size-8 place-items-center rounded-xl bg-orange text-[0.85rem] font-bold text-white">
                    {b.beat}
                  </span>
                  <span className="rounded-lg bg-peach px-2.5 py-1 text-[0.75rem] font-bold text-cocoa">
                    {b.timing}
                  </span>
                </div>

                <h4 className="mt-3 font-display text-[1.18rem] font-bold text-cocoa">
                  {b.name}
                </h4>
                <div className="mt-1 text-[0.78rem] font-bold text-orange">
                  {b.wordCount}
                </div>
                <p className="mt-3 text-[0.9rem] leading-relaxed text-cocoa-2">
                  {b.goal}
                </p>
              </div>

              <div className="mt-4 rounded-xl border border-cocoa/10 bg-cream/70 p-3 text-[0.8rem] font-semibold text-cocoa">
                <span className="text-orange font-bold mr-1">Pro Tip:</span>
                {b.tip}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </section>
  );
}

/* ── 3. Script Templates & Inspiration ─────────────────────────── */

export function ScriptTemplates() {
  const [selectedFormatId, setSelectedFormatId] = useState<string>("founder-pitch");
  const [copied, setCopied] = useState(false);

  const activeFormat = PITCH_FORMATS.find((f) => f.id === selectedFormatId) || PITCH_FORMATS[0];

  const fullScript = [
    `[Beat 1 - Hook]: "${activeFormat.sampleScript.hook}"`,
    `[Beat 2 - Insight]: "${activeFormat.sampleScript.insight}"`,
    `[Beat 3 - Solution]: "${activeFormat.sampleScript.solution}"`,
    `[Beat 4 - CTA]: "${activeFormat.sampleScript.cta}"`,
  ].join("\n\n");

  const totalWords = [
    activeFormat.sampleScript.hook,
    activeFormat.sampleScript.insight,
    activeFormat.sampleScript.solution,
    activeFormat.sampleScript.cta,
  ]
    .join(" ")
    .split(/\s+/).length;

  const estimatedSeconds = Math.round((totalWords / 140) * 60);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(fullScript);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      //
    }
  };

  return (
    <section id="script-templates" className={sectionCls}>
      <Panel tone="light" reveal="up" width="max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <SectionIntro
              index="3"
              kicker="Script Blueprints"
              title="Sample Pitch Scripts & Talking Points"
            />
            <p className="mt-1 text-[1rem] text-cocoa-2">
              Review these sample 90-second scripts. You can copy the template into your teleprompter or notes app and adapt it with your own project numbers.
            </p>
          </div>

          <button
            onClick={handleCopy}
            className="inline-flex items-center gap-2 self-start rounded-xl border border-cocoa/20 bg-white px-4 py-2 text-[0.88rem] font-bold text-cocoa hover:border-cocoa transition-all"
          >
            <ClipboardCopy className="size-4" />
            {copied ? "Copied Script!" : "Copy Script Template"}
          </button>
        </div>

        {/* Format Selector Tabs */}
        <div className="mt-6 flex flex-wrap gap-2">
          {PITCH_FORMATS.map((f) => (
            <button
              key={f.id}
              onClick={() => setSelectedFormatId(f.id)}
              className={`rounded-xl px-4 py-2 text-[0.88rem] font-bold transition-all ${
                f.id === selectedFormatId
                  ? "bg-cocoa text-cream shadow-[2px_2px_0_0_#ff5c00]"
                  : "bg-white text-cocoa border border-cocoa/15 hover:bg-peach/40"
              }`}
            >
              {f.title}
            </button>
          ))}
        </div>

        {/* Script Display Card */}
        <div className="mt-4 rounded-[24px] border border-cocoa bg-white p-6 shadow-[3px_3px_0_0_#2f1c1a]">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-cocoa/15">
            <div>
              <span className="text-[0.78rem] font-bold uppercase tracking-wider text-orange">
                {activeFormat.badge} · Target Audience: {activeFormat.targetAudience}
              </span>
              <h4 className="font-display text-[1.3rem] font-bold text-cocoa">
                {activeFormat.title}
              </h4>
            </div>

            <div className="flex items-center gap-3">
              <span className="rounded-full bg-peach px-3 py-1 text-[0.82rem] font-bold text-cocoa">
                ⏱ ~{estimatedSeconds}s speaking time
              </span>
              <span className="rounded-full bg-cream px-3 py-1 text-[0.82rem] font-bold text-cocoa-2 border border-cocoa/10">
                📝 {totalWords} words
              </span>
            </div>
          </div>

          <div className="mt-5 grid gap-4 lg:grid-cols-2">
            <div className="rounded-2xl border border-cocoa/15 bg-cream/50 p-4">
              <div className="text-[0.78rem] font-bold uppercase tracking-wider text-orange">
                Beat 1 · Hook (0–15s)
              </div>
              <p className="mt-2 text-[0.94rem] font-medium leading-relaxed text-cocoa italic">
                &ldquo;{activeFormat.sampleScript.hook}&rdquo;
              </p>
            </div>

            <div className="rounded-2xl border border-cocoa/15 bg-cream/50 p-4">
              <div className="text-[0.78rem] font-bold uppercase tracking-wider text-orange">
                Beat 2 · The Insight (15–35s)
              </div>
              <p className="mt-2 text-[0.94rem] font-medium leading-relaxed text-cocoa italic">
                &ldquo;{activeFormat.sampleScript.insight}&rdquo;
              </p>
            </div>

            <div className="rounded-2xl border border-cocoa/15 bg-cream/50 p-4">
              <div className="text-[0.78rem] font-bold uppercase tracking-wider text-orange">
                Beat 3 · The Solution / Pitch (35–65s)
              </div>
              <p className="mt-2 text-[0.94rem] font-medium leading-relaxed text-cocoa italic">
                &ldquo;{activeFormat.sampleScript.solution}&rdquo;
              </p>
            </div>

            <div className="rounded-2xl border border-cocoa/15 bg-cream/50 p-4">
              <div className="text-[0.78rem] font-bold uppercase tracking-wider text-orange">
                Beat 4 · Call to Action (65–90s)
              </div>
              <p className="mt-2 text-[0.94rem] font-medium leading-relaxed text-cocoa italic">
                &ldquo;{activeFormat.sampleScript.cta}&rdquo;
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl bg-peach/50 p-3.5 border border-cocoa/10 flex items-center gap-3">
            <Sparkles className="size-5 shrink-0 text-orange" />
            <div className="text-[0.84rem] text-cocoa">
              <strong>Suggested Props:</strong> {activeFormat.suggestedProps.join(" · ")}
            </div>
          </div>
        </div>
      </Panel>
    </section>
  );
}

/* ── 4. Production Masterclass Guide ───────────────────────────── */

export function ProductionGuide() {
  return (
    <section id="production-guide" className={sectionCls}>
      <Panel tone="light" reveal="up" width="max-w-7xl">
        <SectionIntro
          index="4"
          kicker="Camera & Filming Masterclass"
          title="Studio Production Checklist"
        >
          You do not need expensive cinema equipment. A smartphone camera in a quiet, well-lit room is completely sufficient to record an executive-ready video pitch.
        </SectionIntro>

        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {PRODUCTION_TIPS.map((tip, i) => (
            <div
              key={tip.title}
              className="flex flex-col justify-between rounded-[22px] border border-cocoa bg-white p-5 shadow-[2px_2px_0_0_#2f1c1a]"
            >
              <div>
                <span className="grid size-10 place-items-center rounded-xl bg-orange text-white">
                  {i === 0 ? (
                    <Mic className="size-5" />
                  ) : i === 1 ? (
                    <Camera className="size-5" />
                  ) : i === 2 ? (
                    <Award className="size-5" />
                  ) : (
                    <Volume2 className="size-5" />
                  )}
                </span>
                <h4 className="mt-3 font-display text-[1.12rem] font-bold text-cocoa">
                  {tip.title}
                </h4>
                <p className="mt-2 text-[0.88rem] leading-relaxed text-cocoa-2">
                  {tip.desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </section>
  );
}

/* ── 5. Recommended Tools & Submission Guide ───────────────────── */

export function RecommendedVideoTools() {
  return (
    <section id="recommended-tools" className={sectionCls}>
      <Panel tone="light" reveal="up" width="max-w-7xl">
        <SectionIntro
          index="5"
          kicker="External Recording & Hosting Toolkit"
          title="Recommended Tools to Complete Task B"
        >
          Use any of the recommended tools below to record your pitch, teleprompt your script, and generate your shareable cloud video link.
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

        {/* Video Submission Checklist & Instructions */}
        <div className="mt-6 rounded-[24px] border border-cocoa bg-cocoa p-6 text-cream shadow-[3px_3px_0_0_#2f1c1a]">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-orange text-white">
              <FileCheck className="size-6" />
            </span>
            <div className="space-y-3">
              <div>
                <div className="text-[0.8rem] font-bold uppercase tracking-wider text-haldi">
                  Self-Evaluation Checklist Before Submitting
                </div>
                <h4 className="font-display text-[1.25rem] font-bold text-cream">
                  How to Submit Your Task B Video
                </h4>
              </div>

              <div className="grid gap-2 sm:grid-cols-2 pt-1">
                {VIDEO_SUBMISSION_CHECKLIST.map((item, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-[0.88rem] text-cream/90">
                    <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-haldi" />
                    <span>{item}</span>
                  </div>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-cream/20 text-[0.88rem] text-cream/80">
                📌 <strong>Submission Step:</strong> Copy your cloud video link (Loom, YouTube Unlisted, or Google Drive) and paste it into the Capstone Task B submission field in the SkilliZee LMS portal.
              </div>
            </div>
          </div>
        </div>
      </Panel>
    </section>
  );
}

/* ── 6. Wrap Up & Internship Completion ────────────────────────── */

export function WrapUp() {
  return (
    <section id="wrap-up" className={sectionCls}>
      <Panel tone="light" reveal="up" width="max-w-7xl">
        <div className="text-[0.85rem] font-extrabold uppercase tracking-[0.16em] text-orange">
          Chapter 5.2 · Wrap-Up & Graduation
        </div>
        <h2 className="mt-3 font-display text-[clamp(2.1rem,4.5vw,3.2rem)] font-semibold leading-[1.04] text-cocoa">
          Congratulations! Capstone Guidelines Complete
        </h2>

        <div className="mt-6 rounded-[24px] border border-cocoa bg-cocoa p-6 text-cream shadow-[3px_3px_0_0_#2f1c1a]">
          <div className="flex items-start gap-4">
            <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-orange text-white">
              <Sparkles className="size-6" />
            </span>
            <div>
              <div className="text-[0.8rem] font-bold uppercase tracking-wider text-haldi">
                Final Internship Takeaway
              </div>
              <p className="mt-1 font-display text-[1.2rem] leading-snug text-cream">
                <GlossaryText>{TAKEAWAY_5_2}</GlossaryText>
              </p>
            </div>
          </div>
        </div>

        {/* Milestone Badge Ribbon */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5 text-center">
          <div className="rounded-2xl border border-cocoa/15 bg-white p-3 shadow-sm">
            <div className="text-[0.72rem] font-bold uppercase tracking-wider text-orange">Module 1</div>
            <div className="font-display font-bold text-[0.95rem] text-cocoa">Brand Story & Mission</div>
            <CheckCircle2 className="mx-auto mt-2 size-5 text-success" />
          </div>
          <div className="rounded-2xl border border-cocoa/15 bg-white p-3 shadow-sm">
            <div className="text-[0.72rem] font-bold uppercase tracking-wider text-orange">Module 2</div>
            <div className="font-display font-bold text-[0.95rem] text-cocoa">Products & Packaging</div>
            <CheckCircle2 className="mx-auto mt-2 size-5 text-success" />
          </div>
          <div className="rounded-2xl border border-cocoa/15 bg-white p-3 shadow-sm">
            <div className="text-[0.72rem] font-bold uppercase tracking-wider text-orange">Module 3</div>
            <div className="font-display font-bold text-[0.95rem] text-cocoa">Business Model Canvas</div>
            <CheckCircle2 className="mx-auto mt-2 size-5 text-success" />
          </div>
          <div className="rounded-2xl border border-cocoa/15 bg-white p-3 shadow-sm">
            <div className="text-[0.72rem] font-bold uppercase tracking-wider text-orange">Module 4</div>
            <div className="font-display font-bold text-[0.95rem] text-cocoa">Pricing & Growth</div>
            <CheckCircle2 className="mx-auto mt-2 size-5 text-success" />
          </div>
          <div className="col-span-2 sm:col-span-1 rounded-2xl border border-orange bg-orange/10 p-3 shadow-sm">
            <div className="text-[0.72rem] font-bold uppercase tracking-wider text-orange">Module 5</div>
            <div className="font-display font-bold text-[0.95rem] text-cocoa">Final Capstone</div>
            <Award className="mx-auto mt-2 size-5 text-orange" />
          </div>
        </div>

        {/* Certificate Submission Callout */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-[24px] border border-cocoa bg-peach/70 p-6">
          <div>
            <div className="text-[0.8rem] font-bold uppercase tracking-wider text-orange">
              Certificate Eligibility
            </div>
            <h3 className="font-display text-[1.35rem] font-bold text-cocoa">
              Submit Task A & Task B in LMS
            </h3>
            <p className="mt-1 text-[0.92rem] text-cocoa-2">
              Upload your Task A Strategy Deck/Doc and Task B Video Link into the SkilliZee LMS portal to claim your official verified Eat Better Co Internship Certificate.
            </p>
          </div>
          <a
            href="/1.1"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-cocoa px-6 py-3 font-bold text-cream shadow-[2px_2px_0_0_#ff5c00] hover:bg-cocoa/90 transition-transform active:scale-95"
          >
            Review Full Curriculum <ArrowRight className="size-5" />
          </a>
        </div>
      </Panel>
    </section>
  );
}
