import {
  DestroyRef,
  type EnvironmentProviders,
  inject,
  Injectable,
  makeEnvironmentProviders,
  signal,
} from '@angular/core';
import { type Observable, Subject } from 'rxjs';

import type { AlertSeverity } from '../alert';
import { CNGX_FEEDBACK_CONFIG } from '../feedback-config';

/** Configuration for a single toast. */
export interface ToastConfig {
  /** Toast message text. */
  message: string;
  /** Visual severity — determines icon, color, and ARIA role. */
  severity?: AlertSeverity;
  /** Auto-dismiss duration in ms, or `'persistent'` for manual dismiss only. */
  duration?: number | 'persistent';
  /** Optional action button inside the toast. */
  action?: { label: string; handler: () => void };
  /** Show dismiss button. */
  dismissible?: boolean;
}

/** Handle to a displayed toast — allows programmatic dismiss. */
export interface ToastRef {
  /** Programmatically dismiss this toast. */
  dismiss(): void;
  /** Emits after the toast is fully removed (post-animation). */
  afterDismissed(): Observable<void>;
}

/** Internal toast state tracked by the service. */
export interface ToastState {
  readonly id: number;
  readonly config: Required<Pick<ToastConfig, 'message' | 'severity' | 'dismissible'>> &
    Pick<ToastConfig, 'action'> & { duration: number | 'persistent' };
  readonly createdAt: number;
  /** Dedup counter — incremented when identical toast fires again. */
  readonly count: number;
  /** Remaining ms when timer was paused (hover/focus). `undefined` = not paused. */
  readonly pausedRemaining: number | undefined;
  /** Timer handle for auto-dismiss. */
  readonly timer: ReturnType<typeof setTimeout> | undefined;
  /** Subject that emits on dismiss. */
  readonly dismissed$: Subject<void>;
}

/**
 * Feature-scoped toast service — not `providedIn: 'root'`.
 *
 * Provide via `provideFeedback(withToasts())` or `provideToasts()` at the
 * app-shell or route level.
 *
 * Manages the toast stack as a signal array. `CngxToastOutlet` reads it reactively.
 *
 * @category feedback
 */
@Injectable()
export class CngxToastService {
  private readonly destroyRef = inject(DestroyRef);
  private readonly config = inject(CNGX_FEEDBACK_CONFIG, { optional: true });
  private nextId = 0;

  /** Reactive toast stack — read by `CngxToastOutlet`. */
  readonly toasts = signal<readonly ToastState[]>([]);

  /** Default duration for non-error toasts. */
  readonly defaultDuration = signal<number>(this.config?.toastDefaultDuration ?? 5000);

  /** Dedup window in ms — identical toasts within this window are merged. */
  readonly dedupWindow = signal<number>(this.config?.toastDedupWindow ?? 1000);

  constructor() {
    this.destroyRef.onDestroy(() => {
      for (const t of this.toasts()) {
        if (t.timer !== undefined) {
          clearTimeout(t.timer);
        }
      }
    });
  }

  /** Show a toast. Returns a ref for programmatic control. */
  show(config: ToastConfig): ToastRef {
    const severity = config.severity ?? 'info';
    const duration =
      config.duration ?? (severity === 'error' ? ('persistent' as const) : this.defaultDuration());
    const dismissible = config.dismissible ?? true;

    // Dedup check
    const now = Date.now();
    const existing = this.toasts().find(
      (t) =>
        t.config.message === config.message &&
        t.config.severity === severity &&
        now - t.createdAt < this.dedupWindow(),
    );

    if (existing) {
      if (existing.timer !== undefined) {
        clearTimeout(existing.timer);
      }
      const newTimer =
        duration !== 'persistent' ? this.startTimer(existing.id, duration) : undefined;
      this.toasts.update((ts) =>
        ts.map((t) =>
          t.id === existing.id
            ? { ...t, count: t.count + 1, timer: newTimer, pausedRemaining: undefined }
            : t,
        ),
      );
      return this.createRef(existing);
    }

    const id = this.nextId++;
    const dismissed$ = new Subject<void>();
    const state: ToastState = {
      id,
      config: { message: config.message, severity, duration, dismissible, action: config.action },
      createdAt: now,
      count: 1,
      pausedRemaining: undefined,
      timer: duration !== 'persistent' ? this.startTimer(id, duration) : undefined,
      dismissed$,
    };

    this.toasts.update((ts) => [state, ...ts]);
    return this.createRef(state);
  }

  /** @internal — called by toast-outlet on hover/focus. */
  pauseTimer(id: number): void {
    this.toasts.update((ts) =>
      ts.map((t) => {
        if (t.id !== id || t.timer === undefined) {
          return t;
        }
        const elapsed = Date.now() - t.createdAt;
        const duration = t.config.duration;
        if (typeof duration !== 'number') {
          return t;
        }
        clearTimeout(t.timer);
        return { ...t, timer: undefined, pausedRemaining: Math.max(0, duration - elapsed) };
      }),
    );
  }

  /** @internal — called by toast-outlet on mouse-leave/focus-out. */
  resumeTimer(id: number): void {
    this.toasts.update((ts) =>
      ts.map((t) => {
        if (t.id !== id || t.pausedRemaining === undefined) {
          return t;
        }
        return {
          ...t,
          pausedRemaining: undefined,
          timer: this.startTimer(t.id, t.pausedRemaining),
        };
      }),
    );
  }

  /** Dismiss a toast by id. */
  dismiss(id: number): void {
    const toast = this.toasts().find((t) => t.id === id);
    if (!toast) {
      return;
    }
    if (toast.timer !== undefined) {
      clearTimeout(toast.timer);
    }
    this.toasts.update((ts) => ts.filter((t) => t.id !== id));
    toast.dismissed$.next();
    toast.dismissed$.complete();
  }

  /** Dismiss all toasts. */
  dismissAll(): void {
    for (const t of this.toasts()) {
      if (t.timer !== undefined) {
        clearTimeout(t.timer);
      }
      t.dismissed$.next();
      t.dismissed$.complete();
    }
    this.toasts.set([]);
  }

  private startTimer(id: number, ms: number): ReturnType<typeof setTimeout> {
    return setTimeout(() => this.dismiss(id), ms);
  }

  private createRef(state: ToastState): ToastRef {
    return {
      dismiss: () => this.dismiss(state.id),
      afterDismissed: () => state.dismissed$.asObservable(),
    };
  }
}

/**
 * Standalone provider for the toast system — use when not using `provideFeedback()`.
 *
 * @example
 * ```ts
 * bootstrapApplication(AppComponent, {
 *   providers: [provideToasts()],
 * });
 * ```
 */
export function provideToasts(): EnvironmentProviders {
  return makeEnvironmentProviders([CngxToastService]);
}
