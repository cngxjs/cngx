import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  inject,
  TemplateRef,
  untracked,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { injectFormFieldPresenter } from './inject-form-field-presenter';
import { CNGX_ERROR_MESSAGES } from './form-field.token';
import { injectFormFieldI18n, resolveErrorMessage } from './i18n/form-field-i18n';
import type { CngxFieldValidationError } from './models';

/**
 * Auto-renders validation errors from the {@link CNGX_ERROR_MESSAGES} registry.
 *
 * Place inside a `cngx-form-field`. Errors are only shown after the touched gate
 * (user has interacted with the field). Each error is matched by its `kind` against
 * the registered message functions; an unregistered kind shows the error's own
 * `message`, then the library message from `CNGX_FORM_FIELD_I18N`, never the raw kind.
 *
 * The host is a polite status region from the first render (`role="status"`,
 * `aria-live="polite"`, never `aria-hidden`); only the list inside it changes.
 * A language flip does not re-voice it: shown messages keep the old language
 * until the errors change, then the new copy is spoken.
 *
 * Supports an optional custom template for per-error rendering while keeping
 * auto-resolution from the registry.
 *
 * Use `CngxError` instead if you need full control over error rendering.
 * Do not use both `CngxFieldErrors` and `CngxError` in the same form field.
 *
 * Default rendering
 * ```html
 * <cngx-field-errors />
 * ```
 *
 * Custom error template
 * ```html
 * <cngx-field-errors>
 *   <ng-template let-message="message" let-kind="kind" let-index="index">
 *     <span class="my-error"><svg>...</svg> {{ message }}</span>
 *   </ng-template>
 * </cngx-field-errors>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/field/field-errors.component.ts
 * @since 0.3.0
 * @relatedTo CngxError, CngxFormErrors, CngxFormField, CNGX_ERROR_MESSAGES, withErrorMessages
 * <example-url>/#/forms/field/field-errors/basic</example-url>
 * <example-url>/#/forms/field/field-errors/multiple-validators</example-url>
 * <example-url>/#/forms/field/field-errors/custom-error-template</example-url>
 * <example-url>/#/forms/field/field-errors/with-registry-messages</example-url>
 * @axis level molecule
 */
@Component({
  selector: 'cngx-field-errors',
  standalone: true,
  imports: [NgTemplateOutlet],
  template: `
    @for (err of resolvedErrors(); track $index) {
      @if (customTpl()) {
        <ng-container *ngTemplateOutlet="customTpl()!; context: err" />
      } @else {
        <p>{{ err.message }}</p>
      }
    }
  `,
  styles: `
    :host {
      display: contents;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[id]': 'presenter.errorId()',
    role: 'status',
    'aria-live': 'polite',
  },
})
export class CngxFieldErrors {
  /** @internal */
  protected readonly presenter = injectFormFieldPresenter('cngx-field-errors');
  private readonly errorMap = inject(CNGX_ERROR_MESSAGES);
  private readonly i18n = injectFormFieldI18n();

  /** Optional custom template for each error item. */
  protected readonly customTpl = contentChild<TemplateRef<CngxFieldErrorContext>>(TemplateRef);

  /** @internal - resolved errors with messages, used by both default and custom templates. */
  protected readonly resolvedErrors = computed<CngxFieldErrorContext[]>(() => {
    if (!this.presenter.showError()) {
      return [];
    }

    const errors = this.presenter.errors();
    if (!errors?.length) {
      return [];
    }

    // Copy is read untracked: a language flip must not re-voice the polite
    // region; the next error change speaks the new language.
    return untracked(() => {
      const map = this.errorMap();
      const i18n = this.i18n();
      return errors.map((err, i) => {
        const message = resolveErrorMessage(err, map, i18n);
        return {
          $implicit: message,
          message,
          kind: err.kind,
          error: err,
          index: i,
          first: i === 0,
          last: i === errors.length - 1,
        };
      });
    });
  });

  /**
   * Resolved error messages as plain strings.
   * Useful for programmatic access outside the template.
   */
  readonly visibleErrors = computed(() => this.resolvedErrors().map((e) => e.message));
}

/**
 * Template context type for CngxFieldErrors custom templates.
 */
export interface CngxFieldErrorContext {
  /** Resolved error message (also available as implicit `let-msg`). */
  $implicit: string;
  /** Resolved error message from the registry. */
  message: string;
  /** The error kind (e.g. `'required'`, `'email'`, `'minLength'`). */
  kind: string;
  /** The validation error from Signal Forms, bound to its field. */
  error: CngxFieldValidationError;
  /** Zero-based index of this error in the list. */
  index: number;
  /** Whether this is the first error. */
  first: boolean;
  /** Whether this is the last error. */
  last: boolean;
}
