import {
  computed,
  Directive,
  effect,
  ElementRef,
  forwardRef,
  inject,
  input,
  LOCALE_ID,
  model,
  signal,
  type Signal,
  untracked,
} from '@angular/core';
import { CNGX_FORM_FIELD_HOST } from '@cngx/core/tokens';
import { CNGX_VALUE_TRANSFORMER, type CngxValueTransformer } from '@cngx/forms/field';
import { CNGX_INPUT_CONFIG } from './input-config';

/**
 * Detect decimal and group separators from Intl.
 * @internal
 */
function detectSeparators(locale: string): { decimal: string; group: string } {
  const parts = new Intl.NumberFormat(locale).formatToParts(1234.5);
  const decimal = parts.find((p) => p.type === 'decimal')?.value ?? '.';
  const group = parts.find((p) => p.type === 'group')?.value ?? ',';
  return { decimal, group };
}

/**
 * Parse a locale-formatted string into a number.
 * @internal
 */
function parseLocaleNumber(value: string, locale: string): number | null {
  if (!value.trim()) {
    return null;
  }
  const { decimal, group } = detectSeparators(locale);

  let normalized = value;
  if (group) {
    normalized = normalized.replaceAll(group, '');
  }
  if (decimal !== '.') {
    normalized = normalized.replace(decimal, '.');
  }

  const num = Number(normalized);
  return Number.isNaN(num) ? null : num;
}

/**
 * Check if a char is allowed during editing (digits, decimal sep, minus).
 * @internal
 */
function isAllowedChar(
  ch: string,
  decimalSep: string,
  allowNegative: boolean,
  currentValue: string,
  cursorPos: number,
): boolean {
  if (/[0-9]/.test(ch)) {
    return true;
  }
  if (ch === decimalSep && !currentValue.includes(decimalSep)) {
    return true;
  }
  if (ch === '-' && allowNegative && cursorPos === 0 && !currentValue.includes('-')) {
    return true;
  }
  return false;
}

/**
 * Locale-aware numeric input directive.
 *
 * Keeps `type="text"` (no browser spinners, no scroll-to-change) and uses
 * `Intl.NumberFormat` for formatting. Shows raw value on focus, formatted value on blur.
 *
 * Supports Arrow Up/Down (+ Shift) for increment/decrement with `min`/`max` clamping.
 *
 * ```html
 * <input cngxNumericInput #num="cngxNumericInput"
 *        [min]="0" [max]="100" [step]="0.5" [decimals]="2" />
 * <span>Value: {{ num.numericValue() }}</span>
 * ```
 *
 * ```html
 * <!-- Currency input (always 2 decimals) -->
 * <input cngxNumericInput [decimals]="2" [min]="0" [locale]="'de-CH'" />
 *
 * <!-- Integer-only -->
 * <input cngxNumericInput [decimals]="0" [allowNegative]="false" />
 * ```
 *
 * @category forms/input
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/input/numeric-input.directive.ts
 * @since 0.1.0
 * @relatedTo CngxInput, CngxInputMask, CngxInputFormat, withNumericDefaults
 * <example-url>http://localhost:4200/#/forms/input/numeric/basic-numeric-input</example-url>
 * <example-url>http://localhost:4200/#/forms/input/numeric/locale-formatting</example-url>
 * <example-url>http://localhost:4200/#/forms/input/numeric/min-max-step-decimals</example-url>
 */
