"use client";

import { useMemo, useState } from "react";
import { Check } from "lucide-react";
import { CheckRow, GameFrame, starsFor, type Feedback } from "@/components/play/GameFrame";
import { NumIn, pick, rnd, toNum } from "./shared";

/**
 * Activity 2 · Growth Desk (growth is not profit).
 * Part 1 uses the chapter's own rounded figures: students compute the growth and the loss with correct units
 * (crore vs lakh) and see why "around 165%" is a rounded report of about 167%. Part 2 is a made-up brand whose
 * numbers change every attempt: revenue more than doubles, yet costs grow too, so it still shows a loss.
 */

const nums = (t: string) => (t.match(/\d+(?:\.\d+)?/g) ?? []).map(Number);
const near = (t: string, v: number, tol: number) => nums(t).some((n) => Math.abs(n - v) <= tol);
const r2 = (n: number) => Math.round(n * 100) / 100;

function build(seed: number) {
  const r = rnd(seed);
  for (let i = 0; i < 300; i++) {
    const R1 = pick(r, [3, 4, 5, 6]);
    const g = pick(r, [120, 140, 160, 180]);
    const v = pick(r, [58, 60, 62, 64]);
    const m = r2(0.3 + Math.floor(r() * 10) * 0.1);
    const F = r2(0.8 + Math.floor(r() * 13) * 0.1);
    const R2 = r2(R1 * (1 + g / 100));
    const varC = r2((R2 * v) / 100);
    const total = r2(varC + m + F);
    const res = r2(R2 - total);
    const margin = (res / R2) * 100;
    if (margin <= -2 && margin >= -9) return { R1, g, v, m, F, R2, varC, total, res, margin };
  }
  return { R1: 4, g: 140, v: 60, m: 0.9, F: 1.8, R2: 9.6, varC: 5.76, total: 8.46, res: 1.14, margin: 11.9 };
}

type Cell = { key: string; truth: number; tol: number; hint: string };

