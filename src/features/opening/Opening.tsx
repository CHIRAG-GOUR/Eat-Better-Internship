"use client";
/* eslint-disable react-hooks/immutability -- three.js objects, textures and the camera rig are updated in place by design */

import dynamic from "next/dynamic";
import { useCallback, useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowRight, ChevronDown, Play, Sparkles, Volume2, VolumeX } from "lucide-react";
import { FullscreenToggle } from "@/components/chapter/FullscreenToggle";
import { getMediaUrl } from "@/lib/media";
import { useMediaQuery } from "@/lib/useClient";
import { MODULES } from "./modules";
import { ENTRY_S, FILM_PLAY_AT_S, type Phase, type Rig } from "./Scene";

const Scene = dynamic(() => import("./Scene"), { ssr: false });

/**
 * The internship's front door. The student arrives outside the Eat Better warehouse, at the door. The first scroll
 * (or swipe, tap or key) starts the intro: the camera walks in and the opening film (real chapter and activity footage)
 * plays on the warehouse screen with sound on (a button turns it off). The page cannot scroll while it plays.
 * The film ends and holds on the title. A scroll, swipe or tap on the scene then flies the camera out through the
 * loading bay and along the path to the five worlds, and the page becomes a scrollable overview of the modules.
 * Chapters and activities are not links here (students reach them through their own chapter links): tapping one shows
 * a line about it.
 */
