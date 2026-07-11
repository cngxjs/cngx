import { Directive, inject, TemplateRef } from '@angular/core';

import type { CngxDgaRowStateContext } from './data-grid-row-state-context';

/**
 * Structural slot for a {@link CngxDataGridRow}'s error state. The row renders it
 * inside the detail region, in a `role="alert"` container, when the row's `[state]`
 * is `error` - so the error body is announced to assistive tech the moment it
 * appears, even if the row was never expanded. Absent, the row renders a minimal
 * CSS error affordance with the resolved `errorMessage`.
 *
 * The template receives a {@link CngxDgaRowStateContext} whose `message` is the
 * resolved error string, so the override can render the announced text (and a
 * retry) without re-deriving it.
 *
 * ```html
 * <cngx-dga-row [state]="report.status()">
 *   <span cngxDgaCell primary>Report</span>
 *   <ng-template cngxDgaRowError let-message="message">
 *     {{ message }} <button type="button" (click)="retry()">Retry</button>
 *   </ng-template>
 * </cngx-dga-row>
 * ```
 *
 * @category ui/data-grid-accordion
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/data-grid-accordion/data-grid-row-error.directive.ts
 * @since 0.1.0
 * @relatedTo CngxDataGridRow, CngxDgaRowBusy
 */
@Directive({
  selector: 'ng-template[cngxDgaRowError]',
  exportAs: 'cngxDgaRowError',
  standalone: true,
})
export class CngxDgaRowError {
  readonly templateRef = inject(TemplateRef<CngxDgaRowStateContext>);

  static ngTemplateContextGuard(
    _dir: CngxDgaRowError,
    ctx: unknown,
  ): ctx is CngxDgaRowStateContext {
    return true;
  }
}
