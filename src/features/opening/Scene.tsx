"use client";
/* eslint-disable react-hooks/immutability -- three.js objects, textures and the camera rig are updated in place by design */

import { Suspense, useEffect, useMemo, useRef, useState, type MutableRefObject } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useLoader, useThree } from "@react-three/fiber";
import { RectAreaLightUniformsLib } from "three/examples/jsm/lights/RectAreaLightUniformsLib.js";
import { AsyncCompile } from "@/components/three/AsyncCompile";
import { SCREEN, Screen, Warehouse } from "./Warehouse";
import { WORLDS, Worlds } from "./Worlds";

/**
 * The opening's 3D world and its camera. One scene holds both the warehouse (where the film plays on the LED screen)
 * and the five worlds outside, so the move from one to the other is a single continuous camera flight: no reload, no
 * cut, no black frame.
 *
 * Camera, by phase:
 *  - entry:   from outside the front door, into the warehouse, turning to face the screen;
 *  - film:    a slow approach to the screen, driven by the film's own clock (pauses if the film buffers);
 *  - hold:    still, close enough that the final title is easy to read;
 *  - travel:  pulls back from the screen, follows the conveyor out through the loading bay, rises over the worlds;
 *  - explore: scroll moves between the overview and each world.
 */

export type Phase = "loading" | "entry" | "film" | "hold" | "travel" | "explore";
export type Rig = {
  phase: Phase;
  phaseAt: number; // performance.now() when the phase started
  scroll: number; // explore: 0 = overview, 1…5 = worlds
};

export const ENTRY_S = 5.2; // camera flight into the warehouse
export const FILM_PLAY_AT_S = 3.4; // the screen comes alive while the camera is still approaching
const TRAVEL_S = 7;

const V = (x: number, y: number, z: number) => new THREE.Vector3(x, y, z);
const SCREEN_C = V(SCREEN.x, SCREEN.y, SCREEN.z);
const ease = (k: number) => (k < 0.5 ? 4 * k * k * k : 1 - (-2 * k + 2) ** 3 / 2);
const clamp01 = (k: number) => Math.min(1, Math.max(0, k));

const fovFor = (aspect: number) => (aspect < 0.8 ? 58 : aspect < 1.2 ? 50 : 40);
/** distance at which a width w fills `fill` of the screen */
const fitDist = (w: number, fill: number, fov: number, aspect: number) => w / (fill * 2 * Math.tan(THREE.MathUtils.degToRad(fov / 2)) * aspect);

function keyframes(aspect: number) {
  const fov = fovFor(aspect);
  const wide = aspect >= 1.2;
  // the film's final framing: the screen fills most of the view and the warehouse stays visible around it
  const dEnd = Math.max(9, fitDist(SCREEN.w, wide ? 0.74 : 0.95, fov, aspect));
  const filmEnd = V(SCREEN.x, SCREEN.y - 0.15, SCREEN.z + dEnd);
  const filmStart = V(2.4, 4.4, -9.5);
  const entry = new THREE.CatmullRomCurve3([V(0, 2.4, 36), V(0, 2.9, 14), V(0, 3.4, 2), V(1.4, 4, -5), filmStart]);
  const entryLook = new THREE.CatmullRomCurve3([V(0, 3.6, -4), V(0, 4.2, -14), V(0, 4.8, -24), V(0.4, 5.2, -30), SCREEN_C.clone()]);

  // overview of all five worlds, then one view per world (the panel sits on the left on wide screens)
  const centre = V(96, 0, -12);
  const ovDir = V(0, 0.78, 0.63).normalize();
  const overview = { pos: centre.clone().addScaledVector(ovDir, Math.max(70, fitDist(122, 0.95, fov, aspect) * 0.92)), look: centre.clone().add(V(wide ? -16 : 0, 0, -4)) };
  const worldDir = V(-0.12, 0.52, 0.85).normalize();
  const worlds = WORLDS.map(([x, z]) => {
    const look = V(x, 2.2, z);
    const d = Math.max(20, fitDist(30, wide ? 0.62 : 0.95, fov, aspect));
    const pos = look.clone().addScaledVector(worldDir, d);
    // shift the world right of the panel on wide screens
    if (wide) {
      const right = V(1, 0, -0.14).normalize();
      look.addScaledVector(right, -d * 0.2);
      pos.addScaledVector(right, -d * 0.2);
    } else {
      // on phones the panel is at the bottom: look a little lower so the world sits in the top half
      look.y -= d * 0.16;
    }
    return { pos, look };
  });
  const travel = new THREE.CatmullRomCurve3([filmEnd.clone(), V(0, 6.6, -16), V(7, 4.8, -10.5), V(18.5, 3.8, -9), V(30, 6.5, -6), V(52, 24, 26), overview.pos.clone()]);
  const travelLook = new THREE.CatmullRomCurve3([SCREEN_C.clone(), V(3, 4.4, -22), V(16, 3, -9.5), V(30, 2.6, -8.5), V(52, 1.5, -8), V(80, 0, -12), overview.look.clone()]);
  return { fov, entry, entryLook, filmStart, filmEnd, overview, worlds, travel, travelLook };
}

