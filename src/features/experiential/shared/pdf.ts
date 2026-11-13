"use client";

import { jsPDF } from "jspdf";

/**
 * Builds the Eat Better Co × SkilliZee student project reports (A4, client-side, no external service).
 * Cover page (both brands, activity, student, date) → report body (objective, outcomes, the student's own
 * decisions and results, images, tables, reflection) → footer on every page.
 * Uses the PDF base fonts, so text is kept to plain characters (e.g. "Rs" rather than the rupee sign).
 */

export type Student = { name: string; id?: string; grade?: string };
export type ReportBlock =
  | { kind: "h"; text: string }
  | { kind: "p"; text: string; muted?: boolean }
  | { kind: "bullets"; items: string[] }
  | { kind: "kv"; rows: [string, string][] }
  | { kind: "table"; head: string[]; rows: string[][]; widths?: number[] }
  | { kind: "image"; dataUrl: string; w: number; h: number; caption?: string }
  | { kind: "callout"; text: string; tone?: "good" | "warn" | "info" };

export type ReportSpec = {
  title: string; // e.g. "Product Innovation & Quality Report"
  activity: string; // "Experiential Activity 1"
  module: string; // "Module 1 · The Eat Better Story & Product Line"
  student: Student;
  date: string;
  blocks: ReportBlock[];
  filename: string;
};

const ORANGE: [number, number, number] = [255, 92, 0];
const COCOA: [number, number, number] = [47, 28, 26];
const MUTED: [number, number, number] = [110, 90, 85];
const CREAM: [number, number, number] = [255, 245, 238];
const FOOTER = "Created as part of the Eat Better Co x SkilliZee Experiential Internship Programme.";

/** Replace characters the base PDF fonts can't draw. */
export const pdfSafe = (s: string) =>
  s
    .replace(/₹\s?/g, "Rs ")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/[–—]/g, "-")
    .replace(/×/g, "x")
    .replace(/…/g, "...")
    .replace(/•/g, "-")
    .replace(/[^\x20-\x7E\n -ÿ]/g, "");

async function loadImage(src: string): Promise<{ data: string; w: number; h: number }> {
  const img = new Image();
  img.crossOrigin = "anonymous";
  img.src = src;
  await img.decode();
  const c = document.createElement("canvas");
  c.width = img.naturalWidth;
  c.height = img.naturalHeight;
  c.getContext("2d")!.drawImage(img, 0, 0);
  return { data: c.toDataURL("image/png"), w: img.naturalWidth, h: img.naturalHeight };
}

