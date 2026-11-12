"use client";

import dynamic from "next/dynamic";
import type { ComponentType } from "react";
import { create } from "zustand";

/** Chapter 3.4 activities registry: the Activities section renders every entry in order; the wrap-up lists them. */
export type Act34 = { id: string; label: string; Comp: ComponentType<{ onDone: (summary: string) => void }> };

const Loading = () => <div className="h-[520px] animate-pulse rounded-[24px] bg-[#F6E3CF]" />;
const InventorySync = dynamic(() => import("./InventorySync"), { ssr: false, loading: Loading });
const FestiveSpike = dynamic(() => import("./FestiveSpike"), { ssr: false, loading: Loading });
const LastMileDesk = dynamic(() => import("./LastMileDesk"), { ssr: false, loading: Loading });

export const ACTS_34: Act34[] = [
  { id: "sync", label: "Stock Sync Board", Comp: InventorySync },
  { id: "spike", label: "Diwali Surge Planner", Comp: FestiveSpike },
  { id: "lastmile", label: "Last-Mile Cost Desk", Comp: LastMileDesk },
];

export const useWork34 = create<{ work: Record<string, string>; save: (k: string, v: string) => void }>((set) => ({
  work: {},
  save: (k, v) => set((s) => ({ work: { ...s.work, [k]: v } })),
}));
