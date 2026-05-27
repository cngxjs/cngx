import { InjectionToken, type Type } from '@angular/core';

import { CngxFilterBuilderBody } from './filter-builder-body.component';

/**
 * Swap token that selects the component class mounted as the recursive
 * body of `<cngx-filter-builder>`. The shell renders the resolved type via
 * `<ng-container *ngComponentOutlet="bodyType; inputs: { templates }">` so
 * consumers can replace the entire recursive renderer without forking the
 * shell.
 *
 * Default: `CngxFilterBuilderBody`. Override at root or component scope:
 *
 * ```ts
 * providers: [
 *   { provide: CNGX_FILTER_BUILDER_BODY_HOST, useValue: MyCompactBuilderBody },
 * ]
 * ```
 *
 * Replacements must accept the `templates: CngxFilterBuilderTemplateRegistry`
 * input the default body declares and read the host context through
 * `CNGX_FILTER_BUILDER_HOST`. Mirrors `CNGX_SELECT_PANEL_VIEW_HOST` in
 * `@cngx/forms/select`.
 *
 * @category forms/filter-builder
 */
export const CNGX_FILTER_BUILDER_BODY_HOST = new InjectionToken<Type<unknown>>(
  'CngxFilterBuilderBodyHost',
  { providedIn: 'root', factory: () => CngxFilterBuilderBody },
);
