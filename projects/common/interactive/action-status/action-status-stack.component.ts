import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';

import { CngxActionStatusCell } from './action-status-cell.directive';
import { CNGX_ACTION_STATUS } from './action-status.token';

/**
 * The label cells of an action host, rendered from `CNGX_ACTION_STATUS`:
 * the `idle` cell with the host's projected content, then the `pending`,
 * `success` and `error` cells the brain's `hasCell()` asks for. A cell
 * shows its `cngxPending` / `cngxSucceeded` / `cngxFailed` template when
 * one is projected (`cngxFailed` gets the error as `$implicit`), else the
 * matching label input. Each cell is a `CngxActionStatusCell`.
 *
 * An attribute component that sits on the host's label element and renders
 * the cells as its direct children, with no wrapper, so a host rule on the
 * label element (`.cngx-button__label` in the button sheet) reaches them.
 * Its own sheet stacks the cells in one grid cell and hides the inactive
 * ones (`.cngx-action-status-stack`), so a host outside the button family
 * needs no stack rule of its own.
 * `cellClass` puts the host's own class on every cell, next to the
 * `.cngx-action-status-cell` hook.
 *
 * ```html
 * <span class="cngx-button__label" cngxActionStatusStack cellClass="my-action__label">
 *   <ng-content />
 * </span>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/action-status/action-status-stack.component.ts
 * @since 0.1.0
 * @relatedTo CngxActionStatusCell, CngxActionStatusBrain, CNGX_ACTION_STATUS, CngxPending, CngxSucceeded, CngxFailed
 * <example-url>/#/ui/action-button/async-button/ejected-host</example-url>
 * @axis level molecule
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- attribute selector by design (sits on the host's label element)
  selector: 'span[cngxActionStatusStack]',
  standalone: true,
  imports: [NgTemplateOutlet, CngxActionStatusCell],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: { class: 'cngx-action-status-stack' },
  styleUrl: './action-status-stack.component.css',
  template: `
    <span [class]="cellClass()" cngxActionStatusCell="idle"><ng-content /></span>
    @if (status.hasCell().pending) {
      <span [class]="cellClass()" cngxActionStatusCell="pending">
        @if (status.pendingTemplate(); as tpl) {
          <ng-container *ngTemplateOutlet="tpl.templateRef" />
        } @else {
          {{ status.pendingLabel() }}
        }
      </span>
    }
    @if (status.hasCell().success) {
      <span [class]="cellClass()" cngxActionStatusCell="success">
        @if (status.succeededTemplate(); as tpl) {
          <ng-container *ngTemplateOutlet="tpl.templateRef" />
        } @else {
          {{ status.succeededLabel() }}
        }
      </span>
    }
    @if (status.hasCell().error) {
      <span [class]="cellClass()" cngxActionStatusCell="error">
        @if (status.failedTemplate(); as tpl) {
          <ng-container
            *ngTemplateOutlet="tpl.templateRef; context: { $implicit: status.error() }"
          />
        } @else {
          {{ status.failedLabel() }}
        }
      </span>
    }
  `,
})
export class CngxActionStatusStack {
  protected readonly status = inject(CNGX_ACTION_STATUS);

  /** Class put on every cell, the host's theming hook (`cngx-action-button__label`). */
  readonly cellClass = input<string | undefined>(undefined);
}
