import { NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  DestroyRef,
  Directive,
  effect,
  inject,
  input,
  output,
  signal,
  TemplateRef,
  untracked,
  ViewEncapsulation,
} from '@angular/core';
import type { CngxAsyncState } from '@cngx/core/utils';

import { CngxCloseButton } from '@cngx/common/interactive';

import { CNGX_FEEDBACK_CONFIG } from '../config/feedback-config';
import { CngxSeverityIcon } from '../config/severity-icon';

// ── Types ───────────────────────────────────────────────────────

/** Severity level for the alert — determines visual style, icon, and ARIA role. */
export type AlertSeverity = 'info' | 'success' | 'warning' | 'error';

/** Visibility phase for enter/exit CSS animations. */
export type AlertVisibilityPhase = 'hidden' | 'entering' | 'visible' | 'exiting';

// ── PausableTimer ───────────────────────────────────────────────

/** @internal — timer with pause/resume support for hover/focus interactions. */
interface PausableTimer {
  start(duration: number, onComplete: () => void): void;
  pause(): void;
  resume(): void;
  clear(): void;
}

function createPausableTimer(): PausableTimer {
  let id: ReturnType<typeof setTimeout> | undefined;
  let remaining = 0;
  let startedAt = 0;
  let onComplete: (() => void) | undefined;

  const clear = (): void => {
    if (id !== undefined) {
      clearTimeout(id);
      id = undefined;
    }
    remaining = 0;
    onComplete = undefined;
  };

  const resume = (): void => {
    if (remaining > 0 && id === undefined && onComplete) {
      startedAt = Date.now();
      const cb = onComplete;
      id = setTimeout(() => {
        id = undefined;
        remaining = 0;
        cb();
      }, remaining);
    }
  };

  const pause = (): void => {
    if (id !== undefined) {
      clearTimeout(id);
      id = undefined;
      remaining = Math.max(0, remaining - (Date.now() - startedAt));
    }
  };

  return {
    start: (duration, cb) => {
      clear();
      onComplete = cb;
      remaining = duration;
      resume();
    },
    pause,
    resume,
    clear,
  };
}

// ── Slot Directives ─────────────────────────────────────────────

/** Content slot directive for custom alert icons. */
@Directive({ selector: '[cngxAlertIcon]', standalone: true })
export class CngxAlertIcon {
  readonly templateRef = inject(TemplateRef, { optional: true });
}

/**
 * Action button marker inside an alert. Restricts to button and anchor elements.
 *
 * When present, the alert container uses `aria-atomic="false"` to prevent
 * re-announcing the entire alert on button interaction.
 *
 * @usageNotes
 * ```html
 * <cngx-alert severity="error" title="Save failed" [state]="saveState">
 *   Check your connection and try again.
 *   <button cngxAlertAction (click)="retry()">Retry</button>
 * </cngx-alert>
 * ```
 */
@Directive({
  selector: 'button[cngxAlertAction], a[cngxAlertAction]',
  standalone: true,
  host: { class: 'cngx-alert__action' },
})
export class CngxAlertAction {}

// ── CngxAlert ───────────────────────────────────────────────────

/**
 * Inline alert atom with enter/exit animations, state-driven visibility,
 * auto-dismiss with pause-on-hover/focus, and optional auto-collapse.
 *
 * Three visibility modes:
 * - **Static** (no `[state]` or `[when]`): always visible
 * - **State-driven** (`[state]`): auto-shows on error/success/loading, auto-hides on idle
 * - **Boolean-driven** (`[when]`): visible when true, hidden when false
 *
 * `[state]` takes precedence over `[when]`.
 *
 * @category feedback
 */
