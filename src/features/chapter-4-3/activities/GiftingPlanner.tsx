"use client";

import { useMemo, useState } from "react";
import { GameFrame, starsFor, type Feedback } from "@/components/play/GameFrame";
import { Stage3D } from "@/components/play/Stage3D";
import { FitCamera, Labels, NumIn, ProbeHook, Projector, createProjStore, fmt, num, pick, rint, type ProjStore } from "./shared";

/**
 * Activity 3 · Year-Round Gifting Planner (Pillar 3: Corporate & B2B Gifting Scale).
 * Research basis: aggregate-planning / "level capacity" classroom games (chase vs level strategies: students smooth a seasonal
 * demand peak into earlier months using inventory or pre-production) and the scheduling idea of release dates and deadlines.
 * Practice corporate orders sit stacked on their deadline month, so Rakhi and Diwali towers overflow the monthly packing line.
 * The student moves orders inside each order's window (earliest start from its lead time, up to its deadline), then TYPES the
 * utilisation % of all 12 months. The plan locks only when no month is over capacity. Randomised orders each restart.
 */

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const CAPH = 4; // tower height that equals one month's packing capacity
type Kind = "rakhi" | "diwali" | "year";
type Order = { id: string; name: string; kind: Kind; size: number; arrive: number; start: number; deadline: number; month: number };
const COLOR: Record<Kind, string> = { rakhi: "#d94f8a", diwali: "#FF5C00", year: "#2f9e5b" };
const YEAR_NAMES = ["Joining kits", "Work-anniversary boxes", "Wellness-week boxes", "Client thank-you boxes", "Team-reward hampers", "Learning-day snack boxes", "Quarter-end rewards"];

const loads = (os: Order[]) => {
  const l = Array(12).fill(0) as number[];
  for (const o of os) l[o.month] += o.size;
  return l;
};

function solvable(os: Order[], C: number) {
  for (let t = 0; t < 120; t++) {
    const l = Array(12).fill(0) as number[];
    const order = [...os].sort((a, b) => (a.deadline - a.start) - (b.deadline - b.start) || Math.random() - 0.5);
    let ok = true;
    for (const o of order) {
      let best = -1;
      for (let m = o.start; m <= o.deadline; m++) if (l[m] + o.size <= C && (best < 0 || l[m] < l[best] || (l[m] === l[best] && Math.random() < 0.5))) best = m;
      if (best < 0) {
        ok = false;
        break;
      }
      l[best] += o.size;
    }
    if (ok) return true;
  }
  return false;
}

function makeRound() {
  for (let attempt = 0; attempt < 400; attempt++) {
    const C = pick([1000, 1200, 1500]);
    const S = (lo: number, hi: number) => Math.round((C * (lo + Math.random() * (hi - lo))) / 10) * 10;
    const os: Order[] = [];
    const add = (kind: Kind, name: string, size: number, start: number, deadline: number, lead: number) => os.push({ id: "", name, kind, size, arrive: Math.max(0, start - lead), start, deadline, month: deadline });
    for (let i = 0; i < 3; i++) add("rakhi", "Rakhi hampers", S(0.3, 0.5), rint(5, 6), 7, rint(1, 2));
    const dd = pick([9, 10]);
    for (let i = 0; i < 4; i++) add("diwali", "Diwali hampers", S(0.3, 0.55), dd - rint(2, 3), dd, rint(1, 2));
    const names = [...YEAR_NAMES].sort(() => Math.random() - 0.5);
    for (let i = 0; i < 7; i++) {
      const d = rint(2, 11);
      add("year", names[i], S(0.15, 0.35), Math.max(0, d - rint(1, 4)), d, rint(1, 2));
    }
    os.forEach((o, i) => (o.id = String.fromCharCode(65 + i)));
    const l = loads(os);
    const over = l.filter((x) => x > C).length;
    const total = os.reduce((s, o) => s + o.size, 0);
    if (over >= 2 && over <= 4 && total < 0.72 * 12 * C && solvable(os, C)) return { C, orders: os };
  }
  const C = 1000;
  const os: Order[] = [
    { id: "A", name: "Rakhi hampers", kind: "rakhi", size: 500, arrive: 4, start: 5, deadline: 7, month: 7 },
    { id: "B", name: "Rakhi hampers", kind: "rakhi", size: 400, arrive: 4, start: 5, deadline: 7, month: 7 },
    { id: "C", name: "Rakhi hampers", kind: "rakhi", size: 300, arrive: 5, start: 6, deadline: 7, month: 7 },
    { id: "D", name: "Joining kits", kind: "year", size: 200, arrive: 0, start: 1, deadline: 3, month: 3 },
  ];
  return { C, orders: os };
}

