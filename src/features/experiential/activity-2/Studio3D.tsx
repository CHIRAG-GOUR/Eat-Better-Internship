"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree, type ThreeEvent } from "@react-three/fiber";
import { CameraControls, ContactShadows, Environment, Lightformer } from "@react-three/drei";
import { RoundedBox } from "@/components/three/RoundedBox";
import { SHELF, STORY, type ShelfItem } from "./data";
import { AsyncCompile } from "@/components/three/AsyncCompile";
import { FitFov } from "@/components/three/FitFov";

/**
 * The 3D Eat Better Brand Studio. Every object has a job:
 *  - retail display shelf with real Eat Better packs (official pack fronts, real proportions) → inspect products
 *  - "Our story" wall: three framed official photos → read the brand values
 *  - colour & typography mood board (official palette + the student's pack palette)
 *  - packaging workstation: monitor with the flat artwork + the live 3D pack on a turntable
 *  - product photography set: seamless backdrop in the student's colour, softboxes, camera on a tripod
 *  - creative review screen: the student's Instagram post
 *  - campaign dashboard wall: the simulated Meta Ads results
 */

export type Focus = "overview" | "shelf" | "story" | "board" | "desk" | "photo" | "screens" | "dashboard";

type Station = { pos: [number, number]; rot: number; cam: [number, number, number]; look: [number, number, number]; shift?: number };
const ST: Record<Exclude<Focus, "overview">, Station> = {
  shelf: { pos: [-6.4, -4.4], rot: 0.62, cam: [0, 1.4, 3.7], look: [0, 1.08, 0], shift: 0.22 },
  story: { pos: [-2.0, -5.95], rot: 0, cam: [0, 1.7, 4.4], look: [0, 1.75, 0], shift: 0.2 },
  board: { pos: [1.8, -5.95], rot: 0, cam: [0, 1.65, 3.1], look: [0, 1.62, 0], shift: 0.26 },
  desk: { pos: [-2.4, -2.2], rot: 0, cam: [0.25, 1.32, 1.5], look: [0.38, 0.98, -0.05], shift: 0.3 },
  photo: { pos: [5.2, -3.3], rot: -0.35, cam: [0.2, 1.45, 3.0], look: [0, 0.98, 0], shift: 0.26 },
  screens: { pos: [6.9, 0.4], rot: -1.15, cam: [0, 1.5, 2.6], look: [0, 1.45, 0] },
  dashboard: { pos: [-6.6, 1.6], rot: 1.1, cam: [0, 1.6, 2.9], look: [0, 1.5, 0] },
};
const world = (s: Station, l: [number, number, number]) => {
  const c = Math.cos(s.rot);
  const n = Math.sin(s.rot);
  return new THREE.Vector3(s.pos[0] + l[0] * c + l[2] * n, l[1], s.pos[1] - l[0] * n + l[2] * c);
};

/** Seeded pseudo-random numbers so textures and props look the same on every render. */
let seed = 7;
const R = () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

/* ── helpers ────────────────────────────────────────────────────────────────────────────────────────── */

const hover = (on: boolean) => (e: ThreeEvent<PointerEvent>) => {
  e.stopPropagation();
  document.body.style.cursor = on ? "pointer" : "";
};

function useCanvasTex(canvas: HTMLCanvasElement | null | undefined, version?: unknown) {
  const tex = useMemo(() => {
    if (!canvas) return null;
    const t = new THREE.CanvasTexture(canvas);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canvas, version]);
  useEffect(() => () => tex?.dispose(), [tex]);
  return tex;
}

function useImageTex(src: string, crop?: [number, number, number, number], size = 700) {
  const [tex, setTex] = useState<THREE.Texture | null>(null);
  useEffect(() => {
    let alive = true;
    new THREE.TextureLoader().load(src, (t) => {
      t.colorSpace = THREE.SRGBColorSpace;
      t.anisotropy = 8;
      if (crop) {
        t.repeat.set((crop[2] - crop[0]) / size, (crop[3] - crop[1]) / size);
        t.offset.set(crop[0] / size, 1 - crop[3] / size);
      }
      if (alive) setTex(t);
      else t.dispose();
    });
    return () => {
      alive = false;
    };
  }, [src, crop, size]);
  useEffect(() => () => tex?.dispose(), [tex]);
  return tex;
}

function canvasTex(draw: (g: CanvasRenderingContext2D, w: number, h: number) => void, w = 512, h = 512, repeat?: [number, number]) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(...repeat);
  }
  return t;
}

function textTex(lines: { t: string; size: number; weight?: number; color?: string }[], w: number, h: number, bg: string, align: CanvasTextAlign = "center") {
  return canvasTex(
    (g) => {
      g.fillStyle = bg;
      g.fillRect(0, 0, w, h);
      g.textAlign = align;
      g.textBaseline = "middle";
      const total = lines.reduce((a, l) => a + l.size * 1.25, 0);
      let y = h / 2 - total / 2;
      for (const l of lines) {
        g.font = `${l.weight ?? 700} ${l.size}px Arial, sans-serif`;
        g.fillStyle = l.color ?? "#2F1C1A";
        g.fillText(l.t, align === "center" ? w / 2 : 24, y + l.size * 0.62, w - 32);
        y += l.size * 1.25;
      }
    },
    w,
    h,
  );
}

/* ── materials ──────────────────────────────────────────────────────────────────────────────────────── */

function useMaterials() {
  return useMemo(() => {
    const oak = canvasTex(
      (g, w, h) => {
        g.fillStyle = "#B98A5E";
        g.fillRect(0, 0, w, h);
        for (let i = 0; i < 8; i++) {
          const y = (i * h) / 8;
          g.fillStyle = i % 2 ? "#B08155" : "#C29466";
          g.fillRect(0, y, w, h / 8 - 2);
          g.fillStyle = "rgba(60,35,15,0.45)";
          g.fillRect(0, y + h / 8 - 2, w, 2);
          for (let k = 0; k < 40; k++) {
            g.strokeStyle = `rgba(90,55,25,${0.05 + R() * 0.1})`;
            g.lineWidth = 1;
            g.beginPath();
            const yy = y + R() * (h / 8);
            g.moveTo(0, yy);
            g.bezierCurveTo(w * 0.3, yy + 3, w * 0.6, yy - 3, w, yy + 1);
            g.stroke();
          }
          const off = ((i * 37) % 10) * (w / 10);
          g.fillStyle = "rgba(60,35,15,0.35)";
          g.fillRect(off, y, 2, h / 8);
        }
      },
      1024,
      1024,
      [3, 3],
    );
    const plaster = canvasTex(
      (g, w, h) => {
        g.fillStyle = "#F3EBE2";
        g.fillRect(0, 0, w, h);
        for (let i = 0; i < 9000; i++) {
          g.fillStyle = R() > 0.5 ? "rgba(0,0,0,0.025)" : "rgba(255,255,255,0.05)";
          g.fillRect(R() * w, R() * h, 2, 2);
        }
      },
      512,
      512,
      [6, 2],
    );
    const laddooBump = canvasTex(
      (g, w, h) => {
        g.fillStyle = "#808080";
        g.fillRect(0, 0, w, h);
        for (let i = 0; i < 1500; i++) {
          const v = Math.floor(R() * 255);
          g.fillStyle = `rgb(${v},${v},${v})`;
          g.beginPath();
          g.arc(R() * w, R() * h, 1 + R() * 4, 0, Math.PI * 2);
          g.fill();
        }
      },
      256,
      256,
    );
    const laddooCol = canvasTex(
      (g, w, h) => {
        g.fillStyle = "#5A2E1A";
        g.fillRect(0, 0, w, h);
        for (let i = 0; i < 500; i++) {
          g.fillStyle = R() > 0.5 ? "#D9B27A" : "#3E1E10";
          g.beginPath();
          g.ellipse(R() * w, R() * h, 1 + R() * 4, 1 + R() * 2.5, R() * 3, 0, Math.PI * 2);
          g.fill();
        }
      },
      256,
      256,
    );
    return { oak, plaster, laddooBump, laddooCol };
  }, []);
}

