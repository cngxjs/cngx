import { NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  contentChild,
  inject,
  ViewEncapsulation,
  type Signal,
} from '@angular/core';
import {
  CngxButtonBrain,
  CngxButtonEnd,
  CngxButtonStart,
  provideActionStatusHost,
  provideButtonHost,
} from '@cngx/common/button';
import {
  CNGX_ACTION_STATUS,
  CngxActionStatusBrain,
  CngxActionStatusStack,
  CngxAsyncClick,
} from '@cngx/common/interactive';
import type { AsyncStatus, CngxAsyncState } from '@cngx/core/utils';

import { CngxActionToast } from './action-toast.directive';

/**
 * Async action button on the cngx button brain. Runs an action on click and reports the
 * outcome in its label, in a live region and, with the toast inputs, in a toast.
 *
 * Reach for it over `cngxButton` with `[cngxAsyncClick]` when the label should change per
 * outcome, when the button reflects an `[externalState]` it does not own, or when the outcome
 * raises a toast. Variant, tone, size, `disabled` with a reason and the busy layer work as on
 * `cngxButton`.
 *
 * The labels sit stacked in one cell, so the button keeps the width of its widest label. The
 * pending label shows with the busy visual. The result label shows once it releases, and
 * `aria-busy` and the click guard hold until then. Each outcome is spoken once in the live
 * region next to the button, in the words the button shows.
 *
 * The English language pack has no status labels. Without a bound label, a template or
 * `withActionStatusLabels` the visible label never changes and only the live region reports
 * the outcome. The slot directives come from `@cngx/common/interactive`.
 *
 * `cngxButtonStart` / `cngxButtonEnd` content sits around the label. The button publishes
 * `CNGX_BUTTON_STATE`, so it can be the main action of a `cngxSplitButton`.
 *
 * For your own markup, eject: list `CngxButtonBrain`, `CngxAsyncClick`, `CngxActionStatusBrain`
 * and `CngxActionToast` in `hostDirectives` with `provideButtonHost()` and
 * `provideActionStatusHost()`. A bare `cngxButton` with `[cngxAsyncClick]` has no status cells.
 *
 * ### Minimal
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
 * @relatedTo CngxButton, CngxButtonBrain, CngxAsyncClick, CngxActionStatusBrain, CngxActionToast, CngxPending, CngxSucceeded, CngxFailed, CngxSplitButton, CngxToastOn, withActionStatusLabels, withActionStatusTemplates, CngxPopoverAction
 * @slot cngxPending Replaces the label while the action runs, once the run outlasts the show delay.
 * @slot cngxSucceeded Replaces the label after the action succeeds, once the busy visual releases.
 * @slot cngxFailed Replaces the label when the action fails, once the busy visual releases; gets the error.
 * <example-url>/#/ui/action-button/async-button/random-outcome</example-url>
 * <example-url>/#/ui/action-button/async-button/string-labels</example-url>
 * <example-url>/#/ui/action-button/async-button/template-slots</example-url>
 * @axis level organism
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- attribute selector by design (sits on the native button)
  selector: 'button[cngxActionButton]',
  standalone: true,
  imports: [NgComponentOutlet, CngxActionStatusStack],
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
      outputs: ['outcome'],
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
    provideActionStatusHost(),
  ],
  host: {
    class: 'cngx-button cngx-action-button',
    '[attr.data-start]': 'startSlot() ? "" : null',
    '[attr.data-end]': 'endSlot() ? "" : null',
  },
  template: `
    <ng-content select="[cngxButtonStart]" />
    <span
      class="cngx-button__label cngx-action-button__labels"
      cngxActionStatusStack
      cellClass="cngx-action-button__label"
    >
      <ng-content />
    </span>
    <ng-content select="[cngxButtonEnd]" />
    @if (brain.busyVisible() && actionStatus.activeCell() === 'idle') {
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
  protected readonly actionStatus = inject(CNGX_ACTION_STATUS);

  protected readonly startSlot = contentChild(CngxButtonStart);
  protected readonly endSlot = contentChild(CngxButtonEnd);

  /** Effective status: `[externalState]` when bound, else the run. Immediate, not gated. */
  readonly status: Signal<AsyncStatus> = this.actionStatus.status;

  /** `true` while the busy visual shows (the run after the show delay, held for its min-dwell). */
  readonly busyVisible: Signal<boolean> = this.brain.busyVisible;

  /**
   * `CngxAsyncState` view of the effective lifecycle (`[externalState]` when
   * bound, else the run). Bind it to a state consumer: `[state]="btn.state"`.
   * `lastUpdated` is the last successful own run, or the bound state's value
   * with no fall back to own runs.
   */
  readonly state: CngxAsyncState<unknown> = this.actionStatus.state;
}
