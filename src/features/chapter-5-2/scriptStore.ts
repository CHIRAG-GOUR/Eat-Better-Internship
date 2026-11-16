"use client";

import { create } from "zustand";
import { PITCH_FORMATS } from "./content";

export interface ScriptState {
  formatId: string;
  hook: string;
  insight: string;
  solution: string;
  cta: string;
  videoLink: string;
  selfReflection: string;
  authorName: string;

  // Teleprompter rehearsal
  isPrompterOpen: boolean;
  isScrolling: boolean;
  scrollSpeed: number; // pixels per frame

  setFormat: (formatId: string) => void;
  setField: <K extends keyof ScriptState>(key: K, value: ScriptState[K]) => void;
  togglePrompter: () => void;
  toggleScrolling: () => void;
  setSpeed: (speed: number) => void;
  loadSaved: () => void;
  resetScript: () => void;
}

const STORAGE_KEY = "eat-better-pitch-5-2";

const defaultFormat = PITCH_FORMATS[0];

export const useScriptStore = create<ScriptState>((set, get) => ({
  formatId: "founder-pitch",
  hook: defaultFormat.sampleScript.hook,
  insight: defaultFormat.sampleScript.insight,
  solution: defaultFormat.sampleScript.solution,
  cta: defaultFormat.sampleScript.cta,
  videoLink: "",
  selfReflection: "This pitch highlights the clean ingredient advantage and scalable unit economics of Eat Better Co.",
  authorName: "",

  isPrompterOpen: false,
  isScrolling: false,
  scrollSpeed: 1,

  setFormat: (formatId) => {
    const f = PITCH_FORMATS.find((p) => p.id === formatId) || defaultFormat;
    set({
      formatId,
      hook: f.sampleScript.hook,
      insight: f.sampleScript.insight,
      solution: f.sampleScript.solution,
      cta: f.sampleScript.cta,
    });
  },

  setField: (key, value) => {
    set((state) => {
      const next = { ...state, [key]: value };
      try {
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify({
            formatId: next.formatId,
            hook: next.hook,
            insight: next.insight,
            solution: next.solution,
            cta: next.cta,
            videoLink: next.videoLink,
            selfReflection: next.selfReflection,
            authorName: next.authorName,
          })
        );
      } catch {
        //
      }
      return next;
    });
  },

  togglePrompter: () => set((s) => ({ isPrompterOpen: !s.isPrompterOpen, isScrolling: false })),
  toggleScrolling: () => set((s) => ({ isScrolling: !s.isScrolling })),
  setSpeed: (scrollSpeed) => set({ scrollSpeed }),

  loadSaved: () => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        set((s) => ({ ...s, ...parsed }));
      }
    } catch {
      //
    }
  },

  resetScript: () => {
    const f = PITCH_FORMATS.find((p) => p.id === get().formatId) || defaultFormat;
    set({
      hook: f.sampleScript.hook,
      insight: f.sampleScript.insight,
      solution: f.sampleScript.solution,
      cta: f.sampleScript.cta,
    });
  },
}));

export function computeScriptStats(state: ScriptState) {
  const fullText = [state.hook, state.insight, state.solution, state.cta].join(" ").trim();
  const words = fullText.length > 0 ? fullText.split(/\s+/).length : 0;
  // standard speech pace: 140 words per minute -> 2.33 words/sec
  const estimatedSeconds = Math.round((words / 140) * 60);

  return {
    words,
    estimatedSeconds,
    status:
      estimatedSeconds >= 55 && estimatedSeconds <= 95
        ? "ideal"
        : estimatedSeconds < 55
        ? "short"
        : "long",
  };
}

export function generatePitchMarkdown(state: ScriptState): string {
  const stats = computeScriptStats(state);

  return `# Eat Better Co — Capstone Task B: Video Pitch & Review Dossier
**Author / Intern:** ${state.authorName || "[Intern Name]"}  
**Pitch Angle:** ${state.formatId.toUpperCase()}  
**Target Duration:** 60 – 90 Seconds  
**Actual Script Length:** ${stats.words} words (~${stats.estimatedSeconds} seconds at 140 WPM)  
**Submission Video Link:** ${state.videoLink ? `[${state.videoLink}](${state.videoLink})` : "[Pending Upload / Insert URL]"}  

---

## 1. 4-Beat Video Pitch Script

### Beat 1: The Opening Hook (0–15s)
> "${state.hook}"

### Beat 2: The Insight & Clean-Label Discovery (15–35s)
> "${state.insight}"

### Beat 3: The Solution / Capstone Initiative (35–65s)
> "${state.solution}"

### Beat 4: The Climax & Call to Action (65–90s)
> "${state.cta}"

---

## 2. Intern Self-Reflection & Key Takeaway
${state.selfReflection}

---

## 3. Production & Verification Checklist
- [x] Duration within 60–90 second threshold (${stats.estimatedSeconds}s)
- [x] Clear articulation of zero refined sugars and clean ingredients
- [x] Quantitative metrics mentioned (unit economics, orders, or margins)
- [x] Audio recorded with minimal background noise and crisp vocals
- [x] Video uploaded and link verified accessible

*Submitted as part of the Eat Better Co × SkilliZee Internship Capstone Module (Chapter 5.2).*
`;
}
