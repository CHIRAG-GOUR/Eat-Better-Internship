"use client";

import { motion } from "motion/react";
import { Building2, Coins, Factory, Gift, Handshake, HeartHandshake, Lock, Megaphone, Receipt, Users, type LucideIcon } from "lucide-react";

/**
 * The Business Model Canvas (9 blocks, standard layout) as a picture. Highlight the blocks a chapter covers and,
 * optionally, list that chapter's items inside them. On phones it becomes a stacked list in canvas order.
 */

export type BlockId = "partners" | "activities" | "resources" | "value" | "relationships" | "channels" | "segments" | "costs" | "revenue";

const BLOCKS: { id: BlockId; label: string; icon: LucideIcon; area: string }[] = [
  { id: "partners", label: "Key Partners", icon: Handshake, area: "1 / 1 / 3 / 3" },
  { id: "activities", label: "Key Activities", icon: Factory, area: "1 / 3 / 2 / 5" },
  { id: "resources", label: "Key Resources", icon: Building2, area: "2 / 3 / 3 / 5" },
  { id: "value", label: "Value Propositions", icon: Gift, area: "1 / 5 / 3 / 7" },
  { id: "relationships", label: "Customer Relationships", icon: HeartHandshake, area: "1 / 7 / 2 / 9" },
  { id: "channels", label: "Channels", icon: Megaphone, area: "2 / 7 / 3 / 9" },
  { id: "segments", label: "Customer Segments", icon: Users, area: "1 / 9 / 3 / 11" },
  { id: "costs", label: "Cost Structure", icon: Receipt, area: "3 / 1 / 4 / 6" },
  { id: "revenue", label: "Revenue Streams", icon: Coins, area: "3 / 6 / 4 / 11" },
];

