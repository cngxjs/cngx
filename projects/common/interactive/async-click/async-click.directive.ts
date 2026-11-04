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
import {
  buildAsyncStateView,
  createVisibilityGate,
  injectLoadingConfig,
  type AsyncStatus,
  type CngxAsyncState,
} from '@cngx/core/utils';
import { firstValueFrom, isObservable, type Observable } from 'rxjs';

import { injectInteractiveI18n } from '../i18n/interactive-i18n';
import { CNGX_HOST_INTERACTION_STATE } from './host-interaction-state.token';

/**
 * Action function that returns a Promise or Observable.
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
 * The busy visual is gated, the truth is not: {@link busyVisible} (and with it
 * `cngx-async--pending` and the button-family spinner) turns on only after
 * `CNGX_LOADING_CONFIG.showDelay` and, once shown, stays for at least
 * `minDwell`, so a fast run never flashes a spinner. `pending()`, `status` and
 * the settle announcement stay immediate; `aria-busy`, `aria-disabled` and the
 * double-click guard are set at click and held until the busy visual releases,
 * so a control that looks busy refuses activation and reads as busy for the
 * whole dwell - never as a bare disabled. Override the timing per instance with
 * `[showDelay]` / `[minDwell]`.
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
 * `pending()` flips on the first tick; bind `btn.busyVisible()` instead when
 * a hand-rolled spinner should follow the show delay and min-dwell.
 *
 * ### On any element
 * ```html
 * <a role="button" [cngxAsyncClick]="navigate" #btn="cngxAsyncClick">Go</a>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/async-click/async-click.directive.ts
 * @since 0.1.0
 * @relatedTo CngxPending, CngxSucceeded, CngxFailed, CngxActionButton
 * <example-url>/#/common/interactive/retry/optimistic-instant-like-toggle</example-url>
 * <example-url>/#/common/interactive/retry/createretry-cngxasyncclick</example-url>
 * @axis level atom
 */
@Directive({
  selector: '[cngxAsyncClick]',
  standalone: true,
  exportAs: 'cngxAsyncClick',
  host: {
    class: 'cngx-async',
    '(click)': 'handleClick($event)',
    '[class.cngx-async--pending]': 'busyVisible()',
    '[class.cngx-async--success]': 'succeeded() && !busyVisible()',
    '[class.cngx-async--error]': 'failed() && !busyVisible()',
    '[attr.aria-busy]': 'pending() || busyVisible() || busy() || hostBusy() || null',
    '[attr.aria-disabled]': 'pending() || busyVisible() || blocked() || null',
  },
})
export class CngxAsyncClick {
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly destroyRef = inject(DestroyRef);
  private readonly hostState = inject(CNGX_HOST_INTERACTION_STATE, {
    self: true,
    optional: true,
  });

  /** The async action to execute on click. */
  readonly action = input.required<AsyncAction>({ alias: 'cngxAsyncClick' });

  /**
   * Duration in ms to show the success/error state before reset. Counted from
   * the release of the busy visual (its show delay plus min-dwell), not from
   * the moment the run settles, so the tint is always painted for the full
   * duration even when the dwell outlasts it.
   */
  readonly feedbackDuration = input<number>(2000);

  /**
   * When `false`, clicks are ignored and the element is marked `aria-disabled`
   * (never the hard `disabled` attribute, so focus survives). Communicates the
   * "why" to assistive tech instead of silently swallowing the click.
   */
  readonly enabled = input<boolean>(true);

  /**
   * External busy override. When `true`, the element is `aria-busy` even though
   * this directive is not running its own action - for a wrapper that tracks an
   * operation outside the click (e.g. an `[externalState]`). Purely an ARIA
   * hint: it does not block clicks (gate those with `[enabled]`) and does not
   * open {@link busyVisible}, so no spinner or `cngx-async--pending` follows it.
   */
  readonly busy = input<boolean>(false);

  private readonly i18n = injectInteractiveI18n();

