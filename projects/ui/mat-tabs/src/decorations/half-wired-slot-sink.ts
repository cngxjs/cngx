import { isDevMode } from '@angular/core';

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
 * Override via `provideMatTabsConfig(withHalfWiredSlotSink(fn))` to
 * wire production telemetry (Sentry breadcrumbs, custom logger, CI
 * fail-fast). The library default is a dev-mode `console.warn`; the
 * exported {@link CNGX_DEFAULT_HALF_WIRED_SLOT_SINK} value lets test
 * doubles compose against a stable reference.
 *
 * @category interactive
 */
export type CngxMatTabHalfWiredSlotSink = (
  missing: 'contentTemplate' | 'viewContainerRef',
) => void;

/**
 * Default sink — gated on dev-mode. Production callers see no
 * output; production telemetry lands only when a consumer overrides
 * via `withHalfWiredSlotSink(fn)`.
 *
 * @internal — exported only for {@link CngxMatTabsConfig.halfWiredSlotSink}'s
 * library default. Consumers should override via the config feature
 * rather than reach for this reference directly.
 */
export const CNGX_DEFAULT_HALF_WIRED_SLOT_SINK: CngxMatTabHalfWiredSlotSink = (
  missing,
) => {
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
};
