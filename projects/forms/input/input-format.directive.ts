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
import { CNGX_FORM_FIELD_HOST } from '@cngx/core/tokens';
import { CNGX_VALUE_TRANSFORMER, type CngxValueTransformer } from '@cngx/forms/field';

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
 * (unformatted) value; bind it via `[(value)]` or wrap the input in
 * `<cngx-form-field [field]="f.x">` for Signal Forms.
 *
 * ```html
 * <!-- Currency formatting -->
 * <input [cngxInputFormat]="formatCurrency" [parse]="parseCurrency" [(value)]="amount" />
 *
 * <!-- Phone formatting inside a Signal-Forms field -->
 * <cngx-form-field [field]="f.phone">
 *   <input cngxInputFormat="formatPhone" cngxBindField [control]="f.phone" />
 * </cngx-form-field>
 * ```
 *
 * @category forms/input
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/input/input-format.directive.ts
 * @since 0.1.0
 * @relatedTo CngxInput, CngxInputMask, CngxNumericInput
 * <example-url>http://localhost:4200/#/forms/input/utilities/copy-to-clipboard</example-url>
 * <example-url>http://localhost:4200/#/forms/input/utilities/input-clear</example-url>
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

  /** Primary value channel — raw (unformatted) string. */
  readonly value = model<string>('', { alias: 'value' });

  /**
   * @deprecated Read `value` directly. Kept one release for migration.
   */
  readonly rawValue: Signal<string> = this.value;

  /** The display (formatted) value. */
  readonly displayValue: Signal<string> = computed(() => this.format()(this.value()));

  // Records the formatted string this directive last wrote to el.value, so the
  // synthetic input event we dispatch after a DOM write never re-enters
  // value.set with the formatted string and corrupts the raw channel.
  private lastEffectWrite = '';

  constructor() {
    effect(() => {
      const raw = this.value();
      const formatFn = this.format();
      untracked(() => {
        const el = this.el.nativeElement;
        if (document.activeElement === el) {
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
    this.value.set(raw);
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
    this.value.set(raw);
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
    this.value.set(el.value);
  }
}
