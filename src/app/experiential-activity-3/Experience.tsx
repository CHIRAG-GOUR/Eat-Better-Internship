"use client";

import dynamic from "next/dynamic";

const Activity3 = dynamic(() => import("@/features/experiential/activity-3/Activity3"), { ssr: false, loading: () => <div className="grid min-h-screen place-items-center bg-[#E9E6E1] text-cocoa-2">Opening the distribution centre…</div> });

export default function Experience() {
  return <Activity3 />;
}
