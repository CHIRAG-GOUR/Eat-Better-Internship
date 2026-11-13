"use client";

import { useMemo, useState } from "react";
import { useThree } from "@react-three/fiber";
import { Check, Mic, Star } from "lucide-react";
import { Stage3D } from "@/components/play/Stage3D";
import { GameFrame, type Feedback } from "@/components/play/GameFrame";
import { Human } from "@/components/world2/Human";
import { EVOLUTION, EXHIBITIONS, STORY } from "../content";
import { EndCard, FitCam, Hearts, Label, PEOPLE, Reactor, Room, Stat, shuffle, type Mood } from "./kit";

/**
 * Interview the founders: a press-room game. The student builds a question (a starter + a topic) and asks it.
 * Open questions about the founders' FIRST YEAR make them lean in and share a real fact from the chapter; yes/no
 * questions, leading questions, repeats and questions about later years lose their patience. Five good questions
 * (all different topics) win the interview; then the student stars the best one and says why (writing).
 */

type Topic = { id: string; phrase: string; first: boolean; fact: string };
const first = (s: string) => s.split(/(?<=\.)\s/)[0];
const TOPICS: Topic[] = [
  { id: "problem", phrase: "turning a family snack problem into a business", first: true, fact: first(STORY[0].text) },
  { id: "kitchen", phrase: "experimenting in your home kitchen", first: true, fact: first(STORY[1].text) },
  { id: "stall", phrase: "selling at exhibitions", first: true, fact: EXHIBITIONS.points[0] },
  { id: "feedback", phrase: "hearing what customers told you face to face", first: true, fact: EXHIBITIONS.points[1] },
  { id: "bigger", phrase: "realising the problem was bigger than your own family", first: true, fact: first(STORY[2].text) },
  { id: "roles", phrase: "doing every job yourselves", first: true, fact: `${EVOLUTION.early.text} ${EVOLUTION.early.tasks.join(", ").toLowerCase()}.` },
  { id: "shark", phrase: "pitching on Shark Tank India", first: false, fact: "" },
  { id: "round", phrase: "raising the Rs 17 crore round", first: false, fact: "" },
  { id: "facility", phrase: "moving into a 50,000 sq. ft. facility", first: false, fact: "" },
];

type Starter = { id: string; kind: "open" | "closed" | "leading"; make: (t: string) => string; label: string };
const STARTERS: Starter[] = [
  { id: "o1", kind: "open", label: "What surprised you most about…", make: (t) => `What surprised you most about ${t}?` },
  { id: "o2", kind: "open", label: "Tell me about… What went wrong at first?", make: (t) => `Tell me about ${t}. What went wrong at first?` },
  { id: "o3", kind: "open", label: "How did… change what you did next?", make: (t) => `How did ${t} change what you did next?` },
  { id: "c1", kind: "closed", label: "Was… fun?", make: (t) => `Was ${t} fun?` },
  { id: "c2", kind: "closed", label: "Did… work?", make: (t) => `Did ${t} work?` },
  { id: "l1", kind: "leading", label: "Surely… was easy, wasn't it?", make: (t) => `Surely ${t} was easy, wasn't it?` },
];

type Got = { q: string; topic: string };
type Props = { qs: string[]; best: number | null; why: string; onChange: (p: { qs?: string[]; best?: number | null; why?: string }) => void };

function Scene({ mood, kick, bubble }: { mood: Mood; kick: number; bubble: string }) {
  const { size } = useThree();
  const wide = size.width / size.height > 1.3;
  const dx = wide ? 2.1 : 1.6;
  const names = ["Mridula", "Shaurya", "Vidushi"];
  const looks = [PEOPLE[0], PEOPLE[1], PEOPLE[4]];
  return (
    <>
      {wide ? <FitCam width={9.4} height={4.4} cy={1.55} /> : <FitCam width={6.6} height={4.2} cy={1.5} />}
      <ambientLight intensity={1.1} />
      <directionalLight position={[3, 6, 5]} intensity={1.2} />
      <Room floor="#c9a27a" wall="#F6E3CF" />
      {names.map((n, i) => (
        <group key={n}>
          <Reactor mood={mood} kick={kick} position={[(i - 1) * dx, 0, -0.9]}>
            <Human look={looks[i]} mode="stand" phase={i * 2} />
          </Reactor>
          <Label position={[(i - 1) * dx, 2.05, -0.9]} text={`${n} (illustrated)`} bg="#FED300" h={0.17} />
        </group>
      ))}
      <mesh position={[0, 0.42, -0.2]}>
        <boxGeometry args={[wide ? 6.6 : 4.8, 0.84, 0.8]} />
        <meshStandardMaterial color="#6b3f2a" roughness={0.7} />
      </mesh>
      {/* the student's microphone */}
      <group position={[wide ? -3.6 : -2.6, 0, 1.3]}>
        <mesh position={[0, 0.7, 0]}>
          <cylinderGeometry args={[0.03, 0.03, 1.4, 8]} />
          <meshStandardMaterial color="#222" />
        </mesh>
        <mesh position={[0, 1.5, 0]}>
          <sphereGeometry args={[0.14, 14, 12]} />
          <meshStandardMaterial color="#FF5C00" />
        </mesh>
        <Label position={[0, 1.95, 0]} text="You" bg="#FF5C00" fg="#fff" h={0.2} />
      </group>
      {bubble && <Label position={[0, 2.75, -0.9]} text={bubble} bg="#fff" h={0.22} />}
    </>
  );
}

