"use client";
/* eslint-disable react-hooks/immutability -- three.js objects, textures and the camera rig are updated in place by design */

import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useLoader, type ThreeEvent } from "@react-three/fiber";
import { C, CONVEYOR, Instances, useCanvasTexture, useLogo } from "./Warehouse";
import { MODULES } from "./modules";

/**
 * Outside the warehouse: warm daylight terrain and the path that continues from the conveyor belt to the five worlds
 * of the internship (01 Discover … 05 Build). Each world is a plaza on the path with props that say what the module is
 * about; clicking a world selects that module.
 */

export const WORLDS: [number, number][] = [
  [46, -4],
  [70, -27],
  [96, -10],
  [120, -33],
  [145, -14],
];

export const PATH = new THREE.CatmullRomCurve3(
  [
    [CONVEYOR.to - 1, CONVEYOR.z],
    [36, -4],
    ...WORLDS.flatMap(([x, z], i) => {
      // the path runs along the front of each plaza (worlds face +z), with a bend between them
      const front: [number, number] = [x, z + 7];
      const next = WORLDS[i + 1];
      return next ? [front, [(x + next[0]) / 2, (z + next[1]) / 2 + 8] as [number, number]] : [front, [x + 12, z + 9] as [number, number]];
    }),
  ].map(([x, z]) => new THREE.Vector3(x, 0, z)),
  false,
  "centripetal",
);

const fontOf = (v: string, fb: string) => (typeof document !== "undefined" ? getComputedStyle(document.documentElement).getPropertyValue(v).trim() || fb : fb);

/* ── ground, sky, hills, trees ── */

function Sky() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: { top: { value: new THREE.Color("#BFD9E6") }, mid: { value: new THREE.Color("#F3E6D6") }, bottom: { value: new THREE.Color("#F7DDC2") } },
        vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
        fragmentShader:
          "uniform vec3 top; uniform vec3 mid; uniform vec3 bottom; varying vec3 vP; void main(){ float h = vP.y; vec3 c = h > 0.0 ? mix(mid, top, smoothstep(0.02, 0.55, h)) : mix(mid, bottom, smoothstep(0.0, -0.2, h)); gl_FragColor = vec4(c, 1.0); }",
      }),
    [],
  );
  return (
    <mesh material={mat} position={[80, 0, -20]}>
      <sphereGeometry args={[420, 32, 16]} />
    </mesh>
  );
}

function Ground({ compact }: { compact: boolean }) {
  const tex = useCanvasTexture(
    1024,
    1024,
    (g) => {
      g.fillStyle = "#E7D3AF";
      g.fillRect(0, 0, 1024, 1024);
      // soft grass patches and sandy grain
      for (let i = 0; i < 70; i++) {
        const x = Math.random() * 1024;
        const y = Math.random() * 1024;
        const r = 40 + Math.random() * 120;
        const gr = g.createRadialGradient(x, y, 0, x, y, r);
        gr.addColorStop(0, "rgba(140,148,92,0.38)");
        gr.addColorStop(1, "rgba(140,148,92,0)");
        g.fillStyle = gr;
        g.fillRect(x - r, y - r, r * 2, r * 2);
      }
      for (let i = 0; i < 30000; i++) {
        g.fillStyle = `rgba(${Math.random() < 0.5 ? "90,70,40" : "255,250,235"},${Math.random() * 0.08})`;
        g.fillRect(Math.random() * 1024, Math.random() * 1024, 2, 2);
      }
    },
    [],
    [10, 8],
  );
  // trees and bushes scattered away from the path and the plazas
  const { trunks, crowns, hills } = useMemo(() => {
    const trunks: { p: [number, number, number]; s?: [number, number, number] }[] = [];
    const crowns: { p: [number, number, number]; s?: [number, number, number] }[] = [];
    let seed = 11;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const samples = PATH.getSpacedPoints(160);
    const clear = (x: number, z: number) => {
      if (x > -20 && x < 20 && z > -38 && z < 8) return false; // the warehouse
      if (samples.some((s) => Math.hypot(s.x - x, s.z - z) < 6)) return false;
      return !WORLDS.some(([wx, wz]) => Math.hypot(wx - x, wz - z) < 13);
    };
    const n = compact ? 70 : 150;
    for (let i = 0, tries = 0; i < n && tries < 4000; tries++) {
      const x = -40 + rnd() * 230;
      const z = -95 + rnd() * 130;
      if (!clear(x, z)) continue;
      const s = 0.8 + rnd() * 0.9;
      trunks.push({ p: [x, 1.1 * s, z], s: [s, s, s] });
      crowns.push({ p: [x, 2.9 * s, z], s: [1.6 * s, 1.9 * s, 1.6 * s] });
      i++;
    }
    const hills: { p: [number, number, number]; s?: [number, number, number] }[] = [];
    for (let i = 0; i < 9; i++) hills.push({ p: [-30 + i * 28 + rnd() * 10, -6, -110 - rnd() * 30], s: [30 + rnd() * 20, 14 + rnd() * 10, 18] });
    return { trunks, crowns, hills };
  }, [compact]);
  const trunkGeo = useMemo(() => new THREE.CylinderGeometry(0.16, 0.24, 2.2, 6), []);
  const crownGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 1), []);
  const hillGeo = useMemo(() => new THREE.SphereGeometry(1, 20, 12), []);
  const trunkMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#7A5636", roughness: 0.9 }), []);
  const crownMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#8C9457", roughness: 0.85, flatShading: true }), []);
  const hillMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#C9B98E", roughness: 1 }), []);
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[80, -0.02, -30]} receiveShadow>
        <planeGeometry args={[520, 360]} />
        <meshStandardMaterial map={tex} roughness={0.95} />
      </mesh>
      <Instances geometry={trunkGeo} material={trunkMat} items={trunks} />
      <Instances geometry={crownGeo} material={crownMat} items={crowns} />
      <Instances geometry={hillGeo} material={hillMat} items={hills} castShadow={false} />
    </group>
  );
}

