import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  type Signal,
  ViewEncapsulation,
} from '@angular/core';

const SEGMENT_COUNT = 4;
const STRENGTH_LEVELS = ['none', 'weak', 'fair', 'good', 'strong'] as const;

const filledEqual = (a: readonly boolean[], b: readonly boolean[]): boolean =>
  a.length === b.length && a.every((v, i) => v === b[i]);

/**
 * Decorative password-strength meter - four segments that fill with the 0..4
 * `score`. Pairs with `CngxPasswordStrength`, which owns the live
 * announcement; the meter is `aria-hidden` so it never double-announces what
 * the directive already says.
 *
 * Takes a `score`, not a password, so it carries no forms dependency and stays
 * a Level-2 visual atom beside `CngxBadge`/`CngxCheckboxIndicator`. Render it
 * from the directive's signal, or drive it from any 0..4 source. All colours
 * and sizes are `--cngx-password-strength-meter-*` custom properties; the
 * filled colour keys off the `data-strength` host attribute.
 *
 * ```html
 * <input cngxPasswordStrength #pw="cngxPasswordStrength" type="password" />
 * <cngx-password-strength-meter [score]="pw.score()" />
 * ```
 *
 * @category common/display
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/display/password-strength-meter/password-strength-meter.component.ts
 * @since 0.2.0
 * @relatedTo CngxSegmentedProgress, CngxBadge
 */
@Component({
  selector: 'cngx-password-strength-meter',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'cngx-password-strength-meter',
    'aria-hidden': 'true',
    '[attr.data-strength]': 'level()',
  },
  template: `
    @for (filled of segments(); track $index) {
      <span
        class="cngx-password-strength-meter__segment"
        [attr.data-filled]="filled"
        aria-hidden="true"
      ></span>
    }
  `,
  styleUrl: './password-strength-meter.css',
})
export class CngxPasswordStrengthMeter {
  /** Strength score, 0 (empty/trivial) to 4 (strong). */
  readonly score = input.required<number>();

  /** `score` clamped and integer-floored to the rendered 0..4 range. */
  private readonly clampedScore: Signal<number> = computed(() =>
    Math.max(0, Math.min(SEGMENT_COUNT, Math.trunc(this.score()))),
  );

  /** Per-segment filled flags; the first `clampedScore` segments are filled. */
  protected readonly segments: Signal<readonly boolean[]> = computed(
    () => Array.from({ length: SEGMENT_COUNT }, (_, i) => i < this.clampedScore()),
    { equal: filledEqual },
  );

  /** Coarse strength word for the `data-strength` theming hook. */
  protected readonly level: Signal<string> = computed(() => STRENGTH_LEVELS[this.clampedScore()]);
}
