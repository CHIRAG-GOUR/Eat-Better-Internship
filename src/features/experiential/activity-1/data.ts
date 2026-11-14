/**
 * Experiential Activity 1 — Eat Better Product Innovation Lab: content and rules.
 * The ingredient set mirrors what appears in Eat Better's own ingredient lists (eatbetterco.com product pages),
 * e.g. Orange Ginger Laddoos: dates, cashews, raisins, oats, almonds, coconut, chia seeds, ginger, orange oil, sea salt.
 * Ingredient notes are GENERAL food-science guidance for learning, not Eat Better's formulations.
 * Brand promises used as rules come from the internship chapters (brand claims): no palm oil, no refined sugar,
 * roasted not fried. The six checkpoints follow the steps shown on eatbetterco.com/pages/our-kitchen.
 */

export type Level = "Low" | "Medium" | "High";
export type Group = "sweet" | "nut" | "seed" | "base" | "flavour" | "fat" | "off";
export type Ingredient = {
  id: string;
  name: string;
  group: Group;
  role: string;
  sweet: Level;
  crunch: Level;
  protein: Level;
  cost: Level;
  allergen?: "Tree nuts" | "Peanut" | "Sesame" | "Gluten (wheat)" | "Milk" | "Soy";
  why: string;
  breaks?: string;
  color: string;
};

