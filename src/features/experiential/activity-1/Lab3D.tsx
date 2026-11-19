"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { CameraControls } from "@react-three/drei";
import { RoundedBox } from "@/components/three/RoundedBox";
import { Human, type HumanLook } from "@/components/world2/Human";
import { renderToStaticMarkup } from "react-dom/server";
import { INGREDIENTS, ING } from "./data";
import { IngredientIcon } from "./IngredientIcon";
import { ForeignItem, IngredientPieces, OnePiece } from "./Pieces3D";
import { AsyncCompile } from "@/components/three/AsyncCompile";
import { FitFov } from "@/components/three/FitFov";

/**
 * The 3D Product Innovation Lab: an ingredient wall (13 jars), a formulation bench with a mixing bowl, and six
 * quality stations in an arc (sourcing crates, sorting tray, prep sink + worker, roaster, batch-testing bench,
 * packaging sealer with a live 3D pouch carrying the student's label). The camera glides to the active station;
 * objects are clickable and report back through callbacks so the panel can teach and score.
 */

export type Focus = "overview" | "shelf" | "bowl" | "sourcing" | "quality" | "prepping" | "cooking" | "batch" | "packaging" | "label";

const VIEWS: Record<Focus, { pos: [number, number, number]; look: [number, number, number] }> = {
  overview: { pos: [0, 6.8, 11.5], look: [0, 1, -1.5] },
  shelf: { pos: [-6.2, 2.45, 0.9], look: [-6.2, 2.3, -6.2] },
  bowl: { pos: [-1.6, 3.1, 2.6], look: [-1.6, 1.0, -1.8] },
  sourcing: { pos: [0.6, 2.6, 2.2], look: [1.3, 0.7, -3.4] },
  quality: { pos: [3.9, 2.9, 0.4], look: [4.6, 1.0, -3.6] },
  prepping: { pos: [6.9, 1.75, 0.2], look: [7.4, 1.35, -2.6] },
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

/** Jar label: the ingredient's SVG icon + name drawn on a canvas (icon loaded from inline SVG markup). */
const svgUrl = (id: string, size: number) => `data:image/svg+xml;charset=utf-8,${encodeURIComponent(renderToStaticMarkup(<IngredientIcon id={id} size={size} />).replace("<svg", '<svg xmlns="http://www.w3.org/2000/svg"'))}`;

/** Canvas texture redrawn once the ingredient's SVG icon has loaded. */
function useIconCanvas(key: string, w: number, h: number, id: string, draw: (g: CanvasRenderingContext2D, img?: HTMLImageElement) => void) {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d")!;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    const paint = (img?: HTMLImageElement) => {
      g.clearRect(0, 0, w, h);
      draw(g, img);
      t.needsUpdate = true;
    };
    paint();
    const img = new Image();
    img.onload = () => paint(img);
    img.src = svgUrl(id, 128);
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}

/** Round sticker on the jar: the ingredient's icon, big. */
function useJarSticker(id: string, flagged: boolean) {
  return useIconCanvas(`s-${id}-${flagged}`, 160, 160, id, (g, img) => {
    g.fillStyle = flagged ? "#FDECEA" : "#FFFFFF";
    g.beginPath();
    g.arc(80, 80, 76, 0, Math.PI * 2);
    g.fill();
    g.lineWidth = 8;
    g.strokeStyle = flagged ? "#C62828" : "#FF5C00";
    g.stroke();
    if (img) g.drawImage(img, 24, 24, 112, 112);
  });
}

