import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  output,
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
import { CNGX_ASYNC_RUN_STATE, type CngxAsyncRunState } from './async-run-state.token';
import { CNGX_HOST_INTERACTION_STATE } from './host-interaction-state.token';

/**
 * Action function that returns a Promise or Observable.
 *
 * `cngxAsyncClick` passes an `AbortSignal` that aborts when the runner is
 * destroyed. The library never aborts the run itself: a destroyed runner
 * only stops listening. Pass the signal on (`fetch(url, { signal })`, an
 * `HttpClient` call ended with `takeUntil(fromEvent(signal, 'abort'))`) to
 * opt in to cancellation. Zero-argument actions stay assignable.
 */
export type AsyncAction = (signal?: AbortSignal) => Promise<unknown> | Observable<unknown>;

/**
 * Resolve value of a run that ended without an outcome: superseded by a
 * newer run, reset, or aborted through its `AbortSignal`. `createRetry`
 * resolves it instead of `undefined`; `cngxAsyncClick` maps it to `idle`
 * with no announcement and no `(settled)`. Resolved, not rejected, so an
 * `await` caller outside the directive gets no surprise throw: compare the
 * result with it where the result is used.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/async-click/async-click.directive.ts
 * @since 0.1.0
 * @relatedTo createRetry, CngxAsyncClick
 */
export const CNGX_ASYNC_CANCELLED: unique symbol = Symbol('CNGX_ASYNC_CANCELLED');

/**
 * One settle of a `cngxAsyncClick` run, emitted through `(settled)`.
 *
 * `generation` counts the settles of one directive instance (1, 2, ...), so
 * two runs that settle before change detection still arrive as two events.
 * `error` carries the rejection value of an `'error'` settle and is
 * `undefined` for `'success'`.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/async-click/async-click.directive.ts
 * @since 0.1.0
 * @relatedTo CngxAsyncClick
 */
export interface CngxAsyncSettle {
  /** Monotonic settle counter of the emitting directive, starting at 1. */
  readonly generation: number;
  /** Outcome of the run. */
  readonly status: 'success' | 'error';
  /** Rejection value of an `'error'` settle; `undefined` on success. */
  readonly error: unknown;
}

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
 * `[autoAnnounce]="false"` and drive your own region from `(settled)`.
 *
 * Every settle is an event, not only a state: `(settled)` emits once per
 * success or error with a monotonic `generation`, and the region gets one
 * write per settle (cleared at the settle, the text written after the next
 * render). Two runs that settle before change detection produce two writes
 * in the same render pass; whether a screen reader voices both depends on
 * the assistive technology. Side effects that must happen per run (a toast,
 * a close, a completion output) belong on `(settled)`; `status` and `state`
 * stay derived state.
 *
 * Destroy ends the lifecycle without aborting the run: the in-flight action
 * keeps running (the library never cancels it), but no state is written, no
 * `(settled)` is emitted, nothing is spoken and the feedback timer is
 * cleared. The `AbortSignal` handed to the action aborts, so an action that
 * forwards it (and `createRetry`, which stops its backoff loop on it) can
 * end early. A run that resolves {@link CNGX_ASYNC_CANCELLED} returns to
 * `idle` silently.
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
  providers: [{ provide: CNGX_ASYNC_RUN_STATE, useExisting: CngxAsyncClick }],
  host: {
    class: 'cngx-async',
    '(click)': 'handleClick($event)',
    '[class.cngx-async--pending]': 'busyVisible()',
    '[class.cngx-async--success]': 'succeeded() && !busyVisible()',
    '[class.cngx-async--error]': 'failed() && !busyVisible()',
    '[attr.aria-busy]': 'pending() || busyVisible() || busy() || hostBusy() || null',
    '[attr.aria-disabled]': 'ariaDisabledAttr()',
  },
})
export class CngxAsyncClick implements CngxAsyncRunState {
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
   * Opt out (`false`) to drive your own region from `(settled)` - also when a toast/alert bridge (`cngxToastOn`, `cngxAlertOn`) on the
   * same element already announces the settle, or the user hears it twice.
   */
  readonly autoAnnounce = input<boolean>(true);

  /**
   * Emits once per success or error settle with a monotonic generation;
   * never on cancel, reset or after destroy. Use it for side effects that
   * must happen per run - a status edge read in an effect coalesces two runs
   * that settle before change detection into one.
   */
  readonly settled = output<CngxAsyncSettle>();

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
   * `0` shows the busy visual one task later (the gate arms through
   * `setTimeout(0)`), not on the first tick of a run.
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
  private generation = 0;
  private readonly injector = inject(Injector);
  private regionSpan: HTMLSpanElement | null = null;
  private readonly abortController = new AbortController();

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.destroyed = true;
      if (this.feedbackTimer != null) {
        clearTimeout(this.feedbackTimer);
      }
      this.abortController.abort();
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