  /**
   * Label announced to screen readers on success. Unbound, it resolves to
   * `CNGX_INTERACTIVE_I18N.asyncClickSucceeded` at announcement time.
   */
  readonly succeededAnnouncement = input<string | undefined>(undefined);

  /**
   * Label announced to screen readers on failure. Unbound, it resolves to
   * `CNGX_INTERACTIVE_I18N.asyncClickFailed` at announcement time.
   */
  readonly failedAnnouncement = input<string | undefined>(undefined);

  /**
   * Auto-render the polite live region announcing success/failure.
   * Opt out (`false`) to wire {@link announcement} to your own region -
   * also when a toast/alert bridge (`cngxToastOn`, `cngxAlertOn`) on the
   * same element already announces the settle, or the user hears it twice.
   */
  readonly autoAnnounce = input<boolean>(true);

  /**
   * `true` when clicks are refused outside a running action: `enabled` is
   * `false` or a co-hosted component reports itself disabled through
   * `CNGX_HOST_INTERACTION_STATE`.
   *
   * @internal
   */
  protected readonly blocked = computed(
    () => !this.enabled() || (this.hostState?.disabled() ?? false),
  );

  /** @internal - a host-reflected run (`CNGX_HOST_INTERACTION_STATE.busy`). */
  protected readonly hostBusy = computed(() => this.hostState?.busy?.() ?? false);

  private readonly pendingState = signal(false);

  /**
   * Show delay (ms) of the busy visual, bound as `[showDelay]` next to the
   * directive. Unbound, it resolves to `CNGX_LOADING_CONFIG.showDelay`.
   * `0` shows the busy visual on the first tick of a run.
   */
  readonly showDelay = input<number | undefined>(undefined);

  /**
   * Minimum time (ms) a shown busy visual stays, bound as `[minDwell]`.
   * Unbound, it resolves to `CNGX_LOADING_CONFIG.minDwell`. `0` hides it as
   * soon as the run ends.
   */
  readonly minDwell = input<number | undefined>(undefined);

  private readonly loadingConfig = injectLoadingConfig();

  /**
   * `true` while the busy visual should show: the run (own or host-reflected)
   * after the show delay, held for at least the min-dwell. Drives
   * `cngx-async--pending` and the button-family busy layer; `pending()` stays
   * the immediate truth and `aria-busy` never waits on it.
   */
  readonly busyVisible: Signal<boolean> = createVisibilityGate(
    computed(() => this.pendingState() || this.hostBusy()),
    computed(() => this.showDelay() ?? this.loadingConfig.showDelay),
    computed(() => this.minDwell() ?? this.loadingConfig.minDwell),
  );

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

    // Arm the feedback-reset window when the run has settled AND the busy
    // visual has released, so the success/error tint gets its full
    // feedbackDuration after the dwell instead of being cut short by it. A
    // side effect only: scheduleFeedbackReset arms a timer and clears any
    // previous one, so a reopened-then-released busy visual (hostBusy) restarts
    // the window and never leaves two timers pending. The state writes stay in
    // the timer, not in the effect.
    effect(() => {
      const settled = this.succeededState() || this.failedState();
      const released = !this.busyVisible();
      if (settled && released) {
        untracked(() => this.scheduleFeedbackReset());
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
      const text = this.hostState?.announcement?.() ?? this.announcement();

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
    // Copy is read untracked: only a settle re-derives the region, so a
    // language switch never re-voices it; the next settle speaks the new one.
    if (this.succeededState()) {
      return untracked(() => this.succeededAnnouncement() ?? this.i18n().asyncClickSucceeded);
    }
    if (this.failedState()) {
      return untracked(() => this.failedAnnouncement() ?? this.i18n().asyncClickFailed);
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
    if (this.blocked() || this.pendingState() || this.busyVisible()) {
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
    } catch (err: unknown) {
      if (this.destroyed) {
        return;
      }
      this.pendingState.set(false);
      this.failedState.set(true);
      this.errorState.set(err);
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
