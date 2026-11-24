"use client";

import { Suspense, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import { motion } from "motion/react";
import { Flame, Heart, RotateCcw, Star, Timer, Trophy, ArrowRight, Frown } from "lucide-react";
import { Human, type HumanLook } from "@/components/world2/Human";
import { celebrate } from "@/components/celebrate/store";

/**
 * Shared kit for the Module 2 games (2.1, 2.3, 2.4): helpers, camera fit, QA probe, WebGL text labels, movers,
 * people with moods, photo cards with tap-UV, a HUD, an end card, a countdown hook and a success burst.
 * Kept light: shared geometry, no post-processing, at most two lights per scene (set by each game).
 */

/* ── small helpers ────────────────────────────────────────────── */

export const rint = (a: number, b: number) => Math.floor(a + Math.random() * (b - a + 1));
export const pick = <T,>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)];
export const words = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;
export function shuffle<T>(a: readonly T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

/* ── camera ───────────────────────────────────────────────────── */

/** Frames a world-space box (width × height around y = cy) whatever the canvas shape, phone or desktop. */
export function FitCam({ width, height, cy = 0, tilt = 0, cz = 0 }: { width: number; height: number; cy?: number; tilt?: number; cz?: number }) {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const t = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    const aspect = size.width / size.height;
    const z = Math.max(width / 2 / (t * aspect), height / 2 / t) + 0.6;
    cam.position.set(0, cy + tilt, cz + z);
    cam.lookAt(0, cy, cz);
    cam.updateProjectionMatrix();
  }, [camera, size, width, height, cy, tilt, cz]);
  return null;
}

/* ── QA probe ─────────────────────────────────────────────────── */

declare global {
  interface Window {
    __eb2?: Record<string, (id: string) => { x: number; y: number } | null>;
  }
}

