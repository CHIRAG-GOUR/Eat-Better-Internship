"use client";
/* eslint-disable react-hooks/immutability -- canvas textures are flagged for upload after redraw by design */

import { useEffect, useState, type ReactNode } from "react";
import * as THREE from "three";
import { Hoverable } from "@/components/world/hover";
import { useTex } from "@/components/world3/parts";
import { boxGeo, glowMat, mat, panelTex } from "./kit";

export { useTex };

/** Optional hover label wrapper. */
export function Label({ label, children }: { label?: string; children: ReactNode }) {
  return label ? <Hoverable label={label}>{children}</Hoverable> : <>{children}</>;
}

/** A flat printed/lit board (front = +z) with an optional frame. Texture is made from `make` and disposed on unmount. */
export function Board({ make, w, h, position, rotation, frame, glow = 0.25, label, depth = 0.06, basic = false }: { make: () => THREE.Texture; w: number; h: number; position?: [number, number, number]; rotation?: [number, number, number]; frame?: string; glow?: number; label?: string; depth?: number; basic?: boolean }) {
  const tex = useTex(make);
  return (
    <Label label={label}>
      <group position={position} rotation={rotation}>
        {frame && (
          <mesh geometry={boxGeo()} material={mat(frame, 0.5, 0.2)} position={[0, 0, -depth / 2 - 0.004]} scale={[w + 0.12, h + 0.12, depth]} />
        )}
        <mesh>
          <planeGeometry args={[w, h]} />
          {basic ? <meshBasicMaterial map={tex} toneMapped={false} /> : <meshStandardMaterial map={tex} emissiveMap={tex} emissive="#FFFFFF" emissiveIntensity={glow} roughness={0.55} />}
        </mesh>
      </group>
    </Label>
  );
}

/** Text panel shortcut: lines with sizes. */
export function TextBoard({ lines, bg, fg, w, h, px = 512, ...rest }: { lines: { t: string; size: number; color?: string; weight?: number }[]; bg: string; fg: string; w: number; h: number; px?: number; position?: [number, number, number]; rotation?: [number, number, number]; frame?: string; glow?: number; label?: string; basic?: boolean; border?: string }) {
  const key = JSON.stringify(lines) + bg + fg + w + h;
  const ph = Math.round((px * h) / w);
  return <Board key={key} make={() => panelTex(lines, bg, fg, px, ph, rest.border)} w={w} h={h} {...rest} />;
}

/** Additive glow sprite (fake bloom). */
export function Glow({ position, color = "#FFFFFF", size = 1, opacity = 0.8 }: { position: [number, number, number]; color?: string; size?: number; opacity?: number }) {
  return <sprite position={position} scale={[size, size, 1]} material={glowMat(color, opacity)} />;
}

/** A canvas texture that is redrawn when `frame` changes (for LED displays). */
export function useLiveCanvas(w: number, h: number, draw: (g: CanvasRenderingContext2D, frame: number) => void, frame: number) {
  const [{ canvas, tex }] = useState(() => {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.anisotropy = 8;
    return { canvas: c, tex: t };
  });
  useEffect(() => () => tex.dispose(), [tex]);
  useEffect(() => {
    draw(canvas.getContext("2d")!, frame);
    tex.needsUpdate = true;
    // eslint-disable-next-line react-hooks/exhaustive-deps -- redraw only when the frame index changes
  }, [frame, canvas, tex]);
  return tex;
}

/** Simple box mesh with a cached material. */
export function Box({ s, p, r, c, rough = 0.7, metal = 0, e, ei, cast = false, recv = false }: { s: [number, number, number]; p: [number, number, number]; r?: [number, number, number]; c: string; rough?: number; metal?: number; e?: string; ei?: number; cast?: boolean; recv?: boolean }) {
  return <mesh geometry={boxGeo()} material={mat(c, rough, metal, e ? { emissive: e, ei } : undefined)} position={p} rotation={r} scale={s} castShadow={cast} receiveShadow={recv} />;
}
