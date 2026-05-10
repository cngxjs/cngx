import { Directive, inject, TemplateRef } from '@angular/core';

import type { CngxTabHandle } from '../tab-group-host.token';

/**
 * Context for the `*cngxTabBusySpinner` template. Renders only on
 * the in-flight commit target (matches `presenter.intendedIndex()`
 * with `commitState.status() === 'pending'`); the visibility gate
 * stays library-owned. `intendedIndex` is exposed so positional
 * variants (progress bars, step counters) read the same source.
 *
 * @category interactive
 */
export interface CngxTabBusySpinnerContext {
  /** The tab handle carrying id / label / disabled / aggregator signals. */
  readonly tab: CngxTabHandle;
  /** The flat-index of the in-flight commit target. */
  readonly intendedIndex: number;
}

/**
 * Structural slot for the busy-spinner template. 3-stage cascade:
 * per-instance directive >
 * `CNGX_TABS_CONFIG.templates.busySpinner` > built-in pulse span.
 *
 * @example
 * ```html
 * <cngx-tab-group>
 *   <ng-template cngxTabBusySpinner>
 *     <my-spinner size="sm" />
 *   </ng-template>
 * </cngx-tab-group>
 * ```
 *
 * @category interactive
 */
@Directive({
  selector: 'ng-template[cngxTabBusySpinner]',
  exportAs: 'cngxTabBusySpinner',
  standalone: true,
})
export class CngxTabBusySpinner {
  readonly templateRef = inject<TemplateRef<CngxTabBusySpinnerContext>>(
    TemplateRef,
  );
}
