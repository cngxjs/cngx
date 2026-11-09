import { NgComponentOutlet, NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  contentChild,
  inject,
  ViewEncapsulation,
} from '@angular/core';
import {
  CNGX_BUTTON_HOST_STATE,
  CngxButtonBrain,
  CngxButtonEnd,
  CngxButtonStart,
  provideButtonHost,
  type CngxButtonHostState,
} from '@cngx/common/button';
import {
  CNGX_ACTION_STATUS,
  CNGX_HOST_INTERACTION_STATE,
  CngxActionStatusBrain,
  CngxActionStatusCell,
  CngxAsyncClick,
  type CngxHostInteractionState,
} from '@cngx/common/interactive';
import type { CngxAsyncState } from '@cngx/core/utils';

import { CngxActionToast } from './action-toast.directive';

/**
 * Action button organism with built-in status communication, on the
 * cngx button brain.
 *
 * Sits on the native `<button>`. Host directives do the work: `CngxButtonBrain`
 * (`variant`, `tone`, `size`, `disabled` / `disabledReason`), `cngxAsyncClick`
 * (the run, the busy gate, the live region), `CngxActionStatusBrain` (labels,
 * announcement, `[externalState]`) and `CngxActionToast` (toasts). The
 * component is the skin: template, CSS and two providers that read
 * `CngxButtonBrain` and `CNGX_ACTION_STATUS`. `cngxButtonStart` /
 * `cngxButtonEnd` content sits around the label cells, and the button
 * publishes `CNGX_BUTTON_STATE`, so it works as the main action of a
 * `cngxSplitButton`.
 *
 * The label cells render stacked in one grid cell; only the active one is
 * visible and named, so the button keeps the width of its widest label. The
 * spinner and the pending label wait for the busy gate
 * (`CNGX_LOADING_CONFIG.showDelay`, held for `minDwell`; `[showDelay]` /
 * `[minDwell]` per button), so a fast run goes from idle straight to the result.
 *
 * Each settle (and each `[externalState]` edge) is spoken once in the region
 * next to the button: `succeededAnnouncement` / `failedAnnouncement`, then the
 * rendered result cell (template or label), then
 * `CNGX_INTERACTIVE_I18N.asyncClickSucceeded` / `asyncClickFailed`. An outcome
 * a shown toast announces is not spoken twice (`[autoAnnounce]="true"` speaks it).
 *
 * For full control, use `cngxButton` with `[cngxAsyncClick]` directly.
 *
 * ### Minimal (covers 80% of cases)
 * ```html
 * <button cngxActionButton tone="primary" [action]="save">Save</button>
 * ```
 *
 * ### With template slots
 * ```html
 * <button cngxActionButton [action]="save">
 *   Save Draft
 *   <ng-template cngxPending>Saving...</ng-template>
 *   <ng-template cngxSucceeded>Saved!</ng-template>
 *   <ng-template cngxFailed let-err>{{ err }} - retry?</ng-template>
 * </button>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/action-button/action-button.ts
 * @since 0.1.0
 * @relatedTo CngxButton, CngxButtonBrain, CngxAsyncClick, CngxActionStatusBrain, CngxActionToast, CngxPending, CngxSucceeded, CngxFailed, CngxToaster
 * @slot cngxPending Replaces the label while the action runs, once the run outlasts the show delay.
 * @slot cngxSucceeded Replaces the label after the action succeeds.
 * @slot cngxFailed Replaces the label when the action fails; gets the error.
 * <example-url>/#/ui/action-button/async-button/random-outcome</example-url>
 * <example-url>/#/ui/action-button/async-button/string-labels</example-url>
 * <example-url>/#/ui/action-button/async-button/template-slots</example-url>
 * @axis level organism
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- attribute selector by design (sits on the native button)
  selector: 'button[cngxActionButton]',
  standalone: true,
  imports: [NgComponentOutlet, NgTemplateOutlet, CngxActionStatusCell],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'cngxActionButton',
  hostDirectives: [
    {
      directive: CngxButtonBrain,
      inputs: [
        'variant: cngxActionButton',
        'tone',
        'size',
        'disabled',
        'disabledReason',
        'cngxDescribedBy',
        'type',
      ],
    },
    {
      directive: CngxAsyncClick,
      inputs: ['cngxAsyncClick: action', 'feedbackDuration', 'showDelay', 'minDwell'],
      outputs: ['settled'],
    },
    {
      directive: CngxActionStatusBrain,
      inputs: [
        'succeededAnnouncement',
        'failedAnnouncement',
        'autoAnnounce',
        'pendingLabel',
        'succeededLabel',
        'failedLabel',
        'externalState',
      ],
    },
    {
      directive: CngxActionToast,
      inputs: [
        'toastSuccess',
        'toastError',
        'toastErrorDetail',
        'toastSuccessDuration',
        'toastErrorDuration',
      ],
    },
  ],
  providers: [
    provideButtonHost('cngxActionButton', { defaultVariant: 'solid' }),
    // An external run in flight refuses clicks and reads as busy.
    {
      provide: CNGX_BUTTON_HOST_STATE,
      useFactory: (): CngxButtonHostState => {
        const status = inject(CNGX_ACTION_STATUS);
        return { refusing: status.externalBusy, busy: status.externalBusy };
      },
    },
    // Beats the brain's entry (host providers win); adds the announcement.
    {
      provide: CNGX_HOST_INTERACTION_STATE,
      useFactory: (): CngxHostInteractionState => ({
        ...inject(CngxButtonBrain).interaction,
        announcement: inject(CNGX_ACTION_STATUS).announcement,
      }),
    },
  ],
  host: {
    class: 'cngx-button cngx-action-button',
    '[attr.data-start]': 'startSlot() ? "" : null',
    '[attr.data-end]': 'endSlot() ? "" : null',
  },
  template: `
    <ng-content select="[cngxButtonStart]" />
    <span class="cngx-button__label cngx-action-button__labels">
      <span class="cngx-action-button__label" cngxActionStatusCell="idle"><ng-content /></span>
      @if (status.hasCell().pending) {
        <span class="cngx-action-button__label" cngxActionStatusCell="pending">
          @if (status.pendingTemplate(); as tpl) {
            <ng-container *ngTemplateOutlet="tpl.templateRef" />
          } @else {
            {{ status.pendingLabel() }}
          }
        </span>
      }
      @if (status.hasCell().success) {
        <span class="cngx-action-button__label" cngxActionStatusCell="success">
          @if (status.succeededTemplate(); as tpl) {
            <ng-container *ngTemplateOutlet="tpl.templateRef" />
          } @else {
            {{ status.succeededLabel() }}
          }
        </span>
      }
      @if (status.hasCell().error) {
        <span class="cngx-action-button__label" cngxActionStatusCell="error">
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
    <ng-content select="[cngxButtonEnd]" />
    @if (brain.busyVisible() && status.activeCell() === 'idle') {
      <span class="cngx-button__busy" aria-hidden="true">
        @if (brain.spinner; as spinner) {
          <ng-container *ngComponentOutlet="spinner" />
        } @else {
          <span class="cngx-button__spinner"></span>
        }
      </span>
    }
    @if (brain.disabledReason(); as reason) {
      <span class="cngx-button__reason" [id]="brain.reasonId" hidden>{{ reason }}</span>
    }
  `,
  styleUrls: ['../../common/button/button.component.css', './action-button.css'],
})
export class CngxActionButton {
  protected readonly brain = inject(CngxButtonBrain);
  protected readonly status = inject(CNGX_ACTION_STATUS);

  protected readonly startSlot = contentChild(CngxButtonStart);
  protected readonly endSlot = contentChild(CngxButtonEnd);

  /**
   * `CngxAsyncState` view of the effective lifecycle (`[externalState]` when
   * bound, else the run). Bind it to a state consumer: `[state]="btn.state"`.
   */
  readonly state: CngxAsyncState<unknown> = this.status.state;
}
