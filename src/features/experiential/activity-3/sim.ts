/**
 * Experiential Activity 3 — the distribution simulation. Everything here is a SIMULATED practice model, seeded per
 * attempt (Restart gives new numbers). All results are computed from the student's own decisions.
 */
import { CHANNELS, CH_IDS, EVENTS, MISSION, SKUS, SKU, damageRate, rng, type ChId, type PackId } from "./data";

/* ── stage 2: inbound pallets ───────────────────────────────── */
export type InboundIssue = "ok" | "damaged" | "short-life";
export type Inbound = { sku: string; units: number; batch: string; lifeLeft: number; damaged: number; issue: InboundIssue; temp: number };
export type ReceiveChoice = "accept" | "reject-damaged" | "qc-only";

export type Scenario = {
  inbound: Inbound[];
  forecast: Record<string, Record<ChId, number>>;
  events: { id: string; n: number }[];
  orders: Order[];
};
export type Order = { id: string; ch: ChId; sku: string; qty: number; deadlineH: number; customer: string };

export function makeScenario(seed: number): Scenario {
  const r = rng(seed);
  const damagedIdx = Math.floor(r() * SKUS.length);
  let shortIdx = Math.floor(r() * SKUS.length);
  if (shortIdx === damagedIdx) shortIdx = (shortIdx + 2) % SKUS.length;
  const inbound: Inbound[] = SKUS.map((s, i) => {
    const units = Math.round((s.demand * (1.05 + r() * 0.15)) / 20) * 20;
    const issue: InboundIssue = i === damagedIdx ? "damaged" : i === shortIdx ? "short-life" : "ok";
    return {
      sku: s.id,
      units,
      batch: `EB-${(seed % 900) + 100}-${String.fromCharCode(65 + i)}`,
      lifeLeft: issue === "short-life" ? 9 + Math.floor(r() * 6) : Math.round(s.shelf * (0.75 + r() * 0.2)),
      damaged: issue === "damaged" ? 40 + Math.floor(r() * 4) * 20 : 0,
      issue,
      temp: issue === "ok" || issue === "damaged" ? 22 + Math.round(r() * 4) : 24 + Math.round(r() * 3),
    };
  });
  const forecast: Scenario["forecast"] = {};
  for (const s of SKUS) {
    forecast[s.id] = {} as Record<ChId, number>;
    CH_IDS.forEach((c, k) => {
      // whole master cartons (20 packs), so every channel needs a round number of boxes
      forecast[s.id][c] = Math.max(20, Math.round((s.demand * s.mix[k] * (0.85 + r() * 0.3)) / 20) * 20);
    });
  }
  const events = EVENTS.map((e) => ({ id: e.id, n: Math.round((e.id === "dark" ? 60 + r() * 50 : e.id === "damage" ? 30 + r() * 30 : e.id === "gifting" ? 150 + r() * 100 : 80 + r() * 80) / 10) * 10 }));
  const names = ["Riya (D2C)", "Marketplace FC Jaipur", "Dark store, Bengaluru", "Infotech Ltd (corporate)", "Kabir (D2C subscriber)", "Dark store, Pune"];
  const orders: Order[] = [
    { id: "o1", ch: "d2c", sku: "ladoo24", qty: 60 + Math.round(r() * 4) * 10, deadlineH: 96, customer: names[0] },
    { id: "o2", ch: "mkt", sku: "namkeen", qty: 160 + Math.round(r() * 6) * 10, deadlineH: 48, customer: names[1] },
    { id: "o3", ch: "qc", sku: "chips", qty: 80 + Math.round(r() * 4) * 10, deadlineH: 6, customer: names[2] },
    { id: "o4", ch: "b2b", sku: "hamper", qty: 120 + Math.round(r() * 6) * 10, deadlineH: 72, customer: names[3] },
    { id: "o5", ch: "d2c", sku: "nutmix", qty: 50 + Math.round(r() * 4) * 10, deadlineH: 120, customer: names[4] },
    { id: "o6", ch: "qc", sku: "snackbox", qty: 40 + Math.round(r() * 4) * 10, deadlineH: 8, customer: names[5] },
  ];
  return { inbound, forecast, events, orders };
}

export const rightChoice = (b: Inbound): ReceiveChoice => (b.issue === "damaged" ? "reject-damaged" : b.issue === "short-life" ? "qc-only" : "accept");