const px = (m: number) => (m - 5.5) * 1.02;

function Scene({ store, C, orders, sel, onBlock, onMonth, win, over }: { store: ProjStore; C: number; orders: Order[]; sel: string | null; onBlock: (id: string) => void; onMonth: (m: number) => void; win: boolean[]; over: boolean[] }) {
  const points = useMemo(() => {
    const p: Record<string, [number, number, number]> = {};
    for (let m = 0; m < 12; m++) p[`m${m}`] = [px(m), 1.4, 0];
    return p;
  }, []);
  const stacks = useMemo(() => {
    const y = Array(12).fill(0) as number[];
    return orders.map((o) => {
      const h = (o.size / C) * CAPH;
      const base = y[o.month];
      y[o.month] += h;
      return { o, h, base };
    });
  }, [orders, C]);
  const labelPts = useMemo(() => {
    const p: Record<string, [number, number, number]> = {};
    for (let m = 0; m < 12; m++) p[`m${m}`] = [px(m), 0, 0.62];
    for (const { o, h, base } of stacks) p[`o${o.id}`] = [px(o.month), base + h / 2, 0.42];
    return p;
  }, [stacks]);
  return (
    <>
      <FitCamera w={12.6} h={7.4} tilt={1.9} pad={1.04} target={[0, 2.2, 0]} />
      <ProbeHook name="gp" points={points} />
      <Projector store={store} points={labelPts} />
      <ambientLight intensity={1.15} />
      <directionalLight position={[3, 8, 6]} intensity={1.2} />
      {MONTHS.map((_, m) => (
        <group key={m} position={[px(m), 0, 0]}>
          <mesh position={[0, -0.04, 0]} onClick={(e) => { e.stopPropagation(); onMonth(m); }}>
            <boxGeometry args={[0.94, 0.08, 0.94]} />
            <meshStandardMaterial color={over[m] ? "#e86a6a" : win[m] ? "#8fe3a8" : "#d9c6a8"} emissive={win[m] ? "#2f9e5b" : "#000"} emissiveIntensity={win[m] ? 0.4 : 0} />
          </mesh>
          <mesh position={[0, 3.2, 0]} onClick={(e) => { e.stopPropagation(); onMonth(m); }} visible={false}>
            <boxGeometry args={[0.94, 6.4, 0.94]} />
            <meshBasicMaterial />
          </mesh>
          <mesh position={[0, CAPH, 0]}>
            <boxGeometry args={[0.98, 0.025, 0.98]} />
            <meshBasicMaterial color={over[m] ? "#d93a3a" : "#2f1c1a"} transparent opacity={0.55} />
          </mesh>
        </group>
      ))}
      {stacks.map(({ o, h, base }) => (
        <group key={o.id} position={[px(o.month), base + h / 2, 0]}>
          <mesh onClick={(e) => { e.stopPropagation(); onBlock(o.id); }}>
            <boxGeometry args={[0.8, Math.max(0.1, h - 0.04), 0.8]} />
            <meshStandardMaterial color={COLOR[o.kind]} emissive={sel === o.id ? "#ffffff" : "#000000"} emissiveIntensity={sel === o.id ? 0.55 : 0} />
          </mesh>
        </group>
      ))}
    </>
  );
}

