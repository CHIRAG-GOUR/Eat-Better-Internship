/**
 * Illustrated ingredient & product icons (48×48). One shape list drives both the React <svg> in the UI and the
 * canvas renderer used on the student's pack and Instagram post, so what the student picks is what gets printed.
 */

type Shape = { d: string; fill?: string; stroke?: string; sw?: number; t?: [number, number, number] };

const ALMOND: Shape[] = [
  { d: "M24 6 C34 14 38 26 33 36 C30 42 18 42 15 36 C10 26 14 14 24 6 Z", fill: "#C68A4B", stroke: "#8F5A2A", sw: 1.2 },
  { d: "M20 18 C19 24 19 30 21 36 M27 16 C29 22 29 30 27 37", stroke: "#A0652F", sw: 1.4 },
  { d: "M22 12 C20 16 19 20 19 24", stroke: "#E6BC88", sw: 2 },
];
const CASHEW: Shape[] = [
  { d: "M14 10 C6 18 8 34 20 39 C30 43 40 37 40 30 C40 26 36 25 33 27 C29 30 24 31 21 28 C17 24 18 16 22 13 C25 10 20 6 14 10 Z", fill: "#EFDCB4", stroke: "#B8935E", sw: 1.4 },
  { d: "M13 16 C11 22 12 29 17 34", stroke: "#FFF6E2", sw: 2 },
];
const PISTACHIO: Shape[] = [
  { d: "M10 26 C10 14 22 8 32 12 C42 16 42 32 32 37 C22 42 10 38 10 26 Z", fill: "#E9D7B4", stroke: "#B39867", sw: 1.4 },
  { d: "M16 25 C17 17 27 14 32 19 C36 24 32 32 25 33 C19 34 15 30 16 25 Z", fill: "#8DB04A" },
  { d: "M17 23 C19 18 24 16 28 17 C23 19 19 22 17 27 Z", fill: "#7A4A6A" },
];
const RAISIN: Shape[] = [
  { d: "M8 26 C8 18 18 14 24 20 C28 25 24 34 16 34 C10 34 8 30 8 26 Z", fill: "#5B2C4A" },
  { d: "M24 22 C26 14 38 14 40 22 C42 30 34 36 28 33 C24 31 23 26 24 22 Z", fill: "#7A3D62" },
  { d: "M12 24 C15 26 18 25 20 28 M29 21 C31 24 34 23 36 26", stroke: "#3D1A31", sw: 1.4 },
];

