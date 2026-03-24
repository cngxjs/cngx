import { computed, Directive, inject } from '@angular/core';
import { CngxFormFieldPresenter } from './form-field-presenter';

/**
 * Marks a manual error container inside a `cngx-form-field`.
 *
 * Use this when you want full control over error rendering.
 * For automatic error rendering from a message registry, use `CngxFieldErrors` instead.
 *
 * The container is always in the DOM. `aria-hidden` toggles based on the `showError` gate
 * (touched AND invalid). `role="alert"` ensures screen readers announce errors.
 *
 * @example
 * ```html
 * <div cngxError>
 *   @if (presenter.errors(); as errors) {
 *     @for (e of errors; track e.kind) {
 *       <span>{{ e.message }}</span>
 *     }
 *   }
 * </div>
 * ```
 *
 * @category directives
 */
@Directive({
  selector: '[cngxError]',
  standalone: true,
  exportAs: 'cngxError',
  host: {
    '[id]': 'presenter.errorId()',
    '[attr.aria-hidden]': 'ariaHidden()',
    '[attr.role]': 'role()',
    '[attr.aria-live]': '"polite"',
  },
})
export class CngxError {
  /** @internal */
  protected readonly presenter = inject(CngxFormFieldPresenter);

  /** @internal */
  protected readonly ariaHidden = computed(() => !this.presenter.showError() || null);

  /** @internal — role="alert" only when errors are visible */
  protected readonly role = computed(() => (this.presenter.showError() ? 'alert' : null));
}
