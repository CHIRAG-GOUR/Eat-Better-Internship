"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { Check, Quote, Trash2, UserRound } from "lucide-react";
import { CheckRow, GameFrame, starsFor, type Feedback } from "@/components/play/GameFrame";
import { Stage3D } from "@/components/play/Stage3D";
import { RoundedBox } from "@/components/three/RoundedBox";
import { AUDIENCE } from "../content";
import { Burst, CAST, FitCam, Flyer, Label, Lights, Person, Room, TextCard, type Mood } from "./kit3d";

/**
 * Activity 3 · The Persona Lab (3D).
 * Research basis: practitioner persona work — every persona claim must be backed by a real quote, and a pattern only
 * counts when it repeats across interviews. Students stand in a 3D interview studio with four FICTIONAL interviewees.
 * They tap a person, pick one of their quotes and file it on one of four floor pads in front of the persona figure:
 * profile, need, buying considerations, or "not for this persona". A trait is confirmed only when two different
 * people say it; the persona's stats board shows the evidence for each trait as game-style bars. One interviewee
 * belongs to a different audience, and off-topic lines must be binned. Then they name the audience from the chapter's
 * table (the board then shows that real table row) and write a message that uses only confirmed traits.
 */

type Field = "profile" | "need" | "consider" | "bin";
type Line = { id: string; text: string; field: Field; trait?: string; why: string };
type Person3 = { id: string; name: string; who: string; lines: Line[]; look: number; at: [number, number, number]; face: number };

const TRAITS: Record<string, { field: Exclude<Field, "bin">; label: string; badge: string; color: string }> = {
  busy: { field: "profile", label: "Works long, busy days", badge: "Busy days", color: "#2F6FDE" },
  desk: { field: "need", label: "Eats at the desk or on short breaks", badge: "Desk breaks", color: "#FF5C00" },
  taste: { field: "need", label: "Still wants real, chatpata taste", badge: "Real taste", color: "#C2185B" },
  pack: { field: "consider", label: "Small packs that don't go stale", badge: "Small packs", color: "#00A341" },
  ingredients: { field: "consider", label: "Checks if a snack is fried", badge: "Not fried", color: "#8A4FD6" },
};
const TRAIT_IDS = Object.keys(TRAITS);

const PEOPLE: Person3[] = [
  {
    id: "aman",
    name: "Aman, 27",
    who: "Software tester",
    look: 0,
    at: [-4.3, 0, 0.2],
    face: 0.55,
    lines: [
      { id: "a1", text: "My days are back-to-back calls.", field: "profile", trait: "busy", why: "That tells us about his life — the profile." },
      { id: "a2", text: "I snack at my desk between meetings.", field: "need", trait: "desk", why: "When and where he snacks is a need the product must fit." },
      { id: "a3", text: "I still want that chatpata taste — bland snacks are a no.", field: "need", trait: "taste", why: "Taste is what he wants from the snack." },
      { id: "a4", text: "I play cricket every Sunday.", field: "bin", why: "True, but it says nothing about how he buys snacks." },
    ],
  },
  {
    id: "neha",
    name: "Neha, 31",
    who: "Bank analyst",
    look: 7,
    at: [-2.55, 0, -0.9],
    face: 0.3,
    lines: [
      { id: "n1", text: "I usually work late, three or four days a week.", field: "profile", trait: "busy", why: "Another busy schedule — this confirms the profile trait." },
      { id: "n2", text: "Big family packs go soft and stale in my office drawer.", field: "consider", trait: "pack", why: "Pack size affects whether she buys — a buying consideration." },
      { id: "n3", text: "If it tastes boring, I won't buy it again.", field: "need", trait: "taste", why: "Taste again — now two people say it." },
      { id: "n4", text: "My favourite colour is blue.", field: "bin", why: "Not about snacking at all." },
    ],
  },
  {
    id: "farah",
    name: "Farah, 29",
    who: "Hospital nurse",
    look: 5,
    at: [2.55, 0, -0.9],
    face: -0.3,
    lines: [
      { id: "f1", text: "My breaks are ten minutes long, so I need something I can open and eat fast.", field: "need", trait: "desk", why: "Short breaks — the same need Aman has." },
      { id: "f2", text: "One small pack is perfect for my shift bag.", field: "consider", trait: "pack", why: "Pack size again — confirmed by two people." },
      { id: "f3", text: "I turn the pack over to check if it's fried.", field: "consider", trait: "ingredients", why: "Checking ingredients shapes her choice." },
      { id: "f4", text: "I work twelve-hour shifts.", field: "profile", trait: "busy", why: "A long, busy day — profile." },
    ],
  },
  {
    id: "gupta",
    name: "Mr Gupta, 52",
    who: "Office administrator",
    look: 3,
    at: [4.3, 0, 0.2],
    face: -0.55,
    lines: [
      { id: "g1", text: "I need 200 gift boxes for our staff before Diwali.", field: "bin", why: "He's a corporate gift buyer — a different target audience. Keep this persona about one group." },
      { id: "g2", text: "The boxes must look premium with our logo on them.", field: "bin", why: "Customisation for bulk gifts belongs to the corporate-buyer audience, not this persona." },
      { id: "g3", text: "Sometimes I read the label to see if it's fried.", field: "consider", trait: "ingredients", why: "Even a different buyer can share a habit — this confirms “checks if it's fried”." },
    ],
  },
];

