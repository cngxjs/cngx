import { cngxDevWarn } from '@cngx/utils';

/**
 * Single dev-warning both tab sync directives emit when `@angular/router`
 * is not provided. Shared so the message stays identical across
 * {@link CngxTabsFragmentSync} (deep-linking) and {@link CngxTabsRouteSync}
 * (router-outlet); only the `enables` clause differs. The URL readers
 * themselves stay separate - they target different surfaces (fragment /
 * query-param vs route path) and must not converge.
 *
 * @internal
 */
export function warnTabsRouterAbsent(selector: string, enables: string): void {
  if (!(typeof ngDevMode !== 'undefined' && ngDevMode)) {
    return;
  }
  cngxDevWarn(
    'CNGX1031',
    `[${selector}] no Router available - the URL sync is a no-op. ` +
      `Provide @angular/router via provideRouter(...) to enable ${enables}.`,
  );
}
