"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { ArrowRight, Calculator, ScanLine, UserRound } from "lucide-react";
import { Stage3D } from "@/components/play/Stage3D";
import { CheckRow, GameFrame, starsFor, type Feedback } from "@/components/play/GameFrame";
import { Human, type HumanLook } from "@/components/world2/Human";
import { useMediaQuery } from "@/lib/useClient";
import { KMATRIX, K_PLAYERS, LEVEL_SCORE, type ParamId, type PlayerId } from "../content";
import { NumIn, PracticeTag, has, num, shuffle, words } from "./shared";
import { Floor, GenericPack, Label, PhotoBox, StageLights, flatMat } from "./three";

/**
 * Shelf Showdown — a 3D aisle with four shelf islands (one per K-Matrix column). Practice shoppers walk in with
 * weighted priorities; the student reads each shelf's K-Matrix card, types the four weighted totals
 * (High = 3, Medium = 2, Low = 1, times the weight) and only then does the shopper walk to the winning shelf.
 * Rounds are generated so both Eat Better and the traditional brands win at least once.
 */

const PARAM = Object.fromEntries(KMATRIX.map((k) => [k.id, k])) as Record<ParamId, (typeof KMATRIX)[number]>;
const PLAYER = Object.fromEntries(K_PLAYERS.map((p) => [p.id, p])) as Record<PlayerId, (typeof K_PLAYERS)[number]>;
const IDS: PlayerId[] = ["eb", "trad", "health", "local"];

type Prio = { p: ParamId; w: number };
type Round = { look: HumanLook; who: string; prios: Prio[]; totals: Record<PlayerId, number>; winner: PlayerId };

const LOOKS: { look: HumanLook; who: string }[] = [
  { who: "a parent buying tiffin snacks", look: { skin: "#9C6644", hair: "#140C08", hairStyle: "braid", outfit: "saree", top: "#C2185B", bottom: "#C2185B", accent: "#F2A900", bindi: true, slim: true, height: 0.95 } },
  { who: "a college student", look: { skin: "#D1A276", hair: "#2A1A12", hairStyle: "curly", outfit: "tshirt", top: "#3E8E41", bottom: "#33475B", shoe: "#EDEDED", bag: { kind: "backpack", color: "#35401D" } } },
  { who: "an office worker", look: { skin: "#B98157", hair: "#1E1410", hairStyle: "side", outfit: "shirt", top: "#DCE6F0", bottom: "#2B3A55", accent: "#F4F7FA", facial: "stubble", bag: { kind: "shoulder", color: "#3E2B22" } } },
  { who: "a grandparent", look: { skin: "#A86B45", hair: "#CFC8C0", hairStyle: "bald", outfit: "kurta", top: "#F4EFE6", bottom: "#F4EFE6", facial: "moustache", glasses: "#3A2A1E", height: 0.97 } },
  { who: "a fitness coach", look: { skin: "#B5764A", hair: "#140C08", hairStyle: "long", outfit: "salwar", top: "#26A69A", bottom: "#F3E5D0", accent: "#FED300", bindi: true, slim: true, height: 0.94 } },
];

function totalsFor(prios: Prio[]) {
  return Object.fromEntries(IDS.map((id) => [id, prios.reduce((s, x) => s + LEVEL_SCORE[PARAM[x.p].v[id]] * x.w, 0)])) as Record<PlayerId, number>;
}

/** Two rounds: one Eat Better win and one traditional-brand win — every round has a single clear winner. */
function makeRounds(): Round[] {
  // two shoppers: one Eat Better win and one traditional-brand win, so the lesson (weights pick the winner) stays
  const plan = shuffle(["eb", "trad"] as const);
  const looks = shuffle(LOOKS);
  const seen = new Set<string>();
  return plan.map((target, i) => {
    for (let t = 0; t < 2000; t++) {
      const params = shuffle(KMATRIX.map((k) => k.id)).slice(0, 3);
      const ws = shuffle([3, 2, 1]);
      const prios = params.map((p, j) => ({ p, w: ws[j] })).sort((a, b) => b.w - a.w);
      const key = prios.map((x) => `${x.p}${x.w}`).join();
      if (seen.has(key)) continue;
      const totals = totalsFor(prios);
      const best = Math.max(...IDS.map((id) => totals[id]));
      const top = IDS.filter((id) => totals[id] === best);
      if (top.length !== 1) continue;
      if (top[0] !== target) continue;
      // keep the rounds interesting: the winner should not win by a mile every time
      seen.add(key);
      return { ...looks[i], prios, totals, winner: top[0] };
    }
    throw new Error("no round");
  });
}