/** QA hook: window.__eb2[name](id) → page coordinates of a named object, so tests can tap objects in the 3D scene. */
export function Probe({ name, points }: { name: string; points: () => Record<string, [number, number, number]> }) {
  const { camera, gl } = useThree();
  const ref = useRef(points);
  useEffect(() => {
    ref.current = points;
  });
  useEffect(() => {
    const reg = (window.__eb2 ??= {});
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

/* ── text label (sprite) ──────────────────────────────────────── */

/**
 * A text label drawn to a canvas and shown as a sprite (drei's <Html> mounts a second React root, which throws when
 * Stage3D unmounts the canvas on scroll). `maxW` wraps long text into lines of about that many characters.
 */
export function Label({ text, position, bg = "#ffffff", fg = "#2f1c1a", border = "#2f1c1a", h = 0.26, mono = false, maxW = 0, bold = 700 }: { text: string; position: [number, number, number]; bg?: string; fg?: string; border?: string; h?: number; mono?: boolean; maxW?: number; bold?: number }) {
  const { tex, w, hh } = useMemo(() => {
    const px = 46;
    const lines = (maxW ? wrap(text, maxW) : text).split("\n");
    const c = document.createElement("canvas");
    const g = c.getContext("2d")!;
    const font = `${bold} ${px}px ${mono ? "ui-monospace, monospace" : "system-ui, sans-serif"}`;
    g.font = font;
    const tw = Math.max(...lines.map((l) => g.measureText(l).width));
    const pad = 18;
    const lh = px * 1.2;
    c.width = Math.ceil(tw + pad * 2);
    c.height = Math.ceil(lh * lines.length + pad * 1.2);
    const g2 = c.getContext("2d")!;
    g2.fillStyle = bg;
    g2.strokeStyle = border;
    g2.lineWidth = 6;
    g2.beginPath();
    g2.roundRect(3, 3, c.width - 6, c.height - 6, 18);
    g2.fill();
    if (border !== "none") g2.stroke();
    g2.font = font;
    g2.fillStyle = fg;
    g2.textAlign = "center";
    g2.textBaseline = "middle";
    lines.forEach((l, i) => g2.fillText(l, c.width / 2, pad * 0.6 + lh * (i + 0.5) + 2));
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return { tex: t, w: (c.width * h) / px, hh: (c.height * h) / px };
  }, [text, bg, fg, border, h, mono, maxW, bold]);
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <sprite position={position} scale={[w, hh, 1]} raycast={() => null} renderOrder={10}>
      <spriteMaterial map={tex} transparent depthTest={false} />
    </sprite>
  );
}

export function wrap(text: string, max: number) {
  const out: string[] = [];
  for (const para of text.split("\n")) {
    let line = "";
    for (const w of para.split(" ")) {
      if ((line + " " + w).trim().length > max && line) {
        out.push(line);
        line = w;
      } else line = (line + " " + w).trim();
    }
    out.push(line);
  }
  return out.join("\n");
}

/** A flat card with text drawn on it (a mesh, so it can be tapped and sit in the scene). */
export function TextCard({ text, w = 1.6, h = 0.6, bg = "#ffffff", fg = "#2f1c1a", border = "#2f1c1a", size = 0.16, maxW = 24, onClick, depth = 0.04 }: { text: string; w?: number; h?: number; bg?: string; fg?: string; border?: string; size?: number; maxW?: number; onClick?: () => void; depth?: number }) {
  const tex = useMemo(() => {
    const ppu = 220;
    const c = document.createElement("canvas");
    c.width = Math.round(w * ppu);
    c.height = Math.round(h * ppu);
    const g = c.getContext("2d")!;
    g.fillStyle = bg;
    g.fillRect(0, 0, c.width, c.height);
    if (border !== "none") {
      g.strokeStyle = border;
      g.lineWidth = 10;
      g.strokeRect(5, 5, c.width - 10, c.height - 10);
    }
    const px = size * ppu;
    g.font = `700 ${px}px system-ui, sans-serif`;
    g.fillStyle = fg;
    g.textAlign = "center";
    g.textBaseline = "middle";
    const lines = wrap(text, maxW).split("\n");
    lines.forEach((l, i) => g.fillText(l, c.width / 2, c.height / 2 + (i - (lines.length - 1) / 2) * px * 1.18, c.width - 24));
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return t;
  }, [text, w, h, bg, fg, border, size, maxW]);
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <mesh
      castShadow
      onClick={
        onClick
          ? (e) => {
              e.stopPropagation();
              onClick();
            }
          : undefined
      }
      onPointerOver={onClick ? () => (document.body.style.cursor = "pointer") : undefined}
      onPointerOut={onClick ? () => (document.body.style.cursor = "") : undefined}
    >
      <boxGeometry args={[w, h, depth]} />
      <meshStandardMaterial attach="material-0" color={bg} />
      <meshStandardMaterial attach="material-1" color={bg} />
      <meshStandardMaterial attach="material-2" color={bg} />
      <meshStandardMaterial attach="material-3" color={bg} />
      <meshBasicMaterial attach="material-4" map={tex} toneMapped={false} />
      <meshStandardMaterial attach="material-5" color={bg} />
    </mesh>
  );
}

/* ── movement ─────────────────────────────────────────────────── */

/** Moves its group smoothly towards a target, wobbling while selected. `shake` (a changing key) jolts it sideways. */
export function Mover({ target, selected, children, onClick, scale = 1, shake, speed = 9 }: { target: [number, number, number]; selected?: boolean; children: ReactNode; onClick?: () => void; scale?: number; shake?: number; speed?: number }) {
  const g = useRef<THREE.Group>(null);
  const init = useRef(false);
  const shakeT = useRef(-1);
  const lastShake = useRef(shake);
  useFrame(({ clock }, dt) => {
    const o = g.current;
    if (!o) return;
    if (!init.current) {
      o.position.set(...target);
      o.scale.setScalar(scale);
      init.current = true;
    }
    if (shake !== lastShake.current) {
      lastShake.current = shake;
      shakeT.current = clock.elapsedTime;
    }
    const k = 1 - Math.exp(-dt * speed);
    o.position.x += (target[0] - o.position.x) * k;
    o.position.y += (target[1] - o.position.y) * k;
    o.position.z += (target[2] - o.position.z) * k;
    const s = o.scale.x + (scale - o.scale.x) * k;
    o.scale.setScalar(s);
    const st = clock.elapsedTime - shakeT.current;
    const jolt = shakeT.current >= 0 && st < 0.5 ? Math.sin(st * 60) * 0.12 * (1 - st / 0.5) : 0;
    o.position.x += jolt;
    o.rotation.y = selected ? Math.sin(clock.elapsedTime * 5) * 0.14 : o.rotation.y * 0.85;
  });
  return (
    <group
      ref={g}
      onClick={(e) => {
        if (!onClick) return;
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={(e) => {
        if (!onClick) return;
        e.stopPropagation();
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "";
      }}
    >
      {children}
    </group>
  );
}

/** A soft pulsing halo behind an object. */
export function Halo({ w = 1.35, h = 1.5, color = "#FF5C00", z = -0.15 }: { w?: number; h?: number; color?: string; z?: number }) {
  const m = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    if (m.current) m.current.opacity = 0.35 + Math.sin(clock.elapsedTime * 6) * 0.15;
  });
  return (
    <mesh position={[0, 0, z]} raycast={() => null}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial ref={m} color={color} transparent opacity={0.4} depthWrite={false} />
    </mesh>
  );
}

/** Flies a child along an arc from `from` to `to` over `dur` seconds, then calls onLand once. */
export function Flyer({ from, to, dur = 0.6, height = 1.2, onLand, children, spin = true }: { from: [number, number, number]; to: [number, number, number]; dur?: number; height?: number; onLand?: () => void; children: ReactNode; spin?: boolean }) {
  const g = useRef<THREE.Group>(null);
  const t0 = useRef<number | null>(null);
  const landed = useRef(false);
  useFrame(({ clock }) => {
    const o = g.current;
    if (!o) return;
    if (t0.current === null) t0.current = clock.elapsedTime;
    const k = Math.min(1, (clock.elapsedTime - t0.current) / dur);
    o.position.set(from[0] + (to[0] - from[0]) * k, from[1] + (to[1] - from[1]) * k + Math.sin(k * Math.PI) * height, from[2] + (to[2] - from[2]) * k);
    if (spin) o.rotation.z = k * Math.PI * 2;
    if (k >= 1 && !landed.current) {
      landed.current = true;
      onLand?.();
    }
  });
  return <group ref={g}>{children}</group>;
}

/** A burst of small confetti cubes; changes of `k` fire a new burst at `at`. */
export function Burst({ k, at, color = "#FED300" }: { k: number; at: [number, number, number]; color?: string }) {
  const g = useRef<THREE.Group>(null);
  const t0 = useRef<number | null>(null);
  const lastK = useRef(k);
  const vel = useMemo(() => Array.from({ length: 14 }, (_, i) => new THREE.Vector3(Math.cos(i * 0.9) * (0.8 + (i % 3) * 0.5), 2.2 + (i % 4) * 0.6, Math.sin(i * 1.7) * 0.6)), []);
  const cols = useMemo(() => [color, "#FF5C00", "#00A341", "#ffffff"], [color]);
  useFrame(({ clock }) => {
    const o = g.current;
    if (!o) return;
    if (k !== lastK.current) {
      lastK.current = k;
      t0.current = clock.elapsedTime;
    }
    if (t0.current === null) {
      o.visible = false;
      return;
    }
    const t = clock.elapsedTime - t0.current;
    o.visible = t < 1;
    o.children.forEach((c, i) => {
      const v = vel[i];
      c.position.set(at[0] + v.x * t, at[1] + v.y * t - 4.5 * t * t, at[2] + v.z * t);
      c.rotation.set(t * 8 + i, t * 6, 0);
    });
  });
  return (
    <group ref={g} visible={false}>
      {vel.map((_, i) => (
        <mesh key={i} raycast={() => null}>
          <boxGeometry args={[0.09, 0.09, 0.02]} />
          <meshBasicMaterial color={cols[i % cols.length]} />
        </mesh>
      ))}
    </group>
  );
}

/* ── photos ───────────────────────────────────────────────────── */

/** An official photo on a plane; onTap receives image coordinates (0..1, y down). */
export function Photo({ src, w, h, onTap, onMove, frame = "#2f1c1a" }: { src: string; w: number; h: number; onTap?: (x: number, y: number, e: ThreeEvent<MouseEvent>) => void; onMove?: (x: number, y: number) => void; frame?: string }) {
  const tex = useTexture(src);
  return (
    <group>
      <mesh position={[0, 0, -0.02]} raycast={() => null}>
        <boxGeometry args={[w + 0.08, h + 0.08, 0.03]} />
        <meshStandardMaterial color={frame} />
      </mesh>
      <mesh
        onClick={(e) => {
          if (!onTap || !e.uv) return;
          e.stopPropagation();
          onTap(e.uv.x, 1 - e.uv.y, e);
        }}
        onPointerMove={(e) => {
          if (onMove && e.uv) onMove(e.uv.x, 1 - e.uv.y);
        }}
        onPointerOver={onTap ? () => (document.body.style.cursor = "crosshair") : undefined}
        onPointerOut={onTap ? () => (document.body.style.cursor = "") : undefined}
      >
        <planeGeometry args={[w, h]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </group>
  );
}

/** A photo card standing on a little easel (used for packs on a shelf). */
export function PhotoCard({ src, size = 1, onClick }: { src: string; size?: number; onClick?: () => void }) {
  return (
    <group
      onClick={(e) => {
        if (!onClick) return;
        e.stopPropagation();
        onClick();
      }}
    >
      <Suspense fallback={<mesh><boxGeometry args={[size, size, 0.04]} /><meshStandardMaterial color="#F6E3CF" /></mesh>}>
        <Photo src={src} w={size} h={size} frame="#ffffff" />
      </Suspense>
      <mesh position={[0, -size / 2 - 0.04, -0.12]} rotation={[-0.25, 0, 0]} raycast={() => null}>
        <boxGeometry args={[size * 0.5, 0.05, 0.3]} />
        <meshStandardMaterial color="#8a5a3c" />
      </mesh>
    </group>
  );
}

/* ── people ───────────────────────────────────────────────────── */

export const CAST: HumanLook[] = [
  { skin: "#B98157", hair: "#1E1410", hairStyle: "side", outfit: "shirt", top: "#DCE6F0", bottom: "#2B3A55", accent: "#F4F7FA", facial: "stubble" },
  { skin: "#9C6644", hair: "#140C08", hairStyle: "braid", outfit: "saree", top: "#C2185B", bottom: "#C2185B", accent: "#F2A900", bindi: true, slim: true, height: 0.95 },
  { skin: "#D1A276", hair: "#2A1A12", hairStyle: "curly", outfit: "tshirt", top: "#3E8E41", bottom: "#33475B", shoe: "#EDEDED", bag: { kind: "backpack", color: "#35401D" } },
  { skin: "#A86B45", hair: "#CFC8C0", hairStyle: "bald", outfit: "kurta", top: "#F4EFE6", bottom: "#F4EFE6", facial: "moustache", glasses: "#3A2A1E", height: 0.97 },
  { skin: "#8D5A3B", hair: "#1A110C", hairStyle: "short", outfit: "hoodie", top: "#4A4E69", bottom: "#2B2B2B", facial: "beard", shoe: "#F2F2F2" },
  { skin: "#B5764A", hair: "#140C08", hairStyle: "long", outfit: "salwar", top: "#26A69A", bottom: "#F3E5D0", accent: "#FED300", bindi: true, slim: true, height: 0.94 },
  { skin: "#C68B59", hair: "#1E1410", hairStyle: "side", outfit: "kurta", top: "#7B2D26", bottom: "#E8DCC8", facial: "beard", glasses: "#1A1A1A" },
  { skin: "#D9A066", hair: "#3E2723", hairStyle: "bun", outfit: "shirt", top: "#E98A7B", bottom: "#2B3A55", accent: "#F7D2CB", slim: true, height: 0.95, bag: { kind: "shoulder", color: "#1565C0" } },
];

export type Mood = "calm" | "happy" | "sad" | "angry" | "leave";

/**
 * A person who walks to `to`, then stands facing `face` (radians, 0 = towards the camera). A new `react` key with
 * mood "happy" makes them hop; "sad"/"angry" makes them shake their head and body. A bubble floats above.
 */
export function Person({ look, from, to, face = 0, react, bubble, bubbleBg = "#ffffff", speed = 1.6, onClick, onArrive, scale = 1, ring }: { look: HumanLook; from?: [number, number, number]; to: [number, number, number]; face?: number; react?: { mood: Mood; k: number }; bubble?: string; bubbleBg?: string; speed?: number; onClick?: () => void; onArrive?: () => void; scale?: number; ring?: string }) {
  const g = useRef<THREE.Group>(null);
  const body = useRef<THREE.Group>(null);
  const init = useRef(false);
  const [walking, setWalking] = useState(true);
  const walkRef = useRef(true);
  const arrived = useRef(false);
  const rT = useRef(-1);
  const lastK = useRef(react?.k);
  const onArriveRef = useRef(onArrive);
  useEffect(() => {
    onArriveRef.current = onArrive;
  });
  useEffect(() => {
    arrived.current = false;
  }, [to[0], to[1], to[2]]); // eslint-disable-line react-hooks/exhaustive-deps
  useFrame(({ clock }, dt) => {
    const o = g.current;
    if (!o) return;
    if (!init.current) {
      init.current = true;
    }
    const dx = to[0] - o.position.x;
    const dz = to[2] - o.position.z;
    const d = Math.hypot(dx, dz);
    const moving = d > 0.04;
    if (moving) {
      const step = Math.min(d, speed * dt);
      o.position.x += (dx / d) * step;
      o.position.z += (dz / d) * step;
      const want = Math.atan2(dx, dz);
      o.rotation.y += angleDiff(want, o.rotation.y) * Math.min(1, dt * 10);
    } else {
      o.rotation.y += angleDiff(face, o.rotation.y) * Math.min(1, dt * 6);
      if (!arrived.current) {
        arrived.current = true;
        onArriveRef.current?.();
      }
    }
    if (moving !== walkRef.current) {
      walkRef.current = moving;
      setWalking(moving);
    }
    if (react && react.k !== lastK.current) {
      lastK.current = react.k;
      rT.current = clock.elapsedTime;
    }
    const b = body.current;
    if (b) {
      const t = clock.elapsedTime - rT.current;
      const on = rT.current >= 0 && t < 0.9;
      const m = react?.mood;
      if (on && m === "happy") {
        b.position.y = Math.abs(Math.sin(t * Math.PI * 2.2)) * 0.28 * (1 - t / 0.9);
        b.rotation.z = 0;
      } else if (on && (m === "sad" || m === "angry")) {
        b.position.y = 0;
        b.rotation.z = Math.sin(t * 28) * 0.09 * (1 - t / 0.9);
      } else {
        b.position.y *= 0.8;
        b.rotation.z *= 0.8;
      }
    }
  });
  return (
    <group
      ref={(o) => {
        g.current = o;
        if (o && !init.current) o.position.set(...(from ?? to));
      }}
      onClick={(e) => {
        if (!onClick) return;
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={onClick ? () => (document.body.style.cursor = "pointer") : undefined}
      onPointerOut={onClick ? () => (document.body.style.cursor = "") : undefined}
    >
      <group ref={body} scale={scale}>
        <Human look={look} mode={walking ? "walk" : "stand"} />
        {/* invisible hit box so the whole body is easy to tap */}
        {onClick && (
          <mesh position={[0, 0.9, 0]} visible={false}>
            <boxGeometry args={[0.7, 1.9, 0.6]} />
            <meshBasicMaterial />
          </mesh>
        )}
      </group>
      {ring && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]} raycast={() => null}>
          <ringGeometry args={[0.38, 0.5, 32]} />
          <meshBasicMaterial color={ring} transparent opacity={0.85} />
        </mesh>
      )}
      {bubble && <Label text={bubble} position={[0, 2.25 * scale, 0]} bg={bubbleBg} h={0.17} maxW={26} />}
    </group>
  );
}

const angleDiff = (a: number, b: number) => {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
};

/* ── timers ───────────────────────────────────────────────────── */

/** A countdown in seconds that ticks while `running`; `reset(n)` restarts it. Calls onEnd once when it hits 0. */
export function useCountdown(running: boolean, onEnd: () => void) {
  const [left, setLeft] = useState(0);
  const [total, setTotal] = useState(1);
  const endRef = useRef(onEnd);
  const fired = useRef(false);
  useEffect(() => {
    endRef.current = onEnd;
  });
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      setLeft((l) => {
        const n = Math.max(0, l - 0.1);
        if (n === 0 && l > 0 && !fired.current) {
          fired.current = true;
          window.setTimeout(() => endRef.current(), 0);
        }
        return n;
      });
    }, 100);
    return () => window.clearInterval(id);
  }, [running]);
  const reset = (n: number) => {
    fired.current = false;
    setLeft(n);
    setTotal(n);
  };
  const add = (n: number) => setLeft((l) => Math.max(0.1, Math.min(total, l + n)));
  return { left, frac: total ? left / total : 0, reset, add, setLeft };
}

