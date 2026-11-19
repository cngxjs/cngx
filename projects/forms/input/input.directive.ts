import {
  afterRenderEffect,
  computed,
  Directive,
  effect,
  ElementRef,
  HostAttributeToken,
  inject,
  input,
  linkedSignal,
  Renderer2,
  signal,
} from '@angular/core';
import {
  CngxFieldSkinHost,
  CngxFormFieldPresenter,
  CNGX_FORM_FIELD_CONFIG,
  CNGX_FORM_FIELD_CONTROL,
  DEFAULT_AUTOCOMPLETE_MAPPINGS,
  DEFAULT_NO_SPELLCHECK_FIELDS,
  type CngxErrorFieldState,
  type CngxFormFieldControl,
} from '@cngx/forms/field';
import { cngxDevWarn } from '@cngx/utils';

// Field states that already warned CNGX2031.
const unboundWarned = new WeakSet<object>();

/** A field value that shows nothing in a text control. */
function isEmptyValue(value: unknown): boolean {
  return (
    value === undefined ||
    value === null ||
    value === '' ||
    (Array.isArray(value) && value.length === 0)
  );
}

/**
 * Applies ARIA attributes and focus tracking to a native input, textarea, or select
 * inside a `cngx-form-field`.
 *
 * Provides {@link CNGX_FORM_FIELD_CONTROL} so the parent form field can discover it.
 * Works standalone (without `cngx-form-field`) as a no-op - no crash.
 *
 * ```html
 * <input cngxInput />
 * ```
 *
 * Hosts {@link CngxFieldSkinHost} and re-aliases it to `skin`, so
 * `<input cngxInput skin="bare">` renders chrome-less without a wrapper.
 * The skin costs one directive instance and one `computed()` per input; no
 * extra DOM, no effect, and the default resolves to no attribute at all.
 *
 * The value flows only through `[formField]` (Signal Forms) or `[formControl]`
 * (Reactive Forms) on the same element. In dev mode the directive warns
 * [`CNGX2031`](/error-codes/cngx2031.md) when it is the control of a Signal Forms field that no
 * `[formField]` binds.
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/input/input.directive.ts
 * @selector [cngxInput]
 * @since 0.1.0
 * @relatedTo CngxFormField, CngxCharCount, CngxPasswordToggle, CngxInputClear, CngxFieldSkinHost
 * <example-url>/#/forms/input/character-counter</example-url>
 * <example-url>/#/forms/input/password-visibility-toggle</example-url>
 * <example-url>/#/forms/input/smart-autocomplete-and-spellcheck</example-url>
 * <example-url>/#/forms/field/skin/fill</example-url>
 * <example-url>/#/forms/field/skin/bare-cell-edit</example-url>
 * @axis level molecule
 */
@Directive({
  selector: 'input[cngxInput], textarea[cngxInput], select[cngxInput]',
  standalone: true,
  exportAs: 'cngxInput',
  providers: [{ provide: CNGX_FORM_FIELD_CONTROL, useExisting: CngxInput }],
  hostDirectives: [{ directive: CngxFieldSkinHost, inputs: ['cngxFieldSkin: skin'] }],
  host: {
    '[id]': 'inputId()',
    '[attr.aria-describedby]': 'describedBy()',
    '[attr.aria-labelledby]': 'labelledBy()',
    '[attr.aria-invalid]': 'ariaInvalid()',
    '[attr.aria-required]': 'ariaRequired()',
    '[attr.aria-busy]': 'ariaBusy()',
    '[attr.aria-errormessage]': 'ariaErrorMessage()',
    '[attr.aria-readonly]': 'ariaReadonly()',
    '[attr.autocomplete]': 'resolvedAutocomplete()',
    '[attr.spellcheck]': 'resolvedSpellcheck()',
    '[class.cngx-input--error]': 'errorState()',
    '[class.cngx-input--focused]': 'focused()',
    '(focus)': 'handleFocus()',
    '(blur)': 'handleBlur()',
    '(input)': 'handleInput()',
  },
})
export class CngxInput implements CngxFormFieldControl {
  private readonly presenter = inject(CngxFormFieldPresenter, { optional: true });
  private readonly config = inject(CNGX_FORM_FIELD_CONFIG);
  private readonly el =
    inject<ElementRef<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>>(ElementRef);

  readonly id = computed(() => this.presenter?.inputId() ?? (this.el.nativeElement.id || ''));
  private readonly focusedState = signal(false);
  readonly focused = this.focusedState.asReadonly();
  /**
   * Derived from the field value under a presenter, so a programmatic write
   * or clear updates it at once; an `(input)` event overrides it until the
   * field value changes again, which keeps an input that is not bound to the
   * field (typing without `[formField]`) honest. `true` initially without a
   * presenter.
   */
  private readonly emptyState = linkedSignal(() =>
    isEmptyValue(this.presenter?.fieldState().value()),
  );
  readonly empty = this.emptyState.asReadonly();
  readonly disabled = computed(() => this.presenter?.disabled() ?? false);
  readonly errorState = computed(() => this.presenter?.showError() ?? false);
  private readonly readonlyAttribute =
    inject(new HostAttributeToken('readonly'), { optional: true }) !== null;
  /** Readonly from the surrounding field, or from a static `readonly` attribute. */
  readonly readonly = computed(
    () => this.readonlyAttribute || (this.presenter?.readonly() ?? false),
  );

