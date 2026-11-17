"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { CameraControls } from "@react-three/drei";
import { RoundedBox } from "@/components/three/RoundedBox";
import { Human, type HumanLook } from "@/components/world2/Human";
import { DEPTS, FACILITY_CAP, KMATRIX, K_PLAYERS, LEVEL_IDX, ORDERS_NOW, SKUS, type DeptId, type Level } from "./data";
import { AsyncCompile } from "@/components/three/AsyncCompile";

/**
 * The 3D Eat Better business HQ: a pricing wall with the four real SKUs and their shelf tags, a finance screen wall,
 * a competitor wall with the K-Matrix and a floor positioning grid, a budget table whose stacks follow the student's
 * allocation, a model of the 50,000 sq. ft. Jaipur facility with a capacity gauge, and a boardroom where three
 * investors sit. The camera glides between departments as the stages change.
 */

export type HQFocus = "overview" | "pricing" | "finance" | "compete" | "budget" | "growth" | "pitch";
const VIEWS: Record<HQFocus, { pos: [number, number, number]; look: [number, number, number] }> = {
  overview: { pos: [0, 10, 17], look: [0, 1, -2.5] },
  pricing: { pos: [-8.6, 2.3, 2.6], look: [-8.6, 1.65, -4.4] },
  finance: { pos: [-1.5, 2.7, 3.6], look: [-1.5, 2.45, -4.6] },
  compete: { pos: [5.2, 4.2, 4.6], look: [5.2, 1.3, -2.6] },
  budget: { pos: [-1.5, 4.0, 7.2], look: [-1.5, 0.9, 2.2] },
  growth: { pos: [7.6, 3.2, 6.6], look: [8.8, 1.0, 2.2] },
  pitch: { pos: [13.2, 2.6, 6.2], look: [13.6, 1.2, 0.6] },
};

function tex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
const F = (w: number, s: number) => `${w} ${s}px Figtree, "Segoe UI", Arial, sans-serif`;

function Board({ w, h, px = 1024, position, rotation, draw, deps }: { w: number; h: number; px?: number; position: [number, number, number]; rotation?: [number, number, number]; draw: (g: CanvasRenderingContext2D, W: number, H: number) => void; deps: unknown[] }) {
  const H = Math.round((px * h) / w);
  const key = JSON.stringify(deps);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- redraw only when the listed values change
  const t = useMemo(() => tex(px, H, (g) => draw(g, px, H)), [key, px, H]);
  useEffect(() => () => t.dispose(), [t]);
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={t} toneMapped={false} />
    </mesh>
  );
}

function Sign({ text, position, rotation, w = 2.4, h = 0.42, bg = "#2F1C1A", fg = "#FED300" }: { text: string; position: [number, number, number]; rotation?: [number, number, number]; w?: number; h?: number; bg?: string; fg?: string }) {
  return (
    <Board
      w={w}
      h={h}
      px={768}
      position={position}
      rotation={rotation}
      deps={[text, bg, fg, w, h]}
      draw={(g, W, H) => {
        g.fillStyle = bg;
        g.fillRect(0, 0, W, H);
        g.fillStyle = fg;
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.font = F(800, H * 0.55);
        g.fillText(text, W / 2, H / 2, W - 24);
      }}
    />
  );
}

const hover = (on: boolean) => (e: ThreeEvent<PointerEvent>) => {
  e.stopPropagation();
  document.body.style.cursor = on ? "pointer" : "";
};

/* ── pricing wall: real packs ──────────────────────────────── */

