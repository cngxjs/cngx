import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  LOCALE_ID,
  ViewEncapsulation,
} from '@angular/core';

import {
  deltaDirection,
  deltaSentiment,
  directionGlyph,
  formatDelta,
  type DeltaMode,
  type DeltaPolarity,
  type DeltaSentiment,
} from '../shared/delta-format';

const SENTIMENT_WORD: Record<DeltaSentiment, string> = {
  positive: 'improved',
  negative: 'declined',
  neutral: 'unchanged',
};

/**
 * Sentiment-aware delta indicator. Where `CngxTrend` colours strictly by
 * direction (up = green), `CngxDelta` colours by **sentiment**: a `polarity`
 * of `lower-is-better` makes a drop read as an improvement (churn, latency,
 * error rate). The arrow glyph always tracks the raw direction, so colour is
 * never the only signal - a green value can carry a down arrow, and the SR
 * label speaks the sentiment word.
 *
 * Sentiment, direction, glyph and the formatted magnitude are each a
 * `computed()` off the single `value`/`polarity` input pair (Pillar 1); the
 * colour class and the arrow are bound from independent signals so they can
 * diverge (Pillar 2).
 *
 * ### Basic (higher-is-better default)
 * ```html
 * <cngx-delta [value]="5.3" />
 * ```
 *
 * ### Lower-is-better (a drop is good)
 * ```html
 * <cngx-delta [value]="-2.1" polarity="lower-is-better" />
 * ```
 *
 * ### Absolute magnitude
 * ```html
 * <cngx-delta [value]="1240" mode="absolute" [format]="{ maximumFractionDigits: 0 }" />
 * ```
 *
 * @category common/data/metric
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/data/display/delta/delta.component.ts
 * @since 0.1.0
 * @relatedTo CngxTrend, CngxMetric, CngxStat
 *
 * <example-url>http://localhost:4200/#/common/data/delta/sentiment-polarity</example-url>
 */
@Component({
  selector: 'cngx-delta',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'cngx-delta',
    // role=img makes the host a single labelled graphic so AT announces the
    // curated `aria-label` (the sentiment word) instead of the raw glyph text
    // on an otherwise role=generic custom element, where aria-label is
    // unreliably exposed.
    role: 'img',
    '[class.cngx-delta--positive]': "sentiment() === 'positive'",
    '[class.cngx-delta--negative]': "sentiment() === 'negative'",
    '[class.cngx-delta--neutral]': "sentiment() === 'neutral'",
    '[attr.aria-label]': 'resolvedLabel()',
  },
  template: `
    <span aria-hidden="true">{{ glyph() }}</span>
    {{ formattedValue() }}
  `,
  styleUrls: ['./delta.component.css'],
})
export class CngxDelta {
  private readonly locale = inject(LOCALE_ID);

  /** Signed delta. Positive = up, negative = down, zero = flat. */
  readonly value = input.required<number>();

  /**
   * How to read the sign. `higher-is-better` (default) treats a rise as
   * positive; `lower-is-better` inverts it; `neutral` disables sentiment
   * (direction still renders, colour stays neutral).
   */
  readonly polarity = input<DeltaPolarity>('higher-is-better');

  /** `percent` (default, one fraction digit + `%`) or `absolute`. */
  readonly mode = input<DeltaMode>('percent');

  /** `Intl.NumberFormatOptions` applied to the magnitude in either mode. */
  readonly format = input<Intl.NumberFormatOptions | undefined>(undefined);

  /** Consumer-provided SR label override. Replaces the generated default. */
  readonly label = input<string | undefined>(undefined);

  /** @internal Raw movement, independent of polarity. Drives the glyph. */
  protected readonly direction = computed(() => deltaDirection(this.value()));

  /** @internal Good / bad / indifferent. Drives colour and the SR word. */
  protected readonly sentiment = computed(() => deltaSentiment(this.direction(), this.polarity()));

  /** @internal Arrow glyph bound from direction only. */
  protected readonly glyph = computed(() => directionGlyph(this.direction()));

  /** @internal Formatted magnitude. */
  protected readonly formattedValue = computed(() =>
    formatDelta(this.value(), this.mode(), this.locale, this.format()),
  );

  /** @internal Full SR label: magnitude plus the sentiment word. */
  protected readonly resolvedLabel = computed(() => {
    const override = this.label();
    if (override) {
      return override;
    }
    return `${this.formattedValue()} ${SENTIMENT_WORD[this.sentiment()]}`;
  });
}
