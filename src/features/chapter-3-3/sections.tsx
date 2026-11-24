"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { motion } from "motion/react";
import { ArrowRight, Check, Circle, Coins, Lightbulb, Receipt, Store, TrendingDown, TrendingUp } from "lucide-react";
import { MyWork } from "@/components/play/GameFrame";
import { Panel } from "@/components/chapter/Panel";
import { SectionIntro } from "@/components/chapter/SectionIntro";
import { GlossaryText } from "@/components/chapter/Glossary";
import { BizCanvas, MediaRow } from "@/components/rich";
import { createActivityStore } from "@/lib/activities";
import { ACTS_33, GrowthDesk, LeverLab, OrderDesk, useWork33 } from "./activities";
import { CATEGORIES, COSTS, PROFIT, STREAMS, THINK } from "./content";

export const ACTIVITY_IDS = ["order", "growth", "levers"] as const;
export const useActivities33 = createActivityStore<string>(ACTIVITY_IDS);

const sectionCls = "relative scroll-mt-6 px-3 py-6 sm:px-6 sm:py-10";
const card = "rounded-[22px] border border-cocoa bg-white shadow-[3px_3px_0_0_#2f1c1a]";

function Explainer({ children }: { children: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border-2 border-dashed border-orange/40 bg-white p-4">
      <span className="grid size-9 shrink-0 place-items-center rounded-full bg-orange/10 text-orange">
        <Lightbulb className="size-5" />
      </span>
      <p className="text-[1rem] leading-snug text-cocoa">
        <span className="mr-1.5 text-[0.78rem] font-extrabold uppercase tracking-[0.12em] text-orange">In plain words</span>
        <GlossaryText>{children}</GlossaryText>
      </p>
    </div>
  );
}

/* ── canvas ───────────────────────────────────────────────────── */

export function CanvasOverview() {
  return (
    <section id="canvas" className={sectionCls}>
      <Panel tone="light" reveal="up" width="max-w-7xl">
        <SectionIntro index="1" kicker="The Business Model Canvas" title="The money side of the canvas" />
        <div className="mt-5">
          <BizCanvas
            highlight={["revenue", "costs"]}
            studied={{ value: "3.1", relationships: "3.1", channels: "3.1", segments: "3.1", partners: "3.2", activities: "3.2", resources: "3.2" }}
            items={{ revenue: ["Website", "Marketplaces and quick commerce", "Corporate gifting and bulk orders"], costs: ["Ingredients", "Packaging", "Logistics", "Marketing and commissions", "Team and kitchen"] }}
            caption="This chapter covers the two bottom blocks: Revenue Streams and Cost Structure."
          />
        </div>
        <div className="mt-5">
          <Explainer>Revenue streams are how money comes in. The cost structure is where it goes out. Profit is what is left when the first is bigger than the second.</Explainer>
        </div>
      </Panel>
    </section>
  );
}

/* ── revenue streams ──────────────────────────────────────────── */

export function Revenue() {
  return (
    <section id="revenue" className={sectionCls}>
      <Panel tone="peach" reveal="left" width="max-w-7xl">
        <SectionIntro index="2" kicker="Revenue Streams" title="How money comes in" />
        <div className="mt-5 grid gap-4 md:grid-cols-3">
          {STREAMS.map((s, i) => (
            <motion.article key={s.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className={`${card} flex min-w-0 flex-col overflow-hidden`}>
              <div className="relative aspect-[16/7] bg-cocoa">
                {s.img ? (
                  <Image src={s.img} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover" />
                ) : (
                  <div className="flex h-full items-center justify-center gap-2 text-cream">
                    <Store className="size-8" />
                    <span className="font-display text-[1.2rem] font-semibold">Amazon · Blinkit · Zepto · Instamart</span>
                  </div>
                )}
              </div>
              <div className="flex flex-1 flex-col gap-1.5 p-4">
                <h3 className="font-display text-[1.2rem] font-semibold leading-tight text-cocoa">
                  <GlossaryText>{s.title}</GlossaryText>
                </h3>
                <p className="text-[0.95rem] leading-snug text-cocoa-2">
                  <GlossaryText>{s.note}</GlossaryText>
                </p>
              </div>
            </motion.article>
          ))}
        </div>
        <div className="mt-6 text-[0.85rem] font-extrabold uppercase tracking-[0.12em] text-orange">Revenue by category</div>
        <div className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {CATEGORIES.map((c, i) => (
            <motion.figure key={c.id} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }} className={`${card} overflow-hidden`}>
              <div className="relative aspect-square bg-cream">
                <Image src={c.img} alt={c.alt} fill sizes="(max-width: 1024px) 50vw, 25vw" className="object-cover" />
              </div>
              <figcaption className="p-3 font-display text-[1.05rem] font-semibold leading-tight text-cocoa">{c.name}</figcaption>
            </motion.figure>
          ))}
        </div>
        <p className="mt-3 text-[0.9rem] text-cocoa-2">These are the four categories revenue is reported by. No split between them is published in this chapter.</p>
        <div className="mt-4">
          <Explainer>A revenue stream is one way of earning. Looking at revenue by channel and by category shows which parts of the business bring in the most.</Explainer>
        </div>
      </Panel>
    </section>
  );
}

