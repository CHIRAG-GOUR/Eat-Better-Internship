import type { Metadata } from "next";
import Chapter from "@/features/chapter-4-1/Chapter";

export const metadata: Metadata = {
  title: "4.1 Pricing & Financial Performance · Eat Better Co Internship",
  description: "Module 4, Chapter 4.1 — price per gram, gross margin, AOV and Eat Better's reported growth.",
};

export default function Chapter41Page() {
  return <Chapter />;
}
