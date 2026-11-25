"use client";
/* eslint-disable react-hooks/immutability -- three.js objects and canvas textures are animated inside useFrame by design */

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import type { HumanLook } from "@/components/world2/Human";
import { Instanced, Walker, Worker, type Inst } from "@/components/world3/parts";
import { boxGeo, canvasTexture, C, drawText, mat, packMaterials, photoTex, SKUS } from "./kit";
import { fillRun, Packs, type PackItem } from "./Packs";
import { Box, Glow, Label, TextBoard, useLiveCanvas, useTex } from "./bits";

/**
 * Chapter 4.1 — the flagship hypermarket (bright, airy interior). A wide promenade runs down x = 0 from the
 * glass entrance (z = +8) between tall gondola shelves (runs z -1…-10 and -12…-21, cross aisle at z = -11)
 * to a raised island with a giant digital weighing scale (z ≈ -26) that cycles through the four SKUs of the
 * pricing table, then the checkout lanes (right), the online-orders dispatch corner with the order counter
 * (left) and, under a double-height ceiling, the finance wall where FY23 → FY24 revenue rises as two towers.
 */

export const STORE = { x: 18, front: 8, back: -48, low: 8.5, high: 12, step: -32 };
const GX = [3.6, 6.8, 10.0, 13.2];
const RUNS: [number, number][] = [
  [-1, -10],
  [-12, -21],
];
const LEVELS = [0.16, 0.58, 1.0, 1.42, 1.84];

/* ── people ─────────────────────────────────────────────────────── */

const LOOKS: Record<string, HumanLook> = {
  mum: { skin: "#B5764A", hair: "#140C08", hairStyle: "long", outfit: "salwar", top: "#26A69A", bottom: "#F3E5D0", accent: "#FED300", bindi: true, slim: true, height: 0.94, bag: { kind: "shoulder", color: "#7A4B2A" } },
  dad: { skin: "#C68B59", hair: "#1E1410", hairStyle: "side", outfit: "shirt", top: "#E9EEF3", bottom: "#33475B", accent: "#FFFFFF", facial: "stubble" },
  stu: { skin: "#D1A276", hair: "#2A1A12", hairStyle: "curly", outfit: "tshirt", top: "#3E8E41", bottom: "#33475B", shoe: "#EDEDED", bag: { kind: "backpack", color: "#35401D" } },
  pro: { skin: "#D9A066", hair: "#3E2723", hairStyle: "bun", outfit: "shirt", top: "#E98A7B", bottom: "#2B3A55", accent: "#F7D2CB", slim: true, height: 0.95, glasses: "#1A1A1A", bag: { kind: "shoulder", color: "#2F2A28" } },
  gran: { skin: "#A86B45", hair: "#CFC8C0", hairStyle: "bun", outfit: "saree", top: "#8E3B5A", bottom: "#8E3B5A", accent: "#F2D3A0", bindi: true, slim: true, height: 0.92, glasses: "#3A2A1E" },
  staff: { skin: "#8D5A3B", hair: "#1A110C", hairStyle: "short", outfit: "tshirt", top: "#FF5C00", bottom: "#2B2B2B", facial: "moustache" },
  staff2: { skin: "#B98157", hair: "#1E1410", hairStyle: "braid", outfit: "tshirt", top: "#FF5C00", bottom: "#2B2B2B", slim: true, height: 0.95 },
};

/* ── shell: floor, walls, ceiling, light strips ─────────────────── */

function Shell({ compact }: { compact: boolean }) {
  const floorTex = useTex(() => {
    const t = canvasTexture(256, 256, (g) => {
      g.fillStyle = "#EFEAE2";
      g.fillRect(0, 0, 256, 256);
      g.fillStyle = "#E7E1D7";
      g.fillRect(0, 0, 128, 128);
      g.fillRect(128, 128, 128, 128);
      g.strokeStyle = "#D8D0C4";
      g.lineWidth = 3;
      g.strokeRect(0, 0, 256, 256);
      g.beginPath();
      g.moveTo(128, 0);
      g.lineTo(128, 256);
      g.moveTo(0, 128);
      g.lineTo(256, 128);
      g.stroke();
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(18, 28);
    return t;
  });
  const W = STORE.x * 2;
  const D = STORE.front - STORE.back;
  const zc = (STORE.front + STORE.back) / 2;
  const strips = useMemo(() => {
    const out: Inst[] = [];
    const xs = [0, -1.9, 1.9, ...GX.slice(0, 3).flatMap((g) => [g + 1.6, -g - 1.6]), 15.2, -15.2];
    for (const x of xs) for (let z = 6.5; z > STORE.step + 1; z -= 4) out.push({ p: [x, STORE.low - 0.06, z - 1.5], s: [0.22, 0.06, 3.0] });
    for (let x = -14; x <= 14; x += 4) for (let z = STORE.step - 2.5; z > STORE.back + 1; z -= 4) out.push({ p: [x, STORE.high - 0.06, z], s: [0.22, 0.06, 2.6] });
    return out;
  }, []);
  const trusses = useMemo(() => {
    const out: Inst[] = [];
    for (let z = 6; z > STORE.step; z -= 6) out.push({ p: [0, STORE.low - 0.35, z], s: [W, 0.5, 0.18] });
    for (let z = STORE.step - 4; z > STORE.back; z -= 5) out.push({ p: [0, STORE.high - 0.4, z], s: [W, 0.6, 0.2] });
    return out;
  }, [W]);
  const glassFront = useMemo(() => {
    const out: Inst[] = [];
    for (let x = -STORE.x; x <= STORE.x; x += 3) out.push({ p: [x, STORE.low / 2, STORE.front], s: [0.14, STORE.low, 0.14] });
    out.push({ p: [0, 4.4, STORE.front], s: [W, 0.16, 0.16] });
    return out;
  }, [W]);
  return (
    <group>
      {/* floor + promenade inlays */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, zc]} receiveShadow>
        <planeGeometry args={[W, D]} />
        <meshStandardMaterial map={floorTex} roughness={0.32} metalness={0.05} />
      </mesh>
      {[-3.1, 3.1].map((x) => (
        <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, 0.006, -7]} material={mat(C.orange, 0.5)}>
          <planeGeometry args={[0.12, 30]} />
        </mesh>
      ))}
      {/* side walls with a brand band */}
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh position={[s * STORE.x, STORE.high / 2, zc]} rotation={[0, -s * (Math.PI / 2), 0]} material={mat("#F4F0EA", 0.9)} receiveShadow>
            <planeGeometry args={[D, STORE.high]} />
          </mesh>
          <mesh position={[s * (STORE.x - 0.02), 3.3, zc]} rotation={[0, -s * (Math.PI / 2), 0]} material={mat(s > 0 ? C.orange : "#2E7D32", 0.6)}>
            <planeGeometry args={[D, 0.5]} />
          </mesh>
        </group>
      ))}
      {/* back wall */}
      <mesh position={[0, STORE.high / 2, STORE.back]} material={mat("#E9E3DA", 0.9)}>
        <planeGeometry args={[W, STORE.high]} />
      </mesh>
      {/* ceilings: low over the shop floor, high over the finance atrium; bulkhead between */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, STORE.low, (STORE.front + STORE.step) / 2]} material={mat("#6E737A", 0.9)}>
        <planeGeometry args={[W, STORE.front - STORE.step]} />
      </mesh>
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, STORE.high, (STORE.step + STORE.back) / 2]} material={mat("#5E636B", 0.9)}>
        <planeGeometry args={[W, STORE.step - STORE.back]} />
      </mesh>
      <mesh position={[0, (STORE.low + STORE.high) / 2, STORE.step]} rotation={[0, Math.PI, 0]} material={mat("#F4F0EA", 0.9)}>
        <planeGeometry args={[W, STORE.high - STORE.low]} />
      </mesh>
      <mesh position={[0, (STORE.low + STORE.high) / 2, STORE.step]} material={mat("#F4F0EA", 0.9)}>
        <planeGeometry args={[W, STORE.high - STORE.low]} />
      </mesh>
      <Instanced geometry={boxGeo()} material={mat("#4A4F57", 0.6, 0.4)} items={trusses} />
      <Instanced geometry={boxGeo()} material={mat("#FFFFFF", 0.4, 0, { emissive: "#FFF6E8", ei: 2.2 })} items={strips} />
      {/* glass entrance */}
      <mesh position={[0, STORE.low / 2, STORE.front]} material={mat("#CFE6EE", 0.08, 0.1, { opacity: 0.25 })}>
        <planeGeometry args={[W, STORE.low]} />
      </mesh>
      <Instanced geometry={boxGeo()} material={mat("#3A3F46", 0.5, 0.5)} items={glassFront} />
      {/* atrium columns */}
      {[-11, 11].map((x) => (
        <Box key={x} s={[0.7, STORE.high, 0.7]} p={[x, STORE.high / 2, STORE.step - 0.4]} c="#ECE6DD" rough={0.8} cast={!compact} />
      ))}
      <TextBoard lines={[{ t: "THE JOY OF SNACKING, MADE BETTER.", size: 64 }]} bg="#FFF5EE" fg={C.cocoa} w={14} h={1.4} px={1400} position={[0, 10.2, STORE.step + 0.03]} glow={0.25} label="Eat Better Co's line: “The joy of snacking, made better.”" />
    </group>
  );
}

