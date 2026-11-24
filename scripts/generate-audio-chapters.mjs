#!/usr/bin/env node
/**
 * Generate the audio chapters with ElevenLabs.
 *
 * Reads the narration scripts from src/features/audio-chapters/scripts.json and, for each chapter, asks ElevenLabs for
 * speech WITH word timings. Saves two files the site picks up automatically:
 *   public/audio-chapters/<chapter>.mp3   the narration
 *   public/audio-chapters/<chapter>.json  { audio, words: [[start, end], ...] }  one entry per word, in script order
 * The audio chapter player then highlights each word exactly as it is spoken.
 *
 * Usage (PowerShell):
 *   $env:ELEVENLABS_API_KEY = "sk_..."            # never commit the key
 *   node scripts/generate-audio-chapters.mjs        # every chapter that has no audio yet
 *   node scripts/generate-audio-chapters.mjs 1.1 2.3 --force
 *
 * Optional: $env:ELEVENLABS_VOICE_ID (default: "Sarah", a warm, clear voice) and $env:ELEVENLABS_MODEL_ID
 * (default: eleven_multilingual_v2). Pick any voice from your ElevenLabs voice library and paste its id.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const scripts = JSON.parse(fs.readFileSync(path.join(root, "src/features/audio-chapters/scripts.json"), "utf8"));
const outDir = path.join(root, "public/audio-chapters");
fs.mkdirSync(outDir, { recursive: true });

const KEY = process.env.ELEVENLABS_API_KEY;
const VOICE = process.env.ELEVENLABS_VOICE_ID || "EXAVITQu4vr4xnSDxMaL";
const MODEL = process.env.ELEVENLABS_MODEL_ID || "eleven_multilingual_v2";
if (!KEY) {
  console.error("Set ELEVENLABS_API_KEY first (see the comment at the top of this file).");
  process.exit(1);
}

const args = process.argv.slice(2);
const force = args.includes("--force");
const only = args.filter((a) => !a.startsWith("--"));
const chapters = (only.length ? only : Object.keys(scripts)).filter((c) => scripts[c]);

for (const ch of chapters) {
  const mp3 = path.join(outDir, `${ch}.mp3`);
  const json = path.join(outDir, `${ch}.json`);
  if (!force && fs.existsSync(mp3) && fs.existsSync(json)) {
    console.log(`${ch}: already generated (use --force to redo)`);
    continue;
  }
  // a short pause between parts; the player splits words exactly the same way (any run of non-spaces is a word)
  const text = scripts[ch].segments.map((s) => s.text).join("\n\n");
  const res = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${VOICE}/with-timestamps?output_format=mp3_44100_128`, {
    method: "POST",
    headers: { "xi-api-key": KEY, "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      model_id: MODEL,
      voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.25, use_speaker_boost: true },
    }),
  });
  if (!res.ok) {
    console.error(`${ch}: ElevenLabs error ${res.status}: ${(await res.text()).slice(0, 300)}`);
    process.exitCode = 1;
    continue;
  }
  const data = await res.json();
  const al = data.alignment;
  // character timings → word timings, words found the same way the player finds them
  const words = [];
  for (const m of text.matchAll(/\S+/g)) {
    const a = m.index;
    const b = a + m[0].length - 1;
    const start = al.character_start_times_seconds[a];
    const end = al.character_end_times_seconds[Math.min(b, al.character_end_times_seconds.length - 1)];
    words.push([Number(start.toFixed(3)), Number(end.toFixed(3))]);
  }
  fs.writeFileSync(mp3, Buffer.from(data.audio_base64, "base64"));
  fs.writeFileSync(json, JSON.stringify({ audio: `/audio-chapters/${ch}.mp3`, voice: VOICE, model: MODEL, words }));
  console.log(`${ch}: ${words.length} words, ${(words.at(-1)?.[1] ?? 0).toFixed(1)} s`);
}
