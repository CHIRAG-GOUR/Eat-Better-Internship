"use client";

/** Shared pieces for the Chapter 4.2 activities: number inputs, maths helpers and small HUD bits. */

export function NumIn({ value, onChange, unit, label, disabled, w = "w-24", prefix, testId, ok }: { value: string; onChange: (v: string) => void; unit?: string; label: string; disabled?: boolean; w?: string; prefix?: string; testId?: string; ok?: boolean }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {prefix && <span className="font-display text-[1.1rem] font-semibold text-cocoa">{prefix}</span>}
      <input
        inputMode="decimal"
        aria-label={label}
        data-testid={testId}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        placeholder="?"
        className={`${w} rounded-xl border-2 bg-white px-2.5 py-2 text-right font-display text-[1.15rem] font-semibold tabular-nums text-cocoa outline-none focus:border-orange disabled:bg-success/10 ${ok === false ? "border-error/60" : "border-cocoa/20"}`}
      />
      {unit && <span className="text-[0.92rem] font-bold text-cocoa-2">{unit}</span>}
    </span>
  );
}

export const num = (s: string) => Number(String(s).replace(/[,₹\s]/g, "").replace(/\/g|per\s*g|times|×|x/gi, ""));
export const near = (a: number, b: number, tol = 0.011) => Number.isFinite(a) && Math.abs(a - b) <= tol;
export const words = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;
export const has = (t: string, re: RegExp) => re.test(t.toLowerCase());
export const pick = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];
export function shuffle<T>(a: readonly T[]): T[] {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}
export const rs = (n: number, d = 2) => `₹${n.toFixed(d)}`;

/** A small dark chip used in stage overlays. */
export function Chip({ children, tone = "cocoa" }: { children: React.ReactNode; tone?: "cocoa" | "orange" | "cream" }) {
  const cls = tone === "orange" ? "bg-orange text-white" : tone === "cream" ? "bg-cream/95 text-cocoa border border-cocoa/20" : "bg-cocoa/90 text-cream";
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[0.82rem] font-extrabold ${cls}`}>{children}</span>;
}

/** Practice tag shown on made-up material. */
export function PracticeTag({ children = "Practice" }: { children?: React.ReactNode }) {
  return <span className="rounded-full bg-haldi px-2 py-0.5 text-[0.7rem] font-extrabold uppercase tracking-[0.08em] text-cocoa">{children}</span>;
}
