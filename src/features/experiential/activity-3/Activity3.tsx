"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, BadgeCheck, Boxes, Check, Clock, Info, Maximize, Minimize, Package, Play, RotateCcw, Star, Truck, Zap } from "lucide-react";
import { CHANNELS, CH_IDS, EVENTS, MISSION, PACKS, ROUTES, SKUS, SKU, rng, type ChId, type PackId } from "./data";
import { makeScenario, resolveEvent, rightChoice, runMission, runWeek, stockAfter, TOKENS, type ReceiveChoice } from "./sim";
import { useDC } from "./store";
import type { DCFocus } from "./Warehouse3D";
import { buildReport, type ReportBlock } from "../shared/pdf";
import { ProjectReadyPopup, useStudent } from "../shared/ProjectReadyPopup";
import { detectWebGL } from "@/lib/useClient";

const Warehouse3D = dynamic(() => import("./Warehouse3D"), { ssr: false, loading: () => <div className="grid h-full place-items-center text-cocoa-2">Loading the warehouse…</div> });

const STAGES = ["Discover", "Channels", "Receiving", "Allocate", "Disruptions", "Final mission", "Project"];
const pct = (x: number) => `${Math.round(x * 100)}%`;
const fmt = (n: number) => n.toLocaleString("en-IN");
type Fb = { tone: "good" | "bad" | "info"; text: string } | null;

const btn = "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-45";
const primary = `${btn} bg-orange text-white hover:bg-cocoa`;
const secondary = `${btn} border border-cocoa/20 bg-white text-cocoa hover:border-cocoa`;

