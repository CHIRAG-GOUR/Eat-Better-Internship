"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { Canvas, useThree, type ThreeEvent } from "@react-three/fiber";
import { CameraControls, RoundedBox } from "@react-three/drei";
import { Human, type HumanLook } from "@/components/world2/Human";
import { SKU_IDS, type SkuId } from "./data";

export type BusinessFocus = "overview" | "pricing" | "finance" | "competitor" | "budget" | "growth" | "pitch";

const VIEWS: Record<BusinessFocus, { pos: [number, number, number]; look: [number, number, number] }> = {
  overview: { pos: [0, 8.8, 13.5], look: [0, 1.4, -1.2] },
  pricing: { pos: [4.8, 3.4, 5.8], look: [6.8, 1.4, 0.4] },
  finance: { pos: [-4.6, 3.2, 5.6], look: [-8.2, 1.8, 0.6] },
  competitor: { pos: [-5.8, 3.0, 0.8], look: [-11.5, 2.4, -4.5] },
  budget: { pos: [0, 5.2, 4.2], look: [0, 1.2, -2.8] },
  growth: { pos: [5.8, 3.6, -1.2], look: [10.5, 1.6, -5.8] },
  pitch: { pos: [0, 2.8, 1.8], look: [0, 1.8, -8.2] },
};

const hover = (on: boolean) => (e: ThreeEvent<PointerEvent>) => {
  e.stopPropagation();
  document.body.style.cursor = on ? "pointer" : "";
};

function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d")!;
  draw(ctx);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}

function StationSign({
  text,
  sub,
  position,
  rotation,
  w = 2.4,
  h = 0.6,
  onClick,
}: {
  text: string;
  sub?: string;
  position: [number, number, number];
  rotation?: [number, number, number];
  w?: number;
  h?: number;
  onClick?: () => void;
}) {
  const tex = useMemo(
    () =>
      canvasTex(768, Math.round((768 * h) / w), (g) => {
        const H = g.canvas.height;
        g.fillStyle = "#2F1C1A";
        g.fillRect(0, 0, 768, H);
        g.fillStyle = "#E86127";
        g.fillRect(0, 0, 16, H);
        g.fillStyle = "#FED300";
        g.textAlign = "center";
        g.textBaseline = "middle";
        g.font = `800 ${sub ? H * 0.42 : H * 0.55}px sans-serif`;
        g.fillText(text, 392, sub ? H * 0.38 : H / 2, 720);
        if (sub) {
          g.font = `600 ${H * 0.28}px sans-serif`;
          g.fillStyle = "#FFFFFF";
          g.fillText(sub, 392, H * 0.76, 720);
        }
      }),
    [text, sub, w, h],
  );

  useEffect(() => () => tex.dispose(), [tex]);

  return (
    <mesh
      position={position}
      rotation={rotation}
      onClick={(e) => {
        e.stopPropagation();
        onClick?.();
      }}
      onPointerOver={hover(true)}
      onPointerOut={hover(false)}
    >
      <planeGeometry args={[w, h]} />
      <meshBasicMaterial map={tex} toneMapped={false} />
    </mesh>
  );
}

/* ── Camera Rig ───────────────────────────────────────────────────────── */

function CameraRig({ focus }: { focus: BusinessFocus }) {
  const ref = useRef<CameraControls>(null);
  const { size } = useThree();

  useEffect(() => {
    const v = VIEWS[focus];
    const portrait = size.width < size.height;
    const look = new THREE.Vector3(...v.look);
    const dir = new THREE.Vector3(...v.pos).sub(look).multiplyScalar(portrait ? 1.45 : 1.05);
    const right = new THREE.Vector3().crossVectors(dir.clone().negate(), new THREE.Vector3(0, 1, 0)).normalize();
    const shift = portrait ? 0 : dir.length() * 0.22;
    const p = look.clone().add(dir).addScaledVector(right, shift);
    const l = look.clone().addScaledVector(right, shift);
    ref.current?.setLookAt(p.x, p.y, p.z, l.x, l.y, l.z, true);
  }, [focus, size.width, size.height]);

  return <CameraControls ref={ref} minDistance={2} maxDistance={28} maxPolarAngle={Math.PI / 2.05} smoothTime={0.7} />;
}

