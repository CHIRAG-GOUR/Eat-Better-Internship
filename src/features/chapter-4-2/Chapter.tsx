"use client";

import dynamic from "next/dynamic";
import { FullscreenToggle } from "@/components/chapter/FullscreenToggle";
import { ChapterNotes } from "@/components/chapter/ChapterNotes";
import { LaddooRing, type ProgressSection } from "@/components/chapter/LaddooRing";
import { ChapterOpener } from "@/components/chapter/ChapterOpener";
import { TakeawayMoment } from "@/components/chapter/TakeawayMoment";
import { GlossaryProvider } from "@/components/chapter/Glossary";
import { WorldShell } from "@/components/world/WorldShell";
import { CHAPTER, EDGE_LINE } from "./content";
import { GLOSSARY_4_2 } from "./glossary";
import { Activities, Brands, Edge, KMatrix, Market, WrapUp } from "./sections";

const World = dynamic(() => import("./three/World"), { ssr: false, loading: () => null });

const SECTIONS: ProgressSection[] = [
  { id: "intro", label: "Introduction" },
  { id: "market", label: "Market comparison" },
  { id: "kmatrix", label: "Competitive K-Matrix" },
  { id: "brands", label: "Brand comparison" },
  { id: "edge", label: "Eat Better's edge" },
  { id: "activities", label: "Activities" },
  { id: "takeaway", label: "Closing idea" },
  { id: "wrap-up", label: "Wrap-up" },
];

export default function Chapter() {
  return (
    <GlossaryProvider entries={GLOSSARY_4_2}>
      <a href="#market" className="sr-only z-50 rounded-lg bg-cocoa px-4 py-2 text-cream focus:not-sr-only focus:fixed focus:left-3 focus:top-3">
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
        <Market />
        <KMatrix />
        <Brands />
        <Edge />
        <Activities />
        <TakeawayMoment
          text={EDGE_LINE}
          emphasise={["traditional", "laddoo", "namkeen", "bhel", "family-friendly"]}
          steps={[
            { img: "/brand/library/laddoos/orange-ginger-laddoos-lifestyle.webp", label: "Laddoo" },
            { img: "/brand/library/namkeen/millet-namkeen-desi-masala-lifestyle.webp", label: "Namkeen" },
            { img: "/brand/library/namkeen/millet-bhel-bombay-bhelpuri-creative.webp", label: "Bhel" },
          ]}
        />
        <WrapUp />
      </main>
    </GlossaryProvider>
  );
}
