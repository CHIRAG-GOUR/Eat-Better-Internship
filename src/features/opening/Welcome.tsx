"use client";

import { useEffect, useRef } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Award, BookOpen, CheckCircle2, Compass, FlaskConical, MousePointerClick, ScrollText, Trophy, X } from "lucide-react";
import { MODULES } from "./modules";

/**
 * The welcome note that opens over the five worlds the first time the student arrives: what the internship is, what
 * is inside, what they must complete to earn the Certificate of Completion, and how to use the overview.
 */

const CHAPTERS = MODULES.reduce((n, m) => n + m.chapters.filter((c) => !c.id.startsWith("5.")).length, 0);
const CAPSTONES = MODULES[4].chapters.length;
const EXPERIENTIAL = MODULES.filter((m) => m.activity).length;

const MUST = [
  { icon: BookOpen, text: `Complete all ${CHAPTERS} chapters` },
  { icon: MousePointerClick, text: "Complete every activity inside the chapters" },
  { icon: ScrollText, text: "Submit all assignments" },
  { icon: FlaskConical, text: `Complete all ${EXPERIENTIAL} experiential activities` },
  { icon: Trophy, text: `Complete both final capstone projects (Task A and Task B)` },
];

export function Welcome({ open, onClose }: { open: boolean; onClose: () => void }) {
  const start = useRef<HTMLButtonElement>(null);

  // keyboard: Escape closes; focus the main button when it opens; the page behind does not scroll
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    const key = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", key);
    const id = setTimeout(() => start.current?.focus(), 350);
    return () => {
      html.style.overflow = prev;
      window.removeEventListener("keydown", key);
      clearTimeout(id);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div key="welcome" className="fixed inset-0 z-[70] flex items-center justify-center bg-cocoa/35 p-3 backdrop-blur-[2px] sm:p-6" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose}>
          <motion.div
            role="dialog"
            aria-modal="true"
            aria-labelledby="welcome-title"
            initial={{ opacity: 0, y: 30, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 240, damping: 24 }}
            onClick={(e) => e.stopPropagation()}
            className="relative max-h-[calc(100svh-24px)] w-full max-w-[40rem] overflow-y-auto rounded-[26px] border-2 border-cocoa bg-cream shadow-[5px_5px_0_0_#2f1c1a]"
          >
            <button onClick={onClose} aria-label="Close" className="absolute right-3 top-3 grid size-9 place-items-center rounded-full bg-white text-cocoa hover:bg-peach">
              <X className="size-4" />
            </button>

            {/* welcome */}
            <div className="border-b-2 border-dashed border-cocoa/15 px-5 pb-4 pt-6 sm:px-7">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/brand/eat-better-logo.svg" alt="Eat Better Co" className="h-9 w-auto" />
              <h2 id="welcome-title" className="mt-3 font-display text-[1.6rem] font-semibold leading-tight text-cocoa sm:text-[1.9rem]">
                Welcome to the Eat Better Co Internship
              </h2>
              <p className="mt-2 text-[0.98rem] leading-relaxed text-cocoa-2">
                Eat Better Co is a real healthy-snacking brand from Jaipur. Over five modules you will learn how it works, from its story and snacks to its brand,
                its operations and its plans to grow, and then build projects of your own, the way a member of its team would.
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {[`${MODULES.length} modules`, `${CHAPTERS} chapters`, `${EXPERIENTIAL} experiential activities`, `${CAPSTONES} capstone projects`].map((t) => (
                  <span key={t} className="rounded-full border border-cocoa/20 bg-white px-3 py-1 text-[0.8rem] font-bold text-cocoa">
                    {t}
                  </span>
                ))}
              </div>
            </div>

            {/* the five modules */}
            <div className="px-5 py-4 sm:px-7">
              <div className="text-[0.72rem] font-extrabold uppercase tracking-[0.14em] text-orange">Your journey</div>
              <ol className="mt-2 grid gap-1.5 sm:grid-cols-2">
                {MODULES.map((m) => (
                  <li key={m.n} className="flex items-center gap-2.5">
                    <span className="grid size-7 shrink-0 place-items-center rounded-full font-display text-[0.8rem] font-bold text-white" style={{ background: m.color }}>
                      {m.n}
                    </span>
                    <span className="min-w-0 text-[0.88rem] leading-tight">
                      <span className="font-extrabold text-cocoa">{m.word}</span> <span className="text-cocoa-2">· {m.title}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>

            {/* the certificate: everything is required */}
            <div className="mx-5 rounded-2xl border-2 border-orange bg-[#FFF1E6] px-4 py-4 sm:mx-7 sm:px-5">
              <div className="flex items-center gap-2 text-[0.75rem] font-extrabold uppercase tracking-[0.12em] text-orange">
                <Award className="size-5" /> Certificate of Completion
              </div>
              <p className="mt-1 text-[0.95rem] font-bold leading-snug text-cocoa">To earn your certificate, you must:</p>
              <ul className="mt-2 grid gap-1.5">
                {MUST.map(({ icon: Icon, text }) => (
                  <li key={text} className="flex items-start gap-2.5 text-[0.93rem] leading-snug text-cocoa">
                    <Icon className="mt-0.5 size-[18px] shrink-0 text-orange" />
                    <span>{text}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-3 flex items-start gap-2 rounded-xl bg-white/70 px-3 py-2 text-[0.88rem] font-bold leading-snug text-[#B23A12]">
                <CheckCircle2 className="mt-0.5 size-4 shrink-0" />
                All of these are required. The certificate is given only when every chapter, activity, assignment, experiential activity and both capstone projects are complete.
              </p>
            </div>

            {/* how to use the overview */}
            <div className="px-5 py-4 sm:px-7">
              <div className="flex items-center gap-2 text-[0.72rem] font-extrabold uppercase tracking-[0.14em] text-orange">
                <Compass className="size-4" /> How to use this page
              </div>
              <ul className="mt-2 grid gap-1.5 text-[0.9rem] leading-snug text-cocoa-2">
                <li>• Scroll (or swipe) to walk the path from one world to the next.</li>
                <li>• Tap a world, or the 01–05 buttons, to jump straight to a module.</li>
                <li>• Tap a chapter or activity to see what it covers.</li>
                <li>• Open each chapter from its link in your SkilliZee course, and work through the modules in order.</li>
              </ul>
            </div>

            <div className="sticky bottom-0 border-t border-cocoa/10 bg-cream/95 px-5 py-3 backdrop-blur sm:px-7">
              <button ref={start} onClick={onClose} className="w-full rounded-full border-2 border-cocoa bg-orange px-6 py-3 font-display text-[1.1rem] font-semibold text-white shadow-[3px_3px_0_0_#2f1c1a] transition-colors hover:bg-[#e04f00]">
                Start exploring
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