/* ── gondola shelving ───────────────────────────────────────────── */

type Face = { ids: string[][]; lite: boolean };
type Gondola = { x: number; run: number; west: Face | null; east: Face | null };

const EB_LADDOO = ["orange-ginger", "coffee-almond", "vanilla-choc", "protein-fudge"];
const EB_VALUE = ["hazelnut-vp", "orange-choc-vp", "peanut-vp"];
const EB_NAMKEEN = ["desi-masala", "mango-achari", "bhujia-pudina", "protein-bhujia", "bhel-bombay", "quinoa"];
const EB_CHIPS = ["ragi-achari", "ragi-thai", "protein-pizza", "chickpea-imli", "chickpea-lime"];
const EB_NUTS = ["nut-mix", "trail-mix", "seed-jaggery", "sweet-nut"];
const G = (...ids: string[]) => ids.map((i) => `g:${i}`);

function gondolas(compact: boolean): Gondola[] {
  const f = (lite: boolean, ...levels: string[][]): Face => ({ ids: levels, lite });
  const list: Gondola[] = [];
  for (let run = 0; run < 2; run++) {
    const near = run === 0;
    // right side
    list.push({ x: 3.6, run, west: f(!near, EB_LADDOO, EB_LADDOO.slice(2).concat(EB_LADDOO.slice(0, 2)), EB_VALUE, EB_VALUE.slice(1).concat(EB_VALUE[0]), EB_NUTS), east: f(!near, EB_NAMKEEN, EB_NAMKEEN.slice(3).concat(EB_NAMKEEN.slice(0, 3)), EB_NAMKEEN.slice(2), EB_NAMKEEN, EB_NAMKEEN.slice(1)) });
    list.push({ x: 6.8, run, west: f(!near, EB_CHIPS, EB_CHIPS.slice(2).concat(EB_CHIPS.slice(0, 2)), EB_CHIPS, EB_CHIPS.slice(1), EB_CHIPS.slice(3)), east: f(true, EB_NUTS, G("dryfruit", "seeds"), G("seeds", "dryfruit"), G("makhana"), G("dryfruit")) });
    // left side
    list.push({ x: -3.6, run, east: f(!near, EB_NAMKEEN.slice(1), EB_CHIPS, EB_NAMKEEN.slice(3), EB_NUTS, EB_CHIPS.slice(2)), west: f(true, G("bhujia", "sev"), G("sev", "mixture"), G("bhujia"), G("mixture", "bhujia"), G("sev")) });
    list.push({ x: -6.8, run, east: f(true, G("mixture", "chips"), G("chips"), G("bhujia", "mixture"), G("chips", "sev"), G("mixture")), west: f(true, G("chips"), G("mixture", "chips"), G("chips", "bhujia"), G("sev"), G("chips")) });
    if (!compact) {
      list.push({ x: 10, run, west: f(true, G("dryfruit"), G("roasted", "seeds"), G("makhana", "roasted"), G("seeds"), G("roasted")), east: f(true, G("roasted"), G("makhana"), G("seeds", "dryfruit"), G("dryfruit"), G("makhana")) });
      list.push({ x: 13.2, run, west: f(true, G("chips", "mixture"), G("mixture"), G("chips"), G("sev", "bhujia"), G("chips")), east: null });
      list.push({ x: -10, run, east: f(true, G("laddoo", "barfi"), G("mithai"), G("barfi", "mithai"), G("laddoo")), west: f(true, G("mithai"), G("laddoo"), G("barfi"), G("mithai", "laddoo")) });
      list.push({ x: -13.2, run, east: f(true, G("dryfruit"), G("seeds"), G("dryfruit", "makhana"), G("seeds")), west: null });
    }
  }
  return list;
}

