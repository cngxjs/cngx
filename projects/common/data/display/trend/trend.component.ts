import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  LOCALE_ID,
  ViewEncapsulation,
} from '@angular/core';

import { deltaDirection, directionGlyph, formatDelta } from '../shared/delta-format';

/**
 * Displays a trend indicator with directional arrow and formatted percentage.
 *
 * Positive values show an up arrow, negative a down arrow, zero a right arrow.
 * The consumer can override the SR label for full context
 * (e.g. "vs. last month" instead of the generic default).
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
 * @category common/data/metric
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/data/display/trend/trend.component.ts
 * @since 0.1.0
 * @relatedTo CngxMetric, CngxCard
 *
 * <example-url>http://localhost:4200/#/common/data/trend/composed-with-metric-in-a-card</example-url>
 * <example-url>http://localhost:4200/#/common/data/trend/trend-directions</example-url>
 */
@Component({
  selector: 'cngx-trend',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'cngx-trend',
    // role=img makes the host a single labelled graphic so AT announces the
    // curated `aria-label` instead of the raw glyph text on an otherwise
    // role=generic custom element, where aria-label is unreliably exposed.
    role: 'img',
    '[class.cngx-trend--up]': 'value() > 0',
    '[class.cngx-trend--down]': 'value() < 0',
    '[attr.aria-label]': 'resolvedLabel()',
  },
  template: `
    <span aria-hidden="true">{{ icon() }}</span>
    {{ formattedValue() }}
  `,
  styleUrls: ['./trend.component.css'],
})
export class CngxTrend {
  private readonly locale = inject(LOCALE_ID);

  /** Trend percentage. Positive = up, negative = down, zero = flat. */
  readonly value = input.required<number>();

  /** Consumer-provided SR label override. When set, replaces the generated default. */
  readonly label = input<string | undefined>(undefined);

  /** @internal */
  protected readonly icon = computed(() => directionGlyph(deltaDirection(this.value())));

  /** @internal */
  protected readonly formattedValue = computed(() => formatDelta(this.value(), 'percent', this.locale));

  /** @internal */
  protected readonly resolvedLabel = computed(() => {
    if (this.label()) {
      return this.label()!;
    }
    const direction = deltaDirection(this.value());
    const dir = direction === 'up' ? 'up' : direction === 'down' ? 'down' : 'unchanged';
    return `${this.formattedValue()} ${dir}`;
  });
}
