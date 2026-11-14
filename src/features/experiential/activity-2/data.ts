/**
 * Experiential Activity 2 · Eat Better Brand Studio — content and practice data.
 *
 * Brand facts come only from the internship chapters (2.1 Brand Identity, 2.2 Digital Marketing, 2.3 Positioning,
 * 1.2 values) and from official Eat Better packs / photos in /public/brand. Everything a student designs is a
 * student concept. Every number in the ad simulation is a PRACTICE ASSUMPTION for learning, not Eat Better or Meta data.
 */

import { BRAND_LINES } from "@/lib/brand";
import { AUDIENCE } from "@/features/chapter-2-3/content";
import { LAB_COLOURS, COLOUR_NOTE, SHOPPERS, TAGLINE } from "@/features/chapter-2-1/content";
import { OFFERS, SOCIAL } from "@/features/chapter-2-2/content";

export { TAGLINE, BRAND_LINES, SHOPPERS, SOCIAL };

/* ── real products on the studio shelf (official pack photos, cropped to the pack) ─────────────────── */

export type RangeId = "laddoos" | "nuts" | "chips" | "namkeen";
export type ShelfItem = {
  id: string;
  name: string;
  range: RangeId;
  src: string;
  /** pack rectangle inside the 700×700 official photo: x0, y0, x1, y1 */
  crop: [number, number, number, number];
  format: "sachet" | "pouch";
  /** large, legible text printed on the front of the official pack */
  onPack: string[];
  /** ingredient line where the chapters or the pack state it */
  ingredients?: string;
  /** what else is in the official photo (so the studio can show it too) */
  props: string;
};

