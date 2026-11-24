"use client";

import { useEffect, useMemo } from "react";
import * as THREE from "three";
import { Instanced, type Inst } from "@/components/world3/parts";
import { boxGeo, canvasTexture, glowMat, mat, rng, windowTex } from "./kit";
import { useTex } from "./bits";

// soft clouds for the daytime sky: each one a few overlapping glow puffs
const CLOUDS = (() => {
  const r = rng(77);
  return Array.from({ length: 14 }, (_, i) => {
    const a = (i / 14) * Math.PI * 2 + r() * 0.3;
    const d = 300 + r() * 120;
    const y = 110 + r() * 120;
    return {
      p: [Math.cos(a) * d, y, Math.sin(a) * d] as [number, number, number],
      puffs: Array.from({ length: 4 + Math.floor(r() * 3) }, (_, k) => ({ p: [(k - 2) * 16 + r() * 8, r() * 6, r() * 6] as [number, number, number], s: 40 + r() * 30 })),
    };
  });
})();

/** Sky dome for the outdoor chapters: golden hour (4.2) or a clear daytime sky with soft clouds (4.3). */
export function Sky({ chapter, compact }: { chapter: "4.2" | "4.3"; compact: boolean }) {
  const night = false;
  const day = chapter === "4.3";
  const tex = useTex(() =>
    canvasTexture(4, 512, (g) => {
      const grd = g.createLinearGradient(0, 0, 0, 512);
      if (night) {
        grd.addColorStop(0, "#050817");
        grd.addColorStop(0.35, "#0B1230");
        grd.addColorStop(0.5, "#27285A");
        grd.addColorStop(0.53, "#3B2D5E");
        grd.addColorStop(1, "#0C0F22");
      } else if (day) {
        grd.addColorStop(0, "#3F8FD8");
        grd.addColorStop(0.3, "#86C1EE");
        grd.addColorStop(0.47, "#CFE9F8");
        grd.addColorStop(0.52, "#EEF6F4");
        grd.addColorStop(1, "#DCE7D8");
      } else {
        grd.addColorStop(0, "#4F7CC0");
        grd.addColorStop(0.3, "#93A9D4");
        grd.addColorStop(0.47, "#F7C98F");
        grd.addColorStop(0.52, "#FFB070");
        grd.addColorStop(1, "#E9B48A");
      }
      g.fillStyle = grd;
      g.fillRect(0, 0, 4, 512);
    }),
  );
  const stars = useMemo(() => {
    if (!night) return null;
    const r = rng(19);
    const n = compact ? 500 : 1100;
    const pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2;
      const e = 0.06 + Math.pow(r(), 0.7) * 1.4;
      pos[i * 3] = Math.cos(a) * Math.cos(e) * 460;
      pos[i * 3 + 1] = Math.sin(e) * 460;
      pos[i * 3 + 2] = Math.sin(a) * Math.cos(e) * 460;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    return g;
  }, [night, compact]);
  useEffect(() => () => stars?.dispose(), [stars]);
  return (
    <group>
      <mesh renderOrder={-1}>
        <sphereGeometry args={[480, 32, 24]} />
        <meshBasicMaterial map={tex} side={THREE.BackSide} fog={false} depthWrite={false} />
      </mesh>
      {stars && (
        <points geometry={stars}>
          <pointsMaterial color="#DCE6FF" size={1.6} sizeAttenuation={false} fog={false} transparent opacity={0.85} depthWrite={false} />
        </points>
      )}
      {night ? (
        <>
          <mesh position={[-160, 210, -300]}>
            <circleGeometry args={[9, 32]} />
            <meshBasicMaterial color="#F4F1E6" fog={false} />
          </mesh>
          <sprite position={[-160, 210, -299]} scale={[70, 70, 1]} material={glowMat("#AFC4FF", 0.35)} />
        </>
      ) : day ? (
        <>
          {/* a high, bright sun and soft clouds */}
          <mesh position={[-180, 300, -260]} lookAt={[0, 0, 0]}>
            <circleGeometry args={[12, 32]} />
            <meshBasicMaterial color="#FFFBE8" fog={false} />
          </mesh>
          <sprite position={[-178, 298, -258]} scale={[150, 150, 1]} material={glowMat("#FFF3C4", 0.5)} />
          {CLOUDS.map((c, i) => (
            <group key={i} position={c.p}>
              {c.puffs.map((q, k) => (
                <sprite key={k} position={q.p} scale={[q.s, q.s * 0.55, 1]} material={glowMat("#FFFFFF", 0.75)} />
              ))}
            </group>
          ))}
        </>
      ) : (
        <>
          <mesh position={[-300, 130, -235]} lookAt={[0, 0, 0]}>
            <circleGeometry args={[14, 32]} />
            <meshBasicMaterial color="#FFF0C8" fog={false} />
          </mesh>
          <sprite position={[-298, 130, -233]} scale={[160, 160, 1]} material={glowMat("#FFC27A", 0.55)} />
        </>
      )}
    </group>
  );
}

