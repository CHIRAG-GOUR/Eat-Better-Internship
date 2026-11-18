"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { mergeGeometries } from "three/examples/jsm/utils/BufferGeometryUtils.js";
import { toCreasedNormals } from "three-stdlib";

/**
 * Office furniture and fittings for the Activity 4 head office: swivel chairs (five-star base, gas lift, padded seat,
 * curved backrest, armrests), executive chairs, desks with monitors, keyboards, mugs and papers, snake plants, pendant
 * lamps, a planked wood floor, and window walls with a city view. Each piece merges its same-material parts into one
 * mesh, so a chair costs two draw calls instead of twenty.
 */

/* ── shared materials and helpers ─────────────────────────────── */

const MATS = new Map<string, THREE.Material>();
export function mat(color: string, roughness = 0.6, metalness = 0, extra?: { emissive?: string; ei?: number; opacity?: number }) {
  const k = `${color}|${roughness}|${metalness}|${extra?.emissive ?? ""}|${extra?.ei ?? ""}|${extra?.opacity ?? 1}`;
  let m = MATS.get(k);
  if (!m) {
    m = new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness,
      emissive: extra?.emissive ?? "#000000",
      emissiveIntensity: extra?.ei ?? 1,
      transparent: (extra?.opacity ?? 1) < 1,
      opacity: extra?.opacity ?? 1,
    });
    MATS.set(k, m);
  }
  return m;
}

type V3 = [number, number, number];
function put(g: THREE.BufferGeometry, p: V3, r: V3 = [0, 0, 0], s: V3 = [1, 1, 1]) {
  const m = new THREE.Matrix4().compose(new THREE.Vector3(...p), new THREE.Quaternion().setFromEuler(new THREE.Euler(...r)), new THREE.Vector3(...s));
  const out = (g.index ? g.toNonIndexed() : g.clone()).applyMatrix4(m);
  out.clearGroups();
  for (const k of Object.keys(out.attributes)) if (k !== "position" && k !== "normal" && k !== "uv") out.deleteAttribute(k);
  return out;
}
function merge(parts: THREE.BufferGeometry[]) {
  const g = mergeGeometries(parts, false)!;
  parts.forEach((p) => p.dispose());
  return g;
}
const eps = 0.00001;
/** the same rounded box drei builds (rounded-rect extrusion, centred, creased normals) */
function rounded(w: number, h: number, d: number, r: number, smooth = 4) {
  const shape = new THREE.Shape();
  const rr = r - eps;
  shape.absarc(eps, eps, eps, -Math.PI / 2, -Math.PI, true);
  shape.absarc(eps, h - rr * 2, eps, Math.PI, Math.PI / 2, true);
  shape.absarc(w - rr * 2, h - rr * 2, eps, Math.PI / 2, 0, true);
  shape.absarc(w - rr * 2, eps, eps, 0, -Math.PI / 2, true);
  const g = new THREE.ExtrudeGeometry(shape, { depth: d - r * 2, bevelEnabled: true, bevelSegments: 8, steps: 1, bevelSize: r - eps, bevelThickness: r, curveSegments: smooth });
  g.center();
  toCreasedNormals(g, 0.4);
  return g;
}

/* ── geometry library (built once) ───────────────────────────── */

