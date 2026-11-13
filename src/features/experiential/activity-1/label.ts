"use client";

import { ING, CATEGORIES, FLAVOURS } from "./data";
import type { LabelInfo, Product } from "./store";

/**
 * Draws the student's back-of-pack label (900×1200) from their actual product and label decisions.
 * It is clearly marked as a student concept and carries NO real FSSAI licence number.
 */
export function drawLabel(product: Product, label: LabelInfo, student?: string): string {
  const W = 900;
  const H = 1200;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const g = c.getContext("2d")!;
  const font = (w: number, s: number) => `${w} ${s}px Figtree, "Segoe UI", Arial, sans-serif`;
  const display = (w: number, s: number) => `${w} ${s}px Fredoka, Figtree, Arial, sans-serif`;

  g.fillStyle = "#FFF5EE";
  g.fillRect(0, 0, W, H);
  // header band
  g.fillStyle = "#FF5C00";
  g.fillRect(0, 0, W, 150);
  g.fillStyle = "#FFFFFF";
  g.font = display(800, 56);
  g.fillText("EAT BETTER CO", 40, 78);
  g.font = font(600, 24);
  g.fillText("Student concept for the Eat Better Co × SkilliZee internship", 40, 122);

  let y = 220;
  g.fillStyle = "#2F1C1A";
  g.font = display(800, 54);
  const name = product.name.trim() || "Untitled snack";
  wrap(g, name, 40, y, W - 200, 60);
  // veg mark
  g.strokeStyle = "#1B8E3E";
  g.lineWidth = 5;
  g.strokeRect(W - 120, 170, 70, 70);
  g.fillStyle = "#1B8E3E";
  g.beginPath();
  g.arc(W - 85, 205, 20, 0, Math.PI * 2);
  g.fill();

  y += 60 + (name.length > 22 ? 60 : 0);
  const cat = CATEGORIES.find((x) => x.id === product.category)?.name ?? "";
  const fl = FLAVOURS.find((x) => x.id === product.flavour)?.name ?? "";
  g.fillStyle = "#6B5650";
  g.font = font(600, 28);
  g.fillText([cat, fl].filter(Boolean).join(" · "), 40, y);
  y += 56;

  const section = (title: string, body: string, size = 26) => {
    g.fillStyle = "#FF5C00";
    g.font = font(800, 22);
    g.fillText(title.toUpperCase(), 40, y);
    y += 34;
    g.fillStyle = "#2F1C1A";
    g.font = font(500, size);
    y = wrap(g, body, 40, y, W - 80, size + 8) + 22;
  };

  const parts = [...product.parts].sort((a, b) => b.pct - a.pct);
  section("Ingredients", parts.map((p) => `${ING[p.id]?.name ?? p.id} (${p.pct}%)`).join(", ") + ".");
  section("Allergen information", label.allergens.length ? `Contains: ${label.allergens.join(", ")}.` : "No major allergens declared.");
  section("Net quantity", label.netQty ? `${label.netQty} g` : "—");

  // nutrition placeholder table
  g.fillStyle = "#FF5C00";
  g.font = font(800, 22);
  g.fillText("NUTRITION INFORMATION (PER 100 g)", 40, y);
  y += 16;
  const rows = ["Energy (kcal)", "Protein (g)", "Carbohydrate (g)", "Total sugars (g)", "Total fat (g)", "Sodium (mg)"];
  g.strokeStyle = "#2F1C1A";
  g.lineWidth = 2;
  rows.forEach((r, i) => {
    const ry = y + i * 40;
    g.strokeRect(40, ry, W - 80, 40);
    g.fillStyle = "#2F1C1A";
    g.font = font(600, 22);
    g.fillText(r, 56, ry + 27);
    g.fillStyle = "#8A766F";
    g.font = font(500, 20);
    g.fillText("to be filled after lab analysis", W - 360, ry + 27);
  });
  y += rows.length * 40 + 36;

  section("Storage", label.storage || "—", 24);
  section("Best before", label.bestBefore || "—", 24);

  // compliance box
  g.fillStyle = "#FDECEA";
  g.fillRect(40, y - 10, W - 80, 128);
  g.strokeStyle = "#C62828";
  g.strokeRect(40, y - 10, W - 80, 128);
  g.fillStyle = "#B71C1C";
  g.font = font(800, 22);
  g.fillText("FSSAI LOGO + LICENCE NUMBER GO HERE ON A REAL PACK", 58, y + 24);
  g.fillStyle = "#2F1C1A";
  g.font = font(500, 21);
  wrap(g, "This is a simulated student label. It has no FSSAI licence and is not an approved or official Eat Better Co product.", 58, y + 58, W - 120, 28);
  y += 150;

  g.fillStyle = "#6B5650";
  g.font = font(500, 19);
  g.fillText(`Concept by ${student?.trim() || "the student"} · Eat Better Co × SkilliZee Experiential Internship`, 40, Math.max(y, H - 28));
  return c.toDataURL("image/png");
}

function wrap(g: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lh: number) {
  const words = text.split(/\s+/);
  let line = "";
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (g.measureText(t).width > maxW && line) {
      g.fillText(line, x, y);
      y += lh;
      line = w;
    } else line = t;
  }
  if (line) g.fillText(line, x, y);
  return y + lh;
}
