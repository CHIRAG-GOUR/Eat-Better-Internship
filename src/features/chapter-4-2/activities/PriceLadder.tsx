"use client";

import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { ArrowUpDown, PackageOpen } from "lucide-react";
import { Stage3D } from "@/components/play/Stage3D";
import { CheckRow, GameFrame, starsFor, type Feedback } from "@/components/play/GameFrame";
import { useMediaQuery } from "@/lib/useClient";
import { MARKET, SKUS, type PlayerId } from "../content";
import { NumIn, PracticeTag, has, near, num, pick, rs, shuffle, words } from "./shared";
import { FitRig, Floor, Label, PhotoBox, StageLights, flatMat, labelTexture } from "./three";

/**
 * Price Ladder — a 3D ₹-per-gram ladder from ₹0 to ₹2. The student places each rival's price band from the chapter's
 * market table, computes the ₹/g of Eat Better's four real SKUs (Chapter 4.1's pricing table) so each box rises to
 * its rung, then answers two randomly drawn comparisons with a typed number, and explains the premium in one line.
 */

const Y = (v: number) => v * 2; // ₹1/g = 2 world units
const LANES: { id: PlayerId; x: number; color: string }[] = [
  { id: "trad", x: -1.35, color: "#D62828" },
  { id: "local", x: -0.45, color: "#B5179E" },
  { id: "health", x: 0.45, color: "#3E6B48" },
  { id: "eb", x: 1.45, color: "#FF5C00" },
];
const MK = Object.fromEntries(MARKET.map((m) => [m.id, m])) as Record<PlayerId, (typeof MARKET)[number]>;
const SHORT: Record<PlayerId, string> = { eb: "Eat Better", trad: "Traditional", local: "Local sweets", health: "Health rivals" };
type SkuId = (typeof SKUS)[number]["id"];
const SKU_X: Record<SkuId, number> = { l24: 1.18, l42: 1.72, usb: 1.45, nmk: 1.45 };
const exact = (s: (typeof SKUS)[number]) => s.price / s.grams;

/* ── comparisons (two are drawn per run) ──────────────────────── */

type Q = { id: string; ask: string; unit: string; ans: number; tol: number; marks: number[]; work: string };
const cheapest = SKUS.find((s) => s.id === "nmk")!;
const priciest = SKUS.find((s) => s.id === "l42")!;
const usb = SKUS.find((s) => s.id === "usb")!;
const TIMES_Q: Q[] = [
  { id: "x-cheap", ask: `How many times pricier per gram is Eat Better's cheapest combo (${cheapest.short}, ₹0.67/g) than the top of the mass-market band (₹0.35/g)?`, unit: "times", ans: 0.67 / 0.35, tol: 0.06, marks: [0.35, 0.67], work: "₹0.67 ÷ ₹0.35 ≈ 1.9 times." },
  { id: "x-top", ask: `How many times pricier per gram is Eat Better's priciest box (${priciest.short}, ₹1.55/g) than the top of the mass-market band (₹0.35/g)?`, unit: "times", ans: 1.55 / 0.35, tol: 0.06, marks: [0.35, 1.55], work: "₹1.55 ÷ ₹0.35 ≈ 4.4 times." },
  { id: "x-usb", ask: `How many times pricier per gram is the ${usb.short} (₹1.13/g) than the bottom of the mass-market band (₹0.15/g)?`, unit: "times", ans: 1.13 / 0.15, tol: 0.08, marks: [0.15, 1.13], work: "₹1.13 ÷ ₹0.15 ≈ 7.5 times." },
];
const OTHER_Q: Q[] = [
  { id: "gap", ask: "How big is the gap, in ₹ per gram, between the top of the mass-market band and the bottom of Eat Better's band?", unit: "₹/g", ans: 0.32, tol: 0.011, marks: [0.35, 0.67], work: "₹0.67 − ₹0.35 = ₹0.32 per gram. No Eat Better SKU sits anywhere near the mass-market band." },
  { id: "in-local", ask: "How many of Eat Better's four SKUs sit inside the local sweet shop band (₹0.50 to ₹1.20/g)?", unit: "SKUs", ans: 2, tol: 0, marks: [0.5, 1.2], work: "Namkeen Combo (₹0.67) and Ultimate Snack Box (₹1.13) are inside; both laddoo boxes (₹1.45, ₹1.55) are above ₹1.20." },
  { id: "in-health", ask: "How many of Eat Better's four SKUs sit inside the direct health competitors' band (₹0.80 to ₹1.80/g)?", unit: "SKUs", ans: 3, tol: 0, marks: [0.8, 1.8], work: "Ultimate Snack Box (₹1.13) and both laddoo boxes (₹1.45, ₹1.55) are inside; the Namkeen Combo (₹0.67) is below ₹0.80." },
  { id: "200g", ask: "How many rupees more does 200 g cost at the Ultimate Snack Box rate (₹1.13/g) than at the top of the mass-market band (₹0.35/g)?", unit: "₹", ans: 156, tol: 1.01, marks: [0.35, 1.13], work: "(₹1.13 − ₹0.35) × 200 g = ₹0.78 × 200 = ₹156." },
];

