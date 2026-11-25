"use client";

import Image from "next/image";
import { motion } from "motion/react";
import { Boxes, Building2, Check, Circle, Clock3, Database, Gift, Globe, IndianRupee, Layers, MapPinned, PackageX, Repeat, Search, ShoppingCart, Sparkle, Store, Target, Thermometer, Timer, Truck, Warehouse, Zap, type LucideIcon } from "lucide-react";
import { Panel } from "@/components/chapter/Panel";
import { SectionIntro } from "@/components/chapter/SectionIntro";
import { GlossaryText } from "@/components/chapter/Glossary";
import { BizCanvas, MediaRow, Zoomable } from "@/components/rich";
import { SyncIllustration } from "./SyncIllustration";
import { LeafBulb } from "@/components/icons/EbIcons";
import { MyWork } from "@/components/play/GameFrame";
import { createActivityStore } from "@/lib/activities";
import { CHALLENGES, GTM_DEFINITION, MATRIX, PILLARS, TAKEAWAY, type ChallengeId, type PillarId } from "./content";
import { ACTS_34, useWork34 } from "./activities";

export const useActivities34 = createActivityStore<string>(ACTS_34.map((a) => a.id));

const sectionCls = "relative scroll-mt-6 px-3 py-6 sm:px-6 sm:py-10";
const OFFICIAL = "Official photo, eatbetterco.com";
const SHOT = "Screenshot, eatbetterco.com";

/* ── 1 · The canvas: Channels, Key Activities, Key Partners ───── */

export function CanvasOverview() {
  return (
    <section id="canvas" className={sectionCls}>
      <Panel tone="light" reveal="up" width="max-w-7xl">
        <SectionIntro index="1" kicker="Business Model Canvas" title="Where the snack meets the road">
          Getting a snack from the kitchen to a customer touches three blocks of the canvas: the Channels it travels through, the Key Activities of packing and fulfilment, and the Key Partners who carry it.
        </SectionIntro>
        <div className="mt-6">
          <BizCanvas
            highlight={["channels", "activities", "partners"]}
            studied={{ value: "3.1", relationships: "3.1", channels: "3.1", segments: "3.1", partners: "3.2", activities: "3.2", resources: "3.2", costs: "3.3", revenue: "3.3" }}
            items={{
              channels: PILLARS.map((p) => p.short),
              activities: ["Packaging & fulfilment", "Inventory synchronisation", "Scaling for festive peaks"],
              partners: ["3PL logistics", "Marketplace fulfilment centres", "Dark-store networks", "Couriers & freight"],
            }}
            caption="The nine blocks of the Business Model Canvas. Lit blocks are the ones this chapter touches."
          />
        </div>
      </Panel>
    </section>
  );
}

/* ── 2 · GTM channel architecture ─────────────────────────────── */

const PILLAR_ICON: Record<PillarId, LucideIcon> = { d2c: Globe, marketplace: ShoppingCart, qcom: Zap, b2b: Building2 };
const PILLAR_IMG: Record<PillarId, { src: string; alt: string; caption: string; ratio: number }> = {
  d2c: { src: "/chapter-3-4/web-pdp-shipping.webp", alt: "Eat Better product page showing pack sizes, free shipping above a threshold and shelf life", caption: `Own website: a product page with its own shipping offer. ${SHOT}`, ratio: 880 / 780 },
  marketplace: { src: "/chapter-3-4/web-platform-logos.webp", alt: "Platform logos shown on eatbetterco.com: Blinkit, Zepto, Instamart, Amazon, BigBasket", caption: `Where else it sells, as listed on eatbetterco.com. ${SHOT}`, ratio: 840 / 180 },
  qcom: { src: "/brand/library/site/home-banner-hampers-sold-out.webp", alt: "Sold out, with love: last few boxes left on Blinkit, Zepto and Amazon", caption: `A sold-out notice pointing shoppers to quick-commerce apps. ${OFFICIAL}`, ratio: 1100 / 397 },
  b2b: { src: "/brand/library/site/corporate-gifting-banner-gift-better.webp", alt: "This Diwali, gift better: corporate gifting banner with hampers", caption: `Corporate gifting banner. ${OFFICIAL}`, ratio: 1100 / 458 },
};

