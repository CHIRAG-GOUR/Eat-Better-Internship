/**
 * Experiential Activity 1 — Eat Better Product Innovation Lab: content and rules.
 * Ingredient notes are GENERAL food-science guidance for learning, not Eat Better's formulations.
 * Brand promises used as rules come from the internship chapters (brand claims): no palm oil, no refined sugar,
 * roasted not fried, familiar Indian taste. The six checkpoints follow the steps shown on eatbetterco.com/pages/our-kitchen.
 */

export type Level = "Low" | "Medium" | "High";
export type Ingredient = {
  id: string;
  name: string;
  group: "sweet" | "nut" | "seed" | "base" | "flavour" | "off";
  role: string; // what it does in a snack
  sweet: Level;
  crunch: Level;
  protein: Level;
  cost: Level; // relative cost tier (general)
  allergen?: string; // allergen to declare
  why: string; // why a company might choose it (or avoid it)
  breaks?: string; // which brand promise it breaks (decoys)
  color: string;
};

export const INGREDIENTS: Ingredient[] = [
  { id: "dates", name: "Dates", group: "sweet", role: "Natural sweetener and binder: holds a laddoo together.", sweet: "High", crunch: "Low", protein: "Low", cost: "Medium", why: "Sweetness and stickiness from a whole fruit, so no refined sugar is needed.", color: "#6B3A1E" },
  { id: "almonds", name: "Almonds", group: "nut", role: "Crunch, protein and good fats.", sweet: "Low", crunch: "High", protein: "High", cost: "High", allergen: "Tree nuts (almond)", why: "A premium nut that adds bite and nutrition; costs more than flour-based fillers.", color: "#C68A4B" },
  { id: "cashews", name: "Cashews", group: "nut", role: "Creamy body and richness.", sweet: "Low", crunch: "Medium", protein: "Medium", cost: "High", allergen: "Tree nuts (cashew)", why: "Gives a rich, melt-in-the-mouth texture to sweets and mixes.", color: "#E6C79A" },
  { id: "peanuts", name: "Peanuts", group: "nut", role: "Crunch and protein at a lower cost.", sweet: "Low", crunch: "High", protein: "High", cost: "Low", allergen: "Peanut", why: "Familiar Indian flavour and good protein for the price; a major allergen to declare.", color: "#D9A066" },
  { id: "seeds", name: "Pumpkin & sunflower seeds", group: "seed", role: "Crunch, fibre and minerals.", sweet: "Low", crunch: "Medium", protein: "Medium", cost: "Medium", why: "Small, crunchy and nutrient-dense; good in mixes and toppings.", color: "#5E7A3A" },
  { id: "millets", name: "Millets (jowar, ragi)", group: "base", role: "Grain base for namkeen and chips.", sweet: "Low", crunch: "High", protein: "Medium", cost: "Low", why: "Traditional Indian grains with fibre; roast well and replace refined flour.", color: "#B88A4A" },
  { id: "quinoa", name: "Quinoa", group: "base", role: "Protein-rich grain base.", sweet: "Low", crunch: "Medium", protein: "High", cost: "High", why: "A complete-protein seed grain that lifts the nutrition of a namkeen.", color: "#E8D4A8" },
  { id: "besan", name: "Chickpea flour (besan)", group: "base", role: "Base for puffs and bhujia.", sweet: "Low", crunch: "High", protein: "High", cost: "Low", why: "Protein-rich and familiar in Indian snacks; holds shape when baked or roasted.", color: "#E2B04A" },
  { id: "spices", name: "Spices & herbs (masala, pudina)", group: "flavour", role: "Natural flavour.", sweet: "Low", crunch: "Low", protein: "Low", cost: "Low", why: "Real spices give the familiar Indian taste without artificial flavour.", color: "#B03A1E" },
  { id: "cocoa", name: "Cocoa", group: "flavour", role: "Chocolate flavour.", sweet: "Low", crunch: "Low", protein: "Low", cost: "Medium", why: "Brings indulgence to sweets without needing extra sugar.", color: "#4A2A1E" },
  { id: "sugar", name: "Refined sugar", group: "off", role: "Cheap sweetness.", sweet: "High", crunch: "Low", protein: "Low", cost: "Low", why: "Cheap and very sweet — but it breaks a core brand promise.", breaks: "No refined sugar", color: "#F2F2F2" },
  { id: "palm", name: "Palm oil", group: "off", role: "Cheap frying fat.", sweet: "Low", crunch: "Low", protein: "Low", cost: "Low", why: "Common in conventional snacks because it is cheap — but it breaks a core brand promise.", breaks: "No palm oil", color: "#E8A21A" },
  { id: "maida", name: "Refined flour (maida)", group: "off", role: "Cheap filler base.", sweet: "Low", crunch: "Medium", protein: "Low", cost: "Low", why: "Cheap and easy to work with, but it is the refined base that 'better ingredients' replaces.", breaks: "Better ingredients (millets, nuts, seeds instead of refined flour)", color: "#FAFAF5" },
];
export const ING = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i])) as Record<string, Ingredient>;

