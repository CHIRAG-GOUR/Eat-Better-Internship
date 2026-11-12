"use client";

import dynamic from "next/dynamic";
import { FullscreenToggle } from "@/components/chapter/FullscreenToggle";
import { ChapterNotes } from "@/components/chapter/ChapterNotes";
import { LaddooRing, type ProgressSection } from "@/components/chapter/LaddooRing";
import { ChapterOpener } from "@/components/chapter/ChapterOpener";
import { TakeawayMoment } from "@/components/chapter/TakeawayMoment";
import { GlossaryProvider } from "@/components/chapter/Glossary";
import { WorldShell } from "@/components/world/WorldShell";
import { CHAPTER, TAKEAWAY } from "./content";
import { GLOSSARY_3_3 } from "./glossary";
import { Activities, CanvasOverview, Costs, Profitability, Revenue, Think, WrapUp } from "./sections";

const World = dynamic(() => import("./three/World"), { ssr: false, loading: () => null });

const SECTIONS: ProgressSection[] = [
  { id: "intro", label: "Introduction" },
  { id: "canvas", label: "The canvas" },
  { id: "revenue", label: "Revenue Streams" },
  { id: "costs", label: "Cost Structure" },
  { id: "profit", label: "Profitability" },
  { id: "takeaway", label: "Key takeaway" },
  { id: "think", label: "Think & discuss" },
  { id: "activities", label: "Activities" },
  { id: "wrap-up", label: "Wrap-up" },
];

export default function Chapter() {
  return (
    <GlossaryProvider entries={GLOSSARY_3_3}>
      <a href="#canvas" className="sr-only z-50 rounded-lg bg-cocoa px-4 py-2 text-cream focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
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
        <CanvasOverview />
        <Revenue />
        <Costs />
        <Profitability />
        <TakeawayMoment
          text={TAKEAWAY}
          emphasise={["growth", "profit", "different", "fast"]}
          steps={[
            { img: "/brand/library/namkeen/millet-bhel-bombay-bhelpuri-lifestyle.webp", label: "Sales grow" },
            { img: "/brand/library/laddoos/orange-ginger-laddoos-ingredients.webp", label: "Costs grow too" },
            { img: "/brand/library/combos/ultimate-snack-box-hero.webp", label: "Profit comes later" },
          ]}
        />
        <Think />
        <Activities />
        <WrapUp />
      </main>
    </GlossaryProvider>
  );
}
