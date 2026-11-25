"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { CameraControls } from "@react-three/drei";
import { RoundedBox } from "@/components/three/RoundedBox";
import { Human, type HumanLook, type HumanMode } from "@/components/world2/Human";
import { AsyncCompile } from "@/components/three/AsyncCompile";
import { FitFov } from "@/components/three/FitFov";
import { COINS, DEPTS, FACILITY_CAP, KMATRIX, K_PLAYERS, LEVEL_IDX, ORDERS_NOW, PLAYER_COLORS, SKUS, bagOutcome, plNext, ppg, type DeptId, type Level, type Levers } from "./data";
import { Desk, OfficeChair, PendantLamp, Plant, Room, mat } from "./Office3D";

/**
 * The Eat Better head office, played as five missions:
 * a price shelf with a four-step podium and a delivery bag · a giant balance scale ("money machine") ·
 * a rival map on the floor beside the K-Matrix wall · a budget table with coin jars · the Jaipur factory model with a
 * capacity gauge and a boardroom where three investors react to the pitch. A mentor walks to each mission and points
 * at it; staff work at their desks in between.
 */

export type HQFocus = "overview" | "pricing" | "finance" | "compete" | "budget" | "growth" | "pitch";
type V3 = [number, number, number];

const ZP: V3 = [-9, 0, -2.8]; // price shelf
const ZF: V3 = [-2.6, 0, -3.0]; // money machine
const ZC: V3 = [5.2, 0, -2.4]; // rival map
const ZB: V3 = [-2.6, 0, 4.8]; // budget table
const ZG: V3 = [8.9, 0, -2.6]; // factory model
const ZR: V3 = [14.8, 0, 1.0]; // boardroom table
const AISLE = 0.8;

const VIEWS: Record<HQFocus, { pos: V3; look: V3 }> = {
  overview: { pos: [1.5, 10.5, 18], look: [1.5, 0.6, -0.5] },
  pricing: { pos: [-9, 3.0, 3.6], look: [-9, 1.25, -3.0] },
  finance: { pos: [-2.6, 2.7, 2.7], look: [-2.6, 1.45, -3.2] },
  compete: { pos: [5.2, 5.6, 4.6], look: [5.2, 0.8, -2.6] },
  budget: { pos: [-2.6, 4.4, 10.4], look: [-2.6, 0.9, 4.8] },
  growth: { pos: [8.9, 3.4, 3.8], look: [8.9, 1.1, -2.6] },
  pitch: { pos: [14.4, 2.7, 7.4], look: [14.8, 1.1, 0.6] },
};

/* ── canvas boards ─────────────────────────────────────────────── */

const F = (w: number, s: number) => `${w} ${s}px Figtree, "Segoe UI", Arial, sans-serif`;
function tex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
function Board({ w, h, px = 1024, position, rotation, draw, deps }: { w: number; h: number; px?: number; position: V3; rotation?: V3; draw: (g: CanvasRenderingContext2D, W: number, H: number) => void; deps: unknown[] }) {
  const H = Math.round((px * h) / w);
  const key = JSON.stringify(deps);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- redraw only when the listed values change
  const t = useMemo(() => tex(px, H, (g) => draw(g, px, H)), [key, px, H]);
  useEffect(() => () => t.dispose(), [t]);
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={t} toneMapped={false} transparent />
    </mesh>
  );
}
function Sign({ text, position, rotation, w = 2.4, h = 0.42, bg = "#2F1C1A", fg = "#FED300", round = true }: { text: string; position: V3; rotation?: V3; w?: number; h?: number; bg?: string; fg?: string; round?: boolean }) {
  return (
    <Board
      w={w}
      h={h}
      px={Math.min(1024, Math.round(320 * w))}
      position={position}
      rotation={rotation}
      deps={[text, bg, fg, w, h, round]}
      draw={(g, W, H) => {
        g.fillStyle = bg;
        if (round && g.roundRect) {
          g.beginPath();
          g.roundRect(0, 0, W, H, H * 0.28);
          g.fill();
        } else g.fillRect(0, 0, W, H);
        g.fillStyle = fg;
        g.textAlign = "center";
        g.textBaseline = "middle";
        let size = H * 0.56;
        g.font = F(800, size);
        while (g.measureText(text).width > W - H * 0.5 && size > 8) {
          size -= 2;
          g.font = F(800, size);
        }
        g.fillText(text, W / 2, H / 2 + 1);
      }}
    />
  );
}

const hover = (on: boolean) => (e: ThreeEvent<PointerEvent>) => {
  e.stopPropagation();
  document.body.style.cursor = on ? "pointer" : "";
};
const dampAngle = (a: number, b: number, k: number, dt: number) => {
  let d = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (d < -Math.PI) d += Math.PI * 2;
  return a + d * (1 - Math.exp(-k * dt));
};

/* ── mission 1: price shelf, podium and delivery bag ───────────── */

const PACK_SIZE: Record<string, V3> = { l24: [0.7, 0.28, 0.46], l42: [0.82, 0.34, 0.5], usb: [0.86, 0.56, 0.46], nam: [0.72, 0.78, 0.2] };
function usePackTexture(src: string) {
  const [t, setT] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    let alive = true;
    new THREE.TextureLoader().load(src, (x) => {
      x.colorSpace = THREE.SRGBColorSpace;
      x.anisotropy = 8;
      if (alive) setT(x);
      else x.dispose();
    });
    return () => {
      alive = false;
    };
  }, [src]);
  useEffect(() => () => t?.dispose(), [t]);
  return t;
}
function Pack({ src, size }: { src: string; size: V3 }) {
  const t = usePackTexture(src);
  const side = mat("#EBD7BC", 0.7);
  const front = useMemo(() => new THREE.MeshStandardMaterial({ map: t, color: t ? "#FFFFFF" : "#EBD7BC", roughness: 0.5 }), [t]);
  useEffect(() => () => front.dispose(), [front]);
  return (
    <mesh position={[0, size[1] / 2, 0]} castShadow receiveShadow material={[side, side, side, side, front, side]}>
      <boxGeometry args={size} />
    </mesh>
  );
}