export const INGREDIENTS: Ingredient[] = [
  // sweeteners & binders
  { id: "dates", name: "Dates", group: "sweet", role: "Natural sweetener and binder: holds a laddoo together.", sweet: "High", crunch: "Low", protein: "Low", cost: "Medium", why: "Sweetness and stickiness from a whole fruit, so no refined sugar is needed.", color: "#5A2E14" },
  { id: "raisins", name: "Raisins", group: "sweet", role: "Chewy bursts of natural sweetness.", sweet: "High", crunch: "Low", protein: "Low", cost: "Medium", why: "Dried grapes add sweetness and chew to mixes and laddoos.", color: "#4A2238" },
  { id: "jaggery", name: "Jaggery", group: "sweet", role: "Unrefined cane sweetener with a caramel taste.", sweet: "High", crunch: "Low", protein: "Low", cost: "Low", why: "A traditional unrefined sweetener; still sugar, so use it in small amounts.", color: "#B8742A" },
  // nuts
  { id: "almonds", name: "Almonds", group: "nut", role: "Crunch, protein and good fats.", sweet: "Low", crunch: "High", protein: "High", cost: "High", allergen: "Tree nuts", why: "A premium nut that adds bite and nutrition; costs more than flour-based fillers.", color: "#B9763F" },
  { id: "cashews", name: "Cashews", group: "nut", role: "Creamy body and richness.", sweet: "Low", crunch: "Medium", protein: "Medium", cost: "High", allergen: "Tree nuts", why: "Gives a rich, melt-in-the-mouth texture to sweets and mixes.", color: "#EBD3A6" },
  { id: "peanuts", name: "Peanuts", group: "nut", role: "Crunch and protein at a lower cost.", sweet: "Low", crunch: "High", protein: "High", cost: "Low", allergen: "Peanut", why: "Familiar Indian flavour and good protein for the price; a major allergen to declare.", color: "#D2A26A" },
  { id: "pistachios", name: "Pistachios", group: "nut", role: "Colour, crunch and a premium feel.", sweet: "Low", crunch: "High", protein: "High", cost: "High", allergen: "Tree nuts", why: "The green kernel signals premium quality in mixes and gift boxes.", color: "#8DB04A" },
  { id: "hazelnuts", name: "Hazelnuts", group: "nut", role: "Toasty flavour that pairs with chocolate.", sweet: "Low", crunch: "High", protein: "Medium", cost: "High", allergen: "Tree nuts", why: "The classic partner for cocoa in chocolate laddoos.", color: "#9A5B2E" },
  // seeds
  { id: "pumpkin", name: "Pumpkin seeds", group: "seed", role: "Crunch, protein and minerals.", sweet: "Low", crunch: "Medium", protein: "High", cost: "Medium", why: "Green, crunchy and nutrient-dense; good in mixes and namkeen.", color: "#5E7A3A" },
  { id: "sunflower", name: "Sunflower seeds", group: "seed", role: "Small crunchy bites with good fats.", sweet: "Low", crunch: "Medium", protein: "Medium", cost: "Low", why: "Affordable crunch for seed mixes and toppings.", color: "#BFB79A" },
  { id: "chia", name: "Chia seeds", group: "seed", role: "Fibre and a little binding.", sweet: "Low", crunch: "Low", protein: "Medium", cost: "Medium", why: "A small amount adds fibre; it appears in Eat Better's laddoo ingredient lists.", color: "#5D5A55" },
  { id: "sesame", name: "Sesame seeds", group: "seed", role: "Nutty flavour and crunch.", sweet: "Low", crunch: "Medium", protein: "Medium", cost: "Low", allergen: "Sesame", why: "A traditional Indian seed; an allergen that must be declared.", color: "#EFE3C8" },
  // bases
  { id: "millets", name: "Millets (jowar, ragi)", group: "base", role: "Grain base for namkeen and chips.", sweet: "Low", crunch: "High", protein: "Medium", cost: "Low", why: "Traditional Indian grains with fibre; roast well and replace refined flour.", color: "#C9A266" },
  { id: "quinoa", name: "Quinoa", group: "base", role: "Protein-rich grain base.", sweet: "Low", crunch: "Medium", protein: "High", cost: "High", why: "A complete-protein seed grain that lifts the nutrition of a namkeen.", color: "#E9D9B0" },
  { id: "chickpea", name: "Chickpeas & besan", group: "base", role: "Base for puffs, bhujia and namkeen.", sweet: "Low", crunch: "High", protein: "High", cost: "Low", why: "Protein-rich and familiar in Indian snacks; holds shape when baked or roasted.", color: "#E2B04A" },
  { id: "oats", name: "Oats", group: "base", role: "Body and fibre in laddoos.", sweet: "Low", crunch: "Low", protein: "Medium", cost: "Low", allergen: "Gluten (wheat)", why: "Adds texture and fibre; oats can carry gluten from processing, so check the allergen line.", color: "#D8C49A" },
  // flavours
  { id: "cocoa", name: "Cocoa", group: "flavour", role: "Chocolate flavour.", sweet: "Low", crunch: "Low", protein: "Low", cost: "Medium", why: "Brings indulgence to sweets without needing extra sugar.", color: "#4A2A1E" },
  { id: "coffee", name: "Coffee", group: "flavour", role: "Roasted coffee flavour.", sweet: "Low", crunch: "Low", protein: "Low", cost: "Medium", why: "Pairs with almonds and dates in a coffee laddoo.", color: "#3B2418" },
  { id: "vanilla", name: "Vanilla", group: "flavour", role: "Soft, sweet aroma.", sweet: "Low", crunch: "Low", protein: "Low", cost: "High", why: "A little rounds off chocolate and nut flavours.", color: "#2E1F16" },
  { id: "orange", name: "Orange (peel & oil)", group: "flavour", role: "Bright citrus flavour.", sweet: "Low", crunch: "Low", protein: "Low", cost: "Medium", why: "A few drops of orange oil give a fresh, zesty laddoo.", color: "#F28C1C" },
  { id: "ginger", name: "Ginger", group: "flavour", role: "Warm, spicy kick.", sweet: "Low", crunch: "Low", protein: "Low", cost: "Low", why: "Familiar Indian warmth; pairs with orange.", color: "#D9B36C" },
  { id: "coconut", name: "Coconut", group: "flavour", role: "Flaky texture and mild sweetness.", sweet: "Medium", crunch: "Low", protein: "Low", cost: "Medium", why: "Desiccated coconut adds texture to laddoos.", color: "#F5F1E8" },
  { id: "mint", name: "Mint (pudina)", group: "flavour", role: "Cool, fresh flavour.", sweet: "Low", crunch: "Low", protein: "Low", cost: "Low", why: "The 'pudina' in a pudina namkeen.", color: "#3E8E41" },
  { id: "chilli", name: "Red chilli", group: "flavour", role: "Heat.", sweet: "Low", crunch: "Low", protein: "Low", cost: "Low", why: "Adds the chatpata kick Indian snackers expect.", color: "#C62828" },
  { id: "lime", name: "Lime", group: "flavour", role: "Tangy freshness.", sweet: "Low", crunch: "Low", protein: "Low", cost: "Low", why: "Lifts savoury snacks; pairs with chilli.", color: "#8BC34A" },
  { id: "tamarind", name: "Tamarind (imli)", group: "flavour", role: "Sweet-sour tang.", sweet: "Medium", crunch: "Low", protein: "Low", cost: "Low", why: "The classic chatpata flavour in an imli twist.", color: "#6D3B1F" },
  { id: "spices", name: "Masala spice mix", group: "flavour", role: "Natural savoury flavour.", sweet: "Low", crunch: "Low", protein: "Low", cost: "Low", why: "Real spices give the familiar Indian taste without artificial flavour.", color: "#B5541E" },
  { id: "salt", name: "Sea salt", group: "flavour", role: "Seasoning that brings flavours out.", sweet: "Low", crunch: "Low", protein: "Low", cost: "Low", why: "A pinch balances sweet and savoury; too much is a health concern.", color: "#F4F6F8" },
  // fats
  { id: "sunoil", name: "Sunflower oil", group: "fat", role: "A little oil helps seasoning stick when roasting.", sweet: "Low", crunch: "Low", protein: "Low", cost: "Low", why: "Used in small amounts in roasted namkeen instead of frying.", color: "#F2C94C" },
  { id: "oliveoil", name: "Olive oil", group: "fat", role: "Light coating for nut mixes.", sweet: "Low", crunch: "Low", protein: "Low", cost: "High", why: "A thin coat helps seasoning cling to nuts.", color: "#9AA63A" },
  // promise-breakers
  { id: "sugar", name: "Refined sugar", group: "off", role: "Cheap sweetness.", sweet: "High", crunch: "Low", protein: "Low", cost: "Low", why: "Cheap and very sweet — but it breaks a core brand promise.", breaks: "No refined sugar", color: "#FAFAFA" },
  { id: "palm", name: "Palm oil", group: "off", role: "Cheap frying fat.", sweet: "Low", crunch: "Low", protein: "Low", cost: "Low", why: "Common in conventional snacks because it is cheap — but it breaks a core brand promise.", breaks: "No palm oil", color: "#E07B12" },
  { id: "maida", name: "Refined flour (maida)", group: "off", role: "Cheap filler base.", sweet: "Low", crunch: "Medium", protein: "Low", cost: "Low", why: "Cheap and easy to work with, but it is the refined base that 'better ingredients' replaces.", breaks: "Better ingredients (millets, nuts, seeds instead of refined flour)", color: "#FFFFFF" },
];
export const ING = Object.fromEntries(INGREDIENTS.map((i) => [i.id, i])) as Record<string, Ingredient>;

