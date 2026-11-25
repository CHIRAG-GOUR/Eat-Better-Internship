"use client";
/* eslint-disable react-hooks/immutability -- three.js objects, textures and the camera rig are updated in place by design */

import { useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import * as THREE from "three";
import { useFrame, useLoader } from "@react-three/fiber";

/**
 * The Eat Better Co warehouse the opening film plays in: a clean, sunlit D2C food warehouse. Cream walls with a
 * terracotta band, orange pallet racking full of kraft Eat Better cartons, real product photos on display boards,
 * ingredient crates, a packaging station, pendant lamps, and a conveyor that runs out through the loading bay (where
 * it becomes the path to the five worlds). The big LED screen hangs on the back wall.
 *
 * Units are metres. The warehouse spans x −16…16, z −34…4; the screen faces +z on the back wall.
 */

export const SCREEN = { x: 0, y: 5.5, z: -33.55, w: 12.8, h: 7.2 };
export const BAY = { x: 16, z: -9, w: 10, h: 6.6 };
export const CONVEYOR = { z: -9, y: 0.92, from: -7, to: 26 };
const WX = 16;
const BACK = -34;
const FRONT = 4;
const H = 10.5;

export const C = {
  cream: "#F4E9D8",
  plaster: "#EFE2CC",
  sand: "#E5D3B3",
  floor: "#E8DAC2",
  terracotta: "#C8643B",
  orange: "#FF5C00",
  rack: "#E0662A",
  olive: "#6F7247",
  oliveDark: "#4E5134",
  cocoa: "#2F1C1A",
  kraft: "#C49A6C",
  wood: "#B98A57",
  brass: "#C59B4E",
};

/* ── small helpers ── */

export type Place = { p: [number, number, number]; s?: [number, number, number]; r?: [number, number, number]; c?: string };

/** many copies of one mesh in one draw call */
export function Instances({ geometry, material, items, castShadow = true, receiveShadow = true }: { geometry: THREE.BufferGeometry; material: THREE.Material; items: Place[]; castShadow?: boolean; receiveShadow?: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new THREE.Object3D();
    const col = new THREE.Color();
    items.forEach((it, i) => {
      o.position.set(...it.p);
      o.rotation.set(...(it.r ?? [0, 0, 0]));
      o.scale.set(...(it.s ?? [1, 1, 1]));
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
      // optional per-instance colour (multiplies the material colour, so use a white material for exact colours)
      if (it.c) m.setColorAt(i, col.set(it.c));
    });
    m.instanceMatrix.needsUpdate = true;
    if (m.instanceColor) m.instanceColor.needsUpdate = true;
    m.computeBoundingSphere();
  }, [items]);
  return <instancedMesh ref={ref} args={[geometry, material, items.length]} castShadow={castShadow} receiveShadow={receiveShadow} frustumCulled={false} />;
}

/** a canvas texture drawn once */
export function useCanvasTexture(w: number, h: number, draw: (g: CanvasRenderingContext2D) => void, deps: unknown[] = [], repeat?: [number, number]) {
  const tex = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    if (repeat) {
      t.wrapS = t.wrapT = THREE.RepeatWrapping;
      t.repeat.set(...repeat);
    }
    return t;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [w, h]);
  useEffect(() => {
    draw(tex.image.getContext("2d")!);
    tex.needsUpdate = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tex, ...deps]);
  useEffect(() => () => tex.dispose(), [tex]);
  return tex;
}

const noise = (g: CanvasRenderingContext2D, w: number, h: number, n: number, a: number) => {
  for (let i = 0; i < n; i++) {
    const v = Math.random() < 0.5 ? 0 : 255;
    g.fillStyle = `rgba(${v},${v},${v},${Math.random() * a})`;
    g.fillRect(Math.random() * w, Math.random() * h, 1 + Math.random() * 2, 1 + Math.random() * 2);
  }
};

/** the Eat Better logo image (dark on transparent) */
export function useLogo() {
  return useLoader(THREE.ImageLoader, "/brand/eat-better-logo-transparent-600x400.png");
}