/* ── cost structure ───────────────────────────────────────────── */

export function Costs() {
  return (
    <section id="costs" className={sectionCls}>
      <Panel tone="light" reveal="right" width="max-w-7xl">
        <SectionIntro index="3" kicker="Cost Structure" title="Where the money goes" />
        <ol className="mt-5 grid grid-cols-2 gap-3 md:grid-cols-5">
          {COSTS.map((c, i) => (
            <motion.li key={c.id} initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }} className={`${card} flex min-w-0 flex-col overflow-hidden ${i === 4 ? "col-span-2 md:col-span-1" : ""}`}>
              <div className="relative aspect-square bg-cream">
                <Image src={c.img} alt={c.alt} fill sizes="(max-width: 768px) 50vw, 20vw" className="object-cover" />
                <span className="absolute left-2 top-2 grid size-8 place-items-center rounded-full border border-cocoa bg-cream text-[0.9rem] font-extrabold text-cocoa">{i + 1}</span>
              </div>
              <div className="p-3 font-display text-[1.02rem] font-semibold leading-tight text-cocoa">
                <GlossaryText>{c.name}</GlossaryText>
              </div>
            </motion.li>
          ))}
        </ol>
        <div className="mt-5">
          <Explainer>Every order carries these costs. Some are paid per order (ingredients, packaging, delivery, commission). Others, like the team and the kitchen, are paid whether or not an order comes in.</Explainer>
        </div>
      </Panel>
    </section>
  );
}

/* ── profitability ────────────────────────────────────────────── */

