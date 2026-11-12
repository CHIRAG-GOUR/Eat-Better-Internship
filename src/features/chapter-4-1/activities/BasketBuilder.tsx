"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Check, Minus, Timer } from "lucide-react";
import { Stage3D } from "@/components/play/Stage3D";
import { CheckRow, GameFrame, starsFor, type Feedback } from "@/components/play/GameFrame";
import { Human, type HumanLook } from "@/components/world2/Human";
import { SKUS } from "../content";
import { FitCam, Label, makeFace, Mover, NumIn, num, PackBox, pick, Probe, rint, shuffle, words } from "./shared";

/**
 * Basket Builder / AOV Rush: a timed 3D checkout shift. Practice shoppers arrive with part-filled baskets; add combos
 * and trial packs to pass the free-shipping threshold without breaking the shopper's budget, then read the shift
 * receipt to compute AOV and explain why multi-packs lower price per gram but raise AOV.
 */

type Item = { id: string; name: string; price: number; real: boolean; src?: string; lines?: string[]; bg?: string };
type Shopper = { name: string; b0: number; n0: number; budget: number; look: HumanLook };
type Sale = { name: string; total: number; ok: boolean; why: string };

const SHIFT = 80;
const SHOPPERS = 6;
const NEED_SALES = 4;
const NAMES = ["Asha", "Rohan", "Meera", "Kabir", "Isha", "Dev", "Naina", "Arjun", "Tara", "Vikram"];
const LOOKS: HumanLook[] = [
  { skin: "#C68642", hair: "#1b1b1b", hairStyle: "long", outfit: "kurta", top: "#d9534f", bottom: "#2f3e55", accent: "#f2c94c", shoe: "#3a2a22", bindi: true },
  { skin: "#8D5524", hair: "#111", hairStyle: "short", outfit: "shirt", top: "#4a7fb5", bottom: "#33363d", shoe: "#222", facial: "stubble" },
  { skin: "#E0AC69", hair: "#2a1a10", hairStyle: "bun", outfit: "tshirt", top: "#2e9e6a", bottom: "#243b55", shoe: "#fff" },
  { skin: "#A86B3C", hair: "#1a120c", hairStyle: "curly", outfit: "hoodie", top: "#8b5cf6", bottom: "#2c2c34", shoe: "#ddd", glasses: "#222" },
  { skin: "#C68642", hair: "#222", hairStyle: "braid", outfit: "salwar", top: "#e9a23b", bottom: "#e9a23b", accent: "#b23a48", shoe: "#5a3a2a" },
  { skin: "#8D5524", hair: "#151515", hairStyle: "side", outfit: "kurta", top: "#f4f0e6", bottom: "#4b4b55", shoe: "#3a2a22", facial: "beard" },
];

function makeItems(): Item[] {
  const real: Item[] = [SKUS[3], SKUS[0], SKUS[1], SKUS[2]].map((s) => ({ id: s.id, name: s.short, price: s.price, real: true, src: s.tex }));
  const prices = shuffle([39, 49, 59, 69, 79, 89, 99]).slice(0, 3).sort((a, b) => a - b);
  const bgs = ["#B7E4C7", "#BDE0FE", "#FFD6A5"];
  const trials: Item[] = prices.map((p, i) => ({ id: `t${i}`, name: `Trial pack ${"ABC"[i]}`, price: p, real: false, lines: ["Trial", `pack ${"ABC"[i]}`], bg: bgs[i] }));
  return [...trials, ...real];
}

function makeShoppers(items: Item[], T: number): Shopper[] {
  const names = shuffle(NAMES);
  const looks = shuffle(LOOKS);
  const out: Shopper[] = [];
  let guard = 0;
  while (out.length < SHOPPERS && guard++ < 1000) {
    const pool = items.filter((i) => i.price <= T - 70);
    const k = Math.random() < 0.55 ? 1 : 2;
    const chosen = Array.from({ length: k }, () => pick(pool));
    const S = chosen.reduce((a, c) => a + c.price, 0);
    const delta = rint(5, 50);
    const b0 = T - S + delta;
    if (b0 < 60 || b0 > T - 20) continue;
    out.push({ name: names[out.length], b0, n0: rint(2, 4), budget: T + delta + rint(0, 35), look: looks[out.length] });
  }
  return out;
}

