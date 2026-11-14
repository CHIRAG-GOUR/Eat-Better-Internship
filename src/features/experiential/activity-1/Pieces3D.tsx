"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { ING } from "./data";

/**
 * Real-looking 3D ingredient pieces for the lab: each ingredient has its own shape and size (almonds are pointed
 * teardrops, cashews curved kidneys, dates wrinkled glossy ovals, orange and lime are segmented slices, chillies are
 * tapered pods, mint is leaves, seeds and grains are many tiny instanced pieces…). Pieces of one kind share a
 * geometry and material and are drawn as one InstancedMesh, so jars and trays stay cheap on phones.
 */

type Part = { geo: () => THREE.BufferGeometry; color: string; rough?: number; metal?: number; scale: [number, number, number]; offset?: [number, number, number]; opacity?: number; map?: () => THREE.Texture };
type Def = { parts: Part[]; count: number; spread: number; kind?: "pile" | "mound" | "single" };

const cache = new Map<string, THREE.BufferGeometry>();
const G = (key: string, make: () => THREE.BufferGeometry) => () => {
  let g = cache.get(key);
  if (!g) cache.set(key, (g = make()));
  return g;
};

const sphere = G("sphere", () => new THREE.SphereGeometry(1, 14, 10));
const lowSphere = G("lowSphere", () => new THREE.SphereGeometry(1, 6, 5));
const box = G("box", () => new THREE.BoxGeometry(1, 1, 1));
const teardrop = G("teardrop", () => {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    pts.push(new THREE.Vector2(Math.pow(Math.sin(Math.PI * t), 0.85) * (1 - 0.45 * t), t * 2 - 1));
  }
  return new THREE.LatheGeometry(pts, 12);
});
const kidney = G("kidney", () => new THREE.TorusGeometry(1, 0.46, 8, 14, Math.PI * 1.15));
const disc = G("disc", () => new THREE.CylinderGeometry(1, 1, 1, 20));
const cone = G("cone", () => new THREE.ConeGeometry(1, 1, 18));
const capsule = G("capsule", () => new THREE.CapsuleGeometry(0.5, 1, 4, 10));
const pod = G("pod", () => {
  const pts: THREE.Vector2[] = [];
  for (let i = 0; i <= 12; i++) {
    const t = i / 12;
    pts.push(new THREE.Vector2(Math.max(0.02, (1 - t) * Math.pow(Math.sin(Math.PI * (0.5 + t * 0.5)) + 0.25, 0.7)), t * 2 - 1));
  }
  return new THREE.LatheGeometry(pts, 12);
});
const leaf = G("leaf", () => {
  const s = new THREE.Shape();
  s.moveTo(0, -1);
  s.quadraticCurveTo(0.9, -0.2, 0, 1);
  s.quadraticCurveTo(-0.9, -0.2, 0, -1);
  return new THREE.ShapeGeometry(s, 8);
});
const shard = G("shard", () => new THREE.DodecahedronGeometry(1, 0));