function Pack({ src, size }: { src: string; size: [number, number, number] }) {
  const [t, setT] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    let alive = true;
    new THREE.TextureLoader().load(src, (x) => {
      x.colorSpace = THREE.SRGBColorSpace;
      if (alive) setT(x);
    });
    return () => {
      alive = false;
    };
  }, [src]);
  useEffect(() => () => t?.dispose(), [t]);
  const side = useMemo(() => new THREE.MeshStandardMaterial({ color: "#E9D3B5", roughness: 0.7 }), []);
  const front = useMemo(() => new THREE.MeshStandardMaterial({ map: t, color: t ? "#FFFFFF" : "#E9D3B5", roughness: 0.55 }), [t]);
  return (
    <mesh position={[0, size[1] / 2, 0]} castShadow material={[side, side, side, side, front, side]}>
      <boxGeometry args={size} />
    </mesh>
  );
}

function PricingWall({ solved, selected, onPick }: { solved: Record<string, boolean>; selected?: string | null; onPick?: (id: string) => void }) {
  return (
    <group position={[-8.6, 0, -4.6]}>
      <mesh position={[0, 1.9, -0.25]} receiveShadow>
        <boxGeometry args={[5.4, 3.8, 0.1]} />
        <meshStandardMaterial color="#FFF5EE" />
      </mesh>
      <mesh position={[0, 0.98, 0.1]} castShadow receiveShadow>
        <boxGeometry args={[5.2, 0.08, 0.7]} />
        <meshStandardMaterial color="#B98157" roughness={0.6} />
      </mesh>
      {SKUS.map((s, i) => {
        const x = -1.95 + i * 1.3;
        const size: [number, number, number] = s.id === "usb" ? [0.95, 0.62, 0.5] : s.id === "l42" ? [0.9, 0.36, 0.55] : s.id === "nam" ? [0.8, 0.85, 0.2] : [0.78, 0.3, 0.5];
        return (
          <group key={s.id} position={[x, 1.02, 0.1]} onClick={(e) => (e.stopPropagation(), onPick?.(s.id))} onPointerOver={hover(true)} onPointerOut={hover(false)}>
            <Pack src={s.tex} size={size} />
            <Board
              w={1.15}
              h={0.42}
              px={512}
              position={[0, -0.27, 0.37]}
              deps={[s.id, solved[s.id], selected === s.id]}
              draw={(g, W, H) => {
                g.fillStyle = selected === s.id ? "#FF5C00" : "#FFFFFF";
                g.fillRect(0, 0, W, H);
                g.strokeStyle = "#2F1C1A";
                g.lineWidth = 8;
                g.strokeRect(4, 4, W - 8, H - 8);
                g.fillStyle = selected === s.id ? "#FFFFFF" : "#2F1C1A";
                g.textAlign = "center";
                g.font = F(800, 64);
                g.fillText(`Rs ${s.price}`, W / 2, 78);
                g.font = F(600, 34);
                g.fillText(`${s.grams} g · ${solved[s.id] ? `Rs ${(s.price / s.grams).toFixed(2)}/g` : "Rs ?/g"}`, W / 2, 140, W - 30);
                g.font = F(600, 26);
                g.fillText(s.short, W / 2, 182, W - 30);
              }}
            />
          </group>
        );
      })}
      <Sign text="PRICING WALL · REAL PRICES" position={[0, 3.45, -0.18]} w={3.4} h={0.45} />
    </group>
  );
}

/* ── finance screens ───────────────────────────────────────── */

