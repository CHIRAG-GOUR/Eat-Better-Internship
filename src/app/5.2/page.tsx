import type { Metadata } from "next";
import Chapter from "@/features/chapter-5-2/Chapter";

export const metadata: Metadata = {
  title: "5.2 Capstone Task B: Video Pitch / Review · Eat Better Co Internship",
  description:
    "Module 5, Chapter 5.2 — Create a short video pitch or product review (60–90 seconds) that positively presents what the intern learned about Eat Better, with an interactive teleprompter studio and production masterclass.",
};

export default function Chapter52Page() {
  return <Chapter />;
}
