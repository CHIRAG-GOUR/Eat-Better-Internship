"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Canvas } from "@react-three/fiber";
import { useMediaQuery } from "@/lib/useClient";

/**
 * A 3D play area for activities (Module 4+). The WebGL canvas only exists while the stage is on screen, so a page
 * can hold several 3D games plus the background world without overloading phones. Phones get a lower pixel ratio,
 * no shadows and no antialiasing. Put the game's HUD (numbers, inputs, feedback) in `overlay` or around the stage.
 */
export function Stage3D({
  children,
  overlay,
  height = "clamp(340px, 58vh, 560px)",
  camera = { position: [0, 2.4, 6], fov: 42 },
  label,
  background = "linear-gradient(180deg,#FFF5EE 0%,#F6E3CF 100%)",
}: {
  children: ReactNode;
  overlay?: ReactNode;
  height?: string;
  camera?: { position: [number, number, number]; fov?: number };
  /** what the scene shows, for screen readers */
  label: string;
  background?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const compact = useMediaQuery("(max-width: 767px)");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setVisible(e.isIntersecting), { rootMargin: "240px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} role="img" aria-label={label} className="relative w-full overflow-hidden rounded-[20px] border border-cocoa/20" style={{ height, background }}>
      {visible ? (
        <Canvas dpr={[1, compact ? 1.25 : 1.75]} shadows={!compact} camera={camera} gl={{ antialias: !compact, powerPreference: "high-performance" }} style={{ touchAction: "pan-y" }}>
          {children}
        </Canvas>
      ) : (
        <div className="grid h-full place-items-center text-[0.95rem] font-bold text-cocoa-2/70">Loading the 3D scene…</div>
      )}
      {overlay && <div className="pointer-events-none absolute inset-0 [&>*]:pointer-events-auto">{overlay}</div>}
    </div>
  );
}
