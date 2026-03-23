import { InjectionToken, makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';

/**
 * Application-wide default configuration for all treetable instances.
 * Individual instances can override these values via the `options` input.
 */
export interface TreetableConfig {
  /**
   * When `true`, rows are visually highlighted on mouse-hover across all instances.
   * @defaultValue `false`
   */
  highlightRowOnHover?: boolean;
  /**
   * When `true`, column header labels have their first letter uppercased.
   * @defaultValue `true`
   */
  capitaliseHeader?: boolean;
}

/** A feature configuration function returned by `withXxx()` helpers. */
export interface TreetableFeature {
  /** @internal */
  readonly _apply: (config: TreetableConfig) => TreetableConfig;
}

/**
 * Injection token for the application-wide {@link TreetableConfig}.
 *
 * @example
 * ```ts
 * const config = inject(CNGX_TREETABLE_CONFIG);
 * ```
 */
export const CNGX_TREETABLE_CONFIG = new InjectionToken<TreetableConfig>('CNGX_TREETABLE_CONFIG', {
  factory: () => ({}),
});

/**
 * Registers application-wide defaults for all treetable instances.
 * Accepts `withXxx()` feature functions for composable configuration.
 *
 * @example
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideTreetable(withHighlightOnHover(), withCapitaliseHeaders(false)),
 *   ],
 * });
 * ```
 */
export function provideTreetable(...features: TreetableFeature[]): EnvironmentProviders {
  let config: TreetableConfig = {};
  for (const f of features) {
    config = f._apply(config);
  }
  return makeEnvironmentProviders([{ provide: CNGX_TREETABLE_CONFIG, useValue: config }]);
}

/** Enable row highlight on hover for all treetable instances. */
export function withHighlightOnHover(enabled = true): TreetableFeature {
  return { _apply: (c) => ({ ...c, highlightRowOnHover: enabled }) };
}

/** Control whether column headers are auto-capitalised. */
export function withCapitaliseHeaders(enabled = true): TreetableFeature {
  return { _apply: (c) => ({ ...c, capitaliseHeader: enabled }) };
}
