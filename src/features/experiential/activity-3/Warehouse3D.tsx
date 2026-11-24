"use client";

import { useEffect, useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { CameraControls } from "@react-three/drei";
import { RoundedBox } from "@/components/three/RoundedBox";
import { Human, type HumanLook } from "@/components/world2/Human";
import { CHANNELS, CH_IDS, SKUS, type ChId } from "./data";
import { AsyncCompile } from "@/components/three/AsyncCompile";
import { FitFov } from "@/components/three/FitFov";

/**
 * The 3D Eat Better distribution centre: receiving bay with stretch-wrapped inbound pallets and a scanning desk,
 * orange-and-blue pallet racking whose cartons fill and empty with the student's stock, a roller conveyor carrying
 * cartons to the packing line, four dock doors with the vehicle of each channel (courier van, marketplace box
 * truck, quick-commerce van, freight lorry) and staged pallets sized by the student's allocation, a forklift, a
 * pallet jack, workers in hi-vis, and a control video wall that shows the live numbers.
 */

export type DCFocus = "overview" | "docks" | "receiving" | "racks" | "control";
const VIEWS: Record<DCFocus, { pos: [number, number, number]; look: [number, number, number] }> = {
  overview: { pos: [2, 10.5, 14], look: [0, 1, -2.5] },
  docks: { pos: [0.5, 4.6, 2.5], look: [0.5, 1.6, -9.5] },
  receiving: { pos: [5.2, 3.4, 11.2], look: [8.2, 0.9, 4.4] },
  racks: { pos: [-3.2, 3.6, 6.5], look: [-5.2, 1.7, -1.6] },
  control: { pos: [-5.5, 3, 4.6], look: [-11.6, 2.8, 1.2] },
};

const KRAFT = "#C99A62";
const hover = (on: boolean) => (e: ThreeEvent<PointerEvent>) => {
  e.stopPropagation();
  document.body.style.cursor = on ? "pointer" : "";
};

function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function Sign({ text, sub, position, rotation, w = 2.2, h = 0.5, bg = "#2F1C1A", fg = "#FED300" }: { text: string; sub?: string; position: [number, number, number]; rotation?: [number, number, number]; w?: number; h?: number; bg?: string; fg?: string }) {
  const tex = useMemo(
    () =>
      canvasTex(768, Math.round((768 * h) / w), (g) => {
        const H = g.canvas.height;
        g.fillStyle = bg;
        g.fillRect(0, 0, 768, H);
        g.fillStyle = fg;
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.font = `800 ${sub ? H * 0.42 : H * 0.55}px Fredoka, Figtree, sans-serif`;
        g.fillText(text, 384, sub ? H * 0.36 : H / 2, 740);
        if (sub) {
          g.font = `600 ${H * 0.26}px Figtree, sans-serif`;
          g.fillStyle = "#FFFFFF";
          g.fillText(sub, 384, H * 0.76, 740);
        }
      }),
    [text, sub, w, h, bg, fg],
  );
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <mesh position={position} rotation={rotation}>
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  );
}

/* ── cartons: corrugated box with tape and a printed product panel ── */

