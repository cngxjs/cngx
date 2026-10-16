import { inject } from '@angular/core';
import { MatTab } from '@angular/material/tabs';

import { CNGX_TAB_GROUP_HOST, type CngxTabGroupHost } from '@cngx/common/tabs';
import { CngxRuntimeError } from '@cngx/utils';

import {
  CNGX_MAT_TABS_REGISTRY_HOST,
  type CngxMatTabsRegistryHost,
} from './mat-tabs-registry.directive';

/** What a per-tab error directive writes through: its tab and the group's registry. */
export interface CngxMatTabErrorTarget {
  readonly matTab: MatTab;
  readonly registry: CngxMatTabsRegistryHost;
  readonly presenter: CngxTabGroupHost;
}

/**
 * Inject the `<mat-tab>` a per-tab error directive sits on, plus the registry
 * and presenter of the surrounding `<mat-tab-group cngxMatTabs>`. Throws a
 * `CngxRuntimeError` with code `CNGX3020` when either prerequisite is
 * missing, in development and production alike. `selector` names the
 * directive in the development message.
 *
 * @internal
 */
export function injectMatTabErrorTarget(selector: string): CngxMatTabErrorTarget {
  const matTab = inject(MatTab, { self: true, optional: true });
  const registry = inject(CNGX_MAT_TABS_REGISTRY_HOST, { host: true, optional: true });
  const presenter = inject(CNGX_TAB_GROUP_HOST, { optional: true });
  if (!matTab || !registry || !presenter) {
    throw new CngxRuntimeError(
      'CNGX3020',
      typeof ngDevMode !== 'undefined' &&
        ngDevMode &&
        `[${selector}] must be placed on a <mat-tab> inside <mat-tab-group cngxMatTabs>.`,
    );
  }
  return { matTab, registry, presenter };
}
