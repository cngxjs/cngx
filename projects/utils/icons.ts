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
 * Hand-hinted drawing of a glyph on a `0 0 12 12` grid, for small boxes.
 * At a 12px box one grid unit is one CSS pixel, so a line one unit wide
 * paints exactly one device pixel at DPR 1, the same weight as the 24-grid
 * stroke 2 at that size.
 *
 * Always a fill outline in `currentColor`: every edge sits on a whole unit
 * (arc radii may end in `.5`), and caps and dots are explicit geometry, so
 * the round-cap contract of `CngxIconPaint` does not apply. The stroke-width
 * tokens (`--cngx-icon-svg-stroke-width`, `--cngx-icon-stroke-width-xs`) do
 * not reach it either; the weight is part of the hint.
 *
 * @internal
 */
export interface CngxIconMicro {
  readonly viewBox: '0 0 12 12';
  readonly d: string;
}

/**
 * Hand-hinted drawing of a glyph on a `0 0 16 16` grid, for the band one
 * size up from the micro tier. At a 16px box one grid unit is one CSS pixel,
 * so a line one unit wide paints exactly one device pixel at DPR 1, the same
 * weight the 24-grid stroke carries at twice the size. Renderers show it in a
 * 15 to 19px box instead of the 24-grid path; 16px is exact, the rest of the
 * band is hinted.
 *
 * Always a fill outline in `currentColor`: every edge sits on a whole unit
 * (arc radii may end in `.5`), and caps and dots are explicit geometry, so
 * the round-cap contract of `CngxIconPaint` does not apply. The stroke-width
 * tokens (`--cngx-icon-svg-stroke-width`, `--cngx-icon-stroke-width-xs`) do
 * not reach it either; the weight is part of the hint.
 *
 * @internal
 */
export interface CngxIconSmall {
  readonly viewBox: '0 0 16 16';
  readonly d: string;
}

/**
 * Framework-agnostic path data for one default cngx glyph. Every icon
 * sits on a `0 0 24 24` grid and is drawn as a single path, so a renderer
 * needs one `<path>` for it and no per-icon markup. Rendered by `CngxIconSvg` in
 * `@cngx/common/display`; an imperative renderer builds the same
 * `<svg><path>` from it and applies the paint contract of
 * `CngxIconPaint` itself.
 *
 * One source per glyph, two grid-specific drawings: `micro` is the 12-grid
 * drawing (see `CngxIconMicro`), drawn as a second `<path>`, that renderers
 * show in a 10 to 14px box instead of the 24-grid path; `small` is the
 * 16-grid drawing (see `CngxIconSmall`), a third `<path>`, shown in a 15 to
 * 19px box. Every icon must decide each: `null` is a recorded decision that
 * no drawing on that grid reads well, and the 24-grid path then shows across
 * that band.
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
  readonly micro: CngxIconMicro | null;
  readonly small: CngxIconSmall | null;
}

/** Close / clear cross. @internal */
export const CNGX_ICON_X = {
  viewBox: '0 0 24 24',
  d: 'M6 6l12 12M18 6L6 18',
  paint: 'stroke',
  micro: {
    viewBox: '0 0 12 12',
    d: 'M2 3L3 2L10 9L9 10ZM9 2L10 3L3 10L2 9Z',
  },
  small: null,
} as const satisfies CngxIconData;

/** Add plus. @internal */
export const CNGX_ICON_PLUS = {
  viewBox: '0 0 24 24',
  d: 'M12 3.5v17M3.5 12h17',
  paint: 'stroke',
  micro: {
    viewBox: '0 0 12 12',
    d: 'M5 1H6V5H10V6H6V10H5V6H1V5H5Z',
  },
  small: null,
} as const satisfies CngxIconData;

/** Horizontal bar (indeterminate checkbox). @internal */
export const CNGX_ICON_MINUS = {
  viewBox: '0 0 24 24',
  d: 'M5 12h14',
  paint: 'stroke',
  micro: {
    viewBox: '0 0 12 12',
    d: 'M3 5H9V7H3Z',
  },
  small: null,
} as const satisfies CngxIconData;

/** Solid dropdown caret pointing down. @internal */
export const CNGX_ICON_CARET_DOWN = {
  viewBox: '0 0 24 24',
  d: 'M5 8h14l-7 9z',
  paint: 'fill',
  micro: {
    viewBox: '0 0 12 12',
    d: 'M2 4H10L6 8Z',
  },
  small: null,
} as const satisfies CngxIconData;