export type CategoryId = "laddoo" | "namkeen" | "mix" | "puffs";
export const CATEGORIES: { id: CategoryId; name: string; taste: "sweet" | "savoury" | "any"; needs: string; check: (ids: string[]) => string | null; photo: string }[] = [
  {
    id: "laddoo",
    name: "Dry-fruit laddoo",
    taste: "sweet",
    needs: "dates to sweeten and bind, plus at least one nut",
    check: (ids) => (!ids.includes("dates") ? "A laddoo needs a binder that also sweetens: dates do both without refined sugar." : !ids.some((i) => ING[i].group === "nut") ? "A dry-fruit laddoo needs at least one nut for body and bite." : null),
    photo: "/brand/library/laddoos/hazelnut-chocolate-laddoos-texture.webp",
  },
  {
    id: "namkeen",
    name: "Roasted namkeen",
    taste: "savoury",
    needs: "a grain or legume base (millets, quinoa or chickpeas) and a seasoning",
    check: (ids) => (!ids.some((i) => ["millets", "quinoa", "chickpea"].includes(i)) ? "A namkeen needs a base: millets, quinoa or chickpeas." : !ids.some((i) => ["spices", "mint", "chilli", "lime", "salt"].includes(i)) ? "A namkeen without seasoning loses the familiar Indian taste." : null),
    photo: "/brand/library/namkeen/millet-namkeen-desi-masala-texture.webp",
  },
  {
    id: "mix",
    name: "Nut & seed mix",
    taste: "any",
    needs: "at least two different nuts or seeds",
    check: (ids) => (ids.filter((i) => ["nut", "seed"].includes(ING[i].group)).length < 2 ? "A mix needs at least two different nuts or seeds." : null),
    photo: "/brand/library/nuts-seeds/premium-nut-mix-texture.webp",
  },
  {
    id: "puffs",
    name: "Baked chickpea puffs",
    taste: "savoury",
    needs: "chickpeas or millets as the base",
    check: (ids) => (!ids.some((i) => ["chickpea", "millets"].includes(i)) ? "Puffs need a base that puffs and holds shape: chickpeas or millets." : null),
    photo: "/brand/library/chips-puffs/chickpea-puffs-imli-twist-texture.webp",
  },
];

/** Each flavour names the ingredients it must contain — what's on the pack must be in the recipe. */
export const FLAVOURS: { id: string; name: string; taste: "sweet" | "savoury"; needs: string[] }[] = [
  { id: "choco", name: "Hazelnut chocolate", taste: "sweet", needs: ["cocoa", "hazelnuts"] },
  { id: "orange-ginger", name: "Orange & ginger", taste: "sweet", needs: ["orange", "ginger"] },
  { id: "coffee", name: "Coffee almond", taste: "sweet", needs: ["coffee", "almonds"] },
  { id: "jaggery", name: "Spiced jaggery", taste: "sweet", needs: ["jaggery", "spices"] },
  { id: "masala", name: "Desi masala", taste: "savoury", needs: ["spices"] },
  { id: "pudina", name: "Pudina (mint)", taste: "savoury", needs: ["mint"] },
  { id: "chilli-lime", name: "Chilli lime", taste: "savoury", needs: ["chilli", "lime"] },
  { id: "imli", name: "Imli (tamarind) twist", taste: "savoury", needs: ["tamarind"] },
];

