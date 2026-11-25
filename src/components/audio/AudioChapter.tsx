"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, animate, motion, useMotionValue, type AnimationPlaybackControls } from "motion/react";
import { Headphones, Pause, Play, Volume1, Volume2, VolumeX, X } from "lucide-react";
import { Mascot } from "@/components/celebrate/Mascot";
import SCRIPTS from "@/features/audio-chapters/scripts.json";
import { buildTour, type TourStep } from "./tour";
import { ExplainerCard } from "./ExplainerCard";

/**
 * Audio chapter with Laddoo as the guide. Press play and Laddoo walks onto the page: it goes to each heading,
 * paragraph and list item in turn and reads it aloud (each word lights up in the chapter text itself), then turns to
 * you with a speech bubble and explains that part in simple words.
 *
 * Laddoo walks between lines (a real walk cycle, longer walks for longer distances, facing where it goes), glides down
 * a paragraph line by line as it reads, looks at the word it is reading, and its mouth moves with the voice: with a
 * recording, the mouth follows the loudness of the sound itself; with the browser voice, it moves syllable by syllable.
 *
 * Player: play/pause, a seekbar (click or drag to jump), speed and volume.
 *
 * Sound, in order: generated ElevenLabs files (public/audio-chapters/<n>.json + mp3 chunks, made by
 * scripts/generate-audio-chapters.mjs from this exact tour), else the browser's voice, else a silent read-along.
 */

type Mode = "file" | "speech" | "silent";
type FileTour = { chunks: { audio: string; steps: { key: string; text: string; words: [number, number][] }[] }[] };
type Spot = { x: number; y: number; look: number; bubble: { x: number; y: number; w: number } | null };
const SPEEDS = [0.85, 1, 1.15];
const titleOf = (n: string) => (SCRIPTS as Record<string, { title: string }>)[n]?.title;
const sizeOf = () => (window.innerWidth < 640 ? 56 : 72);

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

/** the box of one word on screen (first line box if it wraps) */
function wordRect(s: TourStep, wi: number): DOMRect | null {
  const w = s.words[wi];
  if (!w?.node) return null;
  try {
    const r = document.createRange();
    r.setStart(w.node, w.start!);
    r.setEnd(w.node, w.end!);
    return r.getClientRects()[0] ?? null;
  } catch {
    return null;
  }
}

/** where Laddoo stands for this step and word, in page coordinates, and where the explanation bubble goes */
function spotFor(s: TourStep, wi: number, before: TourStep[] = []): Spot {
  const vw = window.innerWidth;
  const size = sizeOf();
  const bw = Math.min(330, vw - 24);
  const r = s.el.getBoundingClientRect();
  if (s.kind === "explain") {
    // stand to the right of where the words end (if there is room) so the bubble doesn't cover them
    const range = document.createRange();
    range.selectNodeContents(s.el);
    const t = range.getBoundingClientRect();
    // the lines just above count too, so Laddoo never stands inside a longer line of text
    for (const prev of before) {
      if (prev.section !== s.section || prev.el === s.el) continue;
      range.selectNodeContents(prev.el);
      const p = range.getBoundingClientRect();
      if (p.width > 0 && t.top - p.bottom < 120) t.width = Math.max(t.right, p.right) - t.left;
    }
    if (t.width > 0 && vw - t.right >= size + bw + 28) {
      const x = t.right + 14;
      const y = t.bottom - Math.min(t.height, 60) / 2 - size * 0.62;
      return { x: x + scrollX, y: y + scrollY, look: 0, bubble: { x: x + size + 8 + scrollX, y: y - 8 + scrollY, w: bw } };
    }
  }
  // reading: stand at the left of the line being read (or just above it on narrow screens) and follow it down
  const wr = s.kind === "read" ? wordRect(s, wi) : null;
  const lineTop = wr ? wr.top : s.kind === "explain" ? r.bottom - Math.min(r.height, 28) : r.top;
  const lineH = wr ? wr.height : Math.min(r.height, 28);
  const roomLeft = r.left > size + 12;
  const x = roomLeft ? r.left - size - 6 : Math.max(6, r.left - 4);
  const y = roomLeft ? lineTop + lineH / 2 - size * 0.62 : lineTop - size - 2;
  const look = wr ? Math.max(-1, Math.min(1, (wr.left + wr.width / 2 - (x + size / 2)) / 260)) : 0;
  let bubble: Spot["bubble"] = null;
  if (s.kind === "explain") {
    const rightRoom = vw - (x + size + 8);
    const bx = rightRoom >= bw ? x + size + 8 : Math.max(12, Math.min(vw - bw - 12, x));
    const by = rightRoom >= bw ? y - 8 : y + size * 1.15 + 6;
    bubble = { x: bx + scrollX, y: by + scrollY, w: bw };
  }
  return { x: x + scrollX, y: y + scrollY, look, bubble };
}