/** the paved path: a ribbon along the curve with orange edges, like the conveyor it continues */
function Path() {
  const { road, edges } = useMemo(() => {
    const pts = PATH.getSpacedPoints(260);
    const ribbon = (half: number, y: number, offset = 0) => {
      const pos: number[] = [];
      const uv: number[] = [];
      const idx: number[] = [];
      let dist = 0;
      pts.forEach((p, i) => {
        const t = PATH.getTangentAt(i / (pts.length - 1));
        const n = new THREE.Vector3(-t.z, 0, t.x).normalize();
        if (i) dist += p.distanceTo(pts[i - 1]);
        for (const s of [-1, 1]) {
          const q = p.clone().addScaledVector(n, offset + s * half);
          pos.push(q.x, y, q.z);
          uv.push(s < 0 ? 0 : 1, dist / 3);
        }
        if (i) {
          const a = (i - 1) * 2;
          idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
        }
      });
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      g.setIndex(idx);
      g.computeVertexNormals();
      return g;
    };
    return { road: ribbon(1.6, 0.03), edges: [ribbon(0.12, 0.04, -1.65), ribbon(0.12, 0.04, 1.65)] };
  }, []);
  const tiles = useCanvasTexture(
    128,
    128,
    (g) => {
      g.fillStyle = "#EADBC0";
      g.fillRect(0, 0, 128, 128);
      g.strokeStyle = "rgba(150,110,70,0.35)";
      g.lineWidth = 3;
      g.strokeRect(0, 0, 64, 64);
      g.strokeRect(64, 64, 64, 64);
      g.strokeRect(64, 0, 64, 64);
      g.strokeRect(0, 64, 64, 64);
    },
    [],
  );
  tiles.wrapS = tiles.wrapT = THREE.RepeatWrapping;
  return (
    <group>
      <mesh geometry={road} receiveShadow>
        <meshStandardMaterial map={tiles} roughness={0.8} />
      </mesh>
      {edges.map((g, i) => (
        <mesh key={i} geometry={g}>
          <meshStandardMaterial color={C.orange} roughness={0.6} />
        </mesh>
      ))}
    </group>
  );
}

/* ── a module marker: a totem with the module number and word ── */

