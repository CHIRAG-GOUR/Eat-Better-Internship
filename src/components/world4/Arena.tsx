"use client";
/* eslint-disable react-hooks/immutability -- three.js objects are animated inside useFrame by design */

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { HumanLook } from "@/components/world2/Human";
import { Instanced, Walker, Worker, type Inst } from "@/components/world3/parts";
import { boxGeo, C, canvasTexture, drawText, mat, photoTex, rng } from "./kit";
import { fillRun, Packs, type PackItem } from "./Packs";
import { Box, Glow, Label, TextBoard, useTex } from "./bits";
import { City } from "./Skyline";

/**
 * Chapter 4.2 — the Snack Arena at golden hour: a round sandstone plaza ringed by amphitheatre steps, a
 * colonnade with string lights and bunting, and a skyline beyond. Four stall islands face the centre
 * (Eat Better, traditional snack brands, direct health competitors, local sweet shops — other players are
 * shown with generic packs labelled by category, never logos). The K-Matrix lies in the middle of the floor:
 * 6 parameters × 4 players, each cell a tile whose height and glow show High / Medium / Low from the source table.
 */

const R_PLAZA = 24;

/* ── K-Matrix data (verbatim from the 4.2 source table) ─────────── */

type Lvl = "H" | "M" | "L";
export const PLAYERS = [
  { name: "EAT BETTER CO", short: "Eat Better Co", color: "#FF7A1A" },
  { name: "TRADITIONAL SNACK BRANDS", short: "Traditional snack brands", color: "#D64545" },
  { name: "GOURMET HEALTH COMPETITORS", short: "Gourmet health competitors", color: "#2EAD6B" },
  { name: "LOCAL SWEET OUTLETS", short: "Local sweet outlets", color: "#E0A526" },
];
export const PARAMS: { name: string; v: [Lvl, Lvl, Lvl, Lvl] }[] = [
  { name: "Clean label (no palm oil / refined sugar)", v: ["H", "L", "H", "L"] },
  { name: "Familiar Indian flavour profile", v: ["H", "H", "M", "H"] },
  { name: "Quick-commerce availability (<15 mins)", v: ["H", "H", "H", "L"] },
  { name: "Natural sweetening innovation (dates / dry fruits)", v: ["H", "L", "M", "L"] },
  { name: "Scalable institutional packaging & shelf-life", v: ["H", "H", "H", "L"] },
  { name: "Mass-market price accessibility", v: ["M", "H", "M", "H"] },
];
const LVL = { H: { h: 1.25, ei: 1.5, word: "HIGH" }, M: { h: 0.68, ei: 0.7, word: "MEDIUM" }, L: { h: 0.16, ei: 0.12, word: "LOW" } } as const;
const COL_X = [-4.05, -1.35, 1.35, 4.05];
const ROW_Z = [-5.25, -3.15, -1.05, 1.05, 3.15, 5.25];

/* ── plaza, steps, colonnade ───────────────────────────────────── */

