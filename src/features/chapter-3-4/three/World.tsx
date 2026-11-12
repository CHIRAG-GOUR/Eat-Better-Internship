"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import ValleyWorld, { Signpost, type ValleyKit } from "@/components/world3/ValleyWorld";
import { along, mat, signTex } from "@/components/world3/kit";
import { Instanced, Near, useTex, type Inst } from "@/components/world3/parts";
import { RoadVehicle, Truck, type V } from "@/components/world3/Traffic";
import { Scooter } from "@/components/world2/StreetLife";
import type { HumanLook } from "@/components/world2/Human";
import { Hoverable } from "@/components/world/hover";

/**
 * Chapter 3.4 district of Value Chain Valley (dusk, lights coming on): the distribution network seen from
 * a little higher up. Four glowing route lines leave the central warehouse — website orders out along
 * the highway with 3PL trucks, marketplace stock to a fulfilment centre, quick-commerce stock to small
 * urban dark stores (riders out to the homes), and scheduled bulk freight to the office tower. Each
 * channel has a signpost with its delivery speed. Generic buildings and vehicles only.
 */

const ROUTES: { color: string; label: string; pts: [number, number][] }[] = [
  { color: "#FF7A1A", label: "Own website: central warehouse and 3PL couriers, 2–5 days pan-India", pts: [[10, -75.4], [1.0, -77], [1.0, -160]] },
  { color: "#3FA9F5", label: "Marketplaces: stock sent ahead to a fulfilment centre, 1–2 days", pts: [[10, -76.6], [2.2, -78], [2.2, -100.5], [30, -100.5]] },
  { color: "#2ECC71", label: "Quick commerce: stock spread across small dark stores, 10–20 minutes", pts: [[10, -74.2], [-0.2, -76], [-0.2, -84], [-7.4, -88.5]] },
  { color: "#2ECC71", label: "Quick commerce: stock spread across small dark stores, 10–20 minutes", pts: [[-0.2, -84], [-0.2, -93.5], [7.5, -93.5]] },
  { color: "#2ECC71", label: "Quick commerce: stock spread across small dark stores, 10–20 minutes", pts: [[-0.2, -93.5], [-0.2, -145], [-7.9, -145]] },
  { color: "#FED300", label: "Corporate and bulk orders: direct freight on a schedule", pts: [[10, -73], [3.4, -74.5], [3.4, -131], [8.5, -131]] },
];

/** Glowing route lines painted over the ground; they pulse gently at dusk. */
function RouteLines({ night, reduced }: { night: number; reduced: boolean }) {
  const geo = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const mats = useMemo(() => ROUTES.map((r) => new THREE.MeshStandardMaterial({ color: r.color, emissive: new THREE.Color(r.color), emissiveIntensity: 0.6 + night, roughness: 0.6, toneMapped: false })), [night]);
  useEffect(
    () => () => {
      geo.dispose();
      mats.forEach((m) => m.dispose());
    },
    [geo, mats],
  );
  useFrame(({ clock }) => {
    if (reduced) return;
    mats.forEach((m, i) => (m.emissiveIntensity = 0.5 + night + Math.sin(clock.elapsedTime * 2 - i) * 0.35));
  });
  const segs = useMemo(
    () =>
      ROUTES.map((r) =>
        r.pts.slice(1).map((b, i): Inst => {
          const a = r.pts[i];
          const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
          return { p: [(a[0] + b[0]) / 2, 0.12, (a[1] + b[1]) / 2], r: [0, Math.atan2(b[0] - a[0], b[1] - a[1]), 0], s: [0.32, 0.05, len + 0.3] };
        }),
      ),
    [],
  );
  return (
    <group>
      {segs.map((items, i) => (
        <Hoverable key={i} label={ROUTES[i].label}>
          <Instanced geometry={geo} material={mats[i]} items={items} />
        </Hoverable>
      ))}
    </group>
  );
}

