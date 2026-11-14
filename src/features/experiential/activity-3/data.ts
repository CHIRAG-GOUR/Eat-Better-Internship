import { MATRIX, PILLARS, CHALLENGES } from "@/features/chapter-3-4/content";

/**
 * Static content for Experiential Activity 3. Channel facts (fulfilment model, speed, objective) come verbatim from
 * the chapter 3.4 matrix. SKU names and images are real Eat Better products; every batch date, shelf life, quantity,
 * forecast and rate below is a SIMULATED practice number, labelled as such in the interface and the report.
 */

export type ChId = "d2c" | "mkt" | "qc" | "b2b";
export const CH_IDS: ChId[] = ["d2c", "mkt", "qc", "b2b"];
export type PackId = "basic" | "protective" | "rigid";

function pick(id: string) {
  const m = MATRIX.find((x) => x.id === id)!;
  const p = PILLARS.find((x) => x.id === id)!;
  return { model: m.model, speed: m.speed, objective: m.objective, gives: p.gives, text: p.text };
}

export type Channel = { id: ChId; name: string; short: string; color: string; vehicle: string; model: string; speed: string; objective: string; gives: readonly string[]; text: string; need: PackId; minLife: number };
export const CHANNELS: Record<ChId, Channel> = {
  d2c: { id: "d2c", name: "Own website (D2C)", short: "D2C", color: "#FF5C00", vehicle: "Courier van", ...pick("d2c"), need: "protective", minLife: 21 },
  mkt: { id: "mkt", name: "Marketplaces", short: "Marketplace", color: "#2F6FDE", vehicle: "Box truck to fulfilment centres", ...pick("marketplace"), need: "protective", minLife: 45 },
  qc: { id: "qc", name: "Quick commerce", short: "Quick commerce", color: "#00A341", vehicle: "Dark-store van", ...pick("qcom"), need: "basic", minLife: 4 },
  b2b: { id: "b2b", name: "Corporate & bulk", short: "Corporate", color: "#8A4FD6", vehicle: "Freight lorry", ...pick("b2b"), need: "rigid", minLife: 60 },
};
export { CHALLENGES };

export const PACKS: Record<PackId, { id: PackId; name: string; desc: string }> = {
  basic: { id: "basic", name: "Dark-store tote, single-wall carton", desc: "Light and fast. Fine for a 10 to 20 minute ride, not for days on the road." },
  protective: { id: "protective", name: "5-ply corrugated + air cushion + tamper seal", desc: "Absorbs drops and stacking across a 1 to 5 day courier or marketplace journey." },
  rigid: { id: "rigid", name: "Rigid gift box + corner guards, palletised", desc: "Keeps hampers and boxes pristine on pallets for bulk freight." },
};

export type Sku = { id: string; name: string; short: string; img: string; shelf: number; fragile: boolean; demand: number; mix: [number, number, number, number]; kind: string };
export const SKUS: Sku[] = [
  { id: "ladoo24", name: "Assorted Laddoo Box (24)", short: "Laddoo Box 24", img: "/brand/library/combos/assorted-laddoo-box-24-hero.webp", shelf: 90, fragile: true, demand: 700, mix: [0.34, 0.28, 0.08, 0.3], kind: "laddoo" },
  { id: "snackbox", name: "Ultimate Snack Box", short: "Ultimate Snack Box", img: "/brand/library/combos/ultimate-snack-box-hero.webp", shelf: 150, fragile: false, demand: 560, mix: [0.3, 0.3, 0.1, 0.3], kind: "snackbox" },
  { id: "namkeen", name: "Assorted Namkeen Combo", short: "Namkeen Combo", img: "/brand/library/namkeen/assorted-namkeen-combo-of-4-hero.webp", shelf: 180, fragile: false, demand: 840, mix: [0.26, 0.34, 0.24, 0.16], kind: "namkeen" },
  { id: "chips", name: "Ragi Chips - Achari Masti", short: "Ragi Chips", img: "/brand/library/chips-puffs/ragi-chips-achari-masti-front.webp", shelf: 120, fragile: true, demand: 960, mix: [0.14, 0.28, 0.5, 0.08], kind: "chips" },
  { id: "nutmix", name: "Premium Nut Mix", short: "Premium Nut Mix", img: "/brand/library/nuts-seeds/premium-nut-mix-front.webp", shelf: 180, fragile: false, demand: 620, mix: [0.28, 0.3, 0.3, 0.12], kind: "nutmix" },
  { id: "hamper", name: "Diwali Utsav Hamper", short: "Diwali Hamper", img: "/brand/library/hampers/diwali-utsav-hero.webp", shelf: 120, fragile: true, demand: 400, mix: [0.3, 0.1, 0.03, 0.57], kind: "hamper" },
];
export const SKU = Object.fromEntries(SKUS.map((s) => [s.id, s])) as Record<string, Sku>;

export const CARTON_UNITS = 20; // packs per master carton
export const WINDOW_DAYS = 28;

