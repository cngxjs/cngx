import { DestroyRef, inject, Injectable, signal } from '@angular/core';
import { type Observable, Subject } from 'rxjs';

import type { AlertSeverity } from '../alert/alert';

/** Configuration for a system-level banner. */
export interface BannerConfig {
  /** Banner message text (required). */
  message: string;

  /** Required dedup key — only one banner per id. `show()` with existing id calls `update()`. */
  id: string;

  /** Visual severity — determines icon, color, and ARIA role. */
  severity?: AlertSeverity;

  /**
   * Action button. If `handler` returns a Promise, the button shows `aria-busy`
   * and is disabled until resolved. On error, the banner stays open.
   */
  action?: { label: string; handler: () => void | Promise<void> };

  /** Show a dismiss button. Default `true`. */
  dismissible?: boolean;
}

/** Handle to a displayed banner. */
export interface BannerRef {
  /** Programmatically dismiss this banner. */
  dismiss(): void;
  /** Emits after the banner is fully removed. */
  afterDismissed(): Observable<void>;
}

/** @internal — tracked state for a single banner. */
export interface BannerState {
  readonly id: string;
  readonly config: Required<Pick<BannerConfig, 'message' | 'id' | 'severity' | 'dismissible'>> &
    Pick<BannerConfig, 'action'>;
  /** Whether the action handler is currently executing. */
  readonly actionPending: boolean;
  /** Error from the last action handler execution. */
  readonly actionError: unknown;
  readonly dismissed$: Subject<void>;
}

/**
 * Global banner service — manages system-level banners as a signal array.
 *
 * Not `providedIn: 'root'`. Provide via `provideFeedback(withBanners())`.
 *
 * Banners are always persistent — no auto-dismiss. Use `dismiss(id)` to remove
 * programmatically (e.g., on reconnect, on session extend).
 *
 * `id` is required and serves as the dedup key. Calling `show()` with an existing
 * `id` calls `update()` instead (e.g., session timeout countdown).
 *
 * @usageNotes
 * ```typescript
 * private readonly banner = inject(CngxBanner);
 *
 * this.banner.show({
 *   message: 'Your session expires in 5 minutes',
 *   severity: 'warning',
 *   id: 'auth:session-timeout',
 *   action: { label: 'Extend', handler: () => this.extendSession() },
 * });
 * ```
 *
 * @category feedback
 */
@Injectable()
export class CngxBanner {
  private readonly destroyRef = inject(DestroyRef);

  /** Reactive banner stack — read by `CngxBannerOutlet`. */
  readonly banners = signal<readonly BannerState[]>([]);

  constructor() {
    this.destroyRef.onDestroy(() => {
      for (const b of this.banners()) {
        b.dismissed$.next();
        b.dismissed$.complete();
      }
    });
  }

  /** Show a banner. If `id` already exists, updates it instead. */
  show(config: BannerConfig): BannerRef {
    const existing = this.banners().find((b) => b.id === config.id);
    if (existing) {
      this.update(config.id, config);
      return this.createRef(existing);
    }

    const severity = config.severity ?? 'info';
    const dismissible = config.dismissible ?? true;
    const dismissed$ = new Subject<void>();

    const state: BannerState = {
      id: config.id,
      config: {
        message: config.message,
        id: config.id,
        severity,
        dismissible,
        action: config.action,
      },
      actionPending: false,
      actionError: undefined,
      dismissed$,
    };

    this.banners.update((bs) => [state, ...bs]);
    return this.createRef(state);
  }

  /** Update an existing banner in-place by id. */
  update(id: string, patch: Partial<BannerConfig>): void {
    this.banners.update((bs) =>
      bs.map((b) =>
        b.id === id
          ? {
              ...b,
              config: {
                ...b.config,
                ...(patch.message !== undefined && { message: patch.message }),
                ...(patch.severity !== undefined && { severity: patch.severity }),
                ...(patch.dismissible !== undefined && { dismissible: patch.dismissible }),
                ...(patch.action !== undefined && { action: patch.action }),
              },
            }
          : b,
      ),
    );
  }

  /** Dismiss a banner by id. */
  dismiss(id: string): void {
    const banner = this.banners().find((b) => b.id === id);
    if (!banner) {
      return;
    }
    this.banners.update((bs) => bs.filter((b) => b.id !== id));
    banner.dismissed$.next();
    banner.dismissed$.complete();
  }

  /** Dismiss all banners. */
  dismissAll(): void {
    for (const b of this.banners()) {
      b.dismissed$.next();
      b.dismissed$.complete();
    }
    this.banners.set([]);
  }

  /**
   * @internal — execute an action handler with async lifecycle.
   * Sets `actionPending` during execution, `actionError` on failure.
   */
  async executeAction(id: string): Promise<void> {
    const banner = this.banners().find((b) => b.id === id);
    if (!banner?.config.action) {
      return;
    }

    this.banners.update((bs) =>
      bs.map((b) => (b.id === id ? { ...b, actionPending: true, actionError: undefined } : b)),
    );

    try {
      await banner.config.action.handler();
      // Success: clear pending state, then dismiss
      this.banners.update((bs) =>
        bs.map((b) => (b.id === id ? { ...b, actionPending: false } : b)),
      );
      this.dismiss(id);
    } catch (err: unknown) {
      // Error: keep banner open, store error
      this.banners.update((bs) =>
        bs.map((b) => (b.id === id ? { ...b, actionPending: false, actionError: err } : b)),
      );
    }
  }

  private createRef(state: BannerState): BannerRef {
    return {
      dismiss: () => this.dismiss(state.id),
      afterDismissed: () => state.dismissed$.asObservable(),
    };
  }
}
