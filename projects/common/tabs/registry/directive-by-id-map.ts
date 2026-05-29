import { computed, InjectionToken, type Signal } from '@angular/core';

/**
 * Structural equal for `Map<string, T>` (size + same value reference
 * per key, via `Object.is`).
 *
 * @internal
 */
function directiveMapEqual<T>(a: Map<string, T>, b: Map<string, T>): boolean {
  if (a === b) {
    return true;
  }
  if (a.size !== b.size) {
    return false;
  }
  for (const [id, dir] of a) {
    if (b.get(id) !== dir) {
      return false;
    }
  }
  return true;
}

/**
 * Options for {@link createDirectiveByIdMap}.
 *
 * @category common/tabs/registry
 */
export interface CngxDirectiveByIdMapOptions<T extends { id: () => string }> {
  /** Reactive source - typically `contentChildren(...)`. */
  readonly source: Signal<readonly T[]>;
}

/**
 * Build a `Signal<Map<string, T>>` from a `Signal<readonly T[]>` of
 * directives keyed by `id()`. Structural equal prevents cascade when
 * `contentChildren` re-emits an unchanged child set. Shared by
 * `<cngx-tab-group>`, `<cngx-stepper>`, and `<cngx-mat-stepper>`.
 *
 * @category common/tabs/registry
 */
export function createDirectiveByIdMap<T extends { id: () => string }>(
  opts: CngxDirectiveByIdMapOptions<T>,
): Signal<Map<string, T>> {
  return computed<Map<string, T>>(
    () => {
      const map = new Map<string, T>();
      for (const dir of opts.source()) {
        map.set(dir.id(), dir);
      }
      return map;
    },
    { equal: directiveMapEqual },
  );
}

/**
 * Factory signature for {@link CNGX_DIRECTIVE_BY_ID_MAP_FACTORY}.
 *
 * @category common/tabs/registry
 */
export type CngxDirectiveByIdMapFactory = <T extends { id: () => string }>(
  opts: CngxDirectiveByIdMapOptions<T>,
) => Signal<Map<string, T>>;

/**
 * DI token for the per-id directive-resolution policy. Defaults to
 * {@link createDirectiveByIdMap}. Override for WeakMap resolution,
 * telemetry, or custom equality. Sibling to
 * `CNGX_DOM_ANCHOR_RETRY_FACTORY` and
 * `CNGX_ORGANISM_SCROLL_SYNC_FACTORY`.
 *
 * @category common/tabs/registry
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/tabs/registry/directive-by-id-map.ts
 * @since 0.1.0
 */
export const CNGX_DIRECTIVE_BY_ID_MAP_FACTORY = new InjectionToken<CngxDirectiveByIdMapFactory>(
  'CngxDirectiveByIdMapFactory',
  {
    providedIn: 'root',
    factory: () => createDirectiveByIdMap,
  },
);
