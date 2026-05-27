import { InjectionToken, makeEnvironmentProviders, type EnvironmentProviders } from '@angular/core';

/**
 * Application-wide default configuration for every `CngxTreetable`
 * instance in the injection scope.
 *
 * **Precedence cascade.** Each treetable instance reads its effective
 * options through {@link CngxTreetable.resolvedOptions} which overlays
 * the per-instance `[options]` input on top of this app-wide config.
 * Per-instance wins for the keys it sets; app-wide fills the rest;
 * library defaults fill anything still unset. Same shape as Material's
 * `MAT_*` defaults pattern.
 *
 * Register an instance of this via {@link provideTreetable}; reach it
 * by injecting {@link CNGX_TREETABLE_CONFIG} in custom code (rare -
 * `CngxTreetable` already does that internally).
 *
 * @category data-display/treetable
 */
export interface TreetableConfig {
  /**
   * When `true`, rows are visually highlighted on mouse-hover across
   * all instances. Set per-instance via `options.highlightRowOnHover`
   * to override.
   * @defaultValue `false`
   */
  highlightRowOnHover?: boolean;
  /**
   * When `true`, column header labels have their first letter
   * uppercased before display. Set per-instance via
   * `options.capitaliseHeader` to override.
   * @defaultValue `true`
   */
  capitaliseHeader?: boolean;
}

/**
 * Marker shape returned by every `withXxx()` helper. Each feature is a
 * `_apply` reducer that takes the partially-built {@link TreetableConfig}
 * and returns the next one, so multiple features fold cleanly through
 * `provideTreetable(withA(), withB(), ...)`. The `_apply` field is
 * library-internal; consumers compose features via the public helpers
 * and never call `_apply` directly.
 *
 * @category data-display/treetable
 */
export interface TreetableFeature {
  /** @internal */
  readonly _apply: (config: TreetableConfig) => TreetableConfig;
}

/**
 * Injection token holding the app-wide {@link TreetableConfig}. The
 * default factory returns an empty object, so consumers can call
 * `inject(CNGX_TREETABLE_CONFIG)` without first calling
 * `provideTreetable()` - they just get the library defaults.
 *
 * `CngxTreetable` already injects this internally to build the
 * `resolvedOptions` cascade; reach for it directly only when you are
 * writing a sibling component that needs to honour the same app-wide
 * defaults.
 *
 * ```ts
 * const config = inject(CNGX_TREETABLE_CONFIG);
 * ```
 *
 * @category data-display/treetable
 */
export const CNGX_TREETABLE_CONFIG = new InjectionToken<TreetableConfig>('CNGX_TREETABLE_CONFIG', {
  factory: () => ({}),
});

/**
 * Registers application-wide defaults for every `CngxTreetable` in the
 * injection scope. Composes any number of {@link TreetableFeature}
 * helpers via left-to-right reduction; later features can override
 * earlier ones if you call the same `withXxx()` twice (rare).
 *
 * Calling with no arguments is valid and produces an empty
 * `TreetableConfig` - identical to not calling `provideTreetable` at
 * all. Per-instance `[options]` input always wins over whatever lands
 * here.
 *
 * Application bootstrap:
 *
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideTreetable(
 *       withHighlightOnHover(),       // turn hover-highlight on app-wide
 *       withCapitaliseHeaders(false), // keep raw header keys app-wide
 *     ),
 *   ],
 * });
 * ```
 *
 * Per-route scope (Angular 16+ `provide*` works inside `Route.providers`):
 *
 * ```ts
 * const routes: Routes = [{
 *   path: 'admin',
 *   providers: [provideTreetable(withHighlightOnHover())],
 *   children: adminChildren,
 * }];
 * ```
 *
 * @category data-display/treetable
 */
export function provideTreetable(...features: TreetableFeature[]): EnvironmentProviders {
  let config: TreetableConfig = {};
  for (const f of features) {
    config = f._apply(config);
  }
  return makeEnvironmentProviders([{ provide: CNGX_TREETABLE_CONFIG, useValue: config }]);
}

/**
 * Feature: row highlight on mouse-hover.
 *
 * The library default for `highlightRowOnHover` is `false`, so calling
 * `withHighlightOnHover()` *opts in* across the app. Pass `false`
 * explicitly to be loud about the off state (e.g. when overlaying on
 * top of an earlier `provideTreetable(withHighlightOnHover())` in a
 * nested scope).
 *
 * @param enabled - Hover-highlight on/off. Default `true`.
 *
 * @category data-display/treetable
 */
export function withHighlightOnHover(enabled = true): TreetableFeature {
  return { _apply: (c) => ({ ...c, highlightRowOnHover: enabled }) };
}

/**
 * Feature: auto-capitalisation of column header labels.
 *
 * The library default for `capitaliseHeader` is `true`, so headers
 * already capitalise without this helper. Use
 * `withCapitaliseHeaders(false)` to *opt out* and render the raw
 * column-key strings (useful for snake_case domain keys you want to
 * keep verbatim, or for fully custom `*cngxHeader` slot rendering).
 *
 * @param enabled - Capitalise on/off. Default `true`.
 *
 * @category data-display/treetable
 */
export function withCapitaliseHeaders(enabled = true): TreetableFeature {
  return { _apply: (c) => ({ ...c, capitaliseHeader: enabled }) };
}
