import {
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  isDevMode,
  ViewEncapsulation,
} from '@angular/core';
import { dateTimeFormatterFor, injectLocale } from '@cngx/core/utils';

import { injectCardI18n } from './i18n/card-i18n';

/** @internal One piece of the timestamp message, in reading order. */
interface TimestampSegment {
  readonly kind: 'text' | 'prefix' | 'date';
  readonly text: string;
}

function segmentsEqual(a: readonly TimestampSegment[], b: readonly TimestampSegment[]): boolean {
  return (
    a.length === b.length &&
    a.every((segment, i) => segment.kind === b[i].kind && segment.text === b[i].text)
  );
}

const TIMESTAMP_PLACEHOLDER = /\{(prefix|date)\}/;
const DATE_ONLY: readonly TimestampSegment[] = [{ kind: 'date', text: '' }];

/**
 * @internal Splits the `timestamp` message into its prefix, date and text
 * pieces. Whitespace between them is the host's gap; a message without
 * `{date}` still shows the date last.
 */
function timestampSegments(message: string): readonly TimestampSegment[] {
  const segments: TimestampSegment[] = [];
  message.split(TIMESTAMP_PLACEHOLDER).forEach((part, index) => {
    if (index % 2 === 1) {
      segments.push({ kind: part as 'prefix' | 'date', text: '' });
      return;
    }
    const text = part.trim();
    if (text) {
      segments.push({ kind: 'text', text });
    }
  });
  if (!segments.some((segment) => segment.kind === 'date')) {
    segments.push(DATE_ONLY[0]);
  }
  return segments;
}

/**
 * Displays a formatted date/timestamp, typically in a card footer.
 *
 * Uses `Intl.DateTimeFormat` with the app locale (`CNGX_LOCALE`, falling back
 * to the nearest `LOCALE_ID`); a locale flip re-formats. The order of the
 * prefix and the date comes from the `timestamp` message of the card
 * language section (English `'{prefix} {date}'`).
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
    @for (segment of segments(); track $index) {
      @switch (segment.kind) {
        @case ('prefix') {
          <span class="cngx-card-timestamp__prefix">{{ prefix() }}</span>
        }
        @case ('date') {
          <time [attr.datetime]="isoDate()" class="cngx-card-timestamp__date">
            {{ formattedDate() }}
          </time>
        }
        @default {
          {{ segment.text }}
        }
      }
    }
  `,
  styleUrls: ['./card-timestamp.component.css'],
})
export class CngxCardTimestamp {
  private readonly locale = injectLocale();
  private readonly i18n = injectCardI18n();

  /** Date to display. Accepts Date objects or ISO strings. */
  readonly date = input.required<Date | string>();

  /**
   * Optional prefix text (e.g. "Evaluierung am:"). Placed before or after the
   * date by the `timestamp` message of the card language section.
   */
  readonly prefix = input<string | undefined>(undefined);

  /** `Intl.DateTimeFormatOptions` for the date. */
  readonly format = input<Intl.DateTimeFormatOptions | undefined>(undefined);

  /** @internal Prefix, date and message text in the language's reading order. */
  protected readonly segments = computed(
    () => (this.prefix() ? timestampSegments(this.i18n().timestamp) : DATE_ONLY),
    { equal: segmentsEqual },
  );

  /**
   * @internal Coerced instant, deduped by time value so a fresh-ref
   * `[date]` rebind of the same instant does not cascade the render
   * graph. NaN pairs compare equal - two Invalid Dates must dedupe too
   * (NaN !== NaN would defeat the arm). Mirrors `CngxTime.instant`.
   */
  protected readonly dateObj = computed(
    () => {
      const d = this.date();
      return typeof d === 'string' ? new Date(d) : d;
    },
    {
      equal: (a, b) => {
        const ta = a.getTime();
        const tb = b.getTime();
        return ta === tb || (Number.isNaN(ta) && Number.isNaN(tb));
      },
    },
  );

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
    return dateTimeFormatterFor(this.locale(), fmt).format(this.dateObj());
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