const L = "/brand/library";
export const SHELF: ShelfItem[] = [
  { id: "coffee-almond", name: "Coffee Almond Laddoos", range: "laddoos", src: `${L}/laddoos/coffee-almond-laddoos-front.webp`, crop: [238, 46, 460, 638], format: "sachet", onPack: ["Rich in dry fruits & nuts", "Sweetened with dates"], ingredients: "Dates, almonds, oats, coconut, coffee, cacao, chia seeds & sea salt", props: "Laddoos around the sachet" },
  { id: "hazelnut", name: "Hazelnut Chocolate Laddoos", range: "laddoos", src: `${L}/laddoos/hazelnut-chocolate-laddoos-front.webp`, crop: [240, 50, 456, 638], format: "sachet", onPack: ["Rich in dry fruits & nuts", "Sweetened with dates"], ingredients: "Dates, hazelnuts, almonds, cocoa, vanilla extract, chia seeds & sea salt", props: "Laddoos around the sachet" },
  { id: "orange-ginger", name: "Orange Ginger Laddoos", range: "laddoos", src: `${L}/laddoos/orange-ginger-laddoos-front.webp`, crop: [234, 46, 462, 638], format: "sachet", onPack: ["Rich in dry fruits & nuts", "Sweetened with dates"], props: "Laddoos around the sachet" },
  { id: "vanilla", name: "Vanilla Chocolate Laddoos", range: "laddoos", src: `${L}/laddoos/vanilla-chocolate-laddoos-front.webp`, crop: [239, 48, 457, 638], format: "sachet", onPack: ["Rich in dry fruits & nuts", "Sweetened with dates"], props: "Laddoos around the sachet" },
  { id: "nut-mix", name: "Premium Nut Mix", range: "nuts", src: `${L}/nuts-seeds/premium-nut-mix-front.webp`, crop: [160, 24, 550, 680], format: "pouch", onPack: ["Sweet & Savoury"], ingredients: "Cashews, almonds, pistachios, golden and black raisins", props: "A bowl of mixed nuts" },
  { id: "sweet-crunchy", name: "Sweet Crunchy Nut Mix", range: "nuts", src: `${L}/nuts-seeds/sweet-crunchy-nut-mix-front.webp`, crop: [181, 25, 572, 680], format: "pouch", onPack: ["Better munch", "Sweetened with dates"], props: "A bowl of nut mix" },
  { id: "seed-mix", name: "Seed Mix · Spiced Jaggery", range: "nuts", src: `${L}/nuts-seeds/seed-mix-spiced-jaggery-front.webp`, crop: [184, 20, 579, 680], format: "pouch", onPack: ["Better seed mix", "Spiced Jaggery"], props: "A bowl of roasted seeds" },
  { id: "trail-mix", name: "Better Trail Mix", range: "nuts", src: `${L}/nuts-seeds/better-trail-mix-front.webp`, crop: [178, 23, 563, 680], format: "pouch", onPack: ["Better trail mix"], props: "A bowl of trail mix" },
  { id: "protein-chips", name: "Protein Chips · Pizza Party", range: "chips", src: `${L}/chips-puffs/protein-chips-pizza-party-front.webp`, crop: [205, 53, 586, 640], format: "pouch", onPack: ["High protein & fiber", "12g protein per pack", "Baked not fried | No palm oil"], props: "A bowl of chips and cherry tomatoes" },
  { id: "protein-chips-pudina", name: "Protein Chips · Pudina Punch", range: "chips", src: `${L}/chips-puffs/protein-chips-pudina-punch-front.webp`, crop: [206, 49, 589, 640], format: "pouch", onPack: ["High protein & fiber", "12g protein per pack", "Baked not fried | No palm oil"], props: "A bowl of chips and fresh mint" },
  { id: "chickpea-puffs", name: "Chickpea Puffs · Imli Twist", range: "chips", src: `${L}/chips-puffs/chickpea-puffs-imli-twist-front.webp`, crop: [199, 52, 580, 640], format: "pouch", onPack: ["High protein & fiber", "Baked not fried | No palm oil"], props: "A bowl of puffs and tamarind" },
  { id: "millet-bhujia", name: "Millet Bhujia · Pudina Masti", range: "namkeen", src: `${L}/namkeen/millet-bhujia-pudina-masti-front.webp`, crop: [166, 27, 563, 680], format: "pouch", onPack: ["Eat what you love", "Roasted not fried | No palm oil"], ingredients: "Millets, real masalas and a pudina twist", props: "A bowl of bhujia and mint leaves" },
  { id: "protein-bhujia", name: "Protein Bhujia · Chilli Lime", range: "namkeen", src: `${L}/namkeen/protein-bhujia-chilli-lime-front.webp`, crop: [162, 25, 563, 680], format: "pouch", onPack: ["High protein & fiber", "15g protein", "Roasted not fried | No palm oil"], props: "A bowl of bhujia, lime and a red chilli" },
  { id: "millet-namkeen", name: "Millet Namkeen · Pudina Punch", range: "namkeen", src: `${L}/namkeen/millet-namkeen-pudina-punch-front.webp`, crop: [164, 25, 550, 680], format: "pouch", onPack: ["Chatpata crunchy namkeen", "No palm oil"], props: "A bowl of namkeen" },
];
export const SHELF_BY_ID = Object.fromEntries(SHELF.map((s) => [s.id, s])) as Record<string, ShelfItem>;

export const RANGES: Record<RangeId, { name: string; colour: string; mood: string }> = {
  laddoos: { name: "Dry-fruit laddoos", colour: "#550D10", mood: "Cream top, deep cocoa bottom: rich and indulgent, with one bright flavour colour per pack." },
  nuts: { name: "Nuts & mixes", colour: "#AF4300", mood: "Soft pastel shapes and a bold lower band: natural, premium and calm." },
  chips: { name: "Chips & puffs", colour: "#FF5C00", mood: "Loud reds, greens and yellows with a big product close-up: fun and crunchy." },
  namkeen: { name: "Millet namkeen", colour: "#35401D", mood: "Bright lime, orange and pink with real masala imagery: chatpata and familiar." },
};

/* ── the "Our story" cards (eatbetterco.com/pages/our-story; meanings from Chapter 1.2) ──────────────── */

