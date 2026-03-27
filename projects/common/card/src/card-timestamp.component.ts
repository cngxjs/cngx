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
 * Displays a formatted date/timestamp, typically in a card footer.
 *
 * Uses `Intl.DateTimeFormat` with the injected `LOCALE_ID`.
 *
 * @usageNotes
 *
 * ```html
 * <cngx-card>
 *   <footer cngxCardFooter>
 *     <cngx-card-timestamp [date]="evaluationDate()" prefix="Evaluierung am:" />
 *   </footer>
 * </cngx-card>
 * ```
 *
 * @category card
 */
@Component({
  selector: 'cngx-card-timestamp',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'cngx-card-timestamp',
  },
  template: `
    @if (prefix()) {
      <span class="cngx-card-timestamp__prefix">{{ prefix() }}</span>
    }
    <time [attr.datetime]="isoDate()" class="cngx-card-timestamp__date">
      {{ formattedDate() }}
    </time>
  `,
})
export class CngxCardTimestamp {
  private readonly locale = inject(LOCALE_ID);

  /** Date to display. Accepts Date objects or ISO strings. */
  readonly date = input.required<Date | string>();

  /** Optional prefix text before the date (e.g. "Evaluierung am:"). */
  readonly prefix = input<string | undefined>(undefined);

  /** `Intl.DateTimeFormatOptions` for the date. */
  readonly format = input<Intl.DateTimeFormatOptions | undefined>(undefined);

  /** @internal */
  protected readonly dateObj = computed(() => {
    const d = this.date();
    return typeof d === 'string' ? new Date(d) : d;
  });

  /** @internal */
  protected readonly isoDate = computed(() => this.dateObj().toISOString());

  /** @internal */
  protected readonly formattedDate = computed(() => {
    const fmt = this.format() ?? {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    };
    return new Intl.DateTimeFormat(this.locale, fmt).format(this.dateObj());
  });
}
