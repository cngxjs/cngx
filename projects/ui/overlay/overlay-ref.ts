import { type OverlayRef as CdkOverlayRef } from '@angular/cdk/overlay';
import { signal, type Signal } from '@angular/core';
import { Subject, takeUntil } from 'rxjs';

/**
 * Construction-time options for a {@link CngxOverlayRef}. Set by
 * {@link CngxOverlay.open}, not by consumers.
 *
 * @category ui/overlay
 */
export interface CngxOverlayRefConfig {
  /**
   * When `true`, neither Escape nor a backdrop click closes the overlay - the
   * only way out is a programmatic `close()`. Default `false`.
   */
  readonly disableClose?: boolean;
  /**
   * Element focus returns to when the overlay closes - captured at open time,
   * before the overlay steals focus. `null` skips restoration.
   */
  readonly restoreFocusTo?: HTMLElement | null;
}

/**
 * Typed wrapper around a CDK OverlayRef that exposes a close result stream.
 *
 * Closes on Escape and on a backdrop click (unless `disableClose`), restores
 * focus to the element that opened it, and surfaces its open state as a signal
 * beside the RxJS `afterClosed$`.
 *
 * @category ui/overlay
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/overlay/overlay-ref.ts
 * @since 0.1.0
 * @relatedTo CngxOverlay, provideOverlay
 */
export class CngxOverlayRef<R = unknown> {
  private readonly _afterClosed = new Subject<R | undefined>();

  /** Emits once with the close result when the overlay is dismissed, then completes. */
  readonly afterClosed$ = this._afterClosed.asObservable();

  private readonly openState = signal(true);
  /**
   * `true` while the overlay is open, `false` once closed. The signal view of
   * the lifecycle beside {@link afterClosed$} - bind it in a template without
   * an `async` pipe.
   */
  readonly isOpen: Signal<boolean> = this.openState.asReadonly();

  private readonly restoreFocusTo: HTMLElement | null;

  constructor(
    private readonly cdkRef: CdkOverlayRef,
    config: CngxOverlayRefConfig = {},
  ) {
    this.restoreFocusTo = config.restoreFocusTo ?? null;

    if (!config.disableClose) {
      cdkRef
        .backdropClick()
        .pipe(takeUntil(this._afterClosed))
        .subscribe(() => this.close());
      cdkRef
        .keydownEvents()
        .pipe(takeUntil(this._afterClosed))
        .subscribe((event) => {
          if (event.key === 'Escape') {
            event.preventDefault();
            this.close();
          }
        });
    }
  }

  /**
   * Closes the overlay, emitting `result` on `afterClosed$`, disposing the CDK
   * ref, and restoring focus. Idempotent - a second call (e.g. Escape after a
   * scope teardown already closed it) is a no-op.
   */
  close(result?: R): void {
    if (!this.openState()) {
      return;
    }
    this.openState.set(false);
    this._afterClosed.next(result);
    this._afterClosed.complete();
    this.cdkRef.dispose();
    this.restoreFocusTo?.focus();
  }
}
