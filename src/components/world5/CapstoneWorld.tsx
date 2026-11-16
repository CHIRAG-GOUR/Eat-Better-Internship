"use client";
/* eslint-disable react-hooks/immutability -- three.js camera and lights are updated inside useFrame by design */

import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { PerformanceMonitor } from "@react-three/drei";
import { useReducedMotion } from "motion/react";
import { useMediaQuery } from "@/lib/useClient";

export type Chapter5 = "5.1" | "5.2";

export const CapstoneDrive = createContext<React.RefObject<number> | null>(null);

type Look = {
  bg: string;
  fog: string;
  fogNear: number;
  fogFar: number;
  sun: string;
  sunI: number;
  sunDir: [number, number, number];
  hemiSky: string;
  hemiGround: string;
  hemi: number;
  amb: number;
  exposure: number;
  night: number;
  fov: [number, number];
};

const LOOK: Record<Chapter5, Look> = {
  // 5.1: The Grand Innovation Hub (warm architectural light, golden amber tones, clean glass pavilion)
  "5.1": {
    bg: "#FBF5EE",
    fog: "#F5EADF",
    fogNear: 20,
    fogFar: 95,
    sun: "#FFF2E2",
    sunI: 2.2,
    sunDir: [0.4, 1.2, 0.5],
    hemiSky: "#FFFFFF",
    hemiGround: "#D8C5B0",
    hemi: 1.1,
    amb: 0.35,
    exposure: 1.05,
    night: 0,
    fov: [48, 62],
  },
  // 5.2: The Founder's Broadcast & Pitch Stage (cinematic spotlight, rich cocoa studio, luminous stage)
  "5.2": {
    bg: "#181216",
    fog: "#22171E",
    fogNear: 25,
    fogFar: 110,
    sun: "#FFB085",
    sunI: 2.8,
    sunDir: [-0.3, 1.4, 0.7],
    hemiSky: "#5A3A42",
    hemiGround: "#180F12",
    hemi: 0.75,
    amb: 0.22,
    exposure: 1.12,
    night: 1,
    fov: [46, 60],
  },
};

type Key = { pos: [number, number, number]; look: [number, number, number] };

const JOURNEY: Record<Chapter5, Key[]> = {
  "5.1": [
    { pos: [0, 3.8, 14.5], look: [0, 2.2, 0] },     // Entrance to the Innovation Pavilion
    { pos: [4.8, 3.0, 9.2], look: [2.2, 1.8, 2.0] },  // Track 1 & 2 Pods (Product & Festive Box)
    { pos: [-4.5, 3.2, 5.0], look: [-1.5, 1.6, -1.0] }, // Track 3 & 4 Pods (Campaign & Consumer Lab)
    { pos: [0, 4.2, 3.2], look: [0, 1.8, -4.5] },    // GTM Canvas Central Table
    { pos: [3.2, 2.8, -3.5], look: [0, 2.0, -8.0] },  // Financial & Metrics Board
    { pos: [0, 6.5, 8.0], look: [0, 1.5, -3.0] },    // Elevated Panorama of Capstone Projects
  ],
  "5.2": [
    { pos: [0, 3.2, 11.5], look: [0, 2.0, 0] },      // Studio Floor entrance facing the Pitch Stage
    { pos: [2.8, 2.4, 6.8], look: [0.5, 1.9, 0.5] },  // Teleprompter & Camera Rig perspective
    { pos: [-3.2, 2.6, 4.5], look: [0, 1.8, -1.0] }, // Storyboard & 4-Beat Display panel
    { pos: [0, 2.0, 3.5], look: [0, 1.7, -2.5] },     // Close-up on the Speaker Podium with Snack Showcase
    { pos: [-2.2, 3.6, 7.8], look: [0, 1.9, 0] },    // Studio Director Booth view
    { pos: [0, 5.8, 12.0], look: [0, 2.2, -1.0] },    // Grand Studio Ovation Panorama
  ],
};