let LIB: ReturnType<typeof build> | null = null;
function build() {
  // swivel chair frame: five spokes + casters + hub + gas lift + seat plate + back spine + arm posts
  const frame: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    frame.push(put(new THREE.BoxGeometry(0.05, 0.035, 0.3), [Math.sin(a) * 0.15, 0.075, Math.cos(a) * 0.15], [0, a, 0]));
    frame.push(put(new THREE.SphereGeometry(0.03, 10, 8), [Math.sin(a) * 0.29, 0.03, Math.cos(a) * 0.29]));
  }
  frame.push(put(new THREE.CylinderGeometry(0.055, 0.06, 0.07, 16), [0, 0.085, 0]));
  frame.push(put(new THREE.CylinderGeometry(0.024, 0.024, 0.3, 12), [0, 0.26, 0]));
  frame.push(put(new THREE.BoxGeometry(0.24, 0.03, 0.24), [0, 0.405, 0]));
  frame.push(put(new THREE.BoxGeometry(0.05, 0.34, 0.03), [0, 0.6, -0.245], [0.1, 0, 0]));
  for (const x of [-1, 1]) frame.push(put(new THREE.BoxGeometry(0.035, 0.2, 0.035), [x * 0.265, 0.55, -0.02]));
  const chairFrame = merge(frame);

  // upholstery: seat cushion, curved-looking backrest (two tilted pads), arm pads
  const chairPad = merge([
    put(rounded(0.5, 0.08, 0.48, 0.035), [0, 0.46, 0.01]),
    put(rounded(0.46, 0.3, 0.07, 0.03), [0, 0.68, -0.25], [0.08, 0, 0]),
    put(rounded(0.46, 0.28, 0.07, 0.03), [0, 0.95, -0.275], [0.16, 0, 0]),
    put(rounded(0.07, 0.035, 0.27, 0.015), [-0.265, 0.665, 0.0]),
    put(rounded(0.07, 0.035, 0.27, 0.015), [0.265, 0.665, 0.0]),
  ]);
  // executive chair: taller back with a headrest
  const execPad = merge([
    put(rounded(0.56, 0.1, 0.52, 0.04), [0, 0.47, 0.01]),
    put(rounded(0.52, 0.34, 0.09, 0.04), [0, 0.7, -0.26], [0.08, 0, 0]),
    put(rounded(0.5, 0.34, 0.09, 0.04), [0, 1.02, -0.29], [0.14, 0, 0]),
    put(rounded(0.36, 0.16, 0.09, 0.04), [0, 1.28, -0.33], [0.2, 0, 0]),
    put(rounded(0.08, 0.04, 0.3, 0.018), [-0.29, 0.67, 0.0]),
    put(rounded(0.08, 0.04, 0.3, 0.018), [0.29, 0.67, 0.0]),
  ]);

  // desk frame: two T-legs and a crossbar
  const deskFrame = (w: number, d: number) => {
    const p: THREE.BufferGeometry[] = [];
    for (const x of [-1, 1]) {
      p.push(put(new THREE.BoxGeometry(0.06, 0.72, 0.06), [x * (w / 2 - 0.12), 0.36, 0]));
      p.push(put(new THREE.BoxGeometry(0.07, 0.04, d - 0.12), [x * (w / 2 - 0.12), 0.02, 0]));
      p.push(put(new THREE.BoxGeometry(0.06, 0.04, d - 0.16), [x * (w / 2 - 0.12), 0.7, 0]));
    }
    p.push(put(new THREE.BoxGeometry(w - 0.3, 0.05, 0.04), [0, 0.62, -d / 2 + 0.12]));
    return merge(p);
  };

  // monitor housing: base, neck, back shell and bezel
  const monitor = merge([
    put(new THREE.BoxGeometry(0.24, 0.015, 0.16), [0, 0.0075, 0]),
    put(new THREE.BoxGeometry(0.04, 0.22, 0.03), [0, 0.12, -0.03]),
    put(rounded(0.62, 0.38, 0.035, 0.012), [0, 0.38, 0]),
  ]);

  // mug: body + handle
  const mug = merge([put(new THREE.CylinderGeometry(0.04, 0.036, 0.1, 18), [0, 0.05, 0]), put(new THREE.TorusGeometry(0.028, 0.008, 6, 14, Math.PI), [0.044, 0.052, 0], [0, 0, -Math.PI / 2])]);

  // snake plant: tapered blades in a fan
  const blades: THREE.BufferGeometry[] = [];
  for (let i = 0; i < 11; i++) {
    const a = (i / 11) * Math.PI * 2;
    const h = 0.55 + ((i * 37) % 10) / 22;
    const tilt = 0.12 + ((i * 53) % 7) / 40;
    blades.push(put(new THREE.ConeGeometry(0.045, h, 4, 1), [Math.sin(a) * 0.06, 0.36 + h / 2, Math.cos(a) * 0.06], [Math.cos(a) * tilt, a, -Math.sin(a) * tilt], [1, 1, 0.28]));
  }
  const leaves = merge(blades);
  const pot = merge([put(new THREE.CylinderGeometry(0.2, 0.15, 0.38, 22), [0, 0.19, 0]), put(new THREE.TorusGeometry(0.2, 0.018, 8, 26), [0, 0.38, 0], [Math.PI / 2, 0, 0])]);
  const soil = put(new THREE.CircleGeometry(0.19, 22), [0, 0.365, 0], [-Math.PI / 2, 0, 0]);

  // pendant lamp: cord + metal shade
  const lamp = merge([put(new THREE.CylinderGeometry(0.006, 0.006, 1.4, 6), [0, 0.7, 0]), put(new THREE.CylinderGeometry(0.07, 0.26, 0.2, 24, 1, true), [0, -0.08, 0])]);

  return { chairFrame, chairPad, execPad, deskFrame, monitor, mug, leaves, pot, soil, lamp, bulb: new THREE.SphereGeometry(0.06, 12, 10) };
}
export const lib = () => (LIB ??= build());

