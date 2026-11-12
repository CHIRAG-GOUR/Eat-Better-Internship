"use client";

import { useEffect, useLayoutEffect, useMemo, useRef, type ReactNode } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { PerspectiveCamera, Vector3 } from "three";

/** Shared helpers for the Chapter 4.3 games. */

export const pick = <T,>(a: readonly T[]): T => a[Math.floor(Math.random() * a.length)];
export const rint = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1));
export const num = (s: string) => Number(String(s).replace(/[,\s%₹]|lakh|orders?|per|day|tiles?|hampers?|lines?|stations?/gi, ""));
export const fmt = (n: number) => Math.round(n).toLocaleString("en-IN");

export function NumIn({ value, onChange, unit, label, disabled, w = "w-28", bad }: { value: string; onChange: (v: string) => void; unit?: string; label: string; disabled?: boolean; w?: string; bad?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2">
      <input inputMode="decimal" aria-label={label} value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} placeholder="?" className={`${w} rounded-xl border-2 bg-white px-3 py-2 text-right font-display text-[1.15rem] font-semibold tabular-nums text-cocoa outline-none focus:border-orange disabled:bg-success/10 ${bad ? "border-error" : "border-cocoa/20"}`} />
      {unit && <span className="text-[0.95rem] font-bold text-cocoa-2">{unit}</span>}
    </span>
  );
}

/** Frames a w x h (world units) area from above with a gentle tilt, whatever the stage's aspect ratio. */
export function FitCamera({ w, h, tilt = 0.5, pad = 1.06, target = [0, 0, 0] as [number, number, number] }: { w: number; h: number; tilt?: number; pad?: number; target?: [number, number, number] }) {
  const camera = useThree((s) => s.camera) as PerspectiveCamera;
  const size = useThree((s) => s.size);
  useLayoutEffect(() => {
    const aspect = size.width / size.height;
    const t = Math.tan((camera.fov * Math.PI) / 360);
    const r = Math.max(w / (2 * t * aspect), (h * Math.cos(Math.atan(tilt))) / (2 * t)) * pad;
    const d = new Vector3(0, 1, tilt).normalize().multiplyScalar(r);
    camera.position.set(target[0] + d.x, target[1] + d.y, target[2] + d.z);
    camera.lookAt(target[0], target[1], target[2]);
    camera.updateProjectionMatrix();
  }, [camera, size.width, size.height, w, h, tilt, pad, target]);
  return null;
}

/** QA hook: when the browser is automated, expose a function that returns the client pixel position of a named 3D point. */
export function ProbeHook({ name, points }: { name: string; points: Record<string, [number, number, number]> }) {
  const camera = useThree((s) => s.camera);
  const gl = useThree((s) => s.gl);
  useEffect(() => {
    if (typeof navigator === "undefined" || !navigator.webdriver) return;
    const w = window as unknown as { __eb43?: Record<string, (k: string) => { x: number; y: number } | null> };
    w.__eb43 = w.__eb43 ?? {};
    w.__eb43[name] = (k) => {
      const p = points[k];
      if (!p) return null;
      camera.updateMatrixWorld();
      const v = new Vector3(...p).project(camera);
      const r = gl.domElement.getBoundingClientRect();
      return { x: r.left + ((v.x + 1) / 2) * r.width, y: r.top + ((1 - v.y) / 2) * r.height };
    };
  });
  return null;
}

/** Screen positions (px, relative to the stage) of named 3D points, written by <Projector> inside the canvas and read by <Labels> outside it. */
export type ProjStore = { pos: Record<string, { x: number; y: number }>; set: (k: string, x: number, y: number) => void };
export const createProjStore = (): ProjStore => {
  const pos: ProjStore["pos"] = {};
  return { pos, set: (k, x, y) => { pos[k] = { x, y }; } };
};

export function Projector({ store, points }: { store: ProjStore; points: Record<string, [number, number, number]> }) {
  const v = useMemo(() => new Vector3(), []);
  const ref = useRef(points);
  useEffect(() => {
    ref.current = points;
  });
  useFrame(({ camera, size }) => {
    const pts = ref.current;
    for (const k in pts) {
      v.set(pts[k][0], pts[k][1], pts[k][2]).project(camera);
      store.set(k, ((v.x + 1) / 2) * size.width, ((1 - v.y) / 2) * size.height);
    }
  });
  return null;
}

/** DOM labels that follow 3D points (plain DOM, so they are tappable and testable). Render inside a Stage3D `overlay`. */
export function Labels({ store, items }: { store: ProjStore; items: { key: string; node: ReactNode }[] }) {
  const els = useRef<Record<string, HTMLDivElement | null>>({});
  const keys = useRef<string[]>([]);
  useEffect(() => {
    keys.current = items.map((i) => i.key);
  });
  useEffect(() => {
    let raf = 0;
    const loop = () => {
      for (const k of keys.current) {
        const el = els.current[k];
        const p = store.pos[k];
        if (el && p) {
          el.style.transform = `translate(${p.x.toFixed(1)}px,${p.y.toFixed(1)}px)`;
          el.style.visibility = "visible";
        }
      }
      raf = requestAnimationFrame(loop);
    };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [store]);
  return (
    <>
      {items.map((it) => (
        <div key={it.key} ref={(e) => { els.current[it.key] = e; }} className="absolute left-0 top-0 w-0 overflow-visible" style={{ visibility: "hidden" }}>
          {it.node}
        </div>
      ))}
    </>
  );
}
