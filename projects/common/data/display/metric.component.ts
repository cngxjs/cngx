import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  LOCALE_ID,
  ViewEncapsulation,
} from '@angular/core';

/**
 * Displays a formatted numeric value with optional unit.
 *
 * Uses `Intl.NumberFormat` with the injected `LOCALE_ID` for locale-aware
 * formatting. Null values render as an em-dash.
 *
 * Composable — works inside any card variant, header, body, or standalone.
 *
 * @usageNotes
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
 * @category card
 */
@Component({
  selector: 'cngx-metric',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'cngx-metric',
    '[attr.aria-label]': 'accessibleValue()',
  },
  template: `
    <span class="cngx-metric__value">{{ formattedValue() }}</span>
    @if (unit()) {
      <span class="cngx-metric__unit">{{ unit() }}</span>
    }
  `,
})
export class CngxMetric {
  private readonly locale = inject(LOCALE_ID);

  /** Numeric or string value. `null` renders as em-dash. */
  readonly value = input.required<number | string | null>();

  /** Unit suffix (e.g. "bpm", "h", "%", "kg"). */
  readonly unit = input<string | undefined>(undefined);

  /** `Intl.NumberFormatOptions` for the primary value. */
  readonly format = input<Intl.NumberFormatOptions | undefined>(undefined);

  /** @internal */
  readonly formattedValue = computed(() => {
    const v = this.value();
    if (v === null) {
      return '\u2014';
    }
    if (typeof v === 'string') {
      return v;
    }
    return this.format()
      ? new Intl.NumberFormat(this.locale, this.format()).format(v)
      : v.toLocaleString(this.locale);
  });

  /** @internal Full accessible description including unit. */
  readonly accessibleValue = computed(() => {
    const v = this.formattedValue();
    const u = this.unit();
    return u ? `${v} ${u}` : v;
  });
}
