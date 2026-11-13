"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CategoryId, CheckpointId } from "./data";

export type CheckResult = { status: "pass" | "fixed"; mistakes: number; note: string };
export type Product = {
  category: CategoryId | null;
  parts: { id: string; pct: number }[];
  flavour: string | null;
  consumer: string | null;
  name: string;
  concept: string;
};
export type LabelInfo = { netQty: string; allergens: string[]; storage: string; bestBefore: string };

type S = {
  seed: number;
  stage: number; // 0 intro · 1 ingredients · 2 build · 3 checkpoints · 4 label · 5 approval + project
  inspected: string[];
  product: Product;
  checks: Partial<Record<CheckpointId, CheckResult>>;
  label: LabelInfo;
  reflection: string;
  setStage: (n: number) => void;
  inspect: (id: string) => void;
  setProduct: (p: Partial<Product>) => void;
  setCheck: (id: CheckpointId, r: CheckResult) => void;
  setLabel: (l: Partial<LabelInfo>) => void;
  setReflection: (r: string) => void;
  restart: () => void;
};

const fresh = () => ({
  seed: Math.floor(Math.random() * 1e9) + 1,
  stage: 0,
  inspected: [] as string[],
  product: { category: null, parts: [], flavour: null, consumer: null, name: "", concept: "" } as Product,
  checks: {} as S["checks"],
  label: { netQty: "", allergens: [], storage: "", bestBefore: "" } as LabelInfo,
  reflection: "",
});

export const useLab = create<S>()(
  persist(
    (set) => ({
      ...fresh(),
      setStage: (stage) => set({ stage }),
      inspect: (id) => set((s) => (s.inspected.includes(id) ? s : { inspected: [...s.inspected, id] })),
      setProduct: (p) => set((s) => ({ product: { ...s.product, ...p } })),
      setCheck: (id, r) => set((s) => ({ checks: { ...s.checks, [id]: r } })),
      setLabel: (l) => set((s) => ({ label: { ...s.label, ...l } })),
      setReflection: (reflection) => set({ reflection }),
      restart: () => set(fresh()),
    }),
    { name: "eb-exp-1", version: 1 },
  ),
);
