import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, ViewEncapsulation } from '@angular/core';

import { CngxButtonBrain, provideActionStatusHost, provideButtonHost } from '@cngx/common/button';
import {
  CNGX_ACTION_STATUS,
  CngxActionStatusBrain,
  CngxActionStatusCell,
  CngxAsyncClick,
} from '@cngx/common/interactive';

/**
 * Fixture for `ejected-host.story.ts`: an app-written action button on the
 * brain directives alone. `CngxButtonBrain` owns `aria-disabled`, the
 * activation guard and `data-busy`; `CngxAsyncClick` runs the action and
 * owns the live region; `CngxActionStatusBrain` picks the visible label
 * cell and the settle announcement. `provideActionStatusHost()` wires the
 * announcement into the region. The host keeps its template, the label
 * cells and its own CSS, including the stack rule the cells need outside
 * the cngx button sheet.
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- attribute selector by design (sits on the native button)
  selector: 'button[demoEjectedAction]',
  standalone: true,
  imports: [NgTemplateOutlet, CngxActionStatusCell],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [
    {
      directive: CngxButtonBrain,
      inputs: ['variant: demoEjectedAction', 'disabled', 'disabledReason'],
    },
    { directive: CngxAsyncClick, inputs: ['cngxAsyncClick: action'] },
    {
      directive: CngxActionStatusBrain,
      inputs: ['pendingLabel', 'succeededLabel', 'failedLabel', 'externalState'],
      outputs: ['outcome'],
    },
  ],
  providers: [
    provideButtonHost('demoEjectedAction', { defaultVariant: 'outline' }),
    provideActionStatusHost(),
  ],
  host: { class: 'demo-ejected-action' },
  template: `
    <span class="demo-ejected-action__cells">
      <span cngxActionStatusCell="idle"><ng-content /></span>
      @if (status.hasCell().pending) {
        <span cngxActionStatusCell="pending">{{ status.pendingLabel() }}</span>
      }
      @if (status.hasCell().success) {
        <span cngxActionStatusCell="success">
          @if (status.succeededTemplate(); as tpl) {
            <ng-container *ngTemplateOutlet="tpl.templateRef" />
          } @else {
            {{ status.succeededLabel() }}
          }
        </span>
      }
      @if (status.hasCell().error) {
        <span cngxActionStatusCell="error">
          @if (status.failedTemplate(); as tpl) {
            <ng-container
              *ngTemplateOutlet="tpl.templateRef; context: { $implicit: status.error() }"
            />
          } @else {
            {{ status.failedLabel() }}
          }
        </span>
      }
    </span>
    @if (brain.disabledReason(); as reason) {
      <span [id]="brain.reasonId" hidden>{{ reason }}</span>
    }
  `,
  styles: `
    .demo-ejected-action {
      display: inline-flex;
      align-items: center;
      min-block-size: var(--cngx-target-min, 32px);
      padding-inline: var(--cngx-space-3, 12px);
      border: 1px dashed var(--cngx-color-border, #d1d5db);
      border-radius: var(--cngx-radius-md, 6px);
      background: var(--cngx-color-surface, #fff);
      color: var(--cngx-color-text, #1f2937);
      font: inherit;
      cursor: pointer;
    }
    .demo-ejected-action[data-busy] {
      cursor: progress;
    }
    .demo-ejected-action[aria-disabled='true']:not([data-busy], [data-pending]) {
      color: var(--cngx-color-text-muted, #6b7280);
      cursor: not-allowed;
    }
    /* The stack the cngx button sheet ships: one grid cell, widest label wins. */
    .demo-ejected-action__cells {
      display: inline-grid;
      align-items: center;
      justify-items: center;
    }
    .demo-ejected-action .cngx-action-status-cell {
      grid-area: 1 / 1;
    }
    .demo-ejected-action .cngx-action-status-cell:not([data-active]) {
      visibility: hidden;
    }
    @media (forced-colors: active) {
      .demo-ejected-action {
        border-color: ButtonText;
      }
    }
  `,
})
export class EjectedAction {
  protected readonly brain = inject(CngxButtonBrain);
  protected readonly status = inject(CNGX_ACTION_STATUS);
}