/* ── 3D pieces ───────────────────────────────────────────────── */

function Ruler() {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 256;
    c.height = 1024;
    const g = c.getContext("2d")!;
    g.fillStyle = "#FFF5EE";
    g.fillRect(0, 0, 256, 1024);
    const pad = 24;
    const span = 1024 - pad * 2;
    for (let i = 0; i <= 40; i++) {
      const y = 1024 - pad - (i / 40) * span;
      const big = i % 5 === 0;
      g.fillStyle = "#2F1C1A";
      g.fillRect(256 - (big ? 90 : 46), y - (big ? 2 : 1), big ? 90 : 46, big ? 4 : 2);
      if (big) {
        g.font = "700 34px system-ui, sans-serif";
        g.textAlign = "left";
        g.textBaseline = "middle";
        g.fillText(`₹${(i * 0.05).toFixed(2)}`, 10, y);
      }
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return t;
  }, []);
  // the canvas has 24px padding top/bottom of 1024 → stretch the plane so ₹0 and ₹2 land on y = 0 and y = 4
  const h = Y(2) / (1 - 48 / 1024);
  return (
    <group position={[-2.35, 0, 0]}>
      <mesh position={[0, Y(1), -0.02]} material={flatMat("#5B3A2E")} castShadow>
        <boxGeometry args={[0.95, h + 0.12, 0.06]} />
      </mesh>
      <mesh position={[0, Y(1), 0.015]}>
        <planeGeometry args={[0.88, h]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
      <Label lines={["₹ per gram"]} width={1.1} height={0.26} position={[0, Y(2) + 0.32, 0]} o={{ bg: "#2F1C1A", fg: "#FFF5EE" }} />
    </group>
  );
}

function Band({ x, color, lo, hi, state }: { x: number; color: string; lo: number; hi: number; state: "set" | "wrong" | "ok" }) {
  const m = useRef<THREE.Mesh>(null);
  const cur = useRef({ lo: 0, hi: 0.02 });
  useFrame(({ clock }, dt) => {
    const c = cur.current;
    c.lo += (lo - c.lo) * Math.min(1, dt * 6);
    c.hi += (hi - c.hi) * Math.min(1, dt * 6);
    const o = m.current;
    if (!o) return;
    const h = Math.max(0.02, Y(c.hi) - Y(c.lo));
    o.scale.y = h;
    o.position.y = Y(c.lo) + h / 2;
    o.position.x = x + (state === "wrong" ? Math.sin(clock.elapsedTime * 40) * 0.03 : 0);
  });
  return (
    <mesh ref={m} position={[x, 0, 0]} castShadow>
      <boxGeometry args={[0.72, 1, 0.22]} />
      <meshStandardMaterial color={state === "wrong" ? "#C0392B" : color} transparent opacity={state === "ok" ? 0.85 : 0.55} roughness={0.4} />
    </mesh>
  );
}

