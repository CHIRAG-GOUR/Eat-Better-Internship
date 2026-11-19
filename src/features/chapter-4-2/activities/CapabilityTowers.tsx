"use client";

import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Layers, Lock, Trash2 } from "lucide-react";
import { Stage3D } from "@/components/play/Stage3D";
import { CheckRow, GameFrame, starsFor, type Feedback } from "@/components/play/GameFrame";
import { useMediaQuery } from "@/lib/useClient";
import { KMATRIX, K_PLAYERS, MARKET, type Level, type ParamId, type PlayerId } from "../content";
import { has, shuffle, words } from "./shared";
import { FitRig, Floor, Label, StageLights, flatMat } from "./three";

/**
 * Capability Towers — the student builds the chapter's K-Matrix as a 6 × 4 field of 3D pillars, one evidence card
 * at a time (tap a pillar to raise it Low → Medium → High). Some cards are decoys: price tiers from the market
 * table, which are not K-Matrix ratings. Then a spotlight sweeps the board and the student must point at Eat
 * Better's unique edge and its capability gap, and explain each in one live-checked line.
 */

type Cell = Level | null;
const PIDS: PlayerId[] = ["eb", "trad", "health", "local"];
const ROWS = KMATRIX.map((k) => k.id);
const H: Record<Level, number> = { Low: 0.35, Medium: 0.75, High: 1.15 };
const COL: Record<Level, string> = { High: "#FF5C00", Medium: "#F2A900", Low: "#F3D3B0" };
const NEXT: Record<string, Level> = { none: "Low", Low: "Medium", Medium: "High", High: "Low" };
const key = (r: ParamId, p: PlayerId) => `${r}:${p}`;
const PNAME = Object.fromEntries(K_PLAYERS.map((p) => [p.id, p.name])) as Record<PlayerId, string>;
const RNAME = Object.fromEntries(KMATRIX.map((k) => [k.id, k.param])) as Record<ParamId, string>;

type Card = { kind: "row"; row: ParamId; order: PlayerId[] } | { kind: "decoy"; player: PlayerId; text: string };

function makeDeck(): Card[] {
  const rows: Card[] = ROWS.map((row) => ({ kind: "row", row, order: shuffle(PIDS) }));
  const decoys: Card[] = shuffle(MARKET)
    .slice(0, 2)
    .map((m) => ({ kind: "decoy", player: m.id, text: `${m.name}${m.id === "trad" ? " (Haldiram's, Bikaji)" : m.id === "local" ? " (Mithai Outlets)" : m.id === "health" ? " (Farmley, True Elements)" : ""} · Pricing Tier: ${m.tier} (${m.rangeText})` }));
  // never open with a decoy, so the first card teaches the move
  const deck = shuffle([...rows, ...decoys]);
  if (deck[0].kind === "decoy") {
    const i = deck.findIndex((c) => c.kind === "row");
    [deck[0], deck[i]] = [deck[i], deck[0]];
  }
  return deck;
}

/* ── 3D board ─────────────────────────────────────────────────── */

const X0 = -0.55;
const DX = 0.95;
const Z0 = -1.95;
const DZ = 0.78;
const px = (i: number) => X0 + i * DX;
const pz = (j: number) => Z0 + j * DZ;