const ALL = PEOPLE.flatMap((p) => p.lines.map((l) => ({ ...l, person: p.id, personName: p.name })));
const FIELDS: { id: Field; label: string; short: string; color: string; x: number }[] = [
  { id: "profile", label: "Profile", short: "Profile", color: "#2F6FDE", x: -2.85 },
  { id: "need", label: "Need", short: "Need", color: "#FF5C00", x: -0.95 },
  { id: "consider", label: "Buying considerations", short: "Buying\nconsiderations", color: "#00A341", x: 0.95 },
  { id: "bin", label: "Not for this persona", short: "Not for this\npersona", color: "#6B5B57", x: 2.85 },
];
const PAD_Z = 2.0;
const PERSONA_AT: [number, number, number] = [0, 0.42, -1.1];
const AUDIENCES = AUDIENCE.rows.map((r) => r.audience);
const TARGET = AUDIENCE.rows.find((r) => r.audience === "Working professionals")!;

/* ── 3D pieces ─────────────────────────────────────────────────── */

/** The persona's character sheet: evidence bars for each trait, like a game character's stats. */
function StatsBoard({ support, audience, row, position }: { support: Record<string, string[]>; audience: string | null; row: typeof TARGET | null; position: [number, number, number] }) {
  const W = 3.5;
  const H = row ? 2.7 : 2.05;
  const tex = useMemo(() => {
    const ppu = 240;
    const c = document.createElement("canvas");
    c.width = Math.round(W * ppu);
    c.height = Math.round(H * ppu);
    const g = c.getContext("2d")!;
    const fam = getComputedStyle(document.body).fontFamily || "sans-serif";
    const s = ppu / 100;
    g.fillStyle = "#2F1C1A";
    g.beginPath();
    g.roundRect(0, 0, c.width, c.height, 26 * s);
    g.fill();
    g.fillStyle = "#FED300";
    g.font = `800 ${11 * s}px ${fam}`;
    g.fillText("PERSONA STATS · EVIDENCE FROM INTERVIEWS", 16 * s, 22 * s);
    g.fillStyle = "#FFF5EE";
    g.font = `700 ${19 * s}px ${fam}`;
    g.fillText("The Desk-Break Snacker", 16 * s, 45 * s);
    g.fillStyle = audience ? "#7FE0A0" : "rgba(255,245,238,0.6)";
    g.font = `600 ${11.5 * s}px ${fam}`;
    g.fillText(`Target audience: ${audience ?? "?"}`, 16 * s, 62 * s);
    TRAIT_IDS.forEach((id, i) => {
      const t = TRAITS[id];
      const n = Math.min(2, support[id]?.length ?? 0);
      const y = 80 * s + i * 22 * s;
      g.fillStyle = n ? "#FFF5EE" : "rgba(255,245,238,0.4)";
      g.font = `700 ${11.5 * s}px ${fam}`;
      g.fillText(n ? t.badge : "needs evidence", 16 * s, y + 9 * s);
      // two-segment evidence bar: one segment per person who said it
      for (let k = 0; k < 2; k++) {
        g.fillStyle = k < n ? (n >= 2 ? t.color : "#FED300") : "rgba(255,255,255,0.14)";
        g.beginPath();
        g.roundRect(150 * s + k * 92 * s, y, 86 * s, 12 * s, 6 * s);
        g.fill();
      }
      g.fillStyle = n >= 2 ? "#7FE0A0" : "rgba(255,245,238,0.55)";
      g.font = `800 ${10.5 * s}px ${fam}`;
      g.fillText(n >= 2 ? "CONFIRMED" : `${n}/2 people`, 290 * s, y + 9.5 * s);
    });
    if (row) {
      const y0 = 194 * s;
      g.fillStyle = "rgba(255,245,238,0.12)";
      g.fillRect(16 * s, y0 - 8 * s, c.width - 32 * s, 1.5 * s);
      g.fillStyle = "#FED300";
      g.font = `800 ${10 * s}px ${fam}`;
      g.fillText("FROM THE CHAPTER'S TABLE", 16 * s, y0 + 6 * s);
      g.fillStyle = "#FFF5EE";
      g.font = `600 ${11 * s}px ${fam}`;
      const lines = (label: string, text: string, y: number) => {
        const words = `${label} ${text}`.split(" ");
        let line = "";
        let yy = y;
        for (const w of words) {
          const test = line ? `${line} ${w}` : w;
          if (g.measureText(test).width > c.width - 32 * s && line) {
            g.fillText(line, 16 * s, yy);
            line = w;
            yy += 14 * s;
          } else line = test;
        }
        g.fillText(line, 16 * s, yy);
        return yy;
      };
      const y1 = lines("Need:", row.need, y0 + 22 * s);
      lines("How Eat Better could appeal:", row.appeal, y1 + 17 * s);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return t;
  }, [support, audience, row, H]);
  useEffect(() => () => tex.dispose(), [tex]);
  return (
    <mesh position={position}>
      <planeGeometry args={[W, H]} />
      <meshBasicMaterial map={tex} toneMapped={false} transparent />
    </mesh>
  );
}

/** Pedestal under the persona figure; it glows brighter with every confirmed trait. */
function Pedestal({ level }: { level: number }) {
  const ring = useRef<THREE.Mesh>(null);
  useFrame(({ clock }) => {
    const m = ring.current?.material as THREE.MeshStandardMaterial | undefined;
    if (m) m.emissiveIntensity = 0.25 + level * 0.28 + Math.sin(clock.elapsedTime * 2.2) * 0.08 * (level > 0 ? 1 : 0);
  });
  return (
    <group position={[PERSONA_AT[0], 0, PERSONA_AT[2]]}>
      <mesh position={[0, 0.2, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.95, 1.05, 0.4, 48]} />
        <meshStandardMaterial color="#2F1C1A" roughness={0.5} />
      </mesh>
      <mesh ref={ring} position={[0, 0.405, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.72, 0.92, 48]} />
        <meshStandardMaterial color="#FF5C00" emissive="#FF5C00" emissiveIntensity={0.3} />
      </mesh>
    </group>
  );
}

/** A confirmed trait: a badge that floats round the persona figure. */
function TraitBadge({ id, i }: { id: string; i: number }) {
  const g = useRef<THREE.Group>(null);
  const t = TRAITS[id];
  useFrame(({ clock }) => {
    const o = g.current;
    if (!o) return;
    const a = (i / TRAIT_IDS.length) * Math.PI * 2 + clock.elapsedTime * 0.35;
    o.position.set(PERSONA_AT[0] + Math.cos(a) * 1.35, 1.25 + (i % 2) * 0.45 + Math.sin(clock.elapsedTime * 1.4 + i) * 0.05, PERSONA_AT[2] + Math.sin(a) * 0.55);
  });
  return (
    <group ref={g}>
      <Label text={t.badge} position={[0, 0, 0]} bg={t.color} fg="#ffffff" border="#ffffff" h={0.22} />
    </group>
  );
}

function Pad({ f, armed, onClick }: { f: (typeof FIELDS)[number]; armed: boolean; onClick: () => void }) {
  const g = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    if (g.current) g.current.position.y = armed ? 0.06 + Math.sin(clock.elapsedTime * 4 + f.x) * 0.03 : 0.03;
  });
  return (
    <group ref={g} position={[f.x, 0.03, PAD_Z]}>
      <RoundedBox args={[1.7, 0.08, 1.0]} radius={0.04} onClick={(e) => (e.stopPropagation(), onClick())} castShadow receiveShadow>
        <meshStandardMaterial color={armed ? f.color : "#FFF5EE"} roughness={0.5} emissive={armed ? f.color : "#000000"} emissiveIntensity={armed ? 0.25 : 0} />
      </RoundedBox>
      <group position={[0, 0.06, 0]} rotation={[-Math.PI / 2.6, 0, 0]}>
        <TextCard text={f.short} w={1.5} h={0.56} bg={armed ? "#ffffff" : "#FFF5EE"} fg="#2f1c1a" border={f.color} size={0.15} onClick={onClick} />
      </group>
    </group>
  );
}

