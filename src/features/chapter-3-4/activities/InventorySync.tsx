"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, Calculator, Check, Clock3, Store, Truck, Warehouse } from "lucide-react";
import { GameFrame, starsFor, type Feedback } from "@/components/play/GameFrame";
import { NumIn, Practice, Row, fmt, near, num, pick } from "./shared";

/**
 * Activity 1 · Stock Sync Board — the chapter's "omnichannel inventory synchronization" challenge.
 * Research basis: dark-store replenishment practice works in days of cover (stock ÷ daily sales) with a minimum cover
 * until the next truck and a maximum set by shelf life / platform freshness rules. The student first READS cover from
 * the board (typed), then ALLOCATES one truck load across three dark stores by typing units; the board shows live cover
 * bars but the check only passes when every store clears both limits. Practice numbers are random on every restart, and an
 * equal split always breaks at least one store, so the only way through is to size each store by its own demand.
 */

type StoreRow = { id: string; name: string; daily: number; stock: number };
function makeRound() {
  const dailies = [pick([6, 8, 10]), pick([14, 16, 20]), pick([28, 32, 40])].sort(() => Math.random() - 0.5);
  const R = pick([4, 5, 6]); // days until the next truck
  const W = R + pick([3, 4, 5]); // sell-by window in days (practice)
  const names = ["Dark store A", "Dark store B", "Dark store C"];
  const stores: StoreRow[] = dailies.map((d, i) => ({ id: "ABC"[i], name: names[i], daily: d, stock: d * (1 + Math.floor(Math.random() * (R - 1))) }));
  const need = stores.map((s) => Math.max(0, s.daily * R - s.stock));
  const cap = stores.map((s) => s.daily * W - s.stock);
  const minNeed = need.reduce((a, b) => a + b, 0);
  const maxAllowed = cap.reduce((a, b) => a + b, 0);
  const load = Math.round(minNeed + (maxAllowed - minNeed) * (0.35 + Math.random() * 0.35));
  const warehouse = pick([1200, 1500, 1800]);
  return { stores, R, W, load, warehouse, need, cap };
}

