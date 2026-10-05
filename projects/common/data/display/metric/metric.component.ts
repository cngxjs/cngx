import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { formatMessage } from '@cngx/core/i18n';
import { injectLocale, numberFormatterFor } from '@cngx/core/utils';

import { injectKpiI18n } from '../shared/kpi-i18n';

const UNIT_PLACEHOLDER = /\{(value|unit)\}/;

/** @internal `true` when the language reads the unit before the value. */
function unitFirst(message: string): boolean {
  const [, first] = UNIT_PLACEHOLDER.exec(message) ?? [];
  return first === 'unit';
}

/**
 * Displays a formatted numeric value with optional unit.
 *
 * Uses `Intl.NumberFormat` with the app locale (`CNGX_LOCALE`, falling back to
 * the nearest `LOCALE_ID`) for locale-aware formatting; a locale flip
 * re-formats. A `null` value renders the placeholder glyph without its unit.
 *
 * Composable - works inside any card variant, header, body, or standalone.
 *
 * ### Basic
 * ```html
 * <cngx-metric [value]="1234" unit="bpm" />
 * ```
 *
 * ### With format options
 * ```html
 * <cngx-metric [value]="99.6" unit="%" [format]="{ maximumFractionDigits: 1 }" />
 * ```
 *
 * ### Inside a card
 * ```html
 * <cngx-card>
 *   <header cngxCardHeader>Puls</header>
 *   <cngx-metric cngxCardBody [value]="75" unit="bpm" />
 * </cngx-card>
 * ```
 *
 * @category common/data/metric
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/data/display/metric/metric.component.ts
 * @since 0.1.0
 * @relatedTo CngxTrend, CngxCard
 *
 * <example-url>http://localhost:4200/#/common/data/metric/inside-a-card</example-url>
 * <example-url>http://localhost:4200/#/common/data/metric/standalone-metrics</example-url>
 */
@Component({
  selector: 'cngx-metric',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'cngx-metric',
    // role=img makes the host a single labelled graphic so AT announces the
    // curated `aria-label` (value + unit) instead of the raw text on an
    // otherwise role=generic custom element, where aria-label is unreliably
    // exposed. Mirrors CngxDelta / CngxTrend.
    role: 'img',
    '[attr.aria-label]': 'accessibleValue()',
  },
  template: `
    @if (shownUnit() && unitFirst()) {
      <span class="cngx-metric__unit">{{ shownUnit() }}</span>
    }
    <span class="cngx-metric__value">{{ formattedValue() }}</span>
    @if (shownUnit() && !unitFirst()) {
      <span class="cngx-metric__unit">{{ shownUnit() }}</span>
    }
  `,
  styleUrls: ['./metric.component.css'],
})
export class CngxMetric {
  private readonly locale = injectLocale();
  private readonly i18n = injectKpiI18n();

  /**
   * Numeric or string value. `null` renders the `metricPlaceholder` glyph of
   * the kpi language section and is announced as its `metricNoValue` text.
   */
  readonly value = input.required<number | string | null>();

  /** Unit suffix (e.g. "bpm", "h", "%", "kg"). */
  readonly unit = input<string | undefined>(undefined);

  /** `Intl.NumberFormatOptions` for the primary value. */
  readonly format = input<Intl.NumberFormatOptions | undefined>(undefined);

  /** @internal */
  readonly formattedValue = computed(() => {
    const v = this.value();
    if (v === null) {
      return this.i18n().metricPlaceholder;
    }
    if (typeof v === 'string') {
      return v;
    }
    return numberFormatterFor(this.locale(), this.format() ?? {}).format(v);
  });

  /**
   * @internal The unit to render, `undefined` while there is no value: a
   * missing reading has no unit, so "No value km" is never shown or spoken.
   */
  protected readonly shownUnit = computed(() => {
    const unit = this.unit();
    return this.value() === null || unit === '' ? undefined : unit;
  });

  /** @internal Unit before value, per the `metricValueWithUnit` message. */
  protected readonly unitFirst = computed(() => unitFirst(this.i18n().metricValueWithUnit));

  /** @internal Full accessible description including unit. */
  readonly accessibleValue = computed(() => {
    const i18n = this.i18n();
    if (this.value() === null) {
      return i18n.metricNoValue;
    }
    const value = this.formattedValue();
    const unit = this.shownUnit();
    return unit ? formatMessage(i18n.metricValueWithUnit, { value, unit }, this.locale()) : value;
  });
}
