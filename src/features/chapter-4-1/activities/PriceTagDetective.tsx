"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Check } from "lucide-react";
import { Stage3D } from "@/components/play/Stage3D";
import { CheckRow, GameFrame, starsFor, type Feedback } from "@/components/play/GameFrame";
import { SKUS } from "../content";
import { FitCam, Halo, Label, makeFace, Mover, NumIn, num, PackBox, pick, Probe, r2, rint, shuffle, words } from "./shared";

/**
 * Price Tag Detective: weigh four real packs (plus labelled practice packs) on a 3D scale, divide price by weight,
 * put the shelf in order, then explain the trap in the real data (the bigger laddoo box costs MORE per gram).
 */

type P = { id: string; name: string; grams: number; price: number; real: boolean; src?: string; pg: number; lines: string[]; bg: string };

const SLOT = 1.25;
const SHORT: Record<string, string> = { l24: "Laddoo 24", l42: "Laddoo 42", usb: "Snack Box", nam: "Namkeen" };
const SHELF_Y = 1.48;
const SCALE_POS: [number, number, number] = [0, -0.7, 0.7];

function makePractice(): P[] {
  const taken = SKUS.map((s) => s.price / s.grams);
  const names: [string, string[]][] = [
    ["Trail Combo", ["Trail", "Combo"]],
    ["Snack Sampler", ["Snack", "Sampler"]],
    ["Crunch Box", ["Crunch", "Box"]],
  ];
  const bgs = ["#B7E4C7", "#BDE0FE", "#FFD6A5"];
  const out: P[] = [];
  const n = rint(1, 2);
  const nm = shuffle(names);
  let guard = 0;
  while (out.length < n && guard++ < 200) {
    const grams = pick([180, 250, 300, 360, 450, 500, 600]);
    const price = Math.round((grams * (0.9 + Math.random() * 1.3)) / 10) * 10 - 1;
    const pg = price / grams;
    if (taken.some((t) => Math.abs(t - pg) < 0.08)) continue;
    taken.push(pg);
    const [name, lines] = nm[out.length];
    out.push({ id: `p${out.length}`, name: `Practice ${name}`, grams, price, real: false, pg, lines: ["PRACTICE", ...lines], bg: bgs[out.length] });
  }
  return out;
}

function buildPacks(): P[] {
  const real: P[] = SKUS.map((s) => ({ id: s.id, name: s.short, grams: s.grams, price: s.price, real: true, src: s.tex, pg: s.price / s.grams, lines: [], bg: "" }));
  return [...real, ...makePractice()];
}

const slotPos = (i: number, n: number): [number, number, number] => [(i - (n - 1) / 2) * SLOT, SHELF_Y, 0];

function PracticeFace({ p }: { p: P }) {
  const face = useMemo(() => makeFace(p.lines, p.bg, "#2f1c1a", "PRACTICE PACK"), [p.lines, p.bg]);
  return <PackBox face={face} />;
}