function Plaza({ compact }: { compact: boolean }) {
  const paving = useTex(() =>
    canvasTexture(1024, 1024, (g) => {
      g.fillStyle = "#E4C29C";
      g.fillRect(0, 0, 1024, 1024);
      const c = 512;
      for (let r = 40; r < 512; r += 34) {
        g.strokeStyle = r % 136 < 34 ? "#C99A72" : "#D6AE86";
        g.lineWidth = r % 136 < 34 ? 5 : 2;
        g.beginPath();
        g.arc(c, c, r, 0, Math.PI * 2);
        g.stroke();
        const n = Math.round((r * Math.PI * 2) / 46);
        g.strokeStyle = "#D2A880";
        g.lineWidth = 1.5;
        for (let i = 0; i < n; i++) {
          const a = (i / n) * Math.PI * 2 + (r % 68 ? 0 : 0.5 / n);
          g.beginPath();
          g.moveTo(c + Math.cos(a) * r, c + Math.sin(a) * r);
          g.lineTo(c + Math.cos(a) * (r + 34), c + Math.sin(a) * (r + 34));
          g.stroke();
        }
      }
      // eight-point star inlay at the rim
      g.fillStyle = "rgba(190,110,90,0.25)";
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * Math.PI * 2;
        g.beginPath();
        g.moveTo(c + Math.cos(a) * 420, c + Math.sin(a) * 420);
        g.lineTo(c + Math.cos(a + 0.08) * 470, c + Math.sin(a + 0.08) * 470);
        g.lineTo(c + Math.cos(a) * 505, c + Math.sin(a) * 505);
        g.lineTo(c + Math.cos(a - 0.08) * 470, c + Math.sin(a - 0.08) * 470);
        g.closePath();
        g.fill();
      }
    }),
  );
  const steps = useMemo(() => {
    const pts: THREE.Vector2[] = [];
    let r = R_PLAZA + 0.2;
    let y = 0;
    pts.push(new THREE.Vector2(r, 0));
    for (let i = 0; i < 4; i++) {
      y += 0.45;
      pts.push(new THREE.Vector2(r, y));
      r += 1.5;
      pts.push(new THREE.Vector2(r, y));
    }
    pts.push(new THREE.Vector2(r + 3, y));
    pts.push(new THREE.Vector2(r + 3, 0));
    return new THREE.LatheGeometry(pts, 96);
  }, []);
  useEffect(() => () => steps.dispose(), [steps]);
  const { pillars, bulbs, flags, glows } = useMemo(() => {
    const n = 16;
    const R = 32.6;
    const pillars: Inst[] = [];
    const bulbs: Inst[] = [];
    const flags: Inst[] = [];
    const glows: [number, number, number][] = [];
    const flagC = ["#FF5C00", "#FED300", "#2E9E5B", "#D64545", "#FFFFFF", "#1F5AA6"];
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      if (Math.abs(Math.cos(a - Math.PI / 2)) > 0.985 && Math.sin(a) > 0) continue; // the gate gap (+z)
      pillars.push({ p: [Math.cos(a) * R, 1.8 + 3.6, Math.sin(a) * R], s: [0.55, 7.2, 0.55] });
      pillars.push({ p: [Math.cos(a) * R, 1.8 + 7.4, Math.sin(a) * R], s: [0.9, 0.35, 0.9] });
      // string lights + bunting sag between this pillar and the next
      const b = ((i + 1) / n) * Math.PI * 2;
      const per = compact ? 8 : 14;
      for (let k = 1; k < per; k++) {
        const t = k / per;
        const ang = a + (b - a) * t;
        const sag = Math.sin(t * Math.PI) * 1.4;
        const rr = R - 0.2;
        bulbs.push({ p: [Math.cos(ang) * rr, 1.8 + 6.9 - sag, Math.sin(ang) * rr], s: 0.09 });
        if (k % 2 === 0) flags.push({ p: [Math.cos(ang) * (rr - 0.4), 1.8 + 6.2 - sag * 0.8, Math.sin(ang) * (rr - 0.4)], r: [0, -ang + Math.PI / 2, Math.PI], s: [0.32, 0.42, 1], c: flagC[(i + k) % flagC.length] });
        if (k === Math.floor(per / 2) && i % 2 === 0) glows.push([Math.cos(ang) * rr, 1.8 + 6.9 - sag, Math.sin(ang) * rr]);
      }
    }
    return { pillars, bulbs, flags, glows };
  }, [compact]);
  const flagGeo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute([-0.5, 0, 0, 0.5, 0, 0, 0, 1, 0], 3));
    g.computeVertexNormals();
    return g;
  }, []);
  useEffect(() => () => flagGeo.dispose(), [flagGeo]);
  const sphere = useMemo(() => new THREE.SphereGeometry(1, 8, 6), []);
  useEffect(() => () => sphere.dispose(), [sphere]);
  const ring = useMemo(() => new THREE.TorusGeometry(32.6, 0.22, 6, 128), []);
  useEffect(() => () => ring.dispose(), [ring]);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.01, 0]} receiveShadow>
        <circleGeometry args={[R_PLAZA + 0.3, 96]} />
        <meshStandardMaterial map={paving} roughness={0.85} />
      </mesh>
      <mesh geometry={steps} material={mat("#D9AE88", 0.9)} receiveShadow castShadow={!compact} />
      <Instanced geometry={boxGeo()} material={mat("#F1D9BC", 0.8)} items={pillars} castShadow={!compact} />
      <mesh geometry={ring} material={mat("#E9CBA8", 0.8)} position={[0, 1.8 + 7.55, 0]} rotation={[Math.PI / 2, 0, 0]} />
      <Instanced geometry={sphere} material={mat("#FFE2A8", 0.4, 0, { emissive: "#FFC66B", ei: 2.4 })} items={bulbs} />
      <Instanced geometry={flagGeo} material={mat("#FFFFFF", 0.8, 0, { side: THREE.DoubleSide })} items={flags} />
      {glows.map((p, i) => (
        <Glow key={i} position={p} color="#FFC66B" size={2.2} opacity={0.4} />
      ))}
      {/* the gate */}
      <group position={[0, 1.8, 32.6]}>
        {[-3.2, 3.2].map((x) => (
          <Box key={x} s={[0.9, 8.2, 0.9]} p={[x, 4.1, 0]} c="#E8C9A6" rough={0.8} cast={!compact} />
        ))}
        <Box s={[8.2, 1.3, 0.9]} p={[0, 8.6, 0]} c="#C9875E" rough={0.7} cast={!compact} />
        <TextBoard lines={[{ t: "THE SNACK ARENA", size: 120 }]} bg="#2F1C1A" fg="#FED300" w={6.6} h={1.0} px={1024} position={[0, 8.6, 0.47]} glow={0.4} />
        <TextBoard lines={[{ t: "THE SNACK ARENA", size: 120 }]} bg="#2F1C1A" fg="#FED300" w={6.6} h={1.0} px={1024} position={[0, 8.6, -0.47]} rotation={[0, Math.PI, 0]} glow={0.4} />
      </group>
    </group>
  );
}

