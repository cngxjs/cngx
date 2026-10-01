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
 * ARIA labels with every library-defaulted key filled. `clearButton` and
 * `chipRemove` stay optional: their fallback differs per variant.
 *
 * @internal
 */
export type CngxResolvedSelectAriaLabels = CngxSelectAriaLabels &
  Required<Omit<CngxSelectAriaLabels, 'clearButton' | 'chipRemove'>>;

/**
 * The select-family copy of one config, each key a `Signal` over the library
 * defaults. Read it inside a `computed()`, a template or a handler - never at
 * construction - so a language flip reaches every reader.
 *
 * @internal
 */
export interface CngxResolvedSelectLabels {
  readonly ariaLabels: Signal<CngxResolvedSelectAriaLabels>;
  readonly fallbackLabels: Signal<Required<CngxSelectFallbackLabels>>;
  readonly announcer: Signal<CngxResolvedSelectAnnouncer>;
}

const DEFAULT_ANNOUNCER = coerceSignal(CNGX_SELECT_DEFAULTS.announcer);

const ANNOUNCERS = new WeakMap<object, Signal<CngxResolvedSelectAnnouncer>>();

const FILLED = new WeakMap<Signal<object>, Signal<object>>();

/**
 * Resolves the copy keys of a select config lazily. `ariaLabels` and
 * `fallbackLabels` spread over the defaults, and a defaulted key an override
 * sets to `undefined` falls back to its default, so readers need no literal
 * of their own. The announcer spreads too, and a missing `format` keeps the
 * default formatter. Every result is memoized per config source, so every
 * select under one injector shares the same signals.
 *
 * @internal
 */
export function resolveSelectLabels(user: CngxSelectConfig): CngxResolvedSelectLabels {
  return {
    ariaLabels: fillDefaults<CngxResolvedSelectAriaLabels>(
      createOverrideMerge<CngxSelectAriaLabels>(CNGX_SELECT_DEFAULTS.ariaLabels, user.ariaLabels),
      CNGX_SELECT_DEFAULTS.ariaLabels,
    ),
    fallbackLabels: fillDefaults(
      createOverrideMerge<Required<CngxSelectFallbackLabels>>(
        CNGX_SELECT_DEFAULTS.fallbackLabels,
        user.fallbackLabels,
      ),
      CNGX_SELECT_DEFAULTS.fallbackLabels,
    ),
    announcer: resolveAnnouncer(user.announcer),
  };
}

function fillDefaults<T extends object>(merged: Signal<Partial<T>>, defaults: T): Signal<T> {
  const cached = FILLED.get(merged) as Signal<T> | undefined;
  if (cached) {
    return cached;
  }
  const keys = Object.keys(defaults) as (keyof T)[];
  const filled = computed<T>(
    () => {
      const value = { ...merged() } as T;
      for (const key of keys) {
        value[key] ??= defaults[key];
      }
      return value;
    },
    { equal: recordEqual },
  );
  FILLED.set(merged, filled);
  return filled;
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
