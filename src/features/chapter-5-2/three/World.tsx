"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@react-three/drei";
import BoulevardWorld, { Billboard, signTexture, type BoulevardKit } from "@/components/world2/BoulevardWorld";
import { Person, still, type Look, type Pose } from "@/components/sim/Person";
import { Hoverable } from "@/components/world/hover";

/**
 * Chapter 5.2 (Capstone Project 2) World — Module 2 Brand Boulevard (Media & Pitch District).
 * An Indian High Street with pitch studio front, TV cameras, press photographers, and Eat Better billboards.
 */

function Sign({ x, z, text, rot, kit }: { x: number; z: number; text: string; rot: number; kit: BoulevardKit }) {
  const tex = useMemo(() => signTexture(text, "#1B1426", "#FED300", 768, 128), [text]);
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <group position={[x, 0, z]} rotation={[0, rot, 0]}>
      <mesh position={[0, 1.4, 0]}>
        <cylinderGeometry args={[0.05, 0.05, 2.8, 8]} />
        <meshStandardMaterial color="#3B3B3B" />
      </mesh>
      <mesh position={[0, 2.8, 0.02]}>
        <planeGeometry args={[2.4, 0.4]} />
        <meshStandardMaterial
          map={tex}
          emissiveMap={tex}
          emissive="#FFFFFF"
          emissiveIntensity={0.4 + kit.night * 0.6}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function StudioFront({ x, z, rot, kit }: { x: number; z: number; rot: number; kit: BoulevardKit }) {
  const tex = useMemo(() => signTexture("THE PITCH · CAPSTONE STUDIO", "#2F1C1A", "#FFF5EE", 768, 128), []);
  useEffect(() => () => tex.dispose(), [tex]);
  const beams = useRef<THREE.Group>(null);
  const bulbs = useMemo(() => Array.from({ length: kit.compact ? 10 : 18 }, (_, i) => i), [kit.compact]);

  useFrame(({ clock }) => {
    if (!beams.current || kit.reduced) return;
    const t = clock.elapsedTime;
    beams.current.children.forEach((b, i) => {
      b.rotation.z = Math.sin(t * 0.6 + i * 2) * 0.45;
    });
  });

  return (
    <Hoverable label="Capstone Pitch Studio — 60-90s executive video presentation">
      <group position={[x, 0, z]} rotation={[0, rot, 0]}>
        <mesh position={[0, 2, -0.6]} castShadow>
          <boxGeometry args={[3.4, 4, 0.8]} />
          <meshStandardMaterial color="#241A33" roughness={0.6} />
        </mesh>
        <mesh position={[0, 1.15, -0.19]}>
          <planeGeometry args={[1.5, 2.1]} />
          <meshStandardMaterial color="#FFB866" emissive="#FF8A3D" emissiveIntensity={1.2} toneMapped={false} />
        </mesh>
        <mesh position={[0, 3.1, -0.18]}>
          <planeGeometry args={[3.0, 0.5]} />
          <meshStandardMaterial
            map={tex}
            emissiveMap={tex}
            emissive="#FFFFFF"
            emissiveIntensity={0.9}
            toneMapped={false}
          />
        </mesh>
        {bulbs.map((i) => {
          const k = i / (bulbs.length - 1);
          return (
            <mesh key={i} position={[-1.6 + k * 3.2, 3.55, -0.16]}>
              <sphereGeometry args={[0.06, 8, 6]} />
              <meshStandardMaterial color="#FFE6B0" emissive="#FFC24D" emissiveIntensity={2.2} toneMapped={false} />
            </mesh>
          );
        })}
        {/* Red carpet */}
        <mesh position={[0, 0.13, 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.2, 1.6]} />
          <meshStandardMaterial color="#B3261E" roughness={0.9} />
        </mesh>
        {!kit.compact && (
          <group ref={beams} position={[0, 4, -0.6]}>
            {[-1.2, 1.2].map((bx) => (
              <mesh key={bx} position={[bx, 0, 0]}>
                <coneGeometry args={[0.7, 9, 20, 1, true]} />
                <meshBasicMaterial color="#CFE3FF" transparent opacity={0.08} depthWrite={false} side={THREE.DoubleSide} />
              </mesh>
            ))}
          </group>
        )}
      </group>
    </Hoverable>
  );
}

function TvCamera({ x, z, rot }: { x: number; z: number; rot: number }) {
  return (
    <Hoverable label="Studio TV Camera & Teleprompter Rig">
      <group position={[x, 0.12, z]} rotation={[0, rot, 0]}>
        {[0, 1, 2].map((k) => {
          const a = (k * 2 * Math.PI) / 3;
          return (
            <mesh
              key={k}
              position={[Math.sin(a) * 0.28, 0.6, Math.cos(a) * 0.28]}
              rotation={[Math.cos(a) * 0.3, 0, -Math.sin(a) * 0.3]}
            >
              <cylinderGeometry args={[0.025, 0.025, 1.3, 6]} />
              <meshStandardMaterial color="#2B2A29" />
            </mesh>
          );
        })}
        <RoundedBox args={[0.42, 0.42, 0.8]} radius={0.05} position={[0, 1.4, 0]} castShadow>
          <meshStandardMaterial color="#1E1A18" roughness={0.4} metalness={0.4} />
        </RoundedBox>
        <mesh position={[0, 1.42, 0.48]} rotation={[Math.PI / 2, 0, 0]}>
          <cylinderGeometry args={[0.16, 0.18, 0.25, 20]} />
          <meshStandardMaterial color="#111" metalness={0.6} roughness={0.2} />
        </mesh>
        <mesh position={[0.12, 1.66, 0.3]}>
          <sphereGeometry args={[0.035, 10, 8]} />
          <meshStandardMaterial color="#FF3B30" emissive="#FF3B30" emissiveIntensity={2} toneMapped={false} />
        </mesh>
      </group>
    </Hoverable>
  );
}

const PRESS: Look[] = [
  { skin: "#B98157", top: "#37474F", bottom: "#212121", hair: "#140C08", hairStyle: "short", extra: "cap", extraColor: "#1565C0" },
  { skin: "#9C6644", top: "#5D4037", bottom: "#3E2723", hair: "#140C08", hairStyle: "long" },
  { skin: "#D4A373", top: "#455A64", bottom: "#263238", hair: "#3E2723", hairStyle: "short", extra: "glasses", extraColor: "#2F1C1A" },
];

function PressPack({ x, z, rot, kit }: { x: number; z: number; rot: number; kit: BoulevardKit }) {
  const n = kit.compact ? 2 : 3;
  const poses = useMemo(() => Array.from({ length: n }, () => ({ current: still({ arm: 0.5 }) as Pose })), [n]);
  const flashes = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const seeds = useMemo(() => Array.from({ length: n }, (_, i) => 1.3 + i * 0.77), [n]);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    flashes.current.forEach((m, i) => {
      if (!m) return;
      const phase = (t * seeds[i]) % 2.4;
      m.emissiveIntensity = kit.reduced ? 0.6 : phase < 0.12 ? 6 : 0;
    });
  });

  return (
    <Hoverable label="Press photographers — capturing Capstone pitches">
      <group position={[x, 0.12, z]} rotation={[0, rot, 0]}>
        {Array.from({ length: n }, (_, i) => (
          <group key={i} position={[(i - (n - 1) / 2) * 0.75, 0, (i % 2) * 0.35]}>
            <Person look={PRESS[i]} pose={poses[i]} />
            <group position={[0, 1.6, 0.42]}>
              <RoundedBox args={[0.24, 0.16, 0.14]} radius={0.02}>
                <meshStandardMaterial color="#1E1A18" />
              </RoundedBox>
              <mesh position={[0, 0, 0.1]} rotation={[Math.PI / 2, 0, 0]}>
                <cylinderGeometry args={[0.07, 0.08, 0.12, 12]} />
                <meshStandardMaterial color="#111" />
              </mesh>
              <mesh position={[0.09, 0.12, 0.02]}>
                <boxGeometry args={[0.06, 0.04, 0.02]} />
                <meshStandardMaterial
                  ref={(el) => {
                    flashes.current[i] = el;
                  }}
                  color="#EBF4FF"
                  emissive="#D4E8FF"
                  emissiveIntensity={0}
                  toneMapped={false}
                />
              </mesh>
            </group>
          </group>
        ))}
      </group>
    </Hoverable>
  );
}

