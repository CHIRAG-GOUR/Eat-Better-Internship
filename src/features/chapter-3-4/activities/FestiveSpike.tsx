"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { CalendarDays, Calculator, Check, PackageCheck, Truck } from "lucide-react";
import { CheckRow, GameFrame, starsFor, type Feedback } from "@/components/play/GameFrame";
import { NumIn, Practice, Row, fmt, near, num, pick, words } from "./shared";

/**
 * Activity 2 · Diwali Surge Planner — the chapter's "managing festive demand spikes" challenge.
 * Research basis: capacity planning as taught in operations courses (demand per day ÷ throughput per shift = shifts
 * needed; capacity gap = demand − capacity) and the backward-scheduled order cut-off used by e-commerce teams
 * (delivery date − transit − dispatch time). The student types every number from randomised practice data; the
 * delivery window used for the cut-off is the chapter's own "2–5 days (pan-India)". A written plan is checked live
 * against the student's own numbers, so it cannot be copied from anywhere.
 */

function makeRound() {
  const normal = pick([400, 500, 600]);
  const mult = pick([3, 4, 5]);
  const perDay = normal * mult;
  const days = pick([10, 12, 14]);
  const forecast = perDay * days;
  const perShift = pick([600, 800, 1000]);
  const shifts = Math.ceil(perDay / perShift);
  const courier = perDay - pick([200, 300, 400]);
  const dispatch = pick([1, 2]);
  const diwali = pick([18, 20, 22, 24]);
  const transit = 5; // slowest pan-India leg from the chapter's matrix (2–5 days)
  const cutoff = diwali - transit - dispatch;
  return { normal, mult, perDay, days, forecast, perShift, shifts, courier, gap: perDay - courier, dispatch, diwali, transit, cutoff };
}

