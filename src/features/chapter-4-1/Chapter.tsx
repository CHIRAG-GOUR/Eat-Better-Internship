"use client";

import dynamic from "next/dynamic";
import { FullscreenToggle } from "@/components/chapter/FullscreenToggle";
import { ChapterNotes } from "@/components/chapter/ChapterNotes";
import { LaddooRing, type ProgressSection } from "@/components/chapter/LaddooRing";
import { ChapterOpener } from "@/components/chapter/ChapterOpener";
import { TakeawayMoment } from "@/components/chapter/TakeawayMoment";
import { GlossaryProvider } from "@/components/chapter/Glossary";
import { WorldShell } from "@/components/world/WorldShell";
import { CHAPTER, LIB, TAKEAWAY } from "./content";
import { GLOSSARY_4_1 } from "./glossary";
import { Activities, Drivers, Financials, PriceTable, WrapUp } from "./sections";

const World = dynamic(() => import("./three/World"), { ssr: false, loading: () => null });

const SECTIONS: ProgressSection[] = [
  { id: "intro", label: "Introduction" },
  { id: "price", label: "Price per gram" },
  { id: "drivers", label: "Why prices differ" },
  { id: "financials", label: "Financial performance" },
  { id: "activities", label: "Activities" },
  { id: "takeaway", label: "Key takeaway" },
  { id: "wrap-up", label: "Wrap-up" },
];

export default function Chapter() {
  return (
    <GlossaryProvider entries={GLOSSARY_4_1}>
      <a href="#price" className="sr-only z-50 rounded-lg bg-cocoa px-4 py-2 text-cream focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
        Skip to chapter content
      </a>
      <WorldShell scrim>
        <World />
      </WorldShell>
      <ChapterNotes chapterNumber={CHAPTER.number} chapterTitle={CHAPTER.title} />
      <FullscreenToggle />
      <LaddooRing sections={SECTIONS} />
      <main className="pointer-events-none relative z-10">
        <ChapterOpener module={CHAPTER.module} number={CHAPTER.number} title={CHAPTER.title} subtitle={CHAPTER.subtitle} objective={CHAPTER.objective} />
        <PriceTable />
        <Drivers />
        <Financials />
        <Activities />
        <TakeawayMoment
          text={TAKEAWAY}
          emphasise={["higher", "better", "transparent", "trustworthy"]}
          steps={[
            { img: `${LIB}/combos/assorted-laddoo-box-24-claims.webp`, label: "A clearly better product" },
            { img: `${LIB}/nuts-seeds/premium-nut-mix-ingredients.webp`, label: "Transparent ingredients" },
            { img: `${LIB}/combos/ultimate-snack-box-contents.webp`, label: "A trustworthy brand experience" },
          ]}
        />
        <WrapUp />
      </main>
    </GlossaryProvider>
  );
}
