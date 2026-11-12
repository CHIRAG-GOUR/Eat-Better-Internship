"use client";

/**
 * TEMPORARY STUB — the Module 4 world agent replaces this with the real 3D world ("Bazaar to Boardroom").
 * Contract (keep it): default export, props { chapter: Chapter4; scenes?: (kit: MarketKit) => ReactNode; travel?: number },
 * plus exported types Chapter4 and MarketKit and a MarketDrive context for the preview page.
 */
import { createContext, type ReactNode } from "react";

export type Chapter4 = "4.1" | "4.2" | "4.3";
export type MarketKit = { compact: boolean; reduced: boolean; chapter: Chapter4 };
export const MarketDrive = createContext<React.RefObject<number> | null>(null);

export default function MarketWorld({ chapter }: { chapter: Chapter4; scenes?: (kit: MarketKit) => ReactNode; travel?: number }) {
  return <div aria-hidden className="absolute inset-0" style={{ background: chapter === "4.3" ? "linear-gradient(#1d2140,#3b2a52)" : "linear-gradient(#f6e3cf,#fff5ee)" }} />;
}
