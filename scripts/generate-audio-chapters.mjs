#!/usr/bin/env node
/**
 * Generate the audio chapters (Laddoo's read-along) with ElevenLabs.
 *
 * Laddoo reads the chapter page itself, line by line, and explains each section. So this script:
 *   1. opens each chapter page in Chrome and asks it for Laddoo's exact tour (window.__ebTour(): every line read and
 *      every explanation, in order);
 *   2. sends the tour to ElevenLabs in chunks (each request stays under the text limit) and asks for word timings;
 *   3. saves public/audio-chapters/<chapter>-<n>.mp3 and public/audio-chapters/<chapter>.json.
 * The player uses the recording only when it matches the page's current tour exactly; if the chapter text changes,
 * run this again for that chapter.
 *
 * Usage (PowerShell), with the site running locally (npm run build; npm run start):
 *   npm i -D puppeteer-core                        # once
 *   $env:ELEVENLABS_API_KEY = "sk_..."             # never commit the key
 *   node scripts/generate-audio-chapters.mjs        # every chapter without audio yet
 *   node scripts/generate-audio-chapters.mjs 1.1 2.3 --force
 *
 * Voice: Charlie (IKne3meq5aSn9XLyUdCD) with an "[Indian English accent]" cue at the start of every audio file. Emotion: the expressive eleven_v3 model is used with an emotion
 * cue in front of every line, taken from Laddoo's mood at that moment (excited at numbers, curious at questions, warm
 * when explaining, cheerful hello and goodbye). Cues are not spoken and are left out of the word timings. If v3 cannot
 * return word timings, the script falls back to eleven_multilingual_v2 with livelier settings.
 *
 * Progress is saved after every audio part (public/audio-chapters/<chapter>.partial.json). If the credits run out in
 * the middle of a chapter, the next run (with a new key) carries on from the next part instead of starting again.
 *
 * Optional: $env:SITE_URL (default http://localhost:3000), $env:CHROME_PATH, $env:ELEVENLABS_VOICE_ID and
 * $env:ELEVENLABS_MODEL_ID to override.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scripts = JSON.parse(fs.readFileSync(path.join(root, "src/features/audio-chapters/scripts.json"), "utf8"));
const outDir = path.join(root, "public/audio-chapters");
fs.mkdirSync(outDir, { recursive: true });

const KEY = process.env.ELEVENLABS_API_KEY;
const VOICE = process.env.ELEVENLABS_VOICE_ID || "IKne3meq5aSn9XLyUdCD"; // Charlie, with an Indian English accent cue
const ACCENT = process.env.ELEVENLABS_ACCENT ?? "[Indian English accent]";
let MODEL = process.env.ELEVENLABS_MODEL_ID || "eleven_v3";
const FALLBACK_MODEL = "eleven_multilingual_v2";

// Laddoo's mood → an emotion cue for the voice (eleven_v3 audio tags)
const CUE = { wave: "[cheerfully]", party: "[excited]", wow: "[amazed]", think: "[curious]", point: "[warmly]", cheer: "[encouragingly]", happy: "[warmly]", talk: "", cheeky: "[playfully]" };
// cues are billed like words: by default only Laddoo's own lines (hello, explanations, goodbye) get one; the lines he
// reads from the page get none (ELEVENLABS_CUES=all brings them back)
const CUES_ALL = process.env.ELEVENLABS_CUES === "all";
const cueFor = (s) => (MODEL !== "eleven_v3" ? "" : s.kind === "explain" ? CUE[s.mood] || "[warmly]" : CUES_ALL ? CUE[s.mood] || "" : "");
const SITE = (process.env.SITE_URL || "http://localhost:3000").replace(/\/$/, "");
const CHROME = process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";
const CHUNK_CHARS = Number(process.env.CHUNK_CHARS) || 4000; // smaller parts use leftover credits better
if (!KEY) {
  console.error("Set ELEVENLABS_API_KEY first (see the comment at the top of this file).");
  process.exit(1);
}

const args = process.argv.slice(2);
const force = args.includes("--force");
const only = args.filter((a) => !a.startsWith("--"));
const chapters = (only.length ? only : Object.keys(scripts)).filter((c) => scripts[c]);

const { default: puppeteer } = await import("puppeteer-core").catch(() => {
  console.error("Install puppeteer-core first: npm i -D puppeteer-core");
  process.exit(1);
});
const browser = await puppeteer.launch({ executablePath: CHROME, headless: "new" });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function tourOf(ch) {
  const p = await browser.newPage();
  await p.setViewport({ width: 1440, height: 900 });
  await p.goto(`${SITE}/${ch}`, { waitUntil: "domcontentloaded", timeout: 120000 });
  await sleep(4000);
  // scroll once through the page so every section has rendered, then come back to the top
  const h = await p.evaluate(() => document.body.scrollHeight);
  for (let y = 0; y < h; y += 800) {
    await p.evaluate((y) => scrollTo(0, y), y);
    await sleep(120);
  }
  await p.evaluate(() => scrollTo(0, 0));
  await sleep(800);
  const tour = await p.evaluate(() => window.__ebTour?.() ?? null);
  await p.close();
  return tour;
}

async function speak(text) {
  const settings = MODEL === "eleven_v3" ? { stability: 0.4, similarity_boost: 0.75, style: 0.5, use_speaker_boost: true } : { stability: 0.35, similarity_boost: 0.85, style: 0.55, use_speaker_boost: true };
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}/with-timestamps?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ text, model_id: MODEL, voice_settings: settings }),
  });
  if (!res.ok) throw new Error(`ElevenLabs ${res.status}: ${(await res.text()).slice(0, 400)}`);
  return res.json();
}

for (const ch of chapters) {
  const json = path.join(outDir, `${ch}.json`);
  if (!force && fs.existsSync(json)) {
    console.log(`${ch}: already generated (use --force to redo)`);
    continue;
  }
  const tour = await tourOf(ch);
  if (!tour?.length) {
    console.error(`${ch}: could not read the tour from ${SITE}/${ch}. Is the site running?`);
    process.exitCode = 1;
    continue;
  }
  // carry on from a saved partial run, if it was made from this same tour
  const partialFile = path.join(outDir, `${ch}.partial.json`);
  const sig = tour.map((s) => s.key + "\u0001" + s.text).join("\u0002");
  let saved = { chunks: [] };
  if (fs.existsSync(partialFile)) {
    const p = JSON.parse(fs.readFileSync(partialFile, "utf8"));
    if (p.sig === sig && !force) saved = p;
  }
  const done = saved.chunks.reduce((n, c) => n + c.steps.length, 0);
  if (done) console.log(`${ch}: resuming after ${done} of ${tour.length} steps`);
  // group the remaining steps into chunks under the request limit
  const groups = [];
  let cur = [];
  let len = 0;
  for (const s of tour.slice(done)) {
    if (cur.length && len + s.text.length + 2 > CHUNK_CHARS) {
      groups.push(cur);
      cur = [];
      len = 0;
    }
    cur.push(s);
    len += s.text.length + 2;
  }
  if (cur.length) groups.push(cur);

  const chunks = [...saved.chunks];
  try {
    for (let g = 0; g < groups.length; g++) {
      const steps = groups[g];
      const build = () => {
        // each line: optional emotion cue, then the words; remember where each line's words start
        let text = MODEL === "eleven_v3" && ACCENT ? ACCENT + " " : "";
        const starts = [];
        steps.forEach((s, i) => {
          if (i) text += "\n\n";
          const cue = cueFor(s);
          if (cue) text += cue + " ";
          starts.push(text.length);
          text += s.text;
        });
        return { text, starts };
      };
      let { text, starts } = build();
      let data;
      try {
        data = await speak(text);
      } catch (e) {
        // out of credits: stop, don't switch to another (cheaper-sounding) model
        if (/quota_exceeded/.test(e.message)) throw e;
        if (MODEL !== FALLBACK_MODEL) {
          console.warn(`${ch}: ${MODEL} failed (${e.message.slice(0, 160)}); using ${FALLBACK_MODEL}`);
          MODEL = FALLBACK_MODEL;
          ({ text, starts } = build());
          data = await speak(text);
        } else throw e;
      }
      const al = data.alignment;
      const out = steps.map((s, i) => {
        const words = [];
        for (const m of s.text.matchAll(/\S+/g)) {
          const a = starts[i] + m.index;
          const b = Math.min(a + m[0].length - 1, al.character_end_times_seconds.length - 1);
          words.push([Number(al.character_start_times_seconds[a].toFixed(3)), Number(al.character_end_times_seconds[b].toFixed(3))]);
        }
        return { key: s.key, text: s.text, words };
      });
      const file = `${ch}-${chunks.length + 1}.mp3`;
      fs.writeFileSync(path.join(outDir, file), Buffer.from(data.audio_base64, "base64"));
      chunks.push({ audio: `/audio-chapters/${file}`, steps: out });
      fs.writeFileSync(partialFile, JSON.stringify({ sig, voice: VOICE, model: MODEL, chunks }));
      console.log(`${ch}: part ${chunks.length} saved (${steps.length} steps; ${groups.length - g - 1} part(s) left this run)`);
    }
  } catch (e) {
    const got = chunks.reduce((n, c) => n + c.steps.length, 0);
    console.error(`${ch}: ${e.message.slice(0, 220)}`);
    if (got) console.error(`${ch}: ${got} of ${tour.length} steps saved; run again with a new key to finish it`);
    process.exitCode = 1;
    continue;
  }
  fs.writeFileSync(json, JSON.stringify({ voice: VOICE, model: MODEL, chunks }));
  fs.rmSync(partialFile, { force: true });
  console.log(`${ch}: done, ${tour.length} steps in ${chunks.length} audio files`);
}
await browser.close();
