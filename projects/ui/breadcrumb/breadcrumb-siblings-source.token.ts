import { InjectionToken, type Signal } from '@angular/core';

import type { CngxBreadcrumbSibling } from './breadcrumb.types';

/**
 * Contract an external sibling producer provides so {@link CngxBreadcrumbSiblings}
 * reads its rows from a signal instead of the `[siblings]` input. The dropdown
 * picks the source up through {@link CNGX_BREADCRUMB_SIBLINGS_SOURCE} and a
 * `computed` that lets the source win over the input - the controlled path of
 * the controlled/uncontrolled pattern (Pillar 1: no effect writes, no directive
 * writing another component's `input()`).
 *
 * A producer such as the planned router-sync directive will provide this via
 * `useExisting`; any producer exposing a `Signal<readonly CngxBreadcrumbSibling[]>`
 * may provide it.
 */
export interface CngxBreadcrumbSiblingsSource {
  /** The siblings the dropdown renders when this source is provided. */
  readonly siblings: Signal<readonly CngxBreadcrumbSibling[]>;
}

/**
 * DI seam a sibling producer (e.g. the router-sync directive) provides via
 * `useExisting` to feed {@link CngxBreadcrumbSiblings} without writing its
 * `[siblings]` input.
 *
 * @category ui/breadcrumb
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/breadcrumb/breadcrumb-siblings-source.token.ts
 * @since 0.1.0
 * @relatedTo CngxBreadcrumbSiblings, CngxBreadcrumbSiblingsSource
 */
export const CNGX_BREADCRUMB_SIBLINGS_SOURCE = new InjectionToken<CngxBreadcrumbSiblingsSource>(
  'CNGX_BREADCRUMB_SIBLINGS_SOURCE',
);
