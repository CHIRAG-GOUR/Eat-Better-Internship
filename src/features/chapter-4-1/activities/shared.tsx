"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";

/** Shared pieces for the Chapter 4.1 games: number input, helpers, camera fit, QA probe and pack meshes. */

export const num = (s: string) => Number(String(s).replace(/[,\s₹%]/g, "").replace(/rs\.?/i, ""));
export const words = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;
export const rint = (a: number, b: number) => Math.floor(a + Math.random() * (b - a + 1));
export const pick = <T,>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)];
export const r2 = (n: number) => Math.round(n * 100) / 100;
export const inr = (n: number) => `₹${Number.isInteger(n) ? n : n.toFixed(2)}`;

export function shuffle<T>(a: readonly T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

export function NumIn({ value, onChange, unit, label, disabled, w = "w-28", onEnter, prefix }: { value: string; onChange: (v: string) => void; unit?: string; label: string; disabled?: boolean; w?: string; onEnter?: () => void; prefix?: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      {prefix && <span className="text-[1.05rem] font-bold text-cocoa-2">{prefix}</span>}
      <input
        inputMode="decimal"
        aria-label={label}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && onEnter?.()}
        placeholder="?"
        className={`${w} rounded-xl border-2 border-cocoa/20 bg-white px-3 py-2 text-right font-display text-[1.15rem] font-semibold tabular-nums text-cocoa outline-none focus:border-orange disabled:bg-success/10`}
      />
      {unit && <span className="text-[0.95rem] font-bold text-cocoa-2">{unit}</span>}
    </span>
  );
}

/** Frames a world-space box (width × height around y = cy) whatever the canvas shape, phone or desktop. */
export function FitCam({ width, height, cy = 0, tilt = 0 }: { width: number; height: number; cy?: number; tilt?: number }) {
  const { camera, size } = useThree();
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const t = Math.tan(THREE.MathUtils.degToRad(cam.fov / 2));
    const aspect = size.width / size.height;
    const z = Math.max(width / 2 / (t * aspect), height / 2 / t) + 0.6;
    cam.position.set(0, cy + tilt, z);
    cam.lookAt(0, cy, 0);
    cam.updateProjectionMatrix();
  }, [camera, size, width, height, cy, tilt]);
  return null;
}

declare global {
  interface Window {
    __eb41?: Record<string, (id: string) => { x: number; y: number } | null>;
  }
}