function CameraRig({
  chapter,
  compact,
  reduced,
  drive,
  sun,
  target,
}: {
  chapter: Chapter5;
  compact: boolean;
  reduced: boolean;
  drive: React.RefObject<number> | null;
  sun: React.RefObject<THREE.DirectionalLight | null>;
  target: THREE.Object3D;
}) {
  const { camera } = useThree();
  const curves = useMemo(() => {
    const pts = JOURNEY[chapter];
    const pos = pts.map((p) => new THREE.Vector3(...p.pos));
    const look = pts.map((p) => new THREE.Vector3(...p.look));
    return {
      pos: new THREE.CatmullRomCurve3(pos, false, "catmullrom", 0.3),
      look: new THREE.CatmullRomCurve3(look, false, "catmullrom", 0.3),
    };
  }, [chapter]);

  const pVec = useRef(new THREE.Vector3());
  const lVec = useRef(new THREE.Vector3());
  const curPos = useRef(new THREE.Vector3());
  const curLook = useRef(new THREE.Vector3());
  const initialized = useRef(false);

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    const [d, m] = LOOK[chapter].fov;
    cam.fov = compact ? m : d;
    cam.updateProjectionMatrix();
  }, [camera, chapter, compact]);

  useFrame((state, delta) => {
    let t = 0;
    if (drive && typeof drive.current === "number") {
      t = THREE.MathUtils.clamp(drive.current, 0, 1);
    } else if (typeof window !== "undefined") {
      const maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      t = THREE.MathUtils.clamp(window.scrollY / maxScroll, 0, 1);
    }

    curves.pos.getPoint(t, pVec.current);
    curves.look.getPoint(t, lVec.current);

    if (!reduced) {
      const breath = Math.sin(state.clock.elapsedTime * 0.7) * 0.08;
      pVec.current.y += breath;
      pVec.current.x += Math.cos(state.clock.elapsedTime * 0.5) * 0.05;
    }

    const damp = initialized.current ? 1 - Math.exp(-6 * delta) : 1;
    curPos.current.lerp(pVec.current, damp);
    curLook.current.lerp(lVec.current, damp);

    camera.position.copy(curPos.current);
    camera.lookAt(curLook.current);

    if (sun.current) {
      target.position.copy(curLook.current);
      sun.current.target = target;
    }

    initialized.current = true;
  });

  return null;
}

/** 3D Innovation Stage for Chapter 5.1 (GTM Hub) */
function InnovationPavilion({ compact }: { compact: boolean }) {
  const goldMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#ff5c00",
        roughness: 0.35,
        metalness: 0.6,
      }),
    []
  );
  const creamMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#fff5ee",
        roughness: 0.8,
      }),
    []
  );
  const cocoaMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#2f1c1a",
        roughness: 0.6,
      }),
    []
  );
  const glassMat = useMemo(
    () =>
      new THREE.MeshPhysicalMaterial({
        color: "#fed300",
        roughness: 0.1,
        transmission: 0.6,
        thickness: 0.8,
        transparent: true,
        opacity: 0.45,
      }),
    []
  );

  const ringRef = useRef<THREE.Group>(null);
  const podsRef = useRef<THREE.Group>(null);

  useFrame((_, delta) => {
    if (ringRef.current) ringRef.current.rotation.y += delta * 0.15;
    if (podsRef.current) podsRef.current.rotation.y -= delta * 0.08;
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Floor Terrace */}
      <mesh position={[0, -0.1, 0]} receiveShadow>
        <cylinderGeometry args={[14, 15, 0.4, 32]} />
        <primitive object={creamMat} />
      </mesh>
      <mesh position={[0, 0.05, 0]} receiveShadow>
        <ringGeometry args={[5, 13.5, 32]} />
        <meshStandardMaterial color="#faede2" roughness={0.9} />
      </mesh>

      {/* Central Innovation Stage */}
      <mesh position={[0, 0.4, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[4.2, 4.6, 0.6, 32]} />
        <primitive object={cocoaMat} />
      </mesh>
      <mesh position={[0, 0.72, 0]} receiveShadow>
        <cylinderGeometry args={[3.8, 3.8, 0.05, 32]} />
        <primitive object={goldMat} />
      </mesh>

      {/* Center Holographic Brand Beacon */}
      <group position={[0, 1.8, 0]}>
        <mesh castShadow>
          <octahedronGeometry args={[0.7, 0]} />
          <meshStandardMaterial color="#fed300" emissive="#ff5c00" emissiveIntensity={0.6} roughness={0.2} metalness={0.8} />
        </mesh>
        <pointLight color="#ff8b42" intensity={2.5} distance={10} />
      </group>

      {/* Rotating Floating Halo Ring */}
      <group ref={ringRef} position={[0, 4.2, 0]}>
        <mesh>
          <torusGeometry args={[3.5, 0.06, 16, 64]} />
          <primitive object={goldMat} />
        </mesh>
      </group>

      {/* 5 Project Track Display Pedestals */}
      <group ref={podsRef} position={[0, 0, 0]}>
        {[0, 1, 2, 3, 4].map((i) => {
          const angle = (i * Math.PI * 2) / 5;
          const rad = 7.5;
          const x = Math.sin(angle) * rad;
          const z = Math.cos(angle) * rad;
          return (
            <group key={i} position={[x, 0, z]}>
              {/* Pedestal */}
              <mesh position={[0, 0.6, 0]} castShadow receiveShadow>
                <cylinderGeometry args={[0.9, 1.1, 1.2, 18]} />
                <primitive object={creamMat} />
              </mesh>
              {/* Glowing Pedestal Rim */}
              <mesh position={[0, 1.21, 0]}>
                <cylinderGeometry args={[0.85, 0.85, 0.05, 18]} />
                <primitive object={goldMat} />
              </mesh>
              {/* Exhibit Prop (e.g. snack box / hamper / graph) */}
              <mesh position={[0, 1.6, 0]} castShadow>
                <boxGeometry args={[0.6, 0.7, 0.4]} />
                <meshStandardMaterial color={i === 1 ? "#550d10" : i === 2 ? "#fed300" : "#ff5c00"} roughness={0.4} />
              </mesh>
            </group>
          );
        })}
      </group>

      {/* Pavilion Architectural Columns */}
      {!compact && (
        <group>
          {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
            const a = (i * Math.PI * 2) / 8;
            const x = Math.sin(a) * 12.5;
            const z = Math.cos(a) * 12.5;
            return (
              <group key={i} position={[x, 0, z]}>
                <mesh position={[0, 3.2, 0]} castShadow>
                  <cylinderGeometry args={[0.22, 0.28, 6.4, 16]} />
                  <primitive object={cocoaMat} />
                </mesh>
                <mesh position={[0, 6.5, 0]}>
                  <sphereGeometry args={[0.3, 16, 16]} />
                  <primitive object={goldMat} />
                </mesh>
              </group>
            );
          })}
        </group>
      )}

      {/* Glass Roof Canopy */}
      <mesh position={[0, 7.2, 0]}>
        <coneGeometry args={[13.5, 2.5, 32, 1, true]} />
        <primitive object={glassMat} />
      </mesh>
    </group>
  );
}

