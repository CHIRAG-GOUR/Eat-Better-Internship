"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { CameraControls, RoundedBox } from "@react-three/drei";
import { Human, type HumanLook } from "@/components/world2/Human";
import { INGREDIENTS, ING } from "./data";

/**
 * The 3D Product Innovation Lab: an ingredient wall (13 jars), a formulation bench with a mixing bowl, and six
 * quality stations in an arc (sourcing crates, sorting tray, prep sink + worker, roaster, batch-testing bench,
 * packaging sealer with a live 3D pouch carrying the student's label). The camera glides to the active station;
 * objects are clickable and report back through callbacks so the panel can teach and score.
 */

export type Focus = "overview" | "shelf" | "bowl" | "sourcing" | "quality" | "prepping" | "cooking" | "batch" | "packaging" | "label";

const VIEWS: Record<Focus, { pos: [number, number, number]; look: [number, number, number] }> = {
  overview: { pos: [0, 6.8, 11.5], look: [0, 1, -1.5] },
  shelf: { pos: [-6.2, 2.3, 1.6], look: [-6.2, 1.6, -5.6] },
  bowl: { pos: [-1.6, 3.1, 2.6], look: [-1.6, 1.0, -1.8] },
  sourcing: { pos: [1.2, 2.6, 2.4], look: [2.4, 0.9, -3.4] },
  quality: { pos: [3.9, 2.9, 0.4], look: [4.6, 1.0, -3.6] },
  prepping: { pos: [6.4, 2.2, 0.8], look: [7.4, 1.4, -3.4] },
  cooking: { pos: [7.4, 2.5, 2.8], look: [9.6, 1.3, -1.2] },
  batch: { pos: [6.6, 2.5, 4.4], look: [9.6, 1.0, 2.6] },
  packaging: { pos: [3.4, 2.3, 6.4], look: [6.6, 1.1, 5.6] },
  label: { pos: [6.3, 1.75, 7.6], look: [7.4, 1.4, 5.6] },
};

/* ── tiny helpers ───────────────────────────────────────────── */

function textTex(lines: string[], { w = 512, h = 256, bg = "#FFF5EE", fg = "#2F1C1A", size = 64 } = {}) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const g = c.getContext("2d")!;
  g.fillStyle = bg;
  g.fillRect(0, 0, w, h);
  g.fillStyle = fg;
  g.textAlign = "center";
  g.textBaseline = "middle";
  lines.forEach((t, i) => {
    g.font = `${i === 0 ? 800 : 600} ${i === 0 ? size : size * 0.62}px Fredoka, Figtree, sans-serif`;
    g.fillText(t, w / 2, h / 2 + (i - (lines.length - 1) / 2) * size * 1.05, w - 24);
  });
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function Sign({ lines, position, rotation, w = 1.6, h = 0.5, bg = "#2F1C1A", fg = "#FED300" }: { lines: string[]; position: [number, number, number]; rotation?: [number, number, number]; w?: number; h?: number; bg?: string; fg?: string }) {
  const tex = useMemo(() => textTex(lines, { w: 768, h: Math.round((768 * h) / w), bg, fg, size: 80 }), [lines, w, h, bg, fg]);
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  );
}

const hover = (on: boolean) => (e: ThreeEvent<PointerEvent>) => {
  e.stopPropagation();
  document.body.style.cursor = on ? "pointer" : "";
};

function Bench({ position, w = 2.6, d = 1.1, color = "#E9EEF5" }: { position: [number, number, number]; w?: number; d?: number; color?: string }) {
  return (
    <group position={position}>
      <RoundedBox args={[w, 0.08, d]} radius={0.03} position={[0, 0.92, 0]} castShadow receiveShadow>
        <meshStandardMaterial color={color} roughness={0.25} metalness={0.4} />
      </RoundedBox>
      <mesh position={[0, 0.45, 0]} castShadow>
        <boxGeometry args={[w - 0.1, 0.86, d - 0.1]} />
        <meshStandardMaterial color="#C9D3DE" roughness={0.4} metalness={0.5} />
      </mesh>
    </group>
  );
}

