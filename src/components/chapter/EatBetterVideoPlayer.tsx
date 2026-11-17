"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Minimize,
  RotateCcw,
  RotateCw,
  Sparkles,
} from "lucide-react";
import { getMediaUrl } from "@/lib/media";

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

export function EatBetterVideoPlayer({
  h264,
  av1,
  poster,
  title,
  caption,
  portrait = false,
  fill = false,
  badge,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [showCenterFeedback, setShowCenterFeedback] = useState<"play" | "pause" | null>(null);

  const hideControlsTimerRef = useRef<NodeJS.Timeout | null>(null);

  const formatTime = (seconds: number) => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const resetHideTimer = useCallback(() => {
    setShowControls(true);
    if (hideControlsTimerRef.current) {
      clearTimeout(hideControlsTimerRef.current);
    }
    if (isPlaying) {
      hideControlsTimerRef.current = setTimeout(() => {
        setShowControls(false);
      }, 2400);
    }
  }, [isPlaying]);

  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video
        .play()
        .then(() => {
          setIsPlaying(true);
          setShowCenterFeedback("play");
          setTimeout(() => setShowCenterFeedback(null), 600);
          resetHideTimer();
        })
        .catch(() => {});
    } else {
      video.pause();
      setIsPlaying(false);
      setShowCenterFeedback("pause");
      setTimeout(() => setShowCenterFeedback(null), 600);
      setShowControls(true);
    }
  }, [resetHideTimer]);

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    if (isMuted) {
      video.muted = false;
      video.volume = volume || 1;
      setIsMuted(false);
    } else {
      video.muted = true;
      setIsMuted(true);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    const video = videoRef.current;
    if (!video) return;
    video.volume = val;
    setVolume(val);
    setIsMuted(val === 0);
  };

  const skipTime = (delta: number) => {
    const video = videoRef.current;
    if (!video) return;
    video.currentTime = Math.max(0, Math.min(video.duration || 0, video.currentTime + delta));
    resetHideTimer();
  };

  const toggleFullscreen = async () => {
    const container = containerRef.current;
    if (!container) return;

    if (!document.fullscreenElement) {
      try {
        await container.requestFullscreen();
        setIsFullscreen(true);
      } catch {
        // Fullscreen request rejected
      }
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const cyclePlaybackRate = () => {
    const rates = [1, 1.25, 1.5, 2];
    const nextIndex = (rates.indexOf(playbackRate) + 1) % rates.length;
    const nextRate = rates[nextIndex];
    if (videoRef.current) {
      videoRef.current.playbackRate = nextRate;
    }
    setPlaybackRate(nextRate);
    resetHideTimer();
  };

  const handleScrub = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    video.currentTime = pos * video.duration;
    setProgress(pos * 100);
    resetHideTimer();
  };

  const onTimeUpdate = () => {
    const video = videoRef.current;
    if (!video || !video.duration) return;
    setCurrentTime(video.currentTime);
    setProgress((video.currentTime / video.duration) * 100);
  };

  const onLoadedMetadata = () => {
    const video = videoRef.current;
    if (video) {
      setDuration(video.duration);
    }
  };

  useEffect(() => {
    const onFsChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  // Keyboard controls
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === " " || e.key === "k") {
      e.preventDefault();
      togglePlay();
    } else if (e.key === "m") {
      e.preventDefault();
      toggleMute();
    } else if (e.key === "f") {
      e.preventDefault();
      toggleFullscreen();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      skipTime(-5);
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      skipTime(5);
    }
  };

  const frameClass = portrait
    ? fill
      ? "aspect-[9/16] w-full"
      : "mx-auto aspect-[9/16] max-h-[78vh] w-auto max-w-full"
    : "aspect-video w-full";

  return (
    <figure className="w-full">
      <motion.div
        ref={containerRef}
        tabIndex={0}
        onKeyDown={handleKeyDown}
        onMouseMove={resetHideTimer}
        onMouseLeave={() => isPlaying && setShowControls(false)}
        initial={{ opacity: 0, scale: 0.98, y: 16 }}
        whileInView={{ opacity: 1, scale: 1, y: 0 }}
        viewport={{ once: true, margin: "-10% 0px" }}
        transition={{ type: "spring", stiffness: 120, damping: 20 }}
        className={`group relative overflow-hidden rounded-[24px] border-2 border-cocoa bg-[#150d0c] shadow-[4px_4px_0_0_#ff5c00] outline-none select-none ${frameClass}`}
      >
        {/* Video Element */}
        <video
          ref={videoRef}
          onClick={togglePlay}
          className="size-full object-contain cursor-pointer bg-black"
          playsInline
          preload="metadata"
          poster={poster}
          title={title}
          onTimeUpdate={onTimeUpdate}
          onLoadedMetadata={onLoadedMetadata}
          onPlay={() => setIsPlaying(true)}
          onPause={() => setIsPlaying(false)}
        >
          {av1 && <source src={getMediaUrl(av1)} type='video/mp4; codecs="av01.0.08M.08, mp4a.40.2"' />}
          <source src={getMediaUrl(h264)} type="video/mp4" />
        </video>

        {/* Top Header Overlay Bar */}
        <div
          className={`absolute top-0 inset-x-0 z-20 flex items-center justify-between p-3.5 bg-gradient-to-b from-black/80 via-black/30 to-transparent transition-opacity duration-300 pointer-events-none ${
            showControls || !isPlaying ? "opacity-100" : "opacity-0"
          }`}
        >
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1 rounded-full bg-orange px-2.5 py-0.5 text-[0.75rem] font-extrabold uppercase tracking-wide text-white shadow-sm">
              <Sparkles className="size-3" />
              {badge ?? (portrait ? "Eat Better Shorts" : "Eat Better Co")}
            </span>
            <span className="truncate text-[0.88rem] font-bold text-cream drop-shadow sm:max-w-md">
              {title}
            </span>
          </div>
        </div>

        {/* Large Centered Play Button (when initially paused) */}
        {!isPlaying && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <motion.button
              whileHover={{ scale: 1.12 }}
              whileTap={{ scale: 0.95 }}
              onClick={togglePlay}
              aria-label={`Play ${title}`}
              className="pointer-events-auto grid size-20 place-items-center rounded-full border-2 border-cocoa bg-orange text-white shadow-[0_12px_36px_rgba(255,92,0,0.65)] transition-transform"
            >
              <Play className="ml-1 size-9 fill-white" />
            </motion.button>
          </div>
        )}

        {/* Center Flash Feedback Pill on Click */}
        <AnimatePresence>
          {showCenterFeedback && (
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1.1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ duration: 0.25 }}
              className="absolute inset-0 flex items-center justify-center pointer-events-none"
            >
              <div className="grid size-16 place-items-center rounded-full bg-cocoa/80 text-white backdrop-blur-md border border-white/20">
                {showCenterFeedback === "play" ? (
                  <Play className="ml-1 size-8 fill-white" />
                ) : (
                  <Pause className="size-8 fill-white" />
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── Bottom Custom Eat Better Themed Controls Bar ───────────── */}
        <div
          className={`absolute bottom-0 inset-x-0 z-20 flex flex-col justify-end p-2 sm:p-3 bg-gradient-to-t from-black/90 via-black/40 to-transparent transition-opacity duration-300 ${
            showControls || !isPlaying ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
        >
          {/* Custom Seek Scrubber Bar */}
          <div
            onClick={handleScrub}
            className="group/track relative mb-2 h-2 w-full cursor-pointer rounded-full bg-white/20 py-1"
          >
            <div className="h-full w-full rounded-full overflow-hidden bg-white/20">
              <div
                className="h-full bg-gradient-to-r from-orange to-[#FED300] relative rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            {/* Draggable Thumb / Nut indicator */}
            <span
              className="absolute top-1/2 -translate-y-1/2 size-3.5 rounded-full border-2 border-white bg-orange shadow-[0_0_8px_rgba(255,92,0,0.9)] transition-transform group-hover/track:scale-125"
              style={{ left: `calc(${progress}% - 7px)` }}
            />
          </div>

          {/* Controls Buttons Row */}
          <div className="flex items-center justify-between text-white text-xs sm:text-sm">
            {/* Left Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2.5">
              {/* Play / Pause Toggle */}
              <button
                type="button"
                onClick={togglePlay}
                aria-label={isPlaying ? "Pause" : "Play"}
                className="grid size-9 place-items-center rounded-xl bg-white/10 hover:bg-orange hover:text-white transition-colors"
              >
                {isPlaying ? <Pause className="size-5 fill-current" /> : <Play className="ml-0.5 size-5 fill-current" />}
              </button>

              {/* -10s Rewind */}
              <button
                type="button"
                onClick={() => skipTime(-10)}
                aria-label="Rewind 10 seconds"
                className="hidden sm:grid size-8 place-items-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <RotateCcw className="size-4" />
              </button>

              {/* +10s Forward */}
              <button
                type="button"
                onClick={() => skipTime(10)}
                aria-label="Forward 10 seconds"
                className="hidden sm:grid size-8 place-items-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                <RotateCw className="size-4" />
              </button>

              {/* Volume & Mute */}
              <div className="group/vol flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={toggleMute}
                  aria-label={isMuted ? "Unmute" : "Mute"}
                  className="grid size-8 place-items-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="size-4 text-orange" />
                  ) : (
                    <Volume2 className="size-4" />
                  )}
                </button>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={isMuted ? 0 : volume}
                  onChange={handleVolumeChange}
                  className="hidden md:block h-1 w-16 cursor-pointer accent-orange"
                  aria-label="Volume slider"
                />
              </div>

              {/* Time Display */}
              <span className="font-mono text-[0.75rem] sm:text-[0.82rem] font-semibold text-cream/90 ml-1">
                {formatTime(currentTime)} / {formatTime(duration)}
              </span>
            </div>

            {/* Right Controls */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Speed Toggle */}
              <button
                type="button"
                onClick={cyclePlaybackRate}
                aria-label={`Playback speed ${playbackRate}x`}
                className="rounded-lg border border-white/20 bg-white/10 px-2 py-1 text-[0.75rem] font-bold text-cream hover:bg-white/20 transition-colors"
              >
                {playbackRate}x
              </button>

              {/* Fullscreen Toggle */}
              <button
                type="button"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                className="grid size-8 place-items-center rounded-lg bg-white/10 hover:bg-white/20 transition-colors"
              >
                {isFullscreen ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
              </button>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Caption Below */}
      {caption && (
        <figcaption className="mt-3 text-[0.92rem] leading-snug text-cocoa-2">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
