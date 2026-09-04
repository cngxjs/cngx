import { isPlatformBrowser } from '@angular/common';
import {
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  PLATFORM_ID,
  Renderer2,
  signal,
  untracked,
  type Signal,
} from '@angular/core';
import { buildAsyncStateView, type AsyncStatus, type CngxAsyncState } from '@cngx/core/utils';
import { firstValueFrom, isObservable, type Observable } from 'rxjs';

/**
 * Action function that returns a Promise or Observable.
 *
 * @category common/interactive
 */
export type AsyncAction = () => Promise<unknown> | Observable<unknown>;

/**
 * Async action handler with loading state, auto-disable, and success/error feedback.
 *
 * Place on any clickable element (button, link, div). Executes the provided
 * async action on click, tracks the full lifecycle as a state machine, and
 * guards against double-clicks. While pending it communicates busy via
 * `aria-busy` + `aria-disabled` and swallows clicks WITHOUT the hard
 * `disabled` attribute, so keyboard focus stays on the control instead of
 * dropping to `<body>` mid-action. Note: the guard prevents the ACTION from
 * re-running and calls `preventDefault()`, but a consumer `(click)` handler
 * on the same element still fires while pending - gate it on `pending()`
 * when it must not. Success and failure are announced through
 * an auto-rendered polite live region (sibling of the host - inside a
 * `<button>` the text would pollute the accessible name); opt out with
 * `[autoAnnounce]="false"` and bind `announcement` to your own region.
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
 * @category common/interactive
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/async-click/async-click.directive.ts
 * @since 0.1.0
 * @relatedTo CngxPending, CngxSucceeded, CngxFailed, CngxActionButton
 * <example-url>http://localhost:4200/#/common/interactive/retry/optimistic-instant-like-toggle</example-url>
 * <example-url>http://localhost:4200/#/common/interactive/retry/withretry-cngxasyncclick</example-url>
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

  /**
   * Auto-render the polite live region announcing success/failure.
   * Opt out (`false`) to wire {@link announcement} to your own region -
   * also when a toast/alert bridge (`cngxToastOn`, `cngxAlertOn`) on the
   * same element already announces the settle, or the user hears it twice.
   */
  readonly autoAnnounce = input<boolean>(true);

  private readonly pendingState = signal(false);
  private readonly succeededState = signal(false);
  private readonly failedState = signal(false);
  private readonly errorState = signal<unknown>(undefined);
  private readonly lastUpdatedState = signal<Date | undefined>(undefined);
  private feedbackTimer: ReturnType<typeof setTimeout> | null = null;
  private destroyed = false;

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      if (this.feedbackTimer != null) {
        clearTimeout(this.feedbackTimer);
      }
    });

    if (isPlatformBrowser(inject(PLATFORM_ID))) {
      this.installAnnounceRegion();
    }
  }

  private installAnnounceRegion(): void {
    const renderer = inject(Renderer2);
    const hostEl = this.el.nativeElement;
    let span: HTMLSpanElement | null = null;

    effect(() => {
      const enabled = this.autoAnnounce();
      const text = this.announcement();

      untracked(() => {
        if (!enabled) {
          if (span?.parentNode) {
            renderer.removeChild(span.parentNode, span);
          }
          span = null;
          return;
        }

        if (!span) {
          const parent = renderer.parentNode(hostEl) as Node | null;
          if (!parent) {
            return;
          }
          const el = renderer.createElement('span') as HTMLSpanElement;
          renderer.setStyle(el, 'position', 'var(--cngx-sr-only-position, absolute)');
          renderer.setStyle(el, 'width', 'var(--cngx-sr-only-size, 1px)');
          renderer.setStyle(el, 'height', 'var(--cngx-sr-only-size, 1px)');
          renderer.setStyle(el, 'overflow', 'var(--cngx-sr-only-overflow, hidden)');
          renderer.setStyle(el, 'clip', 'var(--cngx-sr-only-clip, rect(0, 0, 0, 0))');
          renderer.setStyle(el, 'white-space', 'var(--cngx-sr-only-white-space, nowrap)');
          renderer.setAttribute(el, 'aria-atomic', 'true');
          renderer.setAttribute(el, 'role', 'status');
          renderer.setAttribute(el, 'aria-live', 'polite');
          // Sibling, not child: inside a <button> host the region's text
          // would land in the control's accessible name.
          renderer.insertBefore(parent, el, hostEl.nextSibling);
          span = el;
        }
        span.textContent = text;
      });
    });

    this.destroyRef.onDestroy(() => {
      if (span?.parentNode) {
        renderer.removeChild(span.parentNode, span);
      }
      span = null;
    });
  }

  /** `true` while the action is executing. */
  readonly pending: Signal<boolean> = this.pendingState.asReadonly();

  /** `true` for `feedbackDuration` ms after a successful action. */
  readonly succeeded: Signal<boolean> = this.succeededState.asReadonly();

  /** `true` for `feedbackDuration` ms after a failed action. */
  readonly failed: Signal<boolean> = this.failedState.asReadonly();

  /** The error value from a failed action. Cleared on reset. */
  readonly error: Signal<unknown> = this.errorState.asReadonly();

  /** Current lifecycle status - use in `@switch` for template branching. */
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

  /**
   * Screen reader announcement for the current state. Rendered automatically
   * into the auto polite region; only needs manual wiring when
   * `autoAnnounce` is `false`.
   */
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
   * feedback system - toasts, alerts, skeletons, async containers.
   */
  readonly state: CngxAsyncState<unknown> = buildAsyncStateView<unknown>({
    status: this.status,
    data: computed(() => undefined),
    error: this.error,
    lastUpdated: this.lastUpdatedState.asReadonly(),
  });

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