function TagStrip({ items }: { items: Inst[] }) {
  const tex = useTex(() => {
    const t = canvasTexture(512, 48, (g) => {
      g.fillStyle = "#F7F7F5";
      g.fillRect(0, 0, 512, 48);
      for (let i = 0; i < 2; i++) {
        const x = 30 + i * 256;
        g.fillStyle = i ? "#FFFFFF" : "#FFE14D";
        g.fillRect(x, 4, 150, 40);
        g.strokeStyle = "#C9C2B6";
        g.lineWidth = 2;
        g.strokeRect(x, 4, 150, 40);
        drawText(g, ["₹ · MRP"], x + 42, 24, 70, 26, "#1A1A1A", 900);
        drawText(g, ["₹/g"], x + 112, 24, 50, 26, "#C2261B", 900);
        for (let b = 0; b < 12; b++) {
          g.fillStyle = "#222";
          g.fillRect(x + 160 + b * 4, 10, b % 3 ? 2 : 1, 28);
        }
      }
    });
    t.wrapS = THREE.RepeatWrapping;
    t.repeat.set(9 / 1.4, 1);
    return t;
  });
  const m = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, emissive: "#FFFFFF", emissiveMap: tex, emissiveIntensity: 0.12 }), [tex]);
  useEffect(() => () => m.dispose(), [m]);
  const geo = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  useEffect(() => () => geo.dispose(), [geo]);
  return <Instanced geometry={geo} material={m} items={items} />;
}

function Shelving({ compact }: { compact: boolean }) {
  const { frame, shelves, tags, rich, lite, endcaps } = useMemo(() => {
    const frame: Inst[] = [];
    const shelves: Inst[] = [];
    const tags: Inst[] = [];
    const rich: PackItem[] = [];
    const lite: PackItem[] = [];
    const endcaps: PackItem[] = [];
    for (const gd of gondolas(compact)) {
      const [z0, z1] = RUNS[gd.run];
      const L = z0 - z1;
      const zc = (z0 + z1) / 2;
      frame.push({ p: [gd.x, 0.08, zc], s: [1.02, 0.16, L], c: "#3B3F45" });
      frame.push({ p: [gd.x, 1.2, zc], s: [0.06, 2.1, L], c: "#DCD8D1" });
      for (const zz of [z0, z1]) frame.push({ p: [gd.x, 1.2, zz], s: [1.04, 2.3, 0.035], c: "#E4E0D9" });
      frame.push({ p: [gd.x, 2.32, zc], s: [1.04, 0.08, L], c: "#3B3F45" });
      for (const side of [-1, 1] as const) {
        const face = side < 0 ? gd.west : gd.east;
        if (!face) continue;
        const ry = side * (Math.PI / 2);
        LEVELS.forEach((y, li) => {
          if (li > 0) shelves.push({ p: [gd.x + side * 0.27, y - 0.015, zc], s: [0.48, 0.03, L] });
          tags.push({ p: [gd.x + side * 0.515, y - 0.035, zc], r: [0, ry, 0], s: [L, 0.05, 1] });
          const ids = face.ids[li % face.ids.length];
          const run = fillRun(ids, [gd.x + side * 0.3, y, z0], [0, -1], L, ry, ids.length > 3 ? 3 : 4, 0.03, ids[0].includes("mithai") || ids[0].includes("laddoo") || ids[0].includes("barfi") ? 0.82 : 1);
          (face.lite ? lite : rich).push(...run);
        });
      }
      // end cap facing the entrance on the first run of the inner gondolas: a stepped promo display
      if (gd.run === 0 && Math.abs(gd.x) < 7) {
        const ids = gd.x > 0 ? (gd.x < 5 ? EB_VALUE : EB_CHIPS) : gd.x > -5 ? EB_NAMKEEN : G("chips", "mixture");
        frame.push({ p: [gd.x, 0.2, z0 + 0.42], s: [1.0, 0.4, 0.7], c: "#E9E4DC" }, { p: [gd.x, 0.55, z0 + 0.3], s: [1.0, 0.3, 0.46], c: "#E9E4DC" });
        endcaps.push(...fillRun(ids, [gd.x - 0.5, 0.4, z0 + 0.62], [1, 0], 1.0, 0, 1, 0.025), ...fillRun(ids.slice(1).concat(ids[0]), [gd.x - 0.5, 0.7, z0 + 0.38], [1, 0], 1.0, 0, 1, 0.025), ...fillRun(ids, [gd.x - 0.5, 0.7 + 0.42, z0 + 0.18], [1, 0], 1.0, 0, 1, 0.025));
      }
    }
    return { frame, shelves, tags, rich, lite, endcaps };
  }, [compact]);
  return (
    <group>
      <Instanced geometry={boxGeo()} material={mat("#FFFFFF", 0.6, 0.2)} items={frame} castShadow={!compact} receiveShadow />
      <Instanced geometry={boxGeo()} material={mat("#F2F1EE", 0.45, 0.3)} items={shelves} receiveShadow />
      <TagStrip items={tags} />
      <Packs items={rich} />
      <Packs items={lite} lite />
      <Packs items={endcaps} />
    </group>
  );
}

const END_CARDS: { x: number; t: string; bg: string }[] = [
  { x: 3.6, t: "LADDOOS", bg: C.orange },
  { x: 6.8, t: "CHIPS & PUFFS", bg: C.orange },
  { x: -3.6, t: "NAMKEEN", bg: C.orange },
  { x: -6.8, t: "CHIPS", bg: "#1F5AA6" },
  { x: 10, t: "DRY FRUITS", bg: "#2F6B4F" },
  { x: 13.2, t: "MIXTURE", bg: "#1F5AA6" },
  { x: -10, t: "MITHAI", bg: "#8E1B3A" },
  { x: -13.2, t: "SEEDS", bg: "#2F6B4F" },
];

/** Header cards on the gondola ends that face the entrance. */
function EndCards({ compact }: { compact: boolean }) {
  return (
    <group>
      {END_CARDS.filter((c) => !compact || Math.abs(c.x) < 8).flatMap((c) =>
        RUNS.map(([z0], r) => <TextBoard key={`${c.x}-${r}`} lines={[{ t: c.t, size: 70 }]} bg={c.bg} fg="#FFFFFF" w={1.0} h={0.34} px={400} position={[c.x, 2.56, z0 + 0.03]} frame="#FFFFFF" glow={0.3} />),
      )}
    </group>
  );
}

