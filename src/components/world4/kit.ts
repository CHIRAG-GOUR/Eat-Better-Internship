import * as THREE from "three";
import { canvasTexture, drawText } from "@/components/world3/kit";

/**
 * Shared resources for the Module 4 world ("Bazaar to Boardroom"): official pack-front textures (cropped to
 * the pack), generic category pack art for other players (no logos), a pillow-pouch geometry, a soft glow
 * sprite and a lit-window texture. Materials come from the Module 3 cache (`mat`), so they are shared
 * across the whole site and never disposed. 1 unit = 1 metre.
 */

export { mat, canvasTexture, drawText, fontFamily, rng, clamp, ss, along, angleDelta, star } from "@/components/world3/kit";

/* ── official Eat Better pack fronts ────────────────────────────── */

export type PackKind = "chips" | "bar" | "value" | "pouch" | "nuts" | "box";
export type PackDef = { id: string; src: string; kind: PackKind; crop: [number, number, number, number]; side: string; label: string };

/** Pack size (w, h, d) in metres for each kind. */
export const PACK_SIZE: Record<PackKind, [number, number, number]> = {
  chips: [0.22, 0.3, 0.07],
  bar: [0.09, 0.21, 0.035],
  value: [0.16, 0.24, 0.06],
  pouch: [0.18, 0.27, 0.07],
  nuts: [0.16, 0.25, 0.065],
  box: [0.36, 0.42, 0.12],
};