function genGame() {
  const items = makeItems();
  const T = pick([499, 599]);
  return { T, items, shoppers: makeShoppers(items, T) };
}

function ItemFace({ it }: { it: Item }) {
  const face = useMemo(() => makeFace(it.lines ?? [], it.bg ?? "#fff", "#2f1c1a", "PRACTICE"), [it]);
  return <PackBox face={face} size={[0.8, 0.9, 0.4]} />;
}
const Pack = ({ it, s = 1 }: { it: Item; s?: number }) => (
  <group scale={s}>{it.real ? <PackBox src={it.src} size={[0.8, 0.9, 0.4]} /> : <ItemFace it={it} />}</group>
);

function Actor({ sh, phase, onArrived }: { sh: Shopper; phase: "in" | "stay" | "out"; onArrived: () => void }) {
  const g = useRef<THREE.Group>(null);
  const [walking, setWalking] = useState(true);
  const arrived = useRef(false);
  useFrame((_, dt) => {
    const o = g.current;
    if (!o) return;
    const target = phase === "out" ? -7 : 0.2;
    const dx = target - o.position.x;
    const step = Math.sign(dx) * Math.min(Math.abs(dx), dt * 3.2);
    o.position.x += step;
    const moving = Math.abs(dx) > 0.05;
    if (moving !== walking) setWalking(moving);
    if (!moving && phase === "in" && !arrived.current) {
      arrived.current = true;
      onArrived();
    }
  });
  return (
    <group ref={g} position={[7, -0.62, -0.3]}>
      <group rotation={[0, phase === "out" ? -0.5 : 0, 0]}>
        <Human look={sh.look} mode={walking ? "walk" : "stand"} speed={1.2} />
      </group>
    </group>
  );
}

type SceneProps = { items: Item[]; basket: string[]; shopper: Shopper | null; phase: "in" | "stay" | "out"; actorKey: number; total: number; onItem: (id: string) => void; onTill: () => void; onBasket: () => void; onArrived: () => void };

