"use client";

import { Suspense, useEffect, useMemo } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";
import { RoundedBox, useTexture } from "@react-three/drei";

/**
 * Light 3D building blocks shared by the Chapter 4.2 games: canvas-text labels, official Eat Better pack boxes
 * (pack photo as the front texture) and generic category packs for competitors (category word only — no
 * competitor names, logos or pack art). Geometries/materials are cached so many packs cost little.
 */

const texCache = new Map<string, THREE.CanvasTexture>();

function fontFamily(kind: "display" | "sans") {
  if (typeof window === "undefined") return "system-ui, sans-serif";
  const v = getComputedStyle(document.documentElement).getPropertyValue(kind === "display" ? "--font-fredoka" : "--font-tommy").trim();
  return v ? `${v}, system-ui, sans-serif` : "system-ui, sans-serif";
}

export type LabelOpts = { bg?: string; fg?: string; font?: "display" | "sans"; weight?: number; px?: number; radius?: number; border?: string; align?: "center" | "left" };

/** A canvas texture with one or more centred lines of text, auto-shrunk to fit. Cached by content. */
export function labelTexture(lines: string[], w = 512, h = 128, o: LabelOpts = {}) {
  const key = JSON.stringify([lines, w, h, o]);
  const hit = texCache.get(key);
  if (hit) return hit;
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  const r = o.radius ?? Math.min(w, h) * 0.18;
  if (o.bg && o.bg !== "transparent") {
    g.fillStyle = o.bg;
    g.beginPath();
    g.roundRect(2, 2, w - 4, h - 4, r);
    g.fill();
    if (o.border) {
      g.lineWidth = 4;
      g.strokeStyle = o.border;
      g.stroke();
    }
  }
  g.fillStyle = o.fg ?? "#2F1C1A";
  g.textAlign = o.align === "left" ? "left" : "center";
  g.textBaseline = "middle";
  const fam = fontFamily(o.font ?? "display");
  const n = lines.length;
  let px = o.px ?? Math.floor((h * 0.62) / n);
  const maxW = w * 0.9;
  for (;;) {
    g.font = `${o.weight ?? 600} ${px}px ${fam}`;
    if (lines.every((l) => g.measureText(l).width <= maxW) || px < 10) break;
    px -= 2;
  }
  const lh = px * 1.15;
  const y0 = h / 2 - ((n - 1) * lh) / 2;
  lines.forEach((l, i) => g.fillText(l, o.align === "left" ? w * 0.05 : w / 2, y0 + i * lh));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  texCache.set(key, t);
  return t;
}

/** A flat text sign (unlit, so it reads in any light). */
export function Label({ lines, width, height, position, rotation, o, px = 512 }: { lines: string[]; width: number; height: number; position?: [number, number, number]; rotation?: [number, number, number]; o?: LabelOpts; px?: number }) {
  const tex = useMemo(() => labelTexture(lines, px, Math.round((px * height) / width), o), [lines, width, height, o, px]);
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={tex} transparent toneMapped={false} />
    </mesh>
  );
}

const sideMats = new Map<string, THREE.MeshStandardMaterial>();
export function flatMat(color: string, roughness = 0.6) {
  const k = `${color}|${roughness}`;
  let m = sideMats.get(k);
  if (!m) {
    m = new THREE.MeshStandardMaterial({ color, roughness });
    sideMats.set(k, m);
  }
  return m;
}

function PhotoBoxInner({ img, size, side }: { img: string; size: [number, number, number]; side: string }) {
  const tex = useTexture(img, (t) => {
    (Array.isArray(t) ? t : [t]).forEach((x) => (x.colorSpace = THREE.SRGBColorSpace));
  });
  const mats = useMemo(() => {
    const s = flatMat(side);
    const front = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.55 });
    return [s, s, s, s, front, s];
  }, [tex, side]);
  return (
    <mesh material={mats} castShadow>
      <boxGeometry args={size} />
    </mesh>
  );
}

/** An official Eat Better pack: a box whose front face is the pack photo. */
export function PhotoBox({ img, size = [0.5, 0.5, 0.14], side = "#F6E3CF", position, rotation }: { img: string; size?: [number, number, number]; side?: string; position?: [number, number, number]; rotation?: [number, number, number] }) {
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

/** A generic competitor pack: plain coloured pouch with only a category word on it. */
export function GenericPack({ word, color, ink = "#FFF5EE", size = [0.36, 0.5, 0.12], position, rotation }: { word: string; color: string; ink?: string; size?: [number, number, number]; position?: [number, number, number]; rotation?: [number, number, number] }) {
  const tex = useMemo(() => labelTexture([word], 256, 128, { fg: ink, font: "display", weight: 700 }), [word, ink]);
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={size} radius={0.03} smoothness={2} material={flatMat(color, 0.45)} castShadow />
      <mesh position={[0, size[1] * 0.08, size[2] / 2 + 0.002]}>
        <planeGeometry args={[size[0] * 0.92, size[0] * 0.46]} />
        <meshBasicMaterial map={tex} transparent toneMapped={false} />
      </mesh>
    </group>
  );
}

/**
 * Points the camera at `center` from direction `dir`, backing off far enough that `width` world units fit across
 * the stage at the current aspect ratio (so the same scene works at 1440 px and 390 px), and `height` fits vertically.
 */
export function FitRig({ center, dir, width, height = 0, minDist = 4 }: { center: [number, number, number]; dir: [number, number, number]; width: number; height?: number; minDist?: number }) {
  const { camera, size } = useThree();
  const key = `${center.join()}|${dir.join()}|${width}|${height}|${minDist}`;
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const aspect = size.width / Math.max(1, size.height);
    const t = Math.tan(((cam.fov ?? 42) * Math.PI) / 360);
    const dW = width / 2 / (t * aspect);
    const dH = height / 2 / t;
    const d = Math.max(minDist, dW, dH) * 1.04;
    const v = new THREE.Vector3(...dir).normalize().multiplyScalar(d);
    cam.position.set(center[0] + v.x, center[1] + v.y, center[2] + v.z);
    cam.lookAt(...center);
    cam.updateProjectionMatrix();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [camera, size.width, size.height, key]);
  return null;
}

/** Soft, cheap lighting rig used by every 4.2 stage. */
export function StageLights({ shadows = true }: { shadows?: boolean }) {
  return (
    <>
      <hemisphereLight args={["#FFF4E6", "#8A6A55", 1.15]} />
      <directionalLight position={[3, 7, 5]} intensity={1.6} castShadow={shadows} shadow-mapSize={[1024, 1024]} shadow-camera-left={-6} shadow-camera-right={6} shadow-camera-top={6} shadow-camera-bottom={-6} />
    </>
  );
}

/** Floor that receives shadows. */
export function Floor({ color = "#EBD9C4", size = 30 }: { color?: string; size?: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
      <planeGeometry args={[size, size]} />
      <meshStandardMaterial color={color} roughness={0.9} />
    </mesh>
  );
}
