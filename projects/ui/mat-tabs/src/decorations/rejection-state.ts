import { computed, type Signal } from '@angular/core';

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
 * @internal — package-private helper for `[cngxMatTabs]`. Not
 * exported from `public-api.ts`.
 */
export interface CngxMatTabRejectionState {
  /**
   * Reactive label of the rollback origin — `undefined` when no
   * rejection is pinned, when the origin index is unresolved, or
   * when the origin tab carries no label.
   */
  readonly originLabel: Signal<string | undefined>;
  /**
   * Reactive descriptor phrase — the `commitRolledBackTo(originLabel)`
   * variant when an origin label resolves, falling back to
   * `commitFailedRetry` otherwise. Empty string between rejections
   * (the projector clears the decoration entirely on
   * `failedHandleId === null`, so consumers only consult this while
   * a rejection is pinned).
   */
  readonly descriptorText: Signal<string>;
}

/**
 * Build the {@link CngxMatTabRejectionState} bundle for a given
 * presenter + i18n pair. Two computeds share one source-walk
 * (`lastFailedIndex` → `originIndexDuringCommit` → `tabs[idx].label()`)
 * via Angular's signal memoisation — the second computed re-uses
 * the first's cached `originLabel` value, so the `tabs()` traversal
 * happens at most once per state change.
 *
 * @internal
 */
export function createRejectionState(
  presenter: CngxTabGroupHost,
  i18n: ReturnType<typeof injectTabsI18n>,
): CngxMatTabRejectionState {
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

  const descriptorText: Signal<string> = computed(() => {
    if (presenter.lastFailedIndex() === undefined) {
      return '';
    }
    const label = originLabel();
    return label ? i18n.commitRolledBackTo(label) : i18n.commitFailedRetry;
  });

  return { originLabel, descriptorText };
}
