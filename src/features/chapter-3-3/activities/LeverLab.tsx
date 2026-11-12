"use client";

import { useMemo, useState } from "react";
import { Check, Lightbulb } from "lucide-react";
import { CheckRow, GameFrame, starsFor, type Feedback } from "@/components/play/GameFrame";
import { NumIn, pick, rnd, toNum } from "./shared";

/**
 * Activity 3 · Profit Lever Lab.
 * A made-up brand loses money every month. The student must close the gap WITHOUT raising the price: read the
 * parameters of each lever, pick three that are legitimate, compute each one's monthly gain by hand, total them,
 * and write the plan. Illegitimate ideas (price rise, cheaper oil, skipping quality checks) are explained, not
 * simply "wrong". All numbers are made up and re-drawn every attempt.
 */

type LeverId = "combo" | "pack" | "web" | "bulk" | "price" | "oil" | "checks";
const rs = (n: number) => `Rs ${Math.round(n).toLocaleString("en-IN")}`;
const numsIn = (t: string) => (t.match(/\d[\d,]*(?:\.\d+)?/g) ?? []).map((s) => Number(s.replace(/,/g, "")));

function build(seed: number) {
  const r = rnd(seed);
  const N = pick(r, [4000, 5000, 6000]);
  const B = pick(r, [380, 420, 460]);
  const ing = Math.round(B * pick(r, [0.34, 0.36, 0.38]));
  const p = pick(r, [28, 32, 36, 40]);
  const l = pick(r, [45, 50, 55]);
  const c = pick(r, [60, 70, 80]);
  const contrib = B - ing - p - l - c;
  const combo = { Y: pick(r, [10, 15, 20]), a: pick(r, [120, 150, 180]), m: pick(r, [30, 35, 40]) };
  const pack = { drop: pick(r, [4, 5, 6]) };
  const web = { S: pick(r, [10, 15, 20]), s: pick(r, [35, 40, 45]), share: 40 };
  const bulk = { x: pick(r, [3, 4, 5]) };
  const gains: Record<"combo" | "pack" | "web" | "bulk", number> = {
    combo: N * (combo.Y / 100) * combo.a * (combo.m / 100),
    pack: N * pack.drop,
    web: N * (web.share / 100) * (web.S / 100) * web.s,
    bulk: N * ing * (bulk.x / 100),
  };
  const sorted = Object.values(gains).sort((a, b) => a - b);
  const L = Math.round((0.8 * (sorted[0] + sorted[1] + sorted[2])) / 1000) * 1000;
  const monthlyContrib = N * contrib;
  const F = monthlyContrib + L;
  return { N, B, ing, p, l, c, contrib, monthlyContrib, F, L, combo, pack, web, bulk, gains };
}

const IDEAS: { id: LeverId; title: string; valid: boolean; why?: string }[] = [
  { id: "combo", title: "Bigger baskets through combos", valid: true },
  { id: "pack", title: "Lower packaging cost per order", valid: true },
  { id: "web", title: "Move some quick-commerce orders to the own website", valid: true },
  { id: "bulk", title: "Buy ingredients in bulk for a lower price", valid: true },
  { id: "price", title: "Raise the price of every pack by Rs 20", valid: false, why: "That raises prices. This lab asks for ways to improve profit WITHOUT raising prices." },
  { id: "oil", title: "Swap to a cheaper oil that includes palm oil", valid: false, why: "That would break the brand's own promise of no palm oil. A cost saving that breaks the value proposition is not a lever, it is damage." },
  { id: "checks", title: "Skip the quality checks to save kitchen time", valid: false, why: "The quality check is part of the promise. Saving money by dropping it risks the trust the brand is built on." },
];
const RE: Record<string, RegExp> = { combo: /(combo|basket|bundle)/i, pack: /(packag)/i, web: /(website|own site|direct)/i, bulk: /(bulk|ingredient|supplier|buying)/i };

type Cell = { key: string; truth: number; tol: number; hint: string };