/** Street lamps along the road, glowing at dusk. */
function StreetLamps({ night, compact }: { night: number; compact: boolean }) {
  const geos = useMemo(() => ({ pole: new THREE.CylinderGeometry(0.07, 0.09, 1, 8), arm: new THREE.BoxGeometry(1, 1, 1), head: new THREE.SphereGeometry(0.22, 12, 10) }), []);
  const bulb = useMemo(() => new THREE.MeshStandardMaterial({ color: "#FFE6B0", emissive: new THREE.Color("#FFC46B"), emissiveIntensity: 0.6 + night * 2.4, toneMapped: false }), [night]);
  useEffect(
    () => () => {
      Object.values(geos).forEach((g) => g.dispose());
      bulb.dispose();
    },
    [geos, bulb],
  );
  const sets = useMemo(() => {
    const poles: Inst[] = [];
    const arms: Inst[] = [];
    const heads: Inst[] = [];
    const step = compact ? 28 : 14;
    for (let z = -44, k = 0; z > -150; z -= step, k++) {
      const s = k % 2 ? -1 : 1;
      poles.push({ p: [s * 3.4, 3, z], s: [1, 6, 1] });
      arms.push({ p: [s * 2.75, 5.95, z], s: [1.3, 0.08, 0.08] });
      heads.push({ p: [s * 2.1, 5.8, z] });
    }
    return { poles, arms, heads };
  }, [compact]);
  const steel = mat("#3A3F44", 0.5, 0.5);
  return (
    <group>
      <Instanced geometry={geos.pole} material={steel} items={sets.poles} />
      <Instanced geometry={geos.arm} material={steel} items={sets.arms} />
      <Instanced geometry={geos.head} material={bulb} items={sets.heads} />
    </group>
  );
}

/** A marketplace-style fulfilment centre (generic, no platform branding). Docks face +z. */
function FulfilmentCentre({ kit }: { kit: ValleyKit }) {
  const sign = useTex(() => signTex("FULFILMENT CENTRE", "#1E3A5F", "#FFFFFF", 1536, 220));
  const x0 = 30;
  const x1 = 48;
  const z0 = -98;
  const z1 = -118;
  const base = Math.max(kit.ground(x0, z0), kit.ground(x1, z0), kit.ground(x0, z1), kit.ground(x1, z1)) + 0.2;
  const cx = (x0 + x1) / 2;
  const cz = (z0 + z1) / 2;
  const glow = mat("#FFE2A8", 0.5, 0, { emissive: "#FFC46B", ei: 0.4 + kit.night * 1.6 });
  return (
    <Hoverable label="Marketplace fulfilment centre: stock is sent here ahead of orders for 1–2 day delivery">
      <group>
        <mesh position={[cx, base / 2 - 1, cz]} material={mat("#A9A08E", 0.95)} receiveShadow>
          <boxGeometry args={[x1 - x0 + 3, base + 2, z0 - z1 + 6]} />
        </mesh>
        <mesh position={[cx, base + 4.5, cz]} material={mat("#D7DDE2", 0.6, 0.3)} castShadow receiveShadow>
          <boxGeometry args={[x1 - x0, 9, z0 - z1]} />
        </mesh>
        <mesh position={[cx, base + 9.15, cz]} material={mat("#8E9AA2", 0.5, 0.4)}>
          <boxGeometry args={[x1 - x0 + 0.4, 0.3, z0 - z1 + 0.4]} />
        </mesh>
        {/* lit clerestory band + dock doors on the +z face */}
        <mesh position={[cx, base + 7.6, z0 + 0.02]} material={glow}>
          <planeGeometry args={[x1 - x0 - 2, 0.8]} />
        </mesh>
        {[-6, -2, 2, 6].map((dx) => (
          <mesh key={dx} position={[cx + dx, base + 1.9, z0 + 0.02]} material={dx === 2 ? glow : mat("#7E878D", 0.5, 0.4)}>
            <planeGeometry args={[3, 3.4]} />
          </mesh>
        ))}
        <mesh position={[cx, base + 5.4, z0 + 0.03]}>
          <planeGeometry args={[11, 1.6]} />
          <meshStandardMaterial map={sign} emissiveMap={sign} emissive="#FFFFFF" emissiveIntensity={0.25 + kit.night * 0.5} roughness={0.6} />
        </mesh>
        <mesh position={[cx, base - 0.05, z0 + 4]} material={mat("#BDB8AE", 0.9)} receiveShadow>
          <boxGeometry args={[x1 - x0, 0.1, 8]} />
        </mesh>
        <group position={[cx + 2, base, z0 + 3.3]}>
          <Truck cab="#F4F1EA" cargo="#1E3A5F" label="FULFILMENT  ·  EXPRESS" />
        </group>
      </group>
    </Hoverable>
  );
}

