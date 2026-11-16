import type { Metadata } from "next";
import Experience from "./Experience";

export const metadata: Metadata = {
  title: "Experiential Activity 4 · Build the Eat Better Business · Eat Better Co Internship",
  description:
    "Module 4 experiential activity: pricing, unit economics, financial scale, competitive positioning, budget allocation, and investor pitch simulation — download your strategy report and financial model.",
};

export default function Page() {
  return <Experience />;
}