  constructor() {
    // `disabled` belongs to the input only while a field presenter drives it. A host
    // binding would write `null` on the first frame and clear a template `[disabled]`
    // on a standalone or detached input (filter-builder rows).
    if (this.presenter) {
      const presenter = this.presenter;
      const renderer = inject(Renderer2);
      effect(() => {
        const el = this.el.nativeElement;
        if (presenter.disabled()) {
          renderer.setAttribute(el, 'disabled', 'true');
        } else {
          renderer.removeAttribute(el, 'disabled');
        }
      });
    }
    if (typeof ngDevMode !== 'undefined' && ngDevMode && this.presenter) {
      const presenter = this.presenter;
      afterRenderEffect(() => {
        const state = presenter.fieldState();
        const bindings = (state as Partial<CngxErrorFieldState>).formFieldBindings?.();
        const unbound = bindings?.length === 0;
        if (!unbound || presenter.control() !== this || unboundWarned.has(state)) {
          return;
        }
        unboundWarned.add(state);
        cngxDevWarn(
          'CNGX2031',
          `[cngxInput] the field "${presenter.name()}" has no [formField] binding, so typing ` +
            'never reaches the field value. Bind the field on the control: ' +
            '<input cngxInput [formField]="...">.',
        );
      });
    }
  }

  // Host binding computeds - null-safe when no presenter.

  /** @internal */
  protected readonly inputId = this.id;
  /**
   * Consumer `aria-labelledby`. Wins over the field label, and is the only
   * name source outside a `cngx-form-field` (a table filter input named by
   * its column header). Taken as an input so the host binding below does not
   * overwrite the attribute with `null`.
   */
  readonly ariaLabelledBy = input<string | undefined>(undefined, { alias: 'aria-labelledby' });

  /**
   * Consumer `aria-describedby`. Appended to the field's hint and error ids,
   * never replacing them.
   */
  readonly ariaDescribedBy = input<string | undefined>(undefined, { alias: 'aria-describedby' });

  /** @internal */
  protected readonly describedBy = computed(() => {
    const ids = [this.presenter?.describedBy(), this.ariaDescribedBy()].filter(Boolean);
    return ids.length > 0 ? ids.join(' ') : null;
  });
  /** @internal */
  protected readonly labelledBy = computed(
    () => this.ariaLabelledBy() ?? this.presenter?.labelId() ?? null,
  );
  /** @internal */
  protected readonly ariaInvalid = computed(() => (this.presenter?.showError() ? true : null));
  /** @internal */
  protected readonly ariaRequired = computed(() => (this.presenter?.required() ? true : null));
  /** @internal */
  protected readonly ariaBusy = computed(() => (this.presenter?.pending() ? true : null));
  /** @internal */
  protected readonly ariaReadonly = computed(() => (this.presenter?.readonly() ? true : null));
  /** @internal */
  protected readonly ariaErrorMessage = computed(() =>
    this.presenter?.showError() ? this.presenter.errorId() : null,
  );

  /**
   * Explicit autocomplete value. When not set, inferred from the field name
   * (e.g. `email` → `autocomplete="email"`, `password` → `autocomplete="current-password"`).
   * Set to `'off'` to disable.
   */
  readonly autocomplete = input<string | undefined>(undefined);

  /**
   * Explicit spellcheck value. When not set, auto-disabled for fields like
   * email, password, URL, phone, codes.
   */
  readonly spellcheck = input<boolean | undefined>(undefined);

  /** @internal - normalized field name for autocomplete/spellcheck lookup. */
  private readonly normalizedName = computed(() =>
    this.presenter
      ?.name()
      ?.toLowerCase()
      .replaceAll(/[^a-z]/g, ''),
  );

  /** @internal */
  protected readonly resolvedAutocomplete = computed(() => {
    const explicit = this.autocomplete();
    if (explicit != null) {
      return explicit;
    }
    const name = this.normalizedName();
    const mappings = this.config.autocompleteMappings ?? DEFAULT_AUTOCOMPLETE_MAPPINGS;
    return name ? (mappings[name] ?? null) : null;
  });

  /** @internal */
  protected readonly resolvedSpellcheck = computed(() => {
    const explicit = this.spellcheck();
    if (explicit != null) {
      return explicit ? null : 'false';
    }
    const name = this.normalizedName();
    const noSpell = this.config.noSpellcheckFields ?? DEFAULT_NO_SPELLCHECK_FIELDS;
    return name && noSpell.has(name) ? 'false' : null;
  });

  /** @internal */
  protected handleFocus(): void {
    this.focusedState.set(true);
  }

  /** @internal */
  protected handleBlur(): void {
    this.focusedState.set(false);
  }

  /** @internal */
  protected handleInput(): void {
    this.emptyState.set(!this.el.nativeElement.value);
  }

  /**
   * Focuses the host `input`, `textarea` or `select` element and passes `options` to `HTMLElement.focus()`.
   * Implements the optional `focus` of `CngxFormFieldControl`, which `CngxFieldBox` calls when the box padding is clicked and `focusFirstError` calls for a field without a `[formField]` binding.
   */
  focus(options?: FocusOptions): void {
    this.el.nativeElement.focus(options);
  }
}
