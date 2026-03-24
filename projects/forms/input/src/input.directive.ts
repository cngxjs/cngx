import { computed, Directive, ElementRef, inject, input, signal } from '@angular/core';
import {
  CngxFormFieldPresenter,
  CNGX_FORM_FIELD_CONFIG,
  CNGX_FORM_FIELD_CONTROL,
  DEFAULT_AUTOCOMPLETE_MAPPINGS,
  DEFAULT_NO_SPELLCHECK_FIELDS,
  type CngxFormFieldControl,
} from '@cngx/forms/field';

/**
 * Applies ARIA attributes and focus tracking to a native input, textarea, or select
 * inside a `cngx-form-field`.
 *
 * Provides {@link CNGX_FORM_FIELD_CONTROL} so the parent form field can discover it.
 * Works standalone (without `cngx-form-field`) as a no-op — no crash.
 *
 * @example
 * ```html
 * <input cngxInput placeholder="max@example.com" />
 * ```
 *
 * @category directives
 */
@Directive({
  selector: 'input[cngxInput], textarea[cngxInput], select[cngxInput]',
  standalone: true,
  exportAs: 'cngxInput',
  providers: [{ provide: CNGX_FORM_FIELD_CONTROL, useExisting: CngxInput }],
  host: {
    '[id]': 'inputId()',
    '[attr.aria-describedby]': 'describedBy()',
    '[attr.aria-labelledby]': 'labelledBy()',
    '[attr.aria-invalid]': 'ariaInvalid()',
    '[attr.aria-required]': 'ariaRequired()',
    '[attr.aria-busy]': 'ariaBusy()',
    '[attr.aria-errormessage]': 'ariaErrorMessage()',
    '[attr.aria-readonly]': 'ariaReadonly()',
    '[attr.disabled]': 'isDisabled()',
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

  // ── CngxFormFieldControl implementation ────────────────────────────

  readonly id = computed(() => this.presenter?.inputId() ?? (this.el.nativeElement.id || ''));
  private readonly focusedState = signal(false);
  readonly focused = this.focusedState.asReadonly();
  private readonly emptyState = signal(true);
  readonly empty = this.emptyState.asReadonly();
  readonly disabled = computed(() => this.presenter?.disabled() ?? false);
  readonly errorState = computed(() => this.presenter?.showError() ?? false);

  // ── Host binding computeds (null-safe without presenter) ───────────

  /** @internal */
  protected readonly inputId = this.id;
  /** @internal */
  protected readonly describedBy = computed(() => this.presenter?.describedBy() ?? null);
  /** @internal */
  protected readonly labelledBy = computed(() => this.presenter?.labelId() ?? null);
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
  /** @internal */
  protected readonly isDisabled = computed(() => (this.presenter?.disabled() ? true : null));

  // ── Smart attribute inference ────────────────────────────────────────

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

  /** @internal — normalized field name for autocomplete/spellcheck lookup. */
  private readonly normalizedName = computed(() =>
    this.presenter?.name()?.toLowerCase().replaceAll(/[^a-z]/g, ''),
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

  // ── Event handlers ─────────────────────────────────────────────────

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

  focus(options?: FocusOptions): void {
    this.el.nativeElement.focus(options);
  }
}
