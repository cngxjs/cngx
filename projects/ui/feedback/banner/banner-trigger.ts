import { Component, DestroyRef, effect, inject, input } from '@angular/core';

import type { AlertSeverity } from '../alert/alert';
import { CngxBanner } from './banner.service';

/**
 * Declarative banner trigger — renders nothing, shows/dismisses a global banner
 * when `[when]` changes.
 *
 * When `[when]` becomes `true`, the banner appears. When `false`, it is dismissed.
 * The banner's lifecycle is tied to the signal — perfect for reactive system state
 * like `isOffline()` or `sessionExpiring()`.
 *
 * Requires `provideFeedback(withBanners())`.
 *
 * @usageNotes
 *
 * ```html
 * <cngx-banner-trigger
 *   [when]="isOffline()"
 *   message="You are offline. Changes will sync when reconnected."
 *   id="net:offline"
 *   severity="error" />
 *
 * <cngx-banner-trigger
 *   [when]="sessionExpiring()"
 *   message="Session expires soon."
 *   id="auth:session"
 *   severity="warning"
 *   actionLabel="Extend"
 *   [actionHandler]="extendSession" />
 * ```
 *
 * @category feedback
 */
@Component({
  selector: 'cngx-banner-trigger',
  standalone: true,
  template: '',
  host: { style: 'display: none' },
})
export class CngxBannerTrigger {
  private readonly banner = inject(CngxBanner, { optional: true });
  private readonly destroyRef = inject(DestroyRef);

  /** When `true`, the banner is shown. When `false`, it is dismissed. */
  readonly when = input.required<boolean>();

  /** Banner message text. */
  readonly message = input.required<string>();

  /** Required unique id — dedup key. */
  readonly id = input.required<string>();

  /** Visual severity. */
  readonly severity = input<AlertSeverity>('info');

  /** Show dismiss button. */
  readonly dismissible = input<boolean>(true);

  /** Action button label. */
  readonly actionLabel = input<string | undefined>(undefined);

  /** Action button handler. */
  readonly actionHandler = input<(() => void | Promise<void>) | undefined>(undefined);

  constructor() {
    if (!this.banner) {
      throw new Error(
        '[cngx-banner-trigger] CngxBanner not found. ' + 'Add withBanners() to provideFeedback().',
      );
    }
    const banner = this.banner;

    effect(() => {
      const show = this.when();
      const id = this.id();

      if (show) {
        const label = this.actionLabel();
        const handler = this.actionHandler();
        banner.show({
          message: this.message(),
          id,
          severity: this.severity(),
          dismissible: this.dismissible(),
          action: label && handler ? { label, handler } : undefined,
        });
      } else {
        banner.dismiss(id);
      }
    });

    this.destroyRef.onDestroy(() => {
      // Dismiss on component destroy if still showing
      const id = this.id();
      banner.dismiss(id);
    });
  }
}