    // Owns only the region element. The text is written per settle by
    // speak(), so no effect reads copy and a language switch never re-voices.
    effect(() => {
      const enabled = this.autoAnnounce();

      untracked(() => {
        if (!enabled) {
          this.removeRegion(renderer);
          return;
        }
        if (this.regionSpan) {
          return;
        }
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
        this.regionSpan = el;
      });
    });

    // The spoken text lives as long as the feedback window it describes: when
    // the run falls back to idle the region is emptied (silently), so a
    // browse-mode reader never finds a stale outcome.
    effect(() => {
      if (this.status() !== 'idle') {
        return;
      }
      untracked(() => {
        if (this.regionSpan) {
          this.regionSpan.textContent = '';
        }
      });
    });

    this.destroyRef.onDestroy(() => this.removeRegion(renderer));
  }

  private removeRegion(renderer: Renderer2): void {
    const span = this.regionSpan;
    if (span?.parentNode) {
      renderer.removeChild(span.parentNode, span);
    }
    this.regionSpan = null;
  }

  /**
   * Clears the region at once, then writes `read()` after the next render,
   * so a host can read content the settle rendered. Two settles before a
   * render produce two writes in that one render pass.
   */
  private speak(read: () => string): void {
    if (!untracked(this.autoAnnounce)) {
      return;
    }
    // The region may not exist yet (a settle before the first render); the
    // write resolves it then.
    if (this.regionSpan) {
      this.regionSpan.textContent = '';
    }
    afterNextRender(
      {
        write: () => {
          const current = this.regionSpan;
          if (!this.destroyed && current) {
            current.textContent = read();
          }
        },
      },
      { injector: this.injector },
    );
  }

  /**
   * Speaks `message` once through the auto region after the next render, for
   * a settle the host reflects but the directive did not run (an external
   * async state). No-op with `[autoAnnounce]="false"` or outside the browser.
   */
  announce(message: string): void {
    this.speak(() => message);
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
   * `aria-disabled` attribute value (`'true' | null`). This is the single
   * source the host renders; a co-hosting button core reads it instead of
   * recomputing an equal value, so the two bindings on a shared host can never
   * diverge regardless of directive write order. Published through
   * `CNGX_ASYNC_RUN_STATE`.
   */
  readonly ariaDisabledAttr = computed<'true' | null>(() =>
    this.pending() || this.busyVisible() || this.blocked() ? 'true' : null,
  );

  /**
   * Announcement copy for the current state: the succeeded or failed text
   * while that feedback window is open, else `''`. It is state, so two
   * settles within one change-detection flush coalesce into the last one.
   * The auto region does not bind it (it writes per settle). With
   * `[autoAnnounce]="false"`, drive your own region from `(settled)`
   * (clear it, then write the copy for `settle.status`) instead of binding
   * this signal, or a second run that settles before the render is lost.
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

    // Only the action is guarded: a throw inside settle() (a (settled)
    // listener, say) must not turn into a second, error settle.
    let outcome: { readonly status: 'success' | 'error'; readonly error: unknown };
    try {
      const actionFn = this.action();
      const result$ = actionFn(this.abortController.signal);
      const promise = isObservable(result$)
        ? firstValueFrom(result$, { defaultValue: undefined })
        : result$;
      const result = await promise;
      if (result === CNGX_ASYNC_CANCELLED) {
        if (!this.destroyed) {
          this.pendingState.set(false);
        }
        return;
      }
      outcome = { status: 'success', error: undefined };
    } catch (err: unknown) {
      outcome = { status: 'error', error: err };
    }
    if (this.destroyed) {
      return;
    }
    this.settle(outcome.status, outcome.error);
  }

  /** Ends a run: writes the state, emits `(settled)` and speaks the outcome once. */
  private settle(status: 'success' | 'error', err: unknown): void {
    this.pendingState.set(false);
    if (status === 'success') {
      this.succeededState.set(true);
      this.lastUpdatedState.set(new Date());
    } else {
      this.failedState.set(true);
      this.errorState.set(err);
    }

    this.generation += 1;
    const settle: CngxAsyncSettle = { generation: this.generation, status, error: err };
    this.settled.emit(settle);

    // Own copy resolves now: a later language switch or a feedback reset
    // inside the render gap cannot change what this settle speaks. The host
    // gets this settle, not the status after the render, which may already
    // show a later run.
    const own = untracked(this.announcement);
    const hostAnnouncement = this.hostState?.announcement;
    this.speak(() => (hostAnnouncement ? untracked(() => hostAnnouncement(settle)) : own));
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