export const STORY = [
  { id: "taste", name: "Familiar Taste", meaning: "The nostalgic flavours you grew up snacking on, made better.", img: `${L}/site/story-familiar-taste.webp`, shows: "A laddoo, about to be bitten", lesson: "Lead with taste and joy. People buy a snack to enjoy it." },
  { id: "ingredients", name: "Better Ingredients", meaning: "Simpler, cleaner ingredients that do not compromise on taste.", img: `${L}/site/story-better-ingredients-almonds.webp`, shows: "A gloved hand holding almonds over a tray of almonds", lesson: "Show what goes in. Real ingredients make the promise believable." },
  { id: "process", name: "Honest Processes", meaning: "Every batch is made with rigorous quality checks and clean processes.", img: `${L}/site/story-honest-processes-line.webp`, shows: "A kitchen team member in hairnet, mask and gloves at the packing line", lesson: "Show the care behind the product. Transparency builds trust." },
] as const;
export type StoryId = (typeof STORY)[number]["id"];

/* ── colour psychology (Chapter 2.1 lab) ───────────────────────────────────────────────────────────── */

export const COLOUR_LAB = LAB_COLOURS.map((c) => ({ ...c, note: COLOUR_NOTE[c.id] }));

export type Swatch = { hex: string; name: string; note: string; onBrand: boolean };
/** Colours the packaging editor offers. Brand values from brand.ts; associations are general marketing explanations. */
export const PALETTE: Swatch[] = [
  { hex: "#FF5C00", name: "Better Orange", note: "Eat Better's primary orange: energy, appetite and fun.", onBrand: true },
  { hex: "#2F1C1A", name: "Cocoa", note: "Eat Better's text colour: grounded, rich, chocolatey.", onBrand: true },
  { hex: "#603A38", name: "Logo Chocolate", note: "The wordmark colour: warm and trustworthy.", onBrand: true },
  { hex: "#FEE7D5", name: "Peach", note: "Soft and friendly; the website's header colour.", onBrand: true },
  { hex: "#FFF5EE", name: "Cream", note: "Eat Better's background: clean, light, natural.", onBrand: true },
  { hex: "#FED300", name: "Haldi Yellow", note: "Eat Better's highlight colour: cheerful and sunny.", onBrand: true },
  { hex: "#550D10", name: "Festive Maroon", note: "Behind laddoo and gifting photos: richness, indulgence, festivals.", onBrand: true },
  { hex: "#381C11", name: "Chocolate", note: "Laddoo hero backdrops: deep, indulgent.", onBrand: true },
  { hex: "#AF4300", name: "Terracotta", note: "Nut-mix backdrops: warmth and natural ingredients.", onBrand: true },
  { hex: "#E7BA68", name: "Mustard", note: "Tin and festive backdrops: warm and golden.", onBrand: true },
  { hex: "#35401D", name: "Forest", note: "Millet-range backdrops: nature, freshness and health.", onBrand: true },
  { hex: "#C8963E", name: "Brass", note: "Festive accents: premium and celebratory.", onBrand: true },
  { hex: "#B5D33D", name: "Lime leaf", note: "Like the Millet Bhujia pouch: fresh and zesty.", onBrand: true },
  { hex: "#8C939B", name: "Cold grey", note: "Cold greys can feel clinical or plain on food packs.", onBrand: false },
  { hex: "#FF2E9A", name: "Neon pink", note: "Neon brights grab attention but can feel artificial for a ‘real ingredients’ snack.", onBrand: false },
];
export const swatchOf = (hex: string) => PALETTE.find((p) => p.hex.toLowerCase() === hex.toLowerCase());

export type FontId = "fredoka" | "tommy" | "serif";
export const FONTS: { id: FontId; name: string; note: string; cssVar: string | null; fallback: string }[] = [
  { id: "fredoka", name: "Fredoka · rounded", note: "Eat Better's heading face on eatbetterco.com: friendly and playful.", cssVar: "--font-fredoka", fallback: "Fredoka, Arial Rounded MT Bold, sans-serif" },
  { id: "tommy", name: "MADE TOMMY · geometric", note: "Eat Better's body face: bold, clean, modern. Used on packs.", cssVar: "--font-tommy", fallback: "Figtree, Arial, sans-serif" },
  { id: "serif", name: "Classic serif", note: "Feels traditional and premium, but it is not part of Eat Better's identity.", cssVar: null, fallback: "Georgia, 'Times New Roman', serif" },
];