function Scene({ items, basket, shopper, phase, actorKey, total, onItem, onTill, onBasket, onArrived }: SceneProps) {
  const { size } = useThree();
  const wide = size.width / size.height > 1.35;
  const pos = (i: number): [number, number, number] => (wide ? [(i - 3) * 1.15, -1.7, 0.6] : [(i % 4 - 1.5) * 1.15, -1.55 - Math.floor(i / 4) * 1.15, 0.6]);
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));
  return (
    <>
      {wide ? <FitCam width={9.0} height={5.2} cy={-0.1} /> : <FitCam width={5.0} height={7.4} cy={-0.1} />}
      <ambientLight intensity={1.05} />
      <directionalLight position={[3, 6, 6]} intensity={1.4} />
      <mesh position={[0, 0, -1]}>
        <planeGeometry args={[16, 12]} />
        <meshStandardMaterial color="#F6E3CF" />
      </mesh>
      {/* counter + display */}
      <mesh position={[0, -0.12, 0.6]}>
        <boxGeometry args={[wide ? 9.6 : 5.0, 0.8, 1.3]} />
        <meshStandardMaterial color="#6b3f2a" roughness={0.8} />
      </mesh>
      <mesh position={[0, wide ? -2.25 : -2.5, 0.5]}>
        <boxGeometry args={[wide ? 9.6 : 5.0, wide ? 0.4 : 2.2, 1.1]} />
        <meshStandardMaterial color="#b9774a" roughness={0.8} />
      </mesh>
      {/* till */}
      <group position={[-1.5, 0.52, 0.8]} onClick={(e) => { e.stopPropagation(); onTill(); }} onPointerOver={() => (document.body.style.cursor = "pointer")} onPointerOut={() => (document.body.style.cursor = "")}>
        <mesh>
          <boxGeometry args={[1.1, 0.5, 0.7]} />
          <meshStandardMaterial color="#2f1c1a" />
        </mesh>
        <mesh position={[0, 0.42, -0.1]} rotation={[-0.3, 0, 0]}>
          <boxGeometry args={[0.9, 0.4, 0.08]} />
          <meshStandardMaterial color="#0e2a16" />
        </mesh>
        <Label position={[0, 0.95, 0]} text="Tap: ring up" bg="#FF5C00" fg="#fff" border="none" h={0.2} />
      </group>
      {/* basket */}
      <group position={[1.4, 0.5, 0.8]} onClick={(e) => { e.stopPropagation(); onBasket(); }}>
        <mesh>
          <boxGeometry args={[1.7, 0.36, 0.8]} />
          <meshStandardMaterial color="#d8a15f" roughness={0.9} />
        </mesh>
        {basket.slice(0, 6).map((id, i) => (
          <group key={`${id}-${i}`} position={[-0.62 + i * 0.25, 0.5, 0.05]}>
            <Suspense fallback={null}>
              <Pack it={byId[id]} s={0.42} />
            </Suspense>
          </group>
        ))}
        <Label position={[0, 1.2, 0]} text={`Basket ₹${total}`} bg="#FED300" h={0.3} />
      </group>
      {shopper && (
        <group key={actorKey}>
          <Actor sh={shopper} phase={phase} onArrived={onArrived} />
          {phase !== "out" && (
            <Label position={[0.2, 1.95, -0.3]} text={`${shopper.name}
budget ₹${shopper.budget}`} h={0.22} />
          )}
        </group>
      )}
      {items.map((it, i) => (
        <Mover key={it.id} target={pos(i)} onClick={() => onItem(it.id)}>
          <Suspense fallback={null}>
            <Pack it={it} />
          </Suspense>
          <Label position={[0, -0.66, 0.3]} text={`₹${it.price}`} h={0.22} border="#b9a58f" />
        </Mover>
      ))}
      <Probe name="basket" points={() => ({ till: [-1.5, 0.7, 0.8], ...Object.fromEntries(items.map((it, i) => [it.id, pos(i)])) })} />
    </>
  );
}

const fmt = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

