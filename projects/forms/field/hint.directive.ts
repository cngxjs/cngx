import { Directive, inject } from '@angular/core';
import { CngxFormFieldPresenter } from './form-field-presenter';

/**
 * Marks the hint element inside a `cngx-form-field`.
 *
 * Automatically sets its `id` for `aria-describedby` linkage.
 * The hint remains in the DOM at all times - screen readers read it alongside errors
 * to provide context. The host carries `cngx-hint`, the hook the field
 * typography in `@cngx/themes/cngx.css` sizes and tints.
 *
 * ```html
 * <span cngxHint>Business email address</span>
 * ```
 *
 * @category forms/field
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/field/hint.directive.ts
 * @since 0.1.0
 * @relatedTo CngxFormField, CngxLabel
 */
@Directive({
  selector: '[cngxHint]',
  standalone: true,
  exportAs: 'cngxHint',
  host: {
    class: 'cngx-hint',
    '[id]': 'presenter.hintId()',
  },
})
export class CngxHint {
  /** @internal */
  protected readonly presenter = inject(CngxFormFieldPresenter);
}
