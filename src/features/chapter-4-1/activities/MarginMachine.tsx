"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Check } from "lucide-react";
import { Stage3D } from "@/components/play/Stage3D";
import { GameFrame, starsFor, type Feedback } from "@/components/play/GameFrame";
import { FitCam, Halo, Label, makeFace, Mover, NumIn, num, pick, Probe, rint, shuffle } from "./shared";

/**
 * Margin Machine: a 3D kitchen hopper. Drop 20 g ingredient scoops to build a practice 100 g clean-label recipe
 * (decoys that break the promise are rejected), work out the BOM cost per pack, price it into a randomised
 * gross-margin band and compute the margin.
 */

type Ing = { id: string; name: string; lines: string[]; kind: "dates" | "nut" | "grain" | "decoy"; lo: number; hi: number; why?: string };

const INGS: Ing[] = [
  { id: "dates", name: "Dates", lines: ["Dates"], kind: "dates", lo: 18, hi: 26 },
  { id: "almonds", name: "Almonds", lines: ["Almonds"], kind: "nut", lo: 70, hi: 95 },
  { id: "cashews", name: "Cashews", lines: ["Cashews"], kind: "nut", lo: 80, hi: 110 },
  { id: "millets", name: "Millets", lines: ["Millets"], kind: "grain", lo: 8, hi: 14 },
  { id: "quinoa", name: "Quinoa", lines: ["Quinoa"], kind: "grain", lo: 25, hi: 38 },
  { id: "maida", name: "Maida", lines: ["Maida", "(refined flour)"], kind: "decoy", lo: 3, hi: 5, why: "Maida is refined flour, the cheap base of conventional snacks. A clean-label recipe leaves it out: premium ingredients are what customers pay the premium for." },
  { id: "palm", name: "Palm oil", lines: ["Palm oil"], kind: "decoy", lo: 8, hi: 12, why: "Palm oil is one of the bad fats a clean-label brand eliminates. It would trim the BOM but break the promise on the pack." },
  { id: "sugar", name: "Refined sugar", lines: ["Refined", "sugar"], kind: "decoy", lo: 4, hi: 6, why: "Refined sugar is exactly what a clean-label recipe removes. Eat Better sweetens with dates instead." },
  { id: "preserv", name: "Preservative mix", lines: ["Artificial", "preservative"], kind: "decoy", lo: 5, hi: 9, why: "Artificial preservatives are eliminated by the clean-label promise. Cheap does not mean allowed." },
];
const BYID = Object.fromEntries(INGS.map((i) => [i.id, i]));
const COLORS = ["#FFE0B2", "#FFCDD2", "#DCEDC8", "#B3E5FC", "#E1BEE7", "#FFF9C4", "#D7CCC8", "#C8E6C9", "#FFCCBC"];
const BANDS: [number, number][] = [[30, 40], [35, 45], [40, 50], [45, 55]];
const SCOOP = 20;
const MAX = 5;

type Setup = { price: Record<string, number>; color: Record<string, string>; pack: number; band: [number, number] };
const newSetup = (): Setup => {
  const cols = shuffle(COLORS);
  return {
    price: Object.fromEntries(INGS.map((i) => [i.id, rint(i.lo, i.hi)])),
    color: Object.fromEntries(INGS.map((i, k) => [i.id, cols[k]])),
    pack: rint(5, 9),
    band: pick(BANDS),
  };
};

function useWide() {
  const { size } = useThree();
  return size.width / size.height > 1.35;
}

