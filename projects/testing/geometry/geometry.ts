import { expect } from 'vitest';

/**
 * Geometry assertion helpers for `*.geometry.spec.ts`, which run in a real
 * Chromium (the `test-geometry` builder target) rather than jsdom.
 *
 * These are thin reads over `getComputedStyle` / `getBoundingClientRect` that
 * each return a plain value, so the spec keeps the assertion and reads a real
 * diff. A custom matcher would hide the read behind a name; the locked
 * decision for this layer is functions, not matchers.
 *
 * Every read here comes back `''` under jsdom, which is exactly why the default
 * `test` target excludes these specs and this module is only ever loaded in the
 * browser target.
 */

export type GridAxis = 'columns' | 'rows';

/**
 * The resolved track list along one axis. A laid-out grid reports
 * `grid-template-columns` / `-rows` as space-separated used pixel values, so
 * the array length is the track count. Returns `[]` for a non-grid element
 * (`none`).
 */
export function gridTracks(el: Element, axis: GridAxis = 'columns'): string[] {
  const style = getComputedStyle(el);
  const value = (axis === 'columns' ? style.gridTemplateColumns : style.gridTemplateRows).trim();
  return value && value !== 'none' ? value.split(/\s+/) : [];
}

/**
 * The computed value of a custom property at `el`. Catches the two recorded
 * cascade traps a text-level guard cannot see: a `@property inherits: false`
 * token that never reaches a descendant, and a registered token whose fixed
 * `initial-value` defeats a use-site `var(token, fallback)`. For a registered
 * `<length>` / `<color>` token this is the resolved value (`6px`, an `oklch`),
 * not the authored expression.
 */
export function resolvedToken(el: Element, name: string): string {
  return getComputedStyle(el).getPropertyValue(name).trim();
}

/**
 * The resolved value of one standard property at `el` - for pinning a cascade
 * tie, where two selectors land at equal specificity and source order decides
 * the winner.
 */
export function winningValue(el: Element, property: string): string {
  return getComputedStyle(el).getPropertyValue(property).trim();
}

/** A viewport-relative box, the subset of `DOMRect` geometry parity needs. */
export interface Box {
  readonly top: number;
  readonly left: number;
  readonly width: number;
  readonly height: number;
}

/** `el`'s box in viewport coordinates. */
export function boxOf(el: Element): Box {
  const rect = el.getBoundingClientRect();
  return { top: rect.top, left: rect.left, width: rect.width, height: rect.height };
}

/**
 * Assert two boxes coincide within `tolerancePx` on every edge and dimension -
 * "this projected atom fills its container". The one assertion helper in the
 * set: a four-dimension parity check reads worse inlined than named, and the
 * per-edge `expect` still surfaces which edge drifted.
 */
export function expectBoxesMatch(a: Box, b: Box, tolerancePx = 0.5): void {
  expect(Math.abs(a.top - b.top)).toBeLessThanOrEqual(tolerancePx);
  expect(Math.abs(a.left - b.left)).toBeLessThanOrEqual(tolerancePx);
  expect(Math.abs(a.width - b.width)).toBeLessThanOrEqual(tolerancePx);
  expect(Math.abs(a.height - b.height)).toBeLessThanOrEqual(tolerancePx);
}

/** The resolved containment context declared at `el`. */
export interface ContainerState {
  readonly type: string;
  readonly name: string;
}

/**
 * The resolved `container-type` / `container-name` at `el`, so a container
 * contract that depends on a bare string shared across two libraries fails a
 * test when the string drifts.
 */
export function containerState(el: Element): ContainerState {
  const style = getComputedStyle(el);
  return {
    type: style.getPropertyValue('container-type').trim(),
    name: style.getPropertyValue('container-name').trim(),
  };
}

/** Root attributes a geometry spec swaps: density, theme, direction. */
export interface RootAttrs {
  readonly density?: string;
  readonly theme?: string;
  readonly dir?: string;
}

/**
 * Stamp `data-density` / `data-theme` / `dir` on `document.documentElement`
 * for the duration of `body`, then restore the prior values (removing any
 * attribute that was absent). Returns whatever `body` returns.
 *
 * Density, dark mode and RTL all read a root attribute, so this is how a
 * geometry spec asserts them. Safe because the browser provider sets
 * `colorScheme: null`, so `prefers-color-scheme` reports the emulated value
 * rather than a pinned light.
 */
export function withRoot<T>(attrs: RootAttrs, body: () => T): T {
  const root = document.documentElement;
  const saved: (readonly [string, string | null])[] = [];
  const apply = (attr: string, value: string | undefined): void => {
    if (value === undefined) {
      return;
    }
    saved.push([attr, root.getAttribute(attr)]);
    root.setAttribute(attr, value);
  };
  apply('data-density', attrs.density);
  apply('data-theme', attrs.theme);
  apply('dir', attrs.dir);
  try {
    return body();
  } finally {
    for (const [attr, previous] of saved) {
      if (previous === null) {
        root.removeAttribute(attr);
      } else {
        root.setAttribute(attr, previous);
      }
    }
  }
}
