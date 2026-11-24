"use client";

import { useEffect, useMemo } from "react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { Star, X } from "lucide-react";
import { Fireworks } from "./Fireworks";
import { Mascot, type MascotMood } from "./Mascot";
import { useCelebrate } from "./store";

/**
 * The single celebration pop-up for the whole site (mounted once in the root layout). Big wins get fireworks,
 * confetti and real praise; middle scores get a cheer and a nudge; low scores get a gentle, funny roast that always
 * ends in encouragement. Reduced-motion users get the message and mascot without the particles.
 */
const PERFECT = [
  "Chef's kiss! That was top-shelf thinking.",
  "Perfect score! The whole Eat Better team is cheering for you.",
  "Crunchy, clever and correct, just like our namkeen!",
  "You'd make a brilliant Eat Better manager. Seriously!",
  "Flawless! Even the laddoos are doing a happy dance.",
];
const GREAT = [
  "Great job! You really know your stuff.",
  "Brilliant work! That's how a business star does it.",
  "So close to perfect. Your brain is on fire (in a good way)!",
  "Super effort! The snack shelf is proud of you.",
];
const GOOD = [
  "Nice effort! You're getting the hang of this.",
  "Good going! A little more practice and you'll be unstoppable.",
  "Solid work! Every expert started exactly here.",
];
const ROAST = [
  "Oops! Even a soggy papad has more crunch than that score. But hey, every champion starts somewhere. Ready for round two?",
  "Hmm, your score went on a snack break! Let's call it back and try once more. You've got this.",
  "My laddoo rolled off the table laughing... then it whispered: \"they'll ace it next time.\" Prove it right!",
  "That was a warm-up round, right? Real chefs taste, fix and try again. Your turn!",
  "That score is like an empty tiffin. Let's fill it up on the next go!",
];
const DONE = ["Activity complete! Nicely done.", "Done and dusted! Great work.", "Another one finished. You're on a roll!"];

const pick = (a: string[], seed: number) => a[seed % a.length];

export function CelebrationHost() {
  const cur = useCelebrate((s) => s.current);
  const clear = useCelebrate((s) => s.clear);
  const reduced = useReducedMotion();

  const view = useMemo(() => {
    if (!cur) return null;
    const r = cur.score / cur.max;
    const seed = cur.key;
    const doneOnly = cur.max === 1 && !cur.lost;
    if (doneOnly) return { tier: "done", level: 2 as const, mood: "party" as MascotMood, head: "Woohoo!", text: pick(DONE, seed) };
    if (!cur.lost && r >= 0.999) return { tier: "perfect", level: 3 as const, mood: "party" as MascotMood, head: "PERFECT!", text: pick(PERFECT, seed) };
    if (!cur.lost && r >= 0.66) return { tier: "great", level: 2 as const, mood: "happy" as MascotMood, head: "Great job!", text: pick(GREAT, seed) };
    if (!cur.lost && r >= 0.34) return { tier: "good", level: 1 as const, mood: "cheer" as MascotMood, head: "Nice effort!", text: pick(GOOD, seed) };
    return { tier: "low", level: 0 as const, mood: "cheeky" as MascotMood, head: "Oh no, the snack spilled!", text: pick(ROAST, seed) };
  }, [cur]);

  // close on Escape; big wins close themselves after a while
  useEffect(() => {
    if (!cur) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && clear();
    window.addEventListener("keydown", onKey);
    const t = view && view.tier !== "low" ? setTimeout(clear, 9000) : null;
    return () => {
      window.removeEventListener("keydown", onKey);
      if (t) clearTimeout(t);
    };
  }, [cur, view, clear]);

  return (
    <AnimatePresence>
      {cur && view && (
        <motion.div key={cur.key} className="fixed inset-0 z-[125] grid place-items-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <div className="absolute inset-0 bg-cocoa/35 backdrop-blur-[2px]" onClick={clear} aria-hidden />
          {!reduced && view.level > 0 && <Fireworks level={view.level as 1 | 2 | 3} run={cur.key} />}
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-label={view.head}
            initial={{ scale: 0.6, y: 40, opacity: 0 }}
            animate={{ scale: 1, y: 0, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 260, damping: 18 }}
            className={`relative z-[131] w-full max-w-sm rounded-[28px] border-2 border-cocoa p-5 text-center shadow-[6px_6px_0_0_#2f1c1a] ${view.tier === "low" ? "bg-peach" : "bg-cream"}`}
          >
            <button onClick={clear} aria-label="Close" className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-white text-cocoa hover:bg-peach">
              <X className="size-4" />
            </button>
            <div className="-mt-16 flex justify-center">
              <Mascot mood={view.mood} size={130} />
            </div>
            <div className={`mt-1 font-display text-[1.7rem] font-semibold leading-tight ${view.tier === "low" ? "text-cocoa" : "text-orange"}`}>{view.head}</div>
            {cur.title && <div className="mt-0.5 text-[0.85rem] font-bold uppercase tracking-[0.1em] text-cocoa-2">{cur.title}</div>}
            {cur.max > 1 && (
              <div className="mt-2 flex items-center justify-center gap-1" aria-label={`${cur.score} of ${cur.max}`}>
                {cur.max <= 5 ? (
                  Array.from({ length: cur.max }, (_, i) => (
                    <motion.span key={i} initial={{ scale: 0, rotate: -40 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: 0.25 + i * 0.15, type: "spring", stiffness: 300 }}>
                      <Star className={`size-8 ${i < cur.score ? "fill-haldi text-[#C9A400]" : "text-cocoa/20"}`} />
                    </motion.span>
                  ))
                ) : (
                  <span className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[1.1rem] font-bold text-cocoa">
                    <Star className="size-5 fill-haldi text-[#C9A400]" /> {cur.score} of {cur.max}
                  </span>
                )}
              </div>
            )}
            <p className="mt-3 text-[1.02rem] font-semibold leading-snug text-cocoa">{view.text}</p>
            <button onClick={clear} className="eb-btn eb-btn-primary mt-4 w-full justify-center !normal-case">
              {view.tier === "low" ? "Challenge accepted!" : view.tier === "good" ? "Keep going" : "Yay, thank you!"}
            </button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