function Pillar({ row, j, player, i, level, locked, mark, onTap }: { row: ParamId; j: number; player: PlayerId; i: number; level: Cell; locked: boolean; mark: "edge" | "gap" | null; onTap: (r: ParamId, p: PlayerId) => void }) {
  const m = useRef<THREE.Mesh>(null);
  const cur = useRef(0.04);
  useFrame((_, dt) => {
    const target = level ? H[level] : 0.04;
    cur.current += (target - cur.current) * Math.min(1, dt * 9);
    const o = m.current;
    if (!o) return;
    o.scale.y = cur.current;
    o.position.y = cur.current / 2 + 0.06;
  });
  const color = level ? COL[level] : "#FFFFFF";
  return (
    <group position={[px(i), 0, pz(j)]}>
      {/* tile */}
      <mesh
        position={[0, 0.04, 0]}
        material={flatMat(player === "eb" ? "#FFD9BF" : "#F7EBDD")}
        receiveShadow
        onClick={(e) => {
          e.stopPropagation();
          onTap(row, player);
        }}
      >
        <boxGeometry args={[0.8, 0.04, 0.66]} />
      </mesh>
      <mesh
        ref={m}
        castShadow
        onClick={(e) => {
          e.stopPropagation();
          onTap(row, player);
        }}
        onPointerOver={() => (document.body.style.cursor = "pointer")}
        onPointerOut={() => (document.body.style.cursor = "")}
      >
        <boxGeometry args={[0.5, 1, 0.42]} />
        <meshStandardMaterial color={color} roughness={0.5} transparent={!locked && !!level} opacity={!locked && level ? 0.82 : 1} emissive={mark ? (mark === "edge" ? "#FF5C00" : "#C0392B") : "#000000"} emissiveIntensity={mark ? 0.45 : 0} />
      </mesh>
      {level && <Label lines={[level === "Medium" ? "MED" : level.toUpperCase()]} width={0.46} height={0.14} position={[0, 0.06 + H[level] + 0.1, 0.22]} rotation={[-0.5, 0, 0]} o={{ bg: "#2F1C1A", fg: "#FFF5EE", weight: 700 }} px={256} />}
    </group>
  );
}

/** A sweeping light cone, or one parked over a found cell. */
function Spot({ mode, at }: { mode: "off" | "sweep" | "park"; at: [number, number] | null }) {
  const g = useRef<THREE.Group>(null);
  const light = useRef<THREE.SpotLight>(null);
  const tgt = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }, dt) => {
    const o = g.current;
    if (!o) return;
    let x = px(0);
    let z = pz(0);
    if (mode === "sweep") {
      const t = clock.elapsedTime * 0.45;
      const j = (Math.sin(t) * 0.5 + 0.5) * 5;
      const i = (Math.sin(t * 2.3) * 0.5 + 0.5) * 3;
      x = px(i);
      z = pz(j);
    } else if (mode === "park" && at) {
      x = px(at[0]);
      z = pz(at[1]);
    }
    o.position.x += (x - o.position.x) * Math.min(1, dt * 4);
    o.position.z += (z - o.position.z) * Math.min(1, dt * 4);
    tgt.position.set(o.position.x, 0, o.position.z);
    tgt.updateMatrixWorld();
  });
  if (mode === "off") return null;
  return (
    <>
      <group ref={g} position={[px(0), 0, pz(0)]}>
        <mesh position={[0, 1.6, 0]}>
          <coneGeometry args={[0.55, 3.2, 24, 1, true]} />
          <meshBasicMaterial color="#FFF1C9" transparent opacity={0.16} depthWrite={false} side={THREE.DoubleSide} toneMapped={false} />
        </mesh>
        <spotLight ref={light} position={[0, 3.6, 0]} angle={0.28} penumbra={0.6} intensity={18} distance={7} color="#FFE7B0" target={tgt} />
      </group>
      <primitive object={tgt} />
    </>
  );
}

/* ── the game ─────────────────────────────────────────────────── */

const STEPS = ["Build the matrix", "Point at the edge", "Explain the edge", "Point at the gap", "Explain the gap"];