@Component({
  selector: 'cngx-alert',
  standalone: true,
  imports: [NgComponentOutlet, CngxCloseButton, CngxSeverityIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'cngx-alert',
    // Severity classes
    '[class.cngx-alert--info]': 'severity() === "info"',
    '[class.cngx-alert--success]': 'severity() === "success"',
    '[class.cngx-alert--warning]': 'severity() === "warning"',
    '[class.cngx-alert--error]': 'severity() === "error"',
    // Visibility phase classes (drive CSS animations)
    '[class.cngx-alert--hidden]': 'visibilityPhase() === "hidden"',
    '[class.cngx-alert--entering]': 'visibilityPhase() === "entering"',
    '[class.cngx-alert--visible]': 'visibilityPhase() === "visible"',
    '[class.cngx-alert--exiting]': 'visibilityPhase() === "exiting"',
    // Collapse
    '[class.cngx-alert--collapsed]': 'collapsed()',
    // ARIA — role present only when visible
    '[attr.role]': 'isVisible() ? ariaRole() : null',
    '[attr.aria-atomic]': 'isVisible() ? ariaAtomic() : null',
    '[attr.aria-label]': 'isVisible() ? (title() || null) : null',
    '[attr.aria-expanded]': 'collapsible() ? !collapsed() : null',
    '[attr.aria-busy]': 'isStateBusy() || null',
    '[attr.hidden]': '!isVisible() || null',
    // Events
    '(animationend)': 'handleAnimationEnd($event)',
    '(pointerenter)': 'handlePointerEnter()',
    '(pointerleave)': 'handlePointerLeave()',
    '(focusin)': 'handleFocusIn()',
    '(focusout)': 'handleFocusOut()',
  },
  template: `
    <div class="cngx-alert__icon">
      <ng-content select="[cngxAlertIcon]" />
      @if (globalIcon(); as iconCmp) {
        @if (!customIcon()) {
          <ng-container *ngComponentOutlet="iconCmp" />
        }
      } @else if (!customIcon()) {
        <cngx-severity-icon [severity]="severity()" iconClass="cngx-alert__default-icon" />
      }
    </div>
    <div class="cngx-alert__body">
      @if (title()) {
        <strong class="cngx-alert__title">{{ title() }}</strong>
      }
      <div class="cngx-alert__collapsible">
        <div class="cngx-alert__content">
          <ng-content />
        </div>
        <div class="cngx-alert__actions">
          <ng-content select="[cngxAlertAction]" />
        </div>
      </div>
    </div>
    @if (effectiveClosable()) {
      <cngx-close-button label="Dismiss" class="cngx-alert__dismiss" (click)="handleDismiss()" />
    }
    <span class="cngx-sr-only" aria-live="polite" aria-atomic="true">{{ announcement() }}</span>
  `,
  styles: `
    .cngx-alert {
      display: flex;
      align-items: flex-start;
      gap: var(--cngx-alert-gap, 12px);
      padding: var(--cngx-alert-padding, 12px 16px);
      border-radius: var(--cngx-alert-border-radius, 8px);
      border: 1px solid var(--cngx-alert-border-color, transparent);
      background: var(--cngx-alert-bg, #f8fafc);
      color: var(--cngx-alert-color, inherit);
    }

    .cngx-alert--info {
      --cngx-alert-bg: var(--cngx-alert-info-bg, #eff6ff);
      --cngx-alert-border-color: var(--cngx-alert-info-border, #bfdbfe);
      --cngx-alert-icon-color: var(--cngx-alert-info-icon, #3b82f6);
    }

    .cngx-alert--success {
      --cngx-alert-bg: var(--cngx-alert-success-bg, #f0fdf4);
      --cngx-alert-border-color: var(--cngx-alert-success-border, #bbf7d0);
      --cngx-alert-icon-color: var(--cngx-alert-success-icon, #22c55e);
    }

    .cngx-alert--warning {
      --cngx-alert-bg: var(--cngx-alert-warning-bg, #fffbeb);
      --cngx-alert-border-color: var(--cngx-alert-warning-border, #fde68a);
      --cngx-alert-icon-color: var(--cngx-alert-warning-icon, #f59e0b);
    }

    .cngx-alert--error {
      --cngx-alert-bg: var(--cngx-alert-error-bg, #fef2f2);
      --cngx-alert-border-color: var(--cngx-alert-error-border, #fecaca);
      --cngx-alert-icon-color: var(--cngx-alert-error-icon, #ef4444);
    }

    .cngx-alert__icon {
      flex-shrink: 0;
      color: var(--cngx-alert-icon-color, currentColor);
    }

    .cngx-alert__default-icon {
      width: var(--cngx-alert-icon-size, 20px);
      height: var(--cngx-alert-icon-size, 20px);
    }

    .cngx-alert__body {
      flex: 1;
      min-width: 0;
    }

    .cngx-alert__title {
      display: block;
      font-weight: var(--cngx-alert-title-weight, 600);
      margin-bottom: var(--cngx-alert-title-gap, 4px);
    }

    .cngx-alert__collapsible {
      display: grid;
      grid-template-rows: 1fr;
      transition: grid-template-rows var(--cngx-alert-collapse-duration, 200ms) ease;
    }

    .cngx-alert__collapsible > * {
      overflow: hidden;
    }

    .cngx-alert--collapsed .cngx-alert__collapsible {
      grid-template-rows: 0fr;
    }

    .cngx-alert--collapsed {
      cursor: pointer;
    }

    .cngx-alert--collapsed:hover {
      background: var(--cngx-alert-collapsed-hover-bg, rgba(0, 0, 0, 0.02));
    }

    .cngx-alert__actions:empty {
      display: none;
    }

    .cngx-alert__actions {
      margin-top: var(--cngx-alert-actions-gap, 8px);
    }

    .cngx-alert__dismiss {
      flex-shrink: 0;
    }

    /* ── Visibility phases ─────────────────────────────────── */

    .cngx-alert--hidden {
      display: none;
    }

    .cngx-alert--entering {
      animation: cngx-alert-enter var(--cngx-alert-enter-duration, 200ms) ease-out both;
    }

    .cngx-alert--entering .cngx-alert__icon {
      animation: cngx-alert-icon-pulse var(--cngx-alert-icon-pulse-duration, 300ms) ease-out;
    }

    .cngx-alert--exiting {
      animation: cngx-alert-exit var(--cngx-alert-exit-duration, 150ms) ease-in both;
    }

    @keyframes cngx-alert-enter {
      from {
        opacity: 0;
        transform: translateY(calc(-1 * var(--cngx-alert-enter-offset, 8px)));
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes cngx-alert-exit {
      from {
        opacity: 1;
        transform: translateY(0);
      }
      to {
        opacity: 0;
        transform: translateY(calc(-1 * var(--cngx-alert-exit-offset, 8px)));
      }
    }

    @keyframes cngx-alert-icon-pulse {
      0% {
        transform: scale(1);
      }
      50% {
        transform: scale(1.1);
      }
      100% {
        transform: scale(1);
      }
    }

    /* ── Reduced motion ────────────────────────────────────── */

    @media (prefers-reduced-motion: reduce) {
      .cngx-alert--entering,
      .cngx-alert--entering .cngx-alert__icon {
        animation: none;
      }

      .cngx-alert--exiting {
        animation: none;
      }

      .cngx-alert__collapsible {
        transition: none !important;
      }
    }

    /* ── SR-only ───────────────────────────────────────────── */

    .cngx-sr-only {
      position: absolute;
      width: 1px;
      height: 1px;
      padding: 0;
      margin: -1px;
      overflow: hidden;
      clip: rect(0, 0, 0, 0);
      white-space: nowrap;
      border-width: 0;
    }
  `,
})
export class CngxAlert {
  private readonly config = inject(CNGX_FEEDBACK_CONFIG, { optional: true });
  private readonly destroyRef = inject(DestroyRef);