/* ── HUD + end card (DOM overlays for Stage3D) ────────────────── */

export function Hud({ hearts, maxHearts, frac, timeLabel, score, combo, extra }: { hearts?: number; maxHearts?: number; frac?: number; timeLabel?: string; score?: number; combo?: number; extra?: ReactNode }) {
  return (
    <div className="pointer-events-none absolute inset-x-2 top-2 flex flex-wrap items-center gap-1.5 text-[0.8rem] font-extrabold text-cocoa sm:text-[0.85rem]" data-testid="hud">
      {maxHearts !== undefined && (
        <span className="flex items-center gap-0.5 rounded-full bg-white/90 px-2 py-1 shadow" aria-label={`${hearts} of ${maxHearts} lives`}>
          {Array.from({ length: maxHearts }, (_, i) => (
            <Heart key={i} className={`size-3.5 ${i < (hearts ?? 0) ? "fill-error text-error" : "text-cocoa/25"}`} />
          ))}
        </span>
      )}
      {frac !== undefined && (
        <span className="flex min-w-[7.5rem] flex-1 items-center gap-1.5 rounded-full bg-white/90 px-2 py-1 shadow sm:max-w-[14rem]">
          <Timer className="size-3.5 shrink-0" />
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-cocoa/10">
            <span className={`block h-full rounded-full transition-[width] duration-100 ${frac < 0.25 ? "bg-error" : frac < 0.5 ? "bg-haldi" : "bg-success"}`} style={{ width: `${Math.max(0, Math.min(1, frac)) * 100}%` }} />
          </span>
          {timeLabel && <span className="tabular-nums">{timeLabel}</span>}
        </span>
      )}
      {score !== undefined && <span className="rounded-full bg-cocoa px-2.5 py-1 tabular-nums text-cream shadow" data-testid="score">{score} pts</span>}
      {combo !== undefined && combo > 1 && (
        <motion.span key={combo} initial={{ scale: 1.4 }} animate={{ scale: 1 }} className="flex items-center gap-1 rounded-full bg-orange px-2 py-1 text-white shadow">
          <Flame className="size-3.5" /> x{combo}
        </motion.span>
      )}
      {extra}
    </div>
  );
}

