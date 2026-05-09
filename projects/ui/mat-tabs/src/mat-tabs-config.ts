import {
  type EnvironmentProviders,
  inject,
  InjectionToken,
  makeEnvironmentProviders,
  type Provider,
} from '@angular/core';

import {
  type CngxMatTabHalfWiredSlotSink,
  CNGX_DEFAULT_HALF_WIRED_SLOT_SINK,
} from './decorations/half-wired-slot-sink';

/**
 * Behaviour knobs for `[cngxMatTabs]`. Single canonical surface
 * symmetric to `provideSelectConfig` in the select family — every
 * tunable is a `with*` feature on the same aggregator instead of
 * a standalone DI token, so consumers configure the directive
 * through one entry point and the API surface stays small.
 *
 * Per-instance Inputs win over `provideMatTabsConfigAt(...)`
 * (component scope), which wins over `provideMatTabsConfig(...)`
 * (root), which wins over the library defaults captured by
 * {@link CNGX_MAT_TABS_CONFIG_DEFAULTS}.
 *
 * @category interactive
 */
export interface CngxMatTabsConfig {
  /**
   * Cap on the `[cngxMatTabs]` overflow-anchor retry loop. The
   * directive runs `createDomAnchorRetry` on every `afterNextRender`
   * until `.mat-mdc-tab-header` materialises in the host subtree;
   * the cap exists so a never-rendered host (e.g. `<mat-tab-group>`
   * gated behind a never-true `*ngIf` / `@defer`) does not re-arm
   * forever.
   *
   * Default: `5` — well above normal Material render lag (a single
   * `afterNextRender` is enough on every supported version), low
   * enough to surface a dev-mode `console.warn` promptly when the
   * consumer DOM never appears.
   *
   * Note: `<cngx-tab-overflow>`'s own attach loop uses `60` rAF
   * frames, not `5` — different scheduler, different budget. The
   * two caps are intentionally independent because the underlying
   * timing primitives differ; a shared "anchor max attempts" knob
   * would conflate one frame of `afterNextRender` with one rAF
   * frame, which they are not. The asymmetry is documented in
   * `tabs-accepted-debt §11`; consumers needing cngx-native rAF
   * tuning should re-evaluate that entry.
   */
  readonly anchorMaxAttempts?: number;

  /**
   * Diagnostic sink invoked when a consumer wires exactly one of
   * `*cngxMatTabAggregatorContent` or its `ViewContainerRef`.
   * Default is a dev-mode `console.warn`; override via
   * {@link withHalfWiredSlotSink} to wire production telemetry
   * (Sentry breadcrumbs, custom logger, CI fail-fast).
   */
  readonly halfWiredSlotSink?: CngxMatTabHalfWiredSlotSink;
}

/**
 * Library defaults for `[cngxMatTabs]`. Source of truth for every
 * key on {@link CngxMatTabsConfig}. Consumed by
 * {@link injectMatTabsConfig} as the final fallback.
 *
 * @internal
 */
export const CNGX_MAT_TABS_CONFIG_DEFAULTS = {
  anchorMaxAttempts: 5,
  halfWiredSlotSink: CNGX_DEFAULT_HALF_WIRED_SLOT_SINK,
} as const satisfies Required<CngxMatTabsConfig>;

/**
 * DI token holding a partial {@link CngxMatTabsConfig}. Set via
 * {@link provideMatTabsConfig} (app-wide) or
 * {@link provideMatTabsConfigAt} (component scope). Read via
 * {@link injectMatTabsConfig}, which merges with the library
 * defaults so callers never see `undefined`.
 *
 * @category interactive
 */
export const CNGX_MAT_TABS_CONFIG = new InjectionToken<CngxMatTabsConfig>(
  'CngxMatTabsConfig',
);

/**
 * Feature object returned by `with*` mat-tabs functions and consumed
 * by {@link provideMatTabsConfig} / {@link provideMatTabsConfigAt}.
 * The optional `_target` discriminator is reserved for a future
 * cross-family aggregator (`provideCngxMatTabs`) that dispatches
 * features to the right provider — analogous to `_target: 'select'`
 * in the select family.
 *
 * @category interactive
 */