function Block({ ing, setup, pos, held, shake, onClick }: { ing: Ing; setup: Setup; pos: [number, number, number]; held: boolean; shake: number; onClick: () => void }) {
  const face = useMemo(() => makeFace(ing.lines, setup.color[ing.id], "#2f1c1a", `₹${setup.price[ing.id]} / 100 g`), [ing, setup]);
  const mats = useMemo(() => {
    const side = new THREE.MeshStandardMaterial({ color: setup.color[ing.id], roughness: 0.8 });
    return [side, side, side, side, new THREE.MeshBasicMaterial({ map: face, toneMapped: false }), side];
  }, [face, ing, setup]);
  const inner = useRef<THREE.Group>(null);
  const t0 = useRef(-10);
  useEffect(() => {
    if (shake) t0.current = performance.now();
  }, [shake]);
  useFrame(() => {
    const t = (performance.now() - t0.current) / 1000;
    if (inner.current) inner.current.position.x = t < 0.5 ? Math.sin(t * 50) * 0.08 * (1 - t / 0.5) : 0;
  });
  return (
    <Mover target={held ? [pos[0], pos[1] + 0.3, pos[2] + 0.4] : pos} selected={held} onClick={onClick}>
      <group ref={inner}>
        {held && <Halo w={1.1} h={1.1} />}
        <mesh material={mats} castShadow>
          <boxGeometry args={[0.9, 0.9, 0.5]} />
        </mesh>
      </group>
    </Mover>
  );
}

function Disc({ y, color }: { y: number; color: string }) {
  const g = useRef<THREE.Mesh>(null);
  const t0 = useRef<number | null>(null);
  useFrame(({ clock }) => {
    t0.current ??= clock.elapsedTime;
    const k = Math.min(1, (clock.elapsedTime - t0.current) / 0.45);
    if (g.current) {
      g.current.position.y = y + (1 - k) * (1 - k) * 1.6;
      g.current.scale.setScalar(0.4 + 0.6 * k);
    }
  });
  return (
    <mesh ref={g} position={[0, y + 1.6, 0]}>
      <cylinderGeometry args={[0.44, 0.44, 0.27, 20]} />
      <meshStandardMaterial color={color} roughness={0.7} />
    </mesh>
  );
}

function Gauge({ band, value, pos }: { band: [number, number]; value: number | null; pos: [number, number, number] }) {
  const needle = useRef<THREE.Group>(null);
  const cur = useRef(0);
  const ang = (pct: number) => Math.PI * (1 - Math.min(1, Math.max(0, pct / 100)));
  useFrame((_, dt) => {
    const target = value ?? 0;
    cur.current += (target - cur.current) * (1 - Math.exp(-dt * 3));
    if (needle.current) needle.current.rotation.z = ang(cur.current) - Math.PI / 2;
  });
  const a0 = ang(band[1]);
  const a1 = ang(band[0]);
  return (
    <group position={pos}>
      <mesh rotation={[0, 0, 0]}>
        <ringGeometry args={[0.55, 0.8, 40, 1, 0, Math.PI]} />
        <meshBasicMaterial color="#e6d6c6" side={THREE.DoubleSide} />
      </mesh>
      <mesh position={[0, 0, 0.01]}>
        <ringGeometry args={[0.55, 0.8, 24, 1, a0, a1 - a0]} />
        <meshBasicMaterial color="#00A341" side={THREE.DoubleSide} />
      </mesh>
      <group ref={needle} position={[0, 0, 0.03]}>
        <mesh position={[0, 0.38, 0]}>
          <boxGeometry args={[0.04, 0.76, 0.02]} />
          <meshBasicMaterial color="#2f1c1a" />
        </mesh>
      </group>
      <mesh position={[0, 0, 0.04]}>
        <circleGeometry args={[0.07, 14]} />
        <meshBasicMaterial color="#2f1c1a" />
      </mesh>
      <Label position={[0, -0.34, 0.05]} text={`Gross margin target
${band[0]}–${band[1]}%`} h={0.17} border="none" bg="#fff5ee" />
    </group>
  );
}

type SceneProps = { setup: Setup; scoops: string[]; held: string | null; shake: Record<string, number>; step: number; cost: number; price: number | null; gm: number | null; onBlock: (id: string) => void; onHopper: () => void };