/* ── packaging categories (spec) ───────────────────────────────────────────────────────────────────── */

export type CategoryId = "laddoos" | "namkeen" | "nuts" | "combos";
export type IngId = "dates" | "almond" | "cashew" | "hazelnut" | "pistachio" | "raisin" | "cocoa" | "coffee" | "chia" | "oats" | "coconut" | "millet" | "mint" | "chilli" | "lime" | "jaggery" | "seeds" | "orange" | "ginger" | "masala";

export const CATEGORIES: {
  id: CategoryId;
  name: string;
  format: "sachet" | "pouch" | "box";
  formatName: string;
  ref: string; // official reference photo
  refName: string;
  claims: string[]; // official claims used on this range (brand.ts / packs)
  ingredients: IngId[];
  qty: string[];
  defaultName: string;
}[] = [
  { id: "laddoos", name: "Dry-fruit laddoos", format: "sachet", formatName: "Slim single-serve sachet", ref: `${L}/laddoos/coffee-almond-laddoos-front.webp`, refName: "Coffee Almond Laddoos", claims: ["Sweetened with dates", "No added sugar", "Rich in dry fruits & nuts", "Vegan & gluten-free"], ingredients: ["dates", "almond", "cashew", "hazelnut", "cocoa", "coffee", "chia", "oats", "coconut", "orange", "ginger"], qty: ["40 g", "120 g", "240 g"], defaultName: "" },
  { id: "namkeen", name: "Millet namkeen", format: "pouch", formatName: "Stand-up pouch", ref: `${L}/namkeen/millet-bhujia-pudina-masti-front.webp`, refName: "Millet Bhujia · Pudina Masti", claims: ["Roasted not fried", "No palm oil", "No trans fat", "Made with millets"], ingredients: ["millet", "masala", "mint", "chilli", "lime", "seeds"], qty: ["100 g", "200 g", "400 g"], defaultName: "" },
  { id: "nuts", name: "Nuts & mixes", format: "pouch", formatName: "Stand-up pouch", ref: `${L}/nuts-seeds/premium-nut-mix-front.webp`, refName: "Premium Nut Mix", claims: ["No added sugar", "No artificial flavours", "No preservatives", "100% natural ingredients"], ingredients: ["almond", "cashew", "pistachio", "raisin", "hazelnut", "seeds", "jaggery"], qty: ["100 g", "200 g"], defaultName: "" },
  { id: "combos", name: "Snack combos", format: "box", formatName: "Gift carton", ref: `${L}/combos/assorted-laddoo-box-24-hero.webp`, refName: "Assorted Laddoo Box (24)", claims: ["Sweetened with dates", "No added sugar", "Dry fruits, nuts & seeds", "Made in small batches"], ingredients: ["dates", "almond", "cashew", "pistachio", "cocoa", "millet", "masala", "coconut"], qty: ["240 g", "420 g", "660 g"], defaultName: "" },
];
export const CAT = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<CategoryId, (typeof CATEGORIES)[number]>;

export const ING_NAMES: Record<IngId, string> = {
  dates: "Dates",
  almond: "Almonds",
  cashew: "Cashews",
  hazelnut: "Hazelnuts",
  pistachio: "Pistachios",
  raisin: "Raisins",
  cocoa: "Cocoa",
  coffee: "Coffee",
  chia: "Chia seeds",
  oats: "Oats",
  coconut: "Coconut",
  millet: "Millets",
  mint: "Pudina (mint)",
  chilli: "Chilli",
  lime: "Lime",
  jaggery: "Jaggery",
  seeds: "Pumpkin seeds",
  orange: "Orange",
  ginger: "Ginger",
  masala: "Real masalas",
};

/* ── target audiences (Chapter 2.3 table + the Chapter 2.1 college-student shopper) ───────────────── */