const PODIUM_X = (i: number) => -1.65 + i * 1.1;
const PODIUM_H = (i: number) => 0.06 + i * 0.09;
const SHELF_X = (i: number) => -1.62 + i * 1.08;

function PackOnStage({ id, idx, rankIdx, revealed, onPick }: { id: string; idx: number; rankIdx: number; revealed: boolean; onPick?: (id: string) => void }) {
  const k = SKUS.find((s) => s.id === id)!;
  const ref = useRef<THREE.Group>(null);
  const size = PACK_SIZE[id];
  const target = useMemo(() => (rankIdx >= 0 ? new THREE.Vector3(PODIUM_X(rankIdx), 0.9 + PODIUM_H(rankIdx), 0) : new THREE.Vector3(SHELF_X(idx), 1.47, -2.12)), [rankIdx, idx]);
  useFrame((_, dt) => {
    const g = ref.current;
    if (!g) return;
    const d = g.position.distanceTo(target);
    g.position.lerp(target, 1 - Math.exp(-5 * dt));
    // a little hop while it travels
    g.position.y = THREE.MathUtils.lerp(g.position.y, target.y + Math.min(0.5, d * 0.35), 1 - Math.exp(-8 * dt));
  });
  return (
    <group ref={ref} position={target.toArray()} onClick={(e) => (e.stopPropagation(), onPick?.(id))} onPointerOver={hover(true)} onPointerOut={hover(false)}>
      <Pack src={k.tex} size={size} />
      <Board
        w={0.92}
        h={0.36}
        px={512}
        position={[0, size[1] + 0.26, 0]}
        deps={[id, revealed, rankIdx]}
        draw={(g, W, H) => {
          g.fillStyle = revealed ? "#2E9E5B" : "#FFFFFF";
          g.beginPath();
          g.roundRect(4, 4, W - 8, H - 8, 30);
          g.fill();
          g.lineWidth = 6;
          g.strokeStyle = "#2F1C1A";
          g.stroke();
          g.fillStyle = revealed ? "#FFFFFF" : "#2F1C1A";
          g.textAlign = "center";
          g.font = F(800, 58);
          g.fillText(`Rs ${k.price}`, W / 2, 80);
          g.font = F(700, 40);
          g.fillText(revealed ? `Rs ${ppg(k.price, k.grams).toFixed(2)} per gram` : `${k.grams} g`, W / 2, 148);
        }}
      />
    </group>
  );
}

