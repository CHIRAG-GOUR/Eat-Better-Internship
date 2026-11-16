"use client";

import dynamic from "next/dynamic";
import { FullscreenToggle } from "@/components/chapter/FullscreenToggle";
import { ChapterNotes } from "@/components/chapter/ChapterNotes";
import { LaddooRing, type ProgressSection } from "@/components/chapter/LaddooRing";
import { ChapterOpener } from "@/components/chapter/ChapterOpener";
import { GlossaryProvider } from "@/components/chapter/Glossary";
import { WorldShell } from "@/components/world/WorldShell";
import { CHAPTER } from "./content";
import { GLOSSARY_5_2 } from "./glossary";
import {
  RecommendedStorefrontToolsAndChecklist,
  StorefrontPillars,
  TaskBStorefrontHub,
} from "./sections";

const World = dynamic(() => import("./three/World"), { ssr: false, loading: () => null });

const SECTIONS: ProgressSection[] = [
  { id: "intro", label: "Introduction" },
  { id: "storefront-hub", label: "Storefront Types" },
  { id: "storefront-pillars", label: "4 Storefront Pillars" },
  { id: "tools-and-checklist", label: "Tools & Graduation" },
];

export default function Chapter() {
  return (
    <GlossaryProvider entries={GLOSSARY_5_2}>
      <a
        href="#storefront-hub"
        className="sr-only z-50 rounded-lg bg-cocoa px-4 py-2 text-cream focus:not-sr-only focus:fixed focus:left-3 focus:top-3"
      >
        Skip to chapter content
      </a>
      <WorldShell scrim>
        <World />
      </WorldShell>
      <ChapterNotes chapterNumber={CHAPTER.number} chapterTitle={CHAPTER.title} />
      <FullscreenToggle />
      <LaddooRing sections={SECTIONS} />
      <main className="pointer-events-none relative z-10">
        <ChapterOpener
          module={CHAPTER.module}
          number={CHAPTER.number}
          title={CHAPTER.title}
          subtitle={CHAPTER.subtitle}
          objective={CHAPTER.objective}
        />
        <TaskBStorefrontHub />
        <StorefrontPillars />
        <RecommendedStorefrontToolsAndChecklist />
      </main>
    </GlossaryProvider>
  );
}
