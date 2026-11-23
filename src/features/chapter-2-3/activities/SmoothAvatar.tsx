"use client";

import { useEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import type { Mood } from "./kit3d";

export type AvatarId = "persona" | "aman" | "neha" | "farah" | "gupta";

export type AvatarSpec = {
  id: AvatarId;
  name: string;
  role: string;
  skin: string;
  hair: string;
  hairStyle: "fade" | "bun" | "short" | "ponytail" | "senior";
  topColor: string;
  bottomColor: string;
  accentColor: string;
  shoeColor: string;
  soleColor: string;
  outfit: "sweater" | "overshirt" | "blazer" | "scrubs" | "kurta";
  accessories?: {
    headphones?: string;
    glasses?: string;
    stethoscope?: boolean;
    watch?: string;
    badge?: string;
    snackPouch?: boolean;
    folder?: string;
    pocketSquare?: string;
    moustache?: boolean;
    earrings?: boolean;
  };
  height?: number;
};

export const AVATAR_SPECS: Record<AvatarId, AvatarSpec> = {
  persona: {
    id: "persona",
    name: "The Desk-Break Snacker",
    role: "Target Persona",
    skin: "#B87B52",
    hair: "#1F140E",
    hairStyle: "fade",
    topColor: "#FAF5ED", // warm ivory waffle-knit sweater
    bottomColor: "#2A3441", // tailored charcoal chinos
    accentColor: "#FF5C00", // Eat Better signature terracotta inner collar
    shoeColor: "#FFFFFF", // clean designer sneakers
    soleColor: "#D97706", // gum sole
    outfit: "sweater",
    accessories: {
      headphones: "#334155", // matte slate-grey over-ear headphones draped on neck
      watch: "#0284C7", // smartwatch with subtle screen
      snackPouch: true, // holding an Eat Better snack pack
    },
    height: 1.05,
  },
  aman: {
    id: "aman",
    name: "Aman, 27",
    role: "Software tester",
    skin: "#BA7F54",
    hair: "#1A110D",
    hairStyle: "short",
    topColor: "#2B4055", // modern denim overshirt
    bottomColor: "#7C6A53", // slim khaki trousers
    accentColor: "#F8FAFC", // white inner tee
    shoeColor: "#334155", // dark street sneakers
    soleColor: "#FFFFFF",
    outfit: "overshirt",
    accessories: {
      headphones: "#475569",
      watch: "#10B981",
    },
    height: 1.0,
  },
  neha: {
    id: "neha",
    name: "Neha, 31",
    role: "Bank analyst",
    skin: "#CF9970",
    hair: "#261610",
    hairStyle: "bun",
    topColor: "#E09083", // tailored blush rose smart-casual blazer
    bottomColor: "#1E293B", // deep navy tailored trousers
    accentColor: "#FFF9F5", // crisp silk ivory collar
    shoeColor: "#451A03", // polished leather loafers
    soleColor: "#1E293B",
    outfit: "blazer",
    accessories: {
      glasses: "#78350F", // chic tortoiseshell glasses
      earrings: true,
      folder: "#0284C7", // sleek leather document folio
    },
    height: 0.98,
  },
  farah: {
    id: "farah",
    name: "Farah, 29",
    role: "Hospital nurse",
    skin: "#B47648",
    hair: "#150C07",
    hairStyle: "ponytail",
    topColor: "#0D9488", // calming medical teal scrubs
    bottomColor: "#0F766E", // matching scrub pants
    accentColor: "#F0FDFA", // white under-neck trim
    shoeColor: "#F1F5F9", // supportive nursing sneakers
    soleColor: "#14B8A6",
    outfit: "scrubs",
    accessories: {
      stethoscope: true, // medical stethoscope on neck
      badge: "#3B82F6", // hospital ID badge
    },
    height: 0.97,
  },
  gupta: {
    id: "gupta",
    name: "Mr Gupta, 52",
    role: "Office administrator",
    skin: "#A66B44",
    hair: "#94A3B8", // distinguished salt & pepper hair
    hairStyle: "senior",
    topColor: "#FBF9F5", // crisp off-white khadi kurta
    bottomColor: "#F1EFEA", // tailored khadi trousers
    accentColor: "#1E3A5F", // royal navy Nehru waistcoat
    shoeColor: "#451A03", // handcrafted brown leather mojari
    soleColor: "#291508",
    outfit: "kurta",
    accessories: {
      glasses: "#334155", // reading glasses
      moustache: true, // neat silver-black moustache
      pocketSquare: "#991B1B", // silk maroon pocket square
      folder: "#B45309", // administrative leather planner
    },
    height: 1.0,
  },
};

/* ── Smooth geometries & materials ── */

const MATS = new Map<string, THREE.MeshStandardMaterial>();
function getMat(color: string, roughness = 0.7, metalness = 0, emissive = "#000000", emissiveIntensity = 0) {
  const k = `${color}_${roughness}_${metalness}_${emissive}_${emissiveIntensity}`;
  let m = MATS.get(k);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness,
      emissive: new THREE.Color(emissive),
      emissiveIntensity,
    });
    MATS.set(k, m);
  }
  return m;
}

