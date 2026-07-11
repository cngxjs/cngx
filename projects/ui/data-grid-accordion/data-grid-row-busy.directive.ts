import { Directive, inject, TemplateRef } from '@angular/core';

import type { CngxDgaRowStateContext } from './data-grid-row-state-context';

/**
 * Structural slot for a {@link CngxDataGridRow}'s busy state. The row renders it
 * inside the detail region while the row's `[state]` is `loading` (a first-load
 * skeleton that replaces the body) or `refreshing` (a subtle overlay with the body
 * kept mounted). Absent, the row falls back to its CSS skeleton default.
 *
 * The region already carries `aria-busy` as a `computed()`, so the busy visual is
 * decorative (`aria-hidden`); assistive tech learns the busy state from `aria-busy`,
 * not from this template. The template receives a {@link CngxDgaRowStateContext}
 * whose `$implicit` is the current status (`loading` / `refreshing`), so one
 * override can distinguish the two.
 *
 * ```html
 * <cngx-dga-row [state]="report.status()">
 *   <span cngxDgaCell primary>Report</span>
 *   <ng-template cngxDgaRowBusy let-status><my-skeleton [dim]="status === 'refreshing'" /></ng-template>
 *   {{ report.data() }}
 * </cngx-dga-row>
 * ```
 *
 * @category ui/data-grid-accordion
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/data-grid-accordion/data-grid-row-busy.directive.ts
 * @since 0.1.0
 * @relatedTo CngxDataGridRow, CngxDgaRowError
 */
@Directive({
  selector: 'ng-template[cngxDgaRowBusy]',
  exportAs: 'cngxDgaRowBusy',
  standalone: true,
})
export class CngxDgaRowBusy {
  readonly templateRef = inject(TemplateRef<CngxDgaRowStateContext>);

  static ngTemplateContextGuard(
    _dir: CngxDgaRowBusy,
    ctx: unknown,
  ): ctx is CngxDgaRowStateContext {
    return true;
  }
}
