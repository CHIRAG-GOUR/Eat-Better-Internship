import type { Metadata } from "next";
import Chapter from "@/features/chapter-5-2/Chapter";

export const metadata: Metadata = {
  title: "5.2 Capstone Task B: E-Commerce Storefront Development · Eat Better Co Internship",
  description:
    "Module 5, Chapter 5.2 — Design and develop a complete, visually appealing e-commerce webpage for your proposed Eat Better product or category expansion, with original packaging, product listings, detail sections, and cart workflow.",
};

export default function Chapter52Page() {
  return <Chapter />;
}