/* ── packs ──────────────────────────────────────────────────────────────────────────────────────────── */

/** One face of a pillow pouch: a plane bulged into a soft cushion, flat at the heat seals. */
function pouchGeometry(w: number, h: number, d: number, fmt: "sachet" | "pouch") {
  const geo = new THREE.PlaneGeometry(w, h, 28, 40);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const uv = geo.attributes.uv as THREE.BufferAttribute;
  const ss = (a: number, b: number, x: number) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  for (let i = 0; i < pos.count; i++) {
    const u = uv.getX(i);
    const v = uv.getY(i);
    const sx = Math.sqrt(Math.max(0, 4 * u * (1 - u)));
    let sy: number;
    if (fmt === "pouch") sy = v > 0.955 ? 0 : v > 0.82 ? ss(0.955, 0.82, v) : v < 0.05 ? 0.78 + 0.22 * (v / 0.05) : 1;
    else sy = v > 0.955 || v < 0.045 ? 0 : v > 0.85 ? ss(0.955, 0.85, v) : v < 0.15 ? ss(0.045, 0.15, v) : 1;
    pos.setZ(i, d * sx * sy);
    // the bulge pulls the sides in a little
    pos.setX(i, pos.getX(i) * (1 - 0.035 * sy * (1 - sx)));
  }
  geo.computeVertexNormals();
  return geo;
}

