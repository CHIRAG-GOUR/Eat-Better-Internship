"use client";

import { useLayoutEffect } from "react";
import * as THREE from "three";
import { useThree } from "@react-three/fiber";

/**
 * Compiles every shader in the scene in parallel (WebGL KHR_parallel_shader_compile) before the first frame is drawn.
 *
 * Without it, three.js compiles each material's shader on the main thread the first time it renders and waits for the
 * GPU driver to finish, which freezes the page for a second or more on low-end PCs (integrated graphics on Windows
 * compile slowly). The scene renders exactly the same afterwards; only the waiting moves off the main thread.
 *
 * Scenes with see-through "transmission" materials (glass jars, wrap) also render their solid objects into an
 * off-screen buffer each frame, which needs a second variant of every shader (no tone mapping, linear colour), so that
 * variant is compiled up front too.
 *
 * Place it as a direct child of <Canvas>. It holds the frame loop while compilation runs, then hands back whatever
 * frame loop the Canvas was configured with.
 */
export function AsyncCompile() {
  const get = useThree((s) => s.get);
  useLayoutEffect(() => {
    const { gl, scene, camera, frameloop, setFrameloop, invalidate } = get();
    if (frameloop === "never" || typeof gl.compileAsync !== "function") return;
    let live = true;
    setFrameloop("never");

    // R3F's `shadows` asks for PCFSoftShadowMap, which three.js swaps for PCFShadowMap on the first shadow render; that
    // swap changes every shader's key and forces a full recompile. Apply the same swap now so the shaders compiled here
    // are the ones actually used (identical result, minus the second compile).
    if (gl.shadowMap.type === THREE.PCFSoftShadowMap) gl.shadowMap.type = THREE.PCFShadowMap;

    let offscreen: THREE.WebGLRenderTarget | null = null;
    const resume = () => {
      offscreen?.dispose();
      if (!live) return;
      // the Canvas prop may have changed meanwhile; only resume if nothing else took the loop over
      if (get().frameloop === "never") setFrameloop(frameloop);
      invalidate();
    };

    // Compile on the next tick, once every sibling has finished setting the scene up (drei's <Environment> attaches its
    // environment map in its own effect, and that map is part of every lit shader).
    const timer = setTimeout(() => {
      if (!live) return;
      let transmissive = false;
      scene.traverse((o) => {
        const m = (o as THREE.Mesh).material;
        if (!m) return;
        for (const x of Array.isArray(m) ? m : [m]) if ((x as THREE.MeshPhysicalMaterial).transmission > 0) transmissive = true;
      });

      const jobs: Promise<unknown>[] = [];
      if (transmissive) {
        offscreen = new THREE.WebGLRenderTarget(1, 1, { type: THREE.HalfFloatType });
        const prev = gl.getRenderTarget();
        gl.setRenderTarget(offscreen);
        jobs.push(gl.compileAsync(scene, camera)); // the shader variants are created synchronously inside this call
        gl.setRenderTarget(prev);
      }
      jobs.push(gl.compileAsync(scene, camera));
      Promise.all(jobs)
        // both variants were compiling side by side; this pass only re-checks that the on-screen ones have finished
        .then(() => (transmissive ? gl.compileAsync(scene, camera) : undefined))
        .then(resume, resume);
    }, 0);

    return () => {
      live = false;
      clearTimeout(timer);
    };
  }, [get]);
  return null;
}
