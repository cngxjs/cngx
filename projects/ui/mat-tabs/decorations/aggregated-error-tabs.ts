import { computed, type Signal } from '@angular/core';

import type { CngxTabGroupHost } from '@cngx/common/tabs';

import type { CngxMatTabAggregatorErrorEntry } from './decoration-projectors';

/**
 * Builds the reactive list of tabs whose bound error-aggregator wants
 * reveal, in registration (DOM) order. Feeds
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
): Signal<readonly CngxMatTabAggregatorErrorEntry[]> {
  return computed<readonly CngxMatTabAggregatorErrorEntry[]>(
    () => {
      const tabs = presenter.tabs();
      const acc: CngxMatTabAggregatorErrorEntry[] = [];
      for (let i = 0; i < tabs.length; i++) {
        const handle = tabs[i];
        const aggregator = handle.errorAggregator();
        if (aggregator?.shouldShow()) {
          acc.push({
            idx: i,
            id: handle.id,
            announcement: aggregator.announcement(),
            count: aggregator.errorCount(),
            label: handle.label() ?? '',
          });
        }
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
