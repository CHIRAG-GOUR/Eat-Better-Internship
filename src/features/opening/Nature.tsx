"use client";

import { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { C, Instances, useCanvasTexture, type Place } from "./Warehouse";
import { PATH, POND, WORLDS, freedom, heightAt, pathDist, seeded } from "./layout";

/**
 * The land around the five worlds, built to feel like a real Rajasthani countryside in warm daylight: rolling ground
 * that blends sand, dry grass and green patches; thousands of grass tufts; marigold and bougainvillea flowers; rocks;
 * neem trees and date palms; a pond with reeds; the Aravalli ridges in the distance; slow clouds and a few birds.
 * The paved path has kerbs, lamps and benches. Everything repeated is instanced (a few draw calls each).
 */

const V = new THREE.Vector3();

export function Sky() {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        side: THREE.BackSide,
        depthWrite: false,
        fog: false,
        uniforms: { top: { value: new THREE.Color("#A9CCE0") }, mid: { value: new THREE.Color("#EFE5D8") }, bottom: { value: new THREE.Color("#F4DEC4") } },
        vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
        fragmentShader:
          "uniform vec3 top; uniform vec3 mid; uniform vec3 bottom; varying vec3 vP; void main(){ float h = vP.y; vec3 c = h > 0.0 ? mix(mid, top, smoothstep(0.0, 0.5, h)) : mix(mid, bottom, smoothstep(0.0, -0.2, h)); gl_FragColor = vec4(c, 1.0); }",
      }),
    [],
  );
  return (
    <mesh material={mat} position={[80, 0, -20]}>
      <sphereGeometry args={[440, 32, 16]} />
    </mesh>
  );
}

/* ── the ground: one displaced sheet with painted vertex colours ── */

function Ground({ compact }: { compact: boolean }) {
  const geo = useMemo(() => {
    const W = 520;
    const D = 380;
    const seg = compact ? [180, 130] : [300, 220];
    const g = new THREE.PlaneGeometry(W, D, seg[0], seg[1]);
    g.rotateX(-Math.PI / 2);
    g.translate(80, 0, -30);
    const pos = g.attributes.position;
    const col = new Float32Array(pos.count * 3);
    const sand = new THREE.Color("#E3CFA6");
    const dry = new THREE.Color("#CDBB86");
    const green = new THREE.Color("#93A05A");
    const deep = new THREE.Color("#7E8C4C");
    const c = new THREE.Color();
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const z = pos.getZ(i);
      pos.setY(i, heightAt(x, z) - 0.02);
      // patches of green that follow the land, sandier near the path and plazas
      const n = 0.5 + 0.5 * Math.sin(x * 0.07 + Math.cos(z * 0.05) * 2) * Math.cos(z * 0.09 - x * 0.02);
      const f = freedom(x, z);
      c.copy(sand).lerp(dry, 0.35 + 0.3 * Math.sin(x * 0.21 + z * 0.17));
      c.lerp(n > 0.55 ? deep : green, Math.min(1, Math.max(0, (n - 0.35) * 1.6)) * (0.35 + 0.65 * f));
      col.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute("color", new THREE.BufferAttribute(col, 3));
    g.computeVertexNormals();
    return g;
  }, [compact]);
  const grain = useCanvasTexture(
    512,
    512,
    (g) => {
      g.fillStyle = "#fff";
      g.fillRect(0, 0, 512, 512);
      for (let i = 0; i < 26000; i++) {
        const v = 200 + Math.random() * 55;
        g.fillStyle = `rgba(${v},${v - 8},${v - 20},${0.25 + Math.random() * 0.35})`;
        g.fillRect(Math.random() * 512, Math.random() * 512, 1.5, 1.5);
      }
    },
    [],
    [60, 44],
  );
  return (
    <mesh geometry={geo} receiveShadow>
      <meshStandardMaterial vertexColors map={grain} roughness={0.96} />
    </mesh>
  );
}