/* ── Architectural Suite Shell ────────────────────────────────────────── */

function SuiteArchitecture() {
  const floorTex = useMemo(
    () =>
      canvasTex(512, 512, (g) => {
        g.fillStyle = "#DFCBB9";
        g.fillRect(0, 0, 512, 512);
        g.strokeStyle = "#C9B29E";
        g.lineWidth = 2;
        for (let x = 0; x < 512; x += 64) {
          g.beginPath();
          g.moveTo(x, 0);
          g.lineTo(x, 512);
          g.stroke();
        }
        for (let y = 0; y < 512; y += 128) {
          g.beginPath();
          g.moveTo(0, y);
          g.lineTo(512, y);
          g.stroke();
        }
      }),
    [],
  );

  useEffect(() => () => floorTex.dispose(), [floorTex]);

  return (
    <group>
      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[34, 26]} />
        <meshStandardMaterial map={floorTex} roughness={0.3} metalness={0.05} />
      </mesh>

      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 5.6, 0]}>
        <planeGeometry args={[34, 26]} />
        <meshStandardMaterial color="#F4EFEA" roughness={0.9} />
      </mesh>

      {/* Back Wall with Acoustic Wood Paneling */}
      <mesh position={[0, 2.8, -12]} receiveShadow>
        <planeGeometry args={[34, 5.6]} />
        <meshStandardMaterial color="#FAF6F0" roughness={0.8} />
      </mesh>

      {/* Feature Wood Slats */}
      <group position={[0, 2.8, -11.95]}>
        {Array.from({ length: 48 }).map((_, i) => (
          <mesh key={i} position={[(i - 23.5) * 0.4, 0, 0]}>
            <boxGeometry args={[0.08, 5.6, 0.04]} />
            <meshStandardMaterial color="#966035" roughness={0.6} />
          </mesh>
        ))}
      </group>

      {/* Left Wall (Competitor & Financial display) */}
      <mesh position={[-16, 2.8, 0]} rotation={[0, Math.PI / 2, 0]} receiveShadow>
        <planeGeometry args={[26, 5.6]} />
        <meshStandardMaterial color="#F7F2EC" roughness={0.8} />
      </mesh>

      {/* Right Wall (Panoramic Window Glass looking out) */}
      <group position={[16, 2.8, 0]} rotation={[0, -Math.PI / 2, 0]}>
        <mesh>
          <planeGeometry args={[26, 5.6]} />
          <meshPhysicalMaterial color="#E8F4F8" transmission={0.7} roughness={0.1} thickness={0.5} transparent opacity={0.6} />
        </mesh>
        {[-8, -4, 0, 4, 8].map((x) => (
          <mesh key={x} position={[x, 0, 0.05]}>
            <boxGeometry args={[0.15, 5.6, 0.1]} />
            <meshStandardMaterial color="#2F1C1A" roughness={0.4} />
          </mesh>
        ))}
      </group>
    </group>
  );
}

/* ── Executive Video Wall ─────────────────────────────────────────────── */

