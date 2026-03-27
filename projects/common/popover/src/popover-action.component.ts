import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  contentChild,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';
import {
  CngxAsyncClick,
  CngxFailed,
  CngxPending,
  CngxSucceeded,
  type AsyncAction,
} from '@cngx/common/interactive';

import { CngxPopover } from './popover.directive';

/** Visual variant for the action button. */
export type PopoverActionVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

/**
 * Action button for use inside `cngx-popover-panel` footer.
 *
 * Two roles:
 * - `'dismiss'` — closes the panel on click (no async action).
 * - `'confirm'` — executes an async action, shows status templates,
 *   optionally auto-closes the panel on success.
 *
 * Supports the same `cngxPending`/`cngxSucceeded`/`cngxFailed` templates
 * as `CngxActionButton`, or use `status()` + `@switch` for full control.
 *
 * @usageNotes
 *
 * ### Dismiss button
 * ```html
 * <cngx-popover-action role="dismiss">Cancel</cngx-popover-action>
 * ```
 *
 * ### Confirm with templates
 * ```html
 * <cngx-popover-action role="confirm" [action]="save" variant="primary">
 *   Save
 *   <ng-template cngxPending>Saving...</ng-template>
 *   <ng-template cngxSucceeded>Saved!</ng-template>
 *   <ng-template cngxFailed let-err>{{ err }}</ng-template>
 * </cngx-popover-action>
 * ```
 *
 * ### With @switch
 * ```html
 * <cngx-popover-action role="confirm" [action]="save" #act="cngxPopoverAction">
 *   @switch (act.status()) {
 *     @case ('pending')   { Saving... }
 *     @case ('success') { Done }
 *     @default            { Save }
 *   }
 * </cngx-popover-action>
 * ```
 */
@Component({
  selector: 'cngx-popover-action',
  standalone: true,
  imports: [NgTemplateOutlet, CngxAsyncClick],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'cngxPopoverAction',
  host: { style: 'display: contents' },
  template: `
    <ng-template #idle><ng-content /></ng-template>

    @if (role() === 'dismiss') {
      <button
        type="button"
        [class]="'cngx-popover-action cngx-popover-action--' + variant()"
        (click)="handleDismiss()"
      >
        <ng-container *ngTemplateOutlet="idle" />
      </button>
    } @else {
      <button
        type="button"
        [cngxAsyncClick]="action()!"
        #btn="cngxAsyncClick"
        [feedbackDuration]="feedbackDuration()"
        [class]="'cngx-popover-action cngx-popover-action--' + variant()"
      >
        @switch (btn.status()) {
          @case ('pending') {
            @if (pendingTpl(); as tpl) {
              <ng-container *ngTemplateOutlet="tpl.templateRef" />
            } @else {
              <ng-container *ngTemplateOutlet="idle" />
            }
          }
          @case ('success') {
            @if (succeededTpl(); as tpl) {
              <ng-container *ngTemplateOutlet="tpl.templateRef" />
            } @else {
              <ng-container *ngTemplateOutlet="idle" />
            }
          }
          @case ('error') {
            @if (failedTpl(); as tpl) {
              <ng-container
                *ngTemplateOutlet="tpl.templateRef; context: { $implicit: btn.error() }"
              />
            } @else {
              <ng-container *ngTemplateOutlet="idle" />
            }
          }
          @default {
            <ng-container *ngTemplateOutlet="idle" />
          }
        }
      </button>
      <span aria-live="polite" aria-atomic="true" class="cngx-popover-action__sr-only">
        {{ btn.announcement() }}
      </span>
    }
  `,
  styles: `
    .cngx-popover-action__sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border: 0;
    }
  `,
})
export class CngxPopoverAction {
  private readonly popover = inject(CngxPopover, { optional: true });

  // ── Inputs ────────────────────────────────────────────────────────

  /** Button role: `'dismiss'` closes immediately, `'confirm'` runs an async action. */
  readonly role = input<'dismiss' | 'confirm'>('confirm');

  /** The async action to execute (only for `role="confirm"`). */
  readonly action = input<AsyncAction | undefined>(undefined);

  /** Visual variant for the button. */
  readonly variant = input<PopoverActionVariant>('secondary');

  /** Duration in ms to show success/error feedback. */
  readonly feedbackDuration = input(2000);

  // ── Template queries ──────────────────────────────────────────────

  protected readonly pendingTpl = contentChild(CngxPending);
  protected readonly succeededTpl = contentChild(CngxSucceeded);
  protected readonly failedTpl = contentChild(CngxFailed);

  // ── Handlers ──────────────────────────────────────────────────────

  protected handleDismiss(): void {
    this.popover?.hide();
  }
}