/** points on open land (off the path, plazas, yard and pond) */
function scatter(n: number, seed: number, minFree = 0.6, area: [number, number, number, number] = [-50, 200, -110, 50]) {
  const rnd = seeded(seed);
  const out: [number, number][] = [];
  for (let tries = 0; out.length < n && tries < n * 12; tries++) {
    const x = area[0] + rnd() * (area[1] - area[0]);
    const z = area[2] + rnd() * (area[3] - area[2]);
    if (freedom(x, z) >= minFree) out.push([x, z]);
  }
  return out;
}

function Grass({ compact }: { compact: boolean }) {
  const items = useMemo(() => {
    const rnd = seeded(5);
    const greens = ["#8F9B55", "#A2AB63", "#B7B072", "#7D8A47", "#C2B57B"];
    return scatter(compact ? 1600 : 6000, 21, 0.35, [-40, 190, -90, 40])
      .filter(([x, z]) => !(x > -14 && x < 14 && z > 4))
      .map(([x, z]): Place => {
        const s = 0.32 + rnd() * 0.4;
        return { p: [x, heightAt(x, z), z], s: [s, s * (0.7 + rnd() * 0.6), s], r: [0, rnd() * 6.3, 0], c: greens[Math.floor(rnd() * greens.length)] };
      });
  }, [compact]);
  // a tuft: three crossed blades
  const geo = useMemo(() => {
    const parts = [0, 1.05, 2.1].map((a) => {
      const g = new THREE.ConeGeometry(0.1, 0.75, 3, 1, true);
      g.translate(0, 0.37, 0);
      g.rotateZ(0.18);
      g.rotateY(a);
      return g;
    });
    const merged = new THREE.BufferGeometry();
    const pos: number[] = [];
    const nor: number[] = [];
    for (const p of parts) {
      const ng = p.toNonIndexed();
      pos.push(...(ng.attributes.position.array as Float32Array));
      nor.push(...(ng.attributes.normal.array as Float32Array));
    }
    merged.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
    merged.setAttribute("normal", new THREE.Float32BufferAttribute(nor, 3));
    return merged;
  }, []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#ffffff", roughness: 0.9, side: THREE.DoubleSide }), []);
  return <Instances geometry={geo} material={mat} items={items} castShadow={false} />;
}

function Flowers({ compact }: { compact: boolean }) {
  const items = useMemo(() => {
    const rnd = seeded(9);
    const cols = ["#F29B1D", "#F5C02A", "#E2507A", "#F07B3F", "#FFF1E0", "#C2388D"];
    const out: Place[] = [];
    // flower beds around each plaza and scattered clumps in the fields
    for (const [wx, wz] of WORLDS)
      for (let k = 0; k < (compact ? 60 : 160); k++) {
        const a = rnd() * Math.PI * 2;
        const r = 10.8 + rnd() * 1.6;
        const x = wx + Math.cos(a) * r;
        const z = wz + Math.sin(a) * r;
        if (pathDist(x, z) < 2.6) continue;
        out.push({ p: [x, 0.25 + rnd() * 0.25, z], s: [1, 1, 1], c: cols[Math.floor(rnd() * cols.length)] });
      }
    for (const [x, z] of scatter(compact ? 40 : 110, 33, 0.5, [-20, 180, -80, 40])) {
      const c = cols[Math.floor(rnd() * cols.length)];
      for (let k = 0; k < 7; k++) {
        const fx = x + (rnd() - 0.5) * 2.4;
        const fz = z + (rnd() - 0.5) * 2.4;
        out.push({ p: [fx, heightAt(fx, fz) + 0.3 + rnd() * 0.2, fz], c });
      }
    }
    return out;
  }, [compact]);
  const geo = useMemo(() => new THREE.IcosahedronGeometry(0.17, 0), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fff", roughness: 0.7 }), []);
  // little bushes under the flowers around the plazas
  const bushes = useMemo(() => {
    const rnd = seeded(17);
    const out: Place[] = [];
    for (const [wx, wz] of WORLDS)
      for (let k = 0; k < 26; k++) {
        const a = (k / 26) * Math.PI * 2 + rnd() * 0.1;
        const x = wx + Math.cos(a) * 11.2;
        const z = wz + Math.sin(a) * 11.2;
        if (pathDist(x, z) < 3) continue;
        const s = 0.7 + rnd() * 0.5;
        out.push({ p: [x, 0.25, z], s: [s * 1.2, s * 0.8, s * 1.2], c: rnd() < 0.5 ? "#6F7D3E" : "#83904A" });
      }
    return out;
  }, []);
  const bushGeo = useMemo(() => new THREE.IcosahedronGeometry(0.7, 1), []);
  const bushMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fff", roughness: 0.9, flatShading: true }), []);
  return (
    <group>
      <Instances geometry={bushGeo} material={bushMat} items={bushes} />
      <Instances geometry={geo} material={mat} items={items} castShadow={false} />
    </group>
  );
}

function Rocks({ compact }: { compact: boolean }) {
  const items = useMemo(() => {
    const rnd = seeded(13);
    return scatter(compact ? 50 : 140, 41, 0.55)
      .filter(([x, z]) => !(x > -14 && x < 14 && z > 4))
      .map(([x, z]): Place => {
      const s = 0.3 + rnd() * 1.3;
      return { p: [x, heightAt(x, z) + s * 0.2, z], s: [s * (1 + rnd()), s * 0.7, s], r: [rnd(), rnd() * 6, rnd()], c: rnd() < 0.5 ? "#9C8763" : "#8A775A" };
    });
  }, [compact]);
  const geo = useMemo(() => new THREE.DodecahedronGeometry(1, 0), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fff", roughness: 0.95, flatShading: true }), []);
  return <Instances geometry={geo} material={mat} items={items} />;
}

/** neem-like trees (trunk + several crown clumps) and date palms */
function Trees({ compact }: { compact: boolean }) {
  const { trunks, crowns, palmTrunks, fronds } = useMemo(() => {
    const rnd = seeded(11);
    const trunks: Place[] = [];
    const crowns: Place[] = [];
    const greens = ["#7C8B45", "#8E9A50", "#6D7C3C", "#9AA35A", "#748543"];
    for (const [x, z] of scatter(compact ? 80 : 190, 7, 0.75, [-60, 210, -120, 60])) {
      const y = heightAt(x, z);
      const s = 0.8 + rnd() * 0.8;
      trunks.push({ p: [x, y + 1.5 * s, z], s: [s, s, s], r: [(rnd() - 0.5) * 0.15, rnd() * 6, (rnd() - 0.5) * 0.15], c: "#7A5636" });
      const g = greens[Math.floor(rnd() * greens.length)];
      for (let k = 0; k < 4; k++) {
        const a = rnd() * 6.3;
        const r = k === 0 ? 0 : 0.9 * s;
        const cs = (k === 0 ? 1.7 : 1.15 + rnd() * 0.4) * s;
        crowns.push({ p: [x + Math.cos(a) * r, y + (3.4 + rnd() * 0.9) * s, z + Math.sin(a) * r], s: [cs, cs * 0.82, cs], r: [rnd(), rnd(), rnd()], c: g });
      }
    }
    // date palms near the plazas and the pond
    const palmTrunks: Place[] = [];
    const fronds: Place[] = [];
    const spots: [number, number][] = [];
    for (const [wx, wz] of WORLDS) for (const a of [0.6, 2.4, 3.9]) spots.push([wx + Math.cos(a) * 14, wz + Math.sin(a) * 14]);
    for (let k = 0; k < 7; k++) spots.push([POND[0] + Math.cos(k) * (POND[2] + 3), POND[1] + Math.sin(k) * (POND[2] + 3)]);
    for (const [x, z] of spots) {
      if (pathDist(x, z) < 4) continue;
      const h = 6 + rnd() * 3;
      const lean = (rnd() - 0.5) * 0.25;
      palmTrunks.push({ p: [x, h / 2, z], s: [1, h, 1], r: [lean, 0, lean * 0.5], c: "#8A6A48" });
      const top: [number, number, number] = [x + Math.sin(lean * 0.5) * h * 0.5, h, z + Math.sin(lean) * h * 0.5];
      for (let f = 0; f < 9; f++) {
        const a = (f / 9) * Math.PI * 2 + rnd() * 0.3;
        fronds.push({ p: [top[0] + Math.cos(a) * 1.3, top[1] - 0.2, top[2] + Math.sin(a) * 1.3], s: [0.55, 0.08, 2.8], r: [0.35, -a + Math.PI / 2, 0], c: f % 2 ? "#7C8B45" : "#6B7A3A" });
      }
    }
    return { trunks, crowns, palmTrunks, fronds };
  }, [compact]);
  const trunkGeo = useMemo(() => new THREE.CylinderGeometry(0.17, 0.3, 3, 7), []);
  const crownGeo = useMemo(() => new THREE.IcosahedronGeometry(1, 1), []);
  const palmGeo = useMemo(() => new THREE.CylinderGeometry(0.16, 0.24, 1, 7), []);
  const frondGeo = useMemo(() => {
    const g = new THREE.SphereGeometry(1, 8, 4);
    g.translate(0, 0, 0.9);
    return g;
  }, []);
  const white = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fff", roughness: 0.88 }), []);
  const leaf = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fff", roughness: 0.85, flatShading: true }), []);
  return (
    <group>
      <Instances geometry={trunkGeo} material={white} items={trunks} />
      <Instances geometry={crownGeo} material={leaf} items={crowns} />
      <Instances geometry={palmGeo} material={white} items={palmTrunks} />
      <Instances geometry={frondGeo} material={leaf} items={fronds} />
    </group>
  );
}

function Pond() {
  const [x, z, r] = POND;
  const water = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(({ clock }) => {
    if (water.current) water.current.emissiveIntensity = 0.06 + Math.sin(clock.elapsedTime * 0.8) * 0.02;
  });
  const reeds = useMemo(() => {
    const rnd = seeded(29);
    const out: Place[] = [];
    for (let k = 0; k < 70; k++) {
      const a = rnd() * Math.PI * 2;
      const rr = r - 0.4 + rnd() * 1.2;
      out.push({ p: [x + Math.cos(a) * rr, 0.6, z + Math.sin(a) * rr], s: [1, 0.8 + rnd() * 0.8, 1], r: [(rnd() - 0.5) * 0.3, 0, (rnd() - 0.5) * 0.3], c: rnd() < 0.5 ? "#7E8C4C" : "#9AA35A" });
    }
    return out;
  }, [x, z, r]);
  const reedGeo = useMemo(() => new THREE.CylinderGeometry(0.03, 0.05, 1.4, 4), []);
  const reedMat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fff", roughness: 0.9 }), []);
  return (
    <group>
      <mesh position={[x, 0.01, z]} rotation-x={-Math.PI / 2} receiveShadow>
        <circleGeometry args={[r + 1.2, 48]} />
        <meshStandardMaterial color="#B9A27C" roughness={1} />
      </mesh>
      <mesh position={[x, 0.06, z]} rotation-x={-Math.PI / 2}>
        <circleGeometry args={[r, 48]} />
        <meshStandardMaterial ref={water} color="#6FA3A6" emissive="#BFE3E2" emissiveIntensity={0.06} roughness={0.08} metalness={0.25} />
      </mesh>
      <Instances geometry={reedGeo} material={reedMat} items={reeds} castShadow={false} />
    </group>
  );
}

/** the Aravalli ridges far away */
function Hills() {
  const items = useMemo(() => {
    const rnd = seeded(3);
    const out: Place[] = [];
    for (let i = 0; i < 14; i++) out.push({ p: [-60 + i * 22 + rnd() * 10, -8, -150 - rnd() * 40], s: [32 + rnd() * 26, 20 + rnd() * 18, 22], c: i % 2 ? "#BCAF8C" : "#AFA586" });
    for (let i = 0; i < 6; i++) out.push({ p: [230 + rnd() * 30, -8, -120 + i * 34], s: [26, 16 + rnd() * 12, 30], c: "#C2B490" });
    return out;
  }, []);
  const geo = useMemo(() => new THREE.SphereGeometry(1, 24, 12), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fff", roughness: 1 }), []);
  return <Instances geometry={geo} material={mat} items={items} castShadow={false} />;
}

function Clouds() {
  const group = useRef<THREE.Group>(null);
  const items = useMemo(() => {
    const rnd = seeded(19);
    const out: Place[] = [];
    for (let c = 0; c < 11; c++) {
      const cx = -40 + rnd() * 260;
      const cz = -160 + rnd() * 150;
      const cy = 62 + rnd() * 24;
      for (let k = 0; k < 6; k++) {
        const s = 5 + rnd() * 6;
        out.push({ p: [cx + (k - 3) * 5 + rnd() * 3, cy + rnd() * 3, cz + rnd() * 6], s: [s * 1.5, s * 0.6, s] });
      }
    }
    return out;
  }, []);
  const geo = useMemo(() => new THREE.SphereGeometry(1, 14, 10), []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: "#FFFFFF", emissive: "#FFF6EA", emissiveIntensity: 0.45, roughness: 1, transparent: true, opacity: 0.92 }), []);
  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    g.position.x += dt * 0.6;
    if (g.position.x > 60) g.position.x = -60;
  });
  return (
    <group ref={group}>
      <Instances geometry={geo} material={mat} items={items} castShadow={false} receiveShadow={false} />
    </group>
  );
}