export type AudId = "families" | "professionals" | "gifting" | "corporate" | "students";
/** PRACTICE ASSUMPTION: simulated audience size in the targeted cities and base cost per 1,000 impressions (CPM, Rs). */
const SIM_AUDIENCE: Record<AudId, { size: number; cpm: number }> = {
  families: { size: 1_800_000, cpm: 150 },
  professionals: { size: 1_400_000, cpm: 190 },
  gifting: { size: 900_000, cpm: 170 },
  corporate: { size: 120_000, cpm: 320 },
  students: { size: 1_600_000, cpm: 110 },
};

export const AUDIENCES: { id: AudId; name: string; need: string; appeal: string; source: string; size: number; cpm: number }[] = [
  ...AUDIENCE.rows.map((r) => ({ id: r.id as AudId, name: r.audience, need: r.need, appeal: r.appeal, source: "Chapter 2.3" })),
  { id: "students" as AudId, name: "College students", need: "A snack that looks tasty, grabbed between classes.", appeal: "Show the snack itself, big and appetising (Chapter 2.1: this shopper looks at the snack imagery first).", source: "Chapter 2.1" },
].map((a) => ({ ...a, ...SIM_AUDIENCE[a.id] }));
export const AUD = Object.fromEntries(AUDIENCES.map((a) => [a.id, a])) as Record<AudId, (typeof AUDIENCES)[number]>;

/* ── PRACTICE ASSUMPTIONS for the Meta Ads simulation (not real Eat Better or Meta numbers) ─────────── */

/** How well each product category meets each audience's need (0–1). Reasoned from the 2.3 table. */
export const CAT_FIT: Record<CategoryId, Record<AudId, number>> = {
  laddoos: { families: 0.8, professionals: 0.8, gifting: 0.85, corporate: 0.6, students: 0.7 },
  namkeen: { families: 0.95, professionals: 0.8, gifting: 0.4, corporate: 0.4, students: 0.85 },
  nuts: { families: 0.75, professionals: 0.95, gifting: 0.55, corporate: 0.55, students: 0.5 },
  combos: { families: 0.6, professionals: 0.45, gifting: 1, corporate: 0.95, students: 0.35 },
};

export type MsgId = "taste" | "ingredients" | "convenience" | "gifting" | "offer" | "bulk";
export const MESSAGES: { id: MsgId; name: string; line: string; fit: Record<AudId, number>; cvr: number; source: string }[] = [
  { id: "taste", name: "Familiar taste", line: "The flavours you grew up with, made better.", fit: { families: 0.9, professionals: 0.7, gifting: 0.6, corporate: 0.5, students: 0.95 }, cvr: 1, source: "Our story: Familiar Taste" },
  { id: "ingredients", name: "Better ingredients", line: "What is in it (and what is not): e.g. sweetened with dates, no palm oil.", fit: { families: 1, professionals: 0.8, gifting: 0.6, corporate: 0.6, students: 0.5 }, cvr: 1.05, source: "Our story: Better Ingredients · Ch 2.3 USP" },
  { id: "convenience", name: "Snack for busy days", line: "Convenient snacking for work breaks and busy schedules.", fit: { families: 0.6, professionals: 1, gifting: 0.3, corporate: 0.4, students: 0.8 }, cvr: 1, source: "Ch 2.3: working professionals" },
  { id: "gifting", name: "A thoughtful gift", line: "Gifts that feel thoughtful and different from conventional sweets.", fit: { families: 0.5, professionals: 0.4, gifting: 1, corporate: 0.85, students: 0.3 }, cvr: 1.05, source: "Ch 2.3: festive gift buyers" },
  { id: "offer", name: `Free shipping above Rs ${OFFERS.threshold}`, line: `A reason to buy now: free shipping on orders above Rs ${OFFERS.threshold}.`, fit: { families: 0.8, professionals: 0.7, gifting: 0.7, corporate: 0.3, students: 0.9 }, cvr: 1.18, source: "Ch 2.2: offers & conversion" },
  { id: "bulk", name: "Bulk orders for teams", line: "Bulk gifts for employees and clients, with presentation and customisation.", fit: { families: 0.2, professionals: 0.3, gifting: 0.5, corporate: 1, students: 0.15 }, cvr: 1, source: "Ch 2.3: corporate buyers" },
];