const RIDER: HumanLook = { skin: "#A86F45", hair: "#1A110C", hairStyle: "short", outfit: "tshirt", top: "#2ECC71", bottom: "#2B2B2B", facial: "stubble", helmet: "#F4F1EC", bag: { kind: "sling", color: "#1E1E1E" } };

/** A small urban dark store with parked riders. Faces +x (towards the road). */
function MiniDarkStore({ at, kit, riders = 2 }: { at: [number, number]; kit: ValleyKit; riders?: number }) {
  const sign = useTex(() => signTex("DARK STORE", "#1F6B45", "#FFFFFF", 1024, 200));
  const spin = useRef(0);
  const [x, z] = at;
  const y = kit.ground(x, z);
  return (
    <group>
      <Hoverable label="Dark store: a small local stock point for quick-commerce orders (10–20 minutes)">
        <group position={[x, y, z]}>
          <mesh position={[0, 1.9, 0]} material={mat("#E7ECE8", 0.85)} castShadow receiveShadow>
            <boxGeometry args={[6, 3.8, 4]} />
          </mesh>
          <mesh position={[0, 3.95, 0]} material={mat("#1F6B45", 0.7)}>
            <boxGeometry args={[6.2, 0.3, 4.2]} />
          </mesh>
          <mesh position={[3.02, 1.4, 0]} rotation={[0, Math.PI / 2, 0]} material={mat("#FFE2A8", 0.5, 0, { emissive: "#FFC46B", ei: 0.3 + kit.night * 1.4 })}>
            <planeGeometry args={[2.6, 2.6]} />
          </mesh>
          <mesh position={[3.03, 3.2, 0]} rotation={[0, Math.PI / 2, 0]}>
            <planeGeometry args={[3.6, 0.7]} />
            <meshStandardMaterial map={sign} emissiveMap={sign} emissive="#FFFFFF" emissiveIntensity={0.3 + kit.night * 0.6} roughness={0.6} />
          </mesh>
        </group>
      </Hoverable>
      <Near at={at} r={60}>
        {Array.from({ length: kit.compact ? 1 : riders }, (_, i) => (
          <group key={i} position={[x + 4.6, y + 0.04, z + 1.1 - i * 1.4]} rotation={[0, Math.PI / 2 + (i ? -0.2 : 0.15), 0]}>
            <Scooter spin={spin} body="#1F6B45" box="#2ECC71" rider={{ ...RIDER, skin: i ? "#8D5A3B" : RIDER.skin, helmet: i ? "#1E1E1E" : RIDER.helmet }} />
          </group>
        ))}
      </Near>
    </group>
  );
}

/** A rider leaving the first dark store, up the hillside lane to the homes and back. */
const RIDE: [number, number][] = [
  [-6.6, -89.6],
  [-12, -93],
  [-12, -118],
  [-12.7, -119.3],
  [-13.4, -118],
  [-13.4, -94],
  [-11.5, -91],
  [-6.6, -89.6],
];
function HomeRider({ kit }: { kit: ValleyKit }) {
  const g = useRef<THREE.Group>(null);
  const spin = useRef(0);
  useFrame(({ clock }, dt) => {
    const grp = g.current;
    if (!grp) return;
    const a = along(RIDE, kit.reduced ? 12 : clock.elapsedTime * 4.5);
    grp.position.set(a.x, kit.ground(a.x, a.z) + 0.04, a.z);
    grp.rotation.y = a.heading;
    if (!kit.reduced) spin.current += (4.5 / 0.2) * dt;
  });
  return (
    <Hoverable label="Quick-commerce rider heading to homes on the hill">
      <group ref={g}>
        <Scooter spin={spin} body="#1F6B45" box="#2ECC71" rider={RIDER} />
      </group>
    </Hoverable>
  );
}