/** a few birds wheeling over the worlds */
function Birds() {
  const ref = useRef<THREE.InstancedMesh>(null);
  const N = 9;
  const o = useMemo(() => new THREE.Object3D(), []);
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.Float32BufferAttribute([0, 0, 0.3, -1, 0.25, -0.2, 0, 0, -0.1, 0, 0, 0.3, 1, 0.25, -0.2, 0, 0, -0.1], 3));
    g.computeVertexNormals();
    return g;
  }, []);
  useFrame(({ clock }) => {
    const m = ref.current;
    if (!m) return;
    const t = clock.elapsedTime;
    for (let i = 0; i < N; i++) {
      const flock = i < 5 ? 0 : 1;
      const a = t * (0.12 + flock * 0.03) + i * 0.32;
      const cx = flock ? 120 : 64;
      const cz = flock ? -30 : -12;
      o.position.set(cx + Math.cos(a) * (26 + i), 24 + flock * 6 + Math.sin(t * 0.7 + i) * 1.2, cz + Math.sin(a) * (20 + i));
      o.rotation.set(0, -a, Math.sin(t * 8 + i) * 0.35);
      o.scale.setScalar(0.9);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    }
    m.instanceMatrix.needsUpdate = true;
  });
  return (
    <instancedMesh ref={ref} args={[geo, undefined, N]} frustumCulled={false}>
      <meshStandardMaterial color="#3B2D27" side={THREE.DoubleSide} />
    </instancedMesh>
  );
}

