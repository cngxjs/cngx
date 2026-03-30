import {
  computed,
  DestroyRef,
  Directive,
  ElementRef,
  inject,
  input,
  signal,
  type Signal,
} from '@angular/core';
import { buildAsyncStateView, type AsyncStatus, type CngxAsyncState } from '@cngx/core/utils';
import { firstValueFrom, isObservable, type Observable } from 'rxjs';

/** Action function that returns a Promise or Observable. */
export type AsyncAction = () => Promise<unknown> | Observable<unknown>;

/**
 * Async action handler with loading state, auto-disable, and success/error feedback.
 *
 * Place on any clickable element (button, link, div). Executes the provided
 * async action on click, tracks the full lifecycle as a state machine, auto-disables
 * during execution, announces state changes to screen readers, and guards against
 * double-clicks.
 *
 * @usageNotes
 *
 * ### Basic usage
 * ```html
 * <button [cngxAsyncClick]="saveAction" #btn="cngxAsyncClick">
 *   @switch (btn.status()) {
 *     @case ('pending')   { Saving... }
 *     @case ('success')   { Saved! }
 *     @case ('error')     { Failed }
 *     @default            { Save }
 *   }
 * </button>
 * ```
 *
 * ### With Material
 * ```html
 * <button mat-raised-button [cngxAsyncClick]="submitForm" #btn="cngxAsyncClick">
 *   @if (btn.pending()) { <mat-spinner diameter="20" /> Submitting... }
 *   @else { Submit }
 * </button>
 * ```
 *
 * ### On any element
 * ```html
 * <a role="button" [cngxAsyncClick]="navigate" #btn="cngxAsyncClick">Go</a>
 * ```
 *
 * @category directives
 */
@Directive({
  selector: '[cngxAsyncClick]',
  standalone: true,
  exportAs: 'cngxAsyncClick',
  host: {
    '(click)': 'handleClick($event)',
    '[class.cngx-async--pending]': 'pending()',
    '[class.cngx-async--success]': 'succeeded()',
    '[class.cngx-async--error]': 'failed()',
    '[attr.aria-busy]': 'pending() || null',
    '[attr.aria-disabled]': 'pending() || null',
    '[attr.disabled]': 'shouldDisable()',
  },
})
export class CngxAsyncClick {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);

  /** The async action to execute on click. */
  readonly action = input.required<AsyncAction>({ alias: 'cngxAsyncClick' });

  /** Duration in ms to show success/error state before reset. */
  readonly feedbackDuration = input<number>(2000);

  /** When `false`, clicks are ignored (does not set `disabled` attribute). */
  readonly enabled = input<boolean>(true);

  /** Label announced to screen readers on success. */
  readonly succeededAnnouncement = input<string>('Action succeeded');

  /** Label announced to screen readers on failure. */
  readonly failedAnnouncement = input<string>('Action failed');

  // ── Internal state ──────────────────────────────────────────────────

  private readonly pendingState = signal(false);
  private readonly succeededState = signal(false);
  private readonly failedState = signal(false);
  private readonly errorState = signal<unknown>(undefined);
  private readonly lastUpdatedState = signal<Date | undefined>(undefined);
  private feedbackTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly supportsDisabled: boolean;
  private destroyed = false;

  constructor() {
    const tag = this.el.nativeElement.tagName;
    this.supportsDisabled =
      tag === 'BUTTON' || tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA';

    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      if (this.feedbackTimer != null) {
        clearTimeout(this.feedbackTimer);
      }
    });
  }

  // ── Public signals ──────────────────────────────────────────────────

  /** `true` while the action is executing. */
  readonly pending: Signal<boolean> = this.pendingState.asReadonly();

  /** `true` for `feedbackDuration` ms after a successful action. */
  readonly succeeded: Signal<boolean> = this.succeededState.asReadonly();

  /** `true` for `feedbackDuration` ms after a failed action. */
  readonly failed: Signal<boolean> = this.failedState.asReadonly();

  /** The error value from a failed action. Cleared on reset. */
  readonly error: Signal<unknown> = this.errorState.asReadonly();

  /** Current lifecycle status — use in `@switch` for template branching. */
  readonly status = computed<AsyncStatus>(() => {
    if (this.pendingState()) {
      return 'pending';
    }
    if (this.succeededState()) {
      return 'success';
    }
    if (this.failedState()) {
      return 'error';
    }
    return 'idle';
  });

  /** Screen reader announcement for the current state — bind to an `aria-live` region. */
  readonly announcement = computed(() => {
    if (this.succeededState()) {
      return this.succeededAnnouncement();
    }
    if (this.failedState()) {
      return this.failedAnnouncement();
    }
    return '';
  });

  /**
   * Full `CngxAsyncState` view of this directive's lifecycle.
   *
   * Bind to any state consumer (`[state]="btn.state"`) to connect the
   * feedback system — toasts, alerts, skeletons, async containers.
   */
  readonly state: CngxAsyncState<unknown> = buildAsyncStateView<unknown>({
    status: this.status,
    data: computed(() => undefined),
    error: this.error,
    lastUpdated: this.lastUpdatedState.asReadonly(),
  });

  /** @internal */
  protected readonly shouldDisable = computed(() =>
    this.pendingState() && this.supportsDisabled ? '' : null,
  );

  // ── Event handler ───────────────────────────────────────────────────

  /** @internal */
  protected async handleClick(event: Event): Promise<void> {
    if (!this.enabled() || this.pendingState()) {
      event.preventDefault();
      return;
    }

    this.clearFeedback();
    this.pendingState.set(true);

    try {
      const actionFn = this.action();
      const result$ = actionFn();
      const promise = isObservable(result$)
        ? firstValueFrom(result$, { defaultValue: undefined })
        : result$;
      await promise;
      if (this.destroyed) {
        return;
      }
      this.pendingState.set(false);
      this.succeededState.set(true);
      this.lastUpdatedState.set(new Date());
      this.scheduleFeedbackReset();
    } catch (err: unknown) {
      if (this.destroyed) {
        return;
      }
      this.pendingState.set(false);
      this.failedState.set(true);
      this.errorState.set(err);
      this.scheduleFeedbackReset();
    }
  }

  // ── Feedback timer ──────────────────────────────────────────────────

  private scheduleFeedbackReset(): void {
    if (this.feedbackTimer != null) {
      clearTimeout(this.feedbackTimer);
    }
    this.feedbackTimer = setTimeout(() => {
      this.succeededState.set(false);
      this.failedState.set(false);
      this.errorState.set(undefined);
      this.feedbackTimer = null;
    }, this.feedbackDuration());
  }

  private clearFeedback(): void {
    if (this.feedbackTimer != null) {
      clearTimeout(this.feedbackTimer);
      this.feedbackTimer = null;
    }
    this.succeededState.set(false);
    this.failedState.set(false);
    this.errorState.set(undefined);
  }
}
