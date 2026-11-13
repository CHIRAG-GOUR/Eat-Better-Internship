"use client";

import { useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame, useThree } from "@react-three/fiber";
import { Copy, Undo2 } from "lucide-react";
import { Stage3D } from "@/components/play/Stage3D";
import { GameFrame, starsFor, type Feedback } from "@/components/play/GameFrame";
import { Human } from "@/components/world2/Human";
import { EndCard, FitCam, Hearts, Label, PEOPLE, Reactor, Room, Stat, pick, shuffle, type Mood } from "./kit";

/**
 * Shark Tank: "Clone the slice". A founder asks for money in return for a slice of the company. The student uses
 * clone machines (x2, x5, x10 - both the slice AND the money grow by the same factor) until the slices add up to
 * exactly 100% of the company. The money stacked at that moment is the valuation. Overshoot 100% and the tank
 * cracks and the sharks lose patience. The last pitch is the real ask from the chapter (Rs 50 lakh for 0.5%).
 */

type Pitch = { name: string; real: boolean; eq4: number; lakh: number }; // eq4 = equity in quarter-percent units
const fmtLakh = (lakh: number) => {
  if (lakh >= 100) {
    const cr = lakh / 100;
    return `Rs ${cr.toLocaleString("en-IN", { maximumFractionDigits: cr < 10 ? 2 : 1 })} crore`;
  }
  return `Rs ${lakh.toLocaleString("en-IN", { maximumFractionDigits: 1 })} lakh`;
};
const fmtPct = (eq4: number) => `${eq4 / 4}%`;

const NAMES = ["Masala Mix Co", "Jaggery Jar", "Millet Munch", "Tiffin Treats", "Ragi Rolls", "Chutney Club", "Laddoo Lab", "Papad Planet"];
const EASY = [40, 20, 16]; // 10%, 5%, 4%
const MID = [10, 8, 4]; // 2.5%, 2%, 1%
const HARD = [1, 4, 10]; // 0.25%, 1%, 2.5%
const ASKS = [5, 10, 12, 15, 20, 25, 40, 60, 75];

function makePitches(): Pitch[] {
  const names = shuffle(NAMES);
  const mk = (pool: number[], i: number): Pitch => ({ name: names[i], real: false, eq4: pick(pool), lakh: pick(ASKS) });
  const p = [mk(EASY, 0), mk(MID, 1), mk(HARD, 2)];
  return [...p, { name: "Eat Better Co", real: true, eq4: 2, lakh: 50 }];
}

const FACTORS = [2, 5, 10] as const;

function Tank({ share, bust, kick }: { share: number; bust: boolean; kick: number }) {
  const fill = useRef<THREE.Mesh>(null);
  const cur = useRef(0);
  useFrame((_, dt) => {
    const target = Math.max(0.05, Math.min(share, 400) / 400) * 3;
    cur.current += (target - cur.current) * (1 - Math.exp(-dt * 7));
    if (fill.current) {
      fill.current.scale.y = cur.current;
      fill.current.position.y = cur.current / 2;
    }
  });
  return (
    <Reactor mood="sad" kick={kick}>
      <mesh position={[0, 1.5, 0]}>
        <boxGeometry args={[1.3, 3.05, 1]} />
        <meshStandardMaterial color="#9fd0ff" transparent opacity={0.3} />
      </mesh>
      <mesh ref={fill} position={[0, 0.05, 0]}>
        <boxGeometry args={[1.2, 1, 0.9]} />
        <meshStandardMaterial color={bust ? "#d33" : "#FF5C00"} roughness={0.5} />
      </mesh>
      <mesh position={[0, 3.02, 0.52]}>
        <boxGeometry args={[1.4, 0.05, 0.05]} />
        <meshBasicMaterial color="#2f1c1a" />
      </mesh>
    </Reactor>
  );
}

