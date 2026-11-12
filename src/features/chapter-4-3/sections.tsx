"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { Check, Circle, Factory, Gift, Handshake, MapPin, PackagePlus, Rocket, Store, Truck, TrendingUp, Tv, Repeat2, Zap, type LucideIcon } from "lucide-react";
import { Panel } from "@/components/chapter/Panel";
import { SectionIntro } from "@/components/chapter/SectionIntro";
import { GlossaryText } from "@/components/chapter/Glossary";
import { BizCanvas, IconFlow, MediaRow, StatBand } from "@/components/rich";
import { LeafBulb } from "@/components/icons/EbIcons";
import { MyWork } from "@/components/play/GameFrame";
import { createActivityStore } from "@/lib/activities";
import { CANVAS_LINKS, PILLARS, RECAP, TIMELINE, type PillarId } from "./content";
import { ACTS_43, useWork43 } from "./activities";

export const useActivities43 = createActivityStore<string>(ACTS_43.map((a) => a.id));

const sectionCls = "relative scroll-mt-6 px-3 py-6 sm:px-6 sm:py-10";
const OFFICIAL = "Official photo, eatbetterco.com";
const LIB = "/brand/library";

/* ── 1 · The funding moment ───────────────────────────────────── */

const TL_ICON: LucideIcon[] = [Tv, TrendingUp, Rocket];

export function Funding() {
  return (
    <section id="funding" className={sectionCls}>
      <Panel tone="dark" reveal="up" width="max-w-7xl">
        <SectionIntro index="1" kicker="The funding moment" title="From the pitch to a growth plan" tone="dark">
          After its Pre-Series A round in April 2025, Eat Better&apos;s management set out how it would grow.
        </SectionIntro>
        <ol className="relative mt-10 grid gap-4 md:grid-cols-3 md:gap-6">
          <span aria-hidden className="absolute left-[1.45rem] top-6 hidden h-[calc(100%-3rem)] w-0.5 bg-haldi/40 max-md:block md:left-[16%] md:right-[16%] md:top-[1.6rem] md:h-0.5 md:w-auto" />
          {TIMELINE.map((t, i) => {
            const Icon = TL_ICON[i];
            const key = t.id === "round";
            return (
              <motion.li key={t.id} initial={{ opacity: 0, y: 22 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12 }} className="relative flex gap-4 md:flex-col md:items-center md:text-center">
                <span className={`relative z-10 grid size-12 shrink-0 place-items-center rounded-full ${key ? "bg-orange text-white" : "bg-haldi text-cocoa"}`}>
                  <Icon className="size-6" />
                </span>
                <div className={`min-w-0 rounded-[20px] border p-4 ${key ? "border-haldi bg-cocoa-2/60" : "border-cream/15 bg-cream/5"} md:w-full`}>
                  <div className="text-[0.82rem] font-extrabold uppercase tracking-[0.12em] text-haldi">{t.when}</div>
                  <div className="mt-1 font-display text-[1.25rem] font-semibold text-cream">{t.title}</div>
                  <p className="mt-1 text-[0.98rem] leading-snug text-cream/85">
                    <GlossaryText>{t.text}</GlossaryText>
                  </p>
                </div>
              </motion.li>
            );
          })}
        </ol>
        <div className="mt-8 grid gap-3 sm:grid-cols-3">
          {[
            { k: "Round", v: "Pre-Series A" },
            { k: "When", v: "April 2025" },
            { k: "Co-led by", v: "Prath Ventures and Spring Marketing Capital" },
          ].map((f) => (
            <div key={f.k} className="rounded-2xl bg-cream px-4 py-3 text-cocoa">
              <div className="text-[0.78rem] font-extrabold uppercase tracking-[0.12em] text-orange">{f.k}</div>
              <div className="font-display text-[1.2rem] font-semibold leading-tight">{f.v}</div>
            </div>
          ))}
        </div>
      </Panel>
    </section>
  );
}

/* ── 2 · Four growth pillars ──────────────────────────────────── */

const P_ICON: Record<PillarId, LucideIcon> = { portfolio: PackagePlus, qcom: Zap, b2b: Gift, infra: Factory };

