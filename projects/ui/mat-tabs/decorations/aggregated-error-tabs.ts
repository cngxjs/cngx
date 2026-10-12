import { computed, type Signal } from '@angular/core';

import type { CngxTabGroupHost, CngxTabHandle, injectTabsI18n } from '@cngx/common/tabs';

import type { CngxMatTabAggregatorErrorEntry } from './decoration-projectors';

/**
 * Builds the reactive list of tabs in error, in registration (DOM)
 * order. Gates on the handle's folded `hasError()` - the direct
 * `[cngxMatTabErrorFlag]` / `[error]` flag OR the bound aggregator's
 * reveal-gated `shouldShow()` - exactly as `<cngx-tab-group>` gates its
 * badge, so a deferred-reveal aggregator stays silent until revealed.
 * The descriptor phrase mirrors the native `statusPhrase` cascade:
 * aggregator announcement, then the direct-error message, then
 * `i18n.tabHasErrors(count)`. Feeds
 * {@link createMatTabAggregatorDecoration} for both the
 * `[cngxMatTabs]` (`<mat-tab-group>`) and `[cngxMatTabNav]`
 * (`<nav mat-tab-nav-bar>`) bridges - one body, two hosts (Pillar 3).
 *
 * Structural `equal` drops re-runs whose entry list is shape-identical
 * so the projector does not churn on no-op aggregator re-emissions.
 *
 * @internal
 */
export function createAggregatedErrorTabs(
  presenter: CngxTabGroupHost,
  i18n: ReturnType<typeof injectTabsI18n>,
): Signal<readonly CngxMatTabAggregatorErrorEntry[]> {
  // Same cascade as the native `statusPhrase`: an empty announcement or
  // message falls through, so a bare `true` flag still reads a phrase.
  const descriptorPhrase = (handle: CngxTabHandle, count: number): string => {
    const announcement = handle.errorAggregator()?.announcement();
    if (announcement) {
      return announcement;
    }
    const message = handle.errorMessage();
    if (message) {
      return message;
    }
    return i18n().tabHasErrors(count);
  };

  return computed<readonly CngxMatTabAggregatorErrorEntry[]>(
    () => {
      const tabs = presenter.tabs();
      const acc: CngxMatTabAggregatorErrorEntry[] = [];
      for (let i = 0; i < tabs.length; i++) {
        const handle = tabs[i];
        if (!handle.hasError()) {
          continue;
        }
        const count = handle.errorAggregator()?.errorCount() ?? 1;
        acc.push({
          idx: i,
          id: handle.id,
          announcement: descriptorPhrase(handle, count),
          count,
          label: handle.label() ?? '',
        });
      }
      return acc;
    },
    {
      equal: (a, b) => {
        if (a.length !== b.length) {
          return false;
        }
        for (let i = 0; i < a.length; i++) {
          if (
            a[i].idx !== b[i].idx ||
            a[i].id !== b[i].id ||
            a[i].announcement !== b[i].announcement ||
            a[i].count !== b[i].count ||
            a[i].label !== b[i].label
          ) {
            return false;
          }
        }
        return true;
      },
    },
  );
}