let SHARED_GEOS: ReturnType<typeof createGeometries> | null = null;
function createGeometries() {
  return {
    head: new THREE.SphereGeometry(0.125, 32, 24),
    jaw: new THREE.SphereGeometry(0.1, 24, 18),
    ear: new THREE.SphereGeometry(0.035, 14, 10),
    eyeWhite: new THREE.SphereGeometry(0.02, 16, 12),
    iris: new THREE.SphereGeometry(0.013, 16, 12),
    catchlight: new THREE.SphereGeometry(0.005, 10, 8),
    brow: new THREE.BoxGeometry(0.045, 0.011, 0.012),
    nose: new THREE.SphereGeometry(0.02, 16, 12),
    noseBridge: new THREE.CylinderGeometry(0.009, 0.013, 0.05, 16),
    smile: new THREE.TorusGeometry(0.032, 0.006, 10, 20, Math.PI * 0.75),
    neck: new THREE.CylinderGeometry(0.052, 0.058, 0.12, 24),

    // Torso & body
    chest: new THREE.CylinderGeometry(0.185, 0.165, 0.35, 28),
    belly: new THREE.CylinderGeometry(0.165, 0.155, 0.22, 28),
    pelvis: new THREE.SphereGeometry(0.16, 24, 18),
    collar: new THREE.TorusGeometry(0.075, 0.016, 12, 28),
    lapel: new THREE.BoxGeometry(0.055, 0.32, 0.018),
    waistcoat: new THREE.CylinderGeometry(0.19, 0.17, 0.38, 28),
    belt: new THREE.CylinderGeometry(0.165, 0.165, 0.04, 28),
    buckle: new THREE.BoxGeometry(0.045, 0.032, 0.016),

    // Limbs - high segment smooth capsules
    shoulderCap: new THREE.SphereGeometry(0.072, 20, 16),
    upperArm: new THREE.CapsuleGeometry(0.055, 0.22, 10, 24),
    foreArm: new THREE.CapsuleGeometry(0.048, 0.2, 10, 24),
    hand: new THREE.SphereGeometry(0.046, 18, 14),
    thumb: new THREE.CapsuleGeometry(0.016, 0.032, 8, 14),

    thigh: new THREE.CapsuleGeometry(0.076, 0.34, 10, 24),
    shin: new THREE.CapsuleGeometry(0.062, 0.36, 10, 24),
    shoeBody: new THREE.BoxGeometry(0.12, 0.08, 0.26),
    shoeSole: new THREE.BoxGeometry(0.124, 0.026, 0.268),
    shoeToe: new THREE.SphereGeometry(0.06, 16, 12),

    // Accessories
    headphoneBand: new THREE.TorusGeometry(0.145, 0.016, 12, 32, Math.PI),
    headphoneCup: new THREE.CylinderGeometry(0.045, 0.045, 0.036, 20),
    glassesFrame: new THREE.TorusGeometry(0.024, 0.0038, 8, 20),
    glassesBridge: new THREE.BoxGeometry(0.022, 0.004, 0.005),
    stethoscopeTube: new THREE.TorusGeometry(0.13, 0.009, 8, 28, Math.PI * 0.9),
    stethoscopeBell: new THREE.CylinderGeometry(0.022, 0.022, 0.012, 16),
    watchCase: new THREE.CylinderGeometry(0.022, 0.022, 0.014, 16),
    watchStrap: new THREE.TorusGeometry(0.05, 0.01, 8, 20),
    badgeMesh: new THREE.BoxGeometry(0.045, 0.065, 0.006),
    snackPouchMesh: new THREE.BoxGeometry(0.09, 0.13, 0.03),
    folderMesh: new THREE.BoxGeometry(0.025, 0.24, 0.17),
    pocketSquareMesh: new THREE.BoxGeometry(0.04, 0.035, 0.01),
  };
}
const getGeos = () => (SHARED_GEOS ??= createGeometries());

/* ── Procedural Stylized Hair ── */