/** Hanging aisle signs (double-sided), plus the Eat Better header boards on the promenade gondolas. */
function AisleSigns({ compact }: { compact: boolean }) {
  const aisles: { x: number; t: string; bg: string }[] = [
    { x: 5.2, t: "EAT BETTER · NAMKEEN & CHIPS", bg: C.orange },
    { x: 8.4, t: "NUTS, SEEDS & DRY FRUITS", bg: "#2E7D32" },
    { x: -5.2, t: "BHUJIA & SEV", bg: "#B3261E" },
    { x: -8.4, t: "CHIPS & MIXTURE", bg: "#1F5AA6" },
    ...(compact
      ? []
      : [
          { x: 11.6, t: "ROASTED & HEALTH SNACKS", bg: "#2F6B4F" },
          { x: -11.6, t: "SWEETS & MITHAI", bg: "#8E1B3A" },
        ]),
  ];
  return (
    <group>
      {aisles.map((a, i) => (
        <group key={a.x} position={[a.x, 4.3, i % 2 ? -4.5 : -2.5]}>
          {[-0.9, 0.9].map((dx) => (
            <mesh key={dx} position={[dx, 2.1, 0]} material={mat("#555A61", 0.5, 0.5)}>
              <cylinderGeometry args={[0.012, 0.012, 3.6, 4]} />
            </mesh>
          ))}
          <TextBoard lines={[{ t: a.t, size: 54 }]} bg={a.bg} fg="#FFFFFF" w={2.7} h={0.62} px={900} frame="#FFFFFF" glow={0.35} />
          <TextBoard lines={[{ t: a.t, size: 54 }]} bg={a.bg} fg="#FFFFFF" w={2.7} h={0.62} px={900} rotation={[0, Math.PI, 0]} position={[0, 0, -0.07]} glow={0.35} />
        </group>
      ))}
    </group>
  );
}

/* ── the giant weighing scale ───────────────────────────────────── */

export const ISLAND: [number, number] = [0, -26.5];

function ScaleDisplay({ reduced }: { reduced: boolean }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (reduced) return;
    const id = setInterval(() => setI((v) => (v + 1) % 4), 3600);
    return () => clearInterval(id);
  }, [reduced]);
  const tex = useLiveCanvas(
    1024,
    512,
    (g, k) => {
      g.fillStyle = "#06120D";
      g.fillRect(0, 0, 1024, 512);
      // faint LED grid
      g.fillStyle = "rgba(124,255,178,0.05)";
      for (let y = 0; y < 512; y += 8) g.fillRect(0, y, 1024, 3);
      if (reduced) {
        drawText(g, ["PRICE PER GRAM"], 512, 52, 900, 50, "#7CFFB2", 800);
        SKUS.forEach((s, j) => {
          const y = 140 + j * 92;
          g.textAlign = "left";
          drawText(g, [`${s.name} (${s.sub})`], 330, y, 600, 40, "#BFFFD8", 700);
          drawText(g, [`${s.g} g · ₹${s.price}`], 760, y, 240, 40, "#FFC14D", 800);
          drawText(g, [s.ppg], 920, y, 180, 40, "#7CFFB2", 900);
        });
        return;
      }
      const s = SKUS[k];
      drawText(g, [`${s.name.toUpperCase()} · ${s.sub.toUpperCase()}`], 512, 56, 960, 54, "#BFFFD8", 800);
      drawText(g, ["WEIGHT"], 250, 140, 300, 40, "#4FBF85", 700);
      drawText(g, ["PRICE"], 774, 140, 300, 40, "#4FBF85", 700);
      drawText(g, [`${s.g} g`], 250, 222, 440, 120, "#7CFFB2", 900);
      drawText(g, [`₹${s.price}`], 774, 222, 440, 120, "#FFC14D", 900);
      g.fillStyle = "rgba(124,255,178,0.35)";
      g.fillRect(70, 300, 884, 4);
      drawText(g, [s.ppg.replace("~", "≈ ")], 512, 400, 900, 150, "#FFFFFF", 900);
      for (let j = 0; j < 4; j++) {
        g.fillStyle = j === k ? "#7CFFB2" : "rgba(124,255,178,0.25)";
        g.beginPath();
        g.arc(452 + j * 40, 486, 9, 0, Math.PI * 2);
        g.fill();
      }
    },
    i,
  );
  const sku = SKUS[reduced ? 0 : i];
  return (
    <group>
      <mesh position={[0, 5.1, -1.55]}>
        <planeGeometry args={[3.3, 1.65]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      <PanLoad id={sku.id} />
    </group>
  );
}

/** What sits on the scale pan (the current SKU). */
function PanLoad({ id }: { id: string }) {
  const y = 0.82;
  if (id === "combo")
    return (
      <Packs
        items={["desi-masala", "mango-achari", "bhujia-pudina", "protein-bhujia"].map((p, j) => ({ id: p, p: [-0.48 + j * 0.32, y, 0.05], s: 1.55, ry: 0 }))}
        castShadow
      />
    );
  const s = SKUS.find((k) => k.id === id)!;
  const big = id === "usb" ? [0.9, 0.9, 0.34] : id === "box42" ? [0.66, 1.12, 0.34] : [0.56, 0.95, 0.3];
  return <mesh geometry={boxGeo()} material={packMaterials({ src: s.src, crop: s.crop, side: s.side })} position={[0, y + big[1] / 2, 0]} scale={big as [number, number, number]} castShadow />;
}

