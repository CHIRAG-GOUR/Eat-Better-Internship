"use client";

import { useMemo, useRef, useState } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Group, Shape, ExtrudeGeometry } from "three";
import { GameFrame, starsFor, type Feedback } from "@/components/play/GameFrame";
import { Stage3D } from "@/components/play/Stage3D";
import { FitCamera, Labels, NumIn, ProbeHook, Projector, createProjStore, fmt, num, pick, rint, type ProjStore } from "./shared";

/**
 * Activity 1 · Expansion Command (Pillar 2: Quick-Commerce Acceleration).
 * Research basis: facility-location / coverage games used in operations classes (place a limited number of depots to cover
 * demand under a budget, the "maximal covering location" idea) and the supply-chain "beer game" habit of making students
 * compute their own results rather than read them off a dashboard.
 * The student reads a practice demand forecast on a 3D map of India, places dark-store pins in Tier-1 and Tier-2 cities
 * within a practice budget, then TYPES the orders served per day, the spend and the Tier-2 share. Nothing is multiple choice,
 * the live total is never shown, and a second store in a city that already has enough capacity is flagged as wasted spend.
 */

type City = { id: string; name: string; tier: 1 | 2; lon: number; lat: number; a: "r" | "l" | "t" | "b" };
const CITIES: City[] = [
  { id: "del", name: "Delhi", tier: 1, lon: 77.2, lat: 28.6, a: "t" },
  { id: "mum", name: "Mumbai", tier: 1, lon: 72.9, lat: 19.1, a: "l" },
  { id: "blr", name: "Bengaluru", tier: 1, lon: 77.6, lat: 12.97, a: "r" },
  { id: "che", name: "Chennai", tier: 1, lon: 80.3, lat: 13.1, a: "r" },
  { id: "kol", name: "Kolkata", tier: 1, lon: 88.4, lat: 22.6, a: "r" },
  { id: "hyd", name: "Hyderabad", tier: 1, lon: 78.5, lat: 17.4, a: "r" },
  { id: "jai", name: "Jaipur", tier: 2, lon: 75.8, lat: 26.9, a: "l" },
  { id: "luc", name: "Lucknow", tier: 2, lon: 80.9, lat: 26.8, a: "r" },
  { id: "ind", name: "Indore", tier: 2, lon: 75.9, lat: 22.7, a: "l" },
  { id: "koc", name: "Kochi", tier: 2, lon: 76.3, lat: 9.9, a: "l" },
  { id: "bhu", name: "Bhubaneswar", tier: 2, lon: 85.8, lat: 20.3, a: "b" },
  { id: "pat", name: "Patna", tier: 2, lon: 85.1, lat: 25.6, a: "r" },
];

/** A rough, stylised outline of India (lon, lat). Not a survey map. */
const OUTLINE: [number, number][] = [[74.3, 37], [77.8, 35.5], [79, 34.3], [78.9, 32.5], [80.2, 30.8], [81, 30.2], [80.1, 28.8], [81.9, 27.9], [84, 27.3], [87, 26.5], [88.1, 27.9], [88.9, 27.3], [89.8, 26.8], [92, 26.9], [94.5, 28.1], [96.2, 29.2], [97.3, 28], [96, 27], [95, 25.5], [94.6, 24], [93.4, 22.9], [92.5, 22], [92.2, 23.8], [91.6, 24.2], [90.4, 25.1], [89.1, 26], [88.9, 25.2], [89, 22.2], [87, 21.5], [86.8, 20.2], [85, 19.4], [83, 17.4], [81.3, 16], [80.3, 15.2], [80.2, 13.4], [79.8, 11], [79.2, 10.3], [78.2, 8.9], [77.5, 8.1], [76.5, 8.8], [75.7, 11.5], [74.8, 13], [74, 15], [73.4, 17.5], [72.8, 19.5], [72.8, 21], [72, 21.2], [70.8, 20.7], [69, 22.3], [70, 23], [68.2, 23.7], [70.5, 24.3], [71, 25.6], [70, 26.8], [70.6, 28], [72, 29.5], [73.5, 31], [74.6, 32.4], [74, 33.5], [73.8, 35]];
const S = 0.24;
const px = (lon: number) => (lon - 82) * S;
const pz = (lat: number) => -(lat - 22) * S;

