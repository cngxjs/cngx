import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  effect,
  inject,
  input,
  signal,
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
import { buildAsyncStateView, type AsyncStatus, type CngxAsyncState } from '@cngx/core/utils';
import { CngxToastOn, CngxToaster } from '@cngx/ui/feedback';

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
 * ### With toast feedback
 * ```html
 * <cngx-action-button [action]="save" toastSuccess="Saved" toastError="Save failed">
 *   Save
 * </cngx-action-button>
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
      clip-path: inset(50%);
      white-space: nowrap;
      border: 0;
    }
  `,
})
export class CngxActionButton {
  private readonly toaster = inject(CngxToaster, { optional: true });
  private readonly externalToastOn = inject(CngxToastOn, { self: true, optional: true });

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
   * Bind an external async state to derive visual status from.
   * When set, the button's status display follows `externalState.status()`.
   */
  readonly externalState = input<CngxAsyncState<unknown> | undefined>(undefined);

  /**
   * Toast message on success. Requires `CngxToaster` (via `provideFeedback(withToasts())`
   * or `provideToasts()`). Silently ignored when toaster is not provided.
   *
   * `toastSuccessDuration` should be >= `feedbackDuration` to avoid rapid re-fire
   * on repeated clicks that floods the SR announcement queue.
   */
  readonly toastSuccess = input<string | undefined>(undefined);

  /** Toast message on error. */
  readonly toastError = input<string | undefined>(undefined);

  /** Include the error detail message in the error toast body. */
  readonly toastErrorDetail = input<boolean>(false);

  /** Duration for success toasts in ms. */
  readonly toastSuccessDuration = input<number>(3000);

  /** Duration for error toasts — `'persistent'` means manual dismiss only. */
  readonly toastErrorDuration = input<number | 'persistent'>('persistent');

  /** @internal — inner CngxAsyncClick directive instance. Non-required to allow safe pre-view-init reads. */
  private readonly asyncClick = viewChild(CngxAsyncClick);

  /**
   * @internal — effective status: reads from external `[externalState]` if bound,
   * otherwise from the inner `CngxAsyncClick` directive.
   */
  protected readonly effectiveStatus = computed(() => {
    const ext = this.externalState();
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
    // viewChild is guaranteed resolved when the template reads this computed.
    // Guard protects consumers reading `state` before view init.
    const click = this.asyncClick();
    return click ? click.status() : ('idle' as const);
  });

  /** @internal — effective error value from external state or inner directive. */
  protected readonly effectiveError = computed(() => {
    const ext = this.externalState();
    if (ext) {
      return ext.error();
    }
    const click = this.asyncClick();
    return click ? click.error() : undefined;
  });

  // ── Produced state ──────────────────────────────────────────────────

  private readonly lastUpdatedState = signal<Date | undefined>(undefined);

  /**
   * Full `CngxAsyncState` view of this button's effective lifecycle.
   *
   * Reflects the external state when `[externalState]` is bound,
   * otherwise the inner `CngxAsyncClick` directive's state.
   *
   * Bind to any state consumer: `<cngx-alert [state]="btn.state" />`.
   */
  readonly state: CngxAsyncState<unknown> = buildAsyncStateView<unknown>({
    status: this.effectiveStatus,
    data: computed(() => undefined),
    error: this.effectiveError,
    lastUpdated: this.lastUpdatedState.asReadonly(),
  });

  /** @internal */
  protected readonly pendingTpl = contentChild(CngxPending);
  /** @internal */
  protected readonly succeededTpl = contentChild(CngxSucceeded);
  /** @internal */
  protected readonly failedTpl = contentChild(CngxFailed);

  constructor() {
    // ── Toast + lastUpdated effect ────────────────────────────────────
    // Double-toast guard: warn once if consumer also placed [cngxToastOn] on this element
    if (
      typeof ngDevMode !== 'undefined' &&
      ngDevMode &&
      this.externalToastOn &&
      (this.toastSuccess() || this.toastError())
    ) {
      console.warn(
        'CngxActionButton: [toastSuccess]/[toastError] inputs and [cngxToastOn] ' +
          'on the same element will fire duplicate toasts. Use one or the other.',
      );
    }

    let previousStatus: AsyncStatus = 'idle';

    effect(() => {
      const status = this.effectiveStatus();

      if (status === previousStatus) {
        return;
      }
      previousStatus = status;

      if (status === 'success') {
        this.lastUpdatedState.set(new Date());
        const msg = this.toastSuccess();
        if (msg && this.toaster) {
          this.toaster.show({
            message: msg,
            severity: 'success',
            duration: this.toastSuccessDuration(),
          });
        }
      }

      if (status === 'error') {
        const msg = this.toastError();
        if (msg && this.toaster) {
          const err = this.effectiveError();
          const detail =
            this.toastErrorDetail() && err != null
              ? err instanceof Error
                ? err.message
                : typeof err === 'string'
                  ? err
                  : undefined
              : undefined;
          this.toaster.show({
            message: detail ? `${msg}: ${detail}` : msg,
            severity: 'error',
            duration: this.toastErrorDuration(),
          });
        }
      }
    });
  }
}
