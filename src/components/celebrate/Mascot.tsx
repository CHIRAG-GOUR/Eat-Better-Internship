"use client";

import { motion, useReducedMotion } from "motion/react";

/**
 * "Laddoo", the Eat Better × SkilliZee buddy: a round, golden laddoo with nut speckles, big eyes, rosy cheeks, little
 * arms and legs and an orange headband. Hand-drawn SVG, so it stays crisp at any size.
 *
 * Moods: party (arms up, star eyes, party hat), happy, cheeky (wink + tongue, for a friendly roast), cheer (thumbs up,
 * encouraging), talk (mouth moves, for audio chapters), wow (big eyes, "O" mouth), think (hand on chin, eyes up),
 * point (arm out towards the text while talking) and wave (hello). `walking` swings the legs and bobs the body;
 * `flip` makes Laddoo face the other way.
 */
export type MascotMood = "party" | "happy" | "cheeky" | "cheer" | "talk" | "wow" | "think" | "point" | "wave";

export function Mascot({ mood = "happy", walking = false, size = 120, className = "", flip = false }: { mood?: MascotMood; walking?: boolean; size?: number; className?: string; flip?: boolean }) {
  const reduced = useReducedMotion();
  const still = !!reduced;
  const bob = walking ? { y: [0, -4, 0] } : mood === "party" ? { y: [0, -10, 0], rotate: [0, -4, 4, 0] } : mood === "wow" ? { y: [0, -8, 0] } : mood === "think" ? { rotate: [0, -3, 0] } : { y: [0, -3, 0] };
  const bobT = { duration: walking ? 0.45 : mood === "party" ? 0.7 : 2.4, repeat: Infinity, ease: "easeInOut" as const };
  const armsUp = mood === "party";
  const thumbs = mood === "cheer";
  return (
    <motion.svg viewBox="0 0 140 160" width={size} height={(size * 160) / 140} className={className} style={flip ? { transform: "scaleX(-1)" } : undefined} role="img" aria-label="Laddoo, the Eat Better buddy" animate={still ? undefined : bob} transition={bobT}>
      <defs>
        <radialGradient id="mb-body" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor="#E9B16A" />
          <stop offset="55%" stopColor="#C9853E" />
          <stop offset="100%" stopColor="#9A5E28" />
        </radialGradient>
        <radialGradient id="mb-cheek" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FF7A7A" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#FF7A7A" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* shadow */}
      <ellipse cx="70" cy="152" rx="34" ry="5" fill="#2F1C1A" opacity="0.15" />
      {/* legs */}
      <motion.g animate={walking && !still ? { rotate: [12, -12, 12] } : { rotate: 0 }} transition={{ duration: 0.45, repeat: Infinity }} style={{ originX: "58px", originY: "128px" }}>
        <path d="M58 126 L54 146" stroke="#5A3418" strokeWidth="7" strokeLinecap="round" />
        <ellipse cx="52" cy="148" rx="8" ry="4.5" fill="#FF5C00" />
      </motion.g>
      <motion.g animate={walking && !still ? { rotate: [-12, 12, -12] } : { rotate: 0 }} transition={{ duration: 0.45, repeat: Infinity }} style={{ originX: "82px", originY: "128px" }}>
        <path d="M82 126 L86 146" stroke="#5A3418" strokeWidth="7" strokeLinecap="round" />
        <ellipse cx="88" cy="148" rx="8" ry="4.5" fill="#FF5C00" />
      </motion.g>
      {/* arms */}
      <motion.g animate={armsUp && !still ? { rotate: [-8, 8, -8] } : { rotate: 0 }} transition={{ duration: 0.5, repeat: Infinity }} style={{ originX: "30px", originY: "88px" }}>
        <path d={armsUp ? "M32 86 Q18 64 14 46" : mood === "wow" ? "M30 86 Q14 78 6 70" : "M30 90 Q14 98 12 112"} stroke="#5A3418" strokeWidth="7" fill="none" strokeLinecap="round" />
        <circle cx={armsUp ? 14 : mood === "wow" ? 6 : 12} cy={armsUp ? 44 : mood === "wow" ? 68 : 114} r="6.5" fill="#E9B16A" stroke="#5A3418" strokeWidth="2" />
      </motion.g>
      <motion.g
        animate={!still && (armsUp || mood === "talk" || mood === "wave" || mood === "point") ? { rotate: mood === "talk" ? [0, -10, 0] : mood === "wave" ? [0, -18, 6, -18, 0] : mood === "point" ? [0, -4, 0] : [8, -8, 8] } : { rotate: 0 }}
        transition={{ duration: mood === "talk" ? 1.2 : mood === "wave" ? 1 : mood === "point" ? 1.4 : 0.5, repeat: Infinity }}
        style={{ originX: "110px", originY: "88px" }}
      >
        <path
          d={armsUp ? "M108 86 Q122 64 126 46" : thumbs ? "M110 88 Q124 80 126 66" : mood === "wave" ? "M110 86 Q124 70 124 50" : mood === "point" ? "M110 88 Q126 84 136 78" : mood === "think" ? "M108 94 Q104 114 88 114" : mood === "wow" ? "M110 86 Q126 78 134 70" : "M110 90 Q126 98 128 112"}
          stroke="#5A3418"
          strokeWidth="7"
          fill="none"
          strokeLinecap="round"
        />
        {thumbs ? (
          <g>
            <rect x="119" y="54" width="14" height="13" rx="4" fill="#E9B16A" stroke="#5A3418" strokeWidth="2" />
            <rect x="122" y="44" width="6" height="13" rx="3" fill="#E9B16A" stroke="#5A3418" strokeWidth="2" />
          </g>
        ) : (
          <circle
            cx={armsUp ? 126 : mood === "wave" ? 124 : mood === "point" ? 137 : mood === "think" ? 84 : mood === "wow" ? 134 : 128}
            cy={armsUp ? 44 : mood === "wave" ? 48 : mood === "point" ? 77 : mood === "think" ? 113 : mood === "wow" ? 68 : 114}
            r="6.5"
            fill="#E9B16A"
            stroke="#5A3418"
            strokeWidth="2"
          />
        )}
      </motion.g>
      {/* body: the laddoo */}
      <circle cx="70" cy="86" r="46" fill="url(#mb-body)" stroke="#5A3418" strokeWidth="2.5" />
      {/* nut and seed speckles */}
      {[
        [44, 62, 3.2, "#F6DCA8"],
        [96, 70, 2.6, "#F6DCA8"],
        [52, 112, 2.8, "#7A4A20"],
        [90, 108, 3, "#F6DCA8"],
        [74, 54, 2.2, "#7A4A20"],
        [40, 92, 2.4, "#7A4A20"],
        [104, 92, 2.2, "#7A4A20"],
        [70, 122, 2.4, "#F6DCA8"],
      ].map(([x, y, r, c], i) => (
        <ellipse key={i} cx={x as number} cy={y as number} rx={r as number} ry={(r as number) * 0.7} fill={c as string} opacity="0.9" />
      ))}
      {/* headband */}
      <path d="M27 72 Q70 52 113 72" stroke="#FF5C00" strokeWidth="9" fill="none" strokeLinecap="round" />
      <circle cx="112" cy="70" r="5" fill="#FED300" stroke="#5A3418" strokeWidth="1.5" />
      {/* party hat */}
      {mood === "party" && (
        <g>
          <path d="M52 46 L70 6 L88 46 Z" fill="#FED300" stroke="#5A3418" strokeWidth="2" />
          <path d="M58 33 L82 33 M62 22 L78 22" stroke="#FF5C00" strokeWidth="4" />
          <circle cx="70" cy="6" r="5" fill="#FF5C00" />
        </g>
      )}
      {/* eyes */}
      {mood === "party" ? (
        <g fill="#FED300" stroke="#5A3418" strokeWidth="1.5">
          <path d="M54 80 l3 6 6 1 -4.5 4 1 6 -5.5 -3 -5.5 3 1 -6 -4.5 -4 6 -1 Z" />
          <path d="M86 80 l3 6 6 1 -4.5 4 1 6 -5.5 -3 -5.5 3 1 -6 -4.5 -4 6 -1 Z" />
        </g>
      ) : mood === "wow" ? (
        <g>
          {[56, 86].map((x) => (
            <g key={x}>
              <ellipse cx={x} cy="86" rx="9" ry="10.5" fill="#fff" stroke="#5A3418" strokeWidth="2" />
              <circle cx={x} cy="86" r="3.4" fill="#2F1C1A" />
            </g>
          ))}
        </g>
      ) : mood === "think" ? (
        <g>
          {[56, 86].map((x) => (
            <g key={x}>
              <ellipse cx={x} cy="88" rx="7" ry="8.5" fill="#fff" stroke="#5A3418" strokeWidth="2" />
              <circle cx={x + 2.5} cy="84" r="4" fill="#2F1C1A" />
            </g>
          ))}
          {/* thought dots */}
          <circle cx="104" cy="44" r="3" fill="#fff" stroke="#5A3418" strokeWidth="1.5" />
          <circle cx="114" cy="34" r="4.5" fill="#fff" stroke="#5A3418" strokeWidth="1.5" />
          <circle cx="127" cy="22" r="6.5" fill="#fff" stroke="#5A3418" strokeWidth="1.5" />
        </g>
      ) : mood === "cheeky" ? (
        <g>
          <ellipse cx="56" cy="88" rx="7" ry="8.5" fill="#fff" stroke="#5A3418" strokeWidth="2" />
          <circle cx="58" cy="89" r="4" fill="#2F1C1A" />
          <circle cx="59.5" cy="87" r="1.4" fill="#fff" />
          <path d="M78 89 Q86 83 94 89" stroke="#2F1C1A" strokeWidth="3" fill="none" strokeLinecap="round" />
        </g>
      ) : (
        <g>
          {[56, 86].map((x) => (
            <g key={x}>
              <ellipse cx={x} cy="88" rx="7" ry="8.5" fill="#fff" stroke="#5A3418" strokeWidth="2" />
              <motion.g animate={still ? undefined : { scaleY: [1, 1, 0.1, 1] }} transition={{ duration: 3.6, repeat: Infinity, times: [0, 0.9, 0.95, 1] }} style={{ originX: `${x}px`, originY: "89px" }}>
                <circle cx={x + 1.5} cy="89" r="4.2" fill="#2F1C1A" />
                <circle cx={x + 3} cy="87" r="1.5" fill="#fff" />
              </motion.g>
            </g>
          ))}
        </g>
      )}
      {/* cheeks */}
      <circle cx="46" cy="102" r="7" fill="url(#mb-cheek)" />
      <circle cx="94" cy="102" r="7" fill="url(#mb-cheek)" />
      {/* mouth */}
      {mood === "wow" ? (
        <ellipse cx="70" cy="108" rx="6" ry="7.5" fill="#7A1E12" stroke="#2F1C1A" strokeWidth="2" />
      ) : mood === "think" ? (
        <path d="M60 106 Q65 103 70 106 Q75 109 80 106" stroke="#2F1C1A" strokeWidth="3" fill="none" strokeLinecap="round" />
      ) : mood === "talk" || mood === "point" || mood === "wave" ? (
        <motion.ellipse cx="70" cy="106" rx="7" fill="#7A1E12" stroke="#2F1C1A" strokeWidth="2" animate={still ? { ry: 4 } : { ry: [2, 6, 3, 7, 2] }} transition={{ duration: 0.9, repeat: Infinity }} />
      ) : mood === "cheeky" ? (
        <g>
          <path d="M58 102 Q70 112 82 102" stroke="#2F1C1A" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M70 108 Q74 118 80 110" fill="#FF7A8A" stroke="#2F1C1A" strokeWidth="1.8" />
        </g>
      ) : mood === "party" ? (
        <path d="M56 100 Q70 122 84 100 Z" fill="#7A1E12" stroke="#2F1C1A" strokeWidth="2.5" strokeLinejoin="round" />
      ) : (
        <path d="M58 102 Q70 114 82 102" stroke="#2F1C1A" strokeWidth="3" fill="none" strokeLinecap="round" />
      )}
    </motion.svg>
  );
}
