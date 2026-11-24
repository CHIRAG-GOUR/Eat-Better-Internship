"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ChId, PackId } from "./data";
import type { Alloc, EventOutcome, MissionPlan, ReceiveChoice } from "./sim";

type S = {
  seed: number;
  stage: number; // 0 discover · 1 channels · 2 receiving · 3 allocate · 4 disruptions · 5 mission · 6 project
  routes: Record<string, ChId>;
  routeMistakes: number;
  recv: Record<string, ReceiveChoice>;
  recvMistakes: number;
  alloc: Alloc;
  packs: Partial<Record<ChId, PackId>>;
  weekRuns: number;
  events: Record<string, { opt: string; out: EventOutcome }>;
  plan: MissionPlan;
  missionRuns: number;
  reflection: string;
  set: (p: Partial<Omit<S, "set" | "restart">>) => void;
  restart: () => void;
};

const fresh = () => ({
  seed: Math.floor(Math.random() * 1e9) + 1,
  stage: 0,
  routes: {},
  routeMistakes: 0,
  recv: {},
  recvMistakes: 0,
  alloc: {},
  packs: {},
  weekRuns: 0,
  events: {},
  plan: { order: ["o1", "o2", "o3", "o4", "o5", "o6"], express: [] },
  missionRuns: 0,
  reflection: "",
});

export const useDC = create<S>()(
  persist(
    (set) => ({
      ...fresh(),
      set: (p) => set(p),
      restart: () => set(fresh()),
    }),
    // version 2: allocation is counted in whole boxes; older saves simply start fresh
    { name: "eb-exp-3", version: 2, migrate: () => fresh() as unknown as S },
  ),
);