/** 3D Pitch Stage for Chapter 5.2 (Video Studio) */
function BroadcastStudio({ compact }: { compact: boolean }) {
  const stageMat = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#2f1c1a",
        roughness: 0.4,
        metalness: 0.3,
      }),
    []
  );
  const goldTrim = useMemo(
    () =>
      new THREE.MeshStandardMaterial({
        color: "#ff5c00",
        roughness: 0.2,
        metalness: 0.8,
        emissive: "#af4300",
        emissiveIntensity: 0.4,
      }),
    []
  );

  const spotRef = useRef<THREE.SpotLight>(null);
  const cameraArmRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    if (cameraArmRef.current) {
      cameraArmRef.current.position.y = 1.4 + Math.sin(clock.elapsedTime * 0.8) * 0.1;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Studio Floor */}
      <mesh position={[0, -0.15, 0]} receiveShadow>
        <boxGeometry args={[30, 0.3, 30]} />
        <meshStandardMaterial color="#1a1418" roughness={0.7} />
      </mesh>

      {/* Curved Presentation Stage */}
      <group position={[0, 0, -2]}>
        <mesh position={[0, 0.35, 0]} receiveShadow castShadow>
          <cylinderGeometry args={[5.5, 6.0, 0.7, 36, 1, false, 0, Math.PI]} />
          <primitive object={stageMat} />
        </mesh>
        <mesh position={[0, 0.71, 0]}>
          <cylinderGeometry args={[5.2, 5.2, 0.05, 36, 1, false, 0, Math.PI]} />
          <primitive object={goldTrim} />
        </mesh>

        {/* Presenter Podium */}
        <mesh position={[0, 1.25, 1.5]} castShadow>
          <cylinderGeometry args={[0.55, 0.65, 1.1, 20]} />
          <meshStandardMaterial color="#4a3230" roughness={0.4} />
        </mesh>
        <mesh position={[0, 1.82, 1.5]}>
          <boxGeometry args={[0.9, 0.06, 0.6]} />
          <meshStandardMaterial color="#fed300" roughness={0.2} metalness={0.7} />
        </mesh>

        {/* Eat Better Snack Hero Box on Podium */}
        <mesh position={[0, 2.05, 1.5]} castShadow>
          <boxGeometry args={[0.42, 0.38, 0.3]} />
          <meshStandardMaterial color="#ff5c00" roughness={0.3} />
        </mesh>
      </group>

      {/* Teleprompter & Studio Broadcast Camera Rig */}
      <group ref={cameraArmRef} position={[0, 1.4, 3.8]}>
        {/* Tripod Stand */}
        <mesh position={[0, -0.65, 0]} castShadow>
          <cylinderGeometry args={[0.06, 0.08, 1.3, 12]} />
          <meshStandardMaterial color="#000000" metalness={0.9} roughness={0.2} />
        </mesh>
        {/* Camera Body */}
        <mesh position={[0, 0.1, 0]} castShadow>
          <boxGeometry args={[0.5, 0.45, 0.75]} />
          <meshStandardMaterial color="#222" metalness={0.8} roughness={0.3} />
        </mesh>
        {/* Studio Lens */}
        <mesh position={[0, 0.1, -0.45]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.18, 0.16, 0.35, 20]} />
          <meshStandardMaterial color="#111" metalness={0.9} roughness={0.1} />
        </mesh>
        {/* Teleprompter Glass Hood & Reflection Screen */}
        <mesh position={[0, 0.42, -0.32]} rotation={[Math.PI / 5, 0, 0]}>
          <planeGeometry args={[0.9, 0.65]} />
          <meshPhysicalMaterial color="#fed300" transmission={0.7} roughness={0.1} transparent opacity={0.65} />
        </mesh>
        {/* Tally Light (Recording Red Light) */}
        <mesh position={[0, 0.38, 0.1]}>
          <sphereGeometry args={[0.06, 12, 12]} />
          <meshStandardMaterial color="#ff0000" emissive="#ff0000" emissiveIntensity={2.5} />
        </mesh>
      </group>

      {/* Main Overhead Key Spotlight focused on presenter */}
      <spotLight
        ref={spotRef}
        position={[0, 7.5, 1.5]}
        target-position={[0, 1.5, -0.5]}
        color="#fff0e0"
        intensity={5.5}
        angle={0.55}
        penumbra={0.6}
        castShadow
      />

      {/* Ambient Rim Stage Spotlights */}
      <spotLight position={[-4, 5, -3]} target-position={[0, 1.5, -2]} color="#ff5c00" intensity={3.5} angle={0.45} />
      <spotLight position={[4, 5, -3]} target-position={[0, 1.5, -2]} color="#fed300" intensity={3.5} angle={0.45} />

      {/* Acoustic Backdrop Slats */}
      {!compact && (
        <group position={[0, 2.5, -6.5]}>
          {[-7, -5.5, -4, -2.5, -1, 0.5, 2, 3.5, 5, 6.5].map((x) => (
            <mesh key={x} position={[x, 0, 0]} castShadow>
              <boxGeometry args={[0.9, 5.5, 0.2]} />
              <meshStandardMaterial color="#381c11" roughness={0.8} />
            </mesh>
          ))}
          {/* Backlit Eat Better Brand Halo Sign */}
          <mesh position={[0, 1.8, 0.2]}>
            <circleGeometry args={[1.5, 32]} />
            <meshStandardMaterial color="#ff5c00" emissive="#ff5c00" emissiveIntensity={0.8} />
          </mesh>
        </group>
      )}
    </group>
  );
}

