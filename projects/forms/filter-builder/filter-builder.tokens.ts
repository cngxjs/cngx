import { inject, InjectionToken } from '@angular/core';

import type { CngxFilterEditor } from './filter-builder.config';

/**
 * Build the default editor registry. The single source of truth for the
 * four builtin entries - `string` / `number` / `date` / `boolean` →
 * native sentinels. Boolean used to mount `CngxToggle` via `*ngComponentOutlet`
 * but that path renders disconnected from the expression value (no input
 * bindings, no output subscription); since the row component shipped, the
 * boolean branch is inlined as `<cngx-toggle>` and the registry maps to
 * the `'native:boolean'` sentinel. Internal to this file; consumers reach
 * the defaults through `CNGX_FILTER_EDITORS`'s `providedIn: 'root'` factory.
 *
 * @internal
 */
function buildDefaultEditors(): ReadonlyMap<string, CngxFilterEditor> {
  const map = new Map<string, CngxFilterEditor>();
  map.set('string', 'native:string');
  map.set('number', 'native:number');
  map.set('date', 'native:date');
  map.set('boolean', 'native:boolean');
  return map;
}

/**
 * Registry mapping each editor type to the component (or native sentinel)
 * that renders an expression's value. The single override surface for value
 * editors - swap one or more by providing a new map:
 *
 * ```ts
 * providers: [
 *   { provide: CNGX_FILTER_EDITORS, useValue: new Map([...builtins, ['color', MyColorEditor]]) },
 * ]
 * ```
 *
 * Provide at environment, route, or component level. The default factory
 * builds a fresh map covering the four builtin entries (`string` / `number` /
 * `date` / `boolean` -> native sentinels).
 *
 * Orthogonal to the config cascade: `provideFilterBuilderConfig` does NOT
 * touch editor resolution - editors live on this token alone.
 *
 * @category forms/filter-builder/config
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/filter-builder/filter-builder.tokens.ts
 * @since 0.1.0
 * @relatedTo injectFilterEditors, CngxFilterEditorComponent, CNGX_FILTER_BUILDER_CONFIG
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
 *
 * @category forms/filter-builder/config
 */
export function injectFilterEditors(): ReadonlyMap<string, CngxFilterEditor> {
  return inject(CNGX_FILTER_EDITORS);
}
