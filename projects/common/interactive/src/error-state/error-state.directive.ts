import { computed, Directive, input } from '@angular/core';

/**
 * Marks any DOM element as carrying an error state.
 *
 * Generic host-element marker — works on cngx, Material, CDK, native HTML,
 * and third-party hosts. Toggles the `.cngx-error` class hook plus reactive
 * `aria-invalid` / `aria-errormessage` attributes when the bound boolean is
 * true. The directive is purely presentational; it does not own the error
 * state itself, it only reflects it.
 *
 * The `cngxErrorState` input takes a plain `boolean`. Consumers binding a
 * signal write `[cngxErrorState]="form.email().invalid()"` — the signal is
 * invoked at the binding site (canonical Angular pattern), not detected at
 * runtime.
 *
 * @example
 * ```html
 * <input
 *   [cngxErrorState]="emailField().invalid()"
 *   cngxErrorMessageId="email-error"
 * />
 * <span id="email-error" role="alert">Please enter a valid email.</span>
 * ```
 *
 * @category directives
 */
@Directive({
  selector: '[cngxErrorState]',
  standalone: true,
  exportAs: 'cngxErrorState',
  host: {
    '[class.cngx-error]': 'cngxErrorState()',
    '[attr.aria-invalid]': 'ariaInvalid()',
    '[attr.aria-errormessage]': 'ariaErrorMessage()',
  },
})
export class CngxErrorState {
  readonly cngxErrorState = input.required<boolean>();

  /** Optional id of the element rendering the error message text. */
  readonly cngxErrorMessageId = input<string | null>(null);

  /** @internal — explicit boolean, always present in the DOM (cngx ARIA convention). */
  protected readonly ariaInvalid = computed(() => (this.cngxErrorState() ? 'true' : 'false'));

  /**
   * @internal — emitted whenever a non-empty message id is bound, regardless
   * of the error flag. cngx convention: ID-bearing ARIA attributes stay in
   * the DOM; visibility of the message element is controlled by the
   * consumer via `aria-hidden` on the message itself.
   */
  protected readonly ariaErrorMessage = computed(() => {
    const id = this.cngxErrorMessageId();
    return id && id.length > 0 ? id : null;
  });
}
