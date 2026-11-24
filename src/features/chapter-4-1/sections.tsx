"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { Check, Circle, Droplets, Layers, PackageOpen, Receipt, ShoppingBasket, TrendingUp, Truck, Wheat, type LucideIcon } from "lucide-react";
import { Panel } from "@/components/chapter/Panel";
import { SectionIntro } from "@/components/chapter/SectionIntro";
import { GlossaryText } from "@/components/chapter/Glossary";
import { VideoBlock } from "@/components/chapter/VideoBlock";
import { MediaRow, StatBand } from "@/components/rich";
import { LeafBulb } from "@/components/icons/EbIcons";
import { MyWork } from "@/components/play/GameFrame";
import { createActivityStore } from "@/lib/activities";
import { DRIVERS, FIN, LIB, SKUS, TAKEAWAY } from "./content";
import { ACTS_41, useWork41 } from "./activities";

export const useActivities41 = createActivityStore<string>(ACTS_41.map((a) => a.id));

const sectionCls = "relative scroll-mt-6 px-3 py-6 sm:px-6 sm:py-10";
const OFFICIAL = "Official photo, eatbetterco.com";
const EASE = [0.16, 1, 0.3, 1] as const;

/* ── 1 · Price per gram ───────────────────────────────────────── */

function Bar({ pct, label, tone = "orange", delay = 0 }: { pct: number; label: string; tone?: "orange" | "cocoa" | "success"; delay?: number }) {
  const bg = tone === "orange" ? "bg-orange" : tone === "success" ? "bg-success" : "bg-cocoa";
  return (
    <div className="flex items-center gap-2">
      <div className="h-4 min-w-0 flex-1 overflow-hidden rounded-full bg-cocoa/10">
        <motion.div initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }} transition={{ duration: 0.9, delay, ease: EASE }} className={`h-full rounded-full ${bg}`} />
      </div>
      <span className="w-[5.2rem] shrink-0 text-right font-display text-[1.05rem] font-semibold tabular-nums text-cocoa">{label}</span>
    </div>
  );
}

export function PriceTable() {
  const max = Math.max(...SKUS.map((s) => s.pg));
  const grams100 = SKUS.map((s) => ({ ...s, g: 100 / s.pg }));
  const maxG = Math.max(...grams100.map((s) => s.g));
  return (
    <section id="price" className={sectionCls}>
      <Panel tone="light" reveal="up" width="max-w-7xl">
        <SectionIntro index="1" kicker="Product pricing & price-per-gram metrics" title="What does one gram cost?">
          <GlossaryText>Product pricing across FMCG categories varies based on ingredient quality, processing techniques, and packaging formats. Comparing products on a price-per-gram basis reveals how premium positioning and raw material costs influence retail strategy.</GlossaryText>
        </SectionIntro>
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {SKUS.map((s, i) => (
            <motion.article key={s.id} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ delay: i * 0.07, duration: 0.5, ease: EASE }} className="flex min-w-0 flex-row overflow-hidden rounded-[22px] border border-cocoa bg-white shadow-[3px_3px_0_0_#2f1c1a] sm:flex-col">
              {/* phones: photo beside the numbers so all four packs fit on about one screen */}
              <div className="relative aspect-square w-[40%] shrink-0 self-start bg-cream sm:w-full">
                <Image src={s.img} alt={s.alt} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 50vw, 300px" className="object-cover" />
                <span className="absolute left-2 top-2 rounded-full bg-cocoa px-2.5 py-0.5 text-[0.8rem] font-bold text-cream">{s.grams} g</span>
              </div>
              <div className="flex min-w-0 flex-1 flex-col gap-2 p-3 sm:p-4">
                <h3 className="font-display text-[1.02rem] font-semibold leading-tight text-cocoa sm:text-[1.08rem]">
                  <GlossaryText>{s.name}</GlossaryText>
                </h3>
                <div className="flex items-baseline justify-between gap-2">
                  <span className="text-[0.9rem] font-bold text-cocoa-2">Retail price</span>
                  <span className="font-display text-[1.3rem] font-semibold text-cocoa sm:text-[1.5rem]">₹{s.price}</span>
                </div>
                <Bar pct={(s.pg / max) * 100} label={`~₹${s.pg.toFixed(2)}/g`} tone={s.pg === Math.min(...SKUS.map((k) => k.pg)) ? "success" : s.pg === max ? "cocoa" : "orange"} delay={0.2 + i * 0.07} />
              </div>
            </motion.article>
          ))}
        </div>
        <p className="mt-2 text-[0.85rem] text-cocoa-2">Bars are scaled to the dearest price per gram. Photos: official, eatbetterco.com.</p>

        <div className="mt-6 grid gap-5 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div className="rounded-[22px] bg-cream p-5">
            <div className="font-display text-[1.2rem] font-semibold text-cocoa">What does ₹100 buy?</div>
            <p className="mb-3 text-[0.92rem] text-cocoa-2">Worked out from the table: 100 ÷ price per gram.</p>
            <div className="grid gap-3">
              {grams100.map((s, i) => (
                <div key={s.id}>
                  <div className="mb-1 text-[0.92rem] font-bold text-cocoa">{s.short}</div>
                  <Bar pct={(s.g / maxG) * 100} label={`~${Math.round(s.g)} g`} tone="cocoa" delay={i * 0.07} />
                </div>
              ))}
            </div>
          </div>
          <div className="flex flex-col justify-center gap-3 rounded-[22px] bg-cocoa p-5 text-cream">
            <div className="font-display text-[1.3rem] font-semibold">Read the bars, not the box size</div>
            <p className="text-[1rem] leading-snug">The namkeen combo is the cheapest per gram and the laddoo boxes are the dearest. Now look at the two laddoo boxes: is the bigger one cheaper per gram, the way you would expect?</p>
            <p className="text-[0.95rem] opacity-85">You will check this yourself on a 3D scale in the first activity.</p>
          </div>
        </div>
      </Panel>
    </section>
  );
}

