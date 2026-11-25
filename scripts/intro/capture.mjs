#!/usr/bin/env node
/**
 * Records real footage of the internship for the opening film: the chapter worlds, 3D activities and the four
 * experiential activities, played in Chrome (1920×1080). Nothing is mocked: every clip is the live site.
 *
 *   npm run build && npm run start            # site on http://localhost:3000 (or set SITE_URL)
 *   node scripts/intro/capture.mjs            # all clips → .intro-work/raw/<name>.webm
 *   node scripts/intro/capture.mjs ea3 2.1-lab
 *
 * Then run scripts/intro/build-film.mjs to edit the film.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import puppeteer from "puppeteer-core";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(root, ".intro-work/raw");
fs.mkdirSync(OUT, { recursive: true });
const SITE = (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/* ── helpers that act like a student ── */
const smooth = (p, dy, ms) =>
  p.evaluate(
    (dy, ms) =>
      new Promise((res) => {
        const y0 = scrollY;
        const t0 = performance.now();
        const f = (t) => {
          const k = Math.min(1, (t - t0) / ms);
          const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
          scrollTo(0, y0 + dy * e);
          if (k < 1) requestAnimationFrame(f);
          else res();
        };
        requestAnimationFrame(f);
      }),
    dy,
    ms,
  );
const toSection = async (p, id, offset = 0) => {
  await p.evaluate(
    (id, offset) => {
      const el = document.getElementById(id);
      if (el) scrollTo(0, el.getBoundingClientRect().top + scrollY + offset);
    },
    id,
    offset,
  );
  await sleep(2500);
};
const drag = async (p, x1, y1, x2, y2, ms) => {
  await p.mouse.move(x1, y1);
  await p.mouse.down();
  const n = Math.max(8, Math.round(ms / 16));
  for (let i = 1; i <= n; i++) {
    const k = i / n;
    const e = k < 0.5 ? 2 * k * k : 1 - (-2 * k + 2) ** 2 / 2;
    await p.mouse.move(x1 + (x2 - x1) * e, y1 + (y2 - y1) * e);
    await sleep(16);
  }
  await p.mouse.up();
};
const clickText = async (p, t) => {
  const box = await p.evaluate((t) => {
    const b = [...document.querySelectorAll("button, a")].find((x) => !x.disabled && x.textContent.trim().startsWith(t) && x.getBoundingClientRect().width > 0);
    if (!b) return null;
    b.scrollIntoView({ block: "center" });
    const r = b.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
  }, t);
  if (!box) return false;
  await sleep(250);
  await p.mouse.move(box.x - 40, box.y + 30);
  await p.mouse.move(box.x, box.y, { steps: 12 });
  await sleep(120);
  await p.mouse.click(box.x, box.y);
  return true;
};

/** click a few buttons inside the activity (the first enabled ones that match), like a student trying it out */
const clickAny = async (p, n, re = /./) => {
  for (let i = 0; i < n; i++) {
    const box = await p.evaluate((src, i) => {
      const re = new RegExp(src);
      const bs = [...document.querySelectorAll("main button, [role=dialog] button")].filter((b) => {
        const r = b.getBoundingClientRect();
        return !b.disabled && r.width > 30 && r.top > 60 && r.bottom < innerHeight - 20 && re.test(b.textContent.trim()) && !/Restart|Reset|ullscreen|audio|Back/i.test(b.textContent + (b.getAttribute("aria-label") || ""));
      });
      const b = bs[i % Math.max(1, bs.length)];
      if (!b) return null;
      const r = b.getBoundingClientRect();
      return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
    }, re.source, i);
    if (!box) return;
    await p.mouse.move(box.x, box.y, { steps: 14 });
    await sleep(150);
    await p.mouse.click(box.x, box.y);
    await sleep(900);
  }
};

