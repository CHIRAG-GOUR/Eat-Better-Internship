/**
 * Hand-drawn SVG icons for every ingredient in the Product Innovation Lab (48×48 viewBox).
 * Each one is drawn to read as the real thing: an almond is a pointed teardrop with a seam, a cashew is a curved
 * kidney, a date is a wrinkled glossy oval, an orange is a segmented slice, and so on.
 */
import type { JSX } from "react";

const P: Record<string, JSX.Element> = {
  dates: (
    <g>
      <ellipse cx="20" cy="26" rx="9" ry="15" transform="rotate(-20 20 26)" fill="#5A2E14" />
      <ellipse cx="31" cy="24" rx="8" ry="13" transform="rotate(18 31 24)" fill="#6B3A1E" />
      <path d="M15 18c2 4 2 12 0 16M27 15c2 5 1 13-1 17" stroke="#3A1A0A" strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <ellipse cx="17" cy="20" rx="2" ry="4" transform="rotate(-20 17 20)" fill="#A8683E" opacity=".55" />
    </g>
  ),
  raisins: (
    <g>
      {[
        [16, 18],
        [29, 16],
        [22, 30],
        [34, 29],
      ].map(([x, y], i) => (
        <g key={i}>
          <ellipse cx={x} cy={y} rx="7" ry="6" fill={i % 2 ? "#5B2340" : "#C08A2E"} />
          <path d={`M${x - 4} ${y - 1}q4 3 8 0M${x - 3} ${y + 2}q3 2 6 0`} stroke="#00000055" strokeWidth="1" fill="none" />
        </g>
      ))}
    </g>
  ),
  jaggery: (
    <g>
      <rect x="9" y="17" width="18" height="16" rx="4" fill="#B8742A" />
      <rect x="22" y="12" width="17" height="15" rx="4" fill="#C98634" />
      <path d="M12 21h12M25 16h11" stroke="#8A5218" strokeWidth="1.2" />
      <circle cx="16" cy="28" r="1.2" fill="#E8B25C" />
      <circle cx="31" cy="22" r="1.2" fill="#E8B25C" />
    </g>
  ),
  almonds: (
    <g>
      <path d="M24 6c8 7 11 18 6 30-4 7-12 7-15 0-4-12 0-23 9-30z" fill="#B9763F" />
      <path d="M24 9c-1 9-1 18 0 28" stroke="#8C5427" strokeWidth="1.3" fill="none" />
      <path d="M19 16q-2 8 0 16M29 16q2 8 0 16" stroke="#9A5F2F" strokeWidth=".9" fill="none" />
    </g>
  ),
  cashews: (
    <g>
      <path d="M33 9c-10-2-21 5-22 16-1 9 6 15 13 14 4-1 5-5 2-7-5-2-6-7-3-11 3-4 9-4 12-2 3 1 5-1 4-4-1-3-3-5-6-6z" fill="#EBD3A6" stroke="#C9A877" strokeWidth="1.2" />
      <path d="M16 23q2-8 12-11" stroke="#D4B582" strokeWidth="1" fill="none" />
    </g>
  ),
  peanuts: (
    <g>
      <path d="M17 8c6-1 10 4 9 9-1 3-1 5 1 7 4 4 4 11-2 14-6 3-12-1-12-7 0-3 2-5 2-8 0-2-3-4-3-8 1-4 2-6 5-7z" fill="#D2A26A" />
      <path d="M13 14h11M12 20h10M13 30h13M14 35h10" stroke="#B07E45" strokeWidth=".9" />
      <ellipse cx="34" cy="31" rx="6" ry="8" fill="#E6C18C" />
      <ellipse cx="34" cy="31" rx="1.5" ry="6" fill="#C9A06A" />
    </g>
  ),
  pistachios: (
    <g>
      <path d="M10 26c2-9 13-15 22-10 6 3 7 10 2 14-6 6-20 6-24-4z" fill="#E7D6B3" stroke="#C9B38A" strokeWidth="1" />
      <path d="M16 23c4-5 11-6 15-2 2 3 0 6-4 7-5 1-11 0-11-5z" fill="#8DB04A" />
      <path d="M18 23c3-2 7-3 10-1" stroke="#6E8F33" strokeWidth="1" fill="none" />
      <path d="M12 25c3-5 9-8 15-7" stroke="#B9A27A" strokeWidth="1" fill="none" />
    </g>
  ),
  hazelnuts: (
    <g>
      <path d="M24 9c9 0 14 8 13 17-1 8-7 13-13 13s-12-5-13-13c-1-9 4-17 13-17z" fill="#9A5B2E" />
      <path d="M14 15c3-4 7-6 10-6s7 2 10 6c-6-2-14-2-20 0z" fill="#D9B58C" />
      <path d="M17 22q-1 8 3 13M31 22q1 8-3 13" stroke="#7A4420" strokeWidth="1" fill="none" />
      <ellipse cx="20" cy="22" rx="2.5" ry="4" fill="#C08050" opacity=".5" />
    </g>
  ),
  pumpkin: (
    <g>
      {[
        [17, 22, -25],
        [31, 26, 20],
      ].map(([x, y, r], i) => (
        <g key={i} transform={`rotate(${r} ${x} ${y})`}>
          <path d={`M${x} ${y - 13}c6 4 7 14 0 26-7-12-6-22 0-26z`} fill="#5E7A3A" />
          <path d={`M${x} ${y - 10}c3 4 3 12 0 20`} stroke="#86A85A" strokeWidth="1.2" fill="none" />
        </g>
      ))}
    </g>
  ),
  sunflower: (
    <g>
      {[
        [17, 24, -20],
        [30, 23, 22],
      ].map(([x, y, r], i) => (
        <g key={i} transform={`rotate(${r} ${x} ${y})`}>
          <path d={`M${x} ${y - 13}c6 5 6 17 0 26-6-9-6-21 0-26z`} fill="#3E3B36" />
          <path d={`M${x - 2} ${y - 8}v16M${x + 2} ${y - 8}v16`} stroke="#D8D2C2" strokeWidth="1.2" />
        </g>
      ))}
    </g>
  ),
  chia: (
    <g>
      {Array.from({ length: 16 }, (_, i) => (
        <ellipse key={i} cx={10 + (i % 4) * 9 + (Math.floor(i / 4) % 2) * 4} cy={11 + Math.floor(i / 4) * 8} rx="2.6" ry="2" fill={i % 3 ? "#5D5A55" : "#B9B3A8"} />
      ))}
    </g>
  ),
  sesame: (
    <g>
      {Array.from({ length: 12 }, (_, i) => (
        <ellipse key={i} cx={11 + (i % 4) * 9} cy={13 + Math.floor(i / 4) * 10} rx="2.8" ry="4.5" transform={`rotate(${(i * 37) % 70 - 35} ${11 + (i % 4) * 9} ${13 + Math.floor(i / 4) * 10})`} fill="#EFE3C8" stroke="#C9B996" strokeWidth=".8" />
      ))}
    </g>
  ),
  millets: (
    <g>
      <path d="M24 42V12" stroke="#9C7A3A" strokeWidth="2" />
      {Array.from({ length: 8 }, (_, i) => (
        <g key={i}>
          <ellipse cx={20} cy={14 + i * 3.6} rx="3.2" ry="2.2" fill="#C9A266" />
          <ellipse cx={28} cy={15.5 + i * 3.6} rx="3.2" ry="2.2" fill="#B38E52" />
        </g>
      ))}
      {[
        [10, 40],
        [36, 38],
        [40, 42],
      ].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.4" fill="#8E3B2A" />
      ))}
    </g>
  ),
  quinoa: (
    <g>
      {Array.from({ length: 18 }, (_, i) => (
        <g key={i}>
          <circle cx={9 + (i % 6) * 6 + (Math.floor(i / 6) % 2) * 3} cy={14 + Math.floor(i / 6) * 9} r="3" fill={i % 5 === 0 ? "#B5543A" : "#E9D9B0"} stroke="#C9B588" strokeWidth=".8" />
        </g>
      ))}
    </g>
  ),
  chickpea: (
    <g>
      {[
        [17, 18],
        [31, 18],
        [24, 31],
      ].map(([x, y], i) => (
        <g key={i}>
          <circle cx={x} cy={y} r="8" fill="#E2B04A" />
          <path d={`M${x - 1} ${y - 7}q3 3 0 6`} stroke="#B9852A" strokeWidth="1.2" fill="none" />
          <circle cx={x - 2.5} cy={y - 2} r="2" fill="#F2CF7C" />
        </g>
      ))}
    </g>
  ),
  oats: (
    <g>
      {[
        [16, 17, -30],
        [31, 19, 25],
        [21, 31, 10],
        [34, 33, -20],
      ].map(([x, y, r], i) => (
        <g key={i} transform={`rotate(${r} ${x} ${y})`}>
          <ellipse cx={x} cy={y} rx="8" ry="5" fill="#D8C49A" stroke="#B9A272" strokeWidth=".8" />
          <path d={`M${x - 5} ${y}h10`} stroke="#C2AA78" strokeWidth=".8" />
        </g>
      ))}
    </g>
  ),
  cocoa: (
    <g>
      <path d="M8 38c3-9 9-13 16-13s13 4 16 13z" fill="#4A2A1E" />
      <ellipse cx="24" cy="38" rx="16" ry="3" fill="#3A1F15" />
      <ellipse cx="24" cy="15" rx="6" ry="9" fill="#7A3E22" />
      <path d="M24 6v18M20 8q-1 7 0 14M28 8q1 7 0 14" stroke="#5A2A16" strokeWidth="1" fill="none" />
    </g>
  ),
  coffee: (
    <g>
      {[
        [17, 22, -25],
        [31, 26, 25],
      ].map(([x, y, r], i) => (
        <g key={i} transform={`rotate(${r} ${x} ${y})`}>
          <ellipse cx={x} cy={y} rx="8" ry="11" fill="#3B2418" />
          <path d={`M${x} ${y - 10}c-3 6 3 14 0 20`} stroke="#1E110A" strokeWidth="1.6" fill="none" />
          <ellipse cx={x - 3} cy={y - 4} rx="1.6" ry="3" fill="#6B4A36" opacity=".6" />
        </g>
      ))}
    </g>
  ),
  vanilla: (
    <g>
      {[0, 1].map((i) => (
        <path key={i} d={`M${12 + i * 8} 40c-2-10 6-24 18-32`} stroke="#2E1F16" strokeWidth="4" strokeLinecap="round" fill="none" />
      ))}
      <path d="M33 11c4-3 8-2 9 1-3 1-6 2-9-1z" fill="#E8DEB8" />
      <path d="M38 8c3 1 4 4 3 6" stroke="#C9B57A" strokeWidth="1" fill="none" />
    </g>
  ),
  orange: (
    <g>
      <circle cx="24" cy="24" r="17" fill="#F28C1C" />
      <circle cx="24" cy="24" r="14" fill="#FBB040" />
      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return <path key={i} d={`M24 24L${24 + Math.cos(a) * 13.5} ${24 + Math.sin(a) * 13.5}`} stroke="#FFE2A6" strokeWidth="1.6" />;
      })}
      <circle cx="24" cy="24" r="2" fill="#FFE2A6" />
    </g>
  ),
  ginger: (
    <g>
      <path d="M8 30c2-6 8-6 11-4 1-5 6-8 10-5 3-4 9-4 11 1 3 6-2 11-8 10-2 4-8 5-11 1-4 3-11 3-13-3z" fill="#D9B36C" stroke="#B48A45" strokeWidth="1.2" />
      <path d="M18 27q3 2 6 0M29 24q2 2 5 1" stroke="#B48A45" strokeWidth="1" fill="none" />
      <circle cx="13" cy="31" r="1.5" fill="#F2DDA8" />
    </g>
  ),
  coconut: (
    <g>
      <path d="M6 30a18 18 0 0 1 36 0z" fill="#5A3A22" />
      <path d="M9 30a15 15 0 0 1 30 0z" fill="#F5F1E8" />
      <ellipse cx="24" cy="31" rx="18" ry="3" fill="#4A2E1A" />
      {[
        [14, 38],
        [22, 41],
        [31, 38],
        [37, 42],
      ].map(([x, y], i) => (
        <rect key={i} x={x} y={y} width="5" height="2" rx="1" fill="#F5F1E8" stroke="#D9D2C2" strokeWidth=".6" />
      ))}
    </g>
  ),
  mint: (
    <g>
      <path d="M24 42V20" stroke="#2E6B30" strokeWidth="2" />
      <path d="M24 22c-10-1-15-8-13-15 8-1 14 5 13 15z" fill="#3E8E41" />
      <path d="M24 26c10-1 15-8 13-15-8-1-14 5-13 15z" fill="#4CAF50" />
      <path d="M24 22c-5-3-8-7-10-12M24 26c5-3 8-7 10-12" stroke="#2E6B30" strokeWidth="1" fill="none" />
    </g>
  ),
  chilli: (
    <g>
      <path d="M33 10c-3 0-4 3-4 5-1 9-8 18-19 23 13 2 25-7 26-21 0-3-1-6-3-7z" fill="#C62828" />
      <path d="M32 11c1-4 4-5 6-4" stroke="#2E7D32" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M30 17c-1 7-6 13-14 18" stroke="#E57373" strokeWidth="1.4" fill="none" />
    </g>
  ),
  lime: (
    <g>
      <ellipse cx="22" cy="24" rx="14" ry="12" fill="#7CB342" />
      <circle cx="30" cy="28" r="10" fill="#8BC34A" />
      <circle cx="30" cy="28" r="8" fill="#DCEDC8" />
      {Array.from({ length: 6 }, (_, i) => {
        const a = (i / 6) * Math.PI * 2;
        return <path key={i} d={`M30 28L${30 + Math.cos(a) * 7.5} ${28 + Math.sin(a) * 7.5}`} stroke="#8BC34A" strokeWidth="1.3" />;
      })}
    </g>
  ),
  tamarind: (
    <g>
      <path d="M8 30c3-6 8-4 11-8 3-5 8-6 12-3 4 3 9 1 11 4-1 5-6 7-10 5-4 4-9 5-13 3-4 3-10 4-11-1z" fill="#6D3B1F" />
      <path d="M12 29c4-2 6-5 9-6M24 22c3 0 6 1 9 0" stroke="#9A6038" strokeWidth="1.2" fill="none" />
      {[16, 24, 31].map((x, i) => (
        <circle key={i} cx={x} cy={25 + (i % 2)} r="1.5" fill="#B07850" />
      ))}
    </g>
  ),
  spices: (
    <g>
      <path d="M8 38c3-8 9-12 16-12s13 4 16 12z" fill="#B5541E" />
      <ellipse cx="24" cy="38" rx="16" ry="3" fill="#8A3A12" />
      <circle cx="16" cy="16" r="5" fill="#D9A23A" />
      <path d="M26 10l4 8M30 10l-4 8" stroke="#6B3A1E" strokeWidth="2" strokeLinecap="round" />
      <circle cx="36" cy="16" r="3" fill="#2B2B2B" />
    </g>
  ),
  salt: (
    <g>
      {[
        [14, 26],
        [24, 18],
        [33, 28],
        [22, 33],
      ].map(([x, y], i) => (
        <rect key={i} x={x - 5} y={y - 5} width="10" height="10" rx="1.5" transform={`rotate(${i * 17} ${x} ${y})`} fill="#F4F6F8" stroke="#C9D1D8" strokeWidth="1" />
      ))}
    </g>
  ),
  sunoil: (
    <g>
      <rect x="20" y="6" width="8" height="5" rx="1" fill="#2E7D32" />
      <path d="M19 11h10l3 6v21a3 3 0 0 1-3 3H19a3 3 0 0 1-3-3V17z" fill="#F2C94C" opacity=".9" />
      <rect x="18" y="22" width="12" height="9" rx="1.5" fill="#FFFFFF" />
      <circle cx="24" cy="26.5" r="3" fill="#F2A900" />
    </g>
  ),
  oliveoil: (
    <g>
      <rect x="21" y="5" width="6" height="5" rx="1" fill="#2B2B2B" />
      <path d="M21 10h6v6l4 5v18a3 3 0 0 1-3 3h-8a3 3 0 0 1-3-3V21l4-5z" fill="#9AA63A" opacity=".9" />
      <ellipse cx="24" cy="29" rx="3" ry="4.5" fill="#556B2F" />
    </g>
  ),
  sugar: (
    <g>
      {[
        [15, 28],
        [27, 22],
        [33, 33],
        [20, 16],
      ].map(([x, y], i) => (
        <g key={i}>
          <rect x={x - 6} y={y - 6} width="12" height="12" rx="1.5" fill="#FFFFFF" stroke="#C9CED3" strokeWidth="1.2" />
          <path d={`M${x - 6} ${y - 6}l3-3h12l-3 3`} fill="#EEF1F3" stroke="#C9CED3" strokeWidth=".8" />
        </g>
      ))}
    </g>
  ),
  palm: (
    <g>
      <rect x="12" y="10" width="24" height="30" rx="3" fill="#E07B12" />
      <rect x="12" y="10" width="24" height="5" rx="2" fill="#9A4F0A" />
      <path d="M24 18c-5 4-6 9-3 12 4 2 7-1 6-5" fill="#FFD27A" />
      <path d="M18 34h12" stroke="#FFFFFF" strokeWidth="2" />
    </g>
  ),
  maida: (
    <g>
      <path d="M12 14c0-3 3-5 6-4l12 0c3-1 6 1 6 4l2 24a3 3 0 0 1-3 3H13a3 3 0 0 1-3-3z" fill="#FFFFFF" stroke="#C9CED3" strokeWidth="1.2" />
      <path d="M14 10l3 4h14l3-4" stroke="#C9CED3" strokeWidth="1.2" fill="none" />
      <rect x="15" y="22" width="18" height="8" rx="1" fill="#E6E9EC" />
      <path d="M17 26h14" stroke="#9AA3AB" strokeWidth="1.5" />
    </g>
  ),
};

export function IngredientIcon({ id, size = 28, title }: { id: string; size?: number; title?: string }) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      {P[id] ?? <circle cx="24" cy="24" r="14" fill="#C9B9A6" />}
    </svg>
  );
}
