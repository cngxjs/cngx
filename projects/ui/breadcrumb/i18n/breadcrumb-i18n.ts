import { computed, inject, InjectionToken, type Signal } from '@angular/core';

import { createSectionBundle, injectLanguageSection } from '@cngx/core/i18n';
import { createOverrideMerge } from '@cngx/core/utils';
import { recordEqual } from '@cngx/utils';

import type { CngxBreadcrumbAriaLabels } from '../config/breadcrumb.config';
import {
  CNGX_BREADCRUMB_LANGUAGE_EN,
  type CngxBreadcrumbLanguageSection,
} from './breadcrumb-language-section';

/**
 * A route's breadcrumb data: a plain label, or a key into the `routes` record
 * of the breadcrumb language section with the label shown when the active pack
 * has no entry for the key.
 *
 * ```ts
 * { path: 'orders', data: { breadcrumb: { key: 'orders', label: 'Orders' } } }
 * ```
 *
 * @category ui/breadcrumb
 * @since 0.1.0
 * @relatedTo CngxBreadcrumbRouterSync, CngxBreadcrumbSiblingsRouterSync
 */
export type CngxBreadcrumbRouteLabel = string | { readonly key: string; readonly label: string };

/**
 * The text of a route's breadcrumb data, or `undefined` when it carries none:
 * a plain string as is, a keyed label through `routes`, else its `label`. The
 * key itself is never shown.
 *
 * @internal
 */
export function routeLabelText(
  raw: unknown,
  routes: Readonly<Record<string, string>>,
): string | undefined {
  if (typeof raw === 'string') {
    return raw.length > 0 ? raw : undefined;
  }
  if (typeof raw !== 'object' || raw === null) {
    return undefined;
  }
  const { key, label } = raw as { key?: unknown; label?: unknown };
  const translated = typeof key === 'string' ? routes[key] : undefined;
  const text = translated ?? label;
  return typeof text === 'string' && text.length > 0 ? text : undefined;
}

/** @internal The breadcrumb copy of one section, in the config shape. */
export interface CngxBreadcrumbCopy {
  readonly ariaLabels: Required<CngxBreadcrumbAriaLabels>;
  readonly routes: Readonly<Record<string, string>>;
}

/** @internal Turns a breadcrumb section into the config copy. Pure. */
export function breadcrumbCopyFrom(section: CngxBreadcrumbLanguageSection): CngxBreadcrumbCopy {
  return {
    ariaLabels: {
      bar: section.bar,
      overflowTrigger: section.overflowTrigger,
      overflowMenu: section.overflowMenu,
      siblingsTrigger: section.siblingsTrigger,
      siblingsMenu: section.siblingsMenu,
    },
    routes: section.routes,
  };
}

const NO_SECTION: Partial<CngxBreadcrumbLanguageSection> = {};

/** @internal The breadcrumb section of the active pack over the English section. */
function injectBreadcrumbLanguage(): Signal<CngxBreadcrumbLanguageSection> {
  const pack = injectLanguageSection('breadcrumb');
  return createOverrideMerge(
    CNGX_BREADCRUMB_LANGUAGE_EN,
    computed(() => pack() ?? NO_SECTION),
  );
}

/** @internal Builds and reads the section copy. */
const breadcrumbBundle = createSectionBundle<CngxBreadcrumbLanguageSection, CngxBreadcrumbCopy>({
  section: injectBreadcrumbLanguage,
  toBundle: breadcrumbCopyFrom,
});

/**
 * @internal The breadcrumb copy of the active pack. Private: consumers override
 * the names through `withBreadcrumbAriaLabels`, the route labels through the
 * pack.
 */
const BREADCRUMB_SECTION_COPY = new InjectionToken<Signal<CngxBreadcrumbCopy>>(
  'CngxBreadcrumbSectionCopy',
  { providedIn: 'root', factory: () => breadcrumbBundle.build() },
);

interface SiteDefaults {
  readonly ariaLabels: Signal<Required<CngxBreadcrumbAriaLabels>>;
  readonly routes: Signal<Readonly<Record<string, string>>>;
}

const SITES = new WeakMap<Signal<CngxBreadcrumbCopy>, SiteDefaults>();

/**
 * @internal The breadcrumb copy at the reading site, each part its own
 * signal. Memoized per copy signal. Injection context required.
 */
export function injectBreadcrumbSiteCopy(): SiteDefaults {
  const copy = breadcrumbBundle.resolve(inject(BREADCRUMB_SECTION_COPY));
  let site = SITES.get(copy);
  if (!site) {
    site = {
      ariaLabels: computed(() => copy().ariaLabels, { equal: recordEqual }),
      routes: computed(() => copy().routes),
    };
    SITES.set(copy, site);
  }
  return site;
}