export type CategoryId = "laddoo" | "namkeen" | "mix" | "puffs";
export const CATEGORIES: { id: CategoryId; name: string; taste: "sweet" | "savoury"; needs: string; check: (ids: string[]) => string | null; photo: string }[] = [
  {
    id: "laddoo",
    name: "Dry-fruit laddoo",
    taste: "sweet",
    needs: "a natural binder-sweetener and at least one nut",
    check: (ids) => (!ids.includes("dates") ? "A laddoo needs a binder that also sweetens — dates do both without refined sugar." : !ids.some((i) => ING[i].group === "nut") ? "A dry-fruit laddoo needs at least one nut for body and bite." : null),
    photo: "/brand/library/laddoos/orange-ginger-laddoos-texture.webp",
  },
  {
    id: "namkeen",
    name: "Roasted namkeen",
    taste: "savoury",
    needs: "a grain or legume base and a natural spice",
    check: (ids) => (!ids.some((i) => ["millets", "quinoa", "besan"].includes(i)) ? "A namkeen needs a base: millets, quinoa or chickpea flour." : !ids.includes("spices") ? "A namkeen without spices loses the familiar Indian taste." : null),
    photo: "/brand/library/namkeen/millet-namkeen-desi-masala-texture.webp",
  },
  {
    id: "mix",
    name: "Nut & seed mix",
    taste: "savoury",
    needs: "at least two different nuts or seeds",
    check: (ids) => (ids.filter((i) => ["nut", "seed"].includes(ING[i].group)).length < 2 ? "A mix needs at least two different nuts or seeds." : null),
    photo: "/brand/library/nuts-seeds/premium-nut-mix-texture.webp",
  },
  {
    id: "puffs",
    name: "Baked puffs",
    taste: "savoury",
    needs: "chickpea flour or millets as the base",
    check: (ids) => (!ids.some((i) => ["besan", "millets"].includes(i)) ? "Puffs need a base that puffs and holds shape: chickpea flour or millets." : null),
    photo: "/brand/library/chips-puffs/chickpea-puffs-imli-twist-texture.webp",
  },
];

export const FLAVOURS: { id: string; name: string; taste: "sweet" | "savoury" }[] = [
  { id: "choco", name: "Chocolate", taste: "sweet" },
  { id: "orange-ginger", name: "Orange & ginger", taste: "sweet" },
  { id: "classic", name: "Classic (no added flavour)", taste: "sweet" },
  { id: "masala", name: "Desi masala", taste: "savoury" },
  { id: "pudina", name: "Pudina (mint)", taste: "savoury" },
  { id: "chilli-lime", name: "Chilli lime", taste: "savoury" },
];

export const CONSUMERS = [
  { id: "families", name: "Health-conscious families" },
  { id: "pros", name: "Young professionals and students" },
  { id: "gift", name: "Gift buyers" },
  { id: "corporate", name: "Corporate buyers" },
];

/** The six quality checkpoints (eatbetterco.com/pages/our-kitchen shows sourcing, quality check, prepping, cooking and batch testing; packaging completes the line). */
export const CHECKPOINTS = [
  { id: "sourcing", name: "Sourcing", photo: "/brand/library/site/kitchen-sourcing-dates.webp", goal: "Accept only fresh, sound ingredient lots." },
  { id: "quality", name: "Quality check", photo: "/brand/library/site/kitchen-quality-check-cashews.webp", goal: "Remove everything that isn't food before it reaches the line." },
  { id: "prepping", name: "Prepping", photo: "/brand/library/site/kitchen-prepping-dates.webp", goal: "Hygiene and allergen control before cooking." },
  { id: "cooking", name: "Cooking", photo: "/brand/library/site/kitchen-cooking-millets.webp", goal: "Roast, don't fry — and hit the target window." },
  { id: "batch", name: "Batch testing", photo: "/brand/library/site/kitchen-batch-testing.webp", goal: "Every batch must match the golden sample before it ships." },
  { id: "packaging", name: "Packaging", photo: "/brand/library/chips-puffs/chickpea-puffs-lime-sriracha-back.webp", goal: "Protect freshness and crunch until the customer opens it." },
] as const;
export type CheckpointId = (typeof CHECKPOINTS)[number]["id"];

/** Seeded practice randomness so each new attempt differs but a reload of the same attempt stays the same. */
export function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