function StylizedHair({ spec }: { spec: AvatarSpec }) {
  const g = getGeos();
  const hairMat = getMat(spec.hair, 0.38, 0.05);

  switch (spec.hairStyle) {
    case "fade":
      return (
        <group position={[0, 0.03, 0]}>
          {/* Main textured hair volume */}
          <mesh geometry={g.head} material={hairMat} position={[0, 0.03, -0.01]} scale={[0.98, 1.05, 1.02]} />
          {/* Top pomp volume */}
          <mesh position={[0, 0.11, 0.03]} scale={[0.85, 0.45, 0.9]}>
            <sphereGeometry args={[0.085, 20, 16]} />
            <primitive object={hairMat} />
          </mesh>
          <mesh position={[0.04, 0.1, 0.04]} scale={[0.7, 0.4, 0.8]}>
            <sphereGeometry args={[0.07, 16, 12]} />
            <primitive object={hairMat} />
          </mesh>
        </group>
      );
    case "bun":
      return (
        <group position={[0, 0.02, 0]}>
          <mesh geometry={g.head} material={hairMat} position={[0, 0.02, -0.01]} scale={[0.97, 1.02, 1.04]} />
          {/* Sleek low bun at back */}
          <mesh position={[0, 0.01, -0.135]} scale={[1, 1, 0.85]}>
            <sphereGeometry args={[0.062, 20, 16]} />
            <primitive object={hairMat} />
          </mesh>
          {/* Side swept strands */}
          <mesh position={[-0.08, 0.02, 0.04]} scale={[0.2, 0.8, 0.7]} rotation={[0, 0, -0.2]}>
            <sphereGeometry args={[0.06, 14, 10]} />
            <primitive object={hairMat} />
          </mesh>
          <mesh position={[0.08, 0.02, 0.04]} scale={[0.2, 0.8, 0.7]} rotation={[0, 0, 0.2]}>
            <sphereGeometry args={[0.06, 14, 10]} />
            <primitive object={hairMat} />
          </mesh>
        </group>
      );
    case "ponytail":
      return (
        <group position={[0, 0.02, 0]}>
          <mesh geometry={g.head} material={hairMat} position={[0, 0.02, -0.01]} scale={[0.98, 1.03, 1.03]} />
          {/* Ponytail gathered at back */}
          <mesh position={[0, 0.07, -0.13]} rotation={[-0.35, 0, 0]}>
            <cylinderGeometry args={[0.022, 0.018, 0.03, 16]} />
            <primitive object={getMat("#0D9488", 0.5)} />
          </mesh>
          <mesh position={[0, -0.01, -0.16]} rotation={[-0.25, 0, 0]} scale={[0.8, 1.5, 0.8]}>
            <capsuleGeometry args={[0.03, 0.14, 8, 16]} />
            <primitive object={hairMat} />
          </mesh>
        </group>
      );
    case "senior":
      return (
        <group position={[0, 0.01, 0]}>
          {/* Receding / distinguished side hair */}
          <mesh position={[0, 0.02, -0.04]} scale={[0.97, 0.98, 1.02]}>
            <sphereGeometry args={[0.12, 24, 18, 0, Math.PI * 2, Math.PI * 0.22, Math.PI * 0.78]} />
            <primitive object={hairMat} />
          </mesh>
          {/* Side burns */}
          {[-1, 1].map((s) => (
            <mesh key={s} position={[s * 0.115, -0.02, 0.01]} scale={[0.2, 0.8, 0.5]}>
              <sphereGeometry args={[0.04, 14, 10]} />
              <primitive object={hairMat} />
            </mesh>
          ))}
        </group>
      );
    default:
      // Short modern crop
      return (
        <group position={[0, 0.02, 0]}>
          <mesh geometry={g.head} material={hairMat} position={[0, 0.02, -0.01]} scale={[0.97, 1.04, 1.02]} />
          <mesh position={[0, 0.1, 0.02]} scale={[0.8, 0.35, 0.85]}>
            <sphereGeometry args={[0.08, 16, 12]} />
            <primitive object={hairMat} />
          </mesh>
        </group>
      );
  }
}

/* ── Face with Expressive Catchlights & Warm Expression ── */

