"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { ArrowUp } from "lucide-react";

/**
 * Back-to-top button, bottom-left corner, matching the other floating chapter controls.
 * It appears once the reader has scrolled past 45% of the page and is hidden on the experiential activities,
 * whose panels scroll on their own.
 */
export function BackToTop() {
  const path = usePathname() ?? "";
  const hidden = path === "/" || path.startsWith("/experiential-activity");
  const [show, setShow] = useState(false);
  const reduce = useReducedMotion();

  useEffect(() => {
    if (hidden) return;
    const on = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setShow(max > 0 && window.scrollY / max > 0.45);
    };
    on();
    window.addEventListener("scroll", on, { passive: true });
    window.addEventListener("resize", on);
    return () => {
      window.removeEventListener("scroll", on);
      window.removeEventListener("resize", on);
    };
  }, [hidden, path]);

  if (hidden) return null;
  return (
    <AnimatePresence>
      {show && (
        <motion.button
          key="top"
          initial={{ opacity: 0, scale: 0.6, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.6, y: 12 }}
          transition={{ type: "spring", stiffness: 320, damping: 22 }}
          onClick={() => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" })}
          aria-label="Back to top"
          title="Back to top"
          className="fixed z-50 grid size-12 place-items-center rounded-full border border-cocoa bg-cream text-cocoa shadow-[2px_2px_0_0_#2f1c1a] transition-[box-shadow,background-color,color] hover:bg-orange hover:text-white hover:shadow-[3px_3px_0_0_#2f1c1a]"
          style={{ bottom: "max(16px, env(safe-area-inset-bottom))", left: "max(16px, env(safe-area-inset-left))" }}
        >
          <ArrowUp className="size-5" strokeWidth={2.5} />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
