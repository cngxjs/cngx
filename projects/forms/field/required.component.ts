import {
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  inject,
  input,
  TemplateRef,
  ViewEncapsulation,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { CngxFormFieldPresenter } from './form-field-presenter';

/**
 * Auto-showing required indicator inside a `cngx-form-field`.
 *
 * Renders the marker only when the field's `required()` signal is `true`.
 * Sets `aria-hidden="true"` so screen readers ignore the visual marker —
 * the input already communicates required state via `aria-required`.
 *
 * Supports a custom template for rendering icons, tooltips, or styled badges.
 *
 * Text marker (default)
 * ```html
 * <label cngxLabel>E-Mail <cngx-required /></label>
 * ```
 *
 * Custom marker text
 * ```html
 * <label cngxLabel>E-Mail <cngx-required marker="(required)" /></label>
 * ```
 *
 * Custom template (icon)
 * ```html
 * <label cngxLabel>
 *   E-Mail
 *   <cngx-required>
 *     <ng-template>
 *       <svg width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="4" fill="currentColor"/></svg>
 *     </ng-template>
 *   </cngx-required>
 * </label>
 * ```
 *
 * @category forms/field
 * <example-url>http://localhost:4200/#/forms/field/required/basic</example-url>
 * <example-url>http://localhost:4200/#/forms/field/required/custom-template</example-url>
 * <example-url>http://localhost:4200/#/forms/field/required/auto-hide-on-non-required</example-url>
 * <example-url>http://localhost:4200/#/forms/field/required/placement-conventions</example-url>
 */
@Component({
  selector: 'cngx-required',
  standalone: true,
  imports: [NgTemplateOutlet],
  template: `@if (presenter.required()) {
    @if (customTpl()) {
      <ng-container *ngTemplateOutlet="customTpl()!; context: tplContext()" />
    } @else {
      <span>{{ marker() }}</span>
    }
  }`,
  styleUrls: ['./required.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  exportAs: 'cngxRequired',
  host: {
    class: 'cngx-required',
    'aria-hidden': 'true',
  },
})
export class CngxRequired {
  /** @internal */
  protected readonly presenter = inject(CngxFormFieldPresenter);

  /** Optional custom template. Replaces the text marker when provided. */
  protected readonly customTpl = contentChild<TemplateRef<CngxRequiredContext>>(TemplateRef);

  /**
   * The visual marker text. Defaults to `*`. Ignored when a custom template is provided.
   */
  readonly marker = input('*');

  /** @internal */
  protected readonly tplContext = computed<CngxRequiredContext>(() => ({
    $implicit: true,
    required: this.presenter.required(),
  }));
}

/**
 * Template context type for CngxRequired custom templates.
 *
 * @category forms/field
 */
export interface CngxRequiredContext {
  /** Always `true` when the template is rendered (also available as implicit). */
  $implicit: boolean;
  /** Whether the field is required. */
  required: boolean;
}
