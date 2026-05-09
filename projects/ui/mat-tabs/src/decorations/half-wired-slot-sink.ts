import { InjectionToken, isDevMode } from '@angular/core';

/**
 * Sink callback invoked by `[cngxMatTabs]`'s aggregator-decoration
 * projector when a consumer wires exactly one of
 * `*cngxMatTabAggregatorContent` (the slot template) or
 * `ViewContainerRef` (the embedded-view host) — the half-wired-slot
 * misconfiguration. The projector silently falls back to the
 * imperative `textContent` path when this happens; the sink is the
 * only deliberate signal that the consumer's slot template will not
 * render.
 *
 * @category interactive
 */
export type CngxMatTabHalfWiredSlotSink = (
  missing: 'contentTemplate' | 'viewContainerRef',
) => void;

/**
 * Default {@link CngxMatTabHalfWiredSlotSink} — gated on dev-mode.
 * Production callers see no console output; production telemetry
 * lands only when a consumer overrides the
 * {@link CNGX_MAT_TAB_HALF_WIRED_SLOT_SINK} token.
 *
 * @internal
 */
function defaultHalfWiredSlotSink(
  missing: 'contentTemplate' | 'viewContainerRef',
): void {
  if (!isDevMode()) {
    return;
  }
  console.warn(
    '[cngxMatTabs] aggregator-content slot half-wired — ' +
      `\`${missing}\` is missing while the other half is supplied. ` +
      'The decoration projector will silently fall back to the ' +
      'imperative `textContent` path, and the consumer-projected ' +
      '`*cngxMatTabAggregatorContent` template will never render. ' +
      'Wire both halves on the [cngxMatTabs] directive (or neither).',
  );
}

/**
 * DI token for the half-wired-slot diagnostic sink. Default behaviour
 * is a dev-mode `console.warn` — production callers see nothing.
 * Override at any level (root via `provideEnvironmentInitializer` /
 * `providers`, component via `viewProviders`) to wire telemetry,
 * Sentry breadcrumbs, or a CI fail-fast in test environments.
 *
 * Symmetrical to the
 * {@link https://cngx.dev/api/CNGX_TAB_OVERFLOW_DOM_ADAPTER_FACTORY
 * `CNGX_TAB_OVERFLOW_DOM_ADAPTER_FACTORY`} swap pattern: cngx-side
 * default suffices for the in-tree consumer, but the seam exists so
 * downstream consumers never need to fork the directive to swap
 * behaviour.
 *
 * @category interactive
 */
export const CNGX_MAT_TAB_HALF_WIRED_SLOT_SINK =
  new InjectionToken<CngxMatTabHalfWiredSlotSink>(
    'CNGX_MAT_TAB_HALF_WIRED_SLOT_SINK',
    {
      providedIn: 'root',
      factory: () => defaultHalfWiredSlotSink,
    },
  );
