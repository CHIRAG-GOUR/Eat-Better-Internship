import type { Metadata } from "next";
import WorldPreview from "./WorldPreview";

export const metadata: Metadata = {
  title: "Module 4 world preview · Eat Better Co Internship",
  description: "Preview the Module 4 3D world, Bazaar to Boardroom, for each chapter.",
  robots: { index: false },
};

export default function Page() {
  return <WorldPreview />;
}