export function Pack3D({ front, back, fmt, height, color, onClick }: { front: THREE.Texture | null; back?: THREE.Texture | null; fmt: "sachet" | "pouch" | "box"; height: number; color: string; onClick?: () => void }) {
  const aspect = front?.image ? (front.image as { width: number }).width / (front.image as { height: number }).height : fmt === "sachet" ? 0.42 : fmt === "box" ? 1.17 : 0.77;
  const w = height * (front?.repeat && front.repeat.x !== 1 ? (front.repeat.x / front.repeat.y) * aspect : aspect);
  const d = fmt === "sachet" ? w * 0.13 : w * 0.2;
  const geo = useMemo(() => (fmt === "box" ? null : pouchGeometry(w, height, d, fmt)), [w, height, d, fmt]);
  useEffect(() => () => geo?.dispose(), [geo]);
  const mat = (map: THREE.Texture | null | undefined) => <meshPhysicalMaterial key={map?.uuid ?? "plain"} map={map ?? null} color={map ? "#FFFFFF" : color} roughness={0.42} clearcoat={0.6} clearcoatRoughness={0.35} side={THREE.DoubleSide} />;
  if (fmt === "box") {
    const depth = height * 0.42;
    return (
      <group position={[0, height / 2, 0]} onClick={onClick ? (e) => (e.stopPropagation(), onClick()) : undefined}>
        <mesh castShadow receiveShadow>
          <boxGeometry args={[w, height, depth]} />
          <meshStandardMaterial attach="material-0" color={color} roughness={0.6} />
          <meshStandardMaterial attach="material-1" color={color} roughness={0.6} />
          <meshStandardMaterial attach="material-2" color={color} roughness={0.6} />
          <meshStandardMaterial attach="material-3" color={color} roughness={0.6} />
          <meshStandardMaterial key={front?.uuid ?? "f"} attach="material-4" map={front} color={front ? "#FFFFFF" : color} roughness={0.55} />
          <meshStandardMaterial key={back?.uuid ?? "b"} attach="material-5" map={back ?? null} color={back ? "#FFFFFF" : color} roughness={0.55} />
        </mesh>
      </group>
    );
  }
  const bottomDepth = fmt === "pouch" ? d * 0.78 : 0;
  return (
    <group position={[0, height / 2, 0]} onClick={onClick ? (e) => (e.stopPropagation(), onClick()) : undefined}>
      <mesh geometry={geo!} castShadow receiveShadow>
        {mat(front)}
      </mesh>
      <mesh geometry={geo!} rotation={[0, Math.PI, 0]} castShadow receiveShadow>
        {mat(back ?? null)}
      </mesh>
      {fmt === "pouch" && (
        <mesh position={[0, -height / 2 + 0.002, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[w / 2, bottomDepth, 1]}>
          <circleGeometry args={[1, 32]} />
          <meshStandardMaterial color={color} roughness={0.6} />
        </mesh>
      )}
    </group>
  );
}

function ShelfPack({ item, height, x, picked, inspected, onPick }: { item: ShelfItem; height: number; x: number; picked: boolean; inspected: boolean; onPick?: (id: string) => void }) {
  const tex = useImageTex(item.src, item.crop);
  const g = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!g.current) return;
    g.current.position.z = THREE.MathUtils.damp(g.current.position.z, picked ? 0.16 : 0, 6, dt);
    g.current.rotation.y = THREE.MathUtils.damp(g.current.rotation.y, picked ? Math.sin(performance.now() / 900) * 0.35 : 0, 4, dt);
  });
  return (
    <group position={[x, 0, 0]} onPointerOver={hover(true)} onPointerOut={hover(false)} onClick={(e) => (e.stopPropagation(), onPick?.(item.id))}>
      <group ref={g}>
        <Pack3D front={tex} fmt={item.format} height={height} color="#DDD" />
      </group>
      {inspected && (
        <mesh position={[0, height + 0.04, 0.04]}>
          <sphereGeometry args={[0.022, 16, 12]} />
          <meshBasicMaterial color="#00A341" toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

function RetailShelf({ inspected, selected, onPick, oak }: { inspected: string[]; selected: string | null; onPick?: (id: string) => void; oak: THREE.Texture }) {
  const s = ST.shelf;
  const levels: { y: number; ids: string[]; h: number }[] = [
    { y: 1.56, ids: ["coffee-almond", "hazelnut", "orange-ginger", "vanilla"], h: 0.34 },
    { y: 1.06, ids: ["nut-mix", "sweet-crunchy", "seed-mix", "trail-mix"], h: 0.36 },
    { y: 0.56, ids: ["protein-chips", "protein-chips-pudina", "chickpea-puffs"], h: 0.36 },
    { y: 0.08, ids: ["millet-bhujia", "protein-bhujia", "millet-namkeen"], h: 0.38 },
  ];
  const talker = useMemo(
    () =>
      levels.map((l) =>
        textTex(
          [{ t: l.ids.map((id) => SHELF.find((x) => x.id === id)!.name.split(" · ")[0]).filter((v, i, a) => a.indexOf(v) === i).join("   ·   ").toUpperCase(), size: 30, weight: 800, color: "#FFFFFF" }],
          1600,
          64,
          "#2F1C1A",
        ),
      ),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );
  useEffect(() => () => talker.forEach((t) => t.dispose()), [talker]);
  const sign = useMemo(() => textTex([{ t: "EAT BETTER CO · PRODUCT SHELF", size: 46, weight: 800, color: "#FFFFFF" }], 1024, 96, "#FF5C00"), []);
  useEffect(() => () => sign.dispose(), [sign]);
  return (
    <group position={[s.pos[0], 0, s.pos[1]]} rotation={[0, s.rot, 0]}>
      {/* carcass */}
      <mesh position={[0, 1.05, -0.24]} receiveShadow>
        <boxGeometry args={[2.0, 2.1, 0.03]} />
        <meshStandardMaterial color="#FEE7D5" roughness={0.9} />
      </mesh>
      {[-1.0, 1.0].map((x) => (
        <mesh key={x} position={[x, 1.05, 0]} castShadow receiveShadow>
          <boxGeometry args={[0.04, 2.1, 0.5]} />
          <meshStandardMaterial map={oak} roughness={0.55} />
        </mesh>
      ))}
      {[0.06, 0.54, 1.04, 1.54, 2.08].map((y) => (
        <mesh key={y} position={[0, y, 0]} castShadow receiveShadow>
          <boxGeometry args={[1.98, 0.035, 0.5]} />
          <meshStandardMaterial map={oak} roughness={0.5} />
        </mesh>
      ))}
      {levels.map((l, li) => {
        const items = l.ids.map((id) => SHELF.find((x) => x.id === id)!);
        const widths = items.map((it) => (l.h * (it.crop[2] - it.crop[0])) / (it.crop[3] - it.crop[1]));
        const gap = (1.84 - widths.reduce((a, b) => a + b, 0)) / (items.length + 1);
        let x = -0.92 + gap;
        return (
          <group key={li} position={[0, l.y + 0.024, 0.02]}>
            {items.map((it, i) => {
              const cx = x + widths[i] / 2;
              x += widths[i] + gap;
              return <ShelfPack key={it.id} item={it} height={l.h} x={cx} picked={selected === it.id} inspected={inspected.includes(it.id)} onPick={onPick} />;
            })}
            <mesh position={[0, -0.03, 0.255]}>
              <planeGeometry args={[1.96, 0.075]} />
              <meshBasicMaterial map={talker[li]} toneMapped={false} />
            </mesh>
          </group>
        );
      })}
      <mesh position={[0, 2.28, -0.1]}>
        <planeGeometry args={[1.9, 0.18]} />
        <meshBasicMaterial map={sign} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ── story wall + mood board ────────────────────────────────────────────────────────────────────────── */

function Frame({ src, title, x, read, onPick }: { src: string; title: string; x: number; read: boolean; onPick?: () => void }) {
  const tex = useImageTex(src);
  const plaque = useMemo(() => textTex([{ t: title.toUpperCase(), size: 44, weight: 800, color: "#FFF5EE" }], 640, 96, read ? "#00A341" : "#2F1C1A"), [title, read]);
  useEffect(() => () => plaque.dispose(), [plaque]);
  const W = 0.86;
  const H = (W * 918) / 828;
  return (
    <group position={[x, 1.72, 0.03]} onClick={(e) => (e.stopPropagation(), onPick?.())} onPointerOver={hover(true)} onPointerOut={hover(false)}>
      <RoundedBox args={[W + 0.12, H + 0.12, 0.05]} radius={0.01} castShadow>
        <meshStandardMaterial color="#3B2418" roughness={0.45} />
      </RoundedBox>
      <mesh position={[0, 0, 0.026]}>
        <planeGeometry args={[W + 0.06, H + 0.06]} />
        <meshStandardMaterial color="#FBF7F2" roughness={0.9} />
      </mesh>
      <mesh position={[0, 0, 0.028]}>
        <planeGeometry args={[W, H]} />
        <meshStandardMaterial key={tex?.uuid ?? "none"} map={tex} color={tex ? "#FFFFFF" : "#DDD6CC"} roughness={0.6} />
      </mesh>
      <mesh position={[0, -H / 2 - 0.2, 0.01]}>
        <planeGeometry args={[0.7, 0.105]} />
        <meshBasicMaterial map={plaque} toneMapped={false} />
      </mesh>
    </group>
  );
}

function StoryWall({ stories, onStory }: { stories: string[]; onStory?: (id: string) => void }) {
  const s = ST.story;
  const head = useMemo(() => textTex([{ t: "OUR STORY", size: 52, weight: 800, color: "#FF5C00" }, { t: "Familiar Taste · Better Ingredients · Honest Processes", size: 30, weight: 600, color: "#2F1C1A" }], 1024, 160, "#F3EBE2"), []);
  useEffect(() => () => head.dispose(), [head]);
  return (
    <group position={[s.pos[0], 0, s.pos[1]]}>
      <mesh position={[0, 2.62, 0.02]}>
        <planeGeometry args={[2.4, 0.375]} />
        <meshBasicMaterial map={head} toneMapped={false} />
      </mesh>
      {STORY.map((st, i) => (
        <Frame key={st.id} src={st.img} title={st.name} x={(i - 1) * 1.12} read={stories.includes(st.id)} onPick={() => onStory?.(st.id)} />
      ))}
      {/* picture lights */}
      {[-1.12, 0, 1.12].map((x) => (
        <group key={x} position={[x, 2.32, 0.12]}>
          <mesh rotation={[0, 0, Math.PI / 2]}>
            <cylinderGeometry args={[0.025, 0.025, 0.4, 16]} />
            <meshStandardMaterial color="#C8963E" metalness={0.9} roughness={0.25} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function MoodBoard({ board }: { board: HTMLCanvasElement | null }) {
  const s = ST.board;
  const tex = useCanvasTex(board);
  return (
    <group position={[s.pos[0], 1.62, s.pos[1] + 0.04]}>
      <RoundedBox args={[2.28, 1.56, 0.05]} radius={0.01} castShadow>
        <meshStandardMaterial color="#2F1C1A" roughness={0.5} />
      </RoundedBox>
      <mesh position={[0, 0, 0.027]}>
        <planeGeometry args={[2.16, 1.44]} />
        {tex ? <meshStandardMaterial map={tex} roughness={0.85} /> : <meshStandardMaterial color="#C79D6B" />}
      </mesh>
    </group>
  );
}

/* ── furniture & equipment ──────────────────────────────────────────────────────────────────────────── */

function Monitor({ w, h, tex, position, rotation, standH = 0.22 }: { w: number; h: number; tex: THREE.Texture | null; position: [number, number, number]; rotation?: [number, number, number]; standH?: number }) {
  return (
    <group position={position} rotation={rotation}>
      <group position={[0, standH + h / 2, 0]}>
        <RoundedBox args={[w + 0.03, h + 0.03, 0.03]} radius={0.008} castShadow>
          <meshStandardMaterial color="#1C1C1E" metalness={0.4} roughness={0.35} />
        </RoundedBox>
        <mesh position={[0, 0, 0.0155]}>
          <planeGeometry args={[w, h]} />
          {tex ? <meshBasicMaterial map={tex} toneMapped={false} /> : <meshStandardMaterial color="#111" roughness={0.2} />}
        </mesh>
        <mesh position={[0, -0.02, -0.03]}>
          <boxGeometry args={[w * 0.5, h * 0.5, 0.04]} />
          <meshStandardMaterial color="#2A2A2C" roughness={0.5} />
        </mesh>
      </group>
      <mesh position={[0, standH / 2 + 0.01, -0.06]} castShadow>
        <boxGeometry args={[0.05, standH + 0.04, 0.025]} />
        <meshStandardMaterial color="#B9BCC2" metalness={0.85} roughness={0.25} />
      </mesh>
      <RoundedBox args={[0.26, 0.012, 0.18]} radius={0.005} position={[0, 0.006, -0.03]} castShadow>
        <meshStandardMaterial color="#B9BCC2" metalness={0.85} roughness={0.25} />
      </RoundedBox>
    </group>
  );
}

function Desk({ w = 1.8, d = 0.8, oak }: { w?: number; d?: number; oak: THREE.Texture }) {
  return (
    <group>
      <RoundedBox args={[w, 0.04, d]} radius={0.012} position={[0, 0.74, 0]} castShadow receiveShadow>
        <meshStandardMaterial map={oak} roughness={0.5} />
      </RoundedBox>
      {[-1, 1].map((sx) => (
        <group key={sx} position={[sx * (w / 2 - 0.1), 0, 0]}>
          <mesh position={[0, 0.36, 0]} castShadow>
            <boxGeometry args={[0.04, 0.72, d - 0.12]} />
            <meshStandardMaterial color="#232325" metalness={0.6} roughness={0.35} />
          </mesh>
          <mesh position={[0, 0.015, 0]}>
            <boxGeometry args={[0.07, 0.03, d - 0.06]} />
            <meshStandardMaterial color="#232325" metalness={0.6} roughness={0.35} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function OfficeChair({ position, rotation = 0 }: { position: [number, number, number]; rotation?: number }) {
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <RoundedBox args={[0.5, 0.08, 0.48]} radius={0.03} position={[0, 0.47, 0]} castShadow>
        <meshStandardMaterial color="#3C3F44" roughness={0.8} />
      </RoundedBox>
      <RoundedBox args={[0.46, 0.55, 0.06]} radius={0.03} position={[0, 0.82, 0.24]} rotation={[0.12, 0, 0]} castShadow>
        <meshStandardMaterial color="#3C3F44" roughness={0.8} />
      </RoundedBox>
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.025, 0.03, 0.4, 16]} />
        <meshStandardMaterial color="#9EA2A8" metalness={0.9} roughness={0.2} />
      </mesh>
      {Array.from({ length: 5 }, (_, i) => {
        const a = (i / 5) * Math.PI * 2;
        return (
          <group key={i} rotation={[0, a, 0]}>
            <mesh position={[0.15, 0.06, 0]} rotation={[0, 0, 0.12]}>
              <boxGeometry args={[0.3, 0.025, 0.04]} />
              <meshStandardMaterial color="#222" roughness={0.4} />
            </mesh>
            <mesh position={[0.29, 0.03, 0]}>
              <sphereGeometry args={[0.028, 12, 8]} />
              <meshStandardMaterial color="#111" roughness={0.3} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function Plant({ position, scale = 1 }: { position: [number, number, number]; scale?: number }) {
  const leaves = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => {
        const a = i * 2.4;
        const y = 0.55 + (i / 22) * 0.9;
        return { a, y, tilt: 0.5 + (i % 3) * 0.2, s: 0.16 + (i % 4) * 0.025 };
      }),
    [],
  );
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.22, 0]} castShadow>
        <cylinderGeometry args={[0.2, 0.15, 0.44, 24]} />
        <meshStandardMaterial color="#B5562E" roughness={0.85} />
      </mesh>
      <mesh position={[0, 0.43, 0]}>
        <cylinderGeometry args={[0.185, 0.185, 0.02, 24]} />
        <meshStandardMaterial color="#3A2A1E" roughness={1} />
      </mesh>
      <mesh position={[0, 0.9, 0]}>
        <cylinderGeometry args={[0.015, 0.02, 1.0, 8]} />
        <meshStandardMaterial color="#5B4630" />
      </mesh>
      {leaves.map((l, i) => (
        <group key={i} position={[0, l.y, 0]} rotation={[0, l.a, 0]}>
          <mesh position={[0.12, 0, 0]} rotation={[0, 0, -l.tilt]} scale={[l.s, l.s * 0.62, 0.02]} castShadow>
            <sphereGeometry args={[1, 16, 10]} />
            <meshStandardMaterial color={i % 2 ? "#2F6B2E" : "#3E8A3A"} roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Tripod({ height, color = "#1E1E20" }: { height: number; color?: string }) {
  // three legs from feet on the floor to one apex, then a centre column up to the head
  const legs = useMemo(() => {
    const apex = new THREE.Vector3(0, height * 0.56, 0);
    return [0, 1, 2].map((i) => {
      const a = (i / 3) * Math.PI * 2 + Math.PI / 6;
      const foot = new THREE.Vector3(Math.cos(a) * height * 0.24, 0, Math.sin(a) * height * 0.24);
      const dir = apex.clone().sub(foot);
      const len = dir.length();
      const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
      return { mid: foot.clone().add(apex).multiplyScalar(0.5), len, q };
    });
  }, [height]);
  return (
    <group>
      {legs.map((l, i) => (
        <mesh key={i} position={l.mid} quaternion={l.q} castShadow>
          <cylinderGeometry args={[0.011, 0.014, l.len, 8]} />
          <meshStandardMaterial color={color} metalness={0.7} roughness={0.35} />
        </mesh>
      ))}
      <mesh position={[0, height * 0.56, 0]}>
        <cylinderGeometry args={[0.03, 0.03, 0.05, 12]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.35} />
      </mesh>
      <mesh position={[0, height * 0.78, 0]} castShadow>
        <cylinderGeometry args={[0.014, 0.014, height * 0.44, 10]} />
        <meshStandardMaterial color={color} metalness={0.7} roughness={0.35} />
      </mesh>
    </group>
  );
}

/** A real studio softbox: octagonal diffuser on a light stand, with an actual light behind it. */
function Softbox({ position, target, light = true }: { position: [number, number, number]; target: [number, number, number]; light?: boolean }) {
  const head = useRef<THREE.Group>(null);
  const spot = useRef<THREE.SpotLight>(null);
  const tgt = useMemo(() => new THREE.Object3D(), []);
  useEffect(() => {
    head.current?.lookAt(new THREE.Vector3(...target));
    tgt.position.set(...target);
    tgt.updateMatrixWorld();
    if (spot.current) spot.current.target = tgt;
  }, [target, tgt]);
  return (
    <group>
      <group position={[position[0], 0, position[2]]}>
        <Tripod height={position[1]} />
      </group>
      <group ref={head} position={position}>
        {/* body: open octagonal cone pointing at the subject (+z after lookAt) */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0.16]}>
          <cylinderGeometry args={[0.5, 0.1, 0.36, 8, 1, true]} />
          <meshStandardMaterial color="#141414" roughness={0.7} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0, 0.34]}>
          <circleGeometry args={[0.49, 8]} />
          <meshStandardMaterial color="#FFFFFF" emissive="#FFF6EA" emissiveIntensity={1.6} toneMapped={false} />
        </mesh>
        <mesh position={[0, 0, -0.06]}>
          <boxGeometry args={[0.16, 0.16, 0.14]} />
          <meshStandardMaterial color="#2B2B2D" metalness={0.5} roughness={0.4} />
        </mesh>
      </group>
      {light && <spotLight ref={spot} position={position} angle={0.75} penumbra={1} intensity={9} distance={7} decay={1.4} color="#FFF4E6" />}
    </group>
  );
}

function CameraOnTripod({ position, target }: { position: [number, number, number]; target: [number, number, number] }) {
  const head = useRef<THREE.Group>(null);
  useEffect(() => head.current?.lookAt(new THREE.Vector3(...target)), [target]);
  return (
    <group>
      <group position={[position[0], 0, position[2]]}>
        <Tripod height={position[1] - 0.06} />
      </group>
      <group ref={head} position={position}>
        <RoundedBox args={[0.15, 0.1, 0.08]} radius={0.012} castShadow>
          <meshStandardMaterial color="#1A1A1A" roughness={0.55} />
        </RoundedBox>
        <RoundedBox args={[0.05, 0.085, 0.07]} radius={0.01} position={[0.065, -0.005, 0.01]}>
          <meshStandardMaterial color="#121212" roughness={0.8} />
        </RoundedBox>
        <mesh position={[0, 0.06, -0.005]}>
          <boxGeometry args={[0.05, 0.03, 0.05]} />
          <meshStandardMaterial color="#1A1A1A" roughness={0.5} />
        </mesh>
        <mesh position={[0, -0.005, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.036, 0.036, 0.13, 24]} />
          <meshStandardMaterial color="#202020" roughness={0.4} metalness={0.3} />
        </mesh>
        <mesh position={[0, -0.005, 0.15]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.04, 0.04, 0.02, 24]} />
          <meshStandardMaterial color="#C62828" roughness={0.4} />
        </mesh>
        <mesh position={[0, -0.005, 0.161]}>
          <circleGeometry args={[0.03, 24]} />
          <meshPhysicalMaterial color="#0B1A2A" roughness={0.05} metalness={0.2} clearcoat={1} />
        </mesh>
        <mesh position={[0, 0, -0.041]}>
          <planeGeometry args={[0.09, 0.06]} />
          <meshBasicMaterial color="#5A6A7A" />
        </mesh>
      </group>
    </group>
  );
}

/** Seamless paper backdrop: vertical sheet, curved sweep, floor run-out. */
function sweepGeometry(width: number, height: number, depth: number, r: number) {
  const segs = 48;
  const geo = new THREE.PlaneGeometry(width, 1, 1, segs);
  const pos = geo.attributes.position as THREE.BufferAttribute;
  const vertLen = height - r;
  const arcLen = (Math.PI / 2) * r;
  const floorLen = depth - r;
  const total = vertLen + arcLen + floorLen;
  for (let i = 0; i < pos.count; i++) {
    const t = (0.5 - pos.getY(i)) * total; // 0 at top
    let y: number;
    let z: number;
    if (t <= vertLen) {
      y = height - t;
      z = 0;
    } else if (t <= vertLen + arcLen) {
      const a = (t - vertLen) / r;
      y = r - Math.sin(a) * r;
      z = r - Math.cos(a) * r;
    } else {
      y = 0;
      z = r + (t - vertLen - arcLen);
    }
    pos.setY(i, y);
    pos.setZ(i, z);
  }
  geo.computeVertexNormals();
  return geo;
}

function Laddoo({ position, r, mats }: { position: [number, number, number]; r: number; mats: { laddooCol: THREE.Texture; laddooBump: THREE.Texture } }) {
  return (
    <mesh position={position} castShadow>
      <icosahedronGeometry args={[r, 4]} />
      <meshStandardMaterial map={mats.laddooCol} bumpMap={mats.laddooBump} bumpScale={0.6} roughness={0.85} />
    </mesh>
  );
}

function AlmondBowl({ position }: { position: [number, number, number] }) {
  const lathe = useMemo(() => {
    const pts = [new THREE.Vector2(0, 0), new THREE.Vector2(0.06, 0), new THREE.Vector2(0.075, 0.01), new THREE.Vector2(0.11, 0.05), new THREE.Vector2(0.125, 0.08), new THREE.Vector2(0.118, 0.082), new THREE.Vector2(0.1, 0.05), new THREE.Vector2(0.0, 0.035)];
    return new THREE.LatheGeometry(pts, 40);
  }, []);
  const almonds = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => {
        const a = i * 2.39;
        const d = Math.sqrt(i / 26) * 0.085;
        return { p: [Math.cos(a) * d, 0.07 + (0.085 - d) * 0.35, Math.sin(a) * d] as [number, number, number], r: [R() * 3, a, R()] as [number, number, number] };
      }),
    [],
  );
  useEffect(() => () => lathe.dispose(), [lathe]);
  return (
    <group position={position}>
      <mesh geometry={lathe} castShadow receiveShadow>
        <meshStandardMaterial color="#F2ECE3" roughness={0.35} side={THREE.DoubleSide} />
      </mesh>
      {almonds.map((al, i) => (
        <mesh key={i} position={al.p} rotation={al.r} scale={[0.012, 0.007, 0.021]} castShadow>
          <sphereGeometry args={[1, 10, 8]} />
          <meshStandardMaterial color="#B97A45" roughness={0.75} />
        </mesh>
      ))}
    </group>
  );
}

/* ── stations ───────────────────────────────────────────────────────────────────────────────────────── */

function PackDesk({ front, back, fmt, color, artboard, mats, spin }: { front: THREE.Texture | null; back: THREE.Texture | null; fmt: "sachet" | "pouch" | "box"; color: string; artboard: THREE.Texture | null; mats: ReturnType<typeof useMaterials>; spin: boolean }) {
  const s = ST.desk;
  const turn = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (turn.current && spin) turn.current.rotation.y += dt * 0.45;
  });
  const swatches = ["#FF5C00", "#FED300", "#550D10", "#35401D", "#AF4300", "#FEE7D5", color];
  const mat = useMemo(
    () =>
      canvasTex(
        (g, w, h) => {
          g.fillStyle = "#2E6B4E";
          g.fillRect(0, 0, w, h);
          g.strokeStyle = "rgba(255,255,255,0.35)";
          for (let i = 0; i <= 20; i++) {
            g.lineWidth = i % 5 ? 1 : 2;
            g.beginPath();
            g.moveTo((i * w) / 20, 0);
            g.lineTo((i * w) / 20, h);
            g.moveTo(0, (i * h) / 20);
            g.lineTo(w, (i * h) / 20);
            g.stroke();
          }
        },
        512,
        384,
      ),
    [],
  );
  useEffect(() => () => mat.dispose(), [mat]);
  const packH = fmt === "sachet" ? 0.36 : fmt === "box" ? 0.26 : 0.34;
  return (
    <group position={[s.pos[0], 0, s.pos[1]]} rotation={[0, s.rot, 0]}>
      <Desk w={2.0} d={0.85} oak={mats.oak} />
      <Monitor w={0.78} h={0.45} tex={artboard} position={[-0.32, 0.76, -0.2]} />
      {/* keyboard + mouse */}
      <RoundedBox args={[0.44, 0.018, 0.14]} radius={0.006} position={[-0.32, 0.77, 0.15]} castShadow>
        <meshStandardMaterial color="#D9DBDF" roughness={0.5} />
      </RoundedBox>
      <mesh position={[0.0, 0.775, 0.16]} scale={[0.032, 0.018, 0.05]} castShadow>
        <sphereGeometry args={[1, 16, 10]} />
        <meshStandardMaterial color="#E8E9EC" roughness={0.4} />
      </mesh>
      {/* cutting mat + turntable with the live pack */}
      <mesh position={[0.52, 0.762, 0.05]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[0.72, 0.54]} />
        <meshStandardMaterial map={mat} roughness={0.9} />
      </mesh>
      <mesh position={[0.52, 0.775, 0.0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.2, 0.21, 0.025, 48]} />
        <meshStandardMaterial color="#F4F4F2" roughness={0.3} metalness={0.1} />
      </mesh>
      <group ref={turn} position={[0.52, 0.79, 0.0]}>
        <Pack3D front={front} back={back} fmt={fmt} height={packH} color={color} />
      </group>
      {/* colour swatch fan */}
      <group position={[0.15, 0.765, 0.28]}>
        {swatches.map((c, i) => (
          <mesh key={i} position={[0, i * 0.002, 0]} rotation={[-Math.PI / 2, 0, -0.9 + i * 0.22]}>
            <boxGeometry args={[0.035, 0.2, 0.002]} />
            <meshStandardMaterial color={c} roughness={0.6} />
          </mesh>
        ))}
      </group>
      {/* pen cup */}
      <group position={[0.88, 0.76, -0.28]}>
        <mesh position={[0, 0.06, 0]} castShadow>
          <cylinderGeometry args={[0.045, 0.04, 0.12, 20, 1, true]} />
          <meshStandardMaterial color="#FF5C00" roughness={0.5} side={THREE.DoubleSide} />
        </mesh>
        {["#2F1C1A", "#FED300", "#35401D"].map((c, i) => (
          <mesh key={i} position={[(i - 1) * 0.018, 0.13, (i % 2) * 0.012]} rotation={[0.1 * (i - 1), 0, 0.12 * (i - 1)]}>
            <cylinderGeometry args={[0.005, 0.005, 0.17, 6]} />
            <meshStandardMaterial color={c} />
          </mesh>
        ))}
      </group>
      {/* desk lamp */}
      <group position={[-0.86, 0.76, -0.24]}>
        <mesh position={[0, 0.01, 0]}>
          <cylinderGeometry args={[0.08, 0.09, 0.02, 24]} />
          <meshStandardMaterial color="#2F1C1A" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0.06, 0.2, 0]} rotation={[0, 0, -0.5]}>
          <cylinderGeometry args={[0.008, 0.008, 0.42, 8]} />
          <meshStandardMaterial color="#2F1C1A" metalness={0.5} roughness={0.4} />
        </mesh>
        <mesh position={[0.2, 0.38, 0]} rotation={[0, 0, 0.9]}>
          <coneGeometry args={[0.06, 0.1, 20, 1, true]} />
          <meshStandardMaterial color="#2F1C1A" metalness={0.5} roughness={0.4} side={THREE.DoubleSide} />
        </mesh>
        <pointLight position={[0.24, 0.32, 0]} intensity={0.8} distance={1.4} color="#FFE2B8" />
      </group>
      <OfficeChair position={[-0.2, 0, 0.75]} rotation={0.2} />
    </group>
  );
}

function PhotoSet({ front, back, fmt, color, paper, mats }: { front: THREE.Texture | null; back: THREE.Texture | null; fmt: "sachet" | "pouch" | "box"; color: string; paper: string; mats: ReturnType<typeof useMaterials> }) {
  const s = ST.photo;
  const sweep = useMemo(() => sweepGeometry(2.6, 2.4, 1.8, 0.5), []);
  useEffect(() => () => sweep.dispose(), [sweep]);
  const packH = fmt === "sachet" ? 0.42 : fmt === "box" ? 0.3 : 0.4;
  const tableTop = 0.72;
  const target = useMemo(() => {
    const v = world(s, [0, tableTop + 0.2, 0.1]);
    return [v.x, v.y, v.z] as [number, number, number];
  }, [s]);
  const W = (l: [number, number, number]) => {
    const v = world(s, l);
    return [v.x, v.y, v.z] as [number, number, number];
  };
  return (
    <group>
      <group position={[s.pos[0], 0, s.pos[1]]} rotation={[0, s.rot, 0]}>
        {/* backdrop stands + roll */}
        {[-1.4, 1.4].map((x) => (
          <mesh key={x} position={[x, 1.3, -0.95]} castShadow>
            <cylinderGeometry args={[0.018, 0.018, 2.6, 10]} />
            <meshStandardMaterial color="#1E1E20" metalness={0.7} roughness={0.35} />
          </mesh>
        ))}
        <mesh position={[0, 2.55, -0.92]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.07, 0.07, 2.66, 24]} />
          <meshStandardMaterial color={paper} roughness={0.9} />
        </mesh>
        <mesh geometry={sweep} position={[0, 0.002, -0.9]} receiveShadow>
          <meshStandardMaterial color={paper} roughness={0.95} side={THREE.DoubleSide} />
        </mesh>
        {/* sweep table */}
        <RoundedBox args={[0.9, 0.04, 0.6]} radius={0.01} position={[0, tableTop, 0]} castShadow receiveShadow>
          <meshStandardMaterial color="#D8C2A8" roughness={0.7} />
        </RoundedBox>
        {[-0.38, 0.38].map((x) =>
          [-0.24, 0.24].map((z) => (
            <mesh key={`${x}${z}`} position={[x, tableTop / 2, z]}>
              <cylinderGeometry args={[0.015, 0.015, tableTop, 8]} />
              <meshStandardMaterial color="#C9CCD1" metalness={0.8} roughness={0.25} />
            </mesh>
          )),
        )}
        <group position={[0, tableTop + 0.02, 0]} rotation={[0, 0.25, 0]}>
          <Pack3D front={front} back={back} fmt={fmt} height={packH} color={color} />
        </group>
        <AlmondBowl position={[-0.28, tableTop + 0.02, 0.14]} />
        <Laddoo position={[0.24, tableTop + 0.055, 0.16]} r={0.035} mats={mats} />
        <Laddoo position={[0.32, tableTop + 0.055, 0.06]} r={0.035} mats={mats} />
        <Laddoo position={[0.18, tableTop + 0.052, 0.04]} r={0.032} mats={mats} />
        {/* reflector */}
        <group position={[1.0, 0, 0.55]}>
          <Tripod height={0.9} />
          <mesh position={[0, 1.0, 0]} rotation={[0, -0.9, 0]}>
            <circleGeometry args={[0.32, 32]} />
            <meshStandardMaterial color="#E7C46A" metalness={0.8} roughness={0.25} side={THREE.DoubleSide} />
          </mesh>
        </group>
      </group>
      <Softbox position={W([-1.15, 1.75, 0.9])} target={target} />
      <Softbox position={W([1.25, 1.6, 0.25])} target={target} light={false} />
      <CameraOnTripod position={W([0.05, 1.25, 1.55])} target={target} />
    </group>
  );
}

function CreativeScreen({ tex }: { tex: THREE.Texture | null }) {
  const s = ST.screens;
  return (
    <group position={[s.pos[0], 0, s.pos[1]]} rotation={[0, s.rot, 0]}>
      {/* rolling display stand */}
      {[-0.55, 0.55].map((x) => (
        <group key={x}>
          <mesh position={[x, 0.85, -0.06]} castShadow>
            <boxGeometry args={[0.06, 1.7, 0.04]} />
            <meshStandardMaterial color="#26282C" metalness={0.6} roughness={0.35} />
          </mesh>
          <mesh position={[x, 0.04, 0]}>
            <boxGeometry args={[0.08, 0.04, 0.7]} />
            <meshStandardMaterial color="#26282C" metalness={0.6} roughness={0.35} />
          </mesh>
          {[-0.3, 0.3].map((z) => (
            <mesh key={z} position={[x, 0.025, z]} rotation={[0, 0, Math.PI / 2]}>
              <cylinderGeometry args={[0.025, 0.025, 0.03, 12]} />
              <meshStandardMaterial color="#111" />
            </mesh>
          ))}
        </group>
      ))}
      <group position={[0, 1.45, 0]}>
        <RoundedBox args={[1.86, 1.07, 0.06]} radius={0.012} castShadow>
          <meshStandardMaterial color="#141416" metalness={0.4} roughness={0.35} />
        </RoundedBox>
        <mesh position={[0, 0, 0.031]}>
          <planeGeometry args={[1.8, 1.0125]} />
          {tex ? <meshBasicMaterial map={tex} toneMapped={false} /> : <meshStandardMaterial color="#0E0E10" roughness={0.15} />}
        </mesh>
      </group>
    </group>
  );
}

function DashboardWall({ tex, laptop, mats }: { tex: THREE.Texture | null; laptop: THREE.Texture | null; mats: ReturnType<typeof useMaterials> }) {
  const s = ST.dashboard;
  return (
    <group position={[s.pos[0], 0, s.pos[1]]} rotation={[0, s.rot, 0]}>
      {/* big wall display on a slim pedestal */}
      <mesh position={[0, 0.7, -0.35]} castShadow>
        <boxGeometry args={[0.12, 1.4, 0.08]} />
        <meshStandardMaterial color="#26282C" metalness={0.6} roughness={0.35} />
      </mesh>
      <mesh position={[0, 0.02, -0.35]}>
        <boxGeometry args={[0.8, 0.04, 0.5]} />
        <meshStandardMaterial color="#26282C" metalness={0.6} roughness={0.35} />
      </mesh>
      <group position={[0, 1.62, -0.3]}>
        <RoundedBox args={[2.08, 1.2, 0.06]} radius={0.012} castShadow>
          <meshStandardMaterial color="#141416" metalness={0.4} roughness={0.35} />
        </RoundedBox>
        <mesh position={[0, 0, 0.031]}>
          <planeGeometry args={[2.0, 1.125]} />
          {tex ? <meshBasicMaterial map={tex} toneMapped={false} /> : <meshStandardMaterial color="#0E0E10" />}
        </mesh>
      </group>
      {/* stand-up desk with a laptop */}
      <group position={[0, 0, 0.55]}>
        <Desk w={1.3} d={0.6} oak={mats.oak} />
        <group position={[0.1, 0.76, 0.02]}>
          <RoundedBox args={[0.34, 0.014, 0.23]} radius={0.004} castShadow>
            <meshStandardMaterial color="#C4C7CC" metalness={0.8} roughness={0.3} />
          </RoundedBox>
          <group position={[0, 0.007, -0.115]} rotation={[-0.3, 0, 0]}>
            <RoundedBox args={[0.34, 0.22, 0.01]} radius={0.004} position={[0, 0.11, 0]}>
              <meshStandardMaterial color="#C4C7CC" metalness={0.8} roughness={0.3} />
            </RoundedBox>
            <mesh position={[0, 0.11, 0.006]}>
              <planeGeometry args={[0.31, 0.19]} />
              {laptop ? <meshBasicMaterial map={laptop} toneMapped={false} /> : <meshBasicMaterial color="#222" />}
            </mesh>
          </group>
        </group>
        <mesh position={[-0.4, 0.82, 0]} castShadow>
          <cylinderGeometry args={[0.04, 0.035, 0.1, 20]} />
          <meshStandardMaterial color="#FFF5EE" roughness={0.3} />
        </mesh>
      </group>
    </group>
  );
}

/* ── room ───────────────────────────────────────────────────────────────────────────────────────────── */

function Room({ mats }: { mats: ReturnType<typeof useMaterials> }) {
  const sign = useMemo(() => textTex([{ t: "EAT BETTER CO", size: 120, weight: 900, color: "#FFFFFF" }, { t: "BRAND STUDIO", size: 56, weight: 700, color: "#FFE7D5" }], 1024, 320, "#FF5C00"), []);
  useEffect(() => () => sign.dispose(), [sign]);
  const floor = useMemo(() => {
    const t = mats.oak.clone();
    t.repeat.set(5, 4);
    t.needsUpdate = true;
    return t;
  }, [mats.oak]);
  useEffect(() => () => floor.dispose(), [floor]);
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[18, 15]} />
        <meshStandardMaterial map={floor} roughness={0.62} />
      </mesh>
      {/* rug under the desk */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[-2.4, 0.004, -1.9]} receiveShadow>
        <planeGeometry args={[3.0, 2.2]} />
        <meshStandardMaterial color="#E9D9C6" roughness={1} />
      </mesh>
      {/* back wall */}
      <mesh position={[0, 1.8, -6]} receiveShadow>
        <planeGeometry args={[18, 3.6]} />
        <meshStandardMaterial map={mats.plaster} roughness={0.95} />
      </mesh>
      <mesh position={[0, 0.06, -5.99]}>
        <planeGeometry args={[18, 0.12]} />
        <meshStandardMaterial color="#2F1C1A" />
      </mesh>
      {/* left wall with windows */}
      <mesh position={[-8.5, 1.8, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[15, 3.6]} />
        <meshStandardMaterial map={mats.plaster} roughness={0.95} />
      </mesh>
      {[-3.5, 0.5].map((z) => (
        <group key={z} position={[-8.48, 1.8, z]} rotation={[0, Math.PI / 2, 0]}>
          <mesh>
            <planeGeometry args={[2.6, 2.2]} />
            <meshStandardMaterial color="#DDEFFA" emissive="#CFE8F8" emissiveIntensity={0.9} />
          </mesh>
          {[-1.3, 0, 1.3].map((x) => (
            <mesh key={x} position={[x, 0, 0.02]}>
              <boxGeometry args={[0.06, 2.2, 0.04]} />
              <meshStandardMaterial color="#2F2F31" />
            </mesh>
          ))}
          {[-1.1, 0, 1.1].map((y) => (
            <mesh key={y} position={[0, y, 0.02]}>
              <boxGeometry args={[2.6, 0.06, 0.04]} />
              <meshStandardMaterial color="#2F2F31" />
            </mesh>
          ))}
        </group>
      ))}
      {/* right wall */}
      <mesh position={[8.5, 1.8, 0]} rotation={[0, -Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[15, 3.6]} />
        <meshStandardMaterial color="#F0E3D6" roughness={0.95} />
      </mesh>
      <mesh position={[5.6, 2.55, -5.98]}>
        <planeGeometry args={[2.6, 0.81]} />
        <meshBasicMaterial map={sign} toneMapped={false} />
      </mesh>
      {/* ceiling track lights */}
      {[-4, 0, 4].map((x) => (
        <group key={x} position={[x, 3.5, -1.5]}>
          <mesh>
            <boxGeometry args={[0.05, 0.04, 6]} />
            <meshStandardMaterial color="#1E1E20" />
          </mesh>
          {[-2, 0, 2].map((z) => (
            <mesh key={z} position={[0, -0.12, z]} rotation={[0.4, 0, 0]}>
              <cylinderGeometry args={[0.06, 0.05, 0.18, 16]} />
              <meshStandardMaterial color="#1E1E20" metalness={0.4} roughness={0.4} />
            </mesh>
          ))}
        </group>
      ))}
      <Plant position={[-7.7, 0, -5.4]} scale={1.15} />
      <Plant position={[0.3, 0, -5.5]} scale={0.95} />
      <Plant position={[7.8, 0, -5.4]} scale={1.1} />
    </group>
  );
}

/* ── camera ─────────────────────────────────────────────────────────────────────────────────────────── */

const OVERVIEW = { pos: new THREE.Vector3(-0.8, 6.8, 7.8), look: new THREE.Vector3(-0.8, 0.6, -2.2) };

function Rig({ focus, interactive }: { focus: Focus; interactive: boolean }) {
  const ref = useRef<CameraControls>(null);
  const { size } = useThree();
  useEffect(() => {
    let pos: THREE.Vector3;
    let look: THREE.Vector3;
    if (focus === "overview") {
      pos = OVERVIEW.pos.clone();
      look = OVERVIEW.look.clone();
    } else {
      const s = ST[focus];
      pos = world(s, s.cam);
      look = world(s, s.look);
    }
    // narrow screens keep the desktop distance; <FitFov /> widens the lens so the full desktop width stays in view
    const aspect = size.width / Math.max(1, size.height);
    const portrait = aspect < 1;
    // only desktop lays the task panel over the scene's right side
    const covered = typeof window !== "undefined" && window.innerWidth >= 1024;
    const dir = pos.clone().sub(look).multiplyScalar(1);
    // wide screens: the panel covers the right side, so slide the camera right and the station sits left of centre
    const right = new THREE.Vector3().crossVectors(dir.clone().negate(), new THREE.Vector3(0, 1, 0)).normalize();
    const shift = !covered || portrait ? 0 : dir.length() * (focus === "overview" ? 0.2 : (ST[focus].shift ?? 0.3));
    const p = look.clone().add(dir).addScaledVector(right, shift);
    const l = look.clone().addScaledVector(right, shift);
    if (portrait && focus !== "overview") {
      p.y += 0.15;
    }
    ref.current?.setLookAt(p.x, p.y, p.z, l.x, l.y, l.z, true);
  }, [focus, size.width, size.height]);
  return <CameraControls ref={ref} enabled={interactive} minDistance={0.6} maxDistance={14} maxPolarAngle={Math.PI / 2.05} smoothTime={0.7} />;
}

/* ── scene ──────────────────────────────────────────────────────────────────────────────────────────── */

export type StudioProps = {
  focus: Focus;
  interactive: boolean;
  packFront: HTMLCanvasElement | null;
  packBack: HTMLCanvasElement | null;
  packFmt: "sachet" | "pouch" | "box";
  packColor: string;
  paper: string;
  artboard: HTMLCanvasElement | null;
  creative: HTMLCanvasElement | null;
  dashboard: HTMLCanvasElement | null;
  board: HTMLCanvasElement | null;
  laptop: HTMLCanvasElement | null;
  inspected: string[];
  selected: string | null;
  stories: string[];
  onShelf?: (id: string) => void;
  onStory?: (id: string) => void;
};

function Scene(p: StudioProps) {
  const mats = useMaterials();
  const front = useCanvasTex(p.packFront);
  const back = useCanvasTex(p.packBack);
  const art = useCanvasTex(p.artboard);
  const creative = useCanvasTex(p.creative);
  const dash = useCanvasTex(p.dashboard);
  const laptop = useCanvasTex(p.laptop);
  return (
    <>
      <Rig focus={p.focus} interactive={p.interactive} />
      <Room mats={mats} />
      <RetailShelf inspected={p.inspected} selected={p.selected} onPick={p.onShelf} oak={mats.oak} />
      <StoryWall stories={p.stories} onStory={p.onStory} />
      <MoodBoard board={p.board} />
      <PackDesk front={front} back={back} fmt={p.packFmt} color={p.packColor} artboard={art} mats={mats} spin={p.focus !== "photo"} />
      <PhotoSet front={front} back={back} fmt={p.packFmt} color={p.packColor} paper={p.paper} mats={mats} />
      <CreativeScreen tex={creative} />
      <DashboardWall tex={dash} laptop={laptop} mats={mats} />
      <ContactShadows position={[0, 0.003, -1]} scale={18} opacity={0.35} blur={2.4} far={2} resolution={512} frames={1} />
    </>
  );
}

export default function Studio3D(p: StudioProps) {
  return (
    <Canvas shadows dpr={[1, 1.6]} camera={{ position: OVERVIEW.pos.toArray(), fov: 42, near: 0.05, far: 60 }} gl={{ antialias: true, preserveDrawingBuffer: true }} onPointerMissed={() => (document.body.style.cursor = "")}>
      <AsyncCompile />
      <FitFov />
      <color attach="background" args={["#EFE6DC"]} />
      <fog attach="fog" args={["#EFE6DC", 14, 30]} />
      <hemisphereLight args={["#FFF6EA", "#A88A6C", 0.75]} />
      <directionalLight position={[-7, 8, 4]} intensity={1.7} color="#FFF1DF" castShadow shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={8} shadow-camera-bottom={-8} />
      <Environment resolution={128} frames={1}>
        <Lightformer form="rect" intensity={2.4} color="#FFF4E6" position={[-4, 4, 4]} scale={[6, 3, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.4} color="#FFE2C4" position={[5, 2, 2]} scale={[2, 4, 1]} target={[0, 0, 0]} />
        <Lightformer form="rect" intensity={1.6} position={[0, 6, 0]} scale={[8, 8, 1]} rotation-x={Math.PI / 2} />
      </Environment>
      <Scene {...p} />
    </Canvas>
  );
}
