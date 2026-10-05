import { computed, type Signal } from '@angular/core';

import { coerceSignal, createOverrideMerge } from '@cngx/core/utils';
import { recordEqual } from '@cngx/utils';

import {
  injectSelectCopy,
  type CngxResolvedSelectAriaLabels,
  type CngxSelectAnnounceFormat,
  type CngxSelectCopy,
} from '../../i18n/select-i18n';
import {
  CNGX_SELECT_DEFAULTS,
  type CngxSelectAnnouncerConfig,
  type CngxSelectConfig,
  type CngxSelectFallbackLabels,
} from '../config';

export type { CngxResolvedSelectAriaLabels } from '../../i18n/select-i18n';

/** Announcer config with the library defaults applied. @internal */
export type CngxResolvedSelectAnnouncer = Required<Omit<CngxSelectAnnouncerConfig, 'format'>> & {
  readonly format: CngxSelectAnnounceFormat;
};

/**
 * The select-family copy of one config, each key a `Signal` over the active
 * language pack's select section at the reading site's locale. Read it inside
 * a `computed()`, a template or a handler - never at construction - so a
 * language flip reaches every reader.
 *
 * @internal
 */
export interface CngxResolvedSelectLabels {
  readonly ariaLabels: Signal<CngxResolvedSelectAriaLabels>;
  readonly fallbackLabels: Signal<Required<CngxSelectFallbackLabels>>;
  readonly announcer: Signal<CngxResolvedSelectAnnouncer>;
}

const MAPPED = new WeakMap<object, WeakMap<object, Signal<object>>>();

/**
 * The override source passed through `map`, memoized per (map, source) so the
 * merge below sees one stable override signal per config object.
 */
function mappedOverrides<T extends object>(source: T | Signal<T>, map: (value: T) => T): Signal<T> {
  const key: object = map;
  let byMap = MAPPED.get(key);
  if (!byMap) {
    byMap = new WeakMap();
    MAPPED.set(key, byMap);
  }
  let mapped = byMap.get(source) as Signal<T> | undefined;
  if (!mapped) {
    const overrides = coerceSignal(source);
    mapped = computed(() => map(overrides()));
    byMap.set(source, mapped);
  }
  return mapped;
}

/**
 * Drops every key the override sets to `null` or `undefined`, so a defaulted
 * key falls back to its default and readers need no literal of their own.
 */
function withoutNullish<T extends object>(record: T): T {
  return Object.fromEntries(Object.entries(record).filter(([, value]) => value != null)) as T;
}

/** Drops a nullish `format`, so the announcer keeps the section formatter. */
function withoutNullishFormat<T extends object>(config: T): T {
  return Object.fromEntries(
    Object.entries(config).filter(([name, value]) => name !== 'format' || value != null),
  ) as T;
}

/** The config copy merged over the site defaults, after `map`. */
function mergeOver<T extends object>(
  defaults: Signal<T>,
  source: Partial<T> | Signal<Partial<T>> | undefined,
  map: (value: Partial<T>) => Partial<T>,
): Signal<T> {
  return createOverrideMerge<T>(defaults, source && mappedOverrides(source, map));
}

interface SiteDefaults {
  readonly ariaLabels: Signal<CngxResolvedSelectAriaLabels>;
  readonly fallbackLabels: Signal<Required<CngxSelectFallbackLabels>>;
  readonly announcer: Signal<CngxResolvedSelectAnnouncer>;
}

const SITES = new WeakMap<Signal<CngxSelectCopy>, SiteDefaults>();

/** The copy keys of one site copy signal, each its own signal. Memoized per copy signal. */
function siteDefaults(copy: Signal<CngxSelectCopy>): SiteDefaults {
  let site = SITES.get(copy);
  if (!site) {
    site = {
      ariaLabels: computed(() => copy().ariaLabels),
      fallbackLabels: computed(() => copy().fallbackLabels),
      announcer: computed(
        () => ({ ...CNGX_SELECT_DEFAULTS.announcer, format: copy().announceFormat }),
        { equal: recordEqual },
      ),
    };
    SITES.set(copy, site);
  }
  return site;
}

/**
 * Resolves the copy keys of a select config lazily, at the reading site. The
 * defaults are the active pack's select section (English by default) formatted
 * for the reader's locale; `ariaLabels` and `fallbackLabels` spread the config
 * over them, a defaulted key the config sets to `undefined` keeping its
 * default, and the announcer spreads too, a missing `format` keeping the
 * section formatter. Every result is memoized per config source and site, so
 * every select under one injector shares the same signals. Injection context
 * required.
 *
 * @internal
 */
export function resolveSelectLabels(user: CngxSelectConfig): CngxResolvedSelectLabels {
  const site = siteDefaults(injectSelectCopy());
  return {
    ariaLabels: mergeOver(site.ariaLabels, user.ariaLabels, withoutNullish),
    fallbackLabels: mergeOver(site.fallbackLabels, user.fallbackLabels, withoutNullish),
    announcer: mergeOver(site.announcer, user.announcer, withoutNullishFormat),
  };
}
