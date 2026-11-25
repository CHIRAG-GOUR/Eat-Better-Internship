import type { Metadata } from "next";
import { Opening } from "@/features/opening/Opening";

export const metadata: Metadata = {
  title: "Eat Better Co Internship · SkilliZee",
  description: "Step into the Eat Better Co warehouse, watch the internship film, then explore the five modules: Discover, Create, Operate, Strategize and Build.",
};

/** The internship's opening: the warehouse film, then the five-world overview (chapters stay direct links, e.g. /1.1). */
export default function Home() {
  return <Opening />;
}