function Photo({ src, alt, ratio, caption, sizes = "(max-width: 640px) 100vw, 40vw" }: { src: string; alt: string; ratio: number; caption?: string; sizes?: string }) {
  return (
    <figure className="min-w-0">
      <div className="relative w-full overflow-hidden rounded-2xl border border-cocoa bg-cream shadow-[3px_3px_0_0_#2f1c1a]" style={{ aspectRatio: ratio }}>
        <Image src={src} alt={alt} fill sizes={sizes} className="object-cover" />
      </div>
      {caption && <figcaption className="mt-1.5 text-[0.88rem] leading-snug text-cocoa-2">{caption}</figcaption>}
    </figure>
  );
}

function PillarShell({ p, tone, children }: { p: (typeof PILLARS)[number]; tone: "light" | "peach"; children: ReactNode }) {
  const Icon = P_ICON[p.id];
  return (
    <Panel tone={tone} reveal={p.id === "qcom" || p.id === "infra" ? "right" : "left"} width="max-w-7xl">
      <div className="flex flex-wrap items-start gap-4">
        <span className="font-display text-[clamp(3.5rem,9vw,6rem)] font-semibold leading-none text-orange/90">{p.n}</span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 text-[0.85rem] font-extrabold uppercase tracking-[0.14em] text-orange">
            <Icon className="size-4" /> Pillar {p.n} · {p.short}
          </div>
          <h3 className="mt-1 font-display text-[clamp(1.7rem,4vw,2.6rem)] font-semibold leading-[1.08] text-cocoa">{p.title}</h3>
          <p className="mt-3 max-w-3xl text-[1.08rem] leading-snug text-cocoa">
            <GlossaryText>{p.text}</GlossaryText>
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {p.keys.map((k) => (
              <li key={k} className="rounded-full border border-cocoa bg-white px-3 py-1 text-[0.9rem] font-bold text-cocoa">
                {k}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="mt-6">{children}</div>
    </Panel>
  );
}

const SEASONAL = [8, 8, 10, 8, 10, 12, 16, 62, 26, 46, 100, 30];
const YEAR_ROUND = [58, 62, 56, 60, 58, 64, 60, 70, 62, 68, 78, 62];
const MONTHS = ["J", "F", "M", "A", "M", "J", "J", "A", "S", "O", "N", "D"];

function Row({ label, data, cls }: { label: string; data: number[]; cls: string }) {
  return (
    <div>
      <div className="mb-1 text-[0.9rem] font-bold text-cocoa">{label}</div>
      <div className="flex h-28 items-end gap-1 rounded-2xl bg-cream p-3 sm:gap-2">
        {data.map((v, i) => (
          <div key={i} className="flex h-full min-w-0 flex-1 flex-col justify-end">
            <motion.div initial={{ height: 0 }} whileInView={{ height: `${v}%` }} viewport={{ once: true }} transition={{ delay: i * 0.03, duration: 0.6 }} className={`w-full rounded-t-md ${cls}`} />
            <span className="mt-1 text-center text-[0.7rem] font-bold text-cocoa-2">{MONTHS[i]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SeasonBars() {
  return (
    <div className="rounded-[20px] border border-cocoa bg-white p-4 shadow-[3px_3px_0_0_#2f1c1a]">
      <div className="font-display text-[1.15rem] font-semibold text-cocoa">Gifting orders across a year: peaks vs year-round</div>
      <div className="mt-3 grid gap-4 md:grid-cols-2">
        <Row label="Seasonal peaks only (Rakhi, Diwali)" data={SEASONAL} cls="bg-orange" />
        <Row label="Year-round partnerships" data={YEAR_ROUND} cls="bg-success" />
      </div>
      <p className="mt-2 text-[0.85rem] text-cocoa-2">Illustration of the idea (made-up shape), not Eat Better data.</p>
    </div>
  );
}

export function Pillars() {
  const [p1, p2, p3, p4] = PILLARS;
  return (
    <section id="pillars" className={sectionCls}>
      <div className="mx-auto mb-6 max-w-7xl px-1">
        <div className="rounded-[22px] bg-cocoa/90 p-5 text-cream sm:p-6">
          <SectionIntro index="2" kicker="Four growth pillars" title="What management plans to do" tone="dark">
            The source text says &quot;three primary pillars&quot; but lists four. All four are shown here.
          </SectionIntro>
        </div>
      </div>
      <div className="grid gap-8 sm:gap-10">
        <PillarShell p={p1} tone="light">
          <div className="grid gap-4 md:grid-cols-3">
            <Photo src={`${LIB}/chips-puffs/protein-chips-pudina-punch-front.webp`} alt="Protein Chips Pudina Punch pack" ratio={1} caption="Protein Chips: high-protein base" />
            <Photo src={`${LIB}/chips-puffs/ragi-chips-achari-masti-front.webp`} alt="Ragi Chips Achari Masti pack" ratio={1} caption="Ragi Chips: an ancient-grain base" />
            <Photo src={`${LIB}/chips-puffs/chickpea-puffs-imli-twist-front.webp`} alt="Chickpea Puffs Imli Twist pack" ratio={1} caption="Chickpea Puffs: a savory launch" />
          </div>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Photo src={`${LIB}/site/home-banner-protein-bhujia-launch.webp`} alt="Website banner announcing the Protein Bhujia launch" ratio={1100 / 397} caption={`New launch banner: Protein Bhujia. ${OFFICIAL}`} />
            <Photo src={`${LIB}/site/home-banner-chickpea-puffs-launch.webp`} alt="Website banner announcing the Chickpea Puffs launch" ratio={1100 / 397} caption={`New launch banner: Chickpea Puffs. ${OFFICIAL}`} />
          </div>
        </PillarShell>

        <PillarShell p={p2} tone="peach">
          <IconFlow
            nodes={[
              { icon: Zap, title: "High-intent demand", text: "Shoppers who want a snack now" },
              { icon: Store, title: "Dark stores", text: "Packing hubs inside Tier-1 and Tier-2 cities" },
              { icon: Truck, title: "Minutes-fast delivery", text: "Orders dispatched from the nearest dark store" },
              { icon: Repeat2, title: "Repeat volume", text: "The same shoppers order again" },
            ]}
          />
          <MediaRow
            className="mt-6"
            items={[
              { kind: "image", src: "/chapter-2-2/lms-5.png", alt: "Eat Better namkeens in quick-commerce app search results", ratio: 1181 / 497, fit: "contain", caption: "Eat Better namkeens in quick-commerce search results (screenshot); prices vary." },
              { kind: "image", src: `${LIB}/site/home-banner-masaledaar-chatkara.webp`, alt: "Website banner for the Masaledaar Chatkara range", ratio: 1100 / 351, caption: `Snacks for an instant craving. ${OFFICIAL}` },
            ]}
          />
        </PillarShell>

        <PillarShell p={p3} tone="light">
          <SeasonBars />
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Photo src={`${LIB}/site/corporate-gifting-banner-build-your-own.webp`} alt="Corporate gifting banner: build your own hamper" ratio={1100 / 414} caption={`Customized hampers. ${OFFICIAL}`} />
            <Photo src={`${LIB}/site/corporate-gifting-festive-extras.webp`} alt="Festive extras that can be added to a corporate gift hamper" ratio={1100 / 825} caption={`Festive extras for gifting. ${OFFICIAL}`} />
            <Photo src={`${LIB}/hampers/diwali-jumbo-orange-hero.webp`} alt="Diwali jumbo gift hamper" ratio={1} caption={`A jumbo hamper. ${OFFICIAL}`} />
          </div>
        </PillarShell>

        <PillarShell p={p4} tone="peach">
          <StatBand
            tone="cocoa"
            stats={[
              { value: 50000, suffix: " sq. ft.", label: "centralized manufacturing facility in Jaipur", icon: Factory },
              { value: 2, prefix: "~", suffix: " lakh", label: "fulfilled orders a month (Chapter 4.1)", icon: Truck },
            ]}
          />
          <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Photo src={`${LIB}/site/kitchen-prepping-dates.webp`} alt="Dates being prepared in the kitchen" ratio={930 / 850} caption={`Prepping in the kitchen. ${OFFICIAL}`} />
            <Photo src={`${LIB}/site/story-honest-processes-line.webp`} alt="A production line worker in hairnet, mask and gloves" ratio={828 / 918} caption={`The production line. ${OFFICIAL}`} />
            <Photo src={`${LIB}/site/story-philosophy-trays.webp`} alt="Trays of freshly made snacks" ratio={1100 / 467} caption={`Trays at scale. ${OFFICIAL}`} />
          </div>
        </PillarShell>
      </div>
    </section>
  );
}

/* ── 3 · Pillars and the canvas ───────────────────────────────── */

export function CanvasLink() {
  const [pid, setPid] = useState<PillarId>("portfolio");
  const link = CANVAS_LINKS[pid];
  return (
    <section id="canvas" className={sectionCls}>
      <Panel tone="light" reveal="up" width="max-w-7xl">
        <SectionIntro index="3" kicker="Pillars and the canvas" title="Where each pillar lands on the Business Model Canvas">
          Choose a pillar to light up the canvas blocks it touches (Module 3).
        </SectionIntro>
        <div className="mt-5 flex flex-wrap gap-2" role="tablist" aria-label="Growth pillars">
          {PILLARS.map((p) => (
            <button key={p.id} role="tab" aria-selected={pid === p.id} onClick={() => setPid(p.id)} className={`rounded-full border-2 px-4 py-2 text-[0.95rem] font-bold ${pid === p.id ? "border-cocoa bg-cocoa text-cream" : "border-cocoa/20 bg-white text-cocoa hover:border-cocoa/50"}`}>
              {p.n}. {p.short}
            </button>
          ))}
        </div>
        <div className="mt-5">
          <BizCanvas highlight={link.highlight} items={link.items} caption="Lit blocks are the ones this pillar changes." />
        </div>
        <p className="mt-4 flex items-start gap-2 rounded-2xl bg-cream px-4 py-3 text-[1.02rem] leading-snug text-cocoa">
          <Handshake className="mt-0.5 size-5 shrink-0 text-orange" />
          {link.says}
        </p>
      </Panel>
    </section>
  );
}

/* ── 4 · Activities ───────────────────────────────────────────── */

function ActivityRun({ id, Comp }: { id: string; Comp: React.ComponentType<{ onDone: (summary: string) => void }> }) {
  const complete = useActivities43((s) => s.complete);
  const save = useWork43((s) => s.save);
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
        <SectionIntro index="4" kicker="Activities" title="Run the growth plan yourself">
          Three 3D games, one for each of the plan&apos;s operational pillars. All numbers inside the games are practice numbers made up for learning. Each step opens only when your working is right.
        </SectionIntro>
        <div className="mt-6 grid gap-8">
          {ACTS_43.length ? ACTS_43.map((a) => <ActivityRun key={a.id} id={a.id} Comp={a.Comp} />) : <div className="h-[420px] animate-pulse rounded-[24px] bg-cocoa/10" aria-label="Activities loading" />}
        </div>
      </Panel>
    </section>
  );
}

/* ── Wrap-up ──────────────────────────────────────────────────── */

export function WrapUp() {
  const done = useActivities43((s) => s.done);
  const work = useWork43((s) => s.work);
  const list = ACTS_43.map((a) => ({ id: a.id, label: a.label }));
  const n = list.filter((a) => done[a.id]).length;
  return (
    <section id="wrap-up" className={sectionCls}>
      <Panel tone="light" reveal="up" width="max-w-7xl">
        <div className="text-[0.85rem] font-extrabold uppercase tracking-[0.16em] text-orange">Chapter 4.3 · Wrap-up</div>
        <h2 className="mt-3 font-display text-[clamp(2.1rem,5vw,3.2rem)] font-semibold leading-[1.04] text-cocoa">Four pillars, one plan</h2>
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {PILLARS.map((p, i) => {
            const Icon = P_ICON[p.id];
            return (
              <motion.div key={p.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.06 }} className="flex flex-col items-center gap-2 rounded-2xl border border-cocoa bg-cream p-4 text-center shadow-[2px_2px_0_0_#2f1c1a]">
                <span className="grid size-11 place-items-center rounded-full bg-orange text-white">
                  <Icon className="size-5" />
                </span>
                <span className="text-[0.82rem] font-extrabold uppercase tracking-[0.1em] text-orange">Pillar {p.n}</span>
                <span className="text-[0.98rem] font-bold leading-tight text-cocoa">{p.title}</span>
              </motion.div>
            );
          })}
        </div>
        <div className="mt-5 flex items-start gap-3 rounded-[22px] bg-cocoa p-5 text-cream">
          <LeafBulb className="mt-0.5 size-6 shrink-0 text-haldi" />
          <p className="font-display text-[1.15rem] leading-snug">
            <GlossaryText>{RECAP}</GlossaryText>
          </p>
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
        <MyWork chapter="4.3" items={list.map((a) => ({ label: a.label, text: work[a.id] }))} />
        <p className="mt-4 flex items-center gap-2 text-[0.88rem] text-cocoa-2">
          <MapPin className="size-4" /> Product and kitchen photos: {OFFICIAL}.
        </p>
      </Panel>
    </section>
  );
}
