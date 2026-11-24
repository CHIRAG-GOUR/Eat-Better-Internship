"use client";

import { useMemo, useState } from "react";
import { GameFrame, starsFor, type Feedback } from "@/components/play/GameFrame";
import { Stage3D } from "@/components/play/Stage3D";
import { FitCamera, Labels, NumIn, ProbeHook, Projector, createProjStore, fmt, num, pick, type ProjStore } from "./shared";

/**
 * Activity 2 · Capacity Headroom (Pillar 4: Infrastructure & Production Capacity).
 * Research basis: capacity-planning teaching games (e.g. "bottleneck" line-balancing exercises where students size a
 * process to demand, then see which station limits output) and the operations rule that capacity = demand / rate, rounded UP.
 * The student turns the chapter's ~2 lakh orders a month into orders per day, sizes lines, packing stations and quality-check
 * stations for a randomised practice growth target, then builds the floor in 3D. Capacity is checked on the stations the
 * student really placed, so deleting the quality-check stations (to squeeze in more lines) fails the "without compromising
 * quality control" rule. Typed numbers only; no choices.
 */

const COLS = 10;
const ROWS = 5;
const T = 0.9; // world size of one tile = 1,000 sq. ft.
type Kind = "line" | "pack" | "qc";
const FOOT: Record<Kind, [number, number]> = { line: [3, 1], pack: [2, 1], qc: [1, 1] };
const NAME: Record<Kind, string> = { line: "Production line", pack: "Packing station", qc: "Quality-check station" };
const FIXED: { n: string; r: [number, number, number, number] }[] = [
  { n: "Receiving dock", r: [0, 0, 2, 1] },
  { n: "Ingredient store", r: [0, 3, 2, 2] },
  { n: "Dispatch bay", r: [8, 4, 2, 1] },
];
const FIXED_TILES = FIXED.reduce((s, f) => s + f.r[2] * f.r[3], 0);
const FREE_MIN = 2;
const PER_DAY = 200000 / 30;

type Placed = { id: number; k: Kind; c: number; r: number; rot: boolean };
const dims = (k: Kind, rot: boolean): [number, number] => (rot ? [FOOT[k][1], FOOT[k][0]] : FOOT[k]);
const cx = (c: number) => (c - (COLS - 1) / 2) * T;
const cz = (r: number) => (r - (ROWS - 1) / 2) * T;

function makeRound() {
  for (let i = 0; i < 300; i++) {
    const g = pick([1.5, 1.8, 2, 2.2, 2.5]);
    const lineCap = pick([1600, 1800, 2000, 2200, 2400]);
    const packCap = pick([3000, 3500, 4000, 4500]);
    const target = PER_DAY * g;
    const lr = target / lineCap;
    const pr = target / packCap;
    const away = (x: number) => Math.abs(x - Math.round(x)) > 0.05;
    if (!away(lr) || !away(pr)) continue;
    const L = Math.ceil(lr);
    const P = Math.ceil(pr);
    const Q = Math.ceil(L / 2);
    const tiles = 3 * L + 2 * P + Q;
    if (tiles > 34 || L < 4) continue;
    return { g, lineCap, packCap, target, L, P, Q, tiles };
  }
  return { g: 2, lineCap: 2000, packCap: 4000, target: PER_DAY * 2, L: 7, P: 4, Q: 4, tiles: 33 };
}

function fits(placed: Placed[], k: Kind, c: number, r: number, rot: boolean) {
  const [w, h] = dims(k, rot);
  if (c < 0 || r < 0 || c + w > COLS || r + h > ROWS) return "off the floor";
  for (const f of FIXED) if (c < f.r[0] + f.r[2] && c + w > f.r[0] && r < f.r[1] + f.r[3] && r + h > f.r[1]) return `on the ${f.n.toLowerCase()}`;
  for (const p of placed) {
    const [pw, ph] = dims(p.k, p.rot);
    if (c < p.c + pw && c + w > p.c && r < p.r + ph && r + h > p.r) return `on a ${NAME[p.k].toLowerCase()} already there`;
  }
  return null;
}

