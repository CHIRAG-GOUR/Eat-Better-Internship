"use client";

import { forwardRef, useEffect, useMemo, type ReactNode } from "react";
import * as THREE from "three";
import { toCreasedNormals } from "three-stdlib";
import type { ThreeElements } from "@react-three/fiber";

/**
 * Drop-in for drei's <RoundedBox> that builds each distinct box shape once and shares it between every mesh that uses
 * it. drei rebuilds the extrusion and recomputes creased normals for every single box, which is a large share of the
 * time a scene takes to appear. The geometry is created with exactly the same steps as drei's (same shape, extrude
 * settings, center(), toCreasedNormals), so it looks identical. Shapes are reference-counted and freed when the last
 * box using them unmounts, so boxes whose size changes at runtime do not pile up.
 */

const eps = 0.00001;

function createShape(width: number, height: number, radius0: number) {
  const shape = new THREE.Shape();
  const radius = radius0 - eps;
  shape.absarc(eps, eps, eps, -Math.PI / 2, -Math.PI, true);
  shape.absarc(eps, height - radius * 2, eps, Math.PI, Math.PI / 2, true);
  shape.absarc(width - radius * 2, height - radius * 2, eps, Math.PI / 2, 0, true);
  shape.absarc(width - radius * 2, eps, eps, 0, -Math.PI / 2, true);
  return shape;
}

type Entry = { geometry: THREE.BufferGeometry; users: number };
const cache = new Map<string, Entry>();

function build(width: number, height: number, depth: number, radius: number, steps: number, smoothness: number, bevelSegments: number, creaseAngle: number) {
  const geometry = new THREE.ExtrudeGeometry(createShape(width, height, radius), {
    depth: depth - radius * 2,
    bevelEnabled: true,
    bevelSegments: bevelSegments * 2,
    steps,
    bevelSize: radius - eps,
    bevelThickness: radius,
    curveSegments: smoothness,
  });
  geometry.center();
  toCreasedNormals(geometry, creaseAngle);
  return geometry;
}

type Props = Omit<ThreeElements["mesh"], "args"> & {
  args?: [number?, number?, number?];
  radius?: number;
  steps?: number;
  smoothness?: number;
  bevelSegments?: number;
  creaseAngle?: number;
  children?: ReactNode;
};

export const RoundedBox = forwardRef<THREE.Mesh, Props>(function RoundedBox(
  { args: [width = 1, height = 1, depth = 1] = [], radius = 0.05, steps = 1, smoothness = 4, bevelSegments = 4, creaseAngle = 0.4, children, ...rest },
  ref,
) {
  const key = `${width}|${height}|${depth}|${radius}|${steps}|${smoothness}|${bevelSegments}|${creaseAngle}`;
  const geometry = useMemo(() => {
    let e = cache.get(key);
    if (!e) {
      e = { geometry: build(width, height, depth, radius, steps, smoothness, bevelSegments, creaseAngle), users: 0 };
      cache.set(key, e);
    }
    return e.geometry;
    // the key already encodes every argument
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    let e = cache.get(key);
    if (!e) {
      // freed between render and mount: register the geometry this mesh is already holding
      e = { geometry, users: 0 };
      cache.set(key, e);
    }
    e.users++;
    return () => {
      e.users--;
      // free it once nothing uses it (checked a moment later so a remount with the same size can pick it straight up)
      setTimeout(() => {
        if (e.users === 0 && cache.get(key) === e) {
          cache.delete(key);
          e.geometry.dispose();
        }
      }, 0);
    };
  }, [key, geometry]);

  return (
    <mesh ref={ref} geometry={geometry} {...rest}>
      {children}
    </mesh>
  );
});