function Marker({ n, word, color }: { n: string; word: string; color: string }) {
  const tex = useCanvasTexture(
    256,
    512,
    (g) => {
      const head = fontOf("--font-fredoka", "sans-serif");
      g.fillStyle = "#FFF7EC";
      g.fillRect(0, 0, 256, 512);
      g.fillStyle = color;
      g.fillRect(0, 0, 256, 18);
      g.fillRect(0, 494, 256, 18);
      g.fillStyle = color;
      g.font = `700 150px ${head}`;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillText(n, 128, 190);
      g.fillStyle = C.cocoa;
      g.font = `700 44px ${head}`;
      g.fillText(word.toUpperCase(), 128, 350);
    },
    [n, word, color],
  );
  return (
    <group>
      <mesh position-y={2.2} castShadow>
        <boxGeometry args={[1.6, 4.4, 0.35]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {[0.19, -0.19].map((z) => (
        <mesh key={z} position={[0, 2.35, z]} rotation-y={z < 0 ? Math.PI : 0}>
          <planeGeometry args={[1.4, 2.8]} />
          <meshStandardMaterial map={tex} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

/* ── the five worlds ── */

function Discover() {
  const bowl = useMemo(() => new THREE.CylinderGeometry(0.55, 0.32, 0.32, 20), []);
  const laddoo = useMemo(() => new THREE.SphereGeometry(0.17, 12, 10), []);
  const brass = useMemo(() => new THREE.MeshStandardMaterial({ color: C.brass, roughness: 0.3, metalness: 0.8 }), []);
  const ladMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#B87A3A", roughness: 0.85 }), []);
  const balls: { p: [number, number, number] }[] = [];
  for (let b = 0; b < 4; b++) for (let k = 0; k < 6; k++) balls.push({ p: [-3 + b * 2 + Math.cos(k) * 0.22, 1.42 + (k > 3 ? 0.18 : 0), Math.sin(k * 1.7) * 0.2] });
  return (
    <group>
      {/* Jaipur-style arch */}
      <group position={[0, 0, -5]}>
        {[-2.8, 2.8].map((x) => (
          <mesh key={x} position={[x, 2.6, 0]} castShadow>
            <boxGeometry args={[1, 5.2, 1]} />
            <meshStandardMaterial color="#E59A7A" roughness={0.8} />
          </mesh>
        ))}
        <mesh position={[0, 5.1, 0]} castShadow>
          <torusGeometry args={[2.8, 0.5, 10, 24, Math.PI]} />
          <meshStandardMaterial color="#E59A7A" roughness={0.8} />
        </mesh>
      </group>
      {/* long table with brass bowls of laddoos */}
      <mesh position={[0, 0.9, 0]} castShadow receiveShadow>
        <boxGeometry args={[8.4, 0.18, 1.8]} />
        <meshStandardMaterial color={C.wood} roughness={0.7} />
      </mesh>
      {[-3.8, 3.8].map((x) => (
        <mesh key={x} position={[x, 0.45, 0]} castShadow>
          <boxGeometry args={[0.2, 0.9, 1.5]} />
          <meshStandardMaterial color="#8A5F38" roughness={0.8} />
        </mesh>
      ))}
      <Instances geometry={bowl} material={brass} items={[0, 1, 2, 3].map((b) => ({ p: [-3 + b * 2, 1.15, 0] as [number, number, number] }))} />
      <Instances geometry={laddoo} material={ladMat} items={balls} />
      {/* a big jar of laddoos */}
      <group position={[4.8, 0, 3]}>
        <mesh position-y={1.4} castShadow>
          <cylinderGeometry args={[1, 1, 2.8, 24]} />
          <meshStandardMaterial color="#FFF7EC" roughness={0.2} transparent opacity={0.5} />
        </mesh>
        <mesh position-y={2.95}>
          <cylinderGeometry args={[1.05, 1.05, 0.3, 24]} />
          <meshStandardMaterial color={C.orange} roughness={0.5} />
        </mesh>
        <Instances geometry={laddoo} material={ladMat} items={Array.from({ length: 30 }, (_, i) => ({ p: [Math.cos(i * 2.4) * 0.6, 0.3 + Math.floor(i / 8) * 0.32, Math.sin(i * 2.4) * 0.6] as [number, number, number], s: [2, 2, 2] as [number, number, number] }))} />
      </group>
    </group>
  );
}

const SHOTS = ["/brand/products/hazelnut-laddoo-1.webp", "/brand/products/marigold-hamper-2.webp", "/brand/products/laddoo-box-42-1.webp"];

function Create() {
  const texes = useLoader(THREE.TextureLoader, SHOTS);
  useMemo(() => texes.forEach((t) => (t.colorSpace = THREE.SRGBColorSpace)), [texes]);
  const post = useMemo(() => new THREE.MeshStandardMaterial({ color: C.oliveDark, roughness: 0.5, metalness: 0.4 }), []);
  return (
    <group>
      {/* curved studio backdrop */}
      <mesh position={[0, 0, -4.5]} rotation-y={Math.PI} receiveShadow>
        <cylinderGeometry args={[6, 6, 5, 24, 1, true, -0.9, 1.8]} />
        <meshStandardMaterial color={C.terracotta} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      {/* billboards with real product photos */}
      {texes.map((t, i) => (
        <group key={i} position={[-4.4 + i * 4.4, 0, -1.6 + (i === 1 ? -1 : 0)]} rotation-y={(1 - i) * 0.25}>
          <mesh material={post} position={[0, 1.4, -0.08]}>
            <boxGeometry args={[0.16, 2.8, 0.16]} />
          </mesh>
          <mesh position={[0, 3.6, 0]} castShadow>
            <boxGeometry args={[3.2, 3.2, 0.12]} />
            <meshStandardMaterial color="#fff" roughness={0.6} />
          </mesh>
          <mesh position={[0, 3.6, 0.07]}>
            <planeGeometry args={[3, 3]} />
            <meshStandardMaterial map={t} roughness={0.5} />
          </mesh>
        </group>
      ))}
      {/* a camera on a tripod and two softboxes */}
      <group position={[0.5, 0, 4]} rotation-y={Math.PI}>
        {[0, 2.1, 4.2].map((a) => (
          <mesh key={a} material={post} position={[Math.cos(a) * 0.35, 0.75, Math.sin(a) * 0.35]} rotation={[Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25]}>
            <cylinderGeometry args={[0.04, 0.04, 1.6, 6]} />
          </mesh>
        ))}
        <mesh position={[0, 1.7, 0]} castShadow>
          <boxGeometry args={[0.7, 0.5, 0.45]} />
          <meshStandardMaterial color={C.cocoa} roughness={0.4} />
        </mesh>
        <mesh position={[0, 1.7, 0.35]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.16, 0.2, 0.35, 16]} />
          <meshStandardMaterial color="#1a1412" roughness={0.3} metalness={0.4} />
        </mesh>
      </group>
      {[-3.6, 4.4].map((x, i) => (
        <group key={x} position={[x, 0, 2.6]} rotation-y={i ? -0.6 : 0.6}>
          <mesh material={post} position-y={1.2}>
            <cylinderGeometry args={[0.05, 0.05, 2.4, 6]} />
          </mesh>
          <mesh position-y={2.6} castShadow>
            <boxGeometry args={[1.2, 1.2, 0.3]} />
            <meshStandardMaterial color="#fff" emissive="#FFF4E2" emissiveIntensity={0.9} roughness={0.6} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function Operate() {
  const logo = useLogo();
  const side = useCanvasTexture(
    512,
    256,
    (g) => {
      g.fillStyle = "#F4E9D8";
      g.fillRect(0, 0, 512, 256);
      g.fillStyle = C.orange;
      g.fillRect(0, 220, 512, 36);
      g.drawImage(logo, 120, 100, 360, 200, 130, 30, 252, 140);
    },
    [logo],
  );
  const box = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const wheel = useMemo(() => new THREE.CylinderGeometry(0.42, 0.42, 0.3, 14), []);
  const tyre = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2a2422", roughness: 0.8 }), []);
  const crate = useMemo(() => new THREE.MeshStandardMaterial({ color: C.kraft, roughness: 0.9 }), []);
  const truck = (x: number, z: number, ry: number) => (
    <group position={[x, 0, z]} rotation-y={ry} key={`${x}${z}`}>
      <mesh position={[0, 1.75, 0]} castShadow>
        <boxGeometry args={[4.2, 2.3, 2.1]} />
        <meshStandardMaterial color="#F4E9D8" roughness={0.6} />
      </mesh>
      {[1.06, -1.06].map((dz) => (
        <mesh key={dz} position={[0, 1.75, dz]} rotation-y={dz > 0 ? 0 : Math.PI}>
          <planeGeometry args={[4.1, 2.2]} />
          <meshStandardMaterial map={side} roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[2.75, 1.25, 0]} castShadow>
        <boxGeometry args={[1.3, 1.6, 2]} />
        <meshStandardMaterial color={C.orange} roughness={0.5} />
      </mesh>
      <mesh position={[3.35, 1.55, 0]}>
        <boxGeometry args={[0.1, 0.7, 1.7]} />
        <meshStandardMaterial color="#3a4a52" roughness={0.1} metalness={0.4} />
      </mesh>
      <Instances geometry={wheel} material={tyre} items={[-1.3, 1.1, 2.75].flatMap((wx) => [1.02, -1.02].map((wz) => ({ p: [wx, 0.42, wz] as [number, number, number], r: [Math.PI / 2, 0, 0] as [number, number, number] })))} />
    </group>
  );
  return (
    <group>
      {/* the hub building */}
      <mesh position={[-1.5, 2.2, -4.6]} castShadow receiveShadow>
        <boxGeometry args={[9, 4.4, 4]} />
        <meshStandardMaterial color={C.cream} roughness={0.85} />
      </mesh>
      <mesh position={[-1.5, 4.6, -4.6]} castShadow>
        <boxGeometry args={[9.4, 0.4, 4.4]} />
        <meshStandardMaterial color={C.terracotta} roughness={0.8} />
      </mesh>
      {[-4, -1.5, 1].map((x) => (
        <mesh key={x} position={[x, 1.4, -2.58]}>
          <planeGeometry args={[2, 2.8]} />
          <meshStandardMaterial color={C.oliveDark} roughness={0.6} />
        </mesh>
      ))}
      {truck(-2.2, 1.2, 0.15)}
      {truck(4.2, -1.2, -0.7)}
      <Instances
        geometry={box}
        material={crate}
        items={[
          { p: [5.2, 0.4, 3.6], s: [0.8, 0.8, 0.8] },
          { p: [6.1, 0.4, 3.4], s: [0.8, 0.8, 0.8] },
          { p: [5.6, 1.2, 3.5], s: [0.8, 0.8, 0.8] },
        ]}
      />
    </group>
  );
}

function Strategize() {
  const windows = useCanvasTexture(
    64,
    128,
    (g) => {
      g.fillStyle = "#F1E3CC";
      g.fillRect(0, 0, 64, 128);
      g.fillStyle = "rgba(80,100,110,0.55)";
      for (let y = 8; y < 128; y += 16) for (let x = 8; x < 64; x += 20) g.fillRect(x, y, 10, 9);
    },
    [],
  );
  windows.wrapS = windows.wrapT = THREE.RepeatWrapping;
  const heights = [3, 4.6, 6.4, 8.6, 11.2];
  const cols = [C.cream, "#E8C9A8", C.cream, "#E8C9A8", C.terracotta];
  return (
    <group>
      {/* a skyline that rises like a growth chart */}
      {heights.map((h, i) => (
        <mesh key={i} position={[-5 + i * 2.5, h / 2, -4]} castShadow receiveShadow>
          <boxGeometry args={[2.1, h, 2.1]} />
          <meshStandardMaterial map={i === 4 ? undefined : windows} color={cols[i]} roughness={0.8} />
        </mesh>
      ))}
      {/* the growth arrow */}
      <group position={[0, 0, 1.6]} rotation={[0, 0, -0.85]}>
        <mesh position={[1.4, 3, 0]} castShadow>
          <boxGeometry args={[0.45, 6.6, 0.45]} />
          <meshStandardMaterial color={C.orange} roughness={0.5} />
        </mesh>
        <mesh position={[1.4, 6.7, 0]} castShadow>
          <coneGeometry args={[0.9, 1.4, 4]} />
          <meshStandardMaterial color={C.orange} roughness={0.5} />
        </mesh>
      </group>
      {/* a round meeting table */}
      <group position={[-3.6, 0, 3.4]}>
        <mesh position-y={0.8} castShadow receiveShadow>
          <cylinderGeometry args={[1.3, 1.3, 0.1, 24]} />
          <meshStandardMaterial color={C.wood} roughness={0.6} />
        </mesh>
        <mesh position-y={0.4}>
          <cylinderGeometry args={[0.12, 0.2, 0.8, 8]} />
          <meshStandardMaterial color={C.oliveDark} roughness={0.5} />
        </mesh>
        {[0, 1.57, 3.14, 4.71].map((a) => (
          <mesh key={a} position={[Math.cos(a) * 1.8, 0.45, Math.sin(a) * 1.8]} castShadow>
            <boxGeometry args={[0.55, 0.9, 0.55]} />
            <meshStandardMaterial color={C.olive} roughness={0.8} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

function Build() {
  const logo = useLogo();
  const shots = useLoader(THREE.TextureLoader, ["/brand/products/laddoo-box-24-0.webp", "/brand/products/diwali-hamper-0.webp", "/brand/products/laddoo-tin-0.webp"]);
  useMemo(() => shots.forEach((t) => (t.colorSpace = THREE.SRGBColorSpace)), [shots]);
  const awning = useCanvasTexture(256, 64, (g) => {
    for (let i = 0; i < 8; i++) {
      g.fillStyle = i % 2 ? "#FFF3E3" : C.orange;
      g.fillRect(i * 32, 0, 32, 64);
    }
  });
  const sign = useCanvasTexture(
    512,
    128,
    (g) => {
      g.fillStyle = C.cocoa;
      g.fillRect(0, 0, 512, 128);
      g.filter = "invert(1) brightness(1.2)";
      g.drawImage(logo, 120, 100, 360, 200, 166, 4, 180, 120);
      g.filter = "none";
    },
    [logo],
  );
  return (
    <group>
      <mesh position={[0, 2.5, -3.5]} castShadow receiveShadow>
        <boxGeometry args={[9, 5, 3.4]} />
        <meshStandardMaterial color={C.cream} roughness={0.85} />
      </mesh>
      <mesh position={[0, 4.4, -1.78]}>
        <planeGeometry args={[4.4, 1.1]} />
        <meshStandardMaterial map={sign} roughness={0.7} />
      </mesh>
      <mesh position={[0, 3.45, -1.1]} rotation-x={0.45} castShadow>
        <boxGeometry args={[8.6, 0.08, 1.6]} />
        <meshStandardMaterial map={awning} roughness={0.8} />
      </mesh>
      {/* display windows with real products */}
      {shots.map((t, i) => (
        <group key={i} position={[-2.9 + i * 2.9, 1.7, -1.78]}>
          <mesh position-z={-0.01}>
            <planeGeometry args={[2.4, 2.4]} />
            <meshStandardMaterial color={C.cocoa} roughness={0.6} />
          </mesh>
          <mesh position-z={0.01}>
            <planeGeometry args={[2.2, 2.2]} />
            <meshStandardMaterial map={t} roughness={0.4} />
          </mesh>
        </group>
      ))}
      {/* street lamps and a bench */}
      {[-5.6, 5.6].map((x) => (
        <group key={x} position={[x, 0, 0.8]}>
          <mesh position-y={1.8}>
            <cylinderGeometry args={[0.07, 0.09, 3.6, 8]} />
            <meshStandardMaterial color={C.oliveDark} roughness={0.5} metalness={0.4} />
          </mesh>
          <mesh position-y={3.7}>
            <sphereGeometry args={[0.28, 12, 10]} />
            <meshStandardMaterial color="#fff" emissive="#FFE3B8" emissiveIntensity={1.2} />
          </mesh>
        </group>
      ))}
      <mesh position={[3, 0.5, 2.4]} castShadow>
        <boxGeometry args={[2.2, 0.12, 0.6]} />
        <meshStandardMaterial color={C.wood} roughness={0.7} />
      </mesh>
    </group>
  );
}

const PROPS = [Discover, Create, Operate, Strategize, Build];

function World({ i, active, onPick }: { i: number; active: boolean; onPick?: (i: number) => void }) {
  const m = MODULES[i];
  const [x, z] = WORLDS[i];
  const [hover, setHover] = useState(false);
  const ring = useRef<THREE.Mesh>(null);
  const Props = PROPS[i];
  useFrame((_, dt) => {
    const r = ring.current;
    if (!r) return;
    const want = active || hover ? 1 : 0;
    const mat = r.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity += ((want ? 0.55 : 0) - mat.emissiveIntensity) * Math.min(1, dt * 5);
  });
  const pick = (e: ThreeEvent<MouseEvent>) => {
    if (!onPick) return;
    e.stopPropagation();
    onPick(i);
  };
  return (
    <group
      position={[x, 0, z]}
      onClick={pick}
      onPointerOver={(e) => {
        if (!onPick) return;
        e.stopPropagation();
        setHover(true);
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        setHover(false);
        document.body.style.cursor = "";
      }}
    >
      <mesh position-y={0.15} receiveShadow>
        <cylinderGeometry args={[10, 10.4, 0.3, 48]} />
        <meshStandardMaterial color="#F3E6D1" roughness={0.85} />
      </mesh>
      <mesh ref={ring} position-y={0.32} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[9.3, 9.9, 64]} />
        <meshStandardMaterial color={m.color} emissive={m.color} emissiveIntensity={0} roughness={0.6} />
      </mesh>
      <group position-y={0.3}>
        <Props />
        <group position={[-7.2, 0, 5.2]} rotation-y={0.5}>
          <Marker n={m.n} word={m.word} color={m.color} />
        </group>
      </group>
    </group>
  );
}

export function Worlds({ compact, active, onPick }: { compact: boolean; active: number; onPick?: (i: number) => void }) {
  return (
    <group>
      <Sky />
      <Ground compact={compact} />
      <Path />
      {MODULES.map((_, i) => (
        <World key={i} i={i} active={active === i} onPick={onPick} />
      ))}
    </group>
  );
}