export default function GiftingPlanner({ onDone }: { onDone: (summary: string) => void }) {
  const [R, setR] = useState(makeRound);
  const [orders, setOrders] = useState<Order[]>(() => R.orders.map((o) => ({ ...o })));
  const [step, setStep] = useState(0);
  const [sel, setSel] = useState<string | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [moves, setMoves] = useState(0);
  const [fb, setFb] = useState<Feedback>(null);
  const [a0, setA0] = useState({ pct: "", excess: "" });
  const [util, setUtil] = useState<string[]>(Array(12).fill(""));
  const [badU, setBadU] = useState<boolean[]>(Array(12).fill(false));
  const [done, setDone] = useState(false);
  const [store] = useState(createProjStore);

  const C = R.C;
  const l = loads(orders);
  const over = l.map((x) => x > C);
  const cur = orders.find((o) => o.id === sel) ?? null;
  const win = MONTHS.map((_, m) => !!cur && step === 1 && m >= cur.start && m <= cur.deadline);
  const bad = (t: string) => {
    setMistakes((x) => x + 1);
    setFb({ tone: "bad", text: t });
  };

  function onBlock(id: string) {
    if (step === 0) {
      setFb({ tone: "info", text: "Diagnose first: work out how overloaded the busiest month is. Then the orders can be moved." });
      return;
    }
    if (step > 1) return;
    setSel((s) => (s === id ? null : id));
    const o = orders.find((x) => x.id === id)!;
    setFb({ tone: "info", text: `Order ${o.id} (${o.name}, ${fmt(o.size)} hampers): arrives ${MONTHS[o.arrive]}, needs lead time, so packing can start ${MONTHS[o.start]} and must finish by ${MONTHS[o.deadline]}. Green months are allowed.` });
  }

  function onMonth(m: number) {
    if (step !== 1) return;
    if (!cur) {
      setFb({ tone: "info", text: "Pick an order first (tap its lettered block), then tap the month you want it packed in." });
      return;
    }
    if (m < cur.start) {
      bad(`Order ${cur.id} cannot be packed in ${MONTHS[m]}. It arrives in ${MONTHS[cur.arrive]} and its lead time (artwork, customisation, sign-off) means packing can start in ${MONTHS[cur.start]} at the earliest.`);
      return;
    }
    if (m > cur.deadline) {
      bad(`Order ${cur.id} must be delivered for its occasion by ${MONTHS[cur.deadline]}. Packing it in ${MONTHS[m]} would miss the deadline.`);
      return;
    }
    if (m === cur.month) return;
    const next = orders.map((o) => (o.id === cur.id ? { ...o, month: m } : o));
    setOrders(next);
    setMoves((x) => x + 1);
    const nl = loads(next);
    setFb({ tone: "info", text: `Order ${cur.id} moved to ${MONTHS[m]}. ${nl[m] > C ? `${MONTHS[m]} now carries more than the monthly packing capacity of ${fmt(C)}.` : `${MONTHS[m]} is within capacity.`} ${nl.some((x) => x > C) ? "Some month is still over its capacity line." : "No month is over capacity: you can lock the plan."}` });
  }

  function checkDiag() {
    const busy = l.indexOf(Math.max(...l));
    const pct = (l[busy] / C) * 100;
    const ex = l[busy] - C;
    const errs: string[] = [];
    if (Math.abs(num(a0.pct) - pct) > 1.1) errs.push(`Utilisation = load ÷ capacity × 100. Add the block sizes stacked on the tallest month and divide by ${fmt(C)}.`);
    if (num(a0.excess) !== ex) errs.push(`Hampers over capacity = that month's load minus ${fmt(C)}.`);
    if (errs.length) {
      bad(errs.join(" ") + " Block sizes are listed under the stage.");
      return;
    }
    setFb({ tone: "good", text: `${MONTHS[busy]} is at ${Math.round(pct)}% of capacity, ${fmt(ex)} hampers over. Rakhi and Diwali gifting pile up there. Now spread the orders: pick one, then tap an allowed month.` });
    setStep(1);
  }

  function lock() {
    const badMonths = MONTHS.filter((_, m) => l[m] > C);
    if (badMonths.length) {
      bad(`Not locked: ${badMonths.join(", ")} still ${badMonths.length > 1 ? "exceed" : "exceeds"} the packing capacity of ${fmt(C)} hampers a month. Move orders into earlier months inside their windows.`);
      return;
    }
    setSel(null);
    setFb({ tone: "good", text: "Plan locked: no month exceeds capacity and every order still meets its deadline. Now report each month's utilisation." });
    setStep(2);
  }

  function checkUtil() {
    const wrong = l.map((x, m) => !(Number.isFinite(num(util[m])) && util[m].trim() !== "" && Math.abs(num(util[m]) - (x / C) * 100) <= 1.1));
    setBadU(wrong);
    if (wrong.some(Boolean)) {
      const m = wrong.indexOf(true);
      bad(`${wrong.filter(Boolean).length} month(s) are off (outlined red). Utilisation = hampers packed that month ÷ ${fmt(C)} × 100. For ${MONTHS[m]}, add the sizes of the blocks standing on it.`);
      return;
    }
    const peak = l.indexOf(Math.max(...l));
    const stars = starsFor(mistakes);
    setDone(true);
    setStep(3);
    const busyMonths = l.filter((x) => x / C >= 0.5).length;
    setFb({ tone: "good", text: `Busiest month is now ${MONTHS[peak]} at ${Math.round((l[peak] / C) * 100)}%, and ${busyMonths} of 12 months run at 50% or more. ${stars} of 3 stars.` });
    onDone(`Year-Round Gifting Planner: moved ${moves} practice orders so no month passed the ${fmt(C)}-hamper packing capacity; busiest month ${MONTHS[peak]} at ${Math.round((l[peak] / C) * 100)}%, ${busyMonths} of 12 months at 50% or more. ${stars}/3 stars. (Practice orders)`);
  }

  function restart() {
    const r = makeRound();
    setR(r);
    setOrders(r.orders.map((o) => ({ ...o })));
    setStep(0);
    setSel(null);
    setMistakes(0);
    setMoves(0);
    setFb(null);
    setA0({ pct: "", excess: "" });
    setUtil(Array(12).fill(""));
    setBadU(Array(12).fill(false));
    setDone(false);
  }

  return (
    <GameFrame
      kicker="Activity 3 · Pillar 3"
      title="Year-Round Gifting Planner"
      mission="Practice corporate orders are stacked on their deadline months. Smooth the Rakhi and Diwali peaks into the quieter months without missing a deadline or the monthly packing capacity."
      steps={["Find the peak", "Smooth the plan", "Report utilisation"]}
      step={step}
      stars={done ? starsFor(mistakes) : undefined}
      onReset={restart}
      feedback={fb}
      note={{
        real: "The plan to expand year-round enterprise partnerships beyond seasonal peaks, with customized clean-label hampers as corporate wellness deliverables.",
        practice: `All orders, sizes, lead times, deadlines and the ${fmt(C)}-hamper monthly packing capacity are made up for this game and change when you restart.`,
        tip: "A hamper packed early can wait for its deadline. A hamper packed late cannot.",
      }}
    >
      <Stage3D
        label="A 3D calendar of twelve months, each a stack of coloured hamper-order blocks under a capacity line"
        height="clamp(380px, 56vh, 520px)"
        camera={{ position: [0, 6, 12], fov: 42 }}
        overlay={
          <>
          <div className="absolute left-2 top-2 flex flex-col gap-1.5 text-[0.82rem] font-bold">
            <span className="rounded-full bg-cocoa px-3 py-1 text-cream">Practice orders</span>
            <span className="rounded-full bg-white/95 px-3 py-1 text-cocoa shadow">Capacity line = {fmt(C)} hampers a month</span>
            <span className="flex gap-2 rounded-full bg-white/95 px-3 py-1 text-cocoa shadow">
              <span className="flex items-center gap-1"><i className="size-2.5 rounded-sm" style={{ background: COLOR.rakhi }} />Rakhi</span>
              <span className="flex items-center gap-1"><i className="size-2.5 rounded-sm" style={{ background: COLOR.diwali }} />Diwali</span>
              <span className="flex items-center gap-1"><i className="size-2.5 rounded-sm" style={{ background: COLOR.year }} />Year-round</span>
            </span>
          </div>
          <Labels
            store={store}
            items={[
              ...MONTHS.map((mn, m) => ({
                key: `m${m}`,
                node: (
                  <button data-month={m} onClick={() => onMonth(m)} aria-label={`Move the picked order to ${mn}`} className={`absolute -translate-x-1/2 rounded-md border px-1 text-[11px] font-bold leading-4 ${win[m] ? "border-success bg-success/20 text-cocoa" : "border-cocoa/25 bg-white/95 text-cocoa"}`}>
                    {mn}
                  </button>
                ),
              })),
              ...orders.map((o) => ({
                key: `o${o.id}`,
                node: (
                  <button data-order={o.id} onClick={() => onBlock(o.id)} aria-label={`Pick order ${o.id}, ${o.name}, ${o.size} hampers`} className={`absolute grid size-5 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full text-[11px] font-extrabold ${sel === o.id ? "bg-cocoa text-white ring-2 ring-white" : "bg-white/95 text-cocoa"}`}>
                    {o.id}
                  </button>
                ),
              })),
            ]}
          />
          </>
        }
      >
        <Scene store={store} C={C} orders={orders} sel={sel} onBlock={onBlock} onMonth={onMonth} win={win} over={over} />
      </Stage3D>

      <ul className="mt-3 grid gap-1.5 sm:grid-cols-2 lg:grid-cols-3" aria-label="The practice orders">
        {orders.map((o) => (
          <li key={o.id}>
            <button onClick={() => onBlock(o.id)} className={`flex w-full items-start gap-2 rounded-xl border-2 px-2.5 py-1.5 text-left text-[0.88rem] leading-snug ${sel === o.id ? "border-cocoa bg-haldi/40" : "border-cocoa/10 bg-white"}`}>
              <span className="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full text-[0.75rem] font-extrabold text-white" style={{ background: COLOR[o.kind] }}>{o.id}</span>
              <span className="min-w-0">
                <strong>{o.name}</strong>, {fmt(o.size)} hampers
                <span className="block text-cocoa-2">Pack {MONTHS[o.start]} to {MONTHS[o.deadline]} · now {MONTHS[o.month]}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-4 rounded-2xl bg-cream p-4">
        {step === 0 && (
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-[0.95rem] font-bold text-cocoa">
            <p className="basis-full text-[1rem] font-normal">Find the busiest month (the tallest stack). Add up the blocks stacked on it.</p>
            <label className="flex items-center gap-2">Utilisation {<NumIn value={a0.pct} onChange={(v) => setA0((s) => ({ ...s, pct: v }))} label="Utilisation of the busiest month in percent" unit="%" w="w-24" />}</label>
            <label className="flex items-center gap-2">Over capacity by {<NumIn value={a0.excess} onChange={(v) => setA0((s) => ({ ...s, excess: v }))} label="Hampers over capacity in the busiest month" unit="hampers" w="w-24" />}</label>
            <button onClick={checkDiag} className="eb-btn eb-btn-primary !py-2 !text-[0.9rem]">Check</button>
          </div>
        )}
        {step === 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[1rem] text-cocoa">Pick an order, then a green month. The plan locks only when no month is over its capacity line. Moves so far: <strong>{moves}</strong>.</p>
            <button onClick={lock} className="eb-btn eb-btn-primary !py-2 !text-[0.9rem]">Lock the plan</button>
          </div>
        )}
        {step >= 2 && (
          <div className="grid gap-3">
            <p className="text-[1rem] text-cocoa">{step === 2 ? "Type each month's utilisation: hampers packed ÷ capacity × 100 (use 0 for an empty month)." : "Plan reported. Restart for a new set of orders."}</p>
            <div className="grid grid-cols-3 gap-2 sm:grid-cols-6 lg:grid-cols-12">
              {MONTHS.map((m, i) => (
                <label key={m} className="flex flex-col items-center gap-1 text-[0.85rem] font-bold text-cocoa">
                  {m}
                  <NumIn value={util[i]} onChange={(v) => setUtil((u) => u.map((x, j) => (j === i ? v : x)))} label={`Utilisation in ${m} in percent`} disabled={step > 2} w="w-full min-w-0" bad={badU[i]} />
                </label>
              ))}
            </div>
            {step === 2 && (
              <div>
                <button onClick={checkUtil} className="eb-btn eb-btn-primary !py-2 !text-[0.9rem]">Check all months</button>
              </div>
            )}
          </div>
        )}
      </div>
    </GameFrame>
  );
}
