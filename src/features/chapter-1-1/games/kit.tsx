"use client";

import { Suspense, useEffect, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Billboard, useTexture } from "@react-three/drei";
import { RoundedBox } from "@/components/three/RoundedBox";
import { AnimatePresence, motion } from "motion/react";
import { Heart, RotateCcw, Star, Trophy, Zap } from "lucide-react";

/**
 * Small shared kit for the Module 1 games (chapters 1.1 and 1.2): canvas-text labels, cached materials,
 * official pack photo boxes, a camera that fits the board at any aspect ratio, a frame ticker that pauses
 * when the canvas is off screen, a QA probe, and the HUD pieces (lives, score, level / end cards).
 */

/* ── helpers ──────────────────────────────────────────────────── */

export function shuffle<T>(a: readonly T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

export type V3 = [number, number, number];

/** Point at distance `d` along a polyline (clamped), plus the index of the segment it is on. */
export function along(pts: V3[], d: number): { p: V3; seg: number; done: boolean } {
  let left = Math.max(0, d);
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    const len = Math.hypot(b[0] - a[0], b[2] - a[2]);
    if (left <= len) {
      const k = len ? left / len : 1;
      return { p: [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, a[2] + (b[2] - a[2]) * k], seg: i, done: false };
    }
    left -= len;
  }
  return { p: pts[pts.length - 1], seg: pts.length - 2, done: true };
}
export const pathLength = (pts: V3[]) => pts.slice(1).reduce((s, b, i) => s + Math.hypot(b[0] - pts[i][0], b[2] - pts[i][2]), 0);

/* ── text & materials ─────────────────────────────────────────── */

const texCache = new Map<string, THREE.CanvasTexture>();

function family(kind: "display" | "sans") {
  if (typeof window === "undefined") return "system-ui, sans-serif";
  const v = getComputedStyle(document.documentElement).getPropertyValue(kind === "display" ? "--font-fredoka" : "--font-tommy").trim();
  return v ? `${v}, system-ui, sans-serif` : "system-ui, sans-serif";
}

export type LabelOpts = { bg?: string; fg?: string; font?: "display" | "sans"; weight?: number; border?: string; radius?: number };

/** Wraps text into at most `maxLines` lines that fit `maxW` pixels at the current font. */
function wrap(g: CanvasRenderingContext2D, text: string, maxW: number) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = "";
  for (const w of words) {
    const t = cur ? `${cur} ${w}` : w;
    if (g.measureText(t).width <= maxW || !cur) cur = t;
    else {
      lines.push(cur);
      cur = w;
    }
  }
  if (cur) lines.push(cur);
  return lines;
}

/** Canvas texture with wrapped, auto-shrunk text. Cached by content. */
export function labelTexture(text: string, w = 512, h = 160, o: LabelOpts = {}) {
  const key = JSON.stringify([text, w, h, o]);
  const hit = texCache.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  const r = o.radius ?? Math.min(w, h) * 0.2;
  if (o.bg) {
    g.fillStyle = o.bg;
    g.beginPath();
    g.roundRect(3, 3, w - 6, h - 6, r);
    g.fill();
    if (o.border) {
      g.lineWidth = 5;
      g.strokeStyle = o.border;
      g.stroke();
    }
  }
  g.fillStyle = o.fg ?? "#2F1C1A";
  g.textAlign = "center";
  g.textBaseline = "middle";
  const fam = family(o.font ?? "display");
  const maxW = w * 0.88;
  let px = Math.floor(h * 0.42);
  let lines: string[] = [text];
  for (;;) {
    g.font = `${o.weight ?? 600} ${px}px ${fam}`;
    lines = text.split("\n").flatMap((l) => wrap(g, l, maxW));
    const fits = lines.length * px * 1.12 <= h * 0.86 && lines.every((l) => g.measureText(l).width <= maxW);
    if (fits || px < 12) break;
    px -= 2;
  }
  const lh = px * 1.12;
  const y0 = h / 2 - ((lines.length - 1) * lh) / 2;
  lines.forEach((l, i) => g.fillText(l, w / 2, y0 + i * lh));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  texCache.set(key, t);
  return t;
}

/** A flat, unlit text sign. `face` makes it always turn to the camera. */
export function Label({ text, width, height, position, rotation, o, face = false, px = 512 }: { text: string; width: number; height: number; position?: V3; rotation?: V3; o?: LabelOpts; face?: boolean; px?: number }) {
  const tex = useMemo(() => labelTexture(text, px, Math.round((px * height) / width), o), [text, width, height, o, px]);
  const plane = (
    <mesh rotation={face ? undefined : rotation} renderOrder={2}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} depthWrite={false} />
    </mesh>
  );
  return face ? <Billboard position={position}>{plane}</Billboard> : <group position={position}>{plane}</group>;
}