export async function buildReport(spec: ReportSpec) {
  const doc = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const W = 210;
  const H = 297;
  const M = 18;
  const CW = W - M * 2;
  let y = 0;

  /* ── cover ─────────────────────────────────────────────── */
  doc.setFillColor(...CREAM);
  doc.rect(0, 0, W, H, "F");
  doc.setFillColor(...ORANGE);
  doc.rect(0, 0, W, 8, "F");
  try {
    const logo = await loadImage("/brand/eat-better-x-skillizee-600x400.png");
    doc.addImage(logo.data, "PNG", (W - 120) / 2, 30, 120, 80, undefined, "FAST");
  } catch {
    /* logo optional */
  }
  doc.setTextColor(...ORANGE);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(pdfSafe(spec.activity.toUpperCase()), W / 2, 128, { align: "center" });
  doc.setTextColor(...COCOA);
  doc.setFontSize(24);
  const titleLines = doc.splitTextToSize(pdfSafe(`Eat Better Co x SkilliZee - ${spec.title}`), CW);
  doc.text(titleLines, W / 2, 142, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(12);
  doc.setTextColor(...MUTED);
  doc.text(pdfSafe(spec.module), W / 2, 142 + titleLines.length * 10 + 4, { align: "center" });

  const card = 200;
  doc.setDrawColor(...COCOA);
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(M + 20, card, CW - 40, 52, 4, 4, "FD");
  const rows: [string, string][] = [
    ["Student", spec.student.name || "-"],
    ["Student ID", spec.student.id || "-"],
    ["Class / grade", spec.student.grade || "-"],
    ["Completed on", spec.date],
  ];
  rows.forEach(([k, v], i) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    doc.text(k.toUpperCase(), M + 28, card + 12 + i * 11);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.setTextColor(...COCOA);
    doc.text(pdfSafe(v), M + 75, card + 12 + i * 11);
  });

  /* ── body helpers ──────────────────────────────────────── */
  const newPage = () => {
    doc.addPage();
    doc.setFillColor(...ORANGE);
    doc.rect(0, 0, W, 4, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    doc.text(pdfSafe(`EAT BETTER CO x SKILLIZEE  |  ${spec.title.toUpperCase()}`), M, 12);
    y = 22;
  };
  const need = (h: number) => {
    if (y + h > H - 22) newPage();
  };
  const para = (text: string, size = 10.5, color = COCOA, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(size);
    doc.setTextColor(...color);
    const lines = doc.splitTextToSize(pdfSafe(text), CW);
    const lh = size * 0.48;
    for (const ln of lines) {
      need(lh + 1);
      doc.text(ln, M, y);
      y += lh;
    }
    y += 2.5;
  };

  newPage();
  for (const b of spec.blocks) {
    if (b.kind === "h") {
      need(16);
      y += 3;
      doc.setFillColor(...ORANGE);
      doc.rect(M, y - 4.5, 3, 6, "F");
      doc.setFont("helvetica", "bold");
      doc.setFontSize(14);
      doc.setTextColor(...COCOA);
      doc.text(pdfSafe(b.text), M + 6, y);
      y += 8;
    } else if (b.kind === "p") {
      para(b.text, 10.5, b.muted ? MUTED : COCOA);
    } else if (b.kind === "bullets") {
      for (const it of b.items) {
        doc.setFont("helvetica", "normal");
        doc.setFontSize(10.5);
        const lines = doc.splitTextToSize(pdfSafe(it), CW - 6);
        need(lines.length * 5 + 1);
        doc.setFillColor(...ORANGE);
        doc.circle(M + 1.5, y - 1.3, 0.9, "F");
        doc.setTextColor(...COCOA);
        doc.text(lines, M + 5, y);
        y += lines.length * 5 + 1.2;
      }
      y += 2;
    } else if (b.kind === "kv") {
      for (const [k, v] of b.rows) {
        doc.setFontSize(10);
        const lines = doc.splitTextToSize(pdfSafe(v), CW - 55);
        need(lines.length * 5 + 2);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(...MUTED);
        doc.text(pdfSafe(k), M, y);
        doc.setFont("helvetica", "normal");
        doc.setTextColor(...COCOA);
        doc.text(lines, M + 55, y);
        y += lines.length * 5 + 2;
      }
      y += 2;
    } else if (b.kind === "table") {
      const n = b.head.length;
      const widths = b.widths ?? Array(n).fill(CW / n);
      const row = (cells: string[], head: boolean) => {
        doc.setFont("helvetica", head ? "bold" : "normal");
        doc.setFontSize(9);
        const wrapped = cells.map((c, i) => doc.splitTextToSize(pdfSafe(c), widths[i] - 3));
        const h = Math.max(...wrapped.map((w) => w.length)) * 4.2 + 3;
        need(h);
        let x = M;
        if (head) {
          doc.setFillColor(...COCOA);
          doc.rect(M, y - 4, CW, h, "F");
          doc.setTextColor(255, 255, 255);
        } else {
          doc.setDrawColor(225, 210, 200);
          doc.line(M, y - 4 + h, M + CW, y - 4 + h);
          doc.setTextColor(...COCOA);
        }
        wrapped.forEach((w, i) => {
          doc.text(w, x + 1.5, y);
          x += widths[i];
        });
        y += h;
      };
      row(b.head, true);
      b.rows.forEach((r) => row(r, false));
      y += 3;
    } else if (b.kind === "image") {
      const maxW = Math.min(CW, b.w);
      const h = (b.h / b.w) * maxW;
      need(h + (b.caption ? 8 : 3));
      doc.addImage(b.dataUrl, "PNG", M + (CW - maxW) / 2, y, maxW, h, undefined, "FAST");
      y += h + 3;
      if (b.caption) {
        doc.setFont("helvetica", "italic");
        doc.setFontSize(8.5);
        doc.setTextColor(...MUTED);
        doc.text(pdfSafe(b.caption), W / 2, y + 1, { align: "center" });
        y += 6;
      }
    } else if (b.kind === "callout") {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      const lines = doc.splitTextToSize(pdfSafe(b.text), CW - 10);
      const h = lines.length * 5 + 6;
      need(h + 2);
      const fill: [number, number, number] = b.tone === "good" ? [226, 244, 233] : b.tone === "warn" ? [253, 236, 234] : [255, 233, 214];
      doc.setFillColor(...fill);
      doc.roundedRect(M, y - 4, CW, h, 2, 2, "F");
      doc.setTextColor(...COCOA);
      doc.text(lines, M + 5, y + 1);
      y += h + 2;
    }
  }

  /* ── footer + page numbers on every page ──────────────── */
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setDrawColor(230, 215, 205);
    doc.line(M, H - 15, W - M, H - 15);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(FOOTER, M, H - 9);
    doc.text(`${i} / ${pages}`, W - M, H - 9, { align: "right" });
  }
  doc.save(spec.filename);
  return pages;
}

/** Trigger a download of a data URL (PNG assets). */
export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
}
