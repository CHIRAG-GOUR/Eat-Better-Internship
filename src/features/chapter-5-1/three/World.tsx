"use client";

import { RoundedBox } from "@react-three/drei";
import TableWorld from "@/components/world/TableWorld";
import { Hoverable } from "@/components/world/hover";
import {
  BhujiaPile,
  Diya,
  GiftBox,
  Laddoos,
  MailerBox,
  Marigold,
  NutPile,
  Scatter,
} from "@/components/world/props";

/**
 * Chapter 5.1 (Capstone Project 1) World — Module 1 Long Dining Hall Table.
 * Showcases the clean-label craftsmanship and raw ingredients behind Eat Better GTM initiatives.
 */
export default function World() {
  return (
    <TableWorld
      travel={85}
      scenes={({ katori, bowl, small, mats, compact }) => (
        <>
          {/* Section 1: Overview & Product Pod (z: 0 to -12) */}
          <group position={[0, 0, 0]}>
            <RoundedBox
              args={[2.4, 0.06, 1.4]}
              radius={0.03}
              position={[3.1, 0.03, -0.4]}
              rotation={[0, 0.15, 0]}
              material={mats.board}
              castShadow
              receiveShadow
            />
            <Hoverable label="Dry-fruit laddoos in brass katori">
              <group position={[3.2, 0.06, -0.5]}>
                <mesh geometry={katori} material={mats.brass} castShadow receiveShadow />
                <Laddoos count={12} spread={0.34} height={0.36} />
              </group>
            </Hoverable>
            <Scatter kind="date" count={8} area={[2.2, 4.2, 0.1, 0.8]} seed={2} />
            <Hoverable label="Roasted millet bhujia">
              <group position={[-3.4, 0, -2]}>
                <mesh geometry={bowl} material={mats.ceramic} castShadow receiveShadow />
                <BhujiaPile count={compact ? 240 : 400} spread={0.54} height={0.27} />
              </group>
            </Hoverable>
            <group position={[4.2, 0.02, 1.2]} rotation={[0, 0.4, 0]}>
              <Marigold />
            </group>
          </group>

          {/* Section 2: 5 Tracks & Formulation (z: -14 to -28) */}
          <group>
            <Scatter kind="almond" count={compact ? 18 : 36} area={[-5, -2, -18, -12]} seed={10} />
            <Scatter kind="hazelnut" count={compact ? 16 : 30} area={[2.2, 5, -20, -13]} seed={11} />
            <Scatter kind="seed" count={compact ? 70 : 150} area={[-1.6, 1.6, -22, -11]} seed={12} />
            <Hoverable label="Wholesome nut & seed blend">
              <group position={[3.8, 0, -16]}>
                <mesh geometry={small} material={mats.ceramic} castShadow receiveShadow />
                <NutPile count={80} spread={0.42} height={0.22} />
              </group>
            </Hoverable>
            <Hoverable label="Eat Better shipper delivery box">
              <group position={[-3.6, 0.45, -22]} rotation={[0, 0.4, 0]}>
                <MailerBox />
              </group>
            </Hoverable>
          </group>

          {/* Section 3: GTM Canvas & Unit Economics (z: -30 to -48) */}
          <group>
            <Hoverable label="Artisanal Festive Gift Box">
              <group position={[3.2, 0.45, -34]} rotation={[0, -0.25, 0]}>
                <GiftBox />
              </group>
            </Hoverable>
            <Hoverable label="Jaipur Brass Diya">
              <group position={[-2.8, 0.02, -37]}>
                <Diya flicker />
              </group>
            </Hoverable>
            <Scatter kind="date" count={compact ? 12 : 24} area={[-4.5, -2.0, -42, -34]} seed={15} />
            <Scatter kind="almond" count={compact ? 25 : 50} area={[2.0, 4.8, -44, -36]} seed={16} />
            <Hoverable label="Laddoo tasting assortment">
              <group position={[-3.5, 0.06, -45]}>
                <mesh geometry={katori} material={mats.brass} castShadow receiveShadow />
                <Laddoos count={8} spread={0.3} height={0.32} />
              </group>
            </Hoverable>
          </group>

          {/* Section 4 & 5: Dossier Export & Rubric (z: -50 to -70) */}
          <group>
            <Hoverable label="Ultimate Snack Combo Box">
              <group position={[3.4, 0.45, -56]} rotation={[0, 0.15, 0]}>
                <MailerBox />
              </group>
            </Hoverable>
            <Hoverable label="Savory Quinoa Namkeen">
              <group position={[-3.2, 0, -60]}>
                <mesh geometry={bowl} material={mats.ceramic} castShadow receiveShadow />
                <BhujiaPile count={compact ? 220 : 380} spread={0.5} height={0.25} />
              </group>
            </Hoverable>
            <group position={[-3.8, 0.02, -64]} rotation={[0, 1.2, 0]}>
              <Marigold />
            </group>
            <group position={[3.6, 0.02, -66]} rotation={[0, 0.8, 0]}>
              <Marigold />
            </group>
          </group>

          {/* Scatter along full table for background richness */}
          <Scatter kind="almond" count={compact ? 35 : 70} area={[2.2, 5.5, -75, 4]} seed={31} />
          <Scatter kind="almond" count={compact ? 35 : 70} area={[-5.5, -2.2, -75, 4]} seed={32} />
          <Scatter kind="seed" count={compact ? 120 : 250} area={[-4.5, 4.5, -75, 4]} seed={33} />
        </>
      )}
    />
  );
}
