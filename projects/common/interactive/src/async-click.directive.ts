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
import { firstValueFrom, isObservable, type Observable } from 'rxjs';

/** Action function that returns a Promise or Observable. */
export type AsyncAction = () => Promise<unknown> | Observable<unknown>;

/** Discriminated status of an async action lifecycle — `'idle'` before first click, then cycles through `'pending'` / `'succeeded'` | `'failed'` / `'idle'`. */
export type AsyncStatus = 'idle' | 'pending' | 'succeeded' | 'failed';

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
 *     @case ('succeeded') { Saved! }
 *     @case ('failed')    { Failed }
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
    '[class.cngx-async--succeeded]': 'succeeded()',
    '[class.cngx-async--failed]': 'failed()',
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
  private readonly errorState = signal<unknown>(null);
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
      return 'succeeded';
    }
    if (this.failedState()) {
      return 'failed';
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
      if (this.destroyed) { return; }
      this.pendingState.set(false);
      this.succeededState.set(true);
      this.scheduleFeedbackReset();
    } catch (err: unknown) {
      if (this.destroyed) { return; }
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
      this.errorState.set(null);
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
    this.errorState.set(null);
  }
}