function Feedback({ fb }: { fb: Fb }) {
  return (
    <AnimatePresence mode="wait">
      {fb && (
        <motion.div key={fb.text} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="status" className={`mt-3 rounded-2xl px-4 py-3 text-[0.96rem] leading-snug ${fb.tone === "good" ? "bg-success/12" : fb.tone === "bad" ? "bg-error/10" : "bg-peach/70"}`}>
          <strong className={fb.tone === "good" ? "text-success" : fb.tone === "bad" ? "text-error" : "text-orange"}>{fb.tone === "good" ? "Good call. " : fb.tone === "bad" ? "Not quite. " : ""}</strong>
          {fb.text}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Kicker({ children }: { children: React.ReactNode }) {
  return <div className="text-[0.8rem] font-extrabold uppercase tracking-[0.14em] text-orange">{children}</div>;
}

function Metric({ label, value, tone = "neutral", sub }: { label: string; value: string; tone?: "good" | "bad" | "neutral"; sub?: string }) {
  return (
    <div className={`rounded-2xl p-3 ${tone === "good" ? "bg-success/10" : tone === "bad" ? "bg-error/10" : "bg-cream"}`}>
      <div className="text-[0.75rem] font-extrabold uppercase tracking-[0.08em] text-cocoa-2">{label}</div>
      <div className={`font-display text-[1.45rem] font-semibold leading-tight ${tone === "good" ? "text-success" : tone === "bad" ? "text-error" : "text-cocoa"}`}>{value}</div>
      {sub && <div className="text-[0.78rem] text-cocoa-2">{sub}</div>}
    </div>
  );
}

function SkuChip({ id, active, onClick, mark }: { id: string; active?: boolean; onClick?: () => void; mark?: React.ReactNode }) {
  const s = SKU[id];
  return (
    <button onClick={onClick} className={`flex min-w-0 items-center gap-2 rounded-xl border-2 p-1.5 pr-2.5 text-left ${active ? "border-orange bg-orange/8" : "border-cocoa/10 bg-white hover:border-cocoa/30"}`}>
      <span className="relative size-10 shrink-0 overflow-hidden rounded-lg bg-cream">
        <Image src={s.img} alt={s.name} fill sizes="40px" className="object-cover" />
      </span>
      <span className="min-w-0 flex-1 truncate text-[0.88rem] font-bold">{s.short}</span>
      {mark}
    </button>
  );
}

/** Seeded limited inventory for the final mission (practice): some SKUs are short on purpose. */
function missionStock(seed: number, orders: { sku: string; qty: number }[]) {
  const r = rng(seed + 77);
  const out: Record<string, number> = {};
  for (const o of orders) out[o.sku] = Math.round((o.qty * (0.7 + r() * 0.5)) / 10) * 10;
  return out;
}

export default function Activity3() {
  const s = useDC();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- wait for the saved attempt to load from this device
    setHydrated(true);
  }, []);
  const [student, setStudent] = useStudent();
  const [fb, setFb] = useState<Fb>(null);
  const [selSku, setSelSku] = useState<string>(SKUS[0].id);
  const [selCh, setSelCh] = useState<ChId | null>(null);
  const [full, setFull] = useState(false);
  const [webgl, setWebgl] = useState(true);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time capability check
    setWebgl(detectWebGL());
    const on = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);

  const sc = useMemo(() => makeScenario(s.seed), [s.seed]);
  const stock = useMemo(() => stockAfter(sc, s.recv), [sc, s.recv]);
  const week = useMemo(() => runWeek(sc, stock, s.alloc, s.packs), [sc, stock, s.alloc, s.packs]);
  const mStock = useMemo(() => missionStock(s.seed, sc.orders), [s.seed, sc.orders]);
  const flags = Object.values(s.events).map((e) => e.out.flag).filter(Boolean) as string[];
  const mission = useMemo(() => runMission(sc, mStock, s.plan, flags), [sc, mStock, s.plan, flags]);
  const stage = s.stage;
  const focus: DCFocus = stage === 1 ? "docks" : stage === 2 ? "receiving" : stage === 3 ? "racks" : stage === 4 ? "control" : stage === 5 ? "docks" : "overview";

  const go = (n: number) => {
    s.set({ stage: n });
    setFb(null);
  };

  /* ── stage 1: routing desk ── */
  const routeOrder = ROUTES.find((r) => !s.routes[r.id]);
  const route = (ch: ChId) => {
    if (!routeOrder) return;
    setSelCh(ch);
    if (ch !== routeOrder.answer) {
      s.set({ routeMistakes: s.routeMistakes + 1 });
      setFb({ tone: "bad", text: `${CHANNELS[ch].name} delivers in ${CHANNELS[ch].speed} via ${CHANNELS[ch].model.toLowerCase()}; its job is ${CHANNELS[ch].objective.toLowerCase()}. Does that fit this order? Read the order again.` });
      return;
    }
    s.set({ routes: { ...s.routes, [routeOrder.id]: ch } });
    setFb({ tone: "good", text: routeOrder.why });
  };

  /* ── stage 2: receiving ── */
  const inb = sc.inbound.find((b) => b.sku === selSku) ?? sc.inbound[0];
  const receive = (c: ReceiveChoice) => {
    if (s.recv[inb.sku]) return;
    const right = rightChoice(inb);
    if (c !== right) {
      s.set({ recvMistakes: s.recvMistakes + 1 });
      const why =
        inb.issue === "damaged"
          ? `${inb.damaged} units arrived in crushed cartons with torn inner packs. Accepting them puts damaged food into stock and raises complaints; reject the damaged cartons and accept the rest.`
          : inb.issue === "short-life"
            ? `Only ${inb.lifeLeft} days of shelf life are left. Website, marketplace and corporate orders need at least ${CHANNELS.d2c.minLife}, ${CHANNELS.mkt.minLife} and ${CHANNELS.b2b.minLife} days on arrival, so this batch can only sell fast, through quick-commerce dark stores (FEFO: first expiry, first out).`
            : `This pallet passes every check: full count, ${inb.lifeLeft} days of shelf life, cartons intact. Rejecting or restricting good stock causes stockouts.`;
      setFb({ tone: "bad", text: why });
      return;
    }
    s.set({ recv: { ...s.recv, [inb.sku]: c } });
    setFb({ tone: "good", text: c === "accept" ? `${SKU[inb.sku].short}: scanned, counted and put away on the rack.` : c === "reject-damaged" ? `${inb.damaged} damaged units rejected and claimed back from the carrier; ${inb.units - inb.damaged} good units put away.` : `${SKU[inb.sku].short} tagged "quick commerce only": it sells within days through dark stores before it expires.` });
    const next = sc.inbound.find((b) => b.sku !== inb.sku && !s.recv[b.sku]);
    if (next) setSelSku(next.sku);
  };
  const recvDone = sc.inbound.every((b) => s.recv[b.sku]);

  /* ── stage 3: allocation ── */
  const allocOf = (sku: string, ch: ChId) => s.alloc[sku]?.[ch] ?? 0;
  const setAlloc = (sku: string, ch: ChId, v: number) => s.set({ alloc: { ...s.alloc, [sku]: { ...(s.alloc[sku] ?? ({} as Record<ChId, number>)), [ch]: Math.max(0, v) } } });
  const matchForecast = (sku: string) => s.set({ alloc: { ...s.alloc, [sku]: { ...sc.forecast[sku] } } });
  const allocated = (sku: string) => CH_IDS.reduce((a, c) => a + allocOf(sku, c), 0);
  const packsOk = CH_IDS.every((c) => s.packs[c] && (s.packs[c] === CHANNELS[c].need || CHANNELS[c].need === "basic"));
  const weekOk = s.weekRuns > 0 && week.overAllocated.length === 0 && week.fill >= 0.85 && week.waste <= 0.04 && packsOk;
  const runTheWeek = () => {
    s.set({ weekRuns: s.weekRuns + 1 });
    const probs: string[] = [];
    if (week.overAllocated.length) probs.push(`You allocated more ${week.overAllocated.map((x) => SKU[x].short).join(", ")} than you have, so every channel got less than planned.`);
    const expiredRows = week.rows.filter((r) => r.expired > 0);
    if (expiredRows.length) probs.push(`${fmt(week.expired)} units expired, e.g. ${SKU[expiredRows[0].sku].short} sent to ${CHANNELS[expiredRows[0].ch].short} (needs ${CHANNELS[expiredRows[0].ch].minLife}+ days of shelf life, or sits too long in a dark store).`);
    if (!packsOk) probs.push("Some channels have no or too-light packaging: long journeys need protective or rigid packaging.");
    if (week.fill < 0.85) probs.push(`Only ${pct(week.fill)} of forecast demand was delivered: check channels where you allocated less than the forecast.`);
    setFb(probs.length ? { tone: "bad", text: probs.join(" ") } : { tone: "good", text: `Week simulated: ${pct(week.fill)} of demand delivered, ${pct(week.waste)} of stock wasted, and a safety reserve kept for surprises.` });
  };

  /* ── stage 4: disruptions ── */
  const tokensUsed = Object.values(s.events).reduce((a, e) => ({ overtime: a.overtime + e.out.tokens.overtime, expedite: a.expedite + e.out.tokens.expedite }), { overtime: 0, expedite: 0 });
  const evNext = EVENTS.find((e) => !s.events[e.id]);
  const reserveLeft = (sku: string) => Math.max(0, (week.reserve[sku] ?? 0) - Object.entries(s.events).reduce((a, [id, e]) => (EVENTS.find((x) => x.id === id)!.sku === sku ? a + e.out.recovered + e.out.late : a), 0));
  const decide = (optId: string) => {
    if (!evNext) return;
    const n = sc.events.find((e) => e.id === evNext.id)!.n;
    const sku = evNext.sku;
    const surplus = week.rows.filter((r) => r.sku === sku && r.ch !== evNext.ch).reduce((a, r) => a + r.excess, 0);
    const hold = Math.floor(allocOf(sku, "mkt") / 2);
    const out = resolveEvent(evNext.id, n, optId, { reserve: reserveLeft(sku), free: 0, surplus, hold });
    s.set({ events: { ...s.events, [evNext.id]: { opt: optId, out } } });
    setFb({ tone: out.unsafe || out.recovered < n * 0.5 ? "bad" : "good", text: out.note });
  };
  const evDone = EVENTS.every((e) => s.events[e.id]);
  const evTotals = Object.values(s.events).reduce((a, e) => ({ rec: a.rec + e.out.recovered, late: a.late + e.out.late, lost: a.lost + e.out.lost }), { rec: 0, late: 0, lost: 0 });
  const evN = sc.events.reduce((a, e) => a + e.n, 0);

  /* ── stage 5: mission ── */
  const expressCap = MISSION.expressTokens + (flags.includes("courier") ? 1 : 0);
  const move = (i: number, d: -1 | 1) => {
    const o = [...s.plan.order];
    const j = i + d;
    if (j < 0 || j >= o.length) return;
    [o[i], o[j]] = [o[j], o[i]];
    s.set({ plan: { ...s.plan, order: o } });
  };
  const toggleExpress = (id: string) => {
    const has = s.plan.express.includes(id);
    if (!has && s.plan.express.length >= expressCap) return setFb({ tone: "info", text: `You only have ${expressCap} express upgrades. Remove one first.` });
    s.set({ plan: { ...s.plan, express: has ? s.plan.express.filter((x) => x !== id) : [...s.plan.express, id] } });
  };

  /* ── scores ── */
  const routeScore = Math.max(0, 100 - s.routeMistakes * 10);
  const recvScore = Math.max(0, 100 - s.recvMistakes * 15);
  const weekScore = Math.round(Math.max(0, week.fill - week.waste) * 100);
  const evScore = evN ? Math.round(((evTotals.rec + evTotals.late * 0.4) / evN) * 100) : 0;
  const missionScore = Math.round(mission.onTimeRate * 100);
  const overall = Math.round(routeScore * 0.1 + recvScore * 0.15 + weekScore * 0.3 + evScore * 0.2 + missionScore * 0.25);

  const report = async () => {
    const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    const blocks: ReportBlock[] = [
      { kind: "h", text: "Objective" },
      { kind: "p", text: "Run Eat Better's distribution centre for a simulated week: route orders to the right channel, receive and inspect stock, allocate inventory across the four channels, handle disruptions and complete a final distribution mission while keeping snacks fresh." },
      { kind: "h", text: "Learning outcomes" },
      { kind: "bullets", items: ["Compare the four channels (own website, marketplaces, quick commerce, corporate & bulk) by fulfilment model, speed and objective.", "Inspect inbound stock for damage and shelf life, and apply first-expiry-first-out.", "Allocate limited inventory against a demand forecast and see the cost of over- and under-allocation.", "Choose packaging that protects products on each channel's journey.", "Respond to disruptions and prioritise orders against deadlines."] },
      { kind: "callout", tone: "info", text: "All stock levels, forecasts, disruptions and results in this report are SIMULATED practice data. Channel facts (fulfilment model, delivery speed, objective) come from Chapter 3.4." },
      { kind: "h", text: "1. Channel network" },
      { kind: "table", head: ["Channel", "Fulfilment model", "Speed", "Objective", "Packaging chosen"], rows: CH_IDS.map((c) => [CHANNELS[c].name, CHANNELS[c].model, CHANNELS[c].speed, CHANNELS[c].objective, s.packs[c] ? PACKS[s.packs[c]!].name : "-"]), widths: [30, 36, 24, 50, 34] },
      { kind: "p", text: `Order routing: ${ROUTES.length} customer orders routed, ${s.routeMistakes} wrong attempt(s) before the right channel.` },
      { kind: "h", text: "2. Warehouse management decisions (receiving)" },
      { kind: "table", head: ["SKU", "Batch", "Units", "Shelf life left", "Issue", "My decision"], rows: sc.inbound.map((b) => [SKU[b.sku].short, b.batch, String(b.units), `${b.lifeLeft} days`, b.issue === "ok" ? "None" : b.issue === "damaged" ? `${b.damaged} damaged` : "Short shelf life", s.recv[b.sku] === "accept" ? "Accept" : s.recv[b.sku] === "reject-damaged" ? "Reject damaged cartons" : s.recv[b.sku] === "qc-only" ? "Quick commerce only" : "-"]), widths: [34, 26, 16, 24, 30, 44] },
      { kind: "p", text: `Receiving mistakes before the correct decision: ${s.recvMistakes}.` },
      { kind: "h", text: "3. Inventory allocation (units, simulated)" },
      { kind: "table", head: ["SKU", "In stock", "D2C (fcst)", "Marketplace (fcst)", "Q-commerce (fcst)", "Corporate (fcst)", "Reserve"], rows: SKUS.map((k) => [k.short, String(stock[k.id].units), ...CH_IDS.map((c) => `${allocOf(k.id, c)} (${sc.forecast[k.id][c]})`), String(week.reserve[k.id] ?? 0)]), widths: [28, 18, 24, 28, 28, 26, 22] },
      { kind: "h", text: "4. Simulated week: stockout and wastage analysis" },
      { kind: "kv", rows: [["Forecast demand", `${fmt(week.forecast)} units`], ["Delivered in good condition", `${fmt(week.delivered)} units (fill rate ${pct(week.fill)})`], ["Missed (stockouts + damage)", `${fmt(week.missed)} units`], ["Damaged in transit", `${fmt(week.damaged)} units`], ["Expired", `${fmt(week.expired)} units`], ["Wastage", `${pct(week.waste)} of stock`]] },
      { kind: "h", text: "5. Disruption management" },
      { kind: "table", head: ["Event", "My decision", "Handled on time", "Late", "Lost"], rows: EVENTS.map((e) => { const d = s.events[e.id]; const o = e.options.find((x) => x.id === d?.opt); return [e.title, o?.label ?? "-", String(d?.out.recovered ?? "-"), String(d?.out.late ?? "-"), String(d?.out.lost ?? "-")]; }), widths: [30, 74, 24, 22, 24] },
      { kind: "p", text: `Resources used: ${tokensUsed.overtime}/${TOKENS.overtime} overtime shifts, ${tokensUsed.expedite}/${TOKENS.expedite} expedite tokens. Upgrades unlocked: ${flags.length ? flags.join(", ") : "none"}.` },
      { kind: "h", text: "6. Final distribution mission (order fulfilment strategy)" },
      { kind: "table", head: ["#", "Customer", "SKU", "Qty", "Shipped", "Express", "Arrives (h)", "Deadline (h)", "On time"], rows: mission.rows.map((r, i) => [String(i + 1), sc.orders.find((o) => o.id === r.id)!.customer, SKU[r.sku].short, String(r.qty), String(r.shipped), s.plan.express.includes(r.id) ? "Yes" : "No", String(r.arriveH), String(r.deadlineH), r.onTime ? (r.shipped < r.qty ? "Partly" : "Yes") : "No"]), widths: [8, 38, 26, 14, 18, 16, 20, 20, 14] },
      { kind: "p", text: `Limited inventory (simulated): ${Object.entries(mStock).map(([k, v]) => `${SKU[k].short} ${v}`).join(", ")}. On-time fulfilment: ${pct(mission.onTimeRate)} of units; ${mission.onTimeOrders} of ${sc.orders.length} orders complete and on time.` },
      { kind: "h", text: "Final performance summary (simulation)" },
      { kind: "table", head: ["Area", "Score"], rows: [["Channel routing", `${routeScore}/100`], ["Receiving & quality", `${recvScore}/100`], ["Allocation week (fill minus waste)", `${weekScore}/100`], ["Disruptions recovered", `${evScore}/100`], ["Final mission on time", `${missionScore}/100`], ["Overall", `${overall}/100`]], widths: [120, 54] },
      { kind: "h", text: "My reflection" },
      { kind: "p", text: s.reflection },
    ];
    await buildReport({ title: "Distribution & Supply Chain Strategy Report", activity: "Experiential Activity 3", module: "Module 3 · Business Model Canvas & Distribution", student, date, blocks, filename: `EatBetter-SkilliZee-Distribution-Report-${(student.name || "student").replace(/\s+/g, "-")}.pdf` });
  };

  const toggleFull = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      /* not allowed here */
    }
  };

  if (!hydrated) return <div className="grid min-h-screen place-items-center bg-[#E9E6E1] text-cocoa-2">Opening the distribution centre…</div>;

  const rackStock: Record<string, number> = Object.fromEntries(SKUS.map((k) => [k.id, stage <= 2 && !s.recv[k.id] ? 0 : stage >= 3 ? week.reserve[k.id] ?? stock[k.id].units : stock[k.id].units]));
  const docks = Object.fromEntries(CH_IDS.map((c) => [c, Object.fromEntries(SKUS.map((k) => [k.id, stage >= 3 ? allocOf(k.id, c) : 0]))])) as Record<ChId, Record<string, number>>;
  const wall = [
    `Stock on hand: ${fmt(SKUS.reduce((a, k) => a + (rackStock[k.id] ?? 0), 0))} units`,
    stage >= 3 ? `Fill rate: ${pct(week.fill)}` : `Pallets received: ${Object.keys(s.recv).length}/6`,
    stage >= 3 ? `Wastage: ${pct(week.waste)}` : `Orders routed: ${Object.keys(s.routes).length}/${ROUTES.length}`,
    stage >= 4 ? `Disruptions handled: ${Object.keys(s.events).length}/${EVENTS.length}` : "",
    stage >= 5 ? `Mission on time: ${pct(mission.onTimeRate)}` : "",
    "All figures simulated",
  ].filter(Boolean);

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-[#E9E6E1] text-cocoa">
      <header className="sticky top-0 z-30 border-b border-cocoa/10 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-3 py-2 sm:px-5">
          <Image src="/brand/eat-better-x-skillizee-600x400.png" alt="Eat Better Co × SkilliZee" width={90} height={60} className="h-10 w-auto" />
          <div className="min-w-0 flex-1">
            <div className="text-[0.72rem] font-extrabold uppercase tracking-[0.14em] text-orange">Experiential Activity 3 · Module 3</div>
            <div className="truncate font-display text-[1.15rem] font-semibold leading-tight">Eat Better Distribution Command Centre</div>
          </div>
          <button onClick={() => (s.restart(), setFb(null), setSelSku(SKUS[0].id))} className={`${secondary} !px-3 !py-1.5 text-[0.85rem]`}>
            <RotateCcw className="size-4" /> Restart
          </button>
          <button onClick={toggleFull} aria-label={full ? "Exit fullscreen" : "Fullscreen"} className={`${secondary} !px-2.5 !py-1.5`}>
            {full ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
          </button>
        </div>
        <ol className="no-scrollbar mx-auto flex max-w-[1600px] gap-1.5 overflow-x-auto px-3 pb-2 sm:px-5">
          {STAGES.map((t, i) => (
            <li key={t} className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[0.82rem] font-bold ${i === stage ? "bg-orange text-white" : i < stage ? "bg-success/15 text-success" : "bg-white text-cocoa-2/70"}`}>
              {i < stage ? <Check className="size-3.5" strokeWidth={3} /> : <span>{i + 1}</span>}
              {t}
            </li>
          ))}
        </ol>
      </header>

      <div className="fixed inset-0 z-0">
        {webgl ? (
          <Warehouse3D
            focus={focus}
            stock={rackStock}
            docks={docks}
            inbound={sc.inbound}
            recv={s.recv}
            selectedSku={stage === 2 || stage === 3 ? selSku : null}
            selectedCh={stage === 1 ? selCh : null}
            onSku={(id) => (stage === 2 || stage === 3) && setSelSku(id)}
            onDock={(c) => stage === 1 && route(c)}
            wall={wall}
            running={stage >= 3}
          />
        ) : (
          <div className="grid h-full place-items-center p-6 text-center text-cocoa-2">3D isn&apos;t available on this device. Every task still works in the panel.</div>
        )}
      </div>

      <div className="pointer-events-none relative z-10 mx-auto grid w-full max-w-[1600px] flex-1 gap-3 p-3 sm:p-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(420px,0.9fr)]">
        <div className="h-[44vh] lg:h-auto" aria-hidden />
        <section className="pointer-events-auto min-w-0 self-start rounded-[22px] border border-cocoa/15 bg-white/95 p-4 shadow-[0_24px_60px_-30px_rgba(47,28,26,0.55)] backdrop-blur sm:p-5 lg:max-h-[calc(100dvh-130px)] lg:overflow-y-auto">
          {stage === 0 && (
            <div>
              <Kicker>Discover · your role</Kicker>
              <h1 className="mt-1 font-display text-[clamp(1.6rem,3vw,2.1rem)] font-semibold leading-tight">You run Eat Better&apos;s distribution centre this week</h1>
              <p className="mt-2 text-[1rem] leading-relaxed">As distribution and supply-chain manager, you move snacks from the facility to customers through four channels, without stockouts, damage or expired stock.</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {[
                  [Truck, "Channels", "Route five real-world orders to the right channel and dock."],
                  [Package, "Receiving", "Inspect six inbound pallets: damage, shelf life, FEFO."],
                  [Boxes, "Allocate", "Split stock across channels against a forecast, choose packaging, run the week."],
                  [Zap, "Disruptions", "Six live events: festive spike, late batch, stockout, damage, courier strike, big gifting order."],
                  [Clock, "Final mission", "Six orders, limited stock, hard deadlines. Sequence and expedite."],
                  [BadgeCheck, "Project", "Download your Distribution & Supply Chain Strategy Report."],
                ].map(([I, h, t]) => {
                  const Ic = I as typeof Truck;
                  return (
                    <div key={h as string} className="flex gap-2.5 rounded-2xl bg-cream p-3">
                      <Ic className="mt-0.5 size-5 shrink-0 text-orange" />
                      <div>
                        <div className="font-display text-[1rem] font-semibold">{h as string}</div>
                        <p className="text-[0.88rem] leading-snug text-cocoa-2">{t as string}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <p className="mt-4 flex items-start gap-2 rounded-2xl bg-peach/60 p-3 text-[0.88rem]">
                <Info className="mt-0.5 size-4 shrink-0 text-orange" /> Channel facts come from Chapter 3.4. Products are real Eat Better SKUs; every stock level, forecast, rate and event is a simulated practice number.
              </p>
              <button onClick={() => go(1)} className={`${primary} mt-4`}>
                Enter the distribution centre <ArrowRight className="size-4" />
              </button>
            </div>
          )}

          {stage === 1 && (
            <div>
              <Kicker>Learn · the four channels</Kicker>
              <h2 className="mt-1 font-display text-[1.45rem] font-semibold">Same snack, four ways out of the building</h2>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {CH_IDS.map((c) => (
                  <div key={c} className="rounded-2xl border-l-4 bg-cream p-3" style={{ borderColor: CHANNELS[c].color }}>
                    <div className="font-display text-[1.02rem] font-semibold">{CHANNELS[c].name}</div>
                    <div className="mt-0.5 text-[0.84rem] text-cocoa-2">
                      {CHANNELS[c].model} · <strong className="text-cocoa">{CHANNELS[c].speed}</strong>
                    </div>
                    <div className="mt-1 text-[0.84rem]">{CHANNELS[c].objective}</div>
                  </div>
                ))}
              </div>
              {routeOrder ? (
                <div className="mt-4 rounded-2xl border-2 border-orange/40 p-4">
                  <div className="text-[0.8rem] font-extrabold uppercase tracking-[0.1em] text-cocoa-2">
                    Order {ROUTES.indexOf(routeOrder) + 1} of {ROUTES.length} · tap the right dock in 3D or below
                  </div>
                  <p className="mt-1 text-[1.02rem] font-semibold leading-snug">{routeOrder.text}</p>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {CH_IDS.map((c) => (
                      <button key={c} onClick={() => route(c)} className="rounded-xl border-2 px-3 py-2 text-left text-[0.9rem] font-bold hover:bg-cream" style={{ borderColor: CHANNELS[c].color }}>
                        {CHANNELS[c].short} dock
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="mt-4 rounded-2xl bg-success/10 p-3 text-[0.95rem]">All five orders routed. Next: receive this week&apos;s stock.</div>
              )}
              <Feedback fb={fb} />
              <div className="mt-4 flex justify-between">
                <span className="text-[0.88rem] text-cocoa-2">Wrong routes: {s.routeMistakes}</span>
                <button disabled={!!routeOrder} onClick={() => go(2)} className={primary}>
                  To receiving <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          )}

          {stage === 2 && (
            <div>
              <Kicker>Explore · warehouse receiving</Kicker>
              <h2 className="mt-1 font-display text-[1.45rem] font-semibold">Six pallets just arrived</h2>
              <p className="mt-1 text-[0.95rem] text-cocoa-2">Tap a pallet (in 3D or below), read its delivery note, then decide. Damaged food never goes on the shelf, and short-life stock must sell fast.</p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {sc.inbound.map((b) => (
                  <SkuChip key={b.sku} id={b.sku} active={selSku === b.sku} onClick={() => setSelSku(b.sku)} mark={s.recv[b.sku] ? <Check className="size-4 text-success" strokeWidth={3} /> : null} />
                ))}
              </div>
              <div className="mt-3 rounded-2xl bg-cream p-3 text-[0.93rem]">
                <div className="font-bold">Delivery note · {SKU[inb.sku].name} (simulated)</div>
                <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1">
                  <span className="text-cocoa-2">Batch</span>
                  <span>{inb.batch}</span>
                  <span className="text-cocoa-2">Units</span>
                  <span>{fmt(inb.units)} ({inb.units / 20} cartons of 20)</span>
                  <span className="text-cocoa-2">Shelf life left</span>
                  <span className={inb.issue === "short-life" ? "font-bold text-error" : ""}>{inb.lifeLeft} days</span>
                  <span className="text-cocoa-2">Carton check</span>
                  <span className={inb.issue === "damaged" ? "font-bold text-error" : ""}>{inb.issue === "damaged" ? `${inb.damaged} units crushed, inner packs torn` : "All cartons intact"}</span>
                  <span className="text-cocoa-2">Trailer temperature</span>
                  <span>{inb.temp}°C</span>
                </div>
                <div className="mt-2 text-[0.8rem] text-cocoa-2">Minimum shelf life on arrival: D2C {CHANNELS.d2c.minLife} days · Marketplace {CHANNELS.mkt.minLife} · Quick commerce {CHANNELS.qc.minLife} · Corporate {CHANNELS.b2b.minLife}.</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button disabled={!!s.recv[inb.sku]} onClick={() => receive("accept")} className={`${btn} !py-1.5 bg-success text-white`}>
                    Accept all
                  </button>
                  <button disabled={!!s.recv[inb.sku]} onClick={() => receive("reject-damaged")} className={`${btn} !py-1.5 bg-error text-white`}>
                    Reject damaged cartons
                  </button>
                  <button disabled={!!s.recv[inb.sku]} onClick={() => receive("qc-only")} className={`${btn} !py-1.5 bg-[#00A341] text-white`}>
                    Accept: quick commerce only
                  </button>
                </div>
              </div>
              <Feedback fb={fb} />
              <div className="mt-4 flex justify-between">
                <button onClick={() => go(1)} className={secondary}>
                  <ArrowLeft className="size-4" /> Channels
                </button>
                <button disabled={!recvDone} onClick={() => (go(3), setSelSku(SKUS[0].id))} className={primary}>
                  To allocation <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          )}

          {stage === 3 && (
            <div>
              <Kicker>Practise · channel allocation</Kicker>
              <h2 className="mt-1 font-display text-[1.45rem] font-semibold">Split the stock, pack it right, run the week</h2>
              <p className="mt-1 text-[0.93rem] text-cocoa-2">Allocate each SKU against the simulated forecast. Whatever you don&apos;t allocate stays as a safety reserve for surprises.</p>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                {SKUS.map((k) => (
                  <SkuChip key={k.id} id={k.id} active={selSku === k.id} onClick={() => setSelSku(k.id)} mark={allocated(k.id) > stock[k.id].units ? <span className="text-[0.7rem] font-extrabold text-error">OVER</span> : allocated(k.id) ? <Check className="size-4 text-success" strokeWidth={3} /> : null} />
                ))}
              </div>
              <div className="mt-3 rounded-2xl border border-cocoa/10 p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="font-display text-[1.05rem] font-semibold">{SKU[selSku].name}</div>
                  <button onClick={() => matchForecast(selSku)} className="rounded-full bg-cream px-3 py-1 text-[0.8rem] font-bold">
                    Start from the forecast
                  </button>
                </div>
                <div className="mt-1 text-[0.85rem] text-cocoa-2">
                  In stock {fmt(stock[selSku].units)} · allocated <strong className={allocated(selSku) > stock[selSku].units ? "text-error" : "text-cocoa"}>{fmt(allocated(selSku))}</strong> · reserve {fmt(Math.max(0, stock[selSku].units - allocated(selSku)))} · shelf life {stock[selSku].lifeLeft} days{stock[selSku].qcOnly ? " (quick commerce only)" : ""}
                </div>
                <div className="mt-2 grid gap-2">
                  {CH_IDS.map((c) => (
                    <label key={c} className="grid grid-cols-[minmax(0,7.5rem)_1fr_4.2rem] items-center gap-2 text-[0.88rem]">
                      <span className="font-bold" style={{ color: CHANNELS[c].color }}>
                        {CHANNELS[c].short}
                        <span className="block text-[0.75rem] font-normal text-cocoa-2">forecast {sc.forecast[selSku][c]}</span>
                      </span>
                      <input type="range" min={0} max={Math.round(stock[selSku].units / 10) * 10} step={10} value={allocOf(selSku, c)} onChange={(e) => setAlloc(selSku, c, +e.target.value)} className="accent-orange" aria-label={`${CHANNELS[c].short} allocation`} />
                      <span className="text-right tabular-nums">{allocOf(selSku, c)}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="mt-3 rounded-2xl border border-cocoa/10 p-3">
                <div className="font-display text-[1.02rem] font-semibold">Packaging per channel</div>
                <div className="mt-2 grid gap-2">
                  {CH_IDS.map((c) => (
                    <div key={c} className="grid grid-cols-[minmax(0,7.5rem)_1fr] items-center gap-2">
                      <span className="text-[0.86rem] font-bold" style={{ color: CHANNELS[c].color }}>
                        {CHANNELS[c].short}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {(Object.keys(PACKS) as PackId[]).map((pk) => (
                          <button key={pk} title={PACKS[pk].desc} onClick={() => s.set({ packs: { ...s.packs, [c]: pk } })} className={`rounded-full border px-2.5 py-1 text-[0.78rem] font-bold ${s.packs[c] === pk ? "border-orange bg-orange text-white" : "border-cocoa/15 bg-white"}`}>
                            {pk === "basic" ? "Tote / single-wall" : pk === "protective" ? "5-ply + cushion" : "Rigid + pallet"}
                          </button>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <button onClick={runTheWeek} className={`${primary} mt-3 w-full`}>
                <Play className="size-4" /> Run the week (simulation)
              </button>
              {s.weekRuns > 0 && (
                <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                  <Metric label="Fill rate" value={pct(week.fill)} tone={week.fill >= 0.85 ? "good" : "bad"} sub="target 85%+" />
                  <Metric label="Missed" value={fmt(week.missed)} sub="units" />
                  <Metric label="Damaged" value={fmt(week.damaged)} tone={week.damaged > 0.03 * week.forecast ? "bad" : "neutral"} sub="units" />
                  <Metric label="Wastage" value={pct(week.waste)} tone={week.waste <= 0.04 ? "good" : "bad"} sub="target 4% or less" />
                </div>
              )}
              <Feedback fb={fb} />
              <div className="mt-4 flex justify-between">
                <button onClick={() => go(2)} className={secondary}>
                  <ArrowLeft className="size-4" /> Receiving
                </button>
                <button disabled={!weekOk} onClick={() => go(4)} className={primary}>
                  Handle disruptions <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          )}

          {stage === 4 && (
            <div>
              <Kicker>Challenge · real-world disruptions</Kicker>
              <h2 className="mt-1 font-display text-[1.45rem] font-semibold">The control room phone is ringing</h2>
              <div className="mt-2 flex flex-wrap gap-2 text-[0.85rem]">
                <span className="rounded-full bg-cream px-3 py-1 font-bold">Overtime shifts left: {TOKENS.overtime - tokensUsed.overtime}</span>
                <span className="rounded-full bg-cream px-3 py-1 font-bold">Expedite tokens left: {TOKENS.expedite - tokensUsed.expedite}</span>
                <span className="rounded-full bg-cream px-3 py-1 font-bold">
                  Event {Math.min(EVENTS.length, Object.keys(s.events).length + 1)} of {EVENTS.length}
                </span>
              </div>
              {evNext ? (
                <div className="mt-3 rounded-2xl border-2 border-orange/40 p-4">
                  <div className="flex items-center gap-2 font-display text-[1.15rem] font-semibold">
                    <Zap className="size-5 text-orange" /> {evNext.title}
                  </div>
                  <p className="mt-1 text-[0.98rem] leading-snug">{evNext.text(sc.events.find((e) => e.id === evNext.id)!.n, SKU[evNext.sku].short)}</p>
                  <p className="mt-1 text-[0.82rem] text-cocoa-2">
                    Deadline: {evNext.deadlineH} hours · reserve of {SKU[evNext.sku].short}: {reserveLeft(evNext.sku)} units (simulated)
                  </p>
                  <div className="mt-3 grid gap-2">
                    {evNext.options.map((o) => {
                      const noOT = (o.overtime ?? 0) > TOKENS.overtime - tokensUsed.overtime;
                      const noEx = (o.expedite ?? 0) > TOKENS.expedite - tokensUsed.expedite;
                      return (
                        <button key={o.id} disabled={noOT || noEx} onClick={() => decide(o.id)} className="rounded-xl border border-cocoa/15 bg-white p-3 text-left hover:border-orange disabled:opacity-45">
                          <span className="block text-[0.95rem] font-bold">{o.label}</span>
                          <span className="block text-[0.84rem] text-cocoa-2">
                            {o.desc}
                            {noOT ? " (no overtime shifts left)" : noEx ? " (no expedite tokens left)" : ""}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="mt-3 grid grid-cols-3 gap-2">
                  <Metric label="Handled on time" value={fmt(evTotals.rec)} tone="good" sub={`of ${fmt(evN)} units`} />
                  <Metric label="Late" value={fmt(evTotals.late)} sub="units" />
                  <Metric label="Lost" value={fmt(evTotals.lost)} tone={evTotals.lost > evN * 0.3 ? "bad" : "neutral"} sub="units" />
                </div>
              )}
              <ul className="mt-3 grid gap-1.5">
                {EVENTS.filter((e) => s.events[e.id]).map((e) => (
                  <li key={e.id} className="rounded-xl bg-cream px-3 py-2 text-[0.85rem]">
                    <strong>{e.title}:</strong> {e.options.find((o) => o.id === s.events[e.id].opt)?.label}. {s.events[e.id].out.recovered} on time, {s.events[e.id].out.late} late, {s.events[e.id].out.lost} lost.
                  </li>
                ))}
              </ul>
              <Feedback fb={fb} />
              <div className="mt-4 flex justify-end">
                <button disabled={!evDone} onClick={() => go(5)} className={primary}>
                  Final mission <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          )}

          {stage === 5 && (
            <div>
              <Kicker>Challenge · final distribution mission</Kicker>
              <h2 className="mt-1 font-display text-[1.45rem] font-semibold">Six orders, limited stock, one packing line</h2>
              <p className="mt-1 text-[0.93rem] text-cocoa-2">
                Orders are packed one after another at {MISSION.packRate} units an hour, then travel by their channel. Put them in the best order and spend up to {expressCap} express upgrades. Stock is taken in the order you pack.
              </p>
              <div className="mt-2 flex flex-wrap gap-1.5 text-[0.8rem]">
                {Object.entries(mStock).map(([k, v]) => (
                  <span key={k} className="rounded-full bg-cream px-2.5 py-1 font-bold">
                    {SKU[k].short}: {v} in stock
                  </span>
                ))}
              </div>
              <ol className="mt-3 grid gap-2">
                {s.plan.order.map((id, i) => {
                  const o = sc.orders.find((x) => x.id === id)!;
                  const r = mission.rows.find((x) => x.id === id)!;
                  return (
                    <li key={id} className={`rounded-2xl border p-2.5 ${s.missionRuns ? (r.onTime && r.shipped === r.qty ? "border-success/40 bg-success/5" : "border-error/40 bg-error/5") : "border-cocoa/10 bg-white"}`}>
                      <div className="flex items-center gap-2">
                        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-cocoa text-[0.85rem] font-bold text-cream">{i + 1}</span>
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[0.92rem] font-bold">
                            {o.customer} · {o.qty} × {SKU[o.sku].short}
                          </div>
                          <div className="text-[0.78rem] text-cocoa-2">
                            <span style={{ color: CHANNELS[o.ch].color }} className="font-bold">
                              {CHANNELS[o.ch].short}
                            </span>{" "}
                            · due in {o.deadlineH} h · transit {MISSION.transit[o.ch].standard} h{MISSION.transit[o.ch].express !== MISSION.transit[o.ch].standard ? ` (express ${MISSION.transit[o.ch].express} h)` : ""}
                            {s.missionRuns > 0 && ` · arrives ${r.arriveH} h, shipped ${r.shipped}/${r.qty}`}
                          </div>
                        </div>
                        <button aria-label="Move up" disabled={i === 0} onClick={() => move(i, -1)} className="rounded-lg bg-cream p-1 disabled:opacity-30">
                          <ArrowUp className="size-4" />
                        </button>
                        <button aria-label="Move down" disabled={i === s.plan.order.length - 1} onClick={() => move(i, 1)} className="rounded-lg bg-cream p-1 disabled:opacity-30">
                          <ArrowDown className="size-4" />
                        </button>
                        <button onClick={() => toggleExpress(id)} className={`rounded-lg px-2 py-1 text-[0.75rem] font-bold ${s.plan.express.includes(id) ? "bg-orange text-white" : "bg-cream"}`}>
                          Express
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ol>
              <button onClick={() => (s.set({ missionRuns: s.missionRuns + 1 }), setFb({ tone: mission.onTimeRate >= 0.75 ? "good" : "bad", text: `${mission.onTimeOrders} of ${sc.orders.length} orders complete and on time; ${pct(mission.onTimeRate)} of units delivered on time. ${mission.onTimeRate < 0.75 ? "Tight deadlines first (dark stores need hours, not days), and don't spend short stock on orders that will miss anyway." : ""}` }))} className={`${primary} mt-3 w-full`}>
                <Play className="size-4" /> Run the mission
              </button>
              <Feedback fb={fb} />
              <div className="mt-4 flex justify-end">
                <button disabled={!s.missionRuns} onClick={() => go(6)} className={primary}>
                  See my evaluation <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          )}

          {stage === 6 && (
            <div>
              <Kicker>Evaluate · your week as distribution manager</Kicker>
              <div className="mt-2 flex flex-wrap items-center gap-4 rounded-[22px] bg-cream p-4">
                <div className="grid size-24 place-items-center rounded-full border-4 border-success bg-white text-center">
                  <div>
                    <div className="font-display text-[1.8rem] font-semibold leading-none text-success">{overall}</div>
                    <div className="text-[0.7rem] font-bold text-cocoa-2">/100</div>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="font-display text-[1.25rem] font-semibold">Simulation score</div>
                  <div className="mt-1 flex gap-0.5">{[0, 1, 2].map((i) => <Star key={i} className={`size-5 ${i < (overall >= 80 ? 3 : overall >= 60 ? 2 : 1) ? "fill-haldi text-[#C9A400]" : "text-cocoa/20"}`} />)}</div>
                  <p className="mt-1 text-[0.88rem] text-cocoa-2">Simulated practice results, not Eat Better operating data.</p>
                </div>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                <Metric label="Routing" value={`${routeScore}`} sub={`${s.routeMistakes} wrong`} />
                <Metric label="Receiving" value={`${recvScore}`} sub={`${s.recvMistakes} wrong`} />
                <Metric label="Week fill" value={pct(week.fill)} sub={`waste ${pct(week.waste)}`} />
                <Metric label="Disruptions" value={`${evScore}`} sub={`${fmt(evTotals.lost)} units lost`} />
                <Metric label="Mission on time" value={pct(mission.onTimeRate)} sub={`${mission.onTimeOrders}/6 orders`} />
                <Metric label="Overall" value={`${overall}/100`} tone="good" />
              </div>
              <div className="mt-5">
                <ProjectReadyPopup
                  student={student}
                  setStudent={setStudent}
                  reflection={s.reflection}
                  setReflection={(r) => s.set({ reflection: r })}
                  reflectionPrompt="What did you learn about getting snacks to customers fresh, fast and whole?"
                  submitWhat="Submit your Distribution & Supply Chain Strategy Report (PDF)."
                  activity="Experiential Activity 3 · Eat Better Distribution Command Centre"
                  files={[`EatBetter-SkilliZee-Distribution-Report-${(student.name || "student").replace(/\s+/g, "-")}.pdf`]}
                  downloads={[{ label: "Download Report (PDF)", sub: "Distribution & Supply Chain Strategy Report", kind: "pdf", run: report }]}
                />
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
