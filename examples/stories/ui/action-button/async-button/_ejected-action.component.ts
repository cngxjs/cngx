import { ChangeDetectionStrategy, Component, inject, ViewEncapsulation } from '@angular/core';

import { CngxButtonBrain, provideActionStatusHost, provideButtonHost } from '@cngx/common/button';
import {
  CngxActionStatusBrain,
  CngxActionStatusStack,
  CngxAsyncClick,
} from '@cngx/common/interactive';

/**
 * Fixture for `ejected-host.story.ts`: an app-written action button on the
 * brain directives alone. `CngxButtonBrain` owns `aria-disabled`, the
 * activation guard and `data-busy`; `CngxAsyncClick` runs the action and
 * owns the live region; `CngxActionStatusBrain` picks the visible label
 * cell and the settle announcement. `provideActionStatusHost()` wires the
 * announcement into the region. `CngxActionStatusStack` renders the label
 * cells on the host's own label span and ships the one-grid-cell stack
 * rule. The host keeps its template and its own look.
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- attribute selector by design (sits on the native button)
  selector: 'button[appEjectedAction]',
  standalone: true,
  imports: [CngxActionStatusStack],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [
    {
      directive: CngxButtonBrain,
      inputs: ['variant: appEjectedAction', 'disabled', 'disabledReason'],
    },
    { directive: CngxAsyncClick, inputs: ['cngxAsyncClick: action'] },
    {
      directive: CngxActionStatusBrain,
      inputs: ['pendingLabel', 'succeededLabel', 'failedLabel', 'externalState'],
      outputs: ['outcome'],
    },
  ],
  providers: [
    provideButtonHost('appEjectedAction', { defaultVariant: 'outline' }),
    provideActionStatusHost(),
  ],
  host: { class: 'app-ejected-action' },
  template: `
    <span cngxActionStatusStack>
      <ng-content />
    </span>
    @if (brain.disabledReason(); as reason) {
      <span [id]="brain.reasonId" hidden>{{ reason }}</span>
    }
  `,
  styles: `
    .app-ejected-action {
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
    .app-ejected-action[data-busy] {
      cursor: progress;
    }
    .app-ejected-action[aria-disabled='true']:not([data-busy], [data-pending]) {
      color: var(--cngx-color-text-muted, #6b7280);
      cursor: not-allowed;
    }
    @media (forced-colors: active) {
      .app-ejected-action {
        border-color: ButtonText;
      }
    }
  `,
})
export class EjectedAction {
  protected readonly brain = inject(CngxButtonBrain);
}
