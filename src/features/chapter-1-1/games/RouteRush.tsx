"use client";

import { useCallback, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { RoundedBox } from "@/components/three/RoundedBox";
import { ArrowLeftRight, Globe2, MessageCircle, Package, Tag } from "lucide-react";
import { Stage3D } from "@/components/play/Stage3D";
import { GameFrame, starsFor, type Feedback } from "@/components/play/GameFrame";
import { Human, type HumanLook } from "@/components/world2/Human";
import { useMediaQuery } from "@/lib/useClient";
import { D2C } from "../content";
import { FitRig, Ground, Hearts, Label, Lights, Parcel, PracticeTag, Probe, ScorePill, StageCard, StarRow, Ticker, along, flatMat, pathLength, shuffle, type V3 } from "./kit";

/**
 * Route Rush — one kitchen, two roads. Parcels roll out of the kitchen towards a set of railway-style points.
 * The student flips the points (tap a road, the lever, or the button) so each parcel takes the road that
 * actually gets its job done. Stops caption what happens there (the old simulator), feedback bubbles fly back
 * (straight to the kitchen on the D2C road, stuck at the shop on the shop road), and each D2C advantage from the
 * chapter unlocks when the student proves it. General "shop is better here" parcels are decoys, so
 * "always pick D2C" loses lives.
 */

type Road = "shop" | "d2c";
type Kind = "reach" | "feedback" | "control" | "now" | "see" | "gift";
type AdvId = "feedback" | "reach" | "control";

const SC = Object.fromEntries(D2C.scenarios.map((s) => [s.id, s])) as Record<AdvId, (typeof D2C.scenarios)[number]>;
const ADV = Object.fromEntries(D2C.advantages.map((a) => [a.id, a])) as Record<AdvId, (typeof D2C.advantages)[number]>;

const KINDS: Record<Kind, { short: string; tag: string; right: Road; adv?: AdvId; general?: boolean; far?: boolean; good: string; wrong: string }> = {
  reach: { short: "Far city", tag: SC.reach.prompt.replace(/ Which route.*$/, ""), right: "d2c", adv: "reach", far: true, good: SC.reach.d2cOutcome, wrong: SC.reach.traditionalOutcome },
  feedback: { short: "New namkeen", tag: "A new namkeen is going out. If a customer finds it a little too spicy, the kitchen needs to hear it first-hand.", right: "d2c", adv: "feedback", good: SC.feedback.d2cOutcome, wrong: SC.feedback.traditionalOutcome },
  control: { short: "Brand story", tag: "The brand wants this customer to see its packaging and hear its story exactly the way it intended.", right: "d2c", adv: "control", good: SC.control.d2cOutcome, wrong: SC.control.traditionalOutcome },
  now: { short: "Right now", tag: "A shopper standing near a shop wants a snack right now and doesn't want to wait for delivery.", right: "shop", general: true, good: "The pack is right there on the shop shelf, so a shopper who wants it now doesn't wait for delivery.", wrong: "A delivery takes time to arrive. Someone who wants a snack right now buys it off a shop shelf." },
  see: { short: "See it first", tag: "This shopper likes to see a product in person before trying a new brand.", right: "shop", general: true, good: "On a shop shelf they can pick the pack up and look at it before trying a new brand.", wrong: "A website can't put the pack in their hands before they buy. This shopper wanted to see it in person first." },
  gift: { short: "Gift far away", tag: "Someone wants a snack box sent as a gift to a relative in a far-away town where no shop stocks the brand.", right: "d2c", general: true, far: true, good: "Ordered on the website, it ships from one kitchen to any address, even somewhere no shop stocks it.", wrong: SC.reach.traditionalOutcome },
};

/* ── layout (desktop orientation; phones rotate the whole board) ── */

const K: V3 = [-5.7, 0, 0];
const FORK: V3 = [-2.9, 0, 0];
const SA: V3 = [-2.2, 0, -1.9];
const DIST: V3 = [-0.9, 0, -1.9];
const SHOP: V3 = [1.7, 0, -1.9];
const WALKIN: V3 = [3.3, 0, -1.5];
const DA: V3 = [-2.2, 0, 1.9];
const WEB: V3 = [-0.9, 0, 1.9];
const VAN: V3 = [1.5, 0, 1.9];
const HOME: V3 = [3.5, 0, 1.9];
const FARJ: V3 = [3.4, 0, 0.35];
const FAR: V3 = [5.3, 0, -0.1];
const BACKSHELF: V3 = [1.7, 0, -2.75];

const STOP_TEXT = {
  dist: D2C.routes.traditional.stops[1],
  shop: D2C.routes.traditional.stops[2],
  web: D2C.routes.d2c.stops[1],
  van: D2C.routes.d2c.stops[2],
};

type Stop = { i: number; text: string };
function routeFor(kind: Kind | "demo", road: Road): { path: V3[]; stops: Stop[] } {
  const far = kind !== "demo" && KINDS[kind].far;
  if (road === "shop") {
    if (far) return { path: [FORK, SA, DIST], stops: [{ i: 2, text: STOP_TEXT.dist.text }] };
    if (kind === "control") return { path: [FORK, SA, DIST, SHOP, BACKSHELF], stops: [{ i: 2, text: STOP_TEXT.dist.text }, { i: 3, text: STOP_TEXT.shop.text }] };
    return { path: [FORK, SA, DIST, SHOP, WALKIN], stops: [{ i: 2, text: STOP_TEXT.dist.text }, { i: 3, text: STOP_TEXT.shop.text }] };
  }
  const stops = [{ i: 2, text: STOP_TEXT.web.text }, { i: 3, text: STOP_TEXT.van.text }];
  if (far) return { path: [FORK, DA, WEB, VAN, FARJ, FAR], stops };
  return { path: [FORK, DA, WEB, VAN, HOME], stops };
}

type Level = { name: string; kinds: Kind[]; speed: number; dock: number; gap: number };
function makeLevels(): Level[] {
  const pick = <T,>(a: T[]) => a[Math.floor(Math.random() * a.length)];
  return [
    { name: "Reach", kinds: shuffle<Kind>(["reach", "now", pick<Kind>(["gift", "see"]), "reach"]), speed: 0.36, dock: 1.6, gap: 1.0 },
    { name: "Listen", kinds: shuffle<Kind>(["feedback", "see", "feedback", pick<Kind>(["now", "gift", "reach"])]), speed: 0.5, dock: 1.2, gap: 0.7 },
    { name: "Control rush", kinds: shuffle<Kind>(["control", "control", "feedback", pick<Kind>(["now", "see"]), pick<Kind>(["reach", "gift"]), pick<Kind>(["now", "see", "reach"])]), speed: 0.7, dock: 0.8, gap: 0.45 },
  ];
}

/* ── simulation state (lives outside React render) ────────────── */

type P = { id: number; kind: Kind | "demo"; road: Road | null; forced: Road | null; d: number; dock: number; path: V3[]; len: number; stops: Stop[]; seen: number; arrived: boolean; at: V3; inVan: boolean };
type B = { id: number; from: V3; to: V3; t: number; dur: number; stall: boolean };
type Fx = { id: number; text: string; at: V3; until: number; tone: "good" | "bad" | "info" };
type Sim = { t: number; sw: Road; parcels: P[]; bubbles: B[]; queue: (Kind | "demo")[]; spawnAt: number | null; level: Level | null; running: boolean; nid: number };

const TO_FORK = pathLength([K, FORK]);
const AFTER_SPEED = 1.7;

/* ── 3D pieces ────────────────────────────────────────────────── */

const LOOKS: Record<string, HumanLook> = {
  chef: { skin: "#B98157", hair: "#1E1410", hairStyle: "bun", outfit: "kurta", top: "#FFF5EE", bottom: "#3E2B22", accent: "#FF5C00", slim: true, height: 0.95 },
  keeper: { skin: "#9C6644", hair: "#140C08", hairStyle: "short", outfit: "shirt", top: "#6B8F71", bottom: "#33475B", facial: "moustache" },
  walkin: { skin: "#D1A276", hair: "#2A1A12", hairStyle: "curly", outfit: "tshirt", top: "#3E8E41", bottom: "#33475B", bag: { kind: "backpack", color: "#35401D" } },
  home: { skin: "#A86B45", hair: "#140C08", hairStyle: "braid", outfit: "salwar", top: "#C2185B", bottom: "#F3E5D0", accent: "#F2A900", bindi: true, slim: true, height: 0.94 },
  far: { skin: "#B5764A", hair: "#CFC8C0", hairStyle: "side", outfit: "kurta", top: "#2B6CB0", bottom: "#F4EFE6", glasses: "#3A2A1E" },
};

function Building({ size, color, roof, position, sign, signW = 1.6 }: { size: V3; color: string; roof: string; position: V3; sign: string; signW?: number }) {
  return (
    <group position={position}>
      <RoundedBox args={size} radius={0.05} smoothness={2} position={[0, size[1] / 2, 0]} material={flatMat(color, 0.85)} castShadow receiveShadow />
      <mesh position={[0, size[1] + 0.06, 0]} material={flatMat(roof, 0.7)} castShadow>
        <boxGeometry args={[size[0] + 0.12, 0.12, size[2] + 0.12]} />
      </mesh>
      <Label text={sign} width={signW} height={0.36} position={[0, size[1] + 0.45, 0]} face o={{ bg: "#2F1C1A", fg: "#FFF5EE" }} />
    </group>
  );
}

function Shop() {
  return (
    <group position={[SHOP[0], 0, SHOP[2] - 0.75]}>
      <RoundedBox args={[1.6, 1.0, 0.9]} radius={0.05} smoothness={2} position={[0, 0.5, 0]} material={flatMat("#F7E3CF", 0.85)} castShadow receiveShadow />
      {/* striped awning */}
      {[-0.6, -0.2, 0.2, 0.6].map((x, i) => (
        <mesh key={x} position={[x, 1.08, 0.55]} rotation={[0.5, 0, 0]} material={flatMat(i % 2 ? "#FFF5EE" : "#FF5C00", 0.7)}>
          <boxGeometry args={[0.4, 0.04, 0.5]} />
        </mesh>
      ))}
      {/* shelves with packs */}
      {[0.35, 0.7].map((y) => (
        <mesh key={y} position={[0, y, 0.46]} material={flatMat("#8D5A3B")}>
          <boxGeometry args={[1.3, 0.04, 0.12]} />
        </mesh>
      ))}
      {[-0.45, -0.15, 0.15, 0.45].map((x, i) => (
        <mesh key={x} position={[x, 0.48 + (i % 2) * 0.35, 0.48]} material={flatMat(["#D62828", "#F2A900", "#3E6B48", "#7A5C3E"][i], 0.5)}>
          <boxGeometry args={[0.18, 0.22, 0.08]} />
        </mesh>
      ))}
      <Label text="Shop" width={1.2} height={0.36} position={[0, 1.6, 0]} face o={{ bg: "#2F1C1A", fg: "#FFF5EE" }} />
      <group position={[0.55, 0, 0.75]} rotation={[0, -0.3, 0]}>
        <Human look={LOOKS.keeper} mode="stand" />
      </group>
    </group>
  );
}

function Phone() {
  return (
    <group position={[WEB[0], 0, WEB[2] + 0.85]}>
      <RoundedBox args={[0.8, 1.35, 0.1]} radius={0.08} smoothness={3} position={[0, 0.75, 0]} rotation={[-0.15, 0, 0]} material={flatMat("#2F1C1A", 0.4)} castShadow />
      <mesh position={[0, 0.76, 0.06]} rotation={[-0.15, 0, 0]}>
        <planeGeometry args={[0.68, 1.18]} />
        <meshBasicMaterial color="#FFE3CC" toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.95, 0.075]} rotation={[-0.15, 0, 0]}>
        <planeGeometry args={[0.5, 0.3]} />
        <meshBasicMaterial color="#FF5C00" toneMapped={false} />
      </mesh>
      <mesh position={[0, 0.55, 0.09]} rotation={[-0.15, 0, 0]}>
        <planeGeometry args={[0.5, 0.12]} />
        <meshBasicMaterial color="#2F1C1A" toneMapped={false} />
      </mesh>
      <Label text="Brand website" width={1.7} height={0.36} position={[0, 1.8, 0]} face o={{ bg: "#FF5C00", fg: "#FFF5EE" }} />
    </group>
  );
}