type Round = { cap: number; c1: number; c2: number; budget: number; demand: Record<string, number>; target: number; best: number };

function makeRound(): Round {
  const cap = pick([400, 500, 600]);
  const c1 = pick([8, 9, 10]);
  const c2 = pick([4, 5, 6]);
  const demand: Record<string, number> = {};
  for (const c of CITIES) demand[c.id] = c.tier === 1 ? rint(50, 110) * 10 : rint(15, 55) * 10;
  const budget = c1 * 3 + c2 * 4 + rint(0, 3);
  // best achievable served total within the budget (each city: 0, 1 or 2 stores) by exhaustive search
  let best = 0;
  const go = (i: number, spent: number, served: number) => {
    if (i === CITIES.length) {
      if (served > best) best = served;
      return;
    }
    const c = CITIES[i];
    const cost = c.tier === 1 ? c1 : c2;
    for (let n = 0; n <= 2; n++) {
      const s = spent + n * cost;
      if (s > budget) break;
      go(i + 1, s, served + Math.min(demand[c.id], n * cap));
    }
  };
  go(0, 0, 0);
  const target = Math.floor((best * 0.85) / 10) * 10;
  return { cap, c1, c2, budget, demand, target, best };
}

const outlineGeo = (() => {
  const sh = new Shape();
  OUTLINE.forEach(([lo, la], i) => (i ? sh.lineTo(px(lo), -pz(la)) : sh.moveTo(px(lo), -pz(la))));
  return new ExtrudeGeometry(sh, { depth: 0.12, bevelEnabled: false });
})();

function Marker({ c, R, n, onTap }: { c: City; R: Round; n: number; onTap: () => void }) {
  const ring = useRef<Group>(null);
  const d = R.demand[c.id];
  const frac = Math.min(1, (n * R.cap) / d);
  const h = (d / 1000) * 1.5;
  const t1 = c.tier === 1;
  useFrame((_, dt) => {
    if (!ring.current) return;
    const target = n > 0 ? 1 : 0.01;
    const k = 1 - Math.pow(0.0005, dt);
    ring.current.scale.x += (target - ring.current.scale.x) * k;
    ring.current.scale.y = ring.current.scale.x;
    ring.current.scale.z = ring.current.scale.x;
  });
  return (
    <group position={[px(c.lon), 0.12, pz(c.lat)]}>
      <mesh onClick={(e) => { e.stopPropagation(); onTap(); }} position={[0, 0.02, 0]}>
        <cylinderGeometry args={[0.26, 0.26, 0.06, 20]} />
        <meshStandardMaterial color={n ? "#2f9e5b" : t1 ? "#FF5C00" : "#F2C200"} />
      </mesh>
      <mesh position={[-0.2, h / 2 + 0.05, 0]} onClick={(e) => { e.stopPropagation(); onTap(); }}>
        <boxGeometry args={[0.13, h, 0.13]} />
        <meshStandardMaterial color={t1 ? "#FF5C00" : "#E0A800"} />
      </mesh>
      {Array.from({ length: n }).map((_, i) => (
        <group key={i} position={[0.05 + i * 0.17, 0.05, 0]}>
          <mesh position={[0, 0.17, 0]}>
            <boxGeometry args={[0.15, 0.2, 0.15]} />
            <meshStandardMaterial color="#2f1c1a" />
          </mesh>
          <mesh position={[0, 0.33, 0]} rotation={[0, 0.8, 0]}>
            <coneGeometry args={[0.13, 0.16, 4]} />
            <meshStandardMaterial color="#2f9e5b" emissive="#2f9e5b" emissiveIntensity={0.5} />
          </mesh>
        </group>
      ))}
      <group ref={ring} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]} scale={0.01}>
        <mesh>
          <ringGeometry args={[0.52, 0.6, 40]} />
          <meshBasicMaterial color="#2f1c1a" transparent opacity={0.18} />
        </mesh>
        <mesh position={[0, 0, 0.005]}>
          <ringGeometry args={[0.52, 0.6, 40, 1, 0, Math.PI * 2 * Math.max(0.02, frac)]} />
          <meshBasicMaterial color={frac >= 1 ? "#2f9e5b" : "#FF9F1C"} />
        </mesh>
        <mesh position={[0, 0, 0.002]}>
          <circleGeometry args={[0.52, 32]} />
          <meshBasicMaterial color={frac >= 1 ? "#2f9e5b" : "#FF9F1C"} transparent opacity={0.16} />
        </mesh>
      </group>
    </group>
  );
}