function WeighingScale({ reduced, compact }: { reduced: boolean; compact: boolean }) {
  const ring = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (ring.current && !reduced) (ring.current.material as THREE.MeshStandardMaterial).emissiveIntensity = 1.6 + Math.sin(clock.elapsedTime * 2) * 0.5;
  });
  const ringMat = useMemo(() => new THREE.MeshStandardMaterial({ color: C.orange, emissive: new THREE.Color(C.orange), emissiveIntensity: 1.8, toneMapped: false }), []);
  useEffect(() => () => ringMat.dispose(), [ringMat]);
  return (
    <Label label="A giant digital scale: weight, price and price per gram for each SKU in the pricing table">
      <group position={[ISLAND[0], 0, ISLAND[1]]}>
        <mesh position={[0, 0.1, 0]} material={mat("#F7F3EC", 0.35, 0.05)} receiveShadow castShadow={!compact}>
          <cylinderGeometry args={[4.6, 4.7, 0.2, 64]} />
        </mesh>
        <mesh ref={ring} position={[0, 0.2, 0]} rotation={[Math.PI / 2, 0, 0]} material={ringMat}>
          <torusGeometry args={[4.62, 0.045, 8, 96]} />
        </mesh>
        {/* base + pan */}
        <Box s={[2.5, 0.52, 2.5]} p={[0, 0.46, 0]} c="#C9CDD2" rough={0.35} metal={0.75} cast={!compact} />
        <Box s={[2.62, 0.08, 2.62]} p={[0, 0.76, 0]} c="#E6E9EC" rough={0.18} metal={0.9} cast={!compact} />
        <Box s={[2.66, 0.02, 2.66]} p={[0, 0.725, 0]} c={C.teal} e={C.teal} ei={2} />
        <TextBoard lines={[{ t: "ELECTRONIC SCALE · ₹ PER GRAM", size: 46 }]} bg="#2F3338" fg="#E8F7EF" w={1.9} h={0.22} px={900} position={[0, 0.42, 1.255]} glow={0.4} />
        {/* column + display head */}
        <Box s={[0.34, 3.5, 0.34]} p={[0, 2.5, -1.85]} c="#BFC4CA" rough={0.3} metal={0.8} cast={!compact} />
        <Box s={[3.6, 1.95, 0.32]} p={[0, 5.1, -1.74]} c="#23272C" rough={0.4} metal={0.5} cast={!compact} />
        <ScaleDisplay reduced={reduced} />
        <Glow position={[0, 5.1, -1.3]} color="#7CFFB2" size={6} opacity={0.22} />
        {/* the four SKUs around the island, each with its shelf tag */}
        {SKUS.map((s, j) => {
          const ang = [-1.2, -0.42, 0.42, 1.2][j];
          const x = Math.sin(ang) * 3.3;
          const z = Math.cos(ang) * 3.3;
          return (
            <group key={s.id} position={[x, 0.2, z]} rotation={[0, ang, 0]}>
              <mesh position={[0, 0.35, 0]} material={mat("#FFFFFF", 0.4)} castShadow={!compact}>
                <cylinderGeometry args={[0.55, 0.6, 0.7, 32]} />
              </mesh>
              {s.id === "combo" ? (
                <Packs items={["desi-masala", "mango-achari", "bhujia-pudina", "protein-bhujia"].map((p, k) => ({ id: p, p: [-0.27 + k * 0.18, 0.7, k % 2 ? -0.08 : 0.05], s: 1.0 }))} />
              ) : (
                <mesh geometry={boxGeo()} material={packMaterials({ src: s.src, crop: s.crop, side: s.side })} position={[0, 0.7 + (s.id === "usb" ? 0.24 : 0.33), 0]} scale={s.id === "usb" ? [0.5, 0.48, 0.18] : [0.38, 0.66, 0.2]} castShadow={!compact} />
              )}
              <TextBoard
                lines={[
                  { t: `${s.name} (${s.sub})`, size: 30, weight: 700 },
                  { t: `${s.g} g · ₹${s.price}`, size: 52 },
                  { t: s.ppg, size: 76, color: "#C2261B", weight: 900 },
                ]}
                bg="#FFE14D"
                fg="#1A1A1A"
                w={0.92}
                h={0.56}
                px={512}
                position={[0, 0.42, 0.62]}
                rotation={[-0.12, 0, 0]}
                frame="#1A1A1A"
                glow={0.3}
                label={`${s.name} (${s.sub}): ${s.g} g for ₹${s.price}, ${s.ppg}`}
              />
            </group>
          );
        })}
      </group>
    </Label>
  );
}

/* ── checkout lanes ─────────────────────────────────────────────── */

let BASKET: THREE.BufferGeometry | null = null;
function basketGeo() {
  if (BASKET) return BASKET;
  const parts: THREE.BufferGeometry[] = [];
  const add = (w: number, h: number, d: number, x: number, y: number, z: number) => {
    const b = new THREE.BoxGeometry(w, h, d);
    b.translate(x, y, z);
    parts.push(b);
  };
  add(0.46, 0.02, 0.3, 0, 0.01, 0);
  add(0.46, 0.24, 0.02, 0, 0.12, 0.15);
  add(0.46, 0.24, 0.02, 0, 0.12, -0.15);
  add(0.02, 0.24, 0.3, 0.23, 0.12, 0);
  add(0.02, 0.24, 0.3, -0.23, 0.12, 0);
  add(0.02, 0.02, 0.3, 0.12, 0.3, 0);
  add(0.02, 0.02, 0.3, -0.12, 0.3, 0);
  BASKET = mergeGeometries(parts.map((p) => p.toNonIndexed()));
  parts.forEach((p) => p.dispose());
  return BASKET;
}

export const LANES = [6.2, 9.4, 12.6];
const LANE_Z = -36.5;

