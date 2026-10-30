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
  d: 'M12 3.5v17M3.5 12h17',
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

/** Solid dot. @internal */
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
  d: 'M2.5 12a9.5 9.5 0 1 0 19 0a9.5 9.5 0 1 0-19 0zM5.3 5.3l13.4 13.4',
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

/** Chevron pointing down (menu and split button affordance). @internal */
export const CNGX_ICON_CHEVRON_DOWN = {
  viewBox: '0 0 24 24',
  d: 'M6 9l6 6 6-6',
  paint: 'stroke',
} as const satisfies CngxIconData;

/** Trash can (delete). @internal */
export const CNGX_ICON_TRASH = {
  viewBox: '0 0 24 24',
  d: 'M4 7h16M10 7V4h4v3M6 7l1 13h10l1-13',
  paint: 'stroke',
} as const satisfies CngxIconData;

/** Arrow into a tray (download, export). @internal */
export const CNGX_ICON_DOWNLOAD = {
  viewBox: '0 0 24 24',
  d: 'M12 4v11M7 10l5 5 5-5M5 20h14',
  paint: 'stroke',
} as const satisfies CngxIconData;

/** Cross in a circle (dismiss, clear with emphasis). @internal */
export const CNGX_ICON_X_CIRCLE = {
  viewBox: '0 0 24 24',
  d: 'M2.5 12a9.5 9.5 0 1 0 19 0a9.5 9.5 0 1 0-19 0zM9.5 9.5l5 5M14.5 9.5l-5 5',
  paint: 'stroke',
} as const satisfies CngxIconData;

/** Scissors (cut). @internal */
export const CNGX_ICON_CUT = {
  viewBox: '0 0 24 24',
  d: 'M4 17a3 3 0 1 0 6 0a3 3 0 1 0-6 0zM14 17a3 3 0 1 0 6 0a3 3 0 1 0-6 0zM9.2 14.8L18 4M14.8 14.8L6 4',
  paint: 'stroke',
} as const satisfies CngxIconData;

/** Two stacked sheets (copy, duplicate). @internal */
export const CNGX_ICON_COPY = {
  viewBox: '0 0 24 24',
  d: 'M11 9h7a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-7a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2zM5 15V6a2 2 0 0 1 2-2h9',
  paint: 'stroke',
} as const satisfies CngxIconData;

/** Clipboard with lines (paste). @internal */
export const CNGX_ICON_CLIPBOARD = {
  viewBox: '0 0 24 24',
  d: 'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 3h6v4H9zM9 12h6M9 16h6',
  paint: 'stroke',
} as const satisfies CngxIconData;

/** Magnifier (search). @internal */
export const CNGX_ICON_SEARCH = {
  viewBox: '0 0 24 24',
  d: 'M4 11a7 7 0 1 0 14 0a7 7 0 1 0-14 0zM16 16l4 4',
  paint: 'stroke',
} as const satisfies CngxIconData;

/** Magnifier with a plus (zoom in). @internal */
export const CNGX_ICON_ZOOM_IN = {
  viewBox: '0 0 24 24',
  d: 'M4 11a7 7 0 1 0 14 0a7 7 0 1 0-14 0zM16 16l4 4M8 11h6M11 8v6',
  paint: 'stroke',
} as const satisfies CngxIconData;

/** Magnifier with a minus (zoom out). @internal */
export const CNGX_ICON_ZOOM_OUT = {
  viewBox: '0 0 24 24',
  d: 'M4 11a7 7 0 1 0 14 0a7 7 0 1 0-14 0zM16 16l4 4M8 11h6',
  paint: 'stroke',
} as const satisfies CngxIconData;

/** Four outward corners (fit, full screen). @internal */
export const CNGX_ICON_MAXIMIZE = {
  viewBox: '0 0 24 24',
  d: 'M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5',
  paint: 'stroke',
} as const satisfies CngxIconData;