export interface CngxMatTabsConfigFeature {
  readonly config: Partial<CngxMatTabsConfig>;
  /** @internal */
  readonly _target?: 'mat-tabs';
}

function feature(
  config: Partial<CngxMatTabsConfig>,
): CngxMatTabsConfigFeature {
  return { config, _target: 'mat-tabs' };
}

/**
 * Cap on the `[cngxMatTabs]` overflow-anchor retry loop.
 * See {@link CngxMatTabsConfig.anchorMaxAttempts} for default + rationale.
 *
 * @category interactive
 */
export function withAnchorRetryAttempts(n: number): CngxMatTabsConfigFeature {
  return feature({ anchorMaxAttempts: n });
}

/**
 * Override the half-wired-slot diagnostic sink.
 * See {@link CngxMatTabsConfig.halfWiredSlotSink}.
 *
 * @category interactive
 */
export function withHalfWiredSlotSink(
  sink: CngxMatTabHalfWiredSlotSink,
): CngxMatTabsConfigFeature {
  return feature({ halfWiredSlotSink: sink });
}

function mergeFeatures(
  features: readonly CngxMatTabsConfigFeature[],
): Partial<CngxMatTabsConfig> {
  const merged: {
    -readonly [K in keyof CngxMatTabsConfig]?: CngxMatTabsConfig[K];
  } = {};
  for (const f of features) {
    Object.assign(merged, f.config);
  }
  return merged;
}

/**
 * App-wide `[cngxMatTabs]` configuration. Returns
 * `EnvironmentProviders` for use inside `bootstrapApplication`'s
 * `providers` array.
 *
 * @example
 * ```ts
 * bootstrapApplication(App, {
 *   providers: [
 *     provideMatTabsConfig(
 *       withAnchorRetryAttempts(10),
 *       withHalfWiredSlotSink((missing) => Sentry.captureMessage(`half-wired ${missing}`)),
 *     ),
 *   ],
 * });
 * ```
 *
 * @category interactive
 */
export function provideMatTabsConfig(
  ...features: CngxMatTabsConfigFeature[]
): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: CNGX_MAT_TABS_CONFIG, useValue: mergeFeatures(features) },
  ]);
}

/**
 * Component-scope `[cngxMatTabs]` configuration. Returns a
 * `Provider[]` so the result can be spread into a component's
 * `providers` or `viewProviders` (which cannot accept opaque
 * environment providers).
 *
 * @example
 * ```ts
 * @Component({
 *   selector: 'app-tabs-page',
 *   viewProviders: [
 *     ...provideMatTabsConfigAt(withAnchorRetryAttempts(20)),
 *   ],
 *   ...
 * })
 * ```
 *
 * @category interactive
 */
export function provideMatTabsConfigAt(
  ...features: CngxMatTabsConfigFeature[]
): Provider[] {
  return [{ provide: CNGX_MAT_TABS_CONFIG, useValue: mergeFeatures(features) }];
}

/**
 * Resolve the effective `[cngxMatTabs]` configuration for the current
 * injector. Always returns a fully populated, non-`undefined` object
 * so call sites do not need null-coalescing.
 *
 * Resolution order per key:
 * 1. `CNGX_MAT_TABS_CONFIG` value (set via
 *    {@link provideMatTabsConfig} / {@link provideMatTabsConfigAt}).
 * 2. {@link CNGX_MAT_TABS_CONFIG_DEFAULTS} (library default).
 *
 * @category interactive
 */
export function injectMatTabsConfig(): Required<CngxMatTabsConfig> {
  const user = inject(CNGX_MAT_TABS_CONFIG, { optional: true }) ?? {};
  return {
    anchorMaxAttempts:
      user.anchorMaxAttempts ?? CNGX_MAT_TABS_CONFIG_DEFAULTS.anchorMaxAttempts,
    halfWiredSlotSink:
      user.halfWiredSlotSink ?? CNGX_MAT_TABS_CONFIG_DEFAULTS.halfWiredSlotSink,
  };
}
