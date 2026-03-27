import { NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  InjectionToken,
  inject,
  input,
  type Type,
  ViewEncapsulation,
} from '@angular/core';

/**
 * Injection token for a custom close icon component.
 * Set via `provideFeedback(withCloseIcon(MyIcon))` which forwards to this token.
 */
export const CNGX_CLOSE_ICON = new InjectionToken<Type<unknown>>('CngxCloseIcon');

/**
 * Shared close/dismiss button atom.
 *
 * Renders a configurable X-icon button with consistent styling, ARIA,
 * focus ring, and density support across all cngx components.
 *
 * Used internally by `CngxAlert`, `CngxToastOutlet`, and `CngxPopoverPanel`.
 * Can also be used standalone by consumers for dialogs, drawers, chips, etc.
 *
 * All visual properties are CSS Custom Properties — density is controlled
 * via the `feedback.density()` SCSS mixin or direct overrides.
 *
 * @usageNotes
 *
 * ### Standalone
 * ```html
 * <cngx-close-button (pressed)="close()" label="Close dialog" />
 * ```
 *
 * ### Inside a component (click handled by parent)
 * ```html
 * <cngx-close-button />
 * ```
 *
 * @category interactive
 */
@Component({
  selector: 'cngx-close-button',
  standalone: true,
  imports: [NgComponentOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'cngx-close-button',
    style: 'display: contents',
  },
  template: `
    <button type="button" class="cngx-close-button__btn" [attr.aria-label]="label()">
      <ng-content>
        @if (customIcon) {
          <ng-container *ngComponentOutlet="customIcon" />
        } @else {
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
            class="cngx-close-button__icon"
          >
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        }
      </ng-content>
    </button>
  `,
  styles: `
    .cngx-close-button__btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      appearance: none;
      background: var(--cngx-close-button-bg, none);
      border: var(--cngx-close-button-border, none);
      min-width: var(--cngx-close-button-size, 32px);
      min-height: var(--cngx-close-button-size, 32px);
      padding: var(--cngx-close-button-padding, 8px);
      cursor: pointer;
      color: var(--cngx-close-button-color, inherit);
      opacity: var(--cngx-close-button-opacity, 0.5);
      border-radius: var(--cngx-close-button-radius, 4px);
      transition: opacity var(--cngx-close-button-transition, 150ms) ease;
    }

    .cngx-close-button__btn:hover {
      opacity: var(--cngx-close-button-hover-opacity, 1);
      background: var(--cngx-close-button-hover-bg, rgba(0, 0, 0, 0.04));
    }

    .cngx-close-button__btn:focus-visible {
      outline: var(--cngx-close-button-focus-outline, 2px solid currentColor);
      outline-offset: var(--cngx-close-button-focus-offset, 2px);
      opacity: 1;
    }

    .cngx-close-button__btn:active {
      opacity: var(--cngx-close-button-active-opacity, 0.8);
    }

    .cngx-close-button__icon {
      width: var(--cngx-close-button-icon-size, 16px);
      height: var(--cngx-close-button-icon-size, 16px);
      flex-shrink: 0;
    }
  `,
})
export class CngxCloseButton {
  /**
   * Accessible label for the button.
   * Default `"Close"` is generic — provide a contextual label for standalone use
   * (e.g. `"Close dialog"`, `"Dismiss notification"`).
   */
  readonly label = input.required<string>();

  /** @internal — global icon from CNGX_CLOSE_ICON token. */
  protected readonly customIcon = inject(CNGX_CLOSE_ICON, { optional: true });
}
