import { inject, Injector, type ProviderToken } from '@angular/core';

/**
 * Resolves a directive on the same host on first read instead of at
 * construction. A menu button's host directives are created before the
 * component, and `CngxMenuTrigger` injects the `CNGX_HOST_INTERACTION_STATE`
 * the component provides; an eager `inject` of a host directive from the
 * component would close that loop into a cycle.
 *
 * Call it in an injection context; the returned getter may be called later.
 *
 * @internal
 */
export function injectLazyHostDirective<T>(token: ProviderToken<T>): () => T {
  const injector = inject(Injector);
  let ref: T | undefined;
  return () => (ref ??= injector.get(token, undefined, { self: true }));
}
