"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { CheckRow, GameFrame, starsFor, type Feedback } from "@/components/play/GameFrame";
import { NumIn, pick, rnd, toNum } from "./shared";

/**
 * Activity 1 · Order Desk (unit economics).
 * One practice pack is sold at the SAME price on the website and on a quick-commerce app. Students type every
 * line of the order's economics (platform cut, total cost, contribution, the gap) and then explain, with their own
 * numbers, why the quick-commerce sale earns less per pack. All numbers are made up and change every attempt.
 */

const f2 = (n: number) => n.toFixed(2);
const nums = (t: string) => (t.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
const hasNear = (t: string, v: number, tol = 0.06) => nums(t).some((n) => Math.abs(n - v) <= tol);

function build(seed: number) {
  const r = rnd(seed);
  for (let i = 0; i < 200; i++) {
    const price = pick(r, [149, 179, 199, 229, 249]);
    const c = pick(r, [25, 28, 30, 32, 35]);
    const ing = 52 + Math.floor(r() * 23);
    const pack = 12 + Math.floor(r() * 9);
    const dw = 28 + Math.floor(r() * 15);
    const dq = 6 + Math.floor(r() * 7);
    const webFee = price * 0.02;
    const qcFee = (price * c) / 100;
    const webCost = ing + pack + dw + webFee;
    const qcCost = ing + pack + dq + qcFee;
    const webC = price - webCost;
    const qcC = price - qcCost;
    if (webC > 15 && qcC > 0 && webC - qcC >= 10) return { price, c, ing, pack, dw, dq, webFee, qcFee, webCost, qcCost, webC, qcC, gap: webC - qcC, pct: ((webC - qcC) / webC) * 100 };
  }
  throw new Error("no round");
}

type Cell = { key: string; val: string; truth: number; tol: number; hint: string };

export default function OrderDesk({ onDone }: { onDone: (summary: string) => void }) {
  const [seed, setSeed] = useState(() => 1 + Math.floor(Math.random() * 99999));
  const d = useMemo(() => build(seed), [seed]);
  const [step, setStep] = useState(0);
  const [v, setV] = useState<Record<string, string>>({});
  const [ok, setOk] = useState<Record<string, boolean>>({});
  const [text, setText] = useState("");
  const [mistakes, setMistakes] = useState(0);
  const [fb, setFb] = useState<Feedback>(null);

  const set = (k: string) => (x: string) => setV((s) => ({ ...s, [k]: x }));
  const reset = () => {
    setSeed(1 + Math.floor(Math.random() * 99999));
    setStep(0);
    setV({});
    setOk({});
    setText("");
    setMistakes(0);
    setFb(null);
  };

  const run = (cells: Cell[]) => {
    const next = { ...ok };
    let bad = 0;
    let msg = "";
    let empty = false;
    for (const c of cells) {
      if (ok[c.key]) continue;
      const t = toNum(v[c.key] ?? "");
      if (!(v[c.key] ?? "").trim() || Number.isNaN(t)) {
        empty = true;
        continue;
      }
      if (Math.abs(t - c.truth) <= c.tol) next[c.key] = true;
      else {
        bad++;
        msg = c.hint;
      }
    }
    setOk(next);
    if (bad) {
      setMistakes((m) => m + bad);
      setFb({ tone: "bad", text: msg });
      return false;
    }
    if (empty) {
      setFb({ tone: "info", text: "Fill in every box first." });
      return false;
    }
    return true;
  };

  const step0 = () => {
    const slipC = d.price * d.c;
    const typed = toNum(v.qcFee ?? "");
    const cells: Cell[] = [
      { key: "webFee", val: v.webFee ?? "", truth: d.webFee, tol: 0.06, hint: `Website: the payment fee is 2% of the price. Rs ${d.price} × 2 ÷ 100.` },
      { key: "qcFee", val: v.qcFee ?? "", truth: d.qcFee, tol: 0.06, hint: !Number.isNaN(typed) && Math.abs(typed - slipC) < 1 ? `Divide by 100: a ${d.c}% commission on Rs ${d.price} is Rs ${d.price} × ${d.c} ÷ 100.` : `Quick commerce: the app keeps ${d.c}% of the selling price. Rs ${d.price} × ${d.c} ÷ 100.` },
    ];
    if (run(cells)) {
      setStep(1);
      setFb({ tone: "good", text: `The website pays Rs ${f2(d.webFee)} in fees and the app takes Rs ${f2(d.qcFee)}. Now add up the whole cost of one pack in each channel.` });
    }
  };
  const step1 = () => {
    const cells: Cell[] = [
      { key: "webCost", val: v.webCost ?? "", truth: d.webCost, tol: 0.06, hint: `Website cost = ingredients ${d.ing} + packaging ${d.pack} + delivery ${d.dw} + payment fee ${f2(d.webFee)}.` },
      { key: "qcCost", val: v.qcCost ?? "", truth: d.qcCost, tol: 0.06, hint: `Quick-commerce cost = ingredients ${d.ing} + packaging ${d.pack} + delivery to the dark store ${d.dq} + commission ${f2(d.qcFee)}.` },
    ];
    if (run(cells)) {
      setStep(2);
      setFb({ tone: "good", text: "Now what is left from the sale: the contribution per pack." });
    }
  };
  const step2 = () => {
    const cells: Cell[] = [
      { key: "webC", val: v.webC ?? "", truth: d.webC, tol: 0.06, hint: `Contribution = price − total cost = ${d.price} − ${f2(d.webCost)}.` },
      { key: "qcC", val: v.qcC ?? "", truth: d.qcC, tol: 0.06, hint: `Contribution = price − total cost = ${d.price} − ${f2(d.qcCost)}.` },
    ];
    if (run(cells)) {
      setStep(3);
      setFb({ tone: "good", text: `The price is the same, yet the website keeps Rs ${f2(d.webC)} and the app route keeps Rs ${f2(d.qcC)}. Measure the gap.` });
    }
  };
  const step3 = () => {
    const cells: Cell[] = [
      { key: "gap", val: v.gap ?? "", truth: d.gap, tol: 0.06, hint: `Gap per pack = website contribution − quick-commerce contribution = ${f2(d.webC)} − ${f2(d.qcC)}.` },
      { key: "pct", val: v.pct ?? "", truth: d.pct, tol: 0.6, hint: `Percent less = gap ÷ website contribution × 100 (÷ ${f2(d.webC)}, not ÷ the price).` },
    ];
    if (run(cells)) {
      setStep(4);
      setFb({ tone: "good", text: "Now explain it in your own words, using your numbers." });
    }
  };

  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const checks = [
    { ok: hasNear(text, d.qcFee) || nums(text).includes(d.c), label: `Cites the commission (Rs ${f2(d.qcFee)} or ${d.c}%)`, hint: "Which number explains most of the gap?" },
    { ok: /(commission|platform|cut|share)/i.test(text), label: "Says the platform keeps a cut", hint: "Who takes a share of the sale?" },
    { ok: hasNear(text, d.gap) || hasNear(text, d.pct, 0.6), label: "Cites the gap you worked out", hint: "Use your gap in Rs or your percent." },
    { ok: /(same price|same selling|same mrp|same cost to the customer)/i.test(text), label: "Notes the customer pays the same price", hint: "What stayed equal in this comparison?" },
    { ok: /(deliver|logistics|dark store|bulk)/i.test(text), label: "Mentions the delivery difference", hint: "Delivery cost per pack also differs between the routes." },
    { ok: /(reach|new customers|first.?time|speed|minutes|volume|visibility)/i.test(text), label: "Gives a reason a brand still uses quick commerce", hint: "What does the app bring that the website may not?" },
    { ok: /(practice|made.?up|sample|this order)/i.test(text), label: "Says the numbers are practice numbers", hint: "These numbers are made up." },
    { ok: words >= 20 && words <= 70, label: "20 to 70 words", hint: `${words} words so far.` },
  ];
  const done = checks.every((c) => c.ok);
  const finish = () => {
    setStep(5);
    setFb({ tone: "good", text: "Same price, different earnings: that is unit economics. The commission is the main reason a quick-commerce sale earns less." });
    onDone(`Order Desk (practice pack at Rs ${d.price}): website contribution Rs ${f2(d.webC)}, quick commerce Rs ${f2(d.qcC)}, gap Rs ${f2(d.gap)} (${d.pct.toFixed(1)}% less), ${mistakes} ${mistakes === 1 ? "mistake" : "mistakes"}. My explanation: “${text.trim()}”`);
  };

  const row = (label: string, web: React.ReactNode, qc: React.ReactNode, strong = false) => (
    <tr className={strong ? "bg-cream/60" : ""}>
      <td className="border-b border-cocoa/10 px-2 py-2 text-[0.95rem] font-bold text-cocoa">{label}</td>
      <td className="border-b border-cocoa/10 px-2 py-2 text-[0.95rem] tabular-nums text-cocoa">{web}</td>
      <td className="border-b border-cocoa/10 px-2 py-2 text-[0.95rem] tabular-nums text-cocoa">{qc}</td>
    </tr>
  );
  const cell = (k: string, s: number, label: string, truth: number) =>
    step === s ? <NumIn label={label} unit="Rs" value={v[k] ?? ""} ok={ok[k]} disabled={ok[k]} onChange={set(k)} /> : step > s ? <strong>Rs {f2(truth)}</strong> : <span className="text-cocoa-2/50">?</span>;

  const bars = [
    { name: "Website", val: d.webC },
    { name: "Quick commerce", val: d.qcC },
  ];

  return (
    <GameFrame
      calculator
      kicker="Activity 1 · Order Desk"
      title="Same pack, same price, different earnings"
      mission="One practice pack is sold for the same price on the brand's website and on a quick-commerce app. Work out what each sale really earns, then explain the gap."
      steps={["Platform cut", "Total cost", "Contribution", "The gap", "Explain it"]}
      step={step}
      stars={step === 5 ? starsFor(mistakes) : undefined}
      onReset={reset}
      feedback={fb}
      note={{ real: "Unit economics: what one order earns after the cost of making and delivering it. A marketplace or quick-commerce platform keeps a commission.", practice: "Every price, cost and commission here is made up for the exercise and changes each attempt. They are not Eat Better's numbers.", tip: "A percentage of a price: price × % ÷ 100." }}
    >
      <div className="overflow-x-auto rounded-2xl border border-cocoa/20">
        <table className="w-full min-w-[520px] text-left">
          <thead className="bg-cream text-[0.8rem] font-extrabold uppercase tracking-[0.08em] text-cocoa-2">
            <tr>
              <th className="px-2 py-2">One practice pack</th>
              <th className="px-2 py-2">Own website</th>
              <th className="px-2 py-2">Quick-commerce app</th>
            </tr>
          </thead>
          <tbody>
            {row("Selling price", `Rs ${d.price}`, `Rs ${d.price}`)}
            {row("Ingredients and production", `Rs ${d.ing}`, `Rs ${d.ing}`)}
            {row("Packaging", `Rs ${d.pack}`, `Rs ${d.pack}`)}
            {row("Delivery per pack", `Rs ${d.dw} (to the customer)`, `Rs ${d.dq} (in bulk to the dark store)`)}
            {row("Platform cut", step === 0 ? <NumIn label="Website payment fee in Rs" unit="Rs" value={v.webFee ?? ""} ok={ok.webFee} disabled={ok.webFee} onChange={set("webFee")} /> : <strong>Rs {f2(d.webFee)}</strong>, step === 0 ? <NumIn label="Commission in Rs" unit="Rs" value={v.qcFee ?? ""} ok={ok.qcFee} disabled={ok.qcFee} onChange={set("qcFee")} /> : <strong>Rs {f2(d.qcFee)}</strong>)}
            {row("   how it works", "payment fee 2% of price", `commission ${d.c}% of price`)}
            {row("Total cost of the pack", cell("webCost", 1, "Website total cost", d.webCost), cell("qcCost", 1, "Quick-commerce total cost", d.qcCost), true)}
            {row("Contribution per pack", cell("webC", 2, "Website contribution", d.webC), cell("qcC", 2, "Quick-commerce contribution", d.qcC), true)}
          </tbody>
        </table>
      </div>

      {step === 3 && (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <div className="flex items-center justify-between gap-2 rounded-xl bg-cream p-3">
            <span className="text-[0.95rem] font-bold text-cocoa">Gap per pack (website minus quick commerce)</span>
            <NumIn label="Gap in Rs" unit="Rs" value={v.gap ?? ""} ok={ok.gap} disabled={ok.gap} onChange={set("gap")} />
          </div>
          <div className="flex items-center justify-between gap-2 rounded-xl bg-cream p-3">
            <span className="text-[0.95rem] font-bold text-cocoa">Quick commerce earns this much less</span>
            <NumIn label="Percent less" unit="%" value={v.pct ?? ""} ok={ok.pct} disabled={ok.pct} onChange={set("pct")} />
          </div>
        </div>
      )}

      {step < 4 && (
        <button onClick={[step0, step1, step2, step3][step]} className="eb-btn eb-btn-primary mt-3 !normal-case">
          <Check className="size-4" /> Check
        </button>
      )}

      {step >= 2 && (
        <div className="mt-4 rounded-2xl border border-cocoa/15 bg-white p-3">
          <div className="text-[0.8rem] font-extrabold uppercase tracking-[0.1em] text-cocoa-2">Contribution per pack (practice)</div>
          <div className="mt-2 grid gap-2">
            {bars.map((b) => (
              <div key={b.name} className="flex items-center gap-2">
                <span className="w-32 shrink-0 text-[0.9rem] font-bold text-cocoa">{b.name}</span>
                <div className="h-6 flex-1 overflow-hidden rounded-full bg-cocoa/10">
                  <div className={`h-full rounded-full ${b.name === "Website" ? "bg-orange" : "bg-cocoa/60"}`} style={{ width: `${Math.max(2, (b.val / d.webC) * 100)}%` }} />
                </div>
                <span className="w-20 shrink-0 text-right text-[0.9rem] font-bold tabular-nums text-cocoa">Rs {f2(b.val)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {step >= 4 && (
        <div className="mt-4">
          <label htmlFor="od-text" className="text-[0.85rem] font-extrabold uppercase tracking-[0.1em] text-orange">
            Why does the quick-commerce sale earn less per pack?
          </label>
          <textarea id="od-text" value={text} disabled={step === 5} onChange={(e) => setText(e.target.value)} rows={4} placeholder="At the same price, … because …" className="mt-1 w-full rounded-2xl border border-line-strong bg-cream/50 px-4 py-3 text-[1.02rem] leading-relaxed text-cocoa outline-none focus:border-orange" />
          <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {checks.map((c) => (
              <CheckRow key={c.label} {...c} />
            ))}
          </ul>
          {step === 4 && (
            <button disabled={!done} onClick={finish} className="eb-btn eb-btn-primary mt-3 !normal-case">
              <Check className="size-4" /> Submit my explanation
            </button>
          )}
        </div>
      )}
    </GameFrame>
  );
}
