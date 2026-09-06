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
import { memoize } from '@cngx/core/utils';

/**
 * Unit ladder for the relative formatter, smallest first. Each `amount` is the
 * count of that unit in the next-larger one; anything past `months` falls
 * through to the `years` return.
 */
/**
 * Per-locale `Intl.RelativeTimeFormat` cache - the options are fixed, so the
 * locale alone keys the instance. Constructing Intl formatters is the
 * expensive half of formatting; the cache makes recomputes allocation-free.
 */
const relativeFormatterFor = memoize(
  (locale: string) => new Intl.RelativeTimeFormat(locale, { numeric: 'auto' }),
);

/**
 * `Intl.DateTimeFormat` cache keyed on locale + serialized options.
 * Consumers bind static option literals, so the key space stays small.
 */
const dateTimeFormatterFor = memoize((key: string): Intl.DateTimeFormat => {
  const [locale, options] = JSON.parse(key) as [string, Intl.DateTimeFormatOptions];
  return new Intl.DateTimeFormat(locale, options);
});

const RELATIVE_DIVISIONS: readonly { readonly amount: number; readonly unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: 'seconds' },
  { amount: 60, unit: 'minutes' },
  { amount: 24, unit: 'hours' },
  { amount: 7, unit: 'days' },
  { amount: 4.34524, unit: 'weeks' },
  { amount: 12, unit: 'months' },
];

/**
 * Locale-aware `<time>` display atom. Renders a machine-readable
 * `datetime` attribute (ISO 8601) plus a human string in one of two modes:
 * `absolute` (via `Intl.DateTimeFormat`) or `relative` (via
 * `Intl.RelativeTimeFormat`, e.g. "3 days ago"). Formatting resolves against
 * the injected `LOCALE_ID` - English out of the box, locale-driven when the app
 * provides one; no hardcoded strings.
 *
 * Relative mode is render-time, not live-ticking: it recomputes when `[date]`
 * changes, not on a timer, so "2 minutes ago" does not self-update. A consumer
 * that needs a live clock re-binds `[date]`; a timer-driven variant is an
 * explicit non-goal for the atom.
 *
 * ```html
 * <cngx-time [date]="publishedAt()" mode="relative" />
 * <cngx-time [date]="invoice.due" [format]="{ dateStyle: 'long' }" />
 * ```
 *
 * @category common/display
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/display/time/time.component.ts
 * @since 0.1.0
 * @relatedTo CngxCardTimestamp
 */
@Component({
  selector: 'cngx-time',
  exportAs: 'cngxTime',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  styleUrls: ['./time.component.css'],
  host: {
    class: 'cngx-time',
  },
  template: `<time [attr.datetime]="iso()">{{ formatted() }}</time>`,
})
export class CngxTime {
  private readonly locale = inject(LOCALE_ID);

  /** Instant to render. Accepts a `Date`, an ISO string, or an epoch-ms number. */
  readonly date = input.required<Date | string | number>();
  /**
   * `absolute` formats a calendar date/time; `relative` formats the distance
   * from now (past or future) with `Intl.RelativeTimeFormat`.
   */
  readonly mode = input<'absolute' | 'relative'>('absolute');
  /** `Intl.DateTimeFormatOptions` for `absolute` mode; ignored in `relative` mode. */
  readonly format = input<Intl.DateTimeFormatOptions | undefined>(undefined);

  /**
   * Coerced instant. A `Date`; downstream reads its time value. The `equal` fn
   * dedupes by time value so re-binding `[date]` to a fresh `Date` of the same
   * instant (or the equivalent ISO string) does not cascade `iso`/`formatted` -
   * the object-computed equality rule. NaN pairs compare equal - without the
   * arm, two Invalid Dates would defeat the dedupe (NaN !== NaN) and cascade
   * on every rebind.
   */
  protected readonly instant = computed<Date>(
    () => {
      const value = this.date();
      return value instanceof Date ? value : new Date(value);
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
   * Invalid Date guard. `toISOString()` throws and `Intl.format` renders
   * garbage on an invalid instant - a bad ISO string must degrade to an
   * empty render, not crash change detection.
   */
  protected readonly isValidDate = computed(() => !Number.isNaN(this.instant().getTime()));

  /** Machine-readable ISO 8601 for the `datetime` attribute. `null` (attribute removed) when the instant is invalid. */
  protected readonly iso = computed(() => (this.isValidDate() ? this.instant().toISOString() : null));

  /**
   * Human string. Reads `Date.now()` in `relative` mode as a render-time
   * snapshot - untracked by design, so the value recomputes only when `[date]`
   * (or `mode`/`format`) changes, never on a timer.
   */
  protected readonly formatted = computed(() => {
    if (!this.isValidDate()) {
      return '';
    }
    const instant = this.instant();
    if (this.mode() === 'relative') {
      return this.formatRelative(instant.getTime(), Date.now());
    }
    const format = this.format() ?? { year: 'numeric', month: 'short', day: 'numeric' };
    return dateTimeFormatterFor(JSON.stringify([this.locale, format])).format(instant);
  });

  constructor() {
    if (isDevMode()) {
      effect(() => {
        if (!this.isValidDate()) {
          console.warn(
            '[CngxTime] [date] resolved to an Invalid Date - rendering empty. ' +
              'Check the bound value (bad ISO string?).',
          );
        }
      });
    }
  }

  private formatRelative(target: number, now: number): string {
    const rtf = relativeFormatterFor(this.locale);
    let delta = (target - now) / 1000;
    for (const division of RELATIVE_DIVISIONS) {
      if (Math.abs(delta) < division.amount) {
        return rtf.format(Math.round(delta), division.unit);
      }
      delta /= division.amount;
    }
    return rtf.format(Math.round(delta), 'years');
  }
}
