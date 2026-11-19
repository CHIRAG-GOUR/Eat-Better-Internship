"use client";

import Image from "next/image";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { Maximize2, X, ZoomIn, ZoomOut } from "lucide-react";

/**
 * Tap-to-enlarge wrapper for screenshots and photos. The inline picture stays exactly as designed; tapping it opens
 * the full-resolution image over the page, fitted to the screen. Tapping the enlarged image zooms to 2.5× and the
 * learner can scroll around it, so small text in a website screenshot becomes readable on a phone.
 */
export function Zoomable({ src, alt, ratio, children, className = "" }: { src: string; alt: string; ratio: number; children: ReactNode; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className={`group/zoom relative ${className}`}>
      {children}
      <button type="button" onClick={() => setOpen(true)} aria-label={`Enlarge picture: ${alt}`} className="absolute inset-0 z-[1] cursor-zoom-in rounded-[inherit] outline-none focus-visible:ring-4 focus-visible:ring-haldi" />
      <span aria-hidden className="pointer-events-none absolute bottom-2 right-2 z-[2] grid size-8 place-items-center rounded-full border border-cocoa/20 bg-white/90 text-cocoa shadow-sm transition-transform group-hover/zoom:scale-110">
        <Maximize2 className="size-4" />
      </span>
      {open && <Lightbox src={src} alt={alt} ratio={ratio} onClose={() => setOpen(false)} />}
    </div>
  );
}

function Lightbox({ src, alt, ratio, onClose }: { src: string; alt: string; ratio: number; onClose: () => void }) {
  const [zoom, setZoom] = useState(false);
  const closeRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [onClose]);
  // the largest size that fits the screen below the toolbar, keeping the picture's own shape
  const fit = `min(calc(100vw - 24px), calc((100svh - 128px) * ${ratio}))`;
  return createPortal(
    <div role="dialog" aria-modal="true" aria-label={`Enlarged picture: ${alt}`} className="fixed inset-0 z-[120] flex flex-col bg-[#150d0c]/95" onClick={onClose}>
      <div className="flex items-center justify-between gap-3 px-3 py-2.5 text-cream" onClick={(e) => e.stopPropagation()}>
        <p className="line-clamp-2 min-w-0 text-[0.86rem] leading-snug text-cream/85">{alt}</p>
        <div className="flex shrink-0 items-center gap-2">
          <button type="button" onClick={() => setZoom((z) => !z)} aria-pressed={zoom} className="flex h-10 items-center gap-1.5 rounded-full border border-cream/30 px-3 text-[0.85rem] font-bold text-cream hover:bg-cream/10">
            {zoom ? <ZoomOut className="size-4" /> : <ZoomIn className="size-4" />}
            {zoom ? "Fit" : "Zoom"}
          </button>
          <button ref={closeRef} type="button" onClick={onClose} aria-label="Close enlarged picture" className="grid size-10 place-items-center rounded-full bg-cream text-cocoa hover:bg-peach">
            <X className="size-5" />
          </button>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 overflow-auto overscroll-contain p-3">
        <div
          className={`relative m-auto shrink-0 ${zoom ? "cursor-zoom-out" : "cursor-zoom-in"}`}
          style={{ width: zoom ? `calc(${fit} * 2.5)` : fit, aspectRatio: ratio }}
          onClick={(e) => {
            e.stopPropagation();
            setZoom((z) => !z);
          }}
        >
          <Image src={src} alt={alt} fill sizes={zoom ? "250vw" : "100vw"} className="object-contain" priority />
        </div>
      </div>
      <p className="pb-3 text-center text-[0.8rem] text-cream/60">{zoom ? "Scroll to look around. Tap the picture to fit it again." : "Tap the picture to zoom in."}</p>
    </div>,
    document.body,
  );
}
