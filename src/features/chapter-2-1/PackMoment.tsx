"use client";

import Image from "next/image";
import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { Stage3D } from "@/components/play/Stage3D";
import { GameFrame, starsFor, type Feedback } from "@/components/play/GameFrame";
import type { LabResult } from "@/components/learn/LearnLab";
import { getProduct, PRODUCTS, type PackFormat } from "@/lib/brand";
import { Burst, CAST, EndCard, FitCam, Flyer, Halo, Hud, Label, Lights, Mover, Person, Photo, PhotoCard, Probe, StartCard, TextCard, pick, shuffle, useCountdown, type Mood } from "../chapter-2-3/activities/kit3d";

/**
 * 2.1 · Match the pack to the moment — a 3D snack-counter game.
 * Levels 1–2: customers walk up with a snacking moment; the student throws the right official pack (sachet, pouch,
 * box or tin AND the right snack) from a shelf of all seven official packs before the customer's patience runs out.
 * Level 3: build the front of a real pouch from a moving belt of tiles (logo, name, real snack photo, one true claim)
 * while decoys (stretched logo, another product's name, a mascot with no snack, miracle or borrowed claims) ride along.
 * Rules come from the 2.1 pack lab: format fits the moment, packaging communicates value, sell at a glance, one true claim.
 */

type Moment = { id: string; text: string; ok: string[]; img?: string; why: string };

/* practice moments; formats and products are Eat Better's official ones (src/lib/brand.ts) */
const MOMENTS: Moment[] = [
  { id: "college", text: "One laddoo to carry to college", ok: ["hazelnut-laddoo", "coffee-almond-laddoo"], img: "/brand/catalog/lab-sachet.webp", why: "A slim sachet is made for one serving on the go." },
  { id: "family", text: "Namkeen for the family to share at tea time", ok: ["millet-bhujia", "millet-bhel"], img: "/brand/catalog/lab-family.webp", why: "Pouches hold enough to share, like Eat Better's namkeens." },
  { id: "gift", text: "A gift for a colleague at Diwali", ok: ["laddoo-box-24", "laddoo-tin"], img: "/brand/catalog/lab-gift.webp", why: "Boxes and tins present an assortment as a gift: value you can see." },
  { id: "office", text: "A box of 24 assorted laddoos for an office treat", ok: ["laddoo-box-24"], img: "/brand/catalog/lab-office.webp", why: "Assortments come in boxes so everyone can pick a flavour." },
  { id: "trail", text: "A nut mix to snack from over a few days", ok: ["nut-mix"], img: "/brand/catalog/lab-nuts.webp", why: "A pouch suits a snack you dip into more than once." },
  { id: "commute", text: "A single coffee-flavoured laddoo for my commute", ok: ["coffee-almond-laddoo"], why: "One serving on the move: a single-serve sachet, and the coffee one." },
  { id: "choc", text: "One chocolatey laddoo after lunch", ok: ["hazelnut-laddoo"], why: "One serving: a sachet, and the hazelnut chocolate flavour." },
  { id: "movie", text: "A Bombay bhelpuri-style snack to share on movie night", ok: ["millet-bhel"], why: "Sharing needs a pouch, and the bhelpuri flavour is Millet Bhel." },
  { id: "grand", text: "A small round gift box to take to my grandparents", ok: ["laddoo-tin"], why: "A tin presents an assortment as a gift, and it is the round one." },
  { id: "mint", text: "Something minty and crunchy to share with flatmates", ok: ["millet-bhujia"], why: "Sharing needs a pouch, and the minty one is Millet Bhujia Pudina Masti." },
];

const FORMAT_RULE: Record<PackFormat, string> = {
  sachet: "single-serve sachets are for one serving on the go (Eat Better ships laddoos in sachets)",
  pouch: "pouches hold enough to share or to dip into more than once (Eat Better's namkeens and nut mix)",
  carton: "boxes present an assortment: value you can see, made for gifting and sharing out",
  tin: "tins present an assortment as a gift: value you can see",
};
const FORMAT_NAME: Record<PackFormat, string> = { sachet: "a single-serve sachet", pouch: "a pouch", carton: "a box", tin: "a tin" };
const fam = (f: PackFormat) => (f === "carton" || f === "tin" ? "gift" : f);