function Studio({
  selPerson,
  selLine,
  support,
  confirmed,
  audience,
  row,
  moods,
  fly,
  burst,
  cheer,
  message,
  onPerson,
  onPad,
  onLanded,
}: {
  selPerson: string | null;
  selLine: (typeof ALL)[number] | undefined;
  support: Record<string, string[]>;
  confirmed: string[];
  audience: string | null;
  row: typeof TARGET | null;
  moods: Record<string, { mood: Mood; k: number }>;
  fly: { key: number; from: [number, number, number]; color: string } | null;
  burst: number;
  cheer: { mood: Mood; k: number } | undefined;
  message: string | null;
  onPerson: (id: string) => void;
  onPad: (f: Field) => void;
  onLanded: () => void;
}) {
  return (
    <>
      <color attach="background" args={["#FFF1E4"]} />
      <FitCam width={11.2} height={6.4} cy={1.5} tilt={1.6} cz={0.4} />
      <Lights />
      <Room floor="#E8D2BC" wall="#FFF5EE" w={20} d={12} wallZ={-3.4} />
      {/* studio wall sign */}
      <group position={[0, 3.95, -3.35]}>
        <TextCard text="PERSONA LAB · INTERVIEW STUDIO" w={4.6} h={0.42} bg="#FF5C00" fg="#ffffff" border="#FF5C00" size={0.2} />
      </group>
      {/* interviewees */}
      {PEOPLE.map((p) => {
        const left = p.lines.filter((l) => !filedRef.current[l.id]).length;
        return (
          <group key={p.id}>
            <Person
              look={CAST[p.look]}
              to={p.at}
              face={p.face}
              react={moods[p.id]}
              bubble={selPerson === p.id && selLine ? `“${selLine.text.length > 46 ? selLine.text.slice(0, 44) + "…" : selLine.text}”` : undefined}
              onClick={() => onPerson(p.id)}
              ring={selPerson === p.id ? "#FF5C00" : undefined}
            />
            <Label text={`${p.name} · ${p.who}`} position={[p.at[0], 0.12, p.at[2] + 0.75]} h={0.2} bg={selPerson === p.id ? "#FF5C00" : "#ffffff"} fg={selPerson === p.id ? "#ffffff" : "#2f1c1a"} />
            <Label text={left ? `${left} quote${left === 1 ? "" : "s"} to file` : "all filed"} position={[p.at[0], 2.15, p.at[2]]} h={0.18} bg={left ? "#FED300" : "#E5F6EA"} />
          </group>
        );
      })}
      {/* the persona: a game figure on a pedestal with a stats board above */}
      <Pedestal level={confirmed.length} />
      <Person look={CAST[4]} to={PERSONA_AT} face={0} scale={1.18} react={cheer} />
      {confirmed.map((id, i) => (
        <TraitBadge key={id} id={id} i={i} />
      ))}
      <StatsBoard support={support} audience={audience} row={row} position={[0, row ? 3.7 : 3.4, -2.1]} />
      {message && (
        <group position={[0, 0.78, PAD_Z - 0.75]}>
          <TextCard text={`“${message}”`} w={5.4} h={0.5} bg="#FED300" fg="#2f1c1a" border="#2f1c1a" size={0.17} maxW={60} />
        </group>
      )}
      {/* filing pads */}
      {FIELDS.map((f) => (
        <Pad key={f.id} f={f} armed={!!selLine} onClick={() => onPad(f.id)} />
      ))}
      {fly && (
        <Flyer key={fly.key} from={fly.from} to={[PERSONA_AT[0], 1.9, PERSONA_AT[2]]} dur={0.75} height={1.3} onLand={onLanded}>
          <mesh>
            <boxGeometry args={[0.5, 0.34, 0.04]} />
            <meshStandardMaterial color={fly.color} />
          </mesh>
        </Flyer>
      )}
      <Burst k={burst} at={[PERSONA_AT[0], 1.9, PERSONA_AT[2]]} />
    </>
  );
}

