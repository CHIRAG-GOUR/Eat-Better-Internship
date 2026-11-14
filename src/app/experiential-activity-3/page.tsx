import type { Metadata } from "next";
import Experience from "./Experience";

export const metadata: Metadata = {
  title: "Experiential Activity 3 · Eat Better Distribution Command Centre · Eat Better Co Internship",
  description: "Module 3 experiential activity: run Eat Better's distribution centre — channels, receiving, allocation, disruptions and a final mission — and download your strategy report.",
};

export default function Page() {
  return <Experience />;
}
