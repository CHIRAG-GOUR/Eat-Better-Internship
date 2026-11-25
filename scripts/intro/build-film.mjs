#!/usr/bin/env node
/**
 * Edits the opening film from real footage:
 *  - the brand's own videos (the chapter video folders in public/) for products, ingredients and the warehouse;
 *  - screen recordings of the live chapters and activities (made by capture.mjs, in .intro-work/raw);
 *  - a title card built from the real Eat Better and SkilliZee logo files, in the brand fonts.
 * Output: public/intro/film.mp4 (1920×1080, H.264 + AAC) and public/intro/film-poster.jpg (its first frame).
 *
 *   node scripts/intro/capture.mjs && node scripts/intro/build-film.mjs
 *
 * Needs ffmpeg on PATH. The music is a soft bed generated here (no third-party track); swap in a licensed track by
 * replacing .intro-work/music.wav before the final mux step if you have one.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath, pathToFileURL } from "node:url";
import puppeteer from "puppeteer-core";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const WORK = path.join(root, ".intro-work");
const RAW = path.join(WORK, "raw");
const SEG = path.join(WORK, "seg");
const OUT = path.join(root, "public/intro");
fs.mkdirSync(SEG, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const ff = (args) => execFileSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: "inherit" });
const pub = (p) => path.join(root, "public", p);

/* ── the cut: [source, start s, length s, kind, transition into this shot, crop?] ── */
// crop: [x, y, size] as fractions of the frame, to cut away letterbox bars and burned-in subtitles
// kinds: rec (site recording), vid (landscape brand video), vert (vertical brand reel)
// transitions: c = quick dissolve (reads as a cut), f = soft fade (between modules)
const SHOTS = [
  // the products, ingredients and the real warehouse
  [pub("chapter-1-1/video/story-h264.mp4"), 39.6, 2.3, "vid", "c", [0.12, 0.115, 0.76]],
  [pub("chapter-1-5/video/diwali-gifting-full-h264.mp4"), 30.0, 1.4, "vid", "c", [0.08, 0.0, 0.84]],
  [pub("chapter-1-4/video/better-laddoos-h264.mp4"), 3.6, 1.9, "vid", "c"],
  // Module 1: the story and the product line
  ["1.1-open", 0.5, 1.9, "rec", "f"],
  ["1.1-d2c", 4.0, 1.6, "rec", "c"],
  ["1.5-shelf", 2.4, 1.6, "rec", "c"],
  ["1.3-stall", 4.2, 1.8, "rec", "c"],
  // Module 2: brand creatives and marketing
  ["2.1-open", 0.1, 1.7, "rec", "f"],
  [pub("chapter-2-3/video/pudina-punch-h264.mp4"), 48.7, 1.5, "vert", "c"],
  [pub("chapter-2-3/video/pudina-punch-h264.mp4"), 52.5, 1.4, "vert", "c"],
  ["2.2-social", 3.3, 1.6, "rec", "c"],
  ["ea2", 1.0, 1.3, "rec", "c"],
  // Module 3: business model canvas and distribution
  ["3.1-canvas", 4.1, 1.6, "rec", "f"],
  ["3.4-open", 0.4, 1.8, "rec", "c"],
  ["ea3", 3.3, 1.9, "rec", "c"],
  // Module 4: strategy, financials and competition
  ["4.1-open", 0.2, 1.9, "rec", "f"],
  ["4.2-act", 2.9, 1.5, "rec", "c"],
  ["ea4", 3.1, 1.7, "rec", "c"],
  // Module 5: the capstones
  ["5.2-open", 0.2, 1.6, "rec", "f"],
  ["5.2-open", 5.1, 1.6, "rec", "c"],
  // a quick recap of the hands-on moments
  ["1.5-studio", 4.6, 0.75, "rec", "f"],
  ["1.6-facility", 5.2, 0.75, "rec", "c"],
  ["ea1", 3.4, 0.75, "rec", "c"],
  ["4.1-act", 2.6, 0.75, "rec", "c"],
];
const T_CUT = 0.12;
const T_FADE = 0.45;
const TITLE_S = 4.6;

