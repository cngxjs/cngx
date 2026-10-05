import { computed, type Signal } from '@angular/core';

import { coerceSignal } from '@cngx/core/utils';
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

const NO_OVERRIDES: object = {};

const FILLS = new WeakMap<Signal<object>, WeakMap<object, Signal<object>>>();

/**
 * The override spread over the defaults; a defaulted key the override sets to
 * `undefined` falls back to its default, so readers need no literal of their
 * own. Memoized per (defaults signal, override source); keeps its reference
 * while the result is key-wise equal.
 */
function fillOver<T extends object>(
  defaults: Signal<T>,
  overrides: Partial<T> | Signal<Partial<T>> | undefined,
): Signal<T> {
  let byOverrides = FILLS.get(defaults);
  if (!byOverrides) {
    byOverrides = new WeakMap();
    FILLS.set(defaults, byOverrides);
  }
  const key: object = overrides ?? NO_OVERRIDES;
  const cached = byOverrides.get(key) as Signal<T> | undefined;
  if (cached) {
    return cached;
  }
  const user = coerceSignal<Partial<T>>(overrides ?? {});
  const filled = computed<T>(
    () => {
      const base = defaults();
      const value = { ...base, ...user() } as T;
      for (const name of Object.keys(base) as (keyof T)[]) {
        value[name] ??= base[name];
      }
      return value;
    },
    { equal: recordEqual },
  );
  byOverrides.set(key, filled);
  return filled;
}

interface SiteDefaults {
  readonly ariaLabels: Signal<CngxResolvedSelectAriaLabels>;
  readonly fallbackLabels: Signal<Required<CngxSelectFallbackLabels>>;
  readonly announcer: Signal<CngxResolvedSelectAnnouncer>;
}

const SITES = new WeakMap<Signal<CngxSelectCopy>, SiteDefaults>();

function siteDefaults(copy: Signal<CngxSelectCopy>): SiteDefaults {
  let site = SITES.get(copy);
  if (!site) {
    site = {
      ariaLabels: computed(() => copy().ariaLabels),
      fallbackLabels: computed(() => copy().fallbackLabels),
      announcer: computed(
        () => ({ ...CNGX_SELECT_DEFAULTS.announcer, format: copy().announceFormat }),
        {
          equal: recordEqual,
        },
      ),
    };
    SITES.set(copy, site);
  }
  return site;
}

const ANNOUNCERS = new WeakMap<
  Signal<CngxResolvedSelectAnnouncer>,
  WeakMap<object, Signal<CngxResolvedSelectAnnouncer>>
>();

/**
 * Resolves the copy keys of a select config lazily, at the reading site. The
 * defaults are the active pack's select section (English by default) formatted
 * for the reader's locale; `ariaLabels` and `fallbackLabels` spread the config
 * over them, and the announcer spreads too, a missing `format` keeping the
 * section formatter. Every result is memoized per config source and site, so
 * every select under one injector shares the same signals. Injection context
 * required.
 *
 * @internal
 */
export function resolveSelectLabels(user: CngxSelectConfig): CngxResolvedSelectLabels {
  const site = siteDefaults(injectSelectCopy());
  return {
    ariaLabels: fillOver<CngxResolvedSelectAriaLabels>(site.ariaLabels, user.ariaLabels),
    fallbackLabels: fillOver<Required<CngxSelectFallbackLabels>>(
      site.fallbackLabels,
      user.fallbackLabels,
    ),
    announcer: resolveAnnouncer(site.announcer, user.announcer),
  };
}

function resolveAnnouncer(
  defaults: Signal<CngxResolvedSelectAnnouncer>,
  source: CngxSelectConfig['announcer'],
): Signal<CngxResolvedSelectAnnouncer> {
  if (!source) {
    return defaults;
  }
  let bySource = ANNOUNCERS.get(defaults);
  if (!bySource) {
    bySource = new WeakMap();
    ANNOUNCERS.set(defaults, bySource);
  }
  const cached = bySource.get(source);
  if (cached) {
    return cached;
  }
  const user = coerceSignal(source);
  const resolved = computed<CngxResolvedSelectAnnouncer>(
    () => {
      const base = defaults();
      const config = user();
      return { ...base, ...config, format: config.format ?? base.format };
    },
    { equal: recordEqual },
  );
  bySource.set(source, resolved);
  return resolved;
}
