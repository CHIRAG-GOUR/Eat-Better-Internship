"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import ValleyWorld, { Signpost, type ValleyKit } from "@/components/world3/ValleyWorld";
import { mat, rng } from "@/components/world3/kit";
import { Instanced, type Inst } from "@/components/world3/parts";
import { Hoverable } from "@/components/world/hover";

/**
 * Chapter 3.3 district of Value Chain Valley (bright noon): the valley read as money. Cost signposts
 * at the facility (ingredients and production, team and kitchen, packaging, logistics), abstract ledger
 * stacks by the canvas terrace (Revenue Streams and Cost Structure lit) showing reported FY23/FY24
 * revenue against FY24 spending, then revenue signposts in town (website, marketplaces and quick
 * commerce, categories at the market, corporate gifting). Plain discs, no currency logos.
 */

const UNIT = 0.4; // metres of stack per Rs 1 crore
const DISC = 0.2;

/** Stacks of plain discs: FY23, FY24 and FY25 revenue, and FY24 spending (revenue + the net loss). */
function LedgerStacks() {
  const geo = useMemo(() => new THREE.CylinderGeometry(1.1, 1.1, DISC * 0.92, 28), []);
  useEffect(() => () => geo.dispose(), [geo]);
  const stacks = useMemo(() => {
    const r = rng(33);
    const make = (z: number, crore: number) => {
      const n = Math.round((crore * UNIT) / DISC);
      return Array.from({ length: n }, (_, i): Inst => ({ p: [-11 + (r() - 0.5) * 0.08, DISC / 2 + i * DISC, z + (r() - 0.5) * 0.08], r: [0, r() * 3, 0] }));
    };
    return { fy25: make(-44.6, 23.9), fy23: make(-48.2, 5.33), fy24: make(-51.8, 14.47), spend: make(-55.4, 15.3) };
  }, []);
  const gold = mat("#D9A93A", 0.35, 0.65);
  const copper = mat("#C2643F", 0.4, 0.55);
  return (
    <group>
      <Hoverable label="FY25 revenue: Rs 23.90 crore, reported growth 63%">
        <Instanced geometry={geo} material={gold} items={stacks.fy25} castShadow />
      </Hoverable>
      <Hoverable label="FY23 revenue: Rs 5.33 crore">
        <Instanced geometry={geo} material={gold} items={stacks.fy23} castShadow />
      </Hoverable>
      <Hoverable label="FY24 revenue: Rs 14.47 crore, up about 171.5%">
        <Instanced geometry={geo} material={gold} items={stacks.fy24} castShadow />
      </Hoverable>
      <Hoverable label="FY24 total expenses: Rs 15.30 crore, a net loss of Rs 62.96 lakh">
        <Instanced geometry={geo} material={copper} items={stacks.spend} castShadow />
      </Hoverable>
      <mesh position={[-11, 0.06, -50]} material={mat("#E9E2D4", 0.8)} receiveShadow>
        <boxGeometry args={[3.4, 0.12, 15]} />
      </mesh>
    </group>
  );
}

function Scenes({ kit }: { kit: ValleyKit }) {
  const g = kit.ground;
  const cost = { color: "#7A2E22", fg: "#FFF5EE" };
  const rev = { color: "#1F6B45", fg: "#FFFFFF" };
  return (
    <>
      {/* costs */}
      <Signpost text={"COST\nINGREDIENTS & PRODUCTION"} position={[6.2, 0, -43.6]} rotation={-0.35} width={3.4} {...cost} label="Cost: ingredients and production (typical for a food D2C brand)" />
      {!kit.compact && <Signpost text={"COST\nTEAM, KITCHEN & OPERATIONS"} position={[14.5, 0, -43.4]} rotation={0} width={3.4} {...cost} label="Cost: team, kitchen and operating costs" />}
      <Signpost text={"COST\nPACKAGING"} position={[6.8, 0, -54]} rotation={-0.5} width={2.6} {...cost} label="Cost: packaging (pouches, cartons, gift boxes)" />
      <Signpost text={"COST\nLOGISTICS & DELIVERY"} position={[5.6, 0, -66.5]} rotation={-0.4} width={3.2} {...cost} label="Cost: logistics and delivery" />
      {/* the money picture by the canvas */}
      <LedgerStacks />
      <Signpost text={"FY25 · FY23 · FY24 REVENUE · FY24 SPEND\nGROWTH IS NOT PROFIT"} position={[-8.6, 0, -51.8]} rotation={Math.PI / 2} width={4.4} height={1.4} color="#FFF5EE" fg="#2F1C1A" label="Revenue grew from Rs 5.33 crore (FY23) to Rs 14.47 crore (FY24) and Rs 23.90 crore (FY25); FY24 had a net loss of Rs 62.96 lakh" />
      {/* revenue */}
      <Signpost text={"REVENUE\nOWN WEBSITE"} position={[6.4, 0, -86.2]} rotation={-0.45} width={2.6} {...rev} label="Revenue stream: direct sales on the website" />
      <Signpost text={"REVENUE\nMARKETPLACES & QUICK COMMERCE"} position={[4.4, 0, -99.2]} rotation={-0.45} width={3.4} {...rev} label="Revenue stream: marketplaces and quick-commerce apps (platforms take a commission)" />
      {!kit.compact && <Signpost text={"COST\nMARKETING & COMMISSIONS"} position={[-4.6, 0, -101]} rotation={0.45} width={3.2} {...cost} label="Cost: marketing and platform commissions" />}
      <Signpost text={"REVENUE BY CATEGORY\nSWEETS · NAMKEENS · NUTS · HAMPERS"} position={[-15.2, g(-15.2, -121), -121]} rotation={0.7} width={4} {...rev} label="Revenue by category: sweets and laddoos, namkeens, nuts and mixes, combos and hampers" />
      <Signpost text={"REVENUE\nCORPORATE GIFTING & BULK"} position={[6.4, 0, -125.5]} rotation={-0.45} width={3.2} {...rev} label="Revenue stream: corporate gifting and bulk orders" />
    </>
  );
}

export default function World() {
  return <ValleyWorld chapter="3.3" scenes={(kit) => <Scenes kit={kit} />} />;
}
