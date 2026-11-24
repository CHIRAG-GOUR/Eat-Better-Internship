"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Headphones, ListMusic, LocateFixed, Pause, Play, SkipBack, SkipForward, X } from "lucide-react";
import { Mascot } from "@/components/celebrate/Mascot";
import SCRIPTS from "@/features/audio-chapters/scripts.json";

/**
 * Audio chapter: a narrated summary of the chapter, read along on the page.
 *
 *  - The card sits under the chapter title. Pressing play docks a mini player at the bottom of the screen.
 *  - As the narration plays, each word lights up in the mini player's transcript, the chapter section being described
 *    glows and scrolls into view (when "Follow" is on), and Laddoo walks along the progress track, talking.
 *  - Sound comes from, in order: a generated ElevenLabs file with word timings (public/audio-chapters/<n>.mp3 + .json,
 *    made by scripts/generate-audio-chapters.mjs), else the browser's own voice, else a silent read-along.
 */

type Seg = { section: string; text: string };
type Script = { title: string; segments: Seg[] };
type Word = { w: string; seg: number; char: number };
type Timing = { audio: string; words: [number, number][] }; // [start, end] seconds per word, in script order
type Mode = "file" | "speech" | "silent";

const SPEEDS = [0.85, 1, 1.15];

function wordsOf(script: Script): Word[] {
  const out: Word[] = [];
  script.segments.forEach((sg, seg) => {
    for (const m of sg.text.matchAll(/\S+/g)) out.push({ w: m[0], seg, char: m.index ?? 0 });
  });
  return out;
}

/** clear page highlights */
function unmark() {
  document.querySelectorAll(".audio-reading").forEach((el) => el.classList.remove("audio-reading"));
  document.querySelectorAll(".audio-heading").forEach((el) => el.classList.remove("audio-heading"));
}

