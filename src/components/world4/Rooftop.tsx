"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Line } from "@react-three/drei";
import { Human, type HumanLook } from "@/components/world2/Human";
import { City } from "./Skyline";
import { Box, Glow, Label, TextBoard } from "./bits";
import { C } from "./kit";

/**
 * 4.3 — the daytime rooftop "mission control". A glass elevator rides up the tower (x=0, z≈26) to a roof deck at
 * y≈48 with a glowing, stylised map of India: Jaipur and its 50,000 sq. ft. facility, Tier-1 and Tier-2 city pins
 * that light up in turn as dark stores, gift-hamper trucks running out from Jaipur, four pillar beacons for the
 * growth strategy, and a glass boardroom at the back looking over the map to the city.
 * The map outline is simplified and the city list is illustrative (no store counts are claimed).
 */

const ROOF = 48;
const TOP = ROOF + 0.42; // walking surface
const MAP_Y = TOP + 0.08;
const S = 0.72; // map units per degree
const LON0 = 82.5;
const LAT0 = 22.5;
const toXZ = (lon: number, lat: number): [number, number] => [(lon - LON0) * S, -(lat - LAT0) * S];

// simplified outline (lon, lat), clockwise from the north
const OUTLINE: [number, number][] = [
  [74.5, 37.0], [77.8, 35.5], [79.0, 34.3], [78.8, 32.5], [81.0, 30.2], [84.5, 28.0], [88.2, 27.9], [88.8, 27.3], [92.0, 27.8], [95.5, 29.0],
  [97.3, 27.9], [96.0, 27.2], [94.6, 25.0], [93.2, 23.0], [92.3, 23.6], [91.5, 24.3], [89.8, 25.8], [88.6, 25.3], [88.9, 22.0], [87.0, 21.5],
  [86.8, 20.5], [85.0, 19.3], [82.3, 17.0], [80.3, 15.5], [80.2, 13.5], [79.8, 11.0], [79.3, 10.3], [78.1, 8.1], [77.2, 8.3], [76.3, 10.0],
  [75.3, 12.5], [74.6, 14.8], [73.4, 16.5], [72.8, 19.5], [72.6, 21.3], [72.0, 21.0], [70.0, 21.0], [69.0, 22.5], [68.4, 23.7], [70.5, 25.5],
  [71.0, 27.5], [72.5, 28.9], [73.8, 30.4], [74.6, 31.8], [73.8, 33.6],
];

const JAIPUR = toXZ(75.8, 26.9);
const CITIES: { name: string; tier: 1 | 2; lon: number; lat: number }[] = [
  { name: "Delhi", tier: 1, lon: 77.2, lat: 28.6 },
  { name: "Mumbai", tier: 1, lon: 72.9, lat: 19.1 },
  { name: "Bengaluru", tier: 1, lon: 77.6, lat: 13.0 },
  { name: "Chennai", tier: 1, lon: 80.3, lat: 13.1 },
  { name: "Kolkata", tier: 1, lon: 88.4, lat: 22.6 },
  { name: "Hyderabad", tier: 1, lon: 78.5, lat: 17.4 },
  { name: "Pune", tier: 1, lon: 73.9, lat: 18.5 },
  { name: "Ahmedabad", tier: 1, lon: 72.6, lat: 23.0 },
  { name: "Lucknow", tier: 2, lon: 80.9, lat: 26.8 },
  { name: "Indore", tier: 2, lon: 75.9, lat: 22.7 },
  { name: "Chandigarh", tier: 2, lon: 76.8, lat: 30.7 },
  { name: "Kochi", tier: 2, lon: 76.3, lat: 10.0 },
  { name: "Bhopal", tier: 2, lon: 77.4, lat: 23.3 },
  { name: "Nagpur", tier: 2, lon: 79.1, lat: 21.1 },
  { name: "Surat", tier: 2, lon: 72.8, lat: 21.2 },
  { name: "Coimbatore", tier: 2, lon: 77.0, lat: 11.0 },
  { name: "Patna", tier: 2, lon: 85.1, lat: 25.6 },
  { name: "Guwahati", tier: 2, lon: 91.7, lat: 26.1 },
];

