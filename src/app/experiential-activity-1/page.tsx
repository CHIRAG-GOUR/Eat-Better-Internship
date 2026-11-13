import type { Metadata } from "next";
import Experience from "./Experience";

export const metadata: Metadata = {
  title: "Experiential Activity 1 · Eat Better Product Innovation Lab · Eat Better Co Internship",
  description: "Module 1 experiential activity: build a better-for-you snack, run the six quality checkpoints, design a compliant label and download your project report.",
};

export default function Page() {
  return <Experience />;
}