function CameraRig({ rig, video, onTravelDone }: { rig: MutableRefObject<Rig>; video: HTMLVideoElement | null; onTravelDone: () => void }) {
  const { camera, size } = useThree();
  const aspect = size.width / size.height;
  const k = useMemo(() => keyframes(aspect), [aspect]);
  const look = useRef(V(0, 3.6, -4));
  const pos = useRef(new THREE.Vector3());
  const done = useRef(false);
  const exploreLook = useRef(new THREE.Vector3());
  const explorePos = useRef(new THREE.Vector3());
  const tmpA = useMemo(() => new THREE.Vector3(), []);
  const tmpB = useMemo(() => new THREE.Vector3(), []);

  useEffect(() => {
    const cam = camera as THREE.PerspectiveCamera;
    cam.fov = k.fov;
    cam.updateProjectionMatrix();
  }, [camera, k]);

  useFrame((_, dt) => {
    const r = rig.current;
    const t = (performance.now() - r.phaseAt) / 1000;
    const p = pos.current;
    const l = look.current;
    if (r.phase === "loading") {
      k.entry.getPointAt(0, p);
      k.entryLook.getPointAt(0, l);
    } else if (r.phase === "entry" || r.phase === "film") {
      const te = r.phase === "entry" ? t : ENTRY_S + t;
      if (te < ENTRY_S) {
        const u = ease(clamp01(te / ENTRY_S));
        k.entry.getPointAt(u, p);
        k.entryLook.getPointAt(u, l);
      } else {
        // the approach follows the film: by the final title the camera has arrived
        const dur = video && isFinite(video.duration) ? video.duration : 34;
        const ft = video ? video.currentTime : 0;
        const u = ease(clamp01(ft / Math.max(1, dur - 4)));
        p.lerpVectors(k.filmStart, k.filmEnd, u);
        const sway = (1 - u) * (1 - u);
        p.x += Math.sin(ft * 0.32) * 1.3 * sway;
        p.y += Math.sin(ft * 0.21) * 0.35 * sway;
        l.lerpVectors(tmpA.copy(SCREEN_C), tmpB.copy(SCREEN_C).add(V(0, -0.15, 0)), u);
      }
    } else if (r.phase === "hold") {
      p.copy(k.filmEnd);
      l.copy(SCREEN_C).add(V(0, -0.15, 0));
    } else if (r.phase === "travel") {
      const u = ease(clamp01(t / TRAVEL_S));
      k.travel.getPointAt(u, p);
      k.travelLook.getPointAt(u, l);
      if (u >= 1 && !done.current) {
        done.current = true;
        explorePos.current.copy(k.overview.pos);
        exploreLook.current.copy(k.overview.look);
        onTravelDone();
      }
    } else {
      // explore: scroll between the overview (0) and the worlds (1…5), resting on each one
      const s = Math.min(5, Math.max(0, r.scroll));
      const i = Math.min(4, Math.floor(s));
      const f = s - i;
      const e = ease(clamp01((f - 0.08) / 0.8));
      const from = i === 0 ? k.overview : k.worlds[i - 1];
      const to = k.worlds[i] ?? k.worlds[4];
      tmpA.lerpVectors(from.pos, to.pos, e);
      tmpA.y += Math.sin(Math.PI * e) * (i === 0 ? 0 : 7); // a little hop between worlds
      tmpB.lerpVectors(from.look, to.look, e);
      const a = 1 - Math.exp(-dt * 3.2);
      explorePos.current.lerp(tmpA, a);
      exploreLook.current.lerp(tmpB, a);
      p.copy(explorePos.current);
      l.copy(exploreLook.current);
    }
    camera.position.copy(p);
    camera.lookAt(l);
  });
  return null;
}

/** sun that keeps its shadows around what the camera is looking at */
function Sun({ compact }: { compact: boolean }) {
  const light = useRef<THREE.DirectionalLight>(null);
  const { camera } = useThree();
  const fwd = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const l = light.current;
    if (!l) return;
    camera.getWorldDirection(fwd);
    // focus about 18 m ahead of the camera, on the ground
    const tx = camera.position.x + fwd.x * 18;
    const tz = camera.position.z + fwd.z * 18;
    l.target.position.set(tx, 0, tz);
    l.position.set(tx - 34, 42, tz + 20);
    l.target.updateMatrixWorld();
  });
  return (
    <directionalLight ref={light} intensity={2.4} color="#FFE7C7" castShadow={!compact} shadow-mapSize={[2048, 2048]} shadow-bias={-0.0004} shadow-normalBias={0.04}>
      <orthographicCamera attach="shadow-camera" args={[-32, 32, 32, -32, 1, 140]} />
    </directionalLight>
  );
}

