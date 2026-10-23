import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  ViewEncapsulation,
  computed,
  inject,
} from '@angular/core';
import { nextUid } from '@cngx/core/utils';

import { CNGX_TREE_SELECT_PANEL_HOST } from './tree-select-panel-host';
import type { CngxTreeSelectFooterContext } from './tree-select.model';

/**
 * Footer below the tree: the selected count and a clear-all action. The
 * button stays focusable while nothing is selected (`aria-disabled`, the
 * count as its description), so a keyboard clear never drops focus to the
 * body. A press keeps focus where it is, like a press on a tree row.
 *
 * @internal
 */
@Component({
  selector: 'cngx-tree-select-footer',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  imports: [NgTemplateOutlet],
  template: `
    @if (host.footerTpl(); as tpl) {
      <ng-container *ngTemplateOutlet="tpl; context: context()" />
    } @else {
      <div class="cngx-tree-select__footer" (mousedown)="$event.preventDefault()">
        <span class="cngx-tree-select__footer-count" [id]="countId">{{ countText() }}</span>
        <button
          type="button"
          class="cngx-tree-select__footer-clear"
          [attr.aria-disabled]="empty() ? 'true' : null"
          [attr.aria-describedby]="empty() ? countId : null"
          (click)="clear()"
        >
          {{ host.clearAllLabel() }}
        </button>
      </div>
    }
  `,
})
export class CngxTreeSelectFooterBar {
  protected readonly host = inject(CNGX_TREE_SELECT_PANEL_HOST);
  protected readonly countId = nextUid('cngx-tree-select-footer-count');
  protected readonly countText = this.host.selectionCountText;
  protected readonly empty = computed(() => this.host.selectionCount() === 0);
  protected readonly clear = (): void => {
    if (!this.empty()) {
      this.host.clearAllInPanel();
    }
  };
  protected readonly context = computed<CngxTreeSelectFooterContext>(() => ({
    $implicit: this.host.selectionCount(),
    count: this.host.selectionCount(),
    countText: this.countText(),
    clear: this.clear,
    clearLabel: this.host.clearAllLabel(),
    empty: this.empty(),
  }));
}