export function BizCanvas({
  highlight = [],
  items = {},
  labels = {},
  caption,
  studied = {},
  upcoming = {},
}: {
  highlight?: BlockId[];
  items?: Partial<Record<BlockId, string[]>>;
  labels?: Partial<Record<BlockId, string>>;
  caption?: string;
  /** blocks covered in earlier chapters, with that chapter's number (e.g. { value: "3.1" }): shown grey and tagged */
  studied?: Partial<Record<BlockId, string>>;
  /** blocks a later chapter covers, with that chapter's number: shown locked, like a character still to unlock */
  upcoming?: Partial<Record<BlockId, string>>;
}) {
  const on = (id: BlockId) => highlight.includes(id);
  const before = (id: BlockId) => studied[id];
  const hasStudied = Object.keys(studied).length > 0;
  const later = (id: BlockId) => (on(id) || before(id) ? undefined : upcoming[id]);
  const tone = (id: BlockId) => (on(id) ? "lit" : before(id) ? "studied" : later(id) ? "locked" : "next");
  const hasLocked = Object.keys(upcoming).length > 0;
  return (
    <figure className="min-w-0">
      {/* full canvas */}
      <div className="hidden gap-1.5 rounded-[22px] border border-cocoa bg-cocoa p-1.5 shadow-[3px_3px_0_0_#2f1c1a] sm:grid" style={{ gridTemplateColumns: "repeat(10, minmax(0, 1fr))", gridTemplateRows: "minmax(8.5rem, auto) minmax(8.5rem, auto) minmax(4.5rem, auto)" }}>
        {BLOCKS.map((b, i) => {
          const Icon = b.icon;
          const lit = on(b.id);
          return (
            <motion.div
              key={b.id}
              initial={{ opacity: 0, scale: 0.96 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              style={{ gridArea: b.area }}
              className={`relative flex min-w-0 flex-col overflow-hidden rounded-[16px] p-3 ${tone(b.id) === "lit" ? "bg-orange text-white" : tone(b.id) === "studied" ? "bg-[#CFCAC6] text-cocoa/75" : tone(b.id) === "locked" ? "border-2 border-dashed border-cream/25 bg-gradient-to-br from-[#4A3631] to-[#241513] text-cream/45" : "bg-cream text-cocoa-2/70"}`}
            >
              {later(b.id) && (
                <span className="absolute inset-0 grid place-items-center" aria-hidden>
                  <span className="grid size-11 place-items-center rounded-full border-2 border-haldi/70 bg-black/30 text-haldi shadow-[0_0_18px_rgba(254,211,0,0.25)]">
                    <Lock className="size-5" />
                  </span>
                </span>
              )}
              <div className="flex items-center gap-1.5">
                <Icon className={`size-4 shrink-0 ${lit ? "text-white" : tone(b.id) === "studied" ? "text-cocoa/55" : tone(b.id) === "locked" ? "text-cream/35" : "text-cocoa-2/50"}`} />
                <span className={`text-[0.82rem] font-extrabold uppercase leading-tight tracking-[0.06em] ${lit ? "text-white" : ""}`}>{labels[b.id] ?? b.label}</span>
              </div>
              {before(b.id) && (
                <span className={`mt-1.5 self-start rounded-full px-2 py-0.5 text-[0.72rem] font-extrabold ${lit ? "bg-white/25 text-white" : "bg-cocoa/75 text-cream"}`}>
                  {lit ? `Also in Chapter ${before(b.id)}` : `Studied in Chapter ${before(b.id)}`}
                </span>
              )}
              {later(b.id) && <span className="relative mt-auto self-start rounded-full bg-haldi px-2 py-0.5 text-[0.72rem] font-extrabold text-cocoa">Unlocks in Chapter {later(b.id)}</span>}
              {lit && items[b.id]?.length ? (
                <ul className="mt-2 space-y-1 text-[0.86rem] leading-snug text-white/95">
                  {items[b.id]!.map((t) => (
                    <li key={t} className="flex gap-1.5">
                      <span className="mt-[0.45em] size-1.5 shrink-0 rounded-full bg-haldi" />
                      <span className="min-w-0">{t}</span>
                    </li>
                  ))}
                </ul>
              ) : null}
            </motion.div>
          );
        })}
      </div>
      {/* phones: stacked in canvas order */}
      <ol className="grid gap-2 sm:hidden">
        {BLOCKS.map((b) => {
          const Icon = b.icon;
          const lit = on(b.id);
          return (
            <li key={b.id} className={`rounded-2xl border px-3.5 py-2.5 ${lit ? "border-cocoa bg-orange text-white shadow-[2px_2px_0_0_#2f1c1a]" : tone(b.id) === "studied" ? "border-cocoa/20 bg-[#CFCAC6] text-cocoa/75" : tone(b.id) === "locked" ? "border-dashed border-cream/25 bg-gradient-to-br from-[#4A3631] to-[#241513] text-cream/50" : "border-cocoa/15 bg-cream text-cocoa-2/70"}`}>
              <div className="flex flex-wrap items-center gap-2">
                {later(b.id) ? <Lock className="size-4 shrink-0 text-haldi" /> : <Icon className="size-4 shrink-0" />}
                <span className="text-[0.88rem] font-extrabold uppercase tracking-[0.06em]">{labels[b.id] ?? b.label}</span>
                {before(b.id) && (
                  <span className={`ml-auto rounded-full px-2 py-0.5 text-[0.72rem] font-extrabold ${lit ? "bg-white/25 text-white" : "bg-cocoa/75 text-cream"}`}>
                    {lit ? `Also in ${before(b.id)}` : `Studied in ${before(b.id)}`}
                  </span>
                )}
                {later(b.id) && <span className="ml-auto rounded-full bg-haldi px-2 py-0.5 text-[0.72rem] font-extrabold text-cocoa">Unlocks in {later(b.id)}</span>}
              </div>
              {lit && items[b.id]?.length ? <p className="mt-1 text-[0.92rem] leading-snug text-white/95">{items[b.id]!.join(" · ")}</p> : null}
            </li>
          );
        })}
      </ol>
      {(hasStudied || hasLocked) && (
        <div className="mt-2.5 flex flex-wrap gap-x-4 gap-y-1.5 text-[0.85rem] font-bold text-cocoa">
          <span className="flex items-center gap-1.5"><span className="size-3.5 rounded bg-orange" /> This chapter</span>
          {hasStudied && <span className="flex items-center gap-1.5"><span className="size-3.5 rounded bg-[#CFCAC6]" /> Studied in an earlier chapter</span>}
          {hasLocked && <span className="flex items-center gap-1.5"><Lock className="size-3.5 text-cocoa" /> Locked: unlocks in a later chapter</span>}
        </div>
      )}
      {caption && <figcaption className="mt-2 text-[0.9rem] text-cocoa-2">{caption}</figcaption>}
    </figure>
  );
}