/**
 * Laddoo's gesture for the word being spoken. While explaining, it changes with each sentence, following what the
 * sentence says: thinking at a question, wide-eyed at a number, otherwise pointing at the text and talking with its
 * hands in turn. Hello and goodbye keep their wave and party.
 */
function gestureFor(s: TourStep, wi: number): TourStep["mood"] {
  if (s.kind === "read" || s.key === "outro") return s.mood;
  let start = 0;
  let n = 0;
  for (let i = 0; i < wi && i < s.words.length; i++)
    if (/[.!?:]$/.test(s.words[i].w)) {
      start = i + 1;
      n++;
    }
  if (s.key === "intro") return n === 0 ? "wave" : n === 1 ? "point" : "happy";
  let end = start;
  while (end < s.words.length - 1 && !/[.!?:]$/.test(s.words[end].w)) end++;
  const sentence = s.words
    .slice(start, end + 1)
    .map((w) => w.w)
    .join(" ");
  if (/\?$/.test(sentence)) return "think";
  if (/[₹%]|\d|crore|lakh/i.test(sentence)) return "wow";
  return n % 2 === 0 ? "point" : "talk";
}

const syllables = (w: string) => Math.max(1, Math.min(4, w.toLowerCase().match(/[aeiouy]+/g)?.length ?? 1));