const SHORT: Record<string, string> = {
  "millet-bhujia": "Millet Bhujia",
  "millet-bhel": "Millet Bhel",
  "nut-mix": "Nut Mix",
  "hazelnut-laddoo": "Hazelnut Laddoos",
  "coffee-almond-laddoo": "Coffee Almond Laddoos",
  "laddoo-box-24": "Laddoo Box (24)",
  "laddoo-tin": "Laddoo Tin",
};
const SHELF = PRODUCTS.map((p) => p.id);
const CARD = 1.05;
const slotPos = (i: number): [number, number, number] => [((i % 4) - 1.5) * 1.3, i < 4 ? 3.45 : 2.3, -1.25];
const SERVE: [number, number, number] = [1.05, 1.15, 1.05];
const WAIT: [number, number, number] = [1.05, 0, 0.25];
const DOOR: [number, number, number] = [5.5, 0, 0.25];
const EXIT: [number, number, number] = [-5.5, 0, 0.25];

/* ── level 3: front-of-pack tiles ───────────────────────────── */

type Zone = "brand" | "name" | "image" | "claim";
type Tile = { id: string; text: string; zone: Zone | null; why: string; photo?: string; bg: string; fg?: string };
const ZONES: { id: Zone; y: number; h: number; label: string }[] = [
  { id: "brand", y: 3.62, h: 0.44, label: "who made it" },
  { id: "name", y: 3.08, h: 0.5, label: "what it is" },
  { id: "image", y: 2.27, h: 0.95, label: "the snack" },
  { id: "claim", y: 1.5, h: 0.42, label: "why it is better" },
];
const ZONE_RULE: Record<Zone, string> = {
  brand: "Look at the real pouches: the Eat Better Co logo sits at the top, so a shopper knows who made it first.",
  name: "On the real pouches the product name sits right under the logo, big and clear: what it is.",
  image: "The real snack photo fills the middle of the real pouches. Imagery sets the taste expectation.",
  claim: "The claim strip runs along the bottom of the real pouches: one short line on why it is better.",
};
const POUCHES = ["millet-bhujia", "millet-bhel", "nut-mix"] as const;

function makeTiles(pid: string): Tile[] {
  const p = getProduct(pid);
  const other = pick(PRODUCTS.filter((x) => x.id !== pid && x.line !== p.line));
  const claim = pick(p.claims);
  const borrowed = p.line === "nuts" ? "Roasted not fried" : "Sweetened with dates";
  return shuffle<Tile>([
    { id: "brand", text: "EAT BETTER CO", zone: "brand", why: "", bg: "#ffffff", fg: "#2f1c1a" },
    { id: "stretch", text: "E A T   B E T T E R   C O", zone: null, why: "That logo has been stretched wide to fill space. A stretched logo looks like a different (or fake) brand; never stretch it.", bg: "#ffffff", fg: "#8a6a60" },
    { id: "name", text: `${p.name} · ${p.flavour}`, zone: "name", why: "", bg: "#FED300" },
    { id: "wrongname", text: other.name, zone: null, why: `“${other.name}” is another Eat Better product. The front must say what THIS pack is: ${p.name}.`, bg: "#FED300" },
    { id: "image", text: "", zone: "image", why: "", photo: p.images[0], bg: "#ffffff" },
    { id: "mascot", text: "Cartoon mascot, no snack shown", zone: null, why: "A mascot with no snack tells a shopper nothing about how it will taste. Real snack imagery sets the expectation.", bg: "#BDE0FE" },
    { id: "claim", text: claim, zone: "claim", why: "", bg: "#00A341", fg: "#ffffff" },
    { id: "zero", text: "Zero calories!", zone: null, why: "A miracle claim the brand can't prove. One TRUE claim only; false claims break trust instantly.", bg: "#F83A3A", fg: "#ffffff" },
    { id: "borrowed", text: borrowed, zone: null, why: `True for other Eat Better packs, but not printed on ${p.name}. Claims vary by product: only use this pack's own claims (${p.claims.join(", ")}).`, bg: "#00A341", fg: "#ffffff" },
    { id: "wall", text: "9 claims in tiny print", zone: null, why: "A wall of tiny claims can't be read in seconds. One short claim answers the health question fast.", bg: "#d8f3dc" },
  ]);
}

