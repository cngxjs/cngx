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

/**
 * Injection token for the application-wide {@link TreetableConfig}.
 * Inject this token to read the resolved configuration in custom extensions.
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
 * Call this in your `ApplicationConfig` providers array.
 *
 * @param config - Optional partial configuration; unset keys use component defaults.
 * @returns An `EnvironmentProviders` value to be passed to `bootstrapApplication`.
 *
 * @example
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [provideTreetable({ highlightRowOnHover: true })],
 * });
 * ```
 */
export function provideTreetable(config: TreetableConfig = {}): EnvironmentProviders {
  return makeEnvironmentProviders([{ provide: CNGX_TREETABLE_CONFIG, useValue: config }]);
}
