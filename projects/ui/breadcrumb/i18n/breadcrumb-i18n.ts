import { isSignal, type Signal } from '@angular/core';

import { createLanguageSection } from '@cngx/core/i18n';

import { CNGX_BREADCRUMB_LANGUAGE_EN } from './breadcrumb-language-section';

/**
 * A route's breadcrumb data: a plain label, or a `Signal` of one so the crumb
 * follows the app's own translation on a language switch. Route labels are
 * app copy; translate them with the app's i18n, not the cngx language pack.
 *
 * ```ts
 * { path: 'orders', data: { breadcrumb: computed(() => t('nav.orders')) } }
 * ```
 *
 * @category ui/breadcrumb
 * @since 0.1.0
 * @relatedTo CngxBreadcrumbRouterSync, CngxBreadcrumbSiblingsRouterSync
 */
export type CngxBreadcrumbRouteLabel = string | Signal<string>;

/**
 * The text of a route's breadcrumb data, or `undefined` when it carries none.
 * A `Signal` is read, so a caller inside a `computed()` tracks it.
 *
 * @internal
 */
export function routeLabelText(raw: unknown): string | undefined {
  const text: unknown = isSignal(raw) ? raw() : raw;
  return typeof text === 'string' && text.length > 0 ? text : undefined;
}

/**
 * @internal The breadcrumb section of the active pack over the English section,
 * shared app-wide. Consumers override copy through `withBreadcrumbAriaLabels`.
 */
export const injectBreadcrumbSiteCopy = createLanguageSection(
  'breadcrumb',
  CNGX_BREADCRUMB_LANGUAGE_EN,
);
