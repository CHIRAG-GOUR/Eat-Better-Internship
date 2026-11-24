"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowLeft, ArrowRight, Check, Coins, Landmark, Lightbulb, Maximize, Minimize, Minus, Plus, Radar, RotateCcw, Rocket, Scale, ShoppingBag, Star, Trophy, UserRound, X } from "lucide-react";
import {
  BAG_GOAL,
  BAG_MAX,
  COIN_LAKH,
  COINS,
  DELIVERY,
  DEPTS,
  FACILITY_CAP,
  FREE_SHIP,
  GROWTH_GOAL,
  K_PLAYERS,
  LEVELS,
  ORDERS_NOW,
  PILLARS,
  PLAYER_COLORS,
  RANK_TRUTH,
  SKUS,
  bagOutcome,
  budgetOutcome,
  growthCap,
  investorQuestions,
  moneyStars,
  plNext,
  ppg,
  rankHits,
  supportedOrders,
  truthOf,
  type DeptId,
} from "./data";
import { useBiz } from "./store";
import { buildBusinessReport, downloadFinancialCsv, feedbackOf } from "./report";
import type { HQFocus } from "./Business3D";
import { ProjectReadyPopup, useStudent } from "../shared/ProjectReadyPopup";
import { detectWebGL } from "@/lib/useClient";
import { celebrate } from "@/components/celebrate/store";

const HQ3D = dynamic(() => import("./Business3D"), { ssr: false, loading: () => <div className="grid h-full place-items-center text-cocoa-2">Opening the head office…</div> });

const STAGES = ["Welcome", "Price detective", "Money machine", "Rival radar", "Budget coins", "Grow & pitch", "My report"];
const words = (t: string) => t.trim().split(/\s+/).filter(Boolean).length;
const rs = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;

const btn = "inline-flex items-center justify-center gap-2 rounded-2xl px-4 py-2.5 font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-40";
const primary = `${btn} bg-orange text-white hover:bg-cocoa`;
const secondary = `${btn} border border-cocoa/20 bg-white text-cocoa hover:border-cocoa`;

/* ── small UI pieces ───────────────────────────────────────────── */