// filed quotes, readable inside the 3D scene without threading another prop through every person
const filedRef: { current: Record<string, Field> } = { current: {} };

/* ── the game ──────────────────────────────────────────────────── */

export default function PersonaLab({ onDone }: { onDone: (summary: string) => void }) {
  const [step, setStep] = useState(0);
  const [selPerson, setSelPerson] = useState<string | null>(PEOPLE[0].id);
  const [sel, setSel] = useState<string | null>(null);
  const [filed, setFiled] = useState<Record<string, Field>>({});
  const [mistakes, setMistakes] = useState(0);
  const [fb, setFb] = useState<Feedback>({ tone: "info", text: "Tap a person in the studio (or a name below), pick one of their quotes, then tap the floor pad where it belongs." });
  const [aud, setAud] = useState<string | null>(null);
  const [msg, setMsg] = useState("");
  const [moods, setMoods] = useState<Record<string, { mood: Mood; k: number }>>({});
  const [fly, setFly] = useState<{ key: number; from: [number, number, number]; color: string } | null>(null);
  const [burst, setBurst] = useState(0);
  const [cheer, setCheer] = useState<{ mood: Mood; k: number } | undefined>(undefined);
  const k = useRef(1);
  useEffect(() => {
    filedRef.current = filed;
  }, [filed]);

  const reset = () => {
    setStep(0);
    setSelPerson(PEOPLE[0].id);
    setSel(null);
    setFiled({});
    setMistakes(0);
    setFb({ tone: "info", text: "Tap a person in the studio (or a name below), pick one of their quotes, then tap the floor pad where it belongs." });
    setAud(null);
    setMsg("");
    setMoods({});
    setFly(null);
    setCheer(undefined);
  };

  const support = useMemo(() => {
    const s: Record<string, string[]> = {};
    for (const l of ALL) if (filed[l.id] && l.trait && !(s[l.trait] ??= []).includes(l.person)) s[l.trait].push(l.person);
    return s;
  }, [filed]);
  const confirmed = TRAIT_IDS.filter((t) => (support[t]?.length ?? 0) >= 2);
  const person = PEOPLE.find((p) => p.id === selPerson);
  const selLine = ALL.find((l) => l.id === sel);

  const choosePerson = (id: string) => {
    if (step !== 0) return;
    setSelPerson(id);
    setSel(null);
  };

  const file = (f: Field) => {
    if (step !== 0) return;
    if (!selLine) return setFb({ tone: "info", text: "First pick a quote: tap a person, then one of their lines below the studio." });
    const p = PEOPLE.find((x) => x.id === selLine.person)!;
    if (selLine.field !== f) {
      setMistakes((m) => m + 1);
      setMoods((m) => ({ ...m, [p.id]: { mood: "sad", k: k.current++ } }));
      const hint = selLine.field === "bin" ? "Does this line tell us how this group buys snacks?" : "Ask: is it about who they are (profile), what they want (need), or what makes them choose a pack (buying considerations)?";
      return setFb({ tone: "bad", text: `“${selLine.text}” doesn't go in ${FIELDS.find((x) => x.id === f)!.label}. ${hint}` });
    }
    const next = { ...filed, [selLine.id]: f };
    setFiled(next);
    setSel(null);
    setMoods((m) => ({ ...m, [p.id]: { mood: "happy", k: k.current++ } }));
    setFly({ key: k.current++, from: [p.at[0], 1.6, p.at[2]], color: f === "bin" ? "#6B5B57" : FIELDS.find((x) => x.id === f)!.color });
    const t = selLine.trait;
    const n = t ? new Set(ALL.filter((x) => next[x.id] && x.trait === t).map((x) => x.person)).size : 0;
    setFb({ tone: "good", text: `${selLine.why}${t ? (n >= 2 ? ` Trait confirmed: “${TRAITS[t].label}” — ${n} people said it.` : " One person so far — a trait needs a second person before it counts.") : ""}` });
    // move on to the next person who still has quotes to file
    const still = p.lines.some((l) => !next[l.id]);
    if (!still) {
      const nxt = PEOPLE.find((x) => x.lines.some((l) => !next[l.id]));
      if (nxt) setSelPerson(nxt.id);
    }
    if (ALL.every((x) => next[x.id])) {
      setStep(1);
      setSelPerson(null);
      setFb({ tone: "info", text: "Every quote is filed and all five traits are confirmed by at least two people. Now: which target audience from the chapter is this?" });
    }
  };

  const landed = () => {
    setBurst((b) => b + 1);
    setFly(null);
  };

  const pickAud = (a: string) => {
    setAud(a);
    if (a === TARGET.audience) {
      setStep(2);
      setCheer({ mood: "happy", k: k.current++ });
      setFb({ tone: "good", text: `The table: working professionals need “${TARGET.need.replace(/\.$/, "")}”, and Eat Better could “${TARGET.appeal.replace(/\.$/, "")}” — exactly what your evidence shows. The persona's stats board now shows that row.` });
    } else {
      setMistakes((m) => m + 1);
      setFb({ tone: "bad", text: "Look at your confirmed traits: busy days, desk and short breaks, small packs. Which row of the table lists “convenient snacks for work breaks and busy schedules”?" });
    }
  };

  const checks = useMemo(() => {
    const t = msg.trim();
    const w = t.split(/\s+/).filter(Boolean).length;
    return [
      { ok: /(break|desk|on the go|shift|busy|quick|between|drawer|bag|carry)/i.test(t), label: "Uses a confirmed need: desk and short breaks", hint: "Mention the break, the desk or a busy day." },
      { ok: /(tast|chatpata|crunch|flavou?r|delicious|masala)/i.test(t), label: "Uses a confirmed need: real taste", hint: "Promise the taste they said they want." },
      { ok: /(small|single|mini|one pack|pocket|fresh|stale|re.?seal)/i.test(t), label: "Answers a buying consideration: pack size", hint: "Say something about the small pack." },
      { ok: /(roast|not fried|baked|palm oil|ingredient)/i.test(t), label: "Answers a buying consideration: not fried / ingredients", hint: "They check if it's fried — tell them, truthfully." },
      { ok: w >= 6 && w <= 22, label: "6–22 words, like a real ad line", hint: `Now ${w} words.` },
    ];
  }, [msg]);
  const done = checks.every((c) => c.ok);
  const finish = () => {
    setStep(3);
    setCheer({ mood: "happy", k: k.current++ });
    setBurst((b) => b + 1);
    setFb({ tone: "good", text: "Your persona and message are built entirely from evidence — every word traces back to something two people said." });
    onDone(`Persona Lab: The Desk-Break Snacker (working professionals), 5 traits each confirmed by 2+ interviews (${mistakes} ${mistakes === 1 ? "mistake" : "mistakes"}). Message: “${msg.trim()}”`);
  };

  const filedCount = Object.keys(filed).length;

  return (
    <GameFrame
      kicker="Activity 3 · Persona Lab"
      title="Build a persona from real evidence"
      mission="Four snack buyers are in the interview studio. File each quote onto the persona's floor pads. A trait only counts when two different people say it — and one interview may belong to a different audience."
      steps={["File the evidence", "Name the audience", "Write the message"]}
      step={step}
      stars={step === 3 ? starsFor(mistakes) : undefined}
      onReset={reset}
      feedback={fb}
      note={{ real: "The four audiences and what working professionals need come from this chapter's target-audience table.", practice: "Aman, Neha, Farah and Mr Gupta are made-up interviewees for practice, not Eat Better customer research.", tip: "A trait only counts when two different people say it. One loud voice is not a pattern." }}
    >
      <Stage3D
        label="A 3D interview studio: four interviewees stand around a persona figure on a pedestal, with a stats board above it and four filing pads on the floor"
        height="clamp(440px, 64vh, 600px)"
        camera={{ position: [0, 4, 11], fov: 40 }}
        overlay={
          <div className="pointer-events-none absolute left-2 top-2 flex flex-wrap gap-1.5">
            <span className="rounded-full bg-cocoa/90 px-3 py-1 text-[0.8rem] font-bold text-cream">
              Quotes filed {filedCount}/{ALL.length}
            </span>
            <span className="rounded-full bg-success/90 px-3 py-1 text-[0.8rem] font-bold text-white">Traits confirmed {confirmed.length}/5</span>
          </div>
        }
      >
        <Studio
          selPerson={selPerson}
          selLine={selLine}
          support={support}
          confirmed={confirmed}
          audience={step >= 2 ? aud : null}
          row={step >= 2 ? TARGET : null}
          moods={moods}
          fly={fly}
          burst={burst}
          cheer={cheer}
          message={step === 3 ? msg.trim() : null}
          onPerson={choosePerson}
          onPad={file}
          onLanded={landed}
        />
      </Stage3D>

      {step === 0 && (
        <div className="mt-4 grid gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)]">
          {/* the interviewee's quotes */}
          <div className="min-w-0 rounded-2xl border border-cocoa/15 bg-cream/60 p-3">
            <div className="flex flex-wrap gap-1.5" role="tablist" aria-label="Interviewees">
              {PEOPLE.map((p) => {
                const left = p.lines.filter((l) => !filed[l.id]).length;
                return (
                  <button key={p.id} role="tab" aria-selected={selPerson === p.id} onClick={() => choosePerson(p.id)} className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.88rem] font-bold ${selPerson === p.id ? "border-cocoa bg-cocoa text-cream" : "border-cocoa/20 bg-white text-cocoa hover:border-cocoa"}`}>
                    <UserRound className="size-4" /> {p.name.split(",")[0]}
                    <span className={`rounded-full px-1.5 text-[0.75rem] ${left ? "bg-haldi text-cocoa" : "bg-success text-white"}`}>{left || <Check className="inline size-3" />}</span>
                  </button>
                );
              })}
            </div>
            {person && (
              <ul className="mt-3 grid gap-1.5">
                <li className="text-[0.8rem] font-extrabold uppercase tracking-[0.1em] text-orange">
                  {person.name} · {person.who}
                </li>
                {person.lines.map((l) => {
                  const f = filed[l.id];
                  const on = sel === l.id;
                  return (
                    <li key={l.id}>
                      <button disabled={!!f} onClick={() => setSel(on ? null : l.id)} aria-pressed={on} className={`flex w-full items-start gap-2 rounded-xl px-3 py-2.5 text-left text-[0.95rem] leading-snug transition-colors ${f ? (f === "bin" ? "bg-white/50 text-cocoa-2/50 line-through" : "bg-success/10 text-cocoa-2") : on ? "bg-orange text-white" : "bg-white text-cocoa hover:bg-peach"}`}>
                        <Quote className="mt-0.5 size-3.5 shrink-0 opacity-60" />
                        <span className="min-w-0 flex-1">{l.text}</span>
                        {f && <span className="shrink-0 text-[0.75rem] font-bold uppercase">{FIELDS.find((x) => x.id === f)!.label}</span>}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          {/* the same four pads as buttons, easier on phones */}
          <div className="min-w-0">
            <p className="text-[0.92rem] font-semibold text-cocoa">
              {selLine ? (
                <>
                  Filing <strong>“{selLine.text}”</strong> — tap a floor pad in the studio, or here:
                </>
              ) : (
                "Pick a quote first, then file it here or on a floor pad in the studio."
              )}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2">
              {FIELDS.map((f) => (
                <button key={f.id} onClick={() => file(f.id)} disabled={!selLine} className="flex items-center gap-2 rounded-2xl border-2 bg-white px-3 py-3 text-left text-[0.95rem] font-bold leading-tight text-cocoa transition-colors disabled:opacity-50" style={{ borderColor: selLine ? f.color : "rgba(47,28,26,0.15)" }}>
                  {f.id === "bin" ? <Trash2 className="size-4 shrink-0" style={{ color: f.color }} /> : <span className="size-3 shrink-0 rounded-full" style={{ background: f.color }} />}
                  {f.label}
                </button>
              ))}
            </div>
            <ul className="mt-3 grid gap-1">
              {TRAIT_IDS.map((id) => {
                const n = support[id]?.length ?? 0;
                return (
                  <li key={id} className={`flex items-center justify-between gap-2 rounded-lg px-2.5 py-1.5 text-[0.88rem] ${n >= 2 ? "bg-success/12 font-bold text-cocoa" : n ? "bg-haldi/25 text-cocoa" : "text-cocoa-2/50"}`}>
                    <span>{n ? TRAITS[id].label : "— needs evidence —"}</span>
                    <span className="tabular-nums">{Math.min(2, n)}/2 people</span>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      )}

      <AnimatePresence>
        {step >= 1 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="mt-6 grid gap-5 border-t border-cocoa/10 pt-5 lg:grid-cols-2">
            <div>
              <div className="font-display text-[1.2rem] font-semibold text-cocoa">Which target audience from the chapter&apos;s table is this?</div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {AUDIENCES.map((a) => (
                  <button key={a} disabled={step !== 1} onClick={() => pickAud(a)} aria-pressed={aud === a} className={`rounded-2xl border-2 px-3 py-3 text-left text-[0.98rem] font-bold leading-tight ${aud === a ? (a === TARGET.audience ? "border-success bg-success/10" : "border-error bg-error/10") : "border-cocoa/15 bg-white hover:border-cocoa"} text-cocoa`}>
                    {a}
                  </button>
                ))}
              </div>
            </div>
            {step >= 2 && (
              <div>
                <label htmlFor="pmsg" className="font-display text-[1.2rem] font-semibold text-cocoa">
                  Write a marketing message for this persona
                </label>
                <p className="mt-1 text-[0.9rem] text-cocoa-2">Like the chapter&apos;s sample: “Your favourite snacking moments, with ingredients you can understand.”</p>
                <textarea id="pmsg" value={msg} disabled={step === 3} onChange={(e) => setMsg(e.target.value)} rows={3} placeholder="Your message…" className="mt-2 w-full rounded-2xl border border-line-strong bg-cream/50 px-4 py-3 text-[1.05rem] leading-relaxed text-cocoa outline-none focus:border-orange" />
                <ul className="mt-2 grid gap-1.5">
                  {checks.map((c) => (
                    <CheckRow key={c.label} {...c} />
                  ))}
                </ul>
                {step === 2 && (
                  <button disabled={!done} onClick={finish} className="eb-btn eb-btn-primary mt-3 !normal-case">
                    <Check className="size-4" /> Save persona and message
                  </button>
                )}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </GameFrame>
  );
}