export function Opening() {
  const compact = useMediaQuery("(max-width: 820px), (pointer: coarse)");
  const rig = useRef<Rig>({ phase: "loading", phaseAt: 0, scroll: 0 });
  const [phase, setPhaseState] = useState<Phase>("loading");
  const [video, setVideo] = useState<HTMLVideoElement | null>(null);
  const [videoReady, setVideoReady] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [live, setLive] = useState(false); // the film's first frame is on screen
  const [muted, setMuted] = useState(false); // sound is on by default; the button turns it off
  const [soundBlocked, setSoundBlocked] = useState(false); // the browser refused sound (no tap or key yet): offer a tap
  const [blocked, setBlocked] = useState(false); // the browser refused to play at all: ask for a tap
  const [buffered, setBuffered] = useState(0);
  const [active, setActive] = useState(-1);
  const filmStarted = useRef(false); // the sound unlock plays the film for an instant; only the real start counts
  const [openInfo, setOpenInfo] = useState<string | null>(null); // the chapter or activity whose info line is showing

  const setPhase = useCallback((p: Phase) => {
    rig.current.phase = p;
    rig.current.phaseAt = performance.now();
    setPhaseState(p);
  }, []);

  /* ── the film: preload fully before anything starts, so it never begins on a black frame ── */
  useEffect(() => {
    const v = document.createElement("video");
    v.muted = true;
    v.playsInline = true;
    v.setAttribute("playsinline", "");
    v.preload = "auto";
    v.crossOrigin = "anonymous";
    const file = compact ? "/intro/film-720.mp4" : "/intro/film.mp4";
    let fellBack = false;
    v.src = getMediaUrl(file);
    const onError = () => {
      if (fellBack) return;
      fellBack = true;
      v.src = file; // the copy on this site if the media host is unavailable
      v.load();
    };
    const onProgress = () => {
      if (v.duration && v.buffered.length) setBuffered(Math.min(1, v.buffered.end(v.buffered.length - 1) / v.duration));
    };
    const ready = () => setVideoReady(true);
    v.addEventListener("error", onError);
    v.addEventListener("progress", onProgress);
    v.addEventListener("canplaythrough", ready, { once: true });
    // slow connections: start once most of the film is in, rather than waiting forever
    const slow = setInterval(() => {
      onProgress();
      if (v.readyState >= 3 && v.duration && v.buffered.length && v.buffered.end(v.buffered.length - 1) / v.duration > 0.6) ready();
    }, 500);
    v.load();
    (window as unknown as { __ebFilm?: HTMLVideoElement }).__ebFilm = v; // for checks and the QA scripts
    const id = setTimeout(() => setVideo(v), 0);
    return () => {
      clearTimeout(id);
      clearInterval(slow);
      v.pause();
      v.removeAttribute("src");
      v.load();
    };
  }, [compact]);

  // play with sound; if the browser refuses sound, play muted and offer "Tap for sound"; if it refuses even that, ask for a tap
  const startFilm = useCallback(() => {
    if (!video) return;
    filmStarted.current = true;
    video.play().then(
      () => setBlocked(false),
      () => {
        if (!video.muted) {
          video.muted = true;
          setMuted(true);
          setSoundBlocked(true);
          video.play().then(
            () => setBlocked(false),
            () => setBlocked(true),
          );
        } else setBlocked(true);
      },
    );
  }, [video]);

  // when the film and the scene are both ready: wait at the door for the first scroll
  useEffect(() => {
    if (phase !== "loading" || !videoReady || !sceneReady || !video) return;
    const t0 = setTimeout(() => setPhase("ready"), 250);
    return () => clearTimeout(t0);
  }, [phase, videoReady, sceneReady, video, setPhase]);

  /** the first scroll / swipe / tap / key: unlock sound inside the gesture, then walk in */
  const begin = useCallback(() => {
    if (rig.current.phase !== "ready" || !video) return;
    setPhase("entry");
    video.muted = false;
    setMuted(false);
    // phones only allow sound for media started inside the gesture: start and pause at once so the film may play later
    video.play().then(
      () => {
        video.pause();
        video.currentTime = 0;
      },
      () => {
        video.muted = true;
        setMuted(true);
        setSoundBlocked(true);
      },
    );
  }, [setPhase, video]);

  useEffect(() => {
    if (!video) return;
    const onFrame = () => {
      if (filmStarted.current) setLive(true);
    };
    const onEnded = () => {
      video.pause();
      setPhase("hold"); // the last frame (the title) stays on the screen
    };
    video.addEventListener("playing", onFrame);
    video.addEventListener("ended", onEnded);
    return () => {
      video.removeEventListener("playing", onFrame);
      video.removeEventListener("ended", onEnded);
    };
  }, [video, setPhase]);

  // the camera's entry flight hands over to the film's clock; the film starts as the screen comes into view
  useEffect(() => {
    if (phase !== "entry") return;
    const play = setTimeout(startFilm, FILM_PLAY_AT_S * 1000);
    const id = setTimeout(() => setPhase("film"), ENTRY_S * 1000);
    return () => {
      clearTimeout(play);
      clearTimeout(id);
    };
  }, [phase, setPhase, startFilm]);

  /* ── scroll lock while the opening plays; on the title, a scroll / swipe / key continues ── */
  const continueOn = useCallback(() => {
    if (rig.current.phase === "ready") return begin();
    if (rig.current.phase !== "hold") return;
    setPhase("travel");
    video?.pause();
  }, [setPhase, video, begin]);

  useEffect(() => {
    if (phase === "explore") return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    window.scrollTo(0, 0);
    let touchY: number | null = null;
    const wheel = (e: WheelEvent) => {
      e.preventDefault();
      if (e.deltaY > 4) continueOn();
    };
    const tStart = (e: TouchEvent) => {
      touchY = e.touches[0]?.clientY ?? null;
    };
    const tMove = (e: TouchEvent) => {
      e.preventDefault();
      if (touchY !== null && touchY - (e.touches[0]?.clientY ?? touchY) > 30) continueOn();
    };
    const key = (e: KeyboardEvent) => {
      if ([" ", "ArrowDown", "PageDown", "End", "Enter"].includes(e.key)) {
        if ((e.target as HTMLElement)?.closest?.("button, a")) return;
        e.preventDefault();
        continueOn();
      }
    };
    window.addEventListener("wheel", wheel, { passive: false });
    window.addEventListener("touchstart", tStart, { passive: true });
    window.addEventListener("touchmove", tMove, { passive: false });
    window.addEventListener("keydown", key);
    return () => {
      html.style.overflow = prev;
      window.removeEventListener("wheel", wheel);
      window.removeEventListener("touchstart", tStart);
      window.removeEventListener("touchmove", tMove);
      window.removeEventListener("keydown", key);
    };
  }, [phase, continueOn]);

  /* ── explore: the page scroll drives the camera between the overview and the worlds ── */
  useEffect(() => {
    if (phase !== "explore") return;
    // sections can be taller than the screen (long chapter lists on phones): measure where each one really starts
    const on = () => {
      const tops = [...document.querySelectorAll<HTMLElement>("main > section")].map((el) => el.offsetTop);
      const y = window.scrollY;
      let i = 0;
      while (i < tops.length - 1 && y >= tops[i + 1]) i++;
      const next = tops[i + 1] ?? tops[i] + window.innerHeight;
      const s = i + Math.min(1, Math.max(0, (y - tops[i]) / Math.max(1, next - tops[i])));
      rig.current.scroll = s;
      setActive(Math.round(s) - 1);
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, [phase]);

  const goTo = useCallback((i: number) => {
    const el = document.querySelectorAll<HTMLElement>("main > section")[i + 1];
    if (el) window.scrollTo({ top: el.offsetTop, behavior: "smooth" });
  }, []);

  const toggleSound = () => {
    if (!video) return;
    video.muted = !video.muted;
    setMuted(video.muted);
    setSoundBlocked(false);
  };

  const showControls = phase === "ready" || phase === "entry" || phase === "film" || phase === "hold";
  const exploring = phase === "explore";

  return (
    <div className="relative bg-[#F3E3CF]">
      {/* the 3D world, fixed behind everything; on the title, a tap on it continues */}
      <div className="fixed inset-0" onClick={continueOn} role="img" aria-label="The Eat Better warehouse, where the opening film plays on a big screen, and the path to the five worlds of the internship">
        <Scene rig={rig} video={video} live={live} compact={compact} active={active} onReady={() => setSceneReady(true)} onTravelDone={() => setPhase("explore")} onPick={exploring ? goTo : undefined} />
      </div>

      <FullscreenToggle />

      {/* loading: the same warm colours as the warehouse, until the film is ready */}
      <AnimatePresence>
        {phase === "loading" && (
          <motion.div key="load" initial={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.9 }} className="fixed inset-0 z-40 grid place-items-center bg-[#F6E7D6]">
            <div className="flex flex-col items-center gap-6 px-6">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/eat-better-logo.svg" alt="Eat Better Co" className="w-56 sm:w-72" />
              <div className="h-1.5 w-56 overflow-hidden rounded-full bg-cocoa/10 sm:w-72">
                <motion.div className="h-full rounded-full bg-orange" animate={{ width: `${Math.max(6, (videoReady ? 1 : buffered) * 100)}%` }} transition={{ ease: "easeOut" }} />
              </div>
              <div className="text-[0.85rem] font-semibold text-cocoa-2">Opening the warehouse…</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* sound: off by default (autoplay), one tap turns it on; never moves the story on */}
      <AnimatePresence>
        {showControls && (
          <motion.button
            key="sound"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            onClick={(e) => {
              e.stopPropagation();
              toggleSound();
            }}
            aria-label={muted ? "Turn sound on" : "Turn sound off"}
            aria-pressed={!muted}
            className={`fixed z-50 flex h-12 items-center gap-2 rounded-full border border-cocoa px-4 text-[0.85rem] font-bold shadow-[2px_2px_0_0_#2f1c1a] transition-colors ${soundBlocked ? "bg-orange text-white hover:bg-[#e04f00]" : "bg-cream text-cocoa hover:bg-orange hover:text-white"}`}
            style={{ bottom: "max(16px, env(safe-area-inset-bottom))", right: "max(16px, env(safe-area-inset-right))" }}
          >
            {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
            <span className={soundBlocked ? "" : "hidden sm:inline"}>{soundBlocked ? "Tap for sound" : muted ? "Sound off" : "Sound on"}</span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* autoplay refused (some phones in power-saving mode): one tap starts the film */}
      {blocked && phase !== "hold" && (
        <button
          onClick={(e) => {
            e.stopPropagation();
            startFilm();
          }}
          className="fixed left-1/2 top-1/2 z-50 flex -translate-x-1/2 -translate-y-1/2 items-center gap-2 rounded-full border-2 border-cocoa bg-orange px-6 py-3 font-bold text-white shadow-[3px_3px_0_0_#2f1c1a]"
        >
          <Play className="size-5 fill-white" /> Play the film
        </button>
      )}

      {/* at the door: the first scroll starts the intro */}
      <AnimatePresence>
        {phase === "ready" && (
          <motion.button
            key="begin"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.6 }}
            onClick={(e) => {
              e.stopPropagation();
              begin();
            }}
            className="fixed left-1/2 z-40 flex -translate-x-1/2 flex-col items-center gap-1 rounded-full px-5 py-2 text-[0.95rem] font-bold text-cocoa"
            style={{ bottom: "max(26px, env(safe-area-inset-bottom))" }}
          >
            <span className="rounded-full border-2 border-cocoa bg-orange px-5 py-2 text-white shadow-[3px_3px_0_0_#2f1c1a]">{compact ? "Swipe up or tap to enter" : "Scroll to enter the warehouse"}</span>
            <motion.span animate={{ y: [0, 6, 0] }} transition={{ duration: 1.4, repeat: Infinity }}>
              <ChevronDown className="size-6" />
            </motion.span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* on the title: how to continue */}
      <AnimatePresence>
        {phase === "hold" && (
          <motion.button
            key="hint"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ delay: 0.8, duration: 0.6 }}
            onClick={(e) => {
              e.stopPropagation();
              continueOn();
            }}
            className="fixed left-1/2 z-40 flex -translate-x-1/2 flex-col items-center gap-1 rounded-full px-5 py-2 text-[0.9rem] font-bold text-cocoa"
            style={{ bottom: "max(22px, env(safe-area-inset-bottom))" }}
          >
            <span className="rounded-full bg-cream/90 px-4 py-1.5 shadow-[2px_2px_0_0_#2f1c1a] ring-1 ring-cocoa">{compact ? "Swipe up or tap to explore" : "Scroll or click to explore"}</span>
            <motion.span animate={{ y: [0, 6, 0] }} transition={{ duration: 1.4, repeat: Infinity }}>
              <ChevronDown className="size-6" />
            </motion.span>
          </motion.button>
        )}
      </AnimatePresence>

      {/* explore: the overview and one section per world; the camera follows the scroll */}
      {exploring && (
        <>
          <nav aria-label="Modules" className="fixed z-40 flex gap-1.5 max-sm:left-1/2 max-sm:top-[max(18px,env(safe-area-inset-top))] max-sm:-translate-x-1/2 sm:left-5 sm:top-1/2 sm:-translate-y-1/2 sm:flex-col">
            {MODULES.map((m, i) => (
              <button
                key={m.n}
                onClick={() => goTo(i)}
                aria-current={active === i ? "step" : undefined}
                aria-label={`Module ${m.n} ${m.word}`}
                title={m.word}
                className={`flex items-center gap-2 rounded-full border border-cocoa px-2.5 py-1.5 text-[0.78rem] font-extrabold shadow-[2px_2px_0_0_#2f1c1a] transition-colors ${active === i ? "bg-orange text-white" : "bg-cream/95 text-cocoa hover:bg-peach"}`}
              >
                {m.n}
              </button>
            ))}
          </nav>
          <main className="relative z-10">
            <Section>
              <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ amount: 0.5 }} transition={{ duration: 0.6 }} className="pointer-events-auto max-w-[31rem] rounded-[24px] border-2 border-cocoa bg-cream/95 p-5 shadow-[4px_4px_0_0_#2f1c1a] backdrop-blur sm:p-6">
                <div className="text-[0.75rem] font-extrabold uppercase tracking-[0.14em] text-orange">Eat Better Co Internship</div>
                <h1 className="mt-1 font-display text-[1.8rem] font-semibold leading-tight text-cocoa sm:text-[2.2rem]">Five worlds, one journey</h1>
                <p className="mt-2 text-[0.98rem] leading-snug text-cocoa-2">Scroll to walk the path, or pick a world to see its chapters and activity.</p>
                <ol className="mt-4 grid gap-1.5">
                  {MODULES.map((m, i) => (
                    <li key={m.n}>
                      <button onClick={() => goTo(i)} className="group flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left hover:bg-peach">
                        <span className="grid size-9 shrink-0 place-items-center rounded-full font-display text-[0.95rem] font-bold text-white" style={{ background: m.color }}>
                          {m.n}
                        </span>
                        <span className="min-w-0">
                          <span className="block text-[0.72rem] font-extrabold uppercase tracking-[0.12em] text-orange">{m.word}</span>
                          <span className="block truncate text-[0.95rem] font-bold text-cocoa">{m.title}</span>
                        </span>
                        <ArrowRight className="ml-auto size-4 shrink-0 text-cocoa-2 transition-transform group-hover:translate-x-0.5" />
                      </button>
                    </li>
                  ))}
                </ol>
              </motion.div>
            </Section>
            {MODULES.map((m) => (
              <Section key={m.n}>
                <motion.div initial={{ opacity: 0, y: 28 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ amount: 0.45 }} transition={{ duration: 0.6 }} className="pointer-events-auto w-full max-w-[31rem] rounded-[24px] border-2 border-cocoa bg-cream/95 p-5 shadow-[4px_4px_0_0_#2f1c1a] backdrop-blur sm:p-6">
                  <div className="flex items-center gap-3">
                    <span className="grid size-11 shrink-0 place-items-center rounded-full font-display text-[1.1rem] font-bold text-white" style={{ background: m.color }}>
                      {m.n}
                    </span>
                    <div>
                      <div className="text-[0.75rem] font-extrabold uppercase tracking-[0.14em] text-orange">Module {Number(m.n)} · {m.word}</div>
                      <h2 className="font-display text-[1.3rem] font-semibold leading-tight text-cocoa sm:text-[1.5rem]">{m.title}</h2>
                    </div>
                  </div>
                  <p className="mt-2.5 text-[0.95rem] leading-snug text-cocoa-2">{m.summary}</p>
                  <ul className="mt-3 grid gap-1">
                    {m.chapters.map((c) => (
                      <InfoRow key={c.id} id={c.id} open={openInfo === c.id} onToggle={setOpenInfo} label={c.id} title={c.title} info={c.info} />
                    ))}
                    {m.activity && (
                      <InfoRow id={m.activity.href} open={openInfo === m.activity.href} onToggle={setOpenInfo} label={<Sparkles className="size-4" />} kicker="Experiential activity" title={m.activity.title} info={m.activity.info} highlight />
                    )}
                  </ul>
                </motion.div>
              </Section>
            ))}
          </main>
        </>
      )}
    </div>
  );
}

