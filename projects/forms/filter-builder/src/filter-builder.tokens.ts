import { inject, InjectionToken } from '@angular/core';
import { CngxToggle } from '@cngx/common/interactive';

import type { CngxFilterEditor } from './filter-builder.config';

/**
 * Build the default editor registry. The single source of truth for the
 * four builtin entries — `string` / `number` / `date` → native sentinels,
 * `boolean` → `CngxToggle` from `@cngx/common/interactive`. Internal to
 * this file; consumers reach the defaults through `CNGX_FILTER_EDITORS`'s
 * `providedIn: 'root'` factory.
 */
function buildDefaultEditors(): ReadonlyMap<string, CngxFilterEditor> {
  const map = new Map<string, CngxFilterEditor>();
  map.set('string', 'native:string');
  map.set('number', 'native:number');
  map.set('date', 'native:date');
  map.set('boolean', CngxToggle);
  return map;
}

/**
 * Dedicated DI token for the editor registry. The single override surface
 * — consumers swap one or more editors by providing
 * `{ provide: CNGX_FILTER_EDITORS, useValue: <map> }` at the
 * environment, route, or component level.
 *
 * Default factory builds a fresh map covering the four builtin entries.
 * `provideFilterBuilderConfig` does NOT participate in editor resolution;
 * the editor registry is intentionally orthogonal to the config cascade.
 */
export const CNGX_FILTER_EDITORS = new InjectionToken<ReadonlyMap<string, CngxFilterEditor>>(
  'CngxFilterEditors',
  {
    providedIn: 'root',
    factory: buildDefaultEditors,
  },
);

/**
 * Inject the resolved editor registry. Sugar over
 * `inject(CNGX_FILTER_EDITORS)`. Exists so consumers can read editors
 * without importing the token directly when they already inject other
 * filter-builder helpers (e.g. inside a slot directive context).
 *
 * **Snapshot semantics.** The returned `ReadonlyMap` is captured at
 * injection time. Runtime swaps of `CNGX_FILTER_EDITORS` in nested DI
 * scopes are NOT observed by an already-injected consumer. If a
 * consumer needs reactive editor swap behaviour, re-`inject()` the
 * token at the swap-boundary's injector instead of cached references.
 */
export function injectFilterEditors(): ReadonlyMap<string, CngxFilterEditor> {
  return inject(CNGX_FILTER_EDITORS);
}
