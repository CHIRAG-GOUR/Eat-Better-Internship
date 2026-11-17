"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_BUDGET, DEFAULT_COSTS, DEFAULT_LEVERS, type Costs, type DeptId, type Level, type Levers } from "./data";

type S = {
  stage: number; // 0 discover · 1 pricing · 2 finance · 3 competition · 4 budget · 5 growth · 6 pitch · 7 project
  ppg: Record<string, number>; // student's price-per-gram answers
  ppgMistakes: number;
  costs: Record<string, Costs>;
  basket: Record<string, number>;
  levers: Levers;
  plExplain: string;
  grid: Record<string, { x: Level | null; y: Level | null }>; // positioning map placements
  gridMistakes: number;
  swot: { strength: string; weakness: string; opportunity: string; edge: string };
  budget: Record<DeptId, number>;
  weights: Record<string, number>;
  target: number; // lakh orders / month in 12 months
  growthWhy: string;
  ask: number; // ₹ crore
  pitch: { opportunity: string; differentiation: string; growth: string };
  answers: Record<number, string>;
  reflection: string;
  set: (p: Partial<Omit<S, "set" | "restart">>) => void;
  restart: () => void;
};

const fresh = () => ({
  stage: 0,
  ppg: {},
  ppgMistakes: 0,
  costs: structuredClone(DEFAULT_COSTS),
  basket: {},
  levers: { ...DEFAULT_LEVERS },
  plExplain: "",
  grid: {},
  gridMistakes: 0,
  swot: { strength: "", weakness: "", opportunity: "", edge: "" },
  budget: { ...DEFAULT_BUDGET },
  weights: { portfolio: 25, qcom: 25, b2b: 25, infra: 25 },
  target: 3,
  growthWhy: "",
  ask: 15,
  pitch: { opportunity: "", differentiation: "", growth: "" },
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
    { name: "eb-exp-4", version: 1 },
  ),
);
