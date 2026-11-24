"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Headphones, LocateFixed, Pause, Play, SkipBack, SkipForward, X } from "lucide-react";
import { Mascot } from "@/components/celebrate/Mascot";
import SCRIPTS from "@/features/audio-chapters/scripts.json";
import { buildTour, type TourStep } from "./tour";

/**
 * Audio chapter with Laddoo as the guide. Press play and Laddoo walks onto the page: it goes to each heading,
 * paragraph and list item in turn and reads it aloud (each word lights up in the chapter text itself), then turns to
 * you with a speech bubble and explains that part in simple words. Laddoo reacts as it reads: wide-eyed at numbers,
 * thinking at questions, pointing while it explains, and celebrating at the end. A small remote bar sits at the bottom.
 *
 * Sound, in order: generated ElevenLabs files (public/audio-chapters/<n>.json + mp3 chunks, made by
 * scripts/generate-audio-chapters.mjs from this exact tour), else the browser's voice, else a silent read-along.
 */

type Mode = "file" | "speech" | "silent";
type FileTour = { chunks: { audio: string; steps: { key: string; text: string; words: [number, number][] }[] }[] };
const SPEEDS = [0.85, 1, 1.15];
const titleOf = (n: string) => (SCRIPTS as Record<string, { title: string }>)[n]?.title;

// in-place word highlighting via the CSS Custom Highlight API (no change to the page's own markup)
type HL = { highlights: Map<string, unknown> };
const hlApi = () => (typeof CSS !== "undefined" && "highlights" in CSS ? (CSS as unknown as HL).highlights : null);
function paint(step: TourStep | undefined, wi: number) {
  const api = hlApi();
  if (!api) return;
  api.delete("eb-read");
  api.delete("eb-done");
  if (!step || step.kind !== "read") return;
  const w = step.words[wi];
  const first = step.words[0];
  try {
    if (w?.node) {
      const r = document.createRange();
      r.setStart(w.node, w.start!);
      r.setEnd(w.node, w.end!);
      api.set("eb-read", new (window as unknown as { Highlight: new (...r: Range[]) => unknown }).Highlight(r));
    }
    const prev = step.words[wi - 1];
    if (first?.node && prev?.node) {
      const d = document.createRange();
      d.setStart(first.node, first.start!);
      d.setEnd(prev.node, prev.end!);
      api.set("eb-done", new (window as unknown as { Highlight: new (...r: Range[]) => unknown }).Highlight(d));
    }
  } catch {
    /* the text moved; skip this word */
  }
}
function unpaint() {
  hlApi()?.delete("eb-read");
  hlApi()?.delete("eb-done");
  document.querySelectorAll(".tour-line").forEach((e) => e.classList.remove("tour-line"));
}