/* ── 3D ───────────────────────────────────────────────────────── */

type Layout = { pos: Record<PlayerId, [number, number, number]>; rot: Record<PlayerId, number>; cam: [number, number, number]; look: [number, number, number] };
const WIDE: Layout = {
  pos: { eb: [-3.3, 0, -0.5], trad: [-1.1, 0, -1.5], health: [1.1, 0, -1.5], local: [3.3, 0, -0.5] },
  rot: { eb: 0.42, trad: 0.12, health: -0.12, local: -0.42 },
  cam: [0, 2.8, 6.6],
  look: [0, 1.05, -0.7],
};
const TALL: Layout = {
  pos: { eb: [-1.25, 0, -2.6], trad: [1.25, 0, -2.6], health: [-1.6, 0, 0.1], local: [1.6, 0, 0.1] },
  rot: { eb: 0.15, trad: -0.15, health: 0.55, local: -0.55 },
  cam: [0, 7.4, 7.6],
  look: [0, 0.6, -1.0],
};

function Rig({ layout }: { layout: Layout }) {
  const { camera } = useThree();
  // one camera position for every screen; the stage's lens fit keeps all four shelves in view on narrow ones
  useEffect(() => {
    camera.position.set(...layout.cam);
    camera.lookAt(...layout.look);
    camera.updateProjectionMatrix();
  }, [camera, layout]);
  return null;
}

const EB_FRONTS = ["/brand/library/namkeen/millet-namkeen-desi-masala-front.webp", "/brand/library/laddoos/orange-ginger-laddoos-front.webp", "/brand/library/nuts-seeds/premium-nut-mix-front.webp"];

function ShelfFrame({ color }: { color: string }) {
  return (
    <>
      <mesh position={[0, 0.06, 0]} material={flatMat("#5B3A2E")} castShadow receiveShadow>
        <boxGeometry args={[1.7, 0.12, 0.7]} />
      </mesh>
      <mesh position={[0, 0.95, -0.3]} material={flatMat(color, 0.7)} castShadow>
        <boxGeometry args={[1.7, 1.8, 0.06]} />
      </mesh>
      {[0.55, 1.15].map((y) => (
        <mesh key={y} position={[0, y, -0.05]} material={flatMat("#F5EBDD")} castShadow receiveShadow>
          <boxGeometry args={[1.62, 0.04, 0.5]} />
        </mesh>
      ))}
    </>
  );
}