function Mentor({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="grid size-10 shrink-0 place-items-center rounded-full border-2 border-cocoa bg-orange text-white">
        <UserRound className="size-5" />
      </div>
      <div className="relative rounded-2xl rounded-tl-sm bg-peach/70 px-3.5 py-2.5 text-[0.98rem] leading-snug">
        <div className="text-[0.7rem] font-extrabold uppercase tracking-[0.12em] text-orange">Your mentor</div>
        {children}
      </div>
    </div>
  );
}
function Stars({ n, size = "size-6" }: { n: number; size?: string }) {
  return (
    <div className="flex gap-0.5" aria-label={`${n} of 3 stars`}>
      {[0, 1, 2].map((i) => (
        <motion.span key={i} initial={false} animate={{ scale: i < n ? [1, 1.35, 1] : 1 }} transition={{ duration: 0.35, delay: i * 0.08 }}>
          <Star className={`${size} ${i < n ? "fill-haldi text-[#C9A400]" : "text-cocoa/20"}`} />
        </motion.span>
      ))}
    </div>
  );
}
function Title({ icon: I, kicker, children }: { icon: typeof Scale; kicker: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="grid size-11 shrink-0 place-items-center rounded-2xl bg-orange/12 text-orange">
        <I className="size-6" />
      </div>
      <div>
        <div className="text-[0.74rem] font-extrabold uppercase tracking-[0.14em] text-orange">{kicker}</div>
        <h2 className="font-display text-[1.45rem] font-semibold leading-tight">{children}</h2>
      </div>
    </div>
  );
}
function Toast({ msg }: { msg: { tone: "good" | "bad"; text: string } | null }) {
  return (
    <AnimatePresence mode="wait">
      {msg && (
        <motion.div
          key={msg.text}
          initial={{ opacity: 0, y: 8, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1, x: msg.tone === "bad" ? [0, -8, 8, -5, 5, 0] : 0 }}
          exit={{ opacity: 0 }}
          role="status"
          className={`mt-3 flex items-start gap-2 rounded-2xl px-3.5 py-2.5 text-[0.95rem] font-semibold ${msg.tone === "good" ? "bg-success/12 text-success" : "bg-error/10 text-error"}`}
        >
          {msg.tone === "good" ? <Check className="mt-0.5 size-4 shrink-0" strokeWidth={3} /> : <X className="mt-0.5 size-4 shrink-0" strokeWidth={3} />}
          <span>{msg.text}</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
function Meter({ label, value, goal, max, fmt, good }: { label: string; value: number; goal: number; max: number; fmt: (v: number) => string; good: boolean }) {
  const w = Math.max(0, Math.min(100, (value / max) * 100));
  const g = Math.min(100, (goal / max) * 100);
  return (
    <div>
      <div className="flex justify-between text-[0.86rem] font-bold">
        <span>{label}</span>
        <span className={good ? "text-success" : "text-cocoa-2"}>{fmt(value)}</span>
      </div>
      <div className="relative mt-1 h-4 overflow-hidden rounded-full bg-cream">
        <motion.div className={`h-full rounded-full ${good ? "bg-success" : "bg-orange"}`} animate={{ width: `${w}%` }} transition={{ type: "spring", stiffness: 160, damping: 22 }} />
        <div className="absolute inset-y-0 w-0.5 bg-cocoa" style={{ left: `${g}%` }} title={`Goal ${fmt(goal)}`} />
      </div>
      <div className="mt-0.5 text-right text-[0.72rem] text-cocoa-2">goal {fmt(goal)}</div>
    </div>
  );
}
function BigSlider({ label, hint, value, min, max, step, onChange, show }: { label: string; hint: string; value: number; min: number; max: number; step: number; onChange: (v: number) => void; show: string }) {
  return (
    <label className="block rounded-2xl bg-cream p-3">
      <div className="flex items-baseline justify-between">
        <span className="font-display text-[1.05rem] font-semibold">{label}</span>
        <span className="font-display text-[1.2rem] font-semibold tabular-nums text-orange">{show}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(+e.target.value)} className="mt-1 h-3 w-full cursor-pointer accent-orange" aria-label={label} />
      <div className="text-[0.8rem] text-cocoa-2">{hint}</div>
    </label>
  );
}
function NextBar({ back, next, ok, label }: { back?: () => void; next: () => void; ok: boolean; label: string }) {
  return (
    <div className="mt-4 flex items-center justify-between gap-2">
      {back ? (
        <button onClick={back} className={secondary}>
          <ArrowLeft className="size-4" /> Back
        </button>
      ) : (
        <span />
      )}
      <button disabled={!ok} onClick={next} className={primary}>
        {label} <ArrowRight className="size-4" />
      </button>
    </div>
  );
}
const Practice = ({ children }: { children: React.ReactNode }) => <p className="mt-3 text-[0.76rem] text-cocoa-2">{children}</p>;

/* ── the game ──────────────────────────────────────────────────── */

export default function Activity4() {
  const s = useBiz();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- wait for the saved game to load from this device
    setHydrated(true);
  }, []);
  const [student, setStudent] = useStudent();
  const [msg, setMsg] = useState<{ tone: "good" | "bad"; text: string } | null>(null);
  const [player, setPlayer] = useState<string>(K_PLAYERS[0].id);
  const [presented, setPresented] = useState(false);
  const [full, setFull] = useState(false);
  const [webgl, setWebgl] = useState(true);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time capability check
    setWebgl(detectWebGL());
    const on = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);

  const stage = s.stage;
  const go = (n: number) => {
    s.set({ stage: n });
    setMsg(null);
  };

  /* mission 1 */
  const placeSku = (id: string) => {
    if (s.rankDone) return;
    const at = s.rank.indexOf(id);
    if (at >= 0) s.set({ rank: s.rank.filter((x) => x !== id) });
    else if (s.rank.length < 4) s.set({ rank: [...s.rank, id] });
    setMsg(null);
  };
  const checkRank = () => {
    const hits = rankHits(s.rank);
    if (hits === 4) {
      s.set({ rankDone: true });
      setMsg({ tone: "good", text: "Spot on! The Namkeen Combo gives the most snack for each rupee. The big 42-laddoo box costs the most per gram." });
    } else {
      s.set({ rankTries: s.rankTries + 1 });
      setMsg({ tone: "bad", text: `${hits} of 4 boxes are on the right step. Divide each price by its grams and try again.` });
    }
  };
  const rankStars = !s.rankDone ? 0 : s.rankTries === 0 ? 3 : s.rankTries === 1 ? 2 : 1;
  const bag = bagOutcome(s.bag);
  const addBag = (id: string, d: number) => s.set({ bag: { ...s.bag, [id]: Math.max(0, Math.min(BAG_MAX, (s.bag[id] ?? 0) + d)) } });
  const m1Ok = s.rankDone && bag.ok;

  /* mission 2 */
  const pl = plNext(s.levers);
  const cap = growthCap(s.levers.mk);
  const mStars = moneyStars(s.levers);

  /* mission 3 */
  const placeRival = (xi: number, zi: number) => {
    if (stage !== 3) return;
    const t = truthOf(player);
    const name = K_PLAYERS.find((p) => p.id === player)!.short;
    if (LEVELS[xi] !== t.x || LEVELS[zi] !== t.y) {
      s.set({ gridMistakes: s.gridMistakes + 1 });
      const hint = LEVELS[xi] !== t.x ? "price for everyone" : "natural sweetening";
      setMsg({ tone: "bad", text: `Not there. Check the yellow "${hint}" row for ${name} on the K-Matrix wall.` });
      return;
    }
    s.set({ grid: { ...s.grid, [player]: { x: t.x, y: t.y } } });
    setMsg({ tone: "good", text: `${name} is on the map!` });
    const nx = K_PLAYERS.find((p) => p.id !== player && !s.grid[p.id]?.x);
    if (nx) setPlayer(nx.id);
  };
  const gridDone = K_PLAYERS.every((p) => s.grid[p.id]?.x && s.grid[p.id]?.y);
  const edgeOk = words(s.edge) >= 8 && /(clean|palm|sugar|date|natural|familiar|taste|health|millet|roast|desi|indian)/i.test(s.edge);
  const rivalStars = !gridDone ? 0 : s.gridMistakes === 0 ? 3 : s.gridMistakes <= 2 ? 2 : 1;

  /* mission 4 */
  const bo = budgetOutcome(s.coins);
  const addCoin = (id: DeptId, d: number) => {
    if (d > 0 && bo.used >= COINS) return;
    s.set({ coins: { ...s.coins, [id]: Math.max(0, (s.coins[id] ?? 0) + d) } });
  };
  const budgetStars = !bo.ok ? 0 : bo.served >= 55 ? 3 : bo.served >= 45 ? 2 : 1;

  /* mission 5 */
  const supported = supportedOrders(bo.served);
  const targetOk = s.target > ORDERS_NOW && s.target <= FACILITY_CAP && s.target <= supported;
  const pitchOk = words(s.pitch) >= 12;
  const questions = useMemo(() => investorQuestions({ levers: s.levers, coins: s.coins, target: s.target, lead: s.lead }), [s.levers, s.coins, s.target, s.lead]);
  const answerOk = (i: number) => words(s.answers[i] ?? "") >= 10 && /\d/.test(s.answers[i] ?? "");
  const m5Ok = !!s.lead && targetOk && pitchOk && presented && questions.every((_, i) => answerOk(i));
  const growStars = !targetOk ? 0 : s.target >= 4 ? 3 : s.target >= 3 ? 2 : 1;
  const moods: ("nod" | "shake" | null)[] = [0, 1, 2].map((inv) => {
    if (stage !== 5 || !presented) return null;
    const qi = questions.findIndex((q) => q.who === `Investor ${"ABC"[inv]}`);
    if (qi < 0) return null;
    const a = s.answers[qi] ?? "";
    if (!a.trim()) return null;
    return answerOk(qi) ? "nod" : "shake";
  });

  const starsAll = [rankStars, mStars, rivalStars, budgetStars, growStars];
  const total = starsAll.reduce((a, x) => a + x, 0);

  // celebrate when the learner reaches the final screen (not when a finished attempt is reopened)
  const prevStage = useRef<number | null>(null);
  useEffect(() => {
    if (!hydrated) return;
    if (prevStage.current !== null && prevStage.current !== 6 && s.stage === 6) celebrate({ score: total, max: 15, title: "Run the Eat Better Business" });
    prevStage.current = s.stage;
  }, [hydrated, s.stage]); // eslint-disable-line react-hooks/exhaustive-deps -- only the move into the final stage matters
  const fb = stage === 6 ? feedbackOf(s) : null;

  const focus: HQFocus = (["overview", "pricing", "finance", "compete", "budget", presented ? "pitch" : "growth", "overview"] as HQFocus[])[stage] ?? "overview";
  const leadTitle = PILLARS.find((p) => p.id === s.lead)?.short ?? "";

  const toggleFull = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      /* not allowed here */
    }
  };

  if (!hydrated) return <div className="grid min-h-screen place-items-center bg-[#EFE6DA] text-cocoa-2">Opening the head office…</div>;
  const stem = (student.name.trim() || "student").replace(/\s+/g, "-");

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-[#EFE6DA] text-cocoa">
      <header className="sticky top-0 z-30 border-b border-cocoa/10 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center gap-2 px-3 py-2 sm:gap-3 sm:px-5">
          <Image src="/brand/eat-better-x-skillizee-600x400.png" alt="Eat Better Co × SkilliZee" width={90} height={60} className="h-8 w-auto sm:h-10" />
          <div className="min-w-0 flex-1">
            <div className="hidden text-[0.72rem] font-extrabold uppercase tracking-[0.14em] text-orange sm:block">Experiential Activity 4 · Module 4</div>
            <div className="truncate font-display text-[1.02rem] font-semibold leading-tight sm:text-[1.15rem]">Run the Eat Better Business</div>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[0.9rem] font-bold" aria-label={`${total} stars collected`}>
            <Star className="size-4 fill-haldi text-[#C9A400]" /> {total}/15
          </div>
          <button onClick={() => (s.restart(), setMsg(null), setPlayer(K_PLAYERS[0].id), setPresented(false))} aria-label="Restart" className={`${secondary} !rounded-xl !px-2.5 !py-1.5 text-[0.85rem] sm:!px-3`}>
            <RotateCcw className="size-4" /> <span className="hidden sm:inline">Restart</span>
          </button>
          <button onClick={toggleFull} aria-label={full ? "Exit fullscreen" : "Fullscreen"} className={`${secondary} !rounded-xl !px-2.5 !py-1.5`}>
            {full ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
          </button>
        </div>
        <ol className="no-scrollbar mx-auto flex max-w-[1600px] gap-1.5 overflow-x-auto px-3 pb-2 sm:px-5">
          {STAGES.map((t, i) => (
            <li key={t} className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[0.82rem] font-bold ${i === stage ? "bg-orange text-white" : i < stage ? "bg-success/15 text-success" : "bg-white text-cocoa-2/70"}`}>
              {i < stage ? <Check className="size-3.5" strokeWidth={3} /> : <span>{i}</span>}
              {t}
            </li>
          ))}
        </ol>
      </header>

      {/* phones and tablets: the 3D scene gets its own box above the panel, so the whole scene is in view (also inside an LMS iframe of any height); desktop keeps the full-screen scene behind the panel */}
      <div className="relative z-0 mx-3 mt-3 h-[clamp(280px,52svh,480px)] overflow-hidden rounded-[22px] border border-cocoa/15 shadow-[0_18px_40px_-28px_rgba(47,28,26,0.6)] sm:mx-4 lg:fixed lg:inset-0 lg:m-0 lg:h-auto lg:rounded-none lg:border-0 lg:shadow-none">
        {webgl ? (
          <HQ3D
            focus={focus}
            rank={s.rank}
            rankDone={s.rankDone}
            onSku={stage === 1 ? placeSku : undefined}
            bag={s.bag}
            levers={s.levers}
            moneyActive={stage >= 2}
            grid={s.grid}
            player={player}
            onCell={stage === 3 ? placeRival : undefined}
            coins={s.coins}
            onJar={stage === 4 ? (id) => addCoin(id, 1) : undefined}
            target={s.target}
            supported={supported}
            moods={moods}
            slide={{ lead: leadTitle, target: s.target, line: s.pitch }}
          />
        ) : (
          <div className="grid h-full place-items-center p-6 text-center text-cocoa-2">3D isn&apos;t available on this device. Every mission still works in the panel.</div>
        )}
      </div>

      <div className={`pointer-events-none relative z-10 mx-auto grid w-full max-w-[1600px] flex-1 gap-3 p-3 sm:p-4 ${stage === 6 ? "lg:grid-cols-[minmax(0,0.75fr)_minmax(600px,1.25fr)]" : "lg:grid-cols-[minmax(0,1.25fr)_minmax(400px,0.85fr)]"}`}>
        <div className="hidden lg:block" aria-hidden />
        <section className="pointer-events-auto min-w-0 self-start rounded-[24px] border border-cocoa/15 bg-white/95 p-4 shadow-[0_24px_60px_-30px_rgba(47,28,26,0.55)] backdrop-blur sm:p-5 lg:max-h-[calc(100dvh-130px)] lg:overflow-y-auto">
          {/* ── 0 welcome ── */}
          {stage === 0 && (
            <div>
              <h1 className="font-display text-[clamp(1.6rem,3vw,2.1rem)] font-semibold leading-tight">You&apos;re the new manager!</h1>
              <div className="mt-3">
                <Mentor>Eat Better sells about 2 lakh orders a month. Help me run the business. Finish 5 missions and collect up to 15 stars.</Mentor>
              </div>
              <div className="mt-4 grid gap-2">
                {[
                  [Scale, "Price detective", "Which box gives the most snack for your money?"],
                  [Coins, "Money machine", "Make the business grow and stop losing money."],
                  [Radar, "Rival radar", "Find where each rival stands."],
                  [Landmark, "Budget coins", "Share 20 coins between 6 teams."],
                  [Rocket, "Grow & pitch", "Set a goal and win over the investors."],
                ].map(([I, h, t], i) => {
                  const Ic = I as typeof Scale;
                  return (
                    <div key={h as string} className="flex items-center gap-3 rounded-2xl bg-cream p-3">
                      <div className="grid size-9 shrink-0 place-items-center rounded-xl bg-white font-display font-semibold text-orange">{i + 1}</div>
                      <Ic className="size-5 shrink-0 text-orange" />
                      <div className="min-w-0">
                        <div className="font-display text-[1.02rem] font-semibold">{h as string}</div>
                        <p className="text-[0.86rem] leading-snug text-cocoa-2">{t as string}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <Practice>Prices, sales and orders are real figures from your Module 4 chapters. Costs, budgets and how the game reacts are practice numbers for learning, not Eat Better&apos;s real plans.</Practice>
              <button onClick={() => go(1)} className={`${primary} mt-4 w-full !py-3 text-[1.05rem]`}>
                Start mission 1 <ArrowRight className="size-5" />
              </button>
            </div>
          )}

          {/* ── 1 price detective ── */}
          {stage === 1 && (
            <div>
              <Title icon={Scale} kicker="Mission 1">
                Price detective
              </Title>
              {!s.rankDone ? (
                <>
                  <div className="mt-3">
                    <Mentor>
                      Put the boxes on the podium, <strong>cheapest per gram first</strong>. Tip: price ÷ grams.
                    </Mentor>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {SKUS.map((k) => {
                      const at = s.rank.indexOf(k.id);
                      return (
                        <button key={k.id} onClick={() => placeSku(k.id)} className={`relative overflow-hidden rounded-2xl border-2 text-left transition-colors ${at >= 0 ? "border-orange bg-orange/5" : "border-cocoa/10 bg-white hover:border-orange/60"}`}>
                          <div className="relative aspect-[4/3] bg-cream">
                            <Image src={k.img} alt={k.name} fill sizes="200px" className="object-cover" />
                            {at >= 0 && <span className="absolute left-1.5 top-1.5 grid size-8 place-items-center rounded-full border-2 border-white bg-orange font-display text-[1.05rem] font-semibold text-white shadow">{at + 1}</span>}
                          </div>
                          <div className="px-2.5 py-2">
                            <div className="text-[0.86rem] font-bold leading-tight">{k.short}</div>
                            <div className="font-display text-[1.1rem] font-semibold">
                              ₹{k.price} <span className="text-[0.86rem] font-normal text-cocoa-2">for {k.grams} g</span>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <button onClick={() => s.set({ rank: [] })} disabled={!s.rank.length} className={secondary}>
                      Clear
                    </button>
                    <button onClick={checkRank} disabled={s.rank.length < 4} className={`${primary} flex-1`}>
                      Check my order
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div className="mt-3 flex items-center justify-between rounded-2xl bg-success/10 p-3">
                    <div className="text-[0.92rem] font-bold text-success">Podium solved{s.rankTries ? ` in ${s.rankTries + 1} tries` : " first time"}!</div>
                    <Stars n={rankStars} size="size-5" />
                  </div>
                  <div className="mt-2 grid grid-cols-4 gap-1.5 text-center text-[0.78rem]">
                    {RANK_TRUTH.map((id, i) => {
                      const k = SKUS.find((x) => x.id === id)!;
                      return (
                        <div key={id} className="rounded-xl bg-cream p-1.5">
                          <div className="font-bold">
                            {i + 1}. {k.short}
                          </div>
                          <div className="text-orange">₹{ppg(k.price, k.grams).toFixed(2)}/g</div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="mt-4 flex items-center gap-2 font-display text-[1.15rem] font-semibold">
                    <ShoppingBag className="size-5 text-orange" /> Now pack a delivery bag
                  </div>
                  <div className="mt-2">
                    <Mentor>
                      Every order pays <strong>₹{DELIVERY} delivery</strong>. Pack a bag over ₹{FREE_SHIP} that keeps <strong>{BAG_GOAL * 100}% or more</strong> as profit.
                    </Mentor>
                  </div>
                  <div className="mt-3 grid gap-1.5">
                    {SKUS.map((k) => (
                      <div key={k.id} className="flex items-center gap-2 rounded-2xl bg-cream px-3 py-2">
                        <div className="min-w-0 flex-1">
                          <div className="text-[0.9rem] font-bold">{k.short}</div>
                          <div className="text-[0.8rem] text-cocoa-2">₹{k.price}</div>
                        </div>
                        <button aria-label={`Take out ${k.short}`} onClick={() => addBag(k.id, -1)} className="grid size-9 place-items-center rounded-xl bg-white">
                          <Minus className="size-4" />
                        </button>
                        <span className="w-6 text-center font-display text-[1.15rem] font-semibold tabular-nums">{s.bag[k.id] ?? 0}</span>
                        <button aria-label={`Add ${k.short}`} onClick={() => addBag(k.id, 1)} className="grid size-9 place-items-center rounded-xl bg-orange text-white">
                          <Plus className="size-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 grid gap-2">
                    <Meter label="Bag value" value={bag.value} goal={FREE_SHIP} max={Math.max(1500, bag.value)} fmt={rs} good={bag.value >= FREE_SHIP} />
                    <Meter label="Kept as profit" value={bag.pct * 100} goal={BAG_GOAL * 100} max={60} fmt={(v) => `${Math.round(v)}%`} good={bag.pct >= BAG_GOAL} />
                  </div>
                  {bag.boxes > 0 && !bag.ok && bag.value >= FREE_SHIP && (
                    <p className="mt-2 flex items-start gap-2 rounded-2xl bg-cream p-2.5 text-[0.86rem]">
                      <Lightbulb className="mt-0.5 size-4 shrink-0 text-orange" /> One delivery fee is shared by the whole bag. Which boxes earn the most?
                    </p>
                  )}
                  {bag.ok && <p className="mt-2 rounded-2xl bg-success/10 p-2.5 text-[0.9rem] font-bold text-success">Great bag! Bigger orders share one delivery fee, so more money is kept.</p>}
                </>
              )}
              <Toast msg={msg} />
              <Practice>Prices and weights are real. Box costs and the ₹{DELIVERY} delivery fee are practice numbers.</Practice>
              <NextBar back={() => go(0)} next={() => go(2)} ok={m1Ok} label="Mission 2" />
            </div>
          )}

          {/* ── 2 money machine ── */}
          {stage === 2 && (
            <div>
              <Title icon={Coins} kicker="Mission 2">
                Money machine
              </Title>
              <div className="mt-3">
                <Mentor>
                  Last year sales grew fast, but we still lost about ₹63 lakh. Grow sales by <strong>{GROWTH_GOAL}% or more</strong> and tip the scale to <strong>Money in</strong>.
                </Mentor>
              </div>
              <div className="mt-3 grid gap-2">
                <BigSlider label="Ads" hint={`Ads bring customers: they let you grow up to ${cap}%. But ads cost money.`} value={s.levers.mk} min={10} max={30} step={1} show={`${s.levers.mk}% of sales`} onChange={(v) => s.set({ levers: { ...s.levers, mk: v, growth: Math.min(s.levers.growth, growthCap(v)) } })} />
                <BigSlider label="Grow sales" hint="More orders next year." value={s.levers.growth} min={0} max={cap} step={5} show={`+${s.levers.growth}%`} onChange={(v) => s.set({ levers: { ...s.levers, growth: v } })} />
                <BigSlider label="Smarter buying" hint="Buy nuts and dates in bulk, sell more combo boxes." value={s.levers.gmGain} min={0} max={6} step={1} show={`+${s.levers.gmGain}`} onChange={(v) => s.set({ levers: { ...s.levers, gmGain: v } })} />
              </div>
              <div className={`mt-3 flex items-center justify-between rounded-2xl p-3 ${pl.net >= 0 ? "bg-success/10" : "bg-error/10"}`}>
                <div>
                  <div className="text-[0.74rem] font-extrabold uppercase tracking-[0.1em] text-cocoa-2">Next year</div>
                  <div className={`font-display text-[1.35rem] font-semibold ${pl.net >= 0 ? "text-success" : "text-error"}`}>
                    {pl.net >= 0 ? "Profit" : "Loss"} {pl.net >= 0 ? "+" : "−"}₹{Math.abs(pl.net).toFixed(2)} cr
                  </div>
                  <div className="text-[0.8rem] text-cocoa-2">Sales ₹{pl.rev.toFixed(1)} cr · growth {s.levers.growth}%</div>
                </div>
                <Stars n={mStars} />
              </div>
              {mStars === 0 && <p className="mt-2 text-[0.84rem] text-cocoa-2">{pl.net < 0 ? "Money out is still heavier. Try a lever you haven't moved yet." : `Profit! Now grow sales to ${GROWTH_GOAL}% or more.`}</p>}
              {mStars > 0 && mStars < 3 && <p className="mt-2 text-[0.84rem] text-cocoa-2">More stars: keep a profit while growing even faster.</p>}
              <Practice>Last year&apos;s sales (~₹14.7 cr) and loss (~₹63 lakh) are reported figures. How the machine reacts is a practice model, and rent and salaries grow 10% next year.</Practice>
              <NextBar back={() => go(1)} next={() => go(3)} ok={mStars > 0} label="Mission 3" />
            </div>
          )}

          {/* ── 3 rival radar ── */}
          {stage === 3 && (
            <div>
              <Title icon={Radar} kicker="Mission 3">
                Rival radar
              </Title>
              <div className="mt-3">
                <Mentor>
                  Read the <strong>yellow rows</strong> on the K-Matrix wall. Pick a rival, then tap its square on the map.
                </Mentor>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {K_PLAYERS.map((p) => {
                  const done = !!s.grid[p.id]?.x;
                  return (
                    <button key={p.id} onClick={() => setPlayer(p.id)} disabled={done} className={`flex items-center gap-1.5 rounded-full border-2 px-3 py-1.5 text-[0.88rem] font-bold disabled:opacity-60 ${player === p.id && !done ? "text-white" : "bg-white"}`} style={{ borderColor: PLAYER_COLORS[p.id], background: player === p.id && !done ? PLAYER_COLORS[p.id] : undefined }}>
                      {done ? <Check className="size-3.5" strokeWidth={3} /> : <span className="size-2.5 rounded-full" style={{ background: player === p.id ? "#fff" : PLAYER_COLORS[p.id] }} />}
                      {p.short}
                    </button>
                  );
                })}
              </div>
              <div className="mt-3 flex gap-2">
                <div className="flex w-6 flex-col items-center justify-center text-[0.7rem] font-bold text-cocoa-2">
                  <span className="[writing-mode:vertical-rl] rotate-180">Natural sweetening →</span>
                </div>
                <div className="flex-1">
                  <div className="grid grid-cols-3 gap-1.5">
                    {[2, 1, 0].flatMap((zi) =>
                      [0, 1, 2].map((xi) => {
                        const here = K_PLAYERS.filter((p) => s.grid[p.id]?.x === LEVELS[xi] && s.grid[p.id]?.y === LEVELS[zi]);
                        return (
                          <button key={`${xi}${zi}`} onClick={() => placeRival(xi, zi)} disabled={gridDone} aria-label={`Price for everyone ${LEVELS[xi]}, natural sweetening ${LEVELS[zi]}`} className="flex aspect-[4/3] flex-wrap content-center items-center justify-center gap-1 rounded-xl border-2 border-cocoa/10 bg-cream transition-colors hover:border-orange">
                            {here.map((p) => (
                              <span key={p.id} className="size-5 rounded-full border-2 border-white shadow" style={{ background: PLAYER_COLORS[p.id] }} title={p.short} />
                            ))}
                          </button>
                        );
                      }),
                    )}
                  </div>
                  <div className="mt-1 grid grid-cols-3 text-center text-[0.72rem] font-bold text-cocoa-2">
                    <span>Low</span>
                    <span>Medium</span>
                    <span>High</span>
                  </div>
                  <div className="text-center text-[0.72rem] font-bold text-cocoa-2">Price for everyone →</div>
                </div>
              </div>
              {gridDone && (
                <div className="mt-3">
                  <div className="flex items-center justify-between rounded-2xl bg-success/10 p-3">
                    <div className="text-[0.92rem] font-bold text-success">Map complete! Eat Better is the only one high on natural sweetening.</div>
                    <Stars n={rivalStars} size="size-5" />
                  </div>
                  <label className="mt-3 block font-display text-[1.05rem] font-semibold">
                    Finish the sentence: <span className="text-orange">Eat Better wins because…</span>
                    <textarea value={s.edge} onChange={(e) => s.set({ edge: e.target.value })} rows={2} placeholder="…its laddoos are sweetened with dates and taste like home." className="mt-1 w-full rounded-2xl border border-cocoa/20 p-3 font-sans text-[0.95rem] font-normal outline-none focus:border-orange" />
                  </label>
                  <div className={`text-[0.8rem] font-bold ${edgeOk ? "text-success" : "text-cocoa-2"}`}>{edgeOk ? "Strong reason!" : `Use 8+ words and name a real strength from the K-Matrix (${words(s.edge)}/8).`}</div>
                </div>
              )}
              <Toast msg={msg} />
              <NextBar back={() => go(2)} next={() => go(4)} ok={gridDone && edgeOk} label="Mission 4" />
            </div>
          )}

          {/* ── 4 budget coins ── */}
          {stage === 4 && (
            <div>
              <Title icon={Landmark} kicker="Mission 4">
                Budget coins
              </Title>
              <div className="mt-3">
                <Mentor>
                  You have <strong>{COINS} coins</strong> (₹{COIN_LAKH} lakh each). Share them between the teams. Keep the kitchen in step with customers!
                </Mentor>
              </div>
              <div className="mt-3 flex items-center gap-2 rounded-2xl bg-haldi/25 px-3 py-2">
                <div className="flex -space-x-1.5">
                  {Array.from({ length: Math.min(10, COINS - bo.used) }, (_, i) => (
                    <span key={i} className="size-5 rounded-full border-2 border-[#C9A400] bg-haldi" />
                  ))}
                </div>
                <span className="font-bold">{COINS - bo.used} coins left</span>
              </div>
              <div className="mt-2 grid gap-1.5">
                {DEPTS.map((d) => (
                  <div key={d.id} className="flex items-center gap-2 rounded-2xl bg-cream px-3 py-2">
                    <span className="size-3 shrink-0 rounded-full" style={{ background: d.color }} />
                    <div className="min-w-0 flex-1">
                      <div className="text-[0.92rem] font-bold">{d.name}</div>
                      {(s.coins[d.id] ?? 0) === 0 && bo.used > 0 && <div className="text-[0.74rem] text-cocoa-2">If empty: {d.lose}</div>}
                    </div>
                    <button aria-label={`Take a coin from ${d.name}`} onClick={() => addCoin(d.id, -1)} className="grid size-9 place-items-center rounded-xl bg-white">
                      <Minus className="size-4" />
                    </button>
                    <span className="w-6 text-center font-display text-[1.15rem] font-semibold tabular-nums">{s.coins[d.id] ?? 0}</span>
                    <button aria-label={`Give a coin to ${d.name}`} onClick={() => addCoin(d.id, 1)} disabled={bo.used >= COINS} className="grid size-9 place-items-center rounded-xl bg-orange text-white disabled:opacity-40">
                      <Plus className="size-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="mt-3 grid gap-2 rounded-2xl border border-cocoa/10 p-3">
                <Meter label="Customers who want more snacks" value={bo.demand} goal={bo.capacity} max={Math.max(90, bo.demand, bo.capacity)} fmt={(v) => `+${Math.round(v)}%`} good={Math.abs(bo.demand - bo.capacity) <= 10} />
                <Meter label="Snacks the kitchen can make" value={bo.capacity} goal={bo.demand} max={Math.max(90, bo.demand, bo.capacity)} fmt={(v) => `+${Math.round(v)}%`} good={Math.abs(bo.demand - bo.capacity) <= 10} />
                <div className="flex items-center justify-between">
                  <span className="text-[0.9rem] font-bold">Extra orders you can serve: +{Math.round(bo.served)}%</span>
                  <Stars n={budgetStars} size="size-5" />
                </div>
              </div>
              {bo.warnings.map((w) => (
                <p key={w} className="mt-2 flex items-start gap-2 rounded-2xl bg-error/10 px-3 py-2 text-[0.88rem] font-semibold text-error">
                  <X className="mt-0.5 size-4 shrink-0" strokeWidth={3} /> {w}
                </p>
              ))}
              {bo.used < COINS && <p className="mt-2 text-[0.86rem] text-cocoa-2">Place all {COINS} coins. You can also tap the jars on the table.</p>}
              <Practice>The ₹10 crore budget and how each team responds are practice numbers.</Practice>
              <NextBar back={() => go(3)} next={() => go(5)} ok={bo.ok} label="Mission 5" />
            </div>
          )}

          {/* ── 5 grow & pitch ── */}
          {stage === 5 && (
            <div>
              <Title icon={Rocket} kicker="Mission 5">
                Grow & pitch
              </Title>
              {!presented ? (
                <>
                  <div className="mt-3">
                    <Mentor>Pick how Eat Better grows, set a goal the factory and your budget can handle, then pitch it.</Mentor>
                  </div>
                  <div className="mt-3 text-[0.9rem] font-bold">1 · How should we grow?</div>
                  <div className="mt-1.5 grid grid-cols-2 gap-1.5">
                    {PILLARS.map((p) => (
                      <button key={p.id} onClick={() => s.set({ lead: p.id })} className={`rounded-2xl border-2 p-2.5 text-left transition-colors ${s.lead === p.id ? "border-orange bg-orange/8" : "border-cocoa/10 bg-cream hover:border-orange/50"}`}>
                        <div className="flex items-center justify-between font-display text-[0.98rem] font-semibold">
                          {p.short}
                          {s.lead === p.id && <Check className="size-4 text-orange" strokeWidth={3} />}
                        </div>
                        <div className="text-[0.76rem] leading-snug text-cocoa-2">{p.title}</div>
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 text-[0.9rem] font-bold">2 · Orders a month, one year from now</div>
                  <div className="mt-1.5 flex items-center gap-3 rounded-2xl bg-cream p-3">
                    <button aria-label="Lower goal" onClick={() => s.set({ target: Math.max(2.5, +(s.target - 0.5).toFixed(1)) })} className="grid size-10 place-items-center rounded-xl bg-white">
                      <Minus className="size-5" />
                    </button>
                    <div className="flex-1 text-center">
                      <div className="font-display text-[1.7rem] font-semibold leading-none">{s.target} lakh</div>
                      <div className="text-[0.76rem] text-cocoa-2">today about {ORDERS_NOW} lakh</div>
                    </div>
                    <button aria-label="Raise goal" onClick={() => s.set({ target: Math.min(8, +(s.target + 0.5).toFixed(1)) })} className="grid size-10 place-items-center rounded-xl bg-orange text-white">
                      <Plus className="size-5" />
                    </button>
                  </div>
                  <div className="mt-1.5 grid grid-cols-2 gap-1.5 text-[0.82rem]">
                    <div className={`rounded-xl px-2.5 py-1.5 font-bold ${s.target <= FACILITY_CAP ? "bg-success/10 text-success" : "bg-error/10 text-error"}`}>Factory can make {FACILITY_CAP} lakh</div>
                    <div className={`rounded-xl px-2.5 py-1.5 font-bold ${s.target <= supported ? "bg-success/10 text-success" : "bg-error/10 text-error"}`}>Your budget serves {supported} lakh</div>
                  </div>
                  <div className="mt-1 flex justify-end">
                    <Stars n={growStars} size="size-5" />
                  </div>
                  <label className="mt-2 block text-[0.9rem] font-bold">
                    3 · Your pitch in one sentence: why should investors back Eat Better?
                    <textarea value={s.pitch} onChange={(e) => s.set({ pitch: e.target.value })} rows={3} placeholder="Families want snacks that taste like home but are healthier, and…" className="mt-1 w-full rounded-2xl border border-cocoa/20 p-3 text-[0.95rem] font-normal outline-none focus:border-orange" />
                  </label>
                  <div className={`text-[0.8rem] font-bold ${pitchOk ? "text-success" : "text-cocoa-2"}`}>{pitchOk ? "Ready to pitch!" : `${words(s.pitch)}/12 words`}</div>
                  <button disabled={!s.lead || !targetOk || !pitchOk} onClick={() => setPresented(true)} className={`${primary} mt-3 w-full !py-3`}>
                    <Landmark className="size-5" /> Walk into the boardroom
                  </button>
                  {!targetOk && <p className="mt-1.5 text-center text-[0.8rem] text-cocoa-2">Set a goal above today&apos;s 2 lakh that the factory and your budget can both handle.</p>}
                </>
              ) : (
                <>
                  <div className="mt-3">
                    <Mentor>The investors have questions. Answer each in a sentence and use a number from your plan. Watch their faces!</Mentor>
                  </div>
                  <div className="mt-3 grid gap-2.5">
                    {questions.map((q, i) => (
                      <div key={i} className="rounded-2xl border-2 border-orange/30 p-3">
                        <div className="text-[0.74rem] font-extrabold uppercase tracking-[0.1em] text-cocoa-2">{q.who} · pretend investor</div>
                        <p className="mt-0.5 font-display text-[1.05rem] font-semibold leading-snug">“{q.q}”</p>
                        <textarea value={s.answers[i] ?? ""} onChange={(e) => s.set({ answers: { ...s.answers, [i]: e.target.value } })} rows={2} placeholder="My answer, with a number from my plan…" className="mt-2 w-full rounded-xl border border-cocoa/20 p-2.5 text-[0.95rem] outline-none focus:border-orange" />
                        <div className={`text-[0.8rem] font-bold ${answerOk(i) ? "text-success" : "text-cocoa-2"}`}>{answerOk(i) ? "They're nodding!" : `10+ words and a number (${words(s.answers[i] ?? "")}/10)`}</div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => setPresented(false)} className={`${secondary} mt-3`}>
                    <ArrowLeft className="size-4" /> Change my plan
                  </button>
                </>
              )}
              <Practice>The investors are pretend characters for practice. This is not Eat Better&apos;s real fundraising. Factory capacity is a practice number.</Practice>
              <NextBar back={() => (setPresented(false), go(4))} next={() => go(6)} ok={m5Ok} label="See my report" />
            </div>
          )}

          {/* ── 6 report ── */}
          {stage === 6 && (
            <div>
              <div className="flex items-center gap-4 rounded-[22px] bg-cream p-4">
                <div className="grid size-20 shrink-0 place-items-center rounded-full border-4 border-haldi bg-white">
                  <Trophy className="size-9 text-orange" />
                </div>
                <div>
                  <div className="font-display text-[1.45rem] font-semibold leading-tight">{fb?.headline}</div>
                  <div className="mt-0.5 flex items-center gap-1.5 text-[1.05rem] font-bold">
                    <Star className="size-5 fill-haldi text-[#C9A400]" /> {total} of 15 stars
                  </div>
                </div>
              </div>
              {/* feedback from us: why each mission earned its stars, and what would earn more */}
              <div className="mt-3 rounded-2xl border-2 border-orange/30 bg-white p-3">
                <div className="text-[0.75rem] font-extrabold uppercase tracking-[0.12em] text-orange">Feedback from Eat Better × SkilliZee</div>
                <p className="mt-1 text-[0.98rem] leading-snug text-cocoa">{fb?.summary}</p>
              </div>
              <div className="mt-3 grid gap-2">
                {fb?.missions.map((m, i) => (
                  <div key={m.name} className="rounded-2xl bg-cream px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold">
                        {i + 1}. {m.name}
                      </span>
                      <Stars n={m.stars} size="size-5" />
                    </div>
                    <p className="mt-1 text-[0.92rem] leading-snug text-cocoa">
                      <strong>Why:</strong> {m.why}
                    </p>
                    <p className="mt-0.5 text-[0.92rem] leading-snug text-cocoa-2">
                      <strong className={m.stars === 3 ? "text-success" : "text-orange"}>{m.stars === 3 ? "Full marks:" : "Next time:"}</strong> {m.next}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-5">
                <ProjectReadyPopup
                  student={student}
                  setStudent={setStudent}
                  reflection={s.reflection}
                  setReflection={(r) => s.set({ reflection: r })}
                  reflectionPrompt="Which mission taught you the most about running a business, and why?"
                  submitWhat="Submit your Business Report (PDF) and your Game Numbers sheet (CSV)."
                  activity="Experiential Activity 4 · Run the Eat Better Business"
                  files={[`EatBetter-SkilliZee-Business-Report-${stem}.pdf`, `EatBetter-SkilliZee-Business-Numbers-${stem}.csv`]}
                  downloads={[
                    { label: "Download my Report (PDF)", sub: "Every mission, your choices and your stars", kind: "pdf", run: () => buildBusinessReport(useBiz.getState(), student) },
                    { label: "Download my Numbers (CSV)", sub: "Opens in Excel or Google Sheets", kind: "csv", run: () => downloadFinancialCsv(useBiz.getState(), student) },
                  ]}
                />
              </div>
              <button onClick={() => go(5)} className={`${secondary} mt-3`}>
                <ArrowLeft className="size-4" /> Back to mission 5
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
