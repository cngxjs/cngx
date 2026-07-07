import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  LOCALE_ID,
  ViewEncapsulation,
} from '@angular/core';

/** Largest-first unit ladder for the relative formatter. */
const RELATIVE_DIVISIONS: readonly { readonly amount: number; readonly unit: Intl.RelativeTimeFormatUnit }[] = [
  { amount: 60, unit: 'seconds' },
  { amount: 60, unit: 'minutes' },
  { amount: 24, unit: 'hours' },
  { amount: 7, unit: 'days' },
  { amount: 4.34524, unit: 'weeks' },
  { amount: 12, unit: 'months' },
  { amount: Number.POSITIVE_INFINITY, unit: 'years' },
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

  /** Coerced instant. A primitive-free `Date`; downstream reads its time value. */
  protected readonly instant = computed<Date>(() => {
    const value = this.date();
    return value instanceof Date ? value : new Date(value);
  });

  /** Machine-readable ISO 8601 for the `datetime` attribute. */
  protected readonly iso = computed(() => this.instant().toISOString());

  /**
   * Human string. Reads `Date.now()` in `relative` mode as a render-time
   * snapshot - untracked by design, so the value recomputes only when `[date]`
   * (or `mode`/`format`) changes, never on a timer.
   */
  protected readonly formatted = computed(() => {
    const instant = this.instant();
    if (this.mode() === 'relative') {
      return this.formatRelative(instant.getTime(), Date.now());
    }
    const format = this.format() ?? { year: 'numeric', month: 'short', day: 'numeric' };
    return new Intl.DateTimeFormat(this.locale, format).format(instant);
  });

  private formatRelative(target: number, now: number): string {
    const rtf = new Intl.RelativeTimeFormat(this.locale, { numeric: 'auto' });
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
