"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Heart,
  Send,
  Bookmark,
  Music,
  Camera,
  Check,
  Wifi,
  Battery,
} from "lucide-react";
import { getMediaUrl } from "@/lib/media";
import { SeekBar } from "./SeekBar";

/** Only real details belong here: no invented like or comment counts. */
export type ReelMeta = {
  handle?: string;
  avatar?: string;
  audioTrack?: string;
  caption?: string;
};

type Props = {
  h264: string;
  av1?: string;
  poster?: string;
  title: string;
  caption?: string;
  reelMeta?: ReelMeta;
  fill?: boolean;
};

export function InstagramReelPlayer({
  h264,
  av1,
  poster,
  title,
  caption,
  reelMeta,
  fill = false,
}: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [liked, setLiked] = useState(false);
  const [saved, setSaved] = useState(false);
  const [sharedToast, setSharedToast] = useState(false);
  const [showCenterIcon, setShowCenterIcon] = useState<"play" | "pause" | null>(null);
  const [showHeartBurst, setShowHeartBurst] = useState(false);
  const lastClickTimeRef = useRef<number>(0);

  const meta = {
    handle: reelMeta?.handle ?? "eatbetterco",
    avatar: reelMeta?.avatar ?? "/brand/catalog/range-laddoo.webp",
    audioTrack: reelMeta?.audioTrack ?? "Eat Better Co · Original audio",
    caption: reelMeta?.caption ?? title,
  };

  // Sync play state
  const togglePlay = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    if (video.paused) {
      video
        .play()
        .then(() => {
          setIsPlaying(true);
          setShowCenterIcon("play");
          setTimeout(() => setShowCenterIcon(null), 700);
        })
        .catch(() => {
          // autoplay policy restriction
        });
    } else {
      video.pause();
      setIsPlaying(false);
      setShowCenterIcon("pause");
      setTimeout(() => setShowCenterIcon(null), 700);
    }
  }, []);

  // Handle double-tap to like, single tap to play/pause
  const handleScreenClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const now = Date.now();
    if (now - lastClickTimeRef.current < 300) {
      // Double click: trigger heart burst and like
      setLiked(true);
      setShowHeartBurst(true);
      setTimeout(() => setShowHeartBurst(false), 900);
    } else {
      // Single click: toggle play
      togglePlay();
    }
    lastClickTimeRef.current = now;
  };

  const toggleMute = (e: React.MouseEvent) => {
    e.stopPropagation();
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const toggleLike = (e: React.MouseEvent) => {
    e.stopPropagation();
    setLiked((prev) => !prev);
  };

  const toggleSave = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSaved((prev) => !prev);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (typeof navigator !== "undefined" && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setSharedToast(true);
      setTimeout(() => setSharedToast(false), 2200);
    }
  };

  return (
    <figure className="flex flex-col items-center">
      {/* ── Smartphone Phone Frame ─────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className={`relative overflow-hidden rounded-[36px] border-[5px] border-[#221816] bg-black shadow-[6px_6px_0_0_#ff5c00,0_16px_40px_rgba(47,28,26,0.25)] select-none ${
          fill ? "aspect-[9/16] w-full" : "mx-auto aspect-[9/16] w-full max-w-[340px]"
        }`}
      >
        {/* Dynamic Notch & Speaker Slit */}
        <div className="absolute top-2 inset-x-0 z-30 flex justify-center items-center pointer-events-none">
          <div className="flex items-center gap-1.5 rounded-full bg-black/85 px-3 py-1 shadow-sm">
            <span className="size-2 rounded-full bg-[#111] ring-1 ring-white/10" />
            <div className="h-1 w-8 rounded-full bg-white/20" />
          </div>
        </div>

        {/* Phone Top Status Bar */}
        <div className="absolute top-2.5 inset-x-4 z-20 flex justify-between items-center text-[0.72rem] font-bold text-white/90 pointer-events-none drop-shadow">
          <span>9:41</span>
          <div className="flex items-center gap-1.5 opacity-90">
            <Wifi className="size-3" />
            <Battery className="size-3.5" />
          </div>
        </div>

        {/* Instagram In-App Reels Top Header */}
        <div className="absolute top-9 inset-x-3 z-20 flex justify-between items-center">
          <div className="flex items-center gap-1.5 text-white drop-shadow">
            <Camera className="size-5" />
            <span className="font-display text-[1.1rem] font-bold tracking-tight">Reels</span>
          </div>

          {/* Sound Mute/Unmute Pill */}
          <button
            type="button"
            onClick={toggleMute}
            aria-label={isMuted ? "Unmute video" : "Mute video"}
            className="flex items-center gap-1.5 rounded-full bg-black/50 px-2.5 py-1 text-[0.75rem] font-semibold text-white backdrop-blur-md transition-colors hover:bg-black/70"
          >
            {isMuted ? <VolumeX className="size-3.5 text-white/80" /> : <Volume2 className="size-3.5 text-orange" />}
            <span>{isMuted ? "Muted" : "Sound on"}</span>
          </button>
        </div>

        {/* ── HTML5 Video Element ────────────────────────────────────── */}
        <div className="relative size-full cursor-pointer" onClick={handleScreenClick}>
          <video
            ref={videoRef}
            className="size-full object-cover"
            playsInline
            loop
            muted={isMuted}
            preload="metadata"
            poster={poster}
            title={title}
            onPlay={() => setIsPlaying(true)}
            onPause={() => setIsPlaying(false)}
          >
            {av1 && <source src={getMediaUrl(av1)} type='video/mp4; codecs="av01.0.08M.08, mp4a.40.2"' />}
            <source src={getMediaUrl(h264)} type="video/mp4" />
          </video>

          {/* Background subtle gradient for controls contrast */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-black/85 pointer-events-none" />

          {/* Big Center Play Button (when initially paused) */}
          {!isPlaying && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="grid size-16 place-items-center rounded-full bg-orange/95 text-white shadow-[0_8px_30px_rgba(255,92,0,0.6)] backdrop-blur-sm"
              >
                <Play className="ml-1 size-8 fill-white" />
              </motion.div>
            </div>
          )}

          {/* Center Play/Pause Feedback Pill on Tap */}
          <AnimatePresence>
            {showCenterIcon && (
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1.1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <div className="grid size-14 place-items-center rounded-full bg-black/60 text-white backdrop-blur-md">
                  {showCenterIcon === "play" ? (
                    <Play className="ml-0.5 size-7 fill-white" />
                  ) : (
                    <Pause className="size-7 fill-white" />
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Double-Tap Heart Burst */}
          <AnimatePresence>
            {showHeartBurst && (
              <motion.div
                initial={{ scale: 0.2, opacity: 0, rotate: -15 }}
                animate={{ scale: 1.3, opacity: 1, rotate: 0 }}
                exit={{ scale: 1.5, opacity: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="absolute inset-0 flex items-center justify-center pointer-events-none"
              >
                <Heart className="size-24 fill-[#FF3040] text-[#FF3040] drop-shadow-[0_10px_25px_rgba(255,48,64,0.6)]" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Right-Side Instagram Action Sidebar ─────────────────────── */}
        <div className="absolute right-2.5 bottom-16 z-20 flex flex-col items-center gap-4 text-white">
          {/* Profile Avatar with Story Ring */}
          <div className="relative mb-1">
            <div className="size-9 rounded-full p-[2px] bg-gradient-to-tr from-[#FED300] via-[#FF5C00] to-[#E1306C]">
              <div className="relative size-full overflow-hidden rounded-full border border-black bg-cream">
                <Image src={meta.avatar} alt="Eat Better Co" fill className="object-cover" />
              </div>
            </div>
            <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 flex size-4 items-center justify-center rounded-full bg-orange text-[0.65rem] font-bold text-white shadow">
              +
            </span>
          </div>

          {/* Like Button */}
          <button
            type="button"
            onClick={toggleLike}
            aria-label="Like"
            className="group flex flex-col items-center gap-1 transition-transform active:scale-125"
          >
            <motion.div whileTap={{ scale: 0.8 }}>
              <Heart
                className={`size-7 transition-colors drop-shadow ${
                  liked ? "fill-[#FF3040] text-[#FF3040]" : "text-white hover:text-white/80"
                }`}
              />
            </motion.div>
          </button>


          {/* Share Button */}
          <button
            type="button"
            onClick={handleShare}
            aria-label="Share"
            className="group flex flex-col items-center gap-1 transition-transform active:scale-110"
          >
            <Send className="size-6 text-white drop-shadow hover:text-white/80 -rotate-12" />
          </button>

          {/* Bookmark Button */}
          <button
            type="button"
            onClick={toggleSave}
            aria-label="Save"
            className="group flex flex-col items-center gap-1 transition-transform active:scale-110"
          >
            <Bookmark
              className={`size-6 transition-colors drop-shadow ${
                saved ? "fill-[#FED300] text-[#FED300]" : "text-white hover:text-white/80"
              }`}
            />
          </button>

          {/* Spinning Vinyl Record Disc */}
          <motion.div
            animate={{ rotate: isPlaying ? 360 : 0 }}
            transition={{ repeat: Infinity, duration: 4, ease: "linear" }}
            className="relative mt-1 size-7 rounded-full border-2 border-white/60 bg-[#111] p-1 shadow"
          >
            <div className="size-full rounded-full bg-gradient-to-tr from-cocoa to-orange grid place-items-center">
              <Music className="size-2.5 text-white" />
            </div>
          </motion.div>
        </div>

        {/* ── Bottom Caption & Handle Overlay ─────────────────────────── */}
        <div className="absolute left-3 right-16 bottom-7 z-20 text-white drop-shadow pointer-events-none">
          {/* Account handle */}
          <div className="mb-1.5 flex items-center gap-2">
            <span className="font-display text-[0.92rem] font-bold tracking-tight">@{meta.handle}</span>
          </div>

          {/* Caption */}
          <p className="line-clamp-2 text-[0.78rem] leading-snug text-white/95">
            {meta.caption}
          </p>

          {/* Audio Track Marquee */}
          <div className="mt-1.5 flex items-center gap-1.5 text-[0.72rem] text-white/85">
            <Music className="size-3 shrink-0" />
            <span className="truncate font-medium">{meta.audioTrack}</span>
          </div>
        </div>

        {/* ── Seek bar along the bottom edge ─────────────────────────── */}
        {/* kept clear of the frame's rounded corners so the whole bar stays visible */}
        <div className="absolute inset-x-5 bottom-2.5 z-30">
          <SeekBar video={videoRef} label={`Seek: ${title}`} variant="edge" />
        </div>

        {/* Copied Toast Notification */}
        <AnimatePresence>
          {sharedToast && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-16 inset-x-8 z-40 flex items-center justify-center gap-1.5 rounded-full bg-cocoa/90 px-3 py-1.5 text-[0.75rem] font-bold text-cream backdrop-blur-md shadow-lg"
            >
              <Check className="size-3.5 text-haldi" />
              <span>Link copied to clipboard!</span>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Optional Outer Caption */}
      {caption && (
        <figcaption className="mt-3 text-center text-[0.92rem] leading-snug text-cocoa-2">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