export default function LeverLab({ onDone }: { onDone: (summary: string) => void }) {
  const [seed, setSeed] = useState(() => 1 + Math.floor(Math.random() * 99999));
  const d = useMemo(() => build(seed), [seed]);
  const [step, setStep] = useState(0);
  const [v, setV] = useState<Record<string, string>>({});
  const [ok, setOk] = useState<Record<string, boolean>>({});
  const [picked, setPicked] = useState<LeverId[]>([]);
  const [text, setText] = useState("");
  const [mistakes, setMistakes] = useState(0);
  const [fb, setFb] = useState<Feedback>(null);
  const set = (k: string) => (x: string) => setV((s) => ({ ...s, [k]: x }));

  const reset = () => {
    setSeed(1 + Math.floor(Math.random() * 99999));
    setStep(0);
    setV({});
    setOk({});
    setPicked([]);
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
      const raw = v[c.key] ?? "";
      const t = toNum(raw);
      if (!raw.trim() || Number.isNaN(t)) {
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
    const cells: Cell[] = [
      { key: "contrib", truth: d.contrib, tol: 0.5, hint: `Per order: basket ${d.B} − ingredients ${d.ing} − packaging ${d.p} − logistics ${d.l} − platform and marketing ${d.c}.` },
      { key: "mc", truth: d.monthlyContrib, tol: 5, hint: `Monthly contribution = contribution per order × ${d.N.toLocaleString("en-IN")} orders.` },
      { key: "res", truth: -d.L, tol: 5, hint: `Monthly result = monthly contribution − team, kitchen and operating costs (${rs(d.F)}). A loss is negative.` },
    ];
    if (run(cells)) {
      setStep(1);
      setFb({ tone: "good", text: `The practice brand loses ${rs(d.L)} a month. Now choose three ideas that could close the gap WITHOUT raising prices.` });
    }
  };

  const pickIdea = (id: LeverId) => {
    const idea = IDEAS.find((i) => i.id === id)!;
    if (!idea.valid) {
      setMistakes((m) => m + 1);
      return setFb({ tone: "bad", text: idea.why! });
    }
    setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : p.length < 3 ? [...p, id] : p));
  };

  const params: Record<string, string> = {
    combo: `${d.combo.Y}% of orders upgrade to a combo that adds ${rs(d.combo.a)} of revenue at a ${d.combo.m}% margin on that extra revenue.`,
    pack: `Packaging falls by ${rs(d.pack.drop)} per order on every order.`,
    web: `${d.web.share}% of all orders come through quick commerce. ${d.web.S}% of those move to the website, saving ${rs(d.web.s)} per moved order (commission avoided, net of extra delivery).`,
    bulk: `Ingredient spend (${rs(d.ing)} per order) falls ${d.bulk.x}% on every order.`,
  };
  const how: Record<string, string> = {
    combo: "orders × upgrade % × extra revenue × margin %",
    pack: "orders × saving per order",
    web: "orders × quick-commerce share × % moved × saving per order",
    bulk: "orders × ingredient cost per order × % saved",
  };

  const lockPicks = () => {
    if (picked.length !== 3) return setFb({ tone: "info", text: "Pick exactly three ideas." });
    setStep(2);
    setFb({ tone: "good", text: "Good picks. Now work out each lever's gain per month with the numbers shown. Do not guess: the formula is under each card." });
  };
  const step2 = () => {
    const cells: Cell[] = picked.map((id) => ({ key: `g-${id}`, truth: d.gains[id as "combo"], tol: Math.max(2, d.gains[id as "combo"] * 0.005), hint: `${IDEAS.find((i) => i.id === id)!.title}: gain per month = ${how[id]}.` }));
    if (run(cells)) {
      setStep(3);
      setFb({ tone: "good", text: "Now add the three gains to the baseline result." });
    }
  };
  const total = picked.reduce((a, id) => a + d.gains[id as "combo"], 0);
  const newRes = -d.L + total;
  const step3 = () => {
    if (run([{ key: "tot", truth: total, tol: Math.max(3, total * 0.005), hint: "Total gain = the sum of your three lever gains." }, { key: "new", truth: newRes, tol: Math.max(3, Math.abs(newRes) * 0.005 + 3), hint: `New monthly result = baseline (−${d.L.toLocaleString("en-IN")}) + total gain.` }])) {
      setStep(4);
      setFb({ tone: "good", text: newRes >= 0 ? `The brand now makes about ${rs(newRes)} a month, without a single price rise. Write the plan.` : `Still short by ${rs(-newRes)}, but much closer. Write the plan.` });
    }
  };

  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const checks = [
    ...picked.map((id) => ({ ok: RE[id].test(text), label: `Names lever: ${IDEAS.find((i) => i.id === id)!.title}`, hint: "Mention each lever you picked in your plan." })),
    { ok: numsIn(text).some((n) => Math.abs(n - total) <= Math.max(3, total * 0.01)) || numsIn(text).some((n) => Math.abs(n - total / 1000) <= 1.5 && /(k|thousand)/i.test(text)), label: "Cites your total monthly gain", hint: "Write the total you computed." },
    { ok: /(without (raising|increasing|a) ?(the )?price|no price (rise|increase|hike)|not (raise|raising|increase|increasing) (the )?price|same price)/i.test(text), label: "Says this is done without raising prices", hint: "Say it plainly: without raising prices." },
    { ok: /(practice|made.?up|sample)/i.test(text), label: "Says the numbers are practice numbers", hint: "These numbers are made up." },
    { ok: words >= 20 && words <= 90, label: "20 to 90 words", hint: `${words} words so far.` },
  ];
  const done = checks.every((c) => c.ok);
  const finish = () => {
    setStep(5);
    setFb({ tone: "good", text: "Three levers, no price rise: bigger baskets, lower costs and a better channel mix are the ways a brand moves towards profitability." });
    onDone(`Profit Lever Lab (practice brand losing ${rs(d.L)} a month): levers ${picked.map((id) => IDEAS.find((i) => i.id === id)!.title).join("; ")}; total gain ${rs(total)}; new result ${rs(newRes)} (${mistakes} ${mistakes === 1 ? "mistake" : "mistakes"}). Plan: “${text.trim()}”`);
  };

  const cellRow = (label: string, key: string, show: number, s: number, unit = "Rs") => (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-cream/70 px-3 py-2">
      <span className="text-[0.95rem] font-bold text-cocoa">{label}</span>
      {step === s ? <NumIn label={label} unit={unit} value={v[key] ?? ""} ok={ok[key]} disabled={ok[key]} onChange={set(key)} /> : step > s ? <strong className="tabular-nums">{show < 0 ? "−" : ""}Rs {Math.round(Math.abs(show)).toLocaleString("en-IN")}</strong> : <span className="text-cocoa-2/50">?</span>}
    </div>
  );

  return (
    <GameFrame
      kicker="Activity 3 · Profit Lever Lab"
      title="Close the gap without raising prices"
      mission="A practice brand loses money every month. Find the loss, choose three legitimate levers, calculate what each one is worth, and write the plan. The numbers change every attempt."
      steps={["Find the loss", "Pick 3 levers", "Calculate each", "Total", "Write the plan"]}
      step={step}
      stars={step === 5 ? starsFor(mistakes) : undefined}
      onReset={reset}
      feedback={fb}
      note={{ real: "The chapter's theme: a brand can improve profitability by growing basket size, cutting costs and shifting channels, not only by raising prices.", practice: "The brand, its order counts, prices, costs and every lever's parameters are made up and change each attempt.", tip: "A lever that breaks the brand's promise (no palm oil, quality checks) is not a real saving." }}
    >
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="rounded-2xl border border-cocoa/20 bg-white p-3">
          <div className="text-[0.8rem] font-extrabold uppercase tracking-[0.1em] text-orange">Practice brand · one month</div>
          <ul className="mt-2 grid gap-1 text-[0.95rem] text-cocoa">
            <li>Orders: <strong>{d.N.toLocaleString("en-IN")}</strong></li>
            <li>Revenue per order (basket): <strong>{rs(d.B)}</strong></li>
            <li>Ingredients and production: <strong>{rs(d.ing)}</strong> per order</li>
            <li>Packaging: <strong>{rs(d.p)}</strong> per order</li>
            <li>Logistics and delivery: <strong>{rs(d.l)}</strong> per order</li>
            <li>Platform commissions and marketing: <strong>{rs(d.c)}</strong> per order</li>
            <li>Team, kitchen and operating costs: <strong>{rs(d.F)}</strong> a month</li>
          </ul>
        </div>
        <div className="grid content-start gap-2">
          {cellRow("Contribution per order", "contrib", d.contrib, 0)}
          {cellRow("Monthly contribution", "mc", d.monthlyContrib, 0)}
          {cellRow("Monthly result (minus = loss)", "res", -d.L, 0)}
          {step === 0 && (
            <button onClick={step0} className="eb-btn eb-btn-primary mt-1 !normal-case">
              <Check className="size-4" /> Check
            </button>
          )}
        </div>
      </div>

      {step >= 1 && (
        <div className="mt-5">
          <div className="text-[0.85rem] font-extrabold uppercase tracking-[0.1em] text-orange">Ideas from the team · pick three that do not raise prices ({picked.length}/3)</div>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {IDEAS.map((i) => {
              const on = picked.includes(i.id);
              const show = i.valid && step >= 1;
              return (
                <button key={i.id} disabled={step !== 1} aria-pressed={on} onClick={() => pickIdea(i.id)} className={`rounded-xl border-2 p-3 text-left ${on ? "border-orange bg-orange/10" : "border-cocoa/15 bg-white hover:border-orange"} disabled:opacity-100`}>
                  <div className="flex items-start gap-2 font-bold text-cocoa">
                    <Lightbulb className="mt-0.5 size-4 shrink-0 text-orange" /> {i.title}
                  </div>
                  {show && <p className="mt-1 text-[0.9rem] text-cocoa-2">{params[i.id]}</p>}
                  {!i.valid && <p className="mt-1 text-[0.9rem] text-cocoa-2">A teammate&apos;s idea.</p>}
                </button>
              );
            })}
          </div>
          {step === 1 && (
            <button onClick={lockPicks} className="eb-btn eb-btn-primary mt-3 !normal-case">
              <Check className="size-4" /> Use these three
            </button>
          )}
        </div>
      )}

      {step >= 2 && (
        <div className="mt-5 grid gap-2">
          <div className="text-[0.85rem] font-extrabold uppercase tracking-[0.1em] text-orange">Gain per month</div>
          {picked.map((id) => (
            <div key={id} className="grid gap-1">
              {cellRow(IDEAS.find((i) => i.id === id)!.title, `g-${id}`, d.gains[id as "combo"], 2)}
              <p className="px-3 text-[0.85rem] text-cocoa-2">Formula: {how[id]}</p>
            </div>
          ))}
          {step === 2 && (
            <button onClick={step2} className="eb-btn eb-btn-primary mt-1 !normal-case">
              <Check className="size-4" /> Check
            </button>
          )}
        </div>
      )}

      {step >= 3 && (
        <div className="mt-4 grid gap-2">
          {cellRow("Total gain per month", "tot", total, 3)}
          {cellRow("New monthly result", "new", newRes, 3)}
          {step === 3 && (
            <button onClick={step3} className="eb-btn eb-btn-primary mt-1 !normal-case">
              <Check className="size-4" /> Check
            </button>
          )}
        </div>
      )}

      {step >= 4 && (
        <div className="mt-5">
          <label htmlFor="ll-text" className="text-[0.85rem] font-extrabold uppercase tracking-[0.1em] text-orange">
            Your plan: three ways to improve profitability without raising prices
          </label>
          <textarea id="ll-text" value={text} disabled={step === 5} onChange={(e) => setText(e.target.value)} rows={4} placeholder="In this practice brand, we can … " className="mt-1 w-full rounded-2xl border border-line-strong bg-cream/50 px-4 py-3 text-[1.02rem] leading-relaxed text-cocoa outline-none focus:border-orange" />
          <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {checks.map((c) => (
              <CheckRow key={c.label} {...c} />
            ))}
          </ul>
          {step === 4 && (
            <button disabled={!done} onClick={finish} className="eb-btn eb-btn-primary mt-3 !normal-case">
              <Check className="size-4" /> Submit my plan
            </button>
          )}
        </div>
      )}
    </GameFrame>
  );
}