function useCartonMaterials(skuId: string) {
  const sku = SKUS.find((s) => s.id === skuId)!;
  const mats = useMemo(() => {
    const kraft = new THREE.MeshStandardMaterial({ color: KRAFT, roughness: 0.92 });
    const top = new THREE.MeshStandardMaterial({
      map: canvasTex(128, 128, (g) => {
        g.fillStyle = KRAFT;
        g.fillRect(0, 0, 128, 128);
        g.fillStyle = "#E7C795";
        g.fillRect(52, 0, 24, 128);
        g.strokeStyle = "#A87A45";
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(0, 64);
        g.lineTo(128, 64);
        g.stroke();
      }),
      roughness: 0.9,
    });
    const frontTex = canvasTex(256, 192, (g) => {
      g.fillStyle = KRAFT;
      g.fillRect(0, 0, 256, 192);
      g.fillStyle = "#FF5C00";
      g.fillRect(0, 0, 256, 34);
      g.fillStyle = "#FFFFFF";
      g.font = "800 22px Fredoka, Figtree, sans-serif";
      g.textAlign = "center";
      g.fillText("EAT BETTER CO", 128, 25);
      g.fillStyle = "#2F1C1A";
      g.font = "700 18px Figtree, sans-serif";
      g.fillText(sku.short.toUpperCase(), 128, 182, 240);
      g.strokeStyle = "#2F1C1A";
      g.lineWidth = 2;
      g.strokeRect(70, 40, 116, 116);
    });
    const front = new THREE.MeshStandardMaterial({ map: frontTex, roughness: 0.85 });
    const img = new Image();
    img.onload = () => {
      const g = (frontTex.image as HTMLCanvasElement).getContext("2d")!;
      g.drawImage(img, 71, 41, 114, 114);
      frontTex.needsUpdate = true;
    };
    img.src = sku.img;
    // box face order: +x, -x, +y, -y, +z, -z
    return [kraft, kraft, top, kraft, front, kraft];
  }, [sku]);
  useEffect(() => () => mats.forEach((m) => (m.map?.dispose(), m.dispose())), [mats]);
  return mats;
}

const CARTON: [number, number, number] = [0.42, 0.3, 0.32];
let cartonGeo: THREE.BoxGeometry | null = null;
const cartonGeom = () => (cartonGeo ??= new THREE.BoxGeometry(...CARTON));

/** A stack of `count` cartons laid out in layers of cols×rows on a pallet footprint. */
function CartonStack({ skuId, count, cols = 3, rows = 2, maxLayers = 2 }: { skuId: string; count: number; cols?: number; rows?: number; maxLayers?: number }) {
  const mats = useCartonMaterials(skuId);
  const ref = useRef<THREE.InstancedMesh>(null);
  const n = Math.min(count, cols * rows * maxLayers);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new THREE.Object3D();
    for (let i = 0; i < n; i++) {
      const layer = Math.floor(i / (cols * rows));
      const k = i % (cols * rows);
      const cx = k % cols;
      const cz = Math.floor(k / cols);
      o.position.set((cx - (cols - 1) / 2) * (CARTON[0] + 0.02), CARTON[1] / 2 + layer * (CARTON[1] + 0.005), (cz - (rows - 1) / 2) * (CARTON[2] + 0.02));
      o.rotation.set(0, ((i * 7) % 3) * 0.01 - 0.01, 0);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    }
    m.count = n;
    m.instanceMatrix.needsUpdate = true;
  }, [n, cols, rows]);
  return <instancedMesh ref={ref} args={[cartonGeom(), mats, cols * rows * maxLayers]} castShadow receiveShadow />;
}

