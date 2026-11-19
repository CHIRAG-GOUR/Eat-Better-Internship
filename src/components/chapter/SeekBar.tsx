"use client";

import { useEffect, useRef, useState, type RefObject } from "react";

export function formatTime(seconds: number) {
  const s = Number.isFinite(seconds) && seconds > 0 ? seconds : 0;
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = Math.floor(s % 60);
  const ss = String(sec).padStart(2, "0");
  return h ? `${h}:${String(m).padStart(2, "0")}:${ss}` : `${m}:${ss}`;
}

/** Moves a video's play head (kept outside the component: the element is owned by the player, not by this bar). */
function setVideoTime(v: HTMLVideoElement, seconds: number) {
  v.currentTime = seconds;
}

type Props = {
  video: RefObject<HTMLVideoElement | null>;
  /** accessible name, e.g. "Seek: Our story" */
  label: string;
  /** "bar": the main player's control bar · "edge": a thin bar along the bottom edge (reel phone card) */
  variant?: "bar" | "edge";
  /** called whenever the viewer interacts, so the player can keep its controls visible */
  onInteract?: () => void;
};

/**
 * Video seek bar: watched part filled in brand orange, buffered part shaded, a thumb at the play head, a time bubble
 * that follows the pointer, drag-to-scrub with mouse or touch, and arrow-key seeking. The fill follows the video every
 * frame while it plays, so it moves smoothly instead of jumping four times a second.
 */
export function SeekBar({ video, label, variant = "bar", onInteract }: Props) {
  const track = useRef<HTMLDivElement>(null);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [buffered, setBuffered] = useState(0);
  const [hover, setHover] = useState<number | null>(null);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const v = video.current;
    if (!v) return;
    let raf = 0;
    const read = () => {
      setTime(v.currentTime);
      if (Number.isFinite(v.duration)) setDuration(v.duration);
      let end = 0;
      for (let i = 0; i < v.buffered.length; i++) if (v.buffered.start(i) <= v.currentTime + 0.5) end = Math.max(end, v.buffered.end(i));
      setBuffered(end);
    };
    const loop = () => {
      read();
      raf = requestAnimationFrame(loop);
    };
    const start = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(loop);
    };
    const stop = () => {
      cancelAnimationFrame(raf);
      read();
    };
    const events = ["loadedmetadata", "durationchange", "progress", "seeked", "timeupdate", "emptied"] as const;
    events.forEach((e) => v.addEventListener(e, read));
    v.addEventListener("playing", start);
    v.addEventListener("pause", stop);
    v.addEventListener("ended", stop);
    v.addEventListener("waiting", stop);
    read();
    if (!v.paused) start();
    return () => {
      cancelAnimationFrame(raf);
      events.forEach((e) => v.removeEventListener(e, read));
      v.removeEventListener("playing", start);
      v.removeEventListener("pause", stop);
      v.removeEventListener("ended", stop);
      v.removeEventListener("waiting", stop);
    };
  }, [video]);

  const fractionAt = (clientX: number) => {
    const r = track.current?.getBoundingClientRect();
    if (!r || r.width === 0) return 0;
    return Math.min(1, Math.max(0, (clientX - r.left) / r.width));
  };
  const seekTo = (seconds: number) => {
    const v = video.current;
    if (!v || !Number.isFinite(v.duration)) return;
    const t = Math.min(v.duration, Math.max(0, seconds));
    setVideoTime(v, t);
    setTime(t);
    onInteract?.();
  };

  const played = duration ? Math.min(1, time / duration) : 0;
  const loaded = duration ? Math.min(1, buffered / duration) : 0;
  const pct = (f: number) => `${(f * 100).toFixed(3)}%`;
  const active = dragging || hover !== null;
  const edge = variant === "edge";
  const bubbleAt = dragging ? played : hover;

  return (
    <div
      role="slider"
      tabIndex={0}
      aria-label={label}
      aria-valuemin={0}
      aria-valuemax={Math.round(duration)}
      aria-valuenow={Math.round(time)}
      aria-valuetext={`${formatTime(time)} of ${formatTime(duration)}`}
      className={`group/seek relative w-full cursor-pointer touch-none outline-none select-none ${edge ? "pt-3 pointer-coarse:pt-4" : "py-2 pointer-coarse:py-3.5"}`}
      onClick={(e) => e.stopPropagation()}
      onPointerDown={(e) => {
        e.stopPropagation();
        e.currentTarget.setPointerCapture(e.pointerId);
        setDragging(true);
        seekTo(fractionAt(e.clientX) * duration);
      }}
      onPointerMove={(e) => {
        const f = fractionAt(e.clientX);
        if (e.pointerType === "mouse" || dragging) setHover(f);
        if (dragging) seekTo(f * duration);
      }}
      onPointerUp={(e) => {
        setDragging(false);
        if (e.pointerType !== "mouse") setHover(null);
        if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId);
      }}
      onPointerCancel={() => {
        setDragging(false);
        setHover(null);
      }}
      onPointerLeave={() => !dragging && setHover(null)}
      onKeyDown={(e) => {
        const step = { ArrowLeft: -5, ArrowRight: 5, ArrowDown: -10, ArrowUp: 10 }[e.key];
        if (step !== undefined) seekTo(time + step);
        else if (e.key === "Home") seekTo(0);
        else if (e.key === "End") seekTo(duration);
        else return;
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      {/* time bubble that follows the pointer (and the play head while dragging) */}
      {bubbleAt !== null && duration > 0 && (
        <span
          className="pointer-events-none absolute bottom-full z-10 mb-1 -translate-x-1/2 rounded-md border border-cocoa bg-cream px-1.5 py-0.5 font-mono text-[0.72rem] font-bold text-cocoa shadow-[1px_1px_0_0_#2f1c1a]"
          style={{ left: `clamp(22px, ${pct(bubbleAt)}, calc(100% - 22px))` }}
        >
          {formatTime(bubbleAt * duration)}
        </span>
      )}

      <div
        ref={track}
        className={`relative w-full overflow-visible rounded-full transition-[height] duration-150 ${edge ? "bg-white/30" : "bg-white/25"} ${
          active ? (edge ? "h-2" : "h-2.5") : edge ? "h-1" : "h-1.5"
        } group-focus-visible/seek:ring-2 group-focus-visible/seek:ring-haldi`}
      >
        {/* buffered */}
        <div className="absolute inset-y-0 left-0 rounded-full bg-white/35" style={{ width: pct(loaded) }} />
        {/* hover preview beyond the play head */}
        {hover !== null && hover > played && <div className="absolute inset-y-0 left-0 rounded-full bg-white/30" style={{ width: pct(hover) }} />}
        {/* watched */}
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-orange to-haldi shadow-[0_0_10px_rgba(255,92,0,0.55)]"
          style={{ width: pct(played) }}
        />
        {/* play head */}
        <span
          className={`absolute top-1/2 rounded-full border-2 border-orange bg-white shadow-[0_1px_6px_rgba(0,0,0,0.45)] transition-transform duration-150 ${
            edge ? "size-3" : "size-3.5"
          } ${active ? "scale-110" : edge ? "scale-0" : "scale-90"}`}
          style={{ left: pct(played), transform: "translate(-50%, -50%)" }}
        />
      </div>
    </div>
  );
}