/** Usable stock per SKU after the student's receiving decisions. Damaged cartons accepted by mistake stay in stock but count as damage later. */
export function stockAfter(sc: Scenario, recv: Record<string, ReceiveChoice>) {
  const out: Record<string, { units: number; qcOnly: boolean; badAccepted: number; lifeLeft: number }> = {};
  for (const b of sc.inbound) {
    const c = recv[b.sku];
    out[b.sku] = {
      units: c === "reject-damaged" ? b.units - b.damaged : b.units,
      qcOnly: b.issue === "short-life",
      badAccepted: b.issue === "damaged" && c !== "reject-damaged" ? b.damaged : 0,
      lifeLeft: b.lifeLeft,
    };
  }
  return out;
}

/* ── stage 3: allocation ───────────────────────────────────── */
export type Alloc = Record<string, Record<ChId, number>>;
export type Packs = Partial<Record<ChId, PackId>>;
export type WeekResult = {
  rows: { sku: string; ch: ChId; forecast: number; alloc: number; delivered: number; missed: number; damaged: number; expired: number; excess: number }[];
  forecast: number;
  /** demand that no plan can serve: channels the batch's shelf life rules out, or more than the stock on hand */
  impossible: number;
  delivered: number;
  missed: number;
  damaged: number;
  expired: number;
  reserve: Record<string, number>;
  overAllocated: string[];
  fill: number;
  waste: number;
};

export function runWeek(sc: Scenario, stock: ReturnType<typeof stockAfter>, alloc: Alloc, packs: Packs): WeekResult {
  const rows: WeekResult["rows"] = [];
  const reserve: Record<string, number> = {};
  const overAllocated: string[] = [];
  for (const s of SKUS) {
    const st = stock[s.id];
    const total = CH_IDS.reduce((a, c) => a + (alloc[s.id]?.[c] ?? 0), 0);
    if (total > st.units) overAllocated.push(s.id);
    // if over-allocated, every channel only gets its share of what physically exists
    const scale = total > st.units ? st.units / total : 1;
    reserve[s.id] = Math.max(0, st.units - total);
    for (const c of CH_IDS) {
      const f = sc.forecast[s.id][c];
      const a = Math.floor((alloc[s.id]?.[c] ?? 0) * scale);
      const tooOld = st.lifeLeft < CHANNELS[c].minLife;
      const expiredUnits = tooOld ? a : c === "qc" ? Math.round(Math.max(0, a - f) * 0.3) : 0;
      const usable = a - expiredUnits;
      const sold = Math.min(usable, f);
      const dmgRate = damageRate(c, packs[c] ?? null, s.fragile) + (st.badAccepted > 0 ? 0.05 : 0);
      const damaged = Math.round(sold * dmgRate);
      rows.push({ sku: s.id, ch: c, forecast: f, alloc: a, delivered: sold - damaged, missed: Math.max(0, f - sold) + damaged, damaged, expired: expiredUnits, excess: Math.max(0, usable - f) });
    }
  }
  const sum = (k: "forecast" | "delivered" | "missed" | "damaged" | "expired") => rows.reduce((a, x) => a + x[k], 0);
  const forecast = sum("forecast");
  const delivered = sum("delivered");
  const totalStock = SKUS.reduce((a, s) => a + stock[s.id].units, 0);
  // the fill rate is measured against what a good plan COULD deliver: demand in channels the shelf life allows,
  // capped at the stock that is actually on the shelf
  const possible = SKUS.reduce((a, s) => {
    const open = CH_IDS.filter((c) => stock[s.id].lifeLeft >= CHANNELS[c].minLife).reduce((b, c) => b + sc.forecast[s.id][c], 0);
    return a + Math.min(open, stock[s.id].units);
  }, 0);
  return { rows, forecast, impossible: forecast - possible, delivered, missed: sum("missed"), damaged: sum("damaged"), expired: sum("expired"), reserve, overAllocated, fill: possible ? Math.min(1, delivered / possible) : 0, waste: totalStock ? (sum("damaged") + sum("expired")) / totalStock : 0 };
}

/* ── stage 4: disruptions ──────────────────────────────────── */
export type EventOutcome = { recovered: number; late: number; lost: number; unsafe: boolean; tokens: { overtime: number; expedite: number }; flag?: string; note: string };
export const TOKENS = { overtime: 2, expedite: 2 };

