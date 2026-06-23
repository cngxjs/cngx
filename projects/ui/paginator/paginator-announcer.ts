import { computed, inject, InjectionToken, linkedSignal, type Signal } from '@angular/core';

import { injectPaginatorConfig } from './paginator-config';
import { CNGX_PAGINATOR_HOST } from './paginator-host.token';

/**
 * Reactive announcement source for the paginator live region.
 *
 * @category ui/paginator
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/paginator/paginator-announcer.ts
 * @since 0.1.0
 */
export interface CngxPaginatorAnnouncer {
  /**
   * The current message to render inside the `cngxLiveRegion` span. Changes
   * (and only changes) are spoken by assistive technology.
   */
  readonly message: Signal<string>;
}

/** What the announcer is reacting to, sampled together so transitions are atomic. */
interface AnnouncerSource {
  readonly page: number;
  readonly totalPages: number;
  readonly busy: boolean;
}

/**
 * Builds the paginator live-region message as a single derived signal - no
 * class logic baked into the shell, so the skin still ejects cleanly. The
 * message is a `linkedSignal` over `[pageIndex, totalPages, isBusy]` from
 * {@link CNGX_PAGINATOR_HOST}: it speaks "Page N of M" on every effective-page
 * change (navigation OR a `total`-shrink clamp, so the clamp is never silent),
 * "Loading" while busy, and "Updated" on the first settle after busy. Phrasing
 * comes from {@link injectPaginatorConfig}.
 *
 * The previous source value (held by `linkedSignal`) is what distinguishes a
 * settle from a steady state, so there is no signal write in an `effect` and no
 * imperative `previous` tracking. Identical consecutive messages dedupe through
 * the signal's value equality, so the live region never re-announces a no-op.
 *
 * Must run in an injection context (call as a field initialiser on the shell).
 *
 * @category ui/paginator
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/paginator/paginator-announcer.ts
 * @since 0.1.0
 */
export function createPaginatorAnnouncer(): CngxPaginatorAnnouncer {
  const host = inject(CNGX_PAGINATOR_HOST);
  const config = injectPaginatorConfig();

  // Sample the three drivers together so a transition is atomic. The field-wise
  // `equal` keeps the source reference stable across a recompute that yields an
  // identical tuple, so the linkedSignal computation never re-runs on a no-op
  // (equality rule: an object-returning computed carries an explicit equal).
  const source = computed<AnnouncerSource>(
    () => ({
      page: host.pageIndex(),
      totalPages: host.totalPages(),
      busy: host.isBusy(),
    }),
    { equal: (a, b) => a.page === b.page && a.totalPages === b.totalPages && a.busy === b.busy },
  );

  const message = linkedSignal<AnnouncerSource, string>({
    source,
    computation: (current, previous) => {
      const { announcements } = config;
      if (current.busy) {
        return announcements.loading;
      }
      // Just left a busy state: announce the settle once, before page phrasing.
      if (previous?.source.busy) {
        return announcements.updated;
      }
      return announcements.pageChange(current.page + 1, current.totalPages);
    },
  });

  return { message };
}

/** The shape an override must match to swap the announcer derivation. */
export type CngxPaginatorAnnouncerFactory = () => CngxPaginatorAnnouncer;

/**
 * Swap token for the live-region announcer derivation. The default resolves to
 * {@link createPaginatorAnnouncer}; the shell builds its announcer via
 * `inject(CNGX_PAGINATOR_ANNOUNCER_FACTORY)()` rather than calling the factory
 * directly. Override it to wrap the busy / settle / page-change derivation - a
 * telemetry tap, politeness escalation, or custom phrasing branch - without
 * forking the shell (mirrors `CNGX_COMMIT_ERROR_ANNOUNCER_FACTORY` in the
 * select family). The override runs in the shell's injection context, so it can
 * still `inject(CNGX_PAGINATOR_HOST)` / {@link injectPaginatorConfig}.
 *
 * @category ui/paginator
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/paginator/paginator-announcer.ts
 * @since 0.1.0
 */
export const CNGX_PAGINATOR_ANNOUNCER_FACTORY =
  new InjectionToken<CngxPaginatorAnnouncerFactory>('CngxPaginatorAnnouncerFactory', {
    providedIn: 'root',
    factory: () => createPaginatorAnnouncer,
  });
