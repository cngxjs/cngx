/**
 * How a cngx icon path is painted. `fill` paints the path area in
 * `currentColor`; `stroke` paints only its outline and leaves the area
 * unfilled, with round line caps and joins. The round caps are part of
 * the shape, not a style choice: a zero-length segment such as the dot of
 * `CNGX_ICON_ALERT` only renders as a dot with `stroke-linecap: round`,
 * so every renderer of a stroke icon sets round caps and joins.
 *
 * @internal
 */
export type CngxIconPaint = 'fill' | 'stroke';

/**
 * Framework-agnostic path data for one default cngx glyph. Every icon
 * sits on a `0 0 24 24` grid and is a single path, so a renderer needs
 * one `<path>` and no per-icon markup. Rendered by `CngxIconSvg` in
 * `@cngx/common/display`; an imperative renderer builds the same
 * `<svg><path>` from it and applies the paint contract of
 * `CngxIconPaint` itself.
 *
 * Exported because Sheriff forbids deep-relative imports across library
 * boundaries; `@internal` because cngx ships the glyphs it draws, not an
 * icon system. Consumers replace a glyph through the owning component's
 * slot or `TemplateRef` input.
 *
 * @internal
 */
export interface CngxIconData {
  readonly viewBox: '0 0 24 24';
  readonly d: string;
  readonly paint: CngxIconPaint;
}

/** Close / clear cross. @internal */
export const CNGX_ICON_X = {
  viewBox: '0 0 24 24',
  d: 'M6 6l12 12M18 6L6 18',
  paint: 'stroke',
} as const satisfies CngxIconData;

/** Add plus. @internal */
export const CNGX_ICON_PLUS = {
  viewBox: '0 0 24 24',
  d: 'M12 5v14M5 12h14',
  paint: 'stroke',
} as const satisfies CngxIconData;

/** Horizontal bar (indeterminate checkbox). @internal */
export const CNGX_ICON_MINUS = {
  viewBox: '0 0 24 24',
  d: 'M5 12h14',
  paint: 'stroke',
} as const satisfies CngxIconData;

/** Solid dropdown caret pointing down. @internal */
export const CNGX_ICON_CARET_DOWN = {
  viewBox: '0 0 24 24',
  d: 'M5 8h14l-7 9z',
  paint: 'fill',
} as const satisfies CngxIconData;

/** Single chevron pointing to the inline start in LTR. @internal */
export const CNGX_ICON_CHEVRON_LEFT = {
  viewBox: '0 0 24 24',
  d: 'M15 6l-6 6 6 6',
  paint: 'stroke',
} as const satisfies CngxIconData;

/** Single chevron pointing to the inline end in LTR. @internal */
export const CNGX_ICON_CHEVRON_RIGHT = {
  viewBox: '0 0 24 24',
  d: 'M9 6l6 6-6 6',
  paint: 'stroke',
} as const satisfies CngxIconData;

/** Double chevron pointing left (first page). @internal */
export const CNGX_ICON_CHEVRONS_LEFT = {
  viewBox: '0 0 24 24',
  d: 'M11 6l-6 6 6 6M19 6l-6 6 6 6',
  paint: 'stroke',
} as const satisfies CngxIconData;

/** Double chevron pointing right (last page). @internal */
export const CNGX_ICON_CHEVRONS_RIGHT = {
  viewBox: '0 0 24 24',
  d: 'M13 6l6 6-6 6M5 6l6 6-6 6',
  paint: 'stroke',
} as const satisfies CngxIconData;

/** Horizontal ellipsis, three dots. @internal */
export const CNGX_ICON_MORE_HORIZONTAL = {
  viewBox: '0 0 24 24',
  d: 'M3 12a2 2 0 1 0 4 0a2 2 0 1 0-4 0zM10 12a2 2 0 1 0 4 0a2 2 0 1 0-4 0zM17 12a2 2 0 1 0 4 0a2 2 0 1 0-4 0z',
  paint: 'fill',
} as const satisfies CngxIconData;

/** Vertical ellipsis, three dots (overflow menu). @internal */
export const CNGX_ICON_MORE_VERTICAL = {
  viewBox: '0 0 24 24',
  d: 'M12 3a2 2 0 1 0 0 4a2 2 0 1 0 0-4zM12 10a2 2 0 1 0 0 4a2 2 0 1 0 0-4zM12 17a2 2 0 1 0 0 4a2 2 0 1 0 0-4z',
  paint: 'fill',
} as const satisfies CngxIconData;

/** Checkmark. @internal */
export const CNGX_ICON_CHECK = {
  viewBox: '0 0 24 24',
  d: 'M5 12.5l4.5 4.5L19 7',
  paint: 'stroke',
} as const satisfies CngxIconData;

/** Solid dot (radio checked indicator). @internal */
export const CNGX_ICON_DOT = {
  viewBox: '0 0 24 24',
  d: 'M8 12a4 4 0 1 0 8 0a4 4 0 1 0-8 0z',
  paint: 'fill',
} as const satisfies CngxIconData;

/** Exclamation mark in a warning triangle (error badge, failed commit). @internal */
export const CNGX_ICON_ALERT = {
  viewBox: '0 0 24 24',
  d: 'M12 3L2 20.5h20zM12 9.5v5M12 17.5v.01',
  paint: 'stroke',
} as const satisfies CngxIconData;

/**
 * Circle with a slash (refused commit). Distinct from `CNGX_ICON_ALERT`,
 * so a refusal never differs from a failure by colour alone (WCAG 1.4.1).
 *
 * @internal
 */
export const CNGX_ICON_BAN = {
  viewBox: '0 0 24 24',
  d: 'M3 12a9 9 0 1 0 18 0a9 9 0 1 0-18 0zM5.6 5.6l12.8 12.8',
  paint: 'stroke',
} as const satisfies CngxIconData;

/** Two columns of three dots (drag handle). @internal */
export const CNGX_ICON_GRIP_VERTICAL = {
  viewBox: '0 0 24 24',
  d: 'M7.5 6a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0zM13.5 6a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0zM7.5 12a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0zM13.5 12a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0zM7.5 18a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0zM13.5 18a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0z',
  paint: 'fill',
} as const satisfies CngxIconData;

/** Solid triangle pointing up (move up). @internal */
export const CNGX_ICON_TRIANGLE_UP = {
  viewBox: '0 0 24 24',
  d: 'M12 7l7 10H5z',
  paint: 'fill',
} as const satisfies CngxIconData;

/** Solid triangle pointing down (move down). @internal */
export const CNGX_ICON_TRIANGLE_DOWN = {
  viewBox: '0 0 24 24',
  d: 'M5 7h14l-7 10z',
  paint: 'fill',
} as const satisfies CngxIconData;