export function AudioChapter({ chapter }: { chapter: string }) {
  const script = (SCRIPTS as Record<string, Script>)[chapter];
  const words = useMemo(() => (script ? wordsOf(script) : []), [script]);
  const segStart = useMemo(() => (script ? script.segments.map((_, i) => words.findIndex((w) => w.seg === i)) : []), [script, words]);
  const minutes = Math.max(1, Math.round(words.length / 150));

  const [open, setOpen] = useState(false); // mini player docked
  const [playing, setPlaying] = useState(false);
  const [idx, setIdx] = useState(0); // current word
  const [rate, setRate] = useState(1);
  const [follow, setFollow] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [mode, setMode] = useState<Mode | null>(null);

  const audio = useRef<HTMLAudioElement | null>(null);
  const timing = useRef<Timing | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const raf = useRef(0);
  const run = useRef(0); // invalidates stale speech callbacks
  const lastSeg = useRef(-1);

  const seg = words[idx]?.seg ?? 0;

  /* ── page highlighting: the section being described glows, its heading gets a marker sweep ── */
  useEffect(() => {
    if (!open || !script) return;
    if (seg === lastSeg.current) return;
    lastSeg.current = seg;
    unmark();
    const el = document.getElementById(script.segments[seg].section);
    if (!el) return;
    el.classList.add("audio-reading");
    el.querySelector("h2")?.classList.add("audio-heading");
    if (follow) el.scrollIntoView({ behavior: "smooth", block: "start" });
  }, [seg, open, follow, script]);

  /* ── engines ── */
  const stopAll = useCallback(() => {
    run.current++;
    if (timer.current) clearTimeout(timer.current);
    cancelAnimationFrame(raf.current);
    audio.current?.pause();
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  // silent read-along: about 2.6 words a second, a little longer for long words and pauses after full stops
  const silentFrom = useCallback(
    (from: number, r: number) => {
      const my = ++run.current;
      const step = (i: number) => {
        if (my !== run.current) return;
        if (i >= words.length) {
          setPlaying(false);
          return;
        }
        setIdx(i);
        const w = words[i].w;
        const ms = ((260 + w.length * 22 + (/[.!?]$/.test(w) ? 320 : /[,;:]$/.test(w) ? 140 : 0)) / r) | 0;
        timer.current = setTimeout(() => step(i + 1), ms);
      };
      step(from);
    },
    [words],
  );

  // browser voice: one utterance per section; word boundary events move the highlight
  const speechFrom = useCallback(
    (from: number, r: number) => {
      const synth = window.speechSynthesis;
      const my = ++run.current;
      synth.cancel();
      const voices = synth.getVoices();
      const voice =
        voices.find((v) => /en-IN/i.test(v.lang) && /female|google|neural|natural/i.test(v.name)) ||
        voices.find((v) => /en-IN/i.test(v.lang)) ||
        voices.find((v) => /en-GB/i.test(v.lang) && /google|neural|natural/i.test(v.name)) ||
        voices.find((v) => /^en/i.test(v.lang));
      const speakSeg = (sg: number, fromWord: number) => {
        if (my !== run.current || !script) return;
        if (sg >= script.segments.length) {
          setPlaying(false);
          return;
        }
        const segWords = words.map((w, i) => ({ ...w, i })).filter((w) => w.seg === sg);
        const startW = segWords.find((w) => w.i >= fromWord) ?? segWords[0];
        const offset = startW.char;
        const u = new SpeechSynthesisUtterance(script.segments[sg].text.slice(offset));
        if (voice) u.voice = voice;
        u.rate = r;
        u.pitch = 1.05;
        let gotBoundary = false;
        setIdx(startW.i);
        u.onboundary = (e) => {
          if (my !== run.current || e.name !== "word") return;
          gotBoundary = true;
          const c = offset + e.charIndex;
          const hit = [...segWords].reverse().find((w) => w.char <= c);
          if (hit) setIdx(hit.i);
        };
        u.onend = () => {
          if (my !== run.current) return;
          speakSeg(sg + 1, -1);
        };
        // some voices never send word boundaries: estimate the highlight instead
        timer.current = setTimeout(() => {
          if (gotBoundary || my !== run.current) return;
          let k = segWords.indexOf(startW);
          const tick = () => {
            if (my !== run.current || gotBoundary || k >= segWords.length) return;
            setIdx(segWords[k].i);
            const w = segWords[k].w;
            k++;
            timer.current = setTimeout(tick, ((300 + w.length * 25 + (/[.!?]$/.test(w) ? 250 : 0)) / r) | 0);
          };
          tick();
        }, 900);
        synth.speak(u);
      };
      speakSeg(words[from]?.seg ?? 0, from);
    },
    [script, words],
  );

  // generated file: the highlight follows the audio clock
  const fileFrom = useCallback(
    (from: number, r: number) => {
      const t = timing.current;
      if (!t) return;
      const my = ++run.current;
      const a = (audio.current ??= new Audio(t.audio));
      a.playbackRate = r;
      a.currentTime = t.words[from]?.[0] ?? 0;
      a.onended = () => my === run.current && setPlaying(false);
      void a.play().catch(() => setPlaying(false));
      const loop = () => {
        if (my !== run.current) return;
        const now = a.currentTime;
        let lo = 0;
        let hi = t.words.length - 1;
        while (lo < hi) {
          const mid = (lo + hi + 1) >> 1;
          if (t.words[mid][0] <= now) lo = mid;
          else hi = mid - 1;
        }
        setIdx(lo);
        raf.current = requestAnimationFrame(loop);
      };
      raf.current = requestAnimationFrame(loop);
    },
    [],
  );

  const startFrom = useCallback(
    (from: number, m: Mode, r: number) => {
      stopAll();
      setPlaying(true);
      if (m === "file") fileFrom(from, r);
      else if (m === "speech") speechFrom(from, r);
      else silentFrom(from, r);
    },
    [fileFrom, silentFrom, speechFrom, stopAll],
  );

  /** decide where the sound comes from, once */
  const pickMode = useCallback(async (): Promise<Mode> => {
    if (mode) return mode;
    let m: Mode = "silent";
    try {
      const res = await fetch(`/audio-chapters/${chapter}.json`, { cache: "no-store" });
      if (res.ok) {
        const t = (await res.json()) as Timing;
        if (t.words?.length === words.length) {
          timing.current = t;
          m = "file";
        }
      }
    } catch {
      /* no generated file yet */
    }
    if (m === "silent" && typeof window !== "undefined" && "speechSynthesis" in window) m = "speech";
    setMode(m);
    return m;
  }, [chapter, mode, words.length]);

  const play = async () => {
    setOpen(true);
    const m = await pickMode();
    startFrom(idx >= words.length - 1 ? 0 : idx, m, rate);
  };
  const pause = () => {
    stopAll();
    setPlaying(false);
  };
  const jump = (to: number) => {
    const i = Math.max(0, Math.min(words.length - 1, to));
    setIdx(i);
    if (playing && mode) startFrom(i, mode, rate);
  };
  const close = () => {
    pause();
    setOpen(false);
    setIdx(0);
    lastSeg.current = -1;
    unmark();
  };
  const cycleRate = () => {
    const r = SPEEDS[(SPEEDS.indexOf(rate) + 1) % SPEEDS.length];
    setRate(r);
    if (playing && mode) startFrom(idx, mode, r);
  };

  useEffect(() => () => {
    stopAll();
    unmark();
  }, [stopAll]);

  if (!script) return null;
  const progress = words.length > 1 ? idx / (words.length - 1) : 0;
  const curSeg = script.segments[seg];
  const segWords = words.map((w, i) => ({ ...w, i })).filter((w) => w.seg === seg);

  return (
    <>
      {/* the card under the chapter title */}
      <div className="pointer-events-auto mt-5 flex max-w-[38rem] items-center gap-3 rounded-2xl border border-cocoa bg-white/95 p-3 shadow-[3px_3px_0_0_#2f1c1a] sm:p-3.5">
        <div className="hidden shrink-0 sm:block">
          <Mascot mood={playing ? "talk" : "happy"} size={58} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[0.75rem] font-extrabold uppercase tracking-[0.12em] text-orange">
            <Headphones className="size-4" /> Audio chapter · about {minutes} min
          </div>
          <div className="font-display text-[1.05rem] font-semibold leading-tight text-cocoa">Listen to this chapter</div>
          <div className="text-[0.84rem] leading-snug text-cocoa-2">Words light up as they are read, and the page follows along.</div>
        </div>
        <button onClick={playing ? pause : play} aria-label={playing ? "Pause the audio chapter" : "Play the audio chapter"} className="grid size-12 shrink-0 place-items-center rounded-full border-2 border-cocoa bg-orange text-white shadow-[2px_2px_0_0_#2f1c1a] hover:bg-[#e04f00]">
          {playing ? <Pause className="size-5 fill-white" /> : <Play className="ml-0.5 size-5 fill-white" />}
        </button>
      </div>

      {/* the docked mini player */}
      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ y: 120, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 120, opacity: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 26 }}
                role="region"
                aria-label={`Audio chapter ${chapter}: ${script.title}`}
                className="fixed inset-x-2 bottom-[92px] z-[60] mx-auto max-w-2xl rounded-[22px] border-2 border-cocoa bg-cream p-2.5 shadow-[4px_4px_0_0_#2f1c1a] sm:bottom-4 sm:w-[min(42rem,calc(100vw-280px))] sm:p-3"
              >
                {/* Laddoo walks along the progress track */}
                <div className="relative h-[54px]">
                  <div className="absolute inset-x-1 bottom-1.5 h-1.5 rounded-full bg-cocoa/10">
                    <div className="h-full rounded-full bg-gradient-to-r from-orange to-haldi" style={{ width: `${progress * 100}%` }} />
                  </div>
                  {script.segments.map((_, i) => (
                    <button key={i} onClick={() => jump(segStart[i])} aria-label={`Go to part ${i + 1}`} className={`absolute bottom-0 size-4 -translate-x-1/2 rounded-full border-2 border-cocoa ${i <= seg ? "bg-orange" : "bg-white"}`} style={{ left: `calc(4px + ${(segStart[i] / Math.max(1, words.length - 1)) * 100}% - ${(segStart[i] / Math.max(1, words.length - 1)) * 8}px)` }} />
                  ))}
                  <div className="absolute bottom-2 -translate-x-1/2 transition-[left] duration-300 ease-linear" style={{ left: `calc(4px + ${progress * 100}% - ${progress * 8}px)` }}>
                    <Mascot mood={playing ? "talk" : "happy"} walking={playing} size={40} />
                  </div>
                </div>

                {/* the words being read, lit up one by one */}
                <div className="mt-1 max-h-24 overflow-y-auto rounded-xl bg-white px-3 py-2 text-[0.98rem] leading-relaxed sm:text-[1.02rem]" aria-live="off">
                  {(showAll ? words.map((w, i) => ({ ...w, i })) : segWords).map((w) => (
                    <span key={w.i}>
                      {showAll && w.i === segStart[w.seg] && w.i > 0 ? <br /> : null}
                      <span className={`rounded px-0.5 transition-colors ${w.i === idx ? "bg-haldi text-cocoa" : w.i < idx ? "text-cocoa" : "text-cocoa/45"}`}>{w.w}</span>{" "}
                    </span>
                  ))}
                </div>

                {/* controls */}
                <div className="mt-2 flex items-center gap-1.5">
                  <button onClick={() => jump(segStart[Math.max(0, seg - (idx > segStart[seg] + 2 ? 0 : 1))])} aria-label="Previous part" className="grid size-9 place-items-center rounded-full bg-white text-cocoa hover:bg-peach">
                    <SkipBack className="size-4" />
                  </button>
                  <button onClick={playing ? pause : play} aria-label={playing ? "Pause" : "Play"} className="grid size-11 place-items-center rounded-full border-2 border-cocoa bg-orange text-white">
                    {playing ? <Pause className="size-5 fill-white" /> : <Play className="ml-0.5 size-5 fill-white" />}
                  </button>
                  <button onClick={() => jump(segStart[Math.min(script.segments.length - 1, seg + 1)])} aria-label="Next part" className="grid size-9 place-items-center rounded-full bg-white text-cocoa hover:bg-peach">
                    <SkipForward className="size-4" />
                  </button>
                  <div className="min-w-0 flex-1 px-1">
                    <div className="truncate text-[0.72rem] font-extrabold uppercase tracking-[0.1em] text-orange">
                      Part {seg + 1} of {script.segments.length}
                    </div>
                    <div className="truncate text-[0.85rem] font-bold text-cocoa">{script.title}</div>
                  </div>
                  <button onClick={cycleRate} aria-label="Reading speed" className="h-9 rounded-full bg-white px-2.5 text-[0.82rem] font-bold text-cocoa hover:bg-peach">
                    {rate}×
                  </button>
                  <button onClick={() => setFollow((f) => !f)} aria-pressed={follow} aria-label="Follow along on the page" title="Follow along on the page" className={`grid size-9 place-items-center rounded-full ${follow ? "bg-cocoa text-cream" : "bg-white text-cocoa"}`}>
                    <LocateFixed className="size-4" />
                  </button>
                  <button onClick={() => setShowAll((v) => !v)} aria-pressed={showAll} aria-label="Show the whole transcript" title="Whole transcript" className={`hidden size-9 place-items-center rounded-full sm:grid ${showAll ? "bg-cocoa text-cream" : "bg-white text-cocoa"}`}>
                    <ListMusic className="size-4" />
                  </button>
                  <button onClick={close} aria-label="Close the audio chapter" className="grid size-9 place-items-center rounded-full bg-white text-cocoa hover:bg-peach">
                    <X className="size-4" />
                  </button>
                </div>
                {mode === "silent" && <div className="mt-1 text-center text-[0.75rem] text-cocoa-2">Read-along mode: this device has no voice, so the words light up without sound.</div>}
                <span className="sr-only">{curSeg?.text}</span>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