export type ObjId = "awareness" | "traffic" | "engagement" | "sales";
export const OBJECTIVES: { id: ObjId; name: string; goal: string; cpm: number; ctr: number; eng: number; cvr: number }[] = [
  { id: "awareness", name: "Awareness", goal: "Show the ad to as many people as possible, cheaply. Few clicks expected.", cpm: 0.7, ctr: 0.6, eng: 1, cvr: 0.5 },
  { id: "traffic", name: "Traffic", goal: "Send people to the website. Meta looks for people likely to click.", cpm: 1, ctr: 1.35, eng: 0.8, cvr: 0.8 },
  { id: "engagement", name: "Engagement", goal: "Get likes, comments, shares and saves. Builds community, fewer sales.", cpm: 0.85, ctr: 0.8, eng: 1.7, cvr: 0.6 },
  { id: "sales", name: "Sales", goal: "Find people likely to buy. Costs more per impression but converts better.", cpm: 1.3, ctr: 1, eng: 0.8, cvr: 1.6 },
];

export type CtaId = "shop" | "order" | "learn" | "gift" | "squad";
export const CTAS: { id: CtaId; text: string; best: ObjId[] }[] = [
  { id: "shop", text: "Shop now", best: ["sales", "traffic"] },
  { id: "order", text: "Order now", best: ["sales"] },
  { id: "learn", text: "Learn more", best: ["traffic", "awareness"] },
  { id: "gift", text: "Send as a gift", best: ["sales", "traffic"] },
  { id: "squad", text: "Join the Squad", best: ["engagement", "awareness"] },
];

export type CreativeId = "post" | "carousel" | "pack";
export const CREATIVES: { id: CreativeId; name: string; note: string }[] = [
  { id: "post", name: "Your Instagram post", note: "The square creative you designed, exactly as it is." },
  { id: "carousel", name: "Carousel: post + pack", note: "Card 1 your post, card 2 your packaging mockup. More to swipe, slightly more attention." },
  { id: "pack", name: "Packaging mockup only", note: "Just the pack on a backdrop: clear product, but no headline or call to action." },
];

/** Fixed practice budget for the final launch. */
export const LAUNCH_BUDGET = 30000;
export const LAUNCH_MIN = 24000;

/* ── Instagram creative options ────────────────────────────────────────────────────────────────────── */

export type PostLayout = "hero" | "split" | "photo" | "card";
export const POST_LAYOUTS: { id: PostLayout; name: string; note: string }[] = [
  { id: "hero", name: "Pack hero", note: "Headline on top, big product in the middle, button at the bottom." },
  { id: "split", name: "Split", note: "Words on one half, the picture on the other." },
  { id: "photo", name: "Full-bleed photo", note: "The picture fills the post; text sits on a dark fade." },
  { id: "card", name: "Card", note: "A white card on your colour: tidy and calm." },
];
export type PostImage = "pack" | "pack-ing" | "taste" | "ingredients" | "process";
export const POST_IMAGES: { id: PostImage; name: string; src?: string; official: boolean }[] = [
  { id: "pack", name: "My pack", official: false },
  { id: "pack-ing", name: "My pack + ingredients", official: false },
  { id: "taste", name: "Familiar Taste photo", src: STORY[0].img, official: true },
  { id: "ingredients", name: "Better Ingredients photo", src: STORY[1].img, official: true },
  { id: "process", name: "Honest Processes photo", src: STORY[2].img, official: true },
];

export const TEAMMATE_DRAFT = "These laddoos CURE sugar cravings!!! 100% healthy, doctor recommended and guaranteed weight loss in 2 weeks.";

/** Practice persona names for the Chapter 2.1 shoppers (consumer perception). */
export const PERCEPTION = SHOPPERS.map((s) => ({
  id: s.id,
  who: s.who,
  looks: s.priority === "claim" ? "the claim (e.g. “Sweetened with dates”)" : s.priority === "imagery" ? "the snack imagery" : "the brand name they already trust",
  says: s.happy,
}));

export const rupees = (n: number) => `₹${Math.round(n).toLocaleString("en-IN")}`;
export const num = (n: number) => Math.round(n).toLocaleString("en-IN");