function Checkout({ compact, reduced }: { compact: boolean; reduced: boolean }) {
  const baskets = useMemo(() => {
    const out: Inst[] = [];
    for (let s = 0; s < 3; s++) for (let k = 0; k < (compact ? 4 : 7); k++) out.push({ p: [3.6 + s * 0.55, k * 0.09, -32.4], r: [0, 0.05 * (k % 2), 0] });
    LANES.forEach((x, i) => out.push({ p: [x - 0.15, 0.92, LANE_Z + 1.2 - i * 0.2], r: [0, 0.3, 0] }));
    return out;
  }, [compact]);
  const beltTex = useTex(() => {
    const t = canvasTexture(64, 64, (g) => {
      g.fillStyle = "#1C1E21";
      g.fillRect(0, 0, 64, 64);
      g.fillStyle = "#2A2D31";
      g.fillRect(0, 0, 64, 6);
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(1, 10);
    return t;
  });
  useFrame((_, dt) => {
    if (!reduced) beltTex.offset.y -= dt * 0.25;
  });
  const beltMat = useMemo(() => new THREE.MeshStandardMaterial({ map: beltTex, roughness: 0.7 }), [beltTex]);
  useEffect(() => () => beltMat.dispose(), [beltMat]);
  const belt = useMemo(() => LANES.map((x, i) => ({ id: [EB_CHIPS[i], EB_LADDOO[i + 1], EB_NAMKEEN[i * 2]], x })), []);
  return (
    <group>
      <Label label="Checkout lanes: where shelf prices turn into orders">
        <group>
          {LANES.map((x, i) => (
            <group key={x} position={[x, 0, LANE_Z]}>
              <Box s={[0.95, 0.9, 3.8]} p={[0, 0.45, 0]} c="#F2EFEA" rough={0.5} cast={!compact} recv />
              <Box s={[0.97, 0.12, 3.82]} p={[0, 0.06, 0]} c={C.orange} rough={0.5} />
              <mesh position={[0.02, 0.91, 0.75]} rotation={[-Math.PI / 2, 0, 0]} material={beltMat}>
                <planeGeometry args={[0.66, 2.1]} />
              </mesh>
              {/* POS + card machine */}
              <Box s={[0.06, 0.32, 0.06]} p={[-0.3, 1.06, -0.75]} c="#2A2D31" />
              <Box s={[0.04, 0.3, 0.42]} p={[-0.26, 1.3, -0.75]} r={[0, 0, 0.25]} c="#1B1E22" />
              <mesh position={[-0.235, 1.3, -0.75]} rotation={[0, Math.PI / 2, -0.25]} material={mat("#3FA9F5", 0.3, 0, { emissive: "#3FA9F5", ei: 0.9 })}>
                <planeGeometry args={[0.38, 0.26]} />
              </mesh>
              <Box s={[0.1, 0.04, 0.16]} p={[0.25, 0.94, -0.5]} r={[0.3, 0, 0]} c="#2A2D31" />
              {/* lane light */}
              <mesh position={[-0.42, 1.9, 1.8]} material={mat("#9AA0A6", 0.4, 0.6)}>
                <cylinderGeometry args={[0.025, 0.025, 2, 8]} />
              </mesh>
              <TextBoard lines={[{ t: String(i + 1), size: 120 }]} bg="#2E9E5B" fg="#FFFFFF" w={0.42} h={0.42} px={128} position={[-0.42, 3.05, 1.8]} glow={0.9} />
              <Glow position={[-0.42, 3.05, 1.9]} color="#5BE08F" size={1.1} opacity={0.35} />
              {/* packs on the belt */}
              <Packs items={belt[i].id.map((id, k) => ({ id, p: [0.02 + (k - 1) * 0.08, 0.92, 1.4 - k * 0.42], ry: 0.4 * (k - 1) }))} />
            </group>
          ))}
        </group>
      </Label>
      <Instanced geometry={basketGeo()} material={mat("#D62828", 0.55)} items={baskets} castShadow={!compact} />
      <TextBoard lines={[{ t: "BASKETS", size: 60 }]} bg="#D62828" fg="#FFFFFF" w={1.2} h={0.3} px={400} position={[4.15, 1.0, -32.2]} glow={0.3} />
    </group>
  );
}

/* ── online orders corner + order counter ───────────────────────── */

function OnlineOrders({ compact, reduced }: { compact: boolean; reduced: boolean }) {
  const racks = useMemo(() => {
    const frame: Inst[] = [];
    const boxes: Inst[] = [];
    const xs = compact ? [-15.8] : [-15.8, -13.4];
    for (const x of xs) {
      for (let k = 0; k < 4; k++) frame.push({ p: [x, 0.3 + k * 0.62, -40], s: [2.0, 0.04, 6.0] });
      for (const dz of [-2.95, 0, 2.95]) for (const dx of [-0.95, 0.95]) frame.push({ p: [x + dx, 1.2, -40 + dz], s: [0.06, 2.4, 0.06] });
      for (let k = 0; k < 4; k++)
        for (let j = 0; j < 9; j++) {
          const w = 0.42 + ((j * 7 + k * 3) % 4) * 0.06;
          boxes.push({ p: [x + ((j % 2) - 0.5) * 0.8, 0.32 + k * 0.62 + w * 0.35, -42.6 + j * 0.62], s: [w, w * 0.7, w * 0.85], c: (j + k) % 3 ? "#C79A63" : "#B98A52" });
        }
    }
    return { frame, boxes };
  }, [compact]);
  const moving = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const g = moving.current;
    if (!g) return;
    g.children.forEach((c, i) => {
      const t = reduced ? i / 4 : (clock.elapsedTime * 0.18 + i / 4) % 1;
      c.position.z = -36.2 - t * 5.6;
    });
  });
  const counter = useTex(() =>
    canvasTexture(1400, 440, (g) => {
      g.fillStyle = "#0B0F1A";
      g.fillRect(0, 0, 1400, 440);
      drawText(g, ["ORDERS FULFILLED EVERY MONTH"], 700, 56, 1200, 46, "#9FB3D9", 800);
      // split-flap digits
      const digits = "~2,00,000";
      const cw = 128;
      const x0 = 700 - (digits.length * cw) / 2;
      [...digits].forEach((d, i) => {
        const x = x0 + i * cw;
        if (d === "," || d === "~") {
          drawText(g, [d], x + cw / 2, 210, cw, 150, "#FFC14D", 900);
          return;
        }
        g.fillStyle = "#1C2333";
        g.fillRect(x + 6, 110, cw - 12, 200);
        g.fillStyle = "#0B0F1A";
        g.fillRect(x + 6, 208, cw - 12, 4);
        drawText(g, [d], x + cw / 2, 212, cw - 20, 170, "#FFFFFF", 900);
      });
      drawText(g, ["about 2 lakh orders a month · website · marketplaces · quick-commerce"], 700, 380, 1300, 44, "#FFC14D", 700);
    }),
  );
  return (
    <group>
      <Instanced geometry={boxGeo()} material={mat("#5C636B", 0.5, 0.6)} items={racks.frame} />
      <Instanced geometry={boxGeo()} material={mat("#FFFFFF", 0.85)} items={racks.boxes} castShadow={!compact} />
      {/* packing table + roller conveyor with parcels heading for dispatch */}
      <Box s={[2.2, 0.9, 1.0]} p={[-9.5, 0.45, -35]} c="#E6E1D9" cast={!compact} />
      <Box s={[0.9, 0.82, 6]} p={[-11, 0.41, -39]} c="#7C838B" rough={0.4} metal={0.6} />
      <Box s={[0.94, 0.04, 6]} p={[-11, 0.84, -39]} c="#B5BBC2" rough={0.3} metal={0.8} />
      <group ref={moving}>
        {[0, 1, 2, 3].map((i) => (
          <Box key={i} s={[0.5, 0.32, 0.4]} p={[-11, 1.02, -37]} c={i % 2 ? "#C79A63" : "#B98A52"} />
        ))}
      </group>
      <Label label="Order counter: about 2 lakh orders a month across web, marketplaces and quick-commerce (reported)">
        <group position={[-8.6, 4.9, -33.2]} rotation={[0, 0.2, 0]}>
          {[-2.6, 2.6].map((dx) => (
            <mesh key={dx} position={[dx, 4.3, 0]} material={mat("#555A61", 0.5, 0.5)}>
              <cylinderGeometry args={[0.014, 0.014, 6.2, 4]} />
            </mesh>
          ))}
          <Box s={[7.4, 2.5, 0.22]} p={[0, 0, -0.13]} c="#151A26" rough={0.4} metal={0.4} />
          <mesh>
            <planeGeometry args={[7.0, 2.2]} />
            <meshBasicMaterial map={counter} toneMapped={false} />
          </mesh>
          <Glow position={[0, 0, 0.3]} color="#FFC14D" size={9} opacity={0.12} />
        </group>
      </Label>
      <TextBoard lines={[{ t: "ONLINE ORDERS · DISPATCH", size: 56 }]} bg="#1F5AA6" fg="#FFFFFF" w={3.6} h={0.5} px={900} position={[-9.5, 2.6, -34.4]} frame="#FFFFFF" glow={0.3} />
    </group>
  );
}

