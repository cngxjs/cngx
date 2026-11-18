import {
  booleanAttribute,
  Directive,
  inject,
  InjectionToken,
  input,
  type Signal,
} from '@angular/core';

/** What the paginator segments read to decide whether their buttons ripple. */
export interface CngxPaginatorRippleState {
  /** `true` while the ripple is switched on. */
  readonly enabled: Signal<boolean>;
}

/**
 * Ripple switch the paginator segments inject. Provided by
 * {@link CngxPaginatorRipple}; without it no segment ripples.
 */
export const CNGX_PAGINATOR_RIPPLE = new InjectionToken<CngxPaginatorRippleState>(
  'CNGX_PAGINATOR_RIPPLE',
);

/**
 * Opts the paginator buttons into the `cngxRipple` wave. The paginator ships
 * without one, like every cngx button. Put the attribute on `<cngx-paginator>`
 * or any ancestor, and the first / previous / next / last and load-more
 * buttons below it ripple. Bind `false` to switch it off again for a subtree.
 * The wave stays off under `prefers-reduced-motion: reduce`.
 *
 * ```html
 * <cngx-paginator cngxPaginatorRipple [state]="state">
 *   <cngx-pgn-prev />
 *   <cngx-pgn-pages />
 *   <cngx-pgn-next />
 * </cngx-paginator>
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/paginator/paginator-ripple.directive.ts
 * @since 0.3.0
 * @relatedTo CngxPaginator, CngxRipple
 * @axis level atom
 */
@Directive({
  selector: '[cngxPaginatorRipple]',
  standalone: true,
  exportAs: 'cngxPaginatorRipple',
  providers: [{ provide: CNGX_PAGINATOR_RIPPLE, useExisting: CngxPaginatorRipple }],
})
export class CngxPaginatorRipple implements CngxPaginatorRippleState {
  /** Ripple on or off for every paginator button below this element. */
  readonly enabled = input(true, { alias: 'cngxPaginatorRipple', transform: booleanAttribute });
}

/**
 * Reads the nearest {@link CngxPaginatorRipple}. Returns `true` only when one
 * is present and switched on.
 *
 * @internal
 */
export function injectPaginatorRippleEnabled(): () => boolean {
  const state = inject(CNGX_PAGINATOR_RIPPLE, { optional: true });
  return () => state?.enabled() ?? false;
}
