import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  inject,
  input,
  TemplateRef,
  untracked,
  ViewEncapsulation,
} from '@angular/core';
import { DOCUMENT, NgTemplateOutlet } from '@angular/common';
import { CNGX_ERROR_MESSAGES } from './form-field.token';
import { injectFormFieldI18n, resolveErrorMessage } from './i18n/form-field-i18n';
import type { CngxFieldAccessor } from './models';

/** @internal One piece of the `errorSummaryItem` message. */
interface SummarySegment {
  readonly kind: 'label' | 'message' | 'text';
  readonly text: string;
}

const SUMMARY_PLACEHOLDER = /\{(label|message)\}/;
const MESSAGE_ONLY: readonly SummarySegment[] = [{ kind: 'message', text: '' }];

/**
 * @internal Splits the `errorSummaryItem` message into its label, message and
 * text pieces. A message without `{message}` still shows the message last.
 */
function summarySegments(template: string): readonly SummarySegment[] {
  const segments: SummarySegment[] = [];
  template.split(SUMMARY_PLACEHOLDER).forEach((part, index) => {
    if (index % 2 === 1) {
      segments.push({ kind: part as 'label' | 'message', text: '' });
      return;
    }
    if (part) {
      segments.push({ kind: 'text', text: part });
    }
  });
  if (!segments.some((segment) => segment.kind === 'message')) {
    segments.push(MESSAGE_ONLY[0]);
  }
  return segments;
}

function segmentsEqual(a: readonly SummarySegment[], b: readonly SummarySegment[]): boolean {
  return (
    a.length === b.length &&
    a.every((segment, i) => segment.kind === b[i].kind && segment.text === b[i].text)
  );
}

/**
 * @internal The visible text of a field's `CngxLabel` (id `cngx-{name}-label`)
 * without its `aria-hidden` parts such as the required marker, or `undefined`
 * when the field renders no label.
 */
function visibleLabelOf(doc: Document, name: string): string | undefined {
  const label = doc.getElementById(`cngx-${name}-label`);
  if (!label) {
    return undefined;
  }
  const copy = label.cloneNode(true) as Element;
  copy.querySelectorAll('[aria-hidden="true"]').forEach((hidden) => hidden.remove());
  const text = copy.textContent?.replace(/\s+/g, ' ').trim();
  return text || undefined;
}

