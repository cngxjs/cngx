import {
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  model,
  signal,
  untracked,
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
import { CNGX_INPUT_CONFIG, DEFAULT_INPUT_ARIA_LABELS } from '../input-config';
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
 * control - the inner select is shielded from the surrounding `cngx-form-field`
 * (a null `CngxFormFieldPresenter` in the inner element's `providers`, via
 * `CngxPhoneInputDetach`) so only this component wires the field ARIA and value.
 *
 * The country list is consumer-overridable through `[countries]`. Selecting a
 * country pre-fills its dial code (e.g. `+49`); switching country clears the
 * entered national number (the mask's documented auto-clear on pattern change)
 * and re-seeds the new dial code.
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
    '[attr.aria-disabled]': 'ariaDisabled()',
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
      [attr.aria-label]="resolvedCountryLabel()"
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
    <span
      class="cngx-phone-input__disabled-reason"
      [id]="reasonId"
      [attr.aria-hidden]="disabled() ? null : 'true'"
      >{{ disabledReason() }}</span
    >
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

  /**
   * Which mask alternate to use. `'auto'` (default) picks landline vs mobile by
   * length; `'mobile'`/`'landline'` force that grouping immediately, with no
   * length threshold to cross. Two-way bindable for a manual switch.
   */
  readonly lineType = model<'auto' | 'landline' | 'mobile'>('auto');

  /** Consumer disable knob; the effective {@link disabled} also folds in the field. */
  readonly disabledInput = input<boolean>(false, { alias: 'disabled' });

  /**
   * Accessible label for the country picker. Per-instance override; otherwise
   * resolves through `CNGX_INPUT_CONFIG.ariaLabels.phoneCountry` (EN `'Country'`).
   */
  readonly countryAriaLabel = input<string>('');

  /** Reason announced via `aria-describedby` while the control is disabled. */
  readonly disabledReason = input<string>('');

  /** Accessible label used when standalone (no `cngx-form-field`). */
  readonly ariaLabel = input<string>('');

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly presenter = inject(CngxFormFieldPresenter, { optional: true });
  private readonly config = inject(CNGX_INPUT_CONFIG);

  private readonly fallbackId = nextUid('cngx-phone-input-');
  /** @internal Stable id for the always-present disabled-reason span. */
  protected readonly reasonId = nextUid('cngx-phone-input-reason-');
  /** @internal Host-binding-accessed; written from `(focusin)`/`(focusout)`. */
  protected readonly focusedState = signal(false);
  readonly focused = this.focusedState.asReadonly();

  /** The mask region from the selected country, fed to `phone:<region>`. */
  protected readonly region = computed(
    () => this.country()?.region ?? CNGX_PHONE_COUNTRIES[0].region,
  );
  /** @internal */
  protected readonly maskExpr = computed(() => {
    const lt = this.lineType();
    return lt === 'auto' ? `phone:${this.region()}` : `phone:${this.region()}:${lt}`;
  });

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
  protected readonly ariaDisabled = computed(() => (this.disabled() ? true : null));
  /** @internal IDs always present; the span itself toggles `aria-hidden`. */
  protected readonly describedBy = computed(() => {
    const fieldIds = this.presenter?.describedBy();
    return fieldIds ? `${fieldIds} ${this.reasonId}` : this.reasonId;
  });
  /** @internal Per-instance label, else the config cascade, else the EN default. */
  protected readonly resolvedCountryLabel = computed(() => {
    const explicit = this.countryAriaLabel();
    if (explicit !== '') {
      return explicit;
    }
    return this.config.ariaLabels?.phoneCountry ?? DEFAULT_INPUT_ARIA_LABELS.phoneCountry;
  });

  constructor() {
    // App-wide default region (overridden by a per-instance [country] binding).
    const region = this.config.phoneDefaultRegion;
    if (region) {
      const match = CNGX_PHONE_COUNTRIES.find((c) => c.region === region);
      if (match) {
        this.country.set(match);
      }
    }

    createFieldSync<string>({
      componentValue: this.value,
      valueEquals: Object.is,
      coerceFromField: (v) => (typeof v === 'string' ? v : ''),
    });

    // Pre-fill the dial code when a country is selected. CngxInputMask clears
    // its value on region change, so the seed is deferred past that clear with
    // queueMicrotask; it only seeds an empty field, never clobbering a typed or
    // field-restored number. The dial-code digits land in the mask's `+NN`
    // country-code slots (slot count matches the dial-code length per region).
    effect(() => {
      const dialDigits = this.country().dialCode.replace(/\D/g, '');
      untracked(() => {
        queueMicrotask(() => {
          if (this.value() === '') {
            this.value.set(dialDigits);
          }
        });
      });
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