function VanBody() {
  return (
    <group>
      <RoundedBox args={[0.95, 0.5, 0.55]} radius={0.06} smoothness={2} position={[0, 0.38, 0]} material={flatMat("#FF5C00", 0.5)} castShadow />
      <RoundedBox args={[0.32, 0.36, 0.53]} radius={0.05} smoothness={2} position={[0.6, 0.31, 0]} material={flatMat("#FFF5EE", 0.5)} castShadow />
      {[-0.3, 0.45].map((x) => [-0.28, 0.28].map((z) => (
        <mesh key={`${x}${z}`} position={[x, 0.11, z]} rotation={[Math.PI / 2, 0, 0]} material={flatMat("#2F1C1A", 0.8)}>
          <cylinderGeometry args={[0.11, 0.11, 0.08, 14]} />
        </mesh>
      )))}
    </group>
  );
}

function House({ position, color = "#F7E3CF", roof = "#B5652F" }: { position: V3; color?: string; roof?: string }) {
  return (
    <group position={position}>
      <RoundedBox args={[1.05, 0.8, 0.9]} radius={0.04} smoothness={2} position={[0, 0.4, 0]} material={flatMat(color, 0.85)} castShadow receiveShadow />
      <mesh position={[0, 1.02, 0]} rotation={[0, Math.PI / 4, 0]} material={flatMat(roof, 0.7)} castShadow>
        <coneGeometry args={[0.82, 0.48, 4]} />
      </mesh>
      <mesh position={[0, 0.26, 0.455]} material={flatMat("#6B4126")}>
        <planeGeometry args={[0.26, 0.44]} />
      </mesh>
    </group>
  );
}

