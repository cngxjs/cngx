import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';

import { CNGX_STEPPER_HOST, type CngxStepperHost } from './stepper-host.token';
import { injectStepperI18n } from './i18n/stepper-i18n';

/**
 * Reusable progress-hint atom for any stepper organism. Renders the
 * resolved `CngxStepperI18n.textStepperFormat(current, total)` string
 * inside a `<span>` and pipes the value through an `aria-live` region
 * so screen readers announce step transitions.
 *
 * The text shape is fully owned by the i18n format function - drop the
 * atom inside any `<cngx-stepper>` / `<cngx-mat-stepper>` /
 * `<cngx-progress-bar-stepper>` tree and override the format upstream
 * to change every instance at once:
 *
 * ```ts
 * provideStepperI18n(withStepperI18nLabels({
 *   textStepperFormat: (c, t) => `${c}/${t} complete`,
 * }));
 * ```
 *
 * Canonical shapes the atom supports without any markup changes:
 * - `Step N of M` (default)
 * - `N/M complete`
 * - `N/M`
 * - `Math.round(c/t * 100)%`
 * - any consumer-defined string the closure returns.
 *
 * `[live]="false"` opts the atom out of the `aria-live` region when
 * the caption sits next to another live region (e.g. a stepper that
 * already mounts its own live announcer) to prevent double announces.
 *
 * @category common/stepper
 * @docsKind primary
 * @since 0.1.0
 * @relatedTo CngxStepperHost, CngxStepperI18n
 */
@Component({
  selector: 'cngx-stepper-count',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  template: '<span [attr.aria-live]="live() ? \'polite\' : null">{{ label() }}</span>',
  host: {
    class: 'cngx-stepper-count',
  },
})
export class CngxStepperCount {
  /** When `true`, wraps the rendered string in an `aria-live="polite"` span. */
  readonly live = input<boolean>(true);

  /**
   * Per-instance format override. Receives `(current, total)` where
   * `current` is the 1-based active step position and `total` is
   * `host.stepsOnly().length`. When omitted, the resolved
   * `CngxStepperI18n.textStepperFormat` is used so two siblings can
   * each show a different shape inside the same stepper tree.
   */
  readonly format = input<((current: number, total: number) => string) | undefined>(undefined);

  /**
   * Explicit stepper-host reference. Set this when the atom sits
   * *outside* a `<cngx-stepper>` (e.g. in a sibling layout header)
   * by exporting the stepper as a template ref:
   * `<cngx-stepper #s="cngxStepper">` then `[host]="s.presenter"`.
   * When unset, the atom injects the ambient `CNGX_STEPPER_HOST` from
   * its DI tree.
   */
  readonly host = input<CngxStepperHost | null>(null);

  private readonly injectedHost = inject(CNGX_STEPPER_HOST, { optional: true });
  private readonly i18n = injectStepperI18n();
  private readonly resolvedHost = computed<CngxStepperHost | null>(
    () => this.host() ?? this.injectedHost,
  );

  /** Resolved caption - reactive on activeStepIndex / stepsOnly / format / i18n. */
  protected readonly label = computed<string>(() => {
    const host = this.resolvedHost();
    if (!host) {
      return '';
    }
    const current = host.activeStepIndex() + 1;
    const total = host.stepsOnly().length;
    const fmt = this.format() ?? this.i18n.textStepperFormat;
    return fmt(current, total);
  });
}
