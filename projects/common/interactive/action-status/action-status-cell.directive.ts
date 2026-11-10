import {
  computed,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
  type OnInit,
} from '@angular/core';

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
 *   <span class="my-label" cngxActionStatusCell="success">{{ status.succeededLabel() }}</span>
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
export class CngxActionStatusCell implements OnInit {
  private readonly status = inject(CNGX_ACTION_STATUS);
  private readonly element = inject<ElementRef<Element>>(ElementRef).nativeElement;
  private readonly destroyRef = inject(DestroyRef);

  /** Which cell this element is. */
  readonly kind = input.required<CngxActionStatusCellKind>({ alias: 'cngxActionStatusCell' });

  protected readonly active = computed(() => this.status.activeCell() === this.kind());

  ngOnInit(): void {
    // The kind is an input, so it is known from here on, not at construction.
    const kind = this.kind();
    if (kind !== 'success' && kind !== 'error') {
      return;
    }
    this.status.registerCell(kind, this.element);
    this.destroyRef.onDestroy(() => this.status.unregisterCell(kind, this.element));
  }
}
