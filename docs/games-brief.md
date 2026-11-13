# Games brief — rebuilding the Module 1 & 2 activities as games (2026-11-13)

The user: "I want it all gamified and not number filling." Every Module 1 and 2 activity is rebuilt as a real GAME the student plays — no forms, no typing numbers into boxes, no tap-the-right-option quizzes, no "select this or that", no Learn→Apply→Check labs.

Project: `E:\1. Skillizee\Eat Better\eat-better-internship` (Next.js 16, React 19, TS, Tailwind v4, three 0.187 + R3F 9 + drei 10, motion, zustand). Git Bash, absolute paths. Dev server already at http://localhost:3300 — never start another, never `next build`, never commit/push/deploy.

## What a game is here
- The student ACTS in a playable space: drives, catches, stacks, routes, builds, aims, races a timer, serves characters, defends a stall, packs a box, steers a delivery… Prefer 3D on `@/components/play/Stage3D` (lazy R3F canvas) with 3D people from `@/components/world2/Human` (never `sim/Person.tsx`); a rich 2D canvas/motion game is acceptable only where 3D adds nothing.
- Game feel: clear goal, levels/rounds, lives or timer, score + stars (`starsFor`), combo/streak, instant physical feedback (snap, bounce, glow, shake, characters reacting with mood), a short win/lose screen, Restart. No emojis (use lucide icons or `@/components/icons/EbIcons`; never lucide `Sparkles`).
- LEARNING stays the point: every mechanic encodes the chapter's real content; a wrong move shows WHY in one line using the chapter's evidence (feedback strip); randomise rounds/order/positions each restart so the game can't be memorised; decoys so random play loses. Fictional characters/numbers labelled "practice". Facts come only from the chapter's `content.ts` / existing activity data — don't invent Eat Better facts.
- Numbers may appear in the WORLD (price tags, weights, scores) and be USED by actions (e.g. drag the pack to the cheaper-per-gram shelf, fill the truck to the line), but the student never types a number.
- Wrap in `@/components/play/GameFrame` (kicker, title, mission, steps = levels, stars, feedback, note={{ real, practice, tip }}). Phones: tap-to-pick → tap-to-place works everywhere; drags must not block page scroll (Stage3D sets touch-action pan-y); keep 3D light (low poly, shared materials, ≤2 lights, no post-processing).

## Rules for replacing an activity
- Keep the chapter's section, its position, its activity id and how it reports completion (the chapter's completion store / `onDone` summary / wrap-up list) so wrap-ups and progress keep working. Replace the old component in place; delete old code only once the new one works.
- Keep everything that isn't an activity unchanged (text, media, 3D background). Keep "Think & Discuss" / reflection writing prompts as they are (writing is fine; it's number-filling and option-picking that go).
- Keep liked games unless told: 1.3 Stall Day, 2.2 Notification Rush, and the 3D simulations (1.4 Expedition, 1.5 Innovation Studio, 1.6 facility, 2.1 Identity Lab) — only fix bugs there.

## QA before reporting
`npx tsc --noEmit -p .` (ignore `.next/dev/types/validator.ts`) and `npx eslint` on your folders clean; puppeteer-core + system Chrome (`C:/Program Files/Google/Chrome/Application/chrome.exe`, headless "new", args `--use-angle=swiftshader --enable-unsafe-swiftshader`) at 1440×900 and 390×844, scripts in `C:\Users\HP\AppData\Local\Temp\claude\94c1add54c10fbce\aaac2bd0-da82-4e12-94c0-f3696ac95628\scratchpad\qa\` (node_modules there; `sweep.mjs` = error sweep, `q41lib.mjs` + `g1.mjs` = 3D game playthrough helpers). Play each game to a WIN and to a LOSS, check the chapter's wrap-up registers it, no page errors, `scrollWidth - innerWidth === 0`, and look at your screenshots. Expose `data-testid` hooks if it helps automation.

Report: per activity — old vs new game, how the mechanic teaches the content, how it blocks shortcuts, QA results, anything left.
