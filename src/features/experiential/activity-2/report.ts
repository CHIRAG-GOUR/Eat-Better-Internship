"use client";

import { buildReport, type ReportBlock, type Student } from "../shared/pdf";
import { AUD, CAT, CREATIVES, FONTS, ING_NAMES, LAUNCH_BUDGET, POST_IMAGES, POST_LAYOUTS, RANGES, SHELF_BY_ID, STORY, COLOUR_LAB, swatchOf } from "./data";
import { CTA, METRIC_HELP, MSG, OBJ, evaluate, packQuality, pct, postQuality, postText, simulate, type Metrics } from "./ads";
import { checkClaims, wordCount } from "./claims";
import type { AdSettings, Launch, PackDesign, PostDesign } from "./store";

export type KitInput = {
  student: Student;
  inspected: string[];
  stories: string[];
  colours: string[];
  brandNote: string;
  pack: PackDesign;
  rewrite: string;
  post: PostDesign;
  tests: AdSettings[];
  testNote: string;
  launch: Launch;
  justification: string;
  nextTime: string;
  reflection: string;
  mockupPng: string; // data URL
  postPng: string; // data URL
};

const rs = (n: number) => `Rs ${Math.round(n).toLocaleString("en-IN")}`;
const n0 = (n: number) => Math.round(n).toLocaleString("en-IN");
const colourName = (hex: string) => `${swatchOf(hex)?.name ?? "Custom"} (${hex.toUpperCase()})`;

/** Every required input, so a download is never made with gaps. Returns the missing items. */
export function missingForKit(k: Omit<KitInput, "mockupPng" | "postPng" | "student"> & { student?: Student }): string[] {
  const m: string[] = [];
  if (k.student && k.student.name.trim().length < 2) m.push("your name");
  if (k.inspected.length < 4) m.push("product inspections");
  if (k.stories.length < 3) m.push("the three Our story cards");
  if (wordCount(k.brandNote) < 20) m.push("brand analysis note");
  const p = k.pack;
  if (!p.category || !p.audience || wordCount(p.positioning) < 12) m.push("packaging brief (category, audience, positioning)");
  if (p.name.trim().length < 3 || p.variant.trim().length < 2 || !p.netQty || p.claims.length < 1 || p.ingredients.length < 2 || wordCount(p.description) < 8) m.push("packaging design details");
  if (wordCount(k.post.headline) < 2 || wordCount(k.post.body) < 8 || wordCount(k.post.caption) < 10) m.push("Instagram post text");
  if (k.tests.length < 2 || wordCount(k.testNote) < 15) m.push("ad tests and test notes");
  if (wordCount(k.justification) < 30 || wordCount(k.nextTime) < 10) m.push("launch justification");
  if (k.student && wordCount(k.reflection) < 25) m.push("reflection");
  return m;
}

export function runAd(a: AdSettings, pack: PackDesign, post: PostDesign): Metrics {
  return simulate({ ...a, category: pack.category ?? "laddoos", cta: post.cta, postScore: postQuality(post, pack).score, packScore: packQuality(pack) });
}

export function launchResults(l: Launch, pack: PackDesign, post: PostDesign) {
  const sets = [l.a, ...(l.b ? [l.b] : [])].map((s, i) => ({ name: i === 0 ? "Ad set A" : "Ad set B", set: s, m: runAd({ audience: s.audience, message: s.message, daily: s.daily, objective: l.objective, creative: l.creative, days: l.days }, pack, post) }));
  const sum = (k: keyof Metrics) => sets.reduce((a, s) => a + (s.m[k] as number), 0);
  const spend = sum("spend");
  const clicks = sum("clicks");
  const conversions = sum("conversions");
  const impressions = sum("impressions");
  const total = { spend, impressions, reach: sum("reach"), clicks, engagements: sum("engagements"), conversions, ctr: impressions ? clicks / impressions : 0, cpc: clicks ? spend / clicks : 0, cpa: conversions ? spend / conversions : spend };
  return { sets, total };
}