function DeliveryBag({ bag }: { bag: Record<string, number> }) {
  const o = bagOutcome(bag);
  const minis = SKUS.flatMap((k) => Array.from({ length: bag[k.id] ?? 0 }, () => k.id)).slice(0, 10);
  return (
    <group position={[3.25, 0, 0.35]}>
      <RoundedBox args={[1.3, 0.06, 0.8]} radius={0.02} position={[0, 0.74, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#E9DCCB" roughness={0.45} />
      </RoundedBox>
      {[-0.55, 0.55].map((x) => (
        <mesh key={x} position={[x, 0.36, 0]} castShadow>
          <boxGeometry args={[0.05, 0.72, 0.65]} />
          <meshStandardMaterial color="#3A3D42" roughness={0.4} metalness={0.5} />
        </mesh>
      ))}
      {/* kraft paper bag with an orange band and rope handles */}
      <group position={[-0.25, 0.77, 0]}>
        <mesh position={[0, 0.32, 0]} castShadow>
          <boxGeometry args={[0.5, 0.64, 0.3]} />
          <meshStandardMaterial color="#C79A64" roughness={0.9} />
        </mesh>
        <mesh position={[0, 0.34, 0.152]}>
          <planeGeometry args={[0.5, 0.16]} />
          <meshStandardMaterial color="#FF5C00" roughness={0.7} />
        </mesh>
        <Sign text="EAT BETTER" position={[0, 0.34, 0.154]} w={0.44} h={0.1} bg="#FF5C00" fg="#FFFFFF" round={false} />
        {[-0.1, 0.1].map((x) => (
          <mesh key={x} position={[x, 0.66, 0]} rotation={[0, 0, 0]}>
            <torusGeometry args={[0.07, 0.008, 6, 16, Math.PI]} />
            <meshStandardMaterial color="#5A3D2B" />
          </mesh>
        ))}
      </group>
      {/* the boxes packed so far, as small cartons */}
      {minis.map((id, i) => (
        <mesh key={i} position={[0.22 + (i % 2) * 0.2, 0.83 + Math.floor(i / 2) * 0.12, -0.05]} castShadow>
          <boxGeometry args={[0.18, 0.11, 0.14]} />
          <meshStandardMaterial color={{ l24: "#E8B800", l42: "#FF5C00", usb: "#2E9E5B", nam: "#8A4FD6" }[id]} roughness={0.6} />
        </mesh>
      ))}
      <Sign
        text={o.boxes ? `Bag Rs ${o.value.toLocaleString("en-IN")} · keeps ${Math.round(o.pct * 100)}%` : "Delivery bag: empty"}
        position={[0, 1.95, 0]}
        w={1.6}
        h={0.24}
        bg={o.ok ? "#2E9E5B" : "#2F1C1A"}
        fg="#FFFFFF"
      />
    </group>
  );
}

function PriceZone({ rank, rankDone, onSku, bag }: { rank: string[]; rankDone: boolean; onSku?: (id: string) => void; bag: Record<string, number> }) {
  return (
    <group position={ZP}>
      {/* wall shelf for boxes not yet ranked */}
      <mesh position={[0, 1.45, -2.12]} castShadow receiveShadow>
        <boxGeometry args={[4.6, 0.05, 0.42]} />
        <meshStandardMaterial color="#B98157" roughness={0.55} />
      </mesh>
      {[-2.1, 2.1].map((x) => (
        <mesh key={x} position={[x, 1.32, -2.25]}>
          <boxGeometry args={[0.05, 0.22, 0.2]} />
          <meshStandardMaterial color="#2B2E33" metalness={0.5} roughness={0.4} />
        </mesh>
      ))}
      <Sign text="PRICE DETECTIVE" position={[0, 2.75, -2.36]} w={2.6} h={0.42} />
      {/* counter with a four-step podium */}
      <RoundedBox args={[4.7, 0.9, 0.95]} radius={0.04} position={[0, 0.45, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#FFF5EE" roughness={0.55} />
      </RoundedBox>
      <mesh position={[0, 0.905, 0]} receiveShadow>
        <boxGeometry args={[4.74, 0.03, 0.99]} />
        <meshStandardMaterial color="#B98157" roughness={0.45} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <group key={i} position={[PODIUM_X(i), 0.92, 0]}>
          <RoundedBox args={[0.98, PODIUM_H(i), 0.66]} radius={0.025} position={[0, PODIUM_H(i) / 2 - 0.01, 0]} castShadow receiveShadow>
            <meshStandardMaterial color={["#2E9E5B", "#7CB342", "#F2A900", "#E57373"][i]} roughness={0.5} />
          </RoundedBox>
          <Sign text={`${i + 1}`} position={[0, PODIUM_H(i) / 2, 0.335]} w={0.2} h={0.2} bg="#FFFFFF" fg="#2F1C1A" />
        </group>
      ))}
      <Sign text="CHEAPEST PER GRAM  →  COSTLIEST PER GRAM" position={[0, 0.55, 0.48]} w={3.6} h={0.26} bg="#2F1C1A" fg="#FFFFFF" />
      {SKUS.map((k, i) => (
        <PackOnStage key={k.id} id={k.id} idx={i} rankIdx={rank.indexOf(k.id)} revealed={rankDone} onPick={onSku} />
      ))}
      <DeliveryBag bag={bag} />
      <Plant position={[-2.9, 0, -1.9]} scale={1.2} />
    </group>
  );
}

/* ── mission 2: the money machine (balance scale) ──────────────── */

function CoinStack({ n, color = "#E8B800", position }: { n: number; color?: string; position: V3 }) {
  const shown = Math.min(n, 18);
  return (
    <group position={position}>
      {Array.from({ length: shown }, (_, i) => (
        <mesh key={i} position={[Math.sin(i * 2.3) * 0.012, 0.018 + i * 0.034, Math.cos(i * 1.7) * 0.012]} castShadow>
          <cylinderGeometry args={[0.11, 0.11, 0.03, 22]} />
          <meshStandardMaterial color={color} roughness={0.3} metalness={0.75} />
        </mesh>
      ))}
    </group>
  );
}

function MoneyMachine({ levers, active }: { levers: Levers; active: boolean }) {
  const pl = plNext(levers);
  const beam = useRef<THREE.Group>(null);
  const panL = useRef<THREE.Group>(null);
  const panR = useRef<THREE.Group>(null);
  const tilt = active ? THREE.MathUtils.clamp(pl.net / 2.5, -0.28, 0.28) : 0;
  useFrame((_, dt) => {
    if (!beam.current) return;
    beam.current.rotation.z = THREE.MathUtils.damp(beam.current.rotation.z, tilt, 3, dt);
    const r = beam.current.rotation.z;
    panL.current?.rotation.set(0, 0, -r);
    panR.current?.rotation.set(0, 0, -r);
  });
  const inCoins = Math.round(pl.gross / 0.6);
  const outCoins = Math.round((pl.marketing + pl.fixed) / 0.6);
  const profit = pl.net >= 0;
  return (
    <group position={ZF}>
      {/* the reported-numbers screen on the wall */}
      <mesh position={[0, 2.15, -2.12]}>
        <boxGeometry args={[4.2, 1.9, 0.08]} />
        <meshStandardMaterial color="#15171B" roughness={0.3} />
      </mesh>
      <Board
        w={4.0}
        h={1.72}
        position={[0, 2.15, -2.07]}
        deps={[active ? pl.rev.toFixed(1) : null]}
        draw={(g, W, H) => {
          g.fillStyle = "#0E1A3A";
          g.fillRect(0, 0, W, H);
          g.fillStyle = "#FFFFFF";
          g.font = F(800, 46);
          g.fillText("SALES EACH YEAR", 40, 70);
          g.font = F(500, 24);
          g.fillStyle = "#AFC2E8";
          g.fillText("FY23 and FY24: reported (approx.)   ·   Next year: your practice plan", 40, 108);
          const bars: [string, number, string][] = [["FY23", 5.33, "#7FA8FF"], ["FY24", 14.47, "#FF5C00"], ...(active ? ([["Next year", pl.rev, "#FED300"]] as [string, number, string][]) : [])];
          const max = Math.max(30, ...bars.map((b) => b[1]));
          bars.forEach(([l, v, c], i) => {
            const x = 90 + i * 300;
            const bh = (v / max) * 250;
            g.fillStyle = c;
            g.fillRect(x, 400 - bh, 170, bh);
            g.fillStyle = "#FFFFFF";
            g.font = F(800, 34);
            g.fillText(`Rs ${v.toFixed(1)} cr`, x, 385 - bh);
            g.font = F(700, 28);
            g.fillText(l, x, 430);
          });
        }}
      />
      {/* base, pillar, pivot */}
      <RoundedBox args={[1.4, 0.14, 0.7]} radius={0.04} position={[0, 0.07, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#5A3D2B" roughness={0.4} />
      </RoundedBox>
      <mesh position={[0, 0.95, 0]} castShadow>
        <cylinderGeometry args={[0.06, 0.09, 1.7, 18]} />
        <meshStandardMaterial color="#C9A227" roughness={0.3} metalness={0.8} />
      </mesh>
      <mesh position={[0, 1.82, 0]}>
        <sphereGeometry args={[0.1, 18, 14]} />
        <meshStandardMaterial color="#C9A227" roughness={0.3} metalness={0.8} />
      </mesh>
      <group ref={beam} position={[0, 1.82, 0]}>
        <mesh castShadow>
          <boxGeometry args={[2.7, 0.07, 0.09]} />
          <meshStandardMaterial color="#C9A227" roughness={0.3} metalness={0.8} />
        </mesh>
        {(
          [
            [-1.25, panL, inCoins, "#E8B800", "MONEY IN", "#2E9E5B"],
            [1.25, panR, outCoins, "#B0BEC5", "MONEY OUT", "#C62828"],
          ] as const
        ).map(([x, ref, n, coin, label, tone]) => (
          <group key={label} position={[x, 0, 0]}>
            <group ref={ref}>
              {[0, 1, 2].map((k) => {
                const a = (k / 3) * Math.PI * 2;
                return (
                  <mesh key={k} position={[Math.cos(a) * 0.2, -0.38, Math.sin(a) * 0.2]} rotation={[Math.sin(a) * 0.27, 0, -Math.cos(a) * 0.27]}>
                    <cylinderGeometry args={[0.006, 0.006, 0.76, 5]} />
                    <meshStandardMaterial color="#8D7A4A" metalness={0.7} roughness={0.4} />
                  </mesh>
                );
              })}
              <mesh position={[0, -0.78, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.46, 0.4, 0.05, 32]} />
                <meshStandardMaterial color="#C9A227" roughness={0.3} metalness={0.8} />
              </mesh>
              <CoinStack n={n} color={coin} position={[0, -0.755, 0]} />
              <Sign text={label} position={[0, -1.25, 0.47]} w={0.9} h={0.2} bg={tone} fg="#FFFFFF" />
            </group>
          </group>
        ))}
      </group>
      {active && (
        <Sign
          text={profit ? `PROFIT  +Rs ${pl.net.toFixed(2)} cr` : `LOSS  -Rs ${Math.abs(pl.net).toFixed(2)} cr`}
          position={[0, 0.24, 0.37]}
          w={1.3}
          h={0.22}
          bg={profit ? "#2E9E5B" : "#C62828"}
          fg="#FFFFFF"
        />
      )}
    </group>
  );
}

/* ── mission 3: rival map ──────────────────────────────────────── */

const CELL = 1.15;
const cellPos = (xi: number, zi: number): V3 => [(xi - 1) * CELL, 0, 0.6 - zi * CELL];

function Pawn({ color, position, bob }: { color: string; position: V3; bob: boolean }) {
  const ref = useRef<THREE.Group>(null);
  const target = useMemo(() => new THREE.Vector3(...position), [position]);
  useFrame(({ clock }, dt) => {
    const g = ref.current;
    if (!g) return;
    g.position.x = THREE.MathUtils.damp(g.position.x, target.x, 5, dt);
    g.position.z = THREE.MathUtils.damp(g.position.z, target.z, 5, dt);
    g.position.y = bob ? 0.08 + Math.abs(Math.sin(clock.elapsedTime * 4)) * 0.15 : THREE.MathUtils.damp(g.position.y, 0, 6, dt);
  });
  const m = mat(color, 0.35, 0.1);
  return (
    <group ref={ref} position={position}>
      <mesh position={[0, 0.04, 0]} material={m} castShadow>
        <cylinderGeometry args={[0.2, 0.22, 0.08, 24]} />
      </mesh>
      <mesh position={[0, 0.28, 0]} material={m} castShadow>
        <cylinderGeometry args={[0.07, 0.15, 0.42, 20]} />
      </mesh>
      <mesh position={[0, 0.55, 0]} material={m} castShadow>
        <sphereGeometry args={[0.12, 20, 16]} />
      </mesh>
    </group>
  );
}

function RivalZone({ grid, player, onCell }: { grid: Record<string, { x: Level | null; y: Level | null }>; player: string; onCell?: (xi: number, zi: number) => void }) {
  const [hot, setHot] = useState<string | null>(null);
  return (
    <group position={ZC}>
      <mesh position={[0, 2.2, -2.72]}>
        <boxGeometry args={[4.6, 2.9, 0.06]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.6} />
      </mesh>
      <Board
        w={4.4}
        h={2.7}
        position={[0, 2.2, -2.68]}
        deps={[]}
        draw={(g, W, H) => {
          g.fillStyle = "#FFFFFF";
          g.fillRect(0, 0, W, H);
          g.fillStyle = "#2F1C1A";
          g.font = F(800, 44);
          g.fillText("K-MATRIX  (from Chapter 4.2)", 34, 62);
          const cw = (W - 330) / 4;
          K_PLAYERS.forEach((p, j) => {
            g.fillStyle = PLAYER_COLORS[p.id];
            g.fillRect(300 + j * cw, 84, cw - 8, 56);
            g.fillStyle = "#FFFFFF";
            g.font = F(800, 24);
            g.textAlign = "center";
            g.fillText(p.short, 300 + j * cw + cw / 2 - 4, 121, cw - 16);
            g.textAlign = "left";
          });
          KMATRIX.forEach((r, i) => {
            const y = 150 + i * 72;
            const key = r.id === "price" || r.id === "sweet";
            if (key) {
              g.fillStyle = "#FFF3CC";
              g.fillRect(16, y + 2, W - 32, 70);
            }
            g.fillStyle = "#2F1C1A";
            g.font = F(key ? 800 : 600, 25);
            g.fillText(r.short, 30, y + 46, 260);
            K_PLAYERS.forEach((p, j) => {
              const v = r.v[p.id];
              g.fillStyle = v === "High" ? "#2E9E5B" : v === "Medium" ? "#F2A900" : "#E57373";
              g.fillRect(300 + j * cw, y + 8, cw - 8, 58);
              g.fillStyle = "#FFFFFF";
              g.font = F(800, 26);
              g.textAlign = "center";
              g.fillText(v.toUpperCase(), 300 + j * cw + cw / 2 - 4, y + 47);
              g.textAlign = "left";
            });
          });
        }}
      />
      {/* floor map: x = price for everyone (left Low → right High), back = more natural sweetening */}
      {[0, 1, 2].flatMap((xi) =>
        [0, 1, 2].map((zi) => {
          const k = `${xi}${zi}`;
          const [x, , z] = cellPos(xi, zi);
          return (
            <mesh
              key={k}
              rotation={[-Math.PI / 2, 0, 0]}
              position={[x, 0.012, z]}
              receiveShadow
              onClick={(e) => (e.stopPropagation(), onCell?.(xi, zi))}
              onPointerOver={(e) => (hover(true)(e), setHot(k))}
              onPointerOut={(e) => (hover(false)(e), setHot(null))}
            >
              <planeGeometry args={[CELL - 0.06, CELL - 0.06]} />
              <meshStandardMaterial color={hot === k ? "#FFD08A" : (xi + zi) % 2 ? "#F6EBDD" : "#EADAC5"} roughness={0.8} />
            </mesh>
          );
        }),
      )}
      <Sign text="PRICE FOR EVERYONE:  LOW  →  HIGH" position={[0, 0.02, 1.45]} rotation={[-Math.PI / 2, 0, 0]} w={3.0} h={0.3} bg="#2F1C1A" fg="#FFFFFF" />
      <Sign text="NATURAL SWEETENING:  LOW  →  HIGH" position={[-2.05, 0.02, -0.55]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} w={3.0} h={0.3} bg="#2F1C1A" fg="#FFFFFF" />
      {K_PLAYERS.map((p, k) => {
        const c = grid[p.id];
        const placed = !!(c?.x && c?.y);
        const pos: V3 = placed ? (() => {
          const [x, , z] = cellPos(LEVEL_IDX[c!.x!], LEVEL_IDX[c!.y!]);
          return [x + (k % 2 ? 0.24 : -0.24), 0, z + (k > 1 ? 0.24 : -0.24)] as V3;
        })() : [-0.9 + k * 0.6, 0, 2.2];
        return <Pawn key={p.id} color={PLAYER_COLORS[p.id]} position={pos} bob={!placed && p.id === player} />;
      })}
      <Sign text="WAITING" position={[-1.75, 0.02, 2.2]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} w={0.8} h={0.2} bg="#FFFFFF" fg="#2F1C1A" />
    </group>
  );
}

/* ── mission 4: budget table with coin jars ────────────────────── */

function BudgetTable({ coins, onJar }: { coins: Record<DeptId, number>; onJar?: (id: DeptId) => void }) {
  const used = DEPTS.reduce((a, d) => a + (coins[d.id] ?? 0), 0);
  const glass = mat("#DDEFF8", 0.05, 0.1, { opacity: 0.28 });
  return (
    <group position={ZB}>
      <mesh position={[0, 0.78, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.75, 1.75, 0.07, 64]} />
        <meshStandardMaterial color="#6B4A35" roughness={0.4} />
      </mesh>
      <mesh position={[0, 0.39, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.3, 0.78, 20]} />
        <meshStandardMaterial color="#2B2E33" roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[0, 0.02, 0]} receiveShadow>
        <cylinderGeometry args={[0.6, 0.6, 0.04, 32]} />
        <meshStandardMaterial color="#2B2E33" roughness={0.4} metalness={0.5} />
      </mesh>
      {DEPTS.map((d, i) => {
        const a = Math.PI / 2 + (i / DEPTS.length) * Math.PI * 2;
        const x = Math.cos(a) * 1.18;
        const z = Math.sin(a) * 1.18;
        const n = coins[d.id] ?? 0;
        return (
          <group key={d.id} position={[x, 0.815, z]} onClick={(e) => (e.stopPropagation(), onJar?.(d.id))} onPointerOver={hover(true)} onPointerOut={hover(false)}>
            <mesh position={[0, 0.3, 0]} material={glass}>
              <cylinderGeometry args={[0.22, 0.22, 0.6, 28, 1, true]} />
            </mesh>
            <mesh position={[0, 0.005, 0]}>
              <cylinderGeometry args={[0.22, 0.22, 0.01, 28]} />
              <meshStandardMaterial color={d.color} roughness={0.5} />
            </mesh>
            <mesh position={[0, 0.6, 0]}>
              <torusGeometry args={[0.22, 0.015, 8, 28]} />
              <meshStandardMaterial color={d.color} roughness={0.5} />
            </mesh>
            <CoinStack n={n} position={[0, 0.01, 0]} />
            <Sign text={`${d.name} · ${n}`} position={[0, 0.98, 0]} w={0.86} h={0.16} bg={d.color} fg="#FFFFFF" />
          </group>
        );
      })}
      <CoinStack n={COINS - used} position={[0, 0.815, 0]} />
      <Sign text={`Rs 10 CRORE = 20 COINS (PRACTICE) · ${COINS - used} LEFT`} position={[0, 2.35, -1.2]} w={3.4} h={0.36} />
      <PendantLamp position={[0, 3.2, 0]} />
    </group>
  );
}

/* ── mission 5: factory model and boardroom ────────────────────── */

function FactoryModel({ target, supported }: { target: number; supported: number }) {
  const g = useRef<THREE.Mesh>(null);
  const scaleH = (v: number) => (Math.min(v, 8) / 8) * 2.2;
  useFrame((_, dt) => {
    if (!g.current) return;
    g.current.scale.y = THREE.MathUtils.damp(g.current.scale.y, Math.max(0.02, scaleH(target)), 5, dt);
    g.current.position.y = 0.95 + g.current.scale.y / 2;
  });
  const ok = target <= FACILITY_CAP && target <= supported;
  return (
    <group position={ZG}>
      <RoundedBox args={[3.4, 0.9, 2.4]} radius={0.05} position={[0, 0.45, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#F3EEE7" roughness={0.6} />
      </RoundedBox>
      <mesh position={[0, 0.92, 0]} receiveShadow>
        <boxGeometry args={[3.3, 0.04, 2.3]} />
        <meshStandardMaterial color="#86A86F" roughness={0.9} />
      </mesh>
      <mesh position={[-0.3, 1.22, -0.1]} castShadow>
        <boxGeometry args={[2.1, 0.56, 1.4]} />
        <meshStandardMaterial color="#F7F4EF" roughness={0.6} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[-1.12 + i * 0.54, 1.62, -0.1]} rotation={[0, 0, 0.5]} castShadow>
          <boxGeometry args={[0.58, 0.04, 1.42]} />
          <meshStandardMaterial color="#1E3A5F" metalness={0.5} roughness={0.3} />
        </mesh>
      ))}
      {[-0.8, -0.3, 0.2].map((x) => (
        <mesh key={x} position={[x, 1.08, 0.61]}>
          <boxGeometry args={[0.32, 0.28, 0.02]} />
          <meshStandardMaterial color="#5C6670" />
        </mesh>
      ))}
      {[[-1.4, 0.7], [-0.9, 0.85], [0.9, -0.85]].map(([x, z], i) => (
        <mesh key={i} position={[x, 1.08, z]} castShadow>
          <coneGeometry args={[0.12, 0.3, 8]} />
          <meshStandardMaterial color="#3F7D3A" roughness={0.8} />
        </mesh>
      ))}
      <Sign text="JAIPUR FACTORY · 50,000 SQ. FT." position={[-0.3, 1.42, 0.62]} w={1.7} h={0.16} bg="#FF5C00" fg="#FFFFFF" round={false} />
      {/* capacity gauge */}
      <group position={[1.35, 0, 0.4]}>
        <mesh position={[0, 0.95 + 1.1, 0]} material={mat("#FFFFFF", 0.1, 0, { opacity: 0.25 })}>
          <cylinderGeometry args={[0.2, 0.2, 2.2, 20, 1, true]} />
        </mesh>
        <mesh ref={g} position={[0, 1, 0]}>
          <cylinderGeometry args={[0.17, 0.17, 1, 20]} />
          <meshStandardMaterial color={ok ? "#2E9E5B" : "#E53935"} emissive={ok ? "#2E9E5B" : "#E53935"} emissiveIntensity={0.35} />
        </mesh>
        {(
          [
            [ORDERS_NOW, "#7FA8FF", "today"],
            [Math.min(supported, 8), "#FED300", "budget"],
            [FACILITY_CAP, "#2F1C1A", "factory"],
          ] as const
        ).map(([v, c, l]) => (
          <group key={l} position={[0, 0.95 + scaleH(v), 0]}>
            <mesh>
              <boxGeometry args={[0.62, 0.03, 0.03]} />
              <meshBasicMaterial color={c} />
            </mesh>
            <Sign text={`${l} ${v}`} position={[0.62, 0, 0]} w={0.6} h={0.14} bg={c} fg={c === "#FED300" ? "#2F1C1A" : "#FFFFFF"} />
          </group>
        ))}
      </group>
      <Sign text={`GOAL: ${target} LAKH ORDERS A MONTH`} position={[0.2, 3.55, 0.4]} w={2.8} h={0.34} bg={ok ? "#2F1C1A" : "#C62828"} fg="#FFFFFF" />
    </group>
  );
}