/** the film on the screen; before the first frame is ready the screen shows the film's first frame as a still */
function FilmScreen({ video, live, compact }: { video: HTMLVideoElement | null; live: boolean; compact: boolean }) {
  const poster = useLoader(THREE.TextureLoader, "/intro/film-poster.jpg");
  useMemo(() => (poster.colorSpace = THREE.SRGBColorSpace), [poster]);
  const tex = useMemo(() => {
    if (!video) return null;
    const t = new THREE.VideoTexture(video);
    t.colorSpace = THREE.SRGBColorSpace;
    t.generateMipmaps = false;
    t.minFilter = THREE.LinearFilter;
    return t;
  }, [video]);
  useEffect(() => () => tex?.dispose(), [tex]);
  // the screen's average colour tints its glow and the light it throws on the warehouse
  const glow = useMemo(() => new THREE.Color("#FFD9B0"), []);
  const want = useMemo(() => new THREE.Color("#FFD9B0"), []);
  const sampler = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = c.height = 4;
    return c.getContext("2d", { willReadFrequently: true });
  }, []);
  const last = useRef(0);
  const area = useRef<THREE.RectAreaLight>(null);
  useFrame(({ clock }, dt) => {
    if (live && video && sampler && clock.elapsedTime - last.current > 0.25 && video.readyState >= 2) {
      last.current = clock.elapsedTime;
      try {
        sampler.drawImage(video, 0, 0, 4, 4);
        const d = sampler.getImageData(0, 0, 4, 4).data;
        let r = 0;
        let g = 0;
        let b = 0;
        for (let i = 0; i < d.length; i += 4) {
          r += d[i];
          g += d[i + 1];
          b += d[i + 2];
        }
        want.setRGB(r / 16 / 255, g / 16 / 255, b / 16 / 255, THREE.SRGBColorSpace);
      } catch {
        /* cross-origin frame: keep the warm default */
      }
    }
    glow.lerp(want, Math.min(1, dt * 3));
    if (area.current) area.current.color.copy(glow);
  });
  return (
    <group>
      <Screen map={live && tex ? tex : poster} glow={glow} />
      {!compact && <rectAreaLight ref={area} position={[SCREEN.x, SCREEN.y, SCREEN.z + 0.2]} width={SCREEN.w} height={SCREEN.h} intensity={3.2} />}
    </group>
  );
}

function Ready({ onReady }: { onReady: () => void }) {
  const fired = useRef(false);
  useFrame(() => {
    if (fired.current) return;
    fired.current = true;
    onReady();
  });
  return null;
}

export default function OpeningScene({
  rig,
  video,
  live,
  compact,
  active,
  onReady,
  onTravelDone,
  onPick,
}: {
  rig: MutableRefObject<Rig>;
  video: HTMLVideoElement | null;
  live: boolean;
  compact: boolean;
  active: number;
  onReady: () => void;
  onTravelDone: () => void;
  onPick?: (i: number) => void;
}) {
  const [dpr] = useState(() => Math.min(typeof window !== "undefined" ? window.devicePixelRatio : 1, compact ? 1.5 : 2));
  useMemo(() => RectAreaLightUniformsLib.init(), []);
  return (
    <Canvas
      shadows={compact ? false : "percentage"}
      dpr={dpr}
      camera={{ position: [0, 2.4, 36], fov: 40, near: 0.3, far: 900 }}
      gl={{ antialias: true, powerPreference: "high-performance" }}
      onCreated={({ gl, scene }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping;
        gl.toneMappingExposure = 1.02;
        scene.fog = new THREE.Fog("#F3E3CF", 45, 330);
        scene.background = new THREE.Color("#F3E3CF");
      }}
    >
      <AsyncCompile />
      <hemisphereLight args={["#FFF3E2", "#C9A27A", 1.15]} />
      <ambientLight intensity={0.25} />
      <Sun compact={compact} />
      <Suspense fallback={null}>
        <Warehouse compact={compact}>
          <FilmScreen video={video} live={live} compact={compact} />
        </Warehouse>
        <Worlds compact={compact} active={active} onPick={onPick} />
        <Ready onReady={onReady} />
      </Suspense>
      <CameraRig rig={rig} video={video} onTravelDone={onTravelDone} />
    </Canvas>
  );
}
