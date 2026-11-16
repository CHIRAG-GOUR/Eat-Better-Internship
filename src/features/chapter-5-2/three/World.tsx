"use client";

import { useEffect, useMemo } from "react";
import { RoundedBox } from "@react-three/drei";
import BoulevardWorld, { Billboard, signTexture, type BoulevardKit } from "@/components/world2/BoulevardWorld";
import { Person, still, type Look, type Pose } from "@/components/sim/Person";
import { Hoverable } from "@/components/world/hover";

/**
 * Chapter 5.2 (Capstone Task B) World — Module 2 Brand Boulevard (D2C Storefront District).
 * An Indian High Street during vibrant daylight (chapter="2.1") featuring the Eat Better D2C Storefront,
 * packaging display kiosks, courier dispatch stations, and real digital webstore billboards.
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
        <planeGeometry args={[2.5, 0.42]} />
        <meshStandardMaterial
          map={tex}
          emissiveMap={tex}
          emissive="#FFFFFF"
          emissiveIntensity={0.3 + kit.night * 0.5}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

function D2CStorefrontFacade({ x, z, rot }: { x: number; z: number; rot: number }) {
  const tex = useMemo(() => signTexture("EAT BETTER · D2C FLAGSHIP & STOREFRONT", "#2F1C1A", "#FFF5EE", 896, 128), []);
  useEffect(() => () => tex.dispose(), [tex]);

  return (
    <Hoverable label="Eat Better D2C Storefront — Digital experience & flagship retail showcase">
      <group position={[x, 0, z]} rotation={[0, rot, 0]}>
        {/* Building wall */}
        <mesh position={[0, 2.2, -0.6]} castShadow>
          <boxGeometry args={[4.2, 4.4, 0.8]} />
          <meshStandardMaterial color="#FAF0E6" roughness={0.7} />
        </mesh>

        {/* Large storefront showcase window */}
        <mesh position={[-0.8, 1.4, -0.19]}>
          <planeGeometry args={[2.0, 2.2]} />
          <meshStandardMaterial color="#FFECD1" emissive="#FF9E4A" emissiveIntensity={0.35} roughness={0.2} transparent opacity={0.88} />
        </mesh>

        {/* Display shelves inside window */}
        {[-0.3, 0.3, 0.9].map((sy, i) => (
          <group key={i} position={[-0.8, sy + 0.9, -0.3]}>
            <mesh>
              <boxGeometry args={[1.8, 0.04, 0.35]} />
              <meshStandardMaterial color="#8D5B4C" />
            </mesh>
            {/* Display snack pouches and boxes on shelves */}
            {[-0.6, -0.2, 0.2, 0.6].map((px, j) => (
              <RoundedBox key={j} args={[0.22, 0.32, 0.12]} radius={0.02} position={[px, 0.18, 0]} castShadow>
                <meshStandardMaterial color={j % 2 === 0 ? "#FF5C00" : "#FED300"} roughness={0.4} />
              </RoundedBox>
            ))}
          </group>
        ))}

        {/* Entrance Door */}
        <mesh position={[1.1, 1.35, -0.19]}>
          <planeGeometry args={[1.2, 2.4]} />
          <meshStandardMaterial color="#4A2E2B" roughness={0.5} />
        </mesh>
        <mesh position={[1.1, 1.35, -0.18]}>
          <planeGeometry args={[0.9, 1.4]} />
          <meshStandardMaterial color="#8FD3FF" emissive="#8FD3FF" emissiveIntensity={0.2} transparent opacity={0.75} />
        </mesh>

        {/* Store Signboard */}
        <mesh position={[0, 3.4, -0.16]}>
          <planeGeometry args={[3.8, 0.65]} />
          <meshStandardMaterial
            map={tex}
            emissiveMap={tex}
            emissive="#FFFFFF"
            emissiveIntensity={0.4}
            toneMapped={false}
          />
        </mesh>

        {/* Striped Awning (Jaipur Orange & Warm Cream) */}
        <group position={[0, 2.85, 0.35]} rotation={[0.3, 0, 0]}>
          <mesh>
            <boxGeometry args={[4.0, 0.04, 1.1]} />
            <meshStandardMaterial color="#FF5C00" roughness={0.8} />
          </mesh>
          {[-1.5, -0.9, -0.3, 0.3, 0.9, 1.5].map((sx, k) => (
            <mesh key={k} position={[sx, 0.025, 0]}>
              <boxGeometry args={[0.3, 0.02, 1.1]} />
              <meshStandardMaterial color="#FFF5EE" roughness={0.8} />
            </mesh>
          ))}
        </group>

        {/* Welcome Mat */}
        <mesh position={[1.1, 0.03, 0.6]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[1.0, 0.7]} />
          <meshStandardMaterial color="#FF5C00" roughness={0.9} />
        </mesh>
      </group>
    </Hoverable>
  );
}

