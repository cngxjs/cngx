import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  type Signal,
  untracked,
  ViewEncapsulation,
} from '@angular/core';

import { CNGX_STEPPER_HOST, type CngxStepNode } from './stepper-host.token';
import { injectStepperI18n } from './i18n/stepper-i18n';

/**
 * Minimal contract `CngxStepperCount` reads off the host. A full
 * {@link CngxStepperHost} satisfies it, but consumers can also supply
 * a narrower stub (useful in tests, custom layouts, or non-standard
 * step containers that surface just these two signals).
 *
 * @category common/stepper
 */
export interface CngxStepperCountHost {
  readonly activeStepIndex: Signal<number>;
  readonly stepsOnly: Signal<readonly CngxStepNode[]>;
}

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
 * <example-url>http://localhost:4200/#/ui/stepper/stepper-count/multi-instance-format-overrides</example-url>
 */
@Component({
  selector: 'cngx-stepper-count',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  // Two spans so only the live one reads copy untracked: a language switch
  // re-renders a plain caption at once, while a live caption keeps its text
  // until the next step change (no re-announcement). `live` is a mount-time
  // choice; the live span exists from the first render, before any change
  // it announces.
  template: `
    @if (live()) {
      <span aria-live="polite">{{ liveLabel() }}</span>
    } @else {
      <span>{{ label() }}</span>
    }
  `,
  // isolate fences the caption from the surrounding text. The direction is
  // inherited: the default caption is translated text and reads in the
  // language's direction. A consumer `format` that renders a bare `N / M`
  // ratio can pin it with --cngx-stepper-count-direction: ltr. Bidi is
  // visual-only - AT reads DOM order, so the announced string is unchanged.
  styles: `
    .cngx-stepper-count span {
      unicode-bidi: var(--cngx-stepper-count-bidi, isolate);
      direction: var(--cngx-stepper-count-direction, inherit);
    }
  `,
  host: {
    class: 'cngx-stepper-count',
  },
})
export class CngxStepperCount {
  /**
   * When `true`, wraps the rendered string in an `aria-live="polite"` span.
   * Set it once per instance: toggling it swaps the span, and the region
   * content present at that moment is not announced.
   */
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
   * its DI tree. Accepts {@link CngxStepperCountHost} so a narrow stub
   * (active index + steps signal) also fits.
   */
  readonly host = input<CngxStepperCountHost | null>(null);

  private readonly injectedHost = inject(CNGX_STEPPER_HOST, { optional: true });
  private readonly i18n = injectStepperI18n();
  private readonly resolvedHost = computed<CngxStepperCountHost | null>(
    () => this.host() ?? this.injectedHost,
  );

  /** 1-based active position and step total, or `null` while there is nothing to count. */
  private readonly position = computed<{ current: number; total: number } | null>(
    () => {
      const host = this.resolvedHost();
      if (!host) {
        return null;
      }
      const total = host.stepsOnly().length;
      if (total === 0) {
        return null;
      }
      // Clamp against the live total - a transiently out-of-range active
      // index (steps removed at runtime) must not render "Step 5 of 3".
      const current = Math.min(Math.max(host.activeStepIndex() + 1, 1), total);
      return { current, total };
    },
    { equal: (a, b) => a?.current === b?.current && a?.total === b?.total },
  );

  /** Resolved caption - reactive on activeStepIndex / stepsOnly / format / i18n. */
  protected readonly label = computed<string>(() => {
    const position = this.position();
    if (!position) {
      return '';
    }
    const fmt = this.format() ?? this.i18n().textStepperFormat;
    return fmt(position.current, position.total);
  });

  /**
   * {@link label} for the live span: the bundle and a consumer `format`
   * (which may itself be language-dependent) are read untracked.
   */
  protected readonly liveLabel = computed<string>(() => {
    const position = this.position();
    if (!position) {
      return '';
    }
    return untracked(() =>
      (this.format() ?? this.i18n().textStepperFormat)(position.current, position.total),
    );
  });
}
