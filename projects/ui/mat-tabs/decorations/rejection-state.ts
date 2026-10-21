import { computed, untracked, type Signal } from '@angular/core';

import { createRefusedPhrase } from '@cngx/common/data';
import type { CngxTabGroupHost, injectTabsI18n } from '@cngx/common/tabs';

/**
 * Reactive rejection-state derivation shared by the descriptor-text
 * pipeline and the `*cngxMatTabRejectionContent` slot context.
 *
 * Both consumers need the same source resolution (failed index →
 * origin index → origin tab label), so a single factory deduplicates
 * the lookup and keeps `[cngxMatTabs]` thin enough to pass the
 * organism-LOC guard.
 *
 * @internal - package-private helper for `[cngxMatTabs]`. Not
 * exported from `public-api.ts`.
 */
export interface CngxMatTabRejectionState {
  /**
   * Stable id of the currently-failed tab handle, or `null` when no
   * rejection is pinned. Identity equal via the id lookup collapses
   * `tabs()` re-emissions that do not change the failed target - the
   * rejection projector keys its effect on exactly this signal.
   */
  readonly failedHandleId: Signal<string | null>;
  /**
   * Reactive label of the rollback origin - `undefined` when no
   * rejection is pinned, when the origin index is unresolved, or
   * when the origin tab carries no label.
   */
  readonly originLabel: Signal<string | undefined>;
  /**
   * Kind of the outcome behind the pinned marker - `'refused'` when the
   * commit action answered `false`, `'failed'` when it threw, rejected or
   * errored; `undefined` when no rejection is pinned. Feeds the
   * `*cngxMatTabRejectionContent` slot context.
   */
  readonly reason: Signal<'refused' | 'failed' | undefined>;
  /**
   * Reactive descriptor phrase. A failed tab reads
   * `commitRolledBackTo(origin)` when an origin index resolves,
   * `commitFailedRetry` otherwise; a refused tab reads
   * `commitRefused(origin)` or `commitRefusedGeneric`, never the
   * failure copy. The origin is its label, or `unlabeledTab(position)`
   * for a label-less origin tab; the generic copy when the origin tab was
   * removed meanwhile. Empty string between rejections
   * (the projector clears the decoration entirely on
   * `failedHandleId === null`, so consumers only consult this while
   * a rejection is pinned).
   */
  readonly descriptorText: Signal<string>;
  /**
   * SR-friendly text rendered inside the polite live-region span.
   * Mirrors `tab-group.component.ts`'s `liveAnnouncement` rejection
   * arm so AT users on Material `<mat-tab-group>` get the same
   * commit-transition narrative as cngx-native:
   *
   *   0. a new refusal → `commitRefused(origin)` (or
   *      `commitRefusedGeneric` without an origin index) once,
   *      until the next commit, an active-index move or a cleared
   *      outcome
   *   1. `'pending'` → `i18n.commitInFlight`
   *   2. `'error'` → `commitRolledBackTo(origin)` when an
   *      origin index resolves, `commitFailedRetry` otherwise
   *   3. anything else → empty string (region stays quiet on no-op
   *      CD ticks; mat-tabs does not announce success transitions
   *      because Material's own ARIA already narrates the
   *      activeIndex change - duplicating would make AT readers
   *      hear two utterances per nav)
   */
  readonly liveAnnouncement: Signal<string>;
}

/**
 * Build the {@link CngxMatTabRejectionState} bundle for a given
 * presenter + i18n pair. `descriptorText` re-uses the cached
 * `originLabel` walk (`lastFailedIndex` → `originIndexDuringCommit` →
 * `tabs[idx].label()`). The live announcement walks the indices itself so
 * they stay tracked while the label, which a consumer may translate, is
 * read untracked.
 *
 * @internal
 */
