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
import { fieldLabelFor, focusFieldControl } from './field-control-registry';
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
 * Form-level error summary - lists all validation errors across all fields.
 *
 * Place outside (or at the top/bottom of) the form. Each error is a focusable link
 * that jumps to the invalid field's control: through `focusBoundControl()` for
 * `[formField]`, else through the control's own `focus()` (an adapted Reactive
 * Forms control, a field bridge, a select).
 *
 * Only visible when `showErrors()` is `true` (controlled by the consumer, typically
 * set after a failed submit).
 *
 * Each item names the field by the visible text of its `CngxLabel`, which the
 * field publishes (no DOM read), never by its model key, and places label and
 * message in the order of the `errorSummaryItem` message of
 * `CNGX_FORM_FIELD_I18N` (English `'{label}: {message}'`). A field without a
 * label shows its message alone.
 *
 * The host is a polite status region from the first render; only its content
 * changes. A language flip does not re-voice it: the messages and labels keep
 * the old language until the errors change, then the new copy is spoken.
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
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/field/form-errors.component.ts
 * @since 0.1.0
 * @relatedTo CngxFieldErrors, CngxError, focusFirstError, CNGX_ERROR_MESSAGES, withErrorMessages
 * <example-url>/#/forms/field/form-errors/basic</example-url>
 * <example-url>/#/forms/field/form-errors/show-on-submit</example-url>
 * <example-url>/#/forms/field/form-errors/custom-summary-template</example-url>
 * <example-url>/#/forms/field/form-errors/server-error-injection</example-url>
 * @axis level organism
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
          @for (err of errorItems(); track $index) {
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
    role: 'status',
    'aria-live': 'polite',
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
      // Tracked: whether the field renders a label, so a summary placed above
      // its fields names them once they render. The text itself and the copy
      // are read untracked: a language flip must not re-voice the polite
      // region; the next error change speaks the new language.
      const fieldLabel = fieldLabelFor(state);
      const labelled = fieldLabel?.present() === true;
      return untracked(() => {
        const map = this.errorMap();
        const i18n = this.i18n();
        const label = labelled ? fieldLabel?.text() : undefined;
        return errors.map((err) => ({
          fieldName,
          label,
          message: resolveErrorMessage(err, map, i18n),
          kind: err.kind,
          focus: () => {
            focusFieldControl(state, this.doc);
          },
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
 */
export interface FormErrorItem {
  /**
   * The field's key in the form model (from `FieldState.name()`). An
   * identifier, not display text: show {@link label} instead.
   */
  fieldName: string;
  /**
   * The visible text of the field's `CngxLabel`, without its `aria-hidden`
   * parts, as the field publishes it. `undefined` when the field has no
   * label; the default summary then shows the message alone.
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
 */
export interface CngxFormErrorsSummaryContext {
  /** Error items (also available as implicit). */
  $implicit: FormErrorItem[];
  /** All error items. */
  errors: FormErrorItem[];
  /** Total error count. */
  count: number;
}
