import { computed, inject, InjectionToken, isSignal, type Signal } from '@angular/core';

import { injectLanguageSection } from '@cngx/core/i18n';
import { createOverrideMerge } from '@cngx/core/utils';

import {
  CNGX_BREADCRUMB_LANGUAGE_EN,
  type CngxBreadcrumbLanguageSection,
} from './breadcrumb-language-section';

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

const NO_SECTION: Partial<CngxBreadcrumbLanguageSection> = {};

/** @internal The breadcrumb section of the active pack over the English section. */
function breadcrumbSectionFromPack(): Signal<CngxBreadcrumbLanguageSection> {
  const pack = injectLanguageSection('breadcrumb');
  return createOverrideMerge(
    CNGX_BREADCRUMB_LANGUAGE_EN,
    computed(() => pack() ?? NO_SECTION),
  );
}

/**
 * @internal The breadcrumb section of the active pack. Private: consumers
 * override the names through `withBreadcrumbAriaLabels`.
 */
const BREADCRUMB_SECTION = new InjectionToken<Signal<CngxBreadcrumbLanguageSection>>(
  'CngxBreadcrumbSection',
  { providedIn: 'root', factory: breadcrumbSectionFromPack },
);

/** @internal The breadcrumb section at the reading site. Injection context required. */
export function injectBreadcrumbSiteCopy(): Signal<CngxBreadcrumbLanguageSection> {
  return inject(BREADCRUMB_SECTION);
}
