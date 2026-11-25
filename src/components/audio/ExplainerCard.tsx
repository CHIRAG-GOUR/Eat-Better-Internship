"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";
import { Headphones, Pause, Play } from "lucide-react";
import { Mascot } from "@/components/celebrate/Mascot";
import { getMediaUrl } from "@/lib/media";

/**
 * The audio chapter's cover: the SkilliZee "Chapter Explainer" loop (the sticker GIF used for audio chapters in the
 * LMS, served as a small looping video: same look, a fraction of the weight) in a 16:9 frame, with a glass player bar
 * along the bottom: Laddoo, the title, how long the recording is, and a big play button. Pressing play starts Laddoo's
 * read-along. With reduced motion, the loop shows as a still.
 */

const VIDEO = "/audio-chapters/explainer/explainer.mp4";
const POSTER = "/audio-chapters/explainer/explainer-poster.jpg";

/** length of the chapter's recording, if it has one ("4 min") */
function useRecordingLength(chapter: string) {
  const [label, setLabel] = useState<string | null>(null);
  useEffect(() => {
    let live = true;
    fetch(`/audio-chapters/${chapter}.json`)
      .then((r) => (r.ok ? r.json() : null))
      .then((j: { chunks?: { steps: { words: [number, number][] }[] }[] } | null) => {
        if (!live || !j?.chunks?.length) return;
        const secs = j.chunks.reduce((n, c) => n + (c.steps.at(-1)?.words.at(-1)?.[1] ?? 0), 0);
        if (secs > 0) setLabel(`${Math.max(1, Math.round(secs / 60))} min`);
      })
      .catch(() => undefined);
    return () => {
      live = false;
    };
  }, [chapter]);
  return label;
}

export function ExplainerCard({ chapter, playing, open, onToggle }: { chapter: string; playing: boolean; open: boolean; onToggle: () => void }) {
  const reduced = useReducedMotion();
  const length = useRecordingLength(chapter);
  const video = useRef<HTMLVideoElement>(null);
  const [src, setSrc] = useState(() => getMediaUrl(VIDEO));

  // the loop plays only while the card is on screen (saves battery and data further down the page)
  useEffect(() => {
    const v = video.current;
    if (!v || reduced) return;
    const io = new IntersectionObserver(([e]) => (e.isIntersecting ? void v.play().catch(() => undefined) : v.pause()), { threshold: 0.2 });
    io.observe(v);
    return () => io.disconnect();
  }, [reduced, src]);

  return (
    <div className="relative w-full overflow-hidden rounded-[22px] border-2 border-cocoa bg-cocoa shadow-[4px_4px_0_0_#2f1c1a]" style={{ aspectRatio: "16 / 9" }}>
      {reduced ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={POSTER} alt="" className="absolute inset-0 size-full object-cover" />
      ) : (
        <video
          ref={video}
          key={src}
          src={src}
          poster={POSTER}
          muted
          loop
          playsInline
          autoPlay
          preload="metadata"
          aria-hidden
          onError={() => setSrc(VIDEO)} // the copy on this site if the media host is unavailable
          className="absolute inset-0 size-full object-cover"
        />
      )}
      {/* a soft shade so the player bar reads on any frame */}
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[42%] bg-gradient-to-t from-[#1d1210]/80 via-[#1d1210]/35 to-transparent" />

      {/* glass player bar */}
      <div className="absolute inset-x-2 bottom-2 flex items-center gap-2.5 rounded-2xl border border-white/30 bg-white/15 p-1.5 pr-2 shadow-[0_8px_24px_rgba(0,0,0,0.25)] backdrop-blur-md sm:inset-x-3 sm:bottom-3 sm:gap-3 sm:p-2 sm:pr-3">
        <div className="hidden shrink-0 rounded-xl bg-white/85 sm:block">
          <Mascot mood={open ? "happy" : "wave"} size={44} />
        </div>
        <div className="min-w-0 flex-1 text-white">
          <div className="flex items-center gap-1.5 text-[0.66rem] font-extrabold uppercase tracking-[0.14em] text-[#FFD7B5] sm:text-[0.72rem]">
            <Headphones className="size-3.5" /> Audio chapter with Laddoo
          </div>
          <div className="truncate font-display text-[0.98rem] font-semibold leading-tight drop-shadow sm:text-[1.15rem]">{playing ? "Laddoo is reading with you" : "Listen and read along"}</div>
        </div>
        {/* sound wave while playing, the length when not */}
        {playing ? (
          <div className="flex h-6 items-end gap-[3px]" aria-hidden>
            {[0, 1, 2, 3].map((i) => (
              <motion.span key={i} className="w-[3px] rounded-full bg-white" animate={reduced ? { height: 12 } : { height: [6, 20, 9, 16, 6] }} transition={{ duration: 0.9 + i * 0.13, repeat: Infinity, ease: "easeInOut" }} />
            ))}
          </div>
        ) : (
          length && <span className="hidden shrink-0 rounded-full bg-black/30 px-2.5 py-1 text-[0.75rem] font-bold text-white sm:inline">{length}</span>
        )}
        <button
          onClick={onToggle}
          aria-label={playing ? "Pause the audio chapter" : "Play the audio chapter"}
          className="relative grid size-11 shrink-0 place-items-center rounded-full border-2 border-white bg-orange text-white shadow-[0_4px_14px_rgba(255,92,0,0.55)] transition-transform hover:scale-105 hover:bg-[#e04f00] sm:size-12"
        >
          {!playing && !reduced && <motion.span className="absolute inset-0 rounded-full border-2 border-white" animate={{ scale: [1, 1.45], opacity: [0.7, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }} aria-hidden />}
          {playing ? <Pause className="size-5 fill-white" /> : <Play className="ml-0.5 size-5 fill-white" />}
        </button>
      </div>
    </div>
  );
}