const INVESTORS: HumanLook[] = [
  { skin: "#C68B59", hair: "#1E1410", hairStyle: "side", outfit: "shirt", top: "#1E3A5F", bottom: "#2B2B2B", accent: "#DCE6F0", facial: "beard", glasses: "#1A1A1A", shoe: "#1A1A1A" },
  { skin: "#9C6644", hair: "#140C08", hairStyle: "bun", outfit: "shirt", top: "#7B2D26", bottom: "#2B3A55", accent: "#F2D7D0", slim: true, height: 0.96, shoe: "#3A2418" },
  { skin: "#A86B45", hair: "#CFC8C0", hairStyle: "bald", outfit: "kurta", top: "#F4EFE6", bottom: "#E8DCC8", facial: "moustache", glasses: "#6B5B4A", shoe: "#5A3D2B" },
];

function Boardroom({ moods, slide }: { moods: ("nod" | "shake" | null)[]; slide: { lead: string; target: number; line: string } }) {
  return (
    <group position={ZR}>
      {/* table */}
      <RoundedBox args={[3.4, 0.07, 1.3]} radius={0.03} position={[0, 0.76, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#4A3122" roughness={0.3} />
      </RoundedBox>
      {[-1.2, 1.2].map((x) => (
        <mesh key={x} position={[x, 0.37, 0]} castShadow>
          <boxGeometry args={[0.08, 0.74, 0.9]} />
          <meshStandardMaterial color="#2B2E33" roughness={0.4} metalness={0.5} />
        </mesh>
      ))}
      {INVESTORS.map((l, i) => {
        const x = -1.1 + i * 1.1;
        return (
          <group key={i} position={[x, 0, -0.95]}>
            <OfficeChair position={[0, 0, 0]} exec color="#1F1F22" />
            <group position={[0, -0.42, -0.06]}>
              <Human look={l} mode="listen" phase={i * 1.7} mood={moods[i] ?? null} />
            </group>
            {/* notepad + water glass in front of each investor */}
            <mesh position={[0.08, 0.8, 0.42]} rotation={[0, 0.1, 0]}>
              <boxGeometry args={[0.22, 0.012, 0.3]} />
              <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
            </mesh>
            <mesh position={[-0.28, 0.85, 0.38]} material={mat("#DDEFF8", 0.05, 0, { opacity: 0.4 })}>
              <cylinderGeometry args={[0.035, 0.03, 0.12, 16]} />
            </mesh>
          </group>
        );
      })}
      {/* presentation screen on the side wall */}
      <group position={[2.55, 0, -0.6]} rotation={[0, -0.75, 0]}>
        <mesh position={[0, 1.8, 0]} castShadow>
          <boxGeometry args={[1.9, 1.15, 0.06]} />
          <meshStandardMaterial color="#15171B" roughness={0.3} />
        </mesh>
        <Board
          w={1.8}
          h={1.04}
          px={1024}
          position={[0, 1.8, 0.035]}
          deps={[slide.lead, slide.target, slide.line]}
          draw={(g, W, H) => {
            g.fillStyle = "#FFF5EE";
            g.fillRect(0, 0, W, H);
            g.fillStyle = "#FF5C00";
            g.fillRect(0, 0, W, 110);
            g.fillStyle = "#FFFFFF";
            g.font = F(800, 56);
            g.fillText("MY PLAN FOR EAT BETTER", 40, 76, W - 80);
            g.fillStyle = "#2F1C1A";
            g.font = F(800, 46);
            g.fillText(slide.lead ? `Grow by: ${slide.lead}` : "Grow by: …", 40, 200, W - 80);
            g.fillText(`Goal: ${slide.target} lakh orders a month`, 40, 280, W - 80);
            g.font = F(500, 36);
            const words = (slide.line || "Your pitch line appears here.").split(" ");
            let line = "";
            let y = 370;
            for (const w of words) {
              if (g.measureText(line + w).width > W - 80) {
                g.fillText(line, 40, y);
                line = "";
                y += 46;
                if (y > 520) break;
              }
              line += `${w} `;
            }
            if (y <= 520) g.fillText(line, 40, y);
          }}
        />
        <mesh position={[0, 0.62, 0]}>
          <boxGeometry args={[0.08, 1.24, 0.08]} />
          <meshStandardMaterial color="#2B2E33" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.02, 0]}>
          <boxGeometry args={[0.7, 0.04, 0.5]} />
          <meshStandardMaterial color="#2B2E33" metalness={0.5} roughness={0.4} />
        </mesh>
      </group>
      <PendantLamp position={[-0.8, 3.1, 0]} />
      <PendantLamp position={[0.8, 3.1, 0]} />
      <Sign text="BOARDROOM" position={[0, 3.3, -2.0]} w={1.9} h={0.38} />
      <Plant position={[2.4, 0, 2.2]} scale={1.15} />
    </group>
  );
}