function Scene({ setup, scoops, held, shake, step, cost, price, gm, onBlock, onHopper }: SceneProps) {
  const wide = useWide();
  const hop: [number, number, number] = wide ? [0.2, -0.2, 0] : [-1.1, 0.3, 0];
  const meterX = wide ? 1.95 : 0.35;
  const gaugePos: [number, number, number] = wide ? [3.6, 0.3, 0] : [1.55, 1.5, 0];
  const posOf = (i: number): [number, number, number] =>
    wide ? [-3.9 + (i % 3) * 1.15, 1.3 - Math.floor(i / 3) * 1.15, 0] : [-1.2 + (i % 3) * 1.2, -0.1 - Math.floor(i / 3) * 1.1, 0];
  const fill = Math.min(1, cost / 90);
  return (
    <>
      {wide ? <FitCam width={9.4} height={4.7} cy={0.15} /> : <FitCam width={4.9} height={7.2} cy={-0.3} />}
      <ambientLight intensity={1.05} />
      <directionalLight position={[3, 6, 6]} intensity={1.4} />
      <mesh position={[0, 0, -0.9]}>
        <planeGeometry args={[16, 12]} />
        <meshStandardMaterial color="#F6E3CF" />
      </mesh>
      {/* hopper */}
      <group position={hop} onClick={(e) => { e.stopPropagation(); onHopper(); }} onPointerOver={() => (document.body.style.cursor = "pointer")} onPointerOut={() => (document.body.style.cursor = "")}>
        <mesh position={[0, 1.65, 0]}>
          <cylinderGeometry args={[1.0, 0.55, 0.9, 24, 1, true]} />
          <meshStandardMaterial color="#cfd6db" metalness={0.6} roughness={0.35} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, 0.65, 0]}>
          <cylinderGeometry args={[0.52, 0.52, 1.5, 24, 1, true]} />
          <meshStandardMaterial color="#ffffff" transparent opacity={0.28} side={THREE.DoubleSide} />
        </mesh>
        <mesh position={[0, -0.14, 0]}>
          <cylinderGeometry args={[0.7, 0.8, 0.16, 24]} />
          <meshStandardMaterial color="#2f1c1a" />
        </mesh>
        {scoops.map((s, i) => (
          <Disc key={i} y={-0.02 + i * 0.29} color={setup.color[s]} />
        ))}
        <Label position={[0, 2.4, 0]} text={`Hopper ${scoops.length * SCOOP}/${MAX * SCOOP} g`} bg="#2f1c1a" fg="#fff5ee" border="none" h={0.22} />
      </group>
      {/* BOM cost meter */}
      <group position={[hop[0] + (wide ? meterX - hop[0] : meterX - hop[0]), hop[1] + 0.65, 0]}>
        <mesh>
          <boxGeometry args={[0.34, 1.9, 0.12]} />
          <meshStandardMaterial color="#e6d6c6" />
        </mesh>
        <mesh position={[0, -0.95 + (fill * 1.8) / 2 + 0.05, 0.08]} scale={[1, Math.max(0.001, fill), 1]}>
          <boxGeometry args={[0.24, 1.8, 0.06]} />
          <meshStandardMaterial color={fill > 0.75 ? "#F83A3A" : "#FF5C00"} />
        </mesh>
        <Label position={[0, 1.2, 0]} text="BOM cost meter" h={0.17} border="none" bg="#fff5ee" />
      </group>
      <Gauge band={setup.band} value={gm} pos={gaugePos} />
      {price !== null && step >= 3 && (
        <Label position={[gaugePos[0], gaugePos[1] - 0.95, 0]} text={`Price ₹${price}`} bg="#FED300" h={0.26} />
      )}
      {INGS.map((ing, i) => (
        <Suspense key={ing.id} fallback={null}>
          <Block ing={ing} setup={setup} pos={posOf(i)} held={held === ing.id} shake={shake[ing.id] ?? 0} onClick={() => onBlock(ing.id)} />
        </Suspense>
      ))}
      <Probe name="margin" points={() => ({ hopper: [hop[0], hop[1] + 1.2, 0], ...Object.fromEntries(INGS.map((g, i) => [g.id, posOf(i)])) })} />
    </>
  );
}