/** Single chevron pointing to the inline start in LTR. @internal */
export const CNGX_ICON_CHEVRON_LEFT = {
  viewBox: '0 0 24 24',
  d: 'M15 6l-6 6 6 6',
  paint: 'stroke',
  micro: {
    viewBox: '0 0 12 12',
    d: 'M7 3L4 6L7 9L8 8L6 6L8 4Z',
  },
  small: null,
} as const satisfies CngxIconData;

/** Single chevron pointing to the inline end in LTR. @internal */
export const CNGX_ICON_CHEVRON_RIGHT = {
  viewBox: '0 0 24 24',
  d: 'M9 6l6 6-6 6',
  paint: 'stroke',
  micro: {
    viewBox: '0 0 12 12',
    d: 'M5 3L8 6L5 9L4 8L6 6L4 4Z',
  },
  small: null,
} as const satisfies CngxIconData;

/** Double chevron pointing left (first page). @internal */
export const CNGX_ICON_CHEVRONS_LEFT = {
  viewBox: '0 0 24 24',
  d: 'M11 6l-6 6 6 6M19 6l-6 6 6 6',
  paint: 'stroke',
  micro: {
    viewBox: '0 0 12 12',
    d: 'M9 3L6 6L9 9L10 8L8 6L10 4ZM5 3L2 6L5 9L6 8L4 6L6 4Z',
  },
  small: null,
} as const satisfies CngxIconData;

/** Double chevron pointing right (last page). @internal */
export const CNGX_ICON_CHEVRONS_RIGHT = {
  viewBox: '0 0 24 24',
  d: 'M13 6l6 6-6 6M5 6l6 6-6 6',
  paint: 'stroke',
  micro: {
    viewBox: '0 0 12 12',
    d: 'M3 3L6 6L3 9L2 8L4 6L2 4ZM7 3L10 6L7 9L6 8L8 6L6 4Z',
  },
  small: null,
} as const satisfies CngxIconData;

/** Horizontal ellipsis, three dots. @internal */
export const CNGX_ICON_MORE_HORIZONTAL = {
  viewBox: '0 0 24 24',
  d: 'M3 12a2 2 0 1 0 4 0a2 2 0 1 0-4 0zM10 12a2 2 0 1 0 4 0a2 2 0 1 0-4 0zM17 12a2 2 0 1 0 4 0a2 2 0 1 0-4 0z',
  paint: 'fill',
  micro: {
    viewBox: '0 0 12 12',
    d: 'M1 5H3V7H1ZM5 5H7V7H5ZM9 5H11V7H9Z',
  },
  small: null,
} as const satisfies CngxIconData;

/** Vertical ellipsis, three dots (overflow menu). @internal */
export const CNGX_ICON_MORE_VERTICAL = {
  viewBox: '0 0 24 24',
  d: 'M12 3a2 2 0 1 0 0 4a2 2 0 1 0 0-4zM12 10a2 2 0 1 0 0 4a2 2 0 1 0 0-4zM12 17a2 2 0 1 0 0 4a2 2 0 1 0 0-4z',
  paint: 'fill',
  micro: {
    viewBox: '0 0 12 12',
    d: 'M5 1H7V3H5ZM5 5H7V7H5ZM5 9H7V11H5Z',
  },
  small: null,
} as const satisfies CngxIconData;

/** Checkmark. @internal */
export const CNGX_ICON_CHECK = {
  viewBox: '0 0 24 24',
  d: 'M5 12.5l4.5 4.5L19 7',
  paint: 'stroke',
  micro: {
    viewBox: '0 0 12 12',
    d: 'M1 6L2 5L5 8L10 3L11 4L5 10Z',
  },
  small: null,
} as const satisfies CngxIconData;

/** Solid dot. @internal */
export const CNGX_ICON_DOT = {
  viewBox: '0 0 24 24',
  d: 'M8 12a4 4 0 1 0 8 0a4 4 0 1 0-8 0z',
  paint: 'fill',
  micro: {
    viewBox: '0 0 12 12',
    d: 'M4 6A2 2 0 1 1 8 6A2 2 0 1 1 4 6Z',
  },
  small: null,
} as const satisfies CngxIconData;

/** Exclamation mark in a warning triangle (error badge, failed commit). @internal */
export const CNGX_ICON_ALERT = {
  viewBox: '0 0 24 24',
  d: 'M12 3L2 20.5h20zM12 9.5v5M12 17.5v.01',
  paint: 'stroke',
  micro: {
    viewBox: '0 0 12 12',
    d: 'M6.514 1.857L11.486 10.143Q12 11 11 11L1 11Q0 11 0.514 10.143L5.486 1.857Q6 1 6.514 1.857ZM5 5V8H7V5ZM5 9V10H7V9Z',
  },
  small: null,
} as const satisfies CngxIconData;