export function AudioChapter({ chapter }: { chapter: string }) {
  const title = titleOf(chapter);
  const card = useRef<HTMLDivElement>(null);
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [si, setSi] = useState(0); // step
  const [wi, setWi] = useState(0); // word within step
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [follow, setFollow] = useState(true);
  const [mode, setMode] = useState<Mode | null>(null);
  const [pos, setPos] = useState<{ x: number; y: number; bx: number; by: number; bw: number; flip: boolean } | null>(null);
  const [walking, setWalking] = useState(false);

  const run = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const raf = useRef(0);
  const audio = useRef<HTMLAudioElement | null>(null);
  const fileTour = useRef<FileTour | null>(null);
  const stepsRef = useRef<TourStep[]>([]);
  useEffect(() => {
    stepsRef.current = steps;
  }, [steps]);

  const step = steps[si];

  // expose the tour so the audio generator can record exactly what Laddoo reads
  useEffect(() => {
    (window as unknown as { __ebTour?: () => { key: string; kind: string; text: string; mood: string }[] }).__ebTour = () => buildTour(chapter, card.current).map((s) => ({ key: s.key, kind: s.kind, text: s.text, mood: s.mood }));
  }, [chapter]);

  /* ── where Laddoo stands: beside the line it is reading; the bubble goes where there is room ── */
  const place = useCallback(() => {
    const s = stepsRef.current[si];
    if (!s) return;
    const r = s.el.getBoundingClientRect();
    const vw = window.innerWidth;
    const size = vw < 640 ? 56 : 72;
    // when explaining, stand to the right of where the words end (if there is room) so the bubble doesn't cover them
    if (s.kind === "explain") {
      const range = document.createRange();
      range.selectNodeContents(s.el);
      const t = range.getBoundingClientRect();
      const bw = Math.min(330, vw - 24);
      if (t.width > 0 && vw - t.right >= size + bw + 28) {
        const x = t.right + 14;
        const y = t.top + Math.min(t.height, 60) / 2 - size * 0.62;
        setPos({ x: x + scrollX, y: y + scrollY, bx: x + size + 8 + scrollX, by: y - 8 + scrollY, bw, flip: false });
        return;
      }
    }
    const roomLeft = r.left > size + 12;
    const x = roomLeft ? r.left - size - 6 : Math.max(6, r.left - 4);
    const y = roomLeft ? r.top + Math.min(r.height, 60) / 2 - size * 0.62 : r.top - size - 4;
    const bw = Math.min(330, vw - 24);
    const rightRoom = vw - (x + size + 8);
    const bx = rightRoom >= bw ? x + size + 8 : Math.max(12, Math.min(vw - bw - 12, x));
    const by = rightRoom >= bw ? y - 8 : y + size * 1.15 + 6;
    setPos({ x: x + scrollX, y: y + scrollY, bx: bx + scrollX, by: by + scrollY, bw, flip: false });
  }, [si]);

  useEffect(() => {
    if (!open || !step) return;
    // walk to the new line, keep the page following along
    const t0 = setTimeout(() => setWalking(true), 0);
    const t = setTimeout(() => setWalking(false), 850);
    document.querySelectorAll(".tour-line").forEach((e) => e.classList.remove("tour-line"));
    if (step.kind === "read") step.el.classList.add("tour-line");
    if (follow) {
      const r = step.el.getBoundingClientRect();
      if (r.top < 90 || r.bottom > window.innerHeight - 230) window.scrollTo({ top: scrollY + r.top - window.innerHeight * 0.3, behavior: "smooth" });
    }
    return () => {
      clearTimeout(t0);
      clearTimeout(t);
    };
  }, [si, open, step, follow]);

  // keep Laddoo glued to the line while the page scrolls or resizes
  useEffect(() => {
    if (!open) return;
    let id = 0;
    const loop = () => {
      place();
      id = requestAnimationFrame(loop);
    };
    id = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(id);
  }, [open, place]);

  useEffect(() => {
    if (open) paint(step, wi);
  }, [open, step, wi]);

  /* ── engines ── */
  const stopAll = useCallback(() => {
    run.current++;
    if (timer.current) clearTimeout(timer.current);
    cancelAnimationFrame(raf.current);
    audio.current?.pause();
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  const wordMs = (w: string, r: number) => ((270 + w.length * 24 + (/[.!?]$/.test(w) ? 320 : /[,;:]$/.test(w) ? 150 : 0)) / r) | 0;

  // silent read-along
  const silentFrom = useCallback((from: number, r: number) => {
    const my = ++run.current;
    const go = (s: number, w: number) => {
      if (my !== run.current) return;
      const st = stepsRef.current[s];
      if (!st) return setPlaying(false);
      if (w >= st.words.length) {
        timer.current = setTimeout(() => go(s + 1, 0), st.kind === "read" ? 250 : 600);
        return;
      }
      setSi(s);
      setWi(w);
      timer.current = setTimeout(() => go(s, w + 1), wordMs(st.words[w].w, r));
    };
    go(from, 0);
  }, []);

  // browser voice: one utterance per step, word boundaries move the highlight (estimated if the voice sends none)
  const speechFrom = useCallback((from: number, r: number) => {
    const synth = window.speechSynthesis;
    const my = ++run.current;
    synth.cancel();
    const voices = synth.getVoices();
    const voice =
      voices.find((v) => /en-IN/i.test(v.lang) && /female|google|neural|natural/i.test(v.name)) ||
      voices.find((v) => /en-IN/i.test(v.lang)) ||
      voices.find((v) => /en-GB/i.test(v.lang) && /google|neural|natural/i.test(v.name)) ||
      voices.find((v) => /^en/i.test(v.lang));
    const say = (s: number) => {
      if (my !== run.current) return;
      const st = stepsRef.current[s];
      if (!st) return setPlaying(false);
      setSi(s);
      setWi(0);
      const text = st.words.map((w) => w.w).join(" ");
      const starts: number[] = [];
      let c = 0;
      st.words.forEach((w) => {
        starts.push(c);
        c += w.w.length + 1;
      });
      const u = new SpeechSynthesisUtterance(text);
      if (voice) u.voice = voice;
      u.rate = r;
      u.pitch = st.kind === "explain" ? 1.12 : 1.04;
      let got = false;
      u.onboundary = (e) => {
        if (my !== run.current || e.name !== "word") return;
        got = true;
        let k = 0;
        while (k + 1 < starts.length && starts[k + 1] <= e.charIndex) k++;
        setWi(k);
      };
      u.onend = () => {
        if (my !== run.current) return;
        timer.current = setTimeout(() => say(s + 1), st.kind === "read" ? 200 : 450);
      };
      timer.current = setTimeout(() => {
        if (got || my !== run.current) return;
        let k = 0;
        const tick = () => {
          if (got || my !== run.current || k >= st.words.length) return;
          setWi(k);
          timer.current = setTimeout(tick, wordMs(st.words[k++].w, r));
        };
        tick();
      }, 900);
      synth.speak(u);
    };
    say(from);
  }, []);

  // generated files: one audio chunk at a time, the highlight follows the audio clock
  const fileFrom = useCallback((from: number, r: number) => {
    const ft = fileTour.current;
    if (!ft) return;
    const my = ++run.current;
    // flatten: global step index → (chunk, step in chunk)
    const map: { c: number; k: number }[] = [];
    ft.chunks.forEach((ch, c) => ch.steps.forEach((_, k) => map.push({ c, k })));
    const playChunk = (c: number, startStep: number) => {
      if (my !== run.current) return;
      const ch = ft.chunks[c];
      if (!ch) return setPlaying(false);
      const a = new Audio(ch.audio);
      audio.current?.pause();
      audio.current = a;
      a.playbackRate = r;
      const first = map.findIndex((m) => m.c === c);
      const st0 = ch.steps[startStep - first]?.words[0]?.[0] ?? 0;
      a.currentTime = st0;
      a.onended = () => my === run.current && playChunk(c + 1, map.findIndex((m) => m.c === c + 1));
      void a.play().catch(() => setPlaying(false));
      const loop = () => {
        if (my !== run.current) return;
        const t = a.currentTime;
        let s = first;
        for (let k = 0; k < ch.steps.length; k++) if ((ch.steps[k].words[0]?.[0] ?? 0) <= t) s = first + k;
        const ws = ch.steps[s - first].words;
        let w = 0;
        while (w + 1 < ws.length && ws[w + 1][0] <= t) w++;
        setSi(s);
        setWi(w);
        raf.current = requestAnimationFrame(loop);
      };
      raf.current = requestAnimationFrame(loop);
    };
    playChunk(map[from]?.c ?? 0, from);
  }, []);

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

  const ensureTour = async (): Promise<{ tour: TourStep[]; m: Mode }> => {
    let tour = stepsRef.current;
    if (!tour.length) {
      tour = buildTour(chapter, card.current);
      stepsRef.current = tour;
      setSteps(tour);
    }
    if (mode) return { tour, m: mode };
    let m: Mode = "silent";
    try {
      const res = await fetch(`/audio-chapters/${chapter}.json`, { cache: "no-store" });
      if (res.ok) {
        const ft = (await res.json()) as FileTour;
        const flat = ft.chunks?.flatMap((c) => c.steps) ?? [];
        // use the recording only if it was made from this exact tour
        if (flat.length === tour.length && flat.every((s, i) => s.key === tour[i].key && s.text === tour[i].text)) {
          fileTour.current = ft;
          m = "file";
        }
      }
    } catch {
      /* no recording yet */
    }
    if (m === "silent" && "speechSynthesis" in window) m = "speech";
    setMode(m);
    return { tour, m };
  };

  const play = async () => {
    setOpen(true);
    const { tour, m } = await ensureTour();
    startFrom(si >= tour.length - 1 ? 0 : si, m, rate);
  };
  const pause = () => {
    stopAll();
    setPlaying(false);
  };
  const jump = (to: number) => {
    const i = Math.max(0, Math.min(steps.length - 1, to));
    setSi(i);
    setWi(0);
    if (playing && mode) startFrom(i, mode, rate);
  };
  const close = () => {
    pause();
    setOpen(false);
    setSi(0);
    setWi(0);
    unpaint();
  };
  const cycleRate = () => {
    const r = SPEEDS[(SPEEDS.indexOf(rate) + 1) % SPEEDS.length];
    setRate(r);
    if (playing && mode) startFrom(si, mode, r);
  };

  useEffect(
    () => () => {
      stopAll();
      unpaint();
    },
    [stopAll],
  );

  if (!title) return null;
  const progress = steps.length > 1 ? si / (steps.length - 1) : 0;
  const reading = step?.kind === "read";

  return (
    <>
      {/* the card under the chapter title */}
      <div ref={card} className="pointer-events-auto mt-5 flex max-w-[38rem] items-center gap-3 rounded-2xl border border-cocoa bg-white/95 p-3 shadow-[3px_3px_0_0_#2f1c1a] sm:p-3.5">
        <div className="hidden shrink-0 sm:block">
          <Mascot mood={open ? "happy" : "wave"} size={58} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-[0.75rem] font-extrabold uppercase tracking-[0.12em] text-orange">
            <Headphones className="size-4" /> Audio chapter with Laddoo
          </div>
          <div className="font-display text-[1.05rem] font-semibold leading-tight text-cocoa">Listen and read along</div>
          <div className="text-[0.84rem] leading-snug text-cocoa-2">Laddoo walks through the chapter, reads every part with you and explains it.</div>
        </div>
        <button onClick={playing ? pause : play} aria-label={playing ? "Pause the audio chapter" : "Play the audio chapter"} className="grid size-12 shrink-0 place-items-center rounded-full border-2 border-cocoa bg-orange text-white shadow-[2px_2px_0_0_#2f1c1a] hover:bg-[#e04f00]">
          {playing ? <Pause className="size-5 fill-white" /> : <Play className="ml-0.5 size-5 fill-white" />}
        </button>
      </div>

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && pos && step && (
              <motion.div key="guide" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* Laddoo on the page, beside the line being read */}
                <motion.div className="pointer-events-none absolute left-0 top-0 z-[58]" animate={{ x: pos.x, y: pos.y }} transition={{ type: "spring", stiffness: 70, damping: 16 }} aria-hidden>
                  <Mascot mood={walking ? "happy" : step.mood} walking={walking} size={typeof window !== "undefined" && window.innerWidth < 640 ? 56 : 72} flip={pos.flip} />
                </motion.div>
                {/* the explanation bubble */}
                <AnimatePresence>
                  {!reading && !walking && (
                    <motion.div
                      key={step.key}
                      initial={{ opacity: 0, scale: 0.85, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 300, damping: 22 }}
                      className="absolute z-[59] rounded-2xl border-2 border-cocoa bg-white p-3 text-[0.98rem] font-semibold leading-snug shadow-[3px_3px_0_0_#2f1c1a]"
                      style={{ left: pos.bx, top: pos.by, width: pos.bw }}
                      role="status"
                    >
                      <div className="mb-1 text-[0.7rem] font-extrabold uppercase tracking-[0.12em] text-orange">Laddoo explains</div>
                      {step.words.map((w, i) => (
                        <span key={i}>
                          <span className={`rounded px-0.5 ${i === wi ? "bg-haldi text-cocoa" : i < wi ? "text-cocoa" : "text-cocoa/45"}`}>{w.w}</span>{" "}
                        </span>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ type: "spring", stiffness: 260, damping: 26 }}
                role="region"
                aria-label={`Audio chapter ${chapter}: ${title}`}
                className="fixed inset-x-2 bottom-[92px] z-[60] mx-auto max-w-xl rounded-[20px] border-2 border-cocoa bg-cream p-2 shadow-[4px_4px_0_0_#2f1c1a] sm:bottom-4 sm:w-[min(36rem,calc(100vw-280px))]"
              >
                <div className="mx-1 h-1.5 overflow-hidden rounded-full bg-cocoa/10">
                  <div className="h-full rounded-full bg-gradient-to-r from-orange to-haldi transition-[width] duration-300" style={{ width: `${progress * 100}%` }} />
                </div>
                <div className="mt-1.5 flex items-center gap-1.5">
                  <button onClick={() => jump(si - 1)} aria-label="Previous line" className="grid size-9 place-items-center rounded-full bg-white text-cocoa hover:bg-peach">
                    <SkipBack className="size-4" />
                  </button>
                  <button onClick={playing ? pause : play} aria-label={playing ? "Pause" : "Play"} className="grid size-11 place-items-center rounded-full border-2 border-cocoa bg-orange text-white">
                    {playing ? <Pause className="size-5 fill-white" /> : <Play className="ml-0.5 size-5 fill-white" />}
                  </button>
                  <button onClick={() => jump(si + 1)} aria-label="Next line" className="grid size-9 place-items-center rounded-full bg-white text-cocoa hover:bg-peach">
                    <SkipForward className="size-4" />
                  </button>
                  <div className="min-w-0 flex-1 px-1">
                    <div className="truncate text-[0.72rem] font-extrabold uppercase tracking-[0.1em] text-orange">{reading ? "Laddoo is reading" : "Laddoo explains"}</div>
                    <div className="truncate text-[0.85rem] font-bold text-cocoa">{title}</div>
                  </div>
                  <button onClick={cycleRate} aria-label="Reading speed" className="h-9 rounded-full bg-white px-2.5 text-[0.82rem] font-bold text-cocoa hover:bg-peach">
                    {rate}×
                  </button>
                  <button onClick={() => setFollow((f) => !f)} aria-pressed={follow} aria-label="Follow along on the page" title="Follow along on the page" className={`grid size-9 place-items-center rounded-full ${follow ? "bg-cocoa text-cream" : "bg-white text-cocoa"}`}>
                    <LocateFixed className="size-4" />
                  </button>
                  <button onClick={close} aria-label="Close the audio chapter" className="grid size-9 place-items-center rounded-full bg-white text-cocoa hover:bg-peach">
                    <X className="size-4" />
                  </button>
                </div>
                {mode === "silent" && <div className="mt-1 text-center text-[0.75rem] text-cocoa-2">Read-along mode: this device has no voice, so the words light up without sound.</div>}
              </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
