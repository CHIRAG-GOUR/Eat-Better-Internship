/**
 * The Meta Ads simulation: a transparent, deterministic model driven only by the student's choices.
 * Every constant is a PRACTICE ASSUMPTION for learning. Results are SIMULATED, never real Eat Better or Meta data.
 *
 *   spend        = daily budget × days
 *   CPM          = audience base CPM × objective CPM factor × relevance discount (better creative → cheaper delivery)
 *   impressions  = spend ÷ CPM × 1,000
 *   reach        = reachable audience × (1 − e^(−impressions ÷ (1.6 × reachable)))   (saturates: same people see it again)
 *   frequency    = impressions ÷ reach;  fatigue = (3 ÷ frequency)^0.6 when frequency > 3
 *   CTR          = 0.9% × objective × creative quality × audience fit × CTA fit × fatigue
 *   clicks       = impressions × CTR
 *   engagements  = impressions × 2% × objective × creative quality × audience fit × fatigue
 *   conv. rate   = 2.2% × objective × audience fit × message boost × CTA fit
 *   conversions  = clicks × conversion rate;   CPC = spend ÷ clicks;   CPA = spend ÷ conversions
 */

import { AUD, CAT_FIT, CTAS, MESSAGES, OBJECTIVES, PALETTE, swatchOf, type AudId, type CategoryId, type CreativeId, type CtaId, type MsgId, type ObjId } from "./data";
import { checkClaims, wordCount } from "./claims";
import type { PackDesign, PostDesign } from "./store";

export const MSG = Object.fromEntries(MESSAGES.map((m) => [m.id, m])) as Record<MsgId, (typeof MESSAGES)[number]>;
export const OBJ = Object.fromEntries(OBJECTIVES.map((o) => [o.id, o])) as Record<ObjId, (typeof OBJECTIVES)[number]>;
export const CTA = Object.fromEntries(CTAS.map((c) => [c.id, c])) as Record<CtaId, (typeof CTAS)[number]>;

export type ScorePart = { label: string; pts: number; max: number; note: string };

export const postText = (p: PostDesign) => `${p.headline}\n${p.body}\n${p.caption}`;

/** Creative quality of the Instagram post (0–100), with the reason for every point. */
export function postQuality(p: PostDesign, pack: PackDesign): { score: number; parts: ScorePart[]; blocked: boolean } {
  const { flags, supported } = checkClaims(postText(p));
  const blocked = flags.some((f) => f.severity === "block");
  const cautions = flags.filter((f) => f.severity === "caution").length;
  const hw = wordCount(p.headline);
  const bw = wordCount(p.body);
  const cw = wordCount(p.caption);
  const onBrand = swatchOf(p.bg)?.onBrand ?? false;
  const matchesPack = [pack.primary, pack.secondary, pack.accent].some((c) => c.toLowerCase() === p.bg.toLowerCase());
  const parts: ScorePart[] = [
    { label: "Honest benefit message", pts: blocked ? 0 : Math.max(0, 10 - cautions * 5) + (supported.length ? 10 : 0), max: 20, note: blocked ? "An unsupported claim is still in the copy." : supported.length ? `Uses a supported fact (${supported[0]}).` : "No unsupported claims, but no specific supported fact either." },
    { label: "Headline length", pts: hw >= 2 && hw <= 7 ? 15 : hw <= 10 && hw > 0 ? 8 : 3, max: 15, note: `${hw} words. Short headlines (2–7 words) are read in a scroll.` },
    { label: "Body copy", pts: bw >= 8 && bw <= 30 ? 15 : bw > 30 && bw <= 45 ? 8 : 0, max: 15, note: `${bw} words. 8–30 words says enough without a wall of text.` },
    { label: "Product is visible", pts: p.image === "pack" || p.image === "pack-ing" ? 15 : 10, max: 15, note: p.image.startsWith("pack") ? "People can see exactly what they would buy." : "A brand-story photo builds trust, but the product itself is not shown." },
    { label: "Brand consistency", pts: (onBrand ? 7 : 0) + (p.showLogo ? 4 : 0) + (matchesPack ? 4 : 0), max: 15, note: `${onBrand ? "On-brand colour" : "Off-brand colour"}${p.showLogo ? ", logo shown" : ", no logo"}${matchesPack ? ", matches your pack" : ", doesn't match your pack colours"}.` },
    { label: "Caption", pts: cw >= 10 && cw <= 60 ? 10 : cw > 0 ? 4 : 0, max: 10, note: `${cw} words. A 10–60 word caption adds context and personality.` },
    { label: "Typography matches the pack", pts: 10, max: 10, note: "The post uses your pack typeface, so the two look like one brand." },
  ];
  return { score: parts.reduce((a, x) => a + x.pts, 0), parts, blocked };
}

/** Quality of the pack-only creative: the pack is clear, but there's no headline or call to action. */
export function packQuality(pack: PackDesign): number {
  let s = 40;
  if (swatchOf(pack.primary)?.onBrand) s += 10;
  if (pack.claims.length) s += 10;
  if (pack.ingredients.length >= 2) s += 5;
  return s;
}

export type Metrics = {
  spend: number;
  cpm: number;
  impressions: number;
  reach: number;
  frequency: number;
  ctr: number;
  clicks: number;
  engagements: number;
  cvr: number;
  conversions: number;
  cpc: number;
  cpa: number;
  drivers: { quality: number; fit: number; ctaFit: number; fatigue: number; reachable: number; catFit: number; msgFit: number; score: number };
};

export function ctaFit(cta: CtaId, obj: ObjId) {
  return CTA[cta].best.includes(obj) ? 1.1 : 0.92;
}

