import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  inject,
  TemplateRef,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { CngxFormFieldPresenter } from './form-field-presenter';
import { CNGX_ERROR_MESSAGES } from './form-field.token';

/**
 * Auto-renders validation errors from the {@link CNGX_ERROR_MESSAGES} registry.
 *
 * Place inside a `cngx-form-field`. Errors are only shown after the touched gate
 * (user has interacted with the field). Each error is matched by its `kind` against
 * the registered message functions.
 *
 * Supports an optional custom template for per-error rendering while keeping
 * auto-resolution from the registry.
 *
 * Use `CngxError` instead if you need full control over error rendering.
 * Do not use both `CngxFieldErrors` and `CngxError` in the same form field.
 *
 * @example Default rendering
 * ```html
 * <cngx-field-errors />
 * ```
 *
 * @example Custom error template
 * ```html
 * <cngx-field-errors>
 *   <ng-template let-message="message" let-kind="kind" let-index="index">
 *     <span class="my-error"><svg>...</svg> {{ message }}</span>
 *   </ng-template>
 * </cngx-field-errors>
 * ```
 *
 * @category components
 */
@Component({
  selector: 'cngx-field-errors',
  standalone: true,
  imports: [NgTemplateOutlet],
  template: `
    @for (err of resolvedErrors(); track err.kind) {
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
    '[attr.aria-hidden]': 'ariaHidden()',
    '[attr.role]': 'role()',
    '[attr.aria-live]': '"polite"',
  },
})
export class CngxFieldErrors {
  /** @internal */
  protected readonly presenter = inject(CngxFormFieldPresenter);
  private readonly errorMap = inject(CNGX_ERROR_MESSAGES);

  /** Optional custom template for each error item. */
  protected readonly customTpl = contentChild<TemplateRef<CngxFieldErrorContext>>(TemplateRef);

  /** @internal */
  protected readonly ariaHidden = computed(() => !this.presenter.showError() || null);

  /** @internal */
  protected readonly role = computed(() => (this.presenter.showError() ? 'alert' : null));

  /** @internal — resolved errors with messages, used by both default and custom templates. */
  protected readonly resolvedErrors = computed<CngxFieldErrorContext[]>(() => {
    if (!this.presenter.showError()) {
      return [];
    }

    const errors = this.presenter.errors();
    if (!errors?.length) {
      return [];
    }

    return errors.map((err, i) => {
      const fn = this.errorMap[err.kind];
      return {
        $implicit: fn ? fn(err) : (err.message ?? err.kind),
        message: fn ? fn(err) : (err.message ?? err.kind),
        kind: err.kind,
        error: err,
        index: i,
        first: i === 0,
        last: i === errors.length - 1,
      };
    });
  });

  /**
   * Resolved error messages as plain strings.
   * Useful for programmatic access outside the template.
   */
  readonly visibleErrors = computed(() => this.resolvedErrors().map((e) => e.message));
}

/** Template context type for CngxFieldErrors custom templates. */
export interface CngxFieldErrorContext {
  /** Resolved error message (also available as implicit `let-msg`). */
  $implicit: string;
  /** Resolved error message from the registry. */
  message: string;
  /** The error kind (e.g. `'required'`, `'email'`, `'minLength'`). */
  kind: string;
  /** The raw ValidationError object from Signal Forms. */
  error: unknown;
  /** Zero-based index of this error in the list. */
  index: number;
  /** Whether this is the first error. */
  first: boolean;
  /** Whether this is the last error. */
  last: boolean;
}
