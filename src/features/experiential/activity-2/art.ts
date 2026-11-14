"use client";

import { CAT, FONTS, ING_NAMES, PALETTE, POST_IMAGES, STORY, num, swatchOf, type FontId } from "./data";
import { drawIcon } from "./icons";
import type { PackDesign, PostDesign } from "./store";
import { CTA, pct, type Metrics } from "./ads";

/**
 * Canvas renderers for everything the student makes: the pack front (used as the live 3D texture and in the
 * mockup PNG), the back panel, the packaging mockup PNG, the 1080×1080 Instagram creative, and the studio screens
 * (campaign dashboard, mood board). All are drawn only from the student's own inputs; every output is labelled
 * as student-created / simulated.
 */

/* ── assets ─────────────────────────────────────────────────────────────────────────────────────────── */

const imgCache = new Map<string, Promise<HTMLImageElement>>();
export function loadImg(src: string) {
  let p = imgCache.get(src);
  if (!p) {
    p = new Promise((res, rej) => {
      const i = new Image();
      i.crossOrigin = "anonymous";
      i.onload = () => res(i);
      i.onerror = () => rej(new Error(`Could not load ${src}`));
      i.src = src;
    });
    imgCache.set(src, p);
  }
  return p;
}

export type Assets = { logo: HTMLImageElement; photos: Record<string, HTMLImageElement>; fonts: Record<FontId, string> };

let assetsP: Promise<Assets> | null = null;
export function loadAssets(): Promise<Assets> {
  if (!assetsP) {
    assetsP = (async () => {
      const css = getComputedStyle(document.documentElement);
      const fonts = Object.fromEntries(FONTS.map((f) => [f.id, `${(f.cssVar && css.getPropertyValue(f.cssVar).trim()) || ""}${f.cssVar && css.getPropertyValue(f.cssVar).trim() ? ", " : ""}${f.fallback}`])) as Record<FontId, string>;
      await Promise.all(
        Object.values(fonts).flatMap((fam) => [400, 600, 700, 800].map((w) => document.fonts.load(`${w} 40px ${fam}`).catch(() => undefined))),
      );
      const [logo, ...ph] = await Promise.all([loadImg("/brand/eat-better-logo.svg"), ...STORY.map((s) => loadImg(s.img))]);
      return { logo, photos: Object.fromEntries(STORY.map((s, i) => [s.id, ph[i]])), fonts };
    })();
    assetsP.catch(() => (assetsP = null));
  }
  return assetsP;
}

/* ── colour + text helpers ──────────────────────────────────────────────────────────────────────────── */