function Road({ pts, color = "#D9BFA3", width = 0.5 }: { pts: V3[]; color?: string; width?: number }) {
  return (
    <>
      {pts.slice(1).map((b, i) => {
        const a = pts[i];
        const len = Math.hypot(b[0] - a[0], b[2] - a[2]);
        const ang = Math.atan2(b[0] - a[0], b[2] - a[2]);
        return (
          <mesh key={i} position={[(a[0] + b[0]) / 2, 0.012, (a[2] + b[2]) / 2]} rotation={[-Math.PI / 2, 0, ang + Math.PI / 2]} receiveShadow>
            <planeGeometry args={[len + width, width]} />
            <meshStandardMaterial color={color} roughness={0.9} />
          </mesh>
        );
      })}
    </>
  );
}

/** A person who hops when `hopAt` is recent. */
function Hopper({ look, position, rot = 0, hopAt }: { look: HumanLook; position: V3; rot?: number; hopAt: number }) {
  const g = useRef<THREE.Group>(null);
  const start = useRef<{ key: number; t: number } | null>(null);
  useFrame(({ clock }) => {
    if (!g.current) return;
    if (hopAt && start.current?.key !== hopAt) start.current = { key: hopAt, t: clock.elapsedTime };
    const k = start.current ? clock.elapsedTime - start.current.t : 9;
    g.current.position.y = k < 1.2 ? Math.abs(Math.sin(k * Math.PI * 2.5)) * 0.25 * (1 - k / 1.2) : 0;
  });
  return (
    <group position={position} rotation={[0, rot, 0]}>
      <group ref={g}>
        <Human look={look} mode="stand" />
      </group>
    </group>
  );
}