/** A real Eat Better product with the same category + flavour, for comparison (official photos). */
export const REFERENCE: Record<string, { product: string; texture: string; ingredients: string }> = {
  "laddoo:choco": { product: "Hazelnut Chocolate Laddoos", texture: "/brand/library/laddoos/hazelnut-chocolate-laddoos-texture.webp", ingredients: "/brand/library/laddoos/hazelnut-chocolate-laddoos-ingredients.webp" },
  "laddoo:orange-ginger": { product: "Orange Ginger Laddoos", texture: "/brand/library/laddoos/orange-ginger-laddoos-texture.webp", ingredients: "/brand/library/laddoos/orange-ginger-laddoos-ingredients.webp" },
  "laddoo:coffee": { product: "Coffee Almond Laddoos", texture: "/brand/library/laddoos/coffee-almond-laddoos-texture.webp", ingredients: "/brand/library/laddoos/coffee-almond-laddoos-ingredients.webp" },
  "namkeen:masala": { product: "Millet Namkeen · Desi Masala", texture: "/brand/library/namkeen/millet-namkeen-desi-masala-texture.webp", ingredients: "/brand/library/namkeen/millet-namkeen-desi-masala-ingredients.webp" },
  "namkeen:pudina": { product: "Millet Namkeen · Pudina Punch", texture: "/brand/library/namkeen/millet-namkeen-pudina-punch-texture.webp", ingredients: "/brand/library/namkeen/millet-namkeen-pudina-punch-ingredients.webp" },
  "namkeen:chilli-lime": { product: "Quinoa Namkeen · Chilli Lime", texture: "/brand/library/namkeen/quinoa-namkeen-chilli-lime-texture.webp", ingredients: "/brand/library/namkeen/quinoa-namkeen-chilli-lime-ingredients.webp" },
  "mix:jaggery": { product: "Seed Mix · Spiced Jaggery", texture: "/brand/library/nuts-seeds/seed-mix-spiced-jaggery-texture.webp", ingredients: "/brand/library/nuts-seeds/seed-mix-spiced-jaggery-ingredients.webp" },
  "mix:masala": { product: "Masala Cranberry", texture: "/brand/library/nuts-seeds/masala-cranberry-texture.webp", ingredients: "/brand/library/nuts-seeds/masala-cranberry-ingredients.webp" },
  "puffs:imli": { product: "Chickpea Puffs · Imli Twist", texture: "/brand/library/chips-puffs/chickpea-puffs-imli-twist-texture.webp", ingredients: "/brand/library/chips-puffs/chickpea-puffs-imli-twist-ingredients.webp" },
  "puffs:chilli-lime": { product: "Chickpea Puffs · Lime Sriracha", texture: "/brand/library/chips-puffs/chickpea-puffs-lime-sriracha-texture.webp", ingredients: "/brand/library/chips-puffs/chickpea-puffs-lime-sriracha-ingredients.webp" },
  "puffs:pudina": { product: "Protein Chips · Pudina Punch", texture: "/brand/library/chips-puffs/protein-chips-pudina-punch-texture.webp", ingredients: "/brand/library/chips-puffs/protein-chips-pudina-punch-ingredients.webp" },
};

export const CONSUMERS = [
  { id: "families", name: "Health-conscious families" },
  { id: "pros", name: "Young professionals and students" },
  { id: "gift", name: "Gift buyers" },
  { id: "corporate", name: "Corporate buyers" },
];

export const CHECKPOINTS = [
  { id: "sourcing", name: "Sourcing", photo: "/brand/library/site/kitchen-sourcing-dates.webp", goal: "Accept only fresh, sound ingredient lots." },
  { id: "quality", name: "Quality check", photo: "/brand/library/site/kitchen-quality-check-cashews.webp", goal: "Remove everything that isn't food before it reaches the line." },
  { id: "prepping", name: "Prepping", photo: "/brand/library/site/kitchen-prepping-dates.webp", goal: "Hygiene and allergen control before cooking." },
  { id: "cooking", name: "Cooking", photo: "/brand/library/site/kitchen-cooking-millets.webp", goal: "Roast, don't fry — and hit the target window." },
  { id: "batch", name: "Batch testing", photo: "/brand/library/site/kitchen-batch-testing.webp", goal: "Every batch must match the golden sample before it ships." },
  { id: "packaging", name: "Packaging", photo: "/brand/library/chips-puffs/chickpea-puffs-lime-sriracha-back.webp", goal: "Protect freshness and crunch until the customer opens it." },
] as const;
export type CheckpointId = (typeof CHECKPOINTS)[number]["id"];

export function rng(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
