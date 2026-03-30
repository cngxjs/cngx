import { Directive, effect, inject, input } from '@angular/core';
import { createTransitionTracker, type CngxAsyncState } from '@cngx/core/utils';

import { CngxBanner } from './banner.service';

/**
 * Declarative state-to-banner bridge.
 *
 * Place on any element — shows a global banner when the bound `CngxAsyncState`
 * transitions to `error`. Dismisses automatically on `success` or `idle`.
 * Only fires on actual transitions, not on initial `idle` state.
 *
 * @usageNotes
 *
 * ```html
 * <div [cngxBannerOn]="connectionState"
 *   bannerId="net:offline"
 *   bannerError="You are offline. Changes will sync when reconnected.">
 * </div>
 * ```
 *
 * @category feedback
 */
@Directive({
  selector: '[cngxBannerOn]',
  standalone: true,
})
export class CngxBannerOn {
  private readonly bannerService = inject(CngxBanner, { optional: true });

  /** The async state to watch. */
  readonly state = input.required<CngxAsyncState<unknown>>({ alias: 'cngxBannerOn' });

  /** Required banner id — dedup key. */
  readonly bannerId = input.required<string>();

  /** Banner message on error. */
  readonly bannerError = input<string | undefined>(undefined);

  /** Banner severity on error. Default `'error'`. */
  readonly bannerSeverity = input<'error' | 'warning'>('error');

  /** Include error detail in the message. */
  readonly bannerErrorDetail = input<boolean>(false);

  constructor() {
    if (!this.bannerService) {
      throw new Error(
        '[cngxBannerOn] CngxBanner not found. ' + 'Add withBanners() to provideFeedback().',
      );
    }
    const banner = this.bannerService;

    const tracker = createTransitionTracker(() => this.state().status());

    effect(() => {
      const s = this.state();
      const status = tracker.current();
      const previous = tracker.previous();

      if (status === previous) {
        return;
      }

      if (status === 'error') {
        const msg = this.bannerError();
        if (msg) {
          const err = s.error();
          const detail =
            this.bannerErrorDetail() && err != null
              ? err instanceof Error
                ? err.message
                : typeof err === 'string'
                  ? err
                  : undefined
              : undefined;
          banner.show({
            message: detail ? `${msg}: ${detail}` : msg,
            id: this.bannerId(),
            severity: this.bannerSeverity(),
          });
        }
      }

      // Auto-dismiss on success or idle (condition resolved)
      if (status === 'success' || status === 'idle') {
        banner.dismiss(this.bannerId());
      }
    });
  }
}