export const ICONS: Record<string, Shape[]> = {
  dates: [
    { d: "M10 30 C8 20 20 10 32 12 C42 14 42 26 34 33 C26 40 12 40 10 30 Z", fill: "#7A3B1C", stroke: "#4E220E", sw: 1.2 },
    { d: "M16 22 C20 16 28 14 33 16", stroke: "#B8703F", sw: 2.4 },
    { d: "M15 31 C20 33 27 32 32 28", stroke: "#5A2812", sw: 1.4 },
    { d: "M31 13 a2.2 2.2 0 1 0 4.4 0 a2.2 2.2 0 1 0 -4.4 0 Z", fill: "#D8B07A" },
  ],
  almond: ALMOND,
  cashew: CASHEW,
  hazelnut: [
    { d: "M24 14 C34 14 40 22 38 31 C36 40 12 40 10 31 C8 22 14 14 24 14 Z", fill: "#A0622D", stroke: "#6B3A17", sw: 1.2 },
    { d: "M12 21 C14 10 34 10 36 21 C30 17 18 17 12 21 Z", fill: "#6B3A17" },
    { d: "M24 8 L26.5 13 L21.5 13 Z", fill: "#6B3A17" },
    { d: "M15 28 C16 33 20 36 24 37", stroke: "#CF9356", sw: 2 },
  ],
  pistachio: PISTACHIO,
  raisin: RAISIN,
  cocoa: [
    { d: "M24 4 C36 10 40 26 34 38 C30 44 18 44 14 38 C8 26 12 10 24 4 Z", fill: "#A0522D", stroke: "#6E3519", sw: 1.2 },
    { d: "M24 6 L24 42 M18 9 C13 20 14 32 19 41 M30 9 C35 20 34 32 29 41", stroke: "#7A3A1D", sw: 1.4 },
    { d: "M20 12 C17 18 17 24 18 28", stroke: "#D08A55", sw: 2 },
  ],
  coffee: [
    { d: "M24 6 C36 6 40 18 38 28 C36 40 14 44 10 30 C7 20 12 6 24 6 Z", fill: "#4A2A18", stroke: "#2A160C", sw: 1.2 },
    { d: "M26 8 C18 16 30 26 22 40", stroke: "#22110A", sw: 2.6 },
    { d: "M15 16 C13 22 13 27 15 31", stroke: "#8A5A3E", sw: 2 },
  ],
  chia: [
    {
      d: "M8 20 a3.2 2.3 0 1 0 6.4 0 a3.2 2.3 0 1 0 -6.4 0 Z M18 12 a3.2 2.3 0 1 0 6.4 0 a3.2 2.3 0 1 0 -6.4 0 Z M28 20 a3.2 2.3 0 1 0 6.4 0 a3.2 2.3 0 1 0 -6.4 0 Z M14 30 a3.2 2.3 0 1 0 6.4 0 a3.2 2.3 0 1 0 -6.4 0 Z M30 32 a3.2 2.3 0 1 0 6.4 0 a3.2 2.3 0 1 0 -6.4 0 Z M22 38 a3.2 2.3 0 1 0 6.4 0 a3.2 2.3 0 1 0 -6.4 0 Z",
      fill: "#5E5A55",
    },
    { d: "M20 24 a3.2 2.3 0 1 0 6.4 0 a3.2 2.3 0 1 0 -6.4 0 Z M36 13 a3.2 2.3 0 1 0 6.4 0 a3.2 2.3 0 1 0 -6.4 0 Z M6 36 a3.2 2.3 0 1 0 6.4 0 a3.2 2.3 0 1 0 -6.4 0 Z", fill: "#B9B1A5" },
  ],
  oats: [
    { d: "M6 18 C8 10 20 8 24 14 C27 20 20 27 13 26 C8 25 5 22 6 18 Z", fill: "#E6CF9C", stroke: "#B9995C", sw: 1.2 },
    { d: "M24 26 C27 18 40 18 42 26 C44 34 34 39 28 36 C24 34 23 30 24 26 Z", fill: "#EBD6A6", stroke: "#B9995C", sw: 1.2 },
    { d: "M8 34 C10 29 18 29 20 34 C21 39 15 42 11 41 C8 40 7 37 8 34 Z", fill: "#E1C68E", stroke: "#B9995C", sw: 1.2 },
  ],
  coconut: [
    { d: "M5 22 A19 19 0 0 0 43 22 Z", fill: "#6B4226" },
    { d: "M8.5 22 A15.5 15.5 0 0 0 39.5 22 Z", fill: "#FFFCF2" },
    { d: "M14 22 A10 8 0 0 0 34 22 Z", fill: "#F1EAD7" },
    { d: "M5 22 L43 22", stroke: "#4E2E18", sw: 2.5 },
  ],
  millet: [
    { d: "M24 45 C24 34 25 20 26 5", stroke: "#8E7A3A", sw: 2 },
    {
      d: "M21 10 a3 4 -20 1 0 0.1 0 Z M29 12 a3 4 20 1 0 0.1 0 Z M20 17 a3 4 -20 1 0 0.1 0 Z M30 19 a3 4 20 1 0 0.1 0 Z M20 24 a3 4 -20 1 0 0.1 0 Z M30 26 a3 4 20 1 0 0.1 0 Z M20 31 a3 4 -20 1 0 0.1 0 Z M29 33 a3 4 20 1 0 0.1 0 Z M26 6 a2.6 3.6 0 1 0 0.1 0 Z",
      fill: "#E2B84A",
      stroke: "#B48A2A",
      sw: 0.8,
    },
  ],
  mint: [
    { d: "M8 38 C8 20 22 8 40 8 C40 26 28 40 8 38 Z", fill: "#3E9B47", stroke: "#2A6E31", sw: 1.2 },
    { d: "M10 36 C18 28 28 18 38 10 M18 28 L16 20 M24 22 L22 14 M18 28 L26 30 M24 22 L32 24", stroke: "#2A6E31", sw: 1.5 },
  ],
  chilli: [
    { d: "M8 12 C12 10 14 14 16 18 C22 28 32 36 42 40 C34 44 20 40 13 30 C9 24 8 18 8 12 Z", fill: "#D7261E", stroke: "#9E1610", sw: 1.2 },
    { d: "M8 12 C6 8 8 5 12 5", stroke: "#3E8E2E", sw: 3 },
    { d: "M5 13 C7 9 13 10 14 14 C11 15 8 15 5 13 Z", fill: "#3E8E2E" },
    { d: "M14 22 C18 28 24 33 30 36", stroke: "#F37A6A", sw: 2 },
  ],
  lime: [
    { d: "M24 4 A20 20 0 1 0 24.01 4 Z", fill: "#5E9A2A" },
    { d: "M24 8 A16 16 0 1 0 24.01 8 Z", fill: "#E4F2A0" },
    { d: "M24 24 L24 8 M24 24 L38 16 M24 24 L38 32 M24 24 L24 40 M24 24 L10 32 M24 24 L10 16", stroke: "#B7D45E", sw: 1.8 },
    { d: "M22 24 a2 2 0 1 0 4 0 a2 2 0 1 0 -4 0 Z", fill: "#FFFFFF" },
  ],
  jaggery: [
    { d: "M10 16 L24 9 L38 16 L24 23 Z", fill: "#D9A04A" },
    { d: "M10 16 L24 23 L24 40 L10 33 Z", fill: "#B97C2F" },
    { d: "M24 23 L38 16 L38 33 L24 40 Z", fill: "#9A6322" },
    { d: "M16 26 a1 1 0 1 0 2 0 a1 1 0 1 0 -2 0 Z M30 28 a1 1 0 1 0 2 0 a1 1 0 1 0 -2 0 Z M22 15 a1 1 0 1 0 2 0 a1 1 0 1 0 -2 0 Z", fill: "#6E4416" },
  ],
  seeds: [
    { d: "M18 6 C26 12 29 24 26 33 C23 41 15 41 12 33 C9 24 12 12 18 6 Z", fill: "#7C9A4A", stroke: "#DCE5B6", sw: 2 },
    { d: "M33 14 C39 18 42 28 39 35 C37 41 30 41 28 35 C26 28 28 18 33 14 Z", fill: "#6E8C3E", stroke: "#DCE5B6", sw: 2 },
  ],
  orange: [
    { d: "M24 9 A16 16 0 1 0 24.01 9 Z", fill: "#F7931E", stroke: "#D06F0A", sw: 1.2 },
    { d: "M15 20 C16 16 19 14 22 13", stroke: "#FFC27A", sw: 2.2 },
    { d: "M24 9 C26 4 32 3 36 5 C33 9 28 10 24 9 Z", fill: "#4E9A3A" },
  ],
  ginger: [
    { d: "M6 28 C6 22 12 20 16 22 C18 14 26 12 30 18 C34 14 42 16 42 23 C42 30 34 32 30 30 C28 36 20 38 16 33 C12 36 6 34 6 28 Z", fill: "#DDB57C", stroke: "#A97E46", sw: 1.4 },
    { d: "M14 27 L18 28 M26 24 L29 26 M34 22 L37 23", stroke: "#B48850", sw: 1.4 },
  ],
  masala: [
    { d: "M10 26 C14 13 34 13 38 26 Z", fill: "#C8411B" },
    { d: "M15 20 a1 1 0 1 0 2 0 a1 1 0 1 0 -2 0 Z M24 17 a1 1 0 1 0 2 0 a1 1 0 1 0 -2 0 Z M30 21 a1 1 0 1 0 2 0 a1 1 0 1 0 -2 0 Z", fill: "#F2B33D" },
    { d: "M6 26 L42 26 C42 36 34 42 24 42 C14 42 6 36 6 26 Z", fill: "#EFE6DA", stroke: "#B9A68F", sw: 1.4 },
  ],
  /* product / range icons */
  laddoo: [
    { d: "M24 8 A16 16 0 1 0 24.01 8 Z", fill: "#6B3A22", stroke: "#3E1F10", sw: 1.2 },
    { d: "M17 18 a1.6 1.2 20 1 0 3.2 0 a1.6 1.2 20 1 0 -3.2 0 Z M27 15 a1.6 1.2 0 1 0 3.2 0 a1.6 1.2 0 1 0 -3.2 0 Z M30 26 a1.8 1.3 -20 1 0 3.6 0 a1.8 1.3 -20 1 0 -3.6 0 Z M20 30 a1.6 1.2 10 1 0 3.2 0 a1.6 1.2 10 1 0 -3.2 0 Z M14 25 a1.4 1 0 1 0 2.8 0 a1.4 1 0 1 0 -2.8 0 Z M25 34 a1.4 1 0 1 0 2.8 0 a1.4 1 0 1 0 -2.8 0 Z", fill: "#E2BE86" },
    { d: "M14 18 C16 14 19 12 23 11", stroke: "#9A5E3C", sw: 2.2 },
  ],
  namkeen: [
    { d: "M9 24 C12 14 36 14 39 24 Z", fill: "#E3A43A" },
    { d: "M12 22 C15 18 18 22 21 18 C24 15 26 21 29 18 C32 15 34 20 37 21 M14 19 C17 16 20 19 23 16", stroke: "#B9741E", sw: 1.5 },
    { d: "M6 24 L42 24 C42 35 34 42 24 42 C14 42 6 35 6 24 Z", fill: "#EFE6DA", stroke: "#B9A68F", sw: 1.4 },
  ],
  nuts: [...ALMOND.map((s) => ({ ...s, t: [0, 6, 0.62] as [number, number, number] })), ...CASHEW.map((s) => ({ ...s, t: [18, 2, 0.6] as [number, number, number] })), ...PISTACHIO.map((s) => ({ ...s, t: [14, 22, 0.55] as [number, number, number] }))],
  combos: [
    { d: "M8 20 H40 V42 H8 Z", fill: "#FF5C00", stroke: "#B84300", sw: 1.2 },
    { d: "M6 14 H42 V21 H6 Z", fill: "#E04E00", stroke: "#B84300", sw: 1.2 },
    { d: "M22 14 H26 V42 H22 Z", fill: "#FED300" },
    { d: "M24 14 C18 6 10 8 14 13 C16 15 20 15 24 14 Z M24 14 C30 6 38 8 34 13 C32 15 28 15 24 14 Z", fill: "#FED300", stroke: "#C9A400", sw: 1 },
  ],
  chips: [
    { d: "M8 16 C16 10 22 20 30 14 C36 10 40 12 42 16 L36 36 C30 40 24 30 16 36 C12 38 8 36 6 34 Z", fill: "#E8B04A", stroke: "#B9802A", sw: 1.4 },
    { d: "M14 22 a1.2 1.2 0 1 0 2.4 0 a1.2 1.2 0 1 0 -2.4 0 Z M26 26 a1.2 1.2 0 1 0 2.4 0 a1.2 1.2 0 1 0 -2.4 0 Z M32 20 a1.2 1.2 0 1 0 2.4 0 a1.2 1.2 0 1 0 -2.4 0 Z", fill: "#C0461E" },
  ],
};
ICONS.laddoos = ICONS.laddoo;

