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
export function warnTabsRouterAbsent(directive: string, enables: string): void {
  console.warn(
    `${directive}: no Router available - directive is a no-op. ` +
      `Provide @angular/router via provideRouter(...) to enable ${enables}.`,
  );
}
