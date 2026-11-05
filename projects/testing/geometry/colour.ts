/**
 * Colour reads for `*.geometry.spec.ts`. Chromium reports tokens in the
 * notation they were authored in (oklch, oklab, color-mix, relative colour
 * syntax), so every helper paints the colour into a 1px canvas and reads the
 * sRGB pixel back. That compares what the screen shows, after gamut clipping,
 * and needs no colour parser. Plain functions, same as the rest of the layer:
 * the spec keeps the assertion.
 */

export type Rgba = [number, number, number, number];

export type Oklab = [number, number, number];

/**
 * The sRGB bytes of any CSS colour, rasterised by a canvas `fillRect` over a
 * transparent pixel. A translucent colour keeps its alpha in the fourth byte.
 */
export function rasterise(color: string): Rgba {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('2d context unavailable');
  }
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, 1, 1);
  const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data;
  return [r, g, b, a];
}

function linear(byte: number): number {
  const c = byte / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

function luminance(color: string): number {
  const [r, g, b] = rasterise(color).slice(0, 3).map(linear);
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/**
 * WCAG 2.x contrast ratio of two opaque colours, over their rasterised sRGB.
 * Order does not matter; the lighter colour is the numerator.
 */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/**
 * The OKLab coordinates `[L, a, b]` of the rasterised colour. A spec derives
 * distance (`Math.hypot` of the difference) and hue (`atan2(b, a)`) from it.
 */
export function oklabOf(color: string): Oklab {
  const [r, g, b] = rasterise(color).slice(0, 3).map(linear);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}