function Coins({ n }: { n: number }) {
  const geo = useMemo(() => new THREE.CylinderGeometry(0.34, 0.34, 0.08, 18), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#E8B923", metalness: 0.5, roughness: 0.35 }), []);
  return (
    <group>
      {Array.from({ length: n }, (_, i) => (
        <mesh key={i} geometry={geo} material={mat} position={[((i * 7) % 3) * 0.03, 0.05 + i * 0.09, 0]} />
      ))}
    </group>
  );
}

type SceneProps = { share: number; lakh: number; whole: boolean; bust: boolean; mood: Mood; kick: number; bubble: string; tankKick: number; name: string };

function Scene({ share, lakh, whole, bust, mood, kick, bubble, tankKick, name }: SceneProps) {
  const { size } = useThree();
  const wide = size.width / size.height > 1.3;
  const sx = (i: number) => (wide ? -4.2 + i * 1.15 : -3.1 + i * 0.95);
  const tx = wide ? 3.5 : 2.5;
  const coins = Math.min(24, 1 + Math.round(Math.log2(Math.max(1, lakh)) * 2.2));
  return (
    <>
      {wide ? <FitCam width={10.6} height={4.6} cy={1.7} /> : <FitCam width={8.6} height={4.6} cy={1.7} />}
      <ambientLight intensity={1.1} />
      <directionalLight position={[3, 6, 5]} intensity={1.2} />
      <Room floor="#d9b48a" wall="#2f1c1a" />
      {/* the sharks behind their desk */}
      {[0, 1, 2, 3].map((i) => (
        <Reactor key={i} mood={mood} kick={kick} position={[sx(i), 0, -0.9]} rotation={[0, 0.25, 0]}>
          <Human look={PEOPLE[[1, 0, 5, 3][i]]} mode="stand" phase={i} />
        </Reactor>
      ))}
      <mesh position={[sx(1.5), 0.45, -0.25]}>
        <boxGeometry args={[wide ? 5 : 4, 0.9, 0.7]} />
        <meshStandardMaterial color="#6b3f2a" roughness={0.7} />
      </mesh>
      {/* practice founder */}
      <Reactor mood={mood} kick={kick} position={[wide ? 0.6 : -0.2, 0, 1]} rotation={[0, -0.5, 0]}>
        <Human look={PEOPLE[2]} mode="stand" />
      </Reactor>
      <Label position={[wide ? 0.6 : -0.2, 2.15, 1]} text={name} bg="#FED300" h={0.2} />
      {bubble && <Label position={[wide ? -2.2 : -1.4, 2.5, -0.5]} text={bubble} bg="#fff" h={0.22} />}
      {/* the company tank + money */}
      <group position={[tx, 0, 0.4]}>
        <Tank share={share} bust={bust} kick={tankKick} />
        <Label position={[0, 3.45, 0.4]} text={`Whole company = 100%`} bg={whole ? "#2e9e6a" : "#fff"} fg={whole ? "#fff" : "#2f1c1a"} h={0.2} />
        <Label position={[0, -0.28, 0.6]} text={`Slice ${fmtPct(share)}`} bg="#fff" h={0.2} />
      </group>
      <group position={[tx - 1.5, 0, 0.9]}>
        <Coins n={coins} />
        <Label position={[0, 0.5 + coins * 0.09 + 0.3, 0]} text={fmtLakh(lakh)} bg="#E8B923" h={0.2} />
      </group>
    </>
  );
}

export default function ValuationGame({ onWin }: { onWin: () => void }) {
  const [pitches, setPitches] = useState<Pitch[]>(() => makePitches());
  const [round, setRound] = useState(0);
  const [mult, setMult] = useState<number[]>([]);
  const [lives, setLives] = useState(3);
  const [busts, setBusts] = useState(0);
  const [phase, setPhase] = useState<"play" | "cleared" | "won" | "lost">("play");
  const [bust, setBust] = useState(false);
  const [fb, setFb] = useState<Feedback>(null);
  const [mood, setMood] = useState<Mood>("idle");
  const [kick, setKick] = useState(0);
  const [tankKick, setTankKick] = useState(0);
  const [bubble, setBubble] = useState("");

  const pt = pitches[round];
  const factor = mult.reduce((a, b) => a * b, 1);
  const share = pt.eq4 * factor;
  const lakh = pt.lakh * factor;
  const whole = share === 400;
  const stars = starsFor(busts);

  const react = (m: Mood, text: string) => {
    setMood(m);
    setKick((k) => k + 1);
    setBubble(text);
  };

  const clone = (f: number) => {
    if (phase !== "play") return;
    const next = share * f;
    if (next > 400) {
      const left = lives - 1;
      setLives(left);
      setBusts((b) => b + 1);
      setBust(true);
      setTankKick((k) => k + 1);
      setTimeout(() => setBust(false), 700);
      setMult([]);
      react("sad", "Too much!");
      setFb({
        tone: "bad",
        text: `x${f} on ${fmtPct(share)} makes ${fmtPct(next)}, more than the whole company (100%). Slices of ${fmtPct(pt.eq4)} fit into 100% exactly ${400 / pt.eq4} times: that is the number to build up to.`,
      });
      if (left <= 0) {
        setPhase("lost");
        react("sad", "We're out.");
      }
      return;
    }
    setMult((m) => [...m, f]);
    if (next === 400) {
      const v = pt.lakh * (400 / pt.eq4);
      setPhase(round === pitches.length - 1 ? "won" : "cleared");
      react("cheer", fmtLakh(v) + "?!");
      setFb({
        tone: "good",
        text: `${400 / pt.eq4} slices of ${fmtPct(pt.eq4)} make the whole company, and ${400 / pt.eq4} lots of ${fmtLakh(pt.lakh)} make ${fmtLakh(v)}. Each clone grew the share and the money by the same factor, so the ratio never changed: valuation = money asked ÷ share offered.`,
      });
      if (round === pitches.length - 1) onWin();
    } else {
      setFb(null);
      react("lean", "Hmm…");
    }
  };

  const undo = () => {
    if (phase !== "play" || !mult.length) return;
    setMult((m) => m.slice(0, -1));
    setFb(null);
  };
  const nextRound = () => {
    setRound((r) => r + 1);
    setMult([]);
    setPhase("play");
    setFb(null);
    react("idle", "Next pitch!");
  };
  const reset = () => {
    setPitches(makePitches());
    setRound(0);
    setMult([]);
    setLives(3);
    setBusts(0);
    setPhase("play");
    setFb(null);
    setBubble("");
    setMood("idle");
  };

  return (
    <GameFrame
      kicker="Activity · What was the company worth?"
      title="Shark Tank: clone the slice"
      mission="A founder asks for money in return for a slice of the company. Clone the slice (the money grows with it) until the slices fill the whole company, 100%. The money you end up with is the valuation."
      steps={pitches.map((p, i) => (p.real ? "The real ask" : `Pitch ${i + 1}`))}
      step={phase === "won" ? pitches.length : round}
      stars={phase === "won" ? stars : undefined}
      onReset={reset}
      feedback={fb}
      note={{
        real: "In Shark Tank India, Season 4 the founders asked for Rs 50 lakh for 0.5% equity, a Rs 100 crore valuation (chapter timeline).",
        practice: "The other pitches (company names, asks and shares) are made up for practice and change every game. These are not real offers.",
        tip: "Whatever you clone, ask ÷ share stays the same. That ratio is the valuation.",
      }}
    >
      <Stage3D label="A 3D Shark Tank stage with four sharks, a founder, a company tank that fills as slices are cloned, and a pile of coins" camera={{ position: [0, 2, 9], fov: 42 }} height="clamp(300px, 52vh, 500px)" background="#2f1c1a"
        overlay={
          <div className="flex items-start justify-between gap-2 p-2">
            <div className="flex flex-wrap gap-1.5">
              <Stat label="Asking" value={`${fmtLakh(pt.lakh)} for ${fmtPct(pt.eq4)}`} />
              <Stat label="Cloned" value={`x${factor}`} tone="orange" />
            </div>
            <div className="rounded-xl bg-white/90 px-2 py-1">
              <Hearts n={lives} label="sharks' patience" />
            </div>
          </div>
        }
      >
        <Scene share={share} lakh={lakh} whole={whole} bust={bust} mood={mood} kick={kick} bubble={bubble} tankKick={tankKick} name={pt.real ? "Eat Better (real ask)" : pt.name + " (practice)"} />
      </Stage3D>

      {phase === "play" && (
        <div className="mt-3 flex flex-wrap items-center gap-2" role="group" aria-label="Clone machines">
          {FACTORS.map((f) => (
            <button key={f} data-testid={`clone-${f}`} onClick={() => clone(f)} className="eb-btn eb-btn-primary !normal-case">
              <Copy className="size-4" /> Clone x{f}
            </button>
          ))}
          <button data-testid="clone-undo" onClick={undo} disabled={!mult.length} className="eb-btn eb-btn-secondary !normal-case">
            <Undo2 className="size-4" /> Undo last
          </button>
          <span className="text-[0.95rem] text-cocoa-2">Slice now {fmtPct(share)} = {fmtLakh(lakh)}</span>
        </div>
      )}
      {phase === "cleared" && (
        <button data-testid="next-pitch" onClick={nextRound} className="eb-btn eb-btn-primary mt-3 !normal-case">
          Next pitch
        </button>
      )}
      {phase === "won" && (
        <EndCard won stars={stars} onRestart={reset} title="Valuation: Rs 100 crore" body="The sharks are impressed: you built the whole company out of slices and found the number the founders asked the sharks to believe in.">
          <p className="mt-3 rounded-xl bg-peach/70 p-3 text-[1rem] leading-relaxed text-cocoa">
            <strong>Equity or royalty?</strong> With equity, an investor owns a share of the company. With a royalty, the investor gets a small share of sales until their money has been paid back. The founders chose Namita Thapar’s offer, which included a 1% royalty until her investment was recouped. <span className="text-cocoa-2">(general explanation)</span>
          </p>
        </EndCard>
      )}
      {phase === "lost" && <EndCard won={false} title="The sharks walked out" body="Three times the slice grew past 100% of the company. Divide 100% by the slice first: that tells you how many clones you need." onRestart={reset} />}
    </GameFrame>
  );
}
