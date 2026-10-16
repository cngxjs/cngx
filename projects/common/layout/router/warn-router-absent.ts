import { cngxDevWarn } from '@cngx/utils';

/**
 * Dev-warning the query-param sync kernel emits when `@angular/router` is
 * not provided. Mirrors {@link warnTabsRouterAbsent} in `@cngx/common/tabs`
 * so the message stays identical across the two sync surfaces; only the
 * `enables` clause differs. A deliberate small copy rather than a shared
 * import - sharing would force the helper onto a `public-api.ts`, and
 * `warn*` matches no approved public-API prefix.
 *
 * @internal
 */
export function warnRouterAbsent(enables: string): void {
  if (!(typeof ngDevMode !== 'undefined' && ngDevMode)) {
    return;
  }
  cngxDevWarn(
    'CNGX1031',
    `injectQueryParamSync(): no Router available - the URL sync is a no-op. ` +
      `Provide @angular/router via provideRouter(...) to enable ${enables}.`,
  );
}
