"use client";

import { useLayoutEffect, useMemo, useRef } from "react";
import * as THREE from "three";
import { boxGeo, genericMaterials, GENERIC, PACK, PACK_SIZE, packMaterials, pouchGeo, type PackKind } from "./kit";

/** One placed pack: `id` is an official pack id (PACKS) or "g:<generic id>" for a generic category pack. */
export type PackItem = { id: string; p: [number, number, number]; ry?: number; tilt?: number; s?: number };

/** Like world3's Instanced, but takes a material array (pack boxes have a printed front face). */
export function InstancedMulti({ geometry, material, items, castShadow = false }: { geometry: THREE.BufferGeometry; material: THREE.Material | THREE.Material[]; items: { p: [number, number, number]; r?: [number, number, number]; s: [number, number, number] }[]; castShadow?: boolean }) {
  const ref = useRef<THREE.InstancedMesh>(null);
  useLayoutEffect(() => {
    const m = ref.current;
    if (!m) return;
    const o = new THREE.Object3D();
    items.forEach((it, i) => {
      o.position.set(...it.p);
      o.rotation.set(it.r?.[0] ?? 0, it.r?.[1] ?? 0, it.r?.[2] ?? 0);
      o.scale.set(...it.s);
      o.updateMatrix();
      m.setMatrixAt(i, o.matrix);
    });
    m.instanceMatrix.needsUpdate = true;
    m.computeBoundingSphere();
  }, [items]);
  if (!items.length) return null;
  return <instancedMesh key={items.length} ref={ref} args={[geometry, material, items.length]} castShadow={castShadow} />;
}

function kindOf(id: string): PackKind {
  if (id.startsWith("g:")) return GENERIC[id.slice(2)].kind;
  return PACK[id].kind;
}
export const sizeOf = (id: string) => PACK_SIZE[kindOf(id)];

/**
 * Many packs, grouped into one instanced draw per pack design. Packs stand on their bottom edge: `p` is the
 * centre of the pack's footprint on the shelf (y = shelf top). `items` must be memoised.
 */
export function Packs({ items, castShadow = false, lite = false }: { items: PackItem[]; castShadow?: boolean; /** plain boxes instead of pillow pouches (far shelves) */ lite?: boolean }) {
  const groups = useMemo(() => {
    const by = new Map<string, { p: [number, number, number]; r: [number, number, number]; s: [number, number, number] }[]>();
    for (const it of items) {
      const [w, h, d] = sizeOf(it.id);
      const k = it.s ?? 1;
      const list = by.get(it.id) ?? [];
      list.push({ p: [it.p[0], it.p[1] + (h * k) / 2, it.p[2]], r: [it.tilt ?? 0, it.ry ?? 0, 0], s: [w * k, h * k, d * k * (lite ? 0.75 : 1)] });
      by.set(it.id, list);
    }
    return [...by.entries()];
  }, [items, lite]);
  return (
    <>
      {groups.map(([id, list]) => {
        const generic = id.startsWith("g:");
        const kind = kindOf(id);
        const geo = lite || kind === "box" ? boxGeo() : pouchGeo();
        const material = generic ? genericMaterials(GENERIC[id.slice(2)]) : packMaterials(PACK[id]);
        return <InstancedMulti key={id} geometry={geo} material={material} items={list} castShadow={castShadow} />;
      })}
    </>
  );
}

/** Fill a straight shelf run with packs (cycling through `ids` in blocks, like real facings). */
export function fillRun(ids: string[], from: [number, number, number], dir: [number, number], length: number, ry: number, block = 4, gap = 0.035, scale = 1) {
  const out: PackItem[] = [];
  let d = 0.06;
  let n = 0;
  while (true) {
    const id = ids[Math.floor(n / block) % ids.length];
    const w = sizeOf(id)[0] * scale;
    if (d + w > length - 0.04) break;
    const c = d + w / 2;
    out.push({ id, p: [from[0] + dir[0] * c, from[1], from[2] + dir[1] * c], ry, s: scale });
    d += w + gap;
    n++;
  }
  return out;
}