/* ── canvas textures ─────────────────────────────────────────── */

function canvasTex(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, repeat?: [number, number]) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  draw(c.getContext("2d")!);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  if (repeat) {
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(...repeat);
  }
  return t;
}
const rnd = (seed: number) => () => ((seed = (seed * 16807) % 2147483647) - 1) / 2147483646;

let TEX: { wood: THREE.Texture; carpet: THREE.Texture; city: THREE.Texture; screens: THREE.Texture[]; keys: THREE.Texture } | null = null;
export function textures() {
  if (TEX) return TEX;
  const r = rnd(11);
  const wood = canvasTex(
    1024,
    1024,
    (g) => {
      const tones = ["#C99A6B", "#BF8F60", "#D1A577", "#C4935F", "#CC9F70", "#B98856"];
      const rows = 8;
      const ph = 1024 / rows;
      for (let i = 0; i < rows; i++) {
        let x = -r() * 300;
        while (x < 1024) {
          const len = 260 + r() * 260;
          g.fillStyle = tones[Math.floor(r() * tones.length)];
          g.fillRect(x, i * ph, len, ph);
          // grain
          for (let k = 0; k < 9; k++) {
            g.strokeStyle = `rgba(90,55,25,${0.05 + r() * 0.08})`;
            g.lineWidth = 1 + r() * 2;
            const y = i * ph + r() * ph;
            g.beginPath();
            g.moveTo(x, y);
            g.bezierCurveTo(x + len * 0.3, y + (r() - 0.5) * 10, x + len * 0.7, y + (r() - 0.5) * 10, x + len, y);
            g.stroke();
          }
          g.fillStyle = "rgba(60,35,15,0.55)";
          g.fillRect(x, i * ph, 3, ph);
          x += len;
        }
        g.fillStyle = "rgba(60,35,15,0.5)";
        g.fillRect(0, i * ph, 1024, 3);
      }
    },
    [6, 6],
  );
  const carpet = canvasTex(
    512,
    512,
    (g) => {
      g.fillStyle = "#3D4A5C";
      g.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 9000; i++) {
        g.fillStyle = `rgba(${r() > 0.5 ? 255 : 0},${r() > 0.5 ? 255 : 0},${r() > 0.5 ? 255 : 0},0.05)`;
        g.fillRect(r() * 512, r() * 512, 2, 2);
      }
      g.strokeStyle = "rgba(255,255,255,0.06)";
      g.lineWidth = 6;
      for (let i = 0; i <= 512; i += 64) {
        g.beginPath();
        g.moveTo(i, 0);
        g.lineTo(i, 512);
        g.stroke();
      }
    },
    [3, 2],
  );
  const city = canvasTex(2048, 512, (g) => {
    const sky = g.createLinearGradient(0, 0, 0, 512);
    sky.addColorStop(0, "#9CCBEA");
    sky.addColorStop(0.65, "#D9ECF5");
    sky.addColorStop(1, "#F5E7D2");
    g.fillStyle = sky;
    g.fillRect(0, 0, 2048, 512);
    // far hills
    g.fillStyle = "#B7C4C9";
    g.beginPath();
    g.moveTo(0, 330);
    for (let x = 0; x <= 2048; x += 64) g.lineTo(x, 300 + Math.sin(x / 210) * 26 + Math.sin(x / 77) * 9);
    g.lineTo(2048, 512);
    g.lineTo(0, 512);
    g.fill();
    // two rows of buildings with lit windows
    for (const [base, tone, hMax] of [
      [430, "#8E9FAD", 200],
      [512, "#6F7F8C", 260],
    ] as const) {
      let x = 0;
      while (x < 2048) {
        const w = 60 + r() * 110;
        const h = 80 + r() * hMax;
        g.fillStyle = tone;
        g.fillRect(x, base - h, w - 6, h);
        g.fillStyle = "rgba(255,244,214,0.55)";
        for (let wy = base - h + 12; wy < base - 14; wy += 18) for (let wx = x + 8; wx < x + w - 14; wx += 14) if (r() > 0.45) g.fillRect(wx, wy, 7, 9);
        x += w;
      }
    }
  });
  const screens = [0, 1, 2, 3].map((i) =>
    canvasTex(512, 320, (g) => {
      g.fillStyle = "#F7F9FC";
      g.fillRect(0, 0, 512, 320);
      g.fillStyle = ["#FF5C00", "#2F6FDE", "#2E9E5B", "#8A4FD6"][i];
      g.fillRect(0, 0, 512, 34);
      g.fillStyle = "#FFFFFF";
      g.font = "700 20px Figtree, Arial, sans-serif";
      g.fillText(["Orders today", "Delivery map", "Stock levels", "New flavours"][i], 14, 23);
      if (i === 0 || i === 2) {
        for (let b = 0; b < 8; b++) {
          const h = 40 + r() * 190;
          g.fillStyle = i === 0 ? "#FF8A3D" : "#4CB57A";
          g.fillRect(30 + b * 58, 300 - h, 38, h);
        }
      } else if (i === 1) {
        g.strokeStyle = "#C9D6EA";
        g.lineWidth = 2;
        for (let k = 0; k < 14; k++) {
          g.beginPath();
          g.moveTo(r() * 512, 34 + r() * 286);
          g.lineTo(r() * 512, 34 + r() * 286);
          g.stroke();
        }
        g.fillStyle = "#2F6FDE";
        for (let k = 0; k < 9; k++) {
          g.beginPath();
          g.arc(30 + r() * 450, 60 + r() * 240, 7, 0, Math.PI * 2);
          g.fill();
        }
      } else {
        for (let k = 0; k < 6; k++) {
          g.fillStyle = ["#FED300", "#FF5C00", "#E57373", "#2E9E5B", "#8A4FD6", "#2F6FDE"][k];
          g.beginPath();
          g.arc(70 + (k % 3) * 180, 110 + Math.floor(k / 3) * 120, 42, 0, Math.PI * 2);
          g.fill();
        }
      }
    }),
  );
  const keys = canvasTex(256, 96, (g) => {
    g.fillStyle = "#2B2E33";
    g.fillRect(0, 0, 256, 96);
    g.fillStyle = "#4A4F57";
    for (let row = 0; row < 4; row++) for (let k = 0; k < 14; k++) g.fillRect(6 + k * 17.6, 6 + row * 21, 14, 16);
  });
  TEX = { wood, carpet, city, screens, keys };
  return TEX;
}