export default function GrowthDesk({ onDone }: { onDone: (summary: string) => void }) {
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
    const g = toNum(v.growth ?? "");
    const gHint = g > 200 ? "That is the new revenue as a percent of the old. Growth is the INCREASE ÷ the old revenue × 100." : "Growth % = increase ÷ FY23 revenue × 100 (9.14 ÷ 5.33).";
    const l = toNum(v.lossPct ?? "");
    const lHint = l < 1 || l > 50 ? "Change lakh to crore first (100 lakh = 1 crore), then loss ÷ revenue × 100." : "Loss as a percent of revenue = 0.6296 ÷ 14.47 × 100.";
    const cells: Cell[] = [
      { key: "inc", truth: 9.14, tol: 0.03, hint: "Increase = FY24 revenue − FY23 revenue = 14.47 − 5.33 (in Rs crore)." },
      { key: "growth", truth: 171.5, tol: 1.5, hint: gHint },
      { key: "lossCr", truth: 0.6296, tol: 0.004, hint: "Rs 62.96 lakh in crore: 100 lakh = 1 crore, so 62.96 ÷ 100." },
      { key: "lossPct", truth: 4.35, tol: 0.15, hint: lHint },
      { key: "g25", truth: 64.6, tol: 2, hint: "FY25 growth = (23.90 − 14.47) ÷ 14.47 × 100." },
    ];
    if (run(cells)) {
      setStep(1);
      setFb({ tone: "good", text: "Right: 9.14 ÷ 5.33 is about 171.5% growth in FY24, and the loss was about 4.3% of revenue. FY25 works out at about 65.2%; the reported figure is 63% (likely a slightly different FY24 base). Revenue kept growing while the loss shrank. Now a practice brand." });
    }
  };
  const step1 = () => {
    const cells: Cell[] = [
      { key: "R2", truth: d.R2, tol: 0.02, hint: `Year 2 revenue = ${d.R1} × (1 + ${d.g} ÷ 100).` },
      { key: "varC", truth: d.varC, tol: 0.02, hint: `Ingredients, packaging, delivery and commissions are ${d.v}% of Year 2 revenue (${d.R2} × ${d.v} ÷ 100).` },
      { key: "total", truth: d.total, tol: 0.02, hint: `Total costs = ${d.varC} + marketing ${d.m} + team and kitchen ${d.F}.` },
      { key: "res", truth: d.res, tol: 0.02, hint: `Profit or loss = revenue − total costs = ${d.R2} − ${d.total}. If costs are bigger, the answer is negative (type it with a minus sign).` },
    ];
    // result is a loss: accept typed negative only
    const typed = toNum(v.res ?? "");
    if (!Number.isNaN(typed) && typed > 0 && Math.abs(typed - Math.abs(d.res)) <= 0.02) {
      setMistakes((m) => m + 1);
      return setFb({ tone: "bad", text: "The size is right but costs are bigger than revenue, so it is a loss. Type it as a negative number." });
    }
    cells[3] = { ...cells[3], truth: -Math.abs(d.res) };
    if (run(cells)) {
      setStep(2);
      setFb({ tone: "good", text: `Revenue more than doubled, yet the practice brand lost Rs ${Math.abs(d.res).toFixed(2)} crore (${Math.abs(d.margin).toFixed(1)}% of revenue). Now explain why growth and profit are different.` });
    }
  };

  const loss = Math.abs(d.res);
  const words = text.trim().split(/\s+/).filter(Boolean).length;
  const checks = [
    { ok: nums(text).includes(d.g), label: `Cites the practice growth (${d.g}%)`, hint: "How fast did revenue grow?" },
    { ok: near(text, loss, 0.03) || near(text, Math.abs(d.margin), 0.4), label: "Cites the practice loss you worked out", hint: "Use your loss in Rs crore or as a percent." },
    { ok: /(marketing|team|kitchen|invest|spend|spent|costs?)/i.test(text), label: "Says what the money went into", hint: "Marketing, team, kitchen, costs…" },
    { ok: /(different|not the same|isn.?t the same|can still|still (made|make|has|have|posted|reports?|shows?))/i.test(text), label: "Says growth and profit are different", hint: "Can a brand grow fast and still lose money?" },
    { ok: /(62\.96|63 lakh|0\.63|171|14\.47|23\.9|1\.18)/i.test(text), label: "Connects to the chapter's real figures", hint: "Mention the Rs 62.96 lakh loss, the 171.5% growth or the Rs 23.90 crore FY25 revenue." },
    { ok: /(practice|made.?up|sample)/i.test(text), label: "Says the practice numbers are made up", hint: "Be honest about which numbers are practice." },
    { ok: words >= 18 && words <= 70, label: "18 to 70 words", hint: `${words} words so far.` },
  ];
  const done = checks.every((c) => c.ok);
  const finish = () => {
    setStep(3);
    setFb({ tone: "good", text: "Growth and profit are different things. A brand can grow fast and still be working towards profitability." });
    onDone(`Growth Desk: chapter growth about ${toNum(v.growth ?? "")}% and loss about ${v.lossPct}% of revenue; practice brand grew ${d.g}% to Rs ${d.R2} crore but lost Rs ${loss.toFixed(2)} crore (${mistakes} ${mistakes === 1 ? "mistake" : "mistakes"}). My explanation: “${text.trim()}”`);
  };

  const line = (label: string, content: React.ReactNode) => (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-xl bg-cream/70 px-3 py-2">
      <span className="text-[0.95rem] font-bold text-cocoa">{label}</span>
      {content}
    </div>
  );
  const inp = (k: string, label: string, unit: string) => <NumIn label={label} unit={unit} value={v[k] ?? ""} ok={ok[k]} disabled={ok[k]} onChange={set(k)} />;

  return (
    <GameFrame
      calculator
      kicker="Activity 2 · Growth Desk"
      title="Growing fast, still losing money"
      mission="Work out the chapter's growth and net loss from the reported figures, then see the same pattern in a practice brand."
      steps={["The chapter's figures", "A practice brand", "Explain"]}
      step={step}
      stars={step === 3 ? starsFor(mistakes) : undefined}
      onReset={reset}
      feedback={fb}
      note={{ real: "Revenue Rs 5.33 crore (FY23), Rs 14.47 crore (FY24) and Rs 23.90 crore (FY25, reported growth 63%); FY24 net loss Rs 62.96 lakh. These are the company's figures from the chapter.", practice: "The practice brand, its growth, costs and loss are made up and change every attempt.", tip: "100 lakh = 1 crore. Keep every number in the same unit before dividing." }}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <div>
          <div className="text-[0.85rem] font-extrabold uppercase tracking-[0.1em] text-orange">Part 1 · The chapter&apos;s reported figures</div>
          <p className="mt-1 text-[0.98rem] text-cocoa">FY23 revenue: Rs 5.33 crore. FY24 revenue: Rs 14.47 crore. FY24 net loss: Rs 62.96 lakh. FY25 revenue: Rs 23.90 crore.</p>
          <div className="mt-2 grid gap-2">
            {line("Revenue increase (Rs crore)", inp("inc", "Increase in Rs crore", "crore"))}
            {line("Growth on FY23 (%)", inp("growth", "Growth percent", "%"))}
            {line("Net loss in Rs crore", inp("lossCr", "Net loss in crore", "crore"))}
            {line("Net loss as % of FY24 revenue", inp("lossPct", "Loss percent of revenue", "%"))}
            {line("FY25 growth on FY24 (%)", inp("g25", "FY25 growth percent", "%"))}
          </div>
          {step === 0 && (
            <button onClick={step0} className="eb-btn eb-btn-primary mt-3 !normal-case">
              <Check className="size-4" /> Check
            </button>
          )}
        </div>

        {step >= 1 && (
          <div>
            <div className="text-[0.85rem] font-extrabold uppercase tracking-[0.1em] text-orange">Part 2 · Practice brand (made up)</div>
            <p className="mt-1 text-[0.98rem] text-cocoa">
              Year 1 revenue Rs {d.R1} crore. Year 2 revenue grows {d.g}%. Ingredients, packaging, delivery and commissions cost {d.v}% of revenue. Marketing: Rs {d.m.toFixed(1)} crore. Team and kitchen: Rs {d.F.toFixed(1)} crore.
            </p>
            <div className="mt-2 grid gap-2">
              {line("Year 2 revenue (Rs crore)", inp("R2", "Year 2 revenue", "crore"))}
              {line("Variable costs (Rs crore)", inp("varC", "Variable costs", "crore"))}
              {line("Total costs (Rs crore)", inp("total", "Total costs", "crore"))}
              {line("Profit or loss (Rs crore, minus for a loss)", inp("res", "Profit or loss", "crore"))}
            </div>
            {step === 1 && (
              <button onClick={step1} className="eb-btn eb-btn-primary mt-3 !normal-case">
                <Check className="size-4" /> Check
              </button>
            )}
          </div>
        )}
      </div>

      {step >= 2 && (
        <div className="mt-5">
          <div className="rounded-2xl border border-cocoa/15 bg-white p-3">
            <div className="text-[0.8rem] font-extrabold uppercase tracking-[0.1em] text-cocoa-2">Practice brand: revenue vs total costs (Rs crore)</div>
            {[
              { name: "Year 1 revenue", val: d.R1, cls: "bg-cocoa/40" },
              { name: "Year 2 revenue", val: d.R2, cls: "bg-orange" },
              { name: "Year 2 total costs", val: d.total, cls: "bg-[#B3261E]" },
            ].map((b) => (
              <div key={b.name} className="mt-2 flex items-center gap-2">
                <span className="w-36 shrink-0 text-[0.88rem] font-bold text-cocoa">{b.name}</span>
                <div className="h-5 flex-1 overflow-hidden rounded-full bg-cocoa/10">
                  <div className={`h-full rounded-full ${b.cls}`} style={{ width: `${(b.val / Math.max(d.R2, d.total)) * 100}%` }} />
                </div>
                <span className="w-14 shrink-0 text-right text-[0.88rem] font-bold tabular-nums text-cocoa">{b.val.toFixed(2)}</span>
              </div>
            ))}
          </div>
          <label htmlFor="gd-text" className="mt-4 block text-[0.85rem] font-extrabold uppercase tracking-[0.1em] text-orange">
            Why can a fast-growing brand still post a loss?
          </label>
          <textarea id="gd-text" value={text} disabled={step === 3} onChange={(e) => setText(e.target.value)} rows={4} placeholder="In my practice brand, revenue grew … but …" className="mt-1 w-full rounded-2xl border border-line-strong bg-cream/50 px-4 py-3 text-[1.02rem] leading-relaxed text-cocoa outline-none focus:border-orange" />
          <ul className="mt-2 grid gap-1.5 sm:grid-cols-2">
            {checks.map((c) => (
              <CheckRow key={c.label} {...c} />
            ))}
          </ul>
          {step === 2 && (
            <button disabled={!done} onClick={finish} className="eb-btn eb-btn-primary mt-3 !normal-case">
              <Check className="size-4" /> Submit my explanation
            </button>
          )}
        </div>
      )}
    </GameFrame>
  );
}
