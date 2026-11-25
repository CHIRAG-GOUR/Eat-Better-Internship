"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { C, Instances, useCanvasTexture, useLogo, type Place } from "./Warehouse";
import { PATH, seeded } from "./layout";

/**
 * People and traffic. A person is a few simple shapes (legs, kurta or shirt, head, hair) in Indian everyday colours;
 * crowds are instanced, so a hundred people cost a handful of draw calls. Walkers stroll along the path, and two Eat
 * Better delivery vans drive it.
 */

const SHIRTS = ["#E0662A", "#7A1E12", "#2F7F86", "#D9A030", "#F4EBDD", "#C2388D", "#3F5A8A", "#6F7247", "#B8434E", "#F0C24B"];
const PANTS = ["#3A3330", "#2B3A55", "#EFE6D6", "#5A4A3A", "#6B4E3D"];
const SKIN = ["#8D5A3B", "#A86F4C", "#C68B63", "#7A4A30", "#B57A55"];
const HAIR = ["#1E1612", "#2B1D16", "#3A2A20"];

export type PersonSpot = { x: number; z: number; ry?: number; s?: number; seed?: number };

function partsFor(list: PersonSpot[], seed: number) {
  const rnd = seeded(seed);
  const legs: Place[] = [];
  const torsos: Place[] = [];
  const heads: Place[] = [];
  const hair: Place[] = [];
  for (const p of list) {
    const s = p.s ?? 0.9 + rnd() * 0.25;
    const ry = p.ry ?? rnd() * 6.28;
    const shirt = SHIRTS[Math.floor(rnd() * SHIRTS.length)];
    const pant = PANTS[Math.floor(rnd() * PANTS.length)];
    const skin = SKIN[Math.floor(rnd() * SKIN.length)];
    legs.push({ p: [p.x, 0.42 * s, p.z], s: [0.36 * s, 0.84 * s, 0.24 * s], r: [0, ry, 0], c: pant });
    torsos.push({ p: [p.x, 1.12 * s, p.z], s: [s, s, s], r: [0, ry, 0], c: shirt });
    heads.push({ p: [p.x, 1.62 * s, p.z], s: [s, s, s], r: [0, ry, 0], c: skin });
    hair.push({ p: [p.x, 1.7 * s, p.z], s: [s, s * 0.75, s], r: [0, ry, 0], c: HAIR[Math.floor(rnd() * HAIR.length)] });
  }
  return { legs, torsos, heads, hair };
}

const geos = () => ({
  leg: new THREE.BoxGeometry(1, 1, 1),
  torso: new THREE.CapsuleGeometry(0.2, 0.42, 4, 10),
  head: new THREE.SphereGeometry(0.16, 12, 10),
  hair: new THREE.SphereGeometry(0.165, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2),
});