  // ── Inputs ──────────────────────────────────────────────────

  /** Alert severity — determines visual style, default icon, and ARIA role. */
  readonly severity = input<AlertSeverity>('info');

  /** Optional title displayed above the content. */
  readonly title = input<string | undefined>(undefined);

  /**
   * Shows a dismiss button.
   * @deprecated Use `closable` instead.
   */
  readonly dismissible = input<boolean>(false);

  /** Shows a dismiss button. Preferred over deprecated `dismissible`. */
  readonly closable = input<boolean>(false);

  /** Bind an async state — auto-shows on error/success/loading, auto-hides on idle. */
  readonly state = input<CngxAsyncState<unknown> | undefined>(undefined);

  /**
   * Boolean visibility trigger. When set, controls alert visibility directly.
   * `[state]` takes precedence over `[when]`.
   */
  readonly when = input<boolean | undefined>(undefined);

  /**
   * Auto-dismiss delay in ms for success state or timed alerts.
   * Set to `undefined` to disable auto-dismiss (persistent).
   */
  readonly autoDismissDelay = input<number | undefined>(5000);

  /** Enables auto-collapse after `collapseDelay`. Visual only — SR reads full content. */
  readonly collapsible = input<boolean>(false);

  /** Delay in ms before auto-collapsing. Defaults to `autoDismissDelay`. */
  readonly collapseDelay = input<number | undefined>(undefined);