/** Shelf-edge name tag under each jar: big, high-contrast name so it reads from the camera. */
function useShelfTag(id: string, state: "idle" | "seen" | "flag" | "selected") {
  return useIconCanvas(`t-${id}-${state}`, 512, 160, id, (g, img) => {
    const bg = state === "selected" ? "#FF5C00" : state === "flag" ? "#C62828" : "#FFFFFF";
    const fg = state === "selected" || state === "flag" ? "#FFFFFF" : "#2F1C1A";
    g.fillStyle = bg;
    g.fillRect(0, 0, 512, 160);
    g.lineWidth = 10;
    g.strokeStyle = state === "seen" ? "#2E9E5B" : state === "idle" ? "#2F1C1A" : bg;
    g.strokeRect(5, 5, 502, 150);
    if (img) {
      g.fillStyle = "#FFFFFF";
      g.beginPath();
      g.arc(82, 80, 58, 0, Math.PI * 2);
      g.fill();
      g.drawImage(img, 34, 32, 96, 96);
    }
    const name = ING[id].name.split(" (")[0];
    g.fillStyle = fg;
    g.textBaseline = "middle";
    const fit = (txt: string) => {
      let size = 58;
      g.font = `800 ${size}px Figtree, "Segoe UI", Arial, sans-serif`;
      while (g.measureText(txt).width > 336 && size > 34) {
        size -= 2;
        g.font = `800 ${size}px Figtree, "Segoe UI", Arial, sans-serif`;
      }
      return size;
    };
    const one = fit(name);
    const words = name.split(" ");
    // two big lines read better than one tiny line
    if (one < 50 && words.length > 1) {
      const half = Math.ceil(words.length / 2);
      const l1 = words.slice(0, half).join(" ");
      const l2 = words.slice(half).join(" ");
      fit(l1.length > l2.length ? l1 : l2);
      g.fillText(l1, 156, 54, 340);
      g.fillText(l2, 156, 108, 340);
    } else g.fillText(name, 156, 82, 340);
  });
}

function Jar({ id, position, picked, inspected, selected, onPick }: { id: string; position: [number, number, number]; picked: boolean; inspected: boolean; selected: boolean; onPick?: (id: string) => void }) {
  const ing = ING[id];
  const g = useRef<THREE.Group>(null);
  const flagged = !!ing.breaks && inspected;
  const sticker = useJarSticker(id, flagged);
  const tag = useShelfTag(id, selected ? "selected" : flagged ? "flag" : inspected ? "seen" : "idle");
  useFrame((_, dt) => {
    if (g.current) g.current.position.y = THREE.MathUtils.damp(g.current.position.y, picked || selected ? 0.08 : 0, 8, dt);
  });
  const pick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation();
    onPick?.(id);
  };
  return (
    <group position={position}>
      <group ref={g} onClick={pick} onPointerOver={hover(true)} onPointerOut={hover(false)}>
        <group position={[0, 0.02, 0]}>
          <IngredientPieces id={id} radius={0.13} height={0.26} seed={id.length * 13} />
        </group>
        <mesh position={[0, 0.24, 0]}>
          <cylinderGeometry args={[0.19, 0.19, 0.48, 24, 1, true]} />
          <meshPhysicalMaterial color="#FFFFFF" roughness={0.04} transmission={0.85} thickness={0.05} transparent opacity={0.3} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.005, 0]}>
          <cylinderGeometry args={[0.19, 0.19, 0.01, 24]} />
          <meshStandardMaterial color="#DDE3E8" roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.5, 0]} castShadow>
          <cylinderGeometry args={[0.2, 0.2, 0.06, 24]} />
          <meshStandardMaterial color={ing.breaks ? "#B71C1C" : selected ? "#2F1C1A" : "#FF5C00"} roughness={0.4} />
        </mesh>
        <mesh position={[0, 0.3, 0.193]}>
          <circleGeometry args={[0.1, 32]} />
          <meshBasicMaterial map={sticker} toneMapped={false} />
        </mesh>
      </group>
      {/* shelf-edge name tag (clickable too) */}
      <mesh position={[0, -0.13, 0.28]} onClick={pick} onPointerOver={hover(true)} onPointerOut={hover(false)}>
        <planeGeometry args={[0.6, 0.1875]} />
        <meshBasicMaterial map={tag} toneMapped={false} />
      </mesh>
    </group>
  );
}

const PER_ROW = 7;
const COL_W = 0.66;
const ROW_H = 0.78;
const ROWS = Math.ceil(INGREDIENTS.length / PER_ROW);
const WALL_TOP = 0.5 + (ROWS - 1) * ROW_H + 0.75;