/* ── the clips ── */
const CLIPS = {
  "1.1-open": { url: "/1.1", rec: (p) => smooth(p, 1100, 6500) },
  "1.1-d2c": { url: "/1.1", prep: (p) => toSection(p, "d2c", 60), rec: (p) => smooth(p, 500, 6000) },
  "1.3-stall": {
    url: "/1.3",
    prep: (p) => toSection(p, "stall-day", 80),
    rec: async (p) => {
      await clickText(p, "Open the stall");
      await sleep(2500);
      await clickAny(p, 3);
      await sleep(1500);
    },
  },
  "1.5-studio": {
    url: "/1.5",
    prep: (p) => toSection(p, "studio", 80),
    rec: async (p) => {
      await clickText(p, "Enter the studio");
      await sleep(2500);
      await clickAny(p, 3);
      await sleep(1500);
    },
  },
  "1.5-shelf": { url: "/1.5", prep: (p) => toSection(p, "categories", 0), rec: (p) => smooth(p, 700, 6000) },
  "1.6-facility": {
    url: "/1.6",
    prep: (p) => toSection(p, "facility", 80),
    rec: async (p) => {
      await clickText(p, "Enter the facility");
      await sleep(2500);
      await clickText(p, "Walk to");
      await sleep(3500);
    },
  },
  ea1: {
    url: "/experiential-activity-1",
    wait: 7000,
    rec: async (p) => {
      await sleep(800);
      await clickText(p, "Enter the lab");
      await sleep(3500);
      await drag(p, 760, 420, 560, 420, 1600);
      await sleep(1000);
    },
  },
  "2.1-lab": {
    url: "/2.1",
    prep: (p) => toSection(p, "lab", 260),
    rec: async (p) => {
      await sleep(600);
      await drag(p, 640, 470, 860, 460, 2200);
      await sleep(600);
      await drag(p, 860, 470, 600, 470, 1800);
      await sleep(800);
    },
  },
  "2.1-open": { url: "/2.1", rec: (p) => smooth(p, 1200, 6500) },
  "2.3-act": {
    url: "/2.3",
    prep: (p) => toSection(p, "activities", 120),
    rec: async (p) => {
      await smooth(p, 200, 1500);
      await drag(p, 760, 460, 560, 450, 2000);
      await sleep(1800);
    },
  },
  "2.2-social": { url: "/2.2", prep: (p) => toSection(p, "social", 0), rec: (p) => smooth(p, 700, 6000) },
  ea2: {
    url: "/experiential-activity-2",
    wait: 7000,
    rec: async (p) => {
      await sleep(800);
      await clickAny(p, 1, /^(Start|Begin|Enter|Let)/);
      await sleep(3000);
      await clickAny(p, 2);
      await sleep(1500);
    },
  },
  "3.1-canvas": { url: "/3.1", prep: (p) => toSection(p, "canvas", 40), rec: (p) => smooth(p, 600, 6000) },
  "3.4-open": { url: "/3.4", rec: (p) => smooth(p, 1100, 6500) },
  "3.4-act": { url: "/3.4", prep: (p) => toSection(p, "activities", 120), rec: (p) => smooth(p, 500, 6000) },
  ea3: {
    url: "/experiential-activity-3",
    wait: 7000,
    rec: async (p) => {
      await sleep(600);
      await clickText(p, "Enter the distribution centre");
      await sleep(2500);
      for (const dock of ["D2C dock", "Marketplace dock", "Quick commerce dock", "Corporate dock", "D2C dock"]) {
        await clickText(p, dock);
        await sleep(1100);
      }
    },
  },
  "4.1-open": { url: "/4.1", rec: (p) => smooth(p, 1100, 6500) },
  "4.1-act": { url: "/4.1", prep: (p) => toSection(p, "activities", 120), rec: (p) => smooth(p, 600, 6000) },
  "4.2-act": { url: "/4.2", prep: (p) => toSection(p, "activities", 120), rec: (p) => smooth(p, 600, 6000) },
  "4.3-open": { url: "/4.3", rec: (p) => smooth(p, 1100, 6500) },
  ea4: {
    url: "/experiential-activity-4",
    wait: 7000,
    rec: async (p) => {
      await sleep(800);
      await clickText(p, "Start mission 1");
      await sleep(4500);
    },
  },
  "5.1-open": { url: "/5.1", rec: (p) => smooth(p, 1300, 6500) },
  "5.2-open": { url: "/5.2", rec: (p) => smooth(p, 1300, 6500) },
  "5.2-pillars": { url: "/5.2", prep: (p) => toSection(p, "storefront-pillars", 0), rec: (p) => smooth(p, 800, 6000) },
};

const only = process.argv.slice(2);
const names = only.length ? only : Object.keys(CLIPS);
const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: "new",
  args: ["--use-angle=d3d11", "--enable-gpu", "--ignore-gpu-blocklist", "--autoplay-policy=no-user-gesture-required", "--hide-scrollbars"],
});
for (const name of names) {
  const c = CLIPS[name];
  if (!c) {
    console.warn(`unknown clip ${name}`);
    continue;
  }
  const p = await browser.newPage();
  await p.setViewport({ width: 1280, height: 720, deviceScaleFactor: 1.5 });
  await p.goto(SITE + c.url, { waitUntil: "domcontentloaded", timeout: 120000 });
  await sleep(c.wait ?? 5000);
  // hide the fullscreen and back-to-top controls: they are site chrome, not content
  await p.addStyleTag({ content: `button[aria-label*="ullscreen"], button[aria-label*="Back to top"] { opacity: 0 !important }` });
  if (c.prep) await c.prep(p);
  const file = path.join(OUT, `${name}.webm`);
  const rec = await p.screencast({ path: file, fps: 30 });
  await sleep(400);
  await c.rec(p);
  await sleep(500);
  await rec.stop();
  await p.close();
  console.log(`${name}: ${(fs.statSync(file).size / 1e6).toFixed(1)} MB`);
}
await browser.close();
