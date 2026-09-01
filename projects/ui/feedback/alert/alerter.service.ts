import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { type Observable, Subject } from 'rxjs';

import type { AlertSeverity } from './alert';
import { CNGX_FEEDBACK_CONFIG } from '../config/feedback-config';
import { createPausableTimer, type PausableTimer } from '../internal/pausable-timer';

/** Auto-dismiss fallback when neither `duration` nor `withAlerts({defaultDuration})` is set. */
const ALERT_FALLBACK_DURATION = 5000;

/**
 * Configuration for a programmatic alert.
 *
 * @category ui/feedback/alert
 */
export interface AlertConfig {
  /** Alert message text (required). */
  message: string;
  /** Visual severity - determines icon, color, and ARIA role. */
  severity?: AlertSeverity;
  /** Optional bold title above the message. */
  title?: string;
  /**
   * Whether the alert persists until explicitly dismissed.
   * Defaults to `true` unless a `duration` is passed or
   * `withAlerts({ defaultDuration })` is configured.
   */
  persistent?: boolean;
  /**
   * Auto-dismiss duration in ms. Setting it implies `persistent: false`.
   * Non-persistent alerts without a duration fall back to
   * `withAlerts({ defaultDuration })`, then 5000ms.
   */
  duration?: number;
  /** Show a dismiss button. Default `true`. */
  dismissible?: boolean;
  /** Scope key - only shown in stacks with matching scope. */
  scope?: string;
}

/**
 * Handle to a displayed alert - allows programmatic dismiss.
 *
 * @category ui/feedback/alert
 */
export interface AlertRef {
  /** Programmatically dismiss this alert. */
  dismiss(): void;
  /** Emits after the alert is fully removed. */
  afterDismissed(): Observable<void>;
}

/**
 * Tracked state for a single alert - the element type of the public
 * `CngxAlerter.alerts` signal. Immutable per slot; treat as read-only.
 *
 * @category ui/feedback/alert
 */
export interface AlertState {
  readonly id: number;
  readonly config: Required<
    Pick<AlertConfig, 'message' | 'severity' | 'dismissible' | 'persistent'>
  > &
    Pick<AlertConfig, 'title' | 'duration' | 'scope'>;
  readonly createdAt: number;
  readonly dismissed$: Subject<void>;
}

/**
 * Scoped alert service - manages an alert stack as a signal array.
 *
 * Not `providedIn: 'root'`. Each `CngxAlertStack` provides its own instance
 * via `viewProviders`, scoping alerts to that stack's subtree.
 *
 * For root-level injection, use `provideFeedback(withAlerts())`.
 *
 * @category ui/feedback/alert
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/feedback/alert/alerter.service.ts
 * @since 0.1.0
 * @relatedTo CngxAlertStack, CngxAlertOn, CngxToaster, CngxBanner
 *
 * <example-url>http://localhost:4200/#/ui/feedback/alert-stack/basic-stack</example-url>
 * <example-url>http://localhost:4200/#/ui/feedback/alert-stack/dialog-use-case</example-url>
 * <example-url>http://localhost:4200/#/ui/feedback/alert-stack/overflow-collapse</example-url>
 */
@Injectable()
export class CngxAlerter {
  private readonly destroyRef = inject(DestroyRef);
  private readonly config = inject(CNGX_FEEDBACK_CONFIG, { optional: true });
  private nextId = 0;

  /** Reactive alert stack - read by `CngxAlertStack`. */
  readonly alerts = signal<readonly AlertState[]>([]);

  private readonly dedupWindow = this.config?.alertDedupWindow ?? 1000;
  private readonly defaultDuration = this.config?.alertDefaultDuration;

  /** Auto-dismiss timers keyed by alert id - not part of the public state shape. */
  private readonly timers = new Map<number, PausableTimer>();

  constructor() {
    this.destroyRef.onDestroy(() => {
      for (const timer of this.timers.values()) {
        timer.clear();
      }
      this.timers.clear();
      for (const a of this.alerts()) {
        a.dismissed$.next();
        a.dismissed$.complete();
      }
    });
  }

  /** Show an alert. Returns a ref for programmatic dismiss. */
  show(config: AlertConfig): AlertRef {
    const severity = config.severity ?? 'info';
    // An explicit duration (or a configured defaultDuration) implies auto-dismiss.
    const persistent =
      config.persistent ?? (config.duration === undefined && this.defaultDuration === undefined);
    const duration = persistent
      ? (config.duration ?? this.defaultDuration)
      : (config.duration ?? this.defaultDuration ?? ALERT_FALLBACK_DURATION);
    const dismissible = config.dismissible ?? true;

    // Dedup: message + severity + scope within window. Merges silently -
    // no repeat counter (deliberate asymmetry with the toast x-count: the
    // stack is a role="log" region, a mutating counter would re-announce).
    // The auto-dismiss timer restarts so the merged alert stays a full duration.
    const now = Date.now();
    const existing = this.alerts().find(
      (a) =>
        a.config.message === config.message &&
        a.config.severity === severity &&
        (a.config.scope ?? '') === (config.scope ?? '') &&
        now - a.createdAt < this.dedupWindow,
    );

    if (existing) {
      this.startTimer(existing);
      return this.createRef(existing);
    }

    const id = this.nextId++;
    const dismissed$ = new Subject<void>();
    const state: AlertState = {
      id,
      config: {
        message: config.message,
        severity,
        persistent,
        dismissible,
        title: config.title,
        duration,
        scope: config.scope,
      },
      createdAt: now,
      dismissed$,
    };

    this.alerts.update((as) => [state, ...as]);
    this.startTimer(state);
    return this.createRef(state);
  }

  /** @internal - called by `CngxAlertStack` on hover/focus (WCAG 2.2.1). */
  pauseTimer(id: number): void {
    this.timers.get(id)?.pause();
  }

  /** @internal - called by `CngxAlertStack` on pointer-leave/focus-out. */
  resumeTimer(id: number): void {
    this.timers.get(id)?.resume();
  }

  /** Dismiss a single alert by id. */
  dismiss(id: number): void {
    const alert = this.alerts().find((a) => a.id === id);
    if (!alert) {
      return;
    }
    this.clearTimer(id);
    this.alerts.update((as) => as.filter((a) => a.id !== id));
    alert.dismissed$.next();
    alert.dismissed$.complete();
  }

  /** Dismiss all alerts (optionally filtered by scope). */
  dismissAll(scope?: string): void {
    const current = this.alerts();
    const toRemove = scope ? current.filter((a) => a.config.scope === scope) : current;
    const toKeep = scope ? current.filter((a) => a.config.scope !== scope) : [];

    for (const a of toRemove) {
      this.clearTimer(a.id);
      a.dismissed$.next();
      a.dismissed$.complete();
    }

    this.alerts.set(toKeep);
  }

  private startTimer(state: AlertState): void {
    if (state.config.persistent || state.config.duration === undefined) {
      return;
    }
    let timer = this.timers.get(state.id);
    if (!timer) {
      timer = createPausableTimer();
      this.timers.set(state.id, timer);
    }
    timer.start(state.config.duration, () => this.dismiss(state.id));
  }

  private clearTimer(id: number): void {
    this.timers.get(id)?.clear();
    this.timers.delete(id);
  }

  private createRef(state: AlertState): AlertRef {
    return {
      dismiss: () => this.dismiss(state.id),
      afterDismissed: () => state.dismissed$.asObservable(),
    };
  }
}