function IngredientWall({ picked, inspected, selected, onPick }: { picked: string[]; inspected: string[]; selected?: string | null; onPick?: (id: string) => void }) {
  const width = PER_ROW * COL_W + 0.3;
  return (
    <group position={[-6.2, 0, -6.2]}>
      {/* back panel */}
      <mesh position={[0, WALL_TOP / 2, -0.32]} receiveShadow>
        <boxGeometry args={[width + 0.1, WALL_TOP, 0.04]} />
        <meshStandardMaterial color="#F6E9DA" roughness={0.9} />
      </mesh>
      {Array.from({ length: ROWS }, (_, r) => 0.5 + r * ROW_H).map((y) => (
        <group key={y}>
          <mesh position={[0, y - 0.03, -0.02]} castShadow receiveShadow>
            <boxGeometry args={[width, 0.06, 0.62]} />
            <meshStandardMaterial color="#B98157" roughness={0.6} />
          </mesh>
          {/* tag rail */}
          <mesh position={[0, y - 0.13, 0.265]}>
            <boxGeometry args={[width, 0.2, 0.02]} />
            <meshStandardMaterial color="#2F1C1A" roughness={0.6} />
          </mesh>
        </group>
      ))}
      {[-width / 2, width / 2].map((x) => (
        <mesh key={x} position={[x, WALL_TOP / 2, -0.02]}>
          <boxGeometry args={[0.08, WALL_TOP, 0.64]} />
          <meshStandardMaterial color="#8C5A3A" />
        </mesh>
      ))}
      {INGREDIENTS.map((ing, i) => {
        const row = ROWS - 1 - Math.floor(i / PER_ROW); // first ingredients on the top row, read left to right
        const col = i % PER_ROW;
        return <Jar key={ing.id} id={ing.id} position={[-((PER_ROW - 1) * COL_W) / 2 + col * COL_W, 0.5 + row * ROW_H, 0]} picked={picked.includes(ing.id)} inspected={inspected.includes(ing.id)} selected={selected === ing.id} onPick={onPick} />;
      })}
      <Sign lines={["INGREDIENT WALL"]} position={[0, WALL_TOP + 0.3, 0]} w={2.6} h={0.4} />
    </group>
  );
}

/* ── formulation bench ──────────────────────────────────────── */

function MixingBowl({ parts }: { parts: { id: string; pct: number }[] }) {
  const spin = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (spin.current) spin.current.rotation.y += dt * 0.4;
  });
  return (
    <group position={[-1.6, 0, -1.8]}>
      <Bench position={[0, 0, 0]} w={2.8} />
      <mesh position={[0, 1.2, 0]} castShadow>
        <sphereGeometry args={[0.55, 40, 20, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2]} />
        <meshStandardMaterial color="#D9DEE5" metalness={0.9} roughness={0.15} side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 1.2, 0]} rotation={[Math.PI / 2, 0, 0]}>
        <torusGeometry args={[0.55, 0.02, 8, 48]} />
        <meshStandardMaterial color="#C9D0D8" metalness={0.9} roughness={0.2} />
      </mesh>
      <group ref={spin} position={[0, 0.82, 0]}>
        {parts.map((p, k) => (
          <group key={p.id} rotation={[0, k * 1.3, 0]}>
            <IngredientPieces id={p.id} radius={0.32} height={0.04 + (p.pct / 100) * 0.22} seed={k * 17 + 3} />
          </group>
        ))}
      </group>
      <Sign lines={["FORMULATION"]} position={[0, 2.2, -0.5]} w={1.8} h={0.36} />
    </group>
  );
}

/* ── quality stations ───────────────────────────────────────── */

export type Lot = { id: string; fault: string | null };