export function Profitability() {
  const w = (PROFIT.fy23 / PROFIT.fy24) * 100;
  return (
    <section id="profit" className={sectionCls}>
      <Panel tone="peach" reveal="up" width="max-w-7xl">
        <SectionIntro index="4" kicker="Profitability" title="Growing fast, not yet in profit" />
        <div className="mt-5 grid gap-5 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
          <div className={`${card} p-5`}>
            <div className="text-[0.8rem] font-extrabold uppercase tracking-[0.12em] text-orange">Reported revenue, Rs crore (rounded)</div>
            {[
              { y: "FY23", t: "about Rs 5.5 crore", w, cls: "bg-cocoa/50" },
              { y: "FY24", t: "about Rs 14.7 crore", w: 100, cls: "bg-orange" },
            ].map((r, i) => (
              <div key={r.y} className="mt-4">
                <div className="flex justify-between text-[1rem] font-bold text-cocoa">
                  <span>{r.y}</span>
                  <span className="tabular-nums">{r.t}</span>
                </div>
                <div className="mt-1 h-9 overflow-hidden rounded-full bg-cocoa/10">
                  <motion.div initial={{ width: 0 }} whileInView={{ width: `${r.w}%` }} viewport={{ once: true }} transition={{ duration: 0.9, delay: 0.15 + i * 0.2, ease: [0.16, 1, 0.3, 1] }} className={`h-full rounded-full ${r.cls}`} />
                </div>
              </div>
            ))}
            <div className="mt-4 inline-flex items-center gap-2 rounded-full bg-success/15 px-4 py-1.5 text-[1.05rem] font-extrabold text-success">
              <TrendingUp className="size-5" /> up {PROFIT.growth}
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="rounded-[22px] border border-cocoa bg-cocoa p-5 text-cream shadow-[3px_3px_0_0_#2f1c1a]">
              <TrendingDown className="size-7 text-haldi" />
              <div className="mt-2 font-display text-[clamp(1.8rem,4vw,2.6rem)] font-semibold leading-none">{PROFIT.loss}</div>
              <div className="mt-2 text-[1.05rem] font-bold">net loss reported for FY24</div>
              <p className="mt-1 text-[0.92rem] opacity-85">Common for a fast-growing brand that invests in growth.</p>
            </div>
            <div className="flex items-start gap-3 rounded-2xl border border-cocoa/20 bg-white p-4">
              <Coins className="mt-0.5 size-5 shrink-0 text-orange" />
              <p className="text-[0.98rem] leading-snug text-cocoa">
                <GlossaryText>{PROFIT.text}</GlossaryText>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-6 text-[0.85rem] font-extrabold uppercase tracking-[0.12em] text-orange">Unit economics: one order</div>
        <div className="mt-3 grid items-center gap-3 md:grid-cols-[1fr_auto_1fr_auto_1fr]">
          {[
            { t: "What the customer pays", s: "one order" },
            { t: "Minus", s: "the cost of making it and of delivering it" },
            { t: "What the order earns", s: "after those costs" },
          ].map((b, i) => (
            <div key={b.t} className="contents">
              {i > 0 && <ArrowRight className="mx-auto hidden size-6 text-orange md:block" />}
              <div
                style={i === 2 ? { backgroundColor: "var(--eb-orange, #ff5c00)", color: "#ffffff" } : undefined}
                className={`rounded-[22px] border border-cocoa p-4 text-center shadow-[3px_3px_0_0_#2f1c1a] ${
                  i === 2 ? "bg-orange text-white" : "bg-white text-cocoa"
                }`}
              >
                <div className="font-display text-[1.15rem] font-semibold">{b.t}</div>
                <div className={`text-[0.92rem] ${i === 2 ? "text-white/95" : "text-cocoa-2"}`}>{b.s}</div>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4">
          <Explainer>{PROFIT.unit}</Explainer>
        </div>
        <div className="mt-5">
          <MediaRow
            items={[
              { kind: "image", src: "/brand/library/site/corporate-gifting-jar-hamper.webp", alt: "A corporate gifting jar hamper from Eat Better", ratio: 1100 / 825, caption: "Corporate gifting and bulk orders are one revenue stream." },
              { kind: "image", src: "/brand/library/site/home-banner-hampers-sold-out.webp", alt: "Eat Better homepage banner about hampers", ratio: 1100 / 397, caption: "A brand banner from eatbetterco.com." },
            ]}
          />
        </div>
      </Panel>
    </section>
  );
}

/* ── Think & discuss ──────────────────────────────────────────── */

const KEY = "ebc-3.3-think";

export function Think() {
  const [a1, setA1] = useState("");
  const [a2, setA2] = useState("");
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const v = JSON.parse(localStorage.getItem(KEY) ?? "null");
      /* eslint-disable react-hooks/set-state-in-effect -- one-time post-hydration restore from localStorage */
      if (v) {
        setA1(v.a1 ?? "");
        setA2(v.a2 ?? "");
      }
    } catch {
      /* storage unavailable */
    }
    setReady(true);
    /* eslint-enable react-hooks/set-state-in-effect */
  }, []);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(KEY, JSON.stringify({ a1, a2 }));
    } catch {
      /* ignore */
    }
  }, [a1, a2, ready]);
  const area = "mt-2 w-full rounded-2xl border border-line-strong bg-cream/50 px-4 py-3 text-[1.02rem] leading-relaxed text-cocoa outline-none focus:border-orange";
  return (
    <section id="think" className={sectionCls}>
      <Panel tone="light" reveal="right" width="max-w-7xl">
        <SectionIntro index="5" kicker="Think & discuss" title="Your turn to think" />
        <div className="mt-6 grid gap-5 lg:grid-cols-2">
          <div className="rounded-[22px] border border-line bg-white p-4 sm:p-5">
            <h3 className="font-display text-[1.3rem] font-semibold leading-snug text-cocoa">1. {THINK.q1}</h3>
            <textarea value={a1} onChange={(e) => setA1(e.target.value)} rows={5} aria-label="Why a quick-commerce sale earns less per pack" placeholder="A quick-commerce sale earns less because …" className={area} />
          </div>
          <div className="rounded-[22px] border border-line bg-white p-4 sm:p-5">
            <h3 className="font-display text-[1.3rem] font-semibold leading-snug text-cocoa">2. {THINK.q2}</h3>
            <textarea value={a2} onChange={(e) => setA2(e.target.value)} rows={5} aria-label="Three ways to improve profitability without raising prices" placeholder="1. … 2. … 3. …" className={area} />
          </div>
        </div>
        <p className="mt-3 text-[0.9rem] text-cocoa-2">Saved on this device only. The activities below let you test both answers with numbers.</p>
      </Panel>
    </section>
  );
}

