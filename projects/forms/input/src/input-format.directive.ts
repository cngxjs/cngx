import {
  Directive,
  ElementRef,
  forwardRef,
  inject,
  input,
  signal,
  type Signal,
} from '@angular/core';
import { type ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';

/** Function that formats a raw value for display. */
export type FormatFn = (raw: string) => string;

/** Function that parses a display value back to raw. */
export type ParseFn = (display: string) => string;

/**
 * Display formatting on blur, raw value on focus.
 *
 * Applies a `format` function when the input loses focus and a `parse` function
 * when it gains focus. Reactive forms always see the raw (unformatted) value.
 *
 * @example
 * ```html
 * <!-- Currency formatting -->
 * <input [cngxInputFormat]="formatCurrency" [parse]="parseCurrency" />
 *
 * <!-- Phone formatting -->
 * <input [cngxInputFormat]="formatPhone" />
 * ```
 *
 * @category directives
 */
@Directive({
  selector: 'input[cngxInputFormat]',
  standalone: true,
  exportAs: 'cngxInputFormat',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => CngxInputFormat),
      multi: true,
    },
  ],
  host: {
    '(focus)': 'handleFocus()',
    '(blur)': 'handleBlur()',
    '(input)': 'handleInput()',
  },
})
export class CngxInputFormat implements ControlValueAccessor {
  private readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef);

  /** Format function applied on blur. */
  readonly format = input.required<FormatFn>({ alias: 'cngxInputFormat' });

  /** Parse function applied on focus (inverse of format). Default: identity. */
  readonly parse = input<ParseFn>((v: string) => v);

  private readonly rawState = signal('');
  private readonly displayState = signal('');

  /** The raw (unformatted) value. */
  readonly rawValue: Signal<string> = this.rawState.asReadonly();

  /** The display (formatted) value. */
  readonly displayValue: Signal<string> = this.displayState.asReadonly();

  // ── ControlValueAccessor ─────────────────────────────────────────────

  private onChange = (_value: string): void => {
    /* noop until registerOnChange */
  };
  private onTouched = (): void => {
    /* noop until registerOnTouched */
  };

  writeValue(value: string | null): void {
    const raw = value ?? '';
    this.rawState.set(raw);
    const el = this.el.nativeElement;
    // Show formatted on write (we're typically not focused)
    const formatted = this.format()(raw);
    this.displayState.set(formatted);
    el.value = formatted;
  }

  registerOnChange(fn: (value: string) => void): void {
    this.onChange = fn;
  }

  registerOnTouched(fn: () => void): void {
    this.onTouched = fn;
  }

  // ── Event handlers ──────────────────────────────────────────────────

  /** @internal */
  protected handleFocus(): void {
    const el = this.el.nativeElement;
    const parseFn = this.parse();
    const raw = parseFn(el.value);
    this.rawState.set(raw);
    el.value = raw;
    el.dispatchEvent(new Event('input', { bubbles: true }));
    queueMicrotask(() => {
      const len = el.value.length;
      el.setSelectionRange(len, len);
    });
  }

  /** @internal */
  protected handleBlur(): void {
    this.onTouched();
    const el = this.el.nativeElement;
    const raw = el.value;
    this.rawState.set(raw);
    this.onChange(raw);
    const formatted = this.format()(raw);
    this.displayState.set(formatted);
    el.value = formatted;
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }

  /** @internal */
  protected handleInput(): void {
    const raw = this.el.nativeElement.value;
    this.rawState.set(raw);
    this.onChange(raw);
  }
}
