import type { Metadata } from "next";
import Experience from "./Experience";

export const metadata: Metadata = {
  title: "Experiential Activity 2 · Eat Better Brand Studio · Eat Better Co Internship",
  description: "Module 2 experiential activity: study the Eat Better brand, design a pack and an honest Instagram creative, test and launch a simulated Meta Ads campaign, and download your campaign kit.",
};

export default function Page() {
  return <Experience />;
}