/** A slatted wooden produce crate (front = +z) holding the lot, with a stencilled lot board. */
function Crate({ lot, decided, mainId, onPick, x }: { lot: Lot; decided?: "accept" | "reject"; mainId: string; onPick?: (id: string) => void; x: number }) {
  const wood = decided === "reject" ? "#8E3B32" : decided === "accept" ? "#6E8B4E" : "#B98A57";
  const W = 0.9;
  const D = 0.62;
  const H = 0.42;
  return (
    <group position={[x, 0.08, 0]} onClick={(e) => (e.stopPropagation(), onPick?.(lot.id))} onPointerOver={hover(true)} onPointerOut={hover(false)}>
      {/* pallet base */}
      {[-0.3, 0, 0.3].map((z) => (
        <mesh key={z} position={[0, -0.04, z]} receiveShadow>
          <boxGeometry args={[W + 0.1, 0.08, 0.12]} />
          <meshStandardMaterial color="#8C6A43" roughness={0.9} />
        </mesh>
      ))}
      {/* corner posts */}
      {[
        [-1, -1],
        [1, -1],
        [-1, 1],
        [1, 1],
      ].map(([sx, sz], i) => (
        <mesh key={i} position={[(sx * (W - 0.05)) / 2, H / 2, (sz * (D - 0.05)) / 2]} castShadow>
          <boxGeometry args={[0.05, H, 0.05]} />
          <meshStandardMaterial color={wood} roughness={0.85} />
        </mesh>
      ))}
      {/* slats with gaps on all four sides + base */}
      {[0.06, 0.2, 0.34].map((y) => (
        <group key={y}>
          {[-1, 1].map((s) => (
            <mesh key={`x${s}`} position={[0, y, (s * (D - 0.02)) / 2]} castShadow>
              <boxGeometry args={[W, 0.08, 0.02]} />
              <meshStandardMaterial color={wood} roughness={0.85} />
            </mesh>
          ))}
          {[-1, 1].map((s) => (
            <mesh key={`z${s}`} position={[(s * (W - 0.02)) / 2, y, 0]} castShadow>
              <boxGeometry args={[0.02, 0.08, D]} />
              <meshStandardMaterial color={wood} roughness={0.85} />
            </mesh>
          ))}
        </group>
      ))}
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[W - 0.04, 0.02, D - 0.04]} />
        <meshStandardMaterial color={wood} roughness={0.9} />
      </mesh>
      {/* the produce, heaped */}
      <group position={[0, 0.03, 0]}>
        <IngredientPieces id={mainId} radius={0.3} height={0.32} seed={lot.id.charCodeAt(0) * 5} />
        <group position={[0.15, 0.04, 0.05]}>
          <IngredientPieces id={mainId} radius={0.2} height={0.3} seed={lot.id.charCodeAt(0) * 7} />
        </group>
      </group>
      {/* visible mould on a bad lot: grey-green fuzzy patches */}
      {lot.fault === "mould" &&
        [
          [-0.12, 0.33, 0.05],
          [0.1, 0.36, -0.08],
          [0.02, 0.38, 0.12],
          [-0.2, 0.3, -0.12],
        ].map((pp, i) => (
          <mesh key={i} position={pp as [number, number, number]} scale={[0.07, 0.025, 0.06]}>
            <sphereGeometry args={[1, 10, 6]} />
            <meshStandardMaterial color="#9AA48A" roughness={1} />
          </mesh>
        ))}
      {/* stencilled lot board */}
      <mesh position={[0, 0.2, D / 2 + 0.012]}>
        <planeGeometry args={[0.42, 0.16]} />
        <meshStandardMaterial color="#F3E6CF" roughness={0.9} />
      </mesh>
      <Sign lines={[`LOT ${lot.id}`]} position={[0, 0.2, D / 2 + 0.015]} w={0.38} h={0.13} bg="#F3E6CF" fg="#2F1C1A" />
    </group>
  );
}

function Crates({ lots, decided, mainId, onPick }: { lots: Lot[]; decided: Record<string, "accept" | "reject">; mainId: string; onPick?: (id: string) => void }) {
  return (
    <group position={[1.3, 0, -3.4]}>
      {lots.map((l, i) => (
        <Crate key={l.id} lot={l} decided={decided[l.id]} mainId={mainId} onPick={onPick} x={-1.05 + i * 1.05} />
      ))}
      <Sign lines={["1 · SOURCING"]} position={[0, 1.7, -0.5]} w={1.8} h={0.36} />
    </group>
  );
}

export type TrayItem = { id: number; kind: "good" | "stone" | "shell" | "twig" | "plastic"; x: number; z: number };

