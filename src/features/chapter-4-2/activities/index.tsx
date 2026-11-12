"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { create } from "zustand";

/** Chapter 4.2 activities registry: the Activities section renders every entry in order; the wrap-up lists them. */
export type Act42 = { id: string; label: string; Comp: ComponentType<{ onDone: (summary: string) => void }> };

const Loading = () => <div className="h-[560px] animate-pulse rounded-[24px] bg-[#F6E3CF]" />;
const ShelfShowdown = dynamic(() => import("./ShelfShowdown"), { ssr: false, loading: Loading });
const CapabilityTowers = dynamic(() => import("./CapabilityTowers"), { ssr: false, loading: Loading });
const PriceLadder = dynamic(() => import("./PriceLadder"), { ssr: false, loading: Loading });

export const ACTS_42: Act42[] = [
  { id: "shelf", label: "Shelf Showdown", Comp: ShelfShowdown },
  { id: "towers", label: "Capability Towers", Comp: CapabilityTowers },
  { id: "ladder", label: "Price Ladder", Comp: PriceLadder },
];

export const useWork42 = create<{ work: Record<string, string>; save: (k: string, v: string) => void }>((set) => ({
  work: {},
  save: (k, v) => set((s) => ({ work: { ...s.work, [k]: v } })),
}));