export default function BasketBuilder({ onDone }: { onDone: (summary: string) => void }) {
  const [game, setGame] = useState(genGame);
  const { T, items, shoppers } = game;
  const [step, setStep] = useState(0);
  const [phase, setPhase] = useState<"ready" | "shift" | "receipt">("ready");
  const [idx, setIdx] = useState(0);
  const [actor, setActor] = useState<"in" | "stay" | "out">("in");
  const [arrived, setArrived] = useState(false);
  const [basket, setBasket] = useState<string[]>([]);
  const [t, setT2] = useState(SHIFT);
  const [sales, setSales] = useState<Sale[]>([]);
  const [mist, setMist] = useState(0);
  const [fb, setFb] = useState<Feedback>({ tone: "info", text: "Press Open the shop. Shoppers arrive one at a time: add items from the shelf to their basket so it clears the free-shipping line without passing their budget." });
  const [revIn, setRevIn] = useState("");
  const [ordIn, setOrdIn] = useState("");
  const [aovIn, setAovIn] = useState("");
  const [line, setLine] = useState("");
  const [done, setDone] = useState(false);
  const busy = useRef(false);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const later = (fn: () => void, ms: number) => timers.current.push(setTimeout(fn, ms));
  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const byId = useMemo(() => Object.fromEntries(items.map((i) => [i.id, i])), [items]);
  const sh = phase === "shift" ? shoppers[idx] ?? null : null;
  const addTotal = basket.reduce((a, id) => a + byId[id].price, 0);
  const total = sh ? sh.b0 + addTotal : 0;

  const bad = (text: string) => {
    setMist((m) => m + 1);
    setFb({ tone: "bad", text });
  };

  const endShift = (list: Sale[]) => {
    setActor("out");
    later(() => {
      setPhase("receipt");
      const okN = list.filter((s) => s.ok).length;
      if (okN < NEED_SALES) {
        setFb({ tone: "bad", text: `Only ${okN} completed sale${okN === 1 ? "" : "s"}. A shift needs at least ${NEED_SALES} to give a useful receipt: run another shift with new shoppers.` });
        setMist((m) => m + 1);
      } else {
        setStep(1);
        setFb({ tone: "info", text: "Shift over. Read the receipt: add up the sales that were paid, count the orders, then work out the AOV." });
      }
    }, 700);
  };

  const start = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    busy.current = false;
    setSales([]);
    setBasket([]);
    setIdx(0);
    setActor("in");
    setArrived(false);
    setT2(SHIFT);
    setPhase("shift");
    setFb({ tone: "info", text: `Free shipping from ₹${T}. The first shopper is walking up.` });
  };

  useEffect(() => {
    if (phase !== "shift") return;
    const h = setInterval(() => setT2((x) => x - 1), 1000);
    return () => clearInterval(h);
  }, [phase]);
  useEffect(() => {
    if (phase === "shift" && t <= 0 && !busy.current) {
      busy.current = true;
      endShift(sales);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [t, phase]);

  const next = (list: Sale[]) => {
    busy.current = true;
    setActor("out");
    later(() => {
      if (idx + 1 >= SHOPPERS) return endShift(list);
      setBasket([]);
      setIdx(idx + 1);
      setArrived(false);
      setActor("in");
      busy.current = false;
    }, 900);
  };

  const onItem = (id: string) => {
    if (phase !== "shift" || !sh || !arrived || busy.current) return setFb({ tone: "info", text: phase === "shift" ? "Wait for the shopper to reach the counter." : "Open the shop first." });
    if (basket.length >= 8) return setFb({ tone: "info", text: "That basket is full." });
    setBasket((b) => [...b, id]);
    const nt = total + byId[id].price;
    if (nt > sh.budget) setFb({ tone: "bad", text: `${sh.name}'s budget is ₹${sh.budget} and the basket is now ₹${nt}. Remove something before ringing up.` });
    else if (nt >= T) setFb({ tone: "good", text: `₹${nt} clears the free-shipping line (₹${T}) and is inside ${sh.name}'s ₹${sh.budget} budget. Ring it up.` });
    else setFb({ tone: "info", text: `Basket ₹${nt}. ₹${T - nt} more to reach free shipping.` });
  };
  const removeAt = (i: number) => setBasket((b) => b.filter((_, k) => k !== i));
  const onBasket = () => basket.length && removeAt(basket.length - 1);

  const ring = () => {
    if (phase !== "shift" || !sh || !arrived || busy.current) return;
    let s: Sale;
    if (total > sh.budget) {
      s = { name: sh.name, total: 0, ok: false, why: `over budget (₹${total} vs ₹${sh.budget})` };
      bad(`${sh.name} puts the basket back: ₹${total} is more than the ₹${sh.budget} budget, so no sale.`);
    } else if (total < T) {
      s = { name: sh.name, total: 0, ok: false, why: `below free shipping (₹${total} < ₹${T})` };
      bad(`${sh.name} abandons the cart: ₹${total} is under the ₹${T} free-shipping line, so the shipping fee puts them off. No sale.`);
    } else {
      s = { name: sh.name, total, ok: true, why: "paid" };
      setFb({ tone: "good", text: `Order ₹${total} paid. ${sh.name} walks out with free shipping.` });
    }
    const list = [...sales, s];
    setSales(list);
    next(list);
  };

  const paid = sales.filter((s) => s.ok);
  const revenue = paid.reduce((a, s) => a + s.total, 0);
  const orders = paid.length;
  const aov = orders ? revenue / orders : 0;

  const checkAov = () => {
    const r = num(revIn);
    const o = num(ordIn);
    const a = num(aovIn);
    if ([r, o, a].some((v) => !Number.isFinite(v)) || !revIn.trim() || !ordIn.trim() || !aovIn.trim()) return bad("Fill in all three: total revenue, number of orders, and the AOV.");
    if (r !== revenue) return bad(`Revenue is not ₹${revIn}. Add up only the rows marked paid: ${paid.map((s) => `₹${s.total}`).join(" + ")}. Abandoned and over-budget baskets earned nothing.`);
    if (o !== orders) return bad(`Orders is not ${ordIn}. Count only the paid rows on the receipt.`);
    if (Math.abs(a - aov) > 1) {
      if (Math.abs(a - revenue / sales.length) <= 1) return bad(`You divided by all ${sales.length} shoppers. AOV divides revenue by the number of ORDERS (paid ones), ${orders}.`);
      return bad(`AOV = total revenue ÷ orders = ₹${revenue} ÷ ${orders}. Work it out again.`);
    }
    setStep(2);
    setFb({ tone: "good", text: `AOV = ₹${revenue} ÷ ${orders} = ₹${aov.toFixed(0)} per order. Last step: why do multi-pack combos matter for AOV?` });
  };

  const checks = (() => {
    const s = line.toLowerCase();
    return [
      { ok: /(gram|\/g)/.test(s) && /(lower|cheaper|less|reduce|discount|saves?|drops?)/.test(s), label: "Says a combo costs less per gram", hint: "Combos spread shipping and packaging, so the price per gram is lower. Say so." },
      { ok: /(aov|basket|order value|average order|per order|spend)/.test(s) && /(higher|raise|increase|bigger|larger|more|lift|grow|up)/.test(s), label: "Says it raises the basket or AOV", hint: "A combo is a bigger purchase, so each order is worth more. Mention basket size or AOV." },
      { ok: /(combo|bundle|multi-?pack|box)/.test(s) && /(because|so |since|while|but|therefore|which|as )/.test(s), label: "Links the combo to both effects with a reason", hint: "Use because, so or but to connect the combo to the lower price per gram and the higher AOV." },
      { ok: words(line) >= 14, label: "At least 14 words, in your own sentence", hint: `${words(line)} words so far.` },
    ];
  })();
  const allOk = checks.every((c) => c.ok);
  const finish = () => {
    if (!allOk) return;
    setDone(true);
    setFb({ tone: "good", text: "Shift complete. Combos trade a lower price per gram for a bigger basket, and that lifts AOV." });
    onDone(`Shift receipt: ${orders} paid orders, revenue ₹${revenue}, AOV ₹${aov.toFixed(0)} (free shipping from ₹${T}, practice shoppers). My explanation: ${line.trim()}`);
  };

  const reset = () => {
    timers.current.forEach(clearTimeout);
    timers.current = [];
    busy.current = false;
    setGame(genGame());
    setStep(0);
    setPhase("ready");
    setIdx(0);
    setBasket([]);
    setSales([]);
    setMist(0);
    setRevIn("");
    setOrdIn("");
    setAovIn("");
    setLine("");
    setDone(false);
    setActor("in");
    setArrived(false);
    setT2(SHIFT);
    setFb({ tone: "info", text: "New shoppers, new prices and a new free-shipping line. Press Open the shop." });
  };

  const barMax = sh ? Math.max(sh.budget * 1.15, total) : 1;
  const pct = (v: number) => `${Math.min(100, (v / barMax) * 100)}%`;
  const ultimate = SKUS[2];
  const l24 = SKUS[0];

  return (
    <GameFrame
      kicker="Activity 3 · Average Order Value"
      title="Basket Builder / AOV Rush"
      mission="Run a short checkout shift. Lift each shopper's basket past the free-shipping line without passing their budget, then read the receipt to compute AOV."
      steps={["Run the shift", "Compute AOV", "Explain combos"]}
      step={done ? 3 : step}
      stars={done ? starsFor(mist) : undefined}
      onReset={reset}
      feedback={fb}
      note={{ real: "The Namkeen Combo, both Laddoo Boxes and the Ultimate Snack Box carry their real retail prices from the chapter table.", practice: "The shoppers, their baskets and budgets, the three trial packs and the free-shipping line are made up and change every restart.", tip: "AOV = total revenue ÷ number of orders. Only completed (paid) orders count." }}
    >
      <Stage3D
        label="A 3D checkout counter with a shopper, a basket, a till and shelves of Eat Better packs"
        height="clamp(400px, 58vh, 560px)"
        camera={{ position: [0, 0, 12], fov: 40 }}
        overlay={
          <div className="absolute left-2 right-2 top-2 flex items-center justify-between gap-2">
            <span className="rounded-full bg-cocoa/90 px-3 py-1 text-[0.82rem] font-bold text-cream">Free shipping from ₹{T} · practice shoppers</span>
            <span data-testid="shift-timer" className="flex items-center gap-1 rounded-full bg-orange px-3 py-1 text-[0.85rem] font-bold tabular-nums text-white">
              <Timer className="size-4" /> {phase === "shift" ? fmt(Math.max(0, t)) : fmt(SHIFT)}
            </span>
          </div>
        }
      >
        <Scene items={items} basket={basket} shopper={sh} phase={actor} actorKey={idx} total={total} onItem={onItem} onTill={ring} onBasket={onBasket} onArrived={() => setArrived(true)} />
      </Stage3D>

      <div className="mt-4 grid gap-3">
        {phase === "ready" && (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl bg-cream p-4">
            <span className="text-[1rem] text-cocoa">{SHOPPERS} shoppers, {SHIFT} seconds. At least {NEED_SALES} paid sales to pass the shift.</span>
            <button onClick={start} className="eb-btn eb-btn-primary !py-2 !text-[0.95rem]">
              Open the shop
            </button>
          </div>
        )}
        {phase === "shift" && sh && (
          <div className="rounded-2xl bg-cream p-4">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <span className="text-[1rem] text-cocoa" data-testid="shopper-card">
                <strong>{sh.name}</strong> ({idx + 1}/{SHOPPERS}) arrives with {sh.n0} items worth <strong>₹{sh.b0}</strong>. Budget <strong>₹{sh.budget}</strong>.
              </span>
              <span className="text-[0.95rem] font-bold text-cocoa-2">
                Basket now ₹{total}
              </span>
            </div>
            <div className="relative mt-3 h-6 overflow-hidden rounded-full bg-cocoa/10">
              <div className={`h-full rounded-full transition-all ${total > sh.budget ? "bg-error" : total >= T ? "bg-success" : "bg-orange"}`} style={{ width: pct(total) }} />
              <span className="absolute top-0 h-full w-0.5 bg-cocoa" style={{ left: pct(T) }} />
              <span className="absolute top-0 h-full w-1 bg-error/80" style={{ left: pct(sh.budget) }} />
            </div>
            <div className="relative mt-1 h-4 text-[0.72rem] font-bold text-cocoa-2">
              <span className="absolute -translate-x-1/2" style={{ left: pct(T) }}>
                ₹{T} free shipping
              </span>
              <span className="absolute -translate-x-1/2 text-error" style={{ left: `min(${pct(sh.budget)}, 92%)` }}>
                {Number(pct(sh.budget).slice(0, -1)) - Number(pct(T).slice(0, -1)) < 14 ? "" : `₹${sh.budget} budget`}
              </span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5" aria-label="Shelf, keyboard alternative to tapping packs">
              <span className="mr-1 text-[0.82rem] font-bold text-cocoa-2">Shelf:</span>
              {items.map((it) => (
                <button key={it.id} onClick={() => onItem(it.id)} className="rounded-full border-2 border-cocoa/20 bg-white px-2.5 py-1 text-[0.82rem] font-bold text-cocoa hover:border-orange">
                  {it.name} ₹{it.price}
                </button>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="mr-1 text-[0.82rem] font-bold text-cocoa-2">In basket:</span>
              {basket.length === 0 && <span className="text-[0.88rem] text-cocoa-2">nothing added yet</span>}
              {basket.map((id, i) => (
                <button key={i} onClick={() => removeAt(i)} aria-label={`Remove ${byId[id].name}`} className="flex items-center gap-1 rounded-full bg-haldi/60 px-2.5 py-1 text-[0.82rem] font-bold text-cocoa">
                  {byId[id].name} ₹{byId[id].price} <Minus className="size-3.5" />
                </button>
              ))}
              <button onClick={ring} disabled={!arrived} className="eb-btn eb-btn-primary ml-auto !py-1.5 !text-[0.9rem] disabled:opacity-40">
                Ring it up
              </button>
            </div>
          </div>
        )}
        {phase === "receipt" && (
          <div className="rounded-2xl bg-cream p-4">
            <div className="text-[0.78rem] font-extrabold uppercase tracking-[0.1em] text-orange">Shift receipt (practice)</div>
            <ul className="mt-2 grid gap-1 text-[0.98rem] text-cocoa">
              {sales.map((s, i) => (
                <li key={i} data-testid="receipt-row" className={`flex justify-between gap-3 rounded-lg px-3 py-1.5 ${s.ok ? "bg-success/10" : "bg-error/10"}`}>
                  <span>
                    {i + 1}. {s.name}: {s.ok ? "paid" : s.why}
                  </span>
                  <span className="font-bold tabular-nums">{s.ok ? `₹${s.total}` : "₹0"}</span>
                </li>
              ))}
              {sales.length < SHOPPERS && <li className="px-3 text-[0.88rem] text-cocoa-2">{SHOPPERS - sales.length} shopper(s) never reached the counter before closing.</li>}
            </ul>
            {step === 0 && (
              <button onClick={start} className="eb-btn eb-btn-primary mt-3 !py-2 !text-[0.95rem]">
                Run another shift
              </button>
            )}
            {step >= 1 && (
              <div className="mt-3 grid gap-2">
                <p className="text-[1rem] text-cocoa">Use only the paid rows. Total revenue, number of orders, and AOV = revenue ÷ orders:</p>
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                  <NumIn value={revIn} onChange={setRevIn} label="Total revenue in rupees" prefix="₹" unit="revenue" w="w-24" disabled={step > 1} />
                  <NumIn value={ordIn} onChange={setOrdIn} label="Number of orders" unit="orders" w="w-16" disabled={step > 1} />
                  <NumIn value={aovIn} onChange={setAovIn} label="AOV in rupees" prefix="₹" unit="AOV" w="w-24" disabled={step > 1} onEnter={checkAov} />
                  {step === 1 && (
                    <button onClick={checkAov} className="eb-btn eb-btn-primary !py-2 !text-[0.95rem]">
                      Check
                    </button>
                  )}
                </div>
              </div>
            )}
            {step >= 2 && (
              <div className="mt-4 grid gap-2">
                <div className="grid gap-2 rounded-xl bg-white p-3 text-[0.95rem] text-cocoa sm:grid-cols-2">
                  <div>
                    <strong>Ultimate Snack Box</strong>: ₹{ultimate.price} for {ultimate.grams} g = ~₹{ultimate.pg.toFixed(2)}/g
                  </div>
                  <div>
                    <strong>Laddoo Box 24</strong>: ₹{l24.price} for {l24.grams} g = ~₹{l24.pg.toFixed(2)}/g
                  </div>
                </div>
                <p className="text-[1rem] text-cocoa">Your shift AOV was ₹{aov.toFixed(0)}. In one or two sentences: why do multi-pack combos lower the price per gram but raise AOV?</p>
                <textarea value={line} onChange={(e) => setLine(e.target.value)} disabled={done} rows={3} aria-label="Your explanation" placeholder="A combo lowers the price per gram because… and it raises AOV because…" className="w-full resize-y rounded-xl border-2 border-cocoa/20 bg-white p-3 text-[1rem] text-cocoa outline-none focus:border-orange disabled:bg-success/10" />
                <ul className="grid gap-1.5">
                  {checks.map((c) => (
                    <CheckRow key={c.label} ok={c.ok} label={c.label} hint={c.hint} />
                  ))}
                </ul>
                <div>
                  <button onClick={finish} disabled={!allOk || done} className="eb-btn eb-btn-primary !py-2 !text-[0.95rem] disabled:opacity-40">
                    {done ? (
                      <>
                        <Check className="mr-1 inline size-4" /> Done
                      </>
                    ) : (
                      "Close the shop"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </GameFrame>
  );
}
