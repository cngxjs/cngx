import type { CngxSidenavConfig } from './sidenav.config';
import type { CngxSidenavConfigFeature } from './provide-sidenav-config';

/**
 * Override the sidenav family's panel dimensions - `width`, `miniWidth`,
 * `minWidth`, and `maxWidth`. Per-instance `[width]` / `[miniWidth]` /
 * `[minWidth]` / `[maxWidth]` bindings still win over the cascade; this only
 * moves the defaults. Partial payloads deep-merge, so pass only the keys you
 * want to change.
 *
 * ```ts
 * provideSidenavConfig(withSidenavDimensions({ width: '320px', miniWidth: '64px' }));
 * ```
 *
 * @category ui/sidenav
 * @since 0.1.0
 */
export function withSidenavDimensions(
  payload: NonNullable<CngxSidenavConfig['dimensions']>,
): CngxSidenavConfigFeature {
  return { kind: 'dimensions', payload };
}

/**
 * Set the app-wide default CSS media-query string for responsive mode
 * switching. When the query matches, the sidenav resolves to `'side'`;
 * otherwise it falls back to its `mode`. Per-instance `[responsive]` still
 * wins.
 *
 * ```ts
 * provideSidenavConfig(withSidenavResponsive('(min-width: 1024px)'));
 * ```
 *
 * @category ui/sidenav
 * @since 0.1.0
 */
export function withSidenavResponsive(query: string): CngxSidenavConfigFeature {
  return { kind: 'responsive', payload: { responsive: query } };
}

/**
 * Set the app-wide default keyboard shortcut to toggle the sidenav (e.g.
 * `'mod+b'`, which resolves to `ctrl` on Windows/Linux and `meta` on macOS).
 * Per-instance `[shortcut]` still wins.
 *
 * ```ts
 * provideSidenavConfig(withSidenavShortcut('mod+b'));
 * ```
 *
 * @category ui/sidenav
 * @since 0.1.0
 */
export function withSidenavShortcut(combo: string): CngxSidenavConfigFeature {
  return { kind: 'shortcut', payload: { shortcut: combo } };
}

/**
 * Set the app-wide default mini expand-on-hover dwell - `enterDelay` (ms before
 * the rail expands) and `leaveDelay` (ms before it collapses). Flows into the
 * composed `CngxHoverIntent` via `CNGX_HOVER_INTENT_DEFAULTS`. Per-instance
 * `[enterDelay]` / `[leaveDelay]` still win; the shipped literals (120 / 0)
 * apply when neither is set. Partial payloads deep-merge, so pass only the key
 * you want to change.
 *
 * ```ts
 * provideSidenavConfig(withSidenavHoverDwell({ enterDelay: 200, leaveDelay: 150 }));
 * ```
 *
 * @category ui/sidenav
 * @since 0.1.0
 */
export function withSidenavHoverDwell(
  payload: NonNullable<CngxSidenavConfig['hover']>,
): CngxSidenavConfigFeature {
  return { kind: 'hover', payload };
}