/**
 * Circle with a slash (refused commit). Distinct from `CNGX_ICON_ALERT`,
 * so a refusal never differs from a failure by colour alone (WCAG 1.4.1).
 *
 * @internal
 */
export const CNGX_ICON_BAN = {
  viewBox: '0 0 24 24',
  d: 'M2.5 12a9.5 9.5 0 1 0 19 0a9.5 9.5 0 1 0-19 0zM5.3 5.3l13.4 13.4',
  paint: 'stroke',
  micro: {
    viewBox: '0 0 12 12',
    d: 'M6 0A6 6 0 1 1 6 12A6 6 0 1 1 6 0ZM9.668 8.607A4.5 4.5 0 0 0 3.393 2.332ZM2.332 3.393A4.5 4.5 0 0 0 8.607 9.668Z',
  },
  small: null,
} as const satisfies CngxIconData;

/** Two columns of three dots (drag handle). @internal */
export const CNGX_ICON_GRIP_VERTICAL = {
  viewBox: '0 0 24 24',
  d: 'M7.5 6a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0zM13.5 6a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0zM7.5 12a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0zM13.5 12a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0zM7.5 18a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0zM13.5 18a1.5 1.5 0 1 0 3 0a1.5 1.5 0 1 0-3 0z',
  paint: 'fill',
  micro: {
    viewBox: '0 0 12 12',
    d: 'M3 1H5V3H3ZM7 1H9V3H7ZM3 5H5V7H3ZM7 5H9V7H7ZM3 9H5V11H3ZM7 9H9V11H7Z',
  },
  small: null,
} as const satisfies CngxIconData;

/** Solid triangle pointing up (move up). @internal */
export const CNGX_ICON_TRIANGLE_UP = {
  viewBox: '0 0 24 24',
  d: 'M12 7l7 10H5z',
  paint: 'fill',
  micro: {
    viewBox: '0 0 12 12',
    d: 'M6 4L10 8H2Z',
  },
  small: null,
} as const satisfies CngxIconData;

/** Solid triangle pointing down (move down). @internal */
export const CNGX_ICON_TRIANGLE_DOWN = {
  viewBox: '0 0 24 24',
  d: 'M5 7h14l-7 10z',
  paint: 'fill',
  micro: {
    viewBox: '0 0 12 12',
    d: 'M2 4H10L6 8Z',
  },
  small: null,
} as const satisfies CngxIconData;

/** Chevron pointing down (menu and split button affordance). @internal */
export const CNGX_ICON_CHEVRON_DOWN = {
  viewBox: '0 0 24 24',
  d: 'M6 9l6 6 6-6',
  paint: 'stroke',
  micro: {
    viewBox: '0 0 12 12',
    d: 'M9 5L6 8L3 5L4 4L6 6L8 4Z',
  },
  small: null,
} as const satisfies CngxIconData;

/** Trash can (delete). @internal */
export const CNGX_ICON_TRASH = {
  viewBox: '0 0 24 24',
  d: 'M4 7h16M10 7V4h4v3M6 7l1 13h10l1-13',
  paint: 'stroke',
  micro: {
    viewBox: '0 0 12 12',
    d: 'M4 1H8V3H7V2H5V3H4ZM1 3H11V4H1ZM2 4H3V10H9V4H10V11H2Z',
  },
  small: null,
} as const satisfies CngxIconData;

/** Arrow into a tray (download, export). @internal */
export const CNGX_ICON_DOWNLOAD = {
  viewBox: '0 0 24 24',
  d: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  paint: 'stroke',
  micro: {
    viewBox: '0 0 12 12',
    d: 'M5 1H7V5H9L6 8L3 5H5ZM2 10H10V11H2Z',
  },
  small: null,
} as const satisfies CngxIconData;

/**
 * Cross in a circle (dismiss, clear with emphasis). No micro drawing: on the
 * 12 grid the cross closes up inside the ring, so it keeps the 24-grid path.
 * @internal
 */
export const CNGX_ICON_X_CIRCLE = {
  viewBox: '0 0 24 24',
  d: 'M2.5 12a9.5 9.5 0 1 0 19 0a9.5 9.5 0 1 0-19 0zM9.5 9.5l5 5M14.5 9.5l-5 5',
  paint: 'stroke',
  micro: null,
  small: null,
} as const satisfies CngxIconData;

