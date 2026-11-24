"use client";

import SCRIPTS from "@/features/audio-chapters/scripts.json";
import type { MascotMood } from "@/components/celebrate/Mascot";

/**
 * Builds Laddoo's guided reading tour from the chapter page itself: for each section, the headings, paragraphs and
 * list items in reading order (games, buttons, forms and 3D scenes are skipped), followed by Laddoo's own explanation
 * of that section (from scripts.json). Every word of a "read" step keeps a pointer to its text on the page, so it can be
 * highlighted in place while it is spoken.
 */

export type TourWord = { w: string; node?: Text; start?: number; end?: number };
export type TourStep = { key: string; kind: "read" | "explain"; el: HTMLElement; text: string; words: TourWord[]; mood: MascotMood; section: string };
type Script = { title: string; segments: { section: string; text: string }[] };

const CANDIDATES = "h2, h3, h4, p, li, blockquote";
const SKIP = "[data-tour-skip], [role=img], [role=dialog], [role=tooltip], button, label, form, textarea, input, select, nav, figcaption, .sr-only, [aria-hidden=true]";
const CONNECT = ["Here's the idea:", "In simple words:", "Think of it like this:", "So what does that mean?", "Let me explain:"];
const MAX_LINES = 14;

/** skipped areas (games, controls, dialogs…); glossary terms inside a sentence are buttons but are read like words */
function skipped(el: Element | null): boolean {
  let c = el?.closest(SKIP) ?? null;
  while (c && c.matches("button.cursor-help")) c = c.parentElement?.closest(SKIP) ?? null;
  return !!c;
}

/** words written directly inside an element (not in its child elements) */
const ownWords = (el: Element) => [...el.childNodes].reduce((n, c) => n + (c.nodeType === 3 ? (c.textContent?.match(/\S+/g)?.length ?? 0) : 0), 0);

const visible = (el: Element) => {
  const r = el.getBoundingClientRect();
  return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== "hidden";
};

/** the words of an element, each pointing at its place in a text node */
function wordsIn(el: HTMLElement): TourWord[] {
  const out: TourWord[] = [];
  const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, {
    acceptNode: (n) => (n.parentElement && !skipped(n.parentElement) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT),
  });
  for (let n = walker.nextNode() as Text | null; n; n = walker.nextNode() as Text | null) {
    for (const m of n.data.matchAll(/\S+/g)) out.push({ w: m[0], node: n, start: m.index ?? 0, end: (m.index ?? 0) + m[0].length });
  }
  return out;
}

const plainWords = (t: string): TourWord[] => [...t.matchAll(/\S+/g)].map((m) => ({ w: m[0] }));

function moodFor(el: HTMLElement, text: string): MascotMood {
  if (/\?\s*$/.test(text)) return "think";
  if (/[₹%]|\d|crore|lakh/i.test(text)) return "wow";
  if (/^H[23]$/.test(el.tagName)) return "point";
  return "talk";
}

export function buildTour(chapter: string, card: HTMLElement | null): TourStep[] {
  const script = (SCRIPTS as Record<string, Script>)[chapter];
  if (!script) return [];
  const steps: TourStep[] = [];
  const anchor = card ?? document.body;
  const hello = `Hi, I'm Laddoo! Let's go through Chapter ${chapter}, ${script.title}, together. I'll read each part with you, and then explain it.`;
  steps.push({ key: "intro", kind: "explain", el: anchor, text: hello, words: plainWords(hello), mood: "wave", section: "intro" });

  const sections = [...document.querySelectorAll<HTMLElement>("main section[id]")].filter((s) => s.id !== "wrap-up" && visible(s));
  let k = 0;
  for (const sec of sections) {
    // activity sections: read the heading and intro only, then explain what the activity is for
    const activity = !!sec.querySelector("[data-tour-skip], [role=img], canvas, textarea");
    // headings, paragraphs and list items, plus any block that holds a sentence of its own (text not wrapped in <p>)
    const tagged = [...sec.querySelectorAll<HTMLElement>(CANDIDATES)];
    const prose = [...sec.querySelectorAll<HTMLElement>("div, span")].filter((el) => ownWords(el) >= 6);
    const all = [...new Set([...tagged, ...prose])]
      .filter((el) => !skipped(el) && visible(el))
      .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));
    const outer = all.filter((el) => !all.some((o) => o !== el && o.contains(el)));
    const lines = outer
      .map((el) => ({ el, words: wordsIn(el) }))
      .filter((x) => x.words.length >= 2)
      .slice(0, activity ? 2 : MAX_LINES);
    lines.forEach((x, i) => {
      const text = x.words.map((w) => w.w).join(" ");
      steps.push({ key: `${sec.id}#${i}`, kind: "read", el: x.el, text, words: x.words, mood: moodFor(x.el, text), section: sec.id });
    });
    const exp = script.segments.filter((s) => s.section === sec.id).map((s) => s.text).join(" ");
    if (exp) {
      const text = `${CONNECT[k++ % CONNECT.length]} ${exp}`;
      const target = lines[0]?.el ?? sec;
      steps.push({ key: `${sec.id}#explain`, kind: "explain", el: target, text, words: plainWords(text), mood: k % 3 === 0 ? "cheer" : k % 3 === 1 ? "point" : "happy", section: sec.id });
    }
  }
  const last = steps[steps.length - 1]?.el ?? anchor;
  const bye = "And that's the whole chapter! You listened all the way through. Great job!";
  steps.push({ key: "outro", kind: "explain", el: last, text: bye, words: plainWords(bye), mood: "party", section: "outro" });
  return steps;
}
