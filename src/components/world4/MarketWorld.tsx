"use client";
/* eslint-disable react-hooks/immutability -- three.js camera and lights are updated inside useFrame by design */

import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { useReducedMotion } from "motion/react";
import { useMediaQuery } from "@/lib/useClient";
import { Store } from "./Store";
import { Arena } from "./Arena";
import { Rooftop } from "./Rooftop";
import { Sky } from "./Skyline";

/**
 * Module 4 world — "Bazaar to Boardroom": a scroll-driven journey from the shop floor to the skyline.
 *
 * 4.1 (bright store interior) walks a flagship hypermarket: tall gondola shelves of official Eat Better packs
 *     and generic category packs with ₹ and ₹/g shelf tags, a giant digital weighing scale cycling through the
 *     four SKUs of the pricing table, checkout lanes with baskets, the online-orders corner with an order
 *     counter (~2 lakh orders a month) and a finance wall where FY23 → FY24 revenue rises as two towers.
 * 4.2 (golden hour, open air) circles the Snack Arena: four stall islands (Eat Better, traditional snack brands,
 *     direct health competitors, local sweet shops — generic packs by category, no competitor logos), shoppers
 *     moving between them, and the K-Matrix laid on the floor as tiles whose height and light show High/Medium/Low.
 * 4.3 (night) rides a glass elevator up a tower to a rooftop mission-control boardroom over a glowing map of
 *     India: the Jaipur facility (50,000 sq. ft.), Tier-1/Tier-2 city pins lighting up as dark stores, gift-hamper
 *     trucks on the routes, and four pillar beacons for the growth strategy.
 * Each chapter renders only its own district. Wrap the chapter's World in <WorldShell>.
 */

export type Chapter4 = "4.1" | "4.2" | "4.3";
export type MarketKit = {
  /** phone-size viewport: use fewer/smaller props */
  compact: boolean;
  /** prefers-reduced-motion: no idle animation */
  reduced: boolean;
  chapter: Chapter4;
  /** 0 = daylight … 1 = night: use for emissive lights */
  night: number;
};

/**
 * Optional external "drive" for previews: provide a ref holding 0..1 and the camera follows it instead
 * of the page scroll. Chapters don't use this.
 */
export const MarketDrive = createContext<React.RefObject<number> | null>(null);

type Look = { bg: string; fog: string; fogNear: number; fogFar: number; sun: string; sunI: number; sunDir: [number, number, number]; hemiSky: string; hemiGround: string; hemi: number; amb: number; exposure: number; night: number; shadowBox: number; fov: [number, number]; back: number };

const LOOK: Record<Chapter4, Look> = {
  // bright store interior: soft overhead light, warm-white haze for depth
  "4.1": { bg: "#F1ECE4", fog: "#EEE7DC", fogNear: 16, fogFar: 74, sun: "#FFF6EA", sunI: 1.5, sunDir: [0.25, 1, 0.35], hemiSky: "#FFFFFF", hemiGround: "#CDBFA8", hemi: 1.35, amb: 0.32, exposure: 1.0, night: 0, shadowBox: 26, fov: [50, 66], back: 1.2 },
  // golden hour over the open-air arena
  "4.2": { bg: "#F4C79A", fog: "#EFC9A4", fogNear: 50, fogFar: 230, sun: "#FFC27A", sunI: 2.7, sunDir: [-0.7, 0.42, -0.55], hemiSky: "#FBD9B4", hemiGround: "#6A4B3A", hemi: 0.85, amb: 0.2, exposure: 1.02, night: 0.15, shadowBox: 36, fov: [48, 62], back: 3 },
  // night rooftop: moonlight + city glow, the map and beacons carry the light
  "4.3": { bg: "#0B1026", fog: "#141B3D", fogNear: 70, fogFar: 300, sun: "#9DB4FF", sunI: 0.75, sunDir: [0.5, 0.8, -0.4], hemiSky: "#3A4A8C", hemiGround: "#120E1C", hemi: 0.55, amb: 0.14, exposure: 1.08, night: 1, shadowBox: 30, fov: [48, 64], back: 0 },
};

type Key = { pos: [number, number, number]; look: [number, number, number] };