/* ── scenes ───────────────────────────────────────────────────── */

function Shop({ order, onPack, cust, flying, onLand, burst, hint }: { order: string[]; onPack: (id: string) => void; cust: { key: number; look: (typeof CAST)[number]; to: [number, number, number]; react: { mood: Mood; k: number }; onArrive: () => void } | null; flying: { id: string; key: number } | null; onLand: () => void; burst: number; hint: string | null }) {
  return (
    <>
      <FitCam width={5.9} height={4.9} cy={2.15} tilt={0.7} />
      <Lights />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 1]} receiveShadow>
        <planeGeometry args={[18, 8]} />
        <meshStandardMaterial color="#E9D3BB" />
      </mesh>
      <mesh position={[0, 3, -1.6]}>
        <planeGeometry args={[18, 6]} />
        <meshStandardMaterial color="#FFF0E3" />
      </mesh>
      {/* shelves */}
      {[3.45, 2.3].map((y) => (
        <mesh key={y} position={[0, y - CARD / 2 - 0.08, -1.25]} castShadow receiveShadow>
          <boxGeometry args={[5.6, 0.1, 0.7]} />
          <meshStandardMaterial color="#b9774a" />
        </mesh>
      ))}
      {/* counter */}
      <mesh position={[0.6, 0.48, 1.05]} castShadow receiveShadow>
        <boxGeometry args={[3.4, 0.96, 0.7]} />
        <meshStandardMaterial color="#FF5C00" />
      </mesh>
      <mesh position={[0.6, 0.98, 1.05]}>
        <boxGeometry args={[3.5, 0.06, 0.8]} />
        <meshStandardMaterial color="#2f1c1a" />
      </mesh>
      {order.map((id, i) => {
        const p = getProduct(id);
        const s = slotPos(i);
        return (
          <Mover key={id} target={s} onClick={() => onPack(id)} selected={hint === id}>
            {hint === id && <Halo w={CARD + 0.25} h={CARD + 0.25} color="#00A341" />}
            <PhotoCard src={p.images[0]} size={CARD} onClick={() => onPack(id)} />
            <Label text={SHORT[id]} position={[0, -CARD / 2 + 0.06, 0.08]} h={0.12} bg="#2f1c1a" fg="#fff5ee" border="none" />
          </Mover>
        );
      })}
      {cust && <Person key={cust.key} look={cust.look} from={DOOR} to={cust.to} react={cust.react} onArrive={cust.onArrive} speed={2.4} face={0} />}
      {flying && (
        <Flyer key={flying.key} from={slotPos(order.indexOf(flying.id))} to={SERVE} dur={0.55} height={0.9} onLand={onLand}>
          <Suspense fallback={null}>
            <Photo src={getProduct(flying.id).images[0]} w={0.6} h={0.6} frame="#ffffff" />
          </Suspense>
        </Flyer>
      )}
      <Burst k={burst} at={[1.05, 1.9, 0.6]} />
      <Probe name="pack21" points={() => ({ ...Object.fromEntries(order.map((id, i) => [id, slotPos(i)])) })} />
    </>
  );
}