function ParcelMesh({ id, sim, kind }: { id: number; sim: React.RefObject<Sim>; kind: Kind | "demo" }) {
  const g = useRef<THREE.Group>(null);
  const box = useRef<THREE.Group>(null);
  const van = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    const p = sim.current.parcels.find((x) => x.id === id);
    if (!g.current) return;
    if (!p) {
      g.current.visible = false;
      return;
    }
    g.current.visible = true;
    const bob = !p.arrived && p.dock > 0 ? Math.abs(Math.sin(clock.elapsedTime * 6)) * 0.08 : 0;
    g.current.position.set(p.at[0], bob, p.at[2]);
    if (van.current) van.current.visible = p.inVan && !p.arrived;
    if (box.current) box.current.position.y = p.inVan && !p.arrived ? 0.82 : 0.16;
  });
  return (
    <group ref={g} visible={false}>
      <group ref={box}>
        <Parcel size={0.4} color={kind === "demo" ? "#C9965F" : "#D9A066"} />
      </group>
      <group ref={van} visible={false}>
        <VanBody />
      </group>
      {kind !== "demo" && <Label text={KINDS[kind].short} width={1.3} height={0.32} position={[0, 1.25, 0]} face o={{ bg: "#FFF5EE", fg: "#2F1C1A", border: "#FF5C00" }} />}
    </group>
  );
}

function BubbleMesh({ id, sim }: { id: number; sim: React.RefObject<Sim> }) {
  const g = useRef<THREE.Group>(null);
  useFrame(() => {
    const b = sim.current.bubbles.find((x) => x.id === id);
    if (!g.current) return;
    if (!b) {
      g.current.visible = false;
      return;
    }
    g.current.visible = true;
    const k = Math.min(1, b.t / b.dur);
    const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
    const x = b.from[0] + (b.to[0] - b.from[0]) * e;
    const z = b.from[2] + (b.to[2] - b.from[2]) * e;
    const y = 1.6 + Math.sin(e * Math.PI) * (b.stall ? 0.3 : 1.6);
    g.current.position.set(x, y, z);
    const fade = b.stall && k >= 1 ? Math.max(0.2, 1 - (b.t - b.dur) * 0.6) : 1;
    g.current.scale.setScalar(fade);
  });
  return (
    <group ref={g} visible={false}>
      <Label text="“A bit too spicy!”" width={1.7} height={0.42} face o={{ bg: "#FED300", fg: "#2F1C1A", border: "#2F1C1A" }} />
    </group>
  );
}

function Points({ sw, onFlip }: { sw: Road; onFlip: () => void }) {
  const arm = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (!arm.current) return;
    const target = sw === "shop" ? -0.6 : 0.6;
    arm.current.rotation.y += (target - arm.current.rotation.y) * Math.min(1, dt * 12);
  });
  return (
    <group
      position={FORK}
      onClick={(e) => {
        e.stopPropagation();
        onFlip();
      }}
    >
      <mesh position={[0, 0.05, 0]} material={flatMat("#5B3A2E")} castShadow>
        <cylinderGeometry args={[0.42, 0.48, 0.1, 24]} />
      </mesh>
      <group ref={arm} position={[0, 0.14, 0]}>
        <mesh position={[0.45, 0, 0]} material={flatMat("#FF5C00", 0.4)} castShadow>
          <boxGeometry args={[0.9, 0.1, 0.16]} />
        </mesh>
        <mesh position={[0.92, 0, 0]} rotation={[0, 0, -Math.PI / 2]} material={flatMat("#FF5C00", 0.4)}>
          <coneGeometry args={[0.16, 0.26, 3]} />
        </mesh>
      </group>
    </group>
  );
}

function FxLabel({ fx }: { fx: Fx }) {
  const bg = fx.tone === "good" ? "#2E7D32" : fx.tone === "bad" ? "#C62828" : "#FFF5EE";
  const fg = fx.tone === "info" ? "#2F1C1A" : "#FFFFFF";
  return <Label text={fx.text} width={2.3} height={0.62} position={[fx.at[0], 2.2, fx.at[2]]} face o={{ bg, fg, border: "#2F1C1A", font: "sans", weight: 700 }} px={640} />;
}

/* ── the game ─────────────────────────────────────────────────── */

const STEPS = ["Watch both roads", "Level 1 · Reach", "Level 2 · Listen", "Level 3 · Control rush"];
type Phase = "demo" | "intro" | "play" | "cleared" | "lost" | "won";