const mats = new Map<string, THREE.MeshStandardMaterial>();
export function flatMat(color: string, roughness = 0.65, metalness = 0) {
  const k = `${color}|${roughness}|${metalness}`;
  let m = mats.get(k);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness, metalness });
    mats.set(k, m);
  }
  return m;
}

function PhotoBoxInner({ img, size, side }: { img: string; size: V3; side: string }) {
  const tex = useTexture(img, (t) => {
    (Array.isArray(t) ? t : [t]).forEach((x) => (x.colorSpace = THREE.SRGBColorSpace));
  });
  const m = useMemo(() => {
    const s = flatMat(side);
    const front = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55 });
    return [s, s, s, s, front, s];
  }, [tex, side]);
  return (
    <mesh material={m} castShadow>
      <boxGeometry args={size} />
    </mesh>
  );
}

/** An official Eat Better product: a box whose front face is the official product photo. */
export function PhotoBox({ img, size = [0.5, 0.5, 0.12], side = "#FFF5EE", position, rotation }: { img: string; size?: V3; side?: string; position?: V3; rotation?: V3 }) {
  return (
    <group position={position} rotation={rotation}>
      <Suspense
        fallback={
          <mesh material={flatMat(side)}>
            <boxGeometry args={size} />
          </mesh>
        }
      >
        <PhotoBoxInner img={img} size={size} side={side} />
      </Suspense>
    </group>
  );
}

/* ── scene plumbing ───────────────────────────────────────────── */

/** Backs the camera off along `dir` until `width` × `height` world units around `center` fit the canvas. */
export function FitRig({ center, dir, width, height = 0 }: { center: V3; dir: V3; width: number; height?: number }) {
  const { camera, size } = useThree();
  const key = `${center.join()}|${dir.join()}|${width}|${height}`;
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = size.width / Math.max(1, size.height);
    const t = Math.tan(((cam.fov ?? 42) * Math.PI) / 360);
    const d = Math.max(3, width / 2 / (t * aspect), height / 2 / t) * 1.05;
    const v = new THREE.Vector3(...dir).normalize().multiplyScalar(d);
    cam.position.set(center[0] + v.x, center[1] + v.y, center[2] + v.z);
    cam.lookAt(...center);
    cam.updateProjectionMatrix();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, size.width, size.height, key]);
  return null;
}

/** Calls `fn(dt)` every frame while the canvas is mounted (so the game pauses while it is off screen). */
export function Ticker({ fn }: { fn: (dt: number, t: number) => void }) {
  const ref = useRef(fn);
  useEffect(() => {
    ref.current = fn;
  });
  useFrame(({ clock }, dt) => ref.current(Math.min(dt, 0.05), clock.elapsedTime));
  return null;
}

declare global {
  interface Window {
    __eb1?: Record<string, (id: string) => { x: number; y: number } | null>;
  }
}

/** QA hook: window.__eb1[name](id) → page coordinates of a named point in the 3D scene, so tests can tap 3D objects. */
export function Probe({ name, points }: { name: string; points: () => Record<string, V3> }) {
  const { camera, gl } = useThree();
  const ref = useRef(points);
  useEffect(() => {
    ref.current = points;
  });
  useEffect(() => {
    const reg = (window.__eb1 ??= {});
    reg[name] = (id) => {
      const p = ref.current()[id];
      if (!p) return null;
      const v = new THREE.Vector3(...p).project(camera);
      const r = gl.domElement.getBoundingClientRect();
      return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height };
    };
    return () => {
      delete reg[name];
    };
  }, [name, camera, gl]);
  return null;
}

export function Lights({ shadows = true }: { shadows?: boolean }) {
  return (
    <>
      <hemisphereLight args={["#FFF4E6", "#8A6A55", 1.2]} />
      <directionalLight position={[3, 8, 5]} intensity={1.7} castShadow={shadows} shadow-mapSize={[1024, 1024]} shadow-camera-left={-8} shadow-camera-right={8} shadow-camera-top={8} shadow-camera-bottom={-8} />
    </>
  );
}

export function Ground({ color = "#EBD9C4", size = 40 }: { color?: string; size?: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial color={color} roughness={0.95} />
    </mesh>
  );
}