export function createRejectionState(
  presenter: CngxTabGroupHost,
  i18n: ReturnType<typeof injectTabsI18n>,
): CngxMatTabRejectionState {
  // A label-less origin is named by its position, as on <cngx-tab-group>;
  // undefined when no origin tab resolves - no origin index, or one past the
  // end because the origin tab was removed meanwhile (the generic copy).
  function originName(
    originIdx: number | undefined,
    copy: ReturnType<typeof i18n>,
  ): string | undefined {
    const origin = originIdx === undefined ? undefined : presenter.tabs()[originIdx];
    if (!origin || originIdx === undefined) {
      return undefined;
    }
    const label = origin.label();
    if (label) {
      return label;
    }
    return copy.unlabeledTab(originIdx + 1);
  }

  const failedHandleId: Signal<string | null> = computed(() => {
    const idx = presenter.lastFailedIndex();
    if (idx === undefined) {
      return null;
    }
    return presenter.tabs()[idx]?.id ?? null;
  });

  const originLabel: Signal<string | undefined> = computed(() => {
    const failedIdx = presenter.lastFailedIndex();
    if (failedIdx === undefined) {
      return undefined;
    }
    const originIdx = presenter.originIndexDuringCommit();
    if (originIdx === undefined) {
      return undefined;
    }
    return presenter.tabs()[originIdx]?.label() ?? undefined;
  });

  const reason: Signal<'refused' | 'failed' | undefined> = computed(() => {
    if (presenter.lastFailedIndex() === undefined) {
      return undefined;
    }
    return presenter.lastOutcome()?.kind === 'refused' ? 'refused' : 'failed';
  });

  const descriptorText: Signal<string> = computed(() => {
    const kind = reason();
    if (kind === undefined) {
      return '';
    }
    const copy = i18n();
    const name = originName(presenter.originIndexDuringCommit(), copy);
    if (kind === 'refused') {
      return name ? copy.commitRefused(name) : copy.commitRefusedGeneric;
    }
    return name ? copy.commitRolledBackTo(name) : copy.commitFailedRetry;
  });

  // A refusal leaves the commit status at 'idle', so no status edge can
  // voice it. Same lifecycle as the `<cngx-tab-group>` phrase: armed by a
  // new refused sequence, spent by the next commit activity, an
  // active-index move or a cleared outcome.
  const refusedPhrase = createRefusedPhrase({
    outcome: () => presenter.lastOutcome(),
    status: () => presenter.commitTransition.current(),
    activeIndex: () => presenter.activeIndex(),
    copy: refusedCopy,
  });

  function refusedCopy(): string {
    const copy = i18n();
    const name = originName(presenter.originIndexDuringCommit(), copy);
    return name ? copy.commitRefused(name) : copy.commitRefusedGeneric;
  }

  // Feeds the live announcer: copy and the origin tab label (which a
  // consumer may translate) are read untracked so a language switch does
  // not re-announce; the next transition speaks the new language.
  const liveAnnouncement: Signal<string> = computed(() => {
    // Read the refused phrase EAGERLY: linkedSignal only observes the
    // snapshots it is read under, so a read behind the pending arm would
    // miss the status change that spends it.
    const refused = refusedPhrase();
    if (refused) {
      return refused;
    }
    const current = presenter.commitTransition.current();
    if (current === 'pending') {
      return untracked(() => i18n().commitInFlight);
    }
    if (current === 'error') {
      const failedIdx = presenter.lastFailedIndex();
      const originIdx = failedIdx === undefined ? undefined : presenter.originIndexDuringCommit();
      // The indices and the tab list stay tracked; the label is read untracked.
      const hasOrigin = originIdx !== undefined && presenter.tabs()[originIdx] !== undefined;
      return untracked(() => {
        const copy = i18n();
        const name = hasOrigin ? originName(originIdx, copy) : undefined;
        return name ? copy.commitRolledBackTo(name) : copy.commitFailedRetry;
      });
    }
    return '';
  });

  return { failedHandleId, originLabel, reason, descriptorText, liveAnnouncement };
}
