import {
  afterEveryRender,
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  ElementRef,
  inject,
  input,
  signal,
  ViewEncapsulation,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { coerceSignal } from '@cngx/core/utils';
import { cngxDevWarn } from '@cngx/utils';
import { injectFormFieldPresenter } from './inject-form-field-presenter';
import { CNGX_FORM_FIELD_CONFIG } from './form-field.token';

/**
 * The text of `el` without its `aria-hidden` parts (the required marker),
 * whitespace collapsed.
 */
function visibleText(el: HTMLElement): string {
  const copy = el.cloneNode(true) as HTMLElement;
  copy.querySelectorAll('[aria-hidden="true"]').forEach((hidden) => hidden.remove());
  return copy.textContent?.replace(/\s+/g, ' ').trim() ?? '';
}

/** Elements a `<label for>` can name and click-focus (HTML labelable elements). */
const LABELABLE = 'input:not([type="hidden"]), select, textarea, button, meter, output, progress';

/**
 * Label for a `cngx-form-field`. Sets `for` and `id` automatically.
 *
 * `for` is set only while the field's control is a labelable element (an
 * `<input>`, `<select>`, `<textarea>`). A custom control (a toggle, a
 * checkbox, a group, a slider, a select) cannot be named or focused through
 * `for`: it takes the label through `aria-labelledby`, and a click on the
 * label focuses it.
 *
 * When `withRequiredMarker()` is configured globally, the label auto-appends
 * the required indicator for required fields. Override per-label with
 * `[showRequired]="false"`.
 *
 * CSS classes:
 * - `cngx-label--required` - when the field has a `required` validator
 * - `cngx-label--error` - when field errors are visible or the discovered control reports an error state
 * - `cngx-label--disabled` - when the field or the discovered control is disabled
 *
 * Placement is composition, not an input: a label placed as a direct child of
 * a `CngxFieldBox` renders as an inner static label, on its own line above the
 * prefix / control / suffix line inside the box surface (the Material 3 filled
 * look, without a float). The box grows by the label line and keeps its
 * formula. Place the label in one spot per form, outside every box or inside
 * every box.
 *
 * ```html
 * <cngx-form-field [field]="form.reference" skin="fill">
 *   <span cngxFieldBox>
 *     <label cngxLabel>Order reference</label>
 *     <input cngxInput [formField]="form.reference" />
 *   </span>
 * </cngx-form-field>
 * ```
 *
 * Global required marker (no per-label code needed)
 * ```ts
 * provideFormField(withRequiredMarker())
 * ```
 * ```html
 * <label cngxLabel>E-Mail</label>
 * <!-- renders: E-Mail * -->
 * ```
 *
 * Opt-out per label
 * ```html
 * <label cngxLabel [showRequired]="false">Optional Field</label>
 * ```
 *
 * Manual marker (without global config)
 * ```html
 * <label cngxLabel>E-Mail <cngx-required /></label>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/forms/field/label.component.ts
 * @since 0.1.0
 * @relatedTo CngxFormField, CngxRequired, CngxHint, withRequiredMarker
 * <example-url>/#/forms/field/label/basic</example-url>
 * <example-url>/#/forms/field/label/required-marker</example-url>
 * <example-url>/#/forms/field/label/error-and-disabled-classes</example-url>
 * <example-url>/#/forms/field/label/show-required-override</example-url>
 * <example-url>/#/forms/field/skin/fill-anatomy</example-url>
 * @axis level atom
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- attribute selector by design (label can be any element)
  selector: '[cngxLabel]',
  standalone: true,
  template: `<ng-content />
    @if (markerVisible()) {
      <span class="cngx-label__required" aria-hidden="true">{{ markerText() }}</span>
    }`,
  styleUrls: ['./label.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'cngxLabel',
  host: {
    class: 'cngx-label',
    '[attr.for]': 'forTarget()',
    '[id]': 'presenter.labelId()',
    '[class.cngx-label--required]': 'presenter.required()',
    '[class.cngx-label--error]': 'presenter.fieldOrControlError()',
    '[class.cngx-label--disabled]': 'presenter.fieldOrControlDisabled()',
    '(click)': 'handleClick()',
  },
})
export class CngxLabel {
  /** @internal */
  protected readonly presenter = injectFormFieldPresenter('cngxLabel');
  private readonly config = inject(CNGX_FORM_FIELD_CONFIG);

  /** Whether the associated field is required. */
  readonly required = this.presenter.required;

  /**
   * Override whether the auto-required marker is shown on this label.
   * Defaults to `undefined` (uses global config). Set `false` to opt out.
   */
  readonly showRequired = input<boolean | undefined>(undefined);

  /** @internal - the configured marker; a Signal marker follows a language switch. */
  private readonly marker = coerceSignal<string | false | undefined>(this.config.requiredMarker);

  /** @internal - resolved marker text from global config. */
  protected readonly markerText = computed(() => {
    const marker = this.marker();
    return typeof marker === 'string' ? marker : '*';
  });

  private readonly doc = inject(DOCUMENT);
  private readonly targetLabelable = signal(false);

  /** @internal - the `for` target, only while it is a labelable element. */
  protected readonly forTarget = computed(() =>
    this.targetLabelable() ? this.presenter.controlId() : null,
  );

  constructor() {
    // Publishes the rendered label text on the host contract. Read after
    // every render because the text is projected content: a binding in the
    // consumer's view (a language flip) changes it without this view running.
    // The same pass checks whether the control element can take `for`.
    const el = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    let warned = false;
    afterEveryRender({
      read: () => {
        this.presenter.reportLabelText(visibleText(el));
        const target = this.doc.getElementById(this.presenter.controlId());
        this.targetLabelable.set(target?.matches(LABELABLE) ?? false);
        if (typeof ngDevMode !== 'undefined' && ngDevMode && !warned && !this.presenter.control()) {
          warned = true;
          cngxDevWarn(
            'CNGX2030',
            `[cngxLabel] the field "${this.presenter.name()}" has no control, so the label names ` +
              'nothing. Put a field control (cngxInput, a select, a common form atom, a field ' +
              'bridge) inside the cngx-form-field.',
          );
        }
      },
    });
    inject(DestroyRef).onDestroy(() => this.presenter.reportLabelText(''));
  }

  /**
   * @internal A label without `for` focuses its control on click; a label
   * with `for` leaves it to the browser.
   */
  protected handleClick(): void {
    if (this.targetLabelable()) {
      return;
    }
    const control = this.presenter.control();
    if (control?.focus) {
      control.focus();
      return;
    }
    this.doc.getElementById(this.presenter.controlId())?.focus();
  }

  /** @internal - whether to show the auto-marker. */
  protected readonly markerVisible = computed(() => {
    if (!this.marker()) {
      return false;
    }
    const override = this.showRequired();
    if (override === false) {
      return false;
    }
    return this.presenter.required();
  });
}