export default function RouteRush({ onWin }: { onWin: () => void }) {
  const compact = useMediaQuery("(max-width: 767px)");
  const [levels, setLevels] = useState<Level[]>(() => makeLevels());
  const [lv, setLv] = useState(0);
  const [phase, setPhase] = useState<Phase>("demo");
  const [sw, setSw] = useState<Road>("shop");
  const [parcels, setParcels] = useState<{ id: number; kind: Kind | "demo" }[]>([]);
  const [bubbles, setBubbles] = useState<number[]>([]);
  const [fx, setFx] = useState<Fx[]>([]);
  const [front, setFront] = useState<Kind | null>(null);
  const [lives, setLives] = useState(3);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [mistakes, setMistakes] = useState(0);
  const [adv, setAdv] = useState<AdvId[]>([]);
  const [feedback, setFeedback] = useState<Feedback>({ tone: "info", text: "Warm-up: the same order leaves one kitchen on two roads. Follow both parcels, then watch where the customer's feedback ends up." });
  const [hops, setHops] = useState<Record<string, number>>({});
  const [demoDone, setDemoDone] = useState(false);
  const [resolved, setResolved] = useState(0);

  const sim = useRef<Sim>({ t: 0, sw: "shop", parcels: [], bubbles: [], queue: [], spawnAt: null, level: null, running: false, nid: 1 });
  const livesRef = useRef(3);
  const comboRef = useRef(0);
  const demoStarted = useRef(false);

  const flip = useCallback((to?: Road) => {
    const s = sim.current;
    s.sw = to ?? (s.sw === "shop" ? "d2c" : "shop");
    setSw(s.sw);
  }, []);

  const addFx = useCallback((text: string, at: V3, tone: Fx["tone"], dur = 2.6) => {
    const s = sim.current;
    const f = { id: s.nid++, text, at, until: s.t + dur, tone };
    setFx((xs) => [...xs.filter((x) => Math.hypot(x.at[0] - at[0], x.at[2] - at[2]) > 0.8), f]);
  }, []);

  const hop = useCallback((who: string) => setHops((h) => ({ ...h, [who]: sim.current.t + 0.001 + Math.random() })), []);

  const spawn = useCallback((kind: Kind | "demo", forced: Road | null) => {
    const s = sim.current;
    const id = s.nid++;
    s.parcels.push({ id, kind, road: null, forced, d: 0, dock: kind === "demo" ? 0.5 : (s.level?.dock ?? 1), path: [K, FORK], len: TO_FORK, stops: [], seen: 0, arrived: false, at: K, inVan: false });
    setParcels((ps) => [...ps, { id, kind }]);
  }, []);

  const startDemo = useCallback(() => {
    const s = sim.current;
    s.parcels = [];
    s.bubbles = [];
    s.queue = [];
    s.level = null;
    s.running = true;
    setParcels([]);
    setBubbles([]);
    setFx([]);
    spawn("demo", "shop");
    spawn("demo", "d2c");
  }, [spawn]);

  const startLevel = useCallback(
    (i: number, ls: Level[] = levels) => {
      const s = sim.current;
      s.parcels = [];
      s.bubbles = [];
      s.level = ls[i];
      s.queue = [...ls[i].kinds];
      s.spawnAt = s.t + 0.4;
      s.running = true;
      setParcels([]);
      setBubbles([]);
      setFx([]);
      setLv(i);
      setResolved(0);
      setPhase("play");
      setFeedback({ tone: "info", text: "Read each parcel's job, then set the points before it reaches them: tap a road, the orange lever, or Flip the points." });
    },
    [levels],
  );

  /** A parcel reached the points: decide its fate. */
  const decide = useCallback(
    (p: P) => {
      const s = sim.current;
      const road = p.forced ?? s.sw;
      p.road = road;
      const r = routeFor(p.kind, road);
      p.path = r.path;
      p.len = pathLength(r.path);
      p.stops = r.stops;
      p.d = 0;
      p.seen = 0;
      if (p.kind === "demo") return;
      const k = KINDS[p.kind];
      const ok = road === k.right;
      if (ok) {
        comboRef.current = Math.min(3, comboRef.current + 1);
        setCombo(comboRef.current);
        setScore((x) => x + 100 * comboRef.current);
        if (k.adv) setAdv((a) => (a.includes(k.adv!) ? a : [...a, k.adv!]));
        setFeedback({ tone: "good", text: k.adv ? `${k.good} Advantage: ${ADV[k.adv].text}` : `${k.good} (General shopping habit, not an Eat Better fact.)` });
      } else {
        comboRef.current = 0;
        setCombo(0);
        setMistakes((m) => m + 1);
        livesRef.current -= 1;
        setLives(livesRef.current);
        setFeedback({ tone: "bad", text: k.wrong });
      }
    },
    [],
  );

  /** A parcel reached the end of its road: play the consequence. */
  const arrive = useCallback(
    (p: P) => {
      const s = sim.current;
      p.arrived = true;
      const end = p.path[p.path.length - 1];
      if (p.kind === "demo") {
        if (p.road === "d2c") {
          hop("home");
          s.bubbles.push({ id: s.nid++, from: HOME, to: K, t: -0.6, dur: 2.6, stall: false });
        } else {
          hop("walkin");
          s.bubbles.push({ id: s.nid++, from: WALKIN, to: SHOP, t: -0.6, dur: 1.4, stall: true });
        }
        setBubbles(s.bubbles.map((b) => b.id));
        return;
      }
      const k = KINDS[p.kind];
      const ok = p.road === k.right;
      if (p.road === "shop") {
        if (k.far) addFx("No shop stocks it there", end, "bad");
        else if (p.kind === "control") addFx("Back shelf, shop's display", end, ok ? "good" : "bad");
        else if (p.kind === "feedback") {
          hop("walkin");
          s.bubbles.push({ id: s.nid++, from: WALKIN, to: SHOP, t: -0.3, dur: 1.4, stall: true });
          setBubbles(s.bubbles.map((b) => b.id));
        } else {
          hop("walkin");
          addFx(ok ? "Bought off the shelf" : "Delivered", end, ok ? "good" : "info");
        }
      } else {
        const who = k.far ? "far" : "home";
        if (ok) hop(who);
        if (p.kind === "feedback") {
          s.bubbles.push({ id: s.nid++, from: HOME, to: K, t: -0.3, dur: 2.4, stall: false });
          setBubbles(s.bubbles.map((b) => b.id));
        } else if (!ok) addFx(p.kind === "now" ? "Still waiting…" : "Never saw it first", end, "bad");
        else addFx(k.adv === "control" ? "Brand's own pack & story" : "Delivered to the door", end, "good");
      }
    },
    [addFx, hop],
  );

  const tick = useCallback(
    (dt: number) => {
      const s = sim.current;
      s.t += dt;
      if (!s.running) return;
      // spawn
      if (s.level && s.queue.length && s.spawnAt !== null && s.t >= s.spawnAt) {
        spawn(s.queue.shift()!, null);
        s.spawnAt = null;
      }
      let frontKind: Kind | null = null;
      let frontD = -1;
      for (const p of s.parcels) {
        if (p.arrived) continue;
        if (!p.road) {
          if (p.dock > 0) p.dock -= dt;
          else p.d += dt * (p.kind === "demo" ? 0.9 : (s.level?.speed ?? 0.5));
          if (p.kind !== "demo" && p.d > frontD) {
            frontD = p.d;
            frontKind = p.kind;
          }
          // next parcel leaves the kitchen once this one is far enough along
          if (s.level && s.queue.length && s.spawnAt === null && p.d >= TO_FORK * (1 - s.level.gap) && p === s.parcels[s.parcels.length - 1]) s.spawnAt = s.t + 0.3;
          if (p.d >= TO_FORK) decide(p);
          else p.at = along([K, FORK], p.d).p;
          continue;
        }
        p.d += dt * AFTER_SPEED;
        const a = along(p.path, p.d);
        p.at = a.p;
        p.inVan = p.road === "d2c" && a.seg >= 3;
        for (const st of p.stops) {
          if (p.seen < st.i && a.seg >= st.i - 1 && Math.hypot(a.p[0] - p.path[st.i][0], a.p[2] - p.path[st.i][2]) < 0.15) {
            p.seen = st.i;
            if (p.kind === "demo" || s.level?.name === "Reach") addFx(st.text, p.path[st.i], "info", 2.4);
          }
        }
        if (a.done) arrive(p);
      }
      setFront((f) => (f === frontKind ? f : frontKind));
      // bubbles
      let bubbleDone = 0;
      for (const b of s.bubbles) {
        const before = b.t;
        b.t += dt;
        if (before < b.dur && b.t >= b.dur) {
          if (b.stall) addFx("Stops at the shop: the kitchen never hears it", SHOP, "bad", 2.8);
          else {
            hop("chef");
            addFx("The kitchen hears it first-hand", K, "good", 2.8);
          }
        }
        if (b.t >= b.dur + 1.6) bubbleDone++;
      }
      if (bubbleDone && bubbleDone === s.bubbles.length && s.parcels.every((p) => p.arrived) && !s.level) {
        // demo finished
        s.running = false;
        setDemoDone(true);
        setFeedback({ tone: "info", text: "Both parcels arrived, but only the D2C road carried the customer's feedback back to the kitchen. On the shop road it stopped at the shop. Now run the roads yourself." });
      }
      // prune finished bubbles / effects
      if (s.bubbles.some((b) => b.t >= b.dur + 1.8)) {
        s.bubbles = s.bubbles.filter((b) => b.t < b.dur + 1.8);
        setBubbles(s.bubbles.map((b) => b.id));
      }
      setFx((xs) => (xs.some((x) => x.until < s.t) ? xs.filter((x) => x.until >= s.t) : xs));
      // level end
      if (s.level) {
        const arrivedAll = s.parcels.length > 0 && s.parcels.every((p) => p.arrived) && !s.queue.length && s.spawnAt === null;
        const n = s.parcels.filter((p) => p.road).length;
        setResolved((r) => (r === n ? r : n));
        if (livesRef.current <= 0) {
          s.running = false;
          setPhase("lost");
        } else if (arrivedAll && s.bubbles.length === 0) {
          s.running = false;
          setPhase("cleared");
        }
      }
    },
    [addFx, arrive, decide, hop, spawn],
  );

  const onTicker = useCallback(
    (dt: number) => {
      if (phase === "demo" && !demoStarted.current) {
        demoStarted.current = true;
        startDemo();
      }
      tick(dt);
    },
    [phase, startDemo, tick],
  );

  const restart = () => {
    const ls = makeLevels();
    setLevels(ls);
    livesRef.current = 3;
    comboRef.current = 0;
    setLives(3);
    setScore(0);
    setCombo(0);
    setMistakes(0);
    setAdv([]);
    const first: Road = Math.random() < 0.5 ? "shop" : "d2c";
    flip(first);
    startLevel(0, ls);
  };

  const next = () => {
    if (lv >= levels.length - 1) {
      setPhase("won");
      setFeedback({ tone: "good", text: "All three D2C advantages proven: feedback straight from customers, reach across India from one kitchen, and control of its own pricing, packaging and story. You also kept the shoppers who needed a shop." });
      onWin();
      return;
    }
    startLevel(lv + 1);
  };

  const rot = compact ? -Math.PI / 2 : 0;
  const W = useCallback((p: V3): V3 => (compact ? [-p[2], p[1], p[0]] : p), [compact]);
  const probe = useCallback(
    () => ({ fork: W([FORK[0], 0.2, FORK[2]]), shop: W([0.4, 0, -1.9]), d2c: W([0.4, 0, 1.9]), kitchen: W(K) }),
    [W],
  );

  const step = phase === "demo" ? 0 : phase === "won" ? 4 : lv + 1;
  const level = levels[lv];
  const total = level.kinds.length;

  return (
    <GameFrame
      kicker="Game · 3D delivery map"
      title="Route Rush"
      mission="One kitchen, two roads. Parcels roll out of the kitchen towards the points. Read each parcel's job and flip the points so it takes the road that really gets that job done, before it gets there. Three wrong roads and the day is over."
      steps={STEPS}
      step={step}
      stars={phase === "won" ? starsFor(mistakes) : undefined}
      onReset={phase === "demo" ? undefined : restart}
      feedback={feedback}
      note={{
        real: "The two routes, what happens at each stop, the three D2C advantages and what goes wrong on the shop route all come from this chapter.",
        practice: "The parcels and customers are made up. The 'right now', 'see it first' and 'gift' shoppers are general shopping habits, not Eat Better facts. Parcel order changes on every restart.",
        tip: "Ask what the parcel needs: to reach someone with no shop nearby, to bring feedback back, to keep the brand's own story? Or a shopper who is already at a shop?",
      }}
    >
      <Stage3D design={2.2}
        label="A delivery map: the Eat Better kitchen on one side, a shop road through a distributor and a shop, and a D2C road through the brand website and a delivery van to homes and a far city."
        camera={{ position: [0, 9, 9], fov: 40 }}
        height={compact ? "480px" : "clamp(400px, 62vh, 560px)"}
        overlay={
          <>
            <div className="absolute left-3 top-3 flex flex-wrap items-center gap-1.5">
              <span className="rounded-full bg-cocoa/90 px-3 py-1 text-[0.8rem] font-extrabold text-cream" data-testid="rr-level">
                {phase === "demo" ? "Warm-up · watch" : `Level ${lv + 1} · ${level.name} · ${Math.min(resolved, total)}/${total}`}
              </span>
              <PracticeTag />
            </div>
            <div className="absolute right-3 top-3 flex items-center gap-1.5">
              <ScorePill score={score} combo={combo} />
              <Hearts lives={lives} />
            </div>
            {phase === "play" && (
              <div className="absolute inset-x-3 bottom-3 flex flex-col gap-2 sm:flex-row sm:items-end">
                <div className="min-w-0 flex-1 rounded-2xl border border-cocoa bg-cream/95 p-3 shadow-[2px_2px_0_0_#2f1c1a]" data-testid="rr-job">
                  <div className="flex items-center gap-1.5 text-[0.72rem] font-extrabold uppercase tracking-[0.1em] text-orange">
                    <Package className="size-3.5" /> {front ? `Next at the points · ${KINDS[front].short}` : "Next parcel is being packed…"}
                  </div>
                  <p className="mt-1 text-[0.95rem] font-semibold leading-snug text-cocoa sm:text-[1rem]">{front ? KINDS[front].tag : "Watch the kitchen."}</p>
                </div>
                <button data-testid="rr-flip" onClick={() => flip()} className="eb-btn eb-btn-dark inline-flex shrink-0 items-center justify-center gap-2 !normal-case">
                  <ArrowLeftRight className="size-4" /> Flip the points · now: {sw === "shop" ? "Shop road" : "D2C road"}
                </button>
              </div>
            )}
            <StageCard show={phase === "demo" && demoDone} title="Your turn to run the roads" action="Start level 1" onAction={restart} testId="rr-start">
              Parcels will now come one after another. Flip the points so each one takes the road that gets its job done.
            </StageCard>
            <StageCard show={phase === "cleared"} tone="win" title={`Level ${lv + 1} · ${level.name} cleared`} action={lv < levels.length - 1 ? `Start level ${lv + 2}` : "Finish the day"} onAction={next} testId="rr-next">
              Score {score} · {lives} {lives === 1 ? "life" : "lives"} left
            </StageCard>
            <StageCard show={phase === "lost"} tone="lose" title="Three parcels took the wrong road" action="Try again" onAction={restart} testId="rr-retry">
              Every wrong road is explained under the map. The parcels come in a new order this time.
            </StageCard>
            <StageCard show={phase === "won"} tone="win" title="Delivery day complete">
              <div>Score {score}</div>
              <StarRow stars={starsFor(mistakes)} />
            </StageCard>
          </>
        }
      >
        <FitRig center={compact ? [0, 0, 0.2] : [0, 0, 0.3]} dir={compact ? [0, 1.35, 1] : [0, 1.05, 1]} width={compact ? 6.3 : 12.8} height={compact ? 9.5 : 0} />
        <Lights shadows={!compact} />
        <Ticker fn={onTicker} />
        <Probe name="rr" points={probe} />
        <Ground color="#E7D3B8" />
        <group rotation={[0, rot, 0]}>
          {/* roads */}
          <Road pts={[K, FORK]} color="#CDB295" />
          <Road pts={[FORK, SA, DIST, SHOP, WALKIN]} color={sw === "shop" ? "#E9A36B" : "#D9BFA3"} />
          <Road pts={[FORK, DA, WEB, VAN, HOME]} color={sw === "d2c" ? "#E9A36B" : "#D9BFA3"} />
          <Road pts={[VAN, FARJ, FAR]} color={sw === "d2c" ? "#E9A36B" : "#D9BFA3"} width={0.36} />
          {/* tap areas for each road */}
          <mesh position={[0.5, 0.03, -1.9]} rotation={[-Math.PI / 2, 0, 0]} onClick={(e) => (e.stopPropagation(), flip("shop"))}>
            <planeGeometry args={[6.6, 1.5]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
          <mesh position={[0.5, 0.03, 1.9]} rotation={[-Math.PI / 2, 0, 0]} onClick={(e) => (e.stopPropagation(), flip("d2c"))}>
            <planeGeometry args={[6.6, 1.5]} />
            <meshBasicMaterial transparent opacity={0} depthWrite={false} />
          </mesh>
          <Label text="Shop & distributor road" width={2.6} height={0.34} position={[-1.2, 0.04, -1.15]} rotation={[-Math.PI / 2, 0, 0]} o={{ fg: "#5B3A2E", font: "sans", weight: 800 }} />
          <Label text="Direct-to-consumer road" width={2.6} height={0.34} position={[-1.2, 0.04, 1.15]} rotation={[-Math.PI / 2, 0, 0]} o={{ fg: "#AF4300", font: "sans", weight: 800 }} />

          {/* kitchen */}
          <Building size={[1.5, 1.0, 1.3]} color="#FFE3CC" roof="#FF5C00" position={[K[0] - 0.4, 0, K[2] - 0.9]} sign="Kitchen" signW={1.3} />
          <Hopper look={LOOKS.chef} position={[K[0] - 0.9, 0, K[2] + 0.5]} rot={0.5} hopAt={hops.chef ?? 0} />
          <Points sw={sw} onFlip={() => flip()} />

          {/* shop road */}
          <Building size={[1.6, 0.9, 1.0]} color="#D7D2C8" roof="#7A6A5C" position={[DIST[0], 0, DIST[2] - 0.95]} sign="Distributor" />
          <Shop />
          <Hopper look={LOOKS.walkin} position={[WALKIN[0] + 0.35, 0, WALKIN[2]]} rot={-1.2} hopAt={hops.walkin ?? 0} />

          {/* D2C road */}
          <Phone />
          <group position={[VAN[0], 0, VAN[2] + 0.85]}>
            <VanBody />
            <Label text="Delivery" width={1.2} height={0.36} position={[0, 1.15, 0]} face o={{ bg: "#2F1C1A", fg: "#FFF5EE" }} />
          </group>
          <House position={[HOME[0] + 0.3, 0, HOME[2] + 0.85]} />
          <Hopper look={LOOKS.home} position={[HOME[0] + 0.85, 0, HOME[2] + 0.1]} rot={-1.4} hopAt={hops.home ?? 0} />
          <group position={FAR}>
            <House position={[0.35, 0, -0.75]} color="#E3EEF7" roof="#2B6CB0" />
            <House position={[-0.6, 0, -1.25]} color="#F0E6D8" roof="#7A6A5C" />
            <Label text="Far city · no stockist" width={2.0} height={0.36} position={[0, 1.8, -0.9]} face o={{ bg: "#2B6CB0", fg: "#FFFFFF" }} />
          </group>
          <Hopper look={LOOKS.far} position={[FAR[0] + 0.4, 0, FAR[2] + 0.35]} rot={-1.6} hopAt={hops.far ?? 0} />

          {parcels.map((p) => (
            <ParcelMesh key={p.id} id={p.id} sim={sim} kind={p.kind} />
          ))}
          {bubbles.map((id) => (
            <BubbleMesh key={id} id={id} sim={sim} />
          ))}
          {fx.map((f) => (
            <FxLabel key={f.id} fx={f} />
          ))}
        </group>
      </Stage3D>

      {/* the three advantages assemble as they are proven */}
      <div className="mt-4 grid gap-2 sm:grid-cols-3" data-testid="rr-adv">
        {D2C.advantages.map((a, i) => {
          const on = adv.includes(a.id as AdvId);
          const Icon = a.id === "feedback" ? MessageCircle : a.id === "reach" ? Globe2 : Tag;
          return (
            <div key={a.id} className={`flex items-start gap-2.5 rounded-2xl p-3 transition-colors ${on ? "bg-orange text-white" : "border-2 border-dashed border-cocoa/20 text-cocoa-2"}`}>
              <Icon className="mt-0.5 size-5 shrink-0" />
              <div>
                <div className="text-[0.72rem] font-extrabold uppercase tracking-[0.12em]">Advantage {i + 1}</div>
                <div className="font-display text-[1.05rem] font-semibold leading-tight">{on ? a.title : "Prove it on the map"}</div>
                {on && <p className="mt-1 text-[0.9rem] leading-snug text-white/95">{a.text}</p>}
              </div>
            </div>
          );
        })}
      </div>
    </GameFrame>
  );
}