const PILLARS = [
  { t: "PRODUCT PORTFOLIO", s: "new SKUs, clean label", c: C.yellow },
  { t: "QUICK COMMERCE", s: "Tier-1 & Tier-2 dark stores", c: C.teal },
  { t: "CORPORATE & B2B GIFTING", s: "year-round partnerships", c: C.orange },
  { t: "PRODUCTION CAPACITY", s: "50,000 sq. ft. in Jaipur", c: C.green },
];

const TEAM: HumanLook[] = [
  { skin: "#B98157", hair: "#1E1410", hairStyle: "side", outfit: "shirt", top: "#E8EEF4", bottom: "#2B3A55", accent: "#F4F7FA", facial: "stubble" },
  { skin: "#9C6644", hair: "#140C08", hairStyle: "bun", outfit: "salwar", top: "#7B2D26", bottom: "#E8DCC8", accent: "#F2A900", bindi: true, slim: true, height: 0.95 },
  { skin: "#C68B59", hair: "#2A1A12", hairStyle: "long", outfit: "shirt", top: "#1E3A5F", bottom: "#2B2B2B", accent: "#DCE6F0", slim: true, height: 0.95 },
];

/* ── the tower, elevator and roof deck ───────────────────────── */

function Tower({ compact }: { compact: boolean }) {
  const glass = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2B4A7A", roughness: 0.15, metalness: 0.6, emissive: "#1B2C55", emissiveIntensity: 0.35 }), []);
  const cab = useRef<THREE.Group>(null);
  useFrame(({ camera }) => {
    // the elevator car rides with the camera while it is in the shaft
    if (cab.current) cab.current.position.y = THREE.MathUtils.clamp(camera.position.y - 1.6, 0.4, ROOF + 0.4);
  });
  return (
    <group>
      {/* tower body with lit floor bands */}
      <Box s={[40, ROOF, 44]} p={[0, ROOF / 2, 0]} c="#1A2236" rough={0.5} metal={0.3} recv />
      {!compact &&
        Array.from({ length: 11 }, (_, i) => (
          <mesh key={i} position={[0, 3 + i * 4.2, 22.02]} material={glass}>
            <planeGeometry args={[38, 2.2]} />
          </mesh>
        ))}
      {/* roof slab + parapet */}
      <Box s={[41, 0.84, 45]} p={[0, ROOF, 0]} c="#2A3046" rough={0.8} recv />
      <Box s={[40, 0.06, 44]} p={[0, TOP - 0.03, 0]} c="#3A4258" rough={0.9} recv />
      {[
        [0, 21.9, 40, 0.2],
        [0, -21.9, 40, 0.2],
        [19.9, 0, 0.2, 44],
        [-19.9, 0, 0.2, 44],
      ].map(([x, z, w, d], i) => (
        <group key={i}>
          <Box s={[w, 1.0, d]} p={[x, TOP + 0.5, z]} c="#8FA6C8" rough={0.1} metal={0.4} />
          <Box s={[w + 0.05, 0.06, d + 0.05]} p={[x, TOP + 1.02, z]} c="#C9D6EA" rough={0.3} metal={0.7} />
        </group>
      ))}
      {/* glass elevator shaft on the front face + the car */}
      <Box s={[3.4, ROOF + 3, 0.2]} p={[0, (ROOF + 3) / 2, 24.6]} c="#7FA4D6" rough={0.05} metal={0.3} />
      {[-1.7, 1.7].map((x) => (
        <Box key={x} s={[0.2, ROOF + 3, 3.6]} p={[x, (ROOF + 3) / 2, 26.3]} c="#C9D6EA" rough={0.3} metal={0.7} />
      ))}
      <group ref={cab} position={[0, 1, 26.3]}>
        <Box s={[3.0, 0.15, 3.0]} p={[0, 0, 0]} c="#C9D6EA" rough={0.3} metal={0.7} />
        <Box s={[3.0, 0.15, 3.0]} p={[0, 3.1, 0]} c="#C9D6EA" rough={0.3} metal={0.7} />
        <Box s={[2.8, 0.05, 0.05]} p={[0, 1.05, 1.45]} c="#E8EEF6" rough={0.2} metal={0.8} />
        <pointLight position={[0, 2.8, 0]} color="#FFE9C2" intensity={6} distance={7} />
      </group>
      {/* rooftop light posts */}
      {[
        [-18.5, -20.5],
        [18.5, -20.5],
        [-18.5, 20.5],
        [18.5, 20.5],
      ].map(([x, z], i) => (
        <group key={i}>
          <Box s={[0.14, 3, 0.14]} p={[x, TOP + 1.5, z]} c="#3A4258" />
          <Glow position={[x, TOP + 3.1, z]} color="#FFE2A6" size={1.6} opacity={0.75} />
        </group>
      ))}
    </group>
  );
}