function SortTray({ items, removed, mainId, onPick }: { items: TrayItem[]; removed: number[]; mainId: string; onPick?: (id: number) => void }) {
  return (
    <group position={[4.6, 0, -3.6]}>
      <Bench position={[0, 0, 0]} w={2.2} d={1.2} />
      <mesh position={[0, 0.975, 0]} receiveShadow>
        <boxGeometry args={[1.6, 0.03, 0.9]} />
        <meshStandardMaterial color="#C0C7CF" metalness={0.8} roughness={0.25} />
      </mesh>
      {[-0.81, 0.81].map((x) => (
        <mesh key={x} position={[x, 1.0, 0]}>
          <boxGeometry args={[0.02, 0.05, 0.92]} />
          <meshStandardMaterial color="#AEB6BF" metalness={0.8} roughness={0.25} />
        </mesh>
      ))}
      {items
        .filter((it) => !removed.includes(it.id))
        .map((it) => (
          <group key={it.id} position={[it.x, 0.995, it.z]} rotation={[0, it.id * 1.7, 0]} scale={1.6} onClick={(e) => (e.stopPropagation(), onPick?.(it.id))} onPointerOver={hover(true)} onPointerOut={hover(false)}>
            {it.kind === "good" ? <OnePiece id={mainId} /> : <ForeignItem kind={it.kind} />}
          </group>
        ))}
      <Sign lines={["2 · QUALITY CHECK"]} position={[0, 2.0, -0.6]} w={2} h={0.36} />
    </group>
  );
}

const WORKER: HumanLook = { skin: "#A86F45", hair: "#1A110C", hairStyle: "bun", outfit: "shirt", top: "#F4F1EC", bottom: "#3B4A5C", accent: "#FFFFFF", slim: true, height: 0.95 };

