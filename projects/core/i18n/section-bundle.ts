import { computed, inject, type Signal } from '@angular/core';
import { injectLocale } from '@cngx/core/utils';

import { CNGX_LANGUAGE_PACK } from './provide-i18n';

/**
 * Options of {@link createSectionBundle}.
 *
 * @category core/i18n
 * @since 0.1.0
 */
export interface CngxSectionBundleOptions<S extends object, B extends object> {
  /**
   * The area's section, merged over its English section. Called in an
   * injection context, at most once per active language pack.
   */
  readonly section: () => Signal<S>;
  /** Maps a section to the token's keys for one locale. Must be pure. */
  readonly toBundle: (section: S, locale: string) => B;
}

/**
 * The three places an area's i18n token is built and read, all derived from
 * one section and one mapper.
 *
 * @category core/i18n
 * @since 0.1.0
 */
export interface CngxSectionBundle<B extends object> {
  /**
   * The token value: the section formatted for the locale of the injector
   * that builds it, with each feature applied on top. Use it as the token
   * `factory` (no features) and in the area's `provide*I18n(...features)`.
   */
  readonly build: (features?: readonly ((bundle: Signal<B>) => Signal<B>)[]) => Signal<B>;
  /**
   * Reads the token for the use site: every key the features left at its
   * default follows the use site's section and locale (a `provideLocaleAt`
   * subtree, a route-level pack); every key a feature set stays as set. A
   * token value supplied without {@link CngxSectionBundle.build} is returned
   * as is.
   */
  readonly resolve: (bundle: Signal<B>) => Signal<B>;
}

/** Token values built by `build`, mapped to the default bundle they started from. */
const DEFAULTS_OF = new WeakMap<Signal<object>, Signal<object>>();

function isRecord(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' && value !== null && Object.getPrototypeOf(value) === Object.prototype
  );
}

/**
 * Keys of `own` that still hold the default from `root` take the use-site
 * default from `site`; a key a feature replaced stays. One level into plain
 * records, so a nested label the consumer did not set follows too.
 */
function overlay<B extends object>(own: B, root: B, site: B): B {
  const ownRecord = own as Record<string, unknown>;
  const rootRecord = root as Record<string, unknown>;
  const siteRecord = site as Record<string, unknown>;
  const out: Record<string, unknown> = { ...ownRecord };
  for (const key of Object.keys(siteRecord)) {
    const value = ownRecord[key];
    const rootValue = rootRecord[key];
    if (value === undefined || Object.is(value, rootValue)) {
      out[key] = siteRecord[key];
      continue;
    }
    const siteValue = siteRecord[key];
    if (isRecord(value) && isRecord(rootValue) && isRecord(siteValue)) {
      out[key] = overlay(value, rootValue, siteValue);
    }
  }
  return out as B;
}

/**
 * Builds an area's i18n token from its language section, so the copy, the
 * plural forms and every formatted number follow the locale of the place
 * that reads them.
 *
 * Bundles are memoized by section object and locale: the same inputs give
 * the identical bundle object, so readers compare by reference and a pack
 * switch that leaves the section equal changes nothing downstream.
 *
 * ```ts
 * const bundle = createSectionBundle({ section: injectCardLanguage, toBundle: cardBundleFrom });
 * export const CNGX_CARD_I18N = new InjectionToken('CngxCardI18n', {
 *   providedIn: 'root',
 *   factory: () => bundle.build(),
 * });
 * export const injectCardI18n = () => bundle.resolve(inject(CNGX_CARD_I18N));
 * ```
 *
 * @category core/i18n
 * @since 0.1.0
 * @relatedTo injectLanguageSection, formatMessage
 */
export function createSectionBundle<S extends object, B extends object>(
  options: CngxSectionBundleOptions<S, B>,
): CngxSectionBundle<B> {
  const bundles = new WeakMap<S, Map<string, B>>();
  const sections = new WeakMap<Signal<unknown>, Signal<S>>();
  const resolved = new WeakMap<Signal<B>, WeakMap<Signal<S>, WeakMap<Signal<string>, Signal<B>>>>();
  const overlays = new WeakMap<B, WeakMap<B, WeakMap<B, B>>>();

  const bundleFor = (section: S, locale: string): B => {
    let byLocale = bundles.get(section);
    if (!byLocale) {
      byLocale = new Map();
      bundles.set(section, byLocale);
    }
    let bundle = byLocale.get(locale);
    if (!bundle) {
      bundle = options.toBundle(section, locale);
      byLocale.set(locale, bundle);
    }
    return bundle;
  };

  const sectionHere = (): Signal<S> => {
    const pack = inject(CNGX_LANGUAGE_PACK);
    let section = sections.get(pack);
    if (!section) {
      section = options.section();
      sections.set(pack, section);
    }
    return section;
  };

  const overlayFor = (own: B, root: B, site: B): B => {
    let byRoot = overlays.get(own);
    if (!byRoot) {
      byRoot = new WeakMap();
      overlays.set(own, byRoot);
    }
    let bySite = byRoot.get(root);
    if (!bySite) {
      bySite = new WeakMap();
      byRoot.set(root, bySite);
    }
    let result = bySite.get(site);
    if (!result) {
      result = overlay(own, root, site);
      bySite.set(site, result);
    }
    return result;
  };

  const build: CngxSectionBundle<B>['build'] = (features = []) => {
    const section = sectionHere();
    const locale = injectLocale();
    const defaults = computed(() => bundleFor(section(), locale()));
    const bundle = features.reduce<Signal<B>>((current, feature) => feature(current), defaults);
    DEFAULTS_OF.set(bundle, defaults);
    return bundle;
  };

  const resolve: CngxSectionBundle<B>['resolve'] = (bundle) => {
    const defaults = DEFAULTS_OF.get(bundle) as Signal<B> | undefined;
    if (!defaults) {
      return bundle;
    }
    const section = sectionHere();
    const locale = injectLocale();
    let bySection = resolved.get(bundle);
    if (!bySection) {
      bySection = new WeakMap();
      resolved.set(bundle, bySection);
    }
    let byLocale = bySection.get(section);
    if (!byLocale) {
      byLocale = new WeakMap();
      bySection.set(section, byLocale);
    }
    let result = byLocale.get(locale);
    if (!result) {
      result = computed(() => {
        const own = bundle();
        const root = defaults();
        const site = bundleFor(section(), locale());
        return site === root ? own : overlayFor(own, root, site);
      });
      byLocale.set(locale, result);
    }
    return result;
  };

  return { build, resolve };
}
