import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { CngxFormFieldPresenter } from './form-field-presenter';
import { CNGX_FORM_FIELD_CONFIG } from './form-field.token';

/**
 * Label for a `cngx-form-field`. Sets `for` and `id` automatically.
 *
 * When `withRequiredMarker()` is configured globally, the label auto-appends
 * the required indicator for required fields. Override per-label with
 * `[showRequired]="false"`.
 *
 * CSS classes:
 * - `cngx-label--required` — when the field has a `required` validator
 * - `cngx-label--error` — when errors are visible (touched AND invalid)
 * - `cngx-label--disabled` — when the field is disabled
 *
 * @example Global required marker (no per-label code needed)
 * ```ts
 * provideFormField(withRequiredMarker())
 * ```
 * ```html
 * <label cngxLabel>E-Mail</label>
 * <!-- renders: E-Mail * -->
 * ```
 *
 * @example Opt-out per label
 * ```html
 * <label cngxLabel [showRequired]="false">Optional Field</label>
 * ```
 *
 * @example Manual marker (without global config)
 * ```html
 * <label cngxLabel>E-Mail <cngx-required /></label>
 * ```
 *
 * @category components
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- attribute selector by design (label can be any element)
  selector: '[cngxLabel]',
  standalone: true,
  template: `<ng-content />
    @if (markerVisible()) {
      <span class="cngx-label__required" aria-hidden="true">{{ markerText() }}</span>
    }`,
  styles: `
    :host {
      display: contents;
    }
    .cngx-label__required {
      color: var(--cngx-field-required-color, var(--cngx-field-error-color, #d32f2f));
      margin-inline-start: 0.125em;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'cngxLabel',
  host: {
    '[attr.for]': 'presenter.inputId()',
    '[id]': 'presenter.labelId()',
    '[class.cngx-label--required]': 'presenter.required()',
    '[class.cngx-label--error]': 'presenter.showError()',
    '[class.cngx-label--disabled]': 'presenter.disabled()',
  },
})
export class CngxLabel {
  /** @internal */
  protected readonly presenter = inject(CngxFormFieldPresenter);
  private readonly config = inject(CNGX_FORM_FIELD_CONFIG);

  /** Whether the associated field is required. */
  readonly required = this.presenter.required;

  /**
   * Override whether the auto-required marker is shown on this label.
   * Defaults to `undefined` (uses global config). Set `false` to opt out.
   */
  readonly showRequired = input<boolean | undefined>(undefined);

  /** @internal — resolved marker text from global config. */
  protected readonly markerText = computed(() =>
    typeof this.config.requiredMarker === 'string' ? this.config.requiredMarker : '*',
  );

  /** @internal — whether to show the auto-marker. */
  protected readonly markerVisible = computed(() => {
    // No global config → no auto-marker
    if (!this.config.requiredMarker) {
      return false;
    }
    // Per-label opt-out
    const override = this.showRequired();
    if (override === false) {
      return false;
    }
    // Show when field is required
    return this.presenter.required();
  });
}
