import {
  effect,
  inject,
  type Injector,
  runInInjectionContext,
  type Signal,
  untracked,
} from '@angular/core';

import { CngxLiveAnnouncer } from '@cngx/common/a11y';

/**
 * Options for {@link mountLiveRegionAnnouncer}.
 *
 * @internal
 */
export interface CngxMatBridgeLiveRegionOptions {
  /** Reactive announcement text. Empty string keeps the region quiet. */
  readonly announcement: Signal<string>;
  readonly injector: Injector;
  /** Default: `'polite'`. */
  readonly politeness?: 'polite' | 'assertive';
}

/**
 * Keep the shared {@link CngxLiveAnnouncer} in sync with the supplied
 * `announcement` signal: an `effect` reads the reactive text and
 * forwards every non-empty value to the root announcer at the
 * configured politeness (default `'polite'`). An empty string between
 * transitions keeps the region quiet on no-op CD ticks.
 *
 * Delegates to {@link CngxLiveAnnouncer} instead of mounting its own
 * body span, so the announcer owns the persistent polite/assertive
 * region pair, the clear-then-set re-announce, and teardown. The
 * delegated region carries `aria-live` + `aria-atomic="true"` and no
 * explicit `role`; `aria-atomic` re-reads full content and `aria-live`
 * carries the politeness, so a tab-change status utterance still reads.
 *
 * The `effect` is created in `opts.injector`'s context, so it is torn
 * down with the host directive; the service call is wrapped in
 * `untracked` - the announcer owns its own clear-then-set timer, so it
 * stays out of the effect's dependency graph.
 *
 * @internal - package-private helper shared by the Material bridge
 * entries (`[cngxMatTabs]`, `[cngxMatTabNav]`, `[cngxMatStepper]`).
 * Not exported from any `public-api.ts`.
 */
export function mountLiveRegionAnnouncer(
  opts: CngxMatBridgeLiveRegionOptions,
): void {
  const politeness = opts.politeness ?? 'polite';

  runInInjectionContext(opts.injector, () => {
    const announcer = inject(CngxLiveAnnouncer);
    effect(() => {
      const text = opts.announcement();
      if (!text) {
        return;
      }
      untracked(() => announcer.announce(text, politeness));
    });
  });
}