/* ── room ───────────────────────────────────────────────────── */

function Room() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[30, 22]} />
        <meshStandardMaterial color="#EDE6DC" roughness={0.85} />
      </mesh>
      {/* anti-slip safety walkway */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[1.5, 0.005, 1.6]}>
        <planeGeometry args={[16, 1.4]} />
        <meshStandardMaterial color="#F6C21C" roughness={0.9} />
      </mesh>
      <mesh position={[0, 3.2, -7]} receiveShadow>
        <planeGeometry args={[30, 6.4]} />
        <meshStandardMaterial color="#FFF5EE" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.4, -6.98]}>
        <planeGeometry args={[30, 0.12]} />
        <meshStandardMaterial color="#FF5C00" />
      </mesh>
      <mesh position={[-11, 3.2, 0]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[22, 6.4]} />
        <meshStandardMaterial color="#F7EBDD" roughness={0.9} />
      </mesh>
      {/* windows */}
      {[-2, 3, 8].map((x) => (
        <mesh key={x} position={[x, 3.6, -6.95]}>
          <planeGeometry args={[3.2, 1.8]} />
          <meshStandardMaterial color="#CFE6F5" emissive="#BFE0F7" emissiveIntensity={0.6} />
        </mesh>
      ))}
      <Sign lines={["EAT BETTER CO", "Product Innovation Lab"]} position={[3, 5.4, -6.9]} w={4.2} h={1.1} bg="#FF5C00" fg="#FFFFFF" />
      {/* ceiling light panels */}
      {[-6, -1, 4, 9].map((x) => (
        <mesh key={x} position={[x, 6.3, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[2.4, 0.6]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
      ))}
    </group>
  );
}

/* ── ingredient wall ────────────────────────────────────────── */

