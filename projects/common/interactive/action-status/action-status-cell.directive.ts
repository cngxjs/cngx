import { computed, Directive, effect, ElementRef, inject, input, untracked } from '@angular/core';

import { CNGX_ACTION_STATUS, type CngxActionStatusCellKind } from './action-status.token';

/**
 * One label cell of an action host template. Binds `data-active` and
 * `aria-hidden` from `CNGX_ACTION_STATUS.activeCell`, so only the active
 * cell is visible and names the host; the others stay mounted (the host
 * keeps the width of its widest label). The `success` and `error` cells
 * register their element on the contract, so the settle announcement reads
 * the rendered result text, also while the busy visual still hides it.
 *
 * The cell carries `.cngx-action-status-cell`. `CngxActionStatusStack`
 * renders the cells and its sheet stacks them in one grid cell and hides
 * the inactive ones (`visibility: hidden`); a host that writes its cells by
 * hand brings that rule itself.
 *
 * ```html
 * <span class="my-label" cngxActionStatusCell="idle"><ng-content /></span>
 * @if (status.hasCell().success) {
 *   <span class="my-label" cngxActionStatusCell="success">{{ status.succeededText() }}</span>
 * }
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/action-status/action-status-cell.directive.ts
 * @since 0.1.0
 * @relatedTo CngxActionStatusBrain, CNGX_ACTION_STATUS
 * <example-url>/#/ui/action-button/async-button/ejected-host</example-url>
 * @axis level atom
 */
@Directive({
  selector: '[cngxActionStatusCell]',
  standalone: true,
  host: {
    class: 'cngx-action-status-cell',
    '[attr.data-active]': 'active() ? "" : null',
    '[attr.aria-hidden]': 'active() ? null : "true"',
  },
})
export class CngxActionStatusCell {
  private readonly status = inject(CNGX_ACTION_STATUS);
  private readonly element = inject<ElementRef<Element>>(ElementRef).nativeElement;

  /** Which cell this element is. */
  readonly kind = input.required<CngxActionStatusCellKind>({ alias: 'cngxActionStatusCell' });

  protected readonly active = computed(() => this.status.activeCell() === this.kind());

  constructor() {
    // Follows the bound kind: a change unregisters the old result cell
    // before the new one registers; destroy runs the same cleanup.
    effect((onCleanup) => {
      const kind = this.kind();
      if (kind !== 'success' && kind !== 'error') {
        return;
      }
      untracked(() => this.status.registerCell(kind, this.element));
      onCleanup(() => this.status.unregisterCell(kind, this.element));
    });
  }
}