function Scene({ R, stores, tap, store }: { R: Round; stores: Record<string, number>; tap: (c: City) => void; store: ProjStore }) {
  const points = useMemo(() => Object.fromEntries(CITIES.map((c) => [c.id, [px(c.lon), 0.15, pz(c.lat)] as [number, number, number]])), []);
  const narrow = useThree((st) => st.size.width / st.size.height) < 0.9;
  const labelPts = useMemo(() => Object.fromEntries(CITIES.map((c) => [c.id, [px(c.lon), 0.14, pz(c.lat)] as [number, number, number]])), []);
  return (
    <>
      <FitCamera w={7.9} h={7.9} tilt={narrow ? 0.12 : 0.55} pad={1.0} />
      <ProbeHook name="ec" points={points} />
      <Projector store={store} points={labelPts} />
      <ambientLight intensity={1.05} />
      <directionalLight position={[3, 8, 4]} intensity={1.3} />
      <group rotation={[-Math.PI / 2, 0, 0]} scale={[1.025, 1.025, 0.8]} position={[0, -0.01, 0]}>
        <mesh geometry={outlineGeo}>
          <meshStandardMaterial color="#c99a6a" />
        </mesh>
      </group>
      <group rotation={[-Math.PI / 2, 0, 0]}>
        <mesh geometry={outlineGeo}>
          <meshStandardMaterial color="#F7DDBE" />
        </mesh>
      </group>
      {CITIES.map((c) => (
        <Marker key={c.id} c={c} R={R} n={stores[c.id] ?? 0} onTap={() => tap(c)} />
      ))}
    </>
  );
}

const servedOf = (R: Round, stores: Record<string, number>) => CITIES.reduce((s, c) => s + Math.min(R.demand[c.id], (stores[c.id] ?? 0) * R.cap), 0);
const spendOf = (R: Round, stores: Record<string, number>) => CITIES.reduce((s, c) => s + (stores[c.id] ?? 0) * (c.tier === 1 ? R.c1 : R.c2), 0);

