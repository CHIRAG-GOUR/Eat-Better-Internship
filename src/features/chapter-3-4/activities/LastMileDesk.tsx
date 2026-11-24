"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Banknote, Calculator, Check, PackageX, Receipt } from "lucide-react";
import { CheckRow, GameFrame, starsFor, type Feedback } from "@/components/play/GameFrame";
import { NumIn, Practice, Row, fmt, near, num, pick, words } from "./shared";

/**
 * Activity 3 · Last-Mile Cost Desk — the chapter's "last-mile fulfilment costs" challenge.
 * Research basis: Indian D2C logistics guides measure shipping as a share of AOV and cost an RTO as the forward trip +
 * the return trip, scaled by the COD RTO rate; the usual fixes are a free-shipping threshold, bundles/combos to lift
 * AOV, and nudging COD buyers to prepay. The student computes every figure from randomised practice orders (typed, with
 * tolerance), then designs a fix whose threshold number is checked against their own working.
 */

function makeRound() {
  const fwd = pick([60, 70, 80]);
  const ret = pick([50, 60]);
  const rto = pick([20, 25, 30]);
  const single = pick([99, 120, 149]);
  const combo = pick([599, 649, 749]);
  const orders = [
    { id: "A", what: "1 single pack", aov: single, pay: "Prepaid" as const },
    { id: "B", what: "2 packs", aov: single * 2, pay: "COD" as const },
    { id: "C", what: "1 combo box", aov: combo, pay: "Prepaid" as const },
  ];
  const target = pick([10, 12, 15]); // shipping as % of AOV the desk is aiming for
  return { fwd, ret, rto, orders, target, threshold: Math.ceil((fwd * 100) / target) };
}

