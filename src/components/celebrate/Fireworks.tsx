"use client";

import { useEffect, useRef } from "react";

/**
 * Full-screen confetti and firework bursts on a canvas (no libraries). `level` sets the party size:
 * 3 = fireworks + lots of confetti, 2 = confetti + a few bursts, 1 = a little confetti. Runs for a few seconds.
 */
const COLORS = ["#FF5C00", "#FED300", "#00A341", "#2F6FDE", "#C2185B", "#8A4FD6", "#FFFFFF"];

type P = { x: number; y: number; vx: number; vy: number; life: number; max: number; size: number; color: string; kind: "confetti" | "spark"; rot: number; vr: number };

export function Fireworks({ level, run }: { level: 1 | 2 | 3; run: number }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current;
    if (!cv) return;
    const g = cv.getContext("2d");
    if (!g) return;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const resize = () => {
      cv.width = window.innerWidth * dpr;
      cv.height = window.innerHeight * dpr;
    };
    resize();
    window.addEventListener("resize", resize);
    const W = () => window.innerWidth;
    const H = () => window.innerHeight;
    const ps: P[] = [];
    const rnd = (a: number, b: number) => a + Math.random() * (b - a);
    const confetti = (n: number) => {
      for (let i = 0; i < n; i++) {
        ps.push({ x: rnd(0, W()), y: rnd(-H() * 0.5, -10), vx: rnd(-1.2, 1.2), vy: rnd(1.5, 4), life: 0, max: rnd(160, 260), size: rnd(6, 11), color: COLORS[i % COLORS.length], kind: "confetti", rot: rnd(0, 6.3), vr: rnd(-0.2, 0.2) });
      }
    };
    const burst = (x: number, y: number) => {
      const c = COLORS[Math.floor(Math.random() * 6)];
      const n = 46;
      for (let i = 0; i < n; i++) {
        const a = (i / n) * Math.PI * 2;
        const sp = rnd(2.5, 6.5);
        ps.push({ x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: 0, max: rnd(55, 85), size: rnd(2, 3.4), color: Math.random() < 0.25 ? "#FFFFFF" : c, kind: "spark", rot: 0, vr: 0 });
      }
    };
    confetti(level === 3 ? 220 : level === 2 ? 140 : 60);
    const bursts = level === 3 ? 9 : level === 2 ? 3 : 0;
    const timers: ReturnType<typeof setTimeout>[] = [];
    for (let i = 0; i < bursts; i++) timers.push(setTimeout(() => burst(rnd(W() * 0.15, W() * 0.85), rnd(H() * 0.12, H() * 0.45)), 200 + i * 380));
    let raf = 0;
    const t0 = performance.now();
    const tick = (t: number) => {
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, W(), H());
      for (let i = ps.length - 1; i >= 0; i--) {
        const p = ps[i];
        p.life++;
        if (p.kind === "confetti") {
          p.vy += 0.03;
          p.vx += Math.sin((p.life + i) * 0.05) * 0.03;
          p.rot += p.vr;
        } else {
          p.vy += 0.07;
          p.vx *= 0.985;
          p.vy *= 0.985;
        }
        p.x += p.vx;
        p.y += p.vy;
        const fade = Math.max(0, 1 - p.life / p.max);
        if (fade <= 0 || p.y > H() + 20) {
          ps.splice(i, 1);
          continue;
        }
        g.globalAlpha = p.kind === "spark" ? fade : Math.min(1, fade * 2);
        g.fillStyle = p.color;
        if (p.kind === "confetti") {
          g.save();
          g.translate(p.x, p.y);
          g.rotate(p.rot);
          g.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
          g.restore();
        } else {
          g.beginPath();
          g.arc(p.x, p.y, p.size, 0, Math.PI * 2);
          g.fill();
        }
      }
      g.globalAlpha = 1;
      if (ps.length || t - t0 < 4000) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(raf);
      timers.forEach(clearTimeout);
      window.removeEventListener("resize", resize);
    };
  }, [level, run]);
  return <canvas ref={ref} className="pointer-events-none fixed inset-0 z-[130] h-full w-full" aria-hidden />;
}
