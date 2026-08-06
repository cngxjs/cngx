/**
 * Geometry assertion helpers for `*.geometry.spec.ts`, which run in a real
 * Chromium (the `test-geometry` builder target) rather than jsdom.
 *
 * These are thin reads over `getComputedStyle` that each return a plain value,
 * so the spec keeps the assertion and reads a real diff. A custom matcher would
 * hide the read behind a name; the locked decision for this layer is functions,
 * not matchers.
 *
 * Every read here comes back `''` under jsdom, which is exactly why the default
 * `test` target excludes these specs and this module is only ever loaded in the
 * browser target - reachable through the `@cngx/testing/geometry` subpath, not
 * the root `@cngx/testing` barrel.
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
 * The computed value of a property at `el`, by name.
 *
 * For a custom property it catches the two recorded cascade traps a text-level
 * guard cannot see: a `@property inherits: false` token that never reaches a
 * descendant, and a registered token whose fixed `initial-value` defeats a
 * use-site `var(token, fallback)`. For a registered `<length>` / `<color>`
 * token this is the resolved value (`6px`, an `oklch`), not the authored
 * expression. For a standard property it is the resolved value used to pin a
 * cascade tie (two selectors at equal specificity, source order decides) or to
 * read a laid-out dimension.
 */
export function resolvedToken(el: Element, property: string): string {
  return getComputedStyle(el).getPropertyValue(property).trim();
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
