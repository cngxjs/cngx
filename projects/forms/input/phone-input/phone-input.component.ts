import {
  ChangeDetectionStrategy,
  Component,
  computed,
  Directive,
  effect,
  ElementRef,
  inject,
  input,
  linkedSignal,
  model,
  type OnInit,
  untracked,
  viewChild,
} from '@angular/core';
import { injectLocale, nextUid } from '@cngx/core/utils';
import {
  CngxFormFieldPresenter,
  CNGX_FORM_FIELD_CONTROL,
  createFieldControlAria,
  createFieldSync,
  type CngxFormFieldControl,
} from '@cngx/forms/field';
import { CngxSelect, type CngxSelectOptionDef } from '@cngx/forms/select';
import { CngxInputMask } from '../input-mask.directive';
import { CNGX_INPUT_CONFIG, injectInputAriaLabels } from '../input-config';
import { CNGX_PHONE_METADATA } from '../phone-metadata';
import { createPhoneCountries, type Country } from './countries';

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
 * The country list is consumer-overridable through `[countries]`; the picked
 * row is matched by region, so a localized list (and `withPhoneDefaultRegion`)
 * preselects its own row. The field shows the selected country's dial code
 * (e.g. `+49`), but `value` stays `''` until national digits are typed, so an
 * untouched field is empty and pristine for the form. Switching country clears
 * the entered national number (the mask's documented auto-clear on pattern
 * change) and shows the new dial code.
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
 * @playground libphonenumber-js adapter ./examples/libphonenumber/libphonenumber-example.component.ts
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
    '(focusin)': 'handleFocusIn()',
    '(focusout)': 'handleFocusOut($event)',
  },
  template: `
    <cngx-select
      cngxPhoneInputDetach
      class="cngx-phone-input__country"
      [value]="resolvedCountry()"
      (valueChange)="handleCountryChange($event)"
      [options]="selectOptions()"
      [disabled]="disabled()"
      [aria-label]="resolvedCountryLabel()"
    />
    <input
      class="cngx-phone-input__number"
      type="tel"
      [cngxInputMask]="maskExpr()"
      [forceAlternate]="forcedAlternate()"
      [value]="maskValue()"
      (valueChange)="handleMaskValue($event)"
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
export class CngxPhoneInput implements CngxFormFieldControl, OnInit {
  /** The masked phone number (raw digits the mask accepted). Two-way bindable. */
  readonly value = model<string>('');

  private readonly locale = injectLocale();

  /**
   * Default country list, labelled in the app locale (`CNGX_LOCALE`, default the
   * nearest `LOCALE_ID`); a locale flip relabels it. One shared list per locale.
   */
  private readonly localeCountries = computed(() => createPhoneCountries(this.locale()));

  /**
   * The selected country. Two-way bindable; defaults to the `phoneDefaultRegion`
   * row of `countries`, else the first entry. The unbound default is taken in the
   * construction-time locale; the picker still shows the row of the live list
   * with the same region, so its name follows a locale flip.
   */
  readonly country = model<Country>(createPhoneCountries(this.locale())[0]);

  /**
   * Overrides the picker's country list. Unbound, the picker lists the built-in
   * regions named in the app locale, and follows a locale flip.
   */
  readonly countries = input<readonly Country[] | undefined>(undefined);

  /** @internal The bound `countries`, else the built-in list in the live locale. */
  protected readonly resolvedCountries = computed(() => this.countries() ?? this.localeCountries());

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
  private readonly ariaLabels = injectInputAriaLabels();
  private readonly metadata = inject(CNGX_PHONE_METADATA);

  private readonly fallbackId = nextUid('cngx-phone-input-');
  /** @internal Stable id for the always-present disabled-reason span. */
  protected readonly reasonId = nextUid('cngx-phone-input-reason-');
  private readonly aria = createFieldControlAria(this.presenter, {
    fallbackId: this.fallbackId,
    localDisabled: () => this.disabledInput(),
    disabledReason: { id: this.reasonId, reason: () => this.disabledReason() },
  });

  readonly focused = this.aria.focused;

  /** Construction-time default of `country`; equal means the consumer never set it. */
  private readonly defaultCountry = this.country();

  /**
   * @internal The active row of `resolvedCountries()`: the row whose region matches
   * the selected country, else the first row. Matching by region keeps a
   * localized `[countries]` list in charge of the picked object; a bound
   * `country` whose region the list lacks falls back to the first row.
   */
  protected readonly resolvedCountry = computed(() => {
    const list = this.resolvedCountries();
    const selected = this.country();
    return list.find((c) => c.region === selected.region) ?? list[0] ?? selected;
  });

  /** The mask region from the selected country, fed to `phone:<region>`. */
  protected readonly region = computed(() => this.resolvedCountry().region);

  // A form writes whatever it holds (`null` after reset(), a foreign type from an
  // untyped control); every internal read goes through this.
  private readonly normalizedValue = computed(() => {
    const v: unknown = this.value();
    return typeof v === 'string' ? v : '';
  });

  private readonly dialDigits = computed(() => this.resolvedCountry().dialCode.replace(/\D/g, ''));

  /**
   * @internal What the inner mask shows: the value, or the dial code while the
   * value is empty. Writable so `handleMaskValue` keeps it equal to what the mask
   * holds after an edit the value does not reflect (a deleted dial code).
   */
  protected readonly maskValue = linkedSignal(() => {
    const v = this.normalizedValue();
    return v === '' ? this.dialDigits() : v;
  });

  private readonly maskRef = viewChild(CngxInputMask);

  // value() is dial-code-prefixed once digits are typed, so it is not the national
  // subscriber number. Strip the dial code before handing it to the metadata
  // strategy, which contracts on national digits.
  private readonly nationalDigits = computed(() => {
    const cc = this.dialDigits();
    const v = this.normalizedValue();
    return v.startsWith(cc) ? v.slice(cc.length) : v;
  });

  /** @internal Strategy-resolved line type for the current region + national digits. */
  private readonly metaLineType = computed(() =>
    this.metadata.lineType(this.region(), this.nationalDigits()),
  );

  // The mask string stays `phone:<region>` in every mode. Line type rides the
  // separate [forceAlternate] input instead, because CngxInputMask auto-clears
  // its value whenever mask() changes - encoding the type in the string wiped
  // the digits the strategy reads. forceAlternate leaves mask() untouched.
  /** @internal */
  protected readonly maskExpr = computed(() => `phone:${this.region()}`);

  // PHONE_PATTERNS order each region as `<landline>|<mobile>`, so landline is
  // alternate 0 and mobile is alternate 1. Explicit lineType wins; in 'auto'
  // the strategy verdict drives it and 'unknown' (null) keeps the length-based
  // default the bare mask already provides.
  /** @internal */
  protected readonly forcedAlternate = computed<number | null>(() => {
    const lt = this.lineType();
    if (lt === 'landline') {
      return 0;
    }
    if (lt === 'mobile') {
      return 1;
    }
    const meta = this.metaLineType();
    if (meta === 'mobile') {
      return 1;
    }
    if (meta === 'fixedLine') {
      return 0;
    }
    return null;
  });

  /** @internal Country options for the inner select, keyed by the country ref. */
  protected readonly selectOptions = computed<CngxSelectOptionDef<Country>[]>(
    () => {
      const option = this.ariaLabels().phoneCountryOption;
      return this.resolvedCountries().map((c) => ({
        value: c,
        label: option(c.dialCode, c.label),
      }));
    },
    {
      equal: (a, b) =>
        a.length === b.length &&
        a.every((o, i) => o.value === b[i].value && o.label === b[i].label),
    },
  );

  readonly id = this.aria.id;
  readonly empty = computed(() => this.normalizedValue() === '');
  readonly disabled = this.aria.disabled;
  readonly errorState = this.aria.errorState;

  /** @internal */
  protected readonly labelledBy = this.aria.labelledBy;
  /** @internal */
  protected readonly ariaLabelAttr = computed(() =>
    this.presenter ? null : this.ariaLabel() || null,
  );
  /** @internal */
  protected readonly ariaInvalid = this.aria.ariaInvalid;
  /** @internal */
  protected readonly ariaRequired = this.aria.ariaRequired;
  /** @internal */
  protected readonly ariaDisabled = this.aria.ariaDisabled;
  /** @internal - disabled-reason gating lives in createFieldControlAria. */
  protected readonly describedBy = this.aria.describedBy;
  /** @internal Per-instance label, else the config cascade, else the EN default. */
  protected readonly resolvedCountryLabel = computed(() => {
    const explicit = this.countryAriaLabel();
    if (explicit !== '') {
      return explicit;
    }
    return this.ariaLabels().phoneCountry;
  });

  constructor() {
    createFieldSync<string>({
      componentValue: this.value,
      valueEquals: Object.is,
      coerceFromField: (v) => (typeof v === 'string' ? v : ''),
    });

    // Re-shows the dial code after a country switch on an empty field. The new dial
    // code reaches the mask through `maskValue`, but CngxInputMask clears its value
    // on region change right after that push, and a binding cannot push the same
    // value twice. The seed is deferred past that clear and written into the mask
    // only, never into `value`: the field stays empty for the form. The dial-code
    // digits land in the mask's `+NN` country-code slots.
    effect(() => {
      this.dialDigits();
      untracked(() => {
        queueMicrotask(() => {
          const mask = this.maskRef();
          if (mask && mask.value() === '' && this.normalizedValue() === '') {
            mask.value.set(this.dialDigits());
          }
        });
      });
    });
  }

  /**
   * Applies `phoneDefaultRegion` once the inputs are bound, so it resolves
   * against the active `[countries]` list. Skipped when `country` is bound:
   * a per-instance binding wins over the app-wide default. "Bound" means the
   * value differs from the construction-time default row.
   */
  ngOnInit(): void {
    const region = this.config.phoneDefaultRegion;
    if (!region || this.country() !== this.defaultCountry) {
      return;
    }
    const match = this.resolvedCountries().find((c) => c.region === region);
    if (match) {
      this.country.set(match);
    }
  }

  /**
   * @internal Mirrors a mask edit. A dial-code-only mask value is an empty field;
   * `maskValue` takes the mask value as is, so deleting the dial code stays
   * deleted until the next country switch.
   */
  protected handleMaskValue(next: string): void {
    this.maskValue.set(next);
    const value = next === this.dialDigits() ? '' : next;
    if (value !== this.normalizedValue()) {
      this.value.set(value);
    }
  }

  /** @internal */
  protected handleCountryChange(next: Country | undefined): void {
    if (next) {
      this.country.set(next);
    }
  }

  /** @internal */
  protected readonly handleFocusIn = this.aria.handleFocusIn;

  /** @internal - unfocus only when focus leaves the composite subtree. */
  protected handleFocusOut(event: FocusEvent): void {
    this.aria.handleFocusOutWithin(event, this.host.nativeElement);
  }

  focus(options?: FocusOptions): void {
    this.host.nativeElement
      .querySelector<HTMLInputElement>('.cngx-phone-input__number')
      ?.focus(options);
  }
}