export function AudioChapter({ chapter }: { chapter: string }) {
  const title = titleOf(chapter);
  const card = useRef<HTMLDivElement>(null);
  const [steps, setSteps] = useState<TourStep[]>([]);
  const [si, setSi] = useState(0); // step
  const [wi, setWi] = useState(0); // word within step
  const [open, setOpen] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [rate, setRate] = useState(1);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [mode, setMode] = useState<Mode | null>(null);
  const [placed, setPlaced] = useState(false);
  const [walking, setWalking] = useState(false);
  const [flip, setFlip] = useState(false);
  const [look, setLook] = useState(0);
  const [bubble, setBubble] = useState<Spot["bubble"]>(null);
  const [scrub, setScrub] = useState<number | null>(null); // step under the finger while dragging the seekbar

  // Laddoo's position on the page and how open its mouth is (motion values: no re-render per frame)
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouth = useMotionValue(0);

  const run = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const raf = useRef(0);
  const audio = useRef<HTMLAudioElement | null>(null);
  const fileTour = useRef<FileTour | null>(null);
  const stepsRef = useRef<TourStep[]>([]);
  const vol = muted ? 0 : volume;
  const volRef = useRef(1);
  // Web Audio: the analyser lets the mouth follow the real voice; the gain node is the volume
  const ctx = useRef<AudioContext | null>(null);
  const analyser = useRef<AnalyserNode | null>(null);
  const gain = useRef<GainNode | null>(null);
  const source = useRef<MediaElementAudioSourceNode | null>(null);
  const ampDriven = useRef(false);
  // walking
  const moves = useRef<AnimationPlaybackControls[]>([]);
  const walkEnd = useRef(0);
  const walkTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const placedRef = useRef(false);
  const lastStep = useRef(-1);

  useEffect(() => {
    stepsRef.current = steps;
  }, [steps]);
  useEffect(() => {
    volRef.current = vol;
    if (gain.current) gain.current.gain.value = vol;
    else if (audio.current) audio.current.volume = vol;
  }, [vol]);

  const step = steps[si];

  // expose the tour so the audio generator can record exactly what Laddoo reads
  useEffect(() => {
    (window as unknown as { __ebTour?: () => { key: string; kind: string; text: string; mood: string }[] }).__ebTour = () => buildTour(chapter, card.current).map((s) => ({ key: s.key, kind: s.kind, text: s.text, mood: s.mood }));
  }, [chapter]);

  /* ── moving Laddoo ── */
  const moveTo = useCallback(
    (t: Spot, newStep: boolean) => {
      const cx = x.get();
      const cy = y.get();
      const d = Math.hypot(t.x - cx, t.y - cy);
      if (!placedRef.current) {
        x.set(t.x);
        y.set(t.y);
        placedRef.current = true;
        setPlaced(true);
        return;
      }
      if (d < 1.5) return;
      const now = performance.now();
      moves.current.forEach((m) => m.stop());
      if (newStep || d > 140) {
        // a real walk: longer walks take longer, Laddoo faces the way it is going
        const dur = Math.min(1.7, Math.max(0.6, 0.35 + d / 650));
        const ease = [0.42, 0, 0.4, 1] as const;
        moves.current = [animate(x, t.x, { duration: dur, ease }), animate(y, t.y, { duration: dur, ease })];
        if (Math.abs(t.x - cx) > 6) setFlip(t.x < cx);
        setWalking(true);
        walkEnd.current = now + dur * 1000;
        if (walkTimer.current) clearTimeout(walkTimer.current);
        walkTimer.current = setTimeout(() => {
          setWalking(false);
          setFlip(false);
        }, dur * 1000);
      } else if (now < walkEnd.current) {
        // still walking: steer to the new spot within the time left
        const left = Math.max(0.25, (walkEnd.current - now) / 1000);
        moves.current = [animate(x, t.x, { duration: left, ease: "easeOut" }), animate(y, t.y, { duration: left, ease: "easeOut" })];
      } else {
        // next line of the same paragraph: a small glide
        const spring = { type: "spring" as const, stiffness: 90, damping: 18, mass: 0.9 };
        moves.current = [animate(x, t.x, spring), animate(y, t.y, spring)];
      }
    },
    [x, y],
  );

  const follow = (top: number, bottom: number, force: boolean) => {
    const vh = window.innerHeight;
    if (force ? top < 90 || top > vh - 260 : bottom > vh - 220 || top < 70) window.scrollTo({ top: scrollY + top - vh * 0.32, behavior: "smooth" });
  };

  // new step: walk there and bring it into view
  useEffect(() => {
    if (!open || !step) return;
    document.querySelectorAll(".tour-line").forEach((e) => e.classList.remove("tour-line"));
    if (step.kind === "read") step.el.classList.add("tour-line");
    const r = step.el.getBoundingClientRect();
    follow(r.top, r.bottom, true);
    const t = spotFor(step, 0, steps.slice(Math.max(0, si - 3), si));
    const changed = lastStep.current !== si;
    lastStep.current = si;
    const id = requestAnimationFrame(() => {
      moveTo(t, changed);
      setBubble(t.bubble);
      setLook(Math.round(t.look * 10) / 10);
    });
    return () => cancelAnimationFrame(id);
  }, [si, open, step, steps, moveTo]);

  // next word: glide to its line when the reading wraps, look at it, keep it on screen
  useEffect(() => {
    if (!open || !step || step.kind !== "read" || wi === 0) return;
    const t = spotFor(step, wi);
    const wr = wordRect(step, wi);
    if (wr) follow(wr.top, wr.bottom, false);
    const id = requestAnimationFrame(() => {
      moveTo(t, false);
      setLook(Math.round(t.look * 10) / 10);
    });
    return () => cancelAnimationFrame(id);
  }, [wi, open, step, moveTo]);

  // the page can shift (images loading, resizing): check now and then that Laddoo is still in the right spot
  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => {
      const s = stepsRef.current[si];
      if (!s) return;
      const t = spotFor(s, wi, stepsRef.current.slice(Math.max(0, si - 3), si));
      moveTo(t, false);
      setBubble((b) => (!t.bubble || !b || Math.abs(b.x - t.bubble.x) > 2 || Math.abs(b.y - t.bubble.y) > 2 ? t.bubble : b));
    }, 500);
    return () => clearInterval(id);
  }, [open, si, wi, moveTo]);

  useEffect(() => {
    if (open) paint(step, wi);
  }, [open, step, wi]);

  /* ── lip-sync without a recording: the mouth opens once per syllable of the word being spoken ── */
  const wordMs = (w: string, r: number) => ((270 + w.length * 24 + (/[.!?]$/.test(w) ? 320 : /[,;:]$/.test(w) ? 150 : 0)) / r) | 0;
  useEffect(() => {
    if (!open || !playing || ampDriven.current) return;
    const w = step?.words[wi]?.w;
    if (!w) return;
    const n = syllables(w);
    const kf = [0.1];
    for (let i = 0; i < n; i++) kf.push(0.55 + ((i * 37 + w.length * 13) % 40) / 100, 0.12);
    kf[kf.length - 1] = 0.04;
    const c = animate(mouth, kf, { duration: ((wordMs(w, rate) * 0.85) / 1000) * (n > 2 ? 1.1 : 1), ease: "easeInOut" });
    return () => c.stop();
  }, [open, playing, step, wi, rate, mouth]);

  /* ── engines ── */
  const stopAll = useCallback(() => {
    run.current++;
    if (timer.current) clearTimeout(timer.current);
    cancelAnimationFrame(raf.current);
    audio.current?.pause();
    if (typeof window !== "undefined" && "speechSynthesis" in window) window.speechSynthesis.cancel();
    animate(mouth, 0, { duration: 0.15 });
  }, [mouth]);

  /** create (or wake) the audio context inside the click, so phones allow the sound */
  const wakeAudio = () => {
    try {
      const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!AC) return;
      if (!ctx.current) {
        const c = new AC();
        const an = c.createAnalyser();
        an.fftSize = 1024;
        const g = c.createGain();
        an.connect(g);
        g.connect(c.destination);
        ctx.current = c;
        analyser.current = an;
        gain.current = g;
      }
      void ctx.current.resume();
    } catch {
      ctx.current = null;
    }
  };

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
      u.volume = volRef.current;
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

  // generated files: one audio chunk at a time, the highlight follows the audio clock, the mouth follows its loudness
  const fileFrom = useCallback(
    (from: number, r: number) => {
      const ft = fileTour.current;
      if (!ft) return;
      const my = ++run.current;
      const map: { c: number; k: number }[] = [];
      ft.chunks.forEach((ch, c) => ch.steps.forEach((_, k) => map.push({ c, k })));
      const buf = new Uint8Array(1024);
      let level = 0;
      const playChunk = (c: number, startStep: number) => {
        if (my !== run.current) return;
        const ch = ft.chunks[c];
        if (!ch) return setPlaying(false);
        const a = new Audio(ch.audio);
        audio.current?.pause();
        audio.current = a;
        a.playbackRate = r;
        ampDriven.current = false;
        if (ctx.current && analyser.current) {
          try {
            source.current?.disconnect();
            source.current = ctx.current.createMediaElementSource(a);
            source.current.connect(analyser.current);
            gain.current!.gain.value = volRef.current;
            ampDriven.current = true;
          } catch {
            a.volume = volRef.current;
          }
        } else a.volume = volRef.current;
        const first = map.findIndex((m) => m.c === c);
        a.currentTime = ch.steps[startStep - first]?.words[0]?.[0] ?? 0;
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
          if (ampDriven.current && analyser.current) {
            analyser.current.getByteTimeDomainData(buf);
            let sum = 0;
            for (let i = 0; i < buf.length; i++) {
              const v = (buf[i] - 128) / 128;
              sum += v * v;
            }
            const target = Math.min(1, Math.max(0, (Math.sqrt(sum / buf.length) - 0.015) * 7));
            level += (target - level) * (target > level ? 0.55 : 0.28);
            mouth.set(level);
          }
          raf.current = requestAnimationFrame(loop);
        };
        raf.current = requestAnimationFrame(loop);
      };
      playChunk(map[from]?.c ?? 0, from);
    },
    [mouth],
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
    wakeAudio();
    setOpen(true);
    const { tour, m } = await ensureTour();
    startFrom(si >= tour.length - 1 ? 0 : si, m, rate);
  };
  const pause = () => {
    stopAll();
    setPlaying(false);
  };
  const seek = (to: number) => {
    const i = Math.max(0, Math.min(steps.length - 1, to));
    setSi(i);
    setWi(0);
    if (playing && mode) {
      wakeAudio();
      startFrom(i, mode, rate);
    }
  };
  const close = () => {
    pause();
    setOpen(false);
    setSi(0);
    setWi(0);
    setPlaced(false);
    placedRef.current = false;
    lastStep.current = -1;
    unpaint();
  };
  const cycleRate = () => {
    const r = SPEEDS[(SPEEDS.indexOf(rate) + 1) % SPEEDS.length];
    setRate(r);
    if (playing && mode) startFrom(si, mode, r);
  };

  // seekbar: click or drag anywhere on it
  const bar = useRef<HTMLDivElement>(null);
  const stepAt = (clientX: number) => {
    const r = bar.current!.getBoundingClientRect();
    const f = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    return Math.round(f * (steps.length - 1));
  };

  useEffect(
    () => () => {
      stopAll();
      unpaint();
      if (walkTimer.current) clearTimeout(walkTimer.current);
      void ctx.current?.close();
    },
    [stopAll],
  );

  if (!title) return null;
  const shownStep = scrub ?? si;
  const progress = steps.length > 1 ? shownStep / (steps.length - 1) : 0;
  const reading = step?.kind === "read";
  const VolIcon = vol === 0 ? VolumeX : vol < 0.5 ? Volume1 : Volume2;

  return (
    <>
      {/* the card under the chapter title: the Chapter Explainer cover (Modules 1–4), or a simple card (Module 5) */}
      {!chapter.startsWith("5.") ? (
        <div ref={card} className="pointer-events-auto mt-5 w-full max-w-[40rem]">
          <ExplainerCard chapter={chapter} playing={playing} open={open} onToggle={playing ? pause : play} />
        </div>
      ) : (
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
      )}

      {typeof document !== "undefined" &&
        createPortal(
          <AnimatePresence>
            {open && placed && step && (
              <motion.div key="guide" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* Laddoo on the page, beside the line being read */}
                <motion.div className="pointer-events-none absolute left-0 top-0 z-[58]" style={{ x, y }} aria-hidden>
                  <motion.div initial={{ scale: 0.4, y: 20 }} animate={{ scale: 1, y: 0 }} transition={{ type: "spring", stiffness: 260, damping: 16 }}>
                    <Mascot mood={gestureFor(step, wi)} walking={walking} size={sizeOf()} flip={flip} mouth={playing ? mouth : undefined} look={flip ? -look : look} />
                  </motion.div>
                </motion.div>
                {/* the explanation bubble */}
                <AnimatePresence>
                  {!reading && !walking && bubble && (
                    <motion.div
                      key={step.key}
                      initial={{ opacity: 0, scale: 0.85, y: 8 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ type: "spring", stiffness: 300, damping: 22 }}
                      className="absolute z-[59] rounded-2xl border-2 border-cocoa bg-white p-3 text-[0.98rem] font-semibold leading-snug shadow-[3px_3px_0_0_#2f1c1a]"
                      style={{ left: bubble.x, top: bubble.y, width: bubble.w }}
                      role="status"
                    >
                      <div className="mb-1 text-[0.7rem] font-extrabold uppercase tracking-[0.12em] text-orange">Laddoo explains</div>
                      {step.words.map((w, i) => (
                        <span key={i}>
                          <span className={`rounded px-0.5 transition-colors duration-150 ${i === wi ? "bg-haldi text-cocoa" : i < wi ? "text-cocoa" : "text-cocoa/45"}`}>{w.w}</span>{" "}
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
                className="fixed inset-x-2 bottom-[92px] z-[60] mx-auto max-w-xl rounded-[20px] border-2 border-cocoa bg-cream px-2.5 pb-2 pt-1 shadow-[4px_4px_0_0_#2f1c1a] sm:bottom-4 sm:w-[min(36rem,calc(100vw-280px))]"
              >
                {/* seekbar: click or drag to jump to any part of the chapter */}
                <div
                  ref={bar}
                  role="slider"
                  tabIndex={0}
                  aria-label="Seek in the audio chapter"
                  aria-valuemin={1}
                  aria-valuemax={Math.max(1, steps.length)}
                  aria-valuenow={shownStep + 1}
                  aria-valuetext={`Part ${shownStep + 1} of ${steps.length}`}
                  className="group relative flex h-5 cursor-pointer touch-none items-center"
                  onPointerDown={(e) => {
                    if (!steps.length) return;
                    e.currentTarget.setPointerCapture(e.pointerId);
                    setScrub(stepAt(e.clientX));
                  }}
                  onPointerMove={(e) => {
                    if (scrub !== null) setScrub(stepAt(e.clientX));
                  }}
                  onPointerUp={(e) => {
                    if (scrub === null) return;
                    const to = stepAt(e.clientX);
                    setScrub(null);
                    seek(to);
                  }}
                  onPointerCancel={() => setScrub(null)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowRight") seek(si + 1);
                    else if (e.key === "ArrowLeft") seek(si - 1);
                    else return;
                    e.preventDefault();
                  }}
                >
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-cocoa/15 transition-[height] group-hover:h-2">
                    <div className={`h-full rounded-full bg-gradient-to-r from-orange to-haldi ${scrub === null ? "transition-[width] duration-300" : ""}`} style={{ width: `${progress * 100}%` }} />
                  </div>
                  <div className="pointer-events-none absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-cocoa bg-white shadow" style={{ left: `${progress * 100}%` }} />
                </div>
                <div className="flex items-center gap-1.5">
                  <button onClick={playing ? pause : play} aria-label={playing ? "Pause" : "Play"} className="grid size-11 shrink-0 place-items-center rounded-full border-2 border-cocoa bg-orange text-white">
                    {playing ? <Pause className="size-5 fill-white" /> : <Play className="ml-0.5 size-5 fill-white" />}
                  </button>
                  <div className="min-w-0 flex-1 px-1">
                    <div className="truncate text-[0.72rem] font-extrabold uppercase tracking-[0.1em] text-orange">{reading ? "Reading" : "Explaining"}</div>
                    <div className="truncate text-[0.85rem] font-bold text-cocoa">{title}</div>
                  </div>
                  <button onClick={cycleRate} aria-label="Reading speed" className="h-9 shrink-0 rounded-full bg-white px-2.5 text-[0.82rem] font-bold text-cocoa hover:bg-peach">
                    {rate}×
                  </button>
                  <div className="flex shrink-0 items-center gap-1 rounded-full bg-white pl-1 pr-2">
                    <button onClick={() => setMuted((m) => !m)} aria-label={vol === 0 ? "Unmute" : "Mute"} className="grid size-8 place-items-center rounded-full text-cocoa hover:bg-peach">
                      <VolIcon className="size-4" />
                    </button>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={vol}
                      onChange={(e) => {
                        setVolume(Number(e.target.value));
                        setMuted(false);
                      }}
                      aria-label="Volume"
                      className="w-12 accent-[#FF5C00] sm:w-20"
                    />
                  </div>
                  <button onClick={close} aria-label="Close the audio chapter" className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-cocoa hover:bg-peach">
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
