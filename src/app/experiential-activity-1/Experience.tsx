"use client";

import dynamic from "next/dynamic";

const Activity1 = dynamic(() => import("@/features/experiential/activity-1/Activity1"), { ssr: false, loading: () => <div className="grid min-h-screen place-items-center bg-[#F3ECE3] text-cocoa-2">Opening the lab…</div> });

export default function Experience() {
  return <Activity1 />;
}