function FinanceWall({ next }: { next: { rev: number; net: number } | null }) {
  return (
    <group position={[-1.5, 0, -4.8]}>
      <mesh position={[0, 2.4, -0.06]}>
        <boxGeometry args={[5.6, 3.1, 0.08]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <Board
        w={5.4}
        h={2.9}
        position={[0, 2.4, 0]}
        deps={[next?.rev, next?.net]}
        draw={(g, W, H) => {
          g.fillStyle = "#0E1A3A";
          g.fillRect(0, 0, W, H);
          g.fillStyle = "#FFFFFF";
          g.font = F(800, 40);
          g.fillText("FINANCIAL PERFORMANCE", 40, 64);
          g.font = F(500, 22);
          g.fillStyle = "#AFC2E8";
          g.fillText("FY23 and FY24: reported (approx.). Next year: your hypothetical plan.", 40, 100);
          const bars: [string, number, string][] = [
            ["FY23", 5.5, "#7FA8FF"],
            ["FY24", 14.7, "#FF5C00"],
            ...(next ? ([["Plan", next.rev, "#FED300"]] as [string, number, string][]) : []),
          ];
          const max = Math.max(...bars.map((b) => b[1]), 15);
          bars.forEach(([l, v, c], i) => {
            const x = 80 + i * 180;
            const bh = (v / max) * 300;
            g.fillStyle = c;
            g.fillRect(x, 470 - bh, 110, bh);
            g.fillStyle = "#FFFFFF";
            g.font = F(700, 26);
            g.fillText(`~Rs ${v.toFixed(1)} cr`, x - 4, 455 - bh);
            g.fillText(l, x + 20, 505);
          });
          g.fillStyle = "#FFFFFF";
          g.font = F(800, 30);
          g.fillText("NET RESULT", 640, 170);
          const rows: [string, number][] = [["FY24 (reported)", -0.63], ...(next ? ([["Plan (hypothetical)", next.net]] as [string, number][]) : [])];
          rows.forEach(([l, v], i) => {
            g.font = F(600, 24);
            g.fillStyle = "#AFC2E8";
            g.fillText(l, 640, 220 + i * 90);
            g.font = F(800, 40);
            g.fillStyle = v >= 0 ? "#57D98A" : "#FF7A6B";
            g.fillText(`${v >= 0 ? "+" : "-"}Rs ${Math.abs(v).toFixed(2)} cr`, 640, 262 + i * 90);
          });
          g.font = F(600, 24);
          g.fillStyle = "#FED300";
          g.fillText("~2 lakh orders a month", 640, 470);
        }}
      />
      <Sign text="FINANCE" position={[0, 4.25, 0]} w={1.6} h={0.4} />
    </group>
  );
}

/* ── competitor wall + positioning floor grid ──────────────── */

const PLAYER_COLORS: Record<string, string> = { eb: "#FF5C00", trad: "#C62828", health: "#2E9E5B", local: "#8A4FD6" };

function CompeteZone({ grid }: { grid: Record<string, { x: Level | null; y: Level | null }> }) {
  return (
    <group position={[5.2, 0, -3.2]}>
      <mesh position={[0, 2.2, -0.75]}>
        <boxGeometry args={[5.4, 3.6, 0.08]} />
        <meshStandardMaterial color="#FFF5EE" />
      </mesh>
      <Board
        w={5.2}
        h={3.2}
        position={[0, 2.25, -0.7]}
        deps={[]}
        draw={(g, W, H) => {
          g.fillStyle = "#FFFFFF";
          g.fillRect(0, 0, W, H);
          g.fillStyle = "#2F1C1A";
          g.font = F(800, 36);
          g.fillText("K-MATRIX (from Chapter 4.2)", 30, 52);
          const cw = (W - 330) / 4;
          K_PLAYERS.forEach((p, j) => {
            g.fillStyle = PLAYER_COLORS[p.id];
            g.fillRect(300 + j * cw, 74, cw - 6, 48);
            g.fillStyle = "#FFFFFF";
            g.font = F(700, 20);
            g.textAlign = "center";
            g.fillText(p.short, 300 + j * cw + cw / 2 - 3, 105, cw - 14);
            g.textAlign = "left";
          });
          KMATRIX.forEach((r, i) => {
            const y = 132 + i * 72;
            g.fillStyle = "#2F1C1A";
            g.font = F(600, 22);
            g.fillText(r.short, 30, y + 42, 260);
            K_PLAYERS.forEach((p, j) => {
              const v = r.v[p.id];
              g.fillStyle = v === "High" ? "#2E9E5B" : v === "Medium" ? "#F2A900" : "#E57373";
              g.fillRect(300 + j * cw, y + 8, cw - 6, 60);
              g.fillStyle = "#FFFFFF";
              g.font = F(800, 22);
              g.textAlign = "center";
              g.fillText(v.toUpperCase(), 300 + j * cw + cw / 2 - 3, y + 46);
              g.textAlign = "left";
            });
          });
        }}
      />
      {/* floor grid: x = mass-market price accessibility, z = natural sweetening (both from the K-Matrix) */}
      {[0, 1, 2].flatMap((xi) =>
        [0, 1, 2].map((zi) => (
          <mesh key={`${xi}${zi}`} rotation={[-Math.PI / 2, 0, 0]} position={[-1.3 + xi * 1.3, 0.01, 2.9 - zi * 1.3]}>
            <planeGeometry args={[1.24, 1.24]} />
            <meshStandardMaterial color={(xi + zi) % 2 ? "#F3E6D6" : "#EAD8C2"} />
          </mesh>
        )),
      )}
      <Sign text="PRICE ACCESSIBILITY →" position={[0, 0.03, 4.0]} rotation={[-Math.PI / 2, 0, 0]} w={2.8} h={0.32} bg="#2F1C1A" fg="#FFFFFF" />
      <Sign text="NATURAL SWEETENING →" position={[-2.3, 0.03, 1.6]} rotation={[-Math.PI / 2, 0, Math.PI / 2]} w={2.8} h={0.32} bg="#2F1C1A" fg="#FFFFFF" />
      {K_PLAYERS.map((p, k) => {
        const c = grid[p.id];
        if (!c?.x || !c?.y) return null;
        const xi = LEVEL_IDX[c.x];
        const zi = LEVEL_IDX[c.y];
        return (
          <group key={p.id} position={[-1.3 + xi * 1.3 + (k % 2 ? 0.25 : -0.25), 0, 2.9 - zi * 1.3 + (k > 1 ? 0.25 : -0.25)]}>
            <mesh position={[0, 0.12, 0]} castShadow>
              <cylinderGeometry args={[0.2, 0.22, 0.24, 24]} />
              <meshStandardMaterial color={PLAYER_COLORS[p.id]} roughness={0.4} />
            </mesh>
            <Sign text={p.short} position={[0, 0.55, 0]} w={1.0} h={0.22} bg={PLAYER_COLORS[p.id]} fg="#FFFFFF" />
          </group>
        );
      })}
    </group>
  );
}

/* ── budget table ──────────────────────────────────────────── */

function BudgetTable({ budget }: { budget: Record<DeptId, number> }) {
  const refs = useRef<(THREE.Mesh | null)[]>([]);
  useFrame((_, dt) => {
    DEPTS.forEach((d, i) => {
      const m = refs.current[i];
      if (!m) return;
      const h = Math.max(0.02, (budget[d.id] / 100) * 2.2);
      m.scale.y = THREE.MathUtils.damp(m.scale.y, h, 6, dt);
      m.position.y = 0.82 + m.scale.y / 2;
    });
  });
  return (
    <group position={[-1.5, 0, 2.2]}>
      <mesh position={[0, 0.78, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[1.9, 1.9, 0.08, 48]} />
        <meshStandardMaterial color="#6B4A35" roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.39, 0]}>
        <cylinderGeometry args={[0.2, 0.35, 0.78, 16]} />
        <meshStandardMaterial color="#3B2A20" />
      </mesh>
      {DEPTS.map((d, i) => {
        const a = (i / DEPTS.length) * Math.PI * 2;
        return (
          <group key={d.id}>
            <mesh ref={(m) => void (refs.current[i] = m)} position={[Math.cos(a) * 1.25, 0.9, Math.sin(a) * 1.25]} castShadow>
              <cylinderGeometry args={[0.22, 0.22, 1, 24]} />
              <meshStandardMaterial color={d.color} roughness={0.35} metalness={0.3} />
            </mesh>
            <Sign text={`${d.name.split(" ")[0]} ${budget[d.id]}%`} position={[Math.cos(a) * 1.25, 0.86, Math.sin(a) * 1.25 + 0.3]} rotation={[-0.5, 0, 0]} w={0.9} h={0.18} bg="#FFFFFF" fg="#2F1C1A" />
          </group>
        );
      })}
      <Sign text="BUDGET TABLE · HYPOTHETICAL RS 10 CR" position={[0, 3.3, -1.6]} w={3.4} h={0.42} />
    </group>
  );
}

