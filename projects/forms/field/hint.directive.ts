import { Directive, inject } from '@angular/core';
import { CngxFormFieldPresenter } from './form-field-presenter';

/**
 * Marks the hint element inside a `cngx-form-field`.
 *
 * Automatically sets its `id` for `aria-describedby` linkage.
 * The hint remains in the DOM at all times — screen readers read it alongside errors
 * to provide context.
 *
 * @example
 * ```html
 * <span cngxHint>Business email address</span>
 * ```
 *
 * @category directives
 */
@Directive({
  selector: '[cngxHint]',
  standalone: true,
  exportAs: 'cngxHint',
  host: {
    '[id]': 'presenter.hintId()',
  },
})
export class CngxHint {
  /** @internal */
  protected readonly presenter = inject(CngxFormFieldPresenter);
}