const L = "/brand/library";
// crop = [u0, v0, u1, v1] of the photo (top-left origin) that holds the pack face
export const PACKS: PackDef[] = [
  { id: "ragi-achari", src: `${L}/chips-puffs/ragi-chips-achari-masti-front.webp`, kind: "chips", crop: [0.3, 0.07, 0.91, 0.93], side: "#2E7D32", label: "Ragi Chips, Achari Masti" },
  { id: "ragi-thai", src: `${L}/chips-puffs/ragi-chips-thai-chilli-tadka-front.webp`, kind: "chips", crop: [0.3, 0.07, 0.91, 0.93], side: "#C62828", label: "Ragi Chips, Thai Chilli Tadka" },
  { id: "protein-pizza", src: `${L}/chips-puffs/protein-chips-pizza-party-front.webp`, kind: "chips", crop: [0.29, 0.06, 0.91, 0.93], side: "#C62828", label: "Protein Chips, Pizza Party" },
  { id: "chickpea-imli", src: `${L}/chips-puffs/chickpea-puffs-imli-twist-front.webp`, kind: "chips", crop: [0.27, 0.05, 0.93, 0.93], side: "#9E1B1B", label: "Chickpea Puffs, Imli Twist" },
  { id: "chickpea-lime", src: `${L}/chips-puffs/chickpea-puffs-lime-sriracha-front.webp`, kind: "chips", crop: [0.27, 0.05, 0.93, 0.93], side: "#2E7D32", label: "Chickpea Puffs, Lime Sriracha" },
  { id: "orange-ginger", src: `${L}/laddoos/orange-ginger-laddoos-front.webp`, kind: "bar", crop: [0.31, 0.06, 0.69, 0.91], side: "#F2B705", label: "Orange Ginger Laddoos" },
  { id: "coffee-almond", src: `${L}/laddoos/coffee-almond-laddoos-front.webp`, kind: "bar", crop: [0.31, 0.06, 0.69, 0.91], side: "#EDE3D2", label: "Coffee Almond Laddoos" },
  { id: "vanilla-choc", src: `${L}/laddoos/vanilla-chocolate-laddoos-front.webp`, kind: "bar", crop: [0.31, 0.06, 0.69, 0.91], side: "#E2457A", label: "Vanilla Chocolate Laddoos" },
  { id: "protein-fudge", src: `${L}/laddoos/protein-laddoos-chocolate-fudge-front.webp`, kind: "bar", crop: [0.31, 0.06, 0.69, 0.91], side: "#5B3A28", label: "Protein Laddoos, Chocolate Fudge" },
  { id: "hazelnut-vp", src: `${L}/laddoos/hazelnut-chocolate-laddoos-value-pack-front.webp`, kind: "value", crop: [0.24, 0.09, 0.76, 0.93], side: "#C9A36B", label: "Hazelnut Chocolate Laddoos, value pack" },
  { id: "orange-choc-vp", src: `${L}/laddoos/orange-chocolate-laddoos-value-pack-front.webp`, kind: "value", crop: [0.24, 0.09, 0.76, 0.93], side: "#E8742A", label: "Orange Chocolate Laddoos, value pack" },
  { id: "peanut-vp", src: `${L}/laddoos/peanut-chocolate-laddoos-value-pack-front.webp`, kind: "value", crop: [0.24, 0.09, 0.76, 0.93], side: "#D9B25C", label: "Peanut Chocolate Laddoos, value pack" },
  { id: "desi-masala", src: `${L}/namkeen/millet-namkeen-desi-masala-front.webp`, kind: "pouch", crop: [0.24, 0.02, 0.82, 0.94], side: "#D9773E", label: "Millet Namkeen, Desi Masala" },
  { id: "mango-achari", src: `${L}/namkeen/millet-namkeen-mango-achaari-front.webp`, kind: "pouch", crop: [0.24, 0.02, 0.82, 0.94], side: "#9CC24A", label: "Millet Namkeen, Mango Achaari" },
  { id: "bhujia-pudina", src: `${L}/namkeen/millet-bhujia-pudina-masti-front.webp`, kind: "pouch", crop: [0.24, 0.02, 0.82, 0.94], side: "#B4CF3A", label: "Millet Bhujia, Pudina Masti" },
  { id: "protein-bhujia", src: `${L}/namkeen/protein-bhujia-chilli-lime-front.webp`, kind: "pouch", crop: [0.24, 0.02, 0.82, 0.94], side: "#F2C21B", label: "Protein Bhujia, Chilli Lime" },
  { id: "bhel-bombay", src: `${L}/namkeen/millet-bhel-bombay-bhelpuri-front.webp`, kind: "pouch", crop: [0.24, 0.02, 0.8, 0.94], side: "#9CC24A", label: "Millet Bhel, Bombay Bhelpuri" },
  { id: "quinoa", src: `${L}/namkeen/quinoa-namkeen-chilli-lime-front.webp`, kind: "pouch", crop: [0.24, 0.02, 0.8, 0.94], side: "#D23A4E", label: "Quinoa Namkeen, Chilli Lime" },
  { id: "nut-mix", src: `${L}/nuts-seeds/premium-nut-mix-front.webp`, kind: "nuts", crop: [0.22, 0.03, 0.79, 0.98], side: "#2F3A6B", label: "Premium Nut Mix" },
  { id: "trail-mix", src: `${L}/nuts-seeds/better-trail-mix-front.webp`, kind: "nuts", crop: [0.24, 0.03, 0.78, 0.98], side: "#E8742A", label: "Better Trail Mix" },
  { id: "seed-jaggery", src: `${L}/nuts-seeds/seed-mix-spiced-jaggery-front.webp`, kind: "nuts", crop: [0.24, 0.03, 0.78, 0.98], side: "#6B8E3A", label: "Seed Mix, Spiced Jaggery" },
  { id: "sweet-nut", src: `${L}/nuts-seeds/sweet-crunchy-nut-mix-front.webp`, kind: "nuts", crop: [0.24, 0.03, 0.78, 0.98], side: "#F2C21B", label: "Sweet Crunchy Nut Mix" },
];
export const PACK = Object.fromEntries(PACKS.map((p) => [p.id, p])) as Record<string, PackDef>;