export default function MarginMachine({ onDone }: { onDone: (summary: string) => void }) {
  const [setup, setSetup] = useState<Setup>(newSetup);
  const [scoops, setScoops] = useState<string[]>([]);
  const [held, setHeld] = useState<string | null>(null);
  const [shake, setShake] = useState<Record<string, number>>({});
  const [step, setStep] = useState(0);
  const [mist, setMist] = useState(0);
  const [fb, setFb] = useState<Feedback>({ tone: "info", text: "Tap an ingredient block to lift it, then tap the hopper to drop one 20 g scoop. Fill the hopper to 100 g." });
  const [costIn, setCostIn] = useState("");
  const [priceIn, setPriceIn] = useState("");
  const [gmIn, setGmIn] = useState("");
  const [price, setPrice] = useState<number | null>(null);
  const [gm, setGm] = useState<number | null>(null);
  const [done, setDone] = useState(false);

  const ingr = scoops.reduce((a, s) => a + (SCOOP / 100) * setup.price[s], 0);
  const cost = ingr + setup.pack;
  const counts = scoops.reduce<Record<string, number>>((a, s) => ({ ...a, [s]: (a[s] ?? 0) + 1 }), {});

  const bad = (text: string) => {
    setMist((m) => m + 1);
    setFb({ tone: "bad", text });
  };
  const reset = () => {
    setSetup(newSetup());
    setScoops([]);
    setHeld(null);
    setStep(0);
    setMist(0);
    setCostIn("");
    setPriceIn("");
    setGmIn("");
    setPrice(null);
    setGm(null);
    setDone(false);
    setFb({ tone: "info", text: "New practice prices and a new margin target. Build another 100 g recipe." });
  };

  const onBlock = (id: string) => {
    if (step !== 0) return;
    setHeld(held === id ? null : id);
  };
  const onHopper = () => {
    if (step !== 0) return;
    if (!held) return setFb({ tone: "info", text: "Lift an ingredient block first, then tap the hopper." });
    const ing = BYID[held];
    if (ing.kind === "decoy") {
      setShake((s) => ({ ...s, [held]: (s[held] ?? 0) + 1 }));
      setHeld(null);
      return bad(`The hopper rejects ${ing.name} (₹${setup.price[held]} per 100 g). ${ing.why}`);
    }
    if (scoops.length >= MAX) return setFb({ tone: "info", text: "The hopper is full at 100 g (5 scoops of 20 g). Empty it to change the recipe, or run the mixer." });
    setScoops((s) => [...s, held]);
    setHeld(null);
    setFb({ tone: "good", text: `One 20 g scoop of ${ing.name} drops in. ${scoops.length + 1 === MAX ? "The hopper is full: run the mixer." : "Keep going."}` });
  };

  const run = () => {
    if (scoops.length < MAX) return setFb({ tone: "info", text: `Only ${scoops.length * SCOOP} g so far. A practice pack is 100 g: add ${MAX - scoops.length} more scoop${MAX - scoops.length > 1 ? "s" : ""}.` });
    const kinds = new Set(scoops.map((s) => BYID[s].kind));
    if (!kinds.has("dates")) return bad("No dates in the hopper. Eat Better laddoos are sweetened with dates, so the recipe needs at least one scoop of dates.");
    if (!kinds.has("nut")) return bad("No nuts yet. Almonds or cashews give the premium dry-fruit-and-nut body. Add at least one scoop.");
    if (!kinds.has("grain")) return bad("No millets or quinoa. A recipe built only from dates and nuts is missing the grain: add at least one scoop of millets or quinoa.");
    setStep(1);
    setFb({ tone: "good", text: "Recipe accepted: dates, nuts and grain, with no decoys. Now cost it using the recipe ticket." });
  };

  const checkCost = () => {
    const x = num(costIn);
    if (!Number.isFinite(x) || costIn.trim() === "") return bad("Type the cost of one pack in rupees.");
    if (Math.abs(x - cost) <= 0.5) {
      setStep(2);
      setFb({ tone: "good", text: `Ingredients ₹${ingr.toFixed(2)} + pack, label and handling ₹${setup.pack} = ₹${cost.toFixed(2)} to make one 100 g pack. Now choose a selling price.` });
    } else if (Math.abs(x - ingr) <= 0.5) bad(`That is only the ingredients. Add pack, label and handling (₹${setup.pack}) to get the cost of one pack.`);
    else if (Math.abs(x - (scoops.reduce((a, s) => a + setup.price[s], 0) + setup.pack)) <= 0.5 || Math.abs(x - scoops.reduce((a, s) => a + setup.price[s], 0)) <= 0.5) bad("You used the full 100 g price for every scoop. A scoop is only 20 g, so each line is scoops × 20 g ÷ 100 × the price per 100 g.");
    else bad("Not yet. Go line by line on the ticket: grams ÷ 100 × price per 100 g, add the lines, then add the pack and handling cost.");
  };

  const checkPrice = () => {
    const p = num(priceIn);
    if (!Number.isFinite(p) || priceIn.trim() === "") return bad("Type a selling price in whole rupees.");
    const m = ((p - cost) / p) * 100;
    if (p <= cost) return bad("That price does not even cover the cost of the pack: it makes a loss. Gross margin must be positive.");
    if (m < setup.band[0]) return bad(`That price leaves too thin a margin for the target band (${setup.band[0]}–${setup.band[1]}%). Margin = (price − cost) ÷ price. Raise the price.`);
    if (m > setup.band[1]) return bad(`That price is above the band: the margin is richer than the ${setup.band[0]}–${setup.band[1]}% target. A premium needs a clearly better product, so bring the price down.`);
    setPrice(p);
    setStep(3);
    setFb({ tone: "good", text: `₹${p} lands inside the ${setup.band[0]}–${setup.band[1]}% band. Now work out the exact gross margin %.` });
  };

  const checkGm = () => {
    if (price === null) return;
    const x = num(gmIn);
    const g = ((price - cost) / price) * 100;
    if (!Number.isFinite(x) || gmIn.trim() === "") return bad("Type the gross margin as a percentage.");
    if (Math.abs(x - g) <= 0.7) {
      setGm(g);
      setStep(4);
      setDone(true);
      setFb({ tone: "good", text: `Gross profit ₹${(price - cost).toFixed(2)} ÷ price ₹${price} = ${g.toFixed(1)}%. The needle sits inside the green band.` });
      onDone(`Practice recipe ${Object.entries(counts).map(([k, v]) => `${v}×${BYID[k].name}`).join(", ")} (100 g), cost ₹${cost.toFixed(2)}, price ₹${price}, gross margin ${g.toFixed(1)}% (target ${setup.band[0]}–${setup.band[1]}%).`);
    } else if (Math.abs(x - ((price - cost) / cost) * 100) <= 1) bad("That is markup: profit ÷ COST. Gross margin divides the profit by the SELLING PRICE.");
    else if (Math.abs(x - (price - cost)) <= 0.6) bad("That is the profit in rupees. Divide it by the selling price and write it as a percent.");
    else if (x > 0 && x < 1.5) bad("That looks like a fraction. Multiply by 100 to write it as a percent.");
    else bad(`Not yet. Gross profit = ₹${price} − ₹${cost.toFixed(2)}. Divide by ₹${price}, then × 100.`);
  };

  return (
    <GameFrame
      kicker="Activity 2 · Gross margin"
      title="Margin Machine"
      mission="Load the hopper with clean-label ingredients, cost the pack from its BOM, set a price that lands in the margin band, then work out the gross margin."
      steps={["Build a 100 g recipe", "Cost per pack", "Set the price", "Gross margin %"]}
      step={step}
      stars={done ? starsFor(mist) : undefined}
      onReset={reset}
      feedback={fb}
      note={{ real: "Premium ingredients (dates, almonds, cashews, quinoa) cost more than refined flour, palm oil or refined sugar, and the clean-label promise leaves those out: this is the chapter's BOM idea.", practice: "Every price per 100 g, the pack and handling cost and the margin band are made up and change each restart.", tip: "Gross margin = (selling price − cost) ÷ selling price × 100. Markup divides by cost instead." }}
    >
      <Stage3D
        label="A 3D kitchen hopper with ingredient blocks, a BOM cost meter and a gross margin gauge"
        height="clamp(380px, 56vh, 540px)"
        camera={{ position: [0, 0, 11], fov: 40 }}
        overlay={<div className="absolute left-2 top-2 max-w-[80%] rounded-full bg-cocoa/90 px-3 py-1 text-[0.82rem] font-bold text-cream">Practice prices per 100 g · lift a block, tap the hopper</div>}
      >
        <Scene setup={setup} scoops={scoops} held={held} shake={shake} step={step} cost={step >= 0 ? ingr : 0} price={price} gm={gm} onBlock={onBlock} onHopper={onHopper} />
      </Stage3D>

      <div className="mt-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="rounded-2xl bg-cream p-4">
          <div className="text-[0.78rem] font-extrabold uppercase tracking-[0.1em] text-orange">Recipe ticket (practice)</div>
          {scoops.length === 0 ? (
            <p className="mt-1 text-[0.98rem] text-cocoa-2">Empty hopper. Each scoop is 20 g.</p>
          ) : (
            <ul className="mt-1 grid gap-0.5 text-[0.98rem] text-cocoa">
              {Object.entries(counts).map(([k, v]) => (
                <li key={k}>
                  {BYID[k].name} × {v} = {v * SCOOP} g at ₹{setup.price[k]} per 100 g
                </li>
              ))}
              {step >= 1 && <li className="font-bold">Pack, label and handling: ₹{setup.pack} per pack</li>}
            </ul>
          )}
          {step === 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button onClick={run} className="eb-btn eb-btn-primary !py-2 !text-[0.95rem]">
                Run the mixer
              </button>
              <button onClick={() => { setScoops([]); setHeld(null); setFb({ tone: "info", text: "Hopper emptied." }); }} disabled={!scoops.length} className="eb-btn eb-btn-secondary !py-2 !text-[0.95rem] disabled:opacity-40">
                Empty hopper
              </button>
            </div>
          )}
        </div>
        <div className="rounded-2xl bg-cream p-4">
          {step < 1 && <p className="text-[1rem] text-cocoa-2">Costing opens once the recipe is accepted.</p>}
          {step === 1 && (
            <div className="grid gap-2">
              <p className="text-[1rem] text-cocoa">What does one 100 g pack cost to make? (BOM of the scoops + pack and handling)</p>
              <div className="flex flex-wrap items-center gap-3">
                <NumIn value={costIn} onChange={setCostIn} label="Cost per pack in rupees" prefix="₹" unit="per pack" onEnter={checkCost} />
                <button onClick={checkCost} className="eb-btn eb-btn-primary !py-2 !text-[0.95rem]">
                  Check cost
                </button>
              </div>
            </div>
          )}
          {step === 2 && (
            <div className="grid gap-2">
              <p className="text-[1rem] text-cocoa">
                Cost per pack ₹{cost.toFixed(2)}. Set a selling price so the gross margin lands in the green band: <strong>{setup.band[0]}–{setup.band[1]}%</strong>.
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <NumIn value={priceIn} onChange={setPriceIn} label="Selling price in rupees" prefix="₹" unit="selling price" onEnter={checkPrice} />
                <button onClick={checkPrice} className="eb-btn eb-btn-primary !py-2 !text-[0.95rem]">
                  Stamp the price
                </button>
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="grid gap-2">
              <p className="text-[1rem] text-cocoa">
                Cost ₹{cost.toFixed(2)}, price ₹{price}. What is the gross margin?
              </p>
              <div className="flex flex-wrap items-center gap-3">
                <NumIn value={gmIn} onChange={setGmIn} label="Gross margin percent" unit="%" onEnter={checkGm} />
                <button onClick={checkGm} className="eb-btn eb-btn-primary !py-2 !text-[0.95rem]">
                  Check margin
                </button>
              </div>
            </div>
          )}
          {step === 4 && (
            <p className="flex items-center gap-2 text-[1rem] font-bold text-success">
              <Check className="size-5" /> Margin machine complete: cost ₹{cost.toFixed(2)}, price ₹{price}, gross margin {gm?.toFixed(1)}%.
            </p>
          )}
        </div>
      </div>
    </GameFrame>
  );
}
