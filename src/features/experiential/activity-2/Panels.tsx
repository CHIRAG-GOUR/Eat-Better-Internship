"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Camera,
  ChartColumn,
  Check,
  ChevronDown,
  CircleAlert,
  Info,
  Megaphone,
  Package,
  Palette,
  Play,
  Rocket,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Store,
  Target,
  TriangleAlert,
  Users,
  Wallet,
} from "lucide-react";
import {
  AUD,
  AUDIENCES,
  BRAND_LINES,
  CAT,
  CATEGORIES,
  COLOUR_LAB,
  CREATIVES,
  CTAS,
  FONTS,
  ING_NAMES,
  LAUNCH_BUDGET,
  LAUNCH_MIN,
  MESSAGES,
  OBJECTIVES,
  PALETTE,
  PERCEPTION,
  POST_IMAGES,
  POST_LAYOUTS,
  RANGES,
  SHELF,
  SHELF_BY_ID,
  STORY,
  TAGLINE,
  TEAMMATE_DRAFT,
  num,
  rupees,
  swatchOf,
  type AudId,
  type MsgId,
} from "./data";
import { Icon } from "./icons";
import { checkClaims, wordCount } from "./claims";
import { CTA, METRIC_HELP, MSG, OBJ, evaluate, pct, postQuality, postText, type Metrics } from "./ads";
import { contrast } from "./art";
import { launchResults, runAd } from "./report";
import { useStudio, type AdSettings } from "./store";

/* ── small UI ───────────────────────────────────────────────────────────────────────────────────────── */

export const btn = "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-45";
export const primary = `${btn} bg-orange text-white hover:bg-cocoa`;
export const secondary = `${btn} border border-cocoa/20 bg-white text-cocoa hover:border-cocoa`;

export function Kicker({ children }: { children: React.ReactNode }) {
  return <div className="text-[0.8rem] font-extrabold uppercase tracking-[0.14em] text-orange">{children}</div>;
}
function H2({ children }: { children: React.ReactNode }) {
  return <h2 className="mt-1 font-display text-[1.5rem] font-semibold leading-tight">{children}</h2>;
}
function Sub({ n, children }: { n?: string; children: React.ReactNode }) {
  return (
    <div className="mt-5 flex items-center gap-2 text-[0.85rem] font-extrabold uppercase tracking-[0.1em] text-cocoa-2">
      {n && <span className="grid size-5 place-items-center rounded-full bg-cocoa text-[0.7rem] text-cream">{n}</span>}
      {children}
    </div>
  );
}

function Choice({ active, onClick, children, className = "", label }: { active: boolean; onClick: () => void; children: React.ReactNode; className?: string; label?: string }) {
  return (
    <button type="button" aria-pressed={active} aria-label={label} onClick={onClick} className={`rounded-2xl border-2 text-left transition-colors ${active ? "border-orange bg-peach/50" : "border-cocoa/10 bg-white hover:border-cocoa/30"} ${className}`}>
      {children}
    </button>
  );
}

function Swatches({ value, onChange, label }: { value: string; onChange: (hex: string) => void; label: string }) {
  const sw = swatchOf(value);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2 text-[0.9rem] font-bold">
        <span>{label}</span>
        <span className="truncate text-[0.82rem] font-semibold text-cocoa-2">{sw?.name}</span>
      </div>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {PALETTE.map((p) => (
          <button key={p.hex} type="button" onClick={() => onChange(p.hex)} aria-label={`${label}: ${p.name}`} aria-pressed={value === p.hex} title={p.name} className={`size-7 rounded-full border-2 ${value === p.hex ? "border-cocoa ring-2 ring-orange ring-offset-1" : "border-cocoa/15"} ${p.onBrand ? "" : "outline-dashed outline-1 outline-error/60"}`} style={{ background: p.hex }} />
        ))}
      </div>
      {sw && <p className={`mt-1 text-[0.82rem] leading-snug ${sw.onBrand ? "text-cocoa-2" : "text-error"}`}>{sw.note}</p>}
    </div>
  );
}

function TextField({ label, value, onChange, max, placeholder, rows, min, minLabel }: { label: string; value: string; onChange: (v: string) => void; max: number; placeholder?: string; rows?: number; min?: number; minLabel?: string }) {
  const words = wordCount(value);
  return (
    <label className="flex flex-col gap-1 text-[0.9rem] font-bold">
      {label}
      {rows ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value.slice(0, max))} rows={rows} placeholder={placeholder} className="rounded-xl border border-cocoa/20 px-3 py-2 text-[1rem] font-normal outline-none focus:border-orange" />
      ) : (
        <input value={value} onChange={(e) => onChange(e.target.value.slice(0, max))} placeholder={placeholder} className="rounded-xl border border-cocoa/20 px-3 py-2 text-[1rem] font-normal outline-none focus:border-orange" />
      )}
      <span className={`text-[0.78rem] font-semibold ${min && words < min ? "text-cocoa-2" : "text-success"}`}>
        {min ? `${words} words${words < min ? ` · at least ${min}${minLabel ? ` ${minLabel}` : ""}` : ""}` : `${value.length}/${max}`}
      </span>
    </label>
  );
}

function Slider({ label, min, max, step, value, onChange, fmt }: { label: string; min: number; max: number; step: number; value: number; onChange: (v: number) => void; fmt: (v: number) => string }) {
  return (
    <label className="grid grid-cols-[minmax(0,7.5rem)_1fr_4.5rem] items-center gap-2 text-[0.9rem]">
      <span className="font-bold">{label}</span>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="accent-orange" aria-label={label} />
      <span className="text-right font-bold tabular-nums">{fmt(value)}</span>
    </label>
  );
}

function Checklist({ items }: { items: [boolean, string][] }) {
  return (
    <ul className="mt-3 grid gap-1.5">
      {items.map(([ok, t]) => (
        <li key={t} className={`flex items-start gap-2 rounded-xl px-3 py-1.5 text-[0.9rem] ${ok ? "bg-success/10 text-cocoa" : "bg-cream text-cocoa-2"}`}>
          <span className={`mt-0.5 grid size-4.5 shrink-0 place-items-center rounded-full ${ok ? "bg-success text-white" : "border-2 border-cocoa/25"}`}>{ok && <Check className="size-3" strokeWidth={3} />}</span>
          <span>{t}</span>
        </li>
      ))}
    </ul>
  );
}