const THREE_PL: V[] = [
  { kind: "truck", dir: -1, speed: 6.5, offset: 48, cab: "#F4F1EA", cargo: "#7A2E22", label: "3PL  COURIER" },
  { kind: "truck", dir: 1, speed: 6.5, offset: 115, cab: "#E8A33C", cargo: "#7A2E22", label: "3PL  COURIER" },
];

function Scenes({ kit }: { kit: ValleyKit }) {
  const g = kit.ground;
  return (
    <>
      <RouteLines night={kit.night} reduced={kit.reduced} />
      <StreetLamps night={kit.night} compact={kit.compact} />
      <Hoverable label="3PL trucks: third-party logistics partners carry website orders across India">
        <group>
          {(kit.compact ? THREE_PL.slice(0, 1) : THREE_PL).map((v, i) => (
            <RoadVehicle key={i} v={v} reduced={kit.reduced} />
          ))}
        </group>
      </Hoverable>
      <FulfilmentCentre kit={kit} />
      <MiniDarkStore at={[-10.5, -88.5]} kit={kit} />
      <MiniDarkStore at={[-11, -145]} kit={kit} />
      <Near at={[-12, -104]} r={70}>
        <HomeRider kit={kit} />
      </Near>
      <Hoverable label="Corporate bulk order: hampers leave on a scheduled freight truck">
        <group position={[5.6, 0, -129.5]} rotation={[0, Math.PI, 0]}>
          <Truck cab="#2F1C1A" cargo="#FED300" label="BULK  ORDER  ·  SCHEDULED" />
        </group>
      </Hoverable>
      <Signpost text={"OWN WEBSITE · 2–5 DAYS\nCENTRAL WAREHOUSE + 3PL"} position={[5.4, 0, -66.5]} rotation={-0.4} width={4} height={3} color="#FF7A1A" fg="#FFFFFF" label="Own website: shipped from the central warehouse through 3PL couriers, 2–5 days pan-India" />
      <Signpost text={"QUICK COMMERCE · 10–20 MIN\nDARK STORES"} position={[-6.2, 0, -83.6]} rotation={0.5} width={4} height={3} color="#1F6B45" fg="#FFFFFF" label="Quick commerce: local dark stores deliver in 10–20 minutes" />
      <Signpost text={"MARKETPLACES · 1–2 DAYS\nFULFILMENT CENTRE"} position={[28.5, g(28.5, -96.5), -96.5]} rotation={-0.95} width={4.6} height={3.2} color="#1E3A5F" fg="#FFFFFF" label="Marketplaces: stock held in fulfilment centres for 1–2 day express delivery" />
      <Signpost text={"CORPORATE · SCHEDULED\nBULK FREIGHT"} position={[4.4, 0, -122.5]} rotation={-0.4} width={3.6} height={3} color="#2F1C1A" fg="#FED300" label="Corporate and bulk: direct freight on a scheduled, campaign-based plan" />
      {!kit.compact && <Signpost text={"CHALLENGES\nFRESHNESS · STOCK SYNC · FESTIVE PEAKS · LAST MILE"} position={[-5.4, g(-5.4, -71), -71]} rotation={0.55} width={4.6} height={2.4} color="#FFF5EE" fg="#2F1C1A" label="Logistics challenges: keeping snacks fresh, syncing stock across warehouses and dark stores, festive peaks, last-mile costs" />}
    </>
  );
}

export default function World() {
  return <ValleyWorld chapter="3.4" scenes={(kit) => <Scenes kit={kit} />} />;
}