/** kraft carton side with the Eat Better logo and a tape line */
function useCartonTexture() {
  const logo = useLogo();
  return useCanvasTexture(
    256,
    256,
    (g) => {
      g.fillStyle = C.kraft;
      g.fillRect(0, 0, 256, 256);
      noise(g, 256, 256, 2600, 0.12);
      g.fillStyle = "rgba(255,255,255,0.12)";
      g.fillRect(0, 118, 256, 20);
      g.globalAlpha = 0.85;
      g.drawImage(logo, 120, 105, 360, 190, 54, 150, 148, 78);
      g.globalAlpha = 1;
      g.strokeStyle = "rgba(60,35,20,0.35)";
      g.lineWidth = 3;
      g.strokeRect(2, 2, 252, 252);
    },
    [logo],
  );
}

/* ── the building ── */

function Shell({ compact }: { compact: boolean }) {
  const floorTex = useCanvasTexture(
    1024,
    1024,
    (g) => {
      g.fillStyle = C.floor;
      g.fillRect(0, 0, 1024, 1024);
      noise(g, 1024, 1024, 26000, 0.06);
      // polished slab joints
      g.strokeStyle = "rgba(120,90,60,0.12)";
      g.lineWidth = 2;
      for (let i = 0; i <= 1024; i += 128) {
        g.beginPath();
        g.moveTo(i, 0);
        g.lineTo(i, 1024);
        g.moveTo(0, i);
        g.lineTo(1024, i);
        g.stroke();
      }
    },
    [],
    [5, 6],
  );
  const aisle = useMemo(() => new THREE.MeshStandardMaterial({ color: "#F2B33D", roughness: 0.6 }), []);
  const wall = useMemo(() => new THREE.MeshStandardMaterial({ color: C.plaster, roughness: 0.92 }), []);
  const band = useMemo(() => new THREE.MeshStandardMaterial({ color: C.terracotta, roughness: 0.85 }), []);
  const steel = useMemo(() => new THREE.MeshStandardMaterial({ color: C.olive, roughness: 0.55, metalness: 0.35 }), []);
  const glass = useMemo(() => new THREE.MeshStandardMaterial({ color: "#FFF6E6", emissive: "#FFF1D6", emissiveIntensity: 1.15, roughness: 0.2, transparent: true, opacity: 0.55 }), []);
  const box = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);

  // walls are boxes; window and bay openings are left open so sunlight comes through (and casts patterns)
  const walls: Place[] = [];
  const W = (x: number, y: number, z: number, sx: number, sy: number, sz: number) => walls.push({ p: [x, y, z], s: [sx, sy, sz] });
  // back wall
  W(0, H / 2, BACK - 0.2, WX * 2 + 0.8, H, 0.4);
  // front wall with the big door (x −4.5…4.5, up to 7 m)
  W(-10.25, H / 2, FRONT + 0.2, 11.5, H, 0.4);
  W(10.25, H / 2, FRONT + 0.2, 11.5, H, 0.4);
  W(0, 7 + (H - 7) / 2, FRONT + 0.2, 9, H - 7, 0.4);
  // left wall: solid to 5.2 m, then a row of tall windows between piers, solid above 8.6 m
  W(-WX - 0.2, 2.6, (BACK + FRONT) / 2, 0.4, 5.2, FRONT - BACK);
  W(-WX - 0.2, 8.6 + (H - 8.6) / 2, (BACK + FRONT) / 2, 0.4, H - 8.6, FRONT - BACK);
  const winZ: number[] = [];
  for (let z = BACK + 1.5; z < FRONT - 1; z += 4.2) {
    W(-WX - 0.2, 6.9, z, 0.4, 3.4, 1.1);
    winZ.push(z + 2.1);
  }
  // right wall with the loading bay (z −14…−4, up to 6.6 m)
  const b0 = BAY.z - BAY.w / 2;
  const b1 = BAY.z + BAY.w / 2;
  W(WX + 0.2, H / 2, (BACK + b0) / 2, 0.4, H, b0 - BACK);
  W(WX + 0.2, H / 2, (b1 + FRONT) / 2, 0.4, H, FRONT - b1);
  W(WX + 0.2, BAY.h + (H - BAY.h) / 2, BAY.z, 0.4, H - BAY.h, BAY.w);
  // roof with skylight strips left open
  const roof: Place[] = [];
  for (let z = BACK; z < FRONT; z += 6) roof.push({ p: [0, H + 0.15, z + 2], s: [WX * 2 + 0.8, 0.3, 4] });

  const bands: Place[] = [
    { p: [0, 0.6, BACK + 0.02], s: [WX * 2, 1.2, 0.05] },
    { p: [-WX + 0.02, 0.6, (BACK + FRONT) / 2], s: [0.05, 1.2, FRONT - BACK] },
  ];
  // columns and roof trusses
  const cols: Place[] = [];
  const trusses: Place[] = [];
  for (let z = BACK + 4; z < FRONT; z += 8) {
    for (const x of [-10.5, 10.5]) cols.push({ p: [x, H / 2, z], s: [0.45, H, 0.45] });
    trusses.push({ p: [0, H - 0.35, z], s: [WX * 2, 0.5, 0.3] });
  }
  for (let x = -12; x <= 12; x += 6) trusses.push({ p: [x, H - 0.75, (BACK + FRONT) / 2], s: [0.25, 0.25, FRONT - BACK] });

  // painted aisle lines on the floor
  const lines: Place[] = [
    { p: [-3.2, 0.012, -15], s: [0.12, 0.01, 36] },
    { p: [3.2, 0.012, -15], s: [0.12, 0.01, 36] },
  ];

  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, (BACK + FRONT) / 2]} receiveShadow>
        <planeGeometry args={[WX * 2, FRONT - BACK]} />
        <meshStandardMaterial map={floorTex} roughness={0.42} metalness={0.05} />
      </mesh>
      <Instances geometry={box} material={wall} items={walls} />
      <Instances geometry={box} material={wall} items={roof} />
      <Instances geometry={box} material={band} items={bands} castShadow={false} />
      <Instances geometry={box} material={steel} items={[...cols, ...trusses]} />
      <Instances geometry={box} material={aisle} items={lines} castShadow={false} />
      {/* window glass glows with daylight (does not block the sun) */}
      {winZ.map((z) => (
        <mesh key={z} position={[-WX - 0.05, 6.9, z]} rotation-y={Math.PI / 2} castShadow={false}>
          <planeGeometry args={[3.1, 3.4]} />
          <primitive object={glass} attach="material" />
        </mesh>
      ))}
      {!compact && <SunShafts winZ={winZ} />}
    </group>
  );
}

