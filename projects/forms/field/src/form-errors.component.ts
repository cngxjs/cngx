import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  inject,
  input,
  TemplateRef,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { CNGX_ERROR_MESSAGES } from './form-field.token';
import type { CngxFieldAccessor } from './models';

/**
 * Form-level error summary — lists all validation errors across all fields.
 *
 * Place outside (or at the top/bottom of) the form. Each error is a focusable link
 * that jumps to the invalid field via `focusBoundControl()`.
 *
 * Only visible when `showErrors()` is `true` (controlled by the consumer, typically
 * set after a failed submit).
 *
 * This implements the WCAG 3.3.1 pattern: "If an input error is detected, the item
 * that is in error is identified and the error is described to the user in text."
 *
 * @example
 * ```html
 * <cngx-form-errors [fields]="[emailField, passwordField]" [show]="showFormErrors()">
 * </cngx-form-errors>
 * ```
 *
 * @example Custom template
 * ```html
 * <cngx-form-errors [fields]="[emailField, passwordField]" [show]="submitted()">
 *   <ng-template let-errors="errors" let-count="count">
 *     <h3>{{ count }} errors found</h3>
 *     @for (err of errors; track err.fieldName) {
 *       <a (click)="err.focus()" href="javascript:void(0)">
 *         {{ err.fieldName }}: {{ err.message }}
 *       </a>
 *     }
 *   </ng-template>
 * </cngx-form-errors>
 * ```
 *
 * @category components
 */
@Component({
  selector: 'cngx-form-errors',
  standalone: true,
  imports: [NgTemplateOutlet],
  template: `
    @if (show() && errorItems().length > 0) {
      @if (customTpl()) {
        <ng-container *ngTemplateOutlet="customTpl()!; context: tplContext()" />
      } @else {
        <ul class="cngx-form-errors__list">
          @for (err of errorItems(); track err.fieldName) {
            <li>
              <a (click)="err.focus()" (keydown.enter)="err.focus()" tabindex="0" role="link">
                <strong>{{ err.fieldName }}</strong
                >: {{ err.message }}
              </a>
            </li>
          }
        </ul>
      }
    }
  `,
  styles: `
    :host {
      display: contents;
    }
    .cngx-form-errors__list {
      margin: 0;
      padding: 0 0 0 1.25em;
      font-size: var(--cngx-form-errors-font-size, 0.875rem);
      color: var(--cngx-form-errors-color, var(--cngx-field-error-color, #d32f2f));
    }
    .cngx-form-errors__list a {
      color: inherit;
      text-decoration: underline;
      cursor: pointer;
    }
    .cngx-form-errors__list a:hover,
    .cngx-form-errors__list a:focus-visible {
      text-decoration: none;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'cngxFormErrors',
  host: {
    '[attr.role]': 'show() && errorItems().length > 0 ? "alert" : null',
    '[attr.aria-live]': '"polite"',
  },
})
export class CngxFormErrors {
  private readonly errorMap = inject(CNGX_ERROR_MESSAGES);

  /** The field accessors to summarize errors for. */
  readonly fields = input.required<CngxFieldAccessor[]>();

  /** Whether to show the error summary (typically set after a failed submit). */
  readonly show = input(false);

  /** Optional custom template. */
  protected readonly customTpl =
    contentChild<TemplateRef<CngxFormErrorsSummaryContext>>(TemplateRef);

  /** @internal — resolved error items with focus capability. */
  protected readonly errorItems = computed<FormErrorItem[]>(() => {
    if (!this.show()) {
      return [];
    }

    return this.fields().flatMap((fieldAccessor) => {
      const state = fieldAccessor();
      if (!state.invalid()) {
        return [];
      }
      return state.errors().map((err) => ({
        fieldName: state.name(),
        message: (this.errorMap[err.kind] ?? (() => err.message ?? err.kind))(err),
        kind: err.kind,
        focus: () => state.focusBoundControl(),
      }));
    });
  });

  /** @internal */
  protected readonly tplContext = computed<CngxFormErrorsSummaryContext>(() => ({
    $implicit: this.errorItems(),
    errors: this.errorItems(),
    count: this.errorItems().length,
  }));
}

/** A single error item in the form-level summary. */
export interface FormErrorItem {
  /** The field name (from FieldState.name()). */
  fieldName: string;
  /** Resolved error message. */
  message: string;
  /** Error kind (e.g. 'required'). */
  kind: string;
  /** Focus the invalid field's control. */
  focus: () => void;
}

/** Template context for CngxFormErrors custom templates. */
export interface CngxFormErrorsSummaryContext {
  /** Error items (also available as implicit). */
  $implicit: FormErrorItem[];
  /** All error items. */
  errors: FormErrorItem[];
  /** Total error count. */
  count: number;
}