/** Scissors (cut). @internal */
export const CNGX_ICON_CUT = {
  viewBox: '0 0 24 24',
  d: 'M4 17a3 3 0 1 0 6 0a3 3 0 1 0-6 0zM14 17a3 3 0 1 0 6 0a3 3 0 1 0-6 0zM9.2 14.8L18 4M14.8 14.8L6 4',
  paint: 'stroke',
  micro: {
    viewBox: '0 0 12 12',
    d: 'M1 9A2 2 0 1 1 5 9A2 2 0 1 1 1 9ZM2 9A1 1 0 1 0 4 9A1 1 0 1 0 2 9ZM7 9A2 2 0 1 1 11 9A2 2 0 1 1 7 9ZM8 9A1 1 0 1 0 10 9A1 1 0 1 0 8 9ZM4 7L9 2L10 3L5 8ZM3 2L8 7L7 8L2 3Z',
  },
  small: null,
} as const satisfies CngxIconData;

/** Two stacked sheets (copy, duplicate). @internal */
export const CNGX_ICON_COPY = {
  viewBox: '0 0 24 24',
  d: 'M11 9h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2zM5 15V6a2 2 0 0 1 2-2h9',
  paint: 'stroke',
  micro: {
    viewBox: '0 0 12 12',
    d: 'M5 5H11V11H5ZM6 6V10H10V6ZM2 2H8V3H3V8H2Z',
  },
  small: null,
} as const satisfies CngxIconData;

/** Clipboard with lines (paste). @internal */
export const CNGX_ICON_CLIPBOARD = {
  viewBox: '0 0 24 24',
  d: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 3h6v4H9zM9 12h6M9 16h6',
  paint: 'stroke',
  micro: {
    viewBox: '0 0 12 12',
    d: 'M2 2H4V3H3V10H9V3H8V2H10V11H2ZM4 1H8V4H4ZM4 6H8V7H4ZM4 8H8V9H4Z',
  },
  small: null,
} as const satisfies CngxIconData;

/** Magnifier (search). @internal */
export const CNGX_ICON_SEARCH = {
  viewBox: '0 0 24 24',
  d: 'M4 11a7 7 0 1 0 14 0a7 7 0 1 0-14 0zM16 16l4 4',
  paint: 'stroke',
  micro: {
    viewBox: '0 0 12 12',
    d: 'M1 5.5A4.5 4.5 0 1 1 10 5.5A4.5 4.5 0 1 1 1 5.5ZM2 5.5A3.5 3.5 0 1 0 9 5.5A3.5 3.5 0 1 0 2 5.5ZM9 8L12 11L11 12L8 9Z',
  },
  small: null,
} as const satisfies CngxIconData;

/** Magnifier with a plus (zoom in). @internal */
export const CNGX_ICON_ZOOM_IN = {
  viewBox: '0 0 24 24',
  d: 'M4 11a7 7 0 1 0 14 0a7 7 0 1 0-14 0zM16 16l4 4M8 11h6M11 8v6',
  paint: 'stroke',
  micro: {
    viewBox: '0 0 12 12',
    d: 'M1 5.5A4.5 4.5 0 1 1 10 5.5A4.5 4.5 0 1 1 1 5.5ZM2 5.5A3.5 3.5 0 1 0 9 5.5A3.5 3.5 0 1 0 2 5.5ZM3 5H8V6H3ZM5 3H6V8H5ZM9 8L12 11L11 12L8 9Z',
  },
  small: null,
} as const satisfies CngxIconData;

/** Magnifier with a minus (zoom out). @internal */
export const CNGX_ICON_ZOOM_OUT = {
  viewBox: '0 0 24 24',
  d: 'M4 11a7 7 0 1 0 14 0a7 7 0 1 0-14 0zM16 16l4 4M8 11h6',
  paint: 'stroke',
  micro: {
    viewBox: '0 0 12 12',
    d: 'M1 5.5A4.5 4.5 0 1 1 10 5.5A4.5 4.5 0 1 1 1 5.5ZM2 5.5A3.5 3.5 0 1 0 9 5.5A3.5 3.5 0 1 0 2 5.5ZM3 5H8V6H3ZM9 8L12 11L11 12L8 9Z',
  },
  small: null,
} as const satisfies CngxIconData;

