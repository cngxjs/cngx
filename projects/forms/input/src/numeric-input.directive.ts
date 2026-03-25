import {
  computed,
  Directive,
  effect,
  ElementRef,
  forwardRef,
  inject,
  input,
  LOCALE_ID,
  output,
  signal,
  type Signal,
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { CNGX_INPUT_CONFIG } from './input-config';

// ── Locale number parsing ───────────────────────────────────────────────

/** Detect decimal and group separators from Intl. */
function detectSeparators(locale: string): { decimal: string; group: string } {
  const parts = new Intl.NumberFormat(locale).formatToParts(1234.5);
  const decimal = parts.find((p) => p.type === 'decimal')?.value ?? '.';
  const group = parts.find((p) => p.type === 'group')?.value ?? ',';
  return { decimal, group };
}

/** Parse a locale-formatted string into a number. */
function parseLocaleNumber(value: string, locale: string): number | null {
  if (!value.trim()) {
    return null;
  }
  const { decimal, group } = detectSeparators(locale);

  // Remove group separators, replace decimal with '.'
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

/** Check if a char is allowed during editing (digits, decimal sep, minus). */
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
 * @example
 * ```html
 * <input cngxNumericInput #num="cngxNumericInput"
 *        [min]="0" [max]="100" [step]="0.5" [decimals]="2" />
 * <span>Value: {{ num.numericValue() }}</span>
 * ```
 *
 * @example
 * ```html
 * <!-- Currency input (always 2 decimals) -->
 * <input cngxNumericInput [decimals]="2" [min]="0" [locale]="'de-CH'" />
 *
 * <!-- Integer-only -->
 * <input cngxNumericInput [decimals]="0" [allowNegative]="false" />
 * ```
 *
 * @category directives
 */
@Directive({
  selector: 'input[cngxNumericInput]',
  standalone: true,
  exportAs: 'cngxNumericInput',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CngxNumericInput),
      multi: true,
    },
  ],
  host: {
    '[attr.inputmode]': '"decimal"',
    '[attr.role]': '"spinbutton"',
    '[attr.aria-valuemin]': 'min() ?? null',
    '[attr.aria-valuemax]': 'max() ?? null',
    '[attr.aria-valuenow]': 'numericValue()',
    '(beforeinput)': 'handleBeforeInput($event)',
    '(keydown)': 'handleKeyDown($event)',
    '(focus)': 'handleFocus()',
    '(blur)': 'handleBlur()',
    '(paste)': 'handlePaste($event)',
  },
})
export class CngxNumericInput implements ControlValueAccessor {
  private readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef);
  private readonly localeId = inject(LOCALE_ID);
  private readonly config = inject(CNGX_INPUT_CONFIG);

  // ── Inputs ──────────────────────────────────────────────────────────

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

  // ── Resolved config (input > global config > default) ────────────────

  private readonly resolvedLocale = computed(
    () => this.locale() ?? this.config.numericLocale ?? this.localeId,
  );
  private readonly resolvedDecimals = computed(
    () => this.decimals() ?? this.config.numericDecimals,
  );
  private readonly resolvedStep = computed(() => this.step() ?? this.config.numericStep ?? 1);

  // ── Internal state ──────────────────────────────────────────────────

  private readonly valueState = signal<number | null>(null);
  private readonly focusedState = signal(false);

  private readonly separators = computed(() => detectSeparators(this.resolvedLocale()));

  // ── Public signals ──────────────────────────────────────────────────

  /** The numeric value. `null` when empty or invalid. */
  readonly numericValue: Signal<number | null> = this.valueState.asReadonly();

  /** Whether the current value is a valid number within min/max bounds. */
  readonly isValid = computed(() => {
    const v = this.valueState();
    if (v == null) {
      return true;
    } // empty is valid (not required by default)
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

  /** Emitted when `numericValue` changes. */
  readonly valueChange = output<number | null>();

  constructor() {
    // Sync formatted value to DOM and notify co-located directives (CngxInput, matInput)
    effect(() => {
      const focused = this.focusedState();
      const value = this.valueState();
      const el = this.el.nativeElement;
      const prevValue = el.value;

      if (focused) {
        if (value != null) {
          const { decimal } = this.separators();
          const raw = decimal === '.' ? String(value) : String(value).replace('.', decimal);
          if (el.value !== raw) {
            el.value = raw;
          }
        }
      } else {
        if (value != null && this.formatOnBlur()) {
          el.value = this.format(value);
        } else if (value != null) {
          const { decimal } = this.separators();
          el.value = decimal === '.' ? String(value) : String(value).replace('.', decimal);
        } else {
          el.value = '';
        }
      }

      if (el.value !== prevValue) {
        el.dispatchEvent(new Event('input', { bubbles: true }));
      }
    });
  }

  // ── ControlValueAccessor ─────────────────────────────────────────────

  private onChange = (_value: number | null): void => {
    /* noop until registerOnChange */
  };
  private onTouched = (): void => {
    /* noop until registerOnTouched */
  };

  writeValue(value: number | null): void {
    this.setValue(value);
  }

  registerOnChange(fn: (value: number | null) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  // ── Public methods ──────────────────────────────────────────────────

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

  // ── Event handlers ──────────────────────────────────────────────────

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

      // Check decimals limit
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
        // Block decimal separator if decimals === 0
        if (dec === 0 && event.data === decimal) {
          event.preventDefault();
          return;
        }
      }
    }

    // Block non-standard mutations
    if (
      event.inputType !== 'insertText' &&
      event.inputType !== 'deleteContentBackward' &&
      event.inputType !== 'deleteContentForward' &&
      event.inputType !== 'deleteByCut' &&
      event.inputType !== 'insertFromPaste'
    ) {
      // Allow default for delete and standard inputs
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
    // Select all on focus for easy replacement
    queueMicrotask(() => {
      this.el.nativeElement.select();
    });
  }

  /** @internal */
  protected handleBlur(): void {
    this.focusedState.set(false);
    this.onTouched();
    // Parse current input value
    const raw = this.el.nativeElement.value;
    const parsed = parseLocaleNumber(raw, this.resolvedLocale());

    if (parsed != null) {
      const rounded = this.roundToDecimals(parsed);
      const clamped = this.clamp(rounded);
      this.updateValue(clamped);
    } else if (!raw.trim()) {
      this.updateValue(null);
    }
    // If invalid text, keep previous value — effect will restore the display
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
      // Update display
      const { decimal } = this.separators();
      const raw = decimal === '.' ? String(clamped) : String(clamped).replace('.', decimal);
      this.el.nativeElement.value = raw;
    }
  }

  // ── Helpers ─────────────────────────────────────────────────────────

  private increment(multiplier: number): void {
    const current = this.valueState() ?? 0;
    const stepped = current + this.resolvedStep() * multiplier;
    const rounded = this.roundToDecimals(stepped);
    const clamped = this.clamp(rounded);
    this.updateValue(clamped);
    // Show raw value since we're focused
    const { decimal } = this.separators();
    const raw = decimal === '.' ? String(clamped) : String(clamped).replace('.', decimal);
    this.el.nativeElement.value = raw;
    this.el.nativeElement.select();
  }

  private decrement(multiplier: number): void {
    const current = this.valueState() ?? 0;
    const stepped = current - this.resolvedStep() * multiplier;
    const rounded = this.roundToDecimals(stepped);
    const clamped = this.clamp(rounded);
    this.updateValue(clamped);
    const { decimal } = this.separators();
    const raw = decimal === '.' ? String(clamped) : String(clamped).replace('.', decimal);
    this.el.nativeElement.value = raw;
    this.el.nativeElement.select();
  }

  private clamp(value: number): number {
    const minVal = this.min();
    const maxVal = this.max();
    let result = value;
    if (!this.allowNegative() && result < 0) {
      result = 0;
    }
    if (minVal != null && result < minVal) {
      result = minVal;
    }
    if (maxVal != null && result > maxVal) {
      result = maxVal;
    }
    return result;
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
    const prev = this.valueState();
    if (value !== prev) {
      this.valueState.set(value);
      this.valueChange.emit(value);
      this.onChange(value);
    }
  }
}