/* ── Jaipur facility model + capacity gauge ────────────────── */

function FacilityModel({ target }: { target: number }) {
  const g = useRef<THREE.Mesh>(null);
  useFrame((_, dt) => {
    if (!g.current) return;
    const h = (Math.min(target, 8) / 8) * 2.4;
    g.current.scale.y = THREE.MathUtils.damp(g.current.scale.y, Math.max(0.02, h), 5, dt);
    g.current.position.y = 0.95 + g.current.scale.y / 2;
  });
  const over = target > FACILITY_CAP;
  return (
    <group position={[8.8, 0, 2.2]}>
      <mesh position={[0, 0.45, 0]} receiveShadow>
        <boxGeometry args={[3.4, 0.9, 2.4]} />
        <meshStandardMaterial color="#E9E2D8" />
      </mesh>
      <mesh position={[0, 0.92, 0]}>
        <boxGeometry args={[3.3, 0.04, 2.3]} />
        <meshStandardMaterial color="#7FA36A" />
      </mesh>
      {/* the factory: main hall with a sawtooth roof, solar panels, loading bays, sign */}
      <mesh position={[-0.2, 1.22, -0.1]} castShadow>
        <boxGeometry args={[2.2, 0.56, 1.4]} />
        <meshStandardMaterial color="#F4F1EC" roughness={0.6} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} position={[-1.05 + i * 0.55, 1.62, -0.1]} rotation={[0, 0, 0.5]} castShadow>
          <boxGeometry args={[0.6, 0.04, 1.42]} />
          <meshStandardMaterial color="#1E3A5F" metalness={0.5} roughness={0.3} />
        </mesh>
      ))}
      {[-0.7, -0.2, 0.3].map((x) => (
        <mesh key={x} position={[x, 1.08, 0.61]}>
          <boxGeometry args={[0.32, 0.28, 0.02]} />
          <meshStandardMaterial color="#5C6670" />
        </mesh>
      ))}
      <Sign text="JAIPUR · 50,000 SQ. FT." position={[-0.2, 1.42, 0.61]} w={1.6} h={0.16} bg="#FF5C00" fg="#FFFFFF" />
      {/* capacity gauge */}
      <mesh position={[1.35, 0.95 + 1.2, 0.4]}>
        <cylinderGeometry args={[0.2, 0.2, 2.4, 20, 1, true]} />
        <meshStandardMaterial color="#FFFFFF" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
      <mesh ref={g} position={[1.35, 1, 0.4]}>
        <cylinderGeometry args={[0.17, 0.17, 1, 20]} />
        <meshStandardMaterial color={over ? "#E53935" : "#2E9E5B"} emissive={over ? "#E53935" : "#2E9E5B"} emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[1.35, 0.95 + (FACILITY_CAP / 8) * 2.4, 0.4]}>
        <boxGeometry args={[0.6, 0.03, 0.03]} />
        <meshBasicMaterial color="#2F1C1A" />
      </mesh>
      <mesh position={[1.35, 0.95 + (ORDERS_NOW / 8) * 2.4, 0.4]}>
        <boxGeometry args={[0.5, 0.025, 0.025]} />
        <meshBasicMaterial color="#7FA8FF" />
      </mesh>
      <Sign text={`Target ${target} lakh/mo · capacity ${FACILITY_CAP} (hypothetical)`} position={[0.3, 3.7, 0.4]} w={3.2} h={0.36} bg={over ? "#C62828" : "#2F1C1A"} fg="#FFFFFF" />
    </group>
  );
}

