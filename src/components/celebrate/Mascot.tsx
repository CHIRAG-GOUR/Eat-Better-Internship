"use client";

import { useEffect, useState } from "react";
import { motion, useReducedMotion, useTransform, type MotionValue } from "motion/react";

/**
 * "Laddoo", the Eat Better × SkilliZee buddy: a round, golden laddoo with nut speckles, big eyes, rosy cheeks, little
 * arms and legs and an orange headband. Hand-drawn SVG, so it stays crisp at any size.
 *
 * Moods: party (arms up, star eyes, party hat), happy, cheeky (wink + tongue, for a friendly roast), cheer (thumbs up,
 * encouraging), talk (gestures while speaking), wow (big eyes, raised brows), think (hand on chin, eyes up), point (arm
 * out towards the text) and wave (hello). Arms glide from one pose to the next instead of snapping.
 *
 * `walking` plays a walk cycle (legs alternate, arms swing, body bobs); `flip` faces the other way; `mouth` (0 = closed,
 * 1 = wide open) drives lip-sync while Laddoo speaks; `look` (-1 left … 1 right) moves the eyes. Blinks are natural:
 * at random moments, now and then a double blink.
 */
export type MascotMood = "party" | "happy" | "cheeky" | "cheer" | "talk" | "wow" | "think" | "point" | "wave";

const INK = "#5A3418";
const SKIN = "#E9B16A";
const STRIDE = 0.56; // seconds per walk cycle

// arm poses: every path has the same shape (M x y Q x y x y), so they morph smoothly into each other
const LEFT = {
  down: { d: "M30 90 Q14 98 12 112", h: [12, 114] },
  up: { d: "M32 86 Q18 64 14 46", h: [14, 44] },
  wow: { d: "M30 86 Q14 78 6 70", h: [6, 68] },
};
const RIGHT = {
  down: { d: "M110 90 Q126 98 128 112", h: [128, 114] },
  up: { d: "M108 86 Q122 64 126 46", h: [126, 44] },
  thumbs: { d: "M110 88 Q124 80 126 66", h: [126, 62] },
  wave: { d: "M110 86 Q124 70 124 50", h: [124, 48] },
  point: { d: "M110 88 Q126 84 136 78", h: [137, 77] },
  think: { d: "M108 94 Q104 114 88 114", h: [84, 113] },
  wow: { d: "M110 86 Q126 78 134 70", h: [134, 68] },
  talk: { d: "M110 90 Q128 92 132 100", h: [133, 102] },
};

function useBlink(still: boolean) {
  const [shut, setShut] = useState(false);
  useEffect(() => {
    if (still) return;
    let t: ReturnType<typeof setTimeout>;
    const blink = (then: () => void) => {
      setShut(true);
      t = setTimeout(() => {
        setShut(false);
        then();
      }, 110);
    };
    const next = () => {
      t = setTimeout(() => blink(() => (Math.random() < 0.22 ? (t = setTimeout(() => blink(next), 150)) : next())), 1800 + Math.random() * 3600);
    };
    next();
    return () => clearTimeout(t);
  }, [still]);
  return shut;
}

function SpeakingMouth({ m, smile }: { m: MotionValue<number>; smile: boolean }) {
  const ry = useTransform(m, [0, 1], [1, 8.5]);
  const rx = useTransform(m, [0, 1], [5.5, 8]);
  const open = useTransform(m, [0, 0.05, 0.14], [0, 0.7, 1]);
  const line = useTransform(m, [0, 0.12], [1, 0]);
  const tongue = useTransform(m, [0.35, 0.7], [0, 1]);
  return (
    <g>
      <motion.path d={smile ? "M60 104 Q70 112 80 104" : "M61 106 Q70 109 79 106"} stroke="#2F1C1A" strokeWidth="3" fill="none" strokeLinecap="round" style={{ opacity: line }} />
      <motion.ellipse cx="70" cy="106" rx={rx} ry={ry} fill="#7A1E12" stroke="#2F1C1A" strokeWidth="2" style={{ opacity: open }} />
      <motion.ellipse cx="70" cy="110" rx="4" ry="2.2" fill="#FF7A8A" style={{ opacity: tongue }} />
    </g>
  );
}