function Scale({ grams, onClick }: { grams: number | null; onClick: () => void }) {
  const [shown, setShown] = useState(0);
  const plate = useRef<THREE.Mesh>(null);
  const needle = useRef<THREE.Group>(null);
  const cur = useRef(0);
  useEffect(() => {
    const to = grams ?? 0;
    const from = cur.current;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / 900);
      const e = 1 - Math.pow(1 - k, 3);
      cur.current = from + (to - from) * e;
      setShown(Math.round(cur.current));
      if (needle.current) needle.current.rotation.z = THREE.MathUtils.lerp(2.1, -2.1, cur.current / 700);
      if (plate.current) plate.current.position.y = -0.2 - (cur.current / 700) * 0.05;
      if (k < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [grams]);
  return (
    <group position={[0, -1.4, 0.7]} onClick={(e) => { e.stopPropagation(); onClick(); }} onPointerOver={() => (document.body.style.cursor = "pointer")} onPointerOut={() => (document.body.style.cursor = "")}>
      <mesh position={[0, -0.1, 0]} castShadow receiveShadow>
        <boxGeometry args={[1.9, 0.26, 1.3]} />
        <meshStandardMaterial color="#2f1c1a" roughness={0.5} />
      </mesh>
      <mesh ref={plate} position={[0, -0.2, 0]}>
        <boxGeometry args={[1.6, 0.06, 1.05]} />
        <meshStandardMaterial color="#cfd6db" metalness={0.6} roughness={0.35} />
      </mesh>
      {/* dial */}
      <group position={[1.65, 0.65, -0.2]}>
        <mesh>
          <circleGeometry args={[0.52, 32]} />
          <meshStandardMaterial color="#fff5ee" />
        </mesh>
        <mesh position={[0, 0, -0.01]}>
          <circleGeometry args={[0.58, 32]} />
          <meshStandardMaterial color="#2f1c1a" />
        </mesh>
        <group ref={needle} rotation={[0, 0, 2.1]} position={[0, 0, 0.02]}>
          <mesh position={[0, 0.22, 0]}>
            <boxGeometry args={[0.04, 0.44, 0.02]} />
            <meshStandardMaterial color="#F83A3A" />
          </mesh>
        </group>
        <mesh position={[0, 0, 0.03]}>
          <circleGeometry args={[0.06, 12]} />
          <meshStandardMaterial color="#2f1c1a" />
        </mesh>
        
      </group>
      <Label position={[0, -0.1, 0.68]} text={grams === null ? "0 g" : `${shown} g`} bg="#0e2a16" fg="#7CFF9B" border="none" mono h={0.3} />
    </group>
  );
}

type SceneProps = { packs: P[]; order: string[]; held: string | null; onScale: string | null; typed: Record<string, number>; step: number; shown: boolean; onPack: (id: string) => void; onScaleClick: () => void };

function Scene({ packs, order, held, onScale, typed, step, shown, onPack, onScaleClick }: SceneProps) {
  const n = packs.length;
  const byId = useMemo(() => Object.fromEntries(packs.map((p) => [p.id, p])), [packs]);
  const pos = (id: string): [number, number, number] => {
    if (id === onScale) return [SCALE_POS[0], SCALE_POS[1], SCALE_POS[2]];
    const s = slotPos(order.indexOf(id), n);
    return held === id ? [s[0], s[1] + 0.5, s[2] + 0.4] : s;
  };
  return (
    <>
      <FitCam width={n * SLOT + 1.6} height={4.8} cy={-0.1} />
      <ambientLight intensity={1.05} />
      <directionalLight position={[3, 6, 6]} intensity={1.5} />
      <mesh position={[0, 0.4, -0.9]}>
        <planeGeometry args={[40, 16]} />
        <meshStandardMaterial color="#F6E3CF" />
      </mesh>
      {/* shelf */}
      <mesh position={[0, SHELF_Y - 0.6, 0]}>
        <boxGeometry args={[n * SLOT + 0.6, 0.14, 1]} />
        <meshStandardMaterial color="#b9774a" roughness={0.8} />
      </mesh>
      {/* counter */}
      <mesh position={[0, -1.95, 0.5]}>
        <boxGeometry args={[9.5, 0.5, 2.4]} />
        <meshStandardMaterial color="#6b3f2a" roughness={0.8} />
      </mesh>
      <Scale grams={onScale ? byId[onScale].grams : null} onClick={onScaleClick} />
      {packs.map((p) => {
        const sel = held === p.id;
        const trap = step === 2 && (p.id === "l24" || p.id === "l42");
        return (
          <Mover key={p.id} target={pos(p.id)} selected={sel} onClick={() => onPack(p.id)}>
            {(sel || trap) && <Halo color={trap ? "#FED300" : "#FF5C00"} />}
            <Suspense fallback={null}>{p.real ? <PackBox src={p.src} /> : <PracticeFace p={p} />}</Suspense>
            {p.id === onScale && <Label position={[0.55, 0.7, 0.3]} text={`Price tag ₹${p.price}`} bg="#FED300" h={0.26} rot={-0.1} />}
            {shown && p.id !== onScale && typed[p.id] !== undefined && <Label position={[0, -0.86, 0.3]} text={`${step >= 1 ? (p.real ? SHORT[p.id] : "Practice") + "\n" : ""}₹${typed[p.id].toFixed(2)}/g`} bg={trap ? "#FED300" : step >= 1 ? "#ffffff" : "#d8f3dc"} border={step >= 1 ? "#2f1c1a" : "#00A341"} h={0.2} />}
          </Mover>
        );
      })}
      {step === 1 &&
        order.map((id, i) => {
          const s = slotPos(i, n);
          return (
            <Label key={id} position={[s[0], SHELF_Y - 0.74, 0.5]} text={String(i + 1)} bg="#2f1c1a" fg="#fff5ee" border="none" h={0.24} />
          );
        })}
      <Probe
        name="price"
        points={() => ({
          ...Object.fromEntries(packs.map((p) => [p.id, pos(p.id)])),
          scale: [0, -1.3, 1.2],
        })}
      />
    </>
  );
}

const lineChecks = (t: string) => {
  const s = t.toLowerCase();
  return [
    { ok: /\b42\b|bigger|larger|big box/.test(s) && /\b24\b|smaller|small box/.test(s), label: "Names both boxes (the 42-laddoo and the 24-laddoo box)", hint: "Say which two boxes you are comparing, for example the 42-laddoo box and the 24-laddoo box." },
    { ok: /(more|higher|costlier|dearer|expensive|greater)/.test(s) && /(gram|per g|\/g)/.test(s), label: "Says the bigger box costs MORE per gram", hint: "Use your two ₹/g numbers: is the 42-box higher or lower per gram than the 24-box?" },
    { ok: /(because|so |but|while|whereas|although|not always|isn't|is not|doesn't|does not|instead|even though|however)/.test(s) && /(discount|multi-pack|multipack|bundle|bigger|larger|size|volume|combo)/.test(s), label: "Explains that bigger does not automatically mean cheaper", hint: "A multi-pack discount is not guaranteed. Say what you expected (bigger = cheaper) and what the numbers show." },
    { ok: words(t) >= 12, label: "At least 12 words, in your own sentence", hint: `${words(t)} words so far.` },
  ];
};

export default function PriceTagDetective({ onDone }: { onDone: (summary: string) => void }) {
  const [packs, setPacks] = useState<P[]>(buildPacks);
  const [order, setOrder] = useState<string[]>(() => shuffle(packs.map((p) => p.id)));
  const [step, setStep] = useState(0);
  const [held, setHeld] = useState<string | null>(null);
  const [onScale, setOnScale] = useState<string | null>(null);
  const [typed, setTyped] = useState<Record<string, number>>({});
  const [val, setVal] = useState("");
  const [fb, setFb] = useState<Feedback>({ tone: "info", text: "Tap a pack on the shelf to pick it up, then tap the scale." });
  const [mist, setMist] = useState(0);
  const [line, setLine] = useState("");
  const [done, setDone] = useState(false);

  const byId = useMemo(() => Object.fromEntries(packs.map((p) => [p.id, p])), [packs]);
  const reset = () => {
    const p = buildPacks();
    let o = shuffle(p.map((x) => x.id));
    const sorted = [...p].sort((a, b) => a.pg - b.pg).map((x) => x.id);
    if (o.join() === sorted.join()) o = [...o].reverse();
    setPacks(p);
    setOrder(o);
    setStep(0);
    setHeld(null);
    setOnScale(null);
    setTyped({});
    setVal("");
    setMist(0);
    setLine("");
    setDone(false);
    setFb({ tone: "info", text: "New practice packs. Tap a pack, then tap the scale." });
  };
  const bad = (text: string) => {
    setMist((m) => m + 1);
    setFb({ tone: "bad", text });
  };

  const onPack = (id: string) => {
    if (done) return;
    if (step === 0) {
      if (id === onScale) {
        setOnScale(null);
        setVal("");
        setFb({ tone: "info", text: "Pack back on the shelf. Pick it up again when you are ready." });
      } else if (typed[id] !== undefined) setFb({ tone: "info", text: `${byId[id].name} is already priced at ₹${typed[id].toFixed(2)}/g. Pick one that has no green tag.` });
      else if (onScale) setFb({ tone: "info", text: "Finish the pack on the scale first: type its price per gram. Tap the pack again to put it back." });
      else setHeld(held === id ? null : id);
    } else if (step === 1) {
      if (!held) setHeld(id);
      else if (held === id) setHeld(null);
      else {
        setOrder((o) => {
          const a = [...o];
          const i = a.indexOf(held);
          const j = a.indexOf(id);
          [a[i], a[j]] = [a[j], a[i]];
          return a;
        });
        setHeld(null);
        setFb({ tone: "info", text: "Swapped. Lock the shelf when it runs from the lowest ₹/g (slot 1) to the highest." });
      }
    }
  };

  const onScaleClick = () => {
    if (step !== 0 || done) return;
    if (held) {
      setOnScale(held);
      setHeld(null);
      setVal("");
      setFb({ tone: "info", text: "The scale shows the weight and the price tag hangs on the pack. Divide the price by the weight." });
    } else if (!onScale) setFb({ tone: "info", text: "Pick up a pack from the shelf first, then tap the scale." });
  };

  const check = () => {
    if (!onScale) return;
    const p = byId[onScale];
    const x = num(val);
    const exact = p.price / p.grams;
    if (!Number.isFinite(x) || val.trim() === "") return bad("Type a number: the price divided by the weight, in rupees per gram.");
    if (Math.abs(x - exact) <= 0.006) {
      const t = { ...typed, [p.id]: r2(exact) };
      setTyped(t);
      setOnScale(null);
      setVal("");
      if (Object.keys(t).length === packs.length) {
        setStep(1);
        setFb({ tone: "good", text: `₹${p.price} ÷ ${p.grams} g = ₹${exact.toFixed(2)} per gram. Every pack is priced. Now tap two packs to swap them: lowest ₹/g in slot 1, highest in the last slot.` });
      } else setFb({ tone: "good", text: `₹${p.price} ÷ ${p.grams} g = ₹${exact.toFixed(2)} per gram. ${p.name} goes back on the shelf with its tag.` });
    } else if (Math.abs(x - p.price) < 0.5) bad(`That is the price tag itself (₹${p.price}). Price per gram = price ÷ weight, so divide ₹${p.price} by the ${p.grams} g on the display.`);
    else if (Math.abs(x - p.grams / p.price) < 0.05) bad("Upside down: you divided grams by rupees. Price per gram means rupees for each gram, so it is price ÷ grams.");
    else if (Math.abs(x - exact) <= 0.06) bad(`Close, but keep two decimals and round carefully. ${p.price} ÷ ${p.grams} is a little ${x > exact ? "less" : "more"} than ${x}.`);
    else if (x > exact * 50) bad("That is far too big. A gram of snack costs a rupee or two, not hundreds. Divide the price by the weight.");
    else bad(`Not ${val}. Work it out: ${p.price} ÷ ${p.grams}. It should land between ₹${Math.floor(exact * 10) / 10} and ₹${Math.ceil(exact * 10) / 10}.`);
  };

  const lock = () => {
    const sorted = [...packs].sort((a, b) => a.pg - b.pg).map((p) => p.id);
    if (order.join() === sorted.join()) {
      setStep(2);
      setHeld(null);
      setFb({ tone: "good", text: "Lowest to highest, confirmed. Look at the two gold tags: the namkeen is cheapest per gram, but the big laddoo box is not where you might expect." });
      return;
    }
    for (let i = 0; i < order.length - 1; i++) {
      const a = byId[order[i]];
      const b = byId[order[i + 1]];
      if (a.pg > b.pg) return bad(`Slot ${i + 1} (${a.name}, ₹${typed[a.id].toFixed(2)}/g) sits left of slot ${i + 2} (${b.name}, ₹${typed[b.id].toFixed(2)}/g), but ${typed[a.id].toFixed(2)} is higher than ${typed[b.id].toFixed(2)}. Swap them.`);
    }
    bad("Something is still out of order. Read the tags again.");
  };

  const checks = lineChecks(line);
  const allOk = checks.every((c) => c.ok);
  const finish = () => {
    if (!allOk) return;
    const rank = [...packs].sort((a, b) => a.pg - b.pg).map((p) => `${p.name} ₹${typed[p.id].toFixed(2)}/g`).join(" < ");
    setDone(true);
    setFb({ tone: "good", text: "Detective work done. Bigger is not always cheaper per gram: the 42-laddoo box is dearer per gram than the 24-laddoo box." });
    onDone(`Ranked ${rank}. My note on the 42 vs 24 box: ${line.trim()}`);
  };

  const sc = onScale ? byId[onScale] : null;
  const instr = ["Pick a pack, tap the scale, price it", "Swap packs: lowest ₹/g on the left", "Explain the surprise below"][step];

  return (
    <GameFrame
      kicker="Activity 1 · Price per gram"
      title="Price Tag Detective"
      mission="Weigh every pack on the 3D scale, work out its price per gram, line the shelf up from cheapest to dearest per gram, then explain what looks odd."
      steps={["Weigh & price each pack", "Order the shelf", "Explain the trap"]}
      step={done ? 3 : step}
      stars={done ? starsFor(mist) : undefined}
      onReset={reset}
      feedback={fb}
      note={{ real: "The four packs, their weights and their retail prices are the real figures from the chapter table; the pack photos are official.", practice: "The one or two packs marked PRACTICE are made up and change every restart, so the order cannot be memorised.", tip: "Price per gram = price ÷ weight. Compare packs only after you have done this for each." }}
    >
      <Stage3D
        label="A shelf of Eat Better packs, a 3D digital scale on a counter and price tags"
        height="clamp(380px, 50vh, 470px)"
        camera={{ position: [0, 1, 11], fov: 40 }}
        overlay={
          <>
            <div className="absolute left-2 top-2 max-w-[75%] rounded-full bg-cocoa/90 px-3 py-1 text-[0.82rem] font-bold text-cream">{instr}</div>
            {step === 1 && (
              <div className="absolute inset-x-3 top-11 flex justify-between text-[0.78rem] font-extrabold uppercase tracking-wide text-cocoa-2">
                <span>Lowest ₹/g</span>
                <span>Highest ₹/g</span>
              </div>
            )}
          </>
        }
      >
        <Scene packs={packs} order={order} held={held} onScale={onScale} typed={typed} step={step} shown onPack={onPack} onScaleClick={onScaleClick} />
      </Stage3D>

      <div className="mt-4 grid gap-3">
        {step === 0 && (
          <div className="rounded-2xl bg-cream p-4">
            {sc ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-[1rem] text-cocoa">
                  <strong>{sc.name}</strong>: price tag ₹{sc.price}, scale shows {sc.grams} g. Price per gram =
                </span>
                <NumIn value={val} onChange={setVal} label="Price per gram in rupees" prefix="₹" unit="per gram" onEnter={check} />
                <button onClick={check} className="eb-btn eb-btn-primary !py-2 !text-[0.95rem]">
                  Check
                </button>
              </div>
            ) : (
              <p className="text-[1rem] text-cocoa-2">
                Priced so far: <strong>{Object.keys(typed).length}</strong> of {packs.length}. {held ? `${byId[held].name} is lifted: now tap the scale.` : "Tap a pack on the shelf to lift it."}
              </p>
            )}
          </div>
        )}
        {step === 1 && (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-cream p-4">
            <span className="text-[1rem] text-cocoa">{held ? `${byId[held].name} lifted: tap the pack to swap with.` : "Tap a pack to lift it, then tap another pack to swap places."}</span>
            <button onClick={lock} className="eb-btn eb-btn-primary !py-2 !text-[0.95rem]">
              Lock the shelf order
            </button>
          </div>
        )}
        {step === 2 && (
          <div className="rounded-2xl bg-cream p-4">
            <p className="text-[1rem] text-cocoa">
              The two gold tags are the laddoo boxes: 24 laddoos (240 g, ₹349) and 42 laddoos (420 g, ₹649). One line, please: which costs more per gram, and why is that surprising?
            </p>
            <textarea value={line} onChange={(e) => setLine(e.target.value)} disabled={done} rows={3} aria-label="Your one-line explanation" placeholder="Write one sentence using your two ₹/g numbers…" className="mt-2 w-full resize-y rounded-xl border-2 border-cocoa/20 bg-white p-3 text-[1rem] text-cocoa outline-none focus:border-orange disabled:bg-success/10" />
            <ul className="mt-2 grid gap-1.5">
              {checks.map((c) => (
                <CheckRow key={c.label} ok={c.ok} label={c.label} hint={c.hint} />
              ))}
            </ul>
            <button onClick={finish} disabled={!allOk || done} className="eb-btn eb-btn-primary mt-3 !py-2 !text-[0.95rem] disabled:opacity-40">
              {done ? (
                <>
                  <Check className="mr-1 inline size-4" /> Done
                </>
              ) : (
                "Finish the case"
              )}
            </button>
          </div>
        )}
      </div>
    </GameFrame>
  );
}
