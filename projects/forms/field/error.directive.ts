import { Directive, type Signal } from '@angular/core';
import { injectFormFieldPresenter } from './inject-form-field-presenter';

/**
 * Marks a manual error container inside a `cngx-form-field`.
 *
 * Use this when you want full control over error rendering.
 * For automatic error rendering from a message registry, use `CngxFieldErrors` instead.
 *
 * The container is always in the DOM and keeps one shape: a polite status region
 * (`role="status"`, `aria-live="polite"`), never `aria-hidden`. Only its content changes,
 * so every screen reader announces the content when it appears. The presenter references
 * the container in the input's `aria-describedby` and `aria-errormessage` only while
 * {@link visible} is true. The host carries `cngx-field-error`, which the field typography
 * in `@cngx/themes/cngx.css` sizes and tints like the `cngx-field-errors` list, and
 * `cngx-error`, the class hook it shares with `CngxErrorState` and `CngxErrorAggregator`.
 *
 * Gate the content on {@link visible}, the field's own reveal gate (error strategy,
 * reveal scope, touched). Content rendered outside it is on screen and spoken.
 *
 * ```html
 * <cngx-form-field [field]="form.email">
 *   <label cngxLabel>Email</label>
 *   <input cngxInput [formField]="form.email" />
 *   <div cngxError #err="cngxError">
 *     @if (err.visible()) {
 *       @for (e of form.email().errors(); track $index) {
 *         <span>{{ e.message }}</span>
 *       }
 *     }
 *   </div>
 * </cngx-form-field>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/field/error.directive.ts
 * @since 0.3.0
 * @relatedTo CngxFieldErrors, CngxFormField, CngxFormErrors
 * <example-url>/#/forms/field/error/basic</example-url>
 * <example-url>/#/forms/field/error/icons-per-kind</example-url>
 * <example-url>/#/forms/field/error/server-injected-error</example-url>
 * <example-url>/#/forms/field/error/when-to-pick-manual-vs-auto</example-url>
 * @axis level atom
 */
@Directive({
  selector: '[cngxError]',
  standalone: true,
  exportAs: 'cngxError',
  host: {
    class: 'cngx-error cngx-field-error',
    '[id]': 'presenter.errorId()',
    role: 'status',
    'aria-live': 'polite',
  },
})
export class CngxError {
  /** @internal */
  protected readonly presenter = injectFormFieldPresenter('cngxError');

  /**
   * Whether the field's errors should show now: the field's `showError`
   * gate (error strategy, reveal scope, touched). Gate the content on it.
   */
  readonly visible: Signal<boolean> = this.presenter.showError;
}