export function resolveEvent(evId: string, n: number, optId: string, pool: { reserve: number; free: number; surplus: number; hold: number }): EventOutcome {
  const ev = EVENTS.find((e) => e.id === evId)!;
  const o = ev.options.find((x) => x.id === optId)!;
  const want = Math.round(n * o.cap);
  let avail = 0;
  for (const s of o.src) avail += s === "inbound" ? Math.round(n * 0.7) : pool[s as keyof typeof pool] ?? 0;
  const got = o.src.length ? Math.min(want, avail) : evId === "courier" ? want : 0;
  const onTime = o.delay <= ev.deadlineH;
  const recovered = o.unsafe ? 0 : onTime ? got : 0;
  const late = o.unsafe ? 0 : onTime ? 0 : got;
  const lost = Math.max(0, n - recovered - late);
  const parts: string[] = [];
  if (o.unsafe) parts.push("Repacking torn inner packs is a food-safety risk: the marketplace and customers would see damaged food. Nothing usable was recovered.");
  else if (!o.src.length && evId !== "courier") parts.push(`No action: all ${n} ${ev.unit} are lost.`);
  else {
    if (o.src.length && avail < want) parts.push(`Only ${avail} units were available from ${o.src.join(" + ")}, so ${want - avail} could not be covered.`);
    parts.push(onTime ? `${recovered} ${ev.unit} handled within the ${ev.deadlineH}-hour window.` : `It takes about ${o.delay} hours, beyond the ${ev.deadlineH}-hour window, so ${late} arrive late.`);
    if (o.cap < 1) parts.push(`This option only covers about ${Math.round(o.cap * 100)}% of the problem.`);
  }
  if (o.src.includes("hold")) parts.push("Taking stock earmarked for marketplaces means some marketplace orders now go unfilled.");
  if (o.flag === "packaging") parts.push("Packaging standard upgraded: fewer damages in the final mission.");
  if (o.flag === "reorder") parts.push("Reorder trigger set: dark stores top up automatically in the final mission.");
  if (o.flag === "courier") parts.push("Backup courier on contract: one free express upgrade in the final mission.");
  return { recovered, late, lost, unsafe: !!o.unsafe, tokens: { overtime: o.overtime ?? 0, expedite: o.expedite ?? 0 }, flag: o.flag, note: parts.join(" ") };
}

/* ── stage 5: final mission ────────────────────────────────── */
export type MissionPlan = { order: string[]; express: string[] };
export type MissionRow = { id: string; ch: ChId; sku: string; qty: number; shipped: number; packedAtH: number; arriveH: number; deadlineH: number; onTime: boolean; damaged: number };
export function runMission(sc: Scenario, stockLeft: Record<string, number>, plan: MissionPlan, flags: string[]) {
  const left = { ...stockLeft };
  if (flags.includes("reorder")) for (const o of sc.orders) if (o.ch === "qc") left[o.sku] = (left[o.sku] ?? 0) + Math.round(o.qty * 0.5);
  let clock = 0;
  const rows: MissionRow[] = [];
  for (const id of plan.order) {
    const o = sc.orders.find((x) => x.id === id)!;
    const shipped = Math.max(0, Math.min(o.qty, left[o.sku] ?? 0));
    left[o.sku] = (left[o.sku] ?? 0) - shipped;
    clock += shipped / MISSION.packRate;
    const t = plan.express.includes(id) ? MISSION.transit[o.ch].express : MISSION.transit[o.ch].standard;
    const arrive = clock + t;
    const dmg = Math.round(shipped * (flags.includes("packaging") ? 0.005 : SKU[o.sku].fragile ? 0.03 : 0.015));
    rows.push({ id, ch: o.ch, sku: o.sku, qty: o.qty, shipped, packedAtH: +clock.toFixed(1), arriveH: +arrive.toFixed(1), deadlineH: o.deadlineH, onTime: shipped > 0 && arrive <= o.deadlineH, damaged: dmg });
  }
  const units = rows.reduce((a, r) => a + r.qty, 0);
  const shipped = rows.reduce((a, r) => a + r.shipped, 0);
  const onTimeUnits = rows.filter((r) => r.onTime).reduce((a, r) => a + r.shipped - r.damaged, 0);
  return { rows, units, shipped, onTimeOrders: rows.filter((r) => r.onTime && r.shipped === r.qty).length, onTimeRate: units ? onTimeUnits / units : 0, damaged: rows.reduce((a, r) => a + r.damaged, 0) };
}
