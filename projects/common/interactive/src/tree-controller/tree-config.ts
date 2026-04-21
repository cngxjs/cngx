import { inject, InjectionToken, type Provider } from '@angular/core';

/**
 * App-wide tree-controller configuration. Populated via
 * {@link provideTreeConfig} in the root providers (or
 * {@link provideTreeConfigAt} in a component's `viewProviders` for a
 * sub-tree scope).
 *
 * Priority for every field is:
 *
 * ```
 * Per-controller option (CngxTreeControllerOptions.*)
 *   ↑ falls through to
 * Component/scope viewProviders  (provideTreeConfigAt)
 *   ↑ falls through to
 * Root providers                 (provideTreeConfig)
 *   ↑ falls through to
 * Library default                (createTreeController / flattenTree)
 * ```
 *
 * All fields are optional — omit the ones you don't need. Typed with
 * `unknown` T-parameters because config values flow through the DI
 * system where per-instance generics can't be preserved; per-
 * controller options are still properly typed via the call site's
 * `CngxTreeControllerOptions<T>`.
 *
 * @category interactive
 */
export interface CngxTreeConfig {
  /**
   * Fallback for `nodeIdFn` when a caller omits it. With a config
   * default set, `CngxTreeControllerOptions.nodeIdFn` becomes
   * effectively optional — the factory throws in dev mode only when
   * neither place provides a function.
   */
  readonly defaultNodeIdFn?: (value: unknown, path: readonly number[]) => string;
  /** Fallback for `labelFn`. Library default is `String(value)`. */
  readonly defaultLabelFn?: (value: unknown) => string;
  /** Fallback for `keyFn`. Library default is identity. */
  readonly defaultKeyFn?: (value: unknown) => unknown;
  /**
   * Bound the `isExpanded(id)` signal cache. Default: unlimited —
   * keeps the stable-identity guarantee (`isExpanded(v) === isExpanded(v)`
   * always holds for the lifetime of the controller). When set, the
   * cache FIFO-evicts its oldest entry as soon as the size exceeds
   * `cacheLimit`; a re-queried id then receives a NEW signal instance
   * (values are equivalent, references differ). Set this only at
   * grid/tree scale (100k+ nodes) where memory retention matters
   * more than reference stability.
   */
  readonly cacheLimit?: number;
  /** Fallback for `initiallyExpanded`. */
  readonly defaultInitiallyExpanded?: 'all' | 'none' | readonly string[];
}

/**
 * DI token carrying the merged {@link CngxTreeConfig}. Defaults to an
 * empty object so consumers who never call {@link provideTreeConfig}
 * see library-default behaviour unchanged.
 *
 * @category interactive
 */
export const CNGX_TREE_CONFIG = new InjectionToken<CngxTreeConfig>('CngxTreeConfig', {
  providedIn: 'root',
  factory: (): CngxTreeConfig => ({}),
});

/**
 * Feature returned by a `with*` function — merged by
 * {@link provideTreeConfig}.
 *
 * @category interactive
 */
export interface CngxTreeConfigFeature {
  readonly config: Partial<CngxTreeConfig>;
}

function feature(mix: Partial<CngxTreeConfig>): CngxTreeConfigFeature {
  return { config: mix };
}

/**
 * App-wide default `nodeIdFn`. Per-controller options still override.
 * Use this to enforce a domain id convention across the whole app
 * (e.g. `(v) => (v as { uuid: string }).uuid`) without repeating it
 * at every call site.
 *
 * @category interactive
 */
export function withDefaultNodeIdFn<T>(
  fn: (value: T, path: readonly number[]) => string,
): CngxTreeConfigFeature {
  return feature({
    defaultNodeIdFn: fn as (value: unknown, path: readonly number[]) => string,
  });
}

/**
 * App-wide default `labelFn`. Library default is `String(value)`.
 *
 * @category interactive
 */
export function withDefaultLabelFn<T>(fn: (value: T) => string): CngxTreeConfigFeature {
  return feature({ defaultLabelFn: fn as (value: unknown) => string });
}

/**
 * App-wide default `keyFn`. Library default is identity.
 *
 * @category interactive
 */
export function withDefaultKeyFn<T>(fn: (value: T) => unknown): CngxTreeConfigFeature {
  return feature({ defaultKeyFn: fn as (value: unknown) => unknown });
}

/**
 * Bound the `isExpanded(id)` signal cache. See
 * {@link CngxTreeConfig.cacheLimit} for the trade-off.
 *
 * @category interactive
 */
export function withTreeCacheLimit(limit: number): CngxTreeConfigFeature {
  return feature({ cacheLimit: limit });
}

/**
 * App-wide default `initiallyExpanded` seed.
 *
 * @category interactive
 */
export function withDefaultInitiallyExpanded(
  mode: 'all' | 'none' | readonly string[],
): CngxTreeConfigFeature {
  return feature({ defaultInitiallyExpanded: mode });
}

/**
 * Register an app-wide {@link CngxTreeConfig} composed from `with*`
 * features.
 *
 * @example
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [
 *     provideTreeConfig(
 *       withDefaultNodeIdFn<MyDomain>((v) => v.uuid),
 *       withDefaultKeyFn<MyDomain>((v) => v.uuid),
 *       withTreeCacheLimit(5000),
 *     ),
 *   ],
 * });
 * ```
 *
 * @category interactive
 */
export function provideTreeConfig(...features: CngxTreeConfigFeature[]): Provider[] {
  const merged = features.reduce<CngxTreeConfig>(
    (acc, f) => ({ ...acc, ...f.config }),
    {},
  );
  return [{ provide: CNGX_TREE_CONFIG, useValue: merged }];
}

/**
 * Sub-tree / component-scoped variant — use in `viewProviders` so the
 * tree config only applies to descendants of this component.
 *
 * @category interactive
 */
export function provideTreeConfigAt(
  ...features: CngxTreeConfigFeature[]
): Provider[] {
  return provideTreeConfig(...features);
}

/**
 * Inject the currently-resolved config. Safe to call in any injection
 * context; returns `{}` if no `provideTreeConfig` is registered.
 *
 * @category interactive
 */
export function injectTreeConfig(): CngxTreeConfig {
  return inject(CNGX_TREE_CONFIG);
}