function Builder({ pid, tiles, placed, held, onTile, onZone, beltT, shake, burst, shopper }: { pid: string; tiles: Tile[]; placed: Partial<Record<Zone, string>>; held: string | null; onTile: (id: string) => void; onZone: (z: Zone) => void; beltT: number; shake: number; burst: number; shopper: number }) {
  const p = getProduct(pid);
  const free = tiles.filter((t) => !Object.values(placed).includes(t.id) && t.id !== held);
  const n = tiles.length;
  const span = n * 1.35;
  const beltX = (id: string) => {
    const i = tiles.findIndex((t) => t.id === id);
    let x = ((i * 1.35 + beltT * 0.55) % span) - span / 2;
    if (x < -span / 2) x += span;
    return x;
  };
  const PX = -0.85;
  const HOLD: [number, number, number] = [1.75, 2.75, 0.4];
  const zonePos = (z: Zone): [number, number, number] => [PX, ZONES.find((x) => x.id === z)!.y, 0.12];
  const tileSize = (t: Tile, z?: Zone): [number, number] => (z ? [1.7, ZONES.find((x) => x.id === z)!.h] : t.photo ? [0.8, 0.8] : [1.2, 0.5]);
  return (
    <>
      <FitCam width={5.6} height={4.9} cy={2.25} tilt={0.5} />
      <Lights />
      <mesh position={[0, 2.5, -0.6]}>
        <planeGeometry args={[18, 8]} />
        <meshStandardMaterial color="#FFF0E3" />
      </mesh>
      {/* the blank practice pouch */}
      <Mover target={[PX, 2.5, -0.05]} shake={shake}>
        <mesh castShadow>
          <boxGeometry args={[2.0, 2.75, 0.18]} />
          <meshStandardMaterial color={p.line === "nuts" ? "#e9e7f5" : "#d9ef7b"} />
        </mesh>
        <mesh position={[0, 1.3, 0.1]}>
          <boxGeometry args={[2.0, 0.08, 0.02]} />
          <meshStandardMaterial color="#2f1c1a" />
        </mesh>
      </Mover>
      {ZONES.map((z) => {
        const tid = placed[z.id];
        const t = tiles.find((x) => x.id === tid);
        return (
          <group key={z.id} position={[PX, z.y, 0.12]}>
            <mesh
              onClick={(e) => {
                e.stopPropagation();
                onZone(z.id);
              }}
            >
              <planeGeometry args={[1.8, z.h]} />
              <meshBasicMaterial color={held ? "#FF5C00" : "#ffffff"} transparent opacity={tid ? 0 : held ? 0.28 : 0.35} />
            </mesh>
            {!tid && <Label text="?" position={[0, 0, 0.05]} h={0.16} bg="#ffffff" border="#FF5C00" />}
            {t && <TileMesh t={t} size={tileSize(t, z.id)} />}
          </group>
        );
      })}
      {/* belt */}
      <mesh position={[0, 0.42, 1.2]} receiveShadow>
        <boxGeometry args={[14, 0.12, 0.9]} />
        <meshStandardMaterial color="#3d2a25" />
      </mesh>
      {free.map((t) => (
        <group key={t.id} position={[beltX(t.id), 0.95, 1.2]}>
          <TileMesh t={t} size={tileSize(t)} onClick={() => onTile(t.id)} />
        </group>
      ))}
      {held && (
        <Mover target={HOLD} selected key={held}>
          <Halo w={1.5} h={1.0} color="#FF5C00" z={-0.08} />
          <TileMesh t={tiles.find((t) => t.id === held)!} size={tileSize(tiles.find((t) => t.id === held)!)} onClick={() => onTile(held)} />
        </Mover>
      )}
      <Label text="Holding" position={[1.75, 3.4, 0.4]} h={0.13} bg="#2f1c1a" fg="#fff5ee" border="none" />
      {shopper > 0 && <Person key={shopper} look={CAST[shopper % CAST.length]} from={[-4.5, 0, 1.9]} to={[4.5, 0, 1.9]} speed={2.2} face={Math.PI / 2} />}
      <Burst k={burst} at={[PX, 2.6, 0.4]} />
      <Probe
        name="front21"
        points={() => ({
          ...Object.fromEntries(free.map((t) => [t.id, [beltX(t.id), 0.95, 1.2] as [number, number, number]])),
          ...Object.fromEntries(ZONES.map((z) => [`zone-${z.id}`, zonePos(z.id)])),
          held: HOLD,
        })}
      />
    </>
  );
}

function TileMesh({ t, size, onClick }: { t: Tile; size: [number, number]; onClick?: () => void }) {
  if (t.photo)
    return (
      <group
        onClick={(e) => {
          if (!onClick) return;
          e.stopPropagation();
          onClick();
        }}
      >
        <Suspense fallback={null}>
          <Photo src={t.photo} w={Math.min(size[0], size[1])} h={Math.min(size[0], size[1])} frame="#ffffff" />
        </Suspense>
      </group>
    );
  return <TextCard text={t.text} w={size[0]} h={size[1]} bg={t.bg} fg={t.fg ?? "#2f1c1a"} size={t.id === "brand" || t.id === "stretch" ? 0.17 : 0.13} maxW={t.id === "stretch" ? 40 : 20} onClick={onClick} />;
}

