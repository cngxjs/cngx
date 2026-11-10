import { effect, inject, untracked, type Signal, type WritableSignal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';

import { coerceSignal } from '@cngx/core/utils';

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
 * The key, the initial hydrate and the bookkeeping are resolved on the first
 * effect run, not in the call: a `Signal<string>` key backed by an input is
 * read after the input is bound, and in a directive the hydrated state is in
 * place before the caller's view first renders. A read of `state()` in the
 * caller's constructor or `ngOnInit` still sees the un-hydrated value. Called
 * from an environment injector (a service, `runInInjectionContext`), the
 * effects are root effects: `state()` is hydrated on the first application
 * tick, not when the call returns.
 *
 * Loop-safety (the core of this helper): the reflect effect writes the URL in
 * `untracked()` and skips `navigate` when the serialized `state()` equals the
 * last value it wrote - a local closure seeded from the initial URL read, not
 * the live URL param (the live param races the navigate-settle window). The
 * hydrate path updates that same closure whenever it accepts a URL value, so
 * back/forward re-hydration never triggers a reflex navigate. A `param` rename
 * is migrated in one navigate (`{ [old]: null, [new]: serialize(state()) }`)
 * by a dedicated effect whose only tracked source is the normalized param
 * signal; its first run finds the key `init()` seeded and never navigates.
 *
 * The `state.set` inside the hydrate effect is a deliberate signal-write-in-
 * effect: the URL is an external system and `state` is a caller-owned signal
 * the consumer must stay able to toggle, so hydrate cannot be a `computed`. It
 * is edge-guarded by serialized equality and wrapped in `untracked()`.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/layout/router/inject-query-param-sync.ts
 * @since 0.1.0
 * @relatedTo CngxStepperRouterSync
 * <example-url>/#/common/layout/router/persisted-toggle</example-url>
 */
export function injectQueryParamSync<T = boolean>(
  state: WritableSignal<T>,
  opts: QueryParamSyncOptions<T>,
): void {
  const router = inject(Router, { optional: true });
  // Router is providedIn: 'root' and resolves without provideRouter(...);
  // ActivatedRoute does not, so it is the "router is set up" signal.
  const route = inject(ActivatedRoute, { optional: true });

  if (!router || !route) {
    if (typeof ngDevMode !== 'undefined' && ngDevMode) {
      warnRouterAbsent('query-param URL sync');
    }
    return;
  }

  const paramSignal: Signal<string> = coerceSignal(opts.param);
  const serialize: (value: T) => string | null =
    opts.serialize ?? ((value) => (value ? 'open' : null));
  const deserialize: (raw: string | null) => T = opts.deserialize ?? ((raw) => (raw != null) as T);

  // Closure bookkeeping, seeded by `init()` from the initial URL read.
  // `lastWritten` is the serialized value the reflect path last pushed to the
  // URL; the hydrate path also updates it so an accepted URL value is not
  // reflected back.
  let lastWritten: string | null = null;
  let previousParam = '';
  let initialized = false;

  // Runs once, on the first run of whichever effect runs first, so an
  // input-backed key is read after binding. URL wins on initial load.
  const init = (): void => {
    if (initialized) {
      return;
    }
    initialized = true;
    previousParam = paramSignal();
    lastWritten = route.snapshot.queryParamMap.get(previousParam) ?? null;
    if (lastWritten != null) {
      const hydrated = deserialize(lastWritten);
      if (!Object.is(hydrated, state())) {
        state.set(hydrated);
      }
    }
  };

  // Reflect: signal change -> URL. Tracks `state()` only; param read untracked.
  effect(() => {
    untracked(init);
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
  // the initial snapshot already handled by `init()`, so it is skipped
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
      init();
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
  // signal only; the first run finds the `previousParam` `init()` seeded and
  // never navigates.
  effect(() => {
    const param = paramSignal();
    untracked(() => {
      init();
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
