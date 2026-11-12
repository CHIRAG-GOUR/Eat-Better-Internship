"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { create } from "zustand";

/** Chapter 4.1 activities registry: the Activities section and the wrap-up render every entry in order. */
export type Act41 = { id: string; label: string; Comp: ComponentType<{ onDone: (summary: string) => void }> };

const Loading = () => <div className="h-[560px] animate-pulse rounded-[24px] bg-[#F6E3CF]" />;
const PriceTagDetective = dynamic(() => import("./PriceTagDetective"), { ssr: false, loading: Loading });
const MarginMachine = dynamic(() => import("./MarginMachine"), { ssr: false, loading: Loading });
const BasketBuilder = dynamic(() => import("./BasketBuilder"), { ssr: false, loading: Loading });

export const ACTS_41: Act41[] = [
  { id: "price", label: "Price Tag Detective", Comp: PriceTagDetective },
  { id: "margin", label: "Margin Machine", Comp: MarginMachine },
  { id: "basket", label: "Basket Builder / AOV Rush", Comp: BasketBuilder },
];

export const useWork41 = create<{ work: Record<string, string>; save: (k: string, v: string) => void }>((set) => ({
  work: {},
  save: (k, v) => set((s) => ({ work: { ...s.work, [k]: v } })),
}));