function PackagingDisplayKiosk({ x, z, rot }: { x: number; z: number; rot: number }) {
  return (
    <Hoverable label="New Product Packaging Display Kiosk — Stand-up pouches & gift boxes">
      <group position={[x, 0.12, z]} rotation={[0, rot, 0]}>
        {/* Wooden retail display counter */}
        <RoundedBox args={[1.8, 0.9, 0.9]} radius={0.04} position={[0, 0.45, 0]} castShadow>
          <meshStandardMaterial color="#8D5B4C" roughness={0.7} />
        </RoundedBox>
        <RoundedBox args={[1.9, 0.06, 1.0]} radius={0.02} position={[0, 0.92, 0]}>
          <meshStandardMaterial color="#5C382C" roughness={0.5} />
        </RoundedBox>

        {/* Stand-up snack pouches on counter */}
        {[-0.55, -0.2, 0.2, 0.55].map((px, i) => (
          <group key={i} position={[px, 1.12, (i % 2 === 0 ? 0.1 : -0.1)]} rotation={[0, (i - 1.5) * 0.15, 0]}>
            <RoundedBox args={[0.26, 0.34, 0.1]} radius={0.03} castShadow>
              <meshStandardMaterial color={i === 0 ? "#FF5C00" : i === 1 ? "#FED300" : i === 2 ? "#3E2723" : "#E65100"} roughness={0.35} />
            </RoundedBox>
            {/* Label highlight */}
            <mesh position={[0, 0.02, 0.055]}>
              <planeGeometry args={[0.2, 0.16]} />
              <meshStandardMaterial color="#FFF8F0" roughness={0.3} />
            </mesh>
          </group>
        ))}

        {/* Gift Hamper Box on side */}
        <RoundedBox args={[0.45, 0.35, 0.45]} radius={0.03} position={[0, 1.15, -0.15]} castShadow>
          <meshStandardMaterial color="#FED300" roughness={0.4} />
        </RoundedBox>

        {/* Small tabletop promotional sign */}
        <group position={[0.7, 1.08, 0.2]} rotation={[0, -0.4, 0]}>
          <mesh>
            <planeGeometry args={[0.22, 0.28]} />
            <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
          </mesh>
        </group>
      </group>
    </Hoverable>
  );
}

function CourierDispatchStation({ x, z, rot }: { x: number; z: number; rot: number }) {
  return (
    <Hoverable label="D2C Express Courier & Quick-Commerce Dispatch Station — 2 Lakh+ orders/month">
      <group position={[x, 0.12, z]} rotation={[0, rot, 0]}>
        {/* Wooden pallet base */}
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[1.3, 0.12, 1.3]} />
          <meshStandardMaterial color="#A1724E" roughness={0.9} />
        </mesh>

        {/* Stacked shipping boxes with Eat Better tape */}
        <RoundedBox args={[0.5, 0.4, 0.5]} radius={0.02} position={[-0.28, 0.34, -0.28]} castShadow>
          <meshStandardMaterial color="#CBB279" roughness={0.8} />
        </RoundedBox>
        <RoundedBox args={[0.52, 0.42, 0.48]} radius={0.02} position={[0.28, 0.35, -0.26]} castShadow>
          <meshStandardMaterial color="#BFA565" roughness={0.8} />
        </RoundedBox>
        <RoundedBox args={[0.48, 0.38, 0.52]} radius={0.02} position={[-0.24, 0.33, 0.28]} castShadow>
          <meshStandardMaterial color="#D1B87E" roughness={0.8} />
        </RoundedBox>
        {/* Top layer box */}
        <RoundedBox args={[0.46, 0.36, 0.46]} radius={0.02} position={[0, 0.72, 0]} castShadow>
          <meshStandardMaterial color="#CBB279" roughness={0.8} />
        </RoundedBox>
        {/* Orange brand tape strip across top box */}
        <mesh position={[0, 0.905, 0]}>
          <planeGeometry args={[0.46, 0.08]} />
          <meshStandardMaterial color="#FF5C00" roughness={0.5} />
        </mesh>

        {/* Delivery thermal cargo box next to pallet */}
        <group position={[0.95, 0.45, 0.2]}>
          <RoundedBox args={[0.65, 0.7, 0.65]} radius={0.05} castShadow>
            <meshStandardMaterial color="#2F1C1A" roughness={0.4} />
          </RoundedBox>
          <mesh position={[0, 0, 0.33]}>
            <planeGeometry args={[0.45, 0.3]} />
            <meshStandardMaterial color="#FF5C00" roughness={0.4} />
          </mesh>
        </group>
      </group>
    </Hoverable>
  );
}

