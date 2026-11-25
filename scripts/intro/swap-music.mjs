#!/usr/bin/env node
/**
 * Swaps the opening film's soundtrack without re-editing the film (seconds, not minutes).
 *
 *   node scripts/intro/swap-music.mjs "C:/path/track.mp3" [delaySeconds]   # use another track
 *   node scripts/intro/swap-music.mjs --original                          # back to the generated music bed
 *
 * The original films (with the generated music) are kept in .intro-work/backup the first time this runs, and the
 * generated bed itself is .intro-work/music.wav (made by build-film.mjs).
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const OUT = path.join(root, "public/intro");
const BACKUP = path.join(root, ".intro-work/backup");
const FILMS = ["film.mp4", "film-720.mp4"];
const ff = (args) => execFileSync("ffmpeg", ["-v", "error", "-y", ...args], { stdio: "inherit" });
const dur = (f) => Number(execFileSync("ffprobe", ["-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", f]).toString().trim());

fs.mkdirSync(BACKUP, { recursive: true });
for (const f of FILMS) if (!fs.existsSync(path.join(BACKUP, f))) fs.copyFileSync(path.join(OUT, f), path.join(BACKUP, f));

const [arg, delayArg] = process.argv.slice(2);
if (!arg) {
  console.error('Usage: node scripts/intro/swap-music.mjs "track.mp3" [delaySeconds] | --original');
  process.exit(1);
}
if (arg === "--original") {
  for (const f of FILMS) fs.copyFileSync(path.join(BACKUP, f), path.join(OUT, f));
  console.log("restored the films with the generated music");
  process.exit(0);
}

const delay = Number(delayArg ?? 0);
const track = path.resolve(arg);
const trackLen = dur(track);
for (const f of FILMS) {
  const src = path.join(BACKUP, f); // always start from the clean original video
  const len = dur(src);
  const end = Math.min(len, delay + trackLen);
  const tmp = path.join(OUT, `.${f}`);
  ff([
    "-i", src, "-i", track,
    "-filter_complex", `[1:a]afade=t=in:d=0.3,afade=t=out:st=${Math.max(0, trackLen - 1.6).toFixed(2)}:d=1.6,adelay=${Math.round(delay * 1000)}:all=1,apad,atrim=0:${len.toFixed(3)}[a]`,
    "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", f === "film.mp4" ? "128k" : "96k", "-movflags", "+faststart", tmp,
  ]);
  fs.renameSync(tmp, path.join(OUT, f));
  console.log(`${f}: track from ${delay}s to ${end.toFixed(1)}s`);
}