function Jar({ id, position, picked, inspected, onPick }: { id: string; position: [number, number, number]; picked: boolean; inspected: boolean; onPick?: (id: string) => void }) {
  const ing = ING[id];
  const g = useRef<THREE.Group>(null);
  const tex = useMemo(() => textTex([ing.name.split(" (")[0].split(" & ")[0], ing.breaks ? "check promise" : ""], { w: 384, h: 192, bg: ing.breaks && inspected ? "#FDECEA" : "#FFFFFF", fg: "#2F1C1A", size: 52 }), [ing, inspected]);
  useEffect(() => () => tex.dispose(), [tex]);
  useFrame((_, dt) => {
    if (g.current) g.current.position.y = THREE.MathUtils.damp(g.current.position.y, position[1] + (picked ? 0.12 : 0), 8, dt);
  });
  return (
    <group ref={g} position={position} onClick={(e) => (e.stopPropagation(), onPick?.(id))} onPointerOver={hover(true)} onPointerOut={hover(false)}>
      <mesh castShadow position={[0, 0.26, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.5, 20]} />
        <meshPhysicalMaterial color="#FFFFFF" roughness={0.05} transmission={0.6} thickness={0.2} transparent opacity={0.55} />
      </mesh>
      <mesh position={[0, 0.2, 0]}>
        <cylinderGeometry args={[0.18, 0.18, 0.36, 16]} />
        <meshStandardMaterial color={ing.color} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.54, 0]}>
        <cylinderGeometry args={[0.21, 0.21, 0.07, 20]} />
        <meshStandardMaterial color={ing.breaks ? "#C62828" : "#FF5C00"} />
      </mesh>
      <mesh position={[0, 0.22, 0.205]}>
        <planeGeometry args={[0.36, 0.18]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      {inspected && (
        <mesh position={[0, 0.66, 0]}>
          <sphereGeometry args={[0.05, 12, 8]} />
          <meshBasicMaterial color={ing.breaks ? "#E53935" : "#2E9E5B"} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

function IngredientWall({ picked, inspected, onPick }: { picked: string[]; inspected: string[]; onPick?: (id: string) => void }) {
  return (
    <group position={[-6.2, 0, -6.2]}>
      {[0.55, 1.35, 2.15].map((y) => (
        <group key={y}>
          <mesh position={[0, y, 0]} castShadow receiveShadow>
            <boxGeometry args={[5.4, 0.06, 0.7]} />
            <meshStandardMaterial color="#B98157" roughness={0.6} />
          </mesh>
        </group>
      ))}
      {[-2.7, 2.7].map((x) => (
        <mesh key={x} position={[x, 1.3, 0]}>
          <boxGeometry args={[0.08, 2.6, 0.7]} />
          <meshStandardMaterial color="#8C5A3A" />
        </mesh>
      ))}
      {INGREDIENTS.map((ing, i) => {
        const row = Math.floor(i / 5);
        const col = i % 5;
        return <Jar key={ing.id} id={ing.id} position={[-2.1 + col * 1.05, 0.58 + row * 0.8, 0.05]} picked={picked.includes(ing.id)} inspected={inspected.includes(ing.id)} onPick={onPick} />;
      })}
      <Sign lines={["INGREDIENT WALL"]} position={[0, 3.0, 0.1]} w={2.6} h={0.4} />
    </group>
  );
}

/* ── formulation bench ──────────────────────────────────────── */

function MixingBowl({ parts }: { parts: { id: string; pct: number }[] }) {
  const spin = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (spin.current) spin.current.rotation.y += dt * 0.6;
  });
  const total = parts.reduce((a, p) => a + p.pct, 0) || 1;
  return (
    <group position={[-1.6, 0, -1.8]}>
      <Bench position={[0, 0, 0]} w={2.8} />
      <mesh position={[0, 1.18, 0]} castShadow>
        <sphereGeometry args={[0.55, 32, 16, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        <meshStandardMaterial color="#D9DEE5" metalness={0.9} roughness={0.15} side={THREE.DoubleSide} />
      </mesh>
      <group ref={spin} position={[0, 1.02, 0]}>
        {parts.flatMap((p, k) => {
          const n = Math.max(2, Math.round((p.pct / total) * 26));
          return Array.from({ length: n }, (_, j) => {
            const a = (j / n) * Math.PI * 2 + k * 1.3;
            const r = 0.12 + ((j * 7 + k * 3) % 5) * 0.06;
            return (
              <mesh key={`${p.id}-${j}`} position={[Math.cos(a) * r, 0.08 + (k % 3) * 0.04, Math.sin(a) * r]}>
                <sphereGeometry args={[0.055, 8, 6]} />
                <meshStandardMaterial color={ING[p.id]?.color ?? "#999"} roughness={0.7} />
              </mesh>
            );
          });
        })}
      </group>
      <Sign lines={["FORMULATION"]} position={[0, 2.2, -0.5]} w={1.8} h={0.36} />
    </group>
  );
}

/* ── quality stations ───────────────────────────────────────── */

export type Lot = { id: string; fault: string | null };

function Crates({ lots, decided, onPick }: { lots: Lot[]; decided: Record<string, "accept" | "reject">; onPick?: (id: string) => void }) {
  return (
    <group position={[2.4, 0, -3.4]}>
      {lots.map((l, i) => {
        const d = decided[l.id];
        return (
          <group key={l.id} position={[-1.1 + i * 1.1, 0, 0]} onClick={(e) => (e.stopPropagation(), onPick?.(l.id))} onPointerOver={hover(true)} onPointerOut={hover(false)}>
            <RoundedBox args={[0.9, 0.6, 0.7]} radius={0.04} position={[0, 0.3, 0]} castShadow>
              <meshStandardMaterial color={d === "reject" ? "#B71C1C" : d === "accept" ? "#2E7D32" : "#A1784F"} roughness={0.8} />
            </RoundedBox>
            {Array.from({ length: 9 }, (_, j) => (
              <mesh key={j} position={[-0.28 + (j % 3) * 0.28, 0.64, -0.2 + Math.floor(j / 3) * 0.2]}>
                <sphereGeometry args={[0.1, 8, 6]} />
                <meshStandardMaterial color={l.fault === "mould" && j % 3 === 1 ? "#7E8C5A" : "#6B3A1E"} roughness={0.7} />
              </mesh>
            ))}
            <Sign lines={[`LOT ${l.id}`]} position={[0, 0.3, 0.36]} w={0.6} h={0.22} bg="#FFF5EE" fg="#2F1C1A" />
          </group>
        );
      })}
      <Sign lines={["1 · SOURCING"]} position={[0, 1.7, -0.5]} w={1.8} h={0.36} />
    </group>
  );
}

export type TrayItem = { id: number; kind: "good" | "stone" | "shell" | "twig" | "plastic"; x: number; z: number };

function SortTray({ items, removed, onPick }: { items: TrayItem[]; removed: number[]; onPick?: (id: number) => void }) {
  return (
    <group position={[4.6, 0, -3.6]}>
      <Bench position={[0, 0, 0]} w={2.2} d={1.2} />
      <mesh position={[0, 0.98, 0]} receiveShadow>
        <boxGeometry args={[1.6, 0.04, 0.9]} />
        <meshStandardMaterial color="#C0C7CF" metalness={0.8} roughness={0.25} />
      </mesh>
      {items
        .filter((it) => !removed.includes(it.id))
        .map((it) => (
          <mesh
            key={it.id}
            position={[it.x, 1.03, it.z]}
            onClick={(e) => (e.stopPropagation(), onPick?.(it.id))}
            onPointerOver={hover(true)}
            onPointerOut={hover(false)}
            castShadow
            scale={it.kind === "twig" ? [0.22, 0.03, 0.04] : it.kind === "plastic" ? [0.1, 0.012, 0.08] : it.kind === "shell" ? [0.07, 0.03, 0.05] : it.kind === "stone" ? [0.06, 0.045, 0.055] : [0.075, 0.05, 0.045]}
          >
            {it.kind === "twig" || it.kind === "plastic" ? <boxGeometry args={[1, 1, 1]} /> : <sphereGeometry args={[1, 10, 8]} />}
            <meshStandardMaterial color={it.kind === "good" ? "#C68A4B" : it.kind === "stone" ? "#7D7A74" : it.kind === "shell" ? "#8A5A35" : it.kind === "twig" ? "#5B3A22" : "#4FC3F7"} roughness={it.kind === "plastic" ? 0.2 : 0.8} />
          </mesh>
        ))}
      <Sign lines={["2 · QUALITY CHECK"]} position={[0, 2.0, -0.6]} w={2} h={0.36} />
    </group>
  );
}

const WORKER: HumanLook = { skin: "#A86F45", hair: "#1A110C", hairStyle: "bun", outfit: "shirt", top: "#F4F1EC", bottom: "#3B4A5C", accent: "#FFFFFF", slim: true, height: 0.95 };

function PrepStation({ ppe, onPick }: { ppe: string[]; onPick?: (id: string) => void }) {
  const items: { id: string; color: string; p: [number, number, number]; s: [number, number, number] }[] = [
    { id: "hairnet", color: "#E3F2FD", p: [-0.6, 1.0, 0], s: [0.22, 0.08, 0.22] },
    { id: "mask", color: "#90CAF9", p: [-0.2, 0.98, 0], s: [0.2, 0.05, 0.12] },
    { id: "gloves", color: "#1E88E5", p: [0.2, 0.98, 0], s: [0.2, 0.05, 0.16] },
    { id: "apron", color: "#FF5C00", p: [0.62, 0.98, 0], s: [0.26, 0.04, 0.3] },
  ];
  return (
    <group position={[7.4, 0, -3.4]}>
      <Bench position={[-0.8, 0, 0]} w={2.2} d={0.9} />
      {items.map((it) =>
        ppe.includes(it.id) ? null : (
          <mesh key={it.id} position={[it.p[0] - 0.8, it.p[1], it.p[2]]} scale={it.s} onClick={(e) => (e.stopPropagation(), onPick?.(it.id))} onPointerOver={hover(true)} onPointerOut={hover(false)} castShadow>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={it.color} roughness={0.6} />
          </mesh>
        ),
      )}
      {/* sink */}
      <mesh position={[1.2, 0.85, 0]} castShadow onClick={(e) => (e.stopPropagation(), onPick?.("wash"))} onPointerOver={hover(true)} onPointerOut={hover(false)}>
        <boxGeometry args={[0.9, 0.2, 0.6]} />
        <meshStandardMaterial color="#B0BEC5" metalness={0.8} roughness={0.2} />
      </mesh>
      <mesh position={[1.2, 0.42, 0]}>
        <boxGeometry args={[0.8, 0.84, 0.5]} />
        <meshStandardMaterial color="#CFD8DC" />
      </mesh>
      {/* the worker who gets kitted out */}
      <group position={[0.1, 0, 1.0]} rotation={[0, Math.PI, 0]}>
        <Human look={{ ...WORKER, top: ppe.includes("apron") ? "#FF5C00" : WORKER.top }} mode="stand" />
        {ppe.includes("hairnet") && (
          <mesh position={[0, 1.66, 0]}>
            <sphereGeometry args={[0.125, 16, 10, 0, Math.PI * 2, 0, Math.PI / 1.9]} />
            <meshStandardMaterial color="#EEF6FB" transparent opacity={0.9} roughness={0.9} />
          </mesh>
        )}
        {ppe.includes("mask") && (
          <mesh position={[0, 1.555, 0.09]} scale={[1, 0.7, 0.5]}>
            <sphereGeometry args={[0.07, 12, 8]} />
            <meshStandardMaterial color="#90CAF9" />
          </mesh>
        )}
      </group>
      <Sign lines={["3 · PREPPING"]} position={[0, 2.4, -0.5]} w={1.8} h={0.36} />
    </group>
  );
}

function Roaster({ heat, doneness }: { heat: number; doneness: number }) {
  const drum = useRef<THREE.Mesh>(null);
  const glow = useRef<THREE.MeshStandardMaterial>(null);
  useFrame((_, dt) => {
    if (drum.current) drum.current.rotation.x += dt * (0.6 + heat * 1.5);
    if (glow.current) glow.current.emissiveIntensity = THREE.MathUtils.damp(glow.current.emissiveIntensity, 0.2 + heat * 2.2, 4, dt);
  });
  const col = new THREE.Color("#E8C99A").lerp(new THREE.Color(doneness > 1.15 ? "#2A1A10" : "#8A4F22"), Math.min(1, doneness));
  return (
    <group position={[9.6, 0, -1.2]}>
      <mesh position={[0, 0.5, 0]} castShadow>
        <boxGeometry args={[1.6, 1.0, 1.2]} />
        <meshStandardMaterial color="#455A64" metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh ref={drum} position={[0, 1.35, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[0.5, 0.5, 1.3, 24, 1, true]} />
        <meshStandardMaterial color="#B0BEC5" metalness={0.9} roughness={0.2} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 1.25, 0]}>
        <sphereGeometry args={[0.32, 16, 10]} />
        <meshStandardMaterial color={col} roughness={0.8} />
      </mesh>
      <mesh position={[0, 0.72, 0.61]}>
        <planeGeometry args={[1.0, 0.2]} />
        <meshStandardMaterial ref={glow} color="#FF7043" emissive="#FF5722" emissiveIntensity={0.3} toneMapped={false} />
      </mesh>
      <Sign lines={["4 · COOKING (ROASTER)"]} position={[0, 2.4, -0.4]} w={2.2} h={0.36} />
    </group>
  );
}

function BatchBench({ count, statuses, onPick }: { count: number; statuses: Record<number, "release" | "hold" | undefined>; onPick?: (i: number) => void }) {
  return (
    <group position={[9.6, 0, 2.6]} rotation={[0, -Math.PI / 2, 0]}>
      <Bench position={[0, 0, 0]} w={3} />
      {Array.from({ length: count }, (_, i) => {
        const st = statuses[i];
        return (
          <group key={i} position={[-1 + i, 0, 0]} onClick={(e) => (e.stopPropagation(), onPick?.(i))} onPointerOver={hover(true)} onPointerOut={hover(false)}>
            <mesh position={[0, 1.02, 0]} castShadow>
              <cylinderGeometry args={[0.26, 0.18, 0.14, 20]} />
              <meshStandardMaterial color={st === "release" ? "#A5D6A7" : st === "hold" ? "#EF9A9A" : "#FFFFFF"} roughness={0.3} />
            </mesh>
            <mesh position={[0, 1.08, 0]}>
              <sphereGeometry args={[0.16, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
              <meshStandardMaterial color="#B97A45" roughness={0.8} />
            </mesh>
            <Sign lines={[`BATCH ${i + 1}`]} position={[0, 0.7, 0.56]} w={0.6} h={0.2} bg="#FFF5EE" fg="#2F1C1A" />
          </group>
        );
      })}
      <Sign lines={["5 · BATCH TESTING"]} position={[0, 2.0, -0.5]} w={2} h={0.36} />
    </group>
  );
}

function Pouch({ labelUrl, position }: { labelUrl: string | null; position: [number, number, number] }) {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    if (!labelUrl) return;
    let alive = true;
    new THREE.TextureLoader().load(labelUrl, (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      if (alive) setTex(t);
    });
    return () => {
      alive = false;
    };
  }, [labelUrl]);
  useEffect(() => () => tex?.dispose(), [tex]);
  const g = useRef<THREE.Group>(null);
  useFrame((s) => {
    if (g.current) g.current.rotation.y = Math.sin(s.clock.elapsedTime * 0.5) * 0.35;
  });
  return (
    <group ref={g} position={position}>
      <RoundedBox args={[0.62, 0.86, 0.16]} radius={0.06} castShadow>
        <meshStandardMaterial color="#FF5C00" roughness={0.45} />
      </RoundedBox>
      <mesh position={[0, 0.0, 0.082]}>
        <planeGeometry args={[0.54, 0.72]} />
        {tex ? <meshBasicMaterial map={tex} toneMapped={false} /> : <meshStandardMaterial color="#FFF5EE" />}
      </mesh>
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[0.64, 0.04, 0.17]} />
        <meshStandardMaterial color="#E64A00" />
      </mesh>
    </group>
  );
}

export type PackOption = "paper" | "jar" | "pouch";

function PackStation({ chosen, onPick, labelUrl }: { chosen: PackOption | null; onPick?: (p: PackOption) => void; labelUrl: string | null }) {
  return (
    <group position={[6.6, 0, 5.6]}>
      <Bench position={[0, 0, 0]} w={3} />
      <group position={[-1, 0.96, 0]} onClick={(e) => (e.stopPropagation(), onPick?.("paper"))} onPointerOver={hover(true)} onPointerOut={hover(false)}>
        <mesh position={[0, 0.3, 0]} castShadow>
          <boxGeometry args={[0.4, 0.6, 0.25]} />
          <meshStandardMaterial color={chosen === "paper" ? "#E0C9A6" : "#D7B98A"} roughness={0.95} />
        </mesh>
      </group>
      <group position={[-0.3, 0.96, 0]} onClick={(e) => (e.stopPropagation(), onPick?.("jar"))} onPointerOver={hover(true)} onPointerOut={hover(false)}>
        <mesh position={[0, 0.28, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.56, 18]} />
          <meshPhysicalMaterial color="#FFFFFF" transmission={0.5} transparent opacity={0.5} roughness={0.1} />
        </mesh>
      </group>
      <group onClick={(e) => (e.stopPropagation(), onPick?.("pouch"))} onPointerOver={hover(true)} onPointerOut={hover(false)}>
        <Pouch labelUrl={labelUrl} position={[0.8, 1.42, 0]} />
      </group>
      {/* heat sealer */}
      <mesh position={[0.8, 0.98, -0.3]}>
        <boxGeometry args={[0.9, 0.08, 0.2]} />
        <meshStandardMaterial color="#37474F" metalness={0.6} />
      </mesh>
      <Sign lines={["6 · PACKAGING"]} position={[0, 2.3, -0.5]} w={1.8} h={0.36} />
    </group>
  );
}

/* ── camera ─────────────────────────────────────────────────── */

function Rig({ focus, interactive }: { focus: Focus; interactive: boolean }) {
  const ref = useRef<CameraControls>(null);
  const { size } = useThree();
  useEffect(() => {
    const v = VIEWS[focus];
    const portrait = size.width < size.height;
    const look = new THREE.Vector3(...v.look);
    const dir = new THREE.Vector3(...v.pos).sub(look).multiplyScalar(portrait ? 1.35 : 1.15); // step back a little
    // wide screens: the panel covers the right side, so slide the camera right and the station sits left of centre
    const right = new THREE.Vector3().crossVectors(dir.clone().negate(), new THREE.Vector3(0, 1, 0)).normalize();
    const shift = portrait || focus === "overview" ? 0 : dir.length() * 0.28;
    const p = look.clone().add(dir).addScaledVector(right, shift);
    const l = look.clone().addScaledVector(right, shift);
    ref.current?.setLookAt(p.x, p.y, p.z, l.x, l.y, l.z, true);
  }, [focus, size.width, size.height]);
  return <CameraControls ref={ref} enabled={interactive} minDistance={1.2} maxDistance={16} maxPolarAngle={Math.PI / 2.05} smoothTime={0.6} />;
}

export type LabProps = {
  focus: Focus;
  interactive: boolean;
  picked: string[];
  parts: { id: string; pct: number }[];
  inspected: string[];
  onJar?: (id: string) => void;
  lots: Lot[];
  lotDecisions: Record<string, "accept" | "reject">;
  onLot?: (id: string) => void;
  tray: TrayItem[];
  removed: number[];
  onTray?: (id: number) => void;
  ppe: string[];
  onPrep?: (id: string) => void;
  heat: number;
  doneness: number;
  batches: number;
  batchStatus: Record<number, "release" | "hold" | undefined>;
  onBatch?: (i: number) => void;
  pack: PackOption | null;
  onPack?: (p: PackOption) => void;
  labelUrl: string | null;
};

export default function Lab3D(p: LabProps) {
  return (
    <Canvas shadows dpr={[1, 1.6]} camera={{ position: VIEWS.overview.pos, fov: 45 }} gl={{ antialias: true, preserveDrawingBuffer: true }} onPointerMissed={() => (document.body.style.cursor = "")}>
      <color attach="background" args={["#F3ECE3"]} />
      <fog attach="fog" args={["#F3ECE3", 18, 34]} />
      <hemisphereLight args={["#FFF6EA", "#B9A08A", 0.9]} />
      <directionalLight position={[6, 9, 6]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={10} shadow-camera-bottom={-10} />
      <Rig focus={p.focus} interactive={p.interactive} />
      <Room />
      <IngredientWall picked={p.picked} inspected={p.inspected} onPick={p.onJar} />
      <MixingBowl parts={p.parts} />
      <Crates lots={p.lots} decided={p.lotDecisions} onPick={p.onLot} />
      <SortTray items={p.tray} removed={p.removed} onPick={p.onTray} />
      <PrepStation ppe={p.ppe} onPick={p.onPrep} />
      <Roaster heat={p.heat} doneness={p.doneness} />
      <BatchBench count={p.batches} statuses={p.batchStatus} onPick={p.onBatch} />
      <PackStation chosen={p.pack} onPick={p.onPack} labelUrl={p.labelUrl} />
    </Canvas>
  );
}