const SHOPPERS: Look[] = [
  { skin: "#B98157", top: "#FF5C00", bottom: "#2F1C1A", hair: "#140C08", hairStyle: "short", extra: "glasses", extraColor: "#2F1C1A" },
  { skin: "#D4A373", top: "#FED300", bottom: "#3E2723", hair: "#3E2723", hairStyle: "long" },
  { skin: "#9C6644", top: "#FFFFFF", bottom: "#1565C0", hair: "#140C08", hairStyle: "short", extra: "cap", extraColor: "#FF5C00" },
];

function StorefrontShoppers({ x, z, rot }: { x: number; z: number; rot: number }) {
  const poses = useMemo(() => [
    { current: still({ arm: 0.3 }) as Pose },
    { current: still({ arm: 0.5 }) as Pose },
  ], []);

  return (
    <Hoverable label="Shoppers exploring Eat Better clean snack variants">
      <group position={[x, 0.12, z]} rotation={[0, rot, 0]}>
        <group position={[-0.45, 0, 0]}>
          <Person look={SHOPPERS[0]} pose={poses[0]} />
        </group>
        <group position={[0.45, 0, 0.2]} rotation={[0, -0.6, 0]}>
          <Person look={SHOPPERS[1]} pose={poses[1]} />
        </group>
      </group>
    </Hoverable>
  );
}

export default function World() {
  return (
    <BoulevardWorld
      chapter="2.1"
      scenes={(kit) => (
        <>
          <Sign x={5.6} z={-6} text="E-COMMERCE & D2C STOREFRONT" rot={-0.6} kit={kit} />
          <D2CStorefrontFacade x={6.4} z={-11} rot={-1.25} />
          <StorefrontShoppers x={5.5} z={-8.5} rot={-2.2} />
          <PackagingDisplayKiosk x={-5.8} z={-12.5} rot={1.3} />

          {/* Real D2C Webstore Launch Banner: Bestselling Laddoos */}
          <Hoverable label="Eat Better D2C Webstore — Bestselling Laddoos Banner">
            <Billboard
              src="/brand/library/site/home-banner-bestselling-laddoo.webp"
              position={[-6.1, 3.3, -19]}
              rotation={[0, 0.9, 0]}
              width={3.6}
              height={1.8}
            />
          </Hoverable>

          {/* Real D2C Webstore Launch Banner: Protein Bhujia Launch */}
          <Hoverable label="Eat Better D2C Webstore — Protein Bhujia Launch Banner">
            <Billboard
              src="/brand/library/site/home-banner-protein-bhujia-launch.webp"
              position={[6.1, 3.3, -31]}
              rotation={[0, -0.9, 0]}
              width={3.6}
              height={1.8}
            />
          </Hoverable>

          {/* Festive Gifting Hamper Collection */}
          <Hoverable label="Festive Gifting Hamper Collection">
            <Billboard
              src="/brand/catalog/bb-tyohaar.webp"
              position={[6.1, 3.3, -44]}
              rotation={[0, -0.9, 0]}
              width={2.8}
              height={2.8}
            />
          </Hoverable>

          {/* D2C Courier Dispatch Station */}
          {!kit.compact && <CourierDispatchStation x={-5.8} z={-48} rot={1.1} />}

          {/* Corporate Gifting D2C Banner */}
          <Hoverable label="Corporate Gifting D2C Banner — Build Your Own Hamper">
            <Billboard
              src="/brand/library/site/corporate-gifting-banner-build-your-own.webp"
              position={[-6.1, 3.3, -54]}
              rotation={[0, 0.9, 0]}
              width={3.8}
              height={1.9}
            />
          </Hoverable>

          {/* Another packaging kiosk along the street */}
          <PackagingDisplayKiosk x={5.8} z={-58} rot={-1.3} />
        </>
      )}
    />
  );
}