/**
 * Instanced city of towers around a centre, kept clear inside `clear`. Night: lit windows + red aviation lights.
 * Ground plane with a street grid (glowing at night).
 */
export function City({ night, compact, clear = 40, outer = 230, seed = 5, groundY = 0 }: { night: boolean; compact: boolean; clear?: number; outer?: number; seed?: number; groundY?: number }) {
  const styles = useMemo(
    () =>
      night
        ? [
            windowTex("n1", "#141C33", "#0B1022", "#FFD58A", 0.42, 8, 24),
            windowTex("n2", "#18233F", "#0D1328", "#BFE3FF", 0.35, 6, 30),
            windowTex("n3", "#1D1A30", "#100E1D", "#FFC07A", 0.5, 10, 20),
          ]
        : [
            windowTex("d1", "#8DA9C7", "#D9CBB8", "#F6E7CF", 0.12, 8, 24),
            windowTex("d2", "#6F8FB0", "#E7DED2", "#FFF4DE", 0.1, 6, 30),
            windowTex("d3", "#A7B6C6", "#C9B9A6", "#FFF1D6", 0.08, 10, 20),
          ],
    [night],
  );
  const mats = useMemo(() => styles.map((t) => new THREE.MeshStandardMaterial({ map: t, roughness: night ? 0.6 : 0.5, metalness: night ? 0.1 : 0.3, ...(night ? { emissive: new THREE.Color("#FFFFFF"), emissiveMap: t, emissiveIntensity: 0.9 } : {}) })), [styles, night]);
  useEffect(() => () => mats.forEach((m) => m.dispose()), [mats]);
  const { towers, tops, beacons } = useMemo(() => {
    const r = rng(seed);
    const towers: Inst[][] = [[], [], []];
    const tops: Inst[] = [];
    const beacons: [number, number, number][] = [];
    const n = compact ? 120 : 260;
    for (let i = 0; i < n; i++) {
      const a = r() * Math.PI * 2;
      const d = clear + Math.pow(r(), 0.8) * (outer - clear);
      const x = Math.cos(a) * d;
      const z = Math.sin(a) * d;
      const w = 8 + r() * 12;
      const dd = 8 + r() * 12;
      const tall = d < clear + 60 ? 0.6 : 1;
      const h = (14 + Math.pow(r(), 2.2) * 80) * tall + 6;
      const k = Math.floor(r() * 3);
      towers[k].push({ p: [x, groundY + h / 2, z], s: [w, h, dd], r: [0, Math.round(r() * 3) * 0.2, 0] });
      tops.push({ p: [x, groundY + h + 0.6, z], s: [w * 0.6, 1.2, dd * 0.6] });
      if (night && h > 60 && beacons.length < 24) beacons.push([x, groundY + h + 3, z]);
    }
    return { towers, tops, beacons };
  }, [seed, compact, clear, outer, night, groundY]);
  const ground = useTex(() => {
    const t = canvasTexture(256, 256, (g) => {
      g.fillStyle = night ? "#0E1120" : "#B9A58E";
      g.fillRect(0, 0, 256, 256);
      g.fillStyle = night ? "#2A2440" : "#8F8070";
      g.fillRect(0, 118, 256, 20);
      g.fillRect(118, 0, 20, 256);
      if (night) {
        g.fillStyle = "#FFCF7A";
        for (let i = 0; i < 256; i += 16) {
          g.fillRect(i, 116, 4, 3);
          g.fillRect(i + 8, 137, 4, 3);
          g.fillRect(116, i, 3, 4);
          g.fillRect(137, i + 8, 3, 4);
        }
      }
    });
    t.wrapS = t.wrapT = THREE.RepeatWrapping;
    t.repeat.set(40, 40);
    return t;
  });
  return (
    <group>
      {towers.map((items, k) => (
        <Instanced key={k} geometry={boxGeo()} material={mats[k]} items={items} />
      ))}
      <Instanced geometry={boxGeo()} material={mat(night ? "#141828" : "#9C8C7C", 0.8)} items={tops} />
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, groundY - 0.05, 0]}>
        <planeGeometry args={[1000, 1000]} />
        {night ? <meshStandardMaterial map={ground} emissiveMap={ground} emissive="#FFFFFF" emissiveIntensity={0.7} roughness={0.9} /> : <meshStandardMaterial map={ground} roughness={0.95} />}
      </mesh>
      {beacons.map((p, i) => (
        <sprite key={i} position={p} scale={[5, 5, 1]} material={glowMat("#FF3B3B", 0.9)} />
      ))}
    </group>
  );
}