function SkuBox({ sku, at, picked, placed, onPick }: { sku: (typeof SKUS)[number]; at: [number, number, number]; picked: boolean; placed: boolean; onPick: () => void }) {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }, dt) => {
    const o = g.current;
    if (!o) return;
    const lift = picked ? 0.25 + Math.sin(clock.elapsedTime * 3) * 0.05 : 0;
    o.position.x += (at[0] - o.position.x) * Math.min(1, dt * 4);
    o.position.y += (at[1] + lift - o.position.y) * Math.min(1, dt * 4);
    o.position.z += (at[2] - o.position.z) * Math.min(1, dt * 4);
  });
  return (
    <group
      ref={g}
      position={at}
      onClick={(e) => {
        e.stopPropagation();
        if (!placed) onPick();
      }}
      onPointerOver={() => !placed && (document.body.style.cursor = "pointer")}
      onPointerOut={() => (document.body.style.cursor = "")}
    >
      <PhotoBox img={sku.img} size={[0.36, 0.36, 0.12]} side="#FF5C00" />
      {picked && (
        <mesh position={[0, 0, -0.08]}>
          <planeGeometry args={[0.5, 0.5]} />
          <meshBasicMaterial color="#F2A900" transparent opacity={0.6} toneMapped={false} />
        </mesh>
      )}
    </group>
  );
}