function Island({ id, layout, lit, inspected, wins, onPick }: { id: PlayerId; layout: Layout; lit: boolean; inspected: boolean; wins: number; onPick: (id: PlayerId) => void }) {
  const glow = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    if (!glow.current) return;
    const m = glow.current.material as THREE.MeshBasicMaterial;
    m.opacity = lit ? 0.55 + Math.sin(clock.elapsedTime * 4) * 0.2 : inspected ? 0.35 : 0;
  });
  const signColor = id === "eb" ? "#FF5C00" : "#2F1C1A";
  return (
    <group position={layout.pos[id]} rotation={[0, layout.rot[id], 0]}>
      <group
        onClick={(e) => {
          e.stopPropagation();
          onPick(id);
        }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "")}
      >
        {id === "local" ? (
          <>
            {/* sweet-shop counter: glass case with laddoos and barfi */}
            <mesh position={[0, 0.45, 0]} material={flatMat("#8D5A3B")} castShadow receiveShadow>
              <boxGeometry args={[1.7, 0.9, 0.7]} />
            </mesh>
            <mesh position={[0, 1.12, 0]}>
              <boxGeometry args={[1.62, 0.44, 0.62]} />
              <meshStandardMaterial color="#DDF2F5" transparent opacity={0.28} roughness={0.1} />
            </mesh>
            {Array.from({ length: 9 }).map((_, i) => (
              <mesh key={i} position={[-0.6 + (i % 5) * 0.3, 1.0, -0.12 + Math.floor(i / 5) * 0.24]} material={flatMat("#F2A33A", 0.5)} castShadow>
                <sphereGeometry args={[0.085, 14, 10]} />
              </mesh>
            ))}
            {Array.from({ length: 4 }).map((_, i) => (
              <mesh key={`b${i}`} position={[0.45 + (i % 2) * 0.2, 0.97, 0.12 + Math.floor(i / 2) * -0.06]} material={flatMat("#F3E3C0", 0.6)}>
                <boxGeometry args={[0.16, 0.06, 0.12]} />
              </mesh>
            ))}
            <mesh position={[0, 1.6, -0.3]} material={flatMat("#E9C46A")}>
              <boxGeometry args={[1.7, 0.5, 0.05]} />
            </mesh>
          </>
        ) : (
          <>
            <ShelfFrame color={id === "eb" ? "#FFE3CC" : id === "trad" ? "#F7D9A8" : "#DDE8D0"} />
            {[0.6, 1.2].map((y, row) =>
              [-0.52, 0, 0.52].map((x, i) =>
                id === "eb" ? (
                  <PhotoBox key={`${y}${x}`} img={EB_FRONTS[(i + row) % 3]} size={[0.42, 0.42, 0.12]} position={[x, y + 0.23, -0.05]} />
                ) : id === "trad" ? (
                  <GenericPack key={`${y}${x}`} word={["BHUJIA", "SEV", "MITHAI"][(i + row) % 3]} color={["#D62828", "#F2A900", "#B5179E"][(i + row) % 3]} position={[x, y + 0.27, -0.05]} />
                ) : (
                  <GenericPack key={`${y}${x}`} word={["DRY FRUIT", "SEED MIX", "ROASTED"][(i + row) % 3]} color={["#7A5C3E", "#3E6B48", "#A68A64"][(i + row) % 3]} position={[x, y + 0.27, -0.05]} />
                ),
              ),
            )}
          </>
        )}
        {/* glow ring on the floor */}
        <mesh ref={glow} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.015, 0.55]}>
          <ringGeometry args={[0.55, 0.8, 40]} />
          <meshBasicMaterial color={lit ? "#FF5C00" : "#F2A900"} transparent opacity={0} toneMapped={false} />
        </mesh>
      </group>
      <Label lines={[PLAYER[id].name]} width={1.7} height={0.3} position={[0, 2.08, -0.26]} o={{ bg: signColor, fg: "#FFF5EE", font: "display", weight: 600 }} />
      {wins > 0 && <Label lines={[`${wins} ${wins === 1 ? "win" : "wins"}`]} width={0.6} height={0.2} position={[0, 2.38, -0.26]} o={{ bg: "#F2A900", fg: "#2F1C1A", weight: 700 }} />}
    </group>
  );
}

/** The shopper: walks in to the centre, then to the winning shelf. */
function Shopper({ look, target, faceCamera, onArrive }: { look: HumanLook; target: [number, number, number]; faceCamera: boolean; onArrive: () => void }) {
  const g = useRef<THREE.Group>(null);
  const tk = target.join();
  const [arrivedAt, setArrivedAt] = useState<string | null>(null);
  const done = useRef<string | null>(null);
  const moving = arrivedAt !== tk;
  useFrame((_, dt) => {
    const o = g.current;
    if (!o || done.current === tk) return;
    const dx = target[0] - o.position.x;
    const dz = target[2] - o.position.z;
    const d = Math.hypot(dx, dz);
    if (d < 0.03) {
      done.current = tk;
      if (faceCamera) o.rotation.y = 0;
      setArrivedAt(tk);
      onArrive();
      return;
    }
    const step = Math.min(d, dt * 1.5);
    o.position.x += (dx / d) * step;
    o.position.z += (dz / d) * step;
    o.rotation.y = Math.atan2(dx, dz);
  });
  return (
    <group ref={g} position={[0, 0, 4.2]}>
      <Human look={look} mode={moving ? "walk" : "stand"} />
    </group>
  );
}