  // ── Outputs ─────────────────────────────────────────────────

  /** Emitted when the dismiss button is clicked. */
  readonly dismissed = output<void>();

  // ── Content children ────────────────────────────────────────

  /** @internal — detects projected custom icon to hide default/global icon. */
  protected readonly customIcon = contentChild(CngxAlertIcon);

  /** @internal — detects projected action buttons for aria-atomic strategy. */
  protected readonly hasActions = contentChild(CngxAlertAction);

  // ── Internal state ──────────────────────────────────────────

  private readonly manualDismissed = signal(false);
  private readonly autoDismissed = signal(false);
  private readonly collapsedState = signal(false);
  private readonly announcementState = signal('');

  /** @internal — animation phase, drives host CSS classes. */
  protected readonly visibilityPhase = signal<AlertVisibilityPhase>('hidden');

  // ── Timers ──────────────────────────────────────────────────

  private readonly autoDismissTimer = createPausableTimer();
  private readonly collapseTimer = createPausableTimer();
  private animationFallbackId: ReturnType<typeof setTimeout> | undefined;

  // ── Computed ────────────────────────────────────────────────

  /** @internal — global icon component for the current severity (from provideFeedback config). */
  protected readonly globalIcon = computed(
    () => this.config?.alertIcons?.[this.severity()] ?? null,
  );

  /** @internal — merged closable from new and deprecated input. */
  protected readonly effectiveClosable = computed(() => this.closable() || this.dismissible());

  /** @internal — ARIA role: 'alert' for error/warning, 'status' for info/success. */
  protected readonly ariaRole = computed(() => {
    const s = this.severity();
    return s === 'error' || s === 'warning' ? 'alert' : 'status';
  });

  /** @internal — false when actions are projected to prevent full re-announcement. */
  protected readonly ariaAtomic = computed(() => (this.hasActions() ? 'false' : 'true'));

  /** @internal — true when bound state is in a busy status. */
  protected readonly isStateBusy = computed(() => {
    const s = this.state();
    if (!s) {
      return false;
    }
    const status = s.status();
    return status === 'loading' || status === 'pending' || status === 'refreshing';
  });

  /**
   * @internal — whether the alert SHOULD be visible (before animation).
   * Drives the animation effect which manages visibilityPhase.
   */
  protected readonly shouldBeVisible = computed(() => {
    if (this.manualDismissed()) {
      return false;
    }
    if (this.autoDismissed()) {
      return false;
    }

    const s = this.state();
    if (s) {
      const status = s.status();
      return status !== 'idle';
    }

    const w = this.when();
    if (w !== undefined) {
      return w;
    }

    // Static: always visible
    return true;
  });

  /** @internal — true when the alert is currently visible (post-animation). */
  protected readonly isVisible = computed(() => {
    const phase = this.visibilityPhase();
    return phase === 'entering' || phase === 'visible';
  });

  /** @internal — collapsed state (read-only public view). */
  protected readonly collapsed = this.collapsedState.asReadonly();

  /** @internal — SR announcement text for state transitions. */
  protected readonly announcement = this.announcementState.asReadonly();

  // ── Effective collapse delay ────────────────────────────────

  private readonly effectiveCollapseDelay = computed(
    () => this.collapseDelay() ?? this.autoDismissDelay() ?? 5000,
  );

  // ── Constructor (effects) ───────────────────────────────────

  constructor() {
    // Effect 1: Watch state transitions — manage auto-dismiss timer
    effect(() => {
      const s = this.state();
      if (!s) {
        return;
      }
      const status = s.status();

      if (status === 'error') {
        // Error: persistent — reset any dismiss, clear timer
        this.manualDismissed.set(false);
        this.autoDismissed.set(false);
        this.autoDismissTimer.clear();
      } else if (status === 'success') {
        // Success: show briefly, then auto-dismiss
        this.manualDismissed.set(false);
        this.autoDismissed.set(false);
        const delay = this.autoDismissDelay();
        if (delay !== undefined) {
          this.autoDismissTimer.start(delay, () => this.autoDismissed.set(true));
        }
      } else if (status === 'idle') {
        // Idle: clean up
        this.autoDismissTimer.clear();
      }
      // loading/pending/refreshing: keep current state, don't touch timers
    });

    // Effect 2: Animate visibility transitions
    effect(() => {
      const show = this.shouldBeVisible();
      const phase = untracked(() => this.visibilityPhase());

      if (show && (phase === 'hidden' || phase === 'exiting')) {
        this.beginEnter();
      } else if (!show && (phase === 'visible' || phase === 'entering')) {
        this.beginExit();
      }
    });

    // Cleanup on destroy
    this.destroyRef.onDestroy(() => {
      this.autoDismissTimer.clear();
      this.collapseTimer.clear();
      this.clearAnimationFallback();
    });
  }