/** A soft pulsing ring on the floor (tap target hint). */
export function Pulse({ position, radius = 0.6, color = "#FF5C00", on = true }: { position: V3; radius?: number; color?: string; on?: boolean }) {
  const m = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    if (m.current) m.current.opacity = on ? 0.35 + Math.sin(clock.elapsedTime * 5) * 0.2 : 0;
  });
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[position[0], 0.02, position[2]]}>
      <ringGeometry args={[radius * 0.72, radius, 40]} />
      <meshBasicMaterial ref={m} color={color} transparent opacity={0} toneMapped={false} depthWrite={false} />
    </mesh>
  );
}

/** Simple cardboard parcel. */
export function Parcel({ size = 0.42, color = "#C9965F" }: { size?: number; color?: string }) {
  return (
    <group>
      <RoundedBox args={[size, size * 0.72, size]} radius={0.03} smoothness={2} material={flatMat(color, 0.8)} castShadow />
      <mesh position={[0, size * 0.361, 0]} material={flatMat("#E9D3B0", 0.8)}>
        <boxGeometry args={[size * 1.01, 0.012, size * 0.22]} />
      </mesh>
    </group>
  );
}

/* ── HUD ──────────────────────────────────────────────────────── */

export function Hearts({ lives, max = 3 }: { lives: number; max?: number }) {
  return (
    <span className="flex items-center gap-0.5 rounded-full bg-white/95 px-2 py-1 shadow-[1px_1px_0_0_#2f1c1a]" aria-label={`${lives} of ${max} lives left`} data-testid="lives">
      {Array.from({ length: max }, (_, i) => (
        <motion.span key={i} animate={i < lives ? { scale: 1 } : { scale: [1.4, 0.8] }} transition={{ duration: 0.3 }}>
          <Heart className={`size-4 ${i < lives ? "fill-error text-error" : "text-cocoa/25"}`} />
        </motion.span>
      ))}
    </span>
  );
}

export function ScorePill({ score, combo }: { score: number; combo: number }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-cocoa/90 px-3 py-1 text-[0.82rem] font-extrabold text-cream" data-testid="score">
      <Trophy className="size-3.5 text-haldi" /> {score}
      {combo > 1 && (
        <motion.span key={combo} initial={{ scale: 1.6 }} animate={{ scale: 1 }} className="ml-1 flex items-center gap-0.5 rounded-full bg-orange px-1.5 text-white">
          <Zap className="size-3" />×{combo}
        </motion.span>
      )}
    </span>
  );
}

export function PracticeTag({ children = "Practice" }: { children?: ReactNode }) {
  return <span className="rounded-full bg-haldi px-2.5 py-1 text-[0.72rem] font-extrabold uppercase tracking-[0.08em] text-cocoa">{children}</span>;
}

/** Centre card over the stage: level intro, level cleared, win or lose. */
export function StageCard({ show, tone = "info", title, children, action, onAction, testId }: { show: boolean; tone?: "info" | "win" | "lose"; title: string; children?: ReactNode; action?: string; onAction?: () => void; testId?: string }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 grid place-items-center bg-cocoa/35 p-3 backdrop-blur-[2px]">
          <motion.div
            initial={{ scale: 0.85, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 20 }}
            className="w-full max-w-md rounded-[22px] border border-cocoa bg-cream p-5 text-center shadow-[3px_3px_0_0_#2f1c1a]"
          >
            <div className={`text-[0.78rem] font-extrabold uppercase tracking-[0.14em] ${tone === "win" ? "text-success" : tone === "lose" ? "text-error" : "text-orange"}`}>
              {tone === "win" ? "Level cleared" : tone === "lose" ? "Out of lives" : "Get ready"}
            </div>
            <div className="mt-1 font-display text-[1.45rem] font-semibold leading-tight text-cocoa">{title}</div>
            {children && <div className="mt-2 text-[0.98rem] leading-snug text-cocoa">{children}</div>}
            {action && onAction && (
              <button data-testid={testId} onClick={onAction} className="eb-btn eb-btn-primary mt-4 inline-flex items-center gap-2 !normal-case">
                {tone === "lose" && <RotateCcw className="size-4" />}
                {action}
              </button>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function StarRow({ stars }: { stars: number }) {
  return (
    <span className="mt-2 inline-flex gap-1" aria-label={`${stars} of 3 stars`}>
      {[0, 1, 2].map((i) => (
        <motion.span key={i} initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.15 + i * 0.15, type: "spring" }}>
          <Star className={`size-7 ${i < stars ? "fill-haldi text-[#C9A400]" : "text-cocoa/20"}`} />
        </motion.span>
      ))}
    </span>
  );
}