/* ── 2 · Drivers of price variation ───────────────────────────── */

function Chip({ children, tone = "good" }: { children: string; tone?: "good" | "plain" | "gone" }) {
  const cls = tone === "good" ? "bg-success/12 text-cocoa" : tone === "gone" ? "bg-error/10 text-cocoa line-through decoration-error decoration-2" : "bg-cocoa/10 text-cocoa-2";
  return <span className={`rounded-full px-2.5 py-1 text-[0.88rem] font-bold ${cls}`}>{children}</span>;
}

function DriverCard({ n, icon: Icon, title, text, children }: { n: number; icon: LucideIcon; title: string; text: string; children: React.ReactNode }) {
  return (
    <motion.article initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-40px" }} transition={{ delay: n * 0.08, duration: 0.5, ease: EASE }} className="flex min-w-0 flex-col overflow-hidden rounded-[24px] border border-cocoa bg-white shadow-[3px_3px_0_0_#2f1c1a]">
      <div className="flex items-center gap-3 bg-cream px-4 py-3">
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-orange text-white">
          <Icon className="size-5" />
        </span>
        <h3 className="font-display text-[1.12rem] font-semibold leading-tight text-cocoa">{title}</h3>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">{children}</div>
      <p className="border-t border-cocoa/10 bg-peach/40 px-4 py-3 text-[0.95rem] leading-snug text-cocoa">
        <GlossaryText>{text}</GlossaryText>
      </p>
    </motion.article>
  );
}

function Photo({ src, alt, ratio = 1 }: { src: string; alt: string; ratio?: number }) {
  return (
    <div className="relative w-full overflow-hidden rounded-xl border border-cocoa/20 bg-cream" style={{ aspectRatio: ratio }}>
      <Image src={src} alt={alt} fill sizes="(max-width: 640px) 90vw, 420px" className="object-cover" />
    </div>
  );
}

export function Drivers() {
  return (
    <section id="drivers" className={sectionCls}>
      <Panel tone="peach" reveal="left" width="max-w-7xl">
        <SectionIntro index="2" kicker="Drivers of price variation" title="Three reasons a gram costs what it costs" />
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          <DriverCard n={0} icon={Wheat} title={DRIVERS.bom.title} text={DRIVERS.bom.text}>
            <div>
              <Photo src={`${LIB}/nuts-seeds/premium-nut-mix-ingredients.webp`} alt="Ingredient grid for Premium Nut Mix: cashews, almonds, raisins, pistachios" />
            </div>
            <div>
              <div className="mb-1 text-[0.78rem] font-extrabold uppercase tracking-[0.1em] text-success">Higher unit cost</div>
              <div className="flex flex-wrap gap-1.5">{["dates", "almonds", "cashews", "quinoa", "seeds"].map((c) => <Chip key={c}>{c}</Chip>)}</div>
            </div>
            <div>
              <div className="mb-1 text-[0.78rem] font-extrabold uppercase tracking-[0.1em] text-cocoa-2">Lower unit cost, conventional snacks</div>
              <div className="flex flex-wrap gap-1.5">{["refined flour (maida)", "potatoes", "palm oil"].map((c) => <Chip key={c} tone="plain">{c}</Chip>)}</div>
            </div>
          </DriverCard>
          <DriverCard n={1} icon={Droplets} title={DRIVERS.clean.title} text={DRIVERS.clean.text}>
            <Photo src={`${LIB}/combos/assorted-laddoo-box-24-claims.webp`} alt="What makes it better: vegan and gluten free, sweetened with dates, more than 80% dry fruits and nuts" />
            <div>
              <div className="mb-1 text-[0.78rem] font-extrabold uppercase tracking-[0.1em] text-error">Left out</div>
              <div className="flex flex-wrap gap-1.5">{["artificial preservatives", "bad fats", "refined sugars"].map((c) => <Chip key={c} tone="gone">{c}</Chip>)}</div>
            </div>
            <div className="flex items-center gap-2 rounded-xl bg-orange/10 px-3 py-2 text-[0.95rem] font-bold text-cocoa">
              <TrendingUp className="size-5 shrink-0 text-orange" /> A value-based pricing premium from health-conscious consumers
            </div>
          </DriverCard>
          <DriverCard n={2} icon={Layers} title={DRIVERS.multi.title} text={DRIVERS.multi.text}>
            <Photo src={`${LIB}/combos/ultimate-snack-box-contents.webp`} alt="Everything packed inside an Ultimate Snack Box" />
            <div className="grid grid-cols-3 items-center gap-2 text-center">
              {[
                { i: PackageOpen, t: "12 packs" },
                { i: Truck, t: "1 shipment" },
                { i: Receipt, t: "~₹1.13/g" },
              ].map(({ i: I, t }) => (
                <div key={t} className="flex flex-col items-center gap-1 rounded-xl bg-cream px-1 py-2">
                  <I className="size-5 text-orange" />
                  <span className="text-[0.9rem] font-bold text-cocoa">{t}</span>
                </div>
              ))}
            </div>
            <p className="text-[0.88rem] text-cocoa-2">Shipping and primary packaging overhead is shared across more units.</p>
          </DriverCard>
        </div>
      </Panel>
    </section>
  );
}

/* ── 3 · Financial performance ────────────────────────────────── */

function RevenueBars() {
  const h = (v: number) => Math.round((v / FIN.revenueCrore) * 150);
  return (
    <div className="rounded-[22px] border border-cocoa bg-white p-5 shadow-[3px_3px_0_0_#2f1c1a]">
      <div className="flex items-center justify-between gap-2">
        <span className="font-display text-[1.2rem] font-semibold text-cocoa">Operating revenue</span>
        <span className="rounded-full bg-success/15 px-3 py-1 text-[0.95rem] font-extrabold text-success">~{FIN.growthPct}% YoY</span>
      </div>
      <div className="mt-4 grid grid-cols-2 items-end gap-6" style={{ height: 220 }}>
        {[
          { l: "FY23", v: FIN.priorCrore, c: "bg-cocoa/70", t: `~₹${FIN.priorCrore} crore`, n: "implied" },
          { l: "FY24", v: FIN.revenueCrore, c: "bg-orange", t: `~₹${FIN.revenueCrore} crore`, n: "reported" },
        ].map((b, i) => (
          <div key={b.l} className="flex h-full flex-col justify-end">
            <div className="mb-1 text-center font-display text-[1.15rem] font-semibold text-cocoa">{b.t}</div>
            <motion.div initial={{ height: 0 }} whileInView={{ height: h(b.v) }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.2 + i * 0.25, ease: EASE }} className={`rounded-t-xl ${b.c}`} />
            <div className="mt-1 text-center text-[0.95rem] font-bold text-cocoa">
              {b.l} <span className="font-normal text-cocoa-2">({b.n})</span>
            </div>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[0.85rem] leading-snug text-cocoa-2">FY23 is worked out from the two reported figures: ₹14.7 crore ÷ (1 + 1.65) ≈ ₹5.5 crore. Treat it as approximate.</p>
    </div>
  );
}

function LossMeter() {
  const pct = (FIN.netLossLakh / (FIN.revenueCrore * 100)) * 100;
  return (
    <div className="rounded-[22px] border border-cocoa bg-white p-5 shadow-[3px_3px_0_0_#2f1c1a]">
      <span className="font-display text-[1.2rem] font-semibold text-cocoa">How big is the loss?</span>
      <p className="mt-1 text-[0.95rem] text-cocoa-2">
        <GlossaryText>{`Net loss ~₹${FIN.netLossLakh} lakh against ~₹${FIN.revenueCrore} crore (1,470 lakh) of revenue.`}</GlossaryText>
      </p>
      <div className="mt-4 flex h-9 overflow-hidden rounded-xl border border-cocoa/30">
        <motion.div initial={{ width: 0 }} whileInView={{ width: `${pct}%` }} viewport={{ once: true }} transition={{ duration: 1, delay: 0.3, ease: EASE }} className="flex min-w-[2.2rem] items-center justify-center bg-error text-[0.8rem] font-extrabold text-white" />
        <div className="flex-1 bg-orange/15" />
      </div>
      <div className="mt-2 flex justify-between text-[0.88rem] font-bold text-cocoa">
        <span className="text-error">Loss ~{pct.toFixed(1)}% of revenue (worked out)</span>
        <span>Revenue 100%</span>
      </div>
      <p className="mt-3 text-[0.95rem] leading-snug text-cocoa">
        <GlossaryText>{FIN.loss}</GlossaryText>
      </p>
    </div>
  );
}

function OrderGrid() {
  return (
    <div className="rounded-[22px] border border-cocoa bg-white p-5 shadow-[3px_3px_0_0_#2f1c1a]">
      <span className="font-display text-[1.2rem] font-semibold text-cocoa">Orders every month</span>
      <div className="mt-3 grid grid-cols-10 gap-1.5" aria-label="20 parcels, each standing for 10,000 orders">
        {Array.from({ length: 20 }, (_, i) => (
          <motion.span key={i} initial={{ opacity: 0, scale: 0.4 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }} transition={{ delay: i * 0.04 }} className="grid aspect-square place-items-center rounded-md bg-orange text-white">
            <ShoppingBasket className="size-3/5" />
          </motion.span>
        ))}
      </div>
      <p className="mt-2 text-[0.88rem] font-bold text-cocoa-2">Each basket stands for 10,000 orders: 20 baskets = ~2 lakh.</p>
      <p className="mt-2 text-[0.95rem] leading-snug text-cocoa">
        <GlossaryText>{FIN.orders}</GlossaryText>
      </p>
    </div>
  );
}

export function Financials() {
  return (
    <section id="financials" className={sectionCls}>
      <Panel tone="light" reveal="right" width="max-w-7xl">
        <SectionIntro index="3" kicker="Financial performance & scale trajectory" title="Growing fast, still in the red">
          <GlossaryText>{FIN.text}</GlossaryText>
        </SectionIntro>
        <div className="mt-6">
          <StatBand
            tone="cocoa"
            stats={[
              { value: FIN.revenueCrore, prefix: "~₹", suffix: " crore", decimals: 1, label: "FY24 operating revenue (reported)", icon: TrendingUp },
              { value: FIN.growthPct, prefix: "~", suffix: "%", label: "year-on-year growth over FY23", icon: Layers },
              { value: FIN.netLossLakh, prefix: "~₹", suffix: " lakh", label: "net loss, FY24", icon: Receipt },
              { value: FIN.ordersLakh, prefix: "~", suffix: " lakh", label: "fulfilled orders per month", icon: ShoppingBasket },
            ]}
          />
        </div>
        <div className="mt-5 grid items-stretch gap-4 lg:grid-cols-3">
          <RevenueBars />
          <LossMeter />
          <OrderGrid />
        </div>
        <p className="mt-4 max-w-4xl text-[1rem] leading-snug text-cocoa">
          <GlossaryText>{FIN.revenue}</GlossaryText>
        </p>
        <div className="mt-6 grid items-start gap-5 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
          <VideoBlock
            kind="file"
            h264="/chapter-4-1/video/financial-performance.mp4"
            poster="/chapter-4-1/video/financial-performance-poster.jpg"
            title="Eat Better Co on Shark Tank India S4 · Financial Performance & Scale Trajectory"
            caption="Shark Tank India, Season 4 (Sony LIV) — Financial performance, revenues & growth metrics."
            badge="Shark Tank India S4"
          />
          <MediaRow
            items={[
              { kind: "image", src: `${LIB}/combos/ultimate-snack-box-claims.webp`, alt: "Ultimate Snack Box claims panel", ratio: 1, caption: `A quick-commerce style combo. ${OFFICIAL}` },
            ]}
          />
        </div>
      </Panel>
    </section>
  );
}

/* ── 4 · Activities ───────────────────────────────────────────── */

function ActivityRun({ id, Comp }: { id: string; Comp: React.ComponentType<{ onDone: (summary: string) => void }> }) {
  const complete = useActivities41((s) => s.complete);
  const save = useWork41((s) => s.save);
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
        <SectionIntro index="4" kicker="Activities" title="Put it into practice" />
        <p className="mt-2 max-w-3xl text-[1.05rem] text-cocoa">Two 3D games built on Eat Better&apos;s real packs and this chapter. Each step opens only when your working is right. Practice numbers are always labelled.</p>
        <div className="mt-6 grid gap-8">
          {ACTS_41.map((a) => (
            <ActivityRun key={a.id} id={a.id} Comp={a.Comp} />
          ))}
        </div>
      </Panel>
    </section>
  );
}

/* ── Wrap-up ──────────────────────────────────────────────────── */

const RECAP: { title: string; icon: LucideIcon }[] = [
  { title: "Price per gram = price ÷ weight", icon: Receipt },
  { title: "BOM, clean label and multi-packs move the price", icon: Wheat },
  { title: "Gross margin and AOV", icon: ShoppingBasket },
  { title: "~165% growth, ~₹63 lakh net loss", icon: TrendingUp },
];

export function WrapUp() {
  const done = useActivities41((s) => s.done);
  const work = useWork41((s) => s.work);
  const list = ACTS_41.map((a) => ({ id: a.id, label: a.label }));
  const n = list.filter((a) => done[a.id]).length;
  return (
    <section id="wrap-up" className={sectionCls}>
      <Panel tone="light" reveal="up" width="max-w-7xl">
        <div className="text-[0.85rem] font-extrabold uppercase tracking-[0.16em] text-orange">Chapter 4.1 · Wrap-up</div>
        <h2 className="mt-3 font-display text-[clamp(2.1rem,5vw,3.2rem)] font-semibold leading-[1.04] text-cocoa">Pricing tells a story</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
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
          <p className="font-display text-[1.15rem] leading-snug">{TAKEAWAY}</p>
        </div>
        <div className="mt-6 rounded-[22px] bg-peach/70 p-5">
          <div className="flex items-baseline justify-between">
            <span className="font-display text-[1.2rem] font-semibold text-cocoa">Activities on this page</span>
            <span className="font-bold text-cocoa-2">
              {n}/{list.length}
            </span>
          </div>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {list.map((a) => (
              <li key={a.id} className="flex items-center gap-2 text-[1rem] text-cocoa">
                {done[a.id] ? <Check className="size-5 shrink-0 text-success" strokeWidth={3} /> : <Circle className="size-5 shrink-0 text-cocoa-2/40" />}
                {a.label}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[0.9rem] text-cocoa-2/80">Shown for this visit only. This page doesn&apos;t record progress in the LMS.</p>
        </div>
        <MyWork chapter="4.1" items={list.map((a) => ({ label: a.label, text: work[a.id] }))} />
      </Panel>
    </section>
  );
}

