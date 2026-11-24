"use client";

import { useEffect, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Heart, RotateCcw, Star } from "lucide-react";
import type { HumanLook } from "@/components/world2/Human";
import { celebrate } from "@/components/celebrate/store";

/**
 * Small shared kit for the Chapter 1.3-1.6 games: re-exports the Chapter 4.1 3D helpers (camera fit, text sprites,
 * pack boxes, QA probe), a "Reactor" that makes characters bounce / shake / lean, and the HUD + end-card pieces.
 */
export { FitCam, Label, PackBox, Probe, makeFace, pick, rint, shuffle } from "@/features/chapter-4-1/activities/shared";

export type Mood = "idle" | "cheer" | "sad" | "lean";

/** Wraps a 3D character (or prop) and plays a short reaction each time `kick` changes. */
export function Reactor({ mood = "idle", kick = 0, position, rotation, children }: { mood?: Mood; kick?: number; position?: [number, number, number]; rotation?: [number, number, number]; children: ReactNode }) {
  const g = useRef<THREE.Group>(null);
  const t0 = useRef(-10);
  useEffect(() => {
    if (kick) t0.current = performance.now() / 1000;
  }, [kick]);
  useFrame(() => {
    const o = g.current;
    if (!o) return;
    const t = performance.now() / 1000 - t0.current;
    const k = t < 1.2 ? 1 - t / 1.2 : 0;
    o.position.y = mood === "cheer" ? Math.abs(Math.sin(t * 9)) * 0.3 * k : 0;
    o.rotation.z = mood === "sad" ? Math.sin(t * 26) * 0.08 * k : 0;
    o.rotation.x = mood === "lean" ? 0.2 * Math.sin(Math.min(t / 1.2, 1) * Math.PI) : mood === "sad" ? 0.1 * k : 0;
  });
  return (
    <group position={position} rotation={rotation}>
      <group ref={g}>{children}</group>
    </group>
  );
}

/** Eased value: moves `ref.current` towards `target` each frame. */
export function useEase(target: number, rate = 8) {
  const v = useRef(target);
  useFrame((_, dt) => {
    v.current += (target - v.current) * (1 - Math.exp(-dt * rate));
  });
  return v;
}

export function Hearts({ n, max = 3, label = "lives" }: { n: number; max?: number; label?: string }) {
  return (
    <span className="flex items-center gap-0.5" aria-label={`${n} of ${max} ${label}`}>
      {Array.from({ length: max }, (_, i) => (
        <Heart key={i} className={`size-5 ${i < n ? "fill-error text-error" : "text-cocoa/25"}`} />
      ))}
    </span>
  );
}

export function Stat({ label, value, tone = "dark" }: { label: string; value: ReactNode; tone?: "dark" | "orange" }) {
  return (
    <div className={`rounded-xl px-3 py-1.5 ${tone === "orange" ? "bg-orange text-white" : "bg-cocoa text-cream"}`}>
      <div className="text-[0.68rem] font-extrabold uppercase tracking-[0.12em] opacity-80">{label}</div>
      <div className="font-display text-[1.15rem] font-semibold leading-tight tabular-nums">{value}</div>
    </div>
  );
}

export function StarRow({ stars }: { stars: number }) {
  return (
    <span className="flex gap-0.5" aria-label={`${stars} of 3 stars`}>
      {[0, 1, 2].map((i) => (
        <Star key={i} className={`size-7 ${i < stars ? "fill-haldi text-[#C9A400]" : "text-cocoa/20"}`} />
      ))}
    </span>
  );
}

/** Win / lose card shown under the stage. */
export function EndCard({ won, stars, title, body, onRestart, children }: { won: boolean; stars?: number; title: string; body: string; onRestart: () => void; children?: ReactNode }) {
  useEffect(() => {
    celebrate(won ? { score: stars ?? 3, max: 3, title } : { score: 0, max: 3, title, lost: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- once, when the end card appears
  return (
    <div data-testid={won ? "game-won" : "game-lost"} className={`mt-4 rounded-[20px] border-2 p-4 sm:p-5 ${won ? "border-success/50 bg-success/10" : "border-error/40 bg-error/5"}`}>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="font-display text-[1.35rem] font-semibold text-cocoa">{title}</div>
        {won && stars !== undefined && <StarRow stars={stars} />}
      </div>
      <p className="mt-1 text-[1rem] leading-relaxed text-cocoa">{body}</p>
      {children}
      <button onClick={onRestart} className="eb-btn eb-btn-secondary mt-3 !normal-case">
        <RotateCcw className="size-4" /> {won ? "Play again" : "Try again"}
      </button>
    </div>
  );
}

export const PEOPLE: HumanLook[] = [
  { skin: "#C68642", hair: "#1b1b1b", hairStyle: "long", outfit: "kurta", top: "#d9534f", bottom: "#2f3e55", accent: "#f2c94c", shoe: "#3a2a22", bindi: true },
  { skin: "#8D5524", hair: "#111", hairStyle: "short", outfit: "shirt", top: "#4a7fb5", bottom: "#33363d", shoe: "#222", facial: "stubble" },
  { skin: "#E0AC69", hair: "#2a1a10", hairStyle: "bun", outfit: "tshirt", top: "#2e9e6a", bottom: "#243b55", shoe: "#fff" },
  { skin: "#A86B3C", hair: "#1a120c", hairStyle: "curly", outfit: "hoodie", top: "#8b5cf6", bottom: "#2c2c34", shoe: "#ddd", glasses: "#222" },
  { skin: "#C68642", hair: "#222", hairStyle: "braid", outfit: "salwar", top: "#e9a23b", bottom: "#e9a23b", accent: "#b23a48", shoe: "#5a3a2a" },
  { skin: "#8D5524", hair: "#151515", hairStyle: "side", outfit: "kurta", top: "#f4f0e6", bottom: "#4b4b55", shoe: "#3a2a22", facial: "beard" },
  { skin: "#B5764A", hair: "#BDB6B0", hairStyle: "bun", outfit: "saree", top: "#7B1FA2", bottom: "#7B1FA2", accent: "#C8963E", shoe: "#5a3a2a", bindi: true },
  { skin: "#D9A066", hair: "#2A1A12", hairStyle: "short", outfit: "tshirt", top: "#F2A900", bottom: "#4E342E", shoe: "#fff", height: 0.62 },
];

/** Opaque floor / backdrop pieces so each game has a simple room. */
export function Room({ floor = "#E9C9A6", wall = "#F6E3CF", w = 20 }: { floor?: string; wall?: string; w?: number }) {
  return (
    <>
      <mesh position={[0, 3, -3]}>
        <planeGeometry args={[w, 10]} />
        <meshStandardMaterial color={wall} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 1]}>
        <planeGeometry args={[w, 10]} />
        <meshStandardMaterial color={floor} roughness={0.9} />
      </mesh>
    </>
  );
}
