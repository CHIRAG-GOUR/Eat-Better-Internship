"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, motion } from "motion/react";
import { Calculator as CalcIcon, Delete, X } from "lucide-react";

/**
 * A simple, honest calculator for the maths activities: + − × ÷, brackets, % and decimals, with a short history so the
 * learner can see their working. It never knows the activity's answers; it only does the arithmetic it is given.
 */

type Tok = { t: "n"; v: number } | { t: "op"; v: "+" | "-" | "*" | "/" } | { t: "("; v: "(" } | { t: ")"; v: ")" } | { t: "%"; v: "%" };

function tokenize(src: string): Tok[] | null {
  const s = src.replace(/×/g, "*").replace(/÷/g, "/").replace(/−/g, "-").replace(/\s+/g, "");
  const out: Tok[] = [];
  let i = 0;
  while (i < s.length) {
    const c = s[i];
    if (/[0-9.]/.test(c)) {
      let j = i;
      while (j < s.length && /[0-9.]/.test(s[j])) j++;
      const v = Number(s.slice(i, j));
      if (!Number.isFinite(v)) return null;
      out.push({ t: "n", v });
      i = j;
      continue;
    }
    if ("+-*/".includes(c)) {
      // a minus at the start or after an operator / bracket is a negative sign: treat as 0 - x
      const prev = out[out.length - 1];
      if (c === "-" && (!prev || prev.t === "op" || prev.t === "(")) out.push({ t: "n", v: 0 });
      out.push({ t: "op", v: c as "+" | "-" | "*" | "/" });
    } else if (c === "(") out.push({ t: "(", v: "(" });
    else if (c === ")") out.push({ t: ")", v: ")" });
    else if (c === "%") out.push({ t: "%", v: "%" });
    else return null;
    i++;
  }
  return out;
}

/** Shunting-yard evaluation; no eval(). Returns null for anything that is not a complete sum. */
function evaluate(src: string): number | null {
  const toks = tokenize(src);
  if (!toks || !toks.length) return null;
  const prec = { "+": 1, "-": 1, "*": 2, "/": 2 } as const;
  const nums: number[] = [];
  const ops: ("+" | "-" | "*" | "/" | "(")[] = [];
  const apply = () => {
    const op = ops.pop();
    const b = nums.pop();
    const a = nums.pop();
    if (op === undefined || op === "(" || a === undefined || b === undefined) throw new Error("bad");
    nums.push(op === "+" ? a + b : op === "-" ? a - b : op === "*" ? a * b : a / b);
  };
  try {
    for (const k of toks) {
      if (k.t === "n") nums.push(k.v);
      else if (k.t === "%") {
        const a = nums.pop();
        if (a === undefined) return null;
        nums.push(a / 100);
      } else if (k.t === "(") ops.push("(");
      else if (k.t === ")") {
        while (ops.length && ops[ops.length - 1] !== "(") apply();
        if (ops.pop() !== "(") return null;
      } else {
        while (ops.length && ops[ops.length - 1] !== "(" && prec[ops[ops.length - 1] as "+"] >= prec[k.v]) apply();
        ops.push(k.v);
      }
    }
    while (ops.length) {
      if (ops[ops.length - 1] === "(") return null;
      apply();
    }
  } catch {
    return null;
  }
  return nums.length === 1 && Number.isFinite(nums[0]) ? nums[0] : null;
}

const fmt = (n: number) => (Math.abs(n) >= 1e12 ? n.toExponential(4) : String(Math.round(n * 1e6) / 1e6));

const KEYS: { k: string; label?: string; tone?: "op" | "eq" | "fn" }[] = [
  { k: "C", tone: "fn" },
  { k: "(", tone: "fn" },
  { k: ")", tone: "fn" },
  { k: "÷", tone: "op" },
  { k: "7" },
  { k: "8" },
  { k: "9" },
  { k: "×", tone: "op" },
  { k: "4" },
  { k: "5" },
  { k: "6" },
  { k: "−", tone: "op" },
  { k: "1" },
  { k: "2" },
  { k: "3" },
  { k: "+", tone: "op" },
  { k: "%", tone: "fn" },
  { k: "0" },
  { k: "." },
  { k: "=", tone: "eq" },
];

