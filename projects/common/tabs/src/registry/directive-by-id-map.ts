import { computed, InjectionToken, type Signal } from '@angular/core';

/**
 * Structural equality for a `Map<string, T>` where `T` is matched by
 * reference (`Object.is`). Two maps are equal when they share size,
 * the same key set, and the same value reference per key. Drop-in
 * replacement for the per-organism `tabDirectiveMapEqual` /
 * `stepDirectiveMapEqual` helpers extracted at Phase 4 of the
 * global-material-bridge plan.
 *
 * @internal — exported only because the factory below uses it; not a
 * documented public API.
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
 * @category interactive
 */
export interface CngxDirectiveByIdMapOptions<T extends { id: () => string }> {
  /**
   * Reactive source — typically the result of `contentChildren(...)`.
   * The factory's `computed()` reads this signal and rebuilds the
   * Map on every emission.
   */
  readonly source: Signal<readonly T[]>;
}

/**
 * Build a `Signal<Map<string, T>>` from a `Signal<readonly T[]>` of
 * directive instances each carrying an `id: () => string` getter.
 * The returned computed carries a structural-equal so downstream
 * consumers don't cascade when `contentChildren` re-emits with an
 * unchanged child set.
 *
 * Replaces the duplicated `tabDirectiveById` / `stepDirectiveById` /
 * `stepDirectiveById` patterns previously inlined in the three
 * Level-4 organisms (`<cngx-tab-group>`, `<cngx-stepper>`,
 * `<cngx-mat-stepper>`). Behaviour-preserving extraction.
 *
 * @category interactive
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
 * Matches {@link createDirectiveByIdMap} exactly so override
 * implementations can be drop-in.
 *
 * @category interactive
 */
export type CngxDirectiveByIdMapFactory = <T extends { id: () => string }>(
  opts: CngxDirectiveByIdMapOptions<T>,
) => Signal<Map<string, T>>;

/**
 * DI token for the per-id directive-resolution policy. Defaults to
 * {@link createDirectiveByIdMap} (structural-equal Map).
 *
 * Override at app `providers` (root) or component `viewProviders`
 * (scoped) to install a different policy — e.g. WeakMap-based
 * resolution, telemetry, custom equality. Real consumers:
 * `<cngx-tab-group>` (today); `<cngx-stepper>` and
 * `<cngx-mat-stepper>` migrate via Phase 1.8.
 *
 * Symmetric to `CNGX_DOM_ANCHOR_RETRY_FACTORY` and
 * `CNGX_ORGANISM_SCROLL_SYNC_FACTORY`.
 *
 * @category interactive
 */
export const CNGX_DIRECTIVE_BY_ID_MAP_FACTORY =
  new InjectionToken<CngxDirectiveByIdMapFactory>(
    'CngxDirectiveByIdMapFactory',
    {
      providedIn: 'root',
      factory: () => createDirectiveByIdMap,
    },
  );