@Directive({
  selector: 'input[cngxNumericInput]',
  standalone: true,
  exportAs: 'cngxNumericInput',
  providers: [
    {
      provide: CNGX_VALUE_TRANSFORMER,
      useFactory: (dir: CngxNumericInput): CngxValueTransformer<number | null> => ({
        format: (raw: number | null) => dir.toDisplay(raw),
        parse: (display: string) => dir.fromDisplay(display),
      }),
      deps: [forwardRef(() => CngxNumericInput)],
    },
  ],
  host: {
    '[attr.inputmode]': '"decimal"',
    '[attr.role]': '"spinbutton"',
    '[attr.aria-valuemin]': 'min() ?? null',
    '[attr.aria-valuemax]': 'max() ?? null',
    '[attr.aria-valuenow]': 'numericValue()',
    // Tabular-nums by default so digits align column-wise on cngx-numeric-input
    // fields (forms, dashboards, summary rows). Override on a parent via
    // `--cngx-numeric-input-numeric-variant: normal` when the body font's
    // proportional digits are wanted.
    '[style.font-variant-numeric]': '"var(--cngx-numeric-input-numeric-variant, tabular-nums)"',
    '(beforeinput)': 'handleBeforeInput($event)',
    '(keydown)': 'handleKeyDown($event)',
    '(focus)': 'handleFocus()',
    '(blur)': 'handleBlur()',
    '(paste)': 'handlePaste($event)',
  },
})
export class CngxNumericInput {
  private readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef);
  private readonly localeId = inject(LOCALE_ID);
  private readonly config = inject(CNGX_INPUT_CONFIG);
  private readonly host = inject(CNGX_FORM_FIELD_HOST, { optional: true });

  /** Locale for number formatting. Falls back to global config, then `LOCALE_ID`. */
  readonly locale = input<string | undefined>(undefined);

  /** Minimum allowed value. */
  readonly min = input<number | undefined>(undefined);

  /** Maximum allowed value. */
  readonly max = input<number | undefined>(undefined);

  /** Step for increment/decrement via Arrow keys. Falls back to global config. */
  readonly step = input<number | undefined>(undefined);

  /** Maximum decimal places. Falls back to global config. `undefined` = unlimited, `0` = integer only. */
  readonly decimals = input<number | undefined>(undefined);

  /** Whether to format with thousands separator on blur. */
  readonly formatOnBlur = input<boolean>(true);

  /** Allow negative values. */
  readonly allowNegative = input<boolean>(true);

  // Resolved config: input > global config > default.

  private readonly resolvedLocale = computed(
    () => this.locale() ?? this.config.numericLocale ?? this.localeId,
  );
  private readonly resolvedDecimals = computed(
    () => this.decimals() ?? this.config.numericDecimals,
  );
  private readonly resolvedStep = computed(() => this.step() ?? this.config.numericStep ?? 1);

  /** Primary value channel. `null` when empty or invalid. */
  readonly value = model<number | null>(null, { alias: 'value' });

  private readonly focusedState = signal(false);

  private readonly separators = computed(() => detectSeparators(this.resolvedLocale()));

  /**
   * @deprecated Read `value` directly. Kept one release for migration.
   */
  readonly numericValue: Signal<number | null> = this.value;

  /** Whether the current value is a valid number within min/max bounds. */
  readonly isValid = computed(() => {
    const v = this.value();
    if (v == null) {
      return true; // empty is valid; required handled by validators
    }
    const minVal = this.min();
    const maxVal = this.max();
    if (minVal != null && v < minVal) {
      return false;
    }
    if (maxVal != null && v > maxVal) {
      return false;
    }
    return true;
  });

  constructor() {
    // Sync formatted value to DOM; the input event notifies co-located CngxInput / matInput.
    effect(() => {
      const focused = this.focusedState();
      const value = this.value();
      const { decimal } = this.separators();
      const formatOnBlur = this.formatOnBlur();

      untracked(() => {
        const el = this.el.nativeElement;
        const prevValue = el.value;

        if (focused) {
          if (value != null) {
            const raw = decimal === '.' ? String(value) : String(value).replace('.', decimal);
            if (el.value !== raw) {
              el.value = raw;
            }
          }
        } else {
          if (value != null && formatOnBlur) {
            el.value = this.format(value);
          } else if (value != null) {
            el.value = decimal === '.' ? String(value) : String(value).replace('.', decimal);
          } else {
            el.value = '';
          }
        }

        if (el.value !== prevValue) {
          el.dispatchEvent(new Event('input', { bubbles: true }));
        }
      });
    });
  }

  /**
   * @internal — surface for the `CNGX_VALUE_TRANSFORMER` factory.
   * Mirrors what the format effect would write to el.value for a given raw.
   */
  toDisplay(raw: number | null): string {
    if (raw == null) {
      return '';
    }
    if (this.formatOnBlur()) {
      return this.format(raw);
    }
    const { decimal } = this.separators();
    return decimal === '.' ? String(raw) : String(raw).replace('.', decimal);
  }

  /** @internal — surface for the `CNGX_VALUE_TRANSFORMER` factory. */
  fromDisplay(display: string): number | null {
    if (!display.trim()) {
      return null;
    }
    const parsed = parseLocaleNumber(display, this.resolvedLocale());
    if (parsed == null) {
      return null;
    }
    return this.clamp(this.roundToDecimals(parsed));
  }

  /** Programmatically set the numeric value. */
  setValue(value: number | null): void {
    if (value != null) {
      const rounded = this.roundToDecimals(value);
      const clamped = this.clamp(rounded);
      this.updateValue(clamped);
    } else {
      this.updateValue(null);
    }
  }

  /** Clear the value. */
  clear(): void {
    this.updateValue(null);
  }

  /** @internal */
  protected handleBeforeInput(event: InputEvent): void {
    if (event.inputType === 'insertText' && event.data) {
      const el = this.el.nativeElement;
      const { decimal } = this.separators();
      const allowed = isAllowedChar(
        event.data,
        decimal,
        this.allowNegative(),
        el.value,
        el.selectionStart ?? 0,
      );

      if (!allowed) {
        event.preventDefault();
        return;
      }

      const dec = this.resolvedDecimals();
      if (dec != null && event.data !== '-') {
        const decIdx = el.value.indexOf(decimal);
        if (decIdx >= 0 && (el.selectionStart ?? 0) > decIdx) {
          const currentDecPlaces = el.value.length - decIdx - 1;
          const selLen = (el.selectionEnd ?? 0) - (el.selectionStart ?? 0);
          if (currentDecPlaces - selLen >= dec && event.data !== decimal) {
            event.preventDefault();
            return;
          }
        }
        if (dec === 0 && event.data === decimal) {
          event.preventDefault();
          return;
        }
      }
    }
  }

  /** @internal */
  protected handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      const multiplier = event.shiftKey ? 10 : 1;
      this.increment(multiplier);
      return;
    }

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const multiplier = event.shiftKey ? 10 : 1;
      this.decrement(multiplier);
    }
  }

  /** @internal */
  protected handleFocus(): void {
    this.focusedState.set(true);
    queueMicrotask(() => {
      this.el.nativeElement.select();
    });
  }

  /** @internal */
  protected handleBlur(): void {
    this.focusedState.set(false);
    this.host?.markAsTouched();
    const raw = this.el.nativeElement.value;
    const parsed = parseLocaleNumber(raw, this.resolvedLocale());

    if (parsed != null) {
      const rounded = this.roundToDecimals(parsed);
      const clamped = this.clamp(rounded);
      this.updateValue(clamped);
    } else if (!raw.trim()) {
      this.updateValue(null);
    }
    // Invalid text path: keep previous value; the display effect restores it.
  }

  /** @internal */
  protected handlePaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') ?? '';
    if (!pasted) {
      return;
    }

    const parsed = parseLocaleNumber(pasted, this.resolvedLocale());
    if (parsed != null) {
      const rounded = this.roundToDecimals(parsed);
      const clamped = this.clamp(rounded);
      this.updateValue(clamped);
      const { decimal } = this.separators();
      const raw = decimal === '.' ? String(clamped) : String(clamped).replace('.', decimal);
      this.el.nativeElement.value = raw;
    }
  }

  private adjustValue(direction: 1 | -1, multiplier: number): void {
    const current = this.value() ?? 0;
    const stepped = current + direction * this.resolvedStep() * multiplier;
    const clamped = this.clamp(this.roundToDecimals(stepped));
    this.updateValue(clamped);
    const { decimal } = this.separators();
    this.el.nativeElement.value =
      decimal === '.' ? String(clamped) : String(clamped).replace('.', decimal);
    this.el.nativeElement.select();
  }

  private increment(multiplier: number): void {
    this.adjustValue(1, multiplier);
  }

  private decrement(multiplier: number): void {
    this.adjustValue(-1, multiplier);
  }

  private clamp(value: number): number {
    const floor = !this.allowNegative() ? Math.max(0, value) : value;
    const minVal = this.min();
    const maxVal = this.max();
    return Math.min(maxVal ?? Infinity, Math.max(minVal ?? -Infinity, floor));
  }

  private roundToDecimals(value: number): number {
    const dec = this.resolvedDecimals();
    if (dec == null) {
      return value;
    }
    const factor = Math.pow(10, dec);
    return Math.round(value * factor) / factor;
  }

  private format(value: number): string {
    const locale = this.resolvedLocale();
    const dec = this.resolvedDecimals();
    const options: Intl.NumberFormatOptions = {};
    if (dec != null) {
      options.minimumFractionDigits = dec;
      options.maximumFractionDigits = dec;
    }
    return new Intl.NumberFormat(locale, options).format(value);
  }

  private updateValue(value: number | null): void {
    const prev = this.value();
    if (value !== prev) {
      this.value.set(value);
    }
  }
}