function Panel({ onClose }: { onClose: () => void }) {
  const [expr, setExpr] = useState("");
  const [hist, setHist] = useState<string[]>([]);
  const [err, setErr] = useState(false);
  const box = useRef<HTMLDivElement>(null);
  const preview = evaluate(expr);

  const press = (k: string) => {
    setErr(false);
    if (k === "C") return setExpr("");
    if (k === "⌫") return setExpr((e) => e.slice(0, -1));
    if (k === "=") {
      const v = evaluate(expr);
      if (v === null) return setErr(true);
      setHist((h) => [`${expr} = ${fmt(v)}`, ...h].slice(0, 4));
      return setExpr(fmt(v));
    }
    setExpr((e) => (e + k).slice(0, 60));
  };

  useEffect(() => {
    box.current?.focus();
  }, []);
  const onKey = (e: KeyboardEvent) => {
    const map: Record<string, string> = { "*": "×", "/": "÷", "-": "−", Enter: "=", "=": "=", Backspace: "⌫", Escape: "", c: "C", C: "C" };
    if (e.key === "Escape") return onClose();
    const k = map[e.key] ?? (/^[0-9.+()%]$/.test(e.key) ? e.key : null);
    if (k) {
      e.preventDefault();
      press(k);
    }
  };

  return createPortal(
    <motion.div
      ref={box}
      tabIndex={-1}
      onKeyDown={onKey}
      role="dialog"
      aria-label="Calculator"
      initial={{ opacity: 0, y: 24, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 24, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 320, damping: 26 }}
      className="fixed inset-x-3 bottom-3 z-[95] mx-auto w-auto max-w-[20rem] rounded-[22px] border-2 border-cocoa bg-cream p-3 shadow-[4px_4px_0_0_#2f1c1a] outline-none sm:inset-x-auto sm:right-5 sm:bottom-5"
    >
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-1.5 text-[0.85rem] font-extrabold uppercase tracking-[0.1em] text-orange">
          <CalcIcon className="size-4" /> Calculator
        </span>
        <button onClick={onClose} aria-label="Close calculator" className="grid size-8 place-items-center rounded-lg bg-white text-cocoa hover:bg-peach">
          <X className="size-4" />
        </button>
      </div>
      {hist.length > 0 && (
        <ul className="mt-2 grid max-h-16 gap-0.5 overflow-auto text-right font-mono text-[0.78rem] text-cocoa-2">
          {hist.map((h, i) => (
            <li key={i}>{h}</li>
          ))}
        </ul>
      )}
      <div className={`mt-2 rounded-xl border bg-white px-3 py-2 text-right ${err ? "border-error" : "border-cocoa/20"}`}>
        <div className="min-h-[1.6rem] break-all font-mono text-[1.25rem] font-bold text-cocoa">{expr || "0"}</div>
        <div className="min-h-[1rem] font-mono text-[0.8rem] text-cocoa-2">{err ? "That sum isn't complete yet" : preview !== null && expr && fmt(preview) !== expr ? `= ${fmt(preview)}` : ""}</div>
      </div>
      <div className="mt-2 grid grid-cols-4 gap-1.5">
        {KEYS.map(({ k, tone }) => (
          <button
            key={k}
            onClick={() => press(k)}
            className={`h-11 rounded-xl text-[1.1rem] font-bold transition-colors ${tone === "eq" ? "bg-orange text-white hover:bg-[#e04f00]" : tone === "op" ? "bg-cocoa text-cream hover:bg-cocoa/85" : tone === "fn" ? "bg-peach text-cocoa hover:bg-peach/70" : "bg-white text-cocoa hover:bg-peach/50"}`}
          >
            {k}
          </button>
        ))}
      </div>
      <button onClick={() => press("⌫")} className="mt-1.5 flex h-9 w-full items-center justify-center gap-1.5 rounded-xl bg-white text-[0.88rem] font-bold text-cocoa hover:bg-peach/50">
        <Delete className="size-4" /> Delete last
      </button>
    </motion.div>,
    document.body,
  );
}

/** The "Calculator" button for an activity's header; opens a floating calculator that stays open while the learner works. */
export function CalculatorButton({ className = "" }: { className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button onClick={() => setOpen((o) => !o)} aria-pressed={open} className={`flex items-center gap-1.5 rounded-xl border px-3 py-1.5 text-[0.85rem] font-bold transition-colors ${open ? "border-orange bg-orange text-white" : "border-cocoa/20 bg-white text-cocoa hover:border-cocoa"} ${className}`}>
        <CalcIcon className="size-4" /> Calculator
      </button>
      <AnimatePresence>{open && <Panel onClose={() => setOpen(false)} />}</AnimatePresence>
    </>
  );
}
