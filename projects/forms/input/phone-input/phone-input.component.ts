import {
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  ElementRef,
  inject,
  input,
  model,
  signal,
} from '@angular/core';
import { nextUid } from '@cngx/core/utils';
import {
  CngxFormFieldPresenter,
  CNGX_FORM_FIELD_CONTROL,
  createFieldSync,
  type CngxFormFieldControl,
} from '@cngx/forms/field';
import { CngxSelect, type CngxSelectOptionDef } from '@cngx/forms/select';
import { CngxInputMask } from '../input-mask.directive';
import { CNGX_PHONE_COUNTRIES, type Country } from './countries';

/**
 * Nulls the surrounding `CngxFormFieldPresenter` for the element it sits on, so
 * the inner country `CngxSelect` runs as a plain picker: no competing
 * `CNGX_FORM_FIELD_CONTROL`, no field ARIA wiring, no value-sync writing the
 * country object into the field. `CngxPhoneInput` (above this element) keeps
 * the real presenter and is the sole field control.
 * @internal
 */
@Directive({
  selector: '[cngxPhoneInputDetach]',
  standalone: true,
  providers: [{ provide: CngxFormFieldPresenter, useValue: null }],
})
class CngxPhoneInputDetach {}

/**
 * International phone field composing a country picker with a region-aware mask.
 *
 * `CngxPhoneInput` wires a `CngxSelect` (country) to a `CngxInputMask`
 * (`phone:<region>`): the selected country drives the mask region through a
 * `computed()`, so picking a country re-targets the mask with zero manual sync.
 * It provides {@link CNGX_FORM_FIELD_CONTROL} and is the single form-field
 * control - the inner select and input are shielded from the surrounding
 * `cngx-form-field` (via a null `CngxFormFieldPresenter` in `viewProviders`) so
 * only this component wires the field ARIA and value.
 *
 * The country list is consumer-overridable through `[countries]`; switching
 * country clears the entered number (the mask's documented auto-clear on
 * pattern change).
 *
 * ```html
 * <cngx-form-field [field]="f.phone">
 *   <cngx-phone-input [(value)]="phone" />
 * </cngx-form-field>
 * ```
 *
 * @category forms/input
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/input/phone-input/phone-input.component.ts
 * @since 0.1.0
 * @relatedTo CngxSelect, CngxInputMask, CngxFormField, withPhonePatterns
 * <example-url>http://localhost:4200/#/forms/input/phone/intl</example-url>
 */
@Component({
  selector: 'cngx-phone-input',
  standalone: true,
  exportAs: 'cngxPhoneInput',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [CngxSelect, CngxInputMask, CngxPhoneInputDetach],
  providers: [{ provide: CNGX_FORM_FIELD_CONTROL, useExisting: CngxPhoneInput }],
  host: {
    class: 'cngx-phone-input',
    role: 'group',
    '[attr.aria-labelledby]': 'labelledBy()',
    '[attr.aria-label]': 'ariaLabelAttr()',
    '[class.cngx-phone-input--disabled]': 'disabled()',
    '[class.cngx-phone-input--focused]': 'focused()',
    '(focusin)': 'focusedState.set(true)',
    '(focusout)': 'handleFocusOut($event)',
  },
  template: `
    <cngx-select
      cngxPhoneInputDetach
      class="cngx-phone-input__country"
      [(value)]="country"
      [options]="selectOptions()"
      [disabled]="disabled()"
      [attr.aria-label]="countryAriaLabel()"
    />
    <input
      class="cngx-phone-input__number"
      type="tel"
      [cngxInputMask]="maskExpr()"
      [(value)]="value"
      [id]="id()"
      [disabled]="disabled()"
      [attr.aria-labelledby]="labelledBy()"
      [attr.aria-invalid]="ariaInvalid()"
      [attr.aria-required]="ariaRequired()"
      [attr.aria-describedby]="describedBy()"
    />
  `,
  styleUrl: './phone-input.component.css',
})
export class CngxPhoneInput implements CngxFormFieldControl {
  /** The masked phone number (raw digits the mask accepted). Two-way bindable. */
  readonly value = model<string>('');

  /** The selected country. Two-way bindable; defaults to the first entry. */
  readonly country = model<Country>(CNGX_PHONE_COUNTRIES[0]);

  /** Overrides the picker's country list. */
  readonly countries = input<readonly Country[]>(CNGX_PHONE_COUNTRIES);

  /** Consumer disable knob; the effective {@link disabled} also folds in the field. */
  readonly disabledInput = model<boolean>(false, { alias: 'disabled' });

  /** Accessible label for the country picker. EN default; consumer-overridable. */
  readonly countryAriaLabel = input<string>('Country');

  /** Accessible label used when standalone (no `cngx-form-field`). */
  readonly ariaLabel = input<string>('');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly presenter = inject(CngxFormFieldPresenter, { optional: true });

  private readonly fallbackId = nextUid('cngx-phone-input-');
  /** @internal Host-binding-accessed; written from `(focusin)`/`(focusout)`. */
  protected readonly focusedState = signal(false);
  readonly focused = this.focusedState.asReadonly();

  /** The mask region from the selected country, fed to `phone:<region>`. */
  protected readonly region = computed(
    () => this.country()?.region ?? CNGX_PHONE_COUNTRIES[0].region,
  );
  /** @internal */
  protected readonly maskExpr = computed(() => `phone:${this.region()}`);

  /** @internal Country options for the inner select, keyed by the country ref. */
  protected readonly selectOptions = computed<CngxSelectOptionDef<Country>[]>(
    () => this.countries().map((c) => ({ value: c, label: `${c.dialCode} ${c.label}` })),
    {
      equal: (a, b) =>
        a.length === b.length && a.every((o, i) => o.value === b[i].value && o.label === b[i].label),
    },
  );

  readonly id = computed(() => this.presenter?.inputId() ?? this.fallbackId);
  readonly empty = computed(() => this.value() === '');
  readonly disabled = computed(() => this.disabledInput() || (this.presenter?.disabled() ?? false));
  readonly errorState = computed(() => this.presenter?.showError() ?? false);

  /** @internal */
  protected readonly labelledBy = computed(() => this.presenter?.labelId() ?? null);
  /** @internal */
  protected readonly ariaLabelAttr = computed(() =>
    this.presenter ? null : this.ariaLabel() || null,
  );
  /** @internal */
  protected readonly ariaInvalid = computed(() => (this.presenter?.showError() ? true : null));
  /** @internal */
  protected readonly ariaRequired = computed(() => (this.presenter?.required() ? true : null));
  /** @internal */
  protected readonly describedBy = computed(() => this.presenter?.describedBy() ?? null);

  constructor() {
    createFieldSync<string>({
      componentValue: this.value,
      valueEquals: Object.is,
      coerceFromField: (v) => (typeof v === 'string' ? v : ''),
    });
  }

  /** @internal */
  protected handleFocusOut(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (!this.host.nativeElement.contains(next)) {
      this.focusedState.set(false);
    }
  }

  focus(options?: FocusOptions): void {
    this.host.nativeElement
      .querySelector<HTMLInputElement>('.cngx-phone-input__number')
      ?.focus(options);
  }
}
