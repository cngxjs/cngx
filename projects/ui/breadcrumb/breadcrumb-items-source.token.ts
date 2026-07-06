import { InjectionToken, type Signal } from '@angular/core';

import type { CngxBreadcrumbCrumb } from './breadcrumb.types';

/**
 * Contract an external crumb producer provides so {@link CngxBreadcrumbBar}
 * reads its trail from a signal instead of the `[items]` input. The bar picks
 * the source up through {@link CNGX_BREADCRUMB_ITEMS_SOURCE} and a `computed`
 * that lets the source win over the input - the controlled path of the
 * controlled/uncontrolled pattern (Pillar 1: no effect writes, no directive
 * writing another component's `input()`).
 *
 * The router-sync directive is the reference consumer; any producer that can
 * expose a `Signal<readonly CngxBreadcrumbCrumb[]>` may provide it.
 */
export interface CngxBreadcrumbItemsSource {
  /** The trail the bar renders when this source is provided. */
  readonly crumbs: Signal<readonly CngxBreadcrumbCrumb[]>;
}

/**
 * DI seam a crumb producer (e.g. the router-sync directive) provides via
 * `useExisting` to feed {@link CngxBreadcrumbBar} without writing its
 * `[items]` input.
 *
 * @category ui/breadcrumb
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/breadcrumb/breadcrumb-items-source.token.ts
 * @since 0.1.0
 * @relatedTo CngxBreadcrumbBar, CngxBreadcrumbItemsSource
 */
export const CNGX_BREADCRUMB_ITEMS_SOURCE = new InjectionToken<CngxBreadcrumbItemsSource>(
  'CNGX_BREADCRUMB_ITEMS_SOURCE',
);