/* ── furniture ───────────────────────────────────────────────── */

export function OfficeChair({ position, rotation = 0, color = "#2F3640", exec = false }: { position: V3; rotation?: number; color?: string; exec?: boolean }) {
  const L = lib();
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh geometry={L.chairFrame} material={mat("#24272C", 0.35, 0.7)} castShadow />
      <mesh geometry={exec ? L.execPad : L.chairPad} material={mat(color, exec ? 0.42 : 0.8)} castShadow receiveShadow />
    </group>
  );
}

export function Desk({ position, rotation = 0, w = 1.5, d = 0.75, screen = 0, mug = "#FF5C00", plant = false }: { position: V3; rotation?: number; w?: number; d?: number; screen?: number; mug?: string; plant?: boolean }) {
  const L = lib();
  const T = textures();
  const frame = useMemo(() => L.deskFrame(w, d), [L, w, d]);
  useEffect(() => () => frame.dispose(), [frame]);
  const top = useMemo(() => rounded(w, 0.045, d, 0.018), [w, d]);
  useEffect(() => () => top.dispose(), [top]);
  return (
    <group position={position} rotation={[0, rotation, 0]}>
      <mesh geometry={top} position={[0, 0.745, 0]} material={mat("#E9DCCB", 0.45)} castShadow receiveShadow />
      <mesh geometry={frame} material={mat("#3A3D42", 0.4, 0.6)} castShadow />
      {/* the person sits on the desk's +z side facing -z; the monitor stands at the back, screen towards them */}
      <group position={[0, 0.77, -d / 2 + 0.2]}>
        <mesh geometry={L.monitor} material={mat("#1C1F24", 0.4, 0.3)} castShadow />
        <mesh position={[0, 0.38, 0.019]}>
          <planeGeometry args={[0.58, 0.34]} />
          <meshBasicMaterial map={T.screens[screen % 4]} toneMapped={false} />
        </mesh>
      </group>
      {/* keyboard + mouse */}
      <mesh position={[0, 0.775, 0.08]} castShadow>
        <boxGeometry args={[0.44, 0.018, 0.15]} />
        <meshStandardMaterial color="#2B2E33" roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.7851, 0.08]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[0.43, 0.14]} />
        <meshStandardMaterial map={T.keys} roughness={0.7} />
      </mesh>
      <mesh position={[0.32, 0.778, 0.1]} scale={[1, 0.45, 1.4]}>
        <sphereGeometry args={[0.032, 12, 8]} />
        <meshStandardMaterial color="#2B2E33" roughness={0.5} />
      </mesh>
      <mesh geometry={L.mug} position={[-0.52, 0.768, 0.12]} material={mat(mug, 0.45)} castShadow />
      <mesh position={[0.5, 0.772, -0.05]} rotation={[0, 0.25, 0]}>
        <boxGeometry args={[0.24, 0.012, 0.32]} />
        <meshStandardMaterial color="#FFFFFF" roughness={0.9} />
      </mesh>
      {plant && <Plant position={[-0.55, 0.77, -0.2]} scale={0.45} />}
    </group>
  );
}

