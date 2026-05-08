import { Directive, inject, TemplateRef } from '@angular/core';

import type { CngxTabHandle } from '../tab-group-host.token';

/**
 * Context passed to the `*cngxTabBusySpinner` template. Drives the
 * commit-pending spinner overlay rendered inside the tab button
 * that is the in-flight commit target. Consumers swap the built-in
 * `<span class="cngx-tabs__busy-spinner">` for a branded spinner, a
 * CSS animation, or a `<cngx-skeleton>` while the visibility gate
 * stays library-owned (the slot only renders when the tab matches
 * `presenter.intendedIndex()` with
 * `commitState.status() === 'pending'`).
 *
 * `intendedIndex` mirrors the value consumed by `isTabBusy(tab)` —
 * exposed on the context so consumer templates that need to vary the
 * spinner per-position (progress bars, step counters) read the same
 * source of truth without re-querying the presenter.
 *
 * Mirrors the family-standard `CngxStepBusySpinnerContext` shape
 * (extended with `intendedIndex` for tab-specific positional cues).
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
 * Structural slot directive marking the busy-spinner template for
 * `<cngx-tab-group>`. Discovered via `contentChild` on the organism;
 * cascades through `CNGX_TABS_CONFIG.templates.busySpinner` before
 * falling back to the built-in pulse-animation span.
 *
 * Pure marker — zero logic. Holds only a typed
 * {@link TemplateRef} reference. Mirrors the family-standard slot
 * pattern.
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