/* ── the game ─────────────────────────────────────────────────── */

const STEPS = ["Shopper 1", "Shopper 2", "Debrief"];
const ROUNDS = 2;
type Phase = "arrive" | "score" | "walk" | "chosen";

export default function ShelfShowdown({ onDone }: { onDone: (summary: string) => void }) {
  const compact = useMediaQuery("(max-width: 767px)");
  const layout = compact ? TALL : WIDE;
  const [seed, setSeed] = useState(0);
  const rounds = useMemo(() => makeRounds(), [seed]); // eslint-disable-line react-hooks/exhaustive-deps
  const [r, setR] = useState(0);
  const [phase, setPhase] = useState<Phase>("arrive");
  const [vals, setVals] = useState<Record<PlayerId, string>>({ eb: "", trad: "", health: "", local: "" });
  const [bad, setBad] = useState<PlayerId[]>([]);
  const [inspected, setInspected] = useState<PlayerId | null>(null);
  const [mistakes, setMistakes] = useState(0);
  const [wins, setWins] = useState<Record<PlayerId, number>>({ eb: 0, trad: 0, health: 0, local: 0 });
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [line, setLine] = useState("");
  const [done, setDone] = useState(false);
  const [explain, setExplain] = useState<PlayerId[]>([]);

  const round = rounds[Math.min(r, ROUNDS - 1)];
  const debrief = r >= ROUNDS;
  const step = debrief ? (done ? ROUNDS + 1 : ROUNDS) : r;

  const reset = () => {
    setSeed((s) => s + 1);
    setR(0);
    setPhase("arrive");
    setVals({ eb: "", trad: "", health: "", local: "" });
    setBad([]);
    setInspected(null);
    setMistakes(0);
    setWins({ eb: 0, trad: 0, health: 0, local: 0 });
    setFeedback(null);
    setLine("");
    setDone(false);
    setExplain([]);
  };

  const centre: [number, number, number] = compact ? [0, 0, 2.2] : [0, 0, 1.6];
  const shelfFront = (id: PlayerId): [number, number, number] => {
    const [x, , z] = layout.pos[id];
    const a = layout.rot[id];
    return [x + Math.sin(a) * 0.95, 0, z + Math.cos(a) * 0.95];
  };
  const target = phase === "walk" || phase === "chosen" ? shelfFront(round.winner) : centre;

  const onArrive = useCallback(() => {
    setPhase((p) => (p === "arrive" ? "score" : p === "walk" ? "chosen" : p));
  }, []);

  const check = () => {
    const wrong = IDS.filter((id) => num(vals[id]) !== round.totals[id]);
    if (IDS.some((id) => vals[id].trim() === "")) {
      setFeedback({ tone: "info", text: "Type a weighted total for all four shelves first. Tap a shelf to read its K-Matrix card." });
      return;
    }
    if (wrong.length) {
      setMistakes((m) => m + 1);
      setBad(wrong);
      setExplain(wrong);
      setFeedback({ tone: "bad", text: `${wrong.map((id) => PLAYER[id].name).join(", ")} ${wrong.length === 1 ? "is" : "are"} off. The working is shown cell by cell under the score sheet: fix the ${wrong.length === 1 ? "total" : "totals"} and check again.` });
      return;
    }
    setBad([]);
    setExplain([]);
    const w = round.winner;
    const sorted = [...IDS].sort((a, b) => round.totals[b] - round.totals[a]);
    setFeedback({ tone: "good", text: `${PLAYER[w].name} scores ${round.totals[w]}, ahead of ${PLAYER[sorted[1]].name} on ${round.totals[sorted[1]]}. Watch the shopper walk to that shelf.` });
    setPhase("walk");
    setWins((s) => ({ ...s, [w]: s[w] + 1 }));
  };

  const next = () => {
    setR((x) => x + 1);
    setPhase("arrive");
    setVals({ eb: "", trad: "", health: "", local: "" });
    setInspected(null);
    setFeedback(null);
  };

  const tradRound = rounds.find((x) => x.winner === "trad")!;
  const tradTop = tradRound.prios[0];
  const lineChecks = [
    { ok: has(line, /price|afford|cheap|mass|budget|cost/), label: "Names the row that decided it (mass-market price)" },
    { ok: has(line, /weight|×|x\s?\d|priorit|mattered|cared|most|important|counted/), label: "Says why that row counted so much (the shopper's weights)" },
    { ok: has(line, /high|medium|low|3|2|score/), label: "Uses the K-Matrix rating" },
    { ok: words(line) >= 10, label: "At least 10 words" },
  ];
  const lineOk = lineChecks.every((c) => c.ok);

  const finish = () => {
    if (!lineOk) return;
    setDone(true);
    setFeedback({ tone: "good", text: "Same matrix, different shoppers, different winners. A K-Matrix only picks a winner once you know what the customer weighs most." });
    onDone(`Scored ${ROUNDS} practice shoppers on the K-Matrix: Eat Better won ${wins.eb}, Traditional Snack Brands won ${wins.trad}. Why the traditional shelf won once: ${line.trim()}`);
  };

  const card = inspected ? K_PLAYERS.find((p) => p.id === inspected)! : null;
  const prioSet = new Set(round.prios.map((x) => x.p));

  return (
    <GameFrame
      calculator
      kicker="Activity 1 · 3D aisle"
      title="Shelf Showdown"
      mission="Four shelves, one per K-Matrix column. Two practice shoppers walk in, each caring about three things, with weights. Read each shelf's K-Matrix card, score it (High = 3, Medium = 2, Low = 1, times the weight), and the shopper walks to the shelf you prove is best."
      steps={STEPS}
      guide={
        debrief
          ? { todo: "Both shoppers are served. In one line, explain why the traditional shelf won for its shopper.", hints: ["Look back at that shopper's card: which row had the biggest weight (×3)?", "Say which rating the traditional shelf had on that row (High, Medium or Low).", "Use the words weight and rating in your sentence."] }
          : phase === "arrive"
            ? { todo: "Watch the shopper walk into the aisle. Their card appears at the top right." }
            : phase === "score"
              ? {
                  todo: "Each score box shows the sum for that shelf. Work it out and type the total for all four shelves, then press Check.",
                  hints: ["High = 3, Medium = 2, Low = 1.", "Multiply each rating number by the shopper's weight, then add the three answers.", "Example with other numbers: Medium (2) × 3 = 6, High (3) × 1 = 3, Low (1) × 2 = 2, so 6 + 3 + 2 = 11.", "Tap a shelf name to see its full card. The Calculator button can help."],
                }
              : { todo: "Watch the shopper walk to the winning shelf, then press the button to continue." }
      }
      step={step}
      stars={done ? starsFor(mistakes) : undefined}
      onReset={reset}
      feedback={feedback}
      note={{ real: "Every rating on the shelf cards is the chapter's K-Matrix (how this chapter compares the four kinds of seller).", practice: "The shoppers and their weights are made up and change on every restart.", tip: "Multiply first, add second. Only the shopper's three rows count." }}
    >
      <Stage3D design={2.2}
        label="A shop aisle with four shelves: Eat Better Co, traditional snack brands, gourmet health competitors and a local sweet outlet. A shopper stands in the middle."
        camera={{ position: layout.cam, fov: 42 }}
        height={compact ? "430px" : "clamp(380px, 60vh, 540px)"}
        overlay={
          <>
            <div className="absolute left-3 top-3 flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-cocoa/90 px-3 py-1 text-[0.8rem] font-extrabold text-cream">{debrief ? "Both shoppers served" : `Shopper ${r + 1} of ${ROUNDS}`}</span>
              <PracticeTag />
            </div>
            {!debrief && phase !== "arrive" && (
              <div className="absolute right-3 top-3 max-w-[15.5rem] rounded-2xl border border-cocoa/20 bg-white/95 p-3 shadow-[2px_2px_0_0_#2f1c1a] sm:max-w-[18rem]">
                <div className="flex items-center gap-1.5 text-[0.72rem] font-extrabold uppercase tracking-[0.1em] text-orange">
                  <UserRound className="size-3.5" /> {round.who}
                </div>
                <ul className="mt-1.5 grid gap-1" data-testid="ss-prios">
                  {round.prios.map((x) => (
                    <li key={x.p} className="flex items-center justify-between gap-2 text-[0.86rem] font-bold leading-tight text-cocoa">
                      <span>{PARAM[x.p].short}</span>
                      <span className="shrink-0 rounded-md bg-cocoa px-1.5 py-0.5 text-[0.8rem] text-haldi">×{x.w}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {card && (
              <div className="absolute bottom-3 left-3 right-3 rounded-2xl border border-cocoa bg-cream/95 p-3 shadow-[2px_2px_0_0_#2f1c1a] sm:right-auto sm:w-[22rem]">
                <div className="flex items-center gap-1.5 text-[0.72rem] font-extrabold uppercase tracking-[0.1em] text-cocoa-2">
                  <ScanLine className="size-3.5" /> Shelf card · {card.name}
                </div>
                <ul className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-0.5" data-testid="ss-card">
                  {KMATRIX.map((k) => (
                    <li key={k.id} className={`flex items-baseline justify-between gap-1 text-[0.8rem] leading-tight ${prioSet.has(k.id) && !debrief && phase !== "arrive" ? "font-extrabold text-cocoa" : "text-cocoa-2"}`}>
                      <span className="truncate">{k.short}</span>
                      <span className="shrink-0">{k.v[card.id]}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        }
      >
        <Rig layout={layout} />
        <StageLights shadows={!compact} />
        <Floor />
        {/* aisle runner */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, 1.6]} receiveShadow>
          <planeGeometry args={[1.4, 6]} />
          <meshStandardMaterial color="#E2C9AE" roughness={0.95} />
        </mesh>
        {IDS.map((id) => (
          <Island key={id} id={id} layout={layout} lit={(phase === "walk" || phase === "chosen") && round.winner === id && !debrief} inspected={inspected === id} wins={wins[id]} onPick={setInspected} />
        ))}
        {!debrief && <Shopper key={`${seed}-${r}`} look={round.look} target={target} faceCamera={phase === "arrive" || phase === "score"} onArrive={onArrive} />}
      </Stage3D>

      {/* shelf tags: same as tapping a shelf in 3D */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        <span className="self-center text-[0.85rem] font-bold text-cocoa-2">Read a shelf card:</span>
        {K_PLAYERS.map((p) => (
          <button key={p.id} data-testid={`ss-shelf-${p.id}`} onClick={() => setInspected(p.id)} className={`rounded-full border px-3 py-1 text-[0.85rem] font-bold ${inspected === p.id ? "border-cocoa bg-cocoa text-cream" : "border-cocoa/25 bg-white text-cocoa hover:border-cocoa"}`}>
            {p.short}
          </button>
        ))}
      </div>

      {!debrief && (
        <div className="mt-4 rounded-2xl bg-cream p-4">
          <div className="flex items-center gap-2 font-display text-[1.1rem] font-semibold text-cocoa">
            <Calculator className="size-5 text-orange" /> Score sheet · shopper {r + 1}
          </div>
          {phase === "arrive" ? (
            <p className="mt-2 text-[0.95rem] text-cocoa-2">The shopper is walking in…</p>
          ) : (
            <>
              <p className="mt-1 text-[0.92rem] text-cocoa-2">
                Weighted total = (rating × weight) for each of the shopper&apos;s three rows, added up.
              </p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                {IDS.map((id) => (
                  <label key={id} className={`flex items-center justify-between gap-2 rounded-xl bg-white px-3 py-2 ${round.winner === id && phase !== "score" ? "ring-2 ring-orange" : ""}`}>
                    <span className="min-w-0">
                      <span className="block text-[0.95rem] font-bold text-cocoa">{PLAYER[id].name}</span>
                      {/* the sum to work out: each rating as a number times its weight (the total is left to the learner) */}
                      <span className="block text-[0.8rem] font-semibold leading-snug text-cocoa-2">
                        {round.prios.map((x) => `${PARAM[x.p].v[id]} (${LEVEL_SCORE[PARAM[x.p].v[id]]}) × ${x.w}`).join(" + ")} = ?
                      </span>
                    </span>
                    <NumIn label={`Weighted total for ${PLAYER[id].name}`} testId={`ss-in-${id}`} value={vals[id]} onChange={(v) => setVals((s) => ({ ...s, [id]: v }))} disabled={phase !== "score"} w="w-20" ok={bad.includes(id) ? false : undefined} />
                  </label>
                ))}
              </div>
              {explain.length > 0 && phase === "score" && (
                <div className="mt-3 grid gap-2" data-testid="ss-explain">
                  {explain.map((id) => (
                    <div key={id} className="rounded-xl border border-error/30 bg-white p-3 text-[0.9rem] text-cocoa">
                      <strong>{PLAYER[id].name}:</strong>{" "}
                      {round.prios.map((x, i) => (
                        <span key={x.p}>
                          {i > 0 && " + "}
                          {PARAM[x.p].short} {PARAM[x.p].v[id]} ({LEVEL_SCORE[PARAM[x.p].v[id]]}) × {x.w} = <strong>{LEVEL_SCORE[PARAM[x.p].v[id]] * x.w}</strong>
                        </span>
                      ))}{" "}
                      → <strong>{round.totals[id]}</strong>. You typed {vals[id] || "nothing"}.
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-3 flex flex-wrap gap-2">
                {phase === "score" && (
                  <button data-testid="ss-check" onClick={check} className="eb-btn eb-btn-primary">
                    Check totals and send the shopper
                  </button>
                )}
                {phase === "chosen" && (
                  <button data-testid="ss-next" onClick={next} className="eb-btn eb-btn-primary inline-flex items-center gap-2">
                    {r < ROUNDS - 1 ? "Next shopper" : "Go to the debrief"} <ArrowRight className="size-4" />
                  </button>
                )}
                {phase === "walk" && <span className="self-center text-[0.95rem] font-bold text-cocoa-2">The shopper is walking to {PLAYER[round.winner].name}…</span>}
              </div>
            </>
          )}
        </div>
      )}

      {debrief && (
        <div className="mt-4 grid gap-3 rounded-2xl bg-cream p-4">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            {IDS.map((id) => (
              <div key={id} className={`rounded-xl p-3 text-center ${id === "eb" ? "bg-orange text-white" : "bg-white text-cocoa"}`}>
                <div className="font-display text-[1.8rem] font-semibold leading-none">{wins[id]}</div>
                <div className="mt-1 text-[0.82rem] font-bold leading-tight">{PLAYER[id].name}</div>
              </div>
            ))}
          </div>
          <p className="text-[1rem] text-cocoa">
            Shopper {rounds.indexOf(tradRound) + 1} ({tradRound.who}) weighted <strong>{PARAM[tradTop.p].short} ×{tradTop.w}</strong> and picked the traditional shelf: {tradRound.totals.trad} against Eat Better&apos;s {tradRound.totals.eb}. In one line, explain why Eat Better lost that shopper.
          </p>
          <textarea data-testid="ss-line" value={line} onChange={(e) => setLine(e.target.value)} disabled={done} rows={2} placeholder="Eat Better lost because…" className="w-full rounded-xl border-2 border-cocoa/20 bg-white px-3 py-2 text-[1rem] text-cocoa outline-none focus:border-orange" />
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {lineChecks.map((c) => (
              <CheckRow key={c.label} ok={c.ok} label={c.label} />
            ))}
          </ul>
          {!done && (
            <button data-testid="ss-finish" onClick={finish} disabled={!lineOk} className="eb-btn eb-btn-primary justify-self-start disabled:opacity-50">
              Save my debrief
            </button>
          )}
        </div>
      )}
    </GameFrame>
  );
}
