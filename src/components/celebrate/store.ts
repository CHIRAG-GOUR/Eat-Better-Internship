"use client";

import { create } from "zustand";

/**
 * One celebration at a time, for every activity on the site.
 *  - celebrate({ score, max }) : an activity finished with a score (stars or points)
 *  - celebrateDone()          : an activity finished without a score; shown only if no scored celebration
 *                               arrives at the same moment (many games report both)
 */
export type Celebration = { score: number; max: number; title?: string; lost?: boolean; key: number };

type S = { current: Celebration | null; show: (c: Omit<Celebration, "key">) => void; clear: () => void };

let lastShown = 0;
let pending: ReturnType<typeof setTimeout> | null = null;

export const useCelebrate = create<S>((set) => ({
  current: null,
  show: (c) => set({ current: { ...c, key: Date.now() } }),
  clear: () => set({ current: null }),
}));

/** An activity finished with a score. */
export function celebrate(c: { score: number; max: number; title?: string; lost?: boolean }) {
  if (typeof window === "undefined") return;
  if (pending) {
    clearTimeout(pending);
    pending = null;
  }
  // the same finish is often reported twice (e.g. stars + end card); keep the first
  if (Date.now() - lastShown < 2500) return;
  lastShown = Date.now();
  useCelebrate.getState().show({ score: Math.max(0, c.score), max: Math.max(1, c.max), title: c.title, lost: c.lost });
}

/** An activity finished without a score: a "well done" celebration, unless a scored one arrives at the same time. */
export function celebrateDone(title?: string) {
  if (typeof window === "undefined") return;
  if (Date.now() - lastShown < 2500 || pending) return;
  pending = setTimeout(() => {
    pending = null;
    if (Date.now() - lastShown < 2500) return;
    lastShown = Date.now();
    useCelebrate.getState().show({ score: 1, max: 1, title });
  }, 900);
}