export default function ExpansionCommand({ onDone }: { onDone: (summary: string) => void }) {
  const [R, setR] = useState(makeRound);
  const [stores, setStores] = useState<Record<string, number>>({});
  const [step, setStep] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [fb, setFb] = useState<Feedback>(null);
  const [a, setA] = useState({ t1: "", t2: "", served: "", spend: "", share: "" });
  const [done, setDone] = useState(false);
  const [store] = useState(createProjStore);

  const spent = spendOf(R, stores);
  const nStores = Object.values(stores).reduce((s, n) => s + n, 0);
  const bad = (m: number, t: string) => {
    setMistakes((x) => x + m);
    setFb({ tone: "bad", text: t });
  };

  function tap(c: City) {
    if (step !== 1) {
      setFb({ tone: "info", text: step === 0 ? "Read the forecast first: the map unlocks once you have added up the demand." : "The network is locked. Use Restart to try a new forecast." });
      return;
    }
    const n = stores[c.id] ?? 0;
    const cost = c.tier === 1 ? R.c1 : R.c2;
    if (n === 2) {
      setStores((s) => ({ ...s, [c.id]: 0 }));
      setFb({ tone: "info", text: `Removed both dark stores in ${c.name}. ₹${2 * cost} lakh back in the budget.` });
      return;
    }
    if (spent + cost > R.budget) {
      bad(1, `A Tier-${c.tier} dark store costs ₹${cost} lakh and you have ₹${R.budget - spent} lakh left of ₹${R.budget} lakh. Remove a store somewhere that is serving less, then try again.`);
      return;
    }
    setStores((s) => ({ ...s, [c.id]: n + 1 }));
    const d = R.demand[c.id];
    setFb({ tone: "info", text: `${c.name}: forecast ${d}, one store handles up to ${R.cap}. ${d > R.cap * (n + 1) ? "Some demand is still unserved there, so the ring is only part-filled." : "The ring is full: all of its forecast demand is covered."}` });
  }

  function submit() {
    const served = servedOf(R, stores);
    const wasted = CITIES.find((c) => (stores[c.id] ?? 0) === 2 && R.demand[c.id] <= R.cap);
    if (wasted) {
      bad(1, `${wasted.name} forecasts only ${R.demand[wasted.id]} orders a day and one store already handles ${R.cap}. The second store adds no orders and wastes ₹${wasted.tier === 1 ? R.c1 : R.c2} lakh. Remove it.`);
      return;
    }
    if (served < R.target) {
      const gap = CITIES.filter((c) => R.demand[c.id] > (stores[c.id] ?? 0) * R.cap)
        .map((c) => ({ c, un: R.demand[c.id] - Math.min(R.demand[c.id], (stores[c.id] ?? 0) * R.cap), cost: c.tier === 1 ? R.c1 : R.c2 }))
        .sort((x, y) => y.un / y.cost - x.un / x.cost)[0];
      bad(1, `Your network is below the practice target of ${fmt(R.target)} orders a day. Look for demand per lakh rupees: ${gap ? `${gap.c.name} still has ${gap.un} orders a day unserved and a store there costs ₹${gap.cost} lakh.` : "re-check where your stores sit."}`);
      return;
    }
    setFb({ tone: "good", text: `The network meets the practice target of ${fmt(R.target)} orders a day within budget. Now prove the numbers: work out what it serves and spends.` });
    setStep(2);
  }

  function checkSums() {
    const t1 = CITIES.filter((c) => c.tier === 1).reduce((s, c) => s + R.demand[c.id], 0);
    const t2 = CITIES.filter((c) => c.tier === 2).reduce((s, c) => s + R.demand[c.id], 0);
    if (num(a.t1) !== t1 || num(a.t2) !== t2) {
      bad(1, `Add the numbers printed on the map. Tier-1 cities (orange bars): ${CITIES.filter((c) => c.tier === 1).map((c) => R.demand[c.id]).join(" + ")}. Tier-2 (yellow bars): ${CITIES.filter((c) => c.tier === 2).map((c) => R.demand[c.id]).join(" + ")}.`);
      return;
    }
    setFb({ tone: "good", text: `Forecast total is ${fmt(t1 + t2)} orders a day (Tier-1 ${fmt(t1)}, Tier-2 ${fmt(t2)}). Your budget is ₹${R.budget} lakh and one store handles ${R.cap} orders a day. Place dark stores on the map.` });
    setStep(1);
  }

  function checkServed() {
    const served = servedOf(R, stores);
    const spend = spendOf(R, stores);
    if (num(a.served) !== served || num(a.spend) !== spend) {
      const parts = CITIES.filter((c) => (stores[c.id] ?? 0) > 0).map((c) => `${c.name}: smaller of ${R.demand[c.id]} and ${(stores[c.id] ?? 0)} × ${R.cap} = ${Math.min(R.demand[c.id], (stores[c.id] ?? 0) * R.cap)}`);
      bad(1, `Method: for each city, orders served = the smaller of forecast demand and (stores × ${R.cap}). Spend = Tier-1 stores × ₹${R.c1} lakh + Tier-2 stores × ₹${R.c2} lakh. ${num(a.served) !== served ? "Served is off. " : ""}${num(a.spend) !== spend ? "Spend is off. " : ""}Your cities: ${parts.join("; ")}.`);
      return;
    }
    setFb({ tone: "good", text: `${fmt(served)} orders a day served for ₹${spend} lakh. Last check: how much of that comes from Tier-2 cities?` });
    setStep(3);
  }

  function checkShare() {
    const served = servedOf(R, stores);
    const t2 = CITIES.filter((c) => c.tier === 2).reduce((s, c) => s + Math.min(R.demand[c.id], (stores[c.id] ?? 0) * R.cap), 0);
    const share = (t2 / served) * 100;
    if (!Number.isFinite(num(a.share)) || Math.abs(num(a.share) - share) > 1.1) {
      bad(1, `Add up only the orders served in the yellow Tier-2 cities (${fmt(t2)}), divide by the total served (${fmt(served)}) and multiply by 100. Round to the nearest whole number.`);
      return;
    }
    const stars = starsFor(mistakes);
    setDone(true);
    setStep(4);
    setFb({ tone: "good", text: `Tier-2 cities bring ${Math.round(share)}% of the orders served. In this practice round a Tier-2 store costs ₹${R.c2} lakh against ₹${R.c1} lakh in Tier-1, which is why the plan names both. ${stars} of 3 stars.` });
    onDone(`Expansion Command: ${nStores} dark stores serving ${fmt(served)} orders a day for ₹${spendOf(R, stores)} lakh of a ₹${R.budget} lakh practice budget; Tier-2 cities gave about ${Math.round(share)}% of orders served. ${stars}/3 stars. (Practice data)`);
  }

  function restart() {
    setR(makeRound());
    setStores({});
    setStep(0);
    setMistakes(0);
    setFb(null);
    setA({ t1: "", t2: "", served: "", spend: "", share: "" });
    setDone(false);
  }

  const T = (k: keyof typeof a, label: string, unit?: string) => <NumIn value={a[k]} onChange={(v) => setA((s) => ({ ...s, [k]: v }))} label={label} unit={unit} disabled={step > (k === "t1" || k === "t2" ? 0 : k === "share" ? 3 : 2)} />;

  return (
    <GameFrame
      kicker="Activity 1 · Pillar 2"
      title="Expansion Command"
      mission="Place dark stores on the map of India so the network serves the practice forecast, without spending more than your budget."
      steps={["Read the forecast", "Place stores", "Count orders and spend", "Tier-2 share"]}
      step={step}
      stars={done ? starsFor(mistakes) : undefined}
      onReset={restart}
      feedback={fb}
      note={{
        real: "The plan to deepen dark-store networks in Tier-1 and Tier-2 cities to turn high-intent, instant-snacking demand into repeat volume.",
        practice: "The forecast, the store capacity, the store costs and the budget are all made up for this game and change each time you restart. The map is a stylised outline.",
        tip: "Compare how many orders each lakh rupees buys in a Tier-1 city and in a Tier-2 city.",
      }}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2 text-[0.85rem] font-bold">
        <span className="rounded-full bg-cocoa px-3 py-1 text-cream">Practice data</span>
        <span className="rounded-full bg-cream px-3 py-1 text-cocoa">Budget left ₹{R.budget - spent} lakh of ₹{R.budget}</span>
        <span className="rounded-full bg-cream px-3 py-1 text-cocoa">Dark stores {nStores}</span>
        <span className="flex items-center gap-1.5 text-cocoa"><i className="size-3 rounded-sm bg-orange" /> Tier-1 demand</span>
        <span className="flex items-center gap-1.5 text-cocoa"><i className="size-3 rounded-sm bg-[#E0A800]" /> Tier-2 demand</span>
        <span className="flex items-center gap-1.5 text-cocoa"><i className="size-3 rounded-full bg-success" /> Dark store</span>
      </div>
      <Stage3D
        label="A stylised 3D map of India with Tier-1 and Tier-2 cities showing forecast demand bars and dark-store pins"
        height="clamp(420px, 66vh, 620px)"
        overlay={
          <>
            <Labels
              store={store}
              items={CITIES.map((c) => {
                const n = stores[c.id] ?? 0;
                const off: Record<City["a"], string> = { r: "translate(12px,-50%)", l: "translate(calc(-100% - 12px),-50%)", t: "translate(-50%,calc(-100% - 12px))", b: "translate(-50%,12px)" };
                return {
                  key: c.id,
                  node: (
                    <button
                      data-city={c.id}
                      onClick={() => tap(c)}
                      aria-label={`${c.name}, Tier-${c.tier}, forecast ${R.demand[c.id]} orders per day, ${n} dark stores`}
                      style={{ transform: off[c.a] }}
                      className={`absolute left-0 top-0 whitespace-nowrap rounded-lg border px-1.5 py-0.5 text-left leading-none shadow-sm ${n ? "border-success bg-white" : "border-cocoa/30 bg-white/95"}`}
                    >
                      <span className="block text-[10px] font-bold text-cocoa sm:text-[11px]">{c.name}</span>
                      <span className="block text-[12px] font-extrabold tabular-nums text-cocoa sm:text-[13px]">
                        {R.demand[c.id]}
                        {n > 0 && <span className="ml-1 text-[11px] text-success">{n === 1 ? "x1" : "x2"}</span>}
                      </span>
                    </button>
                  ),
                };
              })}
            />
            {step === 1 && <div className="absolute inset-x-2 bottom-2 rounded-xl bg-cocoa/90 px-3 py-2 text-center text-[0.88rem] font-bold text-cream">Tap a city to add a dark store. A second tap adds a second store; a third removes both.</div>}
          </>
        }
      >
        <Scene R={R} stores={stores} tap={tap} store={store} />
      </Stage3D>

      <div className="mt-4 rounded-2xl bg-cream p-4">
        {step === 0 && (
          <div className="grid gap-3">
            <p className="text-[1rem] text-cocoa">Each city shows its <strong>forecast orders per day</strong>. Add them up by tier. One dark store handles up to <strong>{R.cap}</strong> orders a day; a Tier-1 store costs <strong>₹{R.c1} lakh</strong>, a Tier-2 store <strong>₹{R.c2} lakh</strong>; budget <strong>₹{R.budget} lakh</strong>.</p>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-[0.95rem] font-bold text-cocoa">Tier-1 total {T("t1", "Tier-1 total forecast orders per day", "orders/day")}</label>
              <label className="flex items-center gap-2 text-[0.95rem] font-bold text-cocoa">Tier-2 total {T("t2", "Tier-2 total forecast orders per day", "orders/day")}</label>
              <button onClick={checkSums} className="eb-btn eb-btn-primary !py-2 !text-[0.9rem]">Check my totals</button>
            </div>
          </div>
        )}
        {step === 1 && (
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-[1rem] text-cocoa">Practice target: serve at least <strong>{fmt(R.target)}</strong> orders a day. The map will not tell you the total, so keep your own count.</p>
            <button onClick={submit} disabled={nStores === 0} className="eb-btn eb-btn-primary !py-2 !text-[0.9rem] disabled:opacity-40">Submit network for review</button>
          </div>
        )}
        {step === 2 && (
          <div className="grid gap-3">
            <p className="text-[1rem] text-cocoa">Work out your own network&apos;s results from the stores you placed.</p>
            <div className="flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-[0.95rem] font-bold text-cocoa">Orders served {T("served", "Orders served per day", "per day")}</label>
              <label className="flex items-center gap-2 text-[0.95rem] font-bold text-cocoa">Spend {T("spend", "Total spend in lakh rupees", "₹ lakh")}</label>
              <button onClick={checkServed} className="eb-btn eb-btn-primary !py-2 !text-[0.9rem]">Check</button>
            </div>
          </div>
        )}
        {step === 3 && (
          <div className="flex flex-wrap items-center gap-4">
            <label className="flex items-center gap-2 text-[0.95rem] font-bold text-cocoa">Share of orders served that come from Tier-2 cities {T("share", "Tier-2 share of orders served in percent", "%")}</label>
            <button onClick={checkShare} className="eb-btn eb-btn-primary !py-2 !text-[0.9rem]">Check</button>
          </div>
        )}
        {step === 4 && <p className="text-[1rem] font-bold text-success">Network locked. Restart for a new forecast and budget.</p>}
      </div>
    </GameFrame>
  );
}
