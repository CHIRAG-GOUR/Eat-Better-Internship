"use client";

/** Shared pieces for the Chapter 3.4 activities: number inputs and small maths helpers. */

export function NumIn({ value, onChange, unit, label, disabled, w = "w-24", prefix }: { value: string; onChange: (v: string) => void; unit?: string; label: string; disabled?: boolean; w?: string; prefix?: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      {prefix && <span className="font-display text-[1.1rem] font-semibold text-cocoa">{prefix}</span>}
      <input inputMode="decimal" aria-label={label} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} placeholder="?" className={`${w} rounded-xl border-2 border-cocoa/20 bg-white px-3 py-2 text-right font-display text-[1.15rem] font-semibold tabular-nums text-cocoa outline-none focus:border-orange disabled:bg-success/10`} />
      {unit && <span className="text-[0.95rem] font-bold text-cocoa-2">{unit}</span>}
    </span>
  );
}

export const num = (s: string) => Number(String(s).replace(/[,₹\s]/g, "").replace(/units?|days?|%|orders?|shifts?|×|x/gi, ""));
export const near = (a: number, b: number, tol = 0.011) => Number.isFinite(a) && Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
export const words = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;
export const pick = <T,>(a: readonly T[]) => a[Math.floor(Math.random() * a.length)];
export const fmt = (n: number) => n.toLocaleString("en-IN", { maximumFractionDigits: 1 });

export function Practice({ title, rows }: { title: string; rows: [string, string][] }) {
  return (
    <div className="rounded-2xl bg-cocoa p-4 text-cream">
      <div className="text-[0.8rem] font-extrabold uppercase tracking-[0.1em] text-haldi">{title} · practice numbers</div>
      <ul className="mt-2 grid gap-1 text-[0.98rem]">
        {rows.map(([k, v]) => (
          <li key={k} className="flex items-baseline justify-between gap-3">
            <span className="text-cream/85">{k}</span>
            <strong className="shrink-0 text-haldi">{v}</strong>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function Row({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-cream p-3">
      <span className="text-[1rem] font-bold text-cocoa">{q}</span>
      {children}
    </div>
  );
}
