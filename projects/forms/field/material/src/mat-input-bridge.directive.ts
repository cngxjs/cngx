import { afterNextRender, computed, Directive, ElementRef, inject, signal } from '@angular/core';
import { MatInput } from '@angular/material/input';
import {
  CngxFormFieldPresenter,
  CNGX_FORM_FIELD_CONTROL,
  type CngxFormFieldControl,
} from '@cngx/forms/field';

/**
 * Bridges a `matInput` to work inside `cngx-form-field`.
 *
 * Place on the same element as `matInput`. Provides {@link CNGX_FORM_FIELD_CONTROL}
 * and projects ARIA attributes from the {@link CngxFormFieldPresenter}.
 *
 * @example
 * ```html
 * <cngx-form-field [field]="fields.email">
 *   <label cngxLabel>E-Mail</label>
 *   <input matInput cngxFieldBridge placeholder="max@example.com" />
 *   <cngx-field-errors />
 * </cngx-form-field>
 * ```
 *
 * @category directives
 */
@Directive({
  selector: '[cngxFieldBridge]',
  standalone: true,
  exportAs: 'cngxFieldBridge',
  providers: [{ provide: CNGX_FORM_FIELD_CONTROL, useExisting: CngxMatInputBridge }],
  host: {
    '[id]': 'id()',
    '[attr.aria-describedby]': 'describedBy()',
    '[attr.aria-labelledby]': 'labelledBy()',
    '[attr.aria-invalid]': 'ariaInvalid()',
    '[attr.aria-required]': 'ariaRequired()',
    '[attr.aria-busy]': 'ariaBusy()',
    '[attr.aria-errormessage]': 'ariaErrorMessage()',
    '[attr.aria-readonly]': 'ariaReadonly()',
    '[attr.disabled]': 'isDisabled()',
    '(focus)': 'handleFocus()',
    '(blur)': 'handleBlur()',
    '(input)': 'handleInput()',
  },
})
export class CngxMatInputBridge implements CngxFormFieldControl {
  private readonly matInput = inject(MatInput, { self: true });
  private readonly presenter = inject(CngxFormFieldPresenter, { optional: true });
  private readonly el = inject<ElementRef<HTMLInputElement>>(ElementRef);

  // ── CngxFormFieldControl ───────────────────────────────────────────

  readonly id = computed(() => this.presenter?.inputId() ?? this.matInput.id);

  private readonly focusedState = signal(false);
  readonly focused = this.focusedState.asReadonly();

  private readonly emptyState = signal(true);
  readonly empty = this.emptyState.asReadonly();

  readonly disabled = computed(() => this.presenter?.disabled() ?? this.matInput.disabled);
  readonly errorState = computed(() => this.presenter?.showError() ?? this.matInput.errorState);

  // ── Host bindings ──────────────────────────────────────────────────

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

  constructor() {
    // Sync initial empty state for pre-populated inputs
    afterNextRender(() => this.emptyState.set(!this.el.nativeElement.value));
  }

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
