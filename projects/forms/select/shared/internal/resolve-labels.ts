import { computed, type Signal } from '@angular/core';

import { coerceSignal, createOverrideMerge } from '@cngx/core/utils';
import { recordEqual } from '@cngx/utils';

import {
  CNGX_SELECT_DEFAULTS,
  type CngxSelectAriaLabels,
  type CngxSelectConfig,
  type CngxSelectFallbackLabels,
} from '../config';

/** Announcer config with the library defaults applied. @internal */
export type CngxResolvedSelectAnnouncer = (typeof CNGX_SELECT_DEFAULTS)['announcer'];

/**
 * The select-family copy of one config, each key a `Signal` over the library
 * defaults. Read it inside a `computed()`, a template or a handler - never at
 * construction - so a language flip reaches every reader.
 *
 * @internal
 */
export interface CngxResolvedSelectLabels {
  readonly ariaLabels: Signal<CngxSelectAriaLabels>;
  readonly fallbackLabels: Signal<Required<CngxSelectFallbackLabels>>;
  readonly announcer: Signal<CngxResolvedSelectAnnouncer>;
}

const DEFAULT_ANNOUNCER = coerceSignal(CNGX_SELECT_DEFAULTS.announcer);

const ANNOUNCERS = new WeakMap<object, Signal<CngxResolvedSelectAnnouncer>>();

/**
 * Resolves the copy keys of a select config lazily. Keeps the eager
 * resolution's semantics: `ariaLabels` and `fallbackLabels` spread over the
 * defaults, the announcer spreads too but a missing `format` keeps the
 * default formatter. Every result is memoized per config source, so every
 * select under one injector shares the same signals.
 *
 * @internal
 */
export function resolveSelectLabels(user: CngxSelectConfig): CngxResolvedSelectLabels {
  return {
    ariaLabels: createOverrideMerge<CngxSelectAriaLabels>(
      CNGX_SELECT_DEFAULTS.ariaLabels,
      user.ariaLabels,
    ),
    fallbackLabels: createOverrideMerge<Required<CngxSelectFallbackLabels>>(
      CNGX_SELECT_DEFAULTS.fallbackLabels,
      user.fallbackLabels,
    ),
    announcer: resolveAnnouncer(user.announcer),
  };
}

function resolveAnnouncer(
  source: CngxSelectConfig['announcer'],
): Signal<CngxResolvedSelectAnnouncer> {
  if (!source) {
    return DEFAULT_ANNOUNCER;
  }
  const cached = ANNOUNCERS.get(source);
  if (cached) {
    return cached;
  }
  const user = coerceSignal(source);
  const resolved = computed<CngxResolvedSelectAnnouncer>(
    () => {
      const config = user();
      return {
        ...CNGX_SELECT_DEFAULTS.announcer,
        ...config,
        format: config.format ?? CNGX_SELECT_DEFAULTS.announcer.format,
      };
    },
    { equal: recordEqual },
  );
  ANNOUNCERS.set(source, resolved);
  return resolved;
}