/**
 * Form-level error summary - lists all validation errors across all fields.
 *
 * Place outside (or at the top/bottom of) the form. Each error is a focusable link
 * that jumps to the invalid field via `focusBoundControl()`.
 *
 * Only visible when `showErrors()` is `true` (controlled by the consumer, typically
 * set after a failed submit).
 *
 * Each item names the field by the visible text of its `CngxLabel`, never by its
 * model key, and places label and message in the order of the
 * `errorSummaryItem` message of `CNGX_FORM_FIELD_I18N` (English
 * `'{label}: {message}'`). A field without a label shows its message alone.
 *
 * This implements the WCAG 3.3.1 pattern: "If an input error is detected, the item
 * that is in error is identified and the error is described to the user in text."
 *
 * ```html
 * <cngx-form-errors [fields]="[emailField, passwordField]" [show]="showFormErrors()">
 * </cngx-form-errors>
 * ```
 *
 * Custom template
 * ```html
 * <cngx-form-errors [fields]="[emailField, passwordField]" [show]="submitted()">
 *   <ng-template let-errors="errors" let-count="count">
 *     <h3>{{ count }} errors found</h3>
 *     @for (err of errors; track err.fieldName + err.kind) {
 *       <a (click)="err.focus()" href="javascript:void(0)">
 *         {{ err.label }}: {{ err.message }}
 *       </a>
 *     }
 *   </ng-template>
 * </cngx-form-errors>
 * ```
 *
 * @category forms/field
 * @docsKind primary
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/field/form-errors.component.ts
 * @since 0.1.0
 * @relatedTo CngxFieldErrors, CngxError, focusFirstError, CNGX_ERROR_MESSAGES, withErrorMessages
 * <example-url>http://localhost:4200/#/forms/field/form-errors/basic</example-url>
 * <example-url>http://localhost:4200/#/forms/field/form-errors/show-on-submit</example-url>
 * <example-url>http://localhost:4200/#/forms/field/form-errors/custom-summary-template</example-url>
 * <example-url>http://localhost:4200/#/forms/field/form-errors/server-error-injection</example-url>
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
          @for (err of errorItems(); track err.fieldName + err.kind) {
            <li>
              <a (click)="err.focus()" (keydown.enter)="err.focus()" tabindex="0" role="link">
                @for (segment of err.label ? segments() : messageOnly; track $index) {
                  @switch (segment.kind) {
                    @case ('label') {
                      <strong>{{ err.label }}</strong>
                    }
                    @case ('message') {
                      <ng-container>{{ err.message }}</ng-container>
                    }
                    @default {
                      <ng-container>{{ segment.text }}</ng-container>
                    }
                  }
                }
              </a>
            </li>
          }
        </ul>
      }
    }
  `,
  styleUrls: ['./form-errors.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'cngxFormErrors',
  host: {
    class: 'cngx-form-errors',
    '[attr.role]': 'show() && errorItems().length > 0 ? "alert" : null',
    '[attr.aria-live]': '"polite"',
  },
})
export class CngxFormErrors {
  private readonly errorMap = inject(CNGX_ERROR_MESSAGES);
  private readonly i18n = injectFormFieldI18n();
  private readonly doc = inject(DOCUMENT);

  /** @internal */
  protected readonly messageOnly = MESSAGE_ONLY;

  /**
   * @internal - the label / message order of the active language. Read
   * untracked like the messages: a language flip must not re-voice the polite
   * region; the next error change takes the new order.
   */
  protected readonly segments = computed(
    () => {
      this.errorItems();
      return untracked(() => summarySegments(this.i18n().errorSummaryItem));
    },
    { equal: segmentsEqual },
  );

  /** The field accessors to summarize errors for. */
  readonly fields = input.required<CngxFieldAccessor[]>();

  /** Whether to show the error summary (typically set after a failed submit). */
  readonly show = input(false);

  /** Optional custom template. */
  protected readonly customTpl =
    contentChild<TemplateRef<CngxFormErrorsSummaryContext>>(TemplateRef);

  /** @internal - resolved error items with focus capability. */
  protected readonly errorItems = computed<FormErrorItem[]>(() => {
    if (!this.show()) {
      return [];
    }

    return this.fields().flatMap((fieldAccessor) => {
      const state = fieldAccessor();
      if (!state.invalid()) {
        return [];
      }
      const errors = state.errors();
      const fieldName = state.name();
      // Copy is read untracked: a language flip must not re-voice the polite
      // region; the next error change speaks the new language.
      return untracked(() => {
        const map = this.errorMap();
        const i18n = this.i18n();
        const label = visibleLabelOf(this.doc, fieldName);
        return errors.map((err) => ({
          fieldName,
          label,
          message: resolveErrorMessage(err, map, i18n),
          kind: err.kind,
          focus: () => state.focusBoundControl(),
        }));
      });
    });
  });

  /** @internal */
  protected readonly tplContext = computed<CngxFormErrorsSummaryContext>(() => ({
    $implicit: this.errorItems(),
    errors: this.errorItems(),
    count: this.errorItems().length,
  }));
}

/**
 * A single error item in the form-level summary.
 *
 * @category forms/field
 */
export interface FormErrorItem {
  /**
   * The field's key in the form model (from `FieldState.name()`). An
   * identifier, not display text: show {@link label} instead.
   */
  fieldName: string;
  /**
   * The visible text of the field's `CngxLabel`, read when the summary
   * resolves, without its `aria-hidden` parts. `undefined` when the field has
   * no label; the default summary then shows the message alone.
   */
  label: string | undefined;
  /** Resolved error message. */
  message: string;
  /** Error kind (e.g. 'required'). */
  kind: string;
  /** Focus the invalid field's control. */
  focus: () => void;
}

/**
 * Template context for CngxFormErrors custom templates.
 *
 * @category forms/field
 */
export interface CngxFormErrorsSummaryContext {
  /** Error items (also available as implicit). */
  $implicit: FormErrorItem[];
  /** All error items. */
  errors: FormErrorItem[];
  /** Total error count. */
  count: number;
}
