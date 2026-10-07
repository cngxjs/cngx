import { computed, type Signal } from '@angular/core';

import { createFilledOverrideMerge } from '@cngx/core/utils';
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
 * over them, a defaulted key the config sets to `null` or `undefined` keeping
 * its default, and the announcer spreads the same way, a missing `format`
 * keeping the section formatter. Every result is memoized per config source and site, so
 * every select under one injector shares the same signals. Injection context
 * required.
 *
 * @internal
 */
export function resolveSelectLabels(user: CngxSelectConfig): CngxResolvedSelectLabels {
  const site = siteDefaults(injectSelectCopy());
  return {
    ariaLabels: createFilledOverrideMerge(site.ariaLabels, user.ariaLabels),
    fallbackLabels: createFilledOverrideMerge(site.fallbackLabels, user.fallbackLabels),
    announcer: createFilledOverrideMerge(site.announcer, user.announcer),
  };
}
