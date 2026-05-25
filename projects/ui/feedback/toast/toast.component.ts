import { Component, computed, DestroyRef, effect, inject, input } from '@angular/core';

import type { AlertSeverity } from '../alert/alert';
import { CngxToaster, type ToastRef } from './toast.service';

/**
 * Declarative toast — renders nothing at its position, pushes into the global `CngxToastOutlet`.
 *
 * Shows a toast when `[when]` becomes `true`. Dismisses when `[when]` becomes `false`
 * (unless already auto-dismissed). Supports projected content for custom toast bodies.
 *
 * Requires `provideToasts()` or `provideFeedback(withToasts())`.
 *
 * ### Simple message
 * ```html
 * <cngx-toast severity="success" message="Saved" [when]="saved()" />
 * ```
 *
 * ### With custom content
 * ```html
 * <cngx-toast severity="error" [when]="hasError()">
 *   Something went wrong. <button (click)="retry()">Retry</button>
 * </cngx-toast>
 * ```
 *
 * ### With async state
 * ```html
 * <cngx-toast severity="success" message="Item saved" [when]="saveState.status() === 'success'" />
 * <cngx-toast severity="error" message="Save failed" [when]="saveState.status() === 'error'" />
 * ```
 * <example-url>http://localhost:4200/#/ui/feedback/toast/custom-component-body</example-url>
 * <example-url>http://localhost:4200/#/ui/feedback/toast/declarative-cngx-toast</example-url>
 * <example-url>http://localhost:4200/#/ui/feedback/toast/programmatic-cngxtoaster</example-url>
 * <example-url>http://localhost:4200/#/ui/feedback/toast/state-bridge-cngxtoaston</example-url>
 * <example-url>http://localhost:4200/#/ui/feedback/toast/title-description</example-url>
 */
@Component({
  selector: 'cngx-toast',
  standalone: true,
  template: ``,
  host: { style: 'display: none' },
})
export class CngxToast {
  private readonly toaster = inject(CngxToaster, { optional: true });
  private readonly destroyRef = inject(DestroyRef);

  /** When `true`, the toast is shown. When `false`, it is dismissed. */
  readonly when = input.required<boolean>();

  /** Toast message text. Ignored when content is projected. */
  readonly message = input<string>('');

  /** Visual severity. */
  readonly severity = input<AlertSeverity>('info');

  /** Auto-dismiss duration in ms, or `'persistent'`. */
  readonly duration = input<number | 'persistent' | undefined>(undefined);

  /** Show dismiss button. */
  readonly dismissible = input<boolean>(true);

  /** Action button config. */
  readonly actionLabel = input<string | undefined>(undefined);
  readonly actionHandler = input<(() => void) | undefined>(undefined);

  /** @internal */
  private readonly action = computed(() => {
    const label = this.actionLabel();
    const handler = this.actionHandler();
    return label && handler ? { label, handler } : undefined;
  });

  private activeRef: ToastRef | null = null;

  constructor() {
    if (!this.toaster) {
      throw new Error(
        '[cngx-toast] CngxToaster not found. ' +
          'Add withToasts() to provideFeedback() or call provideToasts() in your providers.',
      );
    }

    const toaster = this.toaster;

    // Rising-edge trigger — only false→true fires a toast; the toast then
    // owns its own lifecycle. false just re-arms the trigger.
    let previousWhen = false;

    effect(() => {
      const show = this.when();

      if (show && !previousWhen) {
        this.activeRef = toaster.show({
          message: this.message(),
          severity: this.severity(),
          duration: this.duration(),
          dismissible: this.dismissible(),
          action: this.action(),
        });

        this.activeRef.afterDismissed().subscribe(() => {
          this.activeRef = null;
        });
      }

      previousWhen = show;
    });

    this.destroyRef.onDestroy(() => {
      this.activeRef?.dismiss();
      this.activeRef = null;
    });
  }
}