export default function InventorySync({ onDone }: { onDone: (summary: string) => void }) {
  const [G, setG] = useState(makeRound);
  const [step, setStep] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [hint, setHint] = useState(0);
  const [fb, setFb] = useState<Feedback>(null);
  const [cover, setCover] = useState<Record<string, string>>({});
  const [send, setSend] = useState<Record<string, string>>({});
  const [capAns, setCapAns] = useState("");
  const [result, setResult] = useState<string[]>([]);

  const reset = () => {
    setG(makeRound());
    setStep(0);
    setMistakes(0);
    setHint(0);
    setFb(null);
    setCover({});
    setSend({});
    setCapAns("");
    setResult([]);
  };
  const wrong = (text: string) => {
    setMistakes((m) => m + 1);
    setHint((h) => h + 1);
    setFb({ tone: "bad", text });
  };

  // Step 1 — read days of cover today
  const checkCover = () => {
    for (const s of G.stores) {
      const want = s.stock / s.daily;
      if (!near(num(cover[s.id] ?? ""), want)) return wrong(hint === 0 ? `${s.name}: days of cover = units in stock ÷ units sold per day. ${s.stock} ÷ ${s.daily} = ?` : `${s.name}: ${s.stock} ÷ ${s.daily} = ${fmt(want)} days.`);
    }
    const short = G.stores.filter((s) => s.stock / s.daily < G.R).map((s) => s.name);
    setHint(0);
    setStep(1);
    setFb({ tone: "good", text: `The next truck arrives in ${G.R} days${short.length ? `, so ${short.join(" and ")} will run out before it comes` : ""}. Now load the truck.` });
  };

  // Step 2 — allocate the truck
  const sent = (id: string) => num(send[id] ?? "") || 0;
  const total = G.stores.reduce((a, s) => a + sent(s.id), 0);
  const after = (s: StoreRow) => (s.stock + sent(s.id)) / s.daily;
  const liveStatus = (s: StoreRow) => {
    const c = after(s);
    if (c < G.R) return { k: "out" as const, text: `runs out on day ${Math.floor(c) + 1}` };
    if (c > G.W) return { k: "exp" as const, text: `${Math.ceil((c - G.W) * s.daily)} units expire` };
    return { k: "ok" as const, text: `${fmt(c)} days of cover` };
  };
  const checkAlloc = () => {
    if (total > G.load) return wrong(`The truck carries ${G.load} units and you have loaded ${total}. Take some off.`);
    const bad = G.stores.map((s) => ({ s, st: liveStatus(s) })).filter((x) => x.st.k !== "ok");
    if (bad.length) {
      const b = bad[0];
      if (b.st.k === "out") return wrong(hint === 0 ? `${b.s.name} sells ${b.s.daily} a day and the next truck is ${G.R} days away. It needs at least ${b.s.daily} × ${G.R} = ${b.s.daily * G.R} units in total. It has ${b.s.stock}; how many more is that?` : `${b.s.name} needs at least ${b.s.daily * G.R - b.s.stock} more units to last ${G.R} days.`);
      return wrong(hint === 0 ? `${b.s.name} can only sell ${b.s.daily} × ${G.W} = ${b.s.daily * G.W} units within the ${G.W}-day window. Anything above that expires on the shelf.` : `${b.s.name} can take at most ${b.s.daily * G.W - b.s.stock} more units without expiry.`);
    }
    const left = G.load - total;
    setHint(0);
    setStep(2);
    setResult(G.stores.map((s) => `${s.name}: +${sent(s.id)} → ${fmt(after(s))} days`));
    setFb({ tone: "good", text: `Every dark store now lasts until the next truck and nothing expires. ${left > 0 ? `${left} units stay in the central warehouse for website and marketplace orders, where they ship within days instead of sitting on a dark-store shelf.` : "The whole load was needed."}` });
  };

  // Step 3 — the rule: maximum a store can hold
  const big = G.stores.reduce((a, b) => (a.daily > b.daily ? a : b));
  const smallest = G.stores.reduce((a, b) => (a.daily < b.daily ? a : b));
  const maxHold = smallest.daily * G.W;
  const checkRule = () => {
    if (!near(num(capAns), maxHold)) return wrong(hint === 0 ? `Most units a store can hold without expiry = units sold per day × days in the sell-by window. ${smallest.name}: ${smallest.daily} × ${G.W} = ?` : `${smallest.daily} × ${G.W} = ${maxHold} units.`);
    setStep(3);
    setFb({ tone: "good", text: `${smallest.name} can never hold more than ${maxHold} units, while ${big.name} can hold ${big.daily * G.W}. Same snack, same window, very different limits: that is why stock has to be synchronised per store, not split evenly.` });
    onDone(`Stock Sync Board: read days of cover for 3 practice dark stores; loaded a ${G.load}-unit truck so every store lasts ${G.R} days with no expiry inside a ${G.W}-day window (${result.join("; ")}); max hold for the slowest store = ${maxHold} units (${mistakes} ${mistakes === 1 ? "mistake" : "mistakes"}).`);
  };

  const equalSplit = useMemo(() => Math.floor(G.load / 3), [G.load]);

  return (
    <GameFrame
      calculator
      kicker="Activity 1 · Stock Sync Board"
      title="Load the truck without a stockout or an expiry"
      mission="Practice scenario: one snack, a central warehouse and three quick-commerce dark stores. Work out how long each store's stock lasts, then split one truck load so every store lasts until the next delivery and nothing expires. The numbers change every restart."
      steps={["Read the cover", "Load the truck", "Find the limit"]}
      step={step}
      stars={step === 3 ? starsFor(mistakes) : undefined}
      onReset={reset}
      feedback={fb}
      note={{
        real: "The challenge is from this chapter: balance stock between central warehouses (D2C/marketplaces) and hyper-local dark stores (quick commerce) to prevent stockouts while avoiding over-allocation and shelf-life expiration.",
        practice: "Dark stores A–C, their daily sales, stock, the truck load and the sell-by window are made up for practice and change every restart. They are not Eat Better data.",
        tip: "Days of cover = units in stock ÷ units sold per day. Minimum cover = days until the next truck. Maximum cover = the sell-by window.",
      }}
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:items-start">
        <div className="grid content-start gap-3">
          <Practice
            title="Stock board"
            rows={[
              ["Central warehouse stock", `${fmt(G.warehouse)} units`],
              ["Truck to dark stores carries", `${G.load} units`],
              ["Next truck in", `${G.R} days`],
              ["Must sell within (sell-by window)", `${G.W} days`],
            ]}
          />
          <div className="flex items-start gap-2 rounded-2xl bg-peach/70 p-3 text-[0.92rem] text-cocoa">
            <Warehouse className="mt-0.5 size-4 shrink-0 text-orange" />
            Units left on the truck go back to the central warehouse, where website and marketplace orders ship in 1–5 days.
          </div>
        </div>

        <div className="min-w-0">
          <div className="grid gap-3 sm:grid-cols-3">
            {G.stores.map((s) => {
              const st = step >= 1 ? liveStatus(s) : null;
              const c = step >= 1 ? after(s) : s.stock / s.daily;
              const pct = Math.min(100, (c / (G.W + 2)) * 100);
              return (
                <div key={s.id} className="rounded-2xl border-2 border-cocoa/15 bg-white p-3">
                  <div className="flex items-center gap-2 font-display text-[1.1rem] font-semibold text-cocoa">
                    <Store className="size-4 text-orange" /> {s.name}
                  </div>
                  <div className="mt-1 text-[0.92rem] text-cocoa-2">
                    Sells <strong className="text-cocoa">{s.daily}</strong> units a day · <strong className="text-cocoa">{s.stock}</strong> in stock
                  </div>
                  {/* cover bar with the two limits */}
                  <div className="relative mt-3 h-3 rounded-full bg-cream">
                    <motion.div animate={{ width: `${pct}%` }} className={`h-full rounded-full ${st?.k === "out" ? "bg-error" : st?.k === "exp" ? "bg-[#C9A400]" : step >= 1 ? "bg-success" : "bg-cocoa/40"}`} />
                    <span className="absolute top-[-4px] h-5 w-0.5 bg-cocoa" style={{ left: `${(G.R / (G.W + 2)) * 100}%` }} title="next truck" />
                    <span className="absolute top-[-4px] h-5 w-0.5 bg-cocoa" style={{ left: `${(G.W / (G.W + 2)) * 100}%` }} title="sell-by" />
                  </div>
                  <div className="mt-1 flex justify-between text-[0.72rem] font-bold text-cocoa-2">
                    <span>0</span>
                    <span>truck · day {G.R}</span>
                    <span>sell-by · day {G.W}</span>
                  </div>
                  {step === 0 && (
                    <div className="mt-3 flex items-center justify-between gap-2 text-[0.9rem] font-bold text-cocoa-2">
                      Cover today
                      <NumIn value={cover[s.id] ?? ""} onChange={(v) => setCover((c) => ({ ...c, [s.id]: v }))} unit="days" label={`${s.name} days of cover`} w="w-20" />
                    </div>
                  )}
                  {step >= 1 && (
                    <>
                      <div className="mt-3 flex items-center justify-between gap-2 text-[0.9rem] font-bold text-cocoa-2">
                        <span className="flex items-center gap-1">
                          <Truck className="size-4" /> Send
                        </span>
                        <NumIn value={send[s.id] ?? ""} onChange={(v) => setSend((c) => ({ ...c, [s.id]: v }))} unit="units" label={`Units to send to ${s.name}`} w="w-20" disabled={step >= 2} />
                      </div>
                      {st && (
                        <div className={`mt-2 flex items-center gap-1.5 text-[0.88rem] font-bold ${st.k === "out" ? "text-error" : st.k === "exp" ? "text-[#9A7B00]" : "text-success"}`}>
                          {st.k === "ok" ? <Check className="size-4" /> : st.k === "out" ? <AlertTriangle className="size-4" /> : <Clock3 className="size-4" />}
                          {st.text}
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })}
          </div>

          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-4">
                <button onClick={checkCover} className="eb-btn eb-btn-primary !normal-case">
                  <Calculator className="size-4" /> Check the cover
                </button>
              </motion.div>
            )}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="mt-4 flex flex-wrap items-center gap-3">
                <span className={`rounded-full px-3 py-1 text-[0.9rem] font-bold ${total > G.load ? "bg-error/10 text-error" : "bg-cream text-cocoa"}`}>
                  Loaded {total} / {G.load} units
                </span>
                <button onClick={checkAlloc} className="eb-btn eb-btn-primary !normal-case">
                  <Truck className="size-4" /> Send the truck
                </button>
                <span className="text-[0.88rem] text-cocoa-2">An equal split would be {equalSplit} each. Does that work for every store?</span>
              </motion.div>
            )}
            {step >= 2 && (
              <motion.div key="s2" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mt-4">
                <Row q={`Most units ${smallest.name} could ever hold without expiry (${smallest.daily} a day, ${G.W}-day window)`}>
                  <span className="flex items-center gap-2">
                    <NumIn value={capAns} onChange={setCapAns} unit="units" label="Maximum units without expiry" disabled={step === 3} />
                    {step === 2 && (
                      <button onClick={checkRule} className="eb-btn eb-btn-primary !normal-case">
                        <Check className="size-4" /> Check
                      </button>
                    )}
                  </span>
                </Row>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </GameFrame>
  );
}
