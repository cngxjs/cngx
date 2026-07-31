import { afterNextRender, computed, linkedSignal, signal, type Injector, type Signal } from '@angular/core';

import type { CngxTabGroupHost } from '../tab-group-host.token';

/**
 * Inputs the nav announcement bundle reads from its host organism.
 * Passing the presenter in (instead of re-injecting) keeps the factory a
 * plain function of its arguments.
 *
 * @category common/tabs/announcements
 */
export interface CngxTabNavAnnouncementOptions {
  readonly presenter: CngxTabGroupHost;

  /**
   * Injection context for the one-shot `afterNextRender` that opens the
   * mount window. Callers pass their own `inject(Injector)`.
   */
  readonly injector: Injector;
}

/**
 * Resolved bundle returned by {@link createTabNavAnnouncement}.
 *
 * @category common/tabs/announcements
 */
export interface CngxTabNavAnnouncement {
  /**
   * Polite live-region content - declarative, never an imperative
   * `announce()`. Empty at rest and through the mount window, so the
   * region speaks only on a real change.
   */
  readonly liveAnnouncement: Signal<string>;
}

/**
 * Live-region content for the link-driven nav flavour: the active link's
 * accessible label, announced only when the active id actually changes.
 *
 * **Why this is not {@link createTabGroupAnnouncements}.** That bundle's
 * phrasing is built around the commit lifecycle (`pending -> success`,
 * rollback, direction prefix) and it gates on the commit transition, so
 * it stays silent at rest for free. The nav path is commit-free by
 * design: links navigate through their own `routerLink` and nothing calls
 * `presenter.select()`. Its only meaningful announcement is the landing
 * label, and it needs a different silence gate.
 *
 * **The mount window.** `announcing` stays `false` through the first
 * render and the microtask after it. On a deep link the active link is
 * the page's *initial state*, not a change, and the browser already
 * announces the document; pushing the landing section into a polite
 * region there is noise. `queueMicrotask` rather than the
 * `afterNextRender` body: every `afterNextRender` callback for one render
 * runs in a single synchronous batch, so deferring past it makes the gate
 * independent of whether a `[cngxTabsRouteSync]` seed registered before
 * or after this one.
 *
 * The prior-id tracker is seeded when that window closes, not at
 * construction, so whatever the seed resolved counts as the starting
 * point instead of as the first announcement. Returning to a section
 * that was active at mount still announces.
 *
 * @category common/tabs/announcements
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/tabs/announcements/tab-nav-announcement.ts
 * @since 0.1.0
 * @relatedTo CngxTabNav, CngxLiveRegion, createTabGroupAnnouncements
 */
export function createTabNavAnnouncement(
  options: CngxTabNavAnnouncementOptions,
): CngxTabNavAnnouncement {
  const { presenter, injector } = options;

  const announcing = signal(false);

  // `prev?.source` = the id before the most recent change. Mirrors the
  // tablist bundle's prior-index tracker, keyed on id.
  const priorActiveId = linkedSignal<string | null, string | null>({
    source: () => presenter.activeId(),
    computation: (curr, prev) => prev?.source ?? curr,
    equal: Object.is,
  });

  const liveAnnouncement = computed<string>(() => {
    if (!announcing()) {
      return '';
    }
    const id = presenter.activeId();
    if (id === null || id === priorActiveId()) {
      return '';
    }
    return presenter.tabs().find((tab) => tab.id === id)?.label() ?? '';
  });

  afterNextRender(
    () => {
      queueMicrotask(() => {
        priorActiveId();
        announcing.set(true);
      });
    },
    { injector },
  );

  return { liveAnnouncement };
}