/* ── K-Matrix ──────────────────────────────────────────────────── */

const LVL_TEX = new Map<Lvl, THREE.Texture>();
function lvlTex(l: Lvl) {
  let t = LVL_TEX.get(l);
  if (!t) {
    t = canvasTexture(256, 192, (g) => {
      g.clearRect(0, 0, 256, 192);
      drawText(g, [LVL[l].word], 128, 96, 220, 90, l === "L" ? "rgba(255,255,255,0.75)" : "#FFFFFF", 900);
    });
    LVL_TEX.set(l, t);
  }
  return t;
}

function KMatrix({ reduced }: { reduced: boolean }) {
  const mats = useMemo(
    () =>
      PARAMS.flatMap((p) =>
        p.v.map((l, j) => {
          const m = new THREE.MeshStandardMaterial({ color: PLAYERS[j].color, roughness: 0.35, metalness: 0.1, emissive: new THREE.Color(PLAYERS[j].color), emissiveIntensity: LVL[l].ei });
          if (l === "L") m.color.multiplyScalar(0.55);
          return m;
        }),
      ),
    [],
  );
  useEffect(() => () => mats.forEach((m) => m.dispose()), [mats]);
  useFrame(({ clock }) => {
    if (reduced) return;
    // a slow scan of light moves across the rows (materials are animated directly — tiles sit inside hover wrappers)
    const t = clock.elapsedTime * 0.6;
    PARAMS.forEach((p, i) =>
      p.v.forEach((l, j) => {
        const wave = Math.max(0, Math.sin(t - i * 0.7)) ** 6;
        mats[i * 4 + j].emissiveIntensity = LVL[l].ei + wave * 0.6;
      }),
    );
  });
  return (
    <group>
      {/* slate base with a lit grid */}
      <Box s={[11.6, 0.12, 13.2]} p={[0, 0.06, 0]} c="#272B35" rough={0.4} metal={0.3} recv />
      <Box s={[11.8, 0.04, 13.4]} p={[0, 0.02, 0]} c="#FED300" e="#FED300" ei={1.2} />
      <group>
        {PARAMS.map((p, i) =>
          p.v.map((l, j) => {
            const h = LVL[l].h;
            return (
              <Label key={`${i}-${j}`} label={`${PLAYERS[j].short} · ${p.name}: ${LVL[l].word}`}>
                <group position={[COL_X[j], 0.12, ROW_Z[i]]}>
                  <mesh geometry={boxGeo()} material={mats[i * 4 + j]} position={[0, h / 2, 0]} scale={[2.3, h, 1.75]} castShadow receiveShadow userData={{ ei: LVL[l].ei }} />
                  <mesh position={[0, h + 0.006, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                    <planeGeometry args={[1.9, 1.2]} />
                    <meshBasicMaterial map={lvlTex(l)} transparent toneMapped={false} depthWrite={false} />
                  </mesh>
                </group>
              </Label>
            );
          }),
        )}
      </group>
      {/* row labels (left edge, tilted up) */}
      {PARAMS.map((p, i) => (
        <TextBoard key={p.name} lines={[{ t: p.name, size: 50, weight: 800 }]} bg="#FFF5EE" fg={C.cocoa} w={4.6} h={0.62} px={1024} position={[-8.25, 0.42, ROW_Z[i]]} rotation={[-1.05, 0, 0]} frame={C.cocoa} glow={0.3} label={`K-Matrix parameter: ${p.name}`} />
      ))}
      {/* column headers (far edge) */}
      {PLAYERS.map((pl, j) => (
        <group key={pl.name} position={[COL_X[j], 0, -7.35]}>
          <Box s={[0.08, 1.4, 0.08]} p={[0, 0.7, -0.1]} c="#3A3F48" />
          <TextBoard lines={pl.name.split(" ").length > 2 ? [{ t: pl.name.split(" ").slice(0, -2).join(" "), size: 64 }, { t: pl.name.split(" ").slice(-2).join(" "), size: 64 }] : [{ t: pl.name, size: 72 }]} bg={pl.color} fg="#FFFFFF" w={2.45} h={0.9} px={512} position={[0, 1.65, 0]} rotation={[-0.35, 0, 0]} frame="#FFFFFF" glow={0.45} />
        </group>
      ))}
      <TextBoard
        lines={[
          { t: "THE K-MATRIX", size: 70 },
          { t: "tile height + glow = HIGH · MEDIUM · LOW", size: 34, weight: 700 },
        ]}
        bg="#2F1C1A"
        fg="#FED300"
        w={3.6}
        h={1.1}
        px={800}
        position={[0, 0.5, 7.8]}
        rotation={[-1.0, 0, 0]}
        frame="#FED300"
        glow={0.4}
        label="The K-Matrix: 6 customer-choice parameters × 4 players, from the 4.2 source table"
      />
    </group>
  );
}

/* ── stalls ────────────────────────────────────────────────────── */

type StallKind = "eb" | "trad" | "health" | "sweet";
const STALLS: { kind: StallKind; at: [number, number]; title: string; tier: string; color: string; awning: [string, string]; label: string }[] = [
  { kind: "eb", at: [13.5, -9.5], title: "EAT BETTER CO", tier: "Premium · ~₹0.67 to ₹1.55 / g", color: "#FF5C00", awning: ["#FF5C00", "#FFF5EE"], label: "Eat Better Co (D2C / modern): date-sweetened laddoos, roasted namkeens, seed mixes. Premium, ~₹0.67 to ₹1.55/g" },
  { kind: "trad", at: [-13.5, -9.5], title: "TRADITIONAL SNACK BRANDS", tier: "Mass-market · ~₹0.15 to ₹0.35 / g", color: "#C62828", awning: ["#C62828", "#FFD23F"], label: "Traditional brands (e.g. Haldiram's, Bikaji): bhujia, sev, fried mithai. Mass-market, ~₹0.15 to ₹0.35/g" },
  { kind: "health", at: [-13.5, 10], title: "DIRECT HEALTH COMPETITORS", tier: "Premium · ~₹0.80 to ₹1.80 / g", color: "#2E7D32", awning: ["#2E7D32", "#F1E3B0"], label: "Direct health competitors (e.g. Farmley, True Elements): dry fruits, seed mixes, roasted snacks. Premium, ~₹0.80 to ₹1.80/g" },
  { kind: "sweet", at: [13.5, 10], title: "LOCAL SWEET SHOPS", tier: "Mid-to-high · ~₹0.50 to ₹1.20 / g", color: "#8E1B3A", awning: ["#8E1B3A", "#F2C14E"], label: "Local sweet shops (mithai outlets): laddoos, barfis, halwa. Mid-to-high, ~₹0.50 to ₹1.20/g" },
];

const SHELF_IDS: Record<StallKind, string[][]> = {
  eb: [
    ["orange-ginger", "coffee-almond", "vanilla-choc", "protein-fudge"],
    ["hazelnut-vp", "orange-choc-vp", "peanut-vp"],
    ["desi-masala", "mango-achari", "bhujia-pudina", "protein-bhujia"],
    ["nut-mix", "seed-jaggery", "trail-mix", "ragi-achari"],
  ],
  trad: [["g:bhujia", "g:sev"], ["g:mixture", "g:chips"], ["g:sev", "g:bhujia"], ["g:mithai"]],
  health: [["g:dryfruit", "g:seeds"], ["g:roasted", "g:makhana"], ["g:seeds", "g:dryfruit"], ["g:makhana", "g:roasted"]],
  sweet: [["g:laddoo"], ["g:barfi"], ["g:laddoo", "g:barfi"], ["g:mithai"]],
};

function awningTex(a: string, b: string) {
  return canvasTexture(256, 64, (g) => {
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? b : a;
      g.fillRect(i * 32, 0, 32, 64);
    }
  });
}

function SweetCounter({ compact }: { compact: boolean }) {
  const { laddoos, barfis } = useMemo(() => {
    const r = rng(41);
    const laddoos: Inst[] = [];
    const barfis: Inst[] = [];
    for (let t = 0; t < 4; t++) {
      const x0 = -1.8 + t * 1.2;
      for (let i = 0; i < (compact ? 6 : 12); i++) {
        const px = x0 + ((i % 4) - 1.5) * 0.17;
        const pz = 0.95 + (Math.floor(i / 4) - 1) * 0.17;
        if (t % 2 === 0) laddoos.push({ p: [px, 1.02, pz], s: 0.075, c: t ? "#E8A33C" : "#F2C14E" });
        else barfis.push({ p: [px, 0.99, pz], r: [0, r() * 0.3, 0], s: [0.14, 0.05, 0.14], c: t === 1 ? "#F4EEE2" : "#C9E0A7" });
      }
    }
    return { laddoos, barfis };
  }, [compact]);
  const sphere = useMemo(() => new THREE.SphereGeometry(1, 12, 10), []);
  useEffect(() => () => sphere.dispose(), [sphere]);
  return (
    <group>
      {[0, 1, 2, 3].map((t) => (
        <Box key={t} s={[1.05, 0.03, 0.62]} p={[-1.8 + t * 1.2, 0.955, 0.95]} c="#D9DDE2" rough={0.25} metal={0.85} />
      ))}
      <Instanced geometry={sphere} material={mat("#FFFFFF", 0.7)} items={laddoos} />
      <Instanced geometry={boxGeo()} material={mat("#FFFFFF", 0.6)} items={barfis} />
      {/* glass case */}
      <mesh position={[0, 1.2, 0.95]} material={mat("#DDF1F7", 0.05, 0.1, { opacity: 0.22 })}>
        <boxGeometry args={[4.9, 0.5, 0.8]} />
      </mesh>
    </group>
  );
}

function Stall({ s, compact, reduced }: { s: (typeof STALLS)[number]; compact: boolean; reduced: boolean }) {
  const rot = Math.atan2(-s.at[0], -s.at[1]);
  const awning = useTex(() => awningTex(s.awning[0], s.awning[1]));
  const packs = useMemo(() => {
    const out: PackItem[] = [];
    SHELF_IDS[s.kind].forEach((ids, li) => {
      const big = ids[0].includes("mithai") || ids[0].includes("laddoo") || ids[0].includes("barfi");
      out.push(...fillRun(ids, [-2.7, 0.32 + li * 0.5, -1.45], [1, 0], 5.4, 0, ids.length > 2 ? 2 : 3, 0.03, big ? 0.85 : 1.05));
    });
    if (s.kind !== "sweet") {
      const ids = SHELF_IDS[s.kind][0];
      out.push(...fillRun(ids, [-2.2, 1.02, 0.85], [1, 0], 4.4, 0.0, 2, 0.12, 1.05));
    }
    return out;
  }, [s.kind]);
  const logo = useMemo(() => (s.kind === "eb" ? photoTex("/brand/eat-better-logo-transparent-600x400.png", [0.24, 0.27, 0.76, 0.73]) : null), [s.kind]);
  const vendor: HumanLook =
    s.kind === "eb"
      ? { skin: "#B98157", hair: "#1E1410", hairStyle: "bun", outfit: "tshirt", top: "#FF5C00", bottom: "#2B2B2B", slim: true, height: 0.95 }
      : s.kind === "trad"
        ? { skin: "#8D5A3B", hair: "#1A110C", hairStyle: "short", outfit: "shirt", top: "#C62828", bottom: "#2B2B2B", facial: "moustache" }
        : s.kind === "health"
          ? { skin: "#D1A276", hair: "#2A1A12", hairStyle: "side", outfit: "tshirt", top: "#2E7D32", bottom: "#33475B", glasses: "#1A1A1A" }
          : { skin: "#A86B45", hair: "#140C08", hairStyle: "short", outfit: "kurta", top: "#F4EFE6", bottom: "#F4EFE6", facial: "beard" };
  return (
    <Label label={s.label}>
      <group position={[s.at[0], 0, s.at[1]]} rotation={[0, rot, 0]}>
        <Box s={[6.6, 0.18, 4.4]} p={[0, 0.09, 0]} c="#8A6248" rough={0.85} cast={!compact} recv />
        {/* back shelving */}
        <Box s={[5.8, 2.3, 0.08]} p={[0, 1.33, -1.78]} c="#F4EDE2" rough={0.8} cast={!compact} />
        {[0, 1, 2, 3].map((k) => (
          <Box key={k} s={[5.8, 0.04, 0.6]} p={[0, 0.3 + k * 0.5, -1.45]} c="#FFFFFF" rough={0.6} />
        ))}
        {[-2.92, 2.92].map((x) => (
          <Box key={x} s={[0.06, 2.3, 0.64]} p={[x, 1.33, -1.45]} c="#E2D8C8" />
        ))}
        <Packs items={packs} />
        {/* counter */}
        <Box s={[5.0, 0.86, 0.72]} p={[0, 0.61, 0.95]} c={s.color} rough={0.6} cast={!compact} />
        <Box s={[5.1, 0.06, 0.8]} p={[0, 1.04 - 0.07, 0.95]} c="#F7F1E8" rough={0.4} />
        {s.kind === "sweet" && <SweetCounter compact={compact} />}
        {/* canopy */}
        {[-3.05, 3.05].flatMap((x) =>
          [-1.95, 1.95].map((z) => (
            <mesh key={`${x}${z}`} position={[x, 1.85, z]} material={mat("#3B2A20", 0.6, 0.2)} castShadow={!compact}>
              <cylinderGeometry args={[0.06, 0.06, 3.5, 8]} />
            </mesh>
          )),
        )}
        <mesh position={[0, 3.75, 0.1]} rotation={[0.16, 0, 0]} castShadow={!compact}>
          <boxGeometry args={[6.8, 0.08, 4.8]} />
          <meshStandardMaterial map={awning} roughness={0.85} />
        </mesh>
        <mesh position={[0, 3.32, 2.45]}>
          <planeGeometry args={[6.8, 0.5]} />
          <meshStandardMaterial map={awning} roughness={0.85} side={THREE.DoubleSide} />
        </mesh>
        {/* header sign */}
        <group position={[0, 4.45, 1.6]}>
          {logo ? (
            <>
              <Box s={[5.2, 1.15, 0.08]} p={[0, 0, -0.06]} c="#FFF5EE" />
              <mesh position={[-1.55, 0.05, 0]}>
                <planeGeometry args={[1.7, 0.85]} />
                <meshBasicMaterial map={logo} transparent toneMapped={false} />
              </mesh>
              <TextBoard lines={[{ t: s.tier, size: 46, weight: 800 }]} bg="#FFF5EE" fg={C.orange} w={3.0} h={0.7} px={800} position={[0.95, 0, 0.002]} glow={0.2} />
            </>
          ) : (
            <TextBoard
              lines={[
                { t: s.title, size: 64 },
                { t: s.tier, size: 40, weight: 700 },
              ]}
              bg={s.color}
              fg="#FFFFFF"
              w={5.2}
              h={1.15}
              px={1024}
              frame="#FFF5EE"
              glow={0.3}
            />
          )}
        </group>
        {s.kind === "sweet" && <Garland reduced={reduced} />}
        <Worker look={vendor} at={[0.4, -0.35]} face={0} reduced={reduced} y={0.18} phase={s.at[0] * 0.3} />
      </group>
    </Label>
  );
}

/** Marigold garland along the sweet shop's awning. */
function Garland({ reduced }: { reduced: boolean }) {
  const items = useMemo(() => {
    const out: Inst[] = [];
    for (let k = 0; k < 3; k++)
      for (let i = 0; i <= 26; i++) {
        const t = i / 26;
        const x = -3.2 + (k * 6.4) / 3 + (t * 6.4) / 3;
        out.push({ p: [x, 3.05 - Math.sin(t * Math.PI) * 0.35, 2.52], s: 0.07, c: i % 3 ? "#F59E0B" : "#FBBF24" });
      }
    return out;
  }, []);
  void reduced;
  const geo = useMemo(() => new THREE.IcosahedronGeometry(1, 1), []);
  useEffect(() => () => geo.dispose(), [geo]);
  return <Instanced geometry={geo} material={mat("#FFFFFF", 0.9)} items={items} />;
}

/* ── shoppers ──────────────────────────────────────────────────── */

const SHOPPERS: HumanLook[] = [
  { skin: "#B5764A", hair: "#140C08", hairStyle: "long", outfit: "salwar", top: "#26A69A", bottom: "#F3E5D0", accent: "#FED300", bindi: true, slim: true, height: 0.94, bag: { kind: "shoulder", color: "#7A4B2A" } },
  { skin: "#C68B59", hair: "#1E1410", hairStyle: "side", outfit: "shirt", top: "#E9EEF3", bottom: "#33475B", accent: "#FFFFFF", facial: "stubble" },
  { skin: "#D1A276", hair: "#2A1A12", hairStyle: "curly", outfit: "tshirt", top: "#3E8E41", bottom: "#33475B", shoe: "#EDEDED", bag: { kind: "backpack", color: "#35401D" } },
  { skin: "#9C6644", hair: "#140C08", hairStyle: "braid", outfit: "salwar", top: "#F48FB1", bottom: "#ECE2D0", accent: "#FFFFFF", slim: true, height: 0.95, bag: { kind: "backpack", color: "#1565C0" } },
  { skin: "#8D5A3B", hair: "#1A110C", hairStyle: "short", outfit: "hoodie", top: "#4A4E69", bottom: "#2B2B2B", facial: "beard", shoe: "#F2F2F2", bag: { kind: "sling", color: "#222222" } },
  { skin: "#D9A066", hair: "#3E2723", hairStyle: "bun", outfit: "shirt", top: "#E98A7B", bottom: "#2B3A55", accent: "#F7D2CB", slim: true, height: 0.95, glasses: "#1A1A1A", bag: { kind: "shoulder", color: "#2F2A28" } },
  { skin: "#B98157", hair: "#1E1410", hairStyle: "long", outfit: "saree", top: "#C2185B", bottom: "#C2185B", accent: "#F2A900", bindi: true, slim: true, height: 0.95, bag: { kind: "shoulder", color: "#7A4B2A" } },
  { skin: "#C68B59", hair: "#1E1410", hairStyle: "side", outfit: "kurta", top: "#7B2D26", bottom: "#E8DCC8", facial: "beard" },
  { skin: "#A86B45", hair: "#CFC8C0", hairStyle: "bun", outfit: "saree", top: "#8E3B5A", bottom: "#8E3B5A", accent: "#F2D3A0", bindi: true, slim: true, height: 0.92, glasses: "#3A2A1E" },
  { skin: "#C68B59", hair: "#1E1410", hairStyle: "short", outfit: "tshirt", top: "#FED300", bottom: "#1E5AA6", height: 0.72, slim: true, shoe: "#EDEDED" },
];

// routes between the stall fronts, skirting the matrix
const ROUTES: [[number, number], [number, number]][] = [
  [[9.0, -8.7], [-9.0, -8.7]],
  [[-9.2, 9.4], [9.2, 9.4]],
  [[9.6, -5.6], [9.8, 6.4]],
  [[-11.6, -5.2], [-11.6, 5.6]],
  [[6.5, -9.6], [9.6, -5.2]],
  [[0.5, 10.6], [9.4, 9.0]],
  [[-0.8, -9.6], [-8.6, -8.4]],
  [[-9.6, 8.6], [-2.0, 10.7]],
];

function Shoppers({ compact, reduced }: { compact: boolean; reduced: boolean }) {
  const n = compact ? 4 : ROUTES.length;
  return (
    <group>
      {ROUTES.slice(0, n).map((r, i) => (
        <Walker key={i} look={SHOPPERS[i % SHOPPERS.length]} a={r[0]} b={r[1]} speed={0.75 + (i % 3) * 0.12} phase={i * 0.37} reduced={reduced} y={0.01} />
      ))}
      {!compact && (
        <>
          <Worker look={SHOPPERS[8]} at={[10.6, -6.9]} face={Math.atan2(13.5 - 10.6, -9.5 + 6.9)} reduced={reduced} y={0.01} phase={1} />
          <Worker look={SHOPPERS[9]} at={[10.2, -6.3]} face={Math.atan2(13.5 - 10.2, -9.5 + 6.3) + 0.2} reduced={reduced} y={0.01} phase={2} />
          <Worker look={SHOPPERS[6]} at={[-10.5, -7.0]} face={Math.atan2(-13.5 + 10.5, -9.5 + 7)} reduced={reduced} y={0.01} phase={3} />
          <Worker look={SHOPPERS[5]} at={[10.4, 7.6]} face={Math.atan2(13.5 - 10.4, 10 - 7.6)} reduced={reduced} y={0.01} phase={4} />
          <Worker look={SHOPPERS[4]} at={[-10.6, 7.4]} face={Math.atan2(-13.5 + 10.6, 10 - 7.4)} reduced={reduced} y={0.01} phase={5} />
        </>
      )}
    </group>
  );
}

/* ── lamp posts + planters ─────────────────────────────────────── */

function Furniture({ compact }: { compact: boolean }) {
  const { posts, heads, pots, trees, glows } = useMemo(() => {
    const posts: Inst[] = [];
    const heads: Inst[] = [];
    const pots: Inst[] = [];
    const trees: Inst[] = [];
    const glows: [number, number, number][] = [];
    const n = 12;
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2 + Math.PI / n;
      const x = Math.cos(a) * 21.5;
      const z = Math.sin(a) * 21.5;
      posts.push({ p: [x, 2.2, z], s: [0.1, 4.4, 0.1] });
      heads.push({ p: [x, 4.5, z], s: 0.26 });
      glows.push([x, 4.5, z]);
      if (!compact || i % 2 === 0) {
        const b = a + Math.PI / n;
        const px = Math.cos(b) * 22;
        const pz = Math.sin(b) * 22;
        pots.push({ p: [px, 0.35, pz], s: [1.1, 0.7, 1.1] });
        trees.push({ p: [px, 2.1, pz], s: [1.2, 1.5, 1.2] }, { p: [px + 0.3, 2.9, pz - 0.2], s: [0.85, 1.0, 0.85] });
        posts.push({ p: [px, 1.1, pz], s: [0.12, 1.6, 0.12] });
      }
    }
    return { posts, heads, pots, trees, glows };
  }, [compact]);
  const sphere = useMemo(() => new THREE.IcosahedronGeometry(1, 1), []);
  const cyl = useMemo(() => new THREE.CylinderGeometry(0.5, 0.42, 1, 16), []);
  useEffect(
    () => () => {
      sphere.dispose();
      cyl.dispose();
    },
    [sphere, cyl],
  );
  return (
    <group>
      <Instanced geometry={boxGeo()} material={mat("#3A3330", 0.5, 0.5)} items={posts} castShadow={!compact} />
      <Instanced geometry={sphere} material={mat("#FFF1D0", 0.3, 0, { emissive: "#FFD58A", ei: 2 })} items={heads} />
      <Instanced geometry={cyl} material={mat("#B5835E", 0.8)} items={pots} castShadow={!compact} />
      <Instanced geometry={sphere} material={mat("#5E8C3A", 0.9, 0, { flat: true })} items={trees} castShadow={!compact} />
      {glows.map((p, i) => (
        <Glow key={i} position={p} color="#FFD58A" size={1.8} opacity={0.35} />
      ))}
    </group>
  );
}

export function Arena({ compact, reduced }: { compact: boolean; reduced: boolean }) {
  return (
    <group>
      <City night={false} compact={compact} clear={78} outer={240} seed={11} groundY={0} />
      <Plaza compact={compact} />
      <KMatrix reduced={reduced} />
      {STALLS.map((s) => (
        <Stall key={s.kind} s={s} compact={compact} reduced={reduced} />
      ))}
      <Shoppers compact={compact} reduced={reduced} />
      <Furniture compact={compact} />
    </group>
  );
}
