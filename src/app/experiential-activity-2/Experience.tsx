"use client";

import dynamic from "next/dynamic";

const Activity2 = dynamic(() => import("@/features/experiential/activity-2/Activity2"), { ssr: false, loading: () => <div className="grid min-h-screen place-items-center bg-[#EFE6DC] text-cocoa-2">Opening the brand studio…</div> });

export default function Experience() {
  return <Activity2 />;
}