export async function buildKit(k: KitInput) {
  const p = k.pack;
  const cat = CAT[p.category!];
  const aud = AUD[p.audience!];
  const q = postQuality(k.post, p);
  const claims = checkClaims(postText(k.post));
  const packClaims = checkClaims(`${p.name} ${p.variant} ${p.description}`);
  const L = launchResults(k.launch, p, k.post);
  const date = new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" });

  const blocks: ReportBlock[] = [
    { kind: "h", text: "About this project" },
    { kind: "p", text: "Role: member of Eat Better Co's branding & digital marketing team. In the 3D Eat Better Brand Studio I studied the real brand and products, designed a packaging concept and an Instagram creative, practised communicating benefits without unsupported health claims, tested Meta Ads settings in a simulation and launched a campaign within a fixed practice budget." },
    { kind: "callout", tone: "info", text: "Student-created work: the packaging and creative in this kit are my concepts for a learning activity, not official Eat Better packaging or advertising. All campaign numbers are SIMULATED from a practice model, not real Eat Better or Meta results." },

    { kind: "h", text: "1. Brand analysis" },
    { kind: "kv", rows: [["Brand name", "Eat Better Co"], ["Tagline", "The joy of snacking, made better."], ["Brand values (Our story)", STORY.map((s) => s.name).join(" · ")]] },
    { kind: "table", head: ["Value", "What it means (eatbetterco.com / Ch 1.2)", "Lesson for marketing"], rows: STORY.filter((s) => k.stories.includes(s.id)).map((s) => [s.name, s.meaning, s.lesson]), widths: [34, 74, 66] },
    { kind: "p", text: "Real products I inspected on the studio shelf (official packs):" },
    { kind: "table", head: ["Product", "Range", "What the front of the pack says"], rows: k.inspected.map((id) => SHELF_BY_ID[id]).filter(Boolean).map((s) => [s.name, RANGES[s.range].name, s.onPack.join("; ")]), widths: [56, 36, 82] },
    { kind: "p", text: "Colour psychology notes I explored (Chapter 2.1 colour lab; general marketing associations):" },
    { kind: "bullets", items: COLOUR_LAB.filter((c) => k.colours.includes(c.id)).map((c) => `${c.name} (${c.hex}): ${c.note}${c.official ? ` ${c.official}` : " Not an Eat Better colour."}`) },
    { kind: "p", text: "My brand analysis:" },
    { kind: "callout", tone: "info", text: k.brandNote.trim() },

    { kind: "h", text: "2. Target audience profile" },
    { kind: "kv", rows: [["Audience", `${aud.name} (${aud.source})`], ["Their need", aud.need], ["How to appeal to them", aud.appeal], ["Product-audience fit (model)", `${Math.round(simulateFit(p) * 100)} / 100 for ${cat.name.toLowerCase()} (practice assumption)`], ["Simulated audience size", `${n0(aud.size)} people (practice assumption)`]] },

    { kind: "h", text: "3. Positioning" },
    { kind: "callout", tone: "good", text: k.pack.positioning.trim() },
    { kind: "p", muted: true, text: "Eat Better positions itself between traditional indulgent snacks and products marketed mainly around health: familiar snacks with a better-for-you approach (Chapter 2.3)." },

    { kind: "h", text: "4. Packaging design (student concept)" },
    { kind: "image", dataUrl: k.mockupPng, w: 92, h: 115, caption: `Packaging mockup: ${p.name} (student-created concept, not official Eat Better packaging)` },
    {
      kind: "kv",
      rows: [
        ["Product name", p.name],
        ["Flavour / variant", p.variant],
        ["Category & format", `${cat.name} · ${cat.formatName}`],
        ["Net quantity", p.netQty],
        ["Front-of-pack layout", p.layout === "band" ? "Two-tone band (logo and image on top, name and claims on the lower band)" : p.layout === "classic" ? "Classic (logo, image, then name; claims band at the bottom)" : "Name first (name under the logo, product on an arch below)"],
        ["Typography", FONTS.find((f) => f.id === p.font)!.name],
        ["Main colour", colourName(p.primary)],
        ["Second colour", colourName(p.secondary)],
        ["Accent colour", colourName(p.accent)],
        ["Product image", `${p.imgX < 0 ? "Left" : p.imgX > 0 ? "Right" : "Centre"}, ${p.imgY < 0 ? "raised" : p.imgY > 0 ? "lowered" : "middle"}, size ${Math.round(p.imgScale * 100)}%`],
        ["Claims on pack", p.claims.join("; ")],
        ["Ingredient messaging", p.ingredients.map((i) => ING_NAMES[i]).join(", ")],
        ["Short description", p.description],
      ],
    },
    { kind: "bullets", items: [swatchOf(p.primary)?.note ?? "", swatchOf(p.secondary)?.note ?? "", `Claims check on pack text: ${packClaims.flags.length ? packClaims.flags.map((f) => `${f.label} (“${f.match}”)`).join("; ") : "no unsupported claims"}.`, `All claims chosen come from Eat Better's official ${cat.name.toLowerCase()} packs; a real product would need its own lab-tested label to use them.`].filter(Boolean) },

    { kind: "h", text: "5. Social media creative (Instagram post)" },
    { kind: "image", dataUrl: k.postPng, w: 105, h: 105, caption: "My Instagram creative, 1080 x 1080 (student-created)" },
    {
      kind: "kv",
      rows: [
        ["Layout", POST_LAYOUTS.find((l) => l.id === k.post.layout)!.name],
        ["Image", POST_IMAGES.find((i) => i.id === k.post.image)!.name + (POST_IMAGES.find((i) => i.id === k.post.image)!.official ? " (official Eat Better photo)" : " (my design)")],
        ["Image placement", `x ${k.post.imgX.toFixed(1)}, y ${k.post.imgY.toFixed(1)}, size ${Math.round(k.post.imgScale * 100)}%`],
        ["Headline", k.post.headline],
        ["Body text", k.post.body],
        ["Call to action", CTA[k.post.cta].text],
        ["Background", colourName(k.post.bg)],
        ["Logo", k.post.showLogo ? "Shown" : "Not shown"],
        ["Caption", k.post.caption],
      ],
    },
    { kind: "callout", tone: claims.flags.length ? "warn" : "good", text: `Claims check: ${claims.flags.length ? claims.flags.map((f) => `${f.label} (“${f.match}”, ${f.severity})`).join("; ") : "no unsupported health claims."} Supported facts used: ${claims.supported.length ? claims.supported.join("; ") : "none"}.` },
    { kind: "p", text: "Practice: rewriting a teammate's draft without unsupported claims" },
    { kind: "table", head: ["Teammate's draft", "My rewrite"], rows: [["These laddoos CURE sugar cravings!!! 100% healthy, doctor recommended and guaranteed weight loss in 2 weeks.", k.rewrite]], widths: [87, 87] },
    { kind: "table", head: ["Creative quality factor", "Points", "Why"], rows: q.parts.map((x) => [x.label, `${x.pts} / ${x.max}`, x.note]), widths: [46, 20, 108] },
    { kind: "p", text: `Creative quality score: ${q.score} / 100 (used by the ads simulation).` },

    { kind: "h", text: "6. Meta Ads plan" },
    { kind: "p", text: "Test campaigns I ran in the simulation (SIMULATED results):" },
    {
      kind: "table",
      head: ["Test", "Audience", "Objective", "Message", "Creative", "Budget", "Clicks", "Conv.", "CPA"],
      rows: k.tests.map((t, i) => {
        const m = runAd(t, p, k.post);
        return [`T${i + 1}`, AUD[t.audience].name, OBJ[t.objective].name, MSG[t.message].name, CREATIVES.find((c) => c.id === t.creative)!.name, `${rs(t.daily)} x ${t.days}d`, n0(m.clicks), n0(m.conversions), rs(m.cpa)];
      }),
      widths: [11, 26, 19, 24, 24, 24, 15, 12, 19],
    },
    { kind: "p", text: "What changed between my tests, and why:" },
    { kind: "callout", tone: "info", text: k.testNote.trim() },
    { kind: "kv", rows: [["Final objective", `${OBJ[k.launch.objective].name}: ${OBJ[k.launch.objective].goal}`], ["Final creative", CREATIVES.find((c) => c.id === k.launch.creative)!.name], ["Duration", `${k.launch.days} days`], ["Call to action", CTA[k.post.cta].text]] },

    { kind: "h", text: "7. Budget allocation" },
    {
      kind: "table",
      head: ["Ad set", "Audience", "Message", "Daily", "Days", "Total", "Share"],
      rows: L.sets.map((s) => [s.name, AUD[s.set.audience].name, MSG[s.set.message].name, rs(s.set.daily), String(k.launch.days), rs(s.m.spend), `${Math.round((s.m.spend / L.total.spend) * 100)}%`]),
      widths: [20, 34, 34, 22, 14, 28, 22],
    },
    { kind: "p", text: `Total planned spend: ${rs(L.total.spend)} of the fixed ${rs(LAUNCH_BUDGET)} practice budget (${Math.round((L.total.spend / LAUNCH_BUDGET) * 100)}% used).` },

    { kind: "h", text: "8. Simulated performance" },
    {
      kind: "table",
      head: ["", "Impressions", "Reach", "Clicks", "CTR", "Engagement", "Conversions", "CPC", "CPA"],
      rows: [
        ...L.sets.map((s) => [s.name, n0(s.m.impressions), n0(s.m.reach), n0(s.m.clicks), pct(s.m.ctr), n0(s.m.engagements), n0(s.m.conversions), rs(s.m.cpc), rs(s.m.cpa)]),
        ...(L.sets.length > 1 ? [["Total", n0(L.total.impressions), n0(L.total.reach), n0(L.total.clicks), pct(L.total.ctr), n0(L.total.engagements), n0(L.total.conversions), rs(L.total.cpc), rs(L.total.cpa)]] : []),
      ],
      widths: [18, 22, 20, 17, 16, 21, 21, 18, 21],
    },
    { kind: "callout", tone: "warn", text: "SIMULATED: these figures come from a transparent practice model driven by my choices (audience fit, creative quality, objective, budget and duration). They are not real Eat Better or Meta results." },
    { kind: "p", text: "How each metric works in the model:" },
    { kind: "bullets", items: METRIC_HELP.map((h) => `${h.name}: ${h.what}`) },

    { kind: "h", text: "9. Evaluation and justification" },
    { kind: "p", text: "What went well (from the simulation drivers):" },
    { kind: "bullets", items: L.sets.flatMap((s) => evaluate(s.m, { ...s.set, objective: k.launch.objective, creative: k.launch.creative }).good.map((g) => `${s.name}: ${g}`)) },
    { kind: "p", text: "What to improve:" },
    { kind: "bullets", items: improveList(L.sets, k.launch) },
    { kind: "p", text: "Why I chose this audience and creative:" },
    { kind: "callout", tone: "good", text: k.justification.trim() },
    { kind: "p", text: "What I would change next time:" },
    { kind: "callout", tone: "info", text: k.nextTime.trim() },

    { kind: "h", text: "10. My reflection" },
    { kind: "p", text: k.reflection.trim() },
  ];

  await buildReport({
    title: "Brand Identity & Marketing Campaign Kit",
    activity: "Experiential Activity 2 · Eat Better Brand Studio",
    module: "Module 2 · Brand Creatives & Marketing",
    student: k.student,
    date,
    blocks,
    filename: `EatBetter-SkilliZee-Brand-Campaign-Kit-${(k.student.name || "student").trim().replace(/\s+/g, "-")}.pdf`,
  });
}

function improveList(sets: { name: string; set: { audience: AdSettings["audience"]; message: AdSettings["message"] }; m: Metrics }[], l: Launch) {
  const items = sets.flatMap((s) => evaluate(s.m, { ...s.set, objective: l.objective, creative: l.creative }).improve.map((g) => `${s.name}: ${g}`));
  return items.length ? items : ["No weak drivers in the model: audience fit, creative quality, call to action and frequency all scored well."];
}

function simulateFit(p: PackDesign) {
  return p.category && p.audience ? simulate({ audience: p.audience, objective: "traffic", daily: 1000, days: 7, creative: "post", message: "taste", category: p.category, cta: "shop", postScore: 50, packScore: 50 }).drivers.catFit : 0;
}

/** Shrink a PNG data URL for embedding in the PDF. */
export async function shrink(dataUrl: string, maxW: number): Promise<string> {
  const img = new Image();
  img.src = dataUrl;
  await img.decode();
  const s = Math.min(1, maxW / img.naturalWidth);
  const c = document.createElement("canvas");
  c.width = Math.round(img.naturalWidth * s);
  c.height = Math.round(img.naturalHeight * s);
  c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
  return c.toDataURL("image/png");
}