function Item({ k, w, h, ghost, ok = true, lit }: { k: Kind; w: number; h: number; ghost?: boolean; ok?: boolean; lit?: boolean }) {
  const col = ghost ? (ok ? "#2f9e5b" : "#d93a3a") : k === "line" ? "#FF5C00" : k === "pack" ? "#E8B400" : "#2f9e5b";
  const W = w * T - 0.12;
  const D = h * T - 0.12;
  const op = ghost ? 0.55 : 1;
  const em = lit ? 0.6 : 0;
  return (
    <group>
      <mesh position={[0, 0.22, 0]}>
        <boxGeometry args={[W, 0.34, D]} />
        <meshStandardMaterial color={col} transparent={ghost} opacity={op} emissive={col} emissiveIntensity={em} />
      </mesh>
      {!ghost && k === "line" && (
        <mesh position={[0, 0.42, 0]}>
          <boxGeometry args={[W - 0.1, 0.06, D * 0.4]} />
          <meshStandardMaterial color="#3b2a26" />
        </mesh>
      )}
      {!ghost && k === "pack" && (
        <mesh position={[0, 0.45, 0]}>
          <boxGeometry args={[W * 0.45, 0.2, D * 0.55]} />
          <meshStandardMaterial color="#fff5ee" />
        </mesh>
      )}
      {!ghost && k === "qc" && (
        <mesh position={[0, 0.5, 0]}>
          <cylinderGeometry args={[0.13, 0.13, 0.22, 14]} />
          <meshStandardMaterial color="#fff5ee" emissive="#7fffa8" emissiveIntensity={0.7} />
        </mesh>
      )}
    </group>
  );
}

function Scene({ store, placed, sel, rot, hover, setHover, tapTile, pickKind, ran }: { store: ProjStore; placed: Placed[]; sel: Kind | null; rot: boolean; hover: [number, number] | null; setHover: (h: [number, number] | null) => void; tapTile: (c: number, r: number) => void; pickKind: (k: Kind) => void; ran: boolean }) {
  const points = useMemo(() => {
    const o: Record<string, [number, number, number]> = {};
    for (let c = 0; c < COLS; c++) for (let r = 0; r < ROWS; r++) o[`${c},${r}`] = [cx(c), 0.1, cz(r)];
    o.line = [cx(2) - 0.9, 0.2, cz(4) + 2];
    o.pack = [cx(5), 0.2, cz(4) + 2];
    o.qc = [cx(7) + 0.5, 0.2, cz(4) + 2];
    return o;
  }, []);
  const zonePts = useMemo(() => Object.fromEntries(FIXED.map((f) => [f.n, [cx(f.r[0] + (f.r[2] - 1) / 2), 0.5, cz(f.r[1] + (f.r[3] - 1) / 2)] as [number, number, number]])), []);
  const ghostOk = sel && hover ? !fits(placed, sel, hover[0], hover[1], rot) : false;
  const trayY = cz(ROWS - 1) + 1.75;
  return (
    <>
      <FitCamera w={COLS * T + 0.8} h={ROWS * T + 2.6} tilt={0.85} pad={1.02} target={[0, 0, 0.75]} />
      <ProbeHook name="cap" points={points} />
      <Projector store={store} points={zonePts} />
      <ambientLight intensity={1.1} />
      <directionalLight position={[3, 7, 5]} intensity={1.2} />
      <mesh position={[0, -0.06, 0]}>
        <boxGeometry args={[COLS * T + 0.3, 0.1, ROWS * T + 0.3]} />
        <meshStandardMaterial color="#cdb89a" />
      </mesh>
      {Array.from({ length: COLS * ROWS }).map((_, i) => {
        const c = i % COLS;
        const r = Math.floor(i / COLS);
        return (
          <mesh key={i} position={[cx(c), 0, cz(r)]} rotation={[-Math.PI / 2, 0, 0]} onPointerMove={(e) => { e.stopPropagation(); if (!hover || hover[0] !== c || hover[1] !== r) setHover([c, r]); }} onPointerOut={() => setHover(null)} onClick={(e) => { e.stopPropagation(); tapTile(c, r); }}>
            <planeGeometry args={[T - 0.04, T - 0.04]} />
            <meshStandardMaterial color={(c + r) % 2 ? "#F3E6D2" : "#EBDAC0"} />
          </mesh>
        );
      })}
      {FIXED.map((f) => (
        <group key={f.n} position={[cx(f.r[0] + (f.r[2] - 1) / 2), 0, cz(f.r[1] + (f.r[3] - 1) / 2)]}>
          <mesh position={[0, 0.17, 0]} raycast={() => null}>
            <boxGeometry args={[f.r[2] * T - 0.08, 0.3, f.r[3] * T - 0.08]} />
            <meshStandardMaterial color="#8d8f9a" />
          </mesh>
        </group>
      ))}
      {placed.map((p) => {
        const [w, h] = dims(p.k, p.rot);
        return (
          <group key={p.id} position={[cx(p.c + (w - 1) / 2), 0, cz(p.r + (h - 1) / 2)]}>
            <group raycast={() => null}>
              <Item k={p.k} w={w} h={h} lit={ran} />
            </group>
          </group>
        );
      })}
      {sel && hover && (() => {
        const [w, h] = dims(sel, rot);
        return (
          <group position={[cx(hover[0] + (w - 1) / 2), 0.02, cz(hover[1] + (h - 1) / 2)]} raycast={() => null}>
            <Item k={sel} w={w} h={h} ghost ok={ghostOk} />
          </group>
        );
      })()}
      {/* pick-up tray */}
      {(["line", "pack", "qc"] as Kind[]).map((k, i) => {
        const [w, h] = FOOT[k];
        const x = [cx(2) - 0.9, cx(5), cx(7) + 0.5][i];
        return (
          <group key={k} position={[x, 0, trayY]} onClick={(e) => { e.stopPropagation(); pickKind(k); }}>
            <mesh position={[0, -0.02, 0]}>
              <boxGeometry args={[w * T + 0.2, 0.05, h * T + 0.3]} />
              <meshStandardMaterial color={sel === k ? "#FFE08A" : "#e4d3b8"} />
            </mesh>
            <Item k={k} w={w} h={h} lit={sel === k} />
          </group>
        );
      })}
    </>
  );
}