/* ── finance wall: revenue towers ──────────────────────────────── */

const PER_CR = 0.5; // metres of tower per ₹ crore

function towerTex(h: number, glass: string, light: string) {
  const floors = Math.max(6, Math.round(h / 0.42));
  return canvasTexture(256, 1024, (g) => {
    const grd = g.createLinearGradient(0, 0, 0, 1024);
    grd.addColorStop(0, light);
    grd.addColorStop(0.12, glass);
    grd.addColorStop(1, "#0E1424");
    g.fillStyle = grd;
    g.fillRect(0, 0, 256, 1024);
    const fh = 1024 / floors;
    for (let i = 1; i < floors; i++) {
      g.fillStyle = "rgba(255,255,255,0.55)";
      g.fillRect(0, i * fh - 2, 256, 3);
      g.fillStyle = "rgba(255,255,255,0.08)";
      g.fillRect(0, i * fh + 1, 256, fh * 0.45);
    }
    g.fillStyle = "rgba(10,16,30,0.55)";
    for (let x = 0; x <= 256; x += 64) g.fillRect(x - 3, 0, 6, 1024);
  });
}

function Tower({ x, h, label, color, light, reduced, delay }: { x: number; h: number; label: string; color: string; light: string; reduced: boolean; delay: number }) {
  const g = useRef<THREE.Group>(null);
  const grow = useRef(reduced ? 1 : 0);
  const tex = useTex(() => towerTex(h, color, light));
  const m = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: new THREE.Color("#FFFFFF"), emissiveIntensity: 0.75, roughness: 0.2, metalness: 0.35 }), [tex]);
  useEffect(() => () => m.dispose(), [m]);
  useFrame(({ camera }, dt) => {
    if (!g.current) return;
    const near = camera.position.z < -16;
    if (!reduced) grow.current = THREE.MathUtils.damp(grow.current, near ? 1 : 0.04, near ? 1.4 - delay : 3, dt);
    g.current.scale.y = Math.max(0.02, grow.current);
  });
  return (
    <group position={[x, 0.32, -43.6]}>
      <group ref={g}>
        <mesh position={[0, h / 2, 0]} material={m} castShadow>
          <boxGeometry args={[2.8, h, 2.8]} />
        </mesh>
        {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => <Box key={`${sx}${sz}`} s={[0.08, h, 0.08]} p={[sx * 1.42, h / 2, sz * 1.42]} c={light} e={light} ei={1.6} />))}
        <Box s={[2.0, 0.5, 2.0]} p={[0, h + 0.25, 0]} c="#1B2333" rough={0.4} metal={0.5} />
        <Box s={[2.9, 0.08, 2.9]} p={[0, h + 0.04, 0]} c={light} e={light} ei={2} />
      </group>
      <TextBoard lines={label.split("\n").map((t, i) => ({ t, size: i ? 80 : 50, weight: i ? 900 : 700 }))} bg="#FFFFFF" fg={C.cocoa} w={2.5} h={1.05} px={512} position={[0, h + 1.35, 1.2]} frame={light} glow={0.45} />
    </group>
  );
}