/* ── the map of India ───────────────────────────────────────── */

function IndiaMap({ compact, reduced }: { compact: boolean; reduced: boolean }) {
  const shapeGeo = useMemo(() => {
    const sh = new THREE.Shape(OUTLINE.map(([lon, lat]) => new THREE.Vector2((lon - LON0) * S, (lat - LAT0) * S)));
    const g = new THREE.ExtrudeGeometry(sh, { depth: 0.35, bevelEnabled: true, bevelThickness: 0.05, bevelSize: 0.06, bevelSegments: 2 });
    g.rotateX(-Math.PI / 2);
    return g;
  }, []);
  const edge = useMemo(() => [...OUTLINE, OUTLINE[0]].map(([lon, lat]) => new THREE.Vector3((lon - LON0) * S, MAP_Y + 0.42, -(lat - LAT0) * S)), []);
  const cities = compact ? CITIES.filter((c) => c.tier === 1 || ["Lucknow", "Indore", "Kochi"].includes(c.name)) : CITIES;

  return (
    <group>
      {/* plinth + glowing land */}
      <Box s={[26, 0.3, 27]} p={[0, MAP_Y - 0.05, 0.2]} c="#0F1730" rough={0.6} metal={0.3} recv />
      <Label label="A simplified map of India">
        <mesh geometry={shapeGeo} position={[0, MAP_Y + 0.05, 0]} castShadow={!compact} receiveShadow>
          <meshStandardMaterial color="#173A6B" emissive="#1E5AA8" emissiveIntensity={0.45} roughness={0.5} metalness={0.2} />
        </mesh>
      </Label>
      <Line points={edge} color={C.orange} lineWidth={2} transparent opacity={0.9} />
      {/* Jaipur + the facility */}
      <Label label="Jaipur: the 50,000 sq. ft. production facility">
        <group position={[JAIPUR[0], MAP_Y + 0.42, JAIPUR[1]]}>
          <Box s={[1.1, 0.45, 0.75]} p={[0, 0.22, 0]} c="#E9EEF5" rough={0.5} />
          <Box s={[1.16, 0.08, 0.8]} p={[0, 0.48, 0]} c={C.orange} e={C.orange} ei={0.6} />
          <Box s={[0.22, 0.7, 0.22]} p={[0.38, 0.35, -0.2]} c="#C9D6EA" />
          <Glow position={[0, 0.9, 0]} color={C.orange} size={3.2} opacity={0.65} />
        </group>
      </Label>
      <TextBoard lines={[{ t: "JAIPUR", size: 92, color: C.yellow, weight: 800 }, { t: "50,000 sq. ft. facility", size: 54, color: "#FFFFFF" }]} bg="rgba(14,26,58,0.85)" fg="#FFFFFF" w={3.4} h={1.15} position={[JAIPUR[0] - 0.6, MAP_Y + 2.3, JAIPUR[1] - 0.2]} rotation={[-0.25, 0.3, 0]} glow={0.9} basic />
      {/* city pins that light up in turn */}
      {cities.map((c, i) => (
        <CityPin key={c.name} city={c} index={i} count={cities.length} reduced={reduced} />
      ))}
      {/* hamper trucks out of Jaipur */}
      {!reduced && cities.slice(0, compact ? 3 : 7).map((c, i) => <Truck key={c.name} to={toXZ(c.lon, c.lat)} offset={i / 7} />)}
    </group>
  );
}

