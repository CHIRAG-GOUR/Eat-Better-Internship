"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { SKU_IDS, SKUS, type BudgetId, type SkuId } from "./data";

export type SkuCosts = {
  ingredients: number;
  packaging: number;
  production: number;
};

export type Activity4State = {
  seed: number;
  stage: number; // 0: Discover, 1: Pricing, 2: Financials, 3: Competition, 4: Budget, 5: Growth, 6: Pitch, 7: Project
  selectedSku: SkuId;
  skuCosts: Record<SkuId, SkuCosts>;
  productionLever: boolean; // whether student applied in-house manufacturing efficiency
  financeUnderstood: boolean;
  selectedCompetitor: string;
  selectedMoat: string;
  budget: Record<BudgetId, number>;
  growthStrategy: {
    primaryPillar: string;
    facilityPhase: string;
    scaleVector: string;
    rationale: string;
  };
  pitchAnswers: Record<string, string>;
  pitchSubmitted: boolean;
  reflection: string;

  set: (p: Partial<Omit<Activity4State, "set" | "setStage" | "restart">>) => void;
  setStage: (stage: number) => void;
  setSkuCost: (id: SkuId, costs: Partial<SkuCosts>) => void;
  setBudget: (id: BudgetId, pct: number) => void;
  setPitchAnswer: (qId: string, optId: string) => void;
  restart: () => void;
};

const initialSkuCosts = (): Record<SkuId, SkuCosts> => {
  const c: Partial<Record<SkuId, SkuCosts>> = {};
  for (const id of SKU_IDS) {
    c[id] = { ...SKUS[id].bom };
  }
  return c as Record<SkuId, SkuCosts>;
};

const initialBudget = (): Record<BudgetId, number> => ({
  portfolio: 15,
  marketing: 25,
  mfg: 25,
  qcom: 15,
  b2b: 12,
  tech: 8,
});

const freshState = () => ({
  seed: Math.floor(Math.random() * 1e9) + 1,
  stage: 0,
  selectedSku: "l24" as SkuId,
  skuCosts: initialSkuCosts(),
  productionLever: false,
  financeUnderstood: false,
  selectedCompetitor: "eb",
  selectedMoat: "clean_taste",
  budget: initialBudget(),
  growthStrategy: {
    primaryPillar: "infra",
    facilityPhase: "phase1",
    scaleVector: "omnichannel",
    rationale: "Scaling centralized production in Jaipur directly expands gross margin from 54% to 62% while unlocking 2L+ monthly order throughput for quick commerce and corporate gifting.",
  },
  pitchAnswers: {},
  pitchSubmitted: false,
  reflection: "",
});

export const useBusinessStore = create<Activity4State>()(
  persist(
    (set) => ({
      ...freshState(),
      set: (p) => set(p),
      setStage: (stage) => set({ stage }),
      setSkuCost: (id, costs) =>
        set((s) => ({
          skuCosts: {
            ...s.skuCosts,
            [id]: { ...s.skuCosts[id], ...costs },
          },
        })),
      setBudget: (id, pct) =>
        set((s) => ({
          budget: { ...s.budget, [id]: Math.max(0, Math.min(100, Math.round(pct))) },
        })),
      setPitchAnswer: (qId, optId) =>
        set((s) => ({
          pitchAnswers: { ...s.pitchAnswers, [qId]: optId },
        })),
      restart: () => set(freshState()),
    }),
    { name: "eb-exp-4", version: 1 },
  ),
);