export default function FestiveSpike({ onDone }: { onDone: (summary: string) => void }) {
  const [G, setG] = useState(makeRound);
  const [step, setStep] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [hint, setHint] = useState(0);
  const [fb, setFb] = useState<Feedback>(null);
  const [a, setA] = useState({ perDay: "", mult: "", shifts: "", gap: "", cutoff: "" });
  const [plan, setPlan] = useState("");
  const set = (k: keyof typeof a) => (v: string) => setA((s) => ({ ...s, [k]: v }));

  const reset = () => {
    setG(makeRound());
    setStep(0);
    setMistakes(0);
    setHint(0);
    setFb(null);
    setA({ perDay: "", mult: "", shifts: "", gap: "", cutoff: "" });
    setPlan("");
  };
  const wrong = (text: string) => {
    setMistakes((m) => m + 1);
    setHint((h) => h + 1);
    setFb({ tone: "bad", text });
  };

  const check1 = () => {
    if (!near(num(a.perDay), G.perDay)) return wrong(hint === 0 ? `Orders per day during the spike = forecast orders ÷ days in the window. ${fmt(G.forecast)} ÷ ${G.days} = ?` : `${fmt(G.forecast)} ÷ ${G.days} = ${fmt(G.perDay)} orders a day.`);
    if (!near(num(a.mult), G.mult)) return wrong(`How many times the normal day is that? ${fmt(G.perDay)} ÷ ${G.normal} = ?`);
    setHint(0);
    setStep(1);
    setFb({ tone: "good", text: `${fmt(G.perDay)} orders a day is ${G.mult}× a normal day. Packing and couriers were sized for ${G.normal}. Now see what breaks.` });
  };
  const check2 = () => {
    if (num(a.shifts) !== G.shifts) return wrong(hint === 0 ? `One packing shift handles ${G.perShift} orders. Shifts needed = ${fmt(G.perDay)} ÷ ${G.perShift}, rounded UP (you can't run part of a shift).` : `${fmt(G.perDay)} ÷ ${G.perShift} = ${fmt(G.perDay / G.perShift)}, so ${G.shifts} shifts a day.`);
    if (!near(num(a.gap), G.gap)) return wrong(hint === 0 ? `Couriers can pick up ${fmt(G.courier)} parcels a day. How many packed parcels would be left behind each day? ${fmt(G.perDay)} − ${fmt(G.courier)} = ?` : `${fmt(G.perDay)} − ${fmt(G.courier)} = ${fmt(G.gap)} parcels a day with no courier.`);
    setHint(0);
    setStep(2);
    setFb({ tone: "good", text: `${G.shifts} packing shifts a day instead of 1, and ${fmt(G.gap)} extra courier pickups a day — or ${fmt(G.gap * G.days)} parcels pile up over the ${G.days} days. Both have to scale together.` });
  };
  const check3 = () => {
    if (num(a.cutoff) !== G.cutoff) return wrong(hint === 0 ? `Count backwards from Diwali (day ${G.diwali}). Pan-India delivery takes up to ${G.transit} days (the chapter's matrix) and packing takes ${G.dispatch} day${G.dispatch > 1 ? "s" : ""} to dispatch. ${G.diwali} − ${G.transit} − ${G.dispatch} = ?` : `${G.diwali} − ${G.transit} − ${G.dispatch} = day ${G.cutoff}.`);
    setHint(0);
    setStep(3);
    setFb({ tone: "good", text: `Orders placed after day ${G.cutoff} can't be promised for Diwali on the slowest routes. That is the "order by" date to show customers.` });
  };

  const checks = useMemo(() => {
    const t = plan;
    const n = words(t);
    return [
      { ok: new RegExp(`\\b${G.shifts}\\b`).test(t) && /shift/i.test(t), label: `Says how many packing shifts a day (${G.shifts})`, hint: "Use the number of shifts you worked out." },
      { ok: /(courier|pickup|pick-up|delivery partner|logistics partner)/i.test(t) && new RegExp(`\\b${G.gap}\\b`).test(t), label: `Books the extra courier capacity (${fmt(G.gap)} a day)`, hint: "Name the extra parcels a day the couriers must take." },
      { ok: new RegExp(`day\\s*${G.cutoff}\\b`, "i").test(t), label: `Tells customers the order-by day (day ${G.cutoff})`, hint: "Write it as “day N”." },
      { ok: /(error|mistake|check|quality|double-?check|accura)/i.test(t), label: "Protects against errors while scaling", hint: "The chapter warns about high error rates. How will you keep packing accurate?" },
      { ok: n >= 20 && n <= 90, label: "20–90 words", hint: `${n} words so far.` },
    ];
  }, [plan, G]);
  const ok = checks.every((c) => c.ok);
  const finish = () => {
    setStep(4);
    setFb({ tone: "good", text: "That is a surge plan: demand per day, packing shifts, courier capacity and a customer cut-off, all from your own numbers." });
    onDone(`Diwali Surge Planner: practice forecast ${fmt(G.forecast)} orders over ${G.days} days = ${fmt(G.perDay)}/day (${G.mult}× normal); ${G.shifts} packing shifts/day; +${fmt(G.gap)} courier pickups/day; order-by day ${G.cutoff} for Diwali on day ${G.diwali} (${mistakes} ${mistakes === 1 ? "mistake" : "mistakes"}). My plan: “${plan.trim()}”`);
  };

  // simple bar chart: normal vs spike vs capacities
  const maxV = Math.max(G.perDay, G.perShift * 2, G.courier) * 1.1;
  const bars = [
    { label: "Normal day", v: G.normal, cls: "bg-cocoa/40" },
    { label: "Spike day", v: G.perDay, cls: "bg-orange" },
    { label: "1 packing shift", v: G.perShift, cls: "bg-cocoa" },
    { label: "Courier pickups", v: G.courier, cls: "bg-[#2E7D6B]" },
  ];

  return (
    <GameFrame
      calculator
      kicker="Activity 2 · Diwali Surge Planner"
      title="Scale packing, couriers and the promise"
      mission="Practice scenario: a Diwali order forecast lands on your desk. Work out the daily surge, how many packing shifts and courier pickups it needs, and the last day a customer can order and still get it by Diwali. Then write the plan."
      steps={["Size the surge", "Scale the operation", "Set the cut-off", "Write the plan"]}
      step={step}
      stars={step === 4 ? starsFor(mistakes) : undefined}
      onReset={reset}
      feedback={fb}
      note={{
        real: "The challenge is from this chapter: Rakhi and Diwali surges mean scaling warehousing throughput, packaging speed and courier capacity without high error rates. The 2–5 day pan-India delivery time is from the chapter's channel matrix.",
        practice: "The forecast, normal volume, shift capacity, courier capacity and calendar days are made up for practice and change every restart. They are not Eat Better data.",
        tip: "Round shifts UP. Count the cut-off backwards from the festival: delivery days + packing days.",
      }}
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,320px)_minmax(0,1fr)] lg:items-start">
        <div className="grid content-start gap-3">
          <Practice
            title="Surge desk"
            rows={[
              ["Normal orders a day", `${fmt(G.normal)}`],
              ["Diwali forecast", `${fmt(G.forecast)} orders`],
              ["Spike window", `${G.days} days`],
              ["One packing shift packs", `${fmt(G.perShift)} orders`],
              ["Courier pickups a day", `${fmt(G.courier)} parcels`],
              ["Packing to dispatch", `${G.dispatch} day${G.dispatch > 1 ? "s" : ""}`],
              ["Diwali is on", `day ${G.diwali}`],
            ]}
          />
          <div className="rounded-2xl bg-white p-3 ring-1 ring-cocoa/10">
            <div className="text-[0.75rem] font-extrabold uppercase tracking-[0.1em] text-cocoa-2">Orders a day vs capacity</div>
            <div className="mt-2 grid gap-1.5">
              {bars.map((b) => (
                <div key={b.label} className="grid grid-cols-[110px_1fr_auto] items-center gap-2 text-[0.85rem] text-cocoa">
                  <span className="truncate">{b.label}</span>
                  <div className="h-3 rounded-full bg-cream">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${(b.v / maxV) * 100}%` }} className={`h-full rounded-full ${b.cls}`} />
                  </div>
                  <span className="tabular-nums font-bold">{fmt(b.v)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="min-w-0">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="grid gap-3">
                <Row q="Orders per day during the spike">
                  <NumIn value={a.perDay} onChange={set("perDay")} unit="orders" label="Orders per day during the spike" />
                </Row>
                <Row q="How many times a normal day is that?">
                  <NumIn value={a.mult} onChange={set("mult")} unit="× normal" label="Times a normal day" w="w-20" />
                </Row>
                <button onClick={check1} className="eb-btn eb-btn-primary self-start !normal-case">
                  <Calculator className="size-4" /> Check
                </button>
              </motion.div>
            )}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="grid gap-3">
                <Row q="Packing shifts needed each day (whole shifts)">
                  <span className="flex items-center gap-2">
                    <PackageCheck className="size-4 text-orange" />
                    <NumIn value={a.shifts} onChange={set("shifts")} unit="shifts" label="Packing shifts per day" w="w-20" />
                  </span>
                </Row>
                <Row q="Packed parcels left behind each day by the couriers">
                  <span className="flex items-center gap-2">
                    <Truck className="size-4 text-orange" />
                    <NumIn value={a.gap} onChange={set("gap")} unit="parcels" label="Parcels left behind per day" />
                  </span>
                </Row>
                <button onClick={check2} className="eb-btn eb-btn-primary self-start !normal-case">
                  <Calculator className="size-4" /> Check
                </button>
              </motion.div>
            )}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="grid gap-3">
                <div className="rounded-2xl bg-peach/70 p-4 text-[0.98rem] text-cocoa">
                  <div className="flex items-center gap-2 font-display text-[1.1rem] font-semibold">
                    <CalendarDays className="size-5 text-orange" /> Counting backwards
                  </div>
                  Diwali is on day {G.diwali}. The chapter&apos;s matrix says website orders take 2–5 days pan-India; plan for the slowest route. Packing takes {G.dispatch} day{G.dispatch > 1 ? "s" : ""} before dispatch.
                </div>
                <div className="flex flex-wrap gap-1">
                  {Array.from({ length: G.diwali }, (_, i) => i + 1).map((d) => (
                    <span key={d} className={`grid size-8 place-items-center rounded-lg text-[0.8rem] font-bold ${d === G.diwali ? "bg-orange text-white" : d > G.diwali - G.transit ? "bg-cocoa/15 text-cocoa" : d > G.cutoff ? "bg-haldi/40 text-cocoa" : "bg-cream text-cocoa"}`}>
                      {d}
                    </span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-x-4 gap-y-1 text-[0.8rem] font-bold text-cocoa-2">
                  <span><span className="mr-1 inline-block size-3 rounded bg-orange align-middle" />Diwali</span>
                  <span><span className="mr-1 inline-block size-3 rounded bg-cocoa/15 align-middle" />in transit</span>
                  <span><span className="mr-1 inline-block size-3 rounded bg-haldi/40 align-middle" />packing</span>
                </div>
                <Row q="Last day a customer can order for Diwali delivery">
                  <NumIn value={a.cutoff} onChange={set("cutoff")} prefix="day" label="Order-by day" w="w-20" />
                </Row>
                <button onClick={check3} className="eb-btn eb-btn-primary self-start !normal-case">
                  <Calculator className="size-4" /> Check
                </button>
              </motion.div>
            )}
            {step >= 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {[`${fmt(G.perDay)} orders a day (${G.mult}× normal) for ${G.days} days`, `${G.shifts} packing shifts a day`, `+${fmt(G.gap)} courier pickups a day`, `Order by day ${G.cutoff} for Diwali (day ${G.diwali})`].map((t) => (
                    <div key={t} className="rounded-xl bg-success/10 px-3 py-2 text-[0.92rem] text-cocoa">
                      {t}
                    </div>
                  ))}
                </div>
                <label htmlFor="fs-plan" className="mt-4 block text-[0.85rem] font-extrabold uppercase tracking-[0.1em] text-orange">
                  Your surge plan
                </label>
                <textarea id="fs-plan" value={plan} disabled={step === 4} onChange={(e) => setPlan(e.target.value)} rows={4} placeholder="For the Diwali spike we will run … shifts a day, book … extra courier pickups, tell customers to order by day …, and …" className="mt-1 w-full rounded-2xl border border-line-strong bg-cream/50 px-4 py-3 text-[1.02rem] leading-relaxed text-cocoa outline-none focus:border-orange" />
                <ul className="mt-2 grid gap-1.5">
                  {checks.map((c) => (
                    <CheckRow key={c.label} {...c} />
                  ))}
                </ul>
                {step === 3 && (
                  <button disabled={!ok} onClick={finish} className="eb-btn eb-btn-primary mt-4 !normal-case">
                    <Check className="size-4" /> Submit my plan
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </GameFrame>
  );
}