/* Stage 1: routing desk */
export const ROUTES: { id: string; text: string; answer: ChId; why: string }[] = [
  { id: "r1", text: "A customer in a metro wants a pack of chips delivered in the next 15 minutes while watching a match.", answer: "qc", why: "10 to 20 minute delivery from a nearby dark store is exactly what quick commerce is built for, and it captures impulse snacking." },
  { id: "r2", text: "An HR team needs 200 Diwali hampers with a custom message, delivered on a fixed date three weeks away.", answer: "b2b", why: "Made-to-order hampers with predictable lead times ship by direct freight and bulk shipping on a scheduled basis." },
  { id: "r3", text: "A subscriber re-orders every month and we want to learn what they buy and bundle for them.", answer: "d2c", why: "Our own website captures first-party data, repeat subscription orders, custom bundling and the highest margin." },
  { id: "r4", text: "A shopper in a Tier-3 town searches for millet namkeen on a large shopping app and expects delivery in 1 to 2 days.", answer: "mkt", why: "Marketplaces bring established search intent and regional fulfilment centres across Tier-1, 2 and 3 cities." },
  { id: "r5", text: "A first-time buyer who found us through our own Instagram wants a parcel anywhere in India in 2 to 5 days, with our own packaging and message.", answer: "d2c", why: "Pan-India shipping from the central warehouse or a 3PL through our own website supports margin and brand building." },
];

/** Stage 3 damage model (simulated). */
export function damageRate(ch: ChId, pack: PackId | null, fragile: boolean): number {
  if (!pack) return fragile ? 0.12 : 0.07;
  const need = CHANNELS[ch].need;
  if (pack === need) return 0.01;
  if (need === "basic") return 0.01; // over-specified: safe, only slower and dearer
  if (pack === "basic") return fragile ? 0.1 : 0.06; // under-protected for a long journey
  return fragile ? 0.04 : 0.025; // protective for bulk, or rigid for a courier: partly right
}
export const PACK_TIME: Record<PackId, number> = { basic: 1, protective: 1.2, rigid: 1.3 };

