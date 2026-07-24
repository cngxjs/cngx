import { createLatencyProbe, type CngxLatencyProbe } from '@cngx/core/utils';
import { injectAsyncRegistry } from './provide-async-registry';

/**
 * Bridges {@link CngxAsyncRegistry} into a {@link CngxLatencyProbe} measuring the
 * registry's observed busy-envelope: how long the app was "anything loading"
 * during the last in-flight window.
 *
 * An app-shell indicator compares `lastDuration()` against
 * `CNGX_LOADING_CONFIG.spinnerVsSkeletonCutoff` to pick a spinner (fast last
 * aggregate) vs a skeleton (slow last aggregate) before the next load renders.
 *
 * When the registry is absent (`provideAsyncRegistry` never called),
 * `injectAsyncRegistry()` returns `null`, so the probe's source is permanently
 * `false`: it is never busy and never throws.
 *
 * Must run in an injection context.
 *
 * @returns A probe over `CngxAsyncRegistry.isAnythingLoading`.
 *
 * @category common/data/async-registry
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/data/async-registry/inject-latency-probe.ts
 * @since 0.1.0
 * @relatedTo provideAsyncRegistry, injectAsyncRegistry, createLatencyProbe
 */
export function injectLatencyProbe(): CngxLatencyProbe {
  const registry = injectAsyncRegistry();
  return createLatencyProbe(() => registry?.isAnythingLoading() ?? false);
}