export function Gtm() {
  return (
    <section id="gtm" className={sectionCls}>
      <Panel tone="peach" reveal="left" width="max-w-7xl">
        <SectionIntro index="2" kicker="Go-to-Market (GTM) channel architecture" title="Four pillars, one brand" />
        <motion.div initial={{ opacity: 0, y: 14 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-6 flex items-start gap-3 rounded-2xl border border-cocoa bg-white p-4 shadow-[3px_3px_0_0_#2f1c1a]">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-orange text-white">
            <MapPinned className="size-5" />
          </span>
          <p className="font-display text-[1.12rem] font-semibold leading-snug text-cocoa">
            <GlossaryText>{GTM_DEFINITION}</GlossaryText>
          </p>
        </motion.div>

        {/* the four pillars holding up the brand */}
        <div data-tour-skip="quiet" className="mt-6 hidden rounded-t-[22px] bg-cocoa px-6 py-3 text-center font-display text-[1.3rem] font-semibold text-cream md:block">Eat Better Co reaches its customers through</div>
        <div className="grid gap-4 md:grid-cols-4 md:gap-3">
          {PILLARS.map((p, i) => {
            const Icon = PILLAR_ICON[p.id];
            const img = PILLAR_IMG[p.id];
            return (
              <motion.article key={p.id} initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="flex min-w-0 flex-col overflow-hidden rounded-[22px] border border-cocoa bg-white shadow-[3px_3px_0_0_#2f1c1a] md:rounded-t-none md:border-t-0">
                <div className="relative aspect-[4/3] bg-cream">
                  <Image src={img.src} alt={img.alt} fill sizes="(max-width: 768px) 100vw, 25vw" className={img.ratio > 2 ? "object-contain p-3" : "object-cover object-top"} />
                  <span className="absolute left-3 top-3 grid size-9 place-items-center rounded-full border border-cocoa bg-orange text-white">
                    <Icon className="size-4" />
                  </span>
                  <span className="absolute right-3 top-3 rounded-full border border-cocoa bg-cream px-2.5 py-1 text-[0.85rem] font-extrabold text-cocoa">{p.n}</span>
                </div>
                <div className="flex flex-1 flex-col gap-3 p-4">
                  <h3 className="font-display text-[1.15rem] font-semibold leading-tight text-cocoa">{p.title}</h3>
                  <p className="text-[0.95rem] leading-snug text-cocoa">
                    <GlossaryText>{p.text}</GlossaryText>
                  </p>
                  <div className="mt-auto flex flex-wrap gap-1.5">
                    {p.gives.map((g) => (
                      <span key={g} className="rounded-full bg-peach px-2.5 py-0.5 text-[0.82rem] font-bold text-cocoa">
                        {g}
                      </span>
                    ))}
                  </div>
                  <p className="text-[0.8rem] leading-snug text-cocoa-2">{img.caption}</p>
                </div>
              </motion.article>
            );
          })}
        </div>
        <MediaRow
          className="mt-6"
          items={[
            { kind: "image", src: "/brand/library/hampers/diwali-jumbo-blue-open.webp", alt: "Ultimate Diwali Jumbo Box opened to show its packs and sweets", ratio: 1, caption: `Made-to-order hamper for bulk and corporate orders. ${OFFICIAL}` },
            { kind: "image", src: "/chapter-3-4/web-corporate-how-it-works.webp", alt: "How corporate gifting works: sample, customize, approve, deliver in 3–4 days or 5–7 with customisation", ratio: 1000 / 417, caption: `Corporate orders run on a schedule: sample, customise, approve, deliver. ${SHOT}` },
          ]}
        />
      </Panel>
    </section>
  );
}

/* ── 3 · Channel comparison matrix ────────────────────────────── */

const SPEED_ICON = { minutes: Zap, days: Truck, scheduled: Clock3 } as const;
const OBJ_ICON: Record<PillarId, LucideIcon> = { d2c: Database, marketplace: Search, qcom: Timer, b2b: Boxes };
const MODEL_ICON: Record<PillarId, LucideIcon> = { d2c: Warehouse, marketplace: Boxes, qcom: Store, b2b: Truck };
/** Visual width of the speed bar: log scale so 15 minutes and 5 days both read. */
const speedWidth = (m: number) => (m <= 0 ? 100 : Math.max(6, Math.min(100, (Math.log10(m) / Math.log10(7 * 24 * 60)) * 100)));

export function Matrix() {
  return (
    <section id="matrix" className={sectionCls}>
      <Panel tone="light" reveal="right" width="max-w-7xl">
        <SectionIntro index="3" kicker="Channel comparison matrix" title="Same snack, four speeds">
          Each channel has its own way of getting the pack to the customer, its own delivery speed, and its own reason to exist.
        </SectionIntro>
        <div className="mt-6 grid gap-3 lg:grid-cols-4">
          {MATRIX.map((r, i) => {
            const Speed = SPEED_ICON[r.speedKind];
            const Obj = OBJ_ICON[r.id];
            const Model = MODEL_ICON[r.id];
            const Icon = PILLAR_ICON[r.id];
            return (
              <motion.article key={r.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="flex min-w-0 flex-col rounded-[22px] border border-cocoa bg-white shadow-[3px_3px_0_0_#2f1c1a]">
                <div className="flex items-center gap-2.5 rounded-t-[22px] bg-cocoa px-4 py-3 text-cream">
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-orange text-white">
                    <Icon className="size-4" />
                  </span>
                  <div>
                    <div className="text-[0.7rem] font-extrabold uppercase tracking-[0.12em] text-haldi">Channel</div>
                    <div className="font-display text-[1.1rem] font-semibold leading-tight">{r.channel}</div>
                  </div>
                </div>
                <div className="grid flex-1 gap-3 p-4">
                  <div>
                    <div className="flex items-center gap-1.5 text-[0.72rem] font-extrabold uppercase tracking-[0.1em] text-cocoa-2">
                      <Model className="size-3.5" /> Fulfillment model
                    </div>
                    <div className="mt-1 text-[0.98rem] font-bold leading-snug text-cocoa">
                      <GlossaryText>{r.model}</GlossaryText>
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5 text-[0.72rem] font-extrabold uppercase tracking-[0.1em] text-cocoa-2">
                      <Speed className="size-3.5" /> Primary delivery speed
                    </div>
                    <div className={`mt-1 font-display text-[1.35rem] font-semibold leading-tight ${r.speedKind === "minutes" ? "text-orange" : "text-cocoa"}`}>{r.speed}</div>
                    <div className="mt-2 h-2.5 rounded-full bg-cream">
                      <motion.div initial={{ width: 0 }} whileInView={{ width: `${speedWidth(r.minutes)}%` }} viewport={{ once: true }} transition={{ duration: 0.8, delay: 0.2 }} className={`h-full rounded-full ${r.speedKind === "minutes" ? "bg-orange" : r.speedKind === "scheduled" ? "bg-cocoa/30 [background-image:repeating-linear-gradient(90deg,transparent_0_6px,#fff_6px_10px)]" : "bg-cocoa"}`} />
                    </div>
                    <div className="mt-1 text-[0.75rem] font-bold text-cocoa-2">{r.speedKind === "minutes" ? "minutes" : r.speedKind === "days" ? "days" : "planned in advance"}</div>
                  </div>
                  <div className="mt-auto rounded-xl bg-peach/70 p-3">
                    <div className="flex items-center gap-1.5 text-[0.72rem] font-extrabold uppercase tracking-[0.1em] text-orange">
                      <Obj className="size-3.5" /> Core strategic objective
                    </div>
                    <div className="mt-1 text-[0.95rem] font-semibold leading-snug text-cocoa">
                      <GlossaryText>{r.objective}</GlossaryText>
                    </div>
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
        {/* the speed line: all four on one ruler */}
        <div className="mt-6 rounded-[22px] bg-cream p-4 sm:p-5">
          <div className="text-[0.8rem] font-extrabold uppercase tracking-[0.12em] text-cocoa-2">How long the customer waits</div>
          <div className="mt-3 grid gap-2">
            {[...MATRIX].sort((a, b) => (a.minutes || 1e9) - (b.minutes || 1e9)).map((r) => (
              <div key={r.id} className="grid grid-cols-[minmax(0,120px)_1fr_auto] items-center gap-3 sm:grid-cols-[180px_1fr_auto]">
                <span className="truncate text-[0.9rem] font-bold text-cocoa">{r.channel}</span>
                <div className="h-3 rounded-full bg-white">
                  <motion.div initial={{ width: 0 }} whileInView={{ width: `${speedWidth(r.minutes)}%` }} viewport={{ once: true }} transition={{ duration: 0.9 }} className={`h-full rounded-full ${r.speedKind === "minutes" ? "bg-orange" : r.speedKind === "scheduled" ? "bg-cocoa/25" : "bg-cocoa"}`} />
                </div>
                <span className="text-[0.88rem] font-bold tabular-nums text-cocoa-2">{r.speed}</span>
              </div>
            ))}
          </div>
          <p className="mt-2 text-[0.8rem] text-cocoa-2">Bars are on a log scale so minutes and days can share one line. Corporate orders are scheduled, not raced.</p>
        </div>
      </Panel>
    </section>
  );
}

/* ── 4 · Operational & logistics challenges ───────────────────── */

const CH_ICON: Record<ChallengeId, LucideIcon> = { fresh: Thermometer, sync: Repeat, spike: Sparkle, lastmile: IndianRupee };
const CH_IMG: Record<ChallengeId, { src: string; alt: string; caption: string; ratio: number }[]> = {
  fresh: [
    { src: "/brand/library/chips-puffs/ragi-chips-thai-chilli-tadka-back.webp", alt: "Back of a Ragi Chips pouch", caption: `A sealed multi-layer pouch keeps the crunch in. ${OFFICIAL}`, ratio: 1 },
    { src: "/brand/library/chips-puffs/protein-chips-pizza-party-texture.webp", alt: "Protein Chips pack on a bed of crunchy chips", caption: `What has to arrive whole: the crunch. ${OFFICIAL}`, ratio: 1 },
  ],
  sync: [
    { src: "/brand/library/site/home-millet-bhujia.webp", alt: "Millet Bhujia pack", caption: `One pack, many shelves: warehouse, marketplace centres and dark stores. ${OFFICIAL}`, ratio: 556 / 610 },
  ],
  spike: [
    { src: "/brand/library/hampers/rakhi-sneh-12-item-open.webp", alt: "Sneh Rakhi hamper opened", caption: `Rakhi: a seasonal peak. ${OFFICIAL}`, ratio: 1 },
    { src: "/brand/library/hampers/diwali-tyohaar-jumbo-open.webp", alt: "Tyohaar Jumbo Diwali hamper opened", caption: `Diwali: the biggest one. ${OFFICIAL}`, ratio: 1 },
  ],
  lastmile: [
    { src: "/chapter-3-4/web-corporate-why.webp", alt: "Why companies come back: we deliver on time, one order many cities", caption: `“One order, many cities” and “we deliver on time”: promises that cost freight to keep. ${SHOT}`, ratio: 1000 / 571 },
  ],
};

export function Challenges() {
  return (
    <section id="challenges" className={sectionCls}>
      <Panel tone="peach" reveal="up" width="max-w-7xl">
        <SectionIntro index="4" kicker="Operational & logistics challenges" title="Four things that can go wrong on the way" />
        <div className="mt-6 grid gap-5">
          {CHALLENGES.map((c, i) => {
            const Icon = CH_ICON[c.id];
            const imgs = CH_IMG[c.id];
            const flip = i % 2 === 1;
            return (
              <motion.article key={c.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className={`grid items-stretch gap-4 overflow-hidden rounded-[24px] border border-cocoa bg-white shadow-[3px_3px_0_0_#2f1c1a] lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] ${flip ? "lg:[&>*:first-child]:order-2" : ""}`}>
                <div className="flex flex-col gap-3 p-5 sm:p-6">
                  <div className="flex items-center gap-3">
                    <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-orange text-white">
                      <Icon className="size-6" />
                    </span>
                    <div>
                      <div className="text-[0.75rem] font-extrabold uppercase tracking-[0.12em] text-orange">Challenge {c.n}</div>
                      <h3 className="font-display text-[1.35rem] font-semibold leading-tight text-cocoa">{c.title}</h3>
                    </div>
                  </div>
                  <p className="text-[1.02rem] leading-relaxed text-cocoa">
                    <GlossaryText>{c.text}</GlossaryText>
                  </p>
                  <div className="mt-auto flex flex-wrap gap-1.5">
                    {c.tags.map((t) => (
                      <span key={t} className="flex items-center gap-1 rounded-full bg-cream px-2.5 py-1 text-[0.85rem] font-bold text-cocoa">
                        {c.id === "lastmile" ? <PackageX className="size-3.5 text-error" /> : <Target className="size-3.5 text-orange" />}
                        {t}
                      </span>
                    ))}
                  </div>
                </div>
                {c.id === "sync" ? (
                  // a drawn illustration of the challenge itself, kept to a moderate size and centred beside the text
                  <div className="grid place-items-center bg-cream p-4">
                    <figure className="w-full max-w-[440px]">
                      <div className="overflow-hidden rounded-xl border border-cocoa/15 bg-white">
                        <SyncIllustration />
                      </div>
                      <figcaption className="mt-1.5 text-[0.8rem] leading-snug text-cocoa-2">Illustration: the same stock has to be shared out without any store running out or overfilling.</figcaption>
                    </figure>
                  </div>
                ) : (
                  <div className={`grid content-center gap-2 bg-cream p-3 ${imgs.length > 1 ? "grid-cols-2" : "grid-cols-1"}`}>
                    {imgs.map((im) => (
                      <figure key={im.src} className="flex min-w-0 flex-col">
                        {/* tap any picture to enlarge and zoom it */}
                        <Zoomable src={im.src} alt={im.alt} ratio={im.ratio} className="w-full overflow-hidden rounded-xl border border-cocoa/15 bg-white">
                          <div className="relative w-full" style={{ aspectRatio: imgs.length > 1 ? 1 : im.ratio }}>
                            <Image src={im.src} alt={im.alt} fill sizes="(max-width: 1024px) 50vw, 320px" className={im.ratio < 0.95 ? "object-contain" : "object-cover"} />
                          </div>
                        </Zoomable>
                        <figcaption className="mt-1.5 text-[0.8rem] leading-snug text-cocoa-2">{im.caption}</figcaption>
                      </figure>
                    ))}
                  </div>
                )}
              </motion.article>
            );
          })}
        </div>
        <div className="mt-5 flex items-start gap-3 rounded-2xl bg-cocoa p-4 text-cream">
          <Layers className="mt-0.5 size-5 shrink-0 text-haldi" />
          <p className="text-[1rem] leading-snug">
            <span className="mr-1.5 text-[0.78rem] font-extrabold uppercase tracking-[0.12em] text-haldi">In plain words</span>
            Clean-label means no artificial preservatives, so the pouch and the handling have to do the protecting. Many channels means the same stock has to be in several places at once. Festivals multiply orders overnight. And every small parcel sent far away costs real money, twice if it comes back.
          </p>
        </div>
      </Panel>
    </section>
  );
}

/* ── 5 · Activities ───────────────────────────────────────────── */

function ActivityRun({ id, Comp }: { id: string; Comp: React.ComponentType<{ onDone: (summary: string) => void }> }) {
  const complete = useActivities34((s) => s.complete);
  const save = useWork34((s) => s.save);
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
        <SectionIntro index="5" kicker="Activities" title="Run the logistics desk" />
        <p className="mt-2 max-w-3xl text-[1.05rem] text-cocoa">Three of the chapter&apos;s four challenges, as desk jobs with real working: stock sync, a festive surge and last-mile costs. Every number is yours to compute, and the practice data changes each time.</p>
        <div className="mt-6 grid gap-8">
          {ACTS_34.map((a) => (
            <ActivityRun key={a.id} id={a.id} Comp={a.Comp} />
          ))}
        </div>
      </Panel>
    </section>
  );
}

/* ── Wrap-up ──────────────────────────────────────────────────── */

const RECAP: { title: string; icon: LucideIcon }[] = [
  { title: "Four channels, one brand", icon: MapPinned },
  { title: "10 minutes to 5 days", icon: Timer },
  { title: "Pouch protects the crunch", icon: Thermometer },
  { title: "Stock in sync everywhere", icon: Repeat },
  { title: "Peaks and the last mile", icon: Gift },
];

export function WrapUp() {
  const done = useActivities34((s) => s.done);
  const work = useWork34((s) => s.work);
  const list = ACTS_34.map((a) => ({ id: a.id, label: a.label }));
  const n = list.filter((a) => done[a.id]).length;
  return (
    <section id="wrap-up" className={sectionCls}>
      <Panel tone="light" reveal="up" width="max-w-7xl">
        <div className="text-[0.85rem] font-extrabold uppercase tracking-[0.16em] text-orange">Chapter 3.4 · Wrap-up</div>
        <h2 className="mt-3 font-display text-[clamp(2.1rem,5vw,3.2rem)] font-semibold leading-[1.04] text-cocoa">Fresh, fast and whole</h2>
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
          <p className="font-display text-[1.15rem] leading-snug">
            <GlossaryText>{TAKEAWAY}</GlossaryText>
          </p>
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
        <MyWork chapter="3.4" items={list.map((a) => ({ label: a.label, text: work[a.id] }))} />
      </Panel>
    </section>
  );
}