export default function InterviewGame({ qs, best, why, onChange }: Props) {
  const [order, setOrder] = useState(() => shuffle(TOPICS));
  const [starter, setStarter] = useState<string | null>(null);
  const [topic, setTopic] = useState<string | null>(null);
  const [got, setGot] = useState<Got[]>([]);
  const [strikes, setStrikes] = useState(0);
  const [lost, setLost] = useState(false);
  const [fb, setFb] = useState<Feedback>(null);
  const [answer, setAnswer] = useState<{ topic: string; text: string } | null>(null);
  const [mood, setMood] = useState<Mood>("idle");
  const [kick, setKick] = useState(0);
  const [bubble, setBubble] = useState("");
  const [starters, setStarters] = useState(() => shuffle(STARTERS));

  const filled = qs.length === 5 && qs.every((q) => q.trim().length > 0);
  const phase: "play" | "pick" | "lost" = filled ? "pick" : lost ? "lost" : "play";
  const preview = useMemo(() => {
    const s = STARTERS.find((x) => x.id === starter);
    const t = TOPICS.find((x) => x.id === topic);
    return s && t ? s.make(t.phrase) : "";
  }, [starter, topic]);
  const whyOk = why.trim().length >= 15;

  const react = (m: Mood, text: string) => {
    setMood(m);
    setKick((k) => k + 1);
    setBubble(text);
  };

  const ask = () => {
    const s = STARTERS.find((x) => x.id === starter);
    const t = TOPICS.find((x) => x.id === topic);
    if (!s || !t) return;
    const weak = (text: string, say: string) => {
      const n = strikes + 1;
      setStrikes(n);
      setAnswer(null);
      react("sad", say);
      setFb({ tone: "bad", text });
      if (n >= 3) setLost(true);
    };
    if (!t.first) weak(`That is about a later chapter of the story. Your interview is about the founders' first year, which started in August 2020 with exhibitions and direct selling.`, "That's much later…");
    else if (s.kind === "closed") weak(`A yes/no question gets a one-word answer: "Yes." Start with what, how or tell me, so the founders have to tell a story.`, "Yes. Next?");
    else if (s.kind === "leading") weak(`"Wasn't it easy?" puts the answer in the founders' mouths. You want their story, not your guess, so ask an open question.`, "Not quite…");
    else if (got.some((g) => g.topic === t.id)) weak(`You already asked about that. A new topic gets you a new part of the story.`, "Asked already!");
    else {
      const q = s.make(t.phrase);
      const list = [...got, { q, topic: t.id }];
      setGot(list);
      setAnswer({ topic: t.id, text: t.fact });
      react("cheer", "Great question!");
      setFb({ tone: "good", text: `An open question about the first year makes the founders lean in. From the chapter: ${t.fact}` });
      if (list.length === 5) onChange({ qs: list.map((g) => g.q), best: null, why: "" });
    }
    setStarter(null);
    setTopic(null);
  };

  const reset = () => {
    setOrder(shuffle(TOPICS));
    setStarters(shuffle(STARTERS));
    setStarter(null);
    setTopic(null);
    setGot([]);
    setStrikes(0);
    setLost(false);
    setFb(null);
    setAnswer(null);
    setBubble("");
    setMood("idle");
    onChange({ qs: ["", "", "", "", ""], best: null, why: "" });
  };

  return (
    <GameFrame
      kicker="Mini activity · Interview the founders"
      title="The press room"
      mission="Build five questions about the founders' first year. Open questions on a new topic make them lean in; yes/no, leading, repeated or off-topic questions use up their patience. Then star your best one."
      steps={["Ask 5 good questions", "Star your best"]}
      step={phase === "pick" ? (best !== null && whyOk ? 2 : 1) : 0}
      stars={phase === "pick" && best !== null && whyOk ? (strikes === 0 ? 3 : strikes === 1 ? 2 : 1) : undefined}
      onReset={reset}
      feedback={fb}
      note={{
        real: "The founders' answers quote the chapter: the family problem, the home-kitchen experiments, exhibitions and direct selling, and doing every job themselves.",
        practice: "The founders are illustrated characters and this is practice: you are not talking to the real founders. Share your questions with a mentor.",
      }}
    >
      <Stage3D label="A 3D press room: three illustrated founders sit behind a table and react to your questions" camera={{ position: [0, 2, 9], fov: 42 }} height="clamp(260px, 42vh, 420px)"
        overlay={
          <div className="flex items-start justify-between gap-2 p-2">
            <Stat label="Good questions" value={`${phase === "pick" ? 5 : got.length} / 5`} tone="orange" />
            <div className="rounded-xl bg-white/90 px-2 py-1">
              <Hearts n={3 - strikes} label="founders' patience" />
            </div>
          </div>
        }
      >
        <Scene mood={mood} kick={kick} bubble={bubble} />
      </Stage3D>

      {phase === "play" && (
        <div className="mt-3 grid gap-3 lg:grid-cols-2">
          <div>
            <div className="text-[0.8rem] font-extrabold uppercase tracking-[0.12em] text-cocoa-2">1 · Start your question</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {starters.map((s) => (
                <button key={s.id} data-testid={`starter-${s.id}`} onClick={() => setStarter(s.id)} aria-pressed={starter === s.id} className={`rounded-xl border-2 px-3 py-2 text-left text-[0.95rem] font-bold ${starter === s.id ? "border-orange bg-orange/10" : "border-cocoa/15 bg-white hover:border-cocoa"}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="text-[0.8rem] font-extrabold uppercase tracking-[0.12em] text-cocoa-2">2 · Pick what it is about</div>
            <div className="mt-2 flex flex-wrap gap-2">
              {order.map((t) => (
                <button key={t.id} data-testid={`topic-${t.id}`} onClick={() => setTopic(t.id)} aria-pressed={topic === t.id} className={`rounded-xl border-2 px-3 py-2 text-left text-[0.95rem] font-bold ${topic === t.id ? "border-orange bg-orange/10" : got.some((g) => g.topic === t.id) ? "border-success/40 bg-success/10" : "border-cocoa/15 bg-white hover:border-cocoa"}`}>
                  {t.phrase}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-2xl bg-cream p-3 lg:col-span-2">
            <div className="flex items-center gap-2 text-[0.8rem] font-extrabold uppercase tracking-[0.12em] text-cocoa-2">
              <Mic className="size-4 text-orange" /> Your question
            </div>
            <p className="mt-1 min-h-[1.6em] text-[1.1rem] font-semibold text-cocoa" data-testid="preview">{preview || "Pick a starter and a topic."}</p>
            <button data-testid="ask-btn" onClick={ask} disabled={!preview} className="eb-btn eb-btn-primary mt-2 !normal-case">
              Ask the founders
            </button>
          </div>
          {got.length > 0 && (
            <ol className="space-y-1.5 lg:col-span-2" aria-label="Questions asked so far">
              {got.map((g, i) => (
                <li key={g.q} className="flex items-start gap-2 rounded-xl bg-success/10 px-3 py-2 text-[0.95rem] text-cocoa">
                  <Check className="mt-0.5 size-4 shrink-0 text-success" strokeWidth={3} /> <span><strong>{i + 1}.</strong> {g.q}</span>
                </li>
              ))}
            </ol>
          )}
          {answer && <p className="rounded-xl bg-peach/70 px-3 py-2 text-[0.95rem] text-cocoa lg:col-span-2"><strong>The founders lean in:</strong> {answer.text}</p>}
        </div>
      )}

      {phase === "lost" && <EndCard won={false} title="The founders had to leave" body="Three weak questions used up their patience. Open questions (what, how, tell me) about their first year, one new topic each time, keep a conversation going." onRestart={reset} />}

      {phase === "pick" && (
        <div className="mt-3 rounded-[20px] bg-peach/70 p-4" data-testid="pick-best">
          <div className="font-display text-[1.25rem] font-semibold text-cocoa">Your five questions. Star the one that would teach you the most.</div>
          <ol className="mt-3 space-y-2">
            {qs.map((q, i) => (
              <li key={i} className="flex items-center gap-2.5">
                <button data-testid={`best-${i}`} onClick={() => onChange({ best: best === i ? null : i })} aria-pressed={best === i} aria-label={`Mark question ${i + 1} as my best question`} className={`grid size-10 shrink-0 place-items-center rounded-full border-2 ${best === i ? "border-cocoa bg-haldi text-cocoa" : "border-cocoa/25 bg-white text-cocoa-2 hover:border-cocoa"}`}>
                  <Star className="size-5" fill={best === i ? "currentColor" : "none"} />
                </button>
                <span className="rounded-2xl bg-white px-3 py-2 text-[1rem] text-cocoa">{q}</span>
              </li>
            ))}
          </ol>
          {best !== null && (
            <textarea
              value={why}
              onChange={(e) => onChange({ why: e.target.value })}
              rows={3}
              aria-label="Why your best question would teach you the most"
              placeholder="This question would teach me the most because…"
              className="mt-3 w-full rounded-2xl border border-line-strong bg-white px-4 py-3 text-[1.05rem] leading-relaxed text-cocoa outline-none focus:border-orange"
            />
          )}
          <p className="mt-2 text-[0.95rem] text-cocoa-2">{best === null ? "Tap a star." : whyOk ? "Interview ready. Share your questions with a mentor." : "Say why in a sentence or two."}</p>
        </div>
      )}
    </GameFrame>
  );
}