export default function CapstoneWorld({ chapter }: { chapter: Chapter5 }) {
  const compact = useMediaQuery("(max-width: 640px)");
  const reduced = useReducedMotion();
  const drive = useContext(CapstoneDrive);
  const [dpr, setDpr] = useState(1.5);

  const sunRef = useRef<THREE.DirectionalLight | null>(null);
  const targetObj = useMemo(() => new THREE.Object3D(), []);

  const look = LOOK[chapter];

  return (
    <Canvas
      shadows={!compact}
      dpr={[1, compact ? Math.min(dpr, 1.25) : dpr]}
      gl={{ antialias: true, alpha: true, powerPreference: "high-performance" }}
      className="size-full"
    >
      <PerformanceMonitor onDecline={() => setDpr(1)} onIncline={() => setDpr(1.5)} />
      <color attach="background" args={[look.bg]} />
      <fog attach="fog" args={[look.fog, look.fogNear, look.fogFar]} />

      <ambientLight intensity={look.amb} />
      <hemisphereLight args={[look.hemiSky, look.hemiGround, look.hemi]} />

      <directionalLight
        ref={sunRef}
        position={look.sunDir}
        intensity={look.sunI}
        color={look.sun}
        castShadow={!compact}
        shadow-mapSize={compact ? 512 : 1024}
        shadow-camera-near={1}
        shadow-camera-far={45}
        shadow-camera-left={-12}
        shadow-camera-right={12}
        shadow-camera-top={12}
        shadow-camera-bottom={-12}
      />
      <primitive object={targetObj} />

      <CameraRig
        chapter={chapter}
        compact={compact}
        reduced={!!reduced}
        drive={drive}
        sun={sunRef}
        target={targetObj}
      />

      {chapter === "5.1" ? (
        <InnovationPavilion compact={compact} />
      ) : (
        <BroadcastStudio compact={compact} />
      )}
    </Canvas>
  );
}
