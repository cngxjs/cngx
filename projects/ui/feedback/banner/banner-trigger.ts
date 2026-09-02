import {
  Component,
  DestroyRef,
  effect,
  inject,
  input,
  linkedSignal,
  untracked,
} from '@angular/core';

import type { AlertSeverity } from '../alert/alert';
import { CngxBanner } from './banner.service';

/**
 * Declarative banner trigger - renders nothing, shows/dismisses a global banner
 * when `[when]` changes.
 *
 * When `[when]` becomes `true`, the banner appears. When `false`, it is dismissed.
 * The banner's lifecycle is tied to the signal - perfect for reactive system state
 * like `isOffline()` or `sessionExpiring()`.
 *
 * Requires `provideFeedback(withBanners())`.
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
 * @category ui/feedback/banner
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/feedback/banner/banner-trigger.ts
 * @since 0.1.0
 * @relatedTo CngxBanner, CngxBannerOutlet, CngxBannerOn
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

  /**
   * Required unique id - dedup key, shared by design. Any code (or another
   * trigger) using the same id updates and dismisses the same banner; there
   * is no per-instance guard. Namespace ids (`net:offline`, `auth:session`)
   * to avoid unintended collisions.
   */
  readonly id = input.required<string>();

  /** Visual severity. */
  readonly severity = input<AlertSeverity>('info');

  /** Show dismiss button. */
  readonly dismissible = input<boolean>(true);

  /** Action button label. */
  readonly actionLabel = input<string | undefined>(undefined);

  /** Action button handler. */
  readonly actionHandler = input<(() => void | Promise<void>) | undefined>(undefined);

  /** @internal - id transition derived via linkedSignal, not managed in the effect. */
  private readonly idTransition = linkedSignal<
    string,
    { current: string; previous: string | undefined }
  >({
    source: this.id,
    computation: (current, prev) => ({ current, previous: prev?.value.current }),
    equal: (a, b) => a.current === b.current && a.previous === b.previous,
  });

  constructor() {
    if (!this.banner) {
      throw new Error(
        '[cngx-banner-trigger] CngxBanner not found. ' + 'Add withBanners() to provideFeedback().',
      );
    }
    const banner = this.banner;

    // Input reads stay tracked (message/severity updates re-show under the
    // same id); only the service calls leave the reactive graph.
    effect(() => {
      const show = this.when();
      const { current: id, previous } = this.idTransition();

      // An id rebind while shown must not orphan the old banner - the old
      // key would otherwise linger until destroy.
      if (previous !== undefined && previous !== id) {
        untracked(() => banner.dismiss(previous));
      }

      if (show) {
        const label = this.actionLabel();
        const handler = this.actionHandler();
        const config = {
          message: this.message(),
          id,
          severity: this.severity(),
          dismissible: this.dismissible(),
          action: label && handler ? { label, handler } : undefined,
        };
        untracked(() => banner.show(config));
      } else {
        untracked(() => banner.dismiss(id));
      }
    });

    this.destroyRef.onDestroy(() => {
      const id = this.id();
      banner.dismiss(id);
    });
  }
}