/** QA hook: window.__eb41[name](id) → page coordinates of a named object, so tests can click objects in the 3D scene. */
export function Probe({ name, points }: { name: string; points: () => Record<string, [number, number, number]> }) {
  const { camera, gl } = useThree();
  const ref = useRef(points);
  useEffect(() => {
    ref.current = points;
  });
  useEffect(() => {
    const reg = (window.__eb41 ??= {});
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

/** A canvas-drawn pack face (used for practice packs and ingredient blocks so they are clearly not real photos). */
export function makeFace(lines: string[], bg: string, fg = "#2f1c1a", banner?: string, size = 256) {
  const c = document.createElement("canvas");
  c.width = c.height = size;
  const g = c.getContext("2d")!;
  g.fillStyle = bg;
  g.fillRect(0, 0, size, size);
  g.fillStyle = "rgba(255,255,255,0.18)";
  g.fillRect(0, 0, size, size * 0.12);
  g.fillStyle = fg;
  g.textAlign = "center";
  g.textBaseline = "middle";
  const fs = Math.floor(size * (lines.length > 2 ? 0.14 : 0.17));
  g.font = `800 ${fs}px system-ui, sans-serif`;
  lines.forEach((l, i) => g.fillText(l, size / 2, size * 0.46 + (i - (lines.length - 1) / 2) * fs * 1.15, size * 0.9));
  if (banner) {
    g.fillStyle = "#FED300";
    g.fillRect(0, size * 0.74, size, size * 0.2);
    g.fillStyle = "#2f1c1a";
    g.font = `800 ${Math.floor(size * 0.13)}px system-ui, sans-serif`;
    g.fillText(banner, size / 2, size * 0.845, size * 0.94);
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** A pack: a box whose front face carries a real photo (src) or a drawn practice face (face). */
export function PackBox({ src, face, size = [1, 1.1, 0.5] }: { src?: string; face?: THREE.Texture; size?: [number, number, number] }) {
  return src ? <PhotoBox src={src} size={size} /> : <FaceBox face={face!} size={size} />;
}

function BoxMats({ map, side }: { map: THREE.Texture; side: string }) {
  return (
    <>
      {[0, 1, 2, 3].map((k) => (
        <meshStandardMaterial key={k} attach={`material-${k}`} color={side} roughness={0.85} />
      ))}
      <meshBasicMaterial attach="material-4" map={map} toneMapped={false} />
      <meshStandardMaterial attach="material-5" color={side} roughness={0.85} />
    </>
  );
}

function PhotoBox({ src, size }: { src: string; size: [number, number, number] }) {
  const tex = useTexture(src);
  return (
    <mesh castShadow>
      <boxGeometry args={size} />
      <BoxMats map={tex} side="#d9a066" />
    </mesh>
  );
}

function FaceBox({ face, size }: { face: THREE.Texture; size: [number, number, number] }) {
  return (
    <mesh castShadow>
      <boxGeometry args={size} />
      <BoxMats map={face} side="#d9a066" />
    </mesh>
  );
}

/** Moves its group smoothly towards a target, with an optional wobble while selected. */
export function Mover({ target, selected, children, onClick, onOver }: { target: [number, number, number]; selected?: boolean; children: React.ReactNode; onClick?: () => void; onOver?: (o: boolean) => void }) {
  const g = useRef<THREE.Group>(null);
  const init = useRef(false);
  useFrame(({ clock }, dt) => {
    const o = g.current;
    if (!o) return;
    if (!init.current) {
      o.position.set(...target);
      init.current = true;
    }
    const k = 1 - Math.exp(-dt * 9);
    o.position.x += (target[0] - o.position.x) * k;
    o.position.y += (target[1] - o.position.y) * k;
    o.position.z += (target[2] - o.position.z) * k;
    o.rotation.y = selected ? Math.sin(clock.elapsedTime * 5) * 0.12 : o.rotation.y * 0.85;
  });
  return (
    <group
      ref={g}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onPointerOver={(e) => {
        e.stopPropagation();
        if (onClick) document.body.style.cursor = "pointer";
        onOver?.(true);
      }}
      onPointerOut={() => {
        document.body.style.cursor = "";
        onOver?.(false);
      }}
    >
      {children}
    </group>
  );
}

/** A soft orange halo behind a selected object. */
export function Halo({ w = 1.35, h = 1.5, color = "#FF5C00" }: { w?: number; h?: number; color?: string }) {
  const m = useRef<THREE.MeshBasicMaterial>(null);
  useFrame(({ clock }) => {
    if (m.current) m.current.opacity = 0.35 + Math.sin(clock.elapsedTime * 6) * 0.15;
  });
  return (
    <mesh position={[0, 0, -0.4]}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial ref={m} color={color} transparent opacity={0.4} depthWrite={false} />
    </mesh>
  );
}

/**
 * A text label drawn to a canvas and shown as a sprite. (drei's <Html> mounts a second React root, and unmounting it
 * while Stage3D tears the canvas down on scroll throws, so labels are drawn in WebGL instead.)
 */
export function Label({ text, position, bg = "#ffffff", fg = "#2f1c1a", border = "#2f1c1a", h = 0.26, mono = false, rot = 0 }: { text: string; position: [number, number, number]; bg?: string; fg?: string; border?: string; h?: number; mono?: boolean; rot?: number }) {
  const { tex, w, hh } = useMemo(() => {
    const px = 46;
    const lines = text.split("\n");
    const c = document.createElement("canvas");
    const g = c.getContext("2d")!;
    const font = `700 ${px}px ${mono ? "ui-monospace, monospace" : "system-ui, sans-serif"}`;
    g.font = font;
    const tw = Math.max(...lines.map((l) => g.measureText(l).width));
    const pad = 16;
    const lh = px * 1.18;
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
  }, [text, bg, fg, border, h, mono]);
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <sprite position={position} scale={[w, hh, 1]} raycast={() => null} renderOrder={10} material-rotation={rot}>
      <spriteMaterial map={tex} transparent depthTest={false} />
    </sprite>
  );
}