const COCOA = "#2F1C1A";
const CREAM = "#FFF5EE";
function lum(hex: string) {
  const h = hex.replace("#", "");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255).map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export const contrast = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
  return (x + 0.05) / (y + 0.05);
};
export const ink = (bg: string) => (contrast(bg, COCOA) >= contrast(bg, CREAM) ? COCOA : CREAM);
function shade(hex: string, amt: number) {
  const h = hex.replace("#", "");
  const c = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  const out = c.map((v) => Math.max(0, Math.min(255, Math.round(amt < 0 ? v * (1 + amt) : v + (255 - v) * amt))));
  return `#${out.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}

function wrapLines(g: CanvasRenderingContext2D, text: string, maxW: number) {
  const words = text.trim().split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (g.measureText(t).width > maxW && line) {
      lines.push(line);
      line = w;
    } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

/** Fit text into a box: biggest size ≤ max whose wrapped lines fit maxLines and width. */
function fitText(g: CanvasRenderingContext2D, text: string, font: (s: number) => string, maxW: number, maxSize: number, maxLines: number, minSize = 12) {
  let size = maxSize;
  for (; size > minSize; size -= 2) {
    g.font = font(size);
    const lines = wrapLines(g, text, maxW);
    if (lines.length <= maxLines && lines.every((l) => g.measureText(l).width <= maxW)) return { size, lines };
  }
  g.font = font(minSize);
  return { size: minSize, lines: wrapLines(g, text, maxW).slice(0, maxLines) };
}

function rr(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  g.beginPath();
  g.roundRect(x, y, w, h, r);
}

/** The Eat Better logo, recoloured to suit the background. */
function drawLogo(g: CanvasRenderingContext2D, a: Assets, cx: number, y: number, w: number, color: string) {
  const h = (w * 40) / 83;
  const c = document.createElement("canvas");
  c.width = Math.ceil(w * 2);
  c.height = Math.ceil(h * 2);
  const k = c.getContext("2d")!;
  k.drawImage(a.logo, 0, 0, c.width, c.height);
  k.globalCompositeOperation = "source-in";
  k.fillStyle = color;
  k.fillRect(0, 0, c.width, c.height);
  g.drawImage(c, cx - w / 2, y, w, h);
  return h;
}

function vegMark(g: CanvasRenderingContext2D, x: number, y: number, s: number) {
  g.fillStyle = "#FFFFFF";
  g.fillRect(x, y, s, s);
  g.strokeStyle = "#1B8E3E";
  g.lineWidth = s * 0.1;
  g.strokeRect(x + s * 0.08, y + s * 0.08, s * 0.84, s * 0.84);
  g.fillStyle = "#1B8E3E";
  g.beginPath();
  g.arc(x + s / 2, y + s / 2, s * 0.24, 0, Math.PI * 2);
  g.fill();
}

/* ── product art (drawn, so the student's pack never reuses an official product photo) ─────────────── */

function rand(seed: number) {
  let s = seed;
  return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646;
}

function laddoo(g: CanvasRenderingContext2D, x: number, y: number, r: number, base: string, seed: number) {
  const grd = g.createRadialGradient(x - r * 0.35, y - r * 0.4, r * 0.1, x, y, r);
  grd.addColorStop(0, shade(base, 0.35));
  grd.addColorStop(0.6, base);
  grd.addColorStop(1, shade(base, -0.45));
  g.fillStyle = grd;
  g.beginPath();
  g.arc(x, y, r, 0, Math.PI * 2);
  g.fill();
  const R = rand(seed);
  for (let i = 0; i < 26; i++) {
    const a = R() * Math.PI * 2;
    const d = Math.sqrt(R()) * r * 0.85;
    g.fillStyle = i % 3 === 0 ? "#E9CB98" : i % 3 === 1 ? shade(base, -0.5) : "#D2A469";
    g.beginPath();
    g.ellipse(x + Math.cos(a) * d, y + Math.sin(a) * d, r * (0.05 + R() * 0.06), r * (0.03 + R() * 0.04), R() * 3, 0, Math.PI * 2);
    g.fill();
  }
}

function bowl(g: CanvasRenderingContext2D, x: number, y: number, w: number, fill: (g: CanvasRenderingContext2D, x: number, y: number, w: number) => void) {
  const h = w * 0.42;
  fill(g, x, y - h * 0.05, w * 0.92);
  const grd = g.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
  grd.addColorStop(0, "#D9CFC2");
  grd.addColorStop(0.45, "#F6F1EA");
  grd.addColorStop(1, "#BFB3A4");
  g.fillStyle = grd;
  g.beginPath();
  g.moveTo(x - w / 2, y);
  g.bezierCurveTo(x - w / 2, y + h * 1.1, x + w / 2, y + h * 1.1, x + w / 2, y);
  g.ellipse(x, y, w / 2, h * 0.16, 0, 0, Math.PI, false);
  g.fill();
  g.strokeStyle = "rgba(0,0,0,0.12)";
  g.lineWidth = w * 0.01;
  g.stroke();
}

function bhujia(g: CanvasRenderingContext2D, x: number, y: number, w: number, seed: number) {
  const R = rand(seed);
  g.lineCap = "round";
  for (let i = 0; i < 220; i++) {
    const t = R();
    const px = x + (R() - 0.5) * w * 0.95;
    const top = y - Math.sqrt(Math.max(0, 1 - ((px - x) / (w * 0.5)) ** 2)) * w * 0.32;
    const py = top + R() * (y - top);
    g.strokeStyle = t < 0.5 ? "#E3A43A" : t < 0.8 ? "#C98522" : "#F2C25E";
    g.lineWidth = w * 0.012;
    g.beginPath();
    g.moveTo(px, py);
    g.quadraticCurveTo(px + (R() - 0.5) * w * 0.12, py + (R() - 0.5) * w * 0.08, px + (R() - 0.5) * w * 0.18, py + (R() - 0.5) * w * 0.06);
    g.stroke();
  }
}

function nutHeap(g: CanvasRenderingContext2D, x: number, y: number, w: number, ids: string[], seed: number) {
  const R = rand(seed);
  const pool = ids.length ? ids : ["almond", "cashew", "pistachio", "raisin"];
  const pts: [number, number, number][] = [];
  for (let i = 0; i < 34; i++) {
    const px = (R() - 0.5) * w;
    const lim = Math.sqrt(Math.max(0, 1 - (px / (w * 0.5)) ** 2));
    pts.push([px, -R() * lim * w * 0.38, i]);
  }
  pts.sort((a, b) => a[1] - b[1]);
  for (const [px, py, i] of pts) {
    const s = w * (0.17 + R() * 0.06);
    g.save();
    g.translate(x + px, y + py);
    g.rotate((R() - 0.5) * 2.4);
    drawIcon(g, pool[i % pool.length], -s / 2, -s / 2, s);
    g.restore();
  }
}

function productArt(g: CanvasRenderingContext2D, p: PackDesign, cx: number, cy: number, w: number) {
  const ing = p.ingredients;
  const dark = ing.includes("cocoa") || ing.includes("coffee") ? "#4A2616" : ing.includes("orange") ? "#8A4A22" : "#6B3A22";
  g.save();
  // soft shadow plate
  g.fillStyle = "rgba(0,0,0,0.14)";
  g.beginPath();
  g.ellipse(cx, cy + w * 0.3, w * 0.42, w * 0.07, 0, 0, Math.PI * 2);
  g.fill();
  if (p.category === "laddoos") {
    laddoo(g, cx - w * 0.24, cy + w * 0.02, w * 0.2, shade(dark, 0.1), 3);
    laddoo(g, cx + w * 0.24, cy + w * 0.04, w * 0.19, dark, 5);
    laddoo(g, cx, cy + w * 0.1, w * 0.26, dark, 7);
  } else if (p.category === "namkeen") {
    bowl(g, cx, cy + w * 0.02, w * 0.92, (k, x, y, ww) => bhujia(k, x, y, ww, 11));
  } else if (p.category === "nuts") {
    bowl(g, cx, cy + w * 0.06, w * 0.92, (k, x, y, ww) => nutHeap(k, x, y, ww, ing.filter((i) => ["almond", "cashew", "pistachio", "raisin", "hazelnut", "seeds"].includes(i)), 13));
  } else {
    bowl(g, cx + w * 0.16, cy + w * 0.06, w * 0.62, (k, x, y, ww) => nutHeap(k, x, y, ww, ["almond", "cashew", "pistachio"], 17));
    laddoo(g, cx - w * 0.3, cy + w * 0.12, w * 0.15, dark, 19);
    laddoo(g, cx - w * 0.12, cy + w * 0.18, w * 0.13, shade(dark, 0.12), 23);
  }
  g.restore();
}

/* ── pack front ─────────────────────────────────────────────────────────────────────────────────────── */

export const PACK_SIZE = { sachet: { w: 500, h: 1200 }, pouch: { w: 800, h: 1040 }, box: { w: 960, h: 820 } } as const;

export function packFormat(p: PackDesign) {
  return p.category ? CAT[p.category].format : "pouch";
}

export function drawPackFront(p: PackDesign, a: Assets, scale = 1): HTMLCanvasElement {
  const fmt = packFormat(p);
  const { w: W0, h: H0 } = PACK_SIZE[fmt];
  const c = document.createElement("canvas");
  c.width = Math.round(W0 * scale);
  c.height = Math.round(H0 * scale);
  const g = c.getContext("2d")!;
  g.scale(scale, scale);
  const W = W0;
  const H = H0;
  const fam = a.fonts[p.font];
  const F = (w: number) => (s: number) => `${w} ${s}px ${fam}`;
  const seal = fmt === "box" ? 0 : H * 0.045;
  const top = seal + (fmt === "box" ? H * 0.03 : H * 0.01);
  const bottomSeal = fmt === "sachet" ? H * 0.045 : 0;
  const pad = W * 0.08;

  const bandY = p.layout === "band" ? H * 0.56 : p.layout === "classic" ? H * 0.8 : H * 0.84;
  // base colours
  g.fillStyle = p.primary;
  g.fillRect(0, 0, W, H);
  g.fillStyle = p.secondary;
  if (p.layout === "namefirst") {
    // a secondary-coloured arch behind the product
    g.beginPath();
    g.ellipse(W / 2, H * 0.9, W * 0.62, H * 0.42, 0, Math.PI, 0);
    g.fill();
    g.fillRect(0, H * 0.9, W, H * 0.1);
  } else {
    g.beginPath();
    g.moveTo(0, bandY);
    g.bezierCurveTo(W * 0.3, bandY - H * 0.025, W * 0.7, bandY + H * 0.025, W, bandY);
    g.lineTo(W, H);
    g.lineTo(0, H);
    g.fill();
  }

  // subtle decorative ingredient pattern on the primary area
  g.save();
  g.globalAlpha = 0.08;
  const R = rand(29);
  for (let i = 0; i < 9; i++) drawIcon(g, p.ingredients[i % Math.max(1, p.ingredients.length)] ?? "almond", R() * W * 0.9, top + R() * (bandY - top) * 0.9, W * 0.12);
  g.restore();

  const inkP = ink(p.primary);
  const inkS = ink(p.secondary);
  const inkA = ink(p.accent);

  // top line (first claim) like the official "RICH IN DRY FRUITS & NUTS"
  let y = top + H * 0.035;
  g.textAlign = "center";
  g.textBaseline = "alphabetic";
  if (p.claims[0]) {
    g.fillStyle = inkP;
    g.font = F(700)(W * (fmt === "sachet" ? 0.05 : 0.036));
    g.fillText(`— ${p.claims[0].toUpperCase()} —`, W / 2, y, W - pad * 2);
  }
  y += H * 0.03;
  const logoW = W * (fmt === "sachet" ? 0.62 : fmt === "box" ? 0.3 : 0.4);
  y += drawLogo(g, a, W / 2, y, logoW, inkP === COCOA ? "#603A38" : CREAM) + H * 0.02;

  const nameText = (p.name.trim() || "Your product name").toUpperCase();
  const drawName = (yy: number, maxH: number, color: string, accentColor: string) => {
    const lines = fmt === "sachet" ? 3 : 2;
    const fit = fitText(g, nameText, F(800), W - pad * 2 - (fmt === "sachet" ? 0 : W * 0.06), Math.min(maxH / lines, W * (fmt === "sachet" ? 0.13 : 0.12)), lines, 18);
    g.font = F(800)(fit.size);
    g.fillStyle = color;
    fit.lines.forEach((l, i) => g.fillText(l, W / 2, yy + fit.size * 0.92 * (i + 1), W - pad * 2));
    let yEnd = yy + fit.size * 0.92 * fit.lines.length + fit.size * 0.15;
    const vw = Math.min(g.measureText(fit.lines[fit.lines.length - 1]).width, W - pad * 2);
    vegMark(g, Math.min(W - pad * 0.9, W / 2 + vw / 2 + W * 0.02), yEnd - fit.size * 0.9, Math.max(14, W * 0.04));
    if (p.variant.trim()) {
      g.font = F(700)(Math.min(fit.size * 0.48, W * 0.06));
      g.fillStyle = accentColor;
      yEnd += fit.size * 0.5;
      g.fillText(p.variant.trim().toUpperCase(), W / 2, yEnd, W - pad * 2);
      yEnd += fit.size * 0.12;
    }
    return yEnd;
  };
  const accentOn = (bg: string) => (contrast(p.accent, bg) >= 2.2 ? p.accent : ink(bg));

  const imageZone = (zy: number, zh: number) => {
    const w = Math.min(W * 0.8, zh * 1.25) * p.imgScale;
    productArt(g, p, W / 2 + p.imgX * W * 0.2, zy + zh * 0.5 + p.imgY * zh * 0.18, w);
  };

  const claimStrip = (yy: number, bg: string) => {
    const rest = p.claims.slice(1);
    if (!rest.length) return yy;
    g.font = F(800)(W * (fmt === "sachet" ? 0.045 : 0.032));
    const text = rest.map((c) => c.toUpperCase()).join("  |  ");
    const tw = Math.min(g.measureText(text).width, W - pad * 2) + W * 0.06;
    const sh = W * (fmt === "sachet" ? 0.075 : 0.055);
    g.fillStyle = p.accent;
    rr(g, W / 2 - tw / 2, yy, tw, sh, sh * 0.2);
    g.fill();
    g.fillStyle = inkA;
    g.fillText(text, W / 2, yy + sh * 0.7, W - pad * 2 - W * 0.04);
    void bg;
    return yy + sh + H * 0.015;
  };

  const ingredientsRow = (yy: number, color: string, room: number) => {
    const ids = p.ingredients.slice(0, 4);
    if (!ids.length) return yy;
    const n = ids.length;
    const s = Math.min(W * (fmt === "sachet" ? 0.15 : 0.085), room * 0.62);
    const gap = (W - pad * 2) / n;
    g.font = F(700)(Math.max(11, s * 0.28));
    ids.forEach((id, i) => {
      const cx = pad + gap * (i + 0.5);
      g.fillStyle = "rgba(255,255,255,0.85)";
      g.beginPath();
      g.arc(cx, yy + s / 2, s * 0.58, 0, Math.PI * 2);
      g.fill();
      drawIcon(g, id, cx - s * 0.42, yy + s * 0.08, s * 0.84);
      g.fillStyle = color;
      g.fillText(ING_NAMES[id].replace(/ \(.+\)/, ""), cx, yy + s * 1.42, gap - 4);
    });
    return yy + s * 1.6;
  };

  const description = (yy: number, color: string, maxLines: number) => {
    if (!p.description.trim()) return yy;
    const fs = W * (fmt === "sachet" ? 0.042 : 0.03);
    g.font = F(600)(fs);
    g.fillStyle = color;
    const lines = wrapLines(g, p.description.trim(), W - pad * 2).slice(0, maxLines);
    lines.forEach((l, i) => g.fillText(l, W / 2, yy + fs * 1.25 * (i + 1)));
    return yy + fs * 1.25 * lines.length + fs * 0.5;
  };

  if (p.layout === "band") {
    imageZone(y, bandY - y + H * 0.04);
    let yy = drawName(bandY + H * 0.015, H * 0.16, inkS, accentOn(p.secondary));
    yy = claimStrip(yy + H * 0.008, p.secondary);
    yy = ingredientsRow(yy + H * 0.005, inkS, H - bottomSeal - yy - H * 0.08);
    description(yy - H * 0.005, inkS, fmt === "sachet" ? 3 : 2);
  } else if (p.layout === "classic") {
    const zh = (bandY - y) * 0.55;
    imageZone(y, zh);
    drawName(y + zh, bandY - y - zh - H * 0.01, inkP, accentOn(p.primary));
    let yy = claimStrip(bandY + H * 0.02, p.secondary);
    yy = ingredientsRow(yy, inkS, H * 0.08);
    void yy;
    description(H - bottomSeal - H * 0.065 - (fmt === "sachet" ? H * 0.03 : 0), inkS, 1);
  } else {
    let yy = drawName(y - H * 0.005, H * 0.17, inkP, accentOn(p.primary));
    imageZone(yy, H * 0.84 - yy - H * 0.02);
    yy = H * 0.845;
    yy = claimStrip(yy, p.secondary);
    yy = ingredientsRow(yy, inkS, H * 0.06);
    description(Math.min(yy, H - bottomSeal - H * 0.05), inkS, 1);
  }

  // net quantity
  if (p.netQty) {
    g.font = F(700)(W * (fmt === "sachet" ? 0.036 : 0.026));
    g.textAlign = "left";
    g.fillStyle = p.layout === "namefirst" || p.layout === "classic" || p.layout === "band" ? inkS : inkP;
    g.fillText(`Net wt. ${p.netQty}`, pad * 0.7, H - bottomSeal - H * 0.018);
  }
  // student-concept marker
  g.textAlign = "right";
  g.font = `700 ${Math.max(10, W * (fmt === "sachet" ? 0.026 : 0.018))}px Arial, sans-serif`;
  g.fillStyle = inkS === COCOA ? "rgba(47,28,26,0.75)" : "rgba(255,245,238,0.8)";
  g.fillText("STUDENT CONCEPT · NOT OFFICIAL PACKAGING", W - pad * 0.7, H - bottomSeal - H * 0.018);
  g.textAlign = "center";

  // crimped seals
  const crimp = (y0: number, h: number) => {
    g.fillStyle = "rgba(0,0,0,0.08)";
    g.fillRect(0, y0, W, h);
    g.strokeStyle = "rgba(0,0,0,0.12)";
    g.lineWidth = 2;
    for (let x = 4; x < W; x += 9) {
      g.beginPath();
      g.moveTo(x, y0 + 3);
      g.lineTo(x, y0 + h - 3);
      g.stroke();
    }
  };
  if (seal) crimp(0, seal);
  if (bottomSeal) crimp(H - bottomSeal, bottomSeal);
  if (fmt === "pouch") {
    // zip line
    g.strokeStyle = "rgba(0,0,0,0.1)";
    g.lineWidth = 3;
    g.beginPath();
    g.moveTo(W * 0.04, seal + H * 0.02);
    g.lineTo(W * 0.96, seal + H * 0.02);
    g.stroke();
  }
  return c;
}

/** The back panel: student text + clear labelling (used on the 3D pack). */
export function drawPackBack(p: PackDesign, a: Assets): HTMLCanvasElement {
  const fmt = packFormat(p);
  const { w: W, h: H } = PACK_SIZE[fmt];
  const c = document.createElement("canvas");
  c.width = W / 2;
  c.height = H / 2;
  const g = c.getContext("2d")!;
  g.scale(0.5, 0.5);
  g.fillStyle = p.secondary;
  g.fillRect(0, 0, W, H);
  const fg = ink(p.secondary);
  g.fillStyle = shade(p.secondary, fg === COCOA ? 0.5 : 0.12);
  rr(g, W * 0.08, H * 0.12, W * 0.84, H * 0.62, 24);
  g.fill();
  const fam = a.fonts[p.font];
  g.fillStyle = ink(shade(p.secondary, fg === COCOA ? 0.5 : 0.12));
  g.textAlign = "center";
  g.font = `800 ${W * 0.06}px ${fam}`;
  g.fillText((p.name || "Your product").toUpperCase(), W / 2, H * 0.2, W * 0.78);
  g.font = `600 ${W * 0.036}px ${fam}`;
  const lines = wrapLines(g, p.description || "", W * 0.74).slice(0, 5);
  lines.forEach((l, i) => g.fillText(l, W / 2, H * 0.28 + i * W * 0.05));
  g.font = `700 ${W * 0.034}px ${fam}`;
  g.fillText(p.ingredients.map((i) => ING_NAMES[i]).join(" · "), W / 2, H * 0.6, W * 0.78);
  g.fillStyle = fg;
  g.font = `700 ${W * 0.03}px Arial, sans-serif`;
  g.fillText("Student concept for the Eat Better Co × SkilliZee internship", W / 2, H * 0.84, W * 0.86);
  g.fillText("Not an official Eat Better pack", W / 2, H * 0.88, W * 0.86);
  return c;
}

/* ── pack as an object (pillow shading, shadow) for the mockup and posts ────────────────────────────── */

function packPath(g: CanvasRenderingContext2D, fmt: "sachet" | "pouch" | "box", x: number, y: number, w: number, h: number) {
  g.beginPath();
  if (fmt === "box") {
    g.roundRect(x, y, w, h, w * 0.012);
    return;
  }
  const r = w * 0.04;
  const pinch = fmt === "pouch" ? w * 0.012 : w * 0.02;
  g.moveTo(x + r, y);
  g.lineTo(x + w - r, y);
  g.quadraticCurveTo(x + w, y, x + w, y + r);
  g.quadraticCurveTo(x + w - pinch, y + h / 2, x + w, y + h - r);
  g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  g.lineTo(x + r, y + h);
  g.quadraticCurveTo(x, y + h, x, y + h - r);
  g.quadraticCurveTo(x + pinch, y + h / 2, x, y + r);
  g.quadraticCurveTo(x, y, x + r, y);
  g.closePath();
}

export function drawPackObject(g: CanvasRenderingContext2D, front: HTMLCanvasElement, fmt: "sachet" | "pouch" | "box", cx: number, baseY: number, h: number) {
  const w = (front.width / front.height) * h;
  const x = cx - w / 2;
  const y = baseY - h;
  // contact shadow
  g.save();
  const sg = g.createRadialGradient(cx, baseY, 0, cx, baseY, w * 0.75);
  sg.addColorStop(0, "rgba(0,0,0,0.38)");
  sg.addColorStop(1, "rgba(0,0,0,0)");
  g.fillStyle = sg;
  g.beginPath();
  g.ellipse(cx, baseY, w * 0.75, h * 0.05, 0, 0, Math.PI * 2);
  g.fill();
  g.restore();
  g.save();
  g.shadowColor = "rgba(0,0,0,0.3)";
  g.shadowBlur = h * 0.05;
  g.shadowOffsetX = h * 0.02;
  g.shadowOffsetY = h * 0.015;
  packPath(g, fmt, x, y, w, h);
  g.fillStyle = "#000";
  g.fill();
  g.restore();
  g.save();
  packPath(g, fmt, x, y, w, h);
  g.clip();
  g.drawImage(front, x, y, w, h);
  if (fmt === "box") {
    const lg = g.createLinearGradient(x, 0, x + w, 0);
    lg.addColorStop(0, "rgba(255,255,255,0.12)");
    lg.addColorStop(0.5, "rgba(255,255,255,0)");
    lg.addColorStop(1, "rgba(0,0,0,0.12)");
    g.fillStyle = lg;
    g.fillRect(x, y, w, h);
  } else {
    // pillow shading: lit from the upper left, rounding off to the seams
    const lg = g.createLinearGradient(x, 0, x + w, 0);
    lg.addColorStop(0, "rgba(0,0,0,0.28)");
    lg.addColorStop(0.1, "rgba(255,255,255,0.10)");
    lg.addColorStop(0.32, "rgba(255,255,255,0.16)");
    lg.addColorStop(0.55, "rgba(255,255,255,0)");
    lg.addColorStop(0.88, "rgba(0,0,0,0.12)");
    lg.addColorStop(1, "rgba(0,0,0,0.32)");
    g.fillStyle = lg;
    g.fillRect(x, y, w, h);
    const vg = g.createLinearGradient(0, y, 0, y + h);
    vg.addColorStop(0, "rgba(0,0,0,0.12)");
    vg.addColorStop(0.08, "rgba(255,255,255,0.10)");
    vg.addColorStop(0.2, "rgba(255,255,255,0)");
    vg.addColorStop(0.9, "rgba(0,0,0,0)");
    vg.addColorStop(1, "rgba(0,0,0,0.2)");
    g.fillStyle = vg;
    g.fillRect(x, y, w, h);
    // specular streak
    g.globalCompositeOperation = "screen";
    const sp = g.createLinearGradient(x + w * 0.16, 0, x + w * 0.3, 0);
    sp.addColorStop(0, "rgba(255,255,255,0)");
    sp.addColorStop(0.5, "rgba(255,255,255,0.22)");
    sp.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = sp;
    g.fillRect(x, y + h * 0.06, w, h * 0.86);
  }
  g.restore();
  return { x, y, w, h };
}

/* ── packaging mockup PNG ───────────────────────────────────────────────────────────────────────────── */

export function drawMockup(p: PackDesign, a: Assets, student: string): HTMLCanvasElement {
  const W = 1600;
  const H = 2000;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  const backdrop = p.secondary;
  const bg = g.createLinearGradient(0, 0, 0, H * 0.72);
  bg.addColorStop(0, shade(backdrop, -0.35));
  bg.addColorStop(1, shade(backdrop, -0.05));
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  // soft light pool
  const lp = g.createRadialGradient(W * 0.42, H * 0.38, 40, W * 0.42, H * 0.38, W * 0.75);
  lp.addColorStop(0, "rgba(255,255,255,0.22)");
  lp.addColorStop(1, "rgba(255,255,255,0)");
  g.fillStyle = lp;
  g.fillRect(0, 0, W, H);
  // table
  const tg = g.createLinearGradient(0, H * 0.72, 0, H);
  tg.addColorStop(0, "#C9AE90");
  tg.addColorStop(1, "#A88A6C");
  g.fillStyle = tg;
  g.fillRect(0, H * 0.72, W, H * 0.28);
  g.fillStyle = "rgba(0,0,0,0.12)";
  g.fillRect(0, H * 0.72, W, 6);

  const front = drawPackFront(p, a, 2);
  const fmt = packFormat(p);
  const ph = fmt === "sachet" ? H * 0.66 : fmt === "box" ? H * 0.46 : H * 0.6;
  drawPackObject(g, front, fmt, W / 2, H * 0.8, ph);
  // ingredient props on the table (the ingredients the student chose)
  const ids = p.ingredients.slice(0, 4);
  ids.forEach((id, i) => {
    const left = i % 2 === 0;
    const k = Math.floor(i / 2);
    drawIcon(g, id, left ? W * (0.1 + k * 0.08) : W * (0.78 - k * 0.08), H * (0.8 + k * 0.03), W * 0.11);
  });

  // header + caption
  g.fillStyle = "rgba(255,255,255,0.92)";
  rr(g, 60, 60, 560, 70, 35);
  g.fill();
  g.fillStyle = COCOA;
  g.font = `800 30px ${a.fonts.tommy}`;
  g.textAlign = "left";
  g.fillText("PACKAGING MOCKUP · STUDENT-CREATED", 92, 106);
  g.fillStyle = "rgba(47,28,26,0.92)";
  g.fillRect(0, H - 170, W, 170);
  g.fillStyle = CREAM;
  g.font = `700 40px ${a.fonts.fredoka}`;
  g.fillText(`${p.name || "Untitled"}${p.variant ? ` · ${p.variant}` : ""}  (${p.category ? CAT[p.category].name : ""}, ${p.netQty})`, 60, H - 105, W - 120);
  g.font = `500 28px ${a.fonts.tommy}`;
  g.fillStyle = "rgba(255,245,238,0.85)";
  g.fillText(`Designed by ${student || "the student"} · Eat Better Co × SkilliZee Experiential Internship · not official Eat Better packaging`, 60, H - 55, W - 120);
  return c;
}

/* ── Instagram creative (1080 × 1080) ──────────────────────────────────────────────────────────────── */

function coverImage(g: CanvasRenderingContext2D, img: HTMLImageElement, x: number, y: number, w: number, h: number, ox = 0, oy = 0, zoom = 1) {
  const s = Math.max(w / img.naturalWidth, h / img.naturalHeight) * zoom;
  const iw = img.naturalWidth * s;
  const ih = img.naturalHeight * s;
  g.drawImage(img, x + (w - iw) / 2 + ox * (iw - w) * 0.5, y + (h - ih) / 2 + oy * (ih - h) * 0.5, iw, ih);
}

export function drawPost(post: PostDesign, pack: PackDesign, a: Assets, front: HTMLCanvasElement | null, size = 1080): HTMLCanvasElement {
  const S = size;
  const c = document.createElement("canvas");
  c.width = S;
  c.height = S;
  const g = c.getContext("2d")!;
  g.scale(S / 1080, S / 1080);
  const W = 1080;
  const fam = a.fonts[pack.font];
  const F = (w: number) => (s: number) => `${w} ${s}px ${fam}`;
  const bg = post.bg;
  const fg = ink(bg);
  const fmt = packFormat(pack);
  const second = pack.primary.toLowerCase() === bg.toLowerCase() ? pack.secondary : pack.primary;

  const drawImage = (x: number, y: number, w: number, h: number, round = 0) => {
    g.save();
    if (round) {
      rr(g, x, y, w, h, round);
      g.clip();
    }
    const opt = POST_IMAGES.find((i) => i.id === post.image)!;
    if (opt.official) {
      coverImage(g, a.photos[post.image], x, y, w, h, post.imgX, post.imgY, post.imgScale);
    } else if (front) {
      const ph = Math.min(h * 0.86, (w * 0.9 * front.height) / front.width) * post.imgScale;
      const cx = x + w / 2 + post.imgX * w * 0.25;
      const base = y + h * 0.5 + ph / 2 + post.imgY * h * 0.1;
      if (post.image === "pack-ing") {
        pack.ingredients.slice(0, 4).forEach((id, i) => {
          const s = Math.min(w, h) * 0.2;
          const px = i % 2 === 0 ? cx - ph * 0.55 - s * 0.3 : cx + ph * 0.35;
          const py = base - s * (0.9 + Math.floor(i / 2) * 1.1);
          drawIcon(g, id, px, py, s);
        });
      }
      drawPackObject(g, front, fmt, cx, base, ph);
    }
    g.restore();
  };

  const cta = CTA[post.cta].text;
  const button = (x: number, y: number, color: string, text: string, align: "left" | "center") => {
    g.font = F(800)(40);
    const tw = g.measureText(text).width + 90;
    const bx = align === "center" ? x - tw / 2 : x;
    g.fillStyle = color;
    rr(g, bx, y, tw, 84, 42);
    g.fill();
    g.fillStyle = ink(color);
    g.textAlign = "center";
    g.fillText(text, bx + tw / 2, y + 56);
    return tw;
  };
  const btnColor = contrast(pack.accent, bg) >= 1.8 ? pack.accent : fg;

  g.textBaseline = "alphabetic";
  const headline = post.headline.trim() || "Your headline";
  const body = post.body.trim();

  if (post.layout === "hero") {
    g.fillStyle = bg;
    g.fillRect(0, 0, W, W);
    const glow = g.createRadialGradient(W / 2, 600, 40, W / 2, 600, 520);
    glow.addColorStop(0, fg === COCOA ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.16)");
    glow.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = glow;
    g.fillRect(0, 0, W, W);
    let y = 64;
    if (post.showLogo) y += drawLogo(g, a, W / 2, y, 170, fg === COCOA ? "#603A38" : CREAM) + 22;
    g.textAlign = "center";
    const ht = fitText(g, headline, F(800), W - 140, 92, 2, 40);
    g.fillStyle = fg;
    g.font = F(800)(ht.size);
    ht.lines.forEach((l, i) => g.fillText(l, W / 2, y + ht.size * (i + 1) * 0.98));
    y += ht.size * ht.lines.length + 10;
    const bodyH = body ? 120 : 0;
    drawImage(60, y, W - 120, W - y - 150 - bodyH);
    if (body) {
      g.font = F(600)(34);
      g.fillStyle = fg;
      wrapLines(g, body, W - 180)
        .slice(0, 3)
        .forEach((l, i) => g.fillText(l, W / 2, W - 150 - bodyH + 40 + i * 42));
    }
    button(W / 2, W - 128, btnColor, cta, "center");
  } else if (post.layout === "split") {
    g.fillStyle = bg;
    g.fillRect(0, 0, W, W);
    g.fillStyle = second;
    g.fillRect(W * 0.5, 0, W * 0.5, W);
    drawImage(W * 0.5, 0, W * 0.5, W);
    let y = 80;
    if (post.showLogo) y += drawLogo(g, a, 70 + 80, y, 160, fg === COCOA ? "#603A38" : CREAM) + 40;
    g.textAlign = "left";
    const ht = fitText(g, headline, F(800), W * 0.5 - 120, 84, 4, 36);
    g.fillStyle = fg;
    g.font = F(800)(ht.size);
    ht.lines.forEach((l, i) => g.fillText(l, 64, y + ht.size * (i + 1) * 0.98));
    y += ht.size * ht.lines.length + 36;
    g.font = F(600)(32);
    wrapLines(g, body, W * 0.5 - 120)
      .slice(0, 6)
      .forEach((l, i) => g.fillText(l, 64, y + i * 42));
    button(64, W - 170, btnColor, cta, "left");
  } else if (post.layout === "photo") {
    g.fillStyle = second;
    g.fillRect(0, 0, W, W);
    drawImage(0, 0, W, W);
    const fade = g.createLinearGradient(0, W * 0.35, 0, W);
    fade.addColorStop(0, "rgba(20,10,8,0)");
    fade.addColorStop(1, "rgba(20,10,8,0.86)");
    g.fillStyle = fade;
    g.fillRect(0, 0, W, W);
    if (post.showLogo) {
      g.fillStyle = "rgba(255,245,238,0.94)";
      rr(g, 50, 50, 230, 120, 24);
      g.fill();
      drawLogo(g, a, 165, 66, 180, "#603A38");
    }
    g.textAlign = "left";
    const ht = fitText(g, headline, F(800), W - 140, 88, 2, 40);
    const bl = body ? wrapLines((g.font = F(600)(32), g), body, W - 140).slice(0, 3) : [];
    let y = W - 150 - bl.length * 42 - ht.size * ht.lines.length - 30;
    g.fillStyle = CREAM;
    g.font = F(800)(ht.size);
    ht.lines.forEach((l, i) => g.fillText(l, 64, y + ht.size * (i + 1) * 0.98));
    y += ht.size * ht.lines.length + 20;
    g.font = F(600)(32);
    g.fillStyle = "rgba(255,245,238,0.92)";
    bl.forEach((l, i) => g.fillText(l, 64, y + 34 + i * 42));
    button(64, W - 134, pack.accent, cta, "left");
    g.fillStyle = bg;
    g.fillRect(0, W - 14, W, 14);
  } else {
    g.fillStyle = bg;
    g.fillRect(0, 0, W, W);
    g.fillStyle = "#FFFFFF";
    g.shadowColor = "rgba(0,0,0,0.18)";
    g.shadowBlur = 30;
    rr(g, 70, 70, W - 140, W - 140, 40);
    g.fill();
    g.shadowColor = "transparent";
    g.fillStyle = shade(second, contrast(second, "#FFFFFF") < 1.5 ? -0.08 : 0);
    rr(g, 70, 70, W - 140, 520, 40);
    g.fill();
    g.fillRect(70, 520, W - 140, 70);
    drawImage(70, 70, W - 140, 520, 40);
    let y = 640;
    g.textAlign = "left";
    const ht = fitText(g, headline, F(800), W - 360, 70, 2, 34);
    g.fillStyle = COCOA;
    g.font = F(800)(ht.size);
    ht.lines.forEach((l, i) => g.fillText(l, 120, y + ht.size * (i + 1) * 0.98));
    if (post.showLogo) drawLogo(g, a, W - 200, 625, 150, "#603A38");
    y += ht.size * ht.lines.length + 16;
    g.font = F(600)(30);
    g.fillStyle = "#4A3230";
    wrapLines(g, body, W - 260)
      .slice(0, 3)
      .forEach((l, i) => g.fillText(l, 120, y + 30 + i * 40));
    button(120, W - 210, contrast(pack.accent, "#FFFFFF") >= 1.8 ? pack.accent : COCOA, cta, "left");
  }

  // student-created label (every creative)
  g.textAlign = "right";
  g.font = "600 17px Arial, sans-serif";
  g.fillStyle = post.layout === "photo" ? "rgba(255,245,238,0.8)" : fg === COCOA ? "rgba(47,28,26,0.65)" : "rgba(255,245,238,0.75)";
  g.fillText("Student-created creative · Eat Better Co × SkilliZee internship", W - 24, W - 22);
  return c;
}

/* ── studio screens ─────────────────────────────────────────────────────────────────────────────────── */

export function drawDashboard(rows: { label: string; m: Metrics }[], title: string): HTMLCanvasElement {
  const W = 1280;
  const H = 720;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  g.fillStyle = "#F7F4F0";
  g.fillRect(0, 0, W, H);
  g.fillStyle = "#1F2A44";
  g.fillRect(0, 0, W, 76);
  g.fillStyle = "#FFFFFF";
  g.font = "700 32px Arial, sans-serif";
  g.textAlign = "left";
  g.fillText(title, 32, 50);
  g.fillStyle = "#FED300";
  rr(g, W - 250, 18, 220, 42, 21);
  g.fill();
  g.fillStyle = "#2F1C1A";
  g.font = "800 22px Arial, sans-serif";
  g.textAlign = "center";
  g.fillText("SIMULATED DATA", W - 140, 47);
  const last = rows[rows.length - 1]?.m;
  if (!last) {
    g.fillStyle = "#6B5650";
    g.font = "600 34px Arial, sans-serif";
    g.fillText("Run a test campaign to see simulated results", W / 2, H / 2);
    return c;
  }
  const tiles: [string, string][] = [
    ["Impressions", num(last.impressions)],
    ["Reach", num(last.reach)],
    ["Clicks", num(last.clicks)],
    ["CTR", pct(last.ctr)],
    ["Engagement", num(last.engagements)],
    ["Conversions", num(last.conversions)],
    ["Spend", `Rs ${num(last.spend)}`],
    ["CPA", `Rs ${num(last.cpa)}`],
  ];
  tiles.forEach(([k, v], i) => {
    const x = 32 + (i % 4) * 306;
    const y = 100 + Math.floor(i / 4) * 130;
    g.fillStyle = "#FFFFFF";
    rr(g, x, y, 290, 112, 16);
    g.fill();
    g.fillStyle = "#6B5650";
    g.font = "700 22px Arial, sans-serif";
    g.textAlign = "left";
    g.fillText(k.toUpperCase(), x + 20, y + 38);
    g.fillStyle = "#2F1C1A";
    g.font = "800 42px Arial, sans-serif";
    g.fillText(v, x + 20, y + 90);
  });
  // bar chart: clicks and conversions per run
  const cx = 32;
  const cy = 380;
  const cw = W - 64;
  const ch = 300;
  g.fillStyle = "#FFFFFF";
  rr(g, cx, cy, cw, ch, 16);
  g.fill();
  g.fillStyle = "#2F1C1A";
  g.font = "700 22px Arial, sans-serif";
  g.fillText("Clicks (orange) and conversions (green) per campaign", cx + 20, cy + 36);
  const shown = rows.slice(-6);
  const maxC = Math.max(...shown.map((r) => r.m.clicks), 1);
  const bw = (cw - 80) / shown.length;
  shown.forEach((r, i) => {
    const x = cx + 40 + i * bw;
    const h1 = (r.m.clicks / maxC) * 190;
    const h2 = (r.m.conversions / maxC) * 190 * 4;
    g.fillStyle = "#FF5C00";
    g.fillRect(x + bw * 0.15, cy + 250 - h1, bw * 0.32, h1);
    g.fillStyle = "#00A341";
    g.fillRect(x + bw * 0.5, cy + 250 - Math.min(190, h2), bw * 0.32, Math.min(190, h2));
    g.fillStyle = "#6B5650";
    g.font = "600 18px Arial, sans-serif";
    g.textAlign = "center";
    g.fillText(r.label, x + bw * 0.5, cy + 280, bw - 8);
  });
  return c;
}

export function drawMoodBoard(p: PackDesign, a: Assets): HTMLCanvasElement {
  const W = 1200;
  const H = 800;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  // cork
  g.fillStyle = "#C79D6B";
  g.fillRect(0, 0, W, H);
  const R = rand(41);
  for (let i = 0; i < 2600; i++) {
    g.fillStyle = R() > 0.5 ? "rgba(90,55,25,0.18)" : "rgba(255,230,190,0.16)";
    g.fillRect(R() * W, R() * H, 2 + R() * 3, 2 + R() * 3);
  }
  const card = (x: number, y: number, w: number, h: number, rot: number, draw: () => void) => {
    g.save();
    g.translate(x + w / 2, y + h / 2);
    g.rotate(rot);
    g.translate(-w / 2, -h / 2);
    g.shadowColor = "rgba(0,0,0,0.3)";
    g.shadowBlur = 14;
    g.shadowOffsetY = 6;
    g.fillStyle = "#FFFFFF";
    g.fillRect(0, 0, w, h);
    g.shadowColor = "transparent";
    draw();
    g.fillStyle = "#C62828";
    g.beginPath();
    g.arc(w / 2, 14, 9, 0, Math.PI * 2);
    g.fill();
    g.restore();
  };
  g.textAlign = "left";
  // official palette strip
  const official = PALETTE.filter((s) => s.onBrand).slice(0, 8);
  official.forEach((s, i) => {
    card(40 + i * 140, 40, 120, 170, (i % 2 ? 1 : -1) * 0.03, () => {
      g.fillStyle = s.hex;
      g.fillRect(10, 28, 100, 92);
      g.fillStyle = "#2F1C1A";
      g.font = "700 15px Arial, sans-serif";
      g.fillText(s.name, 10, 142, 100);
      g.font = "500 13px Arial, sans-serif";
      g.fillText(s.hex, 10, 160);
    });
  });
  // type specimens
  card(40, 260, 340, 220, -0.02, () => {
    g.fillStyle = "#2F1C1A";
    g.font = `700 90px ${a.fonts.fredoka}`;
    g.fillText("Aa", 24, 120);
    g.font = `700 24px ${a.fonts.fredoka}`;
    g.fillText("Fredoka · headings", 24, 170);
    g.font = "500 16px Arial, sans-serif";
    g.fillText("eatbetterco.com heading face", 24, 196);
  });
  card(410, 270, 340, 220, 0.025, () => {
    g.fillStyle = "#2F1C1A";
    g.font = `800 90px ${a.fonts.tommy}`;
    g.fillText("Aa", 24, 120);
    g.font = `800 24px ${a.fonts.tommy}`;
    g.fillText("MADE TOMMY · body", 24, 170);
    g.font = "500 16px Arial, sans-serif";
    g.fillText("bold, clean pack lettering", 24, 196);
  });
  // the student's palette
  card(790, 250, 370, 250, -0.015, () => {
    g.fillStyle = "#2F1C1A";
    g.font = "800 20px Arial, sans-serif";
    g.fillText("MY PACK PALETTE", 20, 50);
    [p.primary, p.secondary, p.accent].forEach((h, i) => {
      g.fillStyle = h;
      g.fillRect(20 + i * 112, 70, 100, 110);
      g.strokeStyle = "rgba(0,0,0,0.15)";
      g.strokeRect(20 + i * 112, 70, 100, 110);
      g.fillStyle = "#2F1C1A";
      g.font = "600 14px Arial, sans-serif";
      g.fillText(swatchOf(h)?.name ?? h, 20 + i * 112, 204, 100);
    });
    g.font = "500 14px Arial, sans-serif";
    g.fillText(`Type: ${FONTS.find((f) => f.id === p.font)?.name ?? ""}`, 20, 232);
  });
  // tagline card
  card(120, 540, 980, 200, 0.008, () => {
    g.fillStyle = "#FF5C00";
    g.fillRect(0, 0, 980, 200);
    g.fillStyle = "#FFFFFF";
    g.font = `700 58px ${a.fonts.fredoka}`;
    g.textAlign = "center";
    g.fillText("The joy of snacking, made better.", 490, 118, 920);
    g.font = "600 20px Arial, sans-serif";
    g.fillText("EAT BETTER CO · TAGLINE", 490, 162);
    g.textAlign = "left";
  });
  return c;
}

/** Monitor at the packaging desk: the flat front artwork on an artboard with dieline guides. */
export function drawArtboard(front: HTMLCanvasElement | null, p: PackDesign): HTMLCanvasElement {
  const W = 1280;
  const H = 720;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  g.fillStyle = "#2B2B2E";
  g.fillRect(0, 0, W, H);
  g.fillStyle = "#3A3A3E";
  g.fillRect(0, 0, W, 44);
  g.fillStyle = "#E6E6E6";
  g.font = "600 20px Arial, sans-serif";
  g.textAlign = "left";
  g.fillText(`${p.name || "Untitled pack"} · front panel · student concept`, 20, 29);
  ["#FF5F57", "#FEBC2E", "#28C840"].forEach((col, i) => {
    g.fillStyle = col;
    g.beginPath();
    g.arc(W - 90 + i * 26, 22, 8, 0, Math.PI * 2);
    g.fill();
  });
  // tool rail
  g.fillStyle = "#333337";
  g.fillRect(0, 44, 56, H - 44);
  for (let i = 0; i < 8; i++) {
    g.fillStyle = i === 2 ? "#FF5C00" : "#55555A";
    g.fillRect(14, 64 + i * 46, 28, 28);
  }
  // swatches panel
  g.fillStyle = "#333337";
  g.fillRect(W - 220, 44, 220, H - 44);
  g.fillStyle = "#CCCCCC";
  g.font = "700 16px Arial, sans-serif";
  g.fillText("SWATCHES", W - 200, 80);
  [p.primary, p.secondary, p.accent].forEach((h, i) => {
    g.fillStyle = h;
    g.fillRect(W - 200, 96 + i * 70, 56, 56);
    g.fillStyle = "#DDDDDD";
    g.font = "500 15px Arial, sans-serif";
    g.fillText(swatchOf(h)?.name ?? h, W - 134, 130 + i * 70, 120);
  });
  g.fillStyle = "#CCCCCC";
  g.font = "700 16px Arial, sans-serif";
  g.fillText("TYPE", W - 200, 330);
  g.font = "500 15px Arial, sans-serif";
  g.fillText(FONTS.find((f) => f.id === p.font)?.name ?? "", W - 200, 356, 190);
  if (front) {
    const ah = H - 120;
    const aw = (front.width / front.height) * ah;
    const maxW = W - 56 - 220 - 80;
    const s = Math.min(1, maxW / aw);
    const x = 56 + (W - 56 - 220 - aw * s) / 2;
    const y = 44 + (H - 44 - ah * s) / 2;
    g.fillStyle = "rgba(0,0,0,0.4)";
    g.fillRect(x + 8, y + 8, aw * s, ah * s);
    g.drawImage(front, x, y, aw * s, ah * s);
    g.setLineDash([8, 6]);
    g.strokeStyle = "#29B6F6";
    g.lineWidth = 2;
    g.strokeRect(x - 10, y - 10, aw * s + 20, ah * s + 20);
    g.setLineDash([]);
  }
  return c;
}

/** The creative review screen: the post in an Instagram-style frame + the review notes. */
export function drawCreativeScreen(postCanvas: HTMLCanvasElement | null, caption: string, status: { ok: boolean; text: string }, cta: string): HTMLCanvasElement {
  const W = 1600;
  const H = 900;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  const bg = g.createLinearGradient(0, 0, W, H);
  bg.addColorStop(0, "#1E1412");
  bg.addColorStop(1, "#3A2420");
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  // phone
  const px = 140;
  const py = 40;
  const pw = 470;
  const ph = 820;
  g.fillStyle = "#0B0B0C";
  rr(g, px, py, pw, ph, 56);
  g.fill();
  g.fillStyle = "#FFFFFF";
  rr(g, px + 16, py + 16, pw - 32, ph - 32, 44);
  g.fill();
  g.fillStyle = "#FF5C00";
  g.beginPath();
  g.arc(px + 60, py + 82, 22, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = "#111";
  g.font = "700 22px Arial, sans-serif";
  g.textAlign = "left";
  g.fillText("eatbetterco", px + 94, py + 78);
  g.fillStyle = "#888";
  g.font = "500 16px Arial, sans-serif";
  g.fillText("Draft · student-created", px + 94, py + 100);
  const iw = pw - 32;
  if (postCanvas) g.drawImage(postCanvas, px + 16, py + 124, iw, iw);
  else {
    g.fillStyle = "#EEE";
    g.fillRect(px + 16, py + 124, iw, iw);
  }
  // action icons
  const iy = py + 124 + iw + 34;
  g.strokeStyle = "#111";
  g.lineWidth = 3;
  g.beginPath();
  g.moveTo(px + 50, iy + 8);
  g.bezierCurveTo(px + 30, iy - 12, px + 30, iy - 22, px + 50, iy - 12);
  g.bezierCurveTo(px + 70, iy - 22, px + 70, iy - 12, px + 50, iy + 8);
  g.stroke();
  g.beginPath();
  g.arc(px + 100, iy - 4, 13, 0.3, Math.PI * 2 - 0.2);
  g.stroke();
  g.beginPath();
  g.moveTo(px + 132, iy - 16);
  g.lineTo(px + 160, iy - 4);
  g.lineTo(px + 132, iy + 8);
  g.closePath();
  g.stroke();
  g.fillStyle = "#111";
  g.font = "500 18px Arial, sans-serif";
  wrapLines(g, caption || "Your caption appears here.", iw - 40)
    .slice(0, 4)
    .forEach((l, i) => g.fillText(l, px + 36, iy + 40 + i * 24));
  // notes
  g.fillStyle = "#FF5C00";
  g.font = "800 30px Arial, sans-serif";
  g.fillText("CREATIVE REVIEW", 720, 140);
  g.fillStyle = "#FFF5EE";
  g.font = "700 54px Arial, sans-serif";
  g.fillText("Instagram post · 1080 × 1080", 720, 214);
  g.fillStyle = status.ok ? "#00A341" : "#F83A3A";
  rr(g, 720, 270, 640, 90, 20);
  g.fill();
  g.fillStyle = "#FFFFFF";
  g.font = "800 34px Arial, sans-serif";
  g.fillText(status.ok ? "CLAIMS CHECK: CLEAR" : "CLAIMS CHECK: FIX NEEDED", 750, 328);
  g.fillStyle = "#FFE7D5";
  g.font = "500 30px Arial, sans-serif";
  wrapLines(g, status.text, 760)
    .slice(0, 3)
    .forEach((l, i) => g.fillText(l, 720, 420 + i * 42));
  g.fillStyle = "#FED300";
  g.font = "700 32px Arial, sans-serif";
  g.fillText(`Call to action: ${cta}`, 720, 580);
  g.fillStyle = "rgba(255,245,238,0.6)";
  g.font = "500 24px Arial, sans-serif";
  g.fillText("Student-created creative · Eat Better Co × SkilliZee internship", 720, 820);
  return c;
}