function ExpressiveFace({ spec }: { spec: AvatarSpec }) {
  const g = getGeos();
  const skinMat = getMat(spec.skin, 0.58);
  const skinShadowMat = getMat(
    new THREE.Color(spec.skin).multiplyScalar(0.85).getStyle(),
    0.62,
  );
  const eyeWhiteMat = getMat("#FAFAFA", 0.2);
  const irisMat = getMat("#26140D", 0.15);
  const catchlightMat = getMat("#FFFFFF", 0.05, 0, "#FFFFFF", 0.8);
  const browMat = getMat(spec.hair, 0.8);
  const smileMat = getMat(new THREE.Color(spec.skin).multiplyScalar(0.68).getStyle(), 0.5);

  return (
    <group>
      {/* Skull and jaw */}
      <mesh geometry={g.head} material={skinMat} scale={[0.92, 1.05, 0.98]} castShadow />
      <mesh geometry={g.jaw} material={skinMat} position={[0, -0.065, 0.02]} scale={[0.85, 0.7, 0.9]} />

      {/* Ears */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.112, 0, -0.01]}>
          <mesh geometry={g.ear} material={skinShadowMat} scale={[0.45, 1, 0.8]} />
          {spec.accessories?.earrings && (
            <mesh position={[0, -0.03, 0]}>
              <sphereGeometry args={[0.009, 12, 10]} />
              <primitive object={getMat("#FEF08A", 0.2, 0.8)} />
            </mesh>
          )}
        </group>
      ))}

      {/* Eyes with specular glint */}
      {[-1, 1].map((s) => (
        <group key={s} position={[s * 0.042, 0.018, 0.098]}>
          {/* White sclera */}
          <mesh geometry={g.eyeWhite} material={eyeWhiteMat} scale={[1, 0.75, 0.5]} />
          {/* Dark rich iris */}
          <mesh geometry={g.iris} material={irisMat} position={[0, 0, 0.007]} scale={[1, 1, 0.4]} />
          {/* Tiny specular highlight star */}
          <mesh geometry={g.catchlight} material={catchlightMat} position={[0.005, 0.005, 0.011]} />
          {/* Eyelash line */}
          <mesh position={[0, 0.014, 0.008]} rotation={[0, 0, s * -0.08]} scale={[1, 0.35, 0.5]}>
            <boxGeometry args={[0.038, 0.008, 0.006]} />
            <primitive object={browMat} />
          </mesh>
          {/* Eyebrows */}
          <mesh geometry={g.brow} material={browMat} position={[s * 0.002, 0.034, 0.005]} rotation={[0.08, 0, s * -0.1]} />
        </group>
      ))}

      {/* Nose */}
      <mesh geometry={g.noseBridge} material={skinShadowMat} position={[0, 0.008, 0.112]} rotation={[-0.2, 0, 0]} />
      <mesh geometry={g.nose} material={skinMat} position={[0, -0.018, 0.125]} scale={[1.1, 0.85, 0.95]} />

      {/* Smile */}
      <group position={[0, -0.062, 0.108]} rotation={[Math.PI * 0.15, 0, 0]}>
        <mesh geometry={g.smile} material={smileMat} rotation={[0, 0, Math.PI * 0.625]} />
      </group>

      {/* Optional Moustache */}
      {spec.accessories?.moustache && (
        <group position={[0, -0.044, 0.118]}>
          <mesh scale={[1.1, 0.45, 0.6]}>
            <capsuleGeometry args={[0.016, 0.05, 8, 16]} />
            <primitive object={browMat} />
          </mesh>
        </group>
      )}

      {/* Optional Spectacles */}
      {spec.accessories?.glasses && (
        <group position={[0, 0.018, 0.112]}>
          {[-1, 1].map((s) => (
            <mesh key={s} geometry={g.glassesFrame} material={getMat(spec.accessories!.glasses!, 0.3, 0.4)} position={[s * 0.042, 0, 0]} />
          ))}
          <mesh geometry={g.glassesBridge} material={getMat(spec.accessories!.glasses!, 0.3, 0.4)} position={[0, 0.005, 0]} />
        </group>
      )}
    </group>
  );
}

/* ── Interactive Speech Bubble & Billboard ── */

function StudioBubble({ text }: { text: string }) {
  const { tex, w, h } = useMemo(() => {
    const pad = 24;
    const px = 32;
    const c = document.createElement("canvas");
    const g = c.getContext("2d")!;
    g.font = `700 ${px}px Figtree, system-ui, sans-serif`;

    // Word wrap
    const words = text.split(" ");
    const lines: string[] = [];
    let cur = "";
    for (const wd of words) {
      const test = cur ? `${cur} ${wd}` : wd;
      if (g.measureText(test).width > 420 && cur) {
        lines.push(cur);
        cur = wd;
      } else cur = test;
    }
    if (cur) lines.push(cur);

    const maxLineWidth = Math.max(...lines.map((l) => g.measureText(l).width), 160);
    c.width = Math.ceil(maxLineWidth + pad * 2.5);
    const lh = px * 1.35;
    const boxH = Math.ceil(lh * lines.length + pad * 1.6);
    c.height = boxH + 28; // extra room for arrow tip

    // Redraw on properly sized canvas
    const g2 = c.getContext("2d")!;
    // Bubble body with soft shadow effect
    g2.fillStyle = "#2F1C1A";
    g2.beginPath();
    g2.roundRect(4, 4, c.width - 8, boxH - 4, 20);
    g2.fill();

    // Pointer tail
    g2.beginPath();
    const cx = c.width / 2;
    g2.moveTo(cx - 16, boxH - 4);
    g2.lineTo(cx, boxH + 22);
    g2.lineTo(cx + 16, boxH - 4);
    g2.closePath();
    g2.fill();

    // Text in clean cream
    g2.font = `700 ${px}px Figtree, system-ui, sans-serif`;
    g2.fillStyle = "#FFF5EE";
    g2.textAlign = "center";
    g2.textBaseline = "middle";
    lines.forEach((l, i) => {
      g2.fillText(l, cx, pad * 0.9 + lh * (i + 0.5));
    });

    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return { tex: t, w: (c.width * 0.28) / px, h: (c.height * 0.28) / px };
  }, [text]);

  useEffect(() => () => tex.dispose(), [tex]);

  return (
    <sprite position={[0, 2.35, 0]} scale={[w, h, 1]} renderOrder={15}>
      <spriteMaterial map={tex} transparent depthTest={false} />
    </sprite>
  );
}

