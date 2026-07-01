import { InjectionToken } from '@angular/core';

import { createBreadcrumbCollapse, type CngxBreadcrumbCollapseStrategy } from './breadcrumb-collapse';

/**
 * DI token for the breadcrumb collapse rule. Defaults to
 * {@link createBreadcrumbCollapse} (keep the first crumb + the last
 * `maxVisible - 1`). Override it in `providers` (app-wide) or `viewProviders`
 * (per {@link CngxBreadcrumb} instance) to swap the rule - width-aware,
 * keep-first-N, mobile parent-only - without forking the coordinator.
 *
 * ```ts
 * viewProviders: [{
 *   provide: CNGX_BREADCRUMB_COLLAPSE_STRATEGY,
 *   useValue: (total, max) => new Set(range(2, total - 2)),
 * }]
 * ```
 *
 * @category common/interactive/breadcrumb
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/breadcrumb/breadcrumb-collapse.token.ts
 * @since 0.1.0
 * @relatedTo CngxBreadcrumb, createBreadcrumbCollapse
 */
export const CNGX_BREADCRUMB_COLLAPSE_STRATEGY = new InjectionToken<CngxBreadcrumbCollapseStrategy>(
  'CNGX_BREADCRUMB_COLLAPSE_STRATEGY',
  { providedIn: 'root', factory: () => createBreadcrumbCollapse() },
);