export default function World() {
  return (
    <BoulevardWorld
      chapter="2.4"
      scenes={(kit) => (
        <>
          <Sign x={5.6} z={-6} text="CAPSTONE PITCH & MEDIA" rot={-0.6} kit={kit} />
          <StudioFront x={6.4} z={-11} rot={-1.25} kit={kit} />
          <TvCamera x={5.5} z={-8.3} rot={-2.2} />
          <PressPack x={-5.8} z={-12.5} rot={1.3} kit={kit} />

          <Hoverable label="Eat Better on Shark Tank India">
            <Billboard src="/chapter-2-4/lms-3.png" position={[-6.1, 3.3, -19]} rotation={[0, 0.9, 0]} width={2.4} height={2.4} />
          </Hoverable>

          <Hoverable label="Festive gifting hampers">
            <Billboard src="/brand/catalog/bb-tyohaar.webp" position={[6.1, 3.3, -31]} rotation={[0, -0.9, 0]} width={2.6} height={2.6} />
          </Hoverable>

          <Hoverable label="Corporate gifting collection">
            <Billboard src="/chapter-2-4/web/corporate-gifting.webp" position={[6.1, 3.3, -44]} rotation={[0, -0.9, 0]} width={4.1} height={2.0} />
          </Hoverable>

          {!kit.compact && <PressPack x={5.8} z={-50} rot={-1.3} kit={kit} />}

          <Hoverable label="Featured in media">
            <Billboard src="/chapter-2-4/web/featured-in-media.webp" position={[-6.1, 3.3, -54]} rotation={[0, 0.9, 0]} width={4.3} height={1.0} />
          </Hoverable>

          <TvCamera x={-5.5} z={-58} rot={2.2} />
        </>
      )}
    />
  );
}
