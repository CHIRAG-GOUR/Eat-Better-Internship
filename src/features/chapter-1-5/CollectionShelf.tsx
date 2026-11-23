"use client";

import Image from "next/image";
import { AnimatePresence, motion } from "motion/react";
import { useState } from "react";
import { ChevronDown, ChevronUp, Store } from "lucide-react";
import { SHOP_CATEGORIES, SHOP_PRODUCTS, type ShopCategory } from "./collection";

const FIRST = 10;

/**
 * The All Products collection from eatbetterco.com, rebuilt with the shop's own product photos and names (the website
 * cannot be shown inside another page). Learners filter it by category, just like on the website.
 */
export function CollectionShelf() {
  const [cat, setCat] = useState<ShopCategory | "all">("all");
  const [all, setAll] = useState(false);
  const items = SHOP_PRODUCTS.filter((p) => cat === "all" || p.cat === cat);
  const shown = all || cat !== "all" ? items : items.slice(0, FIRST);
  const count = (c: ShopCategory) => SHOP_PRODUCTS.filter((p) => p.cat === c).length;

  return (
    <motion.figure initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-8 overflow-hidden rounded-[22px] border border-cocoa bg-white shadow-[3px_3px_0_0_#2f1c1a]">
      {/* shop header, like the website's collection page */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cocoa/10 bg-cream px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="grid size-9 place-items-center rounded-xl bg-orange text-white">
            <Store className="size-5" />
          </span>
          <div>
            <div className="font-display text-[1.1rem] font-semibold leading-tight text-cocoa">All Products Collection</div>
            <div className="text-[0.82rem] text-cocoa-2">eatbetterco.com · {SHOP_PRODUCTS.length} products</div>
          </div>
        </div>
      </div>
      <div className="no-scrollbar flex gap-2 overflow-x-auto px-4 pt-3" role="tablist" aria-label="Filter the collection by category">
        {[{ id: "all" as const, label: "All", n: SHOP_PRODUCTS.length }, ...SHOP_CATEGORIES.map((c) => ({ ...c, n: count(c.id) }))].map((c) => (
          <button
            key={c.id}
            role="tab"
            aria-selected={cat === c.id}
            onClick={() => {
              setCat(c.id);
              setAll(false);
            }}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-[0.88rem] font-bold transition-colors ${cat === c.id ? "border-cocoa bg-cocoa text-cream" : "border-cocoa/20 bg-white text-cocoa hover:border-cocoa"}`}
          >
            {c.label} <span className={cat === c.id ? "text-haldi" : "text-cocoa-2"}>{c.n}</span>
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 lg:grid-cols-5">
        <AnimatePresence mode="popLayout" initial={false}>
          {shown.map((p, i) => (
            <motion.div key={p.slug} layout initial={{ opacity: 0, scale: 0.94 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.94 }} transition={{ duration: 0.25, delay: Math.min(i, 10) * 0.02 }} className="flex min-w-0 flex-col overflow-hidden rounded-2xl border border-cocoa/15 bg-white">
              <div className="relative aspect-square bg-cream">
                <Image src={`/chapter-1-5/collection/${p.slug}.webp`} alt={`${p.name}, official Eat Better product photo`} fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 240px" className="object-cover" />
              </div>
              <div className="flex flex-1 flex-col gap-1 p-2.5">
                <span className="text-[0.86rem] font-bold leading-snug text-cocoa">{p.name}</span>
                <span className="mt-auto text-[0.75rem] font-bold uppercase tracking-[0.06em] text-orange">{SHOP_CATEGORIES.find((c) => c.id === p.cat)!.label}</span>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
      {cat === "all" && items.length > FIRST && (
        <div className="px-4 pb-4">
          <button onClick={() => setAll((v) => !v)} className="eb-btn eb-btn-secondary w-full justify-center !normal-case sm:w-auto">
            {all ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
            {all ? "Show fewer" : `Show all ${items.length} products`}
          </button>
        </div>
      )}
      <figcaption className="border-t border-cocoa/10 bg-cream px-4 py-3 text-[0.95rem] text-cocoa-2">
        The All Products Collection on the official Eat Better website (product names and photos as listed, November 2026). Notice how the shop is organised by category, with gift hampers for occasions.
      </figcaption>
    </motion.figure>
  );
}