/** a still crowd (standing, chatting, working) */
export function Crowd({ people, seed = 1 }: { people: PersonSpot[]; seed?: number }) {
  const g = useMemo(() => geos(), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fff", roughness: 0.8 }), []);
  const parts = useMemo(() => partsFor(people, seed), [people, seed]);
  return (
    <group>
      <Instances geometry={g.leg} material={mat} items={parts.legs} />
      <Instances geometry={g.torso} material={mat} items={parts.torsos} />
      <Instances geometry={g.head} material={mat} items={parts.heads} />
      <Instances geometry={g.hair} material={mat} items={parts.hair} />
    </group>
  );
}

/** people strolling along the path, both ways */
export function Walkers({ count }: { count: number }) {
  const g = useMemo(() => geos(), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fff", roughness: 0.8 }), []);
  const r0 = useRef<THREE.InstancedMesh>(null);
  const r1 = useRef<THREE.InstancedMesh>(null);
  const r2 = useRef<THREE.InstancedMesh>(null);
  const r3 = useRef<THREE.InstancedMesh>(null);
  const walkers = useMemo(() => {
    const rnd = seeded(77);
    return Array.from({ length: count }, (_, i) => ({
      u0: rnd(),
      dir: i % 2 ? 1 : -1,
      lane: (i % 2 ? 1 : -1) * (0.5 + rnd() * 0.6),
      speed: 0.9 + rnd() * 0.5,
      s: 0.9 + rnd() * 0.22,
      cols: [PANTS[i % PANTS.length], SHIRTS[(i * 3) % SHIRTS.length], SKIN[i % SKIN.length], HAIR[i % HAIR.length]],
    }));
  }, [count]);
  const len = useMemo(() => PATH.getLength(), []);
  const o = useMemo(() => new THREE.Object3D(), []);
  const col = useMemo(() => new THREE.Color(), []);
  const painted = useRef(false);
  const p = useMemo(() => new THREE.Vector3(), []);
  const t = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ clock }) => {
    const time = clock.elapsedTime;
    const ms = [r0.current, r1.current, r2.current, r3.current];
    if (ms.some((m) => !m)) return;
    walkers.forEach((w, i) => {
      let u = (w.u0 + (w.dir * time * w.speed) / len) % 1;
      if (u < 0) u += 1;
      u = 0.04 + u * 0.94; // stay out of the warehouse
      PATH.getPointAt(u, p);
      PATH.getTangentAt(u, t);
      const nx = -t.z;
      const nz = t.x;
      const x = p.x + nx * w.lane;
      const z = p.z + nz * w.lane;
      const ry = Math.atan2(t.x * w.dir, t.z * w.dir);
      const bob = Math.abs(Math.sin(time * 6 * w.speed + i)) * 0.05;
      const sway = Math.sin(time * 6 * w.speed + i) * 0.05;
      const parts: [number, number, number, number][] = [
        [0.42, 0.36, 0.84, 0.24],
        [1.12, 1, 1, 1],
        [1.62, 1, 1, 1],
        [1.7, 1, 0.75, 1],
      ];
      parts.forEach(([y, sx, sy, sz], k) => {
        o.position.set(x, (y + bob) * w.s, z);
        o.rotation.set(k === 0 ? sway : 0, ry, k === 1 ? sway * 0.5 : 0);
        o.scale.set(sx * w.s, sy * w.s, sz * w.s);
        o.updateMatrix();
        ms[k]!.setMatrixAt(i, o.matrix);
        if (!painted.current) ms[k]!.setColorAt(i, col.set(w.cols[k]));
      });
    });
    ms.forEach((m) => {
      m!.instanceMatrix.needsUpdate = true;
      if (!painted.current && m!.instanceColor) m!.instanceColor.needsUpdate = true;
    });
    painted.current = true;
  });
  return (
    <group>
      <instancedMesh ref={r0} args={[g.leg, mat, count]} castShadow frustumCulled={false} />
      <instancedMesh ref={r1} args={[g.torso, mat, count]} castShadow frustumCulled={false} />
      <instancedMesh ref={r2} args={[g.head, mat, count]} castShadow frustumCulled={false} />
      <instancedMesh ref={r3} args={[g.hair, mat, count]} castShadow frustumCulled={false} />
    </group>
  );
}