export function Mascot({
  mood = "happy",
  walking = false,
  size = 120,
  className = "",
  flip = false,
  mouth,
  look = 0,
}: {
  mood?: MascotMood;
  walking?: boolean;
  size?: number;
  className?: string;
  flip?: boolean;
  mouth?: MotionValue<number>;
  look?: number;
}) {
  const reduced = useReducedMotion();
  const still = !!reduced;
  const shut = useBlink(still);
  const walk = walking && !still;

  // poses (while walking the arms hang down and swing; a wave or party stays on top)
  const armsUp = mood === "party";
  const lp = armsUp ? LEFT.up : mood === "wow" && !walk ? LEFT.wow : LEFT.down;
  const rp = armsUp
    ? RIGHT.up
    : mood === "wave"
      ? RIGHT.wave
      : walk
        ? RIGHT.down
        : mood === "cheer"
          ? RIGHT.thumbs
          : mood === "point"
            ? RIGHT.point
            : mood === "think"
              ? RIGHT.think
              : mood === "wow"
                ? RIGHT.wow
                : mood === "talk"
                  ? RIGHT.talk
                  : RIGHT.down;
  const morph = { duration: 0.38, ease: "easeInOut" as const };

  const body = still
    ? undefined
    : walk
      ? { y: [0, -4, 0], rotate: [-2.5, 2.5, -2.5] }
      : mood === "party"
        ? { y: [0, -10, 0], rotate: [0, -4, 4, 0] }
        : mood === "wow"
          ? { y: [0, -5, 0] }
          : mouth
            ? { y: [0, -2, 0, -1.5, 0], rotate: [0, -2.5, 0, 2.5, 0] } // a gentle nod and sway while talking
            : { y: [0, -2, 0], scaleY: [1, 1.012, 1] };
  const bodyT = walk
    ? { y: { duration: STRIDE / 2, repeat: Infinity, ease: "easeInOut" as const }, rotate: { duration: STRIDE, repeat: Infinity, ease: "easeInOut" as const } }
    : { duration: mood === "party" ? 0.7 : mood === "wow" ? 1.4 : mouth ? 2.6 : 2.8, repeat: Infinity, ease: "easeInOut" as const };

  const legT = { duration: STRIDE, repeat: Infinity, ease: "easeInOut" as const };
  const settle = { type: "spring" as const, stiffness: 200, damping: 18 };

  // right arm motion on top of its pose
  const rArm = still
    ? { rotate: 0 }
    : walk && !armsUp && mood !== "wave"
      ? { rotate: [14, -14, 14] }
      : mood === "wave"
        ? { rotate: [0, -16, 6, -16, 0] }
        : armsUp
          ? { rotate: [8, -8, 8] }
          : mood === "talk"
            ? { rotate: [0, -7, 2, -5, 0] }
            : mood === "point"
              ? { rotate: [0, -4, 0] }
              : { rotate: 0 };
  const rArmT = walk && !armsUp && mood !== "wave" ? legT : { duration: mood === "wave" ? 1.1 : armsUp ? 0.5 : mood === "talk" ? 2.2 : 1.6, repeat: rArm.rotate === 0 ? 0 : Infinity, ease: "easeInOut" as const };
  const lArm = still ? { rotate: 0 } : walk && !armsUp ? { rotate: [-14, 14, -14] } : armsUp ? { rotate: [-8, 8, -8] } : { rotate: 0 };
  const lArmT = walk && !armsUp ? legT : armsUp ? { duration: 0.5, repeat: Infinity } : settle;

  // eyes: where they look and how wide they open
  const lx = Math.max(-1, Math.min(1, look)) * 2.4 + (mood === "think" ? 2 : 0);
  const ly = mood === "think" ? -4 : 0;
  const eyeRy = mood === "wow" ? 10.5 : 8.5;
  const brow = mood === "wow" ? -4 : mood === "cheer" || mood === "party" ? -2 : mood === "think" ? -1 : 0;

  const speaking = !!mouth && mood !== "party" && mood !== "cheeky";

  return (
    <motion.svg
      viewBox="0 0 140 160"
      width={size}
      height={(size * 160) / 140}
      className={className}
      style={{ transform: flip ? "scaleX(-1)" : undefined, overflow: "visible" }}
      role="img"
      aria-label="Laddoo, the Eat Better buddy"
    >
      <defs>
        <radialGradient id="mb-body" cx="40%" cy="35%" r="70%">
          <stop offset="0%" stopColor={SKIN} />
          <stop offset="55%" stopColor="#C9853E" />
          <stop offset="100%" stopColor="#9A5E28" />
        </radialGradient>
        <radialGradient id="mb-cheek" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#FF7A7A" stopOpacity="0.75" />
          <stop offset="100%" stopColor="#FF7A7A" stopOpacity="0" />
        </radialGradient>
      </defs>
      {/* shadow: squashes a little at the top of each step */}
      <motion.ellipse cx="70" cy="152" rx="34" ry="5" fill="#2F1C1A" opacity="0.15" animate={walk ? { rx: [34, 30, 34] } : { rx: 34 }} transition={walk ? { duration: STRIDE / 2, repeat: Infinity } : settle} />
      {/* legs: they swing from the hips in turn */}
      <motion.g animate={walk ? { rotate: [18, -18, 18] } : { rotate: 0 }} transition={walk ? legT : settle} style={{ originX: "58px", originY: "124px" }}>
        <path d="M58 126 L54 146" stroke={INK} strokeWidth="7" strokeLinecap="round" />
        <ellipse cx="52" cy="148" rx="8" ry="4.5" fill="#FF5C00" />
      </motion.g>
      <motion.g animate={walk ? { rotate: [-18, 18, -18] } : { rotate: 0 }} transition={walk ? legT : settle} style={{ originX: "82px", originY: "124px" }}>
        <path d="M82 126 L86 146" stroke={INK} strokeWidth="7" strokeLinecap="round" />
        <ellipse cx="88" cy="148" rx="8" ry="4.5" fill="#FF5C00" />
      </motion.g>

      {/* everything above the legs bobs together */}
      <motion.g animate={body} transition={bodyT} style={{ originX: "70px", originY: "130px" }}>
        {/* arms */}
        <motion.g animate={lArm} transition={lArmT} style={{ originX: "30px", originY: "88px" }}>
          <motion.path initial={false} animate={{ d: lp.d }} transition={morph} stroke={INK} strokeWidth="7" fill="none" strokeLinecap="round" />
          <motion.circle initial={false} animate={{ cx: lp.h[0], cy: lp.h[1] }} transition={morph} r="6.5" fill={SKIN} stroke={INK} strokeWidth="2" />
        </motion.g>
        <motion.g animate={rArm} transition={rArmT} style={{ originX: "110px", originY: "88px" }}>
          <motion.path initial={false} animate={{ d: rp.d }} transition={morph} stroke={INK} strokeWidth="7" fill="none" strokeLinecap="round" />
          <motion.circle initial={false} animate={{ cx: rp.h[0], cy: rp.h[1] }} transition={morph} r="6.5" fill={SKIN} stroke={INK} strokeWidth="2" />
          <motion.rect x="122.5" y="46" width="6" height="13" rx="3" fill={SKIN} stroke={INK} strokeWidth="2" initial={false} animate={{ opacity: rp === RIGHT.thumbs ? 1 : 0, scaleY: rp === RIGHT.thumbs ? 1 : 0.2 }} transition={morph} style={{ originY: "59px" }} />
        </motion.g>

        {/* body: the laddoo */}
        <circle cx="70" cy="86" r="46" fill="url(#mb-body)" stroke={INK} strokeWidth="2.5" />
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
        <circle cx="112" cy="70" r="5" fill="#FED300" stroke={INK} strokeWidth="1.5" />
        {/* party hat */}
        {mood === "party" && (
          <g>
            <path d="M52 46 L70 6 L88 46 Z" fill="#FED300" stroke={INK} strokeWidth="2" />
            <path d="M58 33 L82 33 M62 22 L78 22" stroke="#FF5C00" strokeWidth="4" />
            <circle cx="70" cy="6" r="5" fill="#FF5C00" />
          </g>
        )}

        {/* eyebrows */}
        {mood !== "party" && (
          <motion.g initial={false} animate={{ y: brow }} transition={settle}>
            <path d="M50 76.5 Q56 73.5 62 76" stroke="#2F1C1A" strokeWidth="2.4" fill="none" strokeLinecap="round" />
            <motion.path initial={false} animate={{ d: mood === "think" ? "M80 74 Q86 71 92 74.5" : "M80 76 Q86 73.5 92 76.5" }} transition={morph} stroke="#2F1C1A" strokeWidth="2.4" fill="none" strokeLinecap="round" />
          </motion.g>
        )}

        {/* eyes */}
        {mood === "party" ? (
          <g fill="#FED300" stroke={INK} strokeWidth="1.5">
            <path d="M54 80 l3 6 6 1 -4.5 4 1 6 -5.5 -3 -5.5 3 1 -6 -4.5 -4 6 -1 Z" />
            <path d="M86 80 l3 6 6 1 -4.5 4 1 6 -5.5 -3 -5.5 3 1 -6 -4.5 -4 6 -1 Z" />
          </g>
        ) : mood === "cheeky" ? (
          <g>
            <ellipse cx="56" cy="88" rx="7" ry="8.5" fill="#fff" stroke={INK} strokeWidth="2" />
            <circle cx="58" cy="89" r="4" fill="#2F1C1A" />
            <circle cx="59.5" cy="87" r="1.4" fill="#fff" />
            <path d="M78 89 Q86 83 94 89" stroke="#2F1C1A" strokeWidth="3" fill="none" strokeLinecap="round" />
          </g>
        ) : (
          <g>
            {[56, 86].map((x) => (
              <motion.g key={x} initial={false} animate={{ scaleY: shut ? 0.08 : 1 }} transition={{ duration: 0.07 }} style={{ originX: `${x}px`, originY: "88px" }}>
                <motion.ellipse cx={x} cy="88" rx="7" initial={false} animate={{ ry: eyeRy }} transition={settle} fill="#fff" stroke={INK} strokeWidth="2" />
                <motion.g initial={false} animate={{ x: lx, y: ly }} transition={{ type: "spring", stiffness: 160, damping: 16 }}>
                  <circle cx={x + 0.5} cy="89" r={mood === "wow" ? 3.6 : 4.2} fill="#2F1C1A" />
                  <circle cx={x + 2} cy="87" r="1.5" fill="#fff" />
                </motion.g>
              </motion.g>
            ))}
            {mood === "think" && (
              <g>
                <circle cx="104" cy="44" r="3" fill="#fff" stroke={INK} strokeWidth="1.5" />
                <circle cx="114" cy="34" r="4.5" fill="#fff" stroke={INK} strokeWidth="1.5" />
                <circle cx="127" cy="22" r="6.5" fill="#fff" stroke={INK} strokeWidth="1.5" />
              </g>
            )}
          </g>
        )}
        {/* cheeks */}
        <circle cx="46" cy="102" r="7" fill="url(#mb-cheek)" />
        <circle cx="94" cy="102" r="7" fill="url(#mb-cheek)" />
        {/* mouth */}
        {speaking ? (
          <SpeakingMouth m={mouth!} smile={mood !== "think"} />
        ) : mood === "wow" ? (
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
      </motion.g>
    </motion.svg>
  );
}