/* ── the game ─────────────────────────────────────────────────── */

type Phase = "intro" | "serve" | "build" | "glance" | "won" | "lost";
const PATIENCE = [20, 13];
const PER_LEVEL = 4;

export default function PackMoment({ onDone }: { onDone: (r: LabResult) => void }) {
  const [phase, setPhase] = useState<Phase>("intro");
  const [level, setLevel] = useState(0);
  const [queue, setQueue] = useState<Moment[]>(() => shuffle(MOMENTS));
  const [qi, setQi] = useState(0);
  const [order, setOrder] = useState<string[]>(() => shuffle(SHELF));
  const [cust, setCust] = useState<{ key: number; look: (typeof CAST)[number]; to: [number, number, number]; react: { mood: Mood; k: number }; waiting: boolean } | null>(null);
  const [flying, setFlying] = useState<{ id: string; key: number } | null>(null);
  const [hearts, setHearts] = useState(3);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [mist, setMist] = useState<string[]>([]);
  const [fb, setFb] = useState<Feedback>({ tone: "info", text: "Press Start. Read each customer's moment, then tap the official pack that fits it." });
  const [burst, setBurst] = useState(0);
  const [served, setServed] = useState<{ m: Moment; id: string }[]>([]);
  const [lastServed, setLastServed] = useState<{ m: Moment; id: string } | null>(null);
  const [hint, setHint] = useState<string | null>(null);
  // level 3
  const [pid, setPid] = useState<string>(POUCHES[0]);
  const [tiles, setTiles] = useState<Tile[]>(() => makeTiles(POUCHES[0]));
  const [placed, setPlaced] = useState<Partial<Record<Zone, string>>>({});
  const [held, setHeld] = useState<string | null>(null);
  const [beltT, setBeltT] = useState(0);
  const [shake, setShake] = useState(0);
  const [shopper, setShopper] = useState(0);
  const [glance, setGlance] = useState(0);
  const runs = useRef(0);
  const keyRef = useRef(1);
  const busy = useRef(false);

  const moment = queue[qi];
  const levelStart = level * PER_LEVEL;

  // the countdown fires after render, so it calls whichever timeout handler the latest render produced
  const onTimeout = useRef<() => void>(() => {});
  const patience = useCountdown(phase === "serve" && !!cust?.waiting && !flying, () => onTimeout.current());
  const buildClock = useCountdown(phase === "build", () => {
    setPhase("lost");
    setFb({ tone: "bad", text: "The shelf-ready deadline passed. Grab the logo, the name, the real snack photo and one true claim faster; ignore the decoys." });
  });
  // belt movement: runs only while the build level is on screen, and stops if the learner leaves the page
  const beltOn = phase === "build";
  useEffect(() => {
    if (!beltOn) return;
    const t0 = performance.now();
    let id = 0;
    const tick = (t: number) => {
      setBeltT((t - t0) / 1000);
      id = requestAnimationFrame(tick);
    };
    id = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(id);
  }, [beltOn]);

  const lose = (text: string) => {
    setPhase("lost");
    setFb({ tone: "bad", text });
  };
  const miss = (rule: string, text: string, heart = true) => {
    setMist((m) => [...m, rule]);
    setCombo(0);
    setFb({ tone: "bad", text });
    if (heart) {
      const h = hearts - 1;
      setHearts(h);
      if (h <= 0) {
        setCust((c) => (c ? { ...c, waiting: false, to: EXIT, react: { mood: "angry", k: ++keyRef.current } } : c));
        lose(`${text} Out of lives: every customer you lose is a sale lost. Try again; the moments and the shelf are reshuffled.`);
        return true;
      }
    }
    return false;
  };

  const spawn = (i: number) => {
    setCust({ key: ++keyRef.current, look: CAST[(i + runs.current) % CAST.length], to: WAIT, react: { mood: "calm", k: 0 }, waiting: false });
    setHint(null);
  };

  const start = () => {
    runs.current += 1;
    const q = shuffle(MOMENTS);
    setQueue(q);
    setQi(0);
    setLevel(0);
    setOrder(shuffle(SHELF));
    setHearts(3);
    setScore(0);
    setCombo(0);
    setMist([]);
    setServed([]);
    setLastServed(null);
    setFlying(null);
    setPlaced({});
    setHeld(null);
    setShopper(0);
    setGlance(0);
    busy.current = false;
    setPhase("serve");
    setFb({ tone: "info", text: "A customer is walking up. Read their moment on the order ticket, then tap the pack that fits." });
    spawn(0);
  };

  const arrive = () => {
    setCust((c) => (c && c.to === WAIT ? { ...c, waiting: true } : c));
    patience.reset(PATIENCE[level] ?? 13);
  };

  const next = (afterQi: number) => {
    // afterQi = index of the moment just finished
    const nq = afterQi + 1;
    window.setTimeout(() => {
      busy.current = false;
      if (nq >= levelStart + PER_LEVEL) {
        if (level === 0) {
          setLevel(1);
          setQi(nq);
          setOrder((o) => shuffle(o));
          setFb({ tone: "good", text: "Morning queue served. Festive rush next: less patience, and the shelf gets restocked in a new order after every sale." });
          spawn(nq);
        } else {
          // level 3
          const p = pick(POUCHES);
          setPid(p);
          setTiles(makeTiles(p));
          setPlaced({});
          setHeld(null);
          setLevel(2);
          setCust(null);
          setPhase("build");
          buildClock.reset(50);
          setFb({ tone: "info", text: `Last level: put the front of a ${getProduct(p).name} pouch together so it sells at a glance. Tap a tile on the belt, then tap its place on the pouch. Some tiles are traps.` });
        }
        return;
      }
      setQi(nq);
      if (level === 1) setOrder((o) => shuffle(o));
      spawn(nq);
    }, 1300);
  };

  const timeout = () => {
    if (phase !== "serve" || !cust) return;
    busy.current = true;
    setCust((c) => (c ? { ...c, waiting: false, to: EXIT, react: { mood: "angry", k: ++keyRef.current } } : c));
    const m = moment;
    const ok = m.ok.map((id) => SHORT[id]).join(" or ");
    if (!miss("patience", `Too slow: the customer walked out. “${m.text}” needed ${ok}. ${m.why}`)) next(qi);
  };
  useEffect(() => {
    onTimeout.current = timeout;
  });

  const onPack = (id: string) => {
    if (phase !== "serve" || !cust?.waiting || flying || busy.current) return;
    setFlying({ id, key: ++keyRef.current });
  };

  const land = () => {
    const f = flying;
    setFlying(null);
    if (!f || !cust) return;
    const m = moment;
    const p = getProduct(f.id);
    if (m.ok.includes(f.id)) {
      busy.current = true;
      const pts = 100 + combo * 25 + Math.round(patience.left * 4);
      setScore((s) => s + pts);
      setCombo((c) => c + 1);
      setBurst((b) => b + 1);
      setServed((s) => [...s, { m, id: f.id }]);
      setLastServed({ m, id: f.id });
      setCust((c) => (c ? { ...c, waiting: false, to: EXIT, react: { mood: "happy", k: ++keyRef.current } } : c));
      setFb({ tone: "good", text: `${p.name} in ${FORMAT_NAME[p.officialFormat]}: ${m.why} +${pts}` });
      next(qi);
      return;
    }
    setCust((c) => (c ? { ...c, react: { mood: "sad", k: ++keyRef.current } } : c));
    const want = getProduct(m.ok[0]).officialFormat;
    const sameFamily = m.ok.some((id) => fam(getProduct(id).officialFormat) === fam(p.officialFormat));
    const text = sameFamily
      ? `Right kind of pack, wrong snack. ${p.name} is ${FORMAT_NAME[p.officialFormat]}, but “${m.text}” asks for ${m.ok.map((id) => SHORT[id]).join(" or ")}. Read the photo and the name.`
      : `${p.name} comes in ${FORMAT_NAME[p.officialFormat]}, but ${FORMAT_RULE[want]}. “${m.text}” needs ${FORMAT_NAME[want]}.`;
    if (level === 1 && !sameFamily) setHint(null);
    miss(sameFamily ? "snack" : "format", text);
  };

  /* level 3 */
  const onTile = (id: string) => {
    if (phase !== "build") return;
    setHeld((h) => (h === id ? null : id));
  };
  const onZone = (z: Zone) => {
    if (phase !== "build") return;
    if (!held) return setFb({ tone: "info", text: "First tap a tile on the moving belt to pick it up, then tap where it goes on the pouch." });
    if (placed[z]) return setFb({ tone: "info", text: "That part of the pouch is already done. Pick another spot." });
    const t = tiles.find((x) => x.id === held)!;
    if (t.zone === null) {
      setHeld(null);
      setTiles((ts) => ts.filter((x) => x.id !== t.id));
      setShake((s) => s + 1);
      buildClock.add(-5);
      setMist((m) => [...m, "claim"]);
      setCombo(0);
      return setFb({ tone: "bad", text: `${t.why} (−5 s, tile binned)` });
    }
    if (t.zone !== z) {
      setShake((s) => s + 1);
      buildClock.add(-3);
      setMist((m) => [...m, "glance"]);
      setCombo(0);
      return setFb({ tone: "bad", text: `Not there. ${ZONE_RULE[t.zone]} (−3 s)` });
    }
    const np = { ...placed, [z]: t.id };
    setPlaced(np);
    setHeld(null);
    setBurst((b) => b + 1);
    setScore((s) => s + 60 + combo * 10);
    setCombo((c) => c + 1);
    setFb({ tone: "good", text: ZONE_RULE[z] });
    if (Object.keys(np).length === 4) {
      setPhase("glance");
      setShopper((s) => s + 1);
      setGlance(0);
      [1, 2, 3].forEach((k) => window.setTimeout(() => setGlance(k), 650 * k));
      window.setTimeout(() => finish(np), 2600);
    }
  };

  const finish = (np: Partial<Record<Zone, string>>) => {
    const p = getProduct(pid);
    const claim = tiles.find((t) => t.id === np.claim)?.text ?? "";
    const stars = starsFor(mist.length);
    setPhase("won");
    setFb({ tone: "good", text: `The shopper got who (Eat Better Co), what (${p.name}) and why (“${claim}”) in one glance. Packaging attracts attention, communicates value and influences the purchase.` });
    const formats = served.map((s) => `${s.m.text} → ${SHORT[s.id]}`).join("; ");
    onDone({
      score: Math.max(0, Math.min(5, 5 - Math.floor(mist.length / 2))),
      attempts: runs.current,
      created: `Served ${served.length} snacking moments (${formats}). Front of the ${p.name} pouch, top to bottom: Eat Better Co logo · ${p.name} ${p.flavour} · real snack photo · “${claim}”. ${stars} stars, ${score} points.`,
      mistakes: mist,
    });
  };

  const stepIdx = phase === "won" ? 3 : level;
  const stars = phase === "won" ? starsFor(mist.length) : undefined;
  const timeFrac = phase === "build" || phase === "glance" ? buildClock.frac : patience.frac;
  const timeLabel = phase === "build" || phase === "glance" ? `${Math.ceil(buildClock.left)}s` : cust?.waiting ? `${Math.ceil(patience.left)}s` : "";

  const glanceRows = useMemo(() => {
    const p = getProduct(pid);
    return [`Who? Eat Better Co`, `What? ${p.name}`, `Why better? ${tiles.find((t) => t.id === placed.claim)?.text ?? ""}`];
  }, [pid, tiles, placed.claim]);

  return (
    <GameFrame
      kicker="Activity · Match the pack to the moment"
      title="Snack Counter Rush"
      mission="Customers walk up with a snacking moment. Throw them the official pack that fits: the right format (sachet, pouch, box or tin) and the right snack. Then build a pouch front that sells in seconds."
      steps={["Morning queue", "Festive rush", "Front of pack"]}
      step={stepIdx}
      stars={stars}
      onReset={phase === "intro" ? undefined : start}
      feedback={fb}
      note={{
        real: "All seven packs, their names, formats and printed claims are Eat Better's official products and photos. Eat Better ships laddoos in single-serve sachets, namkeens and nut mix in pouches, assortments in boxes and tins.",
        practice: "The customers and their snacking moments are made up for practice. They, and the shelf order, are shuffled every game.",
        tip: "Read the photo: the official pack shows its own format. Then check the snack matches the moment.",
      }}
    >
      <Stage3D
        label="A 3D snack counter: a shelf of seven official Eat Better packs, a customer at the counter, and later a blank pouch with a moving belt of tiles"
        height="clamp(420px, 62vh, 560px)"
        camera={{ position: [0, 3, 9], fov: 40 }}
        overlay={
          <>
            {phase !== "intro" && (
              <Hud hearts={hearts} maxHearts={3} frac={phase === "won" || phase === "lost" ? undefined : timeFrac} timeLabel={timeLabel} score={score} combo={combo} />
            )}
            {phase === "serve" && moment && (
              <div className="pointer-events-none absolute inset-x-2 bottom-2 flex items-end gap-2" data-testid="ticket">
                <div className="min-w-0 flex-1 rounded-2xl border-2 border-cocoa bg-white/95 px-3 py-2 shadow-[2px_2px_0_0_#2f1c1a]">
                  <div className="text-[0.7rem] font-extrabold uppercase tracking-[0.12em] text-orange">
                    Order {qi - levelStart + 1} of {PER_LEVEL} · practice customer
                  </div>
                  <div className="font-display text-[1.05rem] font-semibold leading-snug text-cocoa sm:text-[1.2rem]">“{moment.text}”</div>
                </div>
                {lastServed?.m.img && (
                  <div className="relative hidden size-[4.2rem] shrink-0 overflow-hidden rounded-xl border-2 border-success bg-white sm:block" title="Last moment served">
                    <Image src={lastServed.m.img} alt={`Moment served: ${lastServed.m.text}`} fill sizes="80px" className="object-cover" />
                  </div>
                )}
              </div>
            )}
            {phase === "glance" && (
              <div className="pointer-events-none absolute inset-x-2 bottom-2 grid gap-1 rounded-2xl border-2 border-success bg-white/95 p-2.5 text-[0.95rem] font-bold text-cocoa">
                <div className="text-[0.72rem] font-extrabold uppercase tracking-[0.12em] text-success">3-second shelf glance</div>
                {glanceRows.map((r, i) => (
                  <div key={r} className={`transition-opacity ${glance > i ? "opacity-100" : "opacity-20"}`}>
                    {glance > i ? "✓ " : ""}
                    {r}
                  </div>
                ))}
              </div>
            )}
            {phase === "intro" && (
              <StartCard
                title="Snack Counter Rush"
                lines={["Each customer has a snacking moment. Tap the official pack that fits it before their patience runs out.", "Wrong format or wrong snack costs a life. Three lives.", "Level 3: build a pouch front from a moving belt. Some tiles are traps."]}
                onStart={start}
              />
            )}
            {phase === "lost" && <EndCard win={false} title="Shop closed early" text="Read the feedback below, then play again. The moments and the shelf are shuffled." onRestart={start} />}
            {phase === "won" && <EndCard win title="Every moment served" text={`${served.length} customers served and a pouch that sells at a glance. ${score} points.`} stars={stars} onRestart={start} />}
          </>
        }
      >
        {phase === "build" || phase === "glance" || (phase === "won" && level === 2) || (phase === "lost" && level === 2) ? (
          <Builder pid={pid} tiles={tiles} placed={placed} held={held} onTile={onTile} onZone={onZone} beltT={beltT} shake={shake} burst={burst} shopper={shopper} />
        ) : (
          <Shop
            order={order}
            onPack={onPack}
            cust={cust ? { ...cust, onArrive: arrive } : null}
            flying={flying}
            onLand={land}
            burst={burst}
            hint={hint}
          />
        )}
      </Stage3D>
    </GameFrame>
  );
}