/** Arrow curving back to the left (undo). @internal */
export const CNGX_ICON_UNDO = {
  viewBox: '0 0 24 24',
  d: 'M9 14L4 9l5-5M4 9h10.5a5.5 5.5 0 0 1 0 11H11',
  paint: 'stroke',
} as const satisfies CngxIconData;

/** Arrow curving forward to the right (redo). @internal */
export const CNGX_ICON_REDO = {
  viewBox: '0 0 24 24',
  d: 'M15 14l5-5-5-5M20 9H9.5a5.5 5.5 0 0 0 0 11H13',
  paint: 'stroke',
} as const satisfies CngxIconData;

/** Pencil (edit). @internal */
export const CNGX_ICON_PENCIL = {
  viewBox: '0 0 24 24',
  d: 'M4 20h4L19 9l-4-4L4 16zM13 7l4 4',
  paint: 'stroke',
} as const satisfies CngxIconData;

/** Bell (notifications). @internal */
export const CNGX_ICON_BELL = {
  viewBox: '0 0 24 24',
  d: 'M5 16.5V11a7 7 0 0 1 14 0v5.5l2 2H3zM9.5 21.5h5',
  paint: 'stroke',
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
} as const satisfies CngxIconData;

/** Exclamation mark (error dot of a dot stepper, stale badge). @internal */
export const CNGX_ICON_EXCLAMATION = {
  viewBox: '0 0 24 24',
  d: 'M12 4.5V14M12 19.5v.01',
  paint: 'stroke',
} as const satisfies CngxIconData;

/**
 * Exclamation mark as a tapered wedge over a round dot, filled (warning tone
 * of a status dot). @internal
 */
export const CNGX_ICON_EXCLAMATION_SOLID = {
  viewBox: '0 0 24 24',
  d: 'M10 5.6a2 2 0 0 1 4 0l-.75 8.6a1.25 1.25 0 0 1-2.5 0zM10.1 18.6a1.9 1.9 0 1 0 3.8 0a1.9 1.9 0 1 0-3.8 0z',
  paint: 'fill',
} as const satisfies CngxIconData;

/** Question mark (neutral, unknown tone of a status dot). @internal */
export const CNGX_ICON_QUESTION = {
  viewBox: '0 0 24 24',
  d: 'M9 8.5a3 3 0 1 1 4.5 2.6c-.9.5-1.5 1.2-1.5 2.2V14M12 18.5v.01',
  paint: 'stroke',
} as const satisfies CngxIconData;

/** Lowercase i in a circle (info severity). @internal */
export const CNGX_ICON_INFO_CIRCLE = {
  viewBox: '0 0 24 24',
  d: 'M2.5 12a9.5 9.5 0 1 0 19 0a9.5 9.5 0 1 0-19 0zM12 7.5v.01M12 11v5.5',
  paint: 'stroke',
} as const satisfies CngxIconData;

/** Checkmark in a circle (success severity). @internal */
export const CNGX_ICON_CHECK_CIRCLE = {
  viewBox: '0 0 24 24',
  d: 'M2.5 12a9.5 9.5 0 1 0 19 0a9.5 9.5 0 1 0-19 0zM8 12.5l2.5 2.5L16 9.5',
  paint: 'stroke',
} as const satisfies CngxIconData;

/** Archive box with a lid (empty state). @internal */
export const CNGX_ICON_ARCHIVE = {
  viewBox: '0 0 24 24',
  d: 'M2 4h20v5H2zM4 9v11h16V9M10 13h4',
  paint: 'stroke',
} as const satisfies CngxIconData;

/** Speaker with two sound waves (read aloud). @internal */
export const CNGX_ICON_VOLUME = {
  viewBox: '0 0 24 24',
  d: 'M11 5L6 9H2v6h4l5 4zM15.5 8.5a5 5 0 0 1 0 7M19 5a10 10 0 0 1 0 14',
  paint: 'stroke',
} as const satisfies CngxIconData;

/** Rounded square (stop playback). @internal */
export const CNGX_ICON_STOP = {
  viewBox: '0 0 24 24',
  d: 'M8 6h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2z',
  paint: 'fill',
} as const satisfies CngxIconData;