/** Camera journeys (evenly spaced keyframes along the page scroll). */
const JOURNEY: Record<Chapter4, Key[]> = {
  "4.1": [
    { pos: [0, 2.8, 7.2], look: [0.6, 2.0, -20] }, // through the glass doors: the promenade between tall shelves
    { pos: [4.4, 2.0, 1.6], look: [5.4, 1.2, -9] }, // aisle entrance: end cap + Eat Better shelves with ₹/g tags
    { pos: [5.2, 1.85, -5.5], look: [5.0, 1.25, -17] }, // down the aisle: namkeen, chips, nut mixes
    { pos: [4.6, 2.2, -11], look: [-1.5, 1.6, -13] }, // the cross aisle back to the promenade
    { pos: [1.6, 2.9, -17.5], look: [0, 3.0, -27] }, // the giant scale appears
    { pos: [-1.6, 2.7, -19.6], look: [0.3, 2.0, -26.2] }, // the SKUs and their price-per-gram tags
    { pos: [2.4, 2.9, -29.5], look: [9.4, 1.2, -37] }, // checkout lanes and baskets
    { pos: [-2.0, 2.8, -26.8], look: [-8.6, 4.2, -33.5] }, // the order counter over online dispatch
    { pos: [-4.6, 7.4, -24], look: [0, 5, -46] }, // over the scale to the finance wall
    { pos: [0.4, 3.4, -32.2], look: [0.3, 5.0, -44] }, // revenue towers: FY23 → FY24
  ],
  "4.2": [
    { pos: [0, 17, 34], look: [0, 0, -2] }, // arriving over the arena gate
    { pos: [5, 9.5, 15], look: [0, 0.4, -1] }, // the K-Matrix on the floor
    { pos: [4.5, 3.2, 1], look: [13, 1.8, -9] }, // Eat Better stall
    { pos: [-1, 3.2, -4], look: [-13, 1.8, -9] }, // traditional snack brands
    { pos: [-4.5, 3.2, 3.5], look: [-13, 1.6, 10] }, // direct health competitors
    { pos: [3.5, 3.2, 5.5], look: [13, 1.6, 10] }, // local sweet shops
    { pos: [-11, 7.5, 3], look: [0, 0.4, -0.5] }, // along the matrix rows
    { pos: [0, 21, 9], look: [0, 0, -0.8] }, // the whole matrix from above
  ],
  "4.3": [
    { pos: [0, 3.2, 26.3], look: [3, 3.6, 70] }, // inside the glass elevator at street level
    { pos: [0, 20, 26.3], look: [14, 14, 80] }, // rising past the city
    { pos: [0, 41, 26.3], look: [-24, 28, 80] }, // the skyline at night
    { pos: [0, 53.5, 22.5], look: [0, 48.6, 2] }, // the rooftop: map + boardroom
    { pos: [5, 62, 14], look: [0, 48.5, -1] }, // high over the map of India
    { pos: [-6.5, 52.4, 2.5], look: [-3.4, 49, -3.8] }, // Jaipur: the 50,000 sq. ft. facility
    { pos: [7.5, 53.5, 11], look: [1.5, 48.8, 5] }, // dark stores lighting up, hamper trucks on the routes
    { pos: [0, 57, 22], look: [0, 51, -6] }, // the four pillar beacons
    { pos: [0.5, 50.1, -17.4], look: [0, 49, 6] }, // from the boardroom, over the map to the city
  ],
};

