"use client";

import dynamic from "next/dynamic";
import { create } from "zustand";

const Loading = () => <div className="h-[520px] animate-pulse rounded-[24px] bg-[#F6E3CF]" />;
export const OrderDesk = dynamic(() => import("./OrderDesk"), { ssr: false, loading: Loading });
export const GrowthDesk = dynamic(() => import("./GrowthDesk"), { ssr: false, loading: Loading });
export const LeverLab = dynamic(() => import("./LeverLab"), { ssr: false, loading: Loading });

export const ACTS_33 = [
  { id: "order", label: "Order Desk" },
  { id: "growth", label: "Growth Desk" },
  { id: "levers", label: "Profit Lever Lab" },
];

/** What the student produced in each activity (shown and copyable in the wrap-up). */
export const useWork33 = create<{ work: Record<string, string>; save: (k: string, v: string) => void }>((set) => ({
  work: {},
  save: (k, v) => set((s) => ({ work: { ...s.work, [k]: v } })),
}));
