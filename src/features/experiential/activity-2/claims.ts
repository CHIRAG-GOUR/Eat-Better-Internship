/**
 * Live claims checker for student copy (pack text, post headline/body/caption).
 * "block" = an unsupported health or absolute claim that must be rewritten before the creative can run.
 * "caution" = allowed only with proof, or off-tone for Eat Better. Explanations are general marketing/
 * advertising guidance for learning, not legal advice.
 */

export type ClaimFlag = { id: string; severity: "block" | "caution"; match: string; label: string; why: string; fix: string };

const RULES: { id: string; severity: "block" | "caution"; re: RegExp; label: string; why: string; fix: string }[] = [
  {
    id: "cure",
    severity: "block",
    re: /\b(cures?|cured|curing|heals?|healing|remed(y|ies)|medicin(e|al)|treats? (?:diabetes|disease|illness|obesity)|prevents? (?:disease|illness|diabetes|cancer|heart disease))\b/i,
    label: "Medical claim",
    why: "A snack is food, not medicine. Saying it cures, heals or prevents something is a medical claim that no snack can prove, and food advertising must not make it.",
    fix: "Talk about taste and what is inside, e.g. “sweetened with dates”.",
  },
  {
    id: "weight",
    severity: "block",
    re: /\b(weight[- ]?loss|lose (?:\d+\s?)?(?:kg|kilos?|weight)|burns? fat|fat[- ]?burn(?:ing|er)?|slimming|melts? (?:the )?fat|get slim)\b/i,
    label: "Weight-loss promise",
    why: "No snack can make anyone lose weight; that depends on a person's whole diet and lifestyle. The promise misleads buyers.",
    fix: "Describe the snack honestly: portion, ingredients, taste.",
  },
  {
    id: "guarantee",
    severity: "block",
    re: /\bguarantee(?:d|s)?\b/i,
    label: "Guaranteed result",
    why: "You can’t guarantee how a food affects someone’s body. Guarantees about health results are misleading.",
    fix: "Drop the guarantee; say what the product is.",
  },
  {
    id: "absolute",
    severity: "block",
    re: /\b(100\s?%\s?(?:healthy|safe|guilt[- ]?free|nutritious|good for you)|completely healthy|totally healthy|perfectly healthy|super ?healthy|healthiest|the healthiest)\b/i,
    label: "Absolute health claim",
    why: "Whether a snack is “healthy” depends on portion and the rest of the diet. “100% healthy” is an absolute claim nobody can prove.",
    fix: "Use a specific, true fact instead: “no palm oil”, “roasted not fried”.",
  },
  {
    id: "endorse",
    severity: "block",
    re: /\b((?:doctors?|dietitians?|nutritionists?|experts?)[- ](?:recommended|approved|endorsed|trusted)|recommended by (?:doctors?|dietitians?|nutritionists?|experts?)|clinically (?:proven|tested)|scientifically proven)\b/i,
    label: "Endorsement or proof claim",
    why: "Claiming doctors recommend it, or that it is clinically proven, needs documented endorsements or studies. The course gives no such evidence.",
    fix: "Point to what the brand really does, e.g. “lab-tested nutrition” or “6-layer quality check”, only if true.",
  },
  {
    id: "immunity",
    severity: "block",
    re: /\b(boosts? (?:your )?immunity|immunity[- ]boost(?:er|ing)?|detox(?:ify|es|ing)?|cleanses? your)\b/i,
    label: "Health-benefit claim",
    why: "Immunity or detox benefits are health claims that need scientific evidence and approval; a snack ad can’t just say them.",
    fix: "Stick to ingredient facts and taste.",
  },
  {
    id: "diabetic",
    severity: "block",
    re: /\b(diabetic[- ]friendly|safe for diabetics|for diabetics|sugar[- ]?free|zero sugar)\b/i,
    label: "Sugar / diabetic claim",
    why: "Dates and raisins contain natural sugars, so “sugar-free” would be false, and “safe for diabetics” is a medical claim. Eat Better’s packs say “Sweetened with dates” and “No added sugar”.",
    fix: "Use the official wording: “sweetened with dates” or “no added sugar”.",
  },
  {
    id: "calorie",
    severity: "block",
    re: /\b((?:zero|0|no) (?:calories?|cals?)|calorie[- ]free|fat[- ]free|zero fat)\b/i,
    label: "False nutrition claim",
    why: "Nuts, seeds and laddoos naturally contain calories and fats. Saying zero is simply untrue.",
    fix: "Use the facts from the label, e.g. “no trans fat” for millet namkeen.",
  },
  {
    id: "superlative",
    severity: "caution",
    re: /\b(best in (?:india|the world|town)|no\.?\s?1|number one|#1|world'?s best|better than (?:all|any|every)|tastiest in)\b/i,
    label: "Comparison claim",
    why: "“Best” or “No. 1” claims compare you with everyone else and need proof such as sales data or independent taste tests.",
    fix: "Say what makes it special instead.",
  },
  {
    id: "protein",
    severity: "caution",
    re: /\b(high[- ]protein|protein[- ]rich|packed with protein|\d+\s?g protein)\b/i,
    label: "Protein claim",
    why: "Use a protein claim only when the product’s lab-tested label supports it (Eat Better’s Protein Bhujia pack, for example, prints its protein grams).",
    fix: "Keep it only if your concept would be lab-tested to prove it.",
  },
  {
    id: "chemical",
    severity: "caution",
    re: /\b(chemical[- ]free|no chemicals|toxin[- ]free|non[- ]toxic)\b/i,
    label: "Vague claim",
    why: "Everything is made of chemicals, so this is vague and can mislead. Name the specific thing that is absent, if the label proves it.",
    fix: "e.g. “no preservatives” (only if true for your product).",
  },
  {
    id: "pushy",
    severity: "caution",
    re: /(!{2,}|\b(?:hurry|buy now|lowest price ever|last chance)\b)/i,
    label: "Pushy tone",
    why: "Shouty, pushy lines sell price, not joy. Eat Better’s tone is warm and friendly (Chapter 2.1 tone tuner).",
    fix: "Invite, don’t shout: “Find your new favourite snack.”",
  },
];

/** Supported phrases: official claims and lines from the chapters. */
const SUPPORTED: { re: RegExp; label: string }[] = [
  { re: /sweetened with dates/i, label: "Sweetened with dates (official laddoo claim)" },
  { re: /no added sugar/i, label: "No added sugar (official claim on laddoos & nut mix)" },
  { re: /no refined sugar/i, label: "No refined sugar (Ch 2.3 USP)" },
  { re: /no palm oil/i, label: "No palm oil (official claim)" },
  { re: /roasted,? not fried/i, label: "Roasted not fried (official millet claim)" },
  { re: /baked,? not fried/i, label: "Baked not fried (official chips claim)" },
  { re: /no trans fat/i, label: "No trans fat (official millet claim)" },
  { re: /\bmillets?\b/i, label: "Made with millets" },
  { re: /dry fruits/i, label: "Rich in dry fruits & nuts (official laddoo claim)" },
  { re: /familiar|grew up|nostalgi/i, label: "Familiar Taste (Eat Better value)" },
  { re: /eat what you love/i, label: "“Eat what you love” (official line)" },
  { re: /joy of snacking/i, label: "The tagline" },
  { re: /quality check/i, label: "6-layer quality check (official fact)" },
  { re: /no preservatives/i, label: "No preservatives (official nut-mix claim)" },
];

export function checkClaims(text: string): { flags: ClaimFlag[]; supported: string[] } {
  const flags: ClaimFlag[] = [];
  for (const r of RULES) {
    const m = text.match(r.re);
    if (m) flags.push({ id: r.id, severity: r.severity, match: m[0], label: r.label, why: r.why, fix: r.fix });
  }
  const supported = SUPPORTED.filter((s) => s.re.test(text)).map((s) => s.label);
  return { flags, supported };
}

export const blocks = (text: string) => checkClaims(text).flags.filter((f) => f.severity === "block");
export const wordCount = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
