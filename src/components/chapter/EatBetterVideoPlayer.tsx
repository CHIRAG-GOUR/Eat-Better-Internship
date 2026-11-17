"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Play, Pause, Volume2, Volume1, VolumeX, Maximize, Minimize, RotateCcw, RotateCw, LoaderCircle } from "lucide-react";
import { getMediaUrl } from "@/lib/media";
import { SeekBar, formatTime } from "./SeekBar";

type Props = {
  h264: string;
  av1?: string;
  poster?: string;
  title: string;
  caption?: string;
  portrait?: boolean;
  fill?: boolean;
  badge?: string;
};

const RATES = [1, 1.25, 1.5, 2];

export function EatBetterVideoPlayer({ h264, av1, poster, title, caption, portrait = false, fill = false, badge }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastPointer = useRef<string>("mouse");
  const hideTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedbackTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [started, setStarted] = useState(false);
  const [ended, setEnded] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [feedback, setFeedback] = useState<"play" | "pause" | "back" | "fwd" | null>(null);

  const flash = (f: NonNullable<typeof feedback>) => {
    setFeedback(f);
    if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    feedbackTimer.current = setTimeout(() => setFeedback(null), 600);
  };

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideTimer.current) clearTimeout(hideTimer.current);
    if (videoRef.current && !videoRef.current.paused) hideTimer.current = setTimeout(() => setShowControls(false), 2600);
  }, []);

  useEffect(
    () => () => {
      if (hideTimer.current) clearTimeout(hideTimer.current);
      if (feedbackTimer.current) clearTimeout(feedbackTimer.current);
    },
    [],
  );

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video
        .play()
        .then(() => {
          flash("play");
          resetHideTimer();
        })
        .catch(() => {});
    } else {
      video.pause();
      flash("pause");
      setShowControls(true);
    }
  }, [resetHideTimer]);

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.muted || video.volume === 0) {
      video.muted = false;
      if (video.volume === 0) video.volume = 1;
      setVolume(video.volume);
      setIsMuted(false);
    } else {
      video.muted = true;
      setIsMuted(true);
    }
    resetHideTimer();
  };

  const changeVolume = (val: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.volume = val;
    video.muted = val === 0;
    setVolume(val);
    setIsMuted(val === 0);
    resetHideTimer();
  };

  const skipTime = (delta: number) => {
    const video = videoRef.current;
    if (!video || !Number.isFinite(video.duration)) return;
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + delta));
    flash(delta < 0 ? "back" : "fwd");
    resetHideTimer();
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;
    try {
      if (!document.fullscreenElement) await container.requestFullscreen();
      else await document.exitFullscreen();
    } catch {
      // fullscreen not allowed here (e.g. inside a restricted frame)
    }
  };

  const cyclePlaybackRate = () => {
    const next = RATES[(RATES.indexOf(playbackRate) + 1) % RATES.length];
    if (videoRef.current) videoRef.current.playbackRate = next;
    setPlaybackRate(next);
    resetHideTimer();
  };

  // the video may load its metadata before React attaches listeners (server-rendered element), so read it once on mount
  useEffect(() => {
    const v = videoRef.current;
    if (v && Number.isFinite(v.duration) && v.duration > 0) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync with the already-loaded element
      setDuration(v.duration);
      setCurrentTime(v.currentTime);
    }
  }, []);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(document.fullscreenElement === containerRef.current);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement) return;
    const k = e.key.toLowerCase();
    if (k === " " || k === "k") togglePlay();
    else if (k === "m") toggleMute();
    else if (k === "f") toggleFullscreen();
    else if (k === "arrowleft" || k === "j") skipTime(k === "j" ? -10 : -5);
    else if (k === "arrowright" || k === "l") skipTime(k === "l" ? 10 : 5);
    else return;
    e.preventDefault();
  };

  // on touch screens the first tap only reveals the controls, so viewers do not pause by accident
  const onVideoClick = () => {
    if (lastPointer.current !== "mouse" && isPlaying && !showControls) {
      resetHideTimer();
      return;
    }
    togglePlay();
  };

  const frameClass = portrait
    ? fill
      ? "aspect-[9/16] w-full"
      : "mx-auto aspect-[9/16] max-h-[78vh] w-auto max-w-full"
    : "aspect-video w-full";
  const controlsVisible = showControls || !isPlaying;
  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;
  const volPct = (isMuted ? 0 : volume) * 100;

  return (
    <figure className="w-full">
      <motion.div
        ref={containerRef}
        tabIndex={0}
        aria-label={`Video player: ${title}`}
        onKeyDown={handleKeyDown}
        onPointerMove={(e) => e.pointerType === "mouse" && resetHideTimer()}
        onPointerDown={(e) => {
          lastPointer.current = e.pointerType;
        }}
        onMouseLeave={() => isPlaying && setShowControls(false)}
        initial={{ opacity: 0, scale: 0.98, y: 16 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, margin: "-10% 0px" }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
        className={`group relative overflow-hidden rounded-[24px] border-2 border-cocoa bg-[#150d0c] shadow-[4px_4px_0_0_#ff5c00] outline-none select-none focus-visible:ring-4 focus-visible:ring-haldi ${frameClass} ${
          controlsVisible ? "" : "cursor-none"
        }`}
      >
        <video
          ref={videoRef}
          onClick={onVideoClick}
          onDoubleClick={toggleFullscreen}
          className="size-full cursor-pointer bg-black object-contain"
          playsInline
          preload="metadata"
          poster={poster}
          title={title}
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onLoadedMetadata={(e) => setDuration(e.currentTarget.duration)}
          onDurationChange={(e) => setDuration(e.currentTarget.duration)}
          onPlay={() => {
            setIsPlaying(true);
            setStarted(true);
            setEnded(false);
          }}
          onPause={() => setIsPlaying(false)}
          onEnded={() => {
            setEnded(true);
            setShowControls(true);
          }}
          onWaiting={() => setWaiting(true)}
          onPlaying={() => setWaiting(false)}
          onCanPlay={() => setWaiting(false)}
          onSeeked={() => setWaiting(false)}
        >
          {av1 && <source src={getMediaUrl(av1)} type='video/mp4; codecs="av01.0.08M.08, mp4a.40.2"' />}
          <source src={getMediaUrl(h264)} type="video/mp4" />
        </video>

        {/* title bar */}
        <div
          className={`pointer-events-none absolute inset-x-0 top-0 z-20 flex items-center gap-2 bg-gradient-to-b from-black/80 via-black/30 to-transparent p-3.5 transition-opacity duration-300 ${
            controlsVisible ? "opacity-100" : "opacity-0"
          }`}
        >
          <span className="shrink-0 rounded-full bg-orange px-2.5 py-0.5 text-[0.75rem] font-extrabold uppercase tracking-wide text-white shadow-sm">
            {badge ?? (portrait ? "Eat Better Shorts" : "Eat Better Co")}
          </span>
          <span className="truncate text-[0.88rem] font-bold text-cream drop-shadow sm:max-w-md">{title}</span>
        </div>

        {/* big centre button: play before starting, replay at the end */}
        {(!isPlaying || ended) && !waiting && (
          <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <motion.button
              type="button"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={togglePlay}
              aria-label={ended ? `Replay ${title}` : `Play ${title}`}
              className={`pointer-events-auto grid place-items-center rounded-full border-2 border-cocoa bg-orange text-white shadow-[0_12px_36px_rgba(255,92,0,0.65)] ${
                started && !ended ? "size-16" : "size-20"
              }`}
            >
              {ended ? <RotateCcw className="size-8" strokeWidth={2.6} /> : <Play className={`ml-1 fill-white ${started ? "size-7" : "size-9"}`} />}
            </motion.button>
          </div>
        )}

        {/* buffering */}
        {waiting && isPlaying && (
          <div className="pointer-events-none absolute inset-0 grid place-items-center" role="status" aria-label="Loading video">
            <div className="grid size-16 place-items-center rounded-full bg-black/45 backdrop-blur-sm">
              <LoaderCircle className="size-9 animate-spin text-haldi" />
            </div>
          </div>
        )}

        {/* tap / key feedback */}
        <AnimatePresence>
          {feedback && (
            <motion.div
              key={feedback}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1.05, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className={`pointer-events-none absolute inset-y-0 flex items-center ${
                feedback === "back" ? "left-[12%]" : feedback === "fwd" ? "right-[12%]" : "inset-x-0 justify-center"
              }`}
            >
              <div className="grid size-16 place-items-center rounded-full border border-white/20 bg-cocoa/80 text-white backdrop-blur-md">
                {feedback === "play" && <Play className="ml-1 size-8 fill-white" />}
                {feedback === "pause" && <Pause className="size-8 fill-white" />}
                {feedback === "back" && <RotateCcw className="size-7" />}
                {feedback === "fwd" && <RotateCw className="size-7" />}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* control bar */}
        <div
          className={`absolute inset-x-0 bottom-0 z-20 flex flex-col justify-end bg-gradient-to-t from-black/90 via-black/50 to-transparent px-2.5 pb-2 pt-8 transition-opacity duration-300 sm:px-3.5 sm:pb-2.5 ${
            controlsVisible ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          <SeekBar video={videoRef} label={`Seek: ${title}`} onInteract={resetHideTimer} />

          <div className="mt-1 flex items-center justify-between gap-2 text-xs text-white sm:text-sm">
            <div className="flex min-w-0 items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause" : ended ? "Replay" : "Play"}
                className="grid size-9 place-items-center rounded-xl bg-white/10 transition-colors hover:bg-orange"
              >
                {isPlaying ? <Pause className="size-5 fill-current" /> : ended ? <RotateCcw className="size-5" /> : <Play className="ml-0.5 size-5 fill-current" />}
              </button>
              <button
                type="button"
                onClick={() => skipTime(-10)}
                aria-label="Back 10 seconds"
                title="Back 10 s (J)"
                className="relative hidden size-8 place-items-center rounded-lg bg-white/10 transition-colors hover:bg-white/20 sm:grid"
              >
                <RotateCcw className="size-4" />
                <span className="absolute text-[0.5rem] font-extrabold">10</span>
              </button>
              <button
                type="button"
                onClick={() => skipTime(10)}
                aria-label="Forward 10 seconds"
                title="Forward 10 s (L)"
                className="relative hidden size-8 place-items-center rounded-lg bg-white/10 transition-colors hover:bg-white/20 sm:grid"
              >
                <RotateCw className="size-4" />
                <span className="absolute text-[0.5rem] font-extrabold">10</span>
              </button>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={isMuted ? "Unmute" : "Mute"}
                  className="grid size-8 place-items-center rounded-lg bg-white/10 transition-colors hover:bg-white/20"
                >
                  <VolumeIcon className={`size-4 ${isMuted || volume === 0 ? "text-orange" : ""}`} />
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={(e) => changeVolume(parseFloat(e.target.value))}
                  aria-label="Volume"
                  className="hidden h-1.5 w-16 cursor-pointer appearance-none rounded-full md:block [&::-moz-range-thumb]:size-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-orange [&::-moz-range-thumb]:bg-white [&::-webkit-slider-thumb]:size-3 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-orange [&::-webkit-slider-thumb]:bg-white"
                  style={{ background: `linear-gradient(to right, #ff5c00 ${volPct}%, rgba(255,255,255,0.25) ${volPct}%)` }}
                />
              </div>

              <span className="ml-1 whitespace-nowrap font-mono text-[0.75rem] font-semibold tabular-nums text-cream/90 sm:text-[0.82rem]">
                {formatTime(currentTime)} <span className="text-cream/50">/ {formatTime(duration)}</span>
              </span>
            </div>

            <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={cyclePlaybackRate}
                aria-label={`Playback speed ${playbackRate}x`}
                title="Playback speed"
                className={`rounded-lg border px-2 py-1 text-[0.75rem] font-bold transition-colors ${
                  playbackRate === 1 ? "border-white/20 bg-white/10 text-cream hover:bg-white/20" : "border-haldi bg-haldi text-cocoa"
                }`}
              >
                {playbackRate}x
              </button>
              <button
                type="button"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                title="Fullscreen (F)"
                className="grid size-8 place-items-center rounded-lg bg-white/10 transition-colors hover:bg-white/20"
              >
                {isFullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {caption && <figcaption className="mt-3 text-[0.92rem] leading-snug text-cocoa-2">{caption}</figcaption>}
    </figure>
  );
}