export function Icon({ id, className = "size-6", title }: { id: string; className?: string; title?: string }) {
  const shapes = ICONS[id] ?? ICONS.laddoo;
  return (
    <svg viewBox="0 0 48 48" className={className} role={title ? "img" : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      {shapes.map((s, i) => (
        <path
          key={i}
          d={s.d}
          fill={s.fill ?? "none"}
          stroke={s.stroke}
          strokeWidth={s.sw}
          strokeLinecap="round"
          strokeLinejoin="round"
          transform={s.t ? `translate(${s.t[0]} ${s.t[1]}) scale(${s.t[2]})` : undefined}
        />
      ))}
    </svg>
  );
}

/** Draw an icon on a canvas at (x, y) with the given size in px. */
export function drawIcon(g: CanvasRenderingContext2D, id: string, x: number, y: number, size: number) {
  const shapes = ICONS[id] ?? ICONS.laddoo;
  g.save();
  g.translate(x, y);
  g.scale(size / 48, size / 48);
  g.lineCap = "round";
  g.lineJoin = "round";
  for (const s of shapes) {
    g.save();
    if (s.t) {
      g.translate(s.t[0], s.t[1]);
      g.scale(s.t[2], s.t[2]);
    }
    const p = new Path2D(s.d);
    if (s.fill) {
      g.fillStyle = s.fill;
      g.fill(p);
    }
    if (s.stroke) {
      g.strokeStyle = s.stroke;
      g.lineWidth = s.sw ?? 1;
      g.stroke(p);
    }
    g.restore();
  }
  g.restore();
}
