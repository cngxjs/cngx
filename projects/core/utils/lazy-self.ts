import { inject, Injector, type ProviderToken } from '@angular/core';

const UNRESOLVED: unique symbol = Symbol('UNRESOLVED');

/**
 * Options of {@link injectLazySelf}.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/core/utils/lazy-self.ts
 * @since 0.1.0
 */
export interface CngxLazySelfOptions {
  /** `true` resolves an absent token to `null` instead of throwing. */
  readonly optional: true;
}

/**
 * Returns a getter that resolves `token` on the same element on its first
 * call, not at construction, and caches the result, `null` included.
 *
 * Reach for it when two units on one element read each other: a host
 * component that provides `CNGX_HOST_INTERACTION_STATE` to a co-hosted
 * `cngxAsyncClick` and reads `CNGX_ASYNC_RUN_STATE` back from it cannot
 * inject eagerly in either direction without a cycle (NG0200). The lookup
 * is `{ self: true }`, so a provider on an ancestor never answers.
 *
 * A required lookup throws like `injector.get` when the token is absent and
 * is retried on the next call. An optional lookup caches `null` behind a
 * module-level sentinel, so an absent token costs one lookup, not one per
 * read (a `??=` on `null` re-queries every time).
 *
 * Call it in an injection context; call the getter from a `computed()`, a
 * handler or a later lifecycle hook.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/core/utils/lazy-self.ts
 * @since 0.1.0
 */
export function injectLazySelf<T>(token: ProviderToken<T>): () => T;
/**
 * Optional overload: the getter returns `null` for an absent token and looks it up only once.
 */
export function injectLazySelf<T>(
  token: ProviderToken<T>,
  options: CngxLazySelfOptions,
): () => T | null;
/**
 * Shared implementation of both overloads: a required lookup throws while the token is absent, an optional one caches `null`.
 */
export function injectLazySelf<T>(
  token: ProviderToken<T>,
  options?: CngxLazySelfOptions,
): () => T | null {
  const injector = inject(Injector);
  const optional = options?.optional === true;
  let cached: T | null | typeof UNRESOLVED = UNRESOLVED;
  return () => {
    if (cached !== UNRESOLVED) {
      return cached;
    }
    cached = optional
      ? injector.get(token, null, { self: true, optional: true })
      : injector.get(token, undefined, { self: true });
    return cached;
  };
}