/** Four outward corners (fit, full screen). @internal */
export const CNGX_ICON_MAXIMIZE = {
  viewBox: '0 0 24 24',
  d: 'M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5',
  paint: 'stroke',
  micro: {
    viewBox: '0 0 12 12',
    d: 'M1 1H4V2H2V4H1ZM8 1H11V4H10V2H8ZM11 8V11H8V10H10V8ZM1 8H2V10H4V11H1Z',
  },
  small: null,
} as const satisfies CngxIconData;

/** Arrow curving back to the left (undo). @internal */
export const CNGX_ICON_UNDO = {
  viewBox: '0 0 24 24',
  d: 'M9 14L4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11',
  paint: 'stroke',
  micro: {
    viewBox: '0 0 12 12',
    d: 'M4 2L5 3L3 5V6L5 8L4 9L1 6V5ZM3 5H7A3 3 0 0 1 7 11H5V10H7A2 2 0 0 0 7 6H3Z',
  },
  small: null,
} as const satisfies CngxIconData;

/** Arrow curving forward to the right (redo). @internal */
export const CNGX_ICON_REDO = {
  viewBox: '0 0 24 24',
  d: 'M15 14l5-5-5-5M20 9H9.5a5.5 5.5 0 0 0 0 11H13',
  paint: 'stroke',
  micro: {
    viewBox: '0 0 12 12',
    d: 'M8 2L7 3L9 5V6L7 8L8 9L11 6V5ZM9 5H5A3 3 0 0 0 5 11H7V10H5A2 2 0 0 1 5 6H9Z',
  },
  small: null,
} as const satisfies CngxIconData;

/** Pencil (edit). @internal */
export const CNGX_ICON_PENCIL = {
  viewBox: '0 0 24 24',
  d: 'M4 20h4L19 9l-4-4L4 16zM13 7l4 4',
  paint: 'stroke',
  micro: {
    viewBox: '0 0 12 12',
    d: 'M1 11V9L8 2L10 4L3 11ZM6 4L8 6L9 5L7 3Z',
  },
  small: null,
} as const satisfies CngxIconData;

/** Bell (notifications). @internal */
export const CNGX_ICON_BELL = {
  viewBox: '0 0 24 24',
  d: 'M5 16.5V11a7 7 0 0 1 14 0v5.5l2 2H3zM9.5 21.5h5',
  paint: 'stroke',
  micro: {
    viewBox: '0 0 12 12',
    d: 'M2 8V5A4 4 0 0 1 10 5V8H11V9H1V8ZM3 8H9V5A3 3 0 0 0 3 5ZM5 10H7V11H5Z',
  },
  small: null,
} as const satisfies CngxIconData;

/**
 * Lowercase i with a round dot and a serifed stem, filled (info tone of a
 * status dot). A solid shape carries more weight than a single stroke on a
 * small coloured disc. @internal
 */
export const CNGX_ICON_INFO = {
  viewBox: '0 0 24 24',
  d: 'M10.1 5.4a1.9 1.9 0 1 0 3.8 0a1.9 1.9 0 1 0-3.8 0zM9.3 9.5H13.3V17.6H14.7V20H9.3V17.6H10.7V11.9H9.3Z',
  paint: 'fill',
  micro: {
    viewBox: '0 0 12 12',
    d: 'M5 1H7V3H5ZM5 4H7V10H5Z',
  },
  small: null,
} as const satisfies CngxIconData;

/**
 * Exclamation mark, filled (error dot of a dot stepper, stale badge). Drawn
 * after the Material Symbols `exclamation` glyph (FILL 0, wght 400, opsz 24),
 * Apache-2.0, Copyright Google LLC. @internal
 */
export const CNGX_ICON_EXCLAMATION = {
  viewBox: '0 0 24 24',
  d: 'M11,14V5h2v9H11Zm0,5V17h2v2H11Z',
  paint: 'fill',
  micro: {
    viewBox: '0 0 12 12',
    d: 'M5 2H7V8H5ZM5 9H7V11H5Z',
  },
  small: null,
} as const satisfies CngxIconData;

/**
 * Exclamation mark as a heavy bar over a round dot, filled (warning tone of a
 * status dot). Drawn after the Material Symbols `priority_high` glyph (FILL 0,
 * wght 400, opsz 24), Apache-2.0, Copyright Google LLC. @internal
 */