function CityPin({ city, index, count, reduced }: { city: (typeof CITIES)[number]; index: number; count: number; reduced: boolean }) {
  const [x, z] = toXZ(city.lon, city.lat);
  const head = useRef<THREE.MeshStandardMaterial>(null);
  const ring = useRef<THREE.Mesh>(null);
  const col = city.tier === 1 ? C.teal : C.yellow;
  useFrame(({ clock }) => {
    // a wave of "dark stores opening" sweeps through the pins every ~9 seconds
    const t = reduced ? 1 : ((clock.elapsedTime / 9) % 1) * (count + 4) - index;
    const on = THREE.MathUtils.clamp(t, 0, 1);
    if (head.current) head.current.emissiveIntensity = 0.25 + on * 1.6;
    if (ring.current) {
      const p = reduced ? 0.5 : (clock.elapsedTime * 0.8 + index * 0.37) % 1;
      ring.current.scale.setScalar(0.4 + p * 1.6 * on);
      (ring.current.material as THREE.MeshBasicMaterial).opacity = (1 - p) * 0.7 * on;
    }
  });
  const h = city.tier === 1 ? 1.1 : 0.75;
  return (
    <Label label={`${city.name} · Tier-${city.tier} city`}>
      <group position={[x, MAP_Y + 0.42, z]}>
        <mesh position={[0, h / 2, 0]}>
          <cylinderGeometry args={[0.035, 0.035, h, 6]} />
          <meshStandardMaterial color="#C9D6EA" />
        </mesh>
        <mesh position={[0, h + 0.12, 0]}>
          <sphereGeometry args={[city.tier === 1 ? 0.2 : 0.15, 16, 12]} />
          <meshStandardMaterial ref={head} color={col} emissive={col} emissiveIntensity={0.3} toneMapped={false} />
        </mesh>
        <mesh ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.02, 0]}>
          <ringGeometry args={[0.32, 0.4, 32]} />
          <meshBasicMaterial color={col} transparent opacity={0.5} depthWrite={false} toneMapped={false} />
        </mesh>
      </group>
    </Label>
  );
}

function Truck({ to, offset }: { to: [number, number]; offset: number }) {
  const g = useRef<THREE.Group>(null);
  const from = useMemo(() => new THREE.Vector3(JAIPUR[0], MAP_Y + 0.5, JAIPUR[1]), []);
  const dest = useMemo(() => new THREE.Vector3(to[0], MAP_Y + 0.5, to[1]), [to]);
  const path = useMemo(() => [from, dest], [from, dest]);
  useFrame(({ clock }) => {
    if (!g.current) return;
    const t = (clock.elapsedTime * 0.12 + offset) % 1;
    g.current.position.lerpVectors(from, dest, t);
    g.current.lookAt(dest.x, g.current.position.y, dest.z);
  });
  return (
    <group>
      <Line points={path} color={C.orange} lineWidth={1} transparent opacity={0.35} dashed dashSize={0.25} gapSize={0.18} />
      <group ref={g}>
        <Box s={[0.22, 0.2, 0.42]} p={[0, 0.1, 0]} c={C.orange} e={C.orange} ei={0.4} />
        <Box s={[0.22, 0.16, 0.14]} p={[0, 0.08, 0.27]} c="#F4F1EC" />
      </group>
    </group>
  );
}

/* ── pillar beacons + boardroom ─────────────────────────────── */

function Pillars({ reduced }: { reduced: boolean }) {
  const beams = useRef<(THREE.MeshBasicMaterial | null)[]>([]);
  useFrame(({ clock }) => {
    beams.current.forEach((m, i) => {
      if (m) m.opacity = reduced ? 0.35 : 0.25 + 0.15 * Math.sin(clock.elapsedTime * 1.5 + i);
    });
  });
  return (
    <group>
      {PILLARS.map((p, i) => {
        const x = -7.5 + i * 5;
        return (
          <Label key={p.t} label={`Growth pillar: ${p.t.toLowerCase()}`}>
            <group position={[x, TOP, -11]}>
              <Box s={[1.4, 0.5, 1.4]} p={[0, 0.25, 0]} c="#1A2236" metal={0.4} rough={0.4} />
              <Box s={[0.9, 2.2 + i * 0.5, 0.9]} p={[0, 0.5 + (2.2 + i * 0.5) / 2, 0]} c={p.c} e={p.c} ei={0.55} rough={0.3} />
              <mesh position={[0, 7, 0]}>
                <cylinderGeometry args={[0.3, 0.55, 12, 16, 1, true]} />
                <meshBasicMaterial ref={(m) => void (beams.current[i] = m)} color={p.c} transparent opacity={0.3} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
              </mesh>
              <TextBoard lines={[{ t: `${i + 1}`, size: 120, color: p.c, weight: 800 }, { t: p.t, size: 46, color: "#FFFFFF", weight: 800 }, { t: p.s, size: 34, color: "#C9D6EA" }]} bg="rgba(14,26,58,0.88)" fg="#FFFFFF" w={3.2} h={1.9} position={[0, 4.2 + i * 0.5, 0.8]} glow={0.9} basic />
            </group>
          </Label>
        );
      })}
    </group>
  );
}

