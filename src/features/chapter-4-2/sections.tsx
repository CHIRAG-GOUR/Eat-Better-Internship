"use client";

import { useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { BadgeIndianRupee, Check, Circle, Factory, Gift, Grid3x3, Landmark, Leaf, MapPin, Scale, Store, Swords, Tags, Target, Truck, Wheat, type LucideIcon } from "lucide-react";
import { Panel } from "@/components/chapter/Panel";
import { SectionIntro } from "@/components/chapter/SectionIntro";
import { GlossaryText } from "@/components/chapter/Glossary";
import { MediaRow } from "@/components/rich";
import { LeafBulb } from "@/components/icons/EbIcons";
import { MyWork } from "@/components/play/GameFrame";
import { createActivityStore } from "@/lib/activities";
import { BRANDS, BRAND_ROWS, EDGE_LINE, KMATRIX, KMATRIX_INTRO, K_PLAYERS, MARKET, SKUS, type BrandId, type Level, type PlayerId } from "./content";
import { GLOSSARY_4_2 } from "./glossary";
import { ACTS_42, useWork42 } from "./activities";

export const useActivities42 = createActivityStore<string>(ACTS_42.map((a) => a.id));

const sectionCls = "relative scroll-mt-6 px-3 py-6 sm:px-6 sm:py-10";
const OFFICIAL = "Official photo, eatbetterco.com";
const ASCHAPTER = "As this chapter compares them";

function PlainWords({ children }: { children: string }) {
  return (
    <div className="mt-5 flex items-start gap-3 rounded-2xl bg-cocoa p-4 text-cream">
      <LeafBulb className="mt-0.5 size-5 shrink-0 text-haldi" />
      <p className="text-[1rem] leading-snug">
        <span className="mr-1.5 text-[0.78rem] font-extrabold uppercase tracking-[0.12em] text-haldi">In plain words</span>
        {children}
      </p>
    </div>
  );
}

function SourceTag() {
  return <span className="inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-0.5 text-[0.75rem] font-extrabold uppercase tracking-[0.08em] text-cocoa-2 ring-1 ring-cocoa/15">{ASCHAPTER}</span>;
}

/* ── 1 · Market comparison: four kinds of seller ──────────────── */

const PLAYER_STYLE: Record<PlayerId, { head: string; bar: string; icon: LucideIcon }> = {
  eb: { head: "bg-orange text-white", bar: "bg-orange", icon: Leaf },
  trad: { head: "bg-[#B3261E] text-white", bar: "bg-[#B3261E]", icon: Factory },
  health: { head: "bg-forest text-white", bar: "bg-forest", icon: Wheat },
  local: { head: "bg-[#8E1F6E] text-white", bar: "bg-[#8E1F6E]", icon: Store },
};

const MAX = 2;
const pct = (v: number) => `${(v / MAX) * 100}%`;

function PriceRuler() {
  const order: PlayerId[] = ["trad", "local", "eb", "health"];
  return (
    <div className="mt-6 rounded-[22px] border border-cocoa bg-white p-4 shadow-[3px_3px_0_0_#2f1c1a] sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-display text-[1.2rem] font-semibold text-cocoa">
          <BadgeIndianRupee className="size-5 text-orange" /> Pricing tier on one ruler: ₹ per gram
        </div>
        <SourceTag />
      </div>
      <div className="mt-5 grid gap-4">
        {order.map((id, i) => {
          const m = MARKET.find((x) => x.id === id)!;
          return (
            <div key={id} className="grid gap-1.5 sm:grid-cols-[190px_1fr] sm:items-center sm:gap-4">
              <div className="flex items-baseline justify-between gap-2 sm:block">
                <div className="text-[0.98rem] font-bold leading-tight text-cocoa">{m.name}</div>
                <div className="text-[0.85rem] font-bold text-cocoa-2">
                  {m.tier} · {m.rangeText}
                </div>
              </div>
              <div className="relative h-7 rounded-full bg-cream">
                <motion.div
                  initial={{ scaleX: 0, opacity: 0 }}
                  whileInView={{ scaleX: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                  style={{ left: pct(m.range[0]), width: `calc(${pct(m.range[1] - m.range[0])})`, transformOrigin: "left" }}
                  className={`absolute inset-y-0 rounded-full ${PLAYER_STYLE[id].bar} ${id === "eb" ? "ring-2 ring-cocoa ring-offset-2 ring-offset-cream" : "opacity-85"}`}
                />
                {id === "eb" &&
                  SKUS.map((s) => (
                    <span key={s.id} title={`${s.name}: ~₹${s.perGram.toFixed(2)}/g`} style={{ left: pct(s.perGram) }} className="absolute top-1/2 size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-cocoa" />
                  ))}
              </div>
            </div>
          );
        })}
        {/* axis */}
        <div className="grid sm:grid-cols-[190px_1fr] sm:gap-4">
          <div className="hidden sm:block" />
          <div className="relative h-6">
            {[0, 0.5, 1, 1.5, 2].map((v) => (
              <span key={v} style={{ left: pct(v) }} className={`absolute top-0 text-[0.8rem] font-bold tabular-nums text-cocoa-2 ${v === 0 ? "" : v === 2 ? "-translate-x-full" : "-translate-x-1/2"}`}>
                ₹{v.toFixed(2)}
              </span>
            ))}
          </div>
        </div>
      </div>
      <p className="mt-3 text-[0.88rem] leading-snug text-cocoa-2">
        Dark dots on Eat Better&apos;s bar are its four combos from Chapter 4.1 (~₹0.67, ₹1.13, ₹1.45 and ₹1.55/g): its band runs from its cheapest to its priciest box. All ranges are approximate (“~”), as the chapter gives them.
      </p>
    </div>
  );
}

export function Market() {
  return (
    <section id="market" className={sectionCls}>
      <Panel tone="light" reveal="up" width="max-w-7xl">
        <SectionIntro index="1" kicker="Market comparison" title="Four kinds of snack seller">
          Eat Better is not only up against other health brands. The chapter sets it beside three kinds of seller a snacking family might buy from instead.
        </SectionIntro>
        <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {MARKET.map((m, i) => {
            const st = PLAYER_STYLE[m.id];
            const Icon = st.icon;
            return (
              <motion.article key={m.id} initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className={`flex min-w-0 flex-col overflow-hidden rounded-[22px] border bg-white ${m.id === "eb" ? "border-orange shadow-[4px_4px_0_0_#FF5C00]" : "border-cocoa shadow-[3px_3px_0_0_#2f1c1a]"}`}>
                <div className={`flex items-center gap-3 px-4 py-3 ${st.head}`}>
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-white/20">
                    <Icon className="size-5" />
                  </span>
                  <div className="min-w-0">
                    <div className="font-display text-[1.15rem] font-semibold leading-tight">{m.name}</div>
                    <div className="text-[0.82rem] font-bold opacity-90">{m.kind}</div>
                  </div>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <div>
                    <div className="text-[0.72rem] font-extrabold uppercase tracking-[0.1em] text-cocoa-2">Primary product focus</div>
                    <div className="mt-0.5 text-[0.98rem] font-bold leading-snug text-cocoa">{m.focus}</div>
                  </div>
                  <div>
                    <div className="text-[0.72rem] font-extrabold uppercase tracking-[0.1em] text-cocoa-2">Key ingredients &amp; cooking method</div>
                    <div className="mt-1 flex flex-wrap gap-1.5">
                      {m.ingredients.split(/;\s*|,\s*/).map((t) => (
                        <span key={t} className="rounded-full bg-cream px-2.5 py-0.5 text-[0.85rem] font-bold text-cocoa">
                          {t}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="rounded-xl bg-peach/70 p-3">
                    <div className="text-[0.72rem] font-extrabold uppercase tracking-[0.1em] text-orange">Pricing tier (price/g)</div>
                    <div className="mt-0.5 font-display text-[1.3rem] font-semibold leading-tight text-cocoa">{m.tier}</div>
                    <div className="text-[0.95rem] font-bold tabular-nums text-cocoa-2">{m.rangeText}</div>
                  </div>
                  <div className="mt-auto">
                    <div className="text-[0.72rem] font-extrabold uppercase tracking-[0.1em] text-cocoa-2">Core value proposition &amp; claims</div>
                    <p className="mt-0.5 text-[0.95rem] leading-snug text-cocoa">
                      <GlossaryText>{m.promise}</GlossaryText>
                    </p>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
        <PriceRuler />
        <div className="mt-6">
          <div className="text-[0.8rem] font-extrabold uppercase tracking-[0.12em] text-cocoa-2">How Eat Better draws the same line on its own packs</div>
          <MediaRow
            className="mt-3"
            items={[
              { kind: "image", src: "/brand/library/namkeen/millet-namkeen-pudina-punch-comparison.webp", alt: "Eat Better millet namkeen beside ordinary namkeen and fried chips: roasted not fried, made with millets, no palm oil", ratio: 1, caption: `Millet namkeen against “ordinary namkeen” and fried chips. ${OFFICIAL}` },
              { kind: "image", src: "/brand/library/nuts-seeds/premium-nut-mix-comparison.webp", alt: "Eat Better premium nut mix beside dry-fruit snacks and fried snacks", ratio: 1, caption: `Nut mix against dry-fruit snacks and fried snacks. ${OFFICIAL}` },
              { kind: "image", src: "/brand/library/chips-puffs/chickpea-puffs-imli-twist-comparison.webp", alt: "Eat Better chickpea puffs beside ordinary namkeen and fried chips: baked not fried, high protein and fibre, no palm oil", ratio: 1, caption: `Chickpea puffs against ordinary namkeen and fried chips. ${OFFICIAL}` },
            ]}
          />
          <p className="mt-2 text-[0.88rem] text-cocoa-2">These are the brand&apos;s own comparison cards, so they are claims made by Eat Better, compared with generic categories, not named brands.</p>
        </div>
        <PlainWords>
          Price per gram makes a 240 g box and a big bag of bhujia comparable. Traditional brands are the cheapest by far; Eat Better and the health brands sit in the premium band; local sweet shops sit in the middle and overlap the premium band. Each seller also promises something different: heritage taste and low price, clean ingredients, whole-food nutrition, or fresh festive sweets.
        </PlainWords>
      </Panel>
    </section>
  );
}

/* ── 2 · K-Matrix heat map ────────────────────────────────────── */

const LEVEL_CLS: Record<Level, string> = {
  High: "bg-orange text-white",
  Medium: "bg-haldi text-cocoa",
  Low: "bg-[#F6E3CF] text-cocoa-2",
};

export function KMatrix() {
  const [row, setRow] = useState<string | null>(null);
  const [col, setCol] = useState<PlayerId | null>(null);
  const counts = (id: PlayerId) => (["High", "Medium", "Low"] as Level[]).map((l) => ({ l, n: KMATRIX.filter((k) => k.v[id] === l).length }));
  const selRow = KMATRIX.find((k) => k.id === row);
  return (
    <section id="kmatrix" className={sectionCls}>
      <Panel tone="peach" reveal="left" width="max-w-7xl">
        <SectionIntro index="2" kicker="Competitive K-Matrix (feature competency mapping)" title="Who is strong at what">
          <GlossaryText>{KMATRIX_INTRO}</GlossaryText>
        </SectionIntro>
        <div className="mt-6 overflow-hidden rounded-[22px] border border-cocoa bg-white shadow-[3px_3px_0_0_#2f1c1a]">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cocoa/10 px-4 py-3">
            <div className="flex items-center gap-2 font-display text-[1.1rem] font-semibold text-cocoa">
              <Grid3x3 className="size-5 text-orange" /> Six customer choices × four players
            </div>
            <div className="flex flex-wrap items-center gap-1.5 text-[0.8rem] font-bold">
              {(["High", "Medium", "Low"] as Level[]).map((l) => (
                <span key={l} className={`rounded-md px-2 py-0.5 ${LEVEL_CLS[l]}`}>{l}</span>
              ))}
              <SourceTag />
            </div>
          </div>
          <div className="p-2 sm:p-4">
            <div role="table" aria-label="Competitive K-Matrix" className="grid grid-cols-[minmax(0,1.25fr)_repeat(4,minmax(0,1fr))] gap-1 sm:grid-cols-[minmax(0,2.1fr)_repeat(4,minmax(0,1fr))] sm:gap-1.5">
              <div role="columnheader" className="p-1 text-[0.72rem] font-extrabold uppercase tracking-[0.08em] text-cocoa-2 sm:p-2">Capability parameter</div>
              {K_PLAYERS.map((p) => (
                <button
                  key={p.id}
                  role="columnheader"
                  onClick={() => setCol(col === p.id ? null : p.id)}
                  className={`rounded-lg p-1 text-center text-[0.72rem] font-extrabold leading-tight sm:p-2 sm:text-[0.85rem] ${p.id === "eb" ? "bg-cocoa text-cream" : "bg-cream text-cocoa"} ${col === p.id ? "ring-2 ring-orange" : ""}`}
                >
                  <span className="sm:hidden">{p.short}</span>
                  <span className="hidden sm:inline">{p.name}</span>
                </button>
              ))}
              {KMATRIX.map((k, j) => (
                <div key={k.id} role="row" className="contents">
                  <button role="rowheader" onClick={() => setRow(row === k.id ? null : k.id)} className={`rounded-lg p-1.5 text-left text-[0.8rem] font-bold leading-tight text-cocoa sm:p-2.5 sm:text-[0.95rem] ${row === k.id ? "bg-peach ring-2 ring-orange" : "bg-cream/60 hover:bg-cream"}`}>
                    <span className="sm:hidden">{k.short}</span>
                    <span className="hidden sm:inline">{k.param}</span>
                  </button>
                  {K_PLAYERS.map((p, i) => {
                    const lv = k.v[p.id];
                    const dim = (row && row !== k.id) || (col && col !== p.id);
                    return (
                      <motion.div
                        key={p.id}
                        role="cell"
                        initial={{ opacity: 0, scale: 0.85 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.05 * (j * 4 + i) * 0.5 }}
                        className={`grid min-h-11 place-items-center rounded-lg text-[0.78rem] font-extrabold transition-opacity sm:min-h-12 sm:text-[0.95rem] ${LEVEL_CLS[lv]} ${p.id === "eb" ? "outline outline-2 outline-cocoa" : ""} ${dim ? "opacity-30" : ""}`}
                      >
                        {lv}
                      </motion.div>
                    );
                  })}
                </div>
              ))}
              <div className="p-1 text-[0.72rem] font-extrabold uppercase tracking-[0.08em] text-cocoa-2 sm:p-2">Profile</div>
              {K_PLAYERS.map((p) => (
                <div key={p.id} className="flex flex-col items-stretch gap-0.5 p-0.5">
                  {counts(p.id).map(({ l, n }) => (
                    <div key={l} className="flex items-center gap-1">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-cream">
                        <div className={`h-full ${l === "High" ? "bg-orange" : l === "Medium" ? "bg-haldi" : "bg-[#E8CBAE]"}`} style={{ width: `${(n / 6) * 100}%` }} />
                      </div>
                      <span className="w-3 text-right text-[0.7rem] font-extrabold tabular-nums text-cocoa-2">{n}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="border-t border-cocoa/10 bg-cream/60 px-4 py-3 text-[0.95rem] text-cocoa" aria-live="polite">
            {selRow ? (
              <span>
                <strong>{selRow.param}:</strong> {selRow.plain}
              </span>
            ) : col ? (
              <span>
                <strong>{K_PLAYERS.find((p) => p.id === col)!.name}</strong> profile: {counts(col).map(({ l, n }) => `${n} ${l}`).join(", ")}. Tap the header again to clear.
              </span>
            ) : (
              <span>Tap a parameter to see what it means, or a player to read its column. Profile bars count each player&apos;s High, Medium and Low ratings.</span>
            )}
          </div>
        </div>
        <PlainWords>
          Read down a column to see one player&apos;s strengths. Read across a row to see who is ahead on one thing customers choose by. A point of difference is a row where one player is High and the others are not; a capability gap is a row where a player sits below its rivals. Activity 2 asks you to find both for Eat Better.
        </PlainWords>
      </Panel>
    </section>
  );
}

/* ── 3 · Six-brand comparison ────────────────────────────────── */

const ROW_ICON: Record<(typeof BRAND_ROWS)[number]["key"], LucideIcon> = { hq: MapPin, category: Tags, positioning: Target, usp: Landmark, price: Scale, channels: Truck, edge: Swords };
const CHANNEL_COLS: { label: string; match: RegExp }[] = [
  { label: "Online", match: /online|d2c website/i },
  { label: "Quick-commerce", match: /quick/i },
  { label: "Corporate gifting", match: /corporate/i },
  { label: "Modern retail", match: /modern retail/i },
  { label: "Retail", match: /^retail$/i },
];
const PRICE_ZONES = ["Mid", "Mid to premium", "Premium"];

export function Brands() {
  const [sel, setSel] = useState<BrandId>("yoga");
  const eb = BRANDS[0];
  const rival = BRANDS.find((b) => b.id === sel)!;
  return (
    <section id="brands" className={sectionCls}>
      <Panel tone="light" reveal="right" width="max-w-7xl">
        <SectionIntro index="3" kicker="Brand comparison" title="Eat Better and five health-snack brands">
          The chapter also names five health-snack brands and compares them with Eat Better on seven points. Pick a rival to put it side by side.
        </SectionIntro>

        <div className="mt-6 flex flex-wrap items-center gap-2" role="tablist" aria-label="Choose a brand to compare with Eat Better">
          <span className="rounded-full bg-orange px-3.5 py-1.5 text-[0.95rem] font-extrabold text-white">Eat Better Co</span>
          <span className="font-display text-[1.1rem] font-semibold text-cocoa-2">vs</span>
          {BRANDS.slice(1).map((b) => (
            <button key={b.id} role="tab" aria-selected={sel === b.id} data-testid={`brand-${b.id}`} onClick={() => setSel(b.id)} className={`rounded-full border px-3.5 py-1.5 text-[0.95rem] font-bold ${sel === b.id ? "border-cocoa bg-cocoa text-cream" : "border-cocoa/25 bg-white text-cocoa hover:border-cocoa"}`}>
              {b.name}
            </button>
          ))}
          <span className="ml-auto">
            <SourceTag />
          </span>
        </div>

        <div className="mt-4 overflow-hidden rounded-[22px] border border-cocoa bg-white shadow-[3px_3px_0_0_#2f1c1a]">
          <div className="hidden grid-cols-[180px_1fr_1fr] border-b border-cocoa/10 md:grid">
            <div />
            <div className="bg-orange px-4 py-2.5 font-display text-[1.15rem] font-semibold text-white">Eat Better Co</div>
            <div className="bg-cocoa px-4 py-2.5 font-display text-[1.15rem] font-semibold text-cream">{rival.name}</div>
          </div>
          <AnimatePresence mode="wait">
            <motion.div key={sel} initial={{ opacity: 0, x: 18 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -18 }} transition={{ duration: 0.25 }}>
              {BRAND_ROWS.filter((r) => r.key !== "edge").map((r) => {
                const Icon = ROW_ICON[r.key];
                return (
                  <div key={r.key} className="grid gap-2 border-b border-cocoa/10 px-3 py-3 md:grid-cols-[180px_1fr_1fr] md:gap-0 md:p-0">
                    <div className="flex items-center gap-2 text-[0.78rem] font-extrabold uppercase tracking-[0.1em] text-cocoa-2 md:px-4 md:py-3">
                      <Icon className="size-4 text-orange" /> {r.label}
                    </div>
                    <div className="rounded-xl bg-peach/60 px-3 py-2 text-[0.98rem] font-semibold leading-snug text-cocoa md:rounded-none md:px-4 md:py-3">
                      <span className="mr-1.5 text-[0.72rem] font-extrabold uppercase text-orange md:hidden">Eat Better</span>
                      <GlossaryText>{eb.rows[r.key]}</GlossaryText>
                    </div>
                    <div className="rounded-xl bg-cream px-3 py-2 text-[0.98rem] font-semibold leading-snug text-cocoa md:rounded-none md:px-4 md:py-3">
                      <span className="mr-1.5 text-[0.72rem] font-extrabold uppercase text-cocoa-2 md:hidden">{rival.name}</span>
                      <GlossaryText>{rival.rows[r.key]}</GlossaryText>
                    </div>
                  </div>
                );
              })}
              <div className="flex items-start gap-3 bg-cocoa px-4 py-4 text-cream">
                <Swords className="mt-0.5 size-5 shrink-0 text-haldi" />
                <div>
                  <div className="text-[0.75rem] font-extrabold uppercase tracking-[0.12em] text-haldi">Eat Better&apos;s edge over {rival.name}</div>
                  <div className="font-display text-[1.25rem] font-semibold leading-snug">{rival.rows.edge}</div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* all six at a glance */}
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <div className="rounded-[22px] bg-cream p-4 sm:p-5">
            <div className="flex items-center gap-2 font-display text-[1.1rem] font-semibold text-cocoa">
              <Scale className="size-5 text-orange" /> Price feel
            </div>
            <div className="mt-3 grid grid-cols-3 gap-2">
              {PRICE_ZONES.map((z, i) => (
                <div key={z} className="flex flex-col gap-1.5">
                  <div className={`rounded-lg px-2 py-1 text-center text-[0.78rem] font-extrabold uppercase tracking-[0.06em] ${i === 2 ? "bg-orange text-white" : i === 1 ? "bg-haldi text-cocoa" : "bg-white text-cocoa"}`}>{z}</div>
                  {BRANDS.filter((b) => b.priceFeel === i + 1).map((b) => (
                    <div key={b.id} className={`rounded-lg px-2 py-1.5 text-center text-[0.85rem] font-bold leading-tight ${b.id === "eb" ? "border-2 border-orange bg-white text-cocoa" : "bg-white text-cocoa"}`}>
                      {b.name}
                      {b.id === "eb" && <span className="block text-[0.72rem] font-bold text-orange">small trial packs ₹22 to ₹89</span>}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-[22px] bg-cream p-4 sm:p-5">
            <div className="flex items-center gap-2 font-display text-[1.1rem] font-semibold text-cocoa">
              <Truck className="size-5 text-orange" /> Main channels
            </div>
            <div className="mt-3 grid grid-cols-[minmax(0,1.3fr)_repeat(5,minmax(0,1fr))] gap-1 text-center">
              <div />
              {CHANNEL_COLS.map((c) => (
                <div key={c.label} className="px-0.5 text-[0.66rem] font-extrabold uppercase leading-tight tracking-[0.02em] text-cocoa-2 sm:text-[0.72rem]">
                  {c.label}
                </div>
              ))}
              {BRANDS.map((b) => (
                <div key={b.id} className="contents">
                  <div className={`py-1.5 text-left text-[0.85rem] font-bold leading-tight ${b.id === "eb" ? "text-orange" : "text-cocoa"}`}>{b.name}</div>
                  {CHANNEL_COLS.map((c) => {
                    const hit = b.channels.find((ch) => c.match.test(ch.replace(/^mostly\s+/i, "")));
                    return (
                      <div key={c.label} className="grid place-items-center" title={hit}>
                        {hit ? <span className={`grid size-6 place-items-center rounded-full ${b.id === "eb" ? "bg-orange" : "bg-cocoa"} text-white`}><Check className="size-3.5" strokeWidth={3} /></span> : <span className="size-2 rounded-full bg-cocoa/15" />}
                      </div>
                    );
                  })}
                </div>
              ))}
            </div>
            <p className="mt-2 text-[0.8rem] leading-snug text-cocoa-2">“Online” includes Eat Better&apos;s own D2C website and Nourish You&apos;s “mostly online”.</p>
          </div>
        </div>
        <PlainWords>
          All five rivals list online as a main channel, and most are built around a health need: fitness, seeds, low-carb or diet variety (True Elements offers a wide range). In this chapter&apos;s comparison Eat Better is the one built around familiar Indian snacks, and the only one listed with quick-commerce and corporate gifting.
        </PlainWords>
      </Panel>
    </section>
  );
}

/* ── 4 · Eat Better's edge, rival by rival ───────────────────── */

const EDGE_IMG: Record<Exclude<BrandId, "eb">, { src: string; alt: string; caption: string }> = {
  yoga: { src: "/brand/library/hampers/diwali-rangoli-open.webp", alt: "An Eat Better Diwali hamper opened to show laddoos, namkeen and sweets", caption: "A Diwali hamper: festive and gifting." },
  true: { src: "/brand/library/site/story-familiar-taste.webp", alt: "A close-up of someone biting into a date-and-nut laddoo", caption: "A laddoo: indulgent and desi." },
  nourish: { src: "/brand/library/namkeen/millet-namkeen-mango-achaari-lifestyle.webp", alt: "Three friends sharing a bowl of millet namkeen", caption: "Namkeen shared around: a wide taste." },
  lo: { src: "/brand/library/namkeen/millet-bhel-kolkata-jhalmuri-lifestyle.webp", alt: "A group of friends and family sharing jhalmuri at a table", caption: "A shared table: the family market." },
  evolve: { src: "/brand/library/site/story-founder.webp", alt: "Eat Better's founder holding the brand's snack packs", caption: "The founder with the range: the brand story." },
};

export function Edge() {
  return (
    <section id="edge" className={sectionCls}>
      <Panel tone="peach" reveal="up" width="max-w-7xl">
        <SectionIntro index="4" kicker="Eat Better's edge" title="One edge for each rival">
          The last row of the brand table says where Eat Better is stronger than each rival, in the chapter&apos;s words.
        </SectionIntro>
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {BRANDS.slice(1).map((b, i) => {
            const img = EDGE_IMG[b.id as Exclude<BrandId, "eb">];
            return (
              <motion.article key={b.id} initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }} className="flex min-w-0 flex-col overflow-hidden rounded-[22px] border border-cocoa bg-white shadow-[3px_3px_0_0_#2f1c1a]">
                <div className="relative aspect-square bg-cream">
                  <Image src={img.src} alt={img.alt} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 20vw" className="object-cover" />
                  <span className="absolute left-3 top-3 rounded-full border border-cocoa bg-cream px-2.5 py-1 text-[0.8rem] font-extrabold text-cocoa">vs {b.name}</span>
                </div>
                <div className="flex flex-1 flex-col gap-2 p-4">
                  <div className="text-[0.75rem] font-extrabold uppercase tracking-[0.1em] text-cocoa-2">{b.name}: {b.rows.positioning}</div>
                  <div className="font-display text-[1.15rem] font-semibold leading-snug text-cocoa">{b.rows.edge}</div>
                  <p className="mt-auto text-[0.8rem] leading-snug text-cocoa-2">
                    {img.caption} {OFFICIAL}
                  </p>
                </div>
              </motion.article>
            );
          })}
        </div>
        <div className="mt-6 rounded-[22px] border border-orange bg-white p-4 shadow-[4px_4px_0_0_#FF5C00] sm:p-6">
          <div className="text-[0.78rem] font-extrabold uppercase tracking-[0.12em] text-orange">And in Eat Better&apos;s own column</div>
          <div className="mt-1 font-display text-[clamp(1.3rem,2.6vw,1.7rem)] font-semibold leading-snug text-cocoa">{BRANDS[0].rows.edge}</div>
          <MediaRow
            className="mt-4"
            items={[
              { kind: "image", src: "/brand/library/laddoos/orange-ginger-laddoos-claims.webp", alt: "Orange ginger laddoo claim card: sweetened with dates, made with 88% dry fruits and nuts", ratio: 1, caption: `Laddoo. ${OFFICIAL}` },
              { kind: "image", src: "/brand/library/namkeen/millet-namkeen-desi-masala-claims.webp", alt: "Millet namkeen desi masala claim card: roasted not fried, no palm oil, made with millets", ratio: 1, caption: `Namkeen. ${OFFICIAL}` },
              { kind: "image", src: "/brand/library/namkeen/millet-bhel-bombay-bhelpuri-claims.webp", alt: "Millet bhel Bombay bhelpuri claim card: roasted not fried, no palm oil, made with millets", ratio: 1, caption: `Bhel. ${OFFICIAL}` },
            ]}
          />
        </div>
      </Panel>
    </section>
  );
}

/* ── 5 · Activities ───────────────────────────────────────────── */

function ActivityRun({ id, Comp }: { id: string; Comp: React.ComponentType<{ onDone: (summary: string) => void }> }) {
  const complete = useActivities42((s) => s.complete);
  const save = useWork42((s) => s.save);
  return (
    <Comp
      onDone={(summary) => {
        save(id, summary);
        complete(id);
      }}
    />
  );
}

export function Activities() {
  return (
    <section id="activities" className={sectionCls}>
      <Panel tone="light" reveal="up" width="max-w-7xl">
        <SectionIntro index="5" kicker="Activities" title="Play the market" />
        <p className="mt-2 max-w-3xl text-[1.05rem] text-cocoa">Three 3D games built on this chapter&apos;s tables: score shoppers with the K-Matrix, build the matrix as towers, and climb the ₹-per-gram ladder. The shoppers and the questions change every time you restart.</p>
        <div className="mt-6 grid gap-8">
          {ACTS_42.map((a) => (
            <ActivityRun key={a.id} id={a.id} Comp={a.Comp} />
          ))}
        </div>
      </Panel>
    </section>
  );
}

/* ── Wrap-up ──────────────────────────────────────────────────── */

const RECAP: { title: string; icon: LucideIcon }[] = [
  { title: "Four kinds of seller", icon: Store },
  { title: "Compare per gram", icon: BadgeIndianRupee },
  { title: "Read across a row", icon: Grid3x3 },
  { title: "Five named rivals", icon: Swords },
  { title: "Festive, desi, family", icon: Gift },
];

export function WrapUp() {
  const done = useActivities42((s) => s.done);
  const work = useWork42((s) => s.work);
  const list = ACTS_42.map((a) => ({ id: a.id, label: a.label }));
  const n = list.filter((a) => done[a.id]).length;
  return (
    <section id="wrap-up" className={sectionCls}>
      <Panel tone="light" reveal="up" width="max-w-7xl">
        <div className="text-[0.85rem] font-extrabold uppercase tracking-[0.16em] text-orange">Chapter 4.2 · Wrap-up</div>
        <h2 className="mt-3 font-display text-[clamp(2.1rem,5vw,3.2rem)] font-semibold leading-[1.04] text-cocoa">Know the shelf you stand on</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          {RECAP.map((r, i) => {
            const Icon = r.icon;
            return (
              <motion.div key={r.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className="flex flex-col items-center gap-2 rounded-2xl border border-cocoa bg-cream p-4 text-center shadow-[2px_2px_0_0_#2f1c1a]">
                <span className="grid size-11 place-items-center rounded-full bg-orange text-white">
                  <Icon className="size-5" />
                </span>
                <span className="text-[0.95rem] font-bold leading-tight text-cocoa">{r.title}</span>
              </motion.div>
            );
          })}
        </div>
        <div className="mt-5 flex items-start gap-3 rounded-[22px] bg-cocoa p-5 text-cream">
          <LeafBulb className="mt-0.5 size-6 shrink-0 text-haldi" />
          <p className="font-display text-[1.15rem] leading-snug">{EDGE_LINE}</p>
        </div>
        <div className="mt-6 rounded-[22px] bg-peach/70 p-5">
          <div className="flex items-baseline justify-between">
            <span className="font-display text-[1.2rem] font-semibold text-cocoa">Activities on this page</span>
            <span className="font-bold text-cocoa-2">
              {n}/{list.length}
            </span>
          </div>
          <ul className="mt-3 grid gap-2 sm:grid-cols-3">
            {list.map((a) => (
              <li key={a.id} className="flex items-center gap-2 text-[1rem] text-cocoa">
                {done[a.id] ? <Check className="size-5 shrink-0 text-success" strokeWidth={3} /> : <Circle className="size-5 shrink-0 text-cocoa-2/40" />}
                {a.label}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[0.9rem] text-cocoa-2/80">Shown for this visit only. This page doesn&apos;t record progress in the LMS.</p>
        </div>
        <MyWork chapter="4.2" items={list.map((a) => ({ label: a.label, text: work[a.id] }))} />
        <details className="group mt-6 rounded-[22px] border border-cocoa/15 bg-white p-5" open>
          <summary className="cursor-pointer list-none font-display text-[1.2rem] font-semibold text-cocoa">Words from this chapter</summary>
          <dl className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {GLOSSARY_4_2.map((g) => (
              <div key={g.term} className="rounded-xl bg-cream p-3">
                <dt className="font-bold text-cocoa">{g.term}</dt>
                <dd className="mt-0.5 text-[0.92rem] leading-snug text-cocoa">{g.general}</dd>
                <dd className="mt-1 text-[0.85rem] leading-snug text-cocoa-2">{g.chapter}</dd>
              </div>
            ))}
          </dl>
        </details>
      </Panel>
    </section>
  );
}
