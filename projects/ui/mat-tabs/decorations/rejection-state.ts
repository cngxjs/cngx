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
   * `commitRolledBackTo(originLabel)` when an origin label resolves,
   * `commitFailedRetry` otherwise; a refused tab reads
   * `commitRefused(originLabel)` or `commitRefusedGeneric`, never the
   * failure copy. Empty string between rejections
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
   *   0. a new refusal → `commitRefused(originLabel)` (or
   *      `commitRefusedGeneric`) once, until the next commit, an
   *      active-index move or a cleared outcome
   *   1. `'pending'` → `i18n.commitInFlight`
   *   2. `'error'` → `commitRolledBackTo(originLabel)` when an
   *      origin label resolves, `commitFailedRetry` otherwise
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
    const label = originLabel();
    const copy = i18n();
    if (kind === 'refused') {
      return label ? copy.commitRefused(label) : copy.commitRefusedGeneric;
    }
    return label ? copy.commitRolledBackTo(label) : copy.commitFailedRetry;
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
    const originIdx = presenter.originIndexDuringCommit();
    const origin = originIdx !== undefined ? presenter.tabs()[originIdx] : undefined;
    const label = origin?.label();
    const copy = i18n();
    return label ? copy.commitRefused(label) : copy.commitRefusedGeneric;
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
      const originIdx = presenter.originIndexDuringCommit();
      const hasOrigin = failedIdx !== undefined && originIdx !== undefined;
      const origin = hasOrigin ? presenter.tabs()[originIdx] : undefined;
      return untracked(() => {
        const label = origin?.label();
        return label ? i18n().commitRolledBackTo(label) : i18n().commitFailedRetry;
      });
    }
    return '';
  });

  return { failedHandleId, originLabel, reason, descriptorText, liveAnnouncement };
}
