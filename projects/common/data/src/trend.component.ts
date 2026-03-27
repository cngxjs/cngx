import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  ViewEncapsulation,
} from '@angular/core';

/**
 * Displays a trend indicator with directional arrow and formatted percentage.
 *
 * Positive values show an up arrow, negative a down arrow, zero a right arrow.
 * The consumer can override the SR label for full context
 * (e.g. "vs. last month" instead of the generic default).
 *
 * @usageNotes
 *
 * ### Basic
 * ```html
 * <cngx-trend [value]="5.3" />
 * ```
 *
 * ### With custom label
 * ```html
 * <cngx-trend [value]="-2.1" label="-2.1% vs. last quarter" />
 * ```
 *
 * ### Inside a card header
 * ```html
 * <cngx-card>
 *   <header cngxCardHeader>
 *     <span>Revenue</span>
 *     <cngx-trend [value]="revenue().trend" />
 *   </header>
 * </cngx-card>
 * ```
 *
 * @category card
 */
@Component({
  selector: 'cngx-trend',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'cngx-trend',
    '[class.cngx-trend--up]': 'value() > 0',
    '[class.cngx-trend--down]': 'value() < 0',
    '[attr.aria-label]': 'resolvedLabel()',
  },
  template: `
    <span aria-hidden="true">{{ icon() }}</span>
    {{ formattedValue() }}
  `,
})
export class CngxTrend {
  /** Trend percentage. Positive = up, negative = down, zero = flat. */
  readonly value = input.required<number>();

  /** Consumer-provided SR label override. When set, replaces the generated default. */
  readonly label = input<string | undefined>(undefined);

  /** @internal */
  readonly icon = computed(() =>
    this.value() > 0 ? '\u2191' : this.value() < 0 ? '\u2193' : '\u2192',
  );

  /** @internal */
  readonly formattedValue = computed(() => {
    const v = this.value();
    const abs = Math.abs(v);
    return `${v > 0 ? '+' : ''}${abs.toFixed(1)}\u202F%`;
  });

  /** @internal */
  readonly resolvedLabel = computed(() => {
    if (this.label()) {
      return this.label()!;
    }
    const dir = this.value() > 0 ? 'up' : this.value() < 0 ? 'down' : 'unchanged';
    return `${this.formattedValue()} ${dir}`;
  });
}
