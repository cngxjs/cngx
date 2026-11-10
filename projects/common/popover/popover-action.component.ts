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

import { CngxPopoverCloseOnSuccess } from './popover-close-on-success.directive';

/**
 * Async confirm button for a `cngx-popover-panel` footer. A
 * `CngxButtonBrain` host on the native `<button>` with `cngxAsyncClick`
 * co-hosted: `[action]` (required) runs on click, and the button stylesheet
 * paints it. The variant is the selector's own value (default `outline`),
 * `tone` and `size` are inputs, and the size is pinned to `sm` against the
 * group and the config (the input still wins). Tone comes from the button
 * family, not from the panel variant. To close without a run, use
 * `button[cngxPopoverDismiss]`.
 *
 * `disabled` renders `aria-disabled="true"`, keeps the button focusable,
 * refuses the run and references a `disabledReason` through
 * `aria-describedby`. `aria-busy`, `data-pending` and `data-busy` come from
 * the brain over the co-hosted run.
 *
 * Supports the `cngxPending` / `cngxSucceeded` / `cngxFailed` templates and
 * the `pendingLabel` / `succeededLabel` / `failedLabel` strings of
 * `CngxActionButton`, or use `status()` + `@switch` for full control.
 * `[externalState]` reflects a run started elsewhere, `(outcome)` emits once
 * per own settle and per external `success` / `error` edge. The
 * label follows the busy gate (`CNGX_LOADING_CONFIG.showDelay`, held for
 * `minDwell`; `[showDelay]` / `[minDwell]` per button): while the busy
 * visual shows, through the run and its dwell after the settle, the pending
 * template stays visible with no spinner, and without one the spinner covers
 * the idle label. The result templates show once the busy visual releases, so
 * a fast run goes from the idle label straight to the result. Every label
 * cell stays mounted in one grid cell (the inactive ones `visibility: hidden`
 * and `aria-hidden`), so the button keeps the width of its widest label and a
 * right-aligned footer never shifts; the active cell alone names it. `status()`
 * stays immediate; branch a hand-rolled `@switch` on {@link busyVisible} for
 * the same timing.
 *
 * The status layer comes from the `CngxActionStatusBrain` host directive
 * (read through `CNGX_ACTION_STATUS`) and close-on-success from the
 * `CngxPopoverCloseOnSuccess` host directive; the component is the skin.
 * Each settle is spoken once through the `cngxAsyncClick` live region next
 * to the button: `succeededAnnouncement` / `failedAnnouncement`, else the
 * text of the rendered result template (`aria-hidden` parts skipped; read
 * from its cell even while the dwell still hides it), else
 * `CNGX_INTERACTIVE_I18N.asyncClickSucceeded` / `asyncClickFailed`.
 * `[autoAnnounce]="false"` keeps the region empty. Under
 * `withCloseOnSuccess()` the panel closes once per success; focus returns
 * to the trigger through the panel's restore claim; `[closeOnSuccessDelay]`
 * overrides the config per confirm (`null` turns it off). A success that closes
 * the panel is spoken through `CngxLiveAnnouncer` outside it instead (the
 * sibling region hides with the panel), still once.
 *
 * Migration from `cngx-popover-action`: `variant="primary"` is
 * `cngxPopoverAction="solid" tone="primary"`, `variant="danger"` is
 * `cngxPopoverAction="solid" tone="danger"`, `variant="ghost"` is
 * `cngxPopoverAction="ghost"`, `variant="secondary"` is the default
 * `outline`; `role="dismiss"` is `button[cngxPopoverDismiss]`.
 *
 * ### Confirm with templates
 * ```html
 * <button cngxPopoverAction="solid" tone="primary" [action]="save">
 *   Save
 *   <ng-template cngxPending>Saving...</ng-template>
 *   <ng-template cngxSucceeded>Saved!</ng-template>
 *   <ng-template cngxFailed let-err>{{ err }}</ng-template>
 * </button>
 * ```
 *
 * ### With @switch
 * ```html
 * <button cngxPopoverAction [action]="save" #act="cngxPopoverAction">
 *   @switch (act.status()) {
 *     @case ('pending') { Saving... }
 *     @case ('success') { Done }
 *     @default { Save }
 *   }
 * </button>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/popover/popover-action.component.ts
 * @since 0.1.0
 * @relatedTo CngxPopoverDismiss, CngxPopoverPanel, CngxPopoverFooter, CngxButtonBrain, CngxAsyncClick, CngxActionStatusBrain, CngxPopoverCloseOnSuccess
 * @slot cngxPending Replaces the label while the action runs, once the run outlasts the show delay.
 * @slot cngxSucceeded Replaces the label after the action succeeds, once the busy visual releases.
 * @slot cngxFailed Replaces the label when the action fails, once the busy visual releases; gets the error.
 * <example-url>/#/common/popover/popover-panel/with-footer-actions</example-url>
 * <example-url>/#/common/popover/popover-panel/with-dividers</example-url>
 * <example-url>/#/common/popover/popover-panel/footer-actions-plain</example-url>
 * <example-url>/#/common/popover/popover-panel/close-on-success</example-url>
 * @axis level molecule
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- attribute selector by design (sits on the native button)
  selector: 'button[cngxPopoverAction]',
  standalone: true,
  imports: [NgComponentOutlet, CngxActionStatusStack],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'cngxPopoverAction',
  hostDirectives: [
    {
      directive: CngxButtonBrain,
      inputs: [
        'variant: cngxPopoverAction',
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
    { directive: CngxPopoverCloseOnSuccess, inputs: ['closeOnSuccessDelay'] },
  ],
  providers: [
    provideButtonHost('cngxPopoverAction', { defaultVariant: 'outline', fixed: { size: 'sm' } }),
    provideActionStatusHost(),
  ],
  host: {
    class: 'cngx-button cngx-popover-action',
    '[attr.data-start]': 'startSlot() ? "" : null',
    '[attr.data-end]': 'endSlot() ? "" : null',
  },
  template: `
    <ng-content select="[cngxButtonStart]" />
    <span
      class="cngx-button__label cngx-popover-action__labels"
      cngxActionStatusStack
      cellClass="cngx-popover-action__label"
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
  styleUrls: ['../button/button.component.css', './popover-action.component.css'],
})
export class CngxPopoverAction {
  protected readonly brain = inject(CngxButtonBrain);
  protected readonly actionStatus = inject(CNGX_ACTION_STATUS);

  protected readonly startSlot = contentChild(CngxButtonStart);
  protected readonly endSlot = contentChild(CngxButtonEnd);

  /**
   * Effective status - `'idle' | 'pending' | 'success' | 'error'`:
   * `[externalState]` when bound, else the run. Immediate, not gated.
   */
  readonly status: Signal<AsyncStatus> = this.actionStatus.status;

  /**
   * `true` while the busy visual shows: the run after the loading config's
   * show delay, held for its min-dwell.
   */
  readonly busyVisible: Signal<boolean> = this.brain.busyVisible;

  /**
   * `CngxAsyncState` view of the effective lifecycle (`[externalState]` when
   * bound, else the run). Bind it to a state consumer: `[state]="act.state"`
   * on `cngxToastOn` or `cngxAlertOn`.
   */
  readonly state: CngxAsyncState<unknown> = this.actionStatus.state;
}
