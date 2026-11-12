"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { create } from "zustand";

/** Chapter 4.3 activities registry (page renders every entry in order; wrap-up lists them). */
export type Act43 = { id: string; label: string; Comp: ComponentType<{ onDone: (summary: string) => void }> };

const Loading = () => <div className="h-[520px] animate-pulse rounded-[24px] bg-[#F6E3CF]" />;
const ExpansionCommand = dynamic(() => import("./ExpansionCommand"), { ssr: false, loading: Loading });
const CapacityHeadroom = dynamic(() => import("./CapacityHeadroom"), { ssr: false, loading: Loading });
const GiftingPlanner = dynamic(() => import("./GiftingPlanner"), { ssr: false, loading: Loading });

export const ACTS_43: Act43[] = [
  { id: "expansion", label: "Expansion Command", Comp: ExpansionCommand },
  { id: "capacity", label: "Capacity Headroom", Comp: CapacityHeadroom },
  { id: "gifting", label: "Year-Round Gifting Planner", Comp: GiftingPlanner },
];

export const useWork43 = create<{ work: Record<string, string>; save: (k: string, v: string) => void }>((set) => ({
  work: {},
  save: (k, v) => set((s) => ({ work: { ...s.work, [k]: v } })),
}));