function StudioNameTag({ name, role, selected }: { name: string; role: string; selected?: boolean }) {
  const { tex, w, h } = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 460;
    c.height = 110;
    const g = c.getContext("2d")!;

    // Pill background
    g.fillStyle = selected ? "#FF5C00" : "#2F1C1A";
    g.beginPath();
    g.roundRect(6, 6, c.width - 12, c.height - 12, 32);
    g.fill();

    // Border
    g.strokeStyle = selected ? "#FED300" : "rgba(255,245,238,0.25)";
    g.lineWidth = 4;
    g.stroke();

    // Name
    g.fillStyle = "#FFFFFF";
    g.font = "800 34px Figtree, system-ui, sans-serif";
    g.textAlign = "center";
    g.fillText(name, c.width / 2, 45);

    // Role
    g.fillStyle = selected ? "#FFF5EE" : "#FED300";
    g.font = "600 24px Figtree, system-ui, sans-serif";
    g.fillText(role, c.width / 2, 82);

    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 4;
    return { tex: t, w: 1.5, h: 0.36 };
  }, [name, role, selected]);

  useEffect(() => () => tex.dispose(), [tex]);

  return (
    <sprite position={[0, 0.16, 0.8]} scale={[w, h, 1]} renderOrder={10}>
      <spriteMaterial map={tex} transparent depthTest={false} />
    </sprite>
  );
}

function QuoteBadge({ count }: { count: number }) {
  const { tex, w, h } = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 300;
    c.height = 76;
    const g = c.getContext("2d")!;

    const done = count === 0;
    g.fillStyle = done ? "#059669" : "#FED300";
    g.beginPath();
    g.roundRect(4, 4, c.width - 8, c.height - 8, 24);
    g.fill();

    g.fillStyle = done ? "#FFFFFF" : "#2F1C1A";
    g.font = "800 28px Figtree, system-ui, sans-serif";
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillText(done ? "✓ All filed" : `${count} quote${count === 1 ? "" : "s"} to file`, c.width / 2, c.height / 2);

    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    return { tex: t, w: 1.1, h: 0.28 };
  }, [count]);

  useEffect(() => () => tex.dispose(), [tex]);

  return (
    <sprite position={[0, 2.12, 0]} scale={[w, h, 1]} renderOrder={12}>
      <spriteMaterial map={tex} transparent depthTest={false} />
    </sprite>
  );
}

/* ── The Master Smooth Avatar Component ── */

