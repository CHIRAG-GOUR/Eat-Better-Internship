"use client";

import dynamic from "next/dynamic";

const Activity4 = dynamic(() => import("@/features/experiential/activity-4/Activity4"), {
  ssr: false,
  loading: () => (
    <div className="grid min-h-screen place-items-center bg-[#EDE8E2] text-cocoa-2">
      Entering the executive strategy suite…
    </div>
  ),
});

export default function Experience() {
  return <Activity4 />;
}