function CameraRig({ chapter, travel, compact, reduced, drive, sun, target }: { chapter: Chapter4; travel?: number; compact: boolean; reduced: boolean; drive: React.RefObject<number> | null; sun: React.RefObject<THREE.DirectionalLight | null>; target: THREE.Object3D }) {
  const { camera } = useThree();
  const curves = useMemo(() => {
    const keys = JOURNEY[chapter];
    return {
      pos: new THREE.CatmullRomCurve3(keys.map((k) => new THREE.Vector3(...k.pos)), false, "centripetal"),
      look: new THREE.CatmullRomCurve3(keys.map((k) => new THREE.Vector3(...k.look)), false, "centripetal"),
    };
  }, [chapter]);
  const frac = useMemo(() => {
    if (!travel) return 1;
    return Math.min(1, Math.max(0.05, travel / curves.pos.getLength()));
  }, [travel, curves]);
  const prog = useRef<number | null>(null);
  const t = useRef(0);
  const P = useMemo(() => new THREE.Vector3(), []);
  const L = useMemo(() => new THREE.Vector3(), []);
  const back = useMemo(() => new THREE.Vector3(), []);
  const mid = useMemo(() => new THREE.Vector3(), []);
  const look = LOOK[chapter];
  const dir = useMemo(() => new THREE.Vector3(...look.sunDir).normalize(), [look]);
  useFrame((_, dt) => {
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const p = drive ? (drive.current ?? 0) : max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
    const goal = p * frac;
    prog.current = prog.current === null || reduced ? goal : THREE.MathUtils.damp(prog.current, goal, 2.6, dt);
    t.current += dt;
    curves.pos.getPoint(prog.current, P);
    curves.look.getPoint(prog.current, L);
    if (compact && look.back) {
      // portrait phones: sit a little further back and higher so side subjects stay in frame
      back.copy(P).sub(L).setY(0).normalize();
      P.addScaledVector(back, look.back).y += look.back * 0.35;
    }
    if (!reduced) {
      P.x += Math.sin(t.current * 0.18) * (chapter === "4.1" ? 0.12 : 0.3);
      P.y += Math.sin(t.current * 0.27) * 0.06;
    }
    camera.position.copy(P);
    camera.lookAt(L);
    // the shadow box follows what the camera looks at
    mid.copy(P).lerp(L, 0.55);
    target.position.copy(mid);
    sun.current?.position.copy(mid).addScaledVector(dir, 60);
  });
  return null;
}

function MarketScene({ chapter, travel, compact, reduced, scenes, drive }: { chapter: Chapter4; travel?: number; compact: boolean; reduced: boolean; scenes?: (kit: MarketKit) => ReactNode; drive: React.RefObject<number> | null }) {
  const look = LOOK[chapter];
  const sun = useRef<THREE.DirectionalLight>(null);
  const target = useMemo(() => new THREE.Object3D(), []);
  const { gl, camera } = useThree();
  useEffect(() => {
    gl.toneMappingExposure = look.exposure;
  }, [gl, look.exposure]);
  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = compact ? look.fov[1] : look.fov[0];
    cam.updateProjectionMatrix();
  }, [camera, compact, look]);
  const sb = look.shadowBox;
  return (
    <>
      <color attach="background" args={[look.bg]} />
      <fog attach="fog" args={[look.fog, look.fogNear, look.fogFar]} />
      {chapter !== "4.1" && <Sky chapter={chapter} compact={compact} />}
      <hemisphereLight args={[look.hemiSky, look.hemiGround, look.hemi]} />
      <directionalLight
        ref={sun}
        target={target}
        color={look.sun}
        intensity={look.sunI}
        castShadow={!compact}
        shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-sb}
        shadow-camera-right={sb}
        shadow-camera-top={sb}
        shadow-camera-bottom={-sb}
        shadow-camera-near={5}
        shadow-camera-far={140}
        shadow-bias={-0.0004}
        shadow-normalBias={0.03}
      />
      <primitive object={target} />
      <ambientLight intensity={look.amb} color="#FFF4E6" />
      <CameraRig chapter={chapter} travel={travel} compact={compact} reduced={reduced} drive={drive} sun={sun} target={target} />
      {chapter === "4.1" && <Store compact={compact} reduced={reduced} />}
      {chapter === "4.2" && <Arena compact={compact} reduced={reduced} />}
      {chapter === "4.3" && <Rooftop compact={compact} reduced={reduced} />}
      {scenes?.({ compact, reduced, chapter, night: look.night })}
    </>
  );
}

export default function MarketWorld({ chapter, scenes, travel }: { chapter: Chapter4; scenes?: (kit: MarketKit) => ReactNode; travel?: number }) {
  const reduced = !!useReducedMotion();
  const compact = useMediaQuery("(max-width: 767px)");
  const [dpr, setDpr] = useState(1.5);
  const drive = useContext(MarketDrive);
  const start = JOURNEY[chapter][0].pos;
  return (
    <Canvas
      shadows={compact ? false : "percentage"}
      dpr={[1, compact ? Math.min(dpr, 1.25) : dpr]}
      camera={{ position: start, fov: compact ? LOOK[chapter].fov[1] : LOOK[chapter].fov[0], near: 0.1, far: 520 }}
      gl={{ antialias: !compact, powerPreference: "high-performance" }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.0;
      }}
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.5)} />
      <MarketScene chapter={chapter} travel={travel} compact={compact} reduced={reduced} scenes={scenes} drive={drive} />
    </Canvas>
  );
}
