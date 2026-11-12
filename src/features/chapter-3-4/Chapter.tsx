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
import { GLOSSARY_3_4 } from "./glossary";
import { Activities, CanvasOverview, Challenges, Gtm, Matrix, WrapUp } from "./sections";

const World = dynamic(() => import("./three/World"), { ssr: false, loading: () => null });

const SECTIONS: ProgressSection[] = [
  { id: "intro", label: "Introduction" },
  { id: "canvas", label: "The canvas" },
  { id: "gtm", label: "GTM channel architecture" },
  { id: "matrix", label: "Channel comparison" },
  { id: "challenges", label: "Logistics challenges" },
  { id: "activities", label: "Activities" },
  { id: "takeaway", label: "Key takeaway" },
  { id: "wrap-up", label: "Wrap-up" },
];

export default function Chapter() {
  return (
    <GlossaryProvider entries={GLOSSARY_3_4}>
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
        <Gtm />
        <Matrix />
        <Challenges />
        <Activities />
        <TakeawayMoment
          text={TAKEAWAY}
          emphasise={["late", "broken", "stale", "logistics", "intrinsic", "core", "product", "experience"]}
          steps={[
            { img: "/brand/library/chips-puffs/ragi-chips-thai-chilli-tadka-front.webp", label: "Arrives whole" },
            { img: "/brand/library/hampers/diwali-jumbo-orange-open.webp", label: "Arrives on time" },
            { img: "/brand/library/site/home-snack-box-gifting.webp", label: "Part of the experience" },
          ]}
        />
        <WrapUp />
      </main>
    </GlossaryProvider>
  );
}