const sliceTex = (rind: string, flesh: string, seg: string) => () => {
  const c = document.createElement("canvas");
  c.width = c.height = 128;
  const g = c.getContext("2d")!;
  g.fillStyle = rind;
  g.beginPath();
  g.arc(64, 64, 64, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = flesh;
  g.beginPath();
  g.arc(64, 64, 54, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = seg;
  g.lineWidth = 4;
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2;
    g.beginPath();
    g.moveTo(64, 64);
    g.lineTo(64 + Math.cos(a) * 54, 64 + Math.sin(a) * 54);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
};

const tiny = (color: string, s: [number, number, number], count = 70): Def => ({ parts: [{ geo: lowSphere, color, rough: 0.85, scale: s }], count, spread: 1 });

export const DEFS: Record<string, Def> = {
  dates: { parts: [{ geo: sphere, color: "#4A230F", rough: 0.32, scale: [0.042, 0.04, 0.08] }], count: 10, spread: 1 },
  raisins: { parts: [{ geo: sphere, color: "#4F1F3A", rough: 0.9, scale: [0.026, 0.02, 0.032] }, { geo: sphere, color: "#B07A2A", rough: 0.9, scale: [0.025, 0.019, 0.03], offset: [0.06, 0, 0.04] }], count: 14, spread: 1 },
  jaggery: { parts: [{ geo: box, color: "#B8742A", rough: 0.6, scale: [0.07, 0.05, 0.07] }], count: 6, spread: 1 },
  almonds: { parts: [{ geo: teardrop, color: "#A8652F", rough: 0.75, scale: [0.03, 0.055, 0.017] }], count: 14, spread: 1 },
  cashews: { parts: [{ geo: kidney, color: "#EBD3A6", rough: 0.6, scale: [0.03, 0.03, 0.03] }], count: 12, spread: 1 },
  peanuts: { parts: [{ geo: sphere, color: "#D2A26A", rough: 0.8, scale: [0.022, 0.02, 0.022] }, { geo: sphere, color: "#C99A62", rough: 0.8, scale: [0.02, 0.018, 0.02], offset: [0.0, 0.0, 0.028] }], count: 16, spread: 1 },
  pistachios: { parts: [{ geo: sphere, color: "#E2D0AB", rough: 0.7, scale: [0.026, 0.022, 0.038] }, { geo: sphere, color: "#7FA33F", rough: 0.6, scale: [0.016, 0.018, 0.026], offset: [0, 0.008, 0] }], count: 12, spread: 1 },
  hazelnuts: { parts: [{ geo: sphere, color: "#8E5228", rough: 0.55, scale: [0.033, 0.034, 0.033] }, { geo: sphere, color: "#D9B58C", rough: 0.8, scale: [0.02, 0.012, 0.02], offset: [0, 0.028, 0] }], count: 12, spread: 1 },
  pumpkin: { parts: [{ geo: teardrop, color: "#5E7A3A", rough: 0.6, scale: [0.02, 0.035, 0.006] }], count: 22, spread: 1 },
  sunflower: { parts: [{ geo: teardrop, color: "#3A3732", rough: 0.6, scale: [0.014, 0.03, 0.007] }], count: 26, spread: 1 },
  chia: tiny("#57534D", [0.007, 0.005, 0.009], 120),
  sesame: { parts: [{ geo: teardrop, color: "#EFE3C8", rough: 0.7, scale: [0.006, 0.011, 0.003] }], count: 110, spread: 1 },
  millets: tiny("#C9A266", [0.008, 0.007, 0.008], 140),
  quinoa: { parts: [{ geo: disc, color: "#E9D9B0", rough: 0.8, scale: [0.009, 0.004, 0.009] }], count: 130, spread: 1 },
  chickpea: { parts: [{ geo: sphere, color: "#E2B04A", rough: 0.85, scale: [0.022, 0.021, 0.022] }], count: 18, spread: 1 },
  oats: { parts: [{ geo: sphere, color: "#D8C49A", rough: 0.9, scale: [0.03, 0.006, 0.022] }], count: 26, spread: 1 },
  cocoa: { parts: [{ geo: cone, color: "#4A2A1E", rough: 0.95, scale: [0.12, 0.08, 0.12] }], count: 1, spread: 0, kind: "mound" },
  coffee: { parts: [{ geo: sphere, color: "#3B2418", rough: 0.45, scale: [0.018, 0.013, 0.026] }], count: 26, spread: 1 },
  vanilla: { parts: [{ geo: capsule, color: "#2E1F16", rough: 0.6, scale: [0.012, 0.16, 0.012] }], count: 6, spread: 1 },
  orange: { parts: [{ geo: disc, color: "#F28C1C", rough: 0.5, scale: [0.06, 0.012, 0.06], map: sliceTex("#F28C1C", "#FBB040", "#FFE2A6") }], count: 5, spread: 1 },
  ginger: { parts: [{ geo: capsule, color: "#D9B36C", rough: 0.85, scale: [0.03, 0.06, 0.03] }, { geo: capsule, color: "#CFA65E", rough: 0.85, scale: [0.025, 0.045, 0.025], offset: [0.035, 0.01, 0.01] }], count: 5, spread: 1 },
  coconut: { parts: [{ geo: box, color: "#F5F1E8", rough: 0.9, scale: [0.03, 0.004, 0.012] }], count: 40, spread: 1 },
  mint: { parts: [{ geo: leaf, color: "#3E8E41", rough: 0.6, scale: [0.035, 0.05, 0.035] }], count: 16, spread: 1 },
  chilli: { parts: [{ geo: pod, color: "#C62828", rough: 0.35, scale: [0.016, 0.06, 0.016] }, { geo: capsule, color: "#2E7D32", rough: 0.6, scale: [0.006, 0.015, 0.006], offset: [0, 0.066, 0] }], count: 7, spread: 1 },
  lime: { parts: [{ geo: disc, color: "#7CB342", rough: 0.5, scale: [0.045, 0.012, 0.045], map: sliceTex("#689F38", "#DCEDC8", "#9CCC65") }], count: 5, spread: 1 },
  tamarind: { parts: [{ geo: capsule, color: "#6D3B1F", rough: 0.7, scale: [0.022, 0.12, 0.02] }], count: 5, spread: 1 },
  spices: { parts: [{ geo: cone, color: "#B5541E", rough: 0.95, scale: [0.12, 0.08, 0.12] }], count: 1, spread: 0, kind: "mound" },
  salt: { parts: [{ geo: box, color: "#F4F6F8", rough: 0.4, scale: [0.01, 0.01, 0.01] }], count: 90, spread: 1 },
  sunoil: { parts: [{ geo: disc, color: "#F2C94C", rough: 0.1, scale: [0.06, 0.2, 0.06], opacity: 0.85 }, { geo: disc, color: "#2E7D32", rough: 0.5, scale: [0.022, 0.04, 0.022], offset: [0, 0.12, 0] }], count: 1, spread: 0, kind: "single" },
  oliveoil: { parts: [{ geo: disc, color: "#9AA63A", rough: 0.1, scale: [0.055, 0.2, 0.055], opacity: 0.85 }, { geo: disc, color: "#2B2B2B", rough: 0.5, scale: [0.02, 0.04, 0.02], offset: [0, 0.12, 0] }], count: 1, spread: 0, kind: "single" },
  sugar: { parts: [{ geo: box, color: "#FFFFFF", rough: 0.3, scale: [0.04, 0.04, 0.04] }], count: 10, spread: 1 },
  palm: { parts: [{ geo: disc, color: "#E07B12", rough: 0.4, metal: 0.4, scale: [0.09, 0.2, 0.09] }, { geo: disc, color: "#9A4F0A", rough: 0.4, metal: 0.4, scale: [0.092, 0.02, 0.092], offset: [0, 0.1, 0] }], count: 1, spread: 0, kind: "single" },
  maida: { parts: [{ geo: sphere, color: "#FFFFFF", rough: 0.95, scale: [0.1, 0.12, 0.07] }], count: 1, spread: 0, kind: "single" },
};

/** Deterministic pseudo-random for stable layouts. */
const hash = (n: number) => {
  const x = Math.sin(n * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

function InstancedPart({ part, count, radius, height, seed, spread, kind }: { part: Part; count: number; radius: number; height: number; seed: number; spread: number; kind: Def["kind"] }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  const material = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: part.map ? "#FFFFFF" : part.color, roughness: part.rough ?? 0.7, metalness: part.metal ?? 0, transparent: (part.opacity ?? 1) < 1, opacity: part.opacity ?? 1, side: part.geo === leaf ? THREE.DoubleSide : THREE.FrontSide });
    if (part.map) {
      const t = part.map();
      // slices show the segmented face on top, plain rind colour on the side
      m.map = t;
    }
    return m;
  }, [part]);
  useLayoutEffect(() => {
    const mesh = ref.current;
    if (!mesh) return;
    const o = new THREE.Object3D();
    for (let i = 0; i < count; i++) {
      const a = hash(seed + i * 7.1) * Math.PI * 2;
      const r = kind === "pile" || !kind ? Math.sqrt(hash(seed + i * 3.3)) * radius * spread : 0;
      const layer = Math.floor(i / Math.max(4, Math.round(count / Math.max(1, height / 0.03))));
      o.position.set(Math.cos(a) * r + (part.offset?.[0] ?? 0), kind === "pile" || !kind ? Math.min(height, layer * 0.022 + hash(seed + i) * 0.01) + part.scale[1] : part.scale[1] / 2 + (part.offset?.[1] ?? 0), Math.sin(a) * r + (part.offset?.[2] ?? 0));
      if (kind === "pile" || !kind) o.rotation.set(hash(seed + i * 1.7) * Math.PI, hash(seed + i * 2.9) * Math.PI * 2, hash(seed + i * 5.3) * Math.PI);
      else o.rotation.set(0, 0, 0);
      o.scale.set(...part.scale);
      o.updateMatrix();
      mesh.setMatrixAt(i, o.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }, [count, radius, height, seed, spread, kind, part]);
  return <instancedMesh ref={ref} args={[part.geo(), material, count]} castShadow />;
}

/** A pile (or mound, or single item) of one ingredient, sized to fit a circle of `radius`. */
export function IngredientPieces({ id, radius = 0.15, height = 0.15, seed = 1, scale = 1 }: { id: string; radius?: number; height?: number; seed?: number; scale?: number }) {
  const def = DEFS[id];
  if (!def) return null;
  return (
    <group scale={scale}>
      {def.parts.map((p, i) => (
        <InstancedPart key={i} part={p} count={def.count} radius={radius / scale} height={height / scale} seed={seed + i * 31} spread={def.spread} kind={def.kind} />
      ))}
    </group>
  );
}

/** Foreign matter for the sorting tray: real-looking stone, shell fragment, twig and plastic shard. */
export function ForeignItem({ kind }: { kind: "stone" | "shell" | "twig" | "plastic" }) {
  if (kind === "stone")
    return (
      <mesh geometry={shard()} scale={[0.03, 0.022, 0.026]} castShadow>
        <meshStandardMaterial color="#7D7A74" roughness={0.95} flatShading />
      </mesh>
    );
  if (kind === "shell")
    return (
      <mesh scale={[0.035, 0.02, 0.025]} castShadow>
        <sphereGeometry args={[1, 10, 8, 0, Math.PI * 1.2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#7A4A28" roughness={0.8} side={THREE.DoubleSide} />
      </mesh>
    );
  if (kind === "twig")
    return (
      <group rotation={[0, 0, Math.PI / 2]}>
        <mesh scale={[0.006, 0.11, 0.006]} castShadow>
          <cylinderGeometry args={[1, 0.8, 1, 6]} />
          <meshStandardMaterial color="#5B3A22" roughness={0.9} />
        </mesh>
        <mesh position={[0.012, 0.02, 0]} rotation={[0, 0, -0.7]} scale={[0.004, 0.04, 0.004]}>
          <cylinderGeometry args={[1, 0.7, 1, 5]} />
          <meshStandardMaterial color="#5B3A22" roughness={0.9} />
        </mesh>
      </group>
    );
  return (
    <mesh rotation={[0.2, 0.6, 0]} scale={[0.04, 0.004, 0.028]} castShadow>
      <boxGeometry args={[1, 1, 1]} />
      <meshPhysicalMaterial color="#4FC3F7" roughness={0.15} transmission={0.4} transparent opacity={0.8} />
    </mesh>
  );
}

export const ingColor = (id: string) => ING[id]?.color ?? "#999";

/** One single piece of an ingredient (for the sorting tray). */
export function OnePiece({ id }: { id: string }) {
  const def = DEFS[id] ?? DEFS.almonds;
  return (
    <group>
      {def.parts.map((p, i) => (
        <mesh key={i} geometry={p.geo()} position={[p.offset?.[0] ?? 0, p.scale[1] + (p.offset?.[1] ?? 0), p.offset?.[2] ?? 0]} scale={p.scale} castShadow>
          <meshStandardMaterial color={p.color} roughness={p.rough ?? 0.7} metalness={p.metal ?? 0} side={THREE.DoubleSide} />
        </mesh>
      ))}
    </group>
  );
}
