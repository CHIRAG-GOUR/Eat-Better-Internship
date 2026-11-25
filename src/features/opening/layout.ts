import * as THREE from "three";
import { CONVEYOR } from "./Warehouse";

/**
 * Where things are outside the warehouse: the five worlds, the path that links them (it continues from the conveyor
 * belt), and the shape of the land. The ground rolls gently, but is flat on the path, the plazas and around the
 * warehouse so everything sits on it.
 */

export const WORLDS: [number, number][] = [
  [46, -4],
  [70, -27],
  [96, -10],
  [120, -33],
  [145, -14],
];

export const PATH = new THREE.CatmullRomCurve3(
  [
    [CONVEYOR.to - 1, CONVEYOR.z],
    [36, -4],
    ...WORLDS.flatMap(([x, z], i) => {
      // the path runs along the front of each plaza (worlds face +z), with a bend between them
      const front: [number, number] = [x, z + 7];
      const next = WORLDS[i + 1];
      return next ? [front, [(x + next[0]) / 2, (z + next[1]) / 2 + 8] as [number, number]] : [front, [x + 12, z + 9] as [number, number]];
    }),
  ].map(([x, z]) => new THREE.Vector3(x, 0, z)),
  false,
  "centripetal",
);

export const POND: [number, number, number] = [60, 24, 8]; // x, z, radius

const PATH_PTS = PATH.getSpacedPoints(140).map((p) => [p.x, p.z] as const);

/** distance from (x, z) to the path */
export function pathDist(x: number, z: number) {
  let d = Infinity;
  for (const [px, pz] of PATH_PTS) d = Math.min(d, (px - x) ** 2 + (pz - z) ** 2);
  return Math.sqrt(d);
}

const smooth = (a: number, b: number, v: number) => {
  const t = Math.min(1, Math.max(0, (v - a) / (b - a)));
  return t * t * (3 - 2 * t);
};

/** 0 where the land must be flat (path, plazas, warehouse yard, pond), 1 where it may roll */
export function freedom(x: number, z: number) {
  const yard = x > -26 && x < 30 && z > -44 && z < 16 ? 0 : 1;
  if (!yard) return 0;
  let f = smooth(4, 12, pathDist(x, z));
  for (const [wx, wz] of WORLDS) f = Math.min(f, smooth(12, 20, Math.hypot(wx - x, wz - z)));
  f = Math.min(f, smooth(POND[2] + 1, POND[2] + 6, Math.hypot(POND[0] - x, POND[1] - z)));
  return f;
}

/** gentle rolling hills */
export function heightAt(x: number, z: number) {
  const h = 1.3 * Math.sin(x * 0.042 + 1.3) * Math.cos(z * 0.051) + 0.8 * Math.sin(x * 0.11 + z * 0.07) + 0.45 * Math.cos(x * 0.19 - z * 0.13);
  return Math.max(0, h + 0.9) * freedom(x, z);
}

/** a small seeded random generator, so the scenery is the same on every visit */
export function seeded(seed: number) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