/** The four SKUs from the 4.1 pricing table (official box art where it exists). */
export const SKUS = [
  { id: "box24", name: "Assorted Laddoo Box", sub: "24 laddoos", g: 240, price: 349, ppg: "~₹1.45 / g", src: `${L}/combos/assorted-laddoo-box-24-hero.webp`, crop: [0.29, 0.15, 0.71, 0.86] as [number, number, number, number], side: "#D9542B" },
  { id: "box42", name: "Assorted Laddoo Box", sub: "42 laddoos", g: 420, price: 649, ppg: "~₹1.55 / g", src: `${L}/combos/assorted-laddoo-box-42-hero.webp`, crop: [0.29, 0.15, 0.71, 0.86] as [number, number, number, number], side: "#D9542B" },
  { id: "usb", name: "Ultimate Snack Box", sub: "12 packs", g: 660, price: 749, ppg: "~₹1.13 / g", src: `${L}/combos/ultimate-snack-box-hero.webp`, crop: [0.23, 0.37, 0.72, 0.86] as [number, number, number, number], side: "#E05A2C" },
  { id: "combo", name: "Assorted Namkeen Combo", sub: "4 packs", g: 400, price: 269, ppg: "~₹0.67 / g", src: "", crop: [0, 0, 1, 1] as [number, number, number, number], side: "#D9773E" },
] as const;

/* ── texture loading (no Suspense; one cached texture per url + crop) ── */

const TEX = new Map<string, THREE.Texture>();
/** Loads an image as a cropped sRGB texture. Returns immediately; the image fills in when it arrives. Cached for the session. */
export function photoTex(src: string, crop: [number, number, number, number] = [0, 0, 1, 1]) {
  const k = `${src}|${crop.join(",")}`;
  let t = TEX.get(k);
  if (!t) {
    t = new THREE.TextureLoader().load(src);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    const [u0, v0, u1, v1] = crop;
    t.repeat.set(u1 - u0, v1 - v0);
    t.offset.set(u0, 1 - v1);
    TEX.set(k, t);
  }
  return t;
}

const MM = new Map<string, THREE.Material[]>();
/** [side, side, top, bottom, front, back] materials for a pack box (BoxGeometry face order). Cached. */
export function packMaterials(def: { src: string; crop: [number, number, number, number]; side: string }, front?: THREE.Texture) {
  const k = `${def.src}|${def.crop.join(",")}|${def.side}`;
  let m = MM.get(k);
  if (!m) {
    const side = new THREE.MeshStandardMaterial({ color: def.side, roughness: 0.55 });
    const face = new THREE.MeshStandardMaterial({ map: front ?? photoTex(def.src, def.crop), roughness: 0.42, emissive: "#FFFFFF", emissiveIntensity: 0.06 });
    if (face.map) face.emissiveMap = face.map;
    m = [side, side, side, side, face, side];
    MM.set(k, m);
  }
  return m;
}

/* ── generic category packs (other players: category name only, no brand) ── */