/* ── the path: paving, kerbs, lamps and benches ── */

export function Path({ compact }: { compact: boolean }) {
  const { road, kerbs } = useMemo(() => {
    const pts = PATH.getSpacedPoints(320);
    const ribbon = (half: number, y: number, offset = 0) => {
      const pos: number[] = [];
      const uv: number[] = [];
      const idx: number[] = [];
      let dist = 0;
      pts.forEach((p, i) => {
        const t = PATH.getTangentAt(i / (pts.length - 1));
        const n = new THREE.Vector3(-t.z, 0, t.x).normalize();
        if (i) dist += p.distanceTo(pts[i - 1]);
        for (const s of [-1, 1]) {
          const q = p.clone().addScaledVector(n, offset + s * half);
          pos.push(q.x, y, q.z);
          uv.push(s < 0 ? 0 : 1, dist / 3.2);
        }
        if (i) {
          const a = (i - 1) * 2;
          idx.push(a, a + 2, a + 1, a + 1, a + 2, a + 3);
        }
      });
      const g = new THREE.BufferGeometry();
      g.setAttribute("position", new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute("uv", new THREE.Float32BufferAttribute(uv, 2));
      g.setIndex(idx);
      g.computeVertexNormals();
      return g;
    };
    return { road: ribbon(1.75, 0.035), kerbs: [ribbon(0.16, 0.09, -1.85), ribbon(0.16, 0.09, 1.85)] };
  }, []);
  const tiles = useCanvasTexture(
    256,
    256,
    (g) => {
      // sandstone pavers, laid in a running bond, each a slightly different shade
      for (let row = 0; row < 4; row++)
        for (let col = -1; col < 3; col++) {
          const x = col * 128 + (row % 2) * 64;
          const v = 214 + Math.floor(Math.random() * 22);
          g.fillStyle = `rgb(${v + 12},${v},${v - 28})`;
          g.fillRect(x + 2, row * 64 + 2, 124, 60);
        }
      g.globalCompositeOperation = "destination-over";
      g.fillStyle = "#A88E6A";
      g.fillRect(0, 0, 256, 256);
      g.globalCompositeOperation = "source-over";
      for (let i = 0; i < 4000; i++) {
        g.fillStyle = `rgba(90,70,40,${Math.random() * 0.12})`;
        g.fillRect(Math.random() * 256, Math.random() * 256, 2, 2);
      }
    },
    [],
    [1, 1],
  );
  // lamps alternate sides every ~15 m; benches now and then
  const { posts, heads, benches, legs } = useMemo(() => {
    const posts: Place[] = [];
    const heads: Place[] = [];
    const benches: Place[] = [];
    const legs: Place[] = [];
    const len = PATH.getLength();
    const step = compact ? 24 : 15;
    let k = 0;
    for (let d = 8; d < len; d += step, k++) {
      const u = d / len;
      const p = PATH.getPointAt(u);
      const t = PATH.getTangentAt(u);
      const n = V.set(-t.z, 0, t.x).normalize().clone();
      const side = k % 2 ? 1 : -1;
      const q = p.clone().addScaledVector(n, side * 2.5);
      if (WORLDS.some(([wx, wz]) => Math.hypot(wx - q.x, wz - q.z) < 10.5)) continue;
      posts.push({ p: [q.x, 1.9, q.z], s: [1, 3.8, 1] });
      heads.push({ p: [q.x, 3.9, q.z] });
      if (k % 3 === 1) {
        const b = p.clone().addScaledVector(n, -side * 2.6);
        const ry = Math.atan2(t.x, t.z);
        benches.push({ p: [b.x, 0.5, b.z], s: [1.8, 0.1, 0.55], r: [0, ry + Math.PI / 2, 0] });
        benches.push({ p: [b.x - n.x * 0.25 * -side, 0.85, b.z - n.z * 0.25 * -side], s: [1.8, 0.5, 0.08], r: [0, ry + Math.PI / 2, 0] });
        legs.push({ p: [b.x, 0.25, b.z], s: [1.5, 0.5, 0.4], r: [0, ry + Math.PI / 2, 0] });
      }
    }
    return { posts, heads, benches, legs };
  }, [compact]);
  const box = useMemo(() => new THREE.BoxGeometry(1, 1, 1), []);
  const postGeo = useMemo(() => new THREE.CylinderGeometry(0.06, 0.09, 1, 8), []);
  const headGeo = useMemo(() => new THREE.SphereGeometry(0.26, 12, 8), []);
  const iron = useMemo(() => new THREE.MeshStandardMaterial({ color: C.oliveDark, roughness: 0.5, metalness: 0.5 }), []);
  const glow = useMemo(() => new THREE.MeshStandardMaterial({ color: "#fff", emissive: "#FFE2B0", emissiveIntensity: 0.8 }), []);
  const wood = useMemo(() => new THREE.MeshStandardMaterial({ color: C.wood, roughness: 0.75 }), []);
  return (
    <group>
      <mesh geometry={road} receiveShadow>
        <meshStandardMaterial map={tiles} roughness={0.85} />
      </mesh>
      {kerbs.map((g, i) => (
        <mesh key={i} geometry={g} receiveShadow>
          <meshStandardMaterial color="#D9C29A" roughness={0.8} />
        </mesh>
      ))}
      <Instances geometry={postGeo} material={iron} items={posts} />
      <Instances geometry={headGeo} material={glow} items={heads} castShadow={false} />
      <Instances geometry={box} material={wood} items={benches} />
      <Instances geometry={box} material={iron} items={legs} />
    </group>
  );
}

export function Nature({ compact }: { compact: boolean }) {
  return (
    <group>
      <Sky />
      <Ground compact={compact} />
      <Hills />
      <Grass compact={compact} />
      <Flowers compact={compact} />
      <Rocks compact={compact} />
      <Trees compact={compact} />
      <Pond />
      <Path compact={compact} />
      {!compact && <Clouds />}
      <Birds />
    </group>
  );
}
