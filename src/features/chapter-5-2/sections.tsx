"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowRight,
  Award,
  Camera,
  CheckCircle2,
  ChevronRight,
  ClipboardCopy,
  Clock,
  Download,
  Mic,
  Pause,
  Play,
  RotateCcw,
  Sparkles,
  Tv,
  Video,
  Volume2,
  X,
} from "lucide-react";
import { Panel } from "@/components/chapter/Panel";
import { SectionIntro } from "@/components/chapter/SectionIntro";
import { GlossaryText } from "@/components/chapter/Glossary";
import {
  FOUR_BEATS,
  PITCH_FORMATS,
  PRODUCTION_TIPS,
  TAKEAWAY_5_2,
  VIDEO_SUBMISSION_CHECKLIST,
} from "./content";
import {
  computeScriptStats,
  generatePitchMarkdown,
  useScriptStore,
} from "./scriptStore";

const sectionCls = "relative scroll-mt-6 px-3 py-6 sm:px-6 sm:py-10";

/* ── 1. Task B Overview ────────────────────────────────────────── */

export function TaskBOverview() {
  const formatId = useScriptStore((s) => s.formatId);
  const setFormat = useScriptStore((s) => s.setFormat);

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
                <Video className="size-4" /> Capstone Deliverable B
              </div>
              <h3 className="mt-3 font-display text-[clamp(1.5rem,3vw,2.1rem)] font-bold leading-tight text-cocoa">
                Present What You Learned About Eat Better
              </h3>
              <p className="mt-3 text-[1.05rem] leading-relaxed text-cocoa">
                Create a short, punchy <strong>60 to 90-second video pitch or product review</strong> that positively presents what you learned about Eat Better Co.
              </p>
              <p className="mt-2 text-[0.95rem] leading-relaxed text-cocoa-2">
                Whether you pitch your Task A commercial GTM expansion to leadership or record an authentic clean-label product review, this video proves your ability to communicate complex business ideas with energy and clarity.
              </p>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 pt-4 border-t border-cocoa/15">
              <div className="rounded-xl bg-white p-3 border border-cocoa/10">
                <div className="text-[0.76rem] font-bold text-orange uppercase">Time Limit</div>
                <div className="font-display font-bold text-[1.1rem] text-cocoa">60 – 90 Seconds</div>
                <div className="text-[0.75rem] text-cocoa-2">Strict concise constraint</div>
              </div>
              <div className="rounded-xl bg-white p-3 border border-cocoa/10">
                <div className="text-[0.76rem] font-bold text-orange uppercase">Target Pace</div>
                <div className="font-display font-bold text-[1.1rem] text-cocoa">130–150 WPM</div>
                <div className="text-[0.75rem] text-cocoa-2">~140–190 spoken words</div>
              </div>
              <div className="rounded-xl bg-white p-3 border border-cocoa/10">
                <div className="text-[0.76rem] font-bold text-orange uppercase">Tone</div>
                <div className="font-display font-bold text-[1.1rem] text-cocoa">Positive & Confident</div>
                <div className="text-[0.75rem] text-cocoa-2">Fact-driven conviction</div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 flex flex-col justify-between rounded-[24px] border border-cocoa bg-cocoa p-6 text-cream shadow-[3px_3px_0_0_#2f1c1a]">
            <div>
              <div className="text-[0.82rem] font-bold uppercase tracking-wider text-haldi">
                Choose 1 of 3 Presentation Formats
              </div>
              <h4 className="mt-2 font-display text-[1.35rem] font-semibold text-cream">
                Select Your Video Angle
              </h4>
              <p className="mt-2 text-[0.88rem] text-cream/80">
                Click a format below to load tailored script prompts into the teleprompter studio:
              </p>

              <div className="mt-4 space-y-2.5">
                {PITCH_FORMATS.map((f) => {
                  const isCurrent = f.id === formatId;
                  return (
                    <button
                      key={f.id}
                      onClick={() => setFormat(f.id)}
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
                Learn the 4-Beat Story Arc <ChevronRight className="size-4" />
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

/* ── 3. Interactive Teleprompter Studio ────────────────────────── */

export function TeleprompterStudio() {
  const store = useScriptStore();
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState<number>(1);
  const [isPrompterModal, setIsPrompterModal] = useState(false);

  const stats = computeScriptStats(store);
  const prompterContentRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const loadSaved = store.loadSaved;

  useEffect(() => {
    loadSaved();
  }, [loadSaved]);

  // Teleprompter auto-scroll loop
  useEffect(() => {
    if (!isPlaying || !prompterContentRef.current) {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
      return;
    }

    const scrollContainer = prompterContentRef.current;
    let lastTime = performance.now();

    const step = (now: number) => {
      const dt = (now - lastTime) / 1000;
      lastTime = now;

      // speed in px per second
      const pxPerSec = speed * 45;
      scrollContainer.scrollTop += pxPerSec * dt;

      if (scrollContainer.scrollTop + scrollContainer.clientHeight >= scrollContainer.scrollHeight - 5) {
        setIsPlaying(false);
      } else {
        animationFrameRef.current = requestAnimationFrame(step);
      }
    };

    animationFrameRef.current = requestAnimationFrame(step);

    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, speed]);

  const handleRestartPrompter = () => {
    if (prompterContentRef.current) {
      prompterContentRef.current.scrollTop = 0;
    }
    setIsPlaying(false);
  };

  return (
    <section id="teleprompter-studio" className={sectionCls}>
      <Panel tone="light" reveal="up" width="max-w-7xl">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <SectionIntro
              index="3"
              kicker="Live Script & Teleprompter Studio"
              title="Write, Edit & Rehearse Your Pitch"
            />
            <p className="mt-1 text-[1rem] text-cocoa-2">
              Fine-tune each beat of your 60–90 second script. The pacing meter automatically calculates your speaking time at 140 WPM.
            </p>
          </div>

          <div className="flex items-center gap-2 self-start">
            <button
              onClick={store.resetScript}
              className="inline-flex items-center gap-1.5 rounded-xl border border-cocoa/20 bg-white px-3 py-1.5 text-[0.82rem] font-bold text-cocoa-2 hover:border-cocoa hover:text-cocoa"
            >
              <RotateCcw className="size-3.5" /> Reset Template
            </button>
            <button
              onClick={() => {
                setIsPrompterModal(true);
                setIsPlaying(false);
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-orange px-4 py-2 text-[0.88rem] font-bold text-white shadow hover:bg-orange/90 transition-transform active:scale-95"
            >
              <Tv className="size-4" /> Open Rehearsal Teleprompter
            </button>
          </div>
        </div>

        {/* Live Pacing Meter */}
        <div className="mt-6 rounded-2xl bg-cocoa p-4 text-cream">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-orange text-white">
                <Clock className="size-5" />
              </span>
              <div>
                <div className="text-[0.78rem] font-bold uppercase tracking-wider text-haldi">
                  Live Pacing Meter
                </div>
                <div className="font-display text-[1.25rem] font-bold text-white">
                  ~{stats.estimatedSeconds} Seconds{" "}
                  <span className="text-[0.88rem] font-normal text-cream/70">
                    ({stats.words} words at 140 WPM)
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span
                className={`rounded-full px-3 py-1 text-[0.82rem] font-bold ${
                  stats.status === "ideal"
                    ? "bg-success text-white"
                    : stats.status === "short"
                    ? "bg-haldi text-cocoa"
                    : "bg-error text-white"
                }`}
              >
                {stats.status === "ideal"
                  ? "✓ Sweet Spot (60–90s)"
                  : stats.status === "short"
                  ? "A bit short (<55s)"
                  : "Too long (>95s)"}
              </span>
            </div>
          </div>

          {/* Progress bar across 0 to 120s */}
          <div className="mt-3 relative h-3 w-full rounded-full bg-white/10 overflow-hidden">
            {/* 60 to 90s sweet spot zone */}
            <div className="absolute left-[50%] right-[25%] inset-y-0 bg-success/30" />
            <div
              className={`h-full transition-all duration-300 ${
                stats.status === "ideal" ? "bg-success" : stats.status === "short" ? "bg-haldi" : "bg-error"
              }`}
              style={{ width: `${Math.min(100, (stats.estimatedSeconds / 120) * 100)}%` }}
            />
          </div>
          <div className="mt-1 flex justify-between text-[0.72rem] text-cream/60">
            <span>0s</span>
            <span className="text-haldi font-bold">60s (Minimum)</span>
            <span className="text-haldi font-bold">90s (Maximum)</span>
            <span>120s</span>
          </div>
        </div>

        {/* 4 Beat Script Editors */}
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          {/* Beat 1 */}
          <div className="rounded-[22px] border border-cocoa bg-white p-5 shadow-[2px_2px_0_0_#2f1c1a]">
            <div className="flex items-center justify-between text-[0.82rem]">
              <span className="font-extrabold text-orange uppercase tracking-wider">
                Beat 1 · The Hook (0–15s)
              </span>
              <span className="text-cocoa-2 font-mono">
                {store.hook.split(/\s+/).filter(Boolean).length} words
              </span>
            </div>
            <textarea
              rows={3}
              value={store.hook}
              onChange={(e) => store.setField("hook", e.target.value)}
              className="mt-2 w-full rounded-xl border border-cocoa/20 p-3 text-[0.95rem] leading-relaxed focus:border-orange focus:outline-none"
            />
            <p className="mt-1 text-[0.78rem] text-cocoa-2">
              Start with a bold question, startling fact, or the 4 PM snacking struggle.
            </p>
          </div>

          {/* Beat 2 */}
          <div className="rounded-[22px] border border-cocoa bg-white p-5 shadow-[2px_2px_0_0_#2f1c1a]">
            <div className="flex items-center justify-between text-[0.82rem]">
              <span className="font-extrabold text-orange uppercase tracking-wider">
                Beat 2 · The Insight & Discovery (15–35s)
              </span>
              <span className="text-cocoa-2 font-mono">
                {store.insight.split(/\s+/).filter(Boolean).length} words
              </span>
            </div>
            <textarea
              rows={3}
              value={store.insight}
              onChange={(e) => store.setField("insight", e.target.value)}
              className="mt-2 w-full rounded-xl border border-cocoa/20 p-3 text-[0.95rem] leading-relaxed focus:border-orange focus:outline-none"
            />
            <p className="mt-1 text-[0.78rem] text-cocoa-2">
              Explain why Eat Better wins: 0 refined sugar, fresh Jaipur craft, clean ingredients.
            </p>
          </div>

          {/* Beat 3 */}
          <div className="rounded-[22px] border border-cocoa bg-white p-5 shadow-[2px_2px_0_0_#2f1c1a]">
            <div className="flex items-center justify-between text-[0.82rem]">
              <span className="font-extrabold text-orange uppercase tracking-wider">
                Beat 3 · The Solution / Capstone Pitch (35–65s)
              </span>
              <span className="text-cocoa-2 font-mono">
                {store.solution.split(/\s+/).filter(Boolean).length} words
              </span>
            </div>
            <textarea
              rows={3}
              value={store.solution}
              onChange={(e) => store.setField("solution", e.target.value)}
              className="mt-2 w-full rounded-xl border border-cocoa/20 p-3 text-[0.95rem] leading-relaxed focus:border-orange focus:outline-none"
            />
            <p className="mt-1 text-[0.78rem] text-cocoa-2">
              Highlight your Task A initiative, product taste profile, or unit economics.
            </p>
          </div>

          {/* Beat 4 */}
          <div className="rounded-[22px] border border-cocoa bg-white p-5 shadow-[2px_2px_0_0_#2f1c1a]">
            <div className="flex items-center justify-between text-[0.82rem]">
              <span className="font-extrabold text-orange uppercase tracking-wider">
                Beat 4 · The Climax & Call to Action (65–90s)
              </span>
              <span className="text-cocoa-2 font-mono">
                {store.cta.split(/\s+/).filter(Boolean).length} words
              </span>
            </div>
            <textarea
              rows={3}
              value={store.cta}
              onChange={(e) => store.setField("cta", e.target.value)}
              className="mt-2 w-full rounded-xl border border-cocoa/20 p-3 text-[0.95rem] leading-relaxed focus:border-orange focus:outline-none"
            />
            <p className="mt-1 text-[0.78rem] text-cocoa-2">
              Close with a memorable line and clear CTA (review dossier or order Eat Better).
            </p>
          </div>
        </div>

        {/* Teleprompter Fullscreen Rehearsal Modal */}
        <AnimatePresence>
          {isPrompterModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex flex-col bg-cocoa text-cream p-4 sm:p-8"
            >
              {/* Teleprompter Controls Header */}
              <div className="flex items-center justify-between border-b border-cream/20 pb-4">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-xl bg-orange text-white">
                    <Tv className="size-5" />
                  </span>
                  <div>
                    <h3 className="font-display text-[1.2rem] font-bold text-white">
                      Teleprompter Rehearsal Studio
                    </h3>
                    <div className="text-[0.8rem] text-cream/70">
                      ~{stats.estimatedSeconds}s total speech length
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5 rounded-xl bg-white/10 p-1">
                    {[0.8, 1, 1.25, 1.5].map((s) => (
                      <button
                        key={s}
                        onClick={() => setSpeed(s)}
                        className={`rounded-lg px-2.5 py-1 text-[0.8rem] font-bold ${
                          speed === s ? "bg-orange text-white" : "text-cream hover:bg-white/10"
                        }`}
                      >
                        {s}x
                      </button>
                    ))}
                  </div>

                  <button
                    onClick={() => setIsPlaying(!isPlaying)}
                    className="inline-flex items-center gap-2 rounded-xl bg-orange px-4 py-2 font-bold text-white shadow hover:bg-orange/90"
                  >
                    {isPlaying ? <Pause className="size-4" /> : <Play className="size-4" />}
                    {isPlaying ? "Pause" : "Start Scrolling"}
                  </button>

                  <button
                    onClick={handleRestartPrompter}
                    title="Restart from top"
                    className="rounded-xl border border-cream/20 p-2 text-cream hover:bg-white/10"
                  >
                    <RotateCcw className="size-4" />
                  </button>

                  <button
                    onClick={() => {
                      setIsPrompterModal(false);
                      setIsPlaying(false);
                    }}
                    className="rounded-xl bg-white/15 p-2 text-cream hover:bg-white/20"
                  >
                    <X className="size-5" />
                  </button>
                </div>
              </div>

              {/* Scrolling Text Window */}
              <div
                ref={prompterContentRef}
                className="relative mt-6 flex-1 overflow-y-auto px-4 text-center sm:px-20 scroll-smooth"
              >
                {/* Visual Eye-level Reading Focus Bar */}
                <div className="pointer-events-none sticky top-1/3 left-0 right-0 h-16 border-y-2 border-orange/40 bg-orange/5" />

                <div className="max-w-3xl mx-auto py-24 space-y-12">
                  <div className="space-y-3">
                    <span className="rounded-full bg-orange/30 px-3 py-1 text-[0.78rem] font-bold uppercase tracking-widest text-haldi">
                      Beat 1 · Hook (0–15s)
                    </span>
                    <p className="font-display text-[clamp(1.4rem,3vw,2.2rem)] font-bold leading-relaxed text-white">
                      {store.hook}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <span className="rounded-full bg-orange/30 px-3 py-1 text-[0.78rem] font-bold uppercase tracking-widest text-haldi">
                      Beat 2 · Insight (15–35s)
                    </span>
                    <p className="font-display text-[clamp(1.4rem,3vw,2.2rem)] font-bold leading-relaxed text-cream">
                      {store.insight}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <span className="rounded-full bg-orange/30 px-3 py-1 text-[0.78rem] font-bold uppercase tracking-widest text-haldi">
                      Beat 3 · Solution (35–65s)
                    </span>
                    <p className="font-display text-[clamp(1.4rem,3vw,2.2rem)] font-bold leading-relaxed text-cream">
                      {store.solution}
                    </p>
                  </div>

                  <div className="space-y-3">
                    <span className="rounded-full bg-orange/30 px-3 py-1 text-[0.78rem] font-bold uppercase tracking-widest text-haldi">
                      Beat 4 · Call to Action (65–90s)
                    </span>
                    <p className="font-display text-[clamp(1.4rem,3vw,2.2rem)] font-bold leading-relaxed text-haldi">
                      {store.cta}
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
          You do not need high-end film gear. A smartphone camera in a quiet room with good lighting is enough to produce an executive-ready pitch.
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

/* ── 5. Submission & Video Dossier ─────────────────────────────── */

export function SubmissionReady() {
  const store = useScriptStore();
  const [copied, setCopied] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const markdown = generatePitchMarkdown(store);

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
    link.download = `Eat-Better-Video-Pitch-Task-B-${store.formatId}.md`;
    link.click();
    URL.revokeObjectURL(url);
    setDownloaded(true);
    setTimeout(() => setDownloaded(false), 3000);
  };

  return (
    <section id="submission-ready" className={sectionCls}>
      <Panel tone="light" reveal="up" width="max-w-7xl">
        <SectionIntro
          index="5"
          kicker="Final Submission & Hosting"
          title="Video Link & Submission Dossier"
        >
          Once recorded, upload your video to Loom, YouTube (Unlisted), or Google Drive, paste the URL below, and export your Task B dossier.
        </SectionIntro>

        <div className="mt-6 rounded-[24px] border border-cocoa bg-cream p-6 shadow-[3px_3px_0_0_#2f1c1a]">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[0.85rem] font-bold text-cocoa">
                Author / Intern Name
              </label>
              <input
                type="text"
                value={store.authorName}
                onChange={(e) => store.setField("authorName", e.target.value)}
                placeholder="e.g. Priyanshu Sharma"
                className="mt-1 w-full rounded-xl border border-cocoa/20 p-2.5 text-[0.95rem] focus:border-orange focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-[0.85rem] font-bold text-cocoa">
                Recorded Video URL (Loom, YouTube, or Drive)
              </label>
              <input
                type="url"
                value={store.videoLink}
                onChange={(e) => store.setField("videoLink", e.target.value)}
                placeholder="https://www.youtube.com/watch?v=... or https://www.loom.com/..."
                className="mt-1 w-full rounded-xl border border-cocoa/20 p-2.5 text-[0.95rem] focus:border-orange focus:outline-none"
              />
            </div>
          </div>

          <div className="mt-4">
            <label className="block text-[0.85rem] font-bold text-cocoa">
              Personal Reflection & Key Takeaway
            </label>
            <textarea
              rows={2}
              value={store.selfReflection}
              onChange={(e) => store.setField("selfReflection", e.target.value)}
              className="mt-1 w-full rounded-xl border border-cocoa/20 p-2.5 text-[0.95rem] focus:border-orange focus:outline-none"
            />
          </div>

          {/* Submission Checklist */}
          <div className="mt-5 rounded-2xl bg-white p-4 border border-cocoa/15">
            <div className="text-[0.82rem] font-bold uppercase tracking-wider text-orange">
              Self-Assessment Checklist Before Submitting
            </div>
            <div className="mt-3 grid gap-2 sm:grid-cols-2">
              {VIDEO_SUBMISSION_CHECKLIST.map((item, idx) => (
                <div key={idx} className="flex items-start gap-2 text-[0.88rem] text-cocoa-2">
                  <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-success" />
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Export Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-cocoa/15">
            <div className="text-[0.88rem] text-cocoa-2">
              Ready to submit your video dossier to your evaluator?
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={handleCopy}
                className="inline-flex items-center gap-1.5 rounded-xl border border-cocoa/20 bg-white px-3.5 py-2 text-[0.88rem] font-bold text-cocoa hover:border-cocoa transition-all"
              >
                <ClipboardCopy className="size-4" />
                {copied ? "Copied!" : "Copy Script"}
              </button>
              <button
                onClick={handleDownload}
                className="inline-flex items-center gap-2 rounded-xl bg-orange px-4 py-2 text-[0.88rem] font-bold text-white shadow hover:bg-orange/90 transition-all active:scale-95"
              >
                <Download className="size-4" />
                {downloaded ? "Dossier Downloaded!" : "Download Task B Dossier (.md)"}
              </button>
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
          Congratulations! Capstone Completed
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
              Submit Task A & Task B Dossiers
            </h3>
            <p className="mt-1 text-[0.92rem] text-cocoa-2">
              Upload your downloaded Task A Proposal (.md) and Task B Video Pitch (.md) into the SkilliZee LMS portal to claim your official Eat Better Co Internship Certificate.
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