export function ClaimsPanel({ text, title = "Live claims checker" }: { text: string; title?: string }) {
  const { flags, supported } = checkClaims(text);
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="mt-3 rounded-2xl border border-cocoa/10 bg-white p-3" role="status" aria-live="polite">
      <div className="flex items-center gap-2 font-display text-[1.05rem] font-semibold">
        {flags.some((f) => f.severity === "block") ? <ShieldAlert className="size-5 text-error" /> : <ShieldCheck className="size-5 text-success" />} {title}
      </div>
      {!flags.length && <p className="mt-1.5 rounded-xl bg-success/10 px-3 py-1.5 text-[0.9rem]">No unsupported health claims found.</p>}
      <ul className="mt-1.5 grid gap-1.5">
        {flags.map((f) => (
          <li key={f.id} className={`rounded-xl px-3 py-2 text-[0.9rem] ${f.severity === "block" ? "bg-error/10" : "bg-haldi/25"}`}>
            <button type="button" onClick={() => setOpen(open === f.id ? null : f.id)} className="flex w-full items-start gap-2 text-left">
              {f.severity === "block" ? <TriangleAlert className="mt-0.5 size-4 shrink-0 text-error" /> : <CircleAlert className="mt-0.5 size-4 shrink-0 text-[#9A6B00]" />}
              <span className="min-w-0 flex-1">
                <strong>{f.label}</strong> · “{f.match}” {f.severity === "block" ? "(must fix)" : "(use with care)"}
              </span>
              <ChevronDown className={`mt-0.5 size-4 shrink-0 transition-transform ${open === f.id ? "rotate-180" : ""}`} />
            </button>
            {(open === f.id || f.severity === "block") && (
              <p className="mt-1 pl-6 leading-snug text-cocoa">
                {f.why} <span className="font-bold">Try: </span>
                {f.fix}
              </p>
            )}
          </li>
        ))}
      </ul>
      {supported.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {supported.map((s) => (
            <span key={s} className="inline-flex items-center gap-1 rounded-full bg-success/12 px-2.5 py-0.5 text-[0.78rem] font-bold text-success">
              <Check className="size-3" strokeWidth={3} /> {s}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function CanvasView({ src, className, label }: { src: HTMLCanvasElement | null; className?: string; label: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c || !src) return;
    c.width = src.width;
    c.height = src.height;
    c.getContext("2d")!.drawImage(src, 0, 0);
  }, [src]);
  return <canvas ref={ref} role="img" aria-label={label} className={className} />;
}

function Nav({ back, next, nextLabel, ready, onBack, onNext, missing }: { back?: string; next: string; nextLabel?: string; ready: boolean; onBack?: () => void; onNext: () => void; missing?: string }) {
  return (
    <div className="mt-5">
      {!ready && missing && (
        <p className="mb-2 flex items-start gap-2 text-[0.88rem] font-semibold text-cocoa-2">
          <Info className="mt-0.5 size-4 shrink-0 text-orange" /> {missing}
        </p>
      )}
      <div className="flex flex-wrap justify-between gap-2">
        {back ? (
          <button onClick={onBack} className={secondary}>
            <ArrowLeft className="size-4" /> {back}
          </button>
        ) : (
          <span />
        )}
        <button disabled={!ready} onClick={onNext} className={primary}>
          {nextLabel ?? next} <ArrowRight className="size-4" />
        </button>
      </div>
    </div>
  );
}

/* ── stage 0 · discover ─────────────────────────────────────────────────────────────────────────────── */

export function DiscoverPanel({ onStart }: { onStart: () => void }) {
  const cards: [typeof Store, string, string][] = [
    [Store, "Understand the brand", "Inspect real Eat Better packs, the three Our story values, colours, type and how shoppers read a pack."],
    [Package, "Design a pack", "Pick a category and design the front of pack: colours, type, name, image, claims. See it live in 3D."],
    [Smartphone, "Make an Instagram post", "Build a 1080 × 1080 creative and keep every health message honest with the live claims checker."],
    [ChartColumn, "Run Meta Ads tests", "Choose audience, objective, budget, duration, creative and message, then read the simulated results."],
    [Rocket, "Launch & submit", "Launch within a fixed budget, justify your choices, and download your campaign kit."],
  ];
  return (
    <div>
      <Kicker>Discover · your role</Kicker>
      <h1 className="mt-1 font-display text-[clamp(1.6rem,3vw,2.2rem)] font-semibold leading-tight">Welcome to the Eat Better Brand Studio</h1>
      <p className="mt-2 text-[1.02rem] leading-relaxed">You&apos;ve joined Eat Better&apos;s branding & digital marketing team. Your brief: understand the brand, design a new pack, create a social post that sells without over-promising, and plan a Meta Ads campaign within budget.</p>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {cards.map(([I, h, t], i) => (
          <div key={h} className={`rounded-2xl bg-cream p-3 ${i === 4 ? "sm:col-span-2" : ""}`}>
            <div className="flex items-center gap-2 font-display text-[1.02rem] font-semibold">
              <span className="grid size-8 place-items-center rounded-xl bg-orange text-white">
                <I className="size-4.5" />
              </span>
              {i + 1}. {h}
            </div>
            <p className="mt-1 text-[0.92rem] leading-snug text-cocoa-2">{t}</p>
          </div>
        ))}
      </div>
      <div className="mt-4 flex items-start gap-2 rounded-2xl bg-peach/60 p-3 text-[0.9rem]">
        <Info className="mt-0.5 size-4 shrink-0 text-orange" />
        <span>Brand facts come from your Module 2 chapters and official Eat Better packs. Your pack and post are student-created concepts, not official Eat Better packaging. All ad numbers are simulated from a practice model.</span>
      </div>
      <button onClick={onStart} className={`${primary} mt-4`}>
        Enter the studio <ArrowRight className="size-4" />
      </button>
    </div>
  );
}

/* ── stage 1 · understand the brand ─────────────────────────────────────────────────────────────────── */

export type BrandTab = "products" | "story" | "colour" | "perception";

export function BrandPanel({ tab, setTab, sel, setSel, onBack, onNext }: { tab: BrandTab; setTab: (t: BrandTab) => void; sel: string | null; setSel: (id: string) => void; onBack: () => void; onNext: () => void }) {
  const s = useStudio();
  const [story, setStory] = useState<string>(s.stories[s.stories.length - 1] ?? "taste");
  const [colour, setColour] = useState<string | null>(null);
  const item = sel ? SHELF_BY_ID[sel] : null;
  const ranges = new Set(s.inspected.map((id) => SHELF_BY_ID[id]?.range));
  const ready = s.inspected.length >= 4 && ranges.size >= 3 && s.stories.length === 3 && s.colours.length >= 3 && wordCount(s.brandNote) >= 20;
  const tabs: [BrandTab, string, typeof Store][] = [
    ["products", "Products", Store],
    ["story", "Our story", BookOpen],
    ["colour", "Colour & type", Palette],
    ["perception", "Perception", Users],
  ];
  return (
    <div>
      <Kicker>Learn & explore · the brand</Kicker>
      <H2>What makes Eat Better recognisable?</H2>
      <div className="mt-2 rounded-2xl bg-cocoa p-3 text-cream">
        <div className="text-[0.75rem] font-extrabold uppercase tracking-[0.12em] text-haldi">Name & tagline</div>
        <div className="font-display text-[1.3rem] font-semibold">Eat Better Co · “{TAGLINE}”</div>
        <p className="mt-0.5 text-[0.88rem] text-cream/85">“Eat” = enjoy your food · “Better” = better ingredients and processes (Chapter 2.1).</p>
      </div>
      <div role="tablist" className="mt-3 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
        {tabs.map(([id, label, I]) => (
          <button key={id} role="tab" aria-selected={tab === id} onClick={() => setTab(id)} className={`flex items-center justify-center gap-1.5 rounded-xl px-2 py-2 text-[0.88rem] font-bold ${tab === id ? "bg-orange text-white" : "bg-cream text-cocoa hover:bg-peach"}`}>
            <I className="size-4" /> {label}
          </button>
        ))}
      </div>

      {tab === "products" && (
        <div className="mt-3">
          <p className="text-[0.95rem] text-cocoa-2">Tap packs on the shelf (or below). Inspect at least 4 products from 3 different ranges.</p>
          <div className="mt-2 grid grid-cols-1 gap-1.5 sm:grid-cols-2">
            {SHELF.map((p) => (
              <button key={p.id} onClick={() => (setSel(p.id), s.inspect(p.id))} className={`flex items-center gap-2 rounded-xl border px-2.5 py-1.5 text-left text-[0.86rem] font-bold ${sel === p.id ? "border-orange bg-peach/60" : s.inspected.includes(p.id) ? "border-success/40 bg-success/8" : "border-cocoa/12 bg-white"}`}>
                <Icon id={p.range === "laddoos" ? "laddoo" : p.range === "chips" ? "chips" : p.range} className="size-6 shrink-0" />
                <span className="min-w-0 flex-1 truncate">{p.name}</span>
                {s.inspected.includes(p.id) && <Check className="size-4 shrink-0 text-success" strokeWidth={3} />}
              </button>
            ))}
          </div>
          {item && (
            <motion.div key={item.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-3 grid gap-3 rounded-2xl border border-cocoa/10 bg-cream p-3 sm:grid-cols-[150px_1fr]">
              <div className="relative aspect-square overflow-hidden rounded-xl">
                <Image src={item.src} alt={`${item.name}, official Eat Better pack photo`} fill sizes="150px" className="object-cover" />
              </div>
              <div className="min-w-0">
                <div className="font-display text-[1.15rem] font-semibold">{item.name}</div>
                <div className="text-[0.85rem] font-bold text-cocoa-2">
                  {RANGES[item.range].name} · {item.format === "sachet" ? "single-serve sachet" : "stand-up pouch"}
                </div>
                <div className="mt-2 text-[0.78rem] font-extrabold uppercase tracking-[0.1em] text-orange">On the front of the pack</div>
                <ul className="mt-0.5 text-[0.9rem]">
                  {item.onPack.map((c) => (
                    <li key={c}>• {c}</li>
                  ))}
                </ul>
                {item.ingredients && <p className="mt-1 text-[0.86rem] text-cocoa-2">Ingredients named: {item.ingredients}</p>}
                <p className="mt-1.5 text-[0.86rem] leading-snug">
                  <strong>Range look:</strong> {RANGES[item.range].mood}
                </p>
                <p className="mt-1 text-[0.78rem] text-cocoa-2">Official photo · also in the shot: {item.props.toLowerCase()}.</p>
              </div>
            </motion.div>
          )}
        </div>
      )}

      {tab === "story" && (
        <div className="mt-3">
          <p className="text-[0.95rem] text-cocoa-2">The three cards from eatbetterco.com &ldquo;Our story&rdquo;. Open all three (tap a frame on the wall or a card).</p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {STORY.map((st) => (
              <button key={st.id} onClick={() => (setStory(st.id), s.readStory(st.id))} className={`overflow-hidden rounded-2xl border-2 text-left ${story === st.id ? "border-orange" : s.stories.includes(st.id) ? "border-success/50" : "border-cocoa/10"}`}>
                <div className="relative aspect-[828/918]">
                  <Image src={st.img} alt={st.shows} fill sizes="160px" className="object-cover" />
                </div>
                <div className="flex items-center gap-1 px-2 py-1.5 text-[0.8rem] font-bold leading-tight sm:text-[0.86rem]">
                  {s.stories.includes(st.id) && <Check className="size-3.5 shrink-0 text-success" strokeWidth={3} />}
                  {st.name}
                </div>
              </button>
            ))}
          </div>
          {s.stories.includes(story) && (
            <motion.div key={story} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="mt-3 rounded-2xl bg-cream p-3">
              {(() => {
                const st = STORY.find((x) => x.id === story)!;
                return (
                  <>
                    <div className="font-display text-[1.2rem] font-semibold">{st.name}</div>
                    <p className="mt-0.5 text-[0.98rem]">“{st.meaning}”</p>
                    <p className="mt-1.5 text-[0.9rem]">
                      <strong>For marketing:</strong> {st.lesson}
                    </p>
                    <p className="mt-1 text-[0.8rem] text-cocoa-2">In the official photo: {st.shows.toLowerCase()}.</p>
                  </>
                );
              })()}
            </motion.div>
          )}
        </div>
      )}

      {tab === "colour" && (
        <div className="mt-3">
          <p className="text-[0.95rem] text-cocoa-2">Colour psychology from the Chapter 2.1 colour lab. Tap at least 3 colours to see what they signal on a snack pack. The mood board on the wall shows Eat Better&apos;s palette and type.</p>
          <div className="mt-2 grid grid-cols-3 gap-2 sm:grid-cols-6">
            {COLOUR_LAB.map((c) => (
              <button key={c.id} onClick={() => (setColour(c.id), s.seeColour(c.id))} aria-pressed={colour === c.id} className={`rounded-xl border-2 p-1.5 text-center ${colour === c.id ? "border-orange" : s.colours.includes(c.id) ? "border-success/50" : "border-cocoa/10"}`}>
                <span className="block h-10 rounded-lg" style={{ background: c.hex }} />
                <span className="mt-1 block text-[0.74rem] font-bold leading-tight">{c.name}</span>
              </button>
            ))}
          </div>
          {colour &&
            (() => {
              const c = COLOUR_LAB.find((x) => x.id === colour)!;
              return (
                <div className={`mt-2 rounded-2xl p-3 text-[0.92rem] ${c.official ? "bg-cream" : "bg-error/8"}`}>
                  <strong>{c.name}:</strong> {c.note} {c.official ? <span className="text-success">{c.official}</span> : <span className="text-error">Not an Eat Better colour.</span>}
                </div>
              );
            })()}
          <div className="mt-3 grid gap-2 sm:grid-cols-2">
            {FONTS.slice(0, 2).map((f) => (
              <div key={f.id} className="rounded-2xl bg-cream p-3">
                <div className="text-[2rem] font-bold leading-none" style={{ fontFamily: `var(${f.cssVar})` }}>
                  Aa
                </div>
                <div className="mt-1 font-bold">{f.name}</div>
                <p className="text-[0.85rem] text-cocoa-2">{f.note}</p>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[0.85rem] text-cocoa-2">Official lines: {BRAND_LINES.map((l) => `“${l}”`).join(" · ")}</p>
        </div>
      )}

      {tab === "perception" && (
        <div className="mt-3">
          <p className="text-[0.95rem] text-cocoa-2">The same pack is read differently by different shoppers (Chapter 2.1). Each looks at something different first:</p>
          <div className="mt-2 grid gap-2">
            {PERCEPTION.map((p) => (
              <div key={p.id} className="flex items-start gap-3 rounded-2xl bg-cream p-3">
                <Users className="mt-0.5 size-5 shrink-0 text-orange" />
                <div>
                  <div className="font-bold">{p.who}</div>
                  <div className="text-[0.9rem]">Looks first at: {p.looks}</div>
                  <div className="text-[0.88rem] italic text-cocoa-2">{p.says}</div>
                </div>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[0.85rem] text-cocoa-2">So a pack needs a clear name, appetising imagery and one honest claim, all at a glance.</p>
        </div>
      )}

      <Sub n="✓">Your brand analysis</Sub>
      <div className="mt-2">
        <TextField label="How do Eat Better's name, colours, packs and story work together to build trust? Use what you inspected." value={s.brandNote} onChange={s.setBrandNote} max={900} rows={4} min={20} placeholder="e.g. The laddoo sachets use cream and cocoa with one bright flavour colour…" />
      </div>
      <Checklist
        items={[
          [s.inspected.length >= 4 && ranges.size >= 3, `Inspected ${s.inspected.length}/4 products from ${ranges.size}/3 ranges`],
          [s.stories.length === 3, `Opened ${s.stories.length}/3 Our story cards`],
          [s.colours.length >= 3, `Explored ${s.colours.length}/3 colours`],
          [wordCount(s.brandNote) >= 20, "Wrote a brand analysis (20+ words)"],
        ]}
      />
      <Nav back="Intro" onBack={onBack} next="To the packaging desk" ready={ready} onNext={onNext} />
    </div>
  );
}

/* ── stage 2 · packaging ────────────────────────────────────────────────────────────────────────────── */

export function PackagingPanel({ front, view, setView, onBack, onNext }: { front: HTMLCanvasElement | null; view: "desk" | "photo"; setView: (v: "desk" | "photo") => void; onBack: () => void; onNext: () => void }) {
  const s = useStudio();
  const p = s.pack;
  const cat = p.category ? CAT[p.category] : null;
  const packText = `${p.name} ${p.variant} ${p.description}`;
  const flags = checkClaims(packText).flags;
  const blocking = flags.filter((f) => f.severity === "block");
  const nameContrast = contrast(p.layout === "band" ? p.secondary : p.primary, p.layout === "band" ? (contrast(p.secondary, "#2F1C1A") > contrast(p.secondary, "#FFF5EE") ? "#2F1C1A" : "#FFF5EE") : contrast(p.primary, "#2F1C1A") > contrast(p.primary, "#FFF5EE") ? "#2F1C1A" : "#FFF5EE");
  const offBrand = [p.primary, p.secondary, p.accent].filter((h) => !swatchOf(h)?.onBrand);
  const briefOk = !!p.category && !!p.audience && wordCount(p.positioning) >= 12;
  const designOk = p.name.trim().length >= 3 && p.variant.trim().length >= 2 && !!p.netQty && p.claims.length >= 1 && p.ingredients.length >= 2 && wordCount(p.description) >= 8 && !blocking.length;
  const ready = briefOk && designOk;
  const pickCat = (id: (typeof CATEGORIES)[number]["id"]) => {
    if (p.category === id) return;
    s.setPack({ category: id, claims: [], ingredients: [], netQty: CAT[id].qty[1] ?? CAT[id].qty[0] });
  };
  return (
    <div>
      <Kicker>Practise · packaging design challenge</Kicker>
      <H2>Design a new Eat Better pack</H2>
      <p className="mt-1 text-[0.95rem] text-cocoa-2">Your pack updates live on the turntable and the photo set. It is a student concept, never official packaging.</p>

      <Sub n="1">Brief: category</Sub>
      <div className="mt-2 grid grid-cols-2 gap-2">
        {CATEGORIES.map((c) => (
          <Choice key={c.id} active={p.category === c.id} onClick={() => pickCat(c.id)} className="overflow-hidden">
            <div className="relative aspect-[16/10]">
              <Image src={c.ref} alt={`Official reference: ${c.refName}`} fill sizes="220px" className="object-cover" />
            </div>
            <div className="flex items-center gap-2 px-2.5 py-2">
              <Icon id={c.id === "laddoos" ? "laddoo" : c.id} className="size-7 shrink-0" />
              <div className="min-w-0">
                <div className="text-[0.92rem] font-bold leading-tight">{c.name}</div>
                <div className="text-[0.76rem] text-cocoa-2">{c.formatName}</div>
              </div>
            </div>
          </Choice>
        ))}
      </div>
      {cat && <p className="mt-1 text-[0.8rem] text-cocoa-2">Photo: official {cat.refName} for reference.</p>}

      <Sub n="2">Brief: target audience</Sub>
      <div className="mt-2 grid gap-1.5">
        {AUDIENCES.map((a) => (
          <Choice key={a.id} active={p.audience === a.id} onClick={() => s.setPack({ audience: a.id })} className="px-3 py-2">
            <div className="text-[0.92rem] font-bold">
              {a.name} <span className="text-[0.75rem] font-semibold text-cocoa-2">· {a.source}</span>
            </div>
            <div className="text-[0.84rem] text-cocoa-2">{a.need}</div>
          </Choice>
        ))}
      </div>
      <div className="mt-3">
        <TextField
          label="Positioning statement"
          value={p.positioning}
          onChange={(v) => s.setPack({ positioning: v })}
          max={400}
          rows={3}
          min={12}
          placeholder={`For ${p.audience ? AUD[p.audience].name.toLowerCase() : "[audience]"} who want [need], [product] is a ${cat ? cat.name.toLowerCase() : "[category]"} that [benefit], because [proof].`}
        />
      </div>

      <Sub n="3">Name, flavour & size</Sub>
      <div className="mt-2 grid gap-3 sm:grid-cols-2">
        <TextField label="Product name" value={p.name} onChange={(v) => s.setPack({ name: v })} max={26} placeholder="e.g. Choco Date Bites" />
        <TextField label="Flavour / variant" value={p.variant} onChange={(v) => s.setPack({ variant: v })} max={22} placeholder="e.g. Cocoa Almond" />
      </div>
      {cat && (
        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[0.9rem] font-bold">Net quantity</span>
          {cat.qty.map((q) => (
            <button key={q} onClick={() => s.setPack({ netQty: q })} aria-pressed={p.netQty === q} className={`rounded-full border px-3 py-1 text-[0.85rem] font-bold ${p.netQty === q ? "border-orange bg-orange text-white" : "border-cocoa/15 bg-white"}`}>
              {q}
            </button>
          ))}
          <span className="text-[0.76rem] text-cocoa-2">(sizes Eat Better offers in this range)</span>
        </div>
      )}

      <Sub n="4">Front-of-pack layout & typography</Sub>
      <div className="mt-2 grid grid-cols-3 gap-2">
        {(
          [
            ["band", "Two-tone band", "Like the laddoo sachets"],
            ["classic", "Classic", "Image first, name below"],
            ["namefirst", "Name first", "Big name, product on an arch"],
          ] as const
        ).map(([id, n, d]) => (
          <Choice key={id} active={p.layout === id} onClick={() => s.setPack({ layout: id })} className="px-2.5 py-2">
            <div className="text-[0.88rem] font-bold leading-tight">{n}</div>
            <div className="text-[0.74rem] leading-tight text-cocoa-2">{d}</div>
          </Choice>
        ))}
      </div>
      <div className="mt-2 grid gap-1.5">
        {FONTS.map((f) => (
          <Choice key={f.id} active={p.font === f.id} onClick={() => s.setPack({ font: f.id })} className="flex items-center gap-3 px-3 py-1.5">
            <span className="w-10 text-[1.6rem] font-bold leading-none" style={{ fontFamily: f.cssVar ? `var(${f.cssVar})` : f.fallback }}>
              Aa
            </span>
            <span className="min-w-0">
              <span className="block text-[0.9rem] font-bold">{f.name}</span>
              <span className="block text-[0.78rem] leading-snug text-cocoa-2">{f.note}</span>
            </span>
          </Choice>
        ))}
      </div>

      <Sub n="5">Colours</Sub>
      <div className="mt-2 grid gap-3">
        <Swatches label="Main colour" value={p.primary} onChange={(hex) => s.setPack({ primary: hex })} />
        <Swatches label={p.layout === "band" ? "Lower band colour" : "Second colour"} value={p.secondary} onChange={(hex) => s.setPack({ secondary: hex })} />
        <Swatches label="Accent (claim strip, flavour)" value={p.accent} onChange={(hex) => s.setPack({ accent: hex })} />
      </div>

      <Sub n="6">Product image</Sub>
      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        <span className="mr-1 text-[0.9rem] font-bold">Position</span>
        {(
          [
            [-1, "Left"],
            [0, "Centre"],
            [1, "Right"],
          ] as const
        ).map(([v, n]) => (
          <button key={n} onClick={() => s.setPack({ imgX: v })} aria-pressed={p.imgX === v} className={`rounded-full border px-3 py-1 text-[0.85rem] font-bold ${p.imgX === v ? "border-orange bg-orange text-white" : "border-cocoa/15 bg-white"}`}>
            {n}
          </button>
        ))}
      </div>
      <div className="mt-2 grid gap-1.5">
        <Slider label="Raise / lower" min={-1} max={1} step={0.25} value={p.imgY} onChange={(v) => s.setPack({ imgY: v })} fmt={(v) => (v === 0 ? "middle" : v < 0 ? "up" : "down")} />
        <Slider label="Size" min={0.7} max={1.3} step={0.05} value={p.imgScale} onChange={(v) => s.setPack({ imgScale: v })} fmt={(v) => `${Math.round(v * 100)}%`} />
      </div>

      <Sub n="7">Ingredient messaging</Sub>
      {!cat ? (
        <p className="mt-1 text-[0.9rem] text-cocoa-2">Pick a category first.</p>
      ) : (
        <>
          <div className="mt-1 text-[0.88rem] text-cocoa-2">Claims (1–3, from Eat Better&apos;s official {cat.name.toLowerCase()} packs). The first one runs across the top of the pack.</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {cat.claims.map((c) => {
              const on = p.claims.includes(c);
              return (
                <button key={c} onClick={() => s.setPack({ claims: on ? p.claims.filter((x) => x !== c) : p.claims.length < 3 ? [...p.claims, c] : p.claims })} aria-pressed={on} className={`rounded-full border px-3 py-1 text-[0.85rem] font-bold ${on ? "border-orange bg-orange text-white" : "border-cocoa/15 bg-white"}`}>
                  {on && `${p.claims.indexOf(c) + 1}. `}
                  {c}
                </button>
              );
            })}
          </div>
          <div className="mt-3 text-[0.88rem] text-cocoa-2">Key ingredients shown as icons (2–4):</div>
          <div className="mt-1.5 grid grid-cols-3 gap-1.5 sm:grid-cols-4">
            {cat.ingredients.map((id) => {
              const on = p.ingredients.includes(id);
              return (
                <button key={id} onClick={() => s.setPack({ ingredients: on ? p.ingredients.filter((x) => x !== id) : p.ingredients.length < 4 ? [...p.ingredients, id] : p.ingredients })} aria-pressed={on} className={`flex flex-col items-center gap-0.5 rounded-xl border-2 px-1 py-1.5 text-[0.76rem] font-bold leading-tight ${on ? "border-orange bg-peach/50" : "border-cocoa/10 bg-white"}`}>
                  <Icon id={id} className="size-8" />
                  {ING_NAMES[id]}
                </button>
              );
            })}
          </div>
        </>
      )}
      <div className="mt-3">
        <TextField label="Short description on the pack" value={p.description} onChange={(v) => s.setPack({ description: v })} max={120} rows={2} min={8} placeholder="e.g. Soft laddoos of dates, almonds and cocoa, for a sweet break." />
      </div>

      <div className="mt-4 rounded-2xl border border-cocoa/10 bg-cream/60 p-3">
        <div className="flex items-center gap-2 font-display text-[1.05rem] font-semibold">
          <Package className="size-5 text-orange" /> Pack check
        </div>
        <div className="mt-2 grid gap-3 sm:grid-cols-[120px_1fr]">
          <CanvasView src={front} label="Your pack front, live preview" className="mx-auto max-h-[220px] w-auto max-w-full rounded-md shadow-md" />
          <ul className="grid content-start gap-1.5 text-[0.88rem]">
            <li className={`rounded-xl px-3 py-1.5 ${nameContrast >= 4.5 ? "bg-success/10" : "bg-haldi/25"}`}>Name readability: contrast {nameContrast.toFixed(1)}:1 {nameContrast >= 4.5 ? "(clear at a glance)" : "(aim for 4.5:1 or more)"}</li>
            <li className={`rounded-xl px-3 py-1.5 ${offBrand.length ? "bg-haldi/25" : "bg-success/10"}`}>{offBrand.length ? `Off-brand colour: ${offBrand.map((h) => swatchOf(h)?.name).join(", ")}. It may confuse shoppers who know Eat Better.` : "All colours sit in Eat Better's palette or range colours."}</li>
            <li className="rounded-xl bg-white px-3 py-1.5">Shopper test: the parent sees “{p.claims[0] ?? "no claim yet"}”, the student sees your product art, the grandfather sees the Eat Better logo.</li>
          </ul>
        </div>
        <ClaimsPanel text={packText} title="Claims check on your pack text" />
        <button onClick={() => setView(view === "desk" ? "photo" : "desk")} className={`${secondary} mt-3 w-full`}>
          <Camera className="size-4" /> {view === "desk" ? "See it on the photo set" : "Back to the packaging desk"}
        </button>
      </div>
      <Checklist
        items={[
          [briefOk, "Brief: category, audience and a positioning statement (12+ words)"],
          [p.name.trim().length >= 3 && p.variant.trim().length >= 2 && !!p.netQty, "Name, flavour and net quantity"],
          [p.claims.length >= 1 && p.ingredients.length >= 2, "At least 1 claim and 2 ingredients"],
          [wordCount(p.description) >= 8 && !blocking.length, "Description (8+ words) with no unsupported claims"],
        ]}
      />
      <Nav back="The brand" onBack={onBack} next="To the creative screens" ready={ready} onNext={onNext} />
    </div>
  );
}

/* ── stage 3 · instagram creative ───────────────────────────────────────────────────────────────────── */

export function PostPanel({ preview, onBack, onNext }: { preview: HTMLCanvasElement | null; onBack: () => void; onNext: () => void }) {
  const s = useStudio();
  const post = s.post;
  const rw = checkClaims(s.rewrite);
  const rewriteOk = wordCount(s.rewrite) >= 10 && rw.flags.length === 0 && s.rewrite.trim() !== TEAMMATE_DRAFT;
  const text = postText(post);
  const blocking = checkClaims(text).flags.filter((f) => f.severity === "block");
  const q = postQuality(post, s.pack);
  const ready = rewriteOk && wordCount(post.headline) >= 2 && wordCount(post.body) >= 8 && wordCount(post.caption) >= 10 && !blocking.length;
  return (
    <div>
      <Kicker>Practise · social media creative</Kicker>
      <H2>Make an Instagram post that sells honestly</H2>

      <Sub n="1">Warm-up: fix a teammate&apos;s draft</Sub>
      <div className="mt-2 rounded-2xl border-2 border-dashed border-error/40 bg-error/5 p-3 text-[0.95rem]">
        <div className="text-[0.75rem] font-extrabold uppercase tracking-[0.1em] text-error">Teammate&apos;s draft caption</div>
        “{TEAMMATE_DRAFT}”
      </div>
      <ClaimsPanel text={TEAMMATE_DRAFT} title="What the checker finds in the draft" />
      <div className="mt-3">
        <TextField label="Rewrite it: keep it exciting, remove every unsupported claim" value={s.rewrite} onChange={s.setRewrite} max={300} rows={3} min={10} placeholder="e.g. Craving something sweet? Our laddoos are sweetened with dates and packed with dry fruits." />
      </div>
      {s.rewrite.trim() && <ClaimsPanel text={s.rewrite} title="Your rewrite" />}

      <Sub n="2">Layout & image</Sub>
      <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {POST_LAYOUTS.map((l) => (
          <Choice key={l.id} active={post.layout === l.id} onClick={() => s.setPost({ layout: l.id })} className="px-2.5 py-2">
            <div className="text-[0.88rem] font-bold">{l.name}</div>
            <div className="text-[0.74rem] leading-tight text-cocoa-2">{l.note}</div>
          </Choice>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {POST_IMAGES.map((i) => (
          <button key={i.id} onClick={() => s.setPost({ image: i.id, imgX: 0, imgY: 0, imgScale: 1 })} aria-pressed={post.image === i.id} className={`rounded-full border px-3 py-1 text-[0.85rem] font-bold ${post.image === i.id ? "border-orange bg-orange text-white" : "border-cocoa/15 bg-white"}`}>
            {i.name}
          </button>
        ))}
      </div>
      <div className="mt-2 grid gap-1.5">
        <Slider label="Move left/right" min={-1} max={1} step={0.1} value={post.imgX} onChange={(v) => s.setPost({ imgX: v })} fmt={(v) => v.toFixed(1)} />
        <Slider label="Move up/down" min={-1} max={1} step={0.1} value={post.imgY} onChange={(v) => s.setPost({ imgY: v })} fmt={(v) => v.toFixed(1)} />
        <Slider label="Image size" min={0.7} max={1.5} step={0.05} value={post.imgScale} onChange={(v) => s.setPost({ imgScale: v })} fmt={(v) => `${Math.round(v * 100)}%`} />
      </div>
      <div className="mt-3">
        <Swatches label="Background colour" value={post.bg} onChange={(hex) => s.setPost({ bg: hex })} />
      </div>
      <label className="mt-2 flex items-center gap-2 text-[0.9rem] font-bold">
        <input type="checkbox" checked={post.showLogo} onChange={(e) => s.setPost({ showLogo: e.target.checked })} className="size-4 accent-orange" /> Show the Eat Better logo
      </label>

      <Sub n="3">Words & call to action</Sub>
      <div className="mt-2 grid gap-3">
        <TextField label="Headline (2–7 words works best)" value={post.headline} onChange={(v) => s.setPost({ headline: v })} max={44} placeholder="e.g. Sweet breaks, made better" />
        <TextField label="Body text" value={post.body} onChange={(v) => s.setPost({ body: v })} max={170} rows={2} min={8} placeholder="e.g. Soft laddoos sweetened with dates, with almonds and cocoa. Your 4 pm craving, sorted." />
        <div>
          <div className="text-[0.9rem] font-bold">Call-to-action button</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {CTAS.map((c) => (
              <button key={c.id} onClick={() => s.setPost({ cta: c.id })} aria-pressed={post.cta === c.id} className={`rounded-full border px-3 py-1 text-[0.85rem] font-bold ${post.cta === c.id ? "border-orange bg-orange text-white" : "border-cocoa/15 bg-white"}`}>
                {c.text}
              </button>
            ))}
          </div>
          <p className="mt-1 text-[0.78rem] text-cocoa-2">Best for: {CTA[post.cta].best.map((o) => OBJ[o].name).join(", ")} campaigns.</p>
        </div>
        <TextField label="Caption (under the post)" value={post.caption} onChange={(v) => s.setPost({ caption: v })} max={500} rows={3} min={10} placeholder="Tell the story in a friendly voice. Hashtags welcome." />
      </div>

      <div className="mt-4 rounded-2xl border border-cocoa/10 bg-cream/60 p-3">
        <div className="flex items-center gap-2 font-display text-[1.05rem] font-semibold">
          <Smartphone className="size-5 text-orange" /> Live preview
        </div>
        <CanvasView src={preview} label="Your Instagram creative, live preview" className="mx-auto mt-2 aspect-square w-full max-w-[340px] rounded-lg shadow-md" />
        <ClaimsPanel text={text} />
        <details className="mt-3 rounded-2xl bg-white p-3">
          <summary className="cursor-pointer font-bold">
            Creative quality: {q.score}/100 <span className="font-semibold text-cocoa-2">(feeds the ads simulation)</span>
          </summary>
          <ul className="mt-2 grid gap-1 text-[0.86rem]">
            {q.parts.map((x) => (
              <li key={x.label} className="grid grid-cols-[1fr_auto] gap-2 border-b border-cocoa/8 pb-1">
                <span>
                  <strong>{x.label}.</strong> {x.note}
                </span>
                <span className="font-bold tabular-nums">
                  {x.pts}/{x.max}
                </span>
              </li>
            ))}
          </ul>
        </details>
      </div>
      <Checklist
        items={[
          [rewriteOk, "Rewrote the teammate's draft (10+ words, no flags)"],
          [wordCount(post.headline) >= 2 && wordCount(post.body) >= 8, "Headline and body text (8+ words)"],
          [wordCount(post.caption) >= 10, "Caption (10+ words)"],
          [!blocking.length, "No unsupported health claims in the post"],
        ]}
      />
      <Nav back="Packaging" onBack={onBack} next="To the ads lab" ready={ready} onNext={onNext} />
    </div>
  );
}

/* ── metrics display ────────────────────────────────────────────────────────────────────────────────── */

function MetricGrid({ m }: { m: Pick<Metrics, "impressions" | "reach" | "clicks" | "ctr" | "engagements" | "conversions" | "spend" | "cpc" | "cpa"> & { frequency?: number } }) {
  const [open, setOpen] = useState<string | null>(null);
  const cells: [string, string][] = [
    ["impressions", num(m.impressions)],
    ["reach", num(m.reach)],
    ...(m.frequency !== undefined ? ([["frequency", m.frequency.toFixed(2)]] as [string, string][]) : []),
    ["clicks", num(m.clicks)],
    ["ctr", pct(m.ctr)],
    ["engagements", num(m.engagements)],
    ["conversions", num(m.conversions)],
    ["spend", rupees(m.spend)],
    ["cpc", rupees(m.cpc)],
    ["cpa", rupees(m.cpa)],
  ];
  const help = (k: string) => METRIC_HELP.find((h) => h.key === k)!;
  return (
    <div>
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-5">
        {cells.map(([k, v]) => (
          <button key={k} onClick={() => setOpen(open === k ? null : k)} aria-expanded={open === k} className={`rounded-xl border px-2 py-1.5 text-left ${open === k ? "border-orange bg-peach/50" : "border-cocoa/10 bg-white"}`}>
            <div className="flex items-center justify-between text-[0.7rem] font-extrabold uppercase tracking-[0.08em] text-cocoa-2">
              {help(k).name} <Info className="size-3" />
            </div>
            <div className="font-display text-[1.1rem] font-semibold tabular-nums">{v}</div>
          </button>
        ))}
      </div>
      <AnimatePresence>
        {open && (
          <motion.p key={open} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="mt-2 rounded-xl bg-cream px-3 py-2 text-[0.88rem]">
            <strong>{help(open).name}:</strong> {help(open).what}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
}

function Drivers({ m }: { m: Metrics }) {
  const d = m.drivers;
  const rows: [string, string, string][] = [
    ["Creative quality", `${Math.round(d.score)}/100 → ×${d.quality.toFixed(2)}`, "From your post (headline, body, claims, product visible, brand consistency)."],
    ["Audience fit", `×${d.fit.toFixed(2)}`, `Product ${Math.round(d.catFit * 100)}/100 + message ${Math.round(d.msgFit * 100)}/100 for this audience.`],
    ["Button vs objective", `×${d.ctaFit.toFixed(2)}`, d.ctaFit > 1 ? "Your call to action suits this objective." : "Your call to action doesn't suit this objective."],
    ["Cost per 1,000 views", rupees(m.cpm), "Audience base cost × objective × creative relevance discount."],
    ["Frequency & fatigue", `${m.frequency.toFixed(2)} · ×${d.fatigue.toFixed(2)}`, `Reachable audience ${num(d.reachable)}. Above 3 views per person, clicks drop.`],
  ];
  return (
    <details className="mt-2 rounded-2xl bg-white p-3">
      <summary className="cursor-pointer font-bold">Why these numbers? (the model)</summary>
      <ul className="mt-2 grid gap-1 text-[0.86rem]">
        {rows.map(([a, b, c]) => (
          <li key={a} className="grid grid-cols-[minmax(0,9rem)_auto] gap-x-2 border-b border-cocoa/8 pb-1 sm:grid-cols-[9rem_9rem_1fr]">
            <strong>{a}</strong>
            <span className="text-right font-bold tabular-nums sm:text-left">{b}</span>
            <span className="col-span-2 text-cocoa-2 sm:col-span-1">{c}</span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-[0.8rem] text-cocoa-2">CTR = 0.9% × objective × quality × fit × button × fatigue. Conversion rate = 2.2% × objective × fit × message × button. All constants are practice assumptions.</p>
    </details>
  );
}

function SimTag() {
  return <span className="rounded-full bg-haldi px-2 py-0.5 text-[0.7rem] font-extrabold uppercase tracking-[0.08em] text-cocoa">Simulated</span>;
}

/* ── stage 4 · ads lab ──────────────────────────────────────────────────────────────────────────────── */

export function AdsPanel({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const s = useStudio();
  const a = s.ad;
  const last = s.tests[s.tests.length - 1];
  const res = last ? runAd(last, s.pack, s.post) : null;
  const differs = s.tests.length >= 2 && s.tests.some((t, i) => i > 0 && JSON.stringify(t) !== JSON.stringify(s.tests[0]));
  const ready = s.tests.length >= 2 && differs && wordCount(s.testNote) >= 15;
  const prev = s.tests.length >= 2 ? s.tests[s.tests.length - 2] : null;
  const changed = prev && last ? (Object.keys(last) as (keyof AdSettings)[]).filter((k) => last[k] !== prev[k]) : [];
  const ev = res && last ? evaluate(res, last) : null;
  return (
    <div>
      <Kicker>Challenge · Meta Ads simulation</Kicker>
      <H2>Test your campaign settings</H2>
      <p className="mt-1 text-[0.95rem] text-cocoa-2">Run at least two tests, changing one thing at a time, and watch the dashboard. Every number here is simulated from a transparent practice model.</p>

      <Sub n="1">Audience</Sub>
      <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {AUDIENCES.map((x) => (
          <Choice key={x.id} active={a.audience === x.id} onClick={() => s.setAd({ audience: x.id })} className="px-2.5 py-1.5">
            <div className="text-[0.86rem] font-bold leading-tight">{x.name}</div>
            <div className="text-[0.72rem] text-cocoa-2">~{num(x.size)} people · CPM {rupees(x.cpm)}</div>
          </Choice>
        ))}
      </div>
      <Sub n="2">Objective</Sub>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {OBJECTIVES.map((o) => (
          <Choice key={o.id} active={a.objective === o.id} onClick={() => s.setAd({ objective: o.id })} className="px-2.5 py-1.5">
            <div className="text-[0.88rem] font-bold">{o.name}</div>
            <div className="text-[0.74rem] leading-tight text-cocoa-2">{o.goal}</div>
          </Choice>
        ))}
      </div>
      <Sub n="3">Budget & duration</Sub>
      <div className="mt-2 grid gap-1.5">
        <Slider label="Daily budget" min={200} max={5000} step={100} value={a.daily} onChange={(v) => s.setAd({ daily: v })} fmt={(v) => rupees(v)} />
        <Slider label="Duration" min={3} max={30} step={1} value={a.days} onChange={(v) => s.setAd({ days: v })} fmt={(v) => `${v} days`} />
        <p className="text-right text-[0.85rem] font-bold">Total spend: {rupees(a.daily * a.days)}</p>
      </div>
      <Sub n="4">Creative & message</Sub>
      <div className="mt-2 grid gap-1.5 sm:grid-cols-3">
        {CREATIVES.map((c) => (
          <Choice key={c.id} active={a.creative === c.id} onClick={() => s.setAd({ creative: c.id })} className="px-2.5 py-1.5">
            <div className="text-[0.86rem] font-bold">{c.name}</div>
            <div className="text-[0.72rem] leading-tight text-cocoa-2">{c.note}</div>
          </Choice>
        ))}
      </div>
      <div className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
        {MESSAGES.map((m) => (
          <Choice key={m.id} active={a.message === m.id} onClick={() => s.setAd({ message: m.id })} className="px-2.5 py-1.5">
            <div className="text-[0.86rem] font-bold leading-tight">{m.name}</div>
            <div className="text-[0.7rem] leading-tight text-cocoa-2">{m.source}</div>
          </Choice>
        ))}
      </div>
      <button onClick={() => s.addTest({ ...a })} className={`${primary} mt-4 w-full`}>
        <Play className="size-4" /> Run test campaign {s.tests.length + 1}
      </button>

      {res && last && (
        <div className="mt-4 rounded-2xl border border-cocoa/10 bg-cream/60 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="font-display text-[1.1rem] font-semibold">Test {s.tests.length} results</div>
            <SimTag />
          </div>
          <p className="mt-0.5 text-[0.82rem] text-cocoa-2">
            {AUD[last.audience].name} · {OBJ[last.objective].name} · {MSG[last.message].name} · {rupees(last.daily)}/day × {last.days} days
          </p>
          <div className="mt-2">
            <MetricGrid m={res} />
          </div>
          <Drivers m={res} />
          {changed.length > 0 && <p className="mt-2 rounded-xl bg-white px-3 py-2 text-[0.88rem]">You changed: <strong>{changed.join(", ")}</strong> since the previous test. Compare the rows below.</p>}
          {ev && (
            <div className="mt-2 grid gap-1 text-[0.86rem]">
              {ev.good.map((g) => (
                <p key={g} className="flex items-start gap-2 rounded-xl bg-success/10 px-3 py-1.5">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" /> {g}
                </p>
              ))}
              {ev.improve.map((g) => (
                <p key={g} className="flex items-start gap-2 rounded-xl bg-haldi/25 px-3 py-1.5">
                  <Target className="mt-0.5 size-4 shrink-0 text-[#9A6B00]" /> {g}
                </p>
              ))}
            </div>
          )}
        </div>
      )}

      {s.tests.length > 0 && (
        <div className="mt-3 overflow-x-auto rounded-2xl border border-cocoa/10">
          <table className="w-full min-w-[520px] text-left text-[0.82rem]">
            <thead className="bg-cocoa text-cream">
              <tr>
                {["Test", "Audience", "Objective", "Spend", "Clicks", "CTR", "Conv.", "CPA"].map((h) => (
                  <th key={h} className="px-2 py-1.5 font-bold">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {s.tests.map((t, i) => {
                const m = runAd(t, s.pack, s.post);
                return (
                  <tr key={i} className="border-t border-cocoa/8 bg-white">
                    <td className="px-2 py-1 font-bold">T{i + 1}</td>
                    <td className="px-2 py-1">{AUD[t.audience].name}</td>
                    <td className="px-2 py-1">{OBJ[t.objective].name}</td>
                    <td className="px-2 py-1 tabular-nums">{rupees(m.spend)}</td>
                    <td className="px-2 py-1 tabular-nums">{num(m.clicks)}</td>
                    <td className="px-2 py-1 tabular-nums">{pct(m.ctr)}</td>
                    <td className="px-2 py-1 tabular-nums">{num(m.conversions)}</td>
                    <td className="px-2 py-1 tabular-nums">{rupees(m.cpa)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      <div className="mt-3">
        <TextField label="What changed between your tests, and why did the results move?" value={s.testNote} onChange={s.setTestNote} max={800} rows={3} min={15} placeholder="e.g. Switching from Awareness to Sales cost more per view but…" />
      </div>
      <Checklist
        items={[
          [s.tests.length >= 2 && differs, `Ran ${s.tests.length}/2 tests with different settings`],
          [wordCount(s.testNote) >= 15, "Explained what changed (15+ words)"],
        ]}
      />
      <Nav back="Instagram post" onBack={onBack} next="To the final launch" ready={ready} onNext={onNext} />
    </div>
  );
}

/* ── stage 5 · launch ───────────────────────────────────────────────────────────────────────────────── */

function AdSetEditor({ label, set, onChange }: { label: string; set: { audience: AudId; message: MsgId; daily: number }; onChange: (p: Partial<{ audience: AudId; message: MsgId; daily: number }>) => void }) {
  return (
    <div className="rounded-2xl border border-cocoa/10 bg-white p-3">
      <div className="font-bold">{label}</div>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-[0.86rem] font-bold">
          Audience
          <select value={set.audience} onChange={(e) => onChange({ audience: e.target.value as AudId })} className="rounded-xl border border-cocoa/20 px-2 py-2 font-normal">
            {AUDIENCES.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[0.86rem] font-bold">
          Message
          <select value={set.message} onChange={(e) => onChange({ message: e.target.value as MsgId })} className="rounded-xl border border-cocoa/20 px-2 py-2 font-normal">
            {MESSAGES.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-2">
        <Slider label="Daily budget" min={200} max={4000} step={100} value={set.daily} onChange={(v) => onChange({ daily: v })} fmt={(v) => rupees(v)} />
      </div>
    </div>
  );
}

export function LaunchPanel({ onBack, onNext }: { onBack: () => void; onNext: () => void }) {
  const s = useStudio();
  const l = s.launch;
  const total = (l.a.daily + (l.b?.daily ?? 0)) * l.days;
  const inBudget = total >= LAUNCH_MIN && total <= LAUNCH_BUDGET;
  const L = s.launched ? launchResults(l, s.pack, s.post) : null;
  const ready = s.launched && wordCount(s.justification) >= 30 && wordCount(s.nextTime) >= 10;
  return (
    <div>
      <Kicker>Challenge · final launch</Kicker>
      <H2>Launch within {rupees(LAUNCH_BUDGET)}</H2>
      <p className="mt-1 text-[0.95rem] text-cocoa-2">
        You have a fixed practice budget of {rupees(LAUNCH_BUDGET)}. Plan to use between {rupees(LAUNCH_MIN)} and {rupees(LAUNCH_BUDGET)}. You can split it across two ad sets (two audiences).
      </p>
      <Sub n="1">Campaign settings</Sub>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-[0.86rem] font-bold">
          Objective
          <select value={l.objective} onChange={(e) => s.setLaunch({ objective: e.target.value as typeof l.objective })} className="rounded-xl border border-cocoa/20 px-2 py-2 font-normal">
            {OBJECTIVES.map((o) => (
              <option key={o.id} value={o.id}>
                {o.name}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-[0.86rem] font-bold">
          Creative
          <select value={l.creative} onChange={(e) => s.setLaunch({ creative: e.target.value as typeof l.creative })} className="rounded-xl border border-cocoa/20 px-2 py-2 font-normal">
            {CREATIVES.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="mt-2">
        <Slider label="Duration" min={5} max={30} step={1} value={l.days} onChange={(v) => s.setLaunch({ days: v })} fmt={(v) => `${v} days`} />
      </div>
      <Sub n="2">Ad sets & budget allocation</Sub>
      <div className="mt-2 grid gap-2">
        <AdSetEditor label="Ad set A" set={l.a} onChange={(p) => s.setLaunch({ a: { ...l.a, ...p } })} />
        {l.b ? (
          <>
            <AdSetEditor label="Ad set B" set={l.b} onChange={(p) => s.setLaunch({ b: { ...l.b!, ...p } })} />
            <button onClick={() => s.setLaunch({ b: null })} className={`${secondary} !py-1.5 text-[0.85rem]`}>
              Remove ad set B
            </button>
          </>
        ) : (
          <button onClick={() => s.setLaunch({ b: { audience: l.a.audience === "gifting" ? "corporate" : "gifting", message: "gifting", daily: 500 } })} className={`${secondary} !py-1.5 text-[0.85rem]`}>
            Add a second ad set
          </button>
        )}
      </div>
      <div className={`mt-3 flex items-center justify-between gap-2 rounded-2xl px-3 py-2 font-bold ${inBudget ? "bg-success/10" : "bg-error/10"}`}>
        <span className="flex items-center gap-2">
          <Wallet className="size-4" /> Planned spend
        </span>
        <span className="tabular-nums">
          {rupees(total)} / {rupees(LAUNCH_BUDGET)}
        </span>
      </div>
      <div className="mt-1 h-2.5 overflow-hidden rounded-full bg-cream">
        <div className={`h-full ${total > LAUNCH_BUDGET ? "bg-error" : "bg-orange"}`} style={{ width: `${Math.min(100, (total / LAUNCH_BUDGET) * 100)}%` }} />
      </div>
      {!inBudget && <p className="mt-1 text-[0.85rem] text-error">{total > LAUNCH_BUDGET ? `Over budget by ${rupees(total - LAUNCH_BUDGET)}. Lower a daily budget or shorten the run.` : `Use at least ${rupees(LAUNCH_MIN)}: unspent budget is a missed opportunity.`}</p>}
      <button disabled={!inBudget || s.launched} onClick={() => s.setLaunched(true)} className={`${primary} mt-3 w-full`}>
        <Rocket className="size-4" /> {s.launched ? "Launched (change a setting to re-plan)" : "Launch the campaign"}
      </button>

      {L && (
        <div className="mt-4 rounded-2xl border border-cocoa/10 bg-cream/60 p-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 font-display text-[1.1rem] font-semibold">
              <Megaphone className="size-5 text-orange" /> Campaign results
            </div>
            <SimTag />
          </div>
          {L.sets.map((x) => (
            <div key={x.name} className="mt-2">
              <div className="mb-1 text-[0.86rem] font-bold">
                {x.name}: {AUD[x.set.audience].name} · {MSG[x.set.message].name}
              </div>
              <MetricGrid m={x.m} />
            </div>
          ))}
          {L.sets.length > 1 && (
            <div className="mt-2">
              <div className="mb-1 text-[0.86rem] font-bold">Total</div>
              <MetricGrid m={L.total} />
            </div>
          )}
          <div className="mt-3 text-[0.8rem] font-extrabold uppercase tracking-[0.1em] text-cocoa-2">Evaluate</div>
          <div className="mt-1 grid gap-1 text-[0.86rem]">
            {L.sets.flatMap((x) => {
              const e = evaluate(x.m, { ...x.set, objective: l.objective, creative: l.creative });
              return [
                ...e.good.map((g) => (
                  <p key={`${x.name}g${g}`} className="flex items-start gap-2 rounded-xl bg-success/10 px-3 py-1.5">
                    <Check className="mt-0.5 size-4 shrink-0 text-success" /> {L.sets.length > 1 ? `${x.name}: ` : ""}
                    {g}
                  </p>
                )),
                ...e.improve.map((g) => (
                  <p key={`${x.name}i${g}`} className="flex items-start gap-2 rounded-xl bg-haldi/25 px-3 py-1.5">
                    <Target className="mt-0.5 size-4 shrink-0 text-[#9A6B00]" /> {L.sets.length > 1 ? `${x.name}: ` : ""}
                    {g}
                  </p>
                )),
              ];
            })}
          </div>
          <div className="mt-3 grid gap-3">
            <TextField label="Justify your audience and creative: why will they work for this product?" value={s.justification} onChange={s.setJustification} max={1200} rows={4} min={30} />
            <TextField label="What would you change next time, based on the results?" value={s.nextTime} onChange={s.setNextTime} max={600} rows={2} min={10} />
          </div>
        </div>
      )}
      <Checklist
        items={[
          [inBudget, `Plan within budget (${rupees(LAUNCH_MIN)}–${rupees(LAUNCH_BUDGET)})`],
          [s.launched, "Launched the campaign"],
          [wordCount(s.justification) >= 30, "Justified audience and creative (30+ words)"],
          [wordCount(s.nextTime) >= 10, "Noted what you'd change (10+ words)"],
        ]}
      />
      <Nav back="Ads lab" onBack={onBack} next="Create your project kit" ready={ready} onNext={onNext} />
    </div>
  );
}
