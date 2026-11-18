"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_LEVERS, NO_COINS, type DeptId, type Level, type Levers } from "./data";

type S = {
  stage: number; // 0 welcome · 1 price detective · 2 money machine · 3 rival radar · 4 budget coins · 5 grow & pitch · 6 report
  rank: string[]; // boxes placed on the podium, cheapest per gram first
  rankTries: number;
  rankDone: boolean;
  bag: Record<string, number>;
  levers: Levers;
  grid: Record<string, { x: Level | null; y: Level | null }>;
  gridMistakes: number;
  edge: string; // "Eat Better wins because…"
  coins: Record<DeptId, number>;
  target: number; // lakh orders a month in a year
  lead: string | null; // growth pillar that leads
  pitch: string;
  answers: Record<number, string>;
  reflection: string;
  set: (p: Partial<Omit<S, "set" | "restart">>) => void;
  restart: () => void;
};

const fresh = () => ({
  stage: 0,
  rank: [] as string[],
  rankTries: 0,
  rankDone: false,
  bag: {},
  levers: { ...DEFAULT_LEVERS },
  grid: {},
  gridMistakes: 0,
  edge: "",
  coins: { ...NO_COINS },
  target: 2.5,
  lead: null,
  pitch: "",
  answers: {},
  reflection: "",
});

export const useBiz = create<S>()(
  persist(
    (set) => ({
      ...fresh(),
      set: (p) => set(p),
      restart: () => set(fresh()),
    }),
    // version 2 = the kid-friendly game; older saved attempts start fresh
    { name: "eb-exp-4", version: 2, migrate: () => fresh() as unknown as S },
  ),
);
