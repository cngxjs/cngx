import {
  Directive,
  ElementRef,
  computed,
  effect,
  forwardRef,
  inject,
  input,
  model,
  untracked,
  type Signal,
} from '@angular/core';
import { CNGX_CONTROL_VALUE, type CngxControlValue } from '@cngx/common/interactive';
import { CNGX_FORM_FIELD_HOST } from '@cngx/core/tokens';
import { CNGX_VALUE_TRANSFORMER, type CngxValueTransformer } from '@cngx/forms/field';
import { injectDefaultAccessorWarning, injectFormDisabled } from './reactive-forms-channel';

/**
 * Function that formats a raw value for display.
 *
 * @category forms/input
 */
export type FormatFn = (raw: string) => string;

/**
 * Function that parses a display value back to raw.
 *
 * @category forms/input
 */
export type ParseFn = (display: string) => string;

/**
 * Display formatting on blur, raw value on focus.
 *
 * Applies a `format` function when the input loses focus and a `parse` function
 * when it gains focus. The directive's `value` model carries the raw
 * (unformatted) value, and so does a bound form: bind it via `[(value)]`, via
 * `[formField]` for Signal Forms, or via `[formControl]` / `formControlName` with
 * `CngxFormBridge` imported for Reactive Forms. `parse` should invert `format`.
 *
 * ```html
 * <!-- Currency formatting -->
 * <input [cngxInputFormat]="formatCurrency" [parse]="parseCurrency" [(value)]="amount" />
 *
 * <!-- Signal Forms -->
 * <input [cngxInputFormat]="formatCurrency" [parse]="parseCurrency" [formField]="f.amount" />
 *
 * <!-- Reactive Forms: import CngxFormBridge from @cngx/forms/controls -->
 * <input [cngxInputFormat]="formatCurrency" [parse]="parseCurrency" [formControl]="amount" />
 * ```
 *
 * @category forms/input
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/input/input-format.directive.ts
 * @since 0.1.0
 * @relatedTo CngxInput, CngxInputMask, CngxNumericInput
 * <example-url>http://localhost:4200/#/forms/input/utilities/input-format</example-url>
 */
@Directive({
  selector: 'input[cngxInputFormat]',
  standalone: true,
  exportAs: 'cngxInputFormat',
  providers: [
    {
      provide: CNGX_VALUE_TRANSFORMER,
      useFactory: (dir: CngxInputFormat): CngxValueTransformer<string> => ({
        format: (raw: string) => dir.format()(raw),
        parse: (display: string) => dir.parse()(display),
      }),
      deps: [forwardRef(() => CngxInputFormat)],
    },
    {
      provide: CNGX_CONTROL_VALUE,
      useFactory: (dir: CngxInputFormat): CngxControlValue<string> => ({
        value: dir.value,
        disabled: dir.formDisabled,
      }),
      deps: [forwardRef(() => CngxInputFormat)],
    },
  ],
  host: {
    '(focus)': 'handleFocus()',
    '(blur)': 'handleBlur()',
    '(input)': 'handleInput()',
  },
})
export class CngxInputFormat {
  private readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef);
  private readonly host = inject(CNGX_FORM_FIELD_HOST, { optional: true });

  /** Format function applied on blur. */
  readonly format = input.required<FormatFn>({ alias: 'cngxInputFormat' });

  /** Parse function applied on focus (inverse of format). Default: identity. */
  readonly parse = input<ParseFn>((v: string) => v);

  /** Primary value channel - raw (unformatted) string. */
  readonly value = model<string>('', { alias: 'value' });

  // CngxFormBridge writes whatever the form holds (`null` after reset(), a number
  // from an untyped control); every internal read goes through this.
  private readonly normalizedValue = computed(() => {
    const v: unknown = this.value();
    if (typeof v === 'string') {
      return v;
    }
    if (typeof v === 'number') {
      return String(v);
    }
    return '';
  });

  /**
   * @internal - written by CngxFormBridge.setDisabledState through CNGX_CONTROL_VALUE.
   * Never rename to `disabled`: `[formField]` binds custom-control members by name.
   */
  readonly formDisabled = injectFormDisabled(this.el);

  /**
   * @deprecated Read `value` directly. Kept one release for migration.
   */
  readonly rawValue: Signal<string> = this.value;

  /** The display (formatted) value. */
  readonly displayValue: Signal<string> = computed(() => this.format()(this.normalizedValue()));

  // Records the formatted string this directive last wrote to el.value, so the
  // synthetic input event we dispatch after a DOM write never re-enters
  // value.set with the formatted string and corrupts the raw channel.
  private lastEffectWrite = '';

  constructor() {
    if (typeof ngDevMode !== 'undefined' && ngDevMode) {
      injectDefaultAccessorWarning(
        "[cngxInputFormat] This formatted input uses Angular's DefaultValueAccessor, so the " +
          'form control switches between raw and formatted text. For Reactive Forms, import ' +
          'CngxFormBridge from @cngx/forms/controls; [ngModel] is not supported, use [(value)] ' +
          'or Signal Forms.',
      );
    }

    effect(() => {
      const raw = this.normalizedValue();
      const formatFn = this.format();
      untracked(() => {
        const el = this.el.nativeElement;
        if (el.ownerDocument.activeElement === el) {
          return;
        }
        const formatted = formatFn(raw);
        if (formatted === el.value) {
          return;
        }
        el.value = formatted;
        this.lastEffectWrite = formatted;
        el.dispatchEvent(new Event('input', { bubbles: true }));
      });
    });
  }

  /** @internal */
  protected handleFocus(): void {
    const el = this.el.nativeElement;
    const parseFn = this.parse();
    const raw = parseFn(el.value);
    this.writeRaw(raw);
    if (raw !== el.value) {
      el.value = raw;
      this.lastEffectWrite = raw;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
    queueMicrotask(() => {
      const len = el.value.length;
      el.setSelectionRange(len, len);
    });
  }

  /** @internal */
  protected handleBlur(): void {
    this.host?.markAsTouched();
    const el = this.el.nativeElement;
    const raw = el.value;
    this.writeRaw(raw);
    const formatted = this.format()(raw);
    if (formatted !== el.value) {
      el.value = formatted;
      this.lastEffectWrite = formatted;
      el.dispatchEvent(new Event('input', { bubbles: true }));
    }
  }

  /** @internal */
  protected handleInput(): void {
    const el = this.el.nativeElement;
    if (el.value === this.lastEffectWrite) {
      return;
    }
    this.writeRaw(el.value);
  }

  // Skips an unchanged raw value, so a focus or blur on a reset (`null`) control
  // does not turn it into `''` and mark the form dirty.
  private writeRaw(raw: string): void {
    if (raw !== this.normalizedValue()) {
      this.value.set(raw);
    }
  }
}
