"use client";

import { useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { useFrame, useLoader, type ThreeEvent } from "@react-three/fiber";
import { C, Instances, useCanvasTexture, useLogo, type Place } from "./Warehouse";
import { MODULES } from "./modules";
import { WORLDS } from "./layout";
import { Nature } from "./Nature";
import { Crowd, Scooter, Van, Walkers, type PersonSpot } from "./Life";

export { WORLDS, PATH } from "./layout";

/**
 * Outside the warehouse: the countryside (Nature), people and traffic on the path (Life), and the five worlds of the
 * internship (01 Discover … 05 Build). Each world is a paved plaza on the path with a scene that says what the module
 * is about, full of people at work; clicking a world selects that module. Worlds face +z, towards the path.
 */

const fontOf = (v: string, fb: string) => (typeof document !== "undefined" ? getComputedStyle(document.documentElement).getPropertyValue(v).trim() || fb : fb);

/** a box mesh (most props are made of these) */
function B({ p, s, c, r, m, cast = true }: { p: [number, number, number]; s: [number, number, number]; c?: string; r?: [number, number, number]; m?: THREE.Material; cast?: boolean }) {
  return (
    <mesh position={p} rotation={r} castShadow={cast} receiveShadow material={m}>
      <boxGeometry args={s} />
      {!m && <meshStandardMaterial color={c} roughness={0.8} />}
    </mesh>
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
      <B p={[0, 0.2, 0]} s={[2.2, 0.4, 1]} c="#D9C29A" />
      <mesh position-y={2.4} castShadow>
        <boxGeometry args={[1.6, 4.4, 0.35]} />
        <meshStandardMaterial color={color} roughness={0.7} />
      </mesh>
      {[0.19, -0.19].map((z) => (
        <mesh key={z} position={[0, 2.55, z]} rotation-y={z < 0 ? Math.PI : 0}>
          <planeGeometry args={[1.4, 2.8]} />
          <meshStandardMaterial map={tex} roughness={0.8} />
        </mesh>
      ))}
    </group>
  );
}

/* shared bits */

function Pot({ p, s = 1 }: { p: [number, number, number]; s?: number }) {
  return (
    <group position={p} scale={s}>
      <mesh position-y={0.35} castShadow>
        <cylinderGeometry args={[0.42, 0.3, 0.7, 14]} />
        <meshStandardMaterial color={C.terracotta} roughness={0.85} />
      </mesh>
      <mesh position-y={0.95} castShadow>
        <icosahedronGeometry args={[0.55, 1]} />
        <meshStandardMaterial color="#6F7D3E" roughness={0.9} flatShading />
      </mesh>
    </group>
  );
}

/** bunting: little flags strung between two points */
function Bunting({ a, b, sag = 0.8 }: { a: [number, number, number]; b: [number, number, number]; sag?: number }) {
  const items = useMemo(() => {
    const cols = ["#FF5C00", "#F5C02A", "#E2507A", "#2F7F86", "#FFF1E0"];
    const out: Place[] = [];
    const n = 16;
    for (let i = 1; i < n; i++) {
      const k = i / n;
      out.push({ p: [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k - Math.sin(Math.PI * k) * sag - 0.2, a[2] + (b[2] - a[2]) * k], r: [0, Math.atan2(b[0] - a[0], b[2] - a[2]) + Math.PI / 2, Math.PI], c: cols[i % cols.length] });
    }
    return out;
  }, [a, b, sag]);
  const geo = useMemo(() => new THREE.ConeGeometry(0.2, 0.42, 3), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fff", roughness: 0.8, side: THREE.DoubleSide }), []);
  return <Instances geometry={geo} material={mat} items={items} castShadow={false} />;
}

/** a string of small warm bulbs */
function Lights({ a, b, sag = 0.6 }: { a: [number, number, number]; b: [number, number, number]; sag?: number }) {
  const items = useMemo(() => {
    const out: Place[] = [];
    const n = 18;
    for (let i = 1; i < n; i++) {
      const k = i / n;
      out.push({ p: [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k - Math.sin(Math.PI * k) * sag, a[2] + (b[2] - a[2]) * k] });
    }
    return out;
  }, [a, b, sag]);
  const geo = useMemo(() => new THREE.SphereGeometry(0.09, 8, 6), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fff", emissive: "#FFD59A", emissiveIntensity: 1.6 }), []);
  return <Instances geometry={geo} material={mat} items={items} castShadow={false} />;
}

function Truck({ p, ry }: { p: [number, number, number]; ry: number }) {
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
  const wheel = useMemo(() => new THREE.CylinderGeometry(0.42, 0.42, 0.3, 14), []);
  const tyre = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2a2422", roughness: 0.8 }), []);
  return (
    <group position={p} rotation-y={ry}>
      <B p={[0, 1.75, 0]} s={[4.2, 2.3, 2.1]} c="#F4E9D8" />
      {[1.06, -1.06].map((dz) => (
        <mesh key={dz} position={[0, 1.75, dz]} rotation-y={dz > 0 ? 0 : Math.PI}>
          <planeGeometry args={[4.1, 2.2]} />
          <meshStandardMaterial map={side} roughness={0.6} />
        </mesh>
      ))}
      <B p={[2.75, 1.25, 0]} s={[1.3, 1.6, 2]} c={C.orange} />
      <B p={[3.42, 1.55, 0]} s={[0.05, 0.7, 1.7]} c="#35464E" />
      <B p={[0, 0.5, 0]} s={[5.4, 0.25, 1.6]} c="#3a3330" />
      {[-1.3, 1.1, 2.75].flatMap((wx) => [1.02, -1.02].map((wz) => <mesh key={`${wx}${wz}`} geometry={wheel} material={tyre} position={[wx, 0.42, wz]} rotation-x={Math.PI / 2} />))}
    </group>
  );
}

/* ── 01 Discover: a Jaipur courtyard where the story began ── */

function Discover() {
  const pink = useMemo(() => new THREE.MeshStandardMaterial({ color: "#E7A189", roughness: 0.85 }), []);
  const trim = useMemo(() => new THREE.MeshStandardMaterial({ color: "#F6E3C9", roughness: 0.8 }), []);
  const shade = useMemo(() => new THREE.MeshStandardMaterial({ color: "#8E4B3A", roughness: 0.9 }), []);
  const brass = useMemo(() => new THREE.MeshStandardMaterial({ color: C.brass, roughness: 0.3, metalness: 0.8 }), []);
  const ladMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#B87A3A", roughness: 0.85 }), []);
  const bowl = useMemo(() => new THREE.CylinderGeometry(0.55, 0.32, 0.32, 20), []);
  const laddoo = useMemo(() => new THREE.SphereGeometry(0.17, 12, 10), []);
  const balls = useMemo(() => {
    const out: Place[] = [];
    for (let b = 0; b < 4; b++) for (let k = 0; k < 6; k++) out.push({ p: [-3 + b * 2 + Math.cos(k) * 0.22, 1.42 + (k > 3 ? 0.18 : 0), Math.sin(k * 1.7) * 0.2] });
    return out;
  }, []);
  const people: PersonSpot[] = useMemo(
    () => [
      { x: -3.5, z: 1.4, ry: Math.PI },
      { x: -1.2, z: 1.5, ry: Math.PI },
      { x: 1.4, z: 1.4, ry: Math.PI },
      { x: 3.4, z: -1.4, ry: 0 },
      { x: -2.2, z: -1.5, ry: 0 },
      { x: 5.9, z: 1.2, ry: -2.2 },
      { x: 6.6, z: 2.1, ry: -2.6, s: 0.72 },
      { x: -6.2, z: 2.6, ry: 1.2 },
    ],
    [],
  );
  return (
    <group>
      {/* the haveli wall: three arches, a jharokha balcony and two chhatris */}
      <group position={[0, 0, -6.4]}>
        <mesh material={pink} position={[0, 3.2, 0]} castShadow receiveShadow>
          <boxGeometry args={[15, 6.4, 1]} />
        </mesh>
        {[-4.6, 0, 4.6].map((x) => (
          <group key={x} position={[x, 0, 0.51]}>
            <mesh material={shade} position={[0, 1.6, 0]}>
              <planeGeometry args={[2.2, 3.2]} />
            </mesh>
            <mesh material={shade} position={[0, 3.2, 0]}>
              <circleGeometry args={[1.1, 20, 0, Math.PI]} />
            </mesh>
            <mesh material={trim} position={[0, 3.2, 0.02]}>
              <ringGeometry args={[1.1, 1.32, 24, 1, 0, Math.PI]} />
            </mesh>
          </group>
        ))}
        <B p={[0, 6.55, 0.1]} s={[15.4, 0.3, 1.3]} m={trim} />
        <group position={[0, 4.6, 0.9]}>
          <B p={[0, 0, 0]} s={[3, 0.25, 1.1]} m={trim} />
          <B p={[0, 1, 0.45]} s={[2.6, 1.6, 0.12]} m={shade} cast={false} />
          {[-1.3, 1.3].map((x) => (
            <B key={x} p={[x, 1, 0.45]} s={[0.18, 1.8, 0.18]} m={trim} />
          ))}
          <mesh material={trim} position={[0, 2.1, 0.2]} castShadow>
            <sphereGeometry args={[1, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
          </mesh>
        </group>
        {[-7, 7].map((x) => (
          <group key={x} position={[x, 6.7, 0]}>
            {[-0.5, 0.5].flatMap((dx) => [-0.5, 0.5].map((dz) => <B key={`${dx}${dz}`} p={[dx, 0.6, dz]} s={[0.14, 1.2, 0.14]} m={trim} />))}
            <mesh material={trim} position-y={1.25} castShadow>
              <sphereGeometry args={[0.85, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
            </mesh>
          </group>
        ))}
      </group>
      {/* long table with brass bowls of laddoos */}
      <B p={[0, 0.9, 0]} s={[8.4, 0.18, 1.8]} c={C.wood} />
      {[-3.8, 3.8].map((x) => (
        <B key={x} p={[x, 0.45, 0]} s={[0.2, 0.9, 1.5]} c="#8A5F38" />
      ))}
      <Instances geometry={bowl} material={brass} items={[0, 1, 2, 3].map((b) => ({ p: [-3 + b * 2, 1.15, 0] as [number, number, number] }))} />
      <Instances geometry={laddoo} material={ladMat} items={balls} />
      {/* the big laddoo jar and a hand cart of crates */}
      <group position={[5.2, 0, 3.4]}>
        <mesh position-y={1.4} castShadow>
          <cylinderGeometry args={[1, 1, 2.8, 24]} />
          <meshStandardMaterial color="#FFF7EC" roughness={0.15} transparent opacity={0.45} />
        </mesh>
        <B p={[0, 2.95, 0]} s={[2.1, 0.3, 2.1]} c={C.orange} />
        <Instances geometry={laddoo} material={ladMat} items={Array.from({ length: 30 }, (_, i) => ({ p: [Math.cos(i * 2.4) * 0.6, 0.3 + Math.floor(i / 8) * 0.32, Math.sin(i * 2.4) * 0.6] as [number, number, number], s: [2, 2, 2] as [number, number, number] }))} />
      </group>
      <group position={[-6, 0, 0.5]} rotation-y={0.4}>
        <B p={[0, 0.9, 0]} s={[2.4, 0.15, 1.3]} c={C.wood} />
        <B p={[0.3, 1.25, 0]} s={[0.9, 0.55, 0.8]} c={C.kraft} />
        <B p={[-0.6, 1.2, 0.1]} s={[0.7, 0.45, 0.7]} c={C.kraft} />
        {[-0.75, 0.75].map((z) => (
          <mesh key={z} position={[-0.4, 0.5, z]} rotation-x={Math.PI / 2}>
            <torusGeometry args={[0.45, 0.07, 6, 18]} />
            <meshStandardMaterial color="#5A4130" roughness={0.8} />
          </mesh>
        ))}
      </group>
      {[-7.4, 7.4].map((x) => (
        <B key={x} p={[x, 2.4, 4.4]} s={[0.12, 4.8, 0.12]} c={C.oliveDark} />
      ))}
      <Bunting a={[-7.4, 4.6, 4.4]} b={[7.4, 4.6, 4.4]} />
      <Bunting a={[-7.4, 4.6, 4.4]} b={[-3, 6.4, -6]} sag={0.4} />
      <Bunting a={[7.4, 4.6, 4.4]} b={[3, 6.4, -6]} sag={0.4} />
      <Pot p={[-7.4, 0, -4.4]} s={1.2} />
      <Pot p={[7.6, 0, -4.4]} s={1.2} />
      <Pot p={[-2.6, 0, -5.4]} />
      <Pot p={[2.6, 0, -5.4]} />
      <Crowd people={people} seed={3} />
    </group>
  );
}

/* ── 02 Create: a brand photo studio ── */

const SHOTS = ["/brand/products/hazelnut-laddoo-1.webp", "/brand/products/marigold-hamper-2.webp", "/brand/products/laddoo-box-42-1.webp"];

function Create() {
  const texes = useLoader(THREE.TextureLoader, SHOTS);
  useMemo(() => texes.forEach((t) => (t.colorSpace = THREE.SRGBColorSpace)), [texes]);
  const post = useMemo(() => new THREE.MeshStandardMaterial({ color: C.oliveDark, roughness: 0.5, metalness: 0.4 }), []);
  const crew: PersonSpot[] = useMemo(
    () => [
      { x: 0.4, z: 4.9, ry: Math.PI },
      { x: 2.2, z: 4.2, ry: Math.PI - 0.4 },
      { x: -2.6, z: 3.6, ry: Math.PI + 0.5 },
      { x: -0.8, z: 0.4, ry: 0.2 },
      { x: 5.8, z: 3.4, ry: -2.4 },
      { x: -6.2, z: 4.8, ry: 2.6 },
    ],
    [],
  );
  return (
    <group>
      <mesh position={[0, 3, -4.6]} rotation-y={Math.PI} receiveShadow>
        <cylinderGeometry args={[7, 7, 6, 32, 1, true, -1, 2]} />
        <meshStandardMaterial color={C.terracotta} roughness={0.9} side={THREE.DoubleSide} />
      </mesh>
      <B p={[0, 0.15, -1.8]} s={[9, 0.3, 4.6]} c="#F2E2CC" />
      {texes.map((t, i) => (
        <group key={i} position={[-4.6 + i * 4.6, 0.3, -2.4 + (i === 1 ? -1.2 : 0)]} rotation-y={(1 - i) * 0.28}>
          <mesh material={post} position={[0, 1.4, -0.1]}>
            <boxGeometry args={[0.16, 2.8, 0.16]} />
          </mesh>
          <B p={[0, 3.6, 0]} s={[3.2, 3.2, 0.12]} c="#fff" />
          <mesh position={[0, 3.6, 0.07]}>
            <planeGeometry args={[3, 3]} />
            <meshStandardMaterial map={t} roughness={0.5} />
          </mesh>
        </group>
      ))}
      <group position={[0, 0.3, -0.6]}>
        <B p={[0, 0.45, 0]} s={[1.6, 0.9, 1]} c="#FFF7EC" />
        <B p={[-0.3, 1.1, 0]} s={[0.6, 0.4, 0.5]} c={C.orange} />
        <B p={[0.35, 1.05, 0.1]} s={[0.5, 0.3, 0.4]} c="#7A1E12" />
        <mesh position={[1.9, 1.8, 0.6]} rotation-y={-0.6}>
          <torusGeometry args={[0.55, 0.06, 8, 32]} />
          <meshStandardMaterial color="#fff" emissive="#FFF2DF" emissiveIntensity={1.2} />
        </mesh>
        <mesh material={post} position={[1.9, 0.6, 0.6]}>
          <cylinderGeometry args={[0.04, 0.04, 1.2, 6]} />
        </mesh>
      </group>
      <group position={[0.5, 0, 4]} rotation-y={Math.PI}>
        {[0, 2.1, 4.2].map((a) => (
          <mesh key={a} material={post} position={[Math.cos(a) * 0.35, 0.75, Math.sin(a) * 0.35]} rotation={[Math.sin(a) * 0.25, 0, -Math.cos(a) * 0.25]}>
            <cylinderGeometry args={[0.04, 0.04, 1.6, 6]} />
          </mesh>
        ))}
        <B p={[0, 1.7, 0]} s={[0.7, 0.5, 0.45]} c={C.cocoa} />
        <mesh position={[0, 1.7, 0.35]} rotation-x={Math.PI / 2}>
          <cylinderGeometry args={[0.16, 0.2, 0.35, 16]} />
          <meshStandardMaterial color="#1a1412" roughness={0.3} metalness={0.4} />
        </mesh>
      </group>
      <group position={[-4.2, 0, 2.4]} rotation-y={0.5}>
        <B p={[0, 1.4, 0]} s={[0.3, 2.8, 0.3]} m={post} />
        <B p={[0.8, 3.1, 0]} s={[4.2, 0.18, 0.18]} r={[0, 0, 0.25]} m={post} />
        <B p={[2.7, 3.6, 0]} s={[0.5, 0.4, 0.4]} c={C.cocoa} />
        <B p={[-1.1, 2.6, 0]} s={[0.5, 0.5, 0.5]} c="#555" />
      </group>
      {[-5.6, 5.4].map((x, i) => (
        <group key={x} position={[x, 0, 0.6]} rotation-y={i ? -0.7 : 0.7}>
          <mesh material={post} position-y={1.2}>
            <cylinderGeometry args={[0.05, 0.05, 2.4, 6]} />
          </mesh>
          <mesh position-y={2.6} castShadow>
            <boxGeometry args={[1.3, 1.3, 0.35]} />
            <meshStandardMaterial color="#fff" emissive="#FFF4E2" emissiveIntensity={1} roughness={0.6} />
          </mesh>
        </group>
      ))}
      <Crowd people={crew} seed={8} />
    </group>
  );
}

/* ── 03 Operate: the distribution hub ── */

const STACK_SPOTS: [number, number, number][] = [
  [5.6, 2.8, 3],
  [7, 2.2, 2],
  [6.2, 4, 2],
  [-7.6, 2.6, 3],
];

function Operate() {
  const logo = useLogo();
  const shutter = useCanvasTexture(64, 128, (g) => {
    g.fillStyle = "#B9B2A6";
    g.fillRect(0, 0, 64, 128);
    g.fillStyle = "rgba(0,0,0,0.18)";
    for (let y = 0; y < 128; y += 6) g.fillRect(0, y, 64, 2);
  });
  const sign = useCanvasTexture(
    512,
    160,
    (g) => {
      g.fillStyle = "#FFF7EC";
      g.fillRect(0, 0, 512, 160);
      g.drawImage(logo, 120, 100, 360, 200, 156, 10, 200, 140);
    },
    [logo],
  );
  const box = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const crate = useMemo(() => new THREE.MeshStandardMaterial({ color: C.kraft, roughness: 0.9 }), []);
  const pallet = useMemo(() => new THREE.MeshStandardMaterial({ color: C.wood, roughness: 0.9 }), []);
  const { stacks, pallets } = useMemo(() => {
    const stacks: Place[] = [];
    const pallets: Place[] = [];
    for (const [x, z, n] of STACK_SPOTS) {
      pallets.push({ p: [x, 0.08, z], s: [1.4, 0.16, 1.1] });
      for (let k = 0; k < n; k++) for (const dx of [-0.32, 0.32]) stacks.push({ p: [x + dx, 0.4 + k * 0.5, z], s: [0.6, 0.48, 0.9] });
    }
    return { stacks, pallets };
  }, []);
  const crew: PersonSpot[] = useMemo(
    () => [
      { x: 4.6, z: 1.6, ry: 2.4 },
      { x: -3.2, z: 1.6, ry: -0.6 },
      { x: 0.8, z: 0.4, ry: 0.4 },
      { x: -6, z: 3.8, ry: 1.2 },
      { x: 7.6, z: 4.6, ry: -2.2 },
    ],
    [],
  );
  return (
    <group>
      <B p={[0, 2.6, -5]} s={[15, 5.2, 4.2]} c={C.cream} />
      <B p={[0, 5.4, -5]} s={[15.4, 0.4, 4.6]} c={C.terracotta} />
      <B p={[0, 3.7, -2.4]} s={[15, 0.15, 1.6]} c={C.oliveDark} />
      <mesh position={[0, 4.6, -2.88]}>
        <planeGeometry args={[4.2, 1.3]} />
        <meshStandardMaterial map={sign} roughness={0.7} />
      </mesh>
      {[-4.4, 0, 4.4].map((x) => (
        <group key={x}>
          <mesh position={[x, 1.6, -2.88]}>
            <planeGeometry args={[3, 3.2]} />
            <meshStandardMaterial map={shutter} roughness={0.6} metalness={0.3} />
          </mesh>
          <B p={[x, 0.5, -2.4]} s={[3.2, 1, 0.9]} c="#C9B79A" />
        </group>
      ))}
      <Truck p={[-4.4, 0, 1.4]} ry={Math.PI / 2} />
      <Van position={[4.4, 0, 0.6]} ry={Math.PI} />
      <group position={[1.2, 0, 2.6]} rotation-y={-0.5}>
        <B p={[0, 0.7, 0]} s={[1.1, 0.9, 1.6]} c="#D9A030" />
        <B p={[0, 1.5, -0.2]} s={[1, 0.08, 1]} c="#3a3330" />
        {[-0.45, 0.45].map((x) => (
          <B key={x} p={[x, 1.1, -0.2]} s={[0.06, 0.8, 0.06]} c="#3a3330" />
        ))}
        <B p={[0, 1.2, 1.05]} s={[1, 2, 0.12]} c="#3a3330" />
        <B p={[0, 0.35, 1.5]} s={[0.9, 0.1, 1]} m={pallet} />
        <B p={[0, 0.7, 1.5]} s={[0.8, 0.6, 0.8]} m={crate} />
        {[-0.55, 0.55].flatMap((x) =>
          [-0.5, 0.5].map((z) => (
            <mesh key={`${x}${z}`} position={[x, 0.25, z]} rotation-z={Math.PI / 2}>
              <cylinderGeometry args={[0.25, 0.25, 0.2, 12]} />
              <meshStandardMaterial color="#2a2422" roughness={0.8} />
            </mesh>
          )),
        )}
      </group>
      <Instances geometry={box} material={pallet} items={pallets} />
      <Instances geometry={box} material={crate} items={stacks} />
      {[-1.8, -0.9, 0].map((x, i) => (
        <Scooter key={x} position={[x - 6.2, 0, -1.2]} ry={0.1 * i} />
      ))}
      <Crowd people={crew} seed={14} />
    </group>
  );
}

/* ── 04 Strategize: the city block where growth plans are made ── */

const BLOCKS: { p: [number, number]; w: number; h: number; c: string; glassy?: boolean }[] = [
  { p: [-6.6, -5], w: 2.4, h: 4, c: C.cream },
  { p: [-4, -5.4], w: 2.6, h: 6.2, c: "#E8C9A8" },
  { p: [-1.2, -5.6], w: 2.8, h: 8.4, c: C.cream },
  { p: [1.8, -5.6], w: 3, h: 13.5, c: "#8FB0BC", glassy: true },
  { p: [4.8, -5.2], w: 2.6, h: 10, c: "#E8C9A8" },
  { p: [7.2, -4.6], w: 2.2, h: 6.6, c: C.terracotta },
];

function Strategize() {
  const windows = useCanvasTexture(
    64,
    128,
    (g) => {
      g.fillStyle = "#F1E3CC";
      g.fillRect(0, 0, 64, 128);
      for (let y = 6; y < 128; y += 14)
        for (let x = 6; x < 64; x += 18) {
          g.fillStyle = (x * 7 + y * 3) % 11 < 3 ? "rgba(255,226,170,0.9)" : "rgba(70,95,110,0.6)";
          g.fillRect(x, y, 10, 8);
        }
    },
    [],
  );
  const glass = useCanvasTexture(64, 128, (g) => {
    g.fillStyle = "#7FA4B2";
    g.fillRect(0, 0, 64, 128);
    g.fillStyle = "rgba(255,255,255,0.25)";
    for (let y = 0; y < 128; y += 10) g.fillRect(0, y, 64, 1.5);
    for (let x = 0; x < 64; x += 16) g.fillRect(x, 0, 1.5, 128);
  });
  const { tanks, acs } = useMemo(
    () => ({
      tanks: BLOCKS.filter((b) => !b.glassy).map((b): Place => ({ p: [b.p[0] + 0.5, b.h + 0.45, b.p[1]] })),
      acs: BLOCKS.map((b, i): Place => ({ p: [b.p[0] - 0.6, b.h + 0.25, b.p[1] + (i % 2 ? 0.4 : -0.4)], s: [0.7, 0.5, 0.5] })),
    }),
    [],
  );
  const tankGeo = useMemo(() => new THREE.CylinderGeometry(0.45, 0.45, 0.9, 12), []);
  const tankMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2B2B2B", roughness: 0.6 }), []);
  const box = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const acMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#DAD3C6", roughness: 0.7 }), []);
  const people: PersonSpot[] = useMemo(
    () => [
      { x: -1.8, z: 3.4, ry: -Math.PI / 2 },
      { x: -5.4, z: 3.4, ry: Math.PI / 2 },
      { x: -3.6, z: 5.2, ry: Math.PI },
      { x: -3.6, z: 1.6, ry: 0 },
      { x: 3.6, z: 2.6, ry: -0.8 },
      { x: 6.4, z: 1.8, ry: 2.2 },
    ],
    [],
  );
  const cars: { p: [number, number, number]; c: string; ry: number }[] = [
    { p: [6.6, 0, 3.6], c: "#B8434E", ry: 0.3 },
    { p: [-7.4, 0, 1], c: "#F4EBDD", ry: -0.2 },
  ];
  return (
    <group>
      {BLOCKS.map((b, i) => (
        <mesh key={i} position={[b.p[0], b.h / 2, b.p[1]]} castShadow receiveShadow>
          <boxGeometry args={[b.w, b.h, b.w]} />
          <meshStandardMaterial map={b.glassy ? glass : windows} color={b.glassy ? "#ffffff" : b.c} roughness={b.glassy ? 0.25 : 0.8} metalness={b.glassy ? 0.3 : 0} />
        </mesh>
      ))}
      <Instances geometry={tankGeo} material={tankMat} items={tanks} />
      <Instances geometry={box} material={acMat} items={acs} />
      <group position={[1.2, 0, 1.2]} rotation={[0, 0, -0.85]}>
        <B p={[1.4, 3, 0]} s={[0.45, 6.6, 0.45]} c={C.orange} />
        <mesh position={[1.4, 6.7, 0]} castShadow>
          <coneGeometry args={[0.9, 1.4, 4]} />
          <meshStandardMaterial color={C.orange} roughness={0.5} />
        </mesh>
      </group>
      {[0, 1, 2, 3].map((k) => (
        <group key={k} position={[2.6 + k * 1.2, 0, 4.4]}>
          <B p={[0, 0.25 + k * 0.2, 0]} s={[0.9, 0.5 + k * 0.4, 0.9]} c="#D9C29A" />
          <mesh position-y={0.7 + k * 0.4} castShadow>
            <icosahedronGeometry args={[0.45, 1]} />
            <meshStandardMaterial color="#6F7D3E" roughness={0.9} flatShading />
          </mesh>
        </group>
      ))}
      <group position={[-3.6, 0, 3.4]}>
        <mesh position-y={0.8} castShadow receiveShadow>
          <cylinderGeometry args={[1.3, 1.3, 0.1, 24]} />
          <meshStandardMaterial color={C.wood} roughness={0.6} />
        </mesh>
        <mesh position-y={0.4}>
          <cylinderGeometry args={[0.12, 0.2, 0.8, 8]} />
          <meshStandardMaterial color={C.oliveDark} roughness={0.5} />
        </mesh>
        <B p={[0.2, 0.9, 0.1]} s={[0.5, 0.03, 0.35]} c="#FFF7EC" />
        <B p={[-0.4, 0.9, -0.3]} s={[0.4, 0.03, 0.3]} c="#FFF7EC" />
      </group>
      {cars.map((c, i) => (
        <group key={i} position={c.p} rotation-y={c.ry}>
          <B p={[0, 0.55, 0]} s={[1.7, 0.7, 3.6]} c={c.c} />
          <B p={[0, 1.1, -0.2]} s={[1.5, 0.55, 1.8]} c={c.c} />
          <B p={[0, 1.1, -0.2]} s={[1.52, 0.4, 1.6]} c="#35464E" cast={false} />
          {[-0.8, 0.8].flatMap((x) =>
            [-1.1, 1.1].map((z) => (
              <mesh key={`${x}${z}`} position={[x, 0.3, z]} rotation-z={Math.PI / 2}>
                <cylinderGeometry args={[0.3, 0.3, 0.2, 12]} />
                <meshStandardMaterial color="#2a2422" roughness={0.8} />
              </mesh>
            )),
          )}
        </group>
      ))}
      <Crowd people={people} seed={21} />
    </group>
  );
}

/* ── 05 Build: a market street with the Eat Better store ── */

const stripes = (a: string, b: string) => (g: CanvasRenderingContext2D) => {
  for (let i = 0; i < 8; i++) {
    g.fillStyle = i % 2 ? b : a;
    g.fillRect(i * 32, 0, 32, 64);
  }
};

function Shop({ x, w, h, wall, aw, children }: { x: number; w: number; h: number; wall: string; aw: THREE.Texture; children?: ReactNode }) {
  return (
    <group position={[x, 0, -3.6]}>
      <B p={[0, h / 2, 0]} s={[w, h, 3.4]} c={wall} />
      <B p={[0, h + 0.15, 0]} s={[w + 0.2, 0.3, 3.6]} c="#F6E3C9" />
      <mesh position={[0, 3.35, 2.4]} rotation-x={0.45} castShadow>
        <boxGeometry args={[w - 0.3, 0.08, 1.6]} />
        <meshStandardMaterial map={aw} roughness={0.8} />
      </mesh>
      {children}
    </group>
  );
}

function Build() {
  const logo = useLogo();
  const shots = useLoader(THREE.TextureLoader, ["/brand/products/laddoo-box-24-0.webp", "/brand/products/diwali-hamper-0.webp", "/brand/products/laddoo-tin-0.webp"]);
  useMemo(() => shots.forEach((t) => (t.colorSpace = THREE.SRGBColorSpace)), [shots]);
  const awning = useCanvasTexture(256, 64, stripes(C.orange, "#FFF3E3"));
  const awningG = useCanvasTexture(256, 64, stripes("#2F7F86", "#F4EBDD"));
  const awningM = useCanvasTexture(256, 64, stripes("#7A1E12", "#F4EBDD"));
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
  const customers: PersonSpot[] = useMemo(
    () => [
      { x: -1, z: 0.6, ry: Math.PI },
      { x: 0.4, z: 0.9, ry: Math.PI + 0.3 },
      { x: 1.6, z: 1.8, ry: 2.6 },
      { x: -5.6, z: 1.4, ry: 2.8 },
      { x: 5.2, z: 1.2, ry: -2.8 },
      { x: 6.4, z: 3.2, ry: -2 },
      { x: -2.8, z: 3.6, ry: 0.6 },
      { x: -3.4, z: 3.9, ry: 0.4, s: 0.7 },
    ],
    [],
  );
  return (
    <group>
      <Shop x={-6} w={4.4} h={4.6} wall="#E8C9A8" aw={awningG}>
        <B p={[0, 1.5, 1.72]} s={[3.4, 2.2, 0.05]} c="#3E4E52" cast={false} />
      </Shop>
      <Shop x={0} w={6.4} h={5.4} wall={C.cream} aw={awning}>
        <mesh position={[0, 4.4, 1.72]}>
          <planeGeometry args={[4, 1]} />
          <meshStandardMaterial map={sign} roughness={0.7} />
        </mesh>
        {shots.map((t, i) => (
          <group key={i} position={[-2 + i * 2, 1.6, 1.72]}>
            <mesh position-z={-0.01}>
              <planeGeometry args={[1.8, 2]} />
              <meshStandardMaterial color={C.cocoa} roughness={0.6} />
            </mesh>
            <mesh position-z={0.01}>
              <planeGeometry args={[1.6, 1.6]} />
              <meshStandardMaterial map={t} roughness={0.4} />
            </mesh>
          </group>
        ))}
      </Shop>
      <Shop x={6} w={4.4} h={4.2} wall="#F2D8B8" aw={awningM}>
        <B p={[0, 1.5, 1.72]} s={[3.4, 2.2, 0.05]} c="#4A3B33" cast={false} />
      </Shop>
      <group position={[4.4, 0, 3.2]}>
        <B p={[0, 0.55, 0]} s={[1.6, 1.1, 0.9]} c={C.orange} />
        <B p={[0, 1.15, 0]} s={[1.7, 0.08, 1]} c="#FFF7EC" />
        <mesh position-y={1.8}>
          <cylinderGeometry args={[0.04, 0.04, 2.4, 6]} />
          <meshStandardMaterial color="#555" />
        </mesh>
        <mesh position-y={3} castShadow>
          <coneGeometry args={[1.4, 0.6, 10, 1, true]} />
          <meshStandardMaterial color="#F5C02A" roughness={0.8} side={THREE.DoubleSide} />
        </mesh>
      </group>
      {[-8.4, 8.4].map((x) => (
        <group key={x} position={[x, 0, 1.6]}>
          <mesh position-y={2}>
            <cylinderGeometry args={[0.07, 0.09, 4, 8]} />
            <meshStandardMaterial color={C.oliveDark} roughness={0.5} metalness={0.4} />
          </mesh>
          <mesh position-y={4.1}>
            <sphereGeometry args={[0.28, 12, 10]} />
            <meshStandardMaterial color="#fff" emissive="#FFE3B8" emissiveIntensity={1.2} />
          </mesh>
        </group>
      ))}
      <Lights a={[-8.4, 3.9, 1.6]} b={[8.4, 3.9, 1.6]} sag={0.7} />
      <Scooter position={[-3, 0, 1.6]} ry={-0.4} />
      <Scooter position={[2.8, 0, 2.6]} ry={0.6} color="#2F7F86" />
      <B p={[-6.4, 0.45, 2.6]} s={[1.8, 0.1, 0.55]} c={C.wood} />
      <Crowd people={customers} seed={33} />
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
  const paving = useCanvasTexture(
    512,
    512,
    (g) => {
      // circular sandstone paving with a terracotta inlay ring
      g.fillStyle = "#EEDDC2";
      g.fillRect(0, 0, 512, 512);
      g.strokeStyle = "rgba(140,110,75,0.35)";
      g.lineWidth = 2;
      for (let r = 30; r < 256; r += 30) {
        g.beginPath();
        g.arc(256, 256, r, 0, Math.PI * 2);
        g.stroke();
        const n = Math.round((2 * Math.PI * r) / 40);
        for (let k = 0; k < n; k++) {
          const a = (k / n) * Math.PI * 2 + r;
          g.beginPath();
          g.moveTo(256 + Math.cos(a) * (r - 30), 256 + Math.sin(a) * (r - 30));
          g.lineTo(256 + Math.cos(a) * r, 256 + Math.sin(a) * r);
          g.stroke();
        }
      }
      g.strokeStyle = "rgba(200,100,59,0.45)";
      g.lineWidth = 10;
      g.beginPath();
      g.arc(256, 256, 225, 0, Math.PI * 2);
      g.stroke();
      for (let k = 0; k < 9000; k++) {
        g.fillStyle = `rgba(90,70,40,${Math.random() * 0.08})`;
        g.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
      }
    },
    [],
  );
  useFrame((_, dt) => {
    const r = ring.current;
    if (!r) return;
    const want = active || hover ? 0.6 : 0;
    const mat = r.material as THREE.MeshStandardMaterial;
    mat.emissiveIntensity += (want - mat.emissiveIntensity) * Math.min(1, dt * 5);
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
        <cylinderGeometry args={[10, 10.4, 0.3, 64]} />
        <meshStandardMaterial color="#E9D6B8" roughness={0.85} />
      </mesh>
      <mesh position-y={0.305} rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[10, 64]} />
        <meshStandardMaterial map={paving} roughness={0.85} />
      </mesh>
      <mesh ref={ring} position-y={0.32} rotation-x={-Math.PI / 2}>
        <ringGeometry args={[9.5, 10, 64]} />
        <meshStandardMaterial color={m.color} emissive={m.color} emissiveIntensity={0} roughness={0.6} />
      </mesh>
      <group position-y={0.3}>
        <Props />
        <group position={[-8, 0, 5.8]} rotation-y={0.5}>
          <Marker n={m.n} word={m.word} color={m.color} />
        </group>
      </group>
    </group>
  );
}

export function Worlds({ compact, active, onPick }: { compact: boolean; active: number; onPick?: (i: number) => void }) {
  return (
    <group>
      <Nature compact={compact} />
      <Walkers count={compact ? 14 : 34} />
      <Van drive offset={0} />
      {!compact && <Van drive offset={1.1} lane={1} />}
      {MODULES.map((_, i) => (
        <World key={i} i={i} active={active === i} onPick={onPick} />
      ))}
    </group>
  );
}