export default function CapacityHeadroom({ onDone }: { onDone: (summary: string) => void }) {
  const [R, setR] = useState(makeRound);
  const [step, setStep] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [fb, setFb] = useState<Feedback>(null);
  const [a, setA] = useState({ day: "", tgt: "", L: "", P: "", Q: "", used: "", head: "" });
  const [placed, setPlaced] = useState<Placed[]>([]);
  const [sel, setSel] = useState<Kind | null>(null);
  const [rot, setRot] = useState(false);
  const [hover, setHover] = useState<[number, number] | null>(null);
  const [ran, setRan] = useState(false);
  const [done, setDone] = useState(false);
  const [nid, setNid] = useState(1);
  const [store] = useState(createProjStore);

  const cnt = (k: Kind) => placed.filter((p) => p.k === k).length;
  const tiles = placed.reduce((s, p) => s + FOOT[p.k][0] * FOOT[p.k][1], 0);
  const free = COLS * ROWS - FIXED_TILES - tiles;
  const bad = (t: string) => {
    setMistakes((x) => x + 1);
    setFb({ tone: "bad", text: t });
  };

  function checkDay() {
    const v = num(a.day);
    if (Math.abs(v - PER_DAY) > PER_DAY * 0.012) {
      bad(`Method: the chapter reports about 2 lakh orders a month, which is 2,00,000. Treat the month as 30 days: 2,00,000 ÷ 30 ≈ 6,667 orders a day. (Close answers such as 6,600 to 6,730 are accepted.)${v > 7000 && v < 8000 ? " A 26-day month gives about 7,692, but this practice uses a plain 30-day month." : ""}`);
      return;
    }
    setFb({ tone: "good", text: `About 6,667 orders a day today. A practice growth target is now set: ${R.g}× today's daily orders.` });
    setStep(1);
  }

  function checkEq() {
    const T1 = PER_DAY * R.g;
    if (Math.abs(num(a.tgt) - T1) > T1 * 0.012) {
      bad(`Target orders a day = today's ~6,667 × ${R.g} ≈ ${fmt(T1)}. Work that out first; the equipment depends on it.`);
      return;
    }
    const errs: string[] = [];
    if (num(a.L) !== R.L) errs.push(`Lines: ${fmt(T1)} ÷ ${fmt(R.lineCap)} per line = ${(T1 / R.lineCap).toFixed(2)}. A line cannot be partly built, so round UP.`);
    if (num(a.P) !== R.P) errs.push(`Packing stations: ${fmt(T1)} ÷ ${fmt(R.packCap)} per station = ${(T1 / R.packCap).toFixed(2)}, round UP.`);
    if (num(a.Q) !== R.Q) errs.push(`Quality-check stations: the practice rule is 1 for every 2 lines, rounded up. With ${R.L} lines that is ${R.Q}.`);
    if (errs.length) {
      bad(errs.join(" "));
      return;
    }
    setFb({ tone: "good", text: `Needs: ${R.L} lines, ${R.P} packing stations, ${R.Q} quality-check stations (${R.tiles} tiles of the ${COLS * ROWS - FIXED_TILES} free). Now build it on the floor. Pick an item from the tray, then tap a tile.` });
    setStep(2);
  }

  function tapTile(c: number, r: number) {
    if (step !== 2) {
      setFb({ tone: "info", text: "The floor unlocks once you have worked out what to build." });
      return;
    }
    if (sel) {
      const why = fits(placed, sel, c, r, rot);
      if (why) {
        bad(`That would put a ${NAME[sel].toLowerCase()} ${why}. Move it so the whole footprint (${dims(sel, rot).join(" × ")} tiles) sits on empty floor.`);
        return;
      }
      setPlaced((p) => [...p, { id: nid, k: sel, c, r, rot }]);
      setNid((n) => n + 1);
      setRan(false);
      setFb(null);
      return;
    }
    const hit = placed.find((p) => {
      const [w, h] = dims(p.k, p.rot);
      return c >= p.c && c < p.c + w && r >= p.r && r < p.r + h;
    });
    if (hit) {
      setPlaced((p) => p.filter((x) => x.id !== hit.id));
      setRan(false);
      setFb({ tone: "info", text: `Picked up a ${NAME[hit.k].toLowerCase()}. ${hit.k === "qc" ? "Remember the plan must not compromise quality control." : "Place it somewhere else, or leave it out."}` });
    }
  }

  function runTest() {
    const L = cnt("line");
    const P = cnt("pack");
    const Q = cnt("qc");
    const capL = L * R.lineCap;
    const capP = P * R.packCap;
    const needQ = Math.ceil(L / 2);
    if (Q < needQ) {
      bad(`Quality control fails. ${L} lines need at least ${needQ} quality-check stations (1 per 2 lines) and you have ${Q}. The plan says growth must come without compromising quality control, so a station cannot be traded for floor space.`);
      return;
    }
    if (capL < R.target) {
      bad(`Production is the bottleneck: ${L} lines × ${fmt(R.lineCap)} = ${fmt(capL)} orders a day, below the target of ${fmt(R.target)}.`);
      return;
    }
    if (capP < R.target) {
      bad(`Packing is the bottleneck: ${P} stations × ${fmt(R.packCap)} = ${fmt(capP)} orders a day, below the target of ${fmt(R.target)}. Orders cannot ship faster than they are packed.`);
      return;
    }
    if (free < FREE_MIN) {
      bad(`The floor is overfilled: only ${free} tiles are left clear. This practice rule keeps ${FREE_MIN} tiles (${FREE_MIN},000 sq. ft.) free for movement. Remove spare equipment.`);
      return;
    }
    setRan(true);
    setSel(null);
    setFb({ tone: "good", text: `Test shift passed: ${fmt(capL)} orders a day produced, ${fmt(capP)} packed, ${Q} quality-check stations running. Last step: measure the floor and the headroom.` });
    setStep(3);
  }

  function checkEnd() {
    const used = ((FIXED_TILES + tiles) / (COLS * ROWS)) * 100;
    const head = cnt("line") * R.lineCap - PER_DAY;
    const errs: string[] = [];
    if (Math.abs(num(a.used) - used) > 1.1) errs.push(`Floor used = (${FIXED_TILES} fixed tiles + ${tiles} equipment tiles) ÷ ${COLS * ROWS} tiles × 100.`);
    if (Math.abs(num(a.head) - head) > Math.max(60, head * 0.012)) errs.push(`Headroom = installed line capacity (${cnt("line")} × ${fmt(R.lineCap)}) minus today's ~6,667 orders a day.`);
    if (errs.length) {
      bad(errs.join(" "));
      return;
    }
    const stars = starsFor(mistakes);
    setDone(true);
    setStep(4);
    setFb({ tone: "good", text: `Headroom of about ${fmt(head)} orders a day above today's volume, with ${cnt("qc")} quality-check stations kept. ${stars} of 3 stars.` });
    onDone(`Capacity Headroom: for a practice target of ${fmt(R.target)} orders a day (${R.g}× today's ~6,667) I placed ${cnt("line")} lines, ${cnt("pack")} packing and ${cnt("qc")} quality-check stations, using ${Math.round(used)}% of the 50,000 sq. ft. floor, with about ${fmt(head)} orders a day of headroom. ${stars}/3 stars. (Practice numbers)`);
  }

  function restart() {
    setR(makeRound());
    setStep(0);
    setMistakes(0);
    setFb(null);
    setA({ day: "", tgt: "", L: "", P: "", Q: "", used: "", head: "" });
    setPlaced([]);
    setSel(null);
    setRot(false);
    setRan(false);
    setDone(false);
  }

  const F = (k: keyof typeof a, label: string, unit: string, lockAt: number) => <NumIn value={a[k]} onChange={(v) => setA((s) => ({ ...s, [k]: v }))} label={label} unit={unit} disabled={step > lockAt} w="w-24" />;

  return (
    <GameFrame
      calculator
      kicker="Activity 2 · Pillar 4"
      title="Capacity Headroom"
      mission="Plan the 50,000 sq. ft. Jaipur floor: size the lines for a growth target, build them in 3D, and keep quality control."
      steps={["Orders per day", "Size the equipment", "Build the floor", "Floor and headroom"]}
      guide={
        step === 0
          ? { todo: "Turn the chapter's monthly orders into orders per day and type it.", hints: ["2 lakh = 2,00,000.", "A month here has 30 days, so divide the month's orders by 30.", "Round to a whole number of orders. The Calculator button can help."] }
          : step === 1
            ? { todo: "Work out the four numbers in order, top to bottom, then press Check all four.", hints: ["Start with the target: it is today's orders a day times the growth number.", "Round UP means any part over a whole number becomes the next whole number: 4.2 lines → 5 lines.", "Example with other numbers: a target of 9,000 with lines of 2,000 a day → 9,000 ÷ 2,000 = 4.5 → 5 lines."] }
            : step === 2
              ? { todo: "Build the floor: pick an item from the tray, tap a free tile to place it, and place every line, packing station and quality-check station you worked out. Then press Run a test shift.", hints: ["Tap a placed item (with nothing picked) to pick it back up.", "Use the rotate button if an item does not fit the space.", "Keep some floor free: do not add spare equipment."] }
              : step === 3
                ? { todo: "Measure your floor: type the floor used and the headroom, then press Check.", hints: ["The numbers you need are written in each row.", "Headroom is how many more orders a day your lines can make than today's orders."] }
                : undefined
      }
      step={step}
      stars={done ? starsFor(mistakes) : undefined}
      onReset={restart}
      feedback={fb}
      note={{
        real: "About 2 lakh fulfilled orders a month (Chapter 4.1), and the plan for a centralized 50,000 sq. ft. Jaipur facility with significant headroom, without compromising quality control.",
        practice: "The growth multiple, the speed of each line and packing station, the stations' footprints, the fixed rooms and the 'quality-check per 2 lines' rule are made up for this game. One tile stands for 1,000 sq. ft.",
        tip: "Capacity needed = demand ÷ what one unit can do, always rounded up.",
      }}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2 text-[0.85rem] font-bold">
        <span className="rounded-full bg-cocoa px-3 py-1 text-cream">Practice numbers</span>
        <span className="rounded-full bg-cream px-3 py-1 text-cocoa">Free floor {free} of {COLS * ROWS - FIXED_TILES} tiles</span>
        {step === 2 && (
          <>
            {(["line", "pack", "qc"] as Kind[]).map((k) => (
              <button key={k} data-kind={k} onClick={() => setSel(sel === k ? null : k)} className={`rounded-full border-2 px-3 py-1 text-[0.82rem] font-bold ${sel === k ? "border-cocoa bg-haldi text-cocoa" : "border-cocoa/20 bg-white text-cocoa"}`}>
                {NAME[k]} ({FOOT[k][0]}×{FOOT[k][1]}) · placed {cnt(k)}
              </button>
            ))}
            <button onClick={() => setRot((r) => !r)} className="rounded-full border-2 border-cocoa/20 bg-white px-3 py-1 text-[0.82rem] font-bold text-cocoa">
              Rotate: {rot ? "upright" : "flat"}
            </button>
          </>
        )}
      </div>
      <Stage3D
        label="A 3D floor plan of a 50,000 square foot factory with a tray of production lines, packing stations and quality-check stations"
        height="clamp(400px, 64vh, 580px)"
        camera={{ position: [0, 9, 8], fov: 42 }}
        overlay={
          <>
            <Labels store={store} items={FIXED.map((f) => ({ key: f.n, node: <span className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded bg-white/90 px-1 py-0.5 text-[10px] font-bold text-cocoa">{f.n}</span> }))} />
          </>
        }
      >
        <Scene store={store} placed={placed} sel={sel} rot={rot} hover={hover} setHover={setHover} tapTile={tapTile} pickKind={(k) => step === 2 && setSel(sel === k ? null : k)} ran={ran} />
      </Stage3D>

      <div className="mt-4 rounded-2xl bg-cream p-4">
        {step === 0 && (
          <div className="flex flex-wrap items-center gap-4">
            <p className="text-[1rem] text-cocoa">The chapter reports about <strong>2 lakh</strong> (2,00,000) fulfilled orders a month. How many orders a day is that, using a 30-day month?</p>
            {F("day", "Orders per day today", "per day", 0)}
            <button onClick={checkDay} className="eb-btn eb-btn-primary !py-2 !text-[0.9rem]">Check</button>
          </div>
        )}
        {step === 1 && (
          <div className="grid gap-3">
            <p className="text-[1rem] text-cocoa">
              Practice growth target: <strong>{R.g}×</strong> today&apos;s orders a day. One production line makes <strong>{fmt(R.lineCap)}</strong> orders a day; one packing station packs <strong>{fmt(R.packCap)}</strong>.
            </p>
            {/* one row per answer, each with the method beside it */}
            <div className="grid gap-2">
              {(
                [
                  ["tgt", "Target orders a day", "per day", `today's orders a day × ${R.g}`],
                  ["L", "Production lines", "", `target ÷ ${fmt(R.lineCap)}, then round UP`],
                  ["P", "Packing stations", "", `target ÷ ${fmt(R.packCap)}, then round UP`],
                  ["Q", "Quality-check stations", "", "lines ÷ 2, then round UP"],
                ] as const
              ).map(([k, label, unit, how], i) => (
                <div key={k} className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-white px-3 py-2">
                  <span className="grid size-6 shrink-0 place-items-center rounded-full bg-orange text-[0.8rem] font-bold text-white">{i + 1}</span>
                  <span className="min-w-[10rem] flex-1">
                    <span className="block text-[0.98rem] font-bold text-cocoa">{label}</span>
                    <span className="block text-[0.82rem] text-cocoa-2">How: {how}</span>
                  </span>
                  {F(k, label, unit, 1)}
                </div>
              ))}
            </div>
            <button onClick={checkEq} className="eb-btn eb-btn-primary self-start !py-2 !text-[0.9rem]">Check all four</button>
          </div>
        )}
        {step === 2 && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[1rem] text-cocoa">Placed: <strong>{cnt("line")}</strong> lines, <strong>{cnt("pack")}</strong> packing, <strong>{cnt("qc")}</strong> quality-check. Pick an item in the tray (or the buttons on the stage), then tap a tile. With nothing picked, tap equipment to take it back up.</p>
            <button onClick={runTest} className="eb-btn eb-btn-primary !py-2 !text-[0.9rem]">Run a test shift</button>
          </div>
        )}
        {step === 3 && (
          <div className="grid gap-2">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-white px-3 py-2">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-orange text-[0.8rem] font-bold text-white">1</span>
              <span className="min-w-[12rem] flex-1">
                <span className="block text-[0.98rem] font-bold text-cocoa">Floor used (%)</span>
                <span className="block text-[0.82rem] text-cocoa-2">
                  Fixed tiles {FIXED_TILES} + your equipment tiles {tiles}, out of {COLS * ROWS} tiles. How: (fixed + equipment) ÷ total × 100
                </span>
              </span>
              {F("used", "Percent of the floor used", "%", 3)}
            </div>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-white px-3 py-2">
              <span className="grid size-6 shrink-0 place-items-center rounded-full bg-orange text-[0.8rem] font-bold text-white">2</span>
              <span className="min-w-[12rem] flex-1">
                <span className="block text-[0.98rem] font-bold text-cocoa">Headroom (orders a day)</span>
                <span className="block text-[0.82rem] text-cocoa-2">
                  You placed {cnt("line")} lines of {fmt(R.lineCap)} orders a day each. How: (lines × orders per line) − today&apos;s orders a day
                </span>
              </span>
              {F("head", "Orders per day of headroom above today", "per day", 3)}
            </div>
            <button onClick={checkEnd} className="eb-btn eb-btn-primary self-start !py-2 !text-[0.9rem]">Check</button>
          </div>
        )}
        {step === 4 && <p className="text-[1rem] font-bold text-success">Floor plan locked. Restart for a new growth target.</p>}
      </div>
    </GameFrame>
  );
}
