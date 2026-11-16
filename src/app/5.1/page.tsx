import type { Metadata } from "next";
import Chapter from "@/features/chapter-5-1/Chapter";

export const metadata: Metadata = {
  title: "5.1 Capstone Task A: Project Creation · Eat Better Co Internship",
  description:
    "Module 5, Chapter 5.1 — Develop a 360-degree go-to-market strategy for a new Eat Better product or category expansion, covering product specification, pricing, distribution, marketing, and unit economics.",
};

export default function Chapter51Page() {
  return <Chapter />;
}