export default function LastMileDesk({ onDone }: { onDone: (summary: string) => void }) {
  const [G, setG] = useState(makeRound);
  const [step, setStep] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [hint, setHint] = useState(0);
  const [fb, setFb] = useState<Feedback>(null);
  const [pct, setPct] = useState<Record<string, string>>({});
  const [rtoCost, setRtoCost] = useState("");
  const [per100, setPer100] = useState("");
  const [thr, setThr] = useState("");
  const [saved, setSaved] = useState("");
  const [fix, setFix] = useState("");

  const reset = () => {
    setG(makeRound());
    setStep(0);
    setMistakes(0);
    setHint(0);
    setFb(null);
    setPct({});
    setRtoCost("");
    setPer100("");
    setThr("");
    setSaved("");
    setFix("");
  };
  const wrong = (text: string) => {
    setMistakes((m) => m + 1);
    setHint((h) => h + 1);
    setFb({ tone: "bad", text });
  };

  const share = (aov: number) => (G.fwd / aov) * 100;
  const check1 = () => {
    for (const o of G.orders) {
      if (!near(num(pct[o.id] ?? ""), share(o.aov), 0.03)) return wrong(hint === 0 ? `Order ${o.id}: shipping as a share of the order = shipping cost ÷ order value × 100. ₹${G.fwd} ÷ ₹${o.aov} × 100 = ? (one decimal is fine)` : `Order ${o.id}: ${G.fwd} ÷ ${o.aov} × 100 = ${fmt(share(o.aov))}%.`);
    }
    setHint(0);
    setStep(1);
    setFb({ tone: "good", text: `Same ₹${G.fwd} courier charge, but it eats ${fmt(share(G.orders[0].aov))}% of a single pack and only ${fmt(share(G.orders[2].aov))}% of a combo. That is the low-AOV problem in one line.` });
  };

  const rtoPer = G.fwd + G.ret;
  const expected = (G.rto / 100) * rtoPer;
  const check2 = () => {
    if (!near(num(rtoCost), rtoPer)) return wrong(hint === 0 ? `A returned parcel travels twice: to the customer and back. ₹${G.fwd} + ₹${G.ret} = ?` : `₹${G.fwd} + ₹${G.ret} = ₹${rtoPer} per returned parcel, and the sale is gone too.`);
    if (!near(num(per100), expected * 100)) return wrong(hint === 0 ? `Out of 100 COD orders, ${G.rto} come back. Total return cost = ${G.rto} × ₹${rtoPer} = ?` : `${G.rto} × ₹${rtoPer} = ₹${fmt(expected * 100)} lost on every 100 COD orders.`);
    setHint(0);
    setStep(2);
    setFb({ tone: "good", text: `₹${fmt(expected * 100)} per 100 COD orders, or ₹${fmt(expected)} hidden in every COD order on average, before counting the unsold stock. Now design the fix.` });
  };

  const check3 = () => {
    if (!near(num(thr), G.threshold, 0.02)) return wrong(hint === 0 ? `You want ₹${G.fwd} shipping to be at most ${G.target}% of the order. Minimum order = ₹${G.fwd} ÷ ${G.target}%. (Divide by ${G.target}, multiply by 100.)` : `₹${G.fwd} ÷ ${G.target} × 100 = ₹${G.threshold}. Below that, charge for shipping or ask the customer to add a pack.`);
    if (!near(num(saved), (G.rto / 2) * rtoPer)) return wrong(hint === 0 ? `If a prepaid nudge turns half the COD orders prepaid, half the returns disappear: ${G.rto} ÷ 2 = ${G.rto / 2} returns avoided per 100 orders. Multiply by ₹${rtoPer}.` : `${G.rto / 2} × ₹${rtoPer} = ₹${fmt((G.rto / 2) * rtoPer)} saved per 100 orders.`);
    setHint(0);
    setStep(3);
    setFb({ tone: "good", text: `A free-shipping threshold of about ₹${G.threshold} pushes single-pack buyers to add a second pack or pick a combo, and a prepaid nudge halves the return bill. Write it up.` });
  };

  const checks = useMemo(() => {
    const t = fix;
    const n = words(t);
    return [
      { ok: new RegExp(`${G.threshold}`).test(t.replace(/,/g, "")), label: `Names the minimum order / free-shipping threshold (₹${G.threshold})`, hint: "Use the threshold you worked out." },
      { ok: /(combo|bundle|box|add a pack|second pack|two packs|2 packs|multi-?pack)/i.test(t), label: "Lifts order value with a combo or bundle", hint: "How do you get a single-pack buyer to a bigger order?" },
      { ok: /(prepaid|pre-paid|pay online|upi|online payment)/i.test(t) && /(cod|cash)/i.test(t), label: "Nudges COD buyers to prepay", hint: "Mention both COD and prepaid." },
      { ok: /(because|so that|since|which means|that way)/i.test(t), label: "Gives the reason in numbers or words", hint: "Use “because …”." },
      { ok: n >= 20 && n <= 90, label: "20–90 words", hint: `${n} words so far.` },
    ];
  }, [fix, G.threshold]);
  const ok = checks.every((c) => c.ok);
  const finish = () => {
    setStep(4);
    setFb({ tone: "good", text: "That is how a logistics desk protects margin: measure shipping against order value, price the returns, then change the offer so customers help you fix both." });
    onDone(`Last-Mile Cost Desk: practice ₹${G.fwd} shipping = ${fmt(share(G.orders[0].aov))}% of a ₹${G.orders[0].aov} single pack vs ${fmt(share(G.orders[2].aov))}% of a ₹${G.orders[2].aov} combo; an RTO costs ₹${rtoPer} and ${G.rto}% COD returns lose ₹${fmt(expected * 100)} per 100 orders; fix: free shipping above ₹${G.threshold} + prepaid nudge saving ₹${fmt((G.rto / 2) * rtoPer)} per 100 (${mistakes} ${mistakes === 1 ? "mistake" : "mistakes"}). My fix: “${fix.trim()}”`);
  };

  return (
    <GameFrame
      calculator
      kicker="Activity 3 · Last-Mile Cost Desk"
      title="Find the money leaking out of small orders"
      mission="Practice scenario: three orders land, the courier charges the same for each, and some cash-on-delivery parcels come back unopened. Measure shipping against order value, price the returns, then design a fix with numbers that work."
      steps={["Shipping vs order value", "Price the returns", "Design the fix", "Write it up"]}
      step={step}
      stars={step === 4 ? starsFor(mistakes) : undefined}
      onReset={reset}
      feedback={fb}
      note={{
        real: "The challenge is from this chapter: high shipping costs on low-AOV single packs and return-to-origin friction on COD orders across pan-India routes. Eat Better's website shows a free-shipping threshold on product pages (see the chapter's screenshot).",
        practice: "Order values, courier charges, the RTO rate and the target percentage are made up for practice and change every restart. They are not Eat Better's real costs or prices.",
        tip: "Shipping share = shipping ÷ order value × 100. A return costs both trips. Threshold = shipping ÷ target % × 100.",
      }}
    >
      <div className="grid gap-5 lg:grid-cols-[minmax(0,300px)_minmax(0,1fr)] lg:items-start">
        <div className="grid content-start gap-3">
          <Practice
            title="Cost desk"
            rows={[
              ["Courier charge, forward", `₹${G.fwd}`],
              ["Courier charge, return", `₹${G.ret}`],
              ["COD orders that come back (RTO)", `${G.rto} in 100`],
              ["Target: shipping at most", `${G.target}% of order`],
            ]}
          />
          <div className="grid gap-2">
            {G.orders.map((o) => (
              <div key={o.id} className="flex items-center justify-between gap-2 rounded-2xl border-2 border-cocoa/15 bg-white px-3 py-2">
                <span className="flex items-center gap-2 text-[0.95rem] text-cocoa">
                  <span className="grid size-7 place-items-center rounded-full bg-cocoa text-[0.8rem] font-bold text-cream">{o.id}</span>
                  {o.what}
                </span>
                <span className="text-right">
                  <span className="block font-display text-[1.1rem] font-semibold text-cocoa">₹{o.aov}</span>
                  <span className={`text-[0.75rem] font-extrabold uppercase tracking-[0.08em] ${o.pay === "COD" ? "text-error" : "text-success"}`}>{o.pay}</span>
                </span>
              </div>
            ))}
            <p className="text-[0.82rem] text-cocoa-2">Practice orders, not real prices.</p>
          </div>
        </div>

        <div className="min-w-0">
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="grid gap-3">
                <p className="text-[1rem] text-cocoa">
                  The courier charges <strong>₹{G.fwd}</strong> to deliver any of these orders. What share of each order is that?
                </p>
                {G.orders.map((o) => (
                  <Row key={o.id} q={`Order ${o.id} · ₹${o.aov}`}>
                    <NumIn value={pct[o.id] ?? ""} onChange={(v) => setPct((p) => ({ ...p, [o.id]: v }))} unit="% of order" label={`Order ${o.id} shipping share`} w="w-20" />
                  </Row>
                ))}
                <button onClick={check1} className="eb-btn eb-btn-primary self-start !normal-case">
                  <Calculator className="size-4" /> Check
                </button>
              </motion.div>
            )}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="grid gap-3">
                <div className="flex items-start gap-2 rounded-2xl bg-peach/70 p-4 text-[0.98rem] text-cocoa">
                  <PackageX className="mt-0.5 size-5 shrink-0 text-error" />
                  Order B is cash on delivery. If the customer refuses it at the door, the parcel comes back (return-to-origin): the brand paid to send it and pays again to bring it back, and nothing was sold.
                </div>
                <Row q="Courier cost of one returned parcel">
                  <NumIn value={rtoCost} onChange={setRtoCost} prefix="₹" label="Cost of one returned parcel" />
                </Row>
                <Row q={`Return cost on every 100 COD orders (${G.rto} come back)`}>
                  <NumIn value={per100} onChange={setPer100} prefix="₹" label="Return cost per 100 COD orders" w="w-28" />
                </Row>
                <button onClick={check2} className="eb-btn eb-btn-primary self-start !normal-case">
                  <Calculator className="size-4" /> Check
                </button>
              </motion.div>
            )}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="grid gap-3">
                <div className="flex items-start gap-2 rounded-2xl bg-peach/70 p-4 text-[0.98rem] text-cocoa">
                  <Receipt className="mt-0.5 size-5 shrink-0 text-orange" />
                  Two levers: a minimum order for free shipping (so shipping stays at or under {G.target}% of the order), and a prepaid nudge (a small reward for paying online) that turns half the COD orders prepaid.
                </div>
                <Row q={`Minimum order for free shipping so ₹${G.fwd} is at most ${G.target}%`}>
                  <NumIn value={thr} onChange={setThr} prefix="₹" label="Free-shipping threshold" />
                </Row>
                <Row q="Return cost saved per 100 orders if half the COD orders become prepaid">
                  <span className="flex items-center gap-2">
                    <Banknote className="size-4 text-success" />
                    <NumIn value={saved} onChange={setSaved} prefix="₹" label="Return cost saved per 100 orders" w="w-28" />
                  </span>
                </Row>
                <button onClick={check3} className="eb-btn eb-btn-primary self-start !normal-case">
                  <Calculator className="size-4" /> Check
                </button>
              </motion.div>
            )}
            {step >= 3 && (
              <motion.div key="s3" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }}>
                <div className="grid gap-1.5 sm:grid-cols-2">
                  {[`₹${G.fwd} shipping = ${fmt(share(G.orders[0].aov))}% of a single pack, ${fmt(share(G.orders[2].aov))}% of a combo`, `One return costs ₹${rtoPer}; ${G.rto} in 100 COD orders come back`, `Free shipping above ₹${G.threshold} keeps shipping ≤ ${G.target}%`, `Prepaid nudge saves ₹${fmt((G.rto / 2) * rtoPer)} per 100 orders`].map((t) => (
                    <div key={t} className="rounded-xl bg-success/10 px-3 py-2 text-[0.92rem] text-cocoa">
                      {t}
                    </div>
                  ))}
                </div>
                <label htmlFor="lm-fix" className="mt-4 block text-[0.85rem] font-extrabold uppercase tracking-[0.1em] text-orange">
                  Your fix
                </label>
                <textarea id="lm-fix" value={fix} disabled={step === 4} onChange={(e) => setFix(e.target.value)} rows={4} placeholder="Offer free shipping above ₹…, show a combo to single-pack buyers, and give COD customers a reason to pay prepaid, because …" className="mt-1 w-full rounded-2xl border border-line-strong bg-cream/50 px-4 py-3 text-[1.02rem] leading-relaxed text-cocoa outline-none focus:border-orange" />
                <ul className="mt-2 grid gap-1.5">
                  {checks.map((c) => (
                    <CheckRow key={c.label} {...c} />
                  ))}
                </ul>
                {step === 3 && (
                  <button disabled={!ok} onClick={finish} className="eb-btn eb-btn-primary mt-4 !normal-case">
                    <Check className="size-4" /> Submit my fix
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
