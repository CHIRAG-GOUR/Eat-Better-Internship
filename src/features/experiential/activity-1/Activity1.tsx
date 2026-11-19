"use client";

import dynamic from "next/dynamic";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, BadgeCheck, Check, ChevronRight, Download, FlaskConical, Info, Maximize, Minimize, PackageCheck, RotateCcw, ShieldCheck, Star, TriangleAlert, X } from "lucide-react";
import { CATEGORIES, CHECKPOINTS, CONSUMERS, FLAVOURS, ING, INGREDIENTS, REFERENCE, rng, type CheckpointId } from "./data";
import { IngredientIcon } from "./IngredientIcon";
import { useLab } from "./store";
import { drawLabel } from "./label";
import type { Focus, Lot, PackOption, TrayItem } from "./Lab3D";
import { buildReport, downloadDataUrl, type ReportBlock } from "../shared/pdf";
import { ProjectReady, useStudent } from "../shared/ProjectReady";
import { detectWebGL } from "@/lib/useClient";

const Lab3D = dynamic(() => import("./Lab3D"), { ssr: false, loading: () => <div className="grid h-full place-items-center text-cocoa-2">Loading the lab…</div> });

const STAGES = ["Discover", "Ingredients", "Build", "Quality line", "Label", "Project"];
const ALLERGENS = ["Tree nuts", "Peanut", "Milk", "Gluten (wheat)", "Soy", "Sesame"];
const allergenOf = (id: string) => ING[id]?.allergen ?? null;

type Fb = { tone: "good" | "bad" | "info"; text: string } | null;

/* ── practice scenario generator (seeded per attempt) ───────── */
function scenario(seed: number, main: string) {
  const r = rng(seed);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length)];
  const moistSpec = main === "dates" ? 22 : 8;
  const faults = ["mould", "rancid", "moisture", "old"] as const;
  const badLot = Math.floor(r() * 3);
  const fault = pick([...faults]);
  const lots = ["A", "B", "C"].map((id, i) => {
    const bad = i === badLot;
    return {
      id,
      fault: bad ? fault : null,
      months: bad && fault === "old" ? 14 + Math.floor(r() * 6) : 1 + Math.floor(r() * 4),
      moisture: bad && fault === "moisture" ? moistSpec + 3 + Math.round(r() * 4) : Math.max(2, moistSpec - 2 - Math.round(r() * 3)),
      smell: bad && fault === "rancid" ? "Sharp, paint-like (rancid)" : "Fresh, typical",
      visual: bad && fault === "mould" ? "Grey-green fuzzy spots on some pieces" : "Clean, even colour",
    };
  });
  const kinds: TrayItem["kind"][] = ["stone", "shell", "twig", "plastic"];
  const tray: TrayItem[] = [];
  for (let i = 0; i < 14; i++) tray.push({ id: i, kind: i < 4 ? kinds[i] : "good", x: -0.65 + r() * 1.3, z: -0.32 + r() * 0.64 });
  tray.sort(() => r() - 0.5);
  const T0 = 140 + Math.floor(r() * 7) * 5; // 140..170
  const t0 = 10 + Math.floor(r() * 9); // 10..18
  const badBatch = Math.floor(r() * 3);
  const badKind = pick(["taste", "moisture", "colour"] as const);
  const batches = [0, 1, 2].map((i) => {
    const bad = i === badBatch;
    return {
      taste: bad && badKind === "taste" ? +(5.5 + r()).toFixed(1) : +(8.2 + r() * 1.3).toFixed(1),
      moisture: bad && badKind === "moisture" ? moistSpec / 2 + 4 + Math.round(r() * 2) : Math.max(1.5, +(moistSpec / 2 - r() * 1.5).toFixed(1)),
      colour: bad && badKind === "colour" ? "Much darker than the golden sample" : "Matches the golden sample",
      bad,
    };
  });
  const leak = Math.floor(r() * 3);
  return { lots, tray, T0, t0, batches, badKind, moistSpec, leak };
}

/* ── small UI bits ─────────────────────────────────────────── */
function Bar({ label, v }: { label: string; v: "Low" | "Medium" | "High" }) {
  const w = v === "High" ? 100 : v === "Medium" ? 62 : 28;
  return (
    <div>
      <div className="flex justify-between text-[0.82rem] font-bold text-cocoa-2">
        <span>{label}</span>
        <span>{v}</span>
      </div>
      <div className="mt-1 h-2 rounded-full bg-cream">
        <div className="h-full rounded-full bg-orange" style={{ width: `${w}%` }} />
      </div>
    </div>
  );
}

