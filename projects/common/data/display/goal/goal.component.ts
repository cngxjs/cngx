import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  type Signal,
  ViewEncapsulation,
} from '@angular/core';

/**
 * Determinate attainment bar - a continuous progress toward a target
 * (quota reached, budget spent, goal met). Named `CngxGoal` because
 * `cngx-progress` is the indeterminate async loading bar; this is the
 * finished-fraction indicator, distinct from that and from the discrete
 * `CngxSegmentedProgress`.
 *
 * Mirrors the `CngxSegmentedProgress` a11y shape: `role="progressbar"` with
 * the whole `aria-value*` set plus `aria-valuetext` living in the `computed()`
 * graph (Pillar 2). The value is clamped to `[0, max]`; the fill width is a
 * derived percent bound as a CSS custom property.
 *
 * ```html
 * <cngx-goal [value]="73" [max]="100" />
 * <cngx-goal [value]="q()" [max]="target()" [valueTextFormat]="quotaText" />
 * ```
 *
 * @category common/data/metric
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/data/display/goal/goal.component.ts
 * @since 0.1.0
 * @relatedTo CngxSegmentedProgress, CngxMetric
 *
 * <example-url>http://localhost:4200/#/common/data/goal/quota-attainment</example-url>
 */
@Component({
  selector: 'cngx-goal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'cngx-goal',
    role: 'progressbar',
    '[attr.aria-valuemin]': '0',
    '[attr.aria-valuemax]': 'maxValue()',
    '[attr.aria-valuenow]': 'now()',
    '[attr.aria-valuetext]': 'valueText()',
    '[style.--cngx-goal-fill.%]': 'fillPercent()',
  },
  template: `<span class="cngx-goal__track"><span class="cngx-goal__fill"></span></span>`,
  styleUrls: ['./goal.component.css'],
})
export class CngxGoal {
  /** Current attainment. Clamped to `[0, max]`. */
  readonly value = input.required<number>();

  /** Target the value works toward. Defaults to `100`. */
  readonly max = input<number>(100);

  /**
   * Override the `aria-valuetext` string. Receives `(now, max)` - the clamped
   * value and the target. The default is `(now, max) => \`${now} of ${max}\``.
   * Supply a localised closure for richer text (e.g.
   * `(n, m) => \`${n} of ${m}, ${Math.round((n / m) * 100)}% of quota\``).
   */
  readonly valueTextFormat = input<((now: number, max: number) => string) | undefined>(undefined);

  /** `aria-valuemax` - the target, floored at 0. */
  protected readonly maxValue: Signal<number> = computed(() => Math.max(0, this.max()));

  /** `aria-valuenow` - value clamped into `[0, max]`. */
  protected readonly now: Signal<number> = computed(() =>
    Math.max(0, Math.min(this.value(), this.maxValue())),
  );

  /** Fill width as a percent of the target; `0` when the target is `0`. */
  protected readonly fillPercent: Signal<number> = computed(() => {
    const max = this.maxValue();
    return max === 0 ? 0 : (this.now() / max) * 100;
  });

  /** `aria-valuetext` - human-readable attainment via the resolved closure. */
  protected readonly valueText: Signal<string> = computed(() => {
    const fmt = this.valueTextFormat() ?? ((now: number, max: number) => `${now} of ${max}`);
    return fmt(this.now(), this.maxValue());
  });
}
