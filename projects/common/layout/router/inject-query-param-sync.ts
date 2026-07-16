import {
  effect,
  inject,
  isSignal,
  signal,
  untracked,
  type Signal,
  type WritableSignal,
} from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';

import { warnRouterAbsent } from './warn-router-absent';

/**
 * Options for {@link injectQueryParamSync}.
 *
 * `param` accepts a live `Signal<string>` so a bound `[param]` rename stays
 * reactive; a plain string is wrapped internally. `serialize`/`deserialize`
 * default to a boolean codec (`true` -> `'open'`, absence -> `false`); pass an
 * identity codec (`v => v ?? null` / `raw => raw`) to sync string ids.
 */
export interface QueryParamSyncOptions<T = boolean> {
  /** Query-param key. A `Signal<string>` keeps a bound rename live. */
  readonly param: string | Signal<string>;
  /** `T` -> URL string, or `null` to remove the key. Default: boolean codec. */
  readonly serialize?: (value: T) => string | null;
  /** URL string (or `null` when absent) -> `T`. Default: boolean codec. */
  readonly deserialize?: (raw: string | null) => T;
  /** Invoked with the rejection reason when `router.navigate` rejects. */
  readonly onSyncError?: (err: unknown) => void;
}

/**
 * Bidirectional sync between a caller-owned `WritableSignal<T>` and a named
 * query param. URL wins on initial load (deep-link intent); after hydrate the
 * signal is the source and reflects outward. Re-hydrates on browser
 * back/forward. Dev-warns once and no-ops when `@angular/router` is absent.
 *
 * Loop-safety (the core of this helper): the reflect effect writes the URL in
 * `untracked()` and skips `navigate` when the serialized `state()` equals the
 * last value it wrote - a local closure seeded from the initial URL read, not
 * the live URL param (the live param races the navigate-settle window). The
 * hydrate path updates that same closure whenever it accepts a URL value, so
 * back/forward re-hydration never triggers a reflex navigate. A `param` rename
 * is migrated in one navigate (`{ [old]: null, [new]: serialize(state()) }`)
 * by a dedicated effect whose only tracked source is the normalized param
 * signal; its first run seeds bookkeeping and never navigates.
 *
 * The `state.set` inside the hydrate effect is a deliberate signal-write-in-
 * effect: the URL is an external system and `state` is a caller-owned signal
 * the consumer must stay able to toggle, so hydrate cannot be a `computed`. It
 * is edge-guarded by serialized equality and wrapped in `untracked()`.
 *
 * @category common/layout
 * @since 0.1.0
 */
export function injectQueryParamSync<T = boolean>(
  state: WritableSignal<T>,
  opts: QueryParamSyncOptions<T>,
): void {
  const router = inject(Router, { optional: true });

  if (!router) {
    warnRouterAbsent('injectQueryParamSync', 'query-param URL sync');
    return;
  }

  const route = inject(ActivatedRoute);

  const paramSignal: Signal<string> = isSignal(opts.param) ? opts.param : signal(opts.param);
  const serialize: (value: T) => string | null =
    opts.serialize ?? ((value) => (value ? 'open' : null));
  const deserialize: (raw: string | null) => T =
    opts.deserialize ?? ((raw) => (raw != null) as T);

  // Closure bookkeeping, seeded from the initial URL read. `lastWritten` is
  // the serialized value the reflect path last pushed to the URL; the hydrate
  // path also updates it so an accepted URL value is not reflected back.
  const initialParam = paramSignal();
  let lastWritten: string | null = route.snapshot.queryParamMap.get(initialParam) ?? null;
  let previousParam = initialParam;

  // URL wins on initial load.
  if (lastWritten != null) {
    const hydrated = deserialize(lastWritten);
    if (!Object.is(hydrated, state())) {
      state.set(hydrated);
    }
  }

  // Reflect: signal change -> URL. Tracks `state()` only; param read untracked.
  effect(() => {
    const raw = serialize(state());
    untracked(() => {
      if (raw === lastWritten) {
        return;
      }
      lastWritten = raw;
      router
        .navigate([], {
          queryParams: { [paramSignal()]: raw },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        })
        .catch((err: unknown) => opts.onSyncError?.(err));
    });
  });

  // Re-hydrate: URL change (back/forward) -> signal. Tracks the query-param
  // emission only; param and state reads are untracked. The first run mirrors
  // the initial snapshot already handled synchronously above, so it is skipped
  // - processing it would race the reflect effect's still-pending initial
  // navigate and reset `state` to a stale value. Later runs skip our own
  // reflect echo via the `lastWritten` guard.
  const queryMap = toSignal(route.queryParamMap, {
    initialValue: route.snapshot.queryParamMap,
  });
  let hydrateInitialized = false;
  effect(() => {
    const map = queryMap();
    untracked(() => {
      if (!hydrateInitialized) {
        hydrateInitialized = true;
        return;
      }
      const raw = map.get(paramSignal()) ?? null;
      if (raw === lastWritten) {
        return;
      }
      const next = deserialize(raw);
      if (!Object.is(next, state())) {
        state.set(next);
      }
      lastWritten = raw;
    });
  });

  // Rename migration: param change -> one merged navigate that removes the old
  // key and writes the current value under the new one. Tracks the param
  // signal only; the first run seeds `previousParam` and never navigates.
  effect(() => {
    const param = paramSignal();
    untracked(() => {
      if (param === previousParam) {
        return;
      }
      const oldParam = previousParam;
      previousParam = param;
      const raw = serialize(state());
      lastWritten = raw;
      router
        .navigate([], {
          queryParams: { [oldParam]: null, [param]: raw },
          queryParamsHandling: 'merge',
          replaceUrl: true,
        })
        .catch((err: unknown) => opts.onSyncError?.(err));
    });
  });
}