  // ── Animation lifecycle ─────────────────────────────────────

  private beginEnter(): void {
    this.collapsedState.set(false);
    this.visibilityPhase.set('entering');
    this.scheduleAnimationFallback();
  }

  private beginExit(): void {
    this.visibilityPhase.set('exiting');
    this.scheduleAnimationFallback();
  }

  private onBecameVisible(): void {
    // Start collapse timer if collapsible
    if (this.collapsible()) {
      this.collapseTimer.start(this.effectiveCollapseDelay(), () => this.collapsedState.set(true));
    }
  }

  private onBecameHidden(): void {
    this.autoDismissTimer.clear();
    this.collapseTimer.clear();
    this.collapsedState.set(false);
  }

  private scheduleAnimationFallback(): void {
    this.clearAnimationFallback();
    // When reduced-motion is active (or no window — SSR/test), transition immediately.
    // Otherwise use a generous timeout as safety net (animationend normally fires first
    // and clears this via clearAnimationFallback).
    const reducedMotion =
      typeof window === 'undefined' ||
      !window.matchMedia?.('(prefers-reduced-motion: no-preference)').matches;
    this.animationFallbackId = setTimeout(
      () => {
        this.animationFallbackId = undefined;
        const phase = this.visibilityPhase();
        if (phase === 'entering') {
          this.visibilityPhase.set('visible');
          this.onBecameVisible();
        } else if (phase === 'exiting') {
          this.visibilityPhase.set('hidden');
          this.onBecameHidden();
        }
      },
      reducedMotion ? 0 : 500,
    );
  }

  private clearAnimationFallback(): void {
    if (this.animationFallbackId !== undefined) {
      clearTimeout(this.animationFallbackId);
      this.animationFallbackId = undefined;
    }
  }

  // ── Event handlers ──────────────────────────────────────────

  /** @internal */
  protected handleAnimationEnd(event: AnimationEvent): void {
    if (event.animationName === 'cngx-alert-enter') {
      this.clearAnimationFallback();
      this.visibilityPhase.set('visible');
      this.onBecameVisible();
    } else if (event.animationName === 'cngx-alert-exit') {
      this.clearAnimationFallback();
      this.visibilityPhase.set('hidden');
      this.onBecameHidden();
    }
  }

  /** @internal */
  protected handleDismiss(): void {
    this.manualDismissed.set(true);
    this.autoDismissTimer.clear();
    this.collapseTimer.clear();
    this.announcementState.set('Alert dismissed');
    this.dismissed.emit();
  }

  /** @internal — WCAG 2.2.1: pause auto-dismiss on hover. */
  protected handlePointerEnter(): void {
    this.autoDismissTimer.pause();
    this.collapseTimer.pause();
    // Expand on hover if collapsed
    if (this.collapsedState()) {
      this.collapsedState.set(false);
    }
  }

  /** @internal — resume timers on pointer leave. */
  protected handlePointerLeave(): void {
    this.autoDismissTimer.resume();
    // Restart collapse timer from full delay on leave
    if (this.collapsible() && this.isVisible()) {
      this.collapseTimer.start(this.effectiveCollapseDelay(), () => this.collapsedState.set(true));
    }
  }

  /** @internal — WCAG 2.2.1: pause auto-dismiss on focus. */
  protected handleFocusIn(): void {
    this.autoDismissTimer.pause();
    this.collapseTimer.pause();
    if (this.collapsedState()) {
      this.collapsedState.set(false);
    }
  }

  /** @internal — resume timers on focus out. */
  protected handleFocusOut(): void {
    this.autoDismissTimer.resume();
    if (this.collapsible() && this.isVisible()) {
      this.collapseTimer.start(this.effectiveCollapseDelay(), () => this.collapsedState.set(true));
    }
  }
}