export type GenericDef = { id: string; word: string; sub: string; bg: string; band: string; fg: string; kind: PackKind; dots: string };
export const GENERIC: Record<string, GenericDef> = {
  bhujia: { id: "bhujia", word: "BHUJIA", sub: "TRADITIONAL", bg: "#E53A22", band: "#FFD23F", fg: "#FFFFFF", kind: "pouch", dots: "#E8A33C" },
  sev: { id: "sev", word: "SEV", sub: "CLASSIC", bg: "#F6B21B", band: "#C2261B", fg: "#7A1410", kind: "pouch", dots: "#D9932A" },
  mixture: { id: "mixture", word: "MIXTURE", sub: "NAMKEEN", bg: "#1F5AA6", band: "#FFD23F", fg: "#FFFFFF", kind: "chips", dots: "#E0A247" },
  chips: { id: "chips", word: "POTATO CHIPS", sub: "CLASSIC SALTED", bg: "#FFC928", band: "#1F5AA6", fg: "#1F2A55", kind: "chips", dots: "#F2D27A" },
  mithai: { id: "mithai", word: "SOAN PAPDI", sub: "FRIED MITHAI", bg: "#B3122E", band: "#F2C14E", fg: "#FFF3D6", kind: "box", dots: "#F2D7A0" },
  dryfruit: { id: "dryfruit", word: "DRY FRUITS", sub: "FLAVOURED", bg: "#3E2A1E", band: "#C9A36B", fg: "#F4E7D2", kind: "nuts", dots: "#C98F52" },
  seeds: { id: "seeds", word: "SEED MIX", sub: "ROASTED", bg: "#E9E1CF", band: "#3E7A3A", fg: "#25462A", kind: "nuts", dots: "#7B6A4A" },
  roasted: { id: "roasted", word: "ROASTED SNACK", sub: "LIGHTLY SEASONED", bg: "#2F6B4F", band: "#F1E3B0", fg: "#FFFFFF", kind: "pouch", dots: "#D7B46A" },
  makhana: { id: "makhana", word: "OAT CLUSTERS", sub: "HIGH PROTEIN", bg: "#F4F0E8", band: "#D35400", fg: "#3A2A20", kind: "nuts", dots: "#E8D9B5" },
  laddoo: { id: "laddoo", word: "LADDOO", sub: "SWEET SHOP", bg: "#F7E4C0", band: "#B3122E", fg: "#7A1410", kind: "box", dots: "#E0A247" },
  barfi: { id: "barfi", word: "KAJU BARFI", sub: "SWEET SHOP", bg: "#FFF6E3", band: "#C8961E", fg: "#6A4A12", kind: "box", dots: "#E6DCC8" },
};

const GT = new Map<string, THREE.Texture>();
/** Pack-front art for a generic category pack. Cached. */
export function genericTex(d: GenericDef) {
  let t = GT.get(d.id);
  if (!t) {
    t = canvasTexture(256, 384, (g) => {
      g.fillStyle = d.bg;
      g.fillRect(0, 0, 256, 384);
      // diagonal band + a product "window"
      g.fillStyle = d.band;
      g.beginPath();
      g.moveTo(0, 250);
      g.lineTo(256, 205);
      g.lineTo(256, 262);
      g.lineTo(0, 307);
      g.closePath();
      g.fill();
      g.fillStyle = "rgba(255,255,255,0.88)";
      g.beginPath();
      g.ellipse(128, 300, 82, 52, 0, 0, Math.PI * 2);
      g.fill();
      g.fillStyle = d.dots;
      for (let i = 0; i < 38; i++) {
        const a = (i * 2.399) % (Math.PI * 2);
        const r = Math.sqrt(i / 38) * 62;
        g.beginPath();
        g.arc(128 + Math.cos(a) * r * 1.25, 302 + Math.sin(a) * r * 0.66, 7, 0, Math.PI * 2);
        g.fill();
      }
      drawText(g, [d.sub], 128, 48, 220, 30, d.fg, 700);
      drawText(g, d.word.split(" "), 128, 140, 226, 150, d.fg, 900);
      g.strokeStyle = "rgba(0,0,0,0.18)";
      g.lineWidth = 6;
      g.strokeRect(3, 3, 250, 378);
    });
    GT.set(d.id, t);
  }
  return t;
}
export function genericMaterials(d: GenericDef) {
  const k = `generic|${d.id}`;
  let m = MM.get(k);
  if (!m) {
    const side = new THREE.MeshStandardMaterial({ color: d.bg, roughness: 0.5 });
    const face = new THREE.MeshStandardMaterial({ map: genericTex(d), roughness: 0.42, emissive: "#FFFFFF", emissiveIntensity: 0.05 });
    face.emissiveMap = face.map;
    m = [side, side, side, side, face, side];
    MM.set(k, m);
  }
  return m;
}

/* ── geometry ───────────────────────────────────────────────────── */

