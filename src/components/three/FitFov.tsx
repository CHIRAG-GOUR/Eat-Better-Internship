"use client";

import { useLayoutEffect, useRef } from "react";
import { useThree } from "@react-three/fiber";
import * as THREE from "three";

/**
 * Keeps the whole width of a 3D scene in view on narrow screens.
 *
 * A perspective camera has a fixed vertical angle, so on a portrait phone (or a tall box inside an LMS app) the
 * horizontal view shrinks and both sides of the scene are cut off. Below `design` (the shape the scene was designed
 * for on desktop) this widens the vertical angle just enough that the horizontal view matches the desktop one:
 * everything visible on desktop stays visible, with extra floor and sky above and below. At or above `design` the
 * camera keeps its own angle, so desktop is unchanged. Rendering quality is untouched; only the framing changes.
 *
 * Put it inside <Canvas> before any component that frames the camera from its angle (such as FitCam): it runs as a
 * layout effect, so those components already see the adjusted angle.
 */
export function FitFov({ design: designAspect = 1.6, max = 80 }: { design?: number; max?: number }) {
  const get = useThree((s) => s.get);
  const width = useThree((s) => s.size.width);
  const height = useThree((s) => s.size.height);
  const base = useRef<number | null>(null);

  useLayoutEffect(() => {
    const { camera, invalidate } = get();
    if (!(camera instanceof THREE.PerspectiveCamera)) return;
    base.current ??= camera.fov; // the angle the scene was designed with
    const aspect = width / Math.max(1, height);
    let fov = base.current;
    if (aspect < designAspect) {
      const half = Math.tan(THREE.MathUtils.degToRad(base.current / 2)) * (designAspect / aspect);
      fov = Math.min(max, THREE.MathUtils.radToDeg(2 * Math.atan(half)));
    }
    if (Math.abs(camera.fov - fov) > 0.01) {
      camera.fov = fov;
      camera.updateProjectionMatrix();
      invalidate();
    }
  }, [get, width, height, designAspect, max]);

  return null;
}
