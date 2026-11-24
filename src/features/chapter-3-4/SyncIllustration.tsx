"use client";

/**
 * Challenge 2 illustration: one central warehouse (D2C and marketplaces) feeding three hyper-local dark stores
 * (quick commerce). Each store's stock gauge shows the balancing act: too little (stockout), just right, too much
 * (over-allocation that risks shelf-life expiry). Delivery scooters run along the routes. Vector art, so it is crisp
 * at any size and every label is real text.
 */
const STORES = [
  { y: 52, fill: 0.18, color: "#D93025", tag: "Stockout risk" },
  { y: 150, fill: 0.6, color: "#00A341", tag: "Just right" },
  { y: 248, fill: 0.97, color: "#E8A400", tag: "Expiry risk" },
];

export function SyncIllustration() {
  return (
    <svg viewBox="0 0 480 300" role="img" aria-label="A central warehouse sends stock along three routes to three dark stores: one running low (stockout risk), one just right, one overfull (expiry risk)" className="h-auto w-full">
      <rect x="0" y="0" width="480" height="300" rx="18" fill="#FFF5EE" />
      {/* routes with moving scooters */}
      {STORES.map((s, i) => {
        const d = `M150 150 C 220 150, 250 ${s.y}, 292 ${s.y}`;
        return (
          <g key={i}>
            <path d={d} fill="none" stroke="#2F1C1A" strokeOpacity="0.18" strokeWidth="7" strokeLinecap="round" />
            <path d={d} fill="none" stroke="#FF5C00" strokeWidth="2.5" strokeDasharray="7 7" strokeLinecap="round">
              <animate attributeName="stroke-dashoffset" from="28" to="0" dur="1.2s" repeatCount="indefinite" />
            </path>
            <g>
              <animateMotion dur={`${2.6 + i * 0.5}s`} repeatCount="indefinite" path={d} rotate="auto" />
              <rect x="-9" y="-6" width="14" height="10" rx="2" fill="#C99A6B" stroke="#2F1C1A" strokeWidth="1.2" />
              <circle cx="-6" cy="6" r="3" fill="#2F1C1A" />
              <circle cx="7" cy="6" r="3" fill="#2F1C1A" />
              <rect x="4" y="-3" width="6" height="7" rx="1.5" fill="#FF5C00" />
            </g>
          </g>
        );
      })}
      {/* central warehouse */}
      <g transform="translate(22 82)">
        <rect x="0" y="40" width="128" height="86" rx="6" fill="#F4E4D2" stroke="#2F1C1A" strokeWidth="2" />
        <path d="M-6 44 L64 6 L134 44 Z" fill="#FF5C00" stroke="#2F1C1A" strokeWidth="2" strokeLinejoin="round" />
        <rect x="40" y="76" width="48" height="50" rx="3" fill="#FFF5EE" stroke="#2F1C1A" strokeWidth="2" />
        {[0, 1, 2].map((r) => (
          <line key={r} x1="40" x2="88" y1={88 + r * 12} y2={88 + r * 12} stroke="#2F1C1A" strokeOpacity="0.35" strokeWidth="1.5" />
        ))}
        {[[10, 56], [10, 72], [98, 56], [98, 72]].map(([x, y], k) => (
          <rect key={k} x={x} y={y} width="20" height="13" rx="2" fill="#C99A6B" stroke="#2F1C1A" strokeWidth="1.2" />
        ))}
        <text x="64" y="146" textAnchor="middle" fontSize="12.5" fontWeight="800" fill="#2F1C1A">Central warehouse</text>
        <text x="64" y="161" textAnchor="middle" fontSize="10.5" fontWeight="600" fill="#6B5B57">D2C and marketplaces</text>
      </g>
      {/* dark stores with stock gauges */}
      {STORES.map((s, i) => (
        <g key={i} transform={`translate(296 ${s.y - 30})`}>
          <rect x="0" y="12" width="58" height="46" rx="5" fill="#2F1C1A" />
          <rect x="-3" y="6" width="64" height="11" rx="3" fill="#FF5C00" />
          <rect x="8" y="24" width="20" height="34" rx="2" fill="#4A3631" />
          <rect x="33" y="24" width="18" height="14" rx="2" fill="#FED300" fillOpacity="0.85" />
          <text x="29" y="70" textAnchor="middle" fontSize="9.5" fontWeight="700" fill="#6B5B57">Dark store</text>
          {/* stock gauge */}
          <rect x="70" y="12" width="14" height="46" rx="4" fill="#ffffff" stroke="#2F1C1A" strokeWidth="1.5" />
          <rect x="72" y={14 + 42 * (1 - s.fill)} width="10" height={42 * s.fill} rx="2.5" fill={s.color}>
            <animate attributeName="height" values={`${42 * s.fill};${42 * s.fill * 0.9};${42 * s.fill}`} dur="3s" repeatCount="indefinite" />
          </rect>
          <text x="92" y="30" fontSize="10.5" fontWeight="800" fill={s.color}>{s.tag}</text>
          <text x="92" y="44" fontSize="9.5" fontWeight="600" fill="#6B5B57">{Math.round(s.fill * 100)}% full</text>
        </g>
      ))}
    </svg>
  );
}
