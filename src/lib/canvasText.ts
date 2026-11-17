/** Helpers for drawing text onto canvas textures quickly. */

let family: string | null = null;

/** The page's body font stack (read once; getComputedStyle forces a style pass every time it is called). */
export function bodyFontFamily(): string {
  if (typeof document === "undefined") return "sans-serif";
  if (family === null) family = getComputedStyle(document.body).fontFamily || "sans-serif";
  return family;
}

/**
 * The font size a "shrink until it fits" loop would settle on — `start`, `start - step`, `start - 2·step`, … stopping at
 * the first size that `fits`, or at the first size that is `min` or smaller — found by binary search instead of
 * measuring every step. Text width grows with font size, so the answer is identical; it just takes ~7 measurements
 * instead of up to a hundred per label.
 */
export function largestFitting(start: number, fits: (size: number) => boolean, min: number, step = 2): number {
  let last = 0;
  while (start - step * last > min) last++;
  let lo = 0;
  let hi = last;
  while (lo < hi) {
    const mid = (lo + hi) >> 1;
    if (fits(start - step * mid)) hi = mid;
    else lo = mid + 1;
  }
  return start - step * lo;
}
