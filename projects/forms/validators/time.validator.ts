import { type AbstractControl, type ValidationErrors, type ValidatorFn } from '@angular/forms';
import {
  validate,
  type PathKind,
  type SchemaPath,
  type SchemaPathRules,
  type ValidationError,
} from '@angular/forms/signals';

/**
 * Options of {@link time} and {@link timeRange}.
 *
 * @category forms/validators
 * @since 0.1.0
 */
export interface TimeValidatorOptions {
  /**
   * The hour cycle a value without AM/PM is judged by. Pass it only when the
   * mask pins the cycle (`time:12` / `time:24`); a bare `time` mask follows the
   * locale, so leave it unset and let the value decide. A value that carries
   * AM/PM is always judged as 12-hour.
   */
  readonly cycle?: 12 | 24;
}

/**
 * The `timeRange` error {@link time} reports: `cycle` is the hour cycle the
 * value was judged by.
 *
 * @category forms/validators
 * @since 0.1.0
 */
export interface TimeRangeValidationError extends ValidationError.WithoutFieldTree {
  readonly kind: 'timeRange';
  readonly cycle: 12 | 24;
}

/** @internal A time of day read from a mask value, before the range check. */
interface ParsedTime {
  readonly hours: number;
  readonly minutes: number;
  readonly cycle: 12 | 24;
}

// The time at the end of the value: two digits, an optional separator, two
// digits, then an optional meridiem (`PM`, `p.m.`, `P M`) that is not the start
// of a longer word (`Abend` is suffix text), then only non-digit suffix text.
const TIME_TAIL = /(\d{2})\D?(\d{2})(?:\s*([ap])\.?\s?(m)?\.?(?!\p{L}))?\D*$/iu;

/**
 * Reads the time of day from what a time or datetime mask produces: the raw
 * value (`1430PM`, `123120251430PM`) or the display string (`02:30 PM`,
 * `12/31/2025 02:30 PM`). Four digits are a time, twelve a date (eight digits)
 * plus a time, and the value must end in `HH:MM` (separator optional) plus an
 * optional AM/PM and suffix text; any other count or shape, a half-typed
 * meridiem (`1430P`) or a non-string is no verdict yet (`null`).
 * @internal
 */
function parseTimeOfDay(value: unknown, cycle: 12 | 24 | undefined): ParsedTime | null {
  if (typeof value !== 'string' || value === '') {
    return null;
  }
  const digits = value.replace(/\D/g, '');
  if (digits.length !== 4 && digits.length !== 12) {
    return null;
  }
  const tail = TIME_TAIL.exec(value);
  if (!tail) {
    return null;
  }
  const [, hours, minutes, meridiem, m] = tail;
  if (meridiem && !m) {
    return null;
  }
  return {
    hours: Number(hours),
    minutes: Number(minutes),
    cycle: meridiem ? 12 : (cycle ?? 24),
  };
}

/** @internal Whether a parsed time lies inside its cycle's range. */
function isTimeInRange({ hours, minutes, cycle }: ParsedTime): boolean {
  const hoursOk = cycle === 12 ? hours >= 1 && hours <= 12 : hours <= 23;
  return hoursOk && minutes <= 59;
}

/** @internal The cycle of an out-of-range time, or `null` when valid or undecided. */
function timeRangeCycle(value: unknown, options: TimeValidatorOptions | undefined): 12 | 24 | null {
  const parsed = parseTimeOfDay(value, options?.cycle);
  return parsed && !isTimeInRange(parsed) ? parsed.cycle : null;
}

/**
 * Signal Forms rule: reports `{ kind: 'timeRange', cycle }` when the field
 * holds a complete time outside its hour cycle (`25:00`, `10:75`, `14:30 PM`,
 * `00:15 AM`). Pairs with `cngxInputMask="time"` / `time:12` / `time:24` /
 * `datetime`, whose single-character slots cannot reject an hour that depends on
 * the digit before it. For `datetime` only the time part is checked.
 *
 * The cycle comes from the value: AM/PM present means 1-12, absent means 0-23.
 * An empty or incomplete value passes; pair with `required` when a time must
 * be entered. A 12-hour value whose AM/PM is still empty reads as a 24-hour
 * time unless the pinned `cycle: 12` is passed.
 *
 * The message is the `timeRange` key of the form-field language section;
 * replace it per app with `withErrorMessages({ timeRange })`.
 *
 * @example
 * ```ts
 * readonly f = form(this.model, schema((root) => {
 *   time(root.start, { cycle: 12 });
 * }));
 * ```
 *
 * @category forms/validators
 * @since 0.1.0
 * @relatedTo CngxInputMask, timeRange, patternMatch, withErrorMessages
 */
export function time<TPathKind extends PathKind = PathKind.Root>(
  path: SchemaPath<string, SchemaPathRules.Supported, TPathKind>,
  options?: TimeValidatorOptions,
): void {
  validate(path, ({ value }) => {
    const cycle = timeRangeCycle(value(), options);
    return cycle === null
      ? undefined
      : ({ kind: 'timeRange', cycle } satisfies TimeRangeValidationError);
  });
}

/**
 * Reactive Forms validator: returns `{ timeRange: { cycle } }` when the control
 * holds a complete time outside its hour cycle. Same rules as {@link time}; the
 * error key becomes the `timeRange` kind through `adaptFormControl`.
 *
 * @example
 * ```ts
 * readonly start = new FormControl('', { nonNullable: true, validators: [timeRange()] });
 * ```
 *
 * @category forms/validators
 * @since 0.1.0
 * @relatedTo time, patternMatch, adaptFormControl
 */
export function timeRange(options?: TimeValidatorOptions): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const cycle = timeRangeCycle(control.value, options);
    return cycle === null ? null : { timeRange: { cycle } };
  };
}