/** a chapter or activity in a module card: tap to show (or hide) a line about it; it does not navigate */
function InfoRow({ id, open, onToggle, label, kicker, title, info, highlight }: { id: string; open: boolean; onToggle: (id: string | null) => void; label: React.ReactNode; kicker?: string; title: string; info: string; highlight?: boolean }) {
  return (
    <li className={highlight ? "mt-1.5" : undefined}>
      <button
        onClick={() => onToggle(open ? null : id)}
        aria-expanded={open}
        className={`group flex w-full items-center gap-3 rounded-xl px-2 py-1.5 text-left transition-colors ${highlight ? "border-2 border-cocoa bg-orange text-white shadow-[2px_2px_0_0_#2f1c1a] hover:bg-[#e04f00]" : open ? "bg-peach" : "hover:bg-peach"}`}
      >
        <span className={`grid w-8 shrink-0 place-items-center font-display text-[0.95rem] font-bold ${highlight ? "text-white" : "text-orange"}`}>{label}</span>
        <span className="min-w-0 flex-1">
          {kicker && <span className="block text-[0.68rem] font-extrabold uppercase tracking-[0.12em] text-white/85">{kicker}</span>}
          <span className={`block text-[0.95rem] font-semibold leading-snug ${highlight ? "font-bold text-white" : "text-cocoa"}`}>{title}</span>
        </span>
        <ChevronDown className={`size-4 shrink-0 transition-transform ${open ? "rotate-180" : ""} ${highlight ? "text-white" : "text-cocoa-2"}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.p initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden px-2 pl-[3.25rem] text-[0.88rem] leading-snug text-cocoa-2">
            <span className="block pb-1.5 pt-1">{info}</span>
          </motion.p>
        )}
      </AnimatePresence>
    </li>
  );
}

/** one screen of the overview: the card sits left on wide screens and at the bottom on phones */
function Section({ children }: { children: React.ReactNode }) {
  return <section className="pointer-events-none flex min-h-[100svh] items-end px-4 pb-6 pt-24 sm:items-center sm:px-24 sm:pb-0 sm:pt-0">{children}</section>;
}