export default function CapabilityTowers({ onDone }: { onDone: (summary: string) => void }) {
  const compact = useMediaQuery("(max-width: 767px)");
  const [seed, setSeed] = useState(0);
  const deck = useMemo(() => makeDeck(), [seed]); // eslint-disable-line react-hooks/exhaustive-deps
  const [ci, setCi] = useState(0);
  const [cells, setCells] = useState<Record<string, Cell>>({});
  const [locked, setLocked] = useState<Record<string, boolean>>({});
  const [step, setStep] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [feedback, setFeedback] = useState<Feedback>(null);
  const [edgeLine, setEdgeLine] = useState("");
  const [gapLine, setGapLine] = useState("");
  const [found, setFound] = useState<{ edge?: [number, number]; gap?: [number, number] }>({});
  const [binned, setBinned] = useState(0);

  const card = deck[ci];

  const reset = () => {
    setSeed((s) => s + 1);
    setCi(0);
    setCells({});
    setLocked({});
    setStep(0);
    setMistakes(0);
    setFeedback(null);
    setEdgeLine("");
    setGapLine("");
    setFound({});
    setBinned(0);
  };

  const advanceCard = () => {
    if (ci + 1 >= deck.length) {
      setStep(1);
      setFeedback({ tone: "good", text: "The whole K-Matrix stands. The spotlight is sweeping the board: find the one cell that is Eat Better's unique edge, and tap that pillar." });
    }
    setCi((c) => c + 1);
  };

  const tap = (r: ParamId, p: PlayerId) => {
    const k = key(r, p);
    if (step === 0) {
      if (locked[k]) {
        setFeedback({ tone: "info", text: `That pillar (${PNAME[p]} · ${RNAME[r]}) is already locked in.` });
        return;
      }
      setCells((s) => ({ ...s, [k]: NEXT[s[k] ?? "none"] }));
      return;
    }
    if (step === 1 || step === 3) {
      const want: ParamId = step === 1 ? "sweet" : "price";
      if (r === want && p === "eb") {
        setFound((f) => ({ ...f, [step === 1 ? "edge" : "gap"]: [0, ROWS.indexOf(r)] }));
        setStep(step + 1);
        setFeedback({
          tone: "good",
          text:
            step === 1
              ? "Natural Sweetening Innovation: Eat Better is High, Gourmet Health Competitors only Medium, the other two Low. Nobody else matches it here. Now put that in your own words."
              : "Mass-Market Price Accessibility: Eat Better is Medium while Traditional Snack Brands and Local Sweet Outlets are High. Now put that in your own words.",
        });
        return;
      }
      setMistakes((m) => m + 1);
      const row = KMATRIX.find((x) => x.id === r)!;
      if (p !== "eb") {
        setFeedback({ tone: "bad", text: `That pillar is ${PNAME[p]}'s. ${step === 1 ? "An edge" : "A gap"} is read in Eat Better's own column, by comparing it with the other three in the same row.` });
        return;
      }
      if (step === 1) {
        const alsoHigh = PIDS.filter((x) => x !== "eb" && row.v[x] === "High").map((x) => PNAME[x]);
        setFeedback({
          tone: "bad",
          text: row.v.eb !== "High" ? `Eat Better is only ${row.v.eb} on ${row.param}, so it can't be an edge.` : `${row.param}: Eat Better is High, but so ${alsoHigh.length === 1 ? "is" : "are"} ${alsoHigh.join(" and ")}. Shared strength, not a unique edge.`,
        });
      } else {
        setFeedback({ tone: "bad", text: `On ${row.param} Eat Better is ${row.v.eb}, and nobody is above it. A gap is a row where Eat Better sits below its rivals.` });
      }
    }
  };

  const lockCard = () => {
    if (!card) return;
    const changed = Object.keys(cells).filter((k) => !locked[k] && cells[k]);
    if (card.kind === "decoy") {
      setMistakes((m) => m + 1);
      setCells((s) => Object.fromEntries(Object.entries(s).filter(([k]) => locked[k])));
      setFeedback({
        tone: "bad",
        text: `This card is a price tier from the market comparison table, not a K-Matrix rating: it has no High/Medium/Low for any row. Price shows up in the K-Matrix only as "Mass-Market Price Accessibility", which rates how affordable a player is for everyday families, so a ${MARKET.find((m) => m.id === card.player)!.tier} tier is not the same thing. Bin it.`,
      });
      return;
    }
    const row = KMATRIX.find((x) => x.id === card.row)!;
    const wrongRow = changed.filter((k) => !k.startsWith(`${card.row}:`));
    const wrongCells = PIDS.filter((p) => cells[key(card.row, p)] !== row.v[p]);
    if (changed.length === 0) {
      setFeedback({ tone: "info", text: "Raise the four pillars in this card's row first: tap a pillar to go Low → Medium → High." });
      return;
    }
    if (wrongRow.length || wrongCells.length) {
      setMistakes((m) => m + 1);
      const parts: string[] = [];
      if (wrongRow.length) parts.push(`You raised pillars in another row (${[...new Set(wrongRow.map((k) => KMATRIX.find((x) => x.id === k.split(":")[0])!.short))].join(", ")}); this card is only about "${row.param}". Those were taken back down.`);
      if (wrongCells.length) parts.push(wrongCells.map((p) => `${PNAME[p]}: the card says ${row.v[p]}, you built ${cells[key(card.row, p)] ?? "nothing"}`).join("; ") + ".");
      setCells((s) => Object.fromEntries(Object.entries(s).filter(([k]) => locked[k] || k.startsWith(`${card.row}:`))));
      setFeedback({ tone: "bad", text: parts.join(" ") });
      return;
    }
    setLocked((s) => ({ ...s, ...Object.fromEntries(PIDS.map((p) => [key(card.row, p), true])) }));
    setFeedback({ tone: "good", text: `${row.short} row locked in.` });
    advanceCard();
  };

  const binCard = () => {
    if (!card) return;
    if (card.kind === "row") {
      setMistakes((m) => m + 1);
      setFeedback({ tone: "bad", text: `This card quotes a K-Matrix row: "${RNAME[card.row]}", with a High/Medium/Low rating for each player. It belongs on the board. Build it.` });
      return;
    }
    const changed = Object.keys(cells).filter((k) => !locked[k] && cells[k]);
    if (changed.length) setCells((s) => Object.fromEntries(Object.entries(s).filter(([k]) => locked[k])));
    setBinned((b) => b + 1);
    setFeedback({ tone: "good", text: "Right, a price tier is a different table. It tells you the price band, not a capability rating." });
    advanceCard();
  };

  const edgeChecks = [
    { ok: has(edgeLine, /date|dry.?fruit|natural|sweeten/), label: "Names the edge (natural sweetening with dates / dry fruits)" },
    { ok: has(edgeLine, /only|nobody|no one|no other|others|rivals|competitors|traditional|health|local|medium|low/), label: "Compares with the others in that row" },
    { ok: words(edgeLine) >= 8, label: "At least 8 words" },
  ];
  const gapChecks = [
    { ok: has(gapLine, /price|afford|cheap|mass|budget|cost/), label: "Names the gap (mass-market price accessibility)" },
    { ok: has(gapLine, /traditional|local|sweet|rivals|others|competitors|high|haldiram|bikaji|mithai/), label: "Says who is ahead of Eat Better there" },
    { ok: has(gapLine, /medium|lower|less|below|behind|premium/), label: "Says where Eat Better sits (Medium)" },
    { ok: words(gapLine) >= 8, label: "At least 8 words" },
  ];

  const submitEdge = () => {
    if (!edgeChecks.every((c) => c.ok)) return;
    setStep(3);
    setFeedback({ tone: "info", text: "Now the opposite: tap the pillar in Eat Better's column where it sits below the rivals. That is its capability gap." });
  };
  const submitGap = () => {
    if (!gapChecks.every((c) => c.ok)) return;
    setStep(5);
    setFeedback({ tone: "good", text: "Matrix built, edge and gap named. A K-Matrix is only useful when you read it across a row, not down one column." });
    onDone(`Built the K-Matrix (6 rows × 4 players, binned ${binned} price-tier decoys). Edge: ${edgeLine.trim()} Gap: ${gapLine.trim()}`);
  };

  const spotMode = step === 0 ? "off" : step === 1 || step === 3 ? "sweep" : "park";
  const spotAt = step === 2 ? found.edge ?? null : step >= 4 ? found.gap ?? null : null;
  const done = step >= 5;

  return (
    <GameFrame
      kicker="Activity 2 · 3D build"
      title="Capability Towers"
      mission="Build the chapter's K-Matrix as towers: tap a pillar to raise it Low → Medium → High, one evidence card at a time. Some cards are not K-Matrix ratings at all: bin those. Then use the spotlight to find Eat Better's unique edge and its gap."
      steps={STEPS}
      step={step}
      stars={done ? starsFor(mistakes) : undefined}
      onReset={reset}
      feedback={feedback}
      note={{ real: "Every row card and price-tier card quotes the chapter's own tables (how this chapter compares the four kinds of seller).", practice: "The order of the cards, and which price-tier decoys appear, change on every restart.", tip: "Columns are players, rows are what customers choose by. An edge or a gap only shows up when you compare across a row." }}
    >
      {/* evidence card */}
      {step === 0 && card && (
        <div className="mb-3 rounded-2xl border border-cocoa bg-cream p-4 shadow-[2px_2px_0_0_#2f1c1a]" data-testid="ct-card">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="inline-flex items-center gap-1.5 text-[0.75rem] font-extrabold uppercase tracking-[0.12em] text-orange">
              <Layers className="size-4" /> Evidence card {ci + 1} of {deck.length}
            </span>
            <span className="text-[0.8rem] font-bold text-cocoa-2">Quoted from the chapter</span>
          </div>
          {card.kind === "row" ? (
            <>
              <div className="mt-2 font-display text-[1.15rem] font-semibold leading-snug text-cocoa">{RNAME[card.row]}</div>
              <ul className="mt-2 grid gap-1 sm:grid-cols-2">
                {card.order.map((p) => (
                  <li key={p} className="flex items-baseline justify-between gap-2 rounded-lg bg-white px-3 py-1.5 text-[0.95rem] text-cocoa">
                    <span>{PNAME[p]}</span>
                    <strong>{KMATRIX.find((x) => x.id === card.row)!.v[p]}</strong>
                  </li>
                ))}
              </ul>
            </>
          ) : (
            <div className="mt-2 font-display text-[1.15rem] font-semibold leading-snug text-cocoa">{card.text}</div>
          )}
        </div>
      )}

      <Stage3D design={2.2}
        label="A board of pillars: six capability rows by four players. Pillar height shows Low, Medium or High."
        camera={{ position: [0, 6, 6], fov: 40 }}
        height={compact ? "420px" : "clamp(380px, 60vh, 540px)"}
        overlay={
          <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
            {step === 0 && <span className="rounded-full bg-cocoa/90 px-3 py-1 text-[0.8rem] font-extrabold text-cream">Tap a pillar to raise it</span>}
            {(step === 1 || step === 3) && <span className="rounded-full bg-orange px-3 py-1 text-[0.8rem] font-extrabold text-white">{step === 1 ? "Tap Eat Better's unique edge" : "Tap Eat Better's gap"}</span>}
          </div>
        }
      >
        <FitRig center={[-0.35, 0.3, 0.05]} dir={[0, 1, 0.95]} width={compact ? 5.6 : 6.6} height={compact ? 6.4 : 5.4} minDist={6} />
        <StageLights shadows={!compact} />
        <Floor color="#EAD7C2" />
        {/* board */}
        <mesh position={[-0.35, 0.01, 0.0]} material={flatMat("#FFFFFF", 0.8)} receiveShadow>
          <boxGeometry args={[6.4, 0.02, 5.1]} />
        </mesh>
        {/* Eat Better column strip */}
        <mesh position={[px(0), 0.025, 0]} material={flatMat("#FF5C00", 0.6)}>
          <boxGeometry args={[0.9, 0.012, 4.85]} />
        </mesh>
        {K_PLAYERS.map((p, i) => (
          <Label key={p.id} lines={p.short.split(" ")} width={0.9} height={0.42} position={[px(i), 0.4, Z0 - 0.6]} o={{ bg: p.id === "eb" ? "#FF5C00" : "#2F1C1A", fg: "#FFF5EE", weight: 600 }} px={256} />
        ))}
        {KMATRIX.map((k, j) => (
          <Label key={k.id} lines={[k.short]} width={2.2} height={0.36} position={[-2.25, 0.03, pz(j)]} rotation={[-Math.PI / 2, 0, 0]} o={{ bg: "#F6E3CF", fg: "#2F1C1A", weight: 600, align: "left" }} />
        ))}
        {KMATRIX.map((k, j) =>
          PIDS.map((p, i) => (
            <Pillar key={key(k.id, p)} row={k.id} j={j} player={p} i={i} level={cells[key(k.id, p)] ?? null} locked={!!locked[key(k.id, p)]} mark={found.edge && k.id === "sweet" && p === "eb" ? "edge" : found.gap && k.id === "price" && p === "eb" ? "gap" : null} onTap={tap} />
          )),
        )}
        <Spot mode={spotMode} at={spotAt} />
      </Stage3D>

      {/* keyboard / screen-reader access to the same pillars */}
      <div className="sr-only">
        {KMATRIX.map((k) =>
          PIDS.map((p) => (
            <button key={key(k.id, p)} data-testid={`ct-p-${k.id}-${p}`} onClick={() => tap(k.id, p)}>
              {`Pillar: ${PNAME[p]}, ${k.param}, now ${cells[key(k.id, p)] ?? "not built"}`}
            </button>
          )),
        )}
      </div>

      {step === 0 && card && (
        <div className="mt-3 flex flex-wrap gap-2">
          <button data-testid="ct-lock" onClick={lockCard} className="eb-btn eb-btn-primary inline-flex items-center gap-2">
            <Lock className="size-4" /> Lock this card into the matrix
          </button>
          <button data-testid="ct-bin" onClick={binCard} className="eb-btn eb-btn-secondary inline-flex items-center gap-2">
            <Trash2 className="size-4" /> Bin it: not a K-Matrix rating
          </button>
        </div>
      )}

      {step === 2 && (
        <div className="mt-4 grid gap-2 rounded-2xl bg-cream p-4">
          <label className="font-display text-[1.05rem] font-semibold text-cocoa" htmlFor="ct-edge">
            In one line: what is Eat Better&apos;s unique edge, and how do you know from the matrix?
          </label>
          <textarea id="ct-edge" data-testid="ct-edge" rows={2} value={edgeLine} onChange={(e) => setEdgeLine(e.target.value)} className="w-full rounded-xl border-2 border-cocoa/20 bg-white px-3 py-2 text-[1rem] text-cocoa outline-none focus:border-orange" placeholder="Eat Better's edge is…" />
          <ul className="grid gap-1.5 sm:grid-cols-3">
            {edgeChecks.map((c) => (
              <CheckRow key={c.label} ok={c.ok} label={c.label} />
            ))}
          </ul>
          <button data-testid="ct-edge-go" onClick={submitEdge} disabled={!edgeChecks.every((c) => c.ok)} className="eb-btn eb-btn-primary justify-self-start disabled:opacity-50">
            Save the edge
          </button>
        </div>
      )}

      {step === 4 && (
        <div className="mt-4 grid gap-2 rounded-2xl bg-cream p-4">
          <label className="font-display text-[1.05rem] font-semibold text-cocoa" htmlFor="ct-gap">
            In one line: where is Eat Better&apos;s capability gap, and who is ahead of it there?
          </label>
          <textarea id="ct-gap" data-testid="ct-gap" rows={2} value={gapLine} onChange={(e) => setGapLine(e.target.value)} className="w-full rounded-xl border-2 border-cocoa/20 bg-white px-3 py-2 text-[1rem] text-cocoa outline-none focus:border-orange" placeholder="Eat Better's gap is…" />
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {gapChecks.map((c) => (
              <CheckRow key={c.label} ok={c.ok} label={c.label} />
            ))}
          </ul>
          <button data-testid="ct-gap-go" onClick={submitGap} disabled={!gapChecks.every((c) => c.ok)} className="eb-btn eb-btn-primary justify-self-start disabled:opacity-50">
            Save the gap
          </button>
        </div>
      )}
    </GameFrame>
  );
}
