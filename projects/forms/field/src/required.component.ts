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
 * @example Text marker (default)
 * ```html
 * <label cngxLabel>E-Mail <cngx-required /></label>
 * ```
 *
 * @example Custom marker text
 * ```html
 * <label cngxLabel>E-Mail <cngx-required marker="(required)" /></label>
 * ```
 *
 * @example Custom template (icon)
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
 * @category components
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
  styles: `
    :host {
      display: contents;
    }
    span {
      color: var(--cngx-field-required-color, var(--cngx-field-error-color, #d32f2f));
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
  exportAs: 'cngxRequired',
  host: {
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

/** Template context type for CngxRequired custom templates. */
export interface CngxRequiredContext {
  /** Always `true` when the template is rendered (also available as implicit). */
  $implicit: boolean;
  /** Whether the field is required. */
  required: boolean;
}
