import type { Metadata } from "next";
import Chapter from "@/features/chapter-4-2/Chapter";

export const metadata: Metadata = {
  title: "4.2 Competitive Landscape · Eat Better Co Internship",
  description: "Module 4, Chapter 4.2 — Eat Better beside traditional brands, health-snack brands and local sweet shops: price per gram, a competitive K-Matrix and a six-brand comparison.",
};

export default function Chapter42Page() {
  return <Chapter />;
}
