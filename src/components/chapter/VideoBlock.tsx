"use client";

import { InstagramReelPlayer, ReelMeta } from "./InstagramReelPlayer";
import { EatBetterVideoPlayer } from "./EatBetterVideoPlayer";

export type VideoVariant = "default" | "reel" | "short";

type Props = {
  title: string;
  caption?: string;
  /** vertical (9:16) clips such as social posts or shorts */
  portrait?: boolean;
  /** fill the parent's width exactly (used inside MediaRow so heights line up) */
  fill?: boolean;
  /** Player variant: "reel" for Instagram phone card UI, "short" for Eat Better shorts, "default" for Eat Better widescreen */
  variant?: VideoVariant;
  /** Optional badge text shown in top corner */
  badge?: string;
  /** Additional metadata for Instagram Reel UI */
  reelMeta?: ReelMeta;
} & (
  | { kind: "file"; av1?: string; h264: string; poster?: string }
  | { kind: "youtube"; id: string; poster?: string }
);

/**
 * Universal video player component with custom Eat Better & Instagram Reel theming:
 * - variant "reel": Instagram Reel smartphone card UI with likes, comments, audio track & gestures.
 * - portrait / variant "short": Eat Better themed 9:16 vertical player for YouTube Shorts.
 * - widescreen (default): Eat Better themed custom video player with brand controls, scrubber & speed.
 */
export function VideoBlock(props: Props) {
  const isReel = props.variant === "reel";
  const isShort = props.variant === "short" || (props.portrait && !isReel);

  if (props.kind === "file") {
    if (isReel) {
      return (
        <InstagramReelPlayer
          h264={props.h264}
          av1={props.av1}
          poster={props.poster}
          title={props.title}
          caption={props.caption}
          fill={props.fill}
          reelMeta={props.reelMeta}
        />
      );
    }

    return (
      <EatBetterVideoPlayer
        h264={props.h264}
        av1={props.av1}
        poster={props.poster}
        title={props.title}
        caption={props.caption}
        portrait={isShort}
        fill={props.fill}
        badge={props.badge}
      />
    );
  }

  // Fallback for any legacy YouTube embeds, wrapped cleanly with Eat Better frame
  return (
    <EatBetterVideoPlayer
      h264=""
      poster={props.poster ?? `https://i.ytimg.com/vi/${props.id}/hqdefault.jpg`}
      title={props.title}
      caption={props.caption}
      portrait={props.portrait}
      fill={props.fill}
      badge={props.badge ?? "YouTube"}
    />
  );
}
