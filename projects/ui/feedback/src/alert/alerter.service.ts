import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { type Observable, Subject } from 'rxjs';

import type { AlertSeverity } from './alert';
import { CNGX_FEEDBACK_CONFIG } from '../feedback-config';

/** Configuration for a programmatic alert. */
export interface AlertConfig {
  /** Alert message text (required). */
  message: string;
  /** Visual severity — determines icon, color, and ARIA role. */
  severity?: AlertSeverity;
  /** Optional bold title above the message. */
  title?: string;
  /** Whether the alert persists until explicitly dismissed. Default `true`. */
  persistent?: boolean;
  /** Auto-dismiss duration in ms. Only applies when `persistent` is false. */
  duration?: number;
  /** Show a dismiss button. Default `true`. */
  dismissible?: boolean;
  /** Scope key — only shown in stacks with matching scope. */
  scope?: string;
}

/** Handle to a displayed alert — allows programmatic dismiss. */
export interface AlertRef {
  /** Programmatically dismiss this alert. */
  dismiss(): void;
  /** Emits after the alert is fully removed. */
  afterDismissed(): Observable<void>;
}

/** @internal — tracked state for a single alert in the stack. */
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
 * Scoped alert service — manages an alert stack as a signal array.
 *
 * Not `providedIn: 'root'`. Each `CngxAlertStack` provides its own instance
 * via `viewProviders`, scoping alerts to that stack's subtree.
 *
 * For root-level injection, use `provideFeedback(withAlerts())`.
 *
 * @category feedback
 */
@Injectable()
export class CngxAlerter {
  private readonly destroyRef = inject(DestroyRef);
  private readonly config = inject(CNGX_FEEDBACK_CONFIG, { optional: true });
  private nextId = 0;

  /** Reactive alert stack — read by `CngxAlertStack`. */
  readonly alerts = signal<readonly AlertState[]>([]);

  private readonly dedupWindow = this.config?.alertDedupWindow ?? 1000;
  private readonly defaultDuration = this.config?.alertDefaultDuration;

  constructor() {
    this.destroyRef.onDestroy(() => {
      for (const a of this.alerts()) {
        a.dismissed$.next();
        a.dismissed$.complete();
      }
    });
  }

  /** Show an alert. Returns a ref for programmatic dismiss. */
  show(config: AlertConfig): AlertRef {
    const severity = config.severity ?? 'info';
    const persistent = config.persistent ?? true;
    const dismissible = config.dismissible ?? true;

    // Dedup: message + severity + scope within window
    const now = Date.now();
    const existing = this.alerts().find(
      (a) =>
        a.config.message === config.message &&
        a.config.severity === severity &&
        (a.config.scope ?? '') === (config.scope ?? '') &&
        now - a.createdAt < this.dedupWindow,
    );

    if (existing) {
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
        duration: config.duration ?? this.defaultDuration,
        scope: config.scope,
      },
      createdAt: now,
      dismissed$,
    };

    this.alerts.update((as) => [state, ...as]);
    return this.createRef(state);
  }

  /** Dismiss a single alert by id. */
  dismiss(id: number): void {
    const alert = this.alerts().find((a) => a.id === id);
    if (!alert) {
      return;
    }
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
      a.dismissed$.next();
      a.dismissed$.complete();
    }

    this.alerts.set(toKeep);
  }

  private createRef(state: AlertState): AlertRef {
    return {
      dismiss: () => this.dismiss(state.id),
      afterDismissed: () => state.dismissed$.asObservable(),
    };
  }
}