/** A short win / lose card over the stage, with stars and Restart / continue. */
export function EndCard({ win, title, text, stars, onRestart, onNext, nextLabel = "Continue" }: { win: boolean; title: string; text: string; stars?: number; onRestart?: () => void; onNext?: () => void; nextLabel?: string }) {
  useEffect(() => {
    celebrate(win ? { score: stars ?? 3, max: 3, title } : { score: 0, max: 3, title, lost: true });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- once, when the end card appears
  return (
    <div className="absolute inset-0 grid place-items-center bg-cocoa/35 p-3 backdrop-blur-[2px]" data-testid={win ? "end-win" : "end-lose"}>
      <motion.div initial={{ scale: 0.85, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className={`w-full max-w-sm rounded-[22px] border-2 bg-white p-4 text-center shadow-[3px_3px_0_0_#2f1c1a] ${win ? "border-success" : "border-error"}`}>
        <span className={`mx-auto grid size-12 place-items-center rounded-full ${win ? "bg-success text-white" : "bg-error/15 text-error"}`}>{win ? <Trophy className="size-6" /> : <Frown className="size-6" />}</span>
        <div className="mt-2 font-display text-[1.35rem] font-semibold leading-tight text-cocoa">{title}</div>
        {stars !== undefined && (
          <div className="mt-1 flex justify-center gap-1" aria-label={`${stars} of 3 stars`}>
            {[0, 1, 2].map((i) => (
              <motion.span key={i} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.15 + i * 0.15 }}>
                <Star className={`size-7 ${i < stars ? "fill-haldi text-[#C9A400]" : "text-cocoa/20"}`} />
              </motion.span>
            ))}
          </div>
        )}
        <p className="mt-2 text-[0.95rem] leading-snug text-cocoa">{text}</p>
        <div className="mt-3 flex flex-wrap justify-center gap-2">
          {onNext && (
            <button onClick={onNext} className="eb-btn eb-btn-primary !py-2 !text-[0.95rem] !normal-case">
              {nextLabel} <ArrowRight className="size-4" />
            </button>
          )}
          {onRestart && (
            <button onClick={onRestart} className="flex items-center gap-1.5 rounded-xl border border-cocoa/25 bg-white px-3 py-2 text-[0.95rem] font-bold text-cocoa hover:border-cocoa">
              <RotateCcw className="size-4" /> Play again
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

/** A start card over the stage: the game waits until the student presses Start. */
export function StartCard({ title, lines, onStart, label = "Start" }: { title: string; lines: string[]; onStart: () => void; label?: string }) {
  return (
    <div className="absolute inset-0 grid place-items-center bg-cocoa/25 p-3" data-testid="start">
      <div className="w-full max-w-sm rounded-[22px] border-2 border-cocoa bg-white p-4 shadow-[3px_3px_0_0_#2f1c1a]">
        <div className="font-display text-[1.25rem] font-semibold leading-tight text-cocoa">{title}</div>
        <ul className="mt-2 grid gap-1 text-[0.92rem] leading-snug text-cocoa">
          {lines.map((l) => (
            <li key={l} className="flex gap-2">
              <span className="mt-[0.45rem] size-1.5 shrink-0 rounded-full bg-orange" />
              {l}
            </li>
          ))}
        </ul>
        <button onClick={onStart} className="eb-btn eb-btn-primary mt-3 w-full !py-2 !normal-case">
          {label} <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

/** Ground + back wall for a simple room. */
export function Room({ floor = "#E9D3BB", wall = "#FFF5EE", w = 16, d = 10, wallZ = -3 }: { floor?: string; wall?: string; w?: number; d?: number; wallZ?: number }) {
  return (
    <>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, wallZ + d / 2]} receiveShadow raycast={() => null}>
        <planeGeometry args={[w, d]} />
        <meshStandardMaterial color={floor} roughness={0.9} />
      </mesh>
      <mesh position={[0, 3, wallZ]} raycast={() => null}>
        <planeGeometry args={[w, 6]} />
        <meshStandardMaterial color={wall} roughness={0.95} />
      </mesh>
    </>
  );
}

/** Two-light rig used by every game (ambient + one sun). */
export function Lights({ shadow = true }: { shadow?: boolean }) {
  return (
    <>
      <ambientLight intensity={1.1} />
      <directionalLight position={[3, 7, 6]} intensity={1.45} castShadow={shadow} shadow-mapSize={[1024, 1024]} />
    </>
  );
}