/** soft beams of sunlight from the windows (very subtle) */
function SunShafts({ winZ }: { winZ: number[] }) {
  const tex = useCanvasTexture(64, 256, (g) => {
    const gr = g.createLinearGradient(0, 0, 0, 256);
    gr.addColorStop(0, "rgba(255,236,200,0.9)");
    gr.addColorStop(1, "rgba(255,236,200,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 64, 256);
  });
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0.075, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, fog: false }), [tex]);
  const ref = useRef<THREE.Group>(null);
  useFrame(({ clock }) => {
    mat.opacity = 0.065 + Math.sin(clock.elapsedTime * 0.35) * 0.012;
  });
  return (
    <group ref={ref}>
      {winZ.map((z) => (
        <mesh key={z} material={mat} position={[-11.2, 4.4, z - 0.6]} rotation={[0, Math.PI / 2, -0.72]}>
          <planeGeometry args={[3, 12]} />
        </mesh>
      ))}
    </group>
  );
}

/* ── racking full of cartons ── */

function Racks({ compact }: { compact: boolean }) {
  const carton = useCartonTexture();
  const box = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const rackMat = useMemo(() => new THREE.MeshStandardMaterial({ color: C.rack, roughness: 0.5, metalness: 0.25 }), []);
  const beamMat = useMemo(() => new THREE.MeshStandardMaterial({ color: C.oliveDark, roughness: 0.5, metalness: 0.4 }), []);
  const palletMat = useMemo(() => new THREE.MeshStandardMaterial({ color: C.wood, roughness: 0.9 }), []);
  const cartonMat = useMemo(() => new THREE.MeshStandardMaterial({ map: carton, roughness: 0.88 }), [carton]);

  const { uprights, beams, pallets, cartons } = useMemo(() => {
    const uprights: Place[] = [];
    const beams: Place[] = [];
    const pallets: Place[] = [];
    const cartons: Place[] = [];
    let seed = 7;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const levels = [0.15, 2.05, 3.95];
    const run = (x: number, z0: number, z1: number, face: 1 | -1) => {
      const bays = Math.floor((z1 - z0) / 3);
      for (let b = 0; b <= bays; b++) {
        const z = z0 + b * 3;
        for (const dx of [-0.55, 0.55]) uprights.push({ p: [x + dx, 2.9, z], s: [0.1, 5.8, 0.1] });
        if (b === bays) break;
        for (const y of [...levels.slice(1), 5.7]) for (const dx of [-0.55, 0.55]) beams.push({ p: [x + dx, y - 0.06, z + 1.5], s: [0.08, 0.14, 3] });
        for (const y of levels) {
          if (compact && rnd() < 0.35) continue;
          pallets.push({ p: [x, y + 0.07, z + 1.5], s: [1.1, 0.14, 2.6] });
          // a stack of cartons on the pallet
          const cols = 2 + Math.floor(rnd() * 2);
          const rows = 1 + Math.floor(rnd() * 3);
          for (let cx = 0; cx < cols; cx++)
            for (let cy = 0; cy < rows; cy++) {
              if (rnd() < 0.12) continue;
              const w = 2.4 / cols;
              cartons.push({ p: [x + (rnd() - 0.5) * 0.06, y + 0.14 + 0.28 + cy * 0.56, z + 0.3 + w / 2 + cx * w], s: [0.95, 0.54, w - 0.06], r: [0, face === 1 ? 0 : Math.PI, 0] });
            }
        }
      }
    };
    run(-14.6, -31, 2, 1);
    run(14.6, -31, -15, -1);
    run(14.6, -2.5, 1.5, -1);
    if (!compact) {
      run(-8.2, -31, -21, -1);
      run(8.2, -31, -21, 1);
    }
    return { uprights, beams, pallets, cartons };
  }, [compact]);

  return (
    <group>
      <Instances geometry={box} material={rackMat} items={uprights} />
      <Instances geometry={box} material={beamMat} items={beams} />
      <Instances geometry={box} material={palletMat} items={pallets} />
      <Instances geometry={box} material={cartonMat} items={cartons} />
    </group>
  );
}