export function simulate(o: { audience: AudId; objective: ObjId; daily: number; days: number; creative: CreativeId; message: MsgId; category: CategoryId; cta: CtaId; postScore: number; packScore: number }): Metrics {
  const aud = AUD[o.audience];
  const obj = OBJ[o.objective];
  const msg = MSG[o.message];
  const score = o.creative === "pack" ? o.packScore : o.creative === "carousel" ? Math.min(100, o.postScore * 1.08) : o.postScore;
  const quality = 0.6 + 0.7 * (score / 100);
  const catFit = CAT_FIT[o.category][o.audience];
  const msgFit = msg.fit[o.audience];
  const fitRaw = 0.5 * catFit + 0.5 * msgFit;
  const fit = 0.55 + 0.75 * fitRaw;
  const cf = o.creative === "pack" ? 0.85 : ctaFit(o.cta, o.objective);
  const spend = o.daily * o.days;
  const cpm = aud.cpm * obj.cpm * (1.15 - 0.25 * (score / 100));
  const impressions = (spend / cpm) * 1000;
  const reachable = aud.size * 0.6;
  const reach = reachable * (1 - Math.exp(-impressions / (1.6 * reachable)));
  const frequency = reach > 0 ? impressions / reach : 0;
  const fatigue = frequency > 3 ? Math.pow(3 / frequency, 0.6) : 1;
  const ctr = 0.009 * obj.ctr * quality * fit * cf * fatigue;
  const clicks = impressions * ctr;
  const engagements = impressions * 0.02 * obj.eng * quality * fit * fatigue;
  const cvr = 0.022 * obj.cvr * fit * msg.cvr * (o.creative === "pack" ? 0.9 : cf);
  const conversions = clicks * cvr;
  return {
    spend,
    cpm,
    impressions: Math.round(impressions),
    reach: Math.round(reach),
    frequency,
    ctr,
    clicks: Math.round(clicks),
    engagements: Math.round(engagements),
    cvr,
    conversions: Math.round(conversions),
    cpc: clicks ? spend / clicks : 0,
    cpa: conversions >= 1 ? spend / conversions : spend,
    drivers: { quality, fit, ctaFit: cf, fatigue, reachable, catFit, msgFit, score },
  };
}

export const pct = (x: number, d = 2) => `${(x * 100).toFixed(d)}%`;

/** Plain-language explanation of every metric, for the panel and the PDF. */
export const METRIC_HELP: { key: keyof Metrics | "spendKey"; name: string; what: string }[] = [
  { key: "impressions", name: "Impressions", what: "How many times the ad was shown. Spend ÷ CPM × 1,000. A cheaper CPM (broad audience, Awareness objective, strong creative) buys more." },
  { key: "reach", name: "Reach", what: "How many different people saw it. It flattens out as you run out of new people in the audience." },
  { key: "frequency", name: "Frequency", what: "Average times each person saw it (impressions ÷ reach). Above about 3, people get tired of the ad and click less." },
  { key: "clicks", name: "Clicks", what: "People who tapped through to the website. Impressions × CTR." },
  { key: "ctr", name: "CTR", what: "Click-through rate = clicks ÷ impressions. Driven by creative quality, audience fit, the objective and whether the button suits the goal." },
  { key: "engagements", name: "Engagement", what: "Likes, comments, shares and saves. The Engagement objective and a good creative raise it." },
  { key: "conversions", name: "Conversions", what: "Simulated purchases. Clicks × conversion rate, which rises with the Sales objective, audience fit and a reason to buy (e.g. free shipping)." },
  { key: "spend", name: "Spend", what: "Daily budget × days. The model spends the whole budget." },
  { key: "cpc", name: "CPC", what: "Cost per click = spend ÷ clicks. Lower is better." },
  { key: "cpa", name: "CPA", what: "Cost per acquisition (one simulated purchase) = spend ÷ conversions. The number a sales campaign is judged on." },
];

/** What went well / what to improve, read from the model's drivers. */
export function evaluate(m: Metrics, o: { audience: AudId; message: MsgId; objective: ObjId; creative: CreativeId }) {
  const good: string[] = [];
  const improve: string[] = [];
  const aud = AUD[o.audience].name.toLowerCase();
  if (m.drivers.fit >= 1.1) good.push(`Strong audience fit: your product and “${MSG[o.message].name}” message suit ${aud} (fit ×${m.drivers.fit.toFixed(2)}).`);
  else if (m.drivers.fit < 0.95) improve.push(`Weak audience fit (×${m.drivers.fit.toFixed(2)}): ${aud} are not the people this product or message speaks to best. Revisit the Chapter 2.3 audience table.`);
  if (m.drivers.score >= 80) good.push(`High creative quality (${Math.round(m.drivers.score)}/100) lowered the cost per impression and lifted clicks.`);
  else improve.push(`Creative quality is ${Math.round(m.drivers.score)}/100. Tighten the headline, add a supported fact, or show the product.`);
  if (m.drivers.ctaFit > 1) good.push("The call-to-action button matches the campaign objective.");
  else improve.push("The button doesn’t match the objective (e.g. ‘Join the Squad’ on a Sales campaign).");
  if (m.frequency > 3) improve.push(`Frequency reached ${m.frequency.toFixed(1)}: the same people saw the ad too often and clicked less. A bigger audience or a shorter run would help.`);
  else good.push(`Frequency stayed at ${m.frequency.toFixed(1)}, so the audience didn’t get tired of the ad.`);
  if (o.objective !== "sales" && o.objective !== "traffic") improve.push(`The ${OBJ[o.objective].name} objective builds visibility but brings few purchases; if sales matter, test Sales.`);
  return { good, improve };
}

export const paletteHex = PALETTE.map((p) => p.hex);