let POUCH: THREE.BufferGeometry | null = null;
/** Unit pillow pouch (1 × 1 × 1, centred, front = +z): bulged faces, crimped flat top seal. Scale per pack. */
export function pouchGeo() {
  if (POUCH) return POUCH;
  const g = new THREE.BoxGeometry(1, 1, 1, 6, 10, 1);
  const p = g.attributes.position;
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i);
    const y = p.getY(i);
    const z = p.getZ(i);
    const bulge = 1 + 0.45 * (1 - (2 * x) ** 2) * (1 - (2 * y) ** 4);
    const seal = y > 0.36 ? 1 - ((y - 0.36) / 0.14) * 0.85 : y < -0.42 ? 1 - ((-0.42 - y) / 0.08) * 0.35 : 1;
    p.setZ(i, z * 0.6 * bulge * Math.max(0.12, seal));
  }
  g.computeVertexNormals();
  POUCH = g;
  return g;
}
let BOX: THREE.BoxGeometry | null = null;
export const boxGeo = () => (BOX ??= new THREE.BoxGeometry(1, 1, 1));

/* ── sprites + window textures ──────────────────────────────────── */

let GLOW: THREE.Texture | null = null;
/** Soft round glow (additive sprites fake bloom without post-processing). */
export function glowTex() {
  if (GLOW) return GLOW;
  GLOW = canvasTexture(128, 128, (g) => {
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, "rgba(255,255,255,1)");
    grd.addColorStop(0.25, "rgba(255,255,255,0.55)");
    grd.addColorStop(0.6, "rgba(255,255,255,0.12)");
    grd.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
  });
  return GLOW;
}
const GLOWM = new Map<string, THREE.SpriteMaterial>();
export function glowMat(color: string, opacity = 0.8) {
  const k = `${color}|${opacity}`;
  let m = GLOWM.get(k);
  if (!m) {
    m = new THREE.SpriteMaterial({ map: glowTex(), color, transparent: true, opacity, blending: THREE.AdditiveBlending, depthWrite: false, fog: false });
    GLOWM.set(k, m);
  }
  return m;
}

const WIN = new Map<string, THREE.Texture>();
/** Office-tower facade: a grid of windows, some lit. `lit` 0..1, colours for glass/frame/light. */
export function windowTex(key: string, glass: string, frame: string, light: string, lit: number, cols = 8, rows = 16) {
  let t = WIN.get(key);
  if (!t) {
    let s = 7;
    const r = () => (s = (s * 16807) % 2147483647) / 2147483647;
    t = canvasTexture(256, 512, (g) => {
      g.fillStyle = frame;
      g.fillRect(0, 0, 256, 512);
      const cw = 256 / cols;
      const rh = 512 / rows;
      for (let j = 0; j < rows; j++)
        for (let i = 0; i < cols; i++) {
          g.fillStyle = r() < lit ? light : glass;
          g.fillRect(i * cw + 3, j * rh + 4, cw - 6, rh - 8);
        }
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    WIN.set(key, t);
  }
  return t;
}

/** Map tower / sign colours. */
export const C = {
  orange: "#FF5C00",
  yellow: "#FED300",
  cocoa: "#2F1C1A",
  cream: "#FFF5EE",
  green: "#2E9E5B",
  teal: "#19B6C9",
  navy: "#0E1A3A",
};

/** Price-panel texture: several lines with sizes (big numbers). */
export function panelTex(lines: { t: string; size: number; color?: string; weight?: number }[], bg: string, fg: string, w = 512, h = 512, border?: string) {
  return canvasTexture(w, h, (g) => {
    g.fillStyle = bg;
    g.fillRect(0, 0, w, h);
    if (border) {
      g.strokeStyle = border;
      g.lineWidth = w * 0.02;
      g.strokeRect(w * 0.02, w * 0.02, w - w * 0.04, h - w * 0.04);
    }
    const total = lines.reduce((a, l) => a + l.size * 1.18, 0);
    let y = (h - total) / 2;
    for (const l of lines) {
      const lh = l.size * 1.18;
      drawText(g, [l.t], w / 2, y + lh / 2, w * 0.88, l.size, l.color ?? fg, l.weight ?? 800);
      y += lh;
    }
  });
}