function GlassPartition() {
  const glass = mat("#CFE6F5", 0.05, 0.1, { opacity: 0.16 });
  // a door gap on the aisle (z 0…1.6)
  const panes: [number, number][] = [
    [-1.6, 0],
    [1.6, 4.4],
  ];
  return (
    <group position={[12.2, 0, 0]}>
      {panes.map(([z0, z1]) => (
        <group key={z0}>
          <mesh position={[0, 1.6, (z0 + z1) / 2]} rotation={[0, Math.PI / 2, 0]} material={glass}>
            <planeGeometry args={[z1 - z0, 3.2]} />
          </mesh>
          {[z0, z1].map((z) => (
            <mesh key={z} position={[0, 1.6, z]}>
              <boxGeometry args={[0.07, 3.2, 0.07]} />
              <meshStandardMaterial color="#2B2E33" metalness={0.5} roughness={0.4} />
            </mesh>
          ))}
          <mesh position={[0, 3.2, (z0 + z1) / 2]}>
            <boxGeometry args={[0.07, 0.07, z1 - z0]} />
            <meshStandardMaterial color="#2B2E33" metalness={0.5} roughness={0.4} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ── people ────────────────────────────────────────────────────── */

const STAFF: { look: HumanLook; desk: V3; rot: number; screen: number; mug: string }[] = [
  { look: { skin: "#B98060", hair: "#1A120D", hairStyle: "long", outfit: "salwar", top: "#2F6FDE", bottom: "#F1E6D6", accent: "#FED300", bindi: true, slim: true, height: 0.95 }, desk: [-10.1, 0, 2.6], rot: 0, screen: 0, mug: "#FF5C00" },
  { look: { skin: "#8D5A3B", hair: "#0F0A07", hairStyle: "short", outfit: "tshirt", top: "#2E9E5B", bottom: "#3B4A63", shoe: "#F2F2F2" }, desk: [-8.3, 0, 2.6], rot: 0, screen: 2, mug: "#2F6FDE" },
  { look: { skin: "#C79270", hair: "#2A1A12", hairStyle: "curly", outfit: "hoodie", top: "#8A4FD6", bottom: "#2B2B2B", glasses: "#222222" }, desk: [4.4, 0, 3.6], rot: -Math.PI / 2, screen: 1, mug: "#FED300" },
  { look: { skin: "#A0694A", hair: "#120B08", hairStyle: "braid", outfit: "kurta", top: "#FF8A3D", bottom: "#F4EFE6", accent: "#FFFFFF", slim: true, height: 0.94 }, desk: [5.75, 0, 3.6], rot: Math.PI / 2, screen: 3, mug: "#2E9E5B" },
];

function Staff() {
  return (
    <>
      {STAFF.map((s, i) => (
        <group key={i} position={s.desk} rotation={[0, s.rot, 0]}>
          <Desk position={[0, 0, 0]} screen={s.screen} mug={s.mug} plant={i % 2 === 0} />
          {/* chair and person on the desk's +z side, facing the screen */}
          <OfficeChair position={[0, 0, 0.72]} rotation={Math.PI} color={["#FF5C00", "#2F3640", "#2F3640", "#FF5C00"][i]} />
          <group position={[0, -0.4, 0.64]} rotation={[0, Math.PI, 0]}>
            <Human look={s.look} mode="sit" phase={i * 1.3} />
          </group>
        </group>
      ))}
      <PendantLamp position={[-9.2, 3.2, 3.0]} />
      <PendantLamp position={[5.1, 3.2, 3.7]} />
    </>
  );
}

const MENTOR: HumanLook = { skin: "#B57A55", hair: "#1A120D", hairStyle: "side", outfit: "shirt", top: "#FFFFFF", bottom: "#2F3B52", accent: "#FF5C00", shoe: "#3A2418", glasses: "#2B2B2B" };
const SPOTS: Record<HQFocus, { p: V3; face: number; mode: HumanMode }> = {
  overview: { p: [0.6, 0, 5.4], face: 0, mode: "talk" },
  pricing: { p: [-11.9, 0, -1.4], face: 1.05, mode: "point" },
  finance: { p: [-4.9, 0, -1.7], face: 1.05, mode: "point" },
  compete: { p: [2.4, 0, -0.9], face: 1.2, mode: "point" },
  budget: { p: [0.9, 0, 7.6], face: -1.3, mode: "talk" },
  growth: { p: [6.9, 0, -0.1], face: 1.9, mode: "point" },
  pitch: { p: [12.9, 0, 2.5], face: 1.9, mode: "talk" },
};

function Mentor({ focus }: { focus: HQFocus }) {
  const g = useRef<THREE.Group>(null);
  const path = useRef<THREE.Vector3[]>([]);
  const [moving, setMoving] = useState(false);
  const [start] = useState<V3>(() => SPOTS[focus].p);
  const spot = SPOTS[focus];
  useEffect(() => {
    const G = g.current;
    if (!G) return;
    const tgt = new THREE.Vector3(...spot.p);
    if (G.position.distanceTo(tgt) < 0.05) return;
    // walk along the aisle so the mentor never cuts through furniture
    path.current = [new THREE.Vector3(G.position.x, 0, AISLE), new THREE.Vector3(tgt.x, 0, AISLE), tgt];
    setMoving(true);
  }, [spot]);
  useFrame((_, dt) => {
    const G = g.current;
    if (!G) return;
    if (path.current.length) {
      const next = path.current[0];
      const d = new THREE.Vector3(next.x - G.position.x, 0, next.z - G.position.z);
      const dist = d.length();
      if (dist < 0.03) {
        path.current.shift();
        if (!path.current.length) setMoving(false);
        return;
      }
      d.normalize();
      G.position.addScaledVector(d, Math.min(dist, 3.4 * dt));
      G.rotation.y = dampAngle(G.rotation.y, Math.atan2(d.x, d.z), 10, dt);
    } else {
      G.rotation.y = dampAngle(G.rotation.y, spot.face, 5, dt);
    }
  });
  return (
    <group ref={g} position={start} rotation={[0, spot.face, 0]}>
      <Human look={MENTOR} mode={moving ? "walk" : spot.mode} speed={1.6} />
    </group>
  );
}

/* ── shell ─────────────────────────────────────────────────────── */

function Fittings() {
  return (
    <>
      <Room carpet={{ x: ZR[0], z: ZR[2] + 0.4, w: 6.4, d: 6.6 }} />
      <Sign text="EAT BETTER CO · HEAD OFFICE" position={[1.5, 2.6, -5.17]} w={5.2} h={0.5} bg="#FF5C00" fg="#FFFFFF" />
      <GlassPartition />
      {[
        [-13.2, -4.4],
        [0.9, -4.6],
        [8.1, -4.6],
        [-13.2, 6.2],
        [18.4, -4.4],
      ].map(([x, z]) => (
        <Plant key={`${x}${z}`} position={[x, 0, z]} scale={1.25} />
      ))}
      {/* reception sofa by the window */}
      <group position={[-12.2, 0, 1.6]} rotation={[0, Math.PI / 2, 0]}>
        <RoundedBox args={[2.2, 0.42, 0.85]} radius={0.08} position={[0, 0.3, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#E07A3F" roughness={0.85} />
        </RoundedBox>
        <RoundedBox args={[2.2, 0.55, 0.22]} radius={0.08} position={[0, 0.7, -0.33]} castShadow>
          <meshStandardMaterial color="#E07A3F" roughness={0.85} />
        </RoundedBox>
        {[-1.05, 1.05].map((x) => (
          <RoundedBox key={x} args={[0.2, 0.62, 0.85]} radius={0.06} position={[x, 0.4, 0]} castShadow>
            <meshStandardMaterial color="#C9652E" roughness={0.85} />
          </RoundedBox>
        ))}
      </group>
    </>
  );
}

function Rig({ focus }: { focus: HQFocus }) {
  const ref = useRef<CameraControls>(null);
  const { size } = useThree();
  useEffect(() => {
    const v = VIEWS[focus];
    // narrow screens keep the desktop distance; <FitFov /> widens the lens so the full desktop width stays in view
    const aspect = size.width / Math.max(1, size.height);
    const portrait = aspect < 1;
    // only desktop lays the task panel over the scene's right side
    const covered = typeof window !== "undefined" && window.innerWidth >= 1024;
    const look = new THREE.Vector3(...v.look);
    const dir = new THREE.Vector3(...v.pos).sub(look).multiplyScalar(1.05);
    const right = new THREE.Vector3().crossVectors(dir.clone().negate(), new THREE.Vector3(0, 1, 0)).normalize();
    // on wide screens the task panel covers the right side, so the scene's subject sits left of centre
    const shift = !covered || portrait ? 0 : dir.length() * (focus === "overview" ? 0.18 : 0.27);
    const p = look.clone().add(dir).addScaledVector(right, shift);
    const l = look.clone().addScaledVector(right, shift);
    ref.current?.setLookAt(p.x, p.y, p.z, l.x, l.y, l.z, true);
  }, [focus, size.width, size.height]);
  return <CameraControls ref={ref} minDistance={2} maxDistance={30} maxPolarAngle={Math.PI / 2.05} smoothTime={0.8} />;
}

export type HQProps = {
  focus: HQFocus;
  rank: string[];
  rankDone: boolean;
  onSku?: (id: string) => void;
  bag: Record<string, number>;
  levers: Levers;
  moneyActive: boolean;
  grid: Record<string, { x: Level | null; y: Level | null }>;
  player: string;
  onCell?: (xi: number, zi: number) => void;
  coins: Record<DeptId, number>;
  onJar?: (id: DeptId) => void;
  target: number;
  supported: number;
  moods: ("nod" | "shake" | null)[];
  slide: { lead: string; target: number; line: string };
};

export default function HQ3D(p: HQProps) {
  return (
    <Canvas shadows dpr={[1, 1.6]} camera={{ position: VIEWS.overview.pos, fov: 45 }} gl={{ antialias: true }} onPointerMissed={() => (document.body.style.cursor = "")}>
      <AsyncCompile />
      <FitFov />
      <color attach="background" args={["#EFE6DA"]} />
      <fog attach="fog" args={["#EFE6DA", 30, 60]} />
      <hemisphereLight args={["#FFF6EA", "#B9A08A", 0.95]} />
      <ambientLight intensity={0.15} color="#FFE9D2" />
      <directionalLight position={[6, 13, 9]} intensity={1.45} castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-camera-left={-20} shadow-camera-right={20} shadow-camera-top={12} shadow-camera-bottom={-12} />
      <Rig focus={p.focus} />
      <Fittings />
      <Staff />
      <Mentor focus={p.focus} />
      <PriceZone rank={p.rank} rankDone={p.rankDone} onSku={p.onSku} bag={p.bag} />
      <MoneyMachine levers={p.levers} active={p.moneyActive} />
      <RivalZone grid={p.grid} player={p.player} onCell={p.onCell} />
      <BudgetTable coins={p.coins} onJar={p.onJar} />
      <FactoryModel target={p.target} supported={p.supported} />
      <Boardroom moods={p.moods} slide={p.slide} />
    </Canvas>
  );
}