/** an Eat Better delivery van; `drive` moves it along the path */
export function Van({ drive, offset = 0, lane = 0.9, position, ry = 0 }: { drive?: boolean; offset?: number; lane?: number; position?: [number, number, number]; ry?: number }) {
  const logo = useLogo();
  const side = useCanvasTexture(
    512,
    256,
    (g) => {
      g.fillStyle = "#F7EFE3";
      g.fillRect(0, 0, 512, 256);
      g.fillStyle = C.orange;
      g.fillRect(0, 206, 512, 50);
      g.drawImage(logo, 120, 100, 360, 200, 150, 22, 220, 122);
    },
    [logo],
  );
  const ref = useRef<THREE.Group>(null);
  const len = useMemo(() => PATH.getLength(), []);
  const p = useMemo(() => new THREE.Vector3(), []);
  const t = useMemo(() => new THREE.Vector3(), []);
  useFrame(({ clock }) => {
    const g = ref.current;
    if (!g || !drive) return;
    // there and back along the path, never inside the warehouse
    const k = ((clock.elapsedTime * 4.2) / len + offset) % 2;
    const back = k > 1;
    const u = 0.05 + (back ? 2 - k : k) * 0.93;
    PATH.getPointAt(u, p);
    PATH.getTangentAt(u, t);
    const sideSign = back ? -1 : 1;
    g.position.set(p.x - t.z * lane * sideSign, 0, p.z + t.x * lane * sideSign);
    g.rotation.y = Math.atan2(t.x, t.z) + (back ? Math.PI : 0);
  });
  const wheel = useMemo(() => new THREE.CylinderGeometry(0.3, 0.3, 0.22, 14), []);
  const tyre = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2a2422", roughness: 0.8 }), []);
  return (
    <group ref={ref} position={position} rotation-y={ry} scale={0.72}>
      <mesh position={[0, 1.35, -0.4]} castShadow>
        <boxGeometry args={[1.9, 1.8, 3.2]} />
        <meshStandardMaterial color="#F7EFE3" roughness={0.55} />
      </mesh>
      {[0.96, -0.96].map((x) => (
        <mesh key={x} position={[x, 1.35, -0.4]} rotation-y={x > 0 ? Math.PI / 2 : -Math.PI / 2}>
          <planeGeometry args={[3.1, 1.7]} />
          <meshStandardMaterial map={side} roughness={0.6} />
        </mesh>
      ))}
      <mesh position={[0, 1.05, 1.75]} castShadow>
        <boxGeometry args={[1.85, 1.3, 1.1]} />
        <meshStandardMaterial color={C.orange} roughness={0.45} />
      </mesh>
      <mesh position={[0, 1.35, 2.31]}>
        <boxGeometry args={[1.6, 0.6, 0.04]} />
        <meshStandardMaterial color="#35464E" roughness={0.1} metalness={0.5} />
      </mesh>
      {[-0.85, 0.85].flatMap((x) =>
        [-1.3, 1.6].map((z) => (
          <mesh key={`${x}${z}`} geometry={wheel} material={tyre} position={[x, 0.3, z]} rotation-z={Math.PI / 2} />
        )),
      )}
    </group>
  );
}

/** a parked scooter (delivery or customer) */
export function Scooter({ position, ry = 0, color = C.orange }: { position: [number, number, number]; ry?: number; color?: string }) {
  return (
    <group position={position} rotation-y={ry}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <boxGeometry args={[0.42, 0.45, 1.3]} />
        <meshStandardMaterial color={color} roughness={0.45} />
      </mesh>
      <mesh position={[0, 0.85, -0.25]} castShadow>
        <boxGeometry args={[0.36, 0.12, 0.6]} />
        <meshStandardMaterial color="#2a2422" roughness={0.7} />
      </mesh>
      <mesh position={[0, 1.05, 0.55]} rotation-x={-0.3}>
        <cylinderGeometry args={[0.04, 0.04, 0.7, 6]} />
        <meshStandardMaterial color="#555" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh position={[0, 1.4, 0.65]} rotation-z={Math.PI / 2}>
        <cylinderGeometry args={[0.03, 0.03, 0.6, 6]} />
        <meshStandardMaterial color="#555" metalness={0.6} roughness={0.4} />
      </mesh>
      {[-0.5, 0.5].map((z) => (
        <mesh key={z} position={[0, 0.22, z]} rotation-z={Math.PI / 2}>
          <cylinderGeometry args={[0.22, 0.22, 0.14, 12]} />
          <meshStandardMaterial color="#2a2422" roughness={0.8} />
        </mesh>
      ))}
      <mesh position={[0, 1.02, -0.55]} castShadow>
        <boxGeometry args={[0.55, 0.45, 0.5]} />
        <meshStandardMaterial color={C.kraft} roughness={0.85} />
      </mesh>
    </group>
  );
}