function Marker({ v, color = "#2F1C1A" }: { v: number; color?: string }) {
  const tex = useMemo(() => labelTexture([rs(v)], 256, 96, { bg: color, fg: "#FFF5EE", weight: 700 }), [v, color]);
  return (
    <group position={[0, Y(v), 0.14]}>
      <mesh position={[-0.2, 0, 0]}>
        <boxGeometry args={[3.7, 0.025, 0.02]} />
        <meshBasicMaterial color={color} toneMapped={false} />
      </mesh>
      <mesh position={[2.15, 0, 0]}>
        <planeGeometry args={[0.6, 0.22]} />
        <meshBasicMaterial map={tex} transparent toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ── the game ─────────────────────────────────────────────────── */

const STEPS = ["Place the bands", "Drop the SKUs", "Compare 1", "Compare 2", "Explain"];
type BandVal = { lo: string; hi: string; ok: boolean; wrong: boolean };
const RIVALS: PlayerId[] = ["trad", "local", "health"];

export default function PriceLadder({ onDone }: { onDone: (summary: string) => void }) {
  const compact = useMediaQuery("(max-width: 767px)");
  const [seed, setSeed] = useState(0);
  const qs = useMemo(() => [pick(TIMES_Q), pick(OTHER_Q)], [seed]); // eslint-disable-line react-hooks/exhaustive-deps
  const trayOrder = useMemo(() => shuffle(SKUS.map((s) => s.id)), [seed]); // eslint-disable-line react-hooks/exhaustive-deps
  const [lane, setLane] = useState<PlayerId>("trad");
  const [bands, setBands] = useState<Record<string, BandVal>>({});
  const [picked, setPicked] = useState<SkuId | null>(null);
  const [skuVal, setSkuVal] = useState("");
  const [placed, setPlaced] = useState<Partial<Record<SkuId, boolean>>>({});
  const [miss, setMiss] = useState<{ id: SkuId; v: number } | null>(null);
  const [answers, setAnswers] = useState(["", ""]);
  const [qi, setQi] = useState(0);
  const [line, setLine] = useState("");
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [done, setDone] = useState(false);

  const bandsDone = RIVALS.every((id) => bands[id]?.ok);
  const skusDone = SKUS.every((s) => placed[s.id]);
  const step = done ? 5 : !bandsDone ? 0 : !skusDone ? 1 : qi < 2 ? 2 + qi : 4;

  const reset = () => {
    setSeed((s) => s + 1);
    setLane("trad");
    setBands({});
    setPicked(null);
    setSkuVal("");
    setPlaced({});
    setMiss(null);
    setAnswers(["", ""]);
    setQi(0);
    setLine("");
    setMistakes(0);
    setFeedback(null);
    setDone(false);
  };

  const bandFor = (id: PlayerId) => bands[id] ?? { lo: "", hi: "", ok: false, wrong: false };
  const setBand = (id: PlayerId, k: "lo" | "hi", v: string) => setBands((s) => ({ ...s, [id]: { ...bandFor(id), [k]: v, wrong: false } }));

  const placeBand = () => {
    const b = bandFor(lane);
    const m = MK[lane];
    const lo = num(b.lo);
    const hi = num(b.hi);
    if (!Number.isFinite(lo) || !Number.isFinite(hi) || b.lo === "" || b.hi === "") {
      setFeedback({ tone: "info", text: "Type both ends of the band: the lowest and highest ₹ per gram." });
      return;
    }
    if (near(lo, m.range[0], 0.006) && near(hi, m.range[1], 0.006)) {
      setBands((s) => ({ ...s, [lane]: { ...b, ok: true, wrong: false } }));
      const left = RIVALS.filter((id) => id !== lane && !bands[id]?.ok);
      setFeedback({ tone: "good", text: `${m.name}: ${m.tier} (${m.rangeText}). Band locked.${left.length ? ` Next: tap the ${SHORT[left[0]]} lane.` : " Now drop Eat Better's four SKUs onto the ladder."}` });
      if (left.length) setLane(left[0]);
      return;
    }
    setMistakes((x) => x + 1);
    setBands((s) => ({ ...s, [lane]: { ...b, wrong: true } }));
    setFeedback({ tone: "bad", text: `The chapter's market table gives ${m.name} as ${m.tier} (${m.rangeText}). You placed ₹${lo.toFixed(2)} to ₹${hi.toFixed(2)}.${lo > hi ? " The bottom of a band must be lower than its top." : ""}` });
  };

  const dropSku = () => {
    if (!picked) return;
    const s = SKUS.find((x) => x.id === picked)!;
    const v = num(skuVal);
    if (!Number.isFinite(v) || skuVal.trim() === "") {
      setFeedback({ tone: "info", text: "Type the price per gram first (two decimals)." });
      return;
    }
    if (near(v, exact(s), 0.0075)) {
      setPlaced((p) => ({ ...p, [s.id]: true }));
      setPicked(null);
      setSkuVal("");
      setMiss(null);
      const left = SKUS.filter((x) => x.id !== s.id && !placed[x.id]);
      setFeedback({
        tone: "good",
        text: `₹${s.price} ÷ ${s.grams} g = ₹${exact(s).toFixed(3)}, about ₹${s.perGram.toFixed(2)}/g. The box climbs to its rung.${left.length ? "" : " All four are up: Eat Better's band is simply its cheapest to its priciest SKU, ~₹0.67 to ₹1.55/g."}`,
      });
      return;
    }
    setMistakes((x) => x + 1);
    setMiss({ id: s.id, v: Math.max(0, Math.min(2, v)) });
    setTimeout(() => setMiss(null), 1400);
    const flipped = near(v, s.grams / s.price, 0.02);
    setFeedback({ tone: "bad", text: `${flipped ? "You divided grams by rupees. " : ""}Price per gram = price ÷ weight = ₹${s.price} ÷ ${s.grams} g. Try the division again, to two decimals.` });
  };

  const answer = () => {
    const q = qs[qi];
    const v = num(answers[qi]);
    if (answers[qi].trim() === "" || !Number.isFinite(v)) {
      setFeedback({ tone: "info", text: "Type a number." });
      return;
    }
    if (Math.abs(v - q.ans) <= q.tol + 1e-9) {
      setFeedback({ tone: "good", text: q.work });
      setQi((i) => i + 1);
      return;
    }
    setMistakes((x) => x + 1);
    setFeedback({ tone: "bad", text: `Read the two lit lines on the ladder (${q.marks.map((m) => rs(m)).join(" and ")}). ${q.unit === "times" ? "“How many times” means divide the bigger by the smaller." : q.unit === "SKUs" ? "Count the boxes whose rung is between the two lines." : q.unit === "₹" ? "Find the per-gram difference first, then multiply by the grams." : "Subtract the lower from the higher."}` });
  };

  const lineChecks = [
    { ok: has(line, /date|almond|millet|quinoa|roast|palm|clean|refined|sugar|ingredient|lab/), label: "Uses an ingredient or method from the market table" },
    { ok: has(line, /traditional|mass|fried|flour|maida|potato|cheap|haldiram|bikaji|bhujia|ordinary/), label: "Contrasts with the mass-market snacks" },
    { ok: words(line) >= 10, label: "At least 10 words" },
  ];
  const lineOk = lineChecks.every((c) => c.ok);
  const finish = () => {
    if (!lineOk) return;
    setDone(true);
    setFeedback({ tone: "good", text: "Ladder built. Eat Better shares its rungs with the health competitors and the top of the sweet shops, and sits well above the mass-market band." });
    onDone(`Placed the rival price bands and Eat Better's 4 SKUs on a ₹/g ladder (₹0.67 to ₹1.55/g). ${qs.map((q) => `${q.ask.split("?")[0]}? ${q.unit === "times" ? `≈${q.ans.toFixed(1)}×` : q.unit === "₹" ? `₹${q.ans}` : q.unit === "₹/g" ? `₹${q.ans.toFixed(2)}/g` : q.ans}`).join(" ")} Why the premium: ${line.trim()}`);
  };

  const ebBand = skusDone;
  const marks = step === 2 || step === 3 ? qs[qi].marks : [];
  const trayPos = (i: number): [number, number, number] => (compact ? [-1.35 + i * 0.9, 0.25, 1.15] : [2.55, 0.35 + i * 0.5, 0.3]);
  const skuPos = (s: (typeof SKUS)[number], i: number): [number, number, number] => {
    if (placed[s.id]) return [SKU_X[s.id], Y(exact(s)), 0.2];
    if (miss?.id === s.id) return [SKU_X[s.id], Y(miss.v), 0.2];
    return trayPos(i);
  };

  return (
    <GameFrame
      kicker="Activity 3 · 3D ladder"
      title="Price Ladder"
      mission="A ladder of rupees per gram, ₹0 to ₹2. Place each rival's price band from the chapter's table, then pick up each Eat Better box, work out its ₹/g and watch it climb to its rung. Finally, measure the distances that matter."
      steps={STEPS}
      step={step}
      stars={done ? starsFor(mistakes) : undefined}
      onReset={reset}
      feedback={feedback}
      note={{ real: "Price bands are the chapter's market table (how this chapter compares them). The four SKUs, prices and weights are Chapter 4.1's pricing table.", practice: "Which comparisons you are asked is drawn at random on every restart.", tip: "Price per gram = price ÷ grams. “How many times” = bigger ÷ smaller." }}
    >
      <Stage3D
        label="A vertical ruler from zero to two rupees per gram, with price bands for each kind of snack seller and Eat Better boxes placed at their price per gram."
        camera={{ position: [0, 2, 9], fov: 40 }}
        height={compact ? "460px" : "clamp(420px, 64vh, 580px)"}
        overlay={
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {step === 0 && <span className="rounded-full bg-cocoa/90 px-3 py-1 text-[0.8rem] font-extrabold text-cream">Tap a lane to place its band</span>}
            {step === 1 && <span className="rounded-full bg-cocoa/90 px-3 py-1 text-[0.8rem] font-extrabold text-cream">{picked ? "Box picked: type its ₹/g below" : "Tap an Eat Better box to pick it up"}</span>}
            {(step === 2 || step === 3) && (
              <span className="flex items-center gap-1.5 rounded-full bg-orange px-3 py-1 text-[0.8rem] font-extrabold text-white">
                <ArrowUpDown className="size-3.5" /> Measure between the lit lines
              </span>
            )}
          </div>
        }
      >
        <FitRig center={compact ? [-0.35, 1.85, 0] : [0.1, 2.05, 0]} dir={[0.12, 0.18, 1]} width={compact ? 4.6 : 6.4} height={compact ? 5.8 : 4.9} minDist={5} />
        <StageLights shadows={!compact} />
        <Floor color="#EAD7C2" />
        <mesh position={[0, Y(1), -0.25]} material={flatMat("#FFF8F2", 0.9)} receiveShadow>
          <boxGeometry args={[4.1, Y(2) + 0.3, 0.05]} />
        </mesh>
        {/* faint rung lines every ₹0.25 */}
        {Array.from({ length: 9 }).map((_, i) => (
          <mesh key={i} position={[0, Y(i * 0.25), -0.21]}>
            <boxGeometry args={[4.0, 0.012, 0.01]} />
            <meshBasicMaterial color="#D9C2AA" />
          </mesh>
        ))}
        <Ruler />
        {LANES.map((l) => (
          <group key={l.id}>
            {/* tappable lane */}
            <mesh
              position={[l.x, Y(1), -0.15]}
              onClick={(e) => {
                e.stopPropagation();
                if (step === 0 && l.id !== "eb") setLane(l.id);
              }}
            >
              <boxGeometry args={[0.82, Y(2), 0.02]} />
              <meshBasicMaterial color={lane === l.id && step === 0 ? "#FFE3CC" : "#FFFFFF"} transparent opacity={lane === l.id && step === 0 ? 0.9 : 0.01} />
            </mesh>
            <Label lines={SHORT[l.id].split(" ")} width={0.82} height={0.34} position={[l.x, -0.02 + 0.2, 0.3]} rotation={[-0.35, 0, 0]} o={{ bg: l.color, fg: "#FFF5EE" }} px={256} />
            {l.id !== "eb" && bands[l.id] && (Number.isFinite(num(bands[l.id].lo)) || bands[l.id].ok) && bands[l.id].lo !== "" && bands[l.id].hi !== "" && (bands[l.id].ok || bands[l.id].wrong) && (
              <Band x={l.x} color={l.color} lo={Math.max(0, Math.min(2, num(bands[l.id].lo)))} hi={Math.max(0, Math.min(2, num(bands[l.id].hi)))} state={bands[l.id].ok ? "ok" : "wrong"} />
            )}
            {l.id === "eb" && ebBand && <Band x={l.x} color={l.color} lo={0.67} hi={1.55} state="ok" />}
          </group>
        ))}
        {trayOrder.map((id, i) => {
          const s = SKUS.find((x) => x.id === id)!;
          return <SkuBox key={id} sku={s} at={skuPos(s, i)} picked={picked === id} placed={!!placed[id]} onPick={() => step === 1 && setPicked(id)} />;
        })}
        {marks.map((v) => (
          <Marker key={v} v={v} color="#FF5C00" />
        ))}
      </Stage3D>

      <div className="sr-only">
        {LANES.filter((l) => l.id !== "eb").map((l) => (
          <button key={l.id} data-testid={`pl-lane-${l.id}`} onClick={() => step === 0 && setLane(l.id)}>{`Select the ${MK[l.id].name} lane`}</button>
        ))}
        {SKUS.map((s) => (
          <button key={s.id} data-testid={`pl-sku-${s.id}`} onClick={() => step === 1 && !placed[s.id] && setPicked(s.id)}>{`Pick up ${s.name}`}</button>
        ))}
      </div>

      {step === 0 && (
        <div className="mt-4 rounded-2xl bg-cream p-4">
          <div className="font-display text-[1.1rem] font-semibold text-cocoa">
            Band for <span className="text-orange">{MK[lane].name}</span>
          </div>
          <div className="mt-1 text-[0.92rem] text-cocoa-2">Pricing tier from the market table: {MK[lane].tier}. Type its ₹-per-gram range.</div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <NumIn label="Band bottom, rupees per gram" testId="pl-lo" prefix="₹" unit="/g" value={bandFor(lane).lo} onChange={(v) => setBand(lane, "lo", v)} w="w-20" />
            <span className="font-bold text-cocoa-2">to</span>
            <NumIn label="Band top, rupees per gram" testId="pl-hi" prefix="₹" unit="/g" value={bandFor(lane).hi} onChange={(v) => setBand(lane, "hi", v)} w="w-20" />
            <button data-testid="pl-band" onClick={placeBand} className="eb-btn eb-btn-primary">
              Place band
            </button>
          </div>
          <div className="mt-3 flex flex-wrap gap-1.5">
            {RIVALS.map((id) => (
              <button key={id} onClick={() => setLane(id)} className={`rounded-full px-3 py-1 text-[0.82rem] font-bold ${bands[id]?.ok ? "bg-success/15 text-success" : lane === id ? "bg-cocoa text-cream" : "bg-white text-cocoa"}`}>
                {SHORT[id]} {bands[id]?.ok ? "· placed" : ""}
              </button>
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <div className="mt-4 rounded-2xl bg-cream p-4">
          {picked ? (
            (() => {
              const s = SKUS.find((x) => x.id === picked)!;
              return (
                <>
                  <div className="flex items-center gap-2 font-display text-[1.1rem] font-semibold text-cocoa">
                    <PackageOpen className="size-5 text-orange" /> {s.name}
                  </div>
                  <div className="mt-1 text-[0.95rem] text-cocoa">
                    <strong>₹{s.price}</strong> for <strong>{s.grams} g</strong> (Chapter 4.1&apos;s pricing table)
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <NumIn label="Price per gram" testId="pl-sku-in" prefix="₹" unit="/g" value={skuVal} onChange={setSkuVal} w="w-24" />
                    <button data-testid="pl-drop" onClick={dropSku} className="eb-btn eb-btn-primary">
                      Send it up the ladder
                    </button>
                  </div>
                </>
              );
            })()
          ) : (
            <p className="text-[0.98rem] text-cocoa">Pick up a box from the tray ({SKUS.filter((s) => placed[s.id]).length} of 4 placed).</p>
          )}
        </div>
      )}

      {(step === 2 || step === 3) && (
        <div className="mt-4 grid gap-2 rounded-2xl bg-cream p-4">
          <div className="flex items-center gap-2">
            <span className="text-[0.75rem] font-extrabold uppercase tracking-[0.12em] text-orange">Comparison {qi + 1} of 2</span>
            <PracticeTag>Drawn at random</PracticeTag>
          </div>
          <p className="font-display text-[1.1rem] font-semibold leading-snug text-cocoa" data-testid="pl-q">
            {qs[qi].ask}
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <NumIn label="Your answer" testId="pl-ans" value={answers[qi]} onChange={(v) => setAnswers((a) => a.map((x, i) => (i === qi ? v : x)))} unit={qs[qi].unit} w="w-24" />
            <button data-testid="pl-ans-go" onClick={answer} className="eb-btn eb-btn-primary">
              Check
            </button>
          </div>
        </div>
      )}

      {step >= 4 && (
        <div className="mt-4 grid gap-2 rounded-2xl bg-cream p-4">
          <label htmlFor="pl-line" className="font-display text-[1.05rem] font-semibold text-cocoa">
            In one line: what does the market table say Eat Better puts in (or leaves out) that the mass-market snacks don&apos;t, to justify its rung on this ladder?
          </label>
          <textarea id="pl-line" data-testid="pl-line" rows={2} value={line} onChange={(e) => setLine(e.target.value)} disabled={done} className="w-full rounded-xl border-2 border-cocoa/20 bg-white px-3 py-2 text-[1rem] text-cocoa outline-none focus:border-orange" placeholder="Eat Better costs more per gram because…" />
          <ul className="grid gap-1.5 sm:grid-cols-3">
            {lineChecks.map((c) => (
              <CheckRow key={c.label} ok={c.ok} label={c.label} />
            ))}
          </ul>
          {!done && (
            <button data-testid="pl-finish" onClick={finish} disabled={!lineOk} className="eb-btn eb-btn-primary justify-self-start disabled:opacity-50">
              Save my explanation
            </button>
          )}
        </div>
      )}
    </GameFrame>
  );
}