function Feedback({ fb }: { fb: Fb }) {
  return (
    <AnimatePresence mode="wait">
      {fb && (
        <motion.div key={fb.text} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} role="status" className={`mt-3 rounded-2xl px-4 py-3 text-[0.98rem] leading-snug ${fb.tone === "good" ? "bg-success/12 text-cocoa" : fb.tone === "bad" ? "bg-error/10 text-cocoa" : "bg-peach/70 text-cocoa"}`}>
          <strong className={fb.tone === "good" ? "text-success" : fb.tone === "bad" ? "text-error" : "text-orange"}>{fb.tone === "good" ? "Good call. " : fb.tone === "bad" ? "Not quite. " : ""}</strong>
          {fb.text}
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Check2({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className={`flex items-start gap-2 rounded-xl px-3 py-1.5 text-[0.92rem] ${ok ? "bg-success/10 text-cocoa" : "bg-cream text-cocoa-2"}`}>
      <span className={`mt-0.5 grid size-4.5 shrink-0 place-items-center rounded-full ${ok ? "bg-success text-white" : "border-2 border-cocoa/25"}`}>{ok && <Check className="size-3" strokeWidth={3} />}</span>
      <span>{children}</span>
    </li>
  );
}

const btn = "inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-bold transition-colors disabled:cursor-not-allowed disabled:opacity-45";
const primary = `${btn} bg-orange text-white hover:bg-cocoa`;
const secondary = `${btn} border border-cocoa/20 bg-white text-cocoa hover:border-cocoa`;

/* ── the activity ──────────────────────────────────────────── */
export default function Activity1() {
  const s = useLab();
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- wait for the saved attempt to load from this device
    setHydrated(true);
  }, []);
  const [student, setStudent] = useStudent();
  const [focus, setFocus] = useState<Focus>("overview");
  useEffect(() => {
    if (!hydrated) return;
    const st = useLab.getState().stage;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- point the camera at the restored stage once
    setFocus(st === 1 ? "shelf" : st === 2 ? "bowl" : st === 3 ? "sourcing" : st === 4 ? "label" : "overview");
  }, [hydrated]);
  const [fb, setFb] = useState<Fb>(null);
  const [sel, setSel] = useState<string | null>(null);
  const [cp, setCp] = useState<CheckpointId>("sourcing");
  const [mist, setMist] = useState(0);
  const [full, setFull] = useState(false);
  const [webgl, setWebgl] = useState(true);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time capability check
    setWebgl(detectWebGL());
    const on = () => setFull(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", on);
    return () => document.removeEventListener("fullscreenchange", on);
  }, []);

  const p = s.product;
  const main = [...p.parts].sort((a, b) => b.pct - a.pct)[0]?.id ?? "almonds";
  const sc = useMemo(() => scenario(s.seed, main), [s.seed, main]);

  // checkpoint working state (resets per checkpoint)
  const [lotDec, setLotDec] = useState<Record<string, "accept" | "reject">>({});
  const [lotView, setLotView] = useState("A");
  const [removed, setRemoved] = useState<number[]>([]);
  const [metal, setMetal] = useState(false);
  const [ppe, setPpe] = useState<string[]>([]);
  const [method, setMethod] = useState<"roast" | null>(null);
  const [temp, setTemp] = useState(120);
  const [time, setTime] = useState(6);
  const [roasted, setRoasted] = useState(false);
  const [batchSt, setBatchSt] = useState<Record<number, "release" | "hold" | undefined>>({});
  const [pack, setPack] = useState<PackOption | null>(null);
  const [n2, setN2] = useState(false);
  const [sealTest, setSealTest] = useState(false);
  const [resealed, setResealed] = useState(false);
  const resetCp = () => {
    setLotDec({});
    setLotView("A");
    setRemoved([]);
    setMetal(false);
    setPpe([]);
    setMethod(null);
    setTemp(120);
    setTime(6);
    setRoasted(false);
    setBatchSt({});
    setPack(null);
    setN2(false);
    setSealTest(false);
    setResealed(false);
    setMist(0);
    setFb(null);
  };

  const go = (stage: number) => {
    s.setStage(stage);
    setFb(null);
    setFocus(stage === 1 ? "shelf" : stage === 2 ? "bowl" : stage === 3 ? cp : stage === 4 ? "label" : "overview");
  };

  /* ── formulation checks ──────────────────────────────────── */
  const total = p.parts.reduce((a, x) => a + x.pct, 0);
  const cat = CATEGORIES.find((c) => c.id === p.category);
  const flav = FLAVOURS.find((f) => f.id === p.flavour);
  const blocking: string[] = [];
  p.parts.forEach((x) => ING[x.id].breaks && blocking.push(`${ING[x.id].name} breaks the brand promise “${ING[x.id].breaks}”. Remove it.`));
  if (cat) {
    const need = cat.check(p.parts.map((x) => x.id));
    if (need) blocking.push(need);
  }
  if (cat && flav && cat.taste !== "any" && cat.taste !== flav.taste) blocking.push(`A ${flav.taste} flavour on a ${cat.taste} ${cat.name.toLowerCase()} will confuse the customer. Pick a ${cat.taste} flavour.`);
  if (flav) {
    const missing = flav.needs.filter((n) => !p.parts.some((x) => x.id === n));
    if (missing.length) blocking.push(`A “${flav.name}” snack must contain ${missing.map((m) => ING[m].name.toLowerCase()).join(" and ")}. What the pack says must be in the pack.`);
  }
  if (p.parts.length && total !== 100) blocking.push(`Your proportions add up to ${total}%. A recipe must add up to exactly 100%.`);
  if (p.parts.length && ["flavour"].includes(ING[main]?.group)) blocking.push("A flavouring can't be the main ingredient. Raise your base, nut or sweetener.");
  const advice: string[] = [];
  const allergenSet = [...new Set(p.parts.map((x) => allergenOf(x.id)).filter(Boolean) as string[])];
  if (allergenSet.length) advice.push(`Allergens you will have to declare: ${allergenSet.join(", ")}.`);
  const highCost = p.parts.filter((x) => ING[x.id].cost === "High").reduce((a, x) => a + x.pct, 0);
  if (highCost >= 50) advice.push(`About ${highCost}% of your recipe is high-cost ingredients, so expect a premium price tier.`);
  if (p.parts.some((x) => ING[x.id].protein === "High")) advice.push("Protein-rich ingredients support a protein message, but only claim what lab testing proves.");
  const ref = p.category && p.flavour ? REFERENCE[`${p.category}:${p.flavour}`] : undefined;
  const buildReady = !!cat && p.parts.length >= 3 && !blocking.length && !!flav && !!p.consumer && p.name.trim().length >= 3 && p.concept.trim().split(/\s+/).length >= 8;

  const toggleIng = (id: string) => {
    const has = p.parts.some((x) => x.id === id);
    if (has) s.setProduct({ parts: p.parts.filter((x) => x.id !== id) });
    else {
      s.setProduct({ parts: [...p.parts, { id, pct: 0 }] });
      if (ING[id].breaks) setFb({ tone: "bad", text: `${ING[id].name}: ${ING[id].why}` });
    }
  };
  const balance = () => {
    if (!p.parts.length) return;
    const each = Math.floor(100 / p.parts.length);
    s.setProduct({ parts: p.parts.map((x, i) => ({ ...x, pct: i === 0 ? 100 - each * (p.parts.length - 1) : each })) });
  };

  /* ── checkpoint logic ────────────────────────────────────── */
  const mistake = (text: string) => {
    setMist((m) => m + 1);
    setFb({ tone: "bad", text });
  };
  const finishCp = (note: string) => {
    s.setCheck(cp, { status: mist === 0 ? "pass" : "fixed", mistakes: mist, note });
    setFb({ tone: "good", text: note });
  };
  const nextCp = () => {
    const i = CHECKPOINTS.findIndex((c) => c.id === cp);
    resetCp();
    if (i < CHECKPOINTS.length - 1) {
      setCp(CHECKPOINTS[i + 1].id);
      setFocus(CHECKPOINTS[i + 1].id);
    } else go(4);
  };
  const cpDone = !!s.checks[cp];

  // sourcing
  const decideLot = (id: string, d: "accept" | "reject") => {
    if (lotDec[id]) return;
    const lot = sc.lots.find((l) => l.id === id)!;
    const right = lot.fault ? "reject" : "accept";
    if (d !== right) {
      return mistake(
        lot.fault
          ? `Lot ${id} should be rejected: ${lot.fault === "mould" ? "mould means toxins can be present even where you can't see it" : lot.fault === "rancid" ? "a rancid smell means the oils have oxidised; the taste is already off" : lot.fault === "moisture" ? `moisture above the ${sc.moistSpec}% practice spec lets mould grow and kills crunch` : "it is far older than the freshness window, so flavour and oils have degraded"}.`
          : `Lot ${id} meets every spec. Rejecting good stock wastes money and can leave the kitchen short.`,
      );
    }
    const nd = { ...lotDec, [id]: d };
    setLotDec(nd);
    if (Object.keys(nd).length === 3) finishCp(`Only sound lots went in; Lot ${sc.lots.find((l) => l.fault)!.id} was rejected (${sc.lots.find((l) => l.fault)!.fault}).`);
    else setFb({ tone: "good", text: `Lot ${id} ${d === "accept" ? "accepted: it meets every spec." : "rejected."} Inspect the next lot.` });
  };
  // quality
  const foreign = sc.tray.filter((t) => t.kind !== "good").map((t) => t.id);
  const pickTray = (id: number) => {
    if (removed.includes(id) || metal) return;
    const it = sc.tray.find((t) => t.id === id)!;
    if (it.kind === "good") return mistake("That's a good piece of product. Throwing out good food is waste; look for things that aren't food.");
    const r = [...removed, id];
    setRemoved(r);
    setFb({ tone: "good", text: `Removed a ${it.kind === "plastic" ? "piece of plastic" : it.kind}. ${foreign.filter((f) => !r.includes(f)).length} foreign item(s) left.` });
  };
  const allForeignOut = foreign.every((f) => removed.includes(f));
  // prepping
  const prepAct = (id: string) => {
    if (ppe.includes(id)) return;
    if (id === "skip" || id === "watch") return mistake(id === "skip" ? "Skipping line cleaning risks allergen cross-contact: a trace of peanut can harm an allergic customer." : "Jewellery and watches can fall into food and trap germs. They come off before the line.");
    if (id !== "wash" && !ppe.includes("wash")) return mistake("Wash hands first. Gloves and kit put on over unwashed hands spread germs onto everything.");
    if (id === "line" && !["hairnet", "mask", "gloves", "apron"].every((k) => ppe.includes(k))) return mistake("Kit up fully first, then clean and swab the line, so you don't contaminate it again.");
    const n = [...ppe, id];
    setPpe(n);
    if (n.includes("line")) finishCp("Hands washed, full kit on, line cleaned and swabbed for allergens before cooking.");
    else setFb({ tone: "good", text: id === "wash" ? "Hands washed. Now kit up." : "On. Keep going." });
  };
  // cooking
  const done = ((temp - 90) / (sc.T0 - 90)) * (time / sc.t0);
  const roast = () => {
    if (done < 0.9) return mistake(`Undercooked (${temp}°C for ${time} min): raw taste, soft texture and a shorter shelf life. Match the roast profile.`);
    if (done > 1.12) return mistake(`Burnt (${temp}°C for ${time} min): bitter taste and damaged oils. Match the roast profile.`);
    setRoasted(true);
    finishCp(`Dry-roasted at ${temp}°C for ${time} min, inside the practice roast profile. Roasted, not fried.`);
  };
  // batch
  const decideBatch = (i: number, d: "release" | "hold") => {
    if (batchSt[i]) return;
    const b = sc.batches[i];
    if ((d === "hold") !== b.bad)
      return mistake(b.bad ? `Batch ${i + 1} must be held: ${sc.badKind === "taste" ? "the taste panel scored it well below the golden sample" : sc.badKind === "moisture" ? "moisture is above spec, so it will go soft and spoil sooner" : "its colour shows it was over-roasted"}. Releasing it means complaints and lost trust.` : `Batch ${i + 1} meets every spec. Holding good batches wastes stock and delays orders.`);
    const n = { ...batchSt, [i]: d };
    setBatchSt(n);
    if (Object.keys(n).length === 3) finishCp(`Two batches released; Batch ${sc.batches.findIndex((b) => b.bad) + 1} held for investigation (${sc.badKind}).`);
    else setFb({ tone: "good", text: `Batch ${i + 1} ${d === "hold" ? "held" : "released"}.` });
  };
  // packaging
  const needsN2 = p.parts.some((x) => ["nut", "seed"].includes(ING[x.id].group));
  const choosePack = (o: PackOption) => {
    if (pack === "pouch") return;
    if (o !== "pouch") return mistake(o === "paper" ? "A plain paper bag lets in air and moisture: crunchy snacks go soft and nuts turn rancid within days." : "An open-lid jar isn't sealed, so freshness and food safety can't be protected in transit.");
    setPack("pouch");
    setFb({ tone: "good", text: "Multi-layer barrier pouch with a zip: it keeps out oxygen, light and moisture." });
  };

  /* ── label ───────────────────────────────────────────────── */
  const [order, setOrder] = useState<string[]>([]);
  useEffect(() => {
    if (s.stage === 4 && order.length !== p.parts.length) {
      // eslint-disable-next-line react-hooks/set-state-in-effect -- start the ordering task with the student's ingredients
      setOrder(p.parts.map((x) => x.id));
    }
  }, [s.stage, p.parts, order.length]);
  const sortedIds = [...p.parts].sort((a, b) => b.pct - a.pct).map((x) => x.id);
  const orderOk = order.length > 0 && order.every((id, i) => (p.parts.find((x) => x.id === id)?.pct ?? 0) === (p.parts.find((x) => x.id === sortedIds[i])?.pct ?? -1));
  const allergenOk = ALLERGENS.every((a) => s.label.allergens.includes(a) === allergenSet.includes(a));
  const qty = Number(s.label.netQty);
  const qtyOk = Number.isFinite(qty) && qty >= 10 && qty <= 2000;
  const storageOk = /cool/i.test(s.label.storage) && /dry/i.test(s.label.storage);
  const bbOk = s.label.bestBefore.trim().length >= 8;
  const labelOk = orderOk && allergenOk && qtyOk && storageOk && bbOk;
  const labelUrl = useMemo(() => (hydrated && s.stage >= 4 && p.parts.length ? drawLabel({ ...p, parts: order.length === p.parts.length ? order.map((id) => p.parts.find((x) => x.id === id)!) : p.parts }, s.label, student.name) : null), [hydrated, s.stage, p, order, s.label, student.name]);

  /* ── results ─────────────────────────────────────────────── */
  const checkMistakes = CHECKPOINTS.reduce((a, c) => a + (s.checks[c.id]?.mistakes ?? 0), 0);
  const score = Math.max(40, 100 - checkMistakes * 5);

  const report = async () => {
    const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });
    const finalLabel = drawLabel({ ...p, parts: [...p.parts].sort((a, b) => b.pct - a.pct) }, s.label, student.name);
    const blocks: ReportBlock[] = [
      { kind: "h", text: "Objective" },
      { kind: "p", text: "Develop a better-for-you snack concept the Eat Better way, take it through the six quality checkpoints, and design a compliant back-of-pack label." },
      { kind: "h", text: "Learning outcomes" },
      { kind: "bullets", items: ["Explain what each ingredient does in a snack and why a brand chooses it.", "Build a formulation that keeps Eat Better's brand promises (no palm oil, no refined sugar, roasted not fried).", "Run the six quality checkpoints and justify accept / reject / hold decisions.", "Create a label that declares ingredients in order, allergens, net quantity, storage and the FSSAI section."] },
      { kind: "h", text: "My product concept (student-created)" },
      { kind: "kv", rows: [["Product name", p.name], ["Category", cat?.name ?? "-"], ["Flavour", flav?.name ?? "-"], ["Target consumer", CONSUMERS.find((c) => c.id === p.consumer)?.name ?? "-"], ["Concept", p.concept]] },
      ...(ref ? ([{ kind: "h", text: "Reference: a real Eat Better product" }, { kind: "p", text: `I compared my recipe with ${ref.product} (official product photos from eatbetterco.com).` }] as ReportBlock[]) : []),
      { kind: "h", text: "Selected ingredients and formulation" },
      { kind: "table", head: ["Ingredient", "Share (simulated)", "Role", "Allergen"], rows: [...p.parts].sort((a, b) => b.pct - a.pct).map((x) => [ING[x.id].name, `${x.pct}%`, ING[x.id].role, ING[x.id].allergen ?? "-"]), widths: [42, 28, 74, 30] },
      { kind: "p", muted: true, text: "Proportions are a student simulation, not an Eat Better Co formulation." },
      { kind: "h", text: "Formulation decisions" },
      { kind: "bullets", items: [`Kept the brand promises: no palm oil, no refined sugar and no refined flour in the recipe.`, `Category rule met: ${cat?.needs ?? "-"}.`, ...advice] },
      { kind: "h", text: "The six quality checkpoints" },
      { kind: "table", head: ["Checkpoint", "Result", "Mistakes", "What happened"], rows: CHECKPOINTS.map((c) => [c.name, s.checks[c.id]?.status === "pass" ? "Passed first time" : s.checks[c.id] ? "Passed after correction" : "-", String(s.checks[c.id]?.mistakes ?? "-"), s.checks[c.id]?.note ?? "-"]), widths: [32, 36, 20, 86] },
      { kind: "h", text: "Packaging and label design" },
      { kind: "image", dataUrl: finalLabel, w: 95, h: 126.7, caption: "My back-of-pack label (student concept, simulated)" },
      { kind: "h", text: "Compliance considerations" },
      { kind: "bullets", items: ["Ingredients are listed in descending order of weight, with percentages.", `Allergens declared: ${s.label.allergens.length ? s.label.allergens.join(", ") : "none"}.`, `Net quantity: ${s.label.netQty} g. Storage: ${s.label.storage.trim().replace(/\.$/, "")}. Best before: ${s.label.bestBefore.trim().replace(/\.$/, "")}.`, "Vegetarian symbol shown; nutrition values are placeholders until laboratory analysis.", "A real pack must carry the FSSAI logo and licence number. This student label has none: it is a learning simulation, not regulatory approval or an official Eat Better product."] },
      { kind: "h", text: "Final quality assessment (simulation)" },
      { kind: "callout", tone: "good", text: `Quality score ${score}/100: ${checkMistakes} mistake(s) across the six checkpoints, each corrected before the batch could move on. Status: approved for simulated packaging only.` },
      { kind: "h", text: "My reflection: What did I learn?" },
      { kind: "p", text: s.reflection },
    ];
    await buildReport({ title: "Product Innovation & Quality Report", activity: "Experiential Activity 1", module: "Module 1 · The Eat Better Story & Product Line", student, date, blocks, filename: `EatBetter-SkilliZee-Product-Innovation-Report-${(student.name || "student").replace(/\s+/g, "-")}.pdf` });
  };

  const toggleFull = async () => {
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      /* not allowed in this view */
    }
  };

  if (!hydrated) return <div className="grid min-h-screen place-items-center bg-cream text-cocoa-2">Opening the lab…</div>;

  const stage = s.stage;
  const cpInfo = CHECKPOINTS.find((c) => c.id === cp)!;
  const pickedIds = p.parts.map((x) => x.id);

  return (
    <div className="relative flex min-h-[100dvh] flex-col bg-[#F3ECE3] text-cocoa">
      {/* top bar */}
      <header className="sticky top-0 z-30 border-b border-cocoa/10 bg-cream/95 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-3 px-3 py-2 sm:px-5">
          <Image src="/brand/eat-better-x-skillizee-600x400.png" alt="Eat Better Co × SkilliZee" width={90} height={60} className="h-10 w-auto" />
          <div className="min-w-0 flex-1">
            <div className="text-[0.72rem] font-extrabold uppercase tracking-[0.14em] text-orange">Experiential Activity 1 · Module 1</div>
            <div className="truncate font-display text-[1.15rem] font-semibold leading-tight">Eat Better Product Innovation Lab</div>
          </div>
          <button onClick={() => (s.restart(), resetCp(), setCp("sourcing"), setFocus("overview"))} className={`${secondary} !px-3 !py-1.5 text-[0.85rem]`}>
            <RotateCcw className="size-4" /> Restart
          </button>
          <button onClick={toggleFull} aria-label={full ? "Exit fullscreen" : "Fullscreen"} className={`${secondary} !px-2.5 !py-1.5`}>
            {full ? <Minimize className="size-4" /> : <Maximize className="size-4" />}
          </button>
        </div>
        <ol className="no-scrollbar mx-auto flex max-w-[1600px] gap-1.5 overflow-x-auto px-3 pb-2 sm:px-5">
          {STAGES.map((t, i) => (
            <li key={t} className={`flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-[0.82rem] font-bold ${i === stage ? "bg-orange text-white" : i < stage ? "bg-success/15 text-success" : "bg-white text-cocoa-2/70"}`}>
              {i < stage ? <Check className="size-3.5" strokeWidth={3} /> : <span>{i + 1}</span>}
              {t}
            </li>
          ))}
        </ol>
      </header>

      {/* 3D lab: the full-screen background of the whole activity */}
      {/* phones and tablets: the 3D scene gets its own box above the panel, so the whole scene is in view (also inside an LMS iframe of any height); desktop keeps the full-screen scene behind the panel */}
      <div className="relative z-0 mx-3 mt-3 h-[clamp(280px,52svh,480px)] overflow-hidden rounded-[22px] border border-cocoa/15 shadow-[0_18px_40px_-28px_rgba(47,28,26,0.6)] sm:mx-4 lg:fixed lg:inset-0 lg:m-0 lg:h-auto lg:rounded-none lg:border-0 lg:shadow-none">
          {webgl ? (
            <Lab3D
              focus={focus}
              interactive={stage > 0}
              mainId={main}
              picked={pickedIds}
              parts={p.parts}
              inspected={s.inspected}
              selected={stage === 1 ? sel : null}
              onJar={(id) => {
                if (stage === 1) {
                  s.inspect(id);
                  setSel(id);
                }
                if (stage === 2) toggleIng(id);
              }}
              lots={sc.lots as Lot[]}
              lotDecisions={lotDec}
              onLot={(id) => stage === 3 && cp === "sourcing" && setLotView(id)}
              tray={sc.tray}
              removed={removed}
              onTray={(id) => stage === 3 && cp === "quality" && pickTray(id)}
              ppe={ppe.filter((x) => x !== "wash" && x !== "line")}
              onPrep={(id) => stage === 3 && cp === "prepping" && prepAct(id)}
              heat={cp === "cooking" ? (temp - 100) / 120 : 0}
              doneness={cp === "cooking" ? done : 0}
              batches={3}
              batchStatus={batchSt}
              onBatch={() => undefined}
              pack={pack}
              onPack={(o) => stage === 3 && cp === "packaging" && choosePack(o)}
              labelUrl={labelUrl}
            />
          ) : (
            <div className="relative h-full">
              <Image src={stage === 3 ? cpInfo.photo : "/brand/library/site/story-team-preparing.webp"} alt="Eat Better kitchen" fill sizes="60vw" className="object-cover" />
              <div className="absolute inset-x-3 bottom-3 rounded-xl bg-cream/95 p-3 text-[0.9rem]">3D isn&apos;t available on this device, so you&apos;re seeing photos from Eat Better&apos;s kitchen. Every task still works in the panel.</div>
            </div>
          )}
          <div className="pointer-events-none absolute left-3 top-[118px] rounded-full bg-cocoa/85 px-3 py-1 text-[0.8rem] font-bold text-cream">
            {stage === 3 ? `Station ${CHECKPOINTS.findIndex((c) => c.id === cp) + 1}: ${cpInfo.name}` : stage === 1 ? "Ingredient wall: tap a jar to inspect it" : stage === 2 ? "Formulation bench: tap jars to add or remove" : stage === 4 ? "Packaging station: your label on the pouch" : "Product Innovation Lab"}
          </div>
      </div>

      <div className="pointer-events-none relative z-10 mx-auto grid w-full max-w-[1600px] flex-1 gap-3 p-3 sm:p-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(400px,0.85fr)]">
        {/* the left side stays open so the lab is visible and clickable */}
        <div className="hidden lg:block" aria-hidden />
        {/* panel */}
        <section className="pointer-events-auto min-w-0 self-start rounded-[22px] border border-cocoa/15 bg-white/95 p-4 shadow-[0_24px_60px_-30px_rgba(47,28,26,0.55)] backdrop-blur sm:p-5 lg:max-h-[calc(100dvh-130px)] lg:overflow-y-auto">
          {stage === 0 && (
            <div>
              <div className="text-[0.8rem] font-extrabold uppercase tracking-[0.14em] text-orange">Discover · your role</div>
              <h1 className="mt-1 font-display text-[clamp(1.6rem,3vw,2.2rem)] font-semibold leading-tight">You&apos;ve joined Eat Better&apos;s product innovation and quality team</h1>
              <p className="mt-2 text-[1.02rem] leading-relaxed text-cocoa">Your job: create a new better-for-you snack concept, take it through the six quality checkpoints of the kitchen, and design a label that is ready for (simulated) packaging. Everything you decide goes into your project report.</p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {[
                  ["Ingredient intelligence", "Inspect 13 ingredients on the wall: what each does, and which ones break the brand promise."],
                  ["Build a product", "Choose a category, ingredients, proportions, flavour and customer. The lab flags conflicts."],
                  ["Six quality checkpoints", "Sourcing, quality check, prepping, cooking, batch testing, packaging: hands-on tasks."],
                  ["Label & report", "Design a compliant label and download your PDF report and label PNG."],
                ].map(([h, t], i) => (
                  <div key={h} className="rounded-2xl bg-cream p-3">
                    <div className="font-display text-[1.02rem] font-semibold">
                      {i + 1}. {h}
                    </div>
                    <p className="mt-0.5 text-[0.92rem] leading-snug text-cocoa-2">{t}</p>
                  </div>
                ))}
              </div>
              <div className="mt-4 flex items-start gap-2 rounded-2xl bg-peach/60 p-3 text-[0.9rem]">
                <Info className="mt-0.5 size-4 shrink-0 text-orange" />
                <span>Brand promises used as rules come from the internship chapters (brand claims). Proportions, lab readings and roast profiles are practice simulations, not Eat Better formulations. Your snack is a student concept, not an official Eat Better product.</span>
              </div>
              <button onClick={() => go(1)} className={`${primary} mt-4`}>
                Enter the lab <ArrowRight className="size-4" />
              </button>
            </div>
          )}

          {stage === 1 && (
            <div>
              <div className="text-[0.8rem] font-extrabold uppercase tracking-[0.14em] text-orange">Learn & explore · ingredient intelligence</div>
              <h2 className="mt-1 font-display text-[1.5rem] font-semibold">What does each ingredient do?</h2>
              <p className="mt-1 text-[0.98rem] text-cocoa-2">Tap jars on the wall (or below). Inspect at least 10 of the {INGREDIENTS.length}, including all three that break a brand promise, to unlock the formulation bench.</p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {INGREDIENTS.map((i) => (
                  <button key={i.id} onClick={() => (s.inspect(i.id), setSel(i.id))} className={`flex items-center gap-1.5 rounded-full border py-0.5 pl-1 pr-3 text-[0.85rem] font-bold ${sel === i.id ? "border-orange bg-orange text-white" : s.inspected.includes(i.id) ? (i.breaks ? "border-error/40 bg-error/10 text-error" : "border-success/40 bg-success/10 text-success") : "border-cocoa/15 bg-white text-cocoa"}`}>
                    <span className="grid size-7 place-items-center rounded-full bg-white">
                      <IngredientIcon id={i.id} size={24} />
                    </span>
                    {i.name}
                  </button>
                ))}
              </div>
              {sel && (
                <motion.div key={sel} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={`mt-4 rounded-2xl border-2 p-4 ${ING[sel].breaks ? "border-error/40 bg-error/5" : "border-cocoa/10 bg-cream"}`}>
                  <div className="flex items-center gap-3">
                    <span className="grid size-16 shrink-0 place-items-center rounded-2xl bg-white ring-1 ring-cocoa/10">
                      <IngredientIcon id={sel} size={52} title={ING[sel].name} />
                    </span>
                    <div>
                      <div className="font-display text-[1.25rem] font-semibold">{ING[sel].name}</div>
                      <div className="text-[0.9rem] text-cocoa-2">{ING[sel].role}</div>
                    </div>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-3">
                    <Bar label="Sweetness" v={ING[sel].sweet} />
                    <Bar label="Crunch" v={ING[sel].crunch} />
                    <Bar label="Protein" v={ING[sel].protein} />
                    <Bar label="Relative cost" v={ING[sel].cost} />
                  </div>
                  <p className="mt-3 text-[0.95rem]">
                    <strong>Why choose it:</strong> {ING[sel].why}
                  </p>
                  {ING[sel].allergen && <p className="mt-1 text-[0.92rem] text-cocoa-2">Allergen to declare: {ING[sel].allergen}</p>}
                  {ING[sel].breaks && (
                    <p className="mt-2 flex items-start gap-2 text-[0.95rem] font-bold text-error">
                      <TriangleAlert className="mt-0.5 size-4 shrink-0" /> Breaks the brand promise: {ING[sel].breaks}
                    </p>
                  )}
                  <p className="mt-2 text-[0.78rem] text-cocoa-2/80">General food-science guide for learning, not Eat Better data.</p>
                </motion.div>
              )}
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[0.92rem] font-bold text-cocoa-2">
                  Inspected {s.inspected.length}/{INGREDIENTS.length} · promise-breakers found {s.inspected.filter((i) => ING[i].breaks).length}/3
                </span>
                <button disabled={s.inspected.length < 10 || s.inspected.filter((i) => ING[i].breaks).length < 3} onClick={() => go(2)} className={primary}>
                  To the formulation bench <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          )}

          {stage === 2 && (
            <div>
              <div className="text-[0.8rem] font-extrabold uppercase tracking-[0.14em] text-orange">Practise · build a product</div>
              <h2 className="mt-1 font-display text-[1.5rem] font-semibold">Formulate your snack</h2>
              <div className="mt-3 text-[0.85rem] font-extrabold uppercase tracking-[0.1em] text-cocoa-2">1 · Category</div>
              <div className="mt-1.5 grid grid-cols-2 gap-2">
                {CATEGORIES.map((c) => (
                  <button key={c.id} onClick={() => s.setProduct({ category: c.id })} className={`overflow-hidden rounded-2xl border-2 text-left ${p.category === c.id ? "border-orange" : "border-cocoa/10"}`}>
                    <div className="relative aspect-[16/9]">
                      <Image src={c.photo} alt={c.name} fill sizes="200px" className="object-cover" />
                    </div>
                    <div className="px-2.5 py-1.5 text-[0.9rem] font-bold">{c.name}</div>
                  </button>
                ))}
              </div>
              {cat && <p className="mt-1.5 text-[0.88rem] text-cocoa-2">A {cat.name.toLowerCase()} needs {cat.needs}.</p>}

              <div className="mt-4 text-[0.85rem] font-extrabold uppercase tracking-[0.1em] text-cocoa-2">2 · Ingredients (tap jars or chips, at least 3)</div>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {INGREDIENTS.map((i) => (
                  <button key={i.id} onClick={() => toggleIng(i.id)} aria-pressed={pickedIds.includes(i.id)} className={`flex items-center gap-1.5 rounded-full border py-0.5 pl-1 pr-3 text-[0.85rem] font-bold ${pickedIds.includes(i.id) ? (i.breaks ? "border-error bg-error text-white" : "border-orange bg-orange text-white") : "border-cocoa/15 bg-white"}`}>
                    <span className="grid size-7 place-items-center rounded-full bg-white">
                      <IngredientIcon id={i.id} size={24} />
                    </span>
                    {i.name}
                  </button>
                ))}
              </div>

              {p.parts.length > 0 && (
                <div className="mt-4">
                  <div className="flex items-center justify-between text-[0.85rem] font-extrabold uppercase tracking-[0.1em] text-cocoa-2">
                    <span>3 · Proportions (must total 100%)</span>
                    <button onClick={balance} className="rounded-full bg-cream px-2.5 py-0.5 text-[0.78rem] normal-case tracking-normal text-cocoa">
                      Split evenly
                    </button>
                  </div>
                  <div className="mt-2 grid gap-2">
                    {p.parts.map((x) => (
                      <label key={x.id} className="grid grid-cols-[minmax(0,9rem)_1fr_3rem] items-center gap-2 text-[0.9rem]">
                        <span className="flex min-w-0 items-center gap-1.5 font-bold">
                          <IngredientIcon id={x.id} size={22} />
                          <span className="truncate">{ING[x.id].name}</span>
                        </span>
                        <input type="range" min={0} max={90} step={5} value={x.pct} onChange={(e) => s.setProduct({ parts: p.parts.map((y) => (y.id === x.id ? { ...y, pct: +e.target.value } : y)) })} className="accent-orange" aria-label={`${ING[x.id].name} share`} />
                        <span className="text-right tabular-nums">{x.pct}%</span>
                      </label>
                    ))}
                  </div>
                  <div className={`mt-1 text-right text-[0.9rem] font-bold ${total === 100 ? "text-success" : "text-error"}`}>Total {total}%</div>
                </div>
              )}

              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <label className="flex flex-col gap-1 text-[0.9rem] font-bold">
                  4 · Flavour
                  <select value={p.flavour ?? ""} onChange={(e) => s.setProduct({ flavour: e.target.value || null })} className="rounded-xl border border-cocoa/20 px-3 py-2 font-normal">
                    <option value="">Choose…</option>
                    {FLAVOURS.map((f) => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.taste}: needs {f.needs.map((n) => ING[n].name.split(" (")[0].toLowerCase()).join(" + ")})
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-[0.9rem] font-bold">
                  5 · Target consumer
                  <select value={p.consumer ?? ""} onChange={(e) => s.setProduct({ consumer: e.target.value || null })} className="rounded-xl border border-cocoa/20 px-3 py-2 font-normal">
                    <option value="">Choose…</option>
                    {CONSUMERS.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex flex-col gap-1 text-[0.9rem] font-bold sm:col-span-2">
                  6 · Product name
                  <input value={p.name} onChange={(e) => s.setProduct({ name: e.target.value })} maxLength={40} className="rounded-xl border border-cocoa/20 px-3 py-2 font-normal" placeholder="e.g. Ragi Masala Crunch" />
                </label>
                <label className="flex flex-col gap-1 text-[0.9rem] font-bold sm:col-span-2">
                  7 · Concept (who it&apos;s for and why it&apos;s better, at least 8 words)
                  <textarea value={p.concept} onChange={(e) => s.setProduct({ concept: e.target.value })} rows={2} className="rounded-xl border border-cocoa/20 px-3 py-2 font-normal" />
                </label>
              </div>

              {ref && (
                <div className="mt-4 rounded-2xl bg-cream p-3">
                  <div className="text-[0.85rem] font-extrabold uppercase tracking-[0.1em] text-cocoa-2">Compare with a real Eat Better product</div>
                  <div className="mt-1 font-display text-[1.05rem] font-semibold">{ref.product}</div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    <div className="relative aspect-square overflow-hidden rounded-xl">
                      <Image src={ref.texture} alt={ref.product} fill sizes="200px" className="object-cover" />
                    </div>
                    <div className="relative aspect-square overflow-hidden rounded-xl">
                      <Image src={ref.ingredients} alt={`${ref.product}: ingredients`} fill sizes="200px" className="object-cover" />
                    </div>
                  </div>
                  <p className="mt-1.5 text-[0.82rem] text-cocoa-2">Official product photos from eatbetterco.com. See what is in it, then decide what goes in yours.</p>
                </div>
              )}

              <div className="mt-4 rounded-2xl border border-cocoa/10 p-3">
                <div className="flex items-center gap-2 font-display text-[1.05rem] font-semibold">
                  <FlaskConical className="size-5 text-orange" /> Lab formulation check
                </div>
                <ul className="mt-2 grid gap-1.5">
                  {blocking.map((b) => (
                    <li key={b} className="flex items-start gap-2 rounded-xl bg-error/8 px-3 py-1.5 text-[0.92rem]">
                      <X className="mt-0.5 size-4 shrink-0 text-error" /> {b}
                    </li>
                  ))}
                  {advice.map((a) => (
                    <li key={a} className="flex items-start gap-2 rounded-xl bg-cream px-3 py-1.5 text-[0.92rem]">
                      <Info className="mt-0.5 size-4 shrink-0 text-orange" /> {a}
                    </li>
                  ))}
                  {!blocking.length && p.parts.length >= 3 && cat && (
                    <li className="flex items-start gap-2 rounded-xl bg-success/10 px-3 py-1.5 text-[0.92rem]">
                      <Check className="mt-0.5 size-4 shrink-0 text-success" /> No conflicts: the recipe keeps every brand promise.
                    </li>
                  )}
                </ul>
              </div>
              <Feedback fb={fb} />
              <div className="mt-4 flex justify-between gap-2">
                <button onClick={() => go(1)} className={secondary}>
                  <ArrowLeft className="size-4" /> Ingredients
                </button>
                <button disabled={!buildReady} onClick={() => (resetCp(), setCp("sourcing"), go(3), setFocus("sourcing"))} className={primary}>
                  Send to the quality line <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          )}

          {stage === 3 && (
            <div>
              <div className="text-[0.8rem] font-extrabold uppercase tracking-[0.14em] text-orange">Challenge · the six quality checkpoints</div>
              <div className="no-scrollbar mt-2 flex gap-1.5 overflow-x-auto pb-1">
                {CHECKPOINTS.map((c, i) => (
                  <span key={c.id} className={`flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1 text-[0.8rem] font-bold ${c.id === cp ? "bg-cocoa text-cream" : s.checks[c.id] ? "bg-success/15 text-success" : "bg-cream text-cocoa-2/60"}`}>
                    {s.checks[c.id] ? <Check className="size-3.5" strokeWidth={3} /> : i + 1} {c.name}
                  </span>
                ))}
              </div>
              <div className="mt-3 flex items-start gap-3">
                <div className="relative size-20 shrink-0 overflow-hidden rounded-2xl">
                  <Image src={cpInfo.photo} alt={`${cpInfo.name} at Eat Better's kitchen`} fill sizes="80px" className="object-cover" />
                </div>
                <div>
                  <h2 className="font-display text-[1.4rem] font-semibold leading-tight">{cpInfo.name}</h2>
                  <p className="text-[0.95rem] text-cocoa-2">{cpInfo.goal}</p>
                  <p className="text-[0.75rem] text-cocoa-2/70">Photo: Eat Better&apos;s kitchen (eatbetterco.com). Readings below are practice data.</p>
                </div>
              </div>

              {cp === "sourcing" && (
                <div className="mt-3">
                  <p className="text-[0.95rem]">Three lots of <strong>{ING[main].name}</strong> arrived. Tap a crate (or a lot below), read its certificate, then accept or reject it.</p>
                  <div className="mt-2 flex gap-1.5">
                    {sc.lots.map((l) => (
                      <button key={l.id} onClick={() => setLotView(l.id)} className={`rounded-xl border-2 px-3 py-1.5 font-bold ${lotView === l.id ? "border-orange" : "border-cocoa/10"} ${lotDec[l.id] === "accept" ? "bg-success/10" : lotDec[l.id] === "reject" ? "bg-error/10" : "bg-white"}`}>
                        Lot {l.id}
                      </button>
                    ))}
                  </div>
                  {(() => {
                    const l = sc.lots.find((x) => x.id === lotView)!;
                    return (
                      <div className="mt-2 rounded-2xl bg-cream p-3 text-[0.94rem]">
                        <div className="font-bold">Certificate of analysis · Lot {l.id} (practice)</div>
                        <div className="mt-1 grid grid-cols-2 gap-x-3 gap-y-1">
                          <span className="text-cocoa-2">Harvested / packed</span>
                          <span>{l.months} month(s) ago (window: up to 12)</span>
                          <span className="text-cocoa-2">Moisture</span>
                          <span>
                            {l.moisture}% (spec ≤ {sc.moistSpec}%)
                          </span>
                          <span className="text-cocoa-2">Smell</span>
                          <span>{l.smell}</span>
                          <span className="text-cocoa-2">Visual</span>
                          <span>{l.visual}</span>
                        </div>
                        <div className="mt-3 flex gap-2">
                          <button disabled={!!lotDec[l.id] || cpDone} onClick={() => decideLot(l.id, "accept")} className={`${btn} bg-success text-white`}>
                            Accept lot
                          </button>
                          <button disabled={!!lotDec[l.id] || cpDone} onClick={() => decideLot(l.id, "reject")} className={`${btn} bg-error text-white`}>
                            Reject lot
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {cp === "quality" && (
                <div className="mt-3">
                  <p className="text-[0.95rem]">The sorting tray hides things that aren&apos;t food. Tap them in the 3D tray (or the tray map below) to remove them. Don&apos;t throw out good product.</p>
                  <div className="relative mt-2 h-40 rounded-2xl bg-[#C0C7CF]">
                    {sc.tray
                      .filter((t) => !removed.includes(t.id))
                      .map((t) => (
                        <button
                          key={t.id}
                          onClick={() => pickTray(t.id)}
                          aria-label={`Tray item ${t.id + 1}`}
                          className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full border border-black/10"
                          style={{
                            left: `${((t.x + 0.7) / 1.4) * 100}%`,
                            top: `${((t.z + 0.36) / 0.72) * 100}%`,
                            width: t.kind === "twig" ? 34 : 18,
                            height: t.kind === "twig" ? 7 : t.kind === "plastic" ? 12 : 14,
                            borderRadius: t.kind === "twig" || t.kind === "plastic" ? 3 : 999,
                            background: t.kind === "good" ? "#C68A4B" : t.kind === "stone" ? "#7D7A74" : t.kind === "shell" ? "#8A5A35" : t.kind === "twig" ? "#5B3A22" : "#4FC3F7",
                          }}
                        />
                      ))}
                  </div>
                  <div className="mt-3 flex items-center gap-2">
                    <button disabled={!allForeignOut || metal} onClick={() => (setMetal(true), finishCp(`Removed all ${foreign.length} foreign items by hand, then passed the metal detector.`))} className={primary}>
                      Run the metal detector
                    </button>
                    <span className="text-[0.9rem] text-cocoa-2">{foreign.filter((f) => !removed.includes(f)).length} foreign item(s) left</span>
                  </div>
                </div>
              )}

              {cp === "prepping" && (
                <div className="mt-3">
                  <p className="text-[0.95rem]">Get the team member ready and the line safe, in the right order. Tap items in 3D or below.</p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {[
                      ["wash", "Wash hands"],
                      ["hairnet", "Hairnet"],
                      ["mask", "Mask"],
                      ["gloves", "Gloves"],
                      ["apron", "Apron"],
                      ["watch", "Keep watch on"],
                      ["line", "Clean & swab the line"],
                      ["skip", "Skip cleaning to save time"],
                    ].map(([id, t]) => (
                      <button key={id} disabled={ppe.includes(id) || cpDone} onClick={() => prepAct(id)} className={`rounded-full border px-3 py-1.5 text-[0.88rem] font-bold ${ppe.includes(id) ? "border-success/40 bg-success/10 text-success" : "border-cocoa/15 bg-white"}`}>
                        {ppe.includes(id) && <Check className="mr-1 inline size-3.5" />}
                        {t}
                      </button>
                    ))}
                  </div>
                  {allergenSet.length > 0 && <p className="mt-2 text-[0.88rem] text-cocoa-2">Your recipe contains {allergenSet.join(" and ")}: line cleaning also protects the next product from allergen cross-contact.</p>}
                </div>
              )}

              {cp === "cooking" && (
                <div className="mt-3">
                  {!method ? (
                    <div>
                      <p className="text-[0.95rem]">How will this batch be cooked?</p>
                      <div className="mt-2 grid gap-2 sm:grid-cols-2">
                        <button onClick={() => (setMethod("roast"), setFb({ tone: "good", text: "Dry roasting keeps the 'roasted, not fried' promise. Now set the roaster." }))} className={`${secondary} !justify-start`}>
                          Dry roast in the drum roaster
                        </button>
                        <button onClick={() => mistake("Deep-frying in palm oil breaks two brand promises: roasted not fried, and no palm oil.")} className={`${secondary} !justify-start`}>
                          Deep-fry in palm oil (faster)
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <div className="rounded-2xl bg-cream p-3 text-[0.94rem]">
                        <strong>Roast profile for this product (practice spec):</strong> about {sc.T0}°C for about {sc.t0} minutes. Hotter roasts need less time.
                      </div>
                      <label className="mt-3 block text-[0.9rem] font-bold">
                        Temperature: {temp}°C
                        <input type="range" min={100} max={220} step={5} value={temp} disabled={roasted} onChange={(e) => setTemp(+e.target.value)} className="w-full accent-orange" />
                      </label>
                      <label className="mt-2 block text-[0.9rem] font-bold">
                        Time: {time} min
                        <input type="range" min={2} max={40} step={1} value={time} disabled={roasted} onChange={(e) => setTime(+e.target.value)} className="w-full accent-orange" />
                      </label>
                      <div className="mt-2 flex items-center gap-2 text-[0.9rem]">
                        <span className="font-bold">Roast level</span>
                        <div className="h-3 flex-1 rounded-full" style={{ background: "linear-gradient(90deg,#E8C99A,#B9773C 45%,#8A4F22 60%,#2A1A10)" }}>
                          <div className="relative h-full">
                            <span className="absolute -top-1 size-5 -translate-x-1/2 rounded-full border-2 border-white bg-cocoa shadow" style={{ left: `${Math.min(100, Math.max(0, (done / 1.6) * 100))}%` }} />
                          </div>
                        </div>
                      </div>
                      <button disabled={roasted} onClick={roast} className={`${primary} mt-3`}>
                        Roast this batch
                      </button>
                    </div>
                  )}
                </div>
              )}

              {cp === "batch" && (
                <div className="mt-3 grid gap-2">
                  <p className="text-[0.95rem]">Compare every batch with the golden sample. Release it, or hold it for investigation.</p>
                  {sc.batches.map((b, i) => (
                    <div key={i} className={`rounded-2xl border p-3 ${batchSt[i] === "release" ? "border-success/40 bg-success/5" : batchSt[i] === "hold" ? "border-error/40 bg-error/5" : "border-cocoa/10"}`}>
                      <div className="font-bold">Batch {i + 1} (practice readings)</div>
                      <div className="mt-1 grid grid-cols-3 gap-2 text-[0.88rem]">
                        <span>
                          Taste panel <strong>{b.taste}/10</strong> <span className="text-cocoa-2">(spec ≥ 8)</span>
                        </span>
                        <span>
                          Moisture <strong>{b.moisture}%</strong> <span className="text-cocoa-2">(spec ≤ {Math.round(sc.moistSpec / 2)}%)</span>
                        </span>
                        <span>{b.colour}</span>
                      </div>
                      <div className="mt-2 flex gap-2">
                        <button disabled={!!batchSt[i] || cpDone} onClick={() => decideBatch(i, "release")} className={`${btn} !py-1.5 bg-success text-white`}>
                          Release
                        </button>
                        <button disabled={!!batchSt[i] || cpDone} onClick={() => decideBatch(i, "hold")} className={`${btn} !py-1.5 bg-error text-white`}>
                          Hold
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {cp === "packaging" && (
                <div className="mt-3">
                  <p className="text-[0.95rem]">Choose the packaging that protects freshness and crunch (tap it on the bench).</p>
                  <div className="mt-2 grid gap-2 sm:grid-cols-3">
                    {(
                      [
                        ["paper", "Plain paper bag"],
                        ["jar", "Open-lid jar"],
                        ["pouch", "Multi-layer barrier zip pouch"],
                      ] as [PackOption, string][]
                    ).map(([id, t]) => (
                      <button key={id} disabled={pack === "pouch"} onClick={() => choosePack(id)} className={`${secondary} ${pack === id ? "!border-success !bg-success/10" : ""}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                  {pack === "pouch" && (
                    <div className="mt-3 grid gap-2">
                      {needsN2 && (
                        <label className="flex items-start gap-2 rounded-2xl bg-cream p-3 text-[0.94rem]">
                          <input type="checkbox" checked={n2} onChange={(e) => setN2(e.target.checked)} className="mt-1 accent-orange" />
                          <span>Nitrogen-flush the pouch before sealing (replaces oxygen, which turns nut and seed oils rancid)</span>
                        </label>
                      )}
                      <button disabled={sealTest || (needsN2 && !n2)} onClick={() => setSealTest(true)} className={secondary}>
                        Run the seal leak test on 3 sample pouches
                      </button>
                      {sealTest && (
                        <div className="rounded-2xl bg-cream p-3 text-[0.94rem]">
                          {[0, 1, 2].map((i) => (
                            <div key={i} className="flex items-center justify-between py-1">
                              <span>
                                Pouch {i + 1}: {i === sc.leak && !resealed ? <strong className="text-error">bubbles at the seal (leak)</strong> : "no bubbles, sealed"}
                              </span>
                              {i === sc.leak && !resealed && (
                                <button onClick={() => (setResealed(true), finishCp(`Barrier pouch${needsN2 ? ", nitrogen-flushed" : ""}; a leaking seal on pouch ${sc.leak + 1} was caught in the leak test and re-sealed.`))} className={`${btn} !py-1 bg-orange text-white`}>
                                  Re-seal
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <Feedback fb={fb} />
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-[0.88rem] text-cocoa-2">Mistakes at this station: {mist}</span>
                <button disabled={!cpDone} onClick={nextCp} className={primary}>
                  {cp === "packaging" ? "Design the label" : "Next station"} <ChevronRight className="size-4" />
                </button>
              </div>
            </div>
          )}

          {stage === 4 && (
            <div>
              <div className="text-[0.8rem] font-extrabold uppercase tracking-[0.14em] text-orange">Create · packaging & compliance</div>
              <h2 className="mt-1 font-display text-[1.5rem] font-semibold">Design your back-of-pack label</h2>
              <p className="mt-1 text-[0.95rem] text-cocoa-2">In India, packaged food labels follow FSSAI rules. This is a learning simulation, not regulatory approval.</p>
              <div className="mt-3 grid gap-4 xl:grid-cols-[minmax(0,1fr)_200px]">
                <div className="grid gap-3">
                  <div>
                    <div className="text-[0.9rem] font-bold">Ingredient list: put them in descending order of weight</div>
                    <ol className="mt-1.5 grid gap-1">
                      {order.map((id, i) => (
                        <li key={id} className="flex items-center gap-2 rounded-xl bg-cream px-3 py-1.5 text-[0.92rem]">
                          <span className="w-5 font-bold tabular-nums">{i + 1}</span>
                          <span className="flex-1">
                            {ING[id].name} ({p.parts.find((x) => x.id === id)?.pct}%)
                          </span>
                          <button aria-label="Move up" disabled={i === 0} onClick={() => setOrder((o) => (o.splice(i - 1, 2, o[i], o[i - 1]), [...o]))} className="rounded-lg bg-white p-1 disabled:opacity-30">
                            <ArrowUp className="size-4" />
                          </button>
                          <button aria-label="Move down" disabled={i === order.length - 1} onClick={() => setOrder((o) => (o.splice(i, 2, o[i + 1], o[i]), [...o]))} className="rounded-lg bg-white p-1 disabled:opacity-30">
                            <ArrowDown className="size-4" />
                          </button>
                        </li>
                      ))}
                    </ol>
                  </div>
                  <div>
                    <div className="text-[0.9rem] font-bold">Allergen declaration: tick every allergen your recipe contains</div>
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {ALLERGENS.map((a) => (
                        <label key={a} className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-[0.88rem] font-bold ${s.label.allergens.includes(a) ? "border-orange bg-orange/10" : "border-cocoa/15"}`}>
                          <input type="checkbox" className="accent-orange" checked={s.label.allergens.includes(a)} onChange={(e) => s.setLabel({ allergens: e.target.checked ? [...s.label.allergens, a] : s.label.allergens.filter((x) => x !== a) })} />
                          {a}
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="flex flex-col gap-1 text-[0.9rem] font-bold">
                      Net quantity (g)
                      <input inputMode="numeric" value={s.label.netQty} onChange={(e) => s.setLabel({ netQty: e.target.value.replace(/[^\d]/g, "") })} className="rounded-xl border border-cocoa/20 px-3 py-2 font-normal" placeholder="e.g. 100" />
                    </label>
                    <label className="flex flex-col gap-1 text-[0.9rem] font-bold">
                      Best before
                      <input value={s.label.bestBefore} onChange={(e) => s.setLabel({ bestBefore: e.target.value })} className="rounded-xl border border-cocoa/20 px-3 py-2 font-normal" placeholder="e.g. 6 months from packaging (confirm by shelf-life test)" />
                    </label>
                  </div>
                  <label className="flex flex-col gap-1 text-[0.9rem] font-bold">
                    Storage instructions
                    <input value={s.label.storage} onChange={(e) => s.setLabel({ storage: e.target.value })} className="rounded-xl border border-cocoa/20 px-3 py-2 font-normal" placeholder="Where and how should the customer keep it?" />
                  </label>
                  <ul className="grid gap-1">
                    <Check2 ok={orderOk}>Ingredients in descending order of weight</Check2>
                    <Check2 ok={allergenOk}>Allergens declared exactly as the recipe contains{!allergenOk && s.label.allergens.length > 0 ? " (check again: missing or extra)" : ""}</Check2>
                    <Check2 ok={qtyOk}>Net quantity between 10 g and 2,000 g</Check2>
                    <Check2 ok={storageOk}>Storage says to keep it cool and dry</Check2>
                    <Check2 ok={bbOk}>Best-before guidance given</Check2>
                    <Check2 ok>Vegetarian symbol, nutrition table placeholder and FSSAI section added automatically</Check2>
                  </ul>
                </div>
                <div>
                  {labelUrl && (
                    // eslint-disable-next-line @next/next/no-img-element -- generated data URL preview
                    <img src={labelUrl} alt="Preview of your label" className="w-full rounded-xl border border-cocoa/15 shadow" />
                  )}
                  <button disabled={!labelUrl || !labelOk} title={labelOk ? undefined : "Complete every label check first"} onClick={() => labelUrl && labelOk && downloadDataUrl(labelUrl, `EatBetter-SkilliZee-Label-${(p.name || "snack").replace(/\s+/g, "-")}.png`)} className={`${secondary} mt-2 w-full !text-[0.85rem]`}>
                    <Download className="size-4" /> Label PNG
                  </button>
                  {!labelOk && <p className="mt-1 text-center text-[0.78rem] text-cocoa-2">Unlocks when every check is green.</p>}
                </div>
              </div>
              <div className="mt-4 flex justify-between gap-2">
                <span />
                <button disabled={!labelOk} onClick={() => go(5)} className={primary}>
                  Submit for (simulated) approval <ArrowRight className="size-4" />
                </button>
              </div>
            </div>
          )}

          {stage === 5 && (
            <div>
              <div className="text-[0.8rem] font-extrabold uppercase tracking-[0.14em] text-orange">Evaluate · final quality assessment</div>
              <div className="mt-2 flex flex-wrap items-center gap-4 rounded-[22px] bg-cream p-4">
                <div className="grid size-24 place-items-center rounded-full border-4 border-success bg-white text-center">
                  <div>
                    <div className="font-display text-[1.8rem] font-semibold leading-none text-success">{score}</div>
                    <div className="text-[0.7rem] font-bold text-cocoa-2">/100</div>
                  </div>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 font-display text-[1.3rem] font-semibold">
                    <BadgeCheck className="size-6 text-success" /> Approved for simulated packaging
                  </div>
                  <p className="text-[0.92rem] text-cocoa-2">{checkMistakes} mistake(s) across the six checkpoints, each corrected before the batch moved on. This is a learning simulation, not FSSAI or company approval.</p>
                  <div className="mt-1 flex gap-0.5">{[0, 1, 2].map((i) => <Star key={i} className={`size-5 ${i < (checkMistakes <= 1 ? 3 : checkMistakes <= 4 ? 2 : 1) ? "fill-haldi text-[#C9A400]" : "text-cocoa/20"}`} />)}</div>
                </div>
              </div>
              <ul className="mt-3 grid gap-1.5 sm:grid-cols-2">
                {CHECKPOINTS.map((c) => (
                  <li key={c.id} className="flex items-center gap-2 rounded-xl bg-white px-3 py-2 text-[0.9rem] ring-1 ring-cocoa/10">
                    {s.checks[c.id]?.status === "pass" ? <ShieldCheck className="size-4 text-success" /> : <PackageCheck className="size-4 text-orange" />}
                    <span className="font-bold">{c.name}</span>
                    <span className="ml-auto text-cocoa-2">{s.checks[c.id]?.status === "pass" ? "first time" : `${s.checks[c.id]?.mistakes ?? 0} fix(es)`}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-5">
                <ProjectReady
                  student={student}
                  setStudent={setStudent}
                  reflection={s.reflection}
                  setReflection={s.setReflection}
                  reflectionPrompt="What did I learn about building and quality-checking a snack?"
                  submitWhat="Your Product Innovation & Quality Report (PDF) and your product label (PNG)."
                  files={[`EatBetter-SkilliZee-Product-Innovation-Report-${(student.name || "student").replace(/\s+/g, "-")}.pdf`, `EatBetter-SkilliZee-Label-${(p.name || "snack").replace(/\s+/g, "-")}.png`]}
                  downloads={[
                    { label: "Download Report (PDF)", sub: "Product Innovation & Quality Report", kind: "pdf", run: report },
                    { label: "Download Label (PNG)", sub: "Your back-of-pack label", kind: "png", run: () => downloadDataUrl(drawLabel({ ...p, parts: [...p.parts].sort((a, b) => b.pct - a.pct) }, s.label, student.name), `EatBetter-SkilliZee-Label-${(p.name || "snack").replace(/\s+/g, "-")}.png`) },
                  ]}
                />
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
