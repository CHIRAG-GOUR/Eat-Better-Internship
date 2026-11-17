"use client";

import { Panel } from "@/components/chapter/Panel";
import { VIDEO } from "../content";
import { SectionIntro } from "@/components/chapter/SectionIntro";
import { VideoBlock } from "@/components/chapter/VideoBlock";

export function StoryVideo() {
  return (
    <section id="story" className="relative scroll-mt-6 px-3 py-6 sm:px-6 sm:py-10">
      <Panel tone="dark" reveal="up" width="max-w-6xl">
        <SectionIntro index="▸" kicker="Watch · In the company's own words" title="How Eat Better Co started" tone="dark">
          As you watch, notice two things: <strong className="text-cream">where the brand began</strong>, and{" "}
          <strong className="text-cream">what it says it stands for</strong>. You&apos;ll use both later in this chapter.
        </SectionIntro>

        <div className="mt-8">
          <VideoBlock
            kind="file"
            av1="/chapter-1-1/video/story-av1.mp4"
            h264="/chapter-1-1/video/story-h264.mp4"
            poster="/brand/video-poster.jpg"
            title={VIDEO.title}
            caption={`${VIDEO.title} — ${VIDEO.channel}`}
            badge="Origin Story"
          />
        </div>
      </Panel>
    </section>
  );
}
