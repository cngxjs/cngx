import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  inject,
  input,
  isDevMode,
  LOCALE_ID,
  ViewEncapsulation,
} from '@angular/core';

/**
 * Displays a formatted date/timestamp, typically in a card footer.
 *
 * Uses `Intl.DateTimeFormat` with the injected `LOCALE_ID`.
 *
 * ```html
 * <cngx-card>
 *   <footer cngxCardFooter>
 *     <cngx-card-timestamp [date]="evaluationDate()" prefix="Evaluierung am:" />
 *   </footer>
 * </cngx-card>
 * ```
 *
 * @category common/card
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/card/card-timestamp.component.ts
 * @since 0.1.0
 * @relatedTo CngxCard, CngxCardFooter
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
  styleUrls: ['./card-timestamp.component.css'],
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

  /**
   * @internal Invalid Date guard. `toISOString()` throws and
   * `Intl.format` renders garbage on an invalid instant - a bad ISO
   * string must degrade to an empty render, not crash change detection.
   */
  protected readonly isValidDate = computed(() => !Number.isNaN(this.dateObj().getTime()));

  /** @internal `null` (attribute removed) when the instant is invalid. */
  protected readonly isoDate = computed(() =>
    this.isValidDate() ? this.dateObj().toISOString() : null,
  );

  /** @internal Empty string when the instant is invalid. */
  protected readonly formattedDate = computed(() => {
    if (!this.isValidDate()) {
      return '';
    }
    const fmt = this.format() ?? {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    };
    return new Intl.DateTimeFormat(this.locale, fmt).format(this.dateObj());
  });

  constructor() {
    if (isDevMode()) {
      effect(() => {
        if (!this.isValidDate()) {
          console.warn(
            '[CngxCardTimestamp] [date] resolved to an Invalid Date - rendering empty. ' +
              'Check the bound value (bad ISO string?).',
          );
        }
      });
    }
  }
}