function PrepStation({ ppe, onPick }: { ppe: string[]; onPick?: (id: string) => void }) {
  const items: { id: string; node: React.ReactNode; x: number }[] = [
    {
      id: "hairnet",
      x: -0.6,
      node: (
        <mesh scale={[0.11, 0.05, 0.11]}>
          <sphereGeometry args={[1, 16, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          <meshStandardMaterial color="#F4F8FB" roughness={0.95} />
        </mesh>
      ),
    },
    {
      id: "mask",
      x: -0.2,
      node: (
        <group>
          <mesh scale={[0.17, 0.012, 0.1]}>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color="#90CAF9" roughness={0.9} />
          </mesh>
          {[-0.03, 0, 0.03].map((z) => (
            <mesh key={z} position={[0, 0.007, z]} scale={[0.17, 0.002, 0.004]}>
              <boxGeometry args={[1, 1, 1]} />
              <meshStandardMaterial color="#64B5F6" />
            </mesh>
          ))}
        </group>
      ),
    },
    {
      id: "gloves",
      x: 0.2,
      node: (
        <group>
          {[-0.04, 0.04].map((x) => (
            <mesh key={x} position={[x, 0, 0]} scale={[0.045, 0.015, 0.1]}>
              <sphereGeometry args={[1, 10, 8]} />
              <meshStandardMaterial color="#1E88E5" roughness={0.4} />
            </mesh>
          ))}
        </group>
      ),
    },
    {
      id: "apron",
      x: 0.62,
      node: (
        <mesh scale={[0.24, 0.03, 0.28]}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#FF5C00" roughness={0.8} />
        </mesh>
      ),
    },
  ];
  return (
    <group position={[7.4, 0, -3.4]}>
      <Bench position={[-0.8, 0, 0]} w={2.2} d={0.9} />
      {items.map((it) =>
        ppe.includes(it.id) ? null : (
          <group key={it.id} position={[it.x - 0.8, 0.99, 0]} onClick={(e) => (e.stopPropagation(), onPick?.(it.id))} onPointerOver={hover(true)} onPointerOut={hover(false)}>
            {it.node}
          </group>
        ),
      )}
      {/* hand-wash sink with tap */}
      <group position={[1.2, 0, 0]} onClick={(e) => (e.stopPropagation(), onPick?.("wash"))} onPointerOver={hover(true)} onPointerOut={hover(false)}>
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[0.8, 0.9, 0.55]} />
          <meshStandardMaterial color="#CFD8DC" roughness={0.5} />
        </mesh>
        <mesh position={[0, 0.9, 0]}>
          <boxGeometry args={[0.86, 0.06, 0.6]} />
          <meshStandardMaterial color="#B0BEC5" metalness={0.8} roughness={0.2} />
        </mesh>
        <mesh position={[0, 0.885, 0.02]}>
          <boxGeometry args={[0.6, 0.05, 0.4]} />
          <meshStandardMaterial color="#78909C" metalness={0.7} roughness={0.3} />
        </mesh>
        <mesh position={[0, 1.1, -0.22]} rotation={[0.4, 0, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.4, 10]} />
          <meshStandardMaterial color="#CFD8DC" metalness={0.9} roughness={0.15} />
        </mesh>
      </group>
      {/* the team member, kitted out as the student equips each item */}
      <group position={[0.1, 0, 1.0]} rotation={[0, -0.35, 0]}>
        <Human look={{ ...WORKER, top: ppe.includes("apron") ? "#FF5C00" : WORKER.top, hairnet: ppe.includes("hairnet"), mask: ppe.includes("mask") ? "#90CAF9" : undefined, gloves: ppe.includes("gloves") ? "#1E88E5" : undefined }} mode="stand" />
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

function BatchBench({ count, statuses, mainId, onPick }: { count: number; statuses: Record<number, "release" | "hold" | undefined>; mainId: string; onPick?: (i: number) => void }) {
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
            <group position={[0, 1.04, 0]}>
              <IngredientPieces id={mainId} radius={0.14} height={0.08} seed={i * 11 + 5} />
            </group>
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
    // narrow screens keep the desktop distance; <FitFov /> widens the lens so the full desktop width stays in view
    const aspect = size.width / Math.max(1, size.height);
    const portrait = aspect < 1;
    // only desktop lays the task panel over the scene's right side
    const covered = typeof window !== "undefined" && window.innerWidth >= 1024;
    const look = new THREE.Vector3(...v.look);
    const dir = new THREE.Vector3(...v.pos).sub(look).multiplyScalar(focus === "shelf" ? 1 : 1.15); // step back a little
    // wide screens: the panel covers the right side, so slide the camera right and the station sits left of centre
    const right = new THREE.Vector3().crossVectors(dir.clone().negate(), new THREE.Vector3(0, 1, 0)).normalize();
    const shift = !covered || portrait || focus === "overview" ? 0 : dir.length() * 0.28;
    const p = look.clone().add(dir).addScaledVector(right, shift);
    const l = look.clone().addScaledVector(right, shift);
    ref.current?.setLookAt(p.x, p.y, p.z, l.x, l.y, l.z, true);
  }, [focus, size.width, size.height]);
  return <CameraControls ref={ref} enabled={interactive} minDistance={1.2} maxDistance={16} maxPolarAngle={Math.PI / 2.05} smoothTime={0.6} />;
}

export type LabProps = {
  focus: Focus;
  interactive: boolean;
  mainId: string;
  picked: string[];
  parts: { id: string; pct: number }[];
  inspected: string[];
  onJar?: (id: string) => void;
  selected?: string | null;
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
      <AsyncCompile />
      <FitFov />
      <color attach="background" args={["#F3ECE3"]} />
      <fog attach="fog" args={["#F3ECE3", 18, 34]} />
      <hemisphereLight args={["#FFF6EA", "#B9A08A", 0.9]} />
      <directionalLight position={[6, 9, 6]} intensity={1.6} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-14} shadow-camera-right={14} shadow-camera-top={10} shadow-camera-bottom={-10} />
      <Rig focus={p.focus} interactive={p.interactive} />
      <Room />
      <IngredientWall picked={p.picked} inspected={p.inspected} selected={p.selected} onPick={p.onJar} />
      <MixingBowl parts={p.parts} />
      <Crates lots={p.lots} decided={p.lotDecisions} mainId={p.mainId} onPick={p.onLot} />
      <SortTray items={p.tray} removed={p.removed} mainId={p.mainId} onPick={p.onTray} />
      <PrepStation ppe={p.ppe} onPick={p.onPrep} />
      <Roaster heat={p.heat} doneness={p.doneness} />
      <BatchBench count={p.batches} statuses={p.batchStatus} mainId={p.mainId} onPick={p.onBatch} />
      <PackStation chosen={p.pack} onPick={p.onPack} labelUrl={p.labelUrl} />
    </Canvas>
  );
}