function FinanceWall({ reduced, compact }: { reduced: boolean; compact: boolean }) {
  // scaled so the tallest tower (FY25) stays the height the FY24 tower used to be
  const per = (PER_CR * 14.7) / 23.9;
  const h23 = 5.33 * per;
  const h24 = 14.47 * per;
  const h25 = 23.9 * per;
  const arrow = useMemo(() => {
    const c = new THREE.QuadraticBezierCurve3(new THREE.Vector3(-4.6, h23 + 2.25, -42.6), new THREE.Vector3(1.2, h25 + 3.2, -42.6), new THREE.Vector3(4.4, h25 + 1.75, -42.6));
    return new THREE.TubeGeometry(c, 40, 0.07, 8, false);
  }, [h23, h25]);
  useEffect(() => () => arrow.dispose(), [arrow]);
  const wall = useTex(() =>
    canvasTexture(1600, 700, (g) => {
      const grd = g.createLinearGradient(0, 0, 0, 700);
      grd.addColorStop(0, "#0E1A3A");
      grd.addColorStop(1, "#16285A");
      g.fillStyle = grd;
      g.fillRect(0, 0, 1600, 700);
      g.strokeStyle = "rgba(160,190,255,0.12)";
      g.lineWidth = 2;
      for (let y = 140; y < 700; y += 70) {
        g.beginPath();
        g.moveTo(80, y);
        g.lineTo(1520, y);
        g.stroke();
      }
      drawText(g, ["REVENUE FROM OPERATIONS"], 800, 64, 1300, 64, "#FFFFFF", 900);
      drawText(g, ["FY23 → FY24 +171.5% · FY25 +63% · ~35× since FY22"], 800, 124, 1300, 40, "#FFC14D", 700);
    }),
  );
  return (
    <group>
      <Label label="Finance wall: revenue grew from ₹5.33 crore (FY23) to ₹14.47 crore (FY24) and ₹23.90 crore (FY25)">
        <group>
          <Box s={[23, 10, 0.3]} p={[0, 6.3, STORE.back + 0.2]} c="#101624" rough={0.4} metal={0.3} />
          <mesh position={[0, 6.3, STORE.back + 0.36]}>
            <planeGeometry args={[22.4, 9.6]} />
            <meshBasicMaterial map={wall} toneMapped={false} />
          </mesh>
          <Box s={[14, 0.32, 5]} p={[0, 0.16, -43.6]} c="#1A2030" rough={0.25} metal={0.5} recv />
          <Box s={[14.1, 0.04, 5.1]} p={[0, 0.33, -43.6]} c={C.orange} e={C.orange} ei={1.4} />
        </group>
      </Label>
      <Label label="FY23 revenue: ₹5.33 crore">
        <Tower x={-5} h={h23} label={"FY23\n₹5.33 cr"} color="#2B4C7E" light="#8FC1FF" reduced={reduced} delay={0} />
      </Label>
      <Label label="FY24 revenue: ₹14.47 crore, up about 171.5%">
        <Tower x={0} h={h24} label={"FY24\n₹14.47 cr"} color="#7A2E0E" light="#FFB25B" reduced={reduced} delay={0.5} />
      </Label>
      <Label label="FY25 revenue: ₹23.90 crore, reported growth 63%">
        <Tower x={5} h={h25} label={"FY25\n₹23.90 cr"} color="#B23A12" light="#FFC14D" reduced={reduced} delay={1} />
      </Label>
      <mesh geometry={arrow} material={mat(C.orange, 0.4, 0, { emissive: C.orange, ei: 1.8 })} />
      <TextBoard lines={[{ t: "~35× in 3 years", size: 80 }]} bg={C.orange} fg="#FFFFFF" w={2.5} h={0.62} px={512} position={[-1.6, h25 + 2.6, -42.4]} glow={0.6} />
      <TextBoard
        lines={[
          { t: "FY24 NET LOSS", size: 40, weight: 700 },
          { t: "₹62.96 lakh", size: 76 },
          { t: "down 46.6% from ₹1.18 crore", size: 30, weight: 600 },
        ]}
        bg="#FFF5EE"
        fg={C.cocoa}
        w={2.4}
        h={1.2}
        position={[-8.4, 1.35, -43.2]}
        rotation={[0, 0.35, 0]}
        frame={C.cocoa}
        glow={0.25}
        label="FY24 net loss: ₹62.96 lakh, about 46.6% smaller than FY23's ₹1.18 crore"
      />
      {!compact && <Glow position={[5, h25 + 0.4, -43.6]} color="#FFB25B" size={5} opacity={0.3} />}
    </group>
  );
}

/* ── shoppers ──────────────────────────────────────────────────── */

function Shoppers({ compact, reduced }: { compact: boolean; reduced: boolean }) {
  return (
    <group>
      <Walker look={LOOKS.mum} a={[-1.3, 5]} b={[-1.5, -19]} speed={0.8} reduced={reduced} y={0} />
      <Worker look={LOOKS.stu} at={[5.6, -15.8]} face={-Math.PI / 2 + 0.3} reduced={reduced} y={0} />
      <Worker look={LOOKS.pro} at={[LANES[0] + 0.85, LANE_Z + 0.4]} face={-Math.PI / 2} reduced={reduced} y={0} phase={1} />
      <Worker look={LOOKS.staff2} at={[LANES[0] - 0.8, LANE_Z - 0.6]} face={Math.PI / 2} reduced={reduced} y={0} phase={2} />
      {!compact && (
        <>
          <Walker look={LOOKS.dad} a={[1.4, -21]} b={[1.2, 4]} speed={0.9} phase={0.4} reduced={reduced} y={0} />
          <Worker look={LOOKS.gran} at={[-2.3, -14.5]} face={Math.PI / 2 + 0.4} reduced={reduced} y={0} phase={3} />
          <Worker look={LOOKS.dad} at={[LANES[1] + 0.85, LANE_Z + 1.2]} face={-Math.PI / 2 - 0.2} reduced={reduced} y={0} phase={4} />
          <Worker look={LOOKS.staff} at={[-9.5, -35.9]} face={0} reduced={reduced} y={0} phase={5} />
          <Walker look={LOOKS.pro} a={[-3, -29.5]} b={[5, -31]} speed={0.7} phase={0.7} reduced={reduced} y={0} />
        </>
      )}
    </group>
  );
}

/* ── the store ─────────────────────────────────────────────────── */

export function Store({ compact, reduced }: { compact: boolean; reduced: boolean }) {
  const logo = useMemo(() => photoTex("/brand/eat-better-logo-transparent-600x400.png", [0.24, 0.27, 0.76, 0.73]), []);
  return (
    <group>
      <Shell compact={compact} />
      <Shelving compact={compact} />
      <AisleSigns compact={compact} />
      <EndCards compact={compact} />
      {/* Eat Better header on the promenade gondolas */}
      {[3.6, -3.6].map((x) => (
        <group key={x} position={[x, 2.75, -5.5]} rotation={[0, -Math.sign(x) * (Math.PI / 2), 0]}>
          <Box s={[4.2, 0.82, 0.08]} p={[0, 0, -0.05]} c="#FFF5EE" />
          <mesh position={[-1.2, 0, 0]}>
            <planeGeometry args={[1.4, 0.7]} />
            <meshBasicMaterial map={logo} transparent toneMapped={false} />
          </mesh>
          <TextBoard lines={[{ t: x > 0 ? "LADDOOS · NUT MIXES" : "NAMKEEN · CHIPS", size: 60 }]} bg="#FFF5EE" fg={C.orange} w={2.4} h={0.6} px={800} position={[0.85, 0, 0.002]} glow={0.2} />
        </group>
      ))}
      <WeighingScale reduced={reduced} compact={compact} />
      <Checkout compact={compact} reduced={reduced} />
      <OnlineOrders compact={compact} reduced={reduced} />
      <FinanceWall reduced={reduced} compact={compact} />
      <Shoppers compact={compact} reduced={reduced} />
      <Glow position={[0, 3, STORE.front + 2]} color="#FFFFFF" size={30} opacity={0.25} />
      {/* soft fill lights */}
      <pointLight position={[0, 6, -26]} intensity={compact ? 0 : 18} distance={18} color="#FFF1DC" />
      <pointLight position={[0, 9, -42]} intensity={compact ? 0 : 30} distance={22} color="#FFE6C8" />
    </group>
  );
}