/* ── 1 · each shot → a clean 1920×1080 30 fps clip with a slow push-in ── */
const grade = "eq=saturation=1.05:contrast=1.02,format=yuv420p,setsar=1";
SHOTS.forEach(([src, ss, d, kind, , crop], i) => {
  const input = kind === "rec" ? path.join(RAW, `${src}.webm`) : src;
  const out = path.join(SEG, `${String(i).padStart(2, "0")}.mp4`);
  const z = i % 3 === 1 ? "out" : "in"; // mostly push in, now and then ease out
  const zoom = z === "in" ? `1+0.05*t/${d}` : `1.05-0.05*t/${d}`;
  const push = `scale=w='trunc(1920*(${zoom})/2)*2':h=-2:eval=frame:flags=lanczos,crop=1920:1080`;
  let filter;
  if (kind === "vert") {
    filter = `[0:v]fps=30,split[a][b];[a]scale=1920:-2,crop=1920:1080,boxblur=40:2,eq=brightness=-0.06:saturation=0.9[bg];[b]scale=-2:1080:flags=lanczos[fg];[bg][fg]overlay=(W-w)/2:0,${push},${grade}[v]`;
  } else {
    const cut = crop ? `crop=iw*${crop[2]}:ih*${crop[2]}:iw*${crop[0]}:ih*${crop[1]},` : "";
    filter = `[0:v]fps=30,${cut}scale=1920:1080:flags=lanczos,${push},${grade}[v]`;
  }
  ff(["-ss", String(ss), "-t", String(d), "-i", input, "-filter_complex", filter, "-map", "[v]", "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "15", out]);
});
console.log(`shots: ${SHOTS.length}`);

/* ── 2 · the title card, rendered from the real logo files in the brand fonts ── */
{
  const font = (f) => pathToFileURL(path.join(root, "src/fonts", f)).href;
  const asset = (f) => pathToFileURL(pub(f)).href;
  const html = `<!doctype html><html><head><style>
@font-face{font-family:Tommy;src:url(${font("MADETOMMY-ExtraBold.woff2")})}
html,body{margin:0;width:1920px;height:1080px;overflow:hidden}
body{background:radial-gradient(ellipse 70% 60% at 50% 46%,#FFFBF6 0%,#FFF2E6 55%,#F7E3CF 100%);display:grid;place-items:center;font-family:Tommy}
.c{display:flex;flex-direction:column;align-items:center;transform:translateY(-40px)}
.logo{width:820px;opacity:0;transform:translateY(26px) scale(.97);animation:in 1.25s cubic-bezier(.2,.7,.2,1) .15s forwards}
.word{font-size:78px;letter-spacing:.42em;margin-right:-.42em;color:#FF5C00;opacity:0;transform:translateY(16px);animation:in 1s cubic-bezier(.2,.7,.2,1) 1.05s forwards}
.sz{position:absolute;bottom:78px;width:300px;opacity:0;animation:fade 1s ease 1.7s forwards}
@keyframes in{to{opacity:1;transform:none}}@keyframes fade{to{opacity:1}}
</style></head><body><div class="c"><img class="logo" src="${asset("brand/eat-better-logo.svg")}"><div style="height:44px"></div><div class="word">INTERNSHIP</div></div><img class="sz" src="${asset("brand/skillizee-logo.png")}"></body></html>`;
  const htmlFile = path.join(WORK, "title.html");
  fs.writeFileSync(htmlFile, html);
  const b = await puppeteer.launch({ executablePath: CHROME, headless: "new", args: ["--allow-file-access-from-files"] });
  const p = await b.newPage();
  await p.setViewport({ width: 1920, height: 1080 });
  // render frame by frame: set the animation clock, take a screenshot (smooth and exact, whatever the machine speed)
  await p.goto(pathToFileURL(htmlFile).href, { waitUntil: "load" });
  await p.evaluate(() => document.fonts.ready);
  const frames = path.join(WORK, "title-frames");
  fs.rmSync(frames, { recursive: true, force: true });
  fs.mkdirSync(frames);
  const n = Math.round(TITLE_S * 30);
  for (let f = 0; f < n; f++) {
    await p.evaluate((ms) => document.getAnimations().forEach((a) => { a.pause(); a.currentTime = ms; }), (f / 30) * 1000);
    await p.screenshot({ path: path.join(frames, `${String(f).padStart(4, "0")}.png`) });
  }
  await b.close();
  const out = path.join(SEG, "title.mp4");
  ff(["-framerate", "30", "-i", path.join(frames, "%04d.png"), "-vf", "format=yuv420p,setsar=1", "-c:v", "libx264", "-crf", "14", out]);
}

/* ── 3 · join everything with dissolves ── */
const segs = [...SHOTS.map((_, i) => path.join(SEG, `${String(i).padStart(2, "0")}.mp4`)), path.join(SEG, "title.mp4")];
const lens = [...SHOTS.map((s) => s[2]), TITLE_S];
const trans = [...SHOTS.map((s) => (s[4] === "f" ? T_FADE : T_CUT)), 0.7];
let chain = "";
let prev = "[0:v]";
let acc = lens[0];
for (let i = 1; i < segs.length; i++) {
  const t = trans[i];
  const off = (acc - t).toFixed(3);
  const label = i === segs.length - 1 ? "[v]" : `[x${i}]`;
  chain += `${prev}[${i}:v]xfade=transition=fade:duration=${t}:offset=${off}${label};`;
  prev = label;
  acc += lens[i] - t;
}
const total = acc;
const silent = path.join(WORK, "film-video.mp4");
ff([...segs.flatMap((s) => ["-i", s]), "-filter_complex", chain.slice(0, -1), "-map", "[v]", "-c:v", "libx264", "-preset", "medium", "-crf", "14", "-pix_fmt", "yuv420p", silent]);
console.log(`film: ${total.toFixed(2)} s`);

/* ── 4 · a soft music bed: D – A – Bm – G pads, a gentle arpeggio and pulse, resolving on the title ── */
const music = path.join(WORK, "music.wav");
{
  const chords = [
    [146.83, 220.0, 293.66, 369.99],
    [110.0, 164.81, 220.0, 277.18],
    [123.47, 185.0, 246.94, 293.66],
    [98.0, 146.83, 196.0, 246.94],
  ];
  const BAR = 2.5;
  const STEP = BAR / 8;
  // pad: each chord fades in and out around its own bar (smooth crossfades, no clicks)
  const pad = chords
    .map((c, k) => {
      const centre = k * BAR + BAR / 2;
      const d = `(mod(t-${centre}+5,10)-5)`;
      const w = `pow(max(0,cos(PI*${d}/3.6)),2)`;
      return `${w}*(${c.map((f) => `sin(2*PI*${f}*t)+0.35*sin(2*PI*${f * 2.003}*t)`).join("+")})`;
    })
    .join("+");
  // arpeggio: the current chord's notes, an octave up, plucked on every eighth
  const ci = `mod(floor(t/${BAR}),4)`;
  const ni = `mod(floor(t/${STEP}),4)`;
  const note = chords
    .map((c, k) => `eq(${ci},${k})*(${c.map((f, j) => `eq(${ni},${j})*${f * 2}`).join("+")})`)
    .join("+");
  const env = `exp(-7*mod(t,${STEP}))*min(1,mod(t,${STEP})*300)`;
  const pluck = `${env}*sin(2*PI*(${note})*t)`;
  const pulse = `exp(-16*mod(t,${BAR / 4}))*sin(2*PI*52*t)`;
  const swell = `min(1,0.45+t/${total * 0.9})`;
  const expr = `${swell}*(0.05*(${pad})+0.11*${pluck}+0.16*${pulse})`;
  const dur = (total + 0.5).toFixed(2);
  ff(["-f", "lavfi", "-i", `aevalsrc='${expr}|${expr}':s=44100:d=${dur}`, "-af", `aecho=0.8:0.55:110|190:0.28|0.18,lowpass=f=4200,afade=t=in:d=1.8,afade=t=out:st=${(total - 3.2).toFixed(2)}:d=3.2,loudnorm=I=-21:TP=-2`, music]);
}

/* ── 5 · mux, poster ── */
const film = path.join(OUT, "film.mp4");
// 1080p for large screens, 720p for phones (the page picks one)
ff(["-i", silent, "-i", music, "-map", "0:v", "-map", "1:a", "-c:v", "libx264", "-preset", "slow", "-crf", "23", "-maxrate", "4.5M", "-bufsize", "9M", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "128k", "-shortest", "-movflags", "+faststart", film]);
const small = path.join(OUT, "film-720.mp4");
ff(["-i", silent, "-i", music, "-map", "0:v", "-map", "1:a", "-vf", "scale=1280:720:flags=lanczos", "-c:v", "libx264", "-preset", "slow", "-crf", "24", "-maxrate", "2M", "-bufsize", "4M", "-pix_fmt", "yuv420p", "-c:a", "aac", "-b:a", "96k", "-shortest", "-movflags", "+faststart", small]);
ff(["-i", film, "-frames:v", "1", "-q:v", "3", path.join(OUT, "film-poster.jpg")]);
console.log(`→ public/intro/film.mp4 (${(fs.statSync(film).size / 1e6).toFixed(1)} MB), film-720.mp4 (${(fs.statSync(small).size / 1e6).toFixed(1)} MB)`);