/* ── boardroom ─────────────────────────────────────────────── */

const INVESTORS: HumanLook[] = [
  { skin: "#C68B59", hair: "#1E1410", hairStyle: "side", outfit: "shirt", top: "#1E3A5F", bottom: "#2B2B2B", accent: "#DCE6F0", facial: "beard", glasses: "#1A1A1A" },
  { skin: "#9C6644", hair: "#140C08", hairStyle: "bun", outfit: "shirt", top: "#7B2D26", bottom: "#2B3A55", accent: "#F2D7D0", slim: true, height: 0.95 },
  { skin: "#A86B45", hair: "#CFC8C0", hairStyle: "bald", outfit: "kurta", top: "#F4EFE6", bottom: "#E8DCC8", facial: "moustache" },
];

function Boardroom({ asking, pitchTitle }: { asking: number; pitchTitle: string }) {
  return (
    <group position={[13.6, 0, 0.4]}>
      <RoundedBox args={[4.2, 0.1, 1.6]} radius={0.04} position={[0, 0.78, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#5A3D2B" roughness={0.35} />
      </RoundedBox>
      {[-1.7, 1.7].map((x) => (
        <mesh key={x} position={[x, 0.39, 0]}>
          <boxGeometry args={[0.12, 0.78, 1.2]} />
          <meshStandardMaterial color="#2B2B2B" />
        </mesh>
      ))}
      {INVESTORS.map((l, i) => (
        <group key={i} position={[-1.3 + i * 1.3, 0, -1.25]}>
          <mesh position={[0, 0.48, -0.05]}>
            <boxGeometry args={[0.55, 0.08, 0.55]} />
            <meshStandardMaterial color="#1E1E20" />
          </mesh>
          <mesh position={[0, 0.85, -0.3]}>
            <boxGeometry args={[0.55, 0.7, 0.08]} />
            <meshStandardMaterial color="#1E1E20" />
          </mesh>
          <group position={[0, -0.32, 0]}>
            <Human look={l} mode="drive" phase={i * 2} />
          </group>
        </group>
      ))}
      <mesh position={[0, 2.2, -2.3]}>
        <boxGeometry args={[3.6, 2.0, 0.08]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <Board
        w={3.4}
        h={1.8}
        px={1024}
        position={[0, 2.2, -2.25]}
        deps={[asking, pitchTitle]}
        draw={(g, W, H) => {
          g.fillStyle = "#FFF5EE";
          g.fillRect(0, 0, W, H);
          g.fillStyle = "#FF5C00";
          g.fillRect(0, 0, W, 90);
          g.fillStyle = "#FFFFFF";
          g.font = F(800, 50);
          g.fillText("EAT BETTER CO · INVESTOR PITCH", 40, 62, W - 80);
          g.fillStyle = "#2F1C1A";
          g.font = F(700, 44);
          g.fillText(pitchTitle || "The joy of snacking, made better.", 40, 200, W - 80);
          g.font = F(800, 72);
          g.fillText(`Ask: Rs ${asking} crore`, 40, 340);
          g.font = F(500, 28);
          g.fillStyle = "#6B5650";
          g.fillText("Learning simulation · not Eat Better's real terms", 40, 460);
        }}
      />
      <Sign text="BOARDROOM" position={[0, 3.5, -2.3]} w={1.8} h={0.38} />
    </group>
  );
}

/* ── shell ─────────────────────────────────────────────────── */

function Building() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 26]} />
        <meshStandardMaterial color="#D9CFC2" roughness={0.75} />
      </mesh>
      <mesh position={[2.5, 3, -5.2]} receiveShadow>
        <planeGeometry args={[40, 6]} />
        <meshStandardMaterial color="#F7EBDD" roughness={0.9} />
      </mesh>
      <mesh position={[2.5, 0.25, -5.18]}>
        <planeGeometry args={[40, 0.1]} />
        <meshStandardMaterial color="#FF5C00" />
      </mesh>
      {/* glass partition for the boardroom */}
      <mesh position={[11, 1.6, 1.5]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[6, 3.2]} />
        <meshPhysicalMaterial color="#CFE6F5" transparent opacity={0.15} roughness={0.05} />
      </mesh>
      <Sign text="EAT BETTER CO · HEAD OFFICE" position={[2.5, 5.3, -5.15]} w={6} h={0.6} bg="#FF5C00" fg="#FFFFFF" />
      {/* plants */}
      {[-12.4, 0.8, 11.5].map((x) => (
        <group key={x} position={[x, 0, -4.4]}>
          <mesh position={[0, 0.3, 0]}>
            <cylinderGeometry args={[0.28, 0.22, 0.6, 16]} />
            <meshStandardMaterial color="#B5541E" />
          </mesh>
          <mesh position={[0, 1.0, 0]}>
            <sphereGeometry args={[0.5, 12, 10]} />
            <meshStandardMaterial color="#3E8E41" roughness={0.8} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Rig({ focus }: { focus: HQFocus }) {
  const ref = useRef<CameraControls>(null);
  const { size } = useThree();
  useEffect(() => {
    const v = VIEWS[focus];
    const portrait = size.width < size.height;
    const look = new THREE.Vector3(...v.look);
    const dir = new THREE.Vector3(...v.pos).sub(look).multiplyScalar(portrait ? 1.5 : 1.08);
    const right = new THREE.Vector3().crossVectors(dir.clone().negate(), new THREE.Vector3(0, 1, 0)).normalize();
    const shift = portrait || focus === "overview" ? 0 : dir.length() * 0.27;
    const p = look.clone().add(dir).addScaledVector(right, shift);
    const l = look.clone().addScaledVector(right, shift);
    ref.current?.setLookAt(p.x, p.y, p.z, l.x, l.y, l.z, true);
  }, [focus, size.width, size.height]);
  return <CameraControls ref={ref} minDistance={2} maxDistance={28} maxPolarAngle={Math.PI / 2.05} smoothTime={0.7} />;
}

export type HQProps = {
  focus: HQFocus;
  solved: Record<string, boolean>;
  selectedSku?: string | null;
  onSku?: (id: string) => void;
  next: { rev: number; net: number } | null;
  grid: Record<string, { x: Level | null; y: Level | null }>;
  budget: Record<DeptId, number>;
  target: number;
  ask: number;
  pitchTitle: string;
};

export default function HQ3D(p: HQProps) {
  return (
    <Canvas shadows dpr={[1, 1.6]} camera={{ position: VIEWS.overview.pos, fov: 45 }} gl={{ antialias: true }} onPointerMissed={() => (document.body.style.cursor = "")}>
      <AsyncCompile />
      <color attach="background" args={["#EFE6DA"]} />
      <fog attach="fog" args={["#EFE6DA", 26, 52]} />
      <hemisphereLight args={["#FFF6EA", "#B9A08A", 1.0]} />
      <directionalLight position={[6, 12, 8]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-20} shadow-camera-right={20} shadow-camera-top={14} shadow-camera-bottom={-14} />
      <Rig focus={p.focus} />
      <Building />
      <PricingWall solved={p.solved} selected={p.selectedSku} onPick={p.onSku} />
      <FinanceWall next={p.next} />
      <CompeteZone grid={p.grid} />
      <BudgetTable budget={p.budget} />
      <FacilityModel target={p.target} />
      <Boardroom asking={p.ask} pitchTitle={p.pitchTitle} />
    </Canvas>
  );
}