function ExecutiveVideoWall({ onPick }: { onPick?: () => void }) {
  const tex = useMemo(
    () =>
      canvasTex(1024, 512, (g) => {
        g.fillStyle = "#1E1210";
        g.fillRect(0, 0, 1024, 512);

        g.fillStyle = "#E86127";
        g.fillRect(0, 0, 1024, 60);
        g.fillStyle = "#FFFFFF";
        g.font = "bold 28px sans-serif";
        g.fillText("EAT BETTER CO — EXECUTIVE STRATEGY SUITE", 40, 42);

        g.font = "18px sans-serif";
        g.fillStyle = "#C8B6A6";
        g.fillText("Pre-Series A Scale & Expansion · Prath Ventures & Spring Marketing Capital", 40, 95);

        // KPI Card 1
        g.fillStyle = "#2A1B18";
        g.roundRect(40, 120, 280, 160, 16);
        g.fill();
        g.fillStyle = "#E86127";
        g.font = "bold 16px sans-serif";
        g.fillText("FY24 REVENUE", 60, 155);
        g.fillStyle = "#FFFFFF";
        g.font = "bold 44px sans-serif";
        g.fillText("Rs 14.7 Cr", 60, 215);
        g.fillStyle = "#4ADE80";
        g.font = "bold 18px sans-serif";
        g.fillText("+165% YoY Growth", 60, 255);

        // KPI Card 2
        g.fillStyle = "#2A1B18";
        g.roundRect(360, 120, 280, 160, 16);
        g.fill();
        g.fillStyle = "#E86127";
        g.font = "bold 16px sans-serif";
        g.fillText("MONTHLY VOLUME", 380, 155);
        g.fillStyle = "#FFFFFF";
        g.font = "bold 44px sans-serif";
        g.fillText("2,00,000+", 380, 215);
        g.fillStyle = "#FDBA74";
        g.font = "bold 18px sans-serif";
        g.fillText("Orders / Month", 380, 255);

        // KPI Card 3
        g.fillStyle = "#2A1B18";
        g.roundRect(680, 120, 300, 160, 16);
        g.fill();
        g.fillStyle = "#E86127";
        g.font = "bold 16px sans-serif";
        g.fillText("CENTRAL FACILITY", 700, 155);
        g.fillStyle = "#FFFFFF";
        g.font = "bold 44px sans-serif";
        g.fillText("50,000 sq.ft", 700, 215);
        g.fillStyle = "#93C5FD";
        g.font = "bold 18px sans-serif";
        g.fillText("Jaipur Manufacturing Hub", 700, 255);

        // Bottom graph
        g.strokeStyle = "#E86127";
        g.lineWidth = 4;
        g.beginPath();
        g.moveTo(60, 440);
        g.bezierCurveTo(240, 420, 500, 360, 960, 320);
        g.stroke();

        g.fillStyle = "#E86127";
        g.font = "bold 16px sans-serif";
        g.fillText("Revenue Scalability Path (FY23: Rs 5.5 Cr -> FY24: Rs 14.7 Cr -> Headroom to Rs 50 Cr+)", 60, 480);
      }),
    [],
  );

  useEffect(() => () => tex.dispose(), [tex]);

  return (
    <group
      position={[0, 3.2, -11.75]}
      onClick={(e) => {
        e.stopPropagation();
        onPick?.();
      }}
      onPointerOver={hover(true)}
      onPointerOut={hover(false)}
    >
      <mesh>
        <planeGeometry args={[7.2, 3.8]} />
        <meshBasicMaterial color="#110B0A" />
      </mesh>
      <mesh position={[0, 0, 0.02]}>
        <planeGeometry args={[7.0, 3.6]} />
        <meshBasicMaterial map={tex} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ── Boardroom Table & Seating ─────────────────────────────────────────── */

function BoardroomTable({ onPick }: { onPick?: () => void }) {
  return (
    <group
      position={[0, 0, -4.5]}
      onClick={(e) => {
        e.stopPropagation();
        onPick?.();
      }}
      onPointerOver={hover(true)}
      onPointerOut={hover(false)}
    >
      <StationSign text="PITCH & BOARDROOM" sub="Tap to enter investor due diligence" position={[0, 2.6, 0]} w={3.0} h={0.7} onClick={onPick} />

      {/* Walnut Tabletop */}
      <RoundedBox args={[5.2, 0.12, 2.4]} radius={0.06} smoothness={4} position={[0, 0.95, 0]} castShadow receiveShadow>
        <meshStandardMaterial color="#3A221E" roughness={0.3} metalness={0.1} />
      </RoundedBox>

      {/* Brass Table Legs */}
      {[-2, 2].map((x) => (
        <mesh key={x} position={[x, 0.48, 0]} castShadow>
          <cylinderGeometry args={[0.08, 0.12, 0.96, 16]} />
          <meshStandardMaterial color="#C59B27" roughness={0.3} metalness={0.8} />
        </mesh>
      ))}

      {/* Laptops */}
      {[-1.6, 0, 1.6].map((x, i) => (
        <group key={x} position={[x, 1.02, i % 2 === 0 ? 0.6 : -0.6]} rotation={[0, i % 2 === 0 ? 0 : Math.PI, 0]}>
          <mesh position={[0, 0.01, 0]}>
            <boxGeometry args={[0.36, 0.01, 0.26]} />
            <meshStandardMaterial color="#94A3B8" roughness={0.2} metalness={0.9} />
          </mesh>
          <mesh position={[0, 0.12, -0.13]} rotation={[-0.3, 0, 0]}>
            <boxGeometry args={[0.36, 0.24, 0.01]} />
            <meshStandardMaterial color="#1E293B" roughness={0.2} metalness={0.5} />
          </mesh>
        </group>
      ))}

      {/* Chairs */}
      {[-1.8, -0.6, 0.6, 1.8].map((x) => (
        <group key={`north-${x}`} position={[x, 0, -1.6]}>
          <mesh position={[0, 0.55, 0]} castShadow>
            <cylinderGeometry args={[0.26, 0.26, 0.08, 16]} />
            <meshStandardMaterial color="#2F1C1A" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.95, -0.22]} castShadow>
            <boxGeometry args={[0.45, 0.6, 0.08]} />
            <meshStandardMaterial color="#2F1C1A" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.5, 8]} />
            <meshStandardMaterial color="#64748B" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      ))}

      {[-1.8, -0.6, 0.6, 1.8].map((x) => (
        <group key={`south-${x}`} position={[x, 0, 1.6]} rotation={[0, Math.PI, 0]}>
          <mesh position={[0, 0.55, 0]} castShadow>
            <cylinderGeometry args={[0.26, 0.26, 0.08, 16]} />
            <meshStandardMaterial color="#2F1C1A" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.95, -0.22]} castShadow>
            <boxGeometry args={[0.45, 0.6, 0.08]} />
            <meshStandardMaterial color="#2F1C1A" roughness={0.5} />
          </mesh>
          <mesh position={[0, 0.25, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.5, 8]} />
            <meshStandardMaterial color="#64748B" metalness={0.8} roughness={0.2} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ── Product Pricing Display (Right) ──────────────────────────────────── */

function ProductPricingDisplay({
  selectedSku,
  onPickSku,
  onFocusPricing,
}: {
  selectedSku: SkuId;
  onPickSku: (id: SkuId) => void;
  onFocusPricing?: () => void;
}) {
  const colors: Record<SkuId, string> = {
    l24: "#E86127",
    l42: "#D946EF",
    usb: "#0EA5E9",
    nam: "#F59E0B",
  };

  return (
    <group position={[7.5, 0, 1.5]}>
      <StationSign
        text="PRODUCT PRICING & BOM"
        sub="Tap to inspect SKU economics"
        position={[0, 2.6, 0]}
        rotation={[0, -Math.PI / 6, 0]}
        w={2.8}
        h={0.65}
        onClick={onFocusPricing}
      />

      {/* Plinth Base */}
      <mesh
        position={[0, 0.45, 0]}
        receiveShadow
        castShadow
        onClick={(e) => {
          e.stopPropagation();
          onFocusPricing?.();
        }}
        onPointerOver={hover(true)}
        onPointerOut={hover(false)}
      >
        <boxGeometry args={[4.2, 0.9, 2.2]} />
        <meshStandardMaterial color="#FAF6F0" roughness={0.4} />
      </mesh>

      {/* 4 Floating Product Pedestals */}
      {SKU_IDS.map((id, i) => {
        const x = (i - 1.5) * 0.95;
        const active = selectedSku === id;
        return (
          <group
            key={id}
            position={[x, 0.9, 0]}
            onClick={(e) => {
              e.stopPropagation();
              onPickSku(id);
            }}
            onPointerOver={hover(true)}
            onPointerOut={hover(false)}
          >
            <mesh position={[0, 0.02, 0]}>
              <cylinderGeometry args={[0.38, 0.4, 0.04, 24]} />
              <meshStandardMaterial color={active ? "#E86127" : "#E2D9CE"} roughness={0.3} />
            </mesh>
            <RoundedBox args={[0.5, 0.25, 0.45]} radius={0.03} smoothness={3} position={[0, 0.2, 0]} castShadow>
              <meshStandardMaterial color={colors[id]} roughness={0.4} />
            </RoundedBox>
            {active && (
              <mesh position={[0, 0.35, 0]}>
                <sphereGeometry args={[0.45, 16, 16]} />
                <meshBasicMaterial color="#E86127" wireframe transparent opacity={0.3} />
              </mesh>
            )}
          </group>
        );
      })}
    </group>
  );
}

/* ── Financial Workstation (Left) ─────────────────────────────────────── */

function FinancialWorkstation({ onPick }: { onPick?: () => void }) {
  const chartTex = useMemo(
    () =>
      canvasTex(512, 384, (g) => {
        g.fillStyle = "#161110";
        g.fillRect(0, 0, 512, 384);
        g.fillStyle = "#4ADE80";
        g.font = "bold 20px sans-serif";
        g.fillText("UNIT CONTRIBUTION & SG&A WATERFALL", 20, 35);

        g.strokeStyle = "#443430";
        g.lineWidth = 2;
        g.beginPath();
        g.moveTo(40, 320);
        g.lineTo(480, 320);
        g.stroke();

        const bars = [
          { l: "AOV", h: 220, c: "#E86127" },
          { l: "COGS", h: 90, c: "#EF4444" },
          { l: "Ship", h: 45, c: "#F97316" },
          { l: "Comm", h: 32, c: "#FBBF24" },
          { l: "CAC", h: 50, c: "#A855F7" },
          { l: "Margin", h: 38, c: "#10B981" },
        ];
        bars.forEach((b, i) => {
          const bx = 60 + i * 70;
          g.fillStyle = b.c;
          g.fillRect(bx, 320 - b.h, 45, b.h);
          g.fillStyle = "#FFFFFF";
          g.font = "13px sans-serif";
          g.fillText(b.l, bx + 5, 345);
        });
      }),
    [],
  );

  useEffect(() => () => chartTex.dispose(), [chartTex]);

  return (
    <group
      position={[-9.5, 0, 2.5]}
      rotation={[0, 0.4, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onPick?.();
      }}
      onPointerOver={hover(true)}
      onPointerOut={hover(false)}
    >
      <StationSign
        text="FINANCIAL WORKSTATION"
        sub="Tap to view unit economics waterfall"
        position={[0, 2.6, 0]}
        w={2.8}
        h={0.65}
        onClick={onPick}
      />

      <RoundedBox args={[3.6, 0.1, 1.6]} radius={0.04} position={[0, 0.95, 0]} castShadow>
        <meshStandardMaterial color="#EAE3D9" roughness={0.4} />
      </RoundedBox>
      <mesh position={[-1.6, 0.48, 0]}>
        <boxGeometry args={[0.08, 0.96, 1.4]} />
        <meshStandardMaterial color="#332420" />
      </mesh>
      <mesh position={[1.6, 0.48, 0]}>
        <boxGeometry args={[0.08, 0.96, 1.4]} />
        <meshStandardMaterial color="#332420" />
      </mesh>

      {/* Dual Screens */}
      <group position={[0, 1.5, -0.3]}>
        <mesh position={[-0.7, 0, 0]} rotation={[0, 0.25, 0]}>
          <planeGeometry args={[1.3, 0.8]} />
          <meshBasicMaterial map={chartTex} toneMapped={false} />
        </mesh>
        <mesh position={[0.7, 0, 0]} rotation={[0, -0.25, 0]}>
          <planeGeometry args={[1.3, 0.8]} />
          <meshStandardMaterial color="#1E1917" roughness={0.2} />
        </mesh>
      </group>
    </group>
  );
}

/* ── Jaipur 50,000 sq. ft. Hub Architectural Model ────────────────────── */

function JaipurFacilityModel({ onPick }: { onPick?: () => void }) {
  return (
    <group
      position={[10.5, 0, -5.5]}
      onClick={(e) => {
        e.stopPropagation();
        onPick?.();
      }}
      onPointerOver={hover(true)}
      onPointerOut={hover(false)}
    >
      <StationSign
        text="JAIPUR 50,000 SQ. FT. HUB"
        sub="Tap to plan capacity & expansion"
        position={[0, 2.6, 0]}
        rotation={[0, -Math.PI / 4, 0]}
        w={3.0}
        h={0.7}
        onClick={onPick}
      />

      {/* Lit Pedestal */}
      <mesh position={[0, 0.5, 0]} receiveShadow castShadow>
        <cylinderGeometry args={[2.0, 2.2, 1.0, 32]} />
        <meshStandardMaterial color="#F5EFE6" roughness={0.3} />
      </mesh>

      {/* Glass Showcase Cover */}
      <mesh position={[0, 1.6, 0]}>
        <boxGeometry args={[3.0, 1.2, 2.4]} />
        <meshPhysicalMaterial color="#FFFFFF" transmission={0.9} roughness={0.1} transparent opacity={0.3} />
      </mesh>

      {/* Architectural Mini Hub Building */}
      <group position={[0, 1.05, 0]}>
        <RoundedBox args={[2.2, 0.45, 1.6]} radius={0.04} position={[0, 0.22, 0]} castShadow>
          <meshStandardMaterial color="#FFFFFF" roughness={0.3} />
        </RoundedBox>
        <mesh position={[0, 0.46, 0]}>
          <boxGeometry args={[1.8, 0.04, 1.2]} />
          <meshStandardMaterial color="#1E293B" metalness={0.7} roughness={0.2} />
        </mesh>
        {[-0.6, 0, 0.6].map((x) => (
          <mesh key={x} position={[x, 0.12, 0.81]}>
            <boxGeometry args={[0.35, 0.24, 0.04]} />
            <meshStandardMaterial color="#E86127" />
          </mesh>
        ))}
        <mesh position={[0, 0.38, 0.82]}>
          <boxGeometry args={[1.2, 0.08, 0.02]} />
          <meshStandardMaterial color="#2F1C1A" />
        </mesh>
      </group>
    </group>
  );
}

/* ── Competitor Intelligence Wall ─────────────────────────────────────── */

function CompetitorIntelligenceWall({ onPick }: { onPick?: () => void }) {
  const wallTex = useMemo(
    () =>
      canvasTex(512, 512, (g) => {
        g.fillStyle = "#F5EFEB";
        g.fillRect(0, 0, 512, 512);

        g.fillStyle = "#2F1C1A";
        g.font = "bold 24px sans-serif";
        g.fillText("COMPETITIVE POSITIONING MATRIX", 30, 45);

        g.strokeStyle = "#8A7669";
        g.lineWidth = 3;
        g.beginPath();
        g.moveTo(50, 270);
        g.lineTo(460, 270);
        g.moveTo(256, 70);
        g.lineTo(256, 470);
        g.stroke();

        g.fillStyle = "#6B584C";
        g.font = "bold 14px sans-serif";
        g.fillText("Clean-Label / Whole Food ->", 280, 295);
        g.fillText("<- Mass Market / Fried", 60, 295);
        g.fillText("Familiar Indian Indulgence ^", 265, 95);
        g.fillText("Niche / Western Formats v", 265, 460);

        // Eat Better: Top Right
        g.fillStyle = "#E86127";
        g.beginPath();
        g.arc(390, 150, 16, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = "#FFFFFF";
        g.font = "bold 12px sans-serif";
        g.fillText("EAT BETTER", 350, 185);

        // Haldiram's / Bikaji: Top Left
        g.fillStyle = "#B91C1C";
        g.beginPath();
        g.arc(120, 160, 14, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = "#2F1C1A";
        g.fillText("Haldiram's / Bikaji", 80, 190);

        // Yoga Bar / Health: Bottom Right
        g.fillStyle = "#2563EB";
        g.beginPath();
        g.arc(380, 380, 14, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = "#2F1C1A";
        g.fillText("Yoga Bar / True Elements", 300, 410);

        // Local Mithai: Middle Top Left
        g.fillStyle = "#D97706";
        g.beginPath();
        g.arc(170, 120, 12, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = "#2F1C1A";
        g.fillText("Local Sweet Shops", 110, 105);
      }),
    [],
  );

  useEffect(() => () => wallTex.dispose(), [wallTex]);

  return (
    <group
      position={[-15.9, 2.8, -4.5]}
      rotation={[0, Math.PI / 2, 0]}
      onClick={(e) => {
        e.stopPropagation();
        onPick?.();
      }}
      onPointerOver={hover(true)}
      onPointerOut={hover(false)}
    >
      <mesh>
        <planeGeometry args={[5.2, 3.6]} />
        <meshBasicMaterial map={wallTex} toneMapped={false} />
      </mesh>
    </group>
  );
}

/* ── 3D Executive Team ────────────────────────────────────────────────── */

const EXECUTIVES: HumanLook[] = [
  {
    skin: "#D29A74",
    hair: "#1E1815",
    hairStyle: "side",
    outfit: "shirt",
    top: "#FFFFFF",
    bottom: "#1E293B",
    accent: "#E86127",
    shoe: "#2F1C1A",
    glasses: "#2F1C1A",
  },
  {
    skin: "#B87F56",
    hair: "#151210",
    hairStyle: "bun",
    outfit: "salwar",
    top: "#E86127",
    bottom: "#FFFFFF",
    accent: "#C59B27",
    shoe: "#FAF6F0",
    bindi: true,
  },
  {
    skin: "#C68E65",
    hair: "#201B17",
    hairStyle: "short",
    outfit: "shirt",
    top: "#38BDF8",
    bottom: "#334155",
    shoe: "#1E1E1E",
  },
];

/* ── Master 3D Scene ──────────────────────────────────────────────────── */

export type Business3DProps = {
  focus: BusinessFocus;
  selectedSku: SkuId;
  onPickSku: (id: SkuId) => void;
  onSelectFocus?: (f: BusinessFocus) => void;
};

export default function Business3D({ focus, selectedSku, onPickSku, onSelectFocus }: Business3DProps) {
  return (
    <Canvas
      shadows
      dpr={[1, 1.6]}
      camera={{ position: VIEWS.overview.pos, fov: 42 }}
      gl={{ antialias: true }}
      onPointerMissed={() => (document.body.style.cursor = "")}
    >
      <color attach="background" args={["#EDE8E2"]} />
      <fog attach="fog" args={["#EDE8E2", 22, 42]} />

      <hemisphereLight args={["#FFFFFF", "#968A7D", 1.1]} />
      <directionalLight
        position={[12, 16, 10]}
        intensity={1.6}
        castShadow
        shadow-mapSize={[1024, 1024]}
        shadow-camera-left={-18}
        shadow-camera-right={18}
        shadow-camera-top={14}
        shadow-camera-bottom={-14}
      />
      <pointLight position={[0, 4.5, -4.5]} intensity={0.8} color="#FFF8F0" />
      <pointLight position={[7.5, 3.5, 1.5]} intensity={0.6} color="#FFEEDD" />

      <CameraRig focus={focus} />
      <SuiteArchitecture />
      <ExecutiveVideoWall onPick={() => onSelectFocus?.("overview")} />
      <BoardroomTable onPick={() => onSelectFocus?.("pitch")} />
      <ProductPricingDisplay selectedSku={selectedSku} onPickSku={onPickSku} onFocusPricing={() => onSelectFocus?.("pricing")} />
      <FinancialWorkstation onPick={() => onSelectFocus?.("finance")} />
      <JaipurFacilityModel onPick={() => onSelectFocus?.("growth")} />
      <CompetitorIntelligenceWall onPick={() => onSelectFocus?.("competitor")} />

      {/* 3D Human Strategists */}
      <group
        position={[0, 0, -8.2]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectFocus?.("pitch");
        }}
        onPointerOver={hover(true)}
        onPointerOut={hover(false)}
      >
        <Human look={EXECUTIVES[0]} mode="stand" />
      </group>
      <group
        position={[-3.2, 0, -3.8]}
        rotation={[0, Math.PI / 3, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectFocus?.("finance");
        }}
        onPointerOver={hover(true)}
        onPointerOut={hover(false)}
      >
        <Human look={EXECUTIVES[1]} mode="stand" />
      </group>
      <group
        position={[5.2, 0, -4.8]}
        rotation={[0, -Math.PI / 4, 0]}
        onClick={(e) => {
          e.stopPropagation();
          onSelectFocus?.("growth");
        }}
        onPointerOver={hover(true)}
        onPointerOut={hover(false)}
      >
        <Human look={EXECUTIVES[2]} mode="stand" />
      </group>
    </Canvas>
  );
}