export function SmoothAvatar({
  spec,
  position,
  face = 0,
  selected = false,
  bubble,
  quoteCount,
  mood,
  onClick,
  isHero = false,
}: {
  spec: AvatarSpec;
  position: [number, number, number];
  face?: number;
  selected?: boolean;
  bubble?: string;
  quoteCount?: number;
  mood?: { mood: Mood; k: number };
  onClick?: () => void;
  isHero?: boolean;
}) {
  const g = getGeos();
  const root = useRef<THREE.Group>(null);
  const upperBody = useRef<THREE.Group>(null);
  const headGroup = useRef<THREE.Group>(null);
  const leftArm = useRef<THREE.Group>(null);
  const rightArm = useRef<THREE.Group>(null);
  const leftForearm = useRef<THREE.Group>(null);
  const rightForearm = useRef<THREE.Group>(null);

  const skinMat = getMat(spec.skin, 0.58);
  const topMat = getMat(spec.topColor, 0.78);
  const bottomMat = getMat(spec.bottomColor, 0.82);
  const accentMat = getMat(spec.accentColor, 0.75);
  const shoeMat = getMat(spec.shoeColor, 0.5);
  const soleMat = getMat(spec.soleColor, 0.65);

  const seed = useMemo(() => spec.name.charCodeAt(0) * 0.45, [spec.name]);
  const lastMoodK = useRef(mood?.k);
  const reactTime = useRef(-1);

  // Smooth alive idle motion + mood reaction
  useFrame(({ clock }) => {
    const t = clock.elapsedTime + seed;
    const o = root.current;
    if (!o) return;

    // Mood triggering
    if (mood && mood.k !== lastMoodK.current) {
      lastMoodK.current = mood.k;
      reactTime.current = clock.elapsedTime;
    }

    const mTime = clock.elapsedTime - reactTime.current;
    const isReacting = reactTime.current >= 0 && mTime < 1.0;
    const currentMood = mood?.mood;

    // Natural gentle breathing cycle (~0.35 Hz)
    const breath = Math.sin(t * 2.2) * 0.012;
    const microSway = Math.sin(t * 1.2) * 0.018;

    if (upperBody.current) {
      upperBody.current.position.y = 0.95 + breath;
      upperBody.current.rotation.z = microSway * 0.4;
      upperBody.current.rotation.x = selected ? 0.04 : 0.02; // attentive posture when selected
    }

    if (headGroup.current) {
      headGroup.current.position.y = 0.64 + breath * 0.4;
      headGroup.current.rotation.y = microSway * 0.8;
      headGroup.current.rotation.z = -microSway * 0.5;
    }

    // Arms natural resting posture with gentle elbow flex
    if (leftArm.current) {
      leftArm.current.rotation.x = 0.05 + Math.sin(t * 1.8) * 0.02;
      leftArm.current.rotation.z = 0.14; // natural shoulder slope
    }
    if (rightArm.current) {
      // If hero or holding snack pouch, bend right arm forward
      if (spec.accessories?.snackPouch) {
        rightArm.current.rotation.x = -0.55;
        rightArm.current.rotation.z = -0.18;
      } else if (spec.accessories?.folder) {
        rightArm.current.rotation.x = -0.42;
        rightArm.current.rotation.z = -0.15;
      } else {
        rightArm.current.rotation.x = 0.05 - Math.sin(t * 1.8) * 0.02;
        rightArm.current.rotation.z = -0.14;
      }
    }
    if (leftForearm.current) {
      leftForearm.current.rotation.x = -0.22; // gentle natural 25 deg elbow bend
    }
    if (rightForearm.current) {
      if (spec.accessories?.snackPouch) {
        rightForearm.current.rotation.x = -0.75;
        rightForearm.current.rotation.y = 0.2;
      } else if (spec.accessories?.folder) {
        rightForearm.current.rotation.x = -0.65;
      } else {
        rightForearm.current.rotation.x = -0.22;
      }
    }

    // Reaction animations
    if (isReacting && currentMood === "happy") {
      const hop = Math.abs(Math.sin(mTime * Math.PI * 2.5)) * 0.28 * (1 - mTime);
      o.position.y = position[1] + hop;
      if (leftArm.current) leftArm.current.rotation.x = -1.2 * (1 - mTime);
      if (rightArm.current) rightArm.current.rotation.x = -1.2 * (1 - mTime);
    } else if (isReacting && (currentMood === "sad" || currentMood === "angry")) {
      o.position.y = position[1];
      if (headGroup.current) {
        headGroup.current.rotation.y = Math.sin(mTime * 24) * 0.28 * (1 - mTime);
      }
    } else {
      o.position.y = position[1];
    }
  });

  const sw = spec.height ?? 1;

  return (
    <group
      ref={root}
      position={position}
      rotation={[0, face, 0]}
      scale={sw}
      onClick={(e) => {
        if (!onClick) return;
        e.stopPropagation();
        onClick();
      }}
      onPointerOver={onClick ? () => (document.body.style.cursor = "pointer") : undefined}
      onPointerOut={onClick ? () => (document.body.style.cursor = "") : undefined}
    >
      {/* Interactive ring under feet when selected */}
      {selected && (
        <group position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <mesh>
            <ringGeometry args={[0.38, 0.52, 40]} />
            <meshBasicMaterial color="#FF5C00" transparent opacity={0.88} />
          </mesh>
          <mesh>
            <ringGeometry args={[0.34, 0.38, 40]} />
            <meshBasicMaterial color="#FED300" transparent opacity={0.65} />
          </mesh>
        </group>
      )}

      {/* Invisible hit box for easy touch/mouse clicking */}
      {onClick && (
        <mesh position={[0, 0.95, 0]} visible={false}>
          <cylinderGeometry args={[0.45, 0.45, 1.9, 16]} />
          <meshBasicMaterial />
        </mesh>
      )}

      {/* ── LEGS & FEET ── */}
      {[
        [-0.095, 0.03],
        [0.095, -0.03],
      ].map(([x, flare], idx) => (
        <group key={idx} position={[x, 0.9, 0]} rotation={[0, flare, 0]}>
          {/* Thigh */}
          <mesh geometry={g.thigh} material={bottomMat} position={[0, -0.2, 0]} castShadow />
          {/* Shin */}
          <group position={[0, -0.42, 0]}>
            <mesh geometry={g.shin} material={bottomMat} position={[0, -0.19, 0]} castShadow />
            {/* Sculpted Shoe */}
            <group position={[0, -0.42, 0.045]}>
              <mesh geometry={g.shoeBody} material={shoeMat} castShadow />
              <mesh geometry={g.shoeSole} material={soleMat} position={[0, -0.035, 0]} />
              <mesh geometry={g.shoeToe} material={shoeMat} position={[0, -0.01, 0.09]} scale={[1, 0.7, 1]} />
            </group>
          </group>
        </group>
      ))}

      {/* Pelvis */}
      <mesh geometry={g.pelvis} material={bottomMat} position={[0, 0.93, 0]} scale={[1.05, 0.75, 0.85]} />
      {/* Belt */}
      <mesh geometry={g.belt} material={getMat("#1E293B", 0.5)} position={[0, 0.94, 0]} scale={[1.06, 1, 0.86]} />
      <mesh geometry={g.buckle} material={getMat("#CBD5E1", 0.2, 0.8)} position={[0, 0.94, 0.138]} />

      {/* ── UPPER BODY & TORSO ── */}
      <group ref={upperBody} position={[0, 0.95, 0]}>
        {/* Main Chest & Torso */}
        <mesh geometry={g.chest} material={topMat} position={[0, 0.26, 0]} scale={[1, 1, 0.78]} castShadow />
        <mesh geometry={g.belly} material={topMat} position={[0, 0.08, 0]} scale={[1.02, 1, 0.79]} />

        {/* Outfit Accents */}
        {spec.outfit === "sweater" && (
          <>
            {/* Terracotta inner collar peeking out */}
            <mesh geometry={g.collar} material={accentMat} position={[0, 0.44, 0.015]} rotation={[Math.PI / 2 - 0.2, 0, 0]} scale={[0.9, 1.05, 1]} />
            {/* Sweater ribbed trim */}
            <mesh geometry={g.collar} material={topMat} position={[0, 0.455, 0.012]} rotation={[Math.PI / 2 - 0.2, 0, 0]} scale={[1.08, 1.2, 1]} />
          </>
        )}

        {spec.outfit === "overshirt" && (
          <>
            {/* Inner white tee visible in center */}
            <mesh position={[0, 0.25, 0.088]} scale={[0.42, 0.8, 0.1]}>
              <boxGeometry args={[0.2, 0.4, 0.02]} />
              <primitive object={accentMat} />
            </mesh>
            {/* Left and right denim shirt panels */}
            <mesh geometry={g.lapel} material={topMat} position={[-0.075, 0.24, 0.092]} scale={[1, 1, 1]} />
            <mesh geometry={g.lapel} material={topMat} position={[0.075, 0.24, 0.092]} scale={[1, 1, 1]} />
            <mesh geometry={g.collar} material={topMat} position={[0, 0.45, 0.015]} rotation={[Math.PI / 2 - 0.2, 0, 0]} scale={[1.1, 1.25, 1]} />
          </>
        )}

        {spec.outfit === "blazer" && (
          <>
            {/* Silk blouse v-neck */}
            <mesh position={[0, 0.29, 0.086]} scale={[0.35, 0.6, 0.1]}>
              <boxGeometry args={[0.2, 0.4, 0.02]} />
              <primitive object={accentMat} />
            </mesh>
            {/* Tailored blazer lapels */}
            <mesh geometry={g.lapel} material={topMat} position={[-0.085, 0.26, 0.094]} rotation={[0, 0, -0.15]} />
            <mesh geometry={g.lapel} material={topMat} position={[0.085, 0.26, 0.094]} rotation={[0, 0, 0.15]} />
          </>
        )}

        {spec.outfit === "scrubs" && (
          <>
            {/* Medical V-neck */}
            <mesh position={[0, 0.32, 0.085]} scale={[0.32, 0.45, 0.1]}>
              <boxGeometry args={[0.2, 0.3, 0.02]} />
              <primitive object={accentMat} />
            </mesh>
            {/* Chest pocket */}
            <mesh position={[0.075, 0.28, 0.086]} scale={[0.07, 0.075, 0.01]}>
              <boxGeometry args={[1, 1, 1]} />
              <primitive object={getMat("#0F766E", 0.7)} />
            </mesh>
          </>
        )}

        {spec.outfit === "kurta" && (
          <>
            {/* Royal navy Nehru waistcoat */}
            <mesh geometry={g.waistcoat} material={accentMat} position={[0, 0.22, 0]} scale={[1.05, 1, 0.82]} castShadow />
            {/* Brass buttons */}
            {[0.14, 0.22, 0.3, 0.38].map((y, i) => (
              <mesh key={i} position={[0, y, 0.106]}>
                <sphereGeometry args={[0.007, 10, 8]} />
                <primitive object={getMat("#D97706", 0.2, 0.8)} />
              </mesh>
            ))}
            {/* Maroon pocket square */}
            {spec.accessories?.pocketSquare && (
              <mesh geometry={g.pocketSquareMesh} material={getMat(spec.accessories.pocketSquare, 0.4)} position={[-0.085, 0.32, 0.104]} rotation={[0, 0, 0.15]} />
            )}
            {/* Khadi kurta hem extending below */}
            <mesh position={[0, -0.1, 0]} scale={[1, 0.6, 0.78]}>
              <cylinderGeometry args={[0.17, 0.22, 0.45, 24]} />
              <primitive object={topMat} />
            </mesh>
          </>
        )}

        {/* ── ARMS & HANDS ── */}
        {/* Left Arm */}
        <group position={[-0.23, 0.42, 0]}>
          <mesh geometry={g.shoulderCap} material={spec.outfit === "kurta" ? topMat : topMat} castShadow />
          <group ref={leftArm}>
            <mesh geometry={g.upperArm} material={spec.outfit === "kurta" ? topMat : topMat} position={[0, -0.14, 0]} castShadow />
            <group ref={leftForearm} position={[0, -0.28, 0]}>
              <mesh geometry={g.foreArm} material={spec.outfit === "kurta" ? topMat : topMat} position={[0, -0.12, 0]} castShadow />
              {/* Hand */}
              <group position={[0, -0.26, 0.005]}>
                <mesh geometry={g.hand} material={skinMat} scale={[0.85, 1.1, 0.65]} />
                <mesh geometry={g.thumb} material={skinMat} position={[0.025, 0.015, 0.01]} rotation={[0.4, 0, -0.4]} />
                {/* Watch */}
                {spec.accessories?.watch && (
                  <group position={[0, 0.06, 0]}>
                    <mesh geometry={g.watchStrap} material={getMat("#1E293B", 0.4)} rotation={[Math.PI / 2, 0, 0]} scale={[1, 1, 0.8]} />
                    <mesh geometry={g.watchCase} material={getMat(spec.accessories.watch, 0.1, 0.9, spec.accessories.watch, 0.5)} position={[0, 0, 0.052]} rotation={[Math.PI / 2, 0, 0]} />
                  </group>
                )}
              </group>
            </group>
          </group>
        </group>

        {/* Right Arm */}
        <group position={[0.23, 0.42, 0]}>
          <mesh geometry={g.shoulderCap} material={spec.outfit === "kurta" ? topMat : topMat} castShadow />
          <group ref={rightArm}>
            <mesh geometry={g.upperArm} material={spec.outfit === "kurta" ? topMat : topMat} position={[0, -0.14, 0]} castShadow />
            <group ref={rightForearm} position={[0, -0.28, 0]}>
              <mesh geometry={g.foreArm} material={spec.outfit === "kurta" ? topMat : topMat} position={[0, -0.12, 0]} castShadow />
              {/* Hand */}
              <group position={[0, -0.26, 0.005]}>
                <mesh geometry={g.hand} material={skinMat} scale={[0.85, 1.1, 0.65]} />
                <mesh geometry={g.thumb} material={skinMat} position={[-0.025, 0.015, 0.01]} rotation={[0.4, 0, 0.4]} />

                {/* Held item: Eat Better Snack Pack */}
                {spec.accessories?.snackPouch && (
                  <group position={[0, -0.02, 0.06]} rotation={[0.4, 0.2, -0.1]}>
                    <mesh geometry={g.snackPouchMesh} material={getMat("#C2185B", 0.4, 0.2)} castShadow />
                    {/* Gold pack seal */}
                    <mesh position={[0, 0.055, 0.016]} scale={[0.08, 0.018, 0.005]}>
                      <boxGeometry args={[1, 1, 1]} />
                      <primitive object={getMat("#FED300", 0.2, 0.8)} />
                    </mesh>
                    {/* Brand logo badge */}
                    <mesh position={[0, 0.01, 0.016]} scale={[0.06, 0.04, 0.005]}>
                      <boxGeometry args={[1, 1, 1]} />
                      <primitive object={getMat("#FFF5EE", 0.3)} />
                    </mesh>
                  </group>
                )}

                {/* Held item: Administrative folder/folio */}
                {spec.accessories?.folder && (
                  <mesh geometry={g.folderMesh} material={getMat(spec.accessories.folder, 0.4)} position={[-0.03, -0.02, 0.04]} rotation={[0.2, 0, 0.2]} castShadow />
                )}
              </group>
            </group>
          </group>
        </group>

        {/* Neck */}
        <mesh geometry={g.neck} material={skinMat} position={[0, 0.49, 0]} />

        {/* Draped Accessories around neck */}
        {spec.accessories?.headphones ? (
          <group position={[0, 0.47, 0]} rotation={[0.3, 0, 0]}>
            <mesh geometry={g.headphoneBand} material={getMat(spec.accessories.headphones, 0.3, 0.4)} rotation={[Math.PI / 2, 0, 0]} scale={[1, 0.9, 1]} />
            {[-1, 1].map((s) => (
              <mesh key={s} geometry={g.headphoneCup} material={getMat(spec.accessories!.headphones!, 0.2, 0.6)} position={[s * 0.145, -0.01, 0.03]} rotation={[0, 0, s * 0.25]} />
            ))}
          </group>
        ) : null}

        {spec.accessories?.stethoscope && (
          <group position={[0, 0.46, 0.04]}>
            <mesh geometry={g.stethoscopeTube} material={getMat("#334155", 0.3)} rotation={[Math.PI / 2 + 0.3, 0, 0]} />
            <mesh geometry={g.stethoscopeBell} material={getMat("#CBD5E1", 0.15, 0.9)} position={[0, -0.16, 0.06]} rotation={[0.3, 0, 0]} />
          </group>
        )}

        {spec.accessories?.badge && (
          <mesh geometry={g.badgeMesh} material={getMat(spec.accessories.badge, 0.3)} position={[-0.08, 0.32, 0.092]} rotation={[0, 0, -0.05]} />
        )}

        {/* ── HEAD & FACE ── */}
        <group ref={headGroup} position={[0, 0.645, 0.008]}>
          <ExpressiveFace spec={spec} />
          <StylizedHair spec={spec} />
        </group>
      </group>

      {/* Name and role badge on stage floor */}
      {!isHero && <StudioNameTag name={spec.name} role={spec.role} selected={selected} />}

      {/* Quote count pill */}
      {quoteCount !== undefined && <QuoteBadge count={quoteCount} />}

      {/* Speech bubble */}
      {bubble && <StudioBubble text={bubble} />}
    </group>
  );
}
