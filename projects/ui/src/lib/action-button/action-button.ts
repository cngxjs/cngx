import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  input,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import {
  CngxAsyncClick,
  CngxFailed,
  CngxPending,
  CngxSucceeded,
  type AsyncAction,
} from '@cngx/common/interactive';
import type { CngxAsyncState } from '@cngx/core/utils';

/** Visual variant for the action button — maps to a CSS class. */
export type ActionButtonVariant = 'primary' | 'secondary' | 'ghost';

/**
 * Action button molecule with built-in status communication.
 *
 * Coordinates between the `CngxAsyncClick` atom (mechanism, ARIA, lifecycle)
 * and the consumer (intent, styling, labels). Provides template projection
 * for pending/succeeded/failed states and an `aria-live` region for screen
 * reader announcements.
 *
 * Uses `display: contents` — the host produces no DOM box. The inner `<button>`
 * carries the `[cngxAsyncClick]` directive directly.
 *
 * For full control, use `[cngxAsyncClick]` directly on any element instead.
 *
 * @usageNotes
 *
 * ### Minimal (covers 80% of cases)
 * ```html
 * <cngx-action-button [action]="save">Save</cngx-action-button>
 * ```
 *
 * ### With string labels
 * ```html
 * <cngx-action-button [action]="save"
 *   pendingLabel="Saving..." succeededLabel="Saved!" failedLabel="Failed">
 *   Save
 * </cngx-action-button>
 * ```
 *
 * ### With template slots
 * ```html
 * <cngx-action-button [action]="save">
 *   Save Draft
 *   <ng-template cngxPending><mat-spinner diameter="18" /> Saving...</ng-template>
 *   <ng-template cngxSucceeded>Saved!</ng-template>
 *   <ng-template cngxFailed let-err>{{ err }} — retry?</ng-template>
 * </cngx-action-button>
 * ```
 *
 * ### With variant
 * ```html
 * <cngx-action-button [action]="delete" variant="ghost">Delete</cngx-action-button>
 * ```
 *
 * @category components
 */
@Component({
  selector: 'cngx-action-button',
  standalone: true,
  imports: [NgTemplateOutlet, CngxAsyncClick],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'cngxActionButton',
  host: {
    style: 'display: contents',
  },
  template: `
    <ng-template #idle><ng-content /></ng-template>

    <button
      [type]="type()"
      [cngxAsyncClick]="action()"
      #btn="cngxAsyncClick"
      [feedbackDuration]="feedbackDuration()"
      [enabled]="enabled()"
      [succeededAnnouncement]="succeededAnnouncement() ?? succeededLabel() ?? 'Action succeeded'"
      [failedAnnouncement]="failedAnnouncement() ?? failedLabel() ?? 'Action failed'"
      [class]="'cngx-action-button cngx-action-button--' + variant()"
    >
      @switch (effectiveStatus()) {
        @case ('pending') {
          @if (pendingTpl(); as tpl) {
            <ng-container *ngTemplateOutlet="tpl.templateRef" />
          } @else if (pendingLabel()) {
            {{ pendingLabel() }}
          } @else {
            <ng-container *ngTemplateOutlet="idle" />
          }
        }
        @case ('success') {
          @if (succeededTpl(); as tpl) {
            <ng-container *ngTemplateOutlet="tpl.templateRef" />
          } @else if (succeededLabel()) {
            {{ succeededLabel() }}
          } @else {
            <ng-container *ngTemplateOutlet="idle" />
          }
        }
        @case ('error') {
          @if (failedTpl(); as tpl) {
            <ng-container
              *ngTemplateOutlet="tpl.templateRef; context: { $implicit: effectiveError() }"
            />
          } @else if (failedLabel()) {
            {{ failedLabel() }}
          } @else {
            <ng-container *ngTemplateOutlet="idle" />
          }
        }
        @default {
          <ng-container *ngTemplateOutlet="idle" />
        }
      }
    </button>
    <span aria-live="polite" aria-atomic="true" class="cngx-action-button__sr-only">{{
      btn.announcement()
    }}</span>
  `,
  styles: `
    .cngx-action-button__sr-only {
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
export class CngxActionButton {
  /** The async action to execute on click. */
  readonly action = input.required<AsyncAction>();

  /** Duration in ms to show success/error feedback. Passed through to `cngxAsyncClick`. */
  readonly feedbackDuration = input<number>(2000);

  /** When `false`, clicks are ignored. Passed through to `cngxAsyncClick`. */
  readonly enabled = input<boolean>(true);

  /** Button type attribute. Defaults to `'button'` to prevent accidental form submits. */
  readonly type = input<'button' | 'submit' | 'reset'>('button');

  /** Visual variant — sets CSS class `cngx-action-button--{variant}`. */
  readonly variant = input<ActionButtonVariant>('primary');

  /** SR announcement on success. Falls back to `succeededLabel`, then `'Action succeeded'`. */
  readonly succeededAnnouncement = input<string | undefined>(undefined);

  /** SR announcement on failure. Falls back to `failedLabel`, then `'Action failed'`. */
  readonly failedAnnouncement = input<string | undefined>(undefined);

  /** Fallback text while pending (when no `cngxPending` template is projected). */
  readonly pendingLabel = input<string | undefined>(undefined);

  /** Fallback text after success (when no `cngxSucceeded` template is projected). */
  readonly succeededLabel = input<string | undefined>(undefined);

  /** Fallback text after failure (when no `cngxFailed` template is projected). */
  readonly failedLabel = input<string | undefined>(undefined);

  /**
   * Bind an async state to derive visual status from, as alternative to `[action]`.
   * When set, the button's status display follows `state.status()`.
   */
  readonly asyncState = input<CngxAsyncState<unknown> | undefined>(undefined, { alias: 'state' });

  /** @internal — inner CngxAsyncClick directive instance. */
  private readonly asyncClick = viewChild.required(CngxAsyncClick);

  /**
   * @internal — effective status: reads from external `[state]` if bound,
   * otherwise from the inner `CngxAsyncClick` directive.
   */
  protected readonly effectiveStatus = computed(() => {
    const ext = this.asyncState();
    if (ext) {
      const status = ext.status();
      if (status === 'pending') {
        return 'pending' as const;
      }
      if (status === 'success') {
        return 'success' as const;
      }
      if (status === 'error') {
        return 'error' as const;
      }
      return 'idle' as const;
    }
    return this.asyncClick().status();
  });

  /** @internal — effective error value from external state or inner directive. */
  protected readonly effectiveError = computed(() => {
    const ext = this.asyncState();
    return ext ? ext.error() : this.asyncClick().error();
  });

  /** @internal */
  protected readonly pendingTpl = contentChild(CngxPending);
  /** @internal */
  protected readonly succeededTpl = contentChild(CngxSucceeded);
  /** @internal */
  protected readonly failedTpl = contentChild(CngxFailed);
}