/* ── Activities ───────────────────────────────────────────────── */

function ActivityRun({ id, Comp }: { id: string; Comp: React.ComponentType<{ onDone: (summary: string) => void }> }) {
  const complete = useActivities33((s) => s.complete);
  const save = useWork33((s) => s.save);
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
        <SectionIntro index="6" kicker="Activities" title="Put it into practice" />
        <p className="mt-2 max-w-3xl text-[1.05rem] text-cocoa">Three number-driven tasks. Each one only moves forward when your working is right, and every practice number changes each time you start.</p>
        <div className="mt-6 grid gap-8">
          <ActivityRun id="order" Comp={OrderDesk} />
          <ActivityRun id="growth" Comp={GrowthDesk} />
          <ActivityRun id="levers" Comp={LeverLab} />
        </div>
      </Panel>
    </section>
  );
}

/* ── Wrap-up ──────────────────────────────────────────────────── */

const RECAP: { title: string; text: string; icon: typeof Coins }[] = [
  { title: "Revenue streams", text: "Website, marketplaces and quick commerce, corporate gifting, and four categories.", icon: Coins },
  { title: "Cost structure", text: "Ingredients, packaging, logistics, marketing and commissions, team and kitchen.", icon: Receipt },
  { title: "Profitability", text: "About Rs 14.7 crore revenue, around 165% growth, about Rs 63 lakh net loss in FY24.", icon: TrendingUp },
  { title: "Unit economics", text: "What one order earns after the cost of making and delivering it.", icon: Store },
];

export function WrapUp() {
  const done = useActivities33((s) => s.done);
  const work = useWork33((s) => s.work);
  const n = ACTS_33.filter((a) => done[a.id]).length;
  return (
    <section id="wrap-up" className={sectionCls}>
      <Panel tone="light" reveal="up" width="max-w-7xl">
        <div className="text-[0.85rem] font-extrabold uppercase tracking-[0.16em] text-orange">Chapter 3.3 · Wrap-up</div>
        <h2 className="mt-3 font-display text-[clamp(2.1rem,5vw,3.2rem)] font-semibold leading-[1.04] text-cocoa">The money side of the canvas</h2>
        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {RECAP.map((r, i) => (
            <motion.div key={r.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.07 }} className="flex flex-col gap-2 rounded-2xl border border-cocoa bg-cream p-4 shadow-[2px_2px_0_0_#2f1c1a]">
              <span className="grid size-11 place-items-center rounded-full bg-orange text-white">
                <r.icon className="size-5" />
              </span>
              <span className="font-display text-[1.1rem] font-semibold text-cocoa">{r.title}</span>
              <p className="text-[0.95rem] leading-snug text-cocoa">{r.text}</p>
            </motion.div>
          ))}
        </div>
        <div className="mt-6 rounded-[22px] bg-peach/70 p-5">
          <div className="flex items-baseline justify-between">
            <span className="flex items-center gap-2 font-display text-[1.2rem] font-semibold text-cocoa">
              <Store className="size-5 text-orange" /> Activities on this page
            </span>
            <span className="font-bold text-cocoa-2">
              {n}/{ACTS_33.length}
            </span>
          </div>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {ACTS_33.map((a) => (
              <li key={a.id} className="flex items-center gap-2 text-[1rem] text-cocoa">
                {done[a.id] ? <Check className="size-5 shrink-0 text-success" strokeWidth={3} /> : <Circle className="size-5 shrink-0 text-cocoa-2/40" />}
                {a.label}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-[0.9rem] text-cocoa-2/80">Shown for this visit only. This page doesn&apos;t record progress in the LMS.</p>
        </div>
        <MyWork chapter="3.3" items={ACTS_33.map((a) => ({ label: a.label, text: work[a.id] }))} />
      </Panel>
    </section>
  );
}