/* ── floor life: pallets, ingredients, packing station, pendant lamps ── */

const PRODUCTS = [
  "/brand/products/laddoo-box-24-0.webp",
  "/brand/products/hazelnut-laddoo-0.webp",
  "/brand/products/diwali-hamper-0.webp",
  "/brand/products/laddoo-tin-0.webp",
  "/brand/products/marigold-hamper-0.webp",
  "/brand/products/coffee-almond-laddoo-0.webp",
];

/** framed boards with real Eat Better product photos */
function ProductBoards() {
  const texes = useLoader(THREE.TextureLoader, PRODUCTS);
  useMemo(() => texes.forEach((t) => (t.colorSpace = THREE.SRGBColorSpace)), [texes]);
  const frame = useMemo(() => new THREE.MeshStandardMaterial({ color: C.cocoa, roughness: 0.6 }), []);
  const spots: { p: [number, number, number]; ry: number }[] = [
    { p: [-10.4, 3.4, BACK + 0.25], ry: 0 },
    { p: [-13.6, 3.4, BACK + 0.25], ry: 0 },
    { p: [10.4, 3.4, BACK + 0.25], ry: 0 },
    { p: [13.6, 3.4, BACK + 0.25], ry: 0 },
    { p: [-10.4, 6.6, BACK + 0.25], ry: 0 },
    { p: [10.4, 6.6, BACK + 0.25], ry: 0 },
  ];
  return (
    <group>
      {spots.map((s, i) => (
        <group key={i} position={s.p} rotation-y={s.ry}>
          <mesh material={frame} castShadow>
            <boxGeometry args={[2.7, 2.7, 0.12]} />
          </mesh>
          <mesh position-z={0.07}>
            <planeGeometry args={[2.5, 2.5]} />
            <meshStandardMaterial map={texes[i % texes.length]} roughness={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function FloorLife({ compact }: { compact: boolean }) {
  const carton = useCartonTexture();
  const box = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const cartonMat = useMemo(() => new THREE.MeshStandardMaterial({ map: carton, roughness: 0.88 }), [carton]);
  const palletMat = useMemo(() => new THREE.MeshStandardMaterial({ color: C.wood, roughness: 0.9 }), []);
  const wrap = useMemo(() => new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.15, transparent: true, opacity: 0.16, depthWrite: false }), []);
  const crateMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#A87445", roughness: 0.85 }), []);
  const tableMat = useMemo(() => new THREE.MeshStandardMaterial({ color: C.cream, roughness: 0.6 }), []);
  const legMat = useMemo(() => new THREE.MeshStandardMaterial({ color: C.oliveDark, roughness: 0.5, metalness: 0.4 }), []);
  const nutGeo = useMemo(() => new THREE.SphereGeometry(0.06, 7, 5), []);

  const { stacks, pallets, wraps } = useMemo(() => {
    const stacks: Place[] = [];
    const pallets: Place[] = [];
    const wraps: Place[] = [];
    const spots: [number, number, number][] = [
      [-5.6, -3.5, 3],
      [5.8, -1.8, 2],
      [-6, -24, 3],
      [5.6, -26.5, 2],
      [11.2, -5.2, 3],
    ];
    for (const [x, z, n] of spots.slice(0, compact ? 3 : 5)) {
      pallets.push({ p: [x, 0.07, z], s: [1.6, 0.14, 1.3] });
      for (let k = 0; k < n; k++)
        for (const dx of [-0.38, 0.38]) for (const dz of [-0.3, 0.3]) stacks.push({ p: [x + dx, 0.14 + 0.25 + k * 0.5, z + dz], s: [0.74, 0.48, 0.58] });
      wraps.push({ p: [x, 0.14 + n * 0.25, z], s: [1.58, n * 0.5 + 0.02, 1.24] });
    }
    return { stacks, pallets, wraps };
  }, [compact]);

  // ingredient crates: almonds, cashews, pistachios, dates
  const nuts = useMemo(() => {
    const sets: { color: string; items: Place[] }[] = [
      { color: "#B9773F", items: [] },
      { color: "#EBD3A6", items: [] },
      { color: "#9AA65A", items: [] },
      { color: "#5B2E1E", items: [] },
    ];
    let seed = 3;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    sets.forEach((s, i) => {
      const cx = 4.2 + i * 1.25;
      for (let k = 0; k < (compact ? 70 : 140); k++)
        s.items.push({ p: [cx + (rnd() - 0.5) * 0.9, 0.86 + rnd() * 0.12, -17.2 + (rnd() - 0.5) * 0.7], s: [1.2, 0.75, 0.9], r: [rnd() * 3, rnd() * 3, rnd() * 3] });
    });
    return sets;
  }, [compact]);
  const nutMats = useMemo(() => nuts.map((n) => new THREE.MeshStandardMaterial({ color: n.color, roughness: 0.7 })), [nuts]);

  return (
    <group>
      <Instances geometry={box} material={palletMat} items={pallets} />
      <Instances geometry={box} material={cartonMat} items={stacks} />
      <Instances geometry={box} material={wrap} items={wraps} castShadow={false} />
      {/* ingredient crates on a low stand */}
      <mesh material={legMat} position={[6.1, 0.35, -17.2]} castShadow receiveShadow>
        <boxGeometry args={[5.4, 0.7, 1.3]} />
      </mesh>
      {[0, 1, 2, 3].map((i) => (
        <mesh key={i} material={crateMat} position={[4.2 + i * 1.25, 0.82, -17.2]} castShadow receiveShadow>
          <boxGeometry args={[1.1, 0.25, 0.95]} />
        </mesh>
      ))}
      {nuts.map((n, i) => (
        <Instances key={i} geometry={nutGeo} material={nutMats[i]} items={n.items} castShadow={false} />
      ))}
      {/* packing station by the conveyor */}
      <group position={[-7.5, 0, -12.2]}>
        <mesh material={tableMat} position-y={0.9} castShadow receiveShadow>
          <boxGeometry args={[4.2, 0.08, 1.5]} />
        </mesh>
        {[-1.9, 1.9].map((x) => [-0.6, 0.6].map((z) => <mesh key={`${x}${z}`} material={legMat} position={[x, 0.45, z]} geometry={box} scale={[0.08, 0.9, 0.08]} />))}
        <Instances
          geometry={box}
          material={cartonMat}
          items={[
            { p: [-1.2, 1.15, 0], s: [0.6, 0.42, 0.45] },
            { p: [-0.4, 1.12, 0.1], s: [0.5, 0.36, 0.4], r: [0, 0.3, 0] },
            { p: [1.3, 1.2, -0.2], s: [0.7, 0.5, 0.5] },
            { p: [1.3, 1.66, -0.2], s: [0.62, 0.42, 0.45], r: [0, -0.2, 0] },
          ]}
        />
      </group>
    </group>
  );
}

/** pendant lamps over the aisles */
function Pendants({ compact }: { compact: boolean }) {
  const shade = useMemo(() => new THREE.MeshStandardMaterial({ color: C.oliveDark, roughness: 0.45, metalness: 0.5, side: THREE.DoubleSide }), []);
  const bulb = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fff", emissive: "#FFD9A0", emissiveIntensity: 3 }), []);
  const cone = useMemo(() => new THREE.ConeGeometry(0.55, 0.45, 20, 1, true), []);
  const ball = useMemo(() => new THREE.SphereGeometry(0.16, 12, 8), []);
  const wire = useMemo(() => new THREE.CylinderGeometry(0.012, 0.012, 1, 4), []);
  const items: Place[] = [];
  const bulbs: Place[] = [];
  const wires: Place[] = [];
  for (let z = -29; z <= 0; z += 6)
    for (const x of [-5, 5]) {
      items.push({ p: [x, 7.9, z] });
      bulbs.push({ p: [x, 7.72, z] });
      wires.push({ p: [x, 7.9 + (H - 7.9) / 2, z], s: [1, H - 7.9, 1] });
    }
  return (
    <group>
      <Instances geometry={cone} material={shade} items={items} castShadow={false} />
      <Instances geometry={ball} material={bulb} items={bulbs} castShadow={false} />
      <Instances geometry={wire} material={shade} items={wires} castShadow={false} />
      {!compact &&
        [-24, -12, 0].map((z) => <pointLight key={z} position={[0, 7.4, z]} color="#FFD7A3" intensity={14} distance={16} decay={1.6} />)}
    </group>
  );
}

/* ── the conveyor: runs from the packing station out through the loading bay ── */

function Conveyor() {
  const carton = useCartonTexture();
  const len = CONVEYOR.to - CONVEYOR.from;
  const mid = (CONVEYOR.to + CONVEYOR.from) / 2;
  const belt = useCanvasTexture(
    128,
    32,
    (g) => {
      g.fillStyle = "#3a3330";
      g.fillRect(0, 0, 128, 32);
      g.fillStyle = "rgba(255,255,255,0.08)";
      for (let i = 0; i < 128; i += 16) g.fillRect(i, 0, 3, 32);
    },
    [],
    [len / 1.2, 1],
  );
  const railMat = useMemo(() => new THREE.MeshStandardMaterial({ color: C.orange, roughness: 0.45, metalness: 0.3 }), []);
  const legMat = useMemo(() => new THREE.MeshStandardMaterial({ color: C.oliveDark, roughness: 0.5, metalness: 0.4 }), []);
  const cartonMat = useMemo(() => new THREE.MeshStandardMaterial({ map: carton, roughness: 0.88 }), [carton]);
  const box = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const legs: Place[] = [];
  for (let x = CONVEYOR.from + 0.5; x < CONVEYOR.to; x += 2.5) for (const dz of [-0.45, 0.45]) legs.push({ p: [x, CONVEYOR.y / 2, CONVEYOR.z + dz], s: [0.08, CONVEYOR.y, 0.08] });
  const boxes = useRef<THREE.InstancedMesh>(null);
  const N = 9;
  const o = useMemo(() => new THREE.Object3D(), []);
  useFrame(({ clock }, dt) => {
    belt.offset.x -= dt * 0.55;
    const m = boxes.current;
    if (!m) return;
    for (let i = 0; i < N; i++) {
      const x = CONVEYOR.from + 0.5 + (((clock.elapsedTime * 0.65 + (i * len) / N) % (len - 1)) + len - 1) % (len - 1);
      o.position.set(x, CONVEYOR.y + 0.27, CONVEYOR.z + ((i * 37) % 5) * 0.03 - 0.06);
      o.rotation.set(0, ((i * 13) % 7) * 0.02, 0);
      o.scale.set(0.62, 0.44, 0.5);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <group>
      <mesh position={[mid, CONVEYOR.y, CONVEYOR.z]} receiveShadow>
        <boxGeometry args={[len, 0.06, 0.9]} />
        <meshStandardMaterial map={belt} roughness={0.8} />
      </mesh>
      {[-0.5, 0.5].map((dz) => (
        <mesh key={dz} material={railMat} position={[mid, CONVEYOR.y + 0.05, CONVEYOR.z + dz]} castShadow>
          <boxGeometry args={[len, 0.16, 0.08]} />
        </mesh>
      ))}
      <Instances geometry={box} material={legMat} items={legs} />
      <instancedMesh ref={boxes} args={[box, cartonMat, N]} castShadow frustumCulled={false} />
    </group>
  );
}

/* ── signage ── */

function Signage() {
  const logo = useLogo();
  const sign = useCanvasTexture(
    1024,
    360,
    (g) => {
      g.clearRect(0, 0, 1024, 360);
      g.drawImage(logo, 130, 95, 340, 210, 312, 20, 400, 248);
    },
    [logo],
  );
  return (
    <group>
      {/* logo painted high on the left wall, near the entrance */}
      <mesh position={[-WX + 0.05, 9.25, -8]} rotation-y={Math.PI / 2}>
        <planeGeometry args={[7.2, 2.5]} />
        <meshStandardMaterial map={sign} transparent roughness={0.9} />
      </mesh>
      <mesh position={[0, H - 0.55, FRONT - 0.05]} rotation-y={Math.PI}>
        <planeGeometry args={[5.4, 1.9]} />
        <meshStandardMaterial map={sign} transparent roughness={0.9} />
      </mesh>
    </group>
  );
}

/* ── the LED screen on the back wall ── */

export function Screen({ map, glow }: { map: THREE.Texture | null; glow: THREE.Color }) {
  const frame = useMemo(() => new THREE.MeshStandardMaterial({ color: "#2B2522", roughness: 0.35, metalness: 0.6 }), []);
  const truss = useMemo(() => new THREE.MeshStandardMaterial({ color: C.oliveDark, roughness: 0.5, metalness: 0.45 }), []);
  const halo = useCanvasTexture(256, 256, (g) => {
    const gr = g.createRadialGradient(128, 128, 20, 128, 128, 128);
    gr.addColorStop(0, "rgba(255,255,255,0.55)");
    gr.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = gr;
    g.fillRect(0, 0, 256, 256);
  });
  const haloMat = useMemo(() => new THREE.MeshBasicMaterial({ map: halo, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, fog: false, opacity: 0.32 }), [halo]);
  useFrame(() => {
    haloMat.color.copy(glow);
  });
  const { x, y, z, w, h } = SCREEN;
  return (
    <group position={[x, y, z]}>
      {/* soft spill of the screen's light on the wall around it */}
      <mesh material={haloMat} position-z={-0.04} scale={[w * 1.9, h * 2.1, 1]}>
        <planeGeometry />
      </mesh>
      <mesh material={frame} position-z={-0.12} castShadow receiveShadow>
        <boxGeometry args={[w + 0.5, h + 0.5, 0.22]} />
      </mesh>
      <mesh position-z={0.005}>
        <planeGeometry args={[w, h]} />
        {map ? <meshBasicMaterial map={map} toneMapped={false} fog={false} /> : <meshBasicMaterial color="#1b1512" fog={false} />}
      </mesh>
      {/* mounting truss and two support legs down to a plinth */}
      <mesh material={truss} position={[0, h / 2 + 0.55, -0.15]} castShadow>
        <boxGeometry args={[w + 1.2, 0.35, 0.35]} />
      </mesh>
      {[-w / 2 - 0.45, w / 2 + 0.45].map((dx) => (
        <mesh key={dx} material={truss} position={[dx, -y / 2 + 0.2, -0.15]} castShadow>
          <boxGeometry args={[0.3, y + h / 2 + 0.2, 0.3]} />
        </mesh>
      ))}
      <mesh position={[0, -y + 0.25, 0.6]} receiveShadow castShadow>
        <boxGeometry args={[w + 1.6, 0.5, 1.6]} />
        <meshStandardMaterial color={C.terracotta} roughness={0.85} />
      </mesh>
    </group>
  );
}

export function Warehouse({ compact, children }: { compact: boolean; children?: ReactNode }) {
  return (
    <group>
      <Shell compact={compact} />
      <Racks compact={compact} />
      <FloorLife compact={compact} />
      <ProductBoards />
      <Pendants compact={compact} />
      <Conveyor />
      <Signage />
      {children}
    </group>
  );
}
