/**
 * Dev-warning the query-param sync kernel emits when `@angular/router` is
 * not provided. Mirrors {@link warnTabsRouterAbsent} in `@cngx/common/tabs`
 * so the message stays identical across the two sync surfaces; only the
 * `enables` clause differs. A deliberate small copy rather than a shared
 * import - sharing would force the helper onto a `public-api.ts`, and `warn*`
 * matches no approved public-API prefix.
 *
 * @internal
 */
export function warnRouterAbsent(directive: string, enables: string): void {
  console.warn(
    `${directive}: no Router available - directive is a no-op. ` +
      `Provide @angular/router via provideRouter(...) to enable ${enables}.`,
  );
}