function Boardroom({ compact }: { compact: boolean }) {
  const glass = useMemo(() => new THREE.MeshStandardMaterial({ color: "#9CC3F0", roughness: 0.05, metalness: 0.2, transparent: true, opacity: 0.18, depthWrite: false }), []);
  return (
    <Label label="The boardroom: where the growth plan is run">
      <group position={[0, TOP, -19]}>
        {/* floor, roof and glass walls (open view towards the map) */}
        <Box s={[13, 0.1, 6.5]} p={[0, 0.05, 0]} c="#3B2F2A" rough={0.6} recv />
        <Box s={[13.2, 0.25, 6.7]} p={[0, 3.5, 0]} c="#E9EEF5" rough={0.6} />
        {[-6.5, 6.5].map((x) => (
          <mesh key={x} position={[x, 1.75, 0]} rotation={[0, Math.PI / 2, 0]} material={glass}>
            <planeGeometry args={[6.5, 3.5]} />
          </mesh>
        ))}
        <mesh position={[0, 1.75, 3.25]} material={glass}>
          <planeGeometry args={[13, 3.5]} />
        </mesh>
        <Box s={[13, 3.5, 0.15]} p={[0, 1.75, -3.25]} c="#1A2236" />
        {/* wall screen: the four pillars */}
        <TextBoard
          lines={[
            { t: "GROWTH PLAN", size: 64, color: C.yellow, weight: 800 },
            { t: "1  Product portfolio", size: 40, color: "#FFFFFF" },
            { t: "2  Quick-commerce acceleration", size: 40, color: "#FFFFFF" },
            { t: "3  Corporate & B2B gifting", size: 40, color: "#FFFFFF" },
            { t: "4  Production capacity", size: 40, color: "#FFFFFF" },
          ]}
          bg="#0E1A3A"
          fg="#FFFFFF"
          w={5.2}
          h={2.3}
          position={[0, 1.9, -3.15]}
          glow={1}
          basic
        />
        {/* table + people */}
        <Box s={[5.6, 0.12, 1.8]} p={[0, 0.78, -0.4]} c="#6B4A35" rough={0.4} cast />
        <Box s={[0.3, 0.72, 0.3]} p={[-2.2, 0.36, -0.4]} c="#2A2A2A" />
        <Box s={[0.3, 0.72, 0.3]} p={[2.2, 0.36, -0.4]} c="#2A2A2A" />
        {!compact &&
          TEAM.map((l, i) => (
            <group key={i} position={[-2 + i * 2, 0, i === 1 ? -1.6 : 0.9]} rotation={[0, i === 1 ? 0 : Math.PI, 0]}>
              <Human look={l} mode="stand" phase={i * 2} />
            </group>
          ))}
        <pointLight position={[0, 3.1, 0]} color="#FFE9C2" intensity={10} distance={10} />
      </group>
    </Label>
  );
}

export function Rooftop({ compact, reduced }: { compact: boolean; reduced: boolean }) {
  return (
    <group>
      <City night={false} compact={compact} clear={40} />
      <Tower compact={compact} />
      <IndiaMap compact={compact} reduced={reduced} />
      <Pillars reduced={reduced} />
      <Boardroom compact={compact} />
      <hemisphereLight args={["#3A4A8C", "#120E1C", 0.25]} />
      <pointLight position={[0, TOP + 9, 0]} color="#7FA8FF" intensity={30} distance={40} />
    </group>
  );
}