function Pallet({ w = 1.3, d = 0.75 }: { w?: number; d?: number }) {
  return (
    <group>
      {[-1, 0, 1].map((i) => (
        <mesh key={`b${i}`} position={[0, 0.03, (i * (d - 0.1)) / 2]} castShadow receiveShadow>
          <boxGeometry args={[w, 0.06, 0.1]} />
          <meshStandardMaterial color="#A57A4A" roughness={0.9} />
        </mesh>
      ))}
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={`t${i}`} position={[-w / 2 + 0.06 + (i * (w - 0.12)) / 6, 0.09, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.11, 0.025, d]} />
          <meshStandardMaterial color="#BC8F5C" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

/* ── racking ───────────────────────────────────────────────── */

const LEVELS = [0.12, 1.32, 2.52];
const PER_PALLET = 12; // 3×2×2

function RackBay({ skuId, cartons, x, highlight, onPick }: { skuId: string; cartons: number; x: number; highlight: boolean; onPick?: (id: string) => void }) {
  const sku = SKUS.find((s) => s.id === skuId)!;
  const pallets = Math.ceil(Math.min(cartons, LEVELS.length * 2 * PER_PALLET) / PER_PALLET);
  return (
    <group position={[x, 0, 0]} onClick={(e) => (e.stopPropagation(), onPick?.(skuId))} onPointerOver={hover(true)} onPointerOut={hover(false)}>
      {/* uprights */}
      {[-1.45, 1.45].flatMap((ux) =>
        [-0.45, 0.45].map((uz) => (
          <mesh key={`${ux}${uz}`} position={[ux, 1.85, uz]} castShadow>
            <boxGeometry args={[0.08, 3.7, 0.08]} />
            <meshStandardMaterial color="#F05A1A" roughness={0.5} metalness={0.3} />
          </mesh>
        )),
      )}
      {/* beams */}
      {LEVELS.map((y) =>
        [-0.45, 0.45].map((uz) => (
          <mesh key={`${y}${uz}`} position={[0, y + 0.05, uz]} castShadow>
            <boxGeometry args={[2.9, 0.1, 0.06]} />
            <meshStandardMaterial color="#1E5AA8" roughness={0.45} metalness={0.35} />
          </mesh>
        )),
      )}
      {/* pallets of cartons, bottom up */}
      {Array.from({ length: pallets }, (_, p) => {
        const level = Math.floor(p / 2);
        const side = p % 2 === 0 ? -0.7 : 0.7;
        const inPallet = Math.min(PER_PALLET, cartons - p * PER_PALLET);
        return (
          <group key={p} position={[side, LEVELS[level] + 0.1, 0]}>
            <Pallet />
            <group position={[0, 0.1, 0]}>
              <CartonStack skuId={skuId} count={inPallet} />
            </group>
          </group>
        );
      })}
      {/* bay label */}
      <Sign text={sku.short.toUpperCase()} sub={`${cartons} box${cartons === 1 ? "" : "es"} in stock`} position={[0, 3.95, 0.5]} w={2.6} h={0.55} bg={highlight ? "#FF5C00" : "#2F1C1A"} fg={highlight ? "#FFFFFF" : "#FED300"} />
    </group>
  );
}

/* ── conveyor ──────────────────────────────────────────────── */

function Conveyor({ running }: { running: boolean }) {
  const boxes = useRef<THREE.Group>(null);
  const rollers = useMemo(() => Array.from({ length: 26 }, (_, i) => -6 + i * 0.46), []);
  useFrame((_, dt) => {
    if (!boxes.current || !running) return;
    boxes.current.children.forEach((c) => {
      c.position.z -= dt * 0.9;
      if (c.position.z < -6) c.position.z += 12;
    });
  });
  return (
    <group position={[2.6, 0, -1.5]}>
      {[-0.42, 0.42].map((x) => (
        <mesh key={x} position={[x, 0.82, 0]} castShadow>
          <boxGeometry args={[0.06, 0.14, 12.2]} />
          <meshStandardMaterial color="#9AA4AE" metalness={0.7} roughness={0.3} />
        </mesh>
      ))}
      {rollers.map((z) => (
        <mesh key={z} position={[0, 0.8, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.045, 0.045, 0.8, 10]} />
          <meshStandardMaterial color="#C9D0D8" metalness={0.8} roughness={0.25} />
        </mesh>
      ))}
      {[-5.5, -2, 1.5, 5].map((z) => (
        <group key={z}>
          {[-0.38, 0.38].map((x) => (
            <mesh key={x} position={[x, 0.38, z]}>
              <boxGeometry args={[0.06, 0.76, 0.06]} />
              <meshStandardMaterial color="#5C6670" metalness={0.6} roughness={0.4} />
            </mesh>
          ))}
        </group>
      ))}
      <group ref={boxes}>
        {[-5, -2.6, -0.2, 2.2, 4.6].map((z, i) => (
          <mesh key={z} position={[0, 1.0, z]} castShadow>
            <boxGeometry args={[0.46, 0.32, 0.36]} />
            <meshStandardMaterial color={i % 2 ? KRAFT : "#D2A672"} roughness={0.9} />
          </mesh>
        ))}
      </group>
      <Sign text="PACKING LINE" position={[0, 2.4, 6.2]} w={2} h={0.42} />
    </group>
  );
}

/* ── vehicles ──────────────────────────────────────────────── */

function Wheel({ p, r = 0.38 }: { p: [number, number, number]; r?: number }) {
  return (
    <group position={p}>
      <mesh rotation={[0, 0, Math.PI / 2]} castShadow>
        <cylinderGeometry args={[r, r, 0.26, 20]} />
        <meshStandardMaterial color="#1D1B1A" roughness={0.9} />
      </mesh>
      <mesh rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[r * 0.55, r * 0.55, 0.27, 14]} />
        <meshStandardMaterial color="#B9B4AE" metalness={0.7} roughness={0.35} />
      </mesh>
    </group>
  );
}

/** A vehicle backed up to the dock: rear (+z) faces the door. */
function Vehicle({ ch }: { ch: ChId }) {
  const c = CHANNELS[ch];
  const big = ch === "b2b" || ch === "mkt";
  const len = ch === "b2b" ? 6.4 : ch === "mkt" ? 5 : ch === "d2c" ? 4 : 3.2;
  const hgt = ch === "b2b" ? 2.9 : ch === "mkt" ? 2.6 : 2.0;
  const wid = big ? 2.3 : 1.85;
  const label = ch === "d2c" ? "D2C COURIER" : ch === "mkt" ? "MARKETPLACE" : ch === "qc" ? "QUICK COMMERCE" : "BULK FREIGHT";
  return (
    <group>
      {/* cargo box */}
      <RoundedBox args={[wid, hgt, len]} radius={0.06} position={[0, 0.6 + hgt / 2, -len / 2]} castShadow>
        <meshStandardMaterial color="#F4F1EC" roughness={0.5} />
      </RoundedBox>
      <mesh position={[0, 0.6 + hgt * 0.62, -len / 2]}>
        <boxGeometry args={[wid + 0.01, hgt * 0.22, len * 0.9]} />
        <meshStandardMaterial color={c.color} roughness={0.5} />
      </mesh>
      <Sign text={label} position={[wid / 2 + 0.01, 0.6 + hgt * 0.62, -len / 2]} rotation={[0, Math.PI / 2, 0]} w={len * 0.8} h={hgt * 0.2} bg={c.color} fg="#FFFFFF" />
      {/* cab */}
      <RoundedBox args={[wid, big ? 2.2 : 1.7, 1.6]} radius={0.15} position={[0, 0.6 + (big ? 1.1 : 0.85), -len - 0.85]} castShadow>
        <meshStandardMaterial color={c.color} roughness={0.35} metalness={0.25} />
      </RoundedBox>
      <mesh position={[0, 0.6 + (big ? 1.5 : 1.15), -len - 1.66]}>
        <boxGeometry args={[wid * 0.85, big ? 0.8 : 0.6, 0.02]} />
        <meshStandardMaterial color="#26323C" roughness={0.1} metalness={0.6} />
      </mesh>
      {/* chassis + wheels */}
      <mesh position={[0, 0.5, -len / 2 - 0.4]}>
        <boxGeometry args={[wid * 0.8, 0.2, len + 0.8]} />
        <meshStandardMaterial color="#2B2A29" />
      </mesh>
      {[-1, 1].flatMap((sx) => [-0.9, -len + 0.4].map((z) => <Wheel key={`${sx}${z}`} p={[(sx * wid) / 2.2, 0.38, z]} />))}
      {/* open rear doors */}
      {[-1, 1].map((sx) => (
        <mesh key={sx} position={[(sx * wid) / 2 + sx * 0.02, 0.6 + hgt / 2, 0.45]} rotation={[0, sx * 1.35, 0]}>
          <boxGeometry args={[wid / 2, hgt - 0.05, 0.04]} />
          <meshStandardMaterial color="#E6E2DC" roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

const DOCK_X: Record<ChId, number> = { d2c: -7.2, mkt: -2.4, qc: 2.4, b2b: 7.2 };

function Dock({ ch, cartons, highlight, onPick }: { ch: ChId; cartons: Record<string, number>; highlight: boolean; onPick?: (ch: ChId) => void }) {
  const x = DOCK_X[ch];
  const entries = Object.entries(cartons).filter(([, n]) => n > 0);
  return (
    <group position={[x, 0, 0]} onClick={(e) => (e.stopPropagation(), onPick?.(ch))} onPointerOver={hover(true)} onPointerOut={hover(false)}>
      {/* door frame + leveller */}
      <mesh position={[0, 0.03, -9.2]} receiveShadow>
        <boxGeometry args={[3.2, 0.06, 1.2]} />
        <meshStandardMaterial color="#5C6670" metalness={0.5} roughness={0.5} />
      </mesh>
      {[-1.7, 1.7].map((sx) => (
        <mesh key={sx} position={[sx, 2, -9.85]}>
          <boxGeometry args={[0.2, 4, 0.3]} />
          <meshStandardMaterial color="#FED300" roughness={0.5} />
        </mesh>
      ))}
      <mesh position={[0, 4.15, -9.85]}>
        <boxGeometry args={[3.6, 0.3, 0.3]} />
        <meshStandardMaterial color="#5C6670" />
      </mesh>
      {/* roller shutter, rolled up */}
      <mesh position={[0, 3.85, -9.95]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.22, 0.22, 3.3, 16]} />
        <meshStandardMaterial color="#9AA4AE" metalness={0.6} roughness={0.35} />
      </mesh>
      <Sign text={`DOCK · ${CHANNELS[ch].short.toUpperCase()}`} sub={CHANNELS[ch].speed} position={[0, 4.75, -9.9]} w={3.2} h={0.6} bg={highlight ? "#FF5C00" : CHANNELS[ch].color} fg="#FFFFFF" />
      <group position={[0, 0, -10.3]}>
        <Vehicle ch={ch} />
      </group>
      {/* staged pallets of this channel's allocation */}
      {entries.slice(0, 4).map(([sku, n], i) => (
        <group key={sku} position={[(i % 2 ? 0.75 : -0.75), 0, -7.6 + Math.floor(i / 2) * 1.0]}>
          <Pallet w={1.2} d={0.8} />
          <group position={[0, 0.1, 0]}>
            <CartonStack skuId={sku} count={n} cols={2} rows={2} maxLayers={3} />
          </group>
        </group>
      ))}
      {/* floor lane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.006, -6.5]}>
        <planeGeometry args={[3.2, 5]} />
        <meshStandardMaterial color={CHANNELS[ch].color} transparent opacity={highlight ? 0.28 : 0.12} />
      </mesh>
    </group>
  );
}

/* ── receiving bay ─────────────────────────────────────────── */

function Receiving({ inbound, decided, selected, onPick }: { inbound: { sku: string; units: number; issue: string }[]; decided: Record<string, string>; selected?: string | null; onPick?: (sku: string) => void }) {
  const wrap = useMemo(() => new THREE.MeshPhysicalMaterial({ color: "#FFFFFF", roughness: 0.15, transparent: true, opacity: 0.22, transmission: 0.3 }), []);
  return (
    <group position={[8.2, 0, 4.4]}>
      {inbound.map((b, i) => {
        const x = (i % 3) * 1.6 - 1.6;
        const z = Math.floor(i / 3) * 1.5 - 0.6;
        const d = decided[b.sku];
        return (
          <group key={b.sku} position={[x, 0, z]} onClick={(e) => (e.stopPropagation(), onPick?.(b.sku))} onPointerOver={hover(true)} onPointerOut={hover(false)}>
            <Pallet w={1.2} d={0.9} />
            <group position={[0, 0.1, 0]}>
              <CartonStack skuId={b.sku} count={b.issue === "damaged" && d !== "reject-damaged" ? 10 : 12} cols={3} rows={2} maxLayers={2} />
            </group>
            {b.issue === "damaged" && d !== "reject-damaged" && (
              // two crushed cartons on top, caved in and torn
              <group position={[0.25, 0.75, 0.05]} rotation={[0.2, 0.4, 0.25]}>
                <mesh scale={[0.42, 0.16, 0.32]} castShadow>
                  <boxGeometry args={[1, 1, 1]} />
                  <meshStandardMaterial color="#9C7445" roughness={1} />
                </mesh>
              </group>
            )}
            {/* stretch wrap */}
            <mesh position={[0, 0.42, 0]} material={wrap}>
              <boxGeometry args={[1.32, 0.66, 0.72]} />
            </mesh>
            <mesh position={[0, 1.15, 0]}>
              <sphereGeometry args={[0.08, 12, 8]} />
              <meshBasicMaterial color={!d ? (selected === b.sku ? "#FF5C00" : "#FFFFFF") : d === "accept" ? "#2E9E5B" : d === "qc-only" ? "#00A341" : "#E53935"} toneMapped={false} />
            </mesh>
          </group>
        );
      })}
      {/* scanning desk */}
      <group position={[-3.3, 0, 0.2]}>
        <mesh position={[0, 0.45, 0]} castShadow>
          <boxGeometry args={[1.2, 0.9, 0.6]} />
          <meshStandardMaterial color="#5C6670" metalness={0.4} roughness={0.5} />
        </mesh>
        <mesh position={[0, 1.15, -0.15]} rotation={[-0.2, 0, 0]}>
          <boxGeometry args={[0.6, 0.38, 0.03]} />
          <meshStandardMaterial color="#111827" emissive="#1E5AA8" emissiveIntensity={0.6} />
        </mesh>
        <mesh position={[0.35, 0.95, 0.12]} rotation={[0.3, 0, 0.2]}>
          <boxGeometry args={[0.08, 0.06, 0.2]} />
          <meshStandardMaterial color="#FED300" />
        </mesh>
      </group>
      <Sign text="RECEIVING" sub="inspect · scan · put away" position={[0, 2.6, -1.4]} w={2.6} h={0.6} />
    </group>
  );
}

/* ── control wall ──────────────────────────────────────────── */

function ControlWall({ lines }: { lines: string[] }) {
  const tex = useMemo(
    () =>
      canvasTex(1024, 512, (g) => {
        g.fillStyle = "#0E1A3A";
        g.fillRect(0, 0, 1024, 512);
        // stylised map of channel lanes from the warehouse
        g.strokeStyle = "#22305C";
        g.lineWidth = 2;
        for (let i = 0; i < 1024; i += 64) {
          g.beginPath();
          g.moveTo(i, 0);
          g.lineTo(i, 512);
          g.stroke();
        }
        const hub = [250, 280];
        const dests: [number, number, string][] = [
          [120, 120, "#FF5C00"],
          [440, 130, "#2F6FDE"],
          [380, 420, "#00A341"],
          [90, 430, "#8A4FD6"],
        ];
        dests.forEach(([x, y, c]) => {
          g.strokeStyle = c;
          g.lineWidth = 6;
          g.beginPath();
          g.moveTo(hub[0], hub[1]);
          g.lineTo(x, y);
          g.stroke();
          g.fillStyle = c;
          g.beginPath();
          g.arc(x, y, 14, 0, Math.PI * 2);
          g.fill();
        });
        g.fillStyle = "#FED300";
        g.beginPath();
        g.arc(hub[0], hub[1], 22, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = "#FFFFFF";
        g.font = "800 40px Figtree, sans-serif";
        g.fillText("CONTROL ROOM", 560, 70);
        g.font = "600 30px Figtree, sans-serif";
        lines.slice(0, 8).forEach((l, i) => g.fillText(l, 560, 130 + i * 46, 440));
      }),
    [lines],
  );
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <group position={[-11.85, 2.7, 1.2]} rotation={[0, Math.PI / 2, 0]}>
      <mesh position={[0, 0, -0.04]}>
        <boxGeometry args={[6.3, 3.3, 0.06]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      <mesh>
        <planeGeometry args={[6.1, 3.05]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ── forklift + people ─────────────────────────────────────── */

function Forklift() {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (!g.current) return;
    const t = clock.elapsedTime * 0.25;
    g.current.position.set(-1 + Math.sin(t) * 0.4, 0, 2.4 + Math.cos(t * 0.7) * 1.4);
  });
  return (
    <group ref={g} rotation={[0, Math.PI, 0]}>
      <RoundedBox args={[1.1, 0.7, 1.6]} radius={0.08} position={[0, 0.55, 0]} castShadow>
        <meshStandardMaterial color="#F6C21C" roughness={0.45} />
      </RoundedBox>
      <mesh position={[0, 1.5, 0.1]}>
        <boxGeometry args={[1.0, 0.06, 1.0]} />
        <meshStandardMaterial color="#2B2A29" />
      </mesh>
      {[-0.45, 0.45].flatMap((x) => [-0.4, 0.4].map((z) => (
        <mesh key={`${x}${z}`} position={[x, 1.05, z + 0.1]}>
          <boxGeometry args={[0.05, 0.9, 0.05]} />
          <meshStandardMaterial color="#2B2A29" />
        </mesh>
      )))}
      {[-0.3, 0.3].map((x) => (
        <mesh key={x} position={[x, 1.1, 0.95]}>
          <boxGeometry args={[0.07, 2.0, 0.07]} />
          <meshStandardMaterial color="#3A3A3A" metalness={0.6} />
        </mesh>
      ))}
      {[-0.22, 0.22].map((x) => (
        <mesh key={x} position={[x, 0.12, 1.4]}>
          <boxGeometry args={[0.09, 0.05, 0.9]} />
          <meshStandardMaterial color="#3A3A3A" metalness={0.6} />
        </mesh>
      ))}
      {[-1, 1].flatMap((sx) => [-0.5, 0.55].map((z) => <Wheel key={`${sx}${z}`} p={[sx * 0.55, 0.26, z]} r={0.26} />))}
    </group>
  );
}

const HIVIS: HumanLook[] = [
  { skin: "#A86F45", hair: "#1A110C", hairStyle: "short", outfit: "tshirt", top: "#C6FF3D", bottom: "#2F3A4A", accent: "#C6FF3D", facial: "stubble" },
  { skin: "#9C6644", hair: "#140C08", hairStyle: "bun", outfit: "shirt", top: "#FF8A00", bottom: "#2B3A55", accent: "#FFB347", slim: true, height: 0.95 },
  { skin: "#C68B59", hair: "#1E1410", hairStyle: "side", outfit: "tshirt", top: "#C6FF3D", bottom: "#33475B", facial: "moustache" },
];

/* ── room ──────────────────────────────────────────────────── */

function Building() {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[26, 24]} />
        <meshStandardMaterial color="#B9BCC0" roughness={0.55} metalness={0.05} />
      </mesh>
      {/* outside apron behind the docks */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.01, -14]}>
        <planeGeometry args={[26, 8]} />
        <meshStandardMaterial color="#6B6E72" roughness={0.9} />
      </mesh>
      {/* walking lanes */}
      {[-3.9, 5].map((z) => (
        <mesh key={z} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.004, z]}>
          <planeGeometry args={[24, 0.12]} />
          <meshStandardMaterial color="#F6C21C" />
        </mesh>
      ))}
      {/* back wall with door openings (posts between doors) */}
      {[-11, -4.8, 0, 4.8, 11].map((x) => (
        <mesh key={x} position={[x, 3, -10]} receiveShadow>
          <boxGeometry args={[x === -11 || x === 11 ? 2.4 : 1.4, 6, 0.3]} />
          <meshStandardMaterial color="#DCD8D2" roughness={0.85} />
        </mesh>
      ))}
      <mesh position={[0, 5.2, -10]}>
        <boxGeometry args={[24, 1.6, 0.3]} />
        <meshStandardMaterial color="#DCD8D2" roughness={0.85} />
      </mesh>
      <mesh position={[-12, 3, -1]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[18, 6]} />
        <meshStandardMaterial color="#E7E3DD" roughness={0.9} />
      </mesh>
      <mesh position={[12, 3, -1]} rotation={[0, -Math.PI / 2, 0]}>
        <planeGeometry args={[18, 6]} />
        <meshStandardMaterial color="#E7E3DD" roughness={0.9} />
      </mesh>
      <Sign text="EAT BETTER CO · DISTRIBUTION CENTRE" position={[0, 5.4, -9.8]} w={7} h={0.7} bg="#FF5C00" fg="#FFFFFF" />
      {/* high-bay lights */}
      {[-6, 0, 6].flatMap((x) => [-5, 1, 6].map((z) => (
        <mesh key={`${x}${z}`} position={[x, 6.4, z]} rotation={[Math.PI / 2, 0, 0]}>
          <circleGeometry args={[0.45, 20]} />
          <meshBasicMaterial color="#FFFFFF" />
        </mesh>
      )))}
    </group>
  );
}

function Rig({ focus }: { focus: DCFocus }) {
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
    const dir = new THREE.Vector3(...v.pos).sub(look).multiplyScalar(1.1);
    const right = new THREE.Vector3().crossVectors(dir.clone().negate(), new THREE.Vector3(0, 1, 0)).normalize();
    const shift = !covered || portrait ? 0 : dir.length() * 0.26;
    const p = look.clone().add(dir).addScaledVector(right, shift);
    const l = look.clone().addScaledVector(right, shift);
    ref.current?.setLookAt(p.x, p.y, p.z, l.x, l.y, l.z, true);
  }, [focus, size.width, size.height]);
  return <CameraControls ref={ref} minDistance={2} maxDistance={26} maxPolarAngle={Math.PI / 2.05} smoothTime={0.7} />;
}

export type WarehouseProps = {
  focus: DCFocus;
  stock: Record<string, number>; // units per SKU on the racks
  docks: Record<ChId, Record<string, number>>; // units per SKU staged per channel
  inbound: { sku: string; units: number; issue: string }[];
  recv: Record<string, string>;
  selectedSku?: string | null;
  selectedCh?: ChId | null;
  onSku?: (sku: string) => void;
  onDock?: (ch: ChId) => void;
  wall: string[];
  running: boolean;
};

export default function Warehouse3D(p: WarehouseProps) {
  return (
    <Canvas shadows dpr={[1, 1.6]} camera={{ position: VIEWS.overview.pos, fov: 45 }} gl={{ antialias: true }} onPointerMissed={() => (document.body.style.cursor = "")}>
      <AsyncCompile />
      <FitFov />
      <color attach="background" args={["#E9E6E1"]} />
      <fog attach="fog" args={["#E9E6E1", 24, 46]} />
      <hemisphereLight args={["#FFFFFF", "#8C8478", 1.0]} />
      <directionalLight position={[8, 14, 8]} intensity={1.5} castShadow shadow-mapSize={[1024, 1024]} shadow-camera-left={-16} shadow-camera-right={16} shadow-camera-top={14} shadow-camera-bottom={-14} />
      <Rig focus={p.focus} />
      <Building />
      <group position={[-5.2, 0, -1.6]}>
        {SKUS.map((s, i) => (
          <group key={s.id} position={[0, 0, Math.floor(i / 3) * 2.6 - 1.3]}>
            <RackBay skuId={s.id} cartons={Math.ceil((p.stock[s.id] ?? 0) / 20)} x={(i % 3) * 3.1 - 3.1} highlight={p.selectedSku === s.id} onPick={p.onSku} />
          </group>
        ))}
      </group>
      <Conveyor running={p.running} />
      {CH_IDS.map((c) => (
        <Dock key={c} ch={c} cartons={Object.fromEntries(Object.entries(p.docks[c] ?? {}).map(([k, v]) => [k, Math.ceil(v / 20)]))} highlight={p.selectedCh === c} onPick={p.onDock} />
      ))}
      <Receiving inbound={p.inbound} decided={p.recv} selected={p.selectedSku} onPick={p.onSku} />
      <ControlWall lines={p.wall} />
      <Forklift />
      <group position={[6.2, 0, 3.6]} rotation={[0, -0.6, 0]}>
        <Human look={HIVIS[0]} mode="stand" />
      </group>
      <group position={[3.6, 0, 1.2]} rotation={[0, Math.PI / 2, 0]}>
        <Human look={HIVIS[1]} mode="stand" />
      </group>
      <group position={[-1.2, 0, -6.6]} rotation={[0, 0.4, 0]}>
        <Human look={HIVIS[2]} mode="stand" />
      </group>
    </Canvas>
  );
}