export function Plant({ position, scale = 1 }: { position: V3; scale?: number }) {
  const L = lib();
  return (
    <group position={position} scale={scale}>
      <mesh geometry={L.pot} material={mat("#F4EFE8", 0.5)} castShadow receiveShadow />
      <mesh geometry={L.soil} material={mat("#4A3426", 0.95)} />
      <mesh geometry={L.leaves} material={mat("#3F7D3A", 0.65)} castShadow />
    </group>
  );
}

export function PendantLamp({ position }: { position: V3 }) {
  const L = lib();
  return (
    <group position={position}>
      <mesh geometry={L.lamp} material={mat("#2B2B2B", 0.35, 0.6)} />
      <mesh geometry={L.bulb} position={[0, -0.13, 0]} material={mat("#FFF4D6", 0.3, 0, { emissive: "#FFE7B0", ei: 2.2 })} />
    </group>
  );
}

/** wood floor, carpet zone, back wall with clerestory windows, a side window wall with a city view, skirting */
export function Room({ width = 34, depth = 15, cx = 2.5, cz = 1.8, carpet }: { width?: number; depth?: number; cx?: number; cz?: number; carpet?: { x: number; z: number; w: number; d: number } }) {
  const T = textures();
  const back = cz - depth / 2;
  const left = cx - width / 2;
  const glass = mat("#CFE6F5", 0.05, 0.1, { opacity: 0.18 });
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[cx, 0, cz]} receiveShadow>
        <planeGeometry args={[width, depth]} />
        <meshStandardMaterial map={T.wood} roughness={0.55} />
      </mesh>
      {carpet && (
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[carpet.x, 0.004, carpet.z]} receiveShadow>
          <planeGeometry args={[carpet.w, carpet.d]} />
          <meshStandardMaterial map={T.carpet} roughness={0.95} />
        </mesh>
      )}
      {/* back wall: solid lower part, window band above */}
      <mesh position={[cx, 1.5, back]} receiveShadow>
        <planeGeometry args={[width, 3]} />
        <meshStandardMaterial color="#F7EEE3" roughness={0.9} />
      </mesh>
      <mesh position={[cx, 3.75, back - 0.3]}>
        <planeGeometry args={[width, 1.5]} />
        <meshBasicMaterial map={T.city} toneMapped={false} />
      </mesh>
      <mesh position={[cx, 3.75, back]} material={glass}>
        <planeGeometry args={[width, 1.5]} />
      </mesh>
      {Array.from({ length: Math.floor(width / 2.4) + 1 }, (_, i) => (
        <mesh key={i} position={[left + i * 2.4, 3.75, back + 0.02]}>
          <boxGeometry args={[0.08, 1.5, 0.06]} />
          <meshStandardMaterial color="#2B2E33" roughness={0.4} metalness={0.5} />
        </mesh>
      ))}
      <mesh position={[cx, 3.0, back + 0.03]}>
        <boxGeometry args={[width, 0.1, 0.08]} />
        <meshStandardMaterial color="#2B2E33" roughness={0.4} metalness={0.5} />
      </mesh>
      <mesh position={[cx, 0.06, back + 0.02]}>
        <boxGeometry args={[width, 0.12, 0.03]} />
        <meshStandardMaterial color="#FF5C00" roughness={0.5} />
      </mesh>
      {/* left wall: floor-to-ceiling windows */}
      <mesh position={[left - 0.3, 2.25, cz]} rotation={[0, Math.PI / 2, 0]}>
        <planeGeometry args={[depth, 4.5]} />
        <meshBasicMaterial map={T.city} toneMapped={false} />
      </mesh>
      <mesh position={[left, 2.25, cz]} rotation={[0, Math.PI / 2, 0]} material={glass}>
        <planeGeometry args={[depth, 4.5]} />
      </mesh>
      {Array.from({ length: Math.floor(depth / 2.2) + 1 }, (_, i) => (
        <mesh key={i} position={[left + 0.02, 2.25, back + i * 2.2]}>
          <boxGeometry args={[0.06, 4.5, 0.08]} />
          <meshStandardMaterial color="#2B2E33" roughness={0.4} metalness={0.5} />
        </mesh>
      ))}
    </group>
  );
}