/* Stage 4: disruptions */
export type Src = "reserve" | "free" | "surplus" | "hold" | "inbound";
export type EvOption = { id: string; label: string; desc: string; src: Src[]; cap: number; delay: number; expedite?: number; overtime?: number; unsafe?: boolean; flag?: "packaging" | "reorder" | "courier"; extraWaste?: boolean };
export type EvDef = { id: string; title: string; sku: string; ch: ChId; zone: Zone; deadlineH: number; unit: string; text: (n: number, sku: string) => string; options: EvOption[] };
export type Zone = "docks" | "receiving" | "qc" | "scan" | "d2c" | "b2b";
export const EVENTS: EvDef[] = [
  {
    id: "festive", title: "Festive spike", sku: "ladoo24", ch: "d2c", zone: "docks", deadlineH: 72, unit: "extra units",
    text: (n, s) => `A Diwali campaign goes viral. Orders for ${s} jump by about ${n} units over the next 3 days on the website and marketplaces. The packing line can only pack about 60% of that in normal hours.`,
    options: [
      { id: "a", label: "Release the safety reserve, normal shifts", desc: "Use reserve stock. Packing runs at its normal speed.", src: ["reserve"], cap: 0.6, delay: 10 },
      { id: "b", label: "Release reserve and add an overtime packing shift", desc: "Uses 1 overtime shift. Packing throughput rises to full speed.", src: ["reserve", "free"], cap: 1, delay: 10, overtime: 1 },
      { id: "c", label: "Re-allocate surplus stock from other channels", desc: "Pull leftover units back from the other channels. Takes a day or more to move.", src: ["surplus"], cap: 0.8, delay: 40 },
      { id: "d", label: "Stay with the original plan", desc: "Do nothing and let the extra orders be missed.", src: [], cap: 0, delay: 0 },
    ],
  },
  {
    id: "inbound", title: "Delayed inbound batch", sku: "namkeen", ch: "d2c", zone: "receiving", deadlineH: 96, unit: "units at risk",
    text: (n, s) => `The production unit tells you the next ${s} batch is delayed by 4 days. About ${n} units of demand fall into the gap across D2C and marketplaces.`,
    options: [
      { id: "a", label: "Cover the gap from safety stock", desc: "Reserve stock bridges the delay.", src: ["reserve"], cap: 1, delay: 4 },
      { id: "b", label: "Pause marketplace replenishment, protect D2C and quick commerce", desc: "Takes half the marketplace allocation of this SKU. Those marketplace orders will be missed.", src: ["hold"], cap: 1, delay: 8 },
      { id: "c", label: "Pay for expedited freight from the plant", desc: "Uses 1 expedite token. About 70% of the delayed batch arrives early.", src: ["inbound"], cap: 1, delay: 30, expedite: 1 },
      { id: "d", label: "Wait for the batch", desc: "Do nothing until the batch arrives.", src: [], cap: 0, delay: 0 },
    ],
  },
  {
    id: "dark", title: "Dark-store stockout", sku: "chips", ch: "qc", zone: "qc", deadlineH: 6, unit: "units to restock",
    text: (n, s) => `A busy dark store has sold out of ${s}. Shoppers on the app see "unavailable". About ${n} units of demand are due in the next 6 hours, and the central warehouse still has stock.`,
    options: [
      { id: "a", label: "Emergency van run from the central warehouse", desc: "A van takes stock from the reserve and unallocated shelves, arrives in about 4 hours.", src: ["reserve", "free"], cap: 1, delay: 4 },
      { id: "b", label: "Wait for the weekly replenishment", desc: "Do nothing until the next scheduled delivery.", src: [], cap: 0, delay: 0 },
      { id: "c", label: "Redirect marketplace stock by road", desc: "Cheap but slow. Takes stock earmarked for marketplaces and misses the 6-hour window.", src: ["hold"], cap: 1, delay: 20 },
      { id: "d", label: "Van run now, and set an automatic reorder trigger", desc: "Uses 1 expedite token. Restocks part of the gap and sets a reorder point that tops up dark stores in the final mission.", src: ["reserve", "free"], cap: 0.7, delay: 4, expedite: 1, flag: "reorder" },
    ],
  },
  {
    id: "damage", title: "Damaged shipment", sku: "snackbox", ch: "mkt", zone: "scan", deadlineH: 48, unit: "damaged units",
    text: (n, s) => `A marketplace fulfilment centre reports ${n} units of ${s} arrived with crushed cartons and torn inner packs. The marketplace will reject them.`,
    options: [
      { id: "a", label: "Write off, claim, and send a replacement from reserve", desc: "Damaged units are scrapped. The replacement comes from reserve stock.", src: ["reserve"], cap: 1, delay: 20, extraWaste: true },
      { id: "b", label: "Repack the damaged units and re-send them", desc: "Looks cheaper, but torn inner packs are a food-safety and complaint risk.", src: [], cap: 1, delay: 20, unsafe: true },
      { id: "c", label: "Write off and upgrade the packaging standard", desc: "No replacement now. Means fewer damages later in the final mission.", src: [], cap: 0, delay: 0, flag: "packaging", extraWaste: true },
      { id: "d", label: "Replace from reserve and upgrade the packaging", desc: "Uses 1 overtime shift to repack with cushioning, and replaces the units.", src: ["reserve", "free"], cap: 1, delay: 24, overtime: 1, flag: "packaging", extraWaste: true },
    ],
  },
  {
    id: "courier", title: "Courier delay", sku: "nutmix", ch: "d2c", zone: "d2c", deadlineH: 120, unit: "parcels delayed",
    text: (n, s) => `The main courier partner is stuck at a hub strike. About ${n} D2C parcels (mostly ${s}) will arrive 3 days late if nothing changes.`,
    options: [
      { id: "a", label: "Switch the stuck parcels to a backup courier", desc: "Uses 1 expedite token. Parcels still make the promised window, and the backup courier stays on contract.", src: [], cap: 1, delay: 0, expedite: 1, flag: "courier" },
      { id: "b", label: "Tell customers the new date, keep the courier", desc: "Honest, but every parcel is late.", src: [], cap: 1, delay: 200 },
      { id: "c", label: "Split: express for the oldest orders, rest wait", desc: "Uses 1 expedite token on 40% of parcels only.", src: [], cap: 0.4, delay: 0, expedite: 1 },
      { id: "d", label: "Do nothing", desc: "Parcels sit at the hub.", src: [], cap: 0, delay: 0 },
    ],
  },
  {
    id: "gifting", title: "Large corporate gifting order", sku: "hamper", ch: "b2b", zone: "b2b", deadlineH: 120, unit: "hampers ordered",
    text: (n, s) => `A large company orders ${n} ${s}s for delivery in 5 days. It is a high-volume order with social-proof value, but it competes for the same stock and packing hours.`,
    options: [
      { id: "a", label: "Accept in full and pack with overtime", desc: "Uses 1 overtime shift. Draws on free stock, reserve and corporate leftovers.", src: ["free", "reserve", "surplus"], cap: 1, delay: 90, overtime: 1 },
      { id: "b", label: "Accept and split into two shipments", desc: "Two dispatches on normal shifts. Packing speed limits how much arrives on time.", src: ["free", "reserve", "surplus"], cap: 0.8, delay: 100 },
      { id: "c", label: "Expedite a fresh hamper batch from the plant", desc: "Uses 1 expedite token. About 70% of the order comes from a new batch.", src: ["inbound", "free"], cap: 1, delay: 100, expedite: 1 },
      { id: "d", label: "Decline to protect existing orders", desc: "No disruption, but the B2B opportunity and social proof are lost.", src: [], cap: 0, delay: 0 },
    ],
  },
];

/* Stage 5: final mission rules (simulated) */
export const MISSION = {
  packRate: 60, // units packed per hour
  transit: { d2c: { standard: 60, express: 30 }, mkt: { standard: 30, express: 14 }, qc: { standard: 1, express: 1 }, b2b: { standard: 40, express: 22 } } as Record<ChId, { standard: number; express: number }>,
  horizonDays: 7,
  expressTokens: 2,
};

export function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