export const CNGX_ICON_EXCLAMATION_SOLID = {
  viewBox: '0 0 24 24',
  d: 'M12,21q-0.82,0-1.41-0.59T10,19t0.59-1.41T12,17t1.41,0.59Q14,18.18 14,19t-0.59,1.41T12,21Zm-2-6V3h4V15H10Z',
  paint: 'fill',
  micro: {
    viewBox: '0 0 12 12',
    d: 'M5 2H7V8H5ZM5 9H7V11H5Z',
  },
  small: null,
} as const satisfies CngxIconData;

/**
 * Question mark, filled (neutral, unknown tone of a status dot). Drawn after
 * the Material Symbols `question_mark` glyph (FILL 0, wght 400, opsz 24),
 * Apache-2.0, Copyright Google LLC. Carries no micro drawing: no 12-grid
 * variant read well, so it stays on the 24-grid path at every size.
 * @internal
 */
export const CNGX_ICON_QUESTION = {
  viewBox: '0 0 24 24',
  d: 'M10.6,16q0-2.03 0.36-2.91t1.54-1.94q1.03-0.9 1.56-1.56T14.6,8.07q0-1.02-0.69-1.7T12,5.7q-1.27,0-1.94,0.77T9.13,8.05L6.55,6.95q0.52-1.6 1.92-2.78T12,3q2.63,0 4.04,1.46q1.41,1.46 1.41,3.51q0,1.25-0.54,2.14t-1.69,2.01Q14,13.3 13.74,13.91T13.48,16H10.6ZM12,22q-0.82,0-1.41-0.59T10,20t0.59-1.41T12,18t1.41,0.59Q14,19.18 14,20t-0.59,1.41T12,22Z',
  paint: 'fill',
  micro: null,
  small: null,
} as const satisfies CngxIconData;

/** Lowercase i in a circle (info severity). @internal */
export const CNGX_ICON_INFO_CIRCLE = {
  viewBox: '0 0 24 24',
  d: 'M2.5 12a9.5 9.5 0 1 0 19 0a9.5 9.5 0 1 0-19 0zM12 7.5v.01M12 11v5.5',
  paint: 'stroke',
  micro: {
    viewBox: '0 0 12 12',
    d: 'M1 6A5 5 0 1 1 11 6A5 5 0 1 1 1 6ZM2 6A4 4 0 1 0 10 6A4 4 0 1 0 2 6ZM5 3H7V5H5ZM5 6H7V9H5Z',
  },
  small: null,
} as const satisfies CngxIconData;

/** Checkmark in a circle (success severity). @internal */
export const CNGX_ICON_CHECK_CIRCLE = {
  viewBox: '0 0 24 24',
  d: 'M2.5 12a9.5 9.5 0 1 0 19 0a9.5 9.5 0 1 0-19 0zM8 12.5l2.5 2.5L16 9.5',
  paint: 'stroke',
  micro: {
    viewBox: '0 0 12 12',
    d: 'M1 6A5 5 0 1 1 11 6A5 5 0 1 1 1 6ZM2 6A4 4 0 1 0 10 6A4 4 0 1 0 2 6ZM3 7L4 6L5 7L8 4L9 5L5 9Z',
  },
  small: null,
} as const satisfies CngxIconData;

/** Archive box with a lid (empty state). @internal */
export const CNGX_ICON_ARCHIVE = {
  viewBox: '0 0 24 24',
  d: 'M2 4h20v5H2zM4 9v11h16V9M10 13h4',
  paint: 'stroke',
  micro: {
    viewBox: '0 0 12 12',
    d: 'M1 1H11V4H1ZM2 2V3H10V2ZM2 4H3V10H9V4H10V11H2ZM5 6H7V7H5Z',
  },
  small: null,
} as const satisfies CngxIconData;

/** Speaker with two sound waves (read aloud). @internal */
export const CNGX_ICON_VOLUME = {
  viewBox: '0 0 24 24',
  d: 'M11 5L6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14',
  paint: 'stroke',
  micro: {
    viewBox: '0 0 12 12',
    d: 'M1 4H3L6 2V10L3 8H1ZM8 4H9V8H8ZM10 2H11V10H10Z',
  },
  small: null,
} as const satisfies CngxIconData;

/** Rounded square (stop playback). @internal */
export const CNGX_ICON_STOP = {
  viewBox: '0 0 24 24',
  d: 'M8 6h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z',
  paint: 'fill',
  micro: {
    viewBox: '0 0 12 12',
    d: 'M4 3H8A1 1 0 0 1 9 4V8A1 1 0 0 1 8 9H4A1 1 0 0 1 3 8V4A1 1 0 0 1 4 3Z',
  },
  small: null,
} as const satisfies CngxIconData;
