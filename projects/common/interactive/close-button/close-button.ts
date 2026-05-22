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
 * Shared close/dismiss button molecule.
 *
 * Composes the native `<button>` shell with an optional projected icon
 * and the `CNGX_CLOSE_ICON` DI swap; owns ARIA wiring, focus ring,
 * density, and a default X glyph as the projection fallback.
 *
 * Used internally by `CngxAlert`, `CngxToastOutlet`, and `CngxPopoverPanel`.
 * Can also be used standalone by consumers for dialogs, drawers, chips, etc.
 *
 * All visual properties are CSS Custom Properties — density is controlled
 * via the `feedback.density()` SCSS mixin or direct overrides.
 *
 * ### Standalone
 * ```html
 * <cngx-close-button label="Close dialog" (click)="close()" />
 * ```
 *
 * ### Inside a component (click handled by parent)
 * ```html
 * <cngx-close-button label="Close" />
 * ```
 *
 * Note: the host uses `display: contents`, so applying
 * `position: absolute` directly on `<cngx-close-button>` is silently
 * ignored. Wrap in a positioned element when corner-pinning.
 *
 * <example-url>http://localhost:4200/#/common/interactive/close-button/basic</example-url>
 * <example-url>http://localhost:4200/#/common/interactive/close-button/projected-icon</example-url>
 * <example-url>http://localhost:4200/#/common/interactive/close-button/contextual-labels</example-url>
 * <example-url>http://localhost:4200/#/common/interactive/close-button/inside-a-dismissible-card</example-url>
 */
@Component({
  selector: 'cngx-close-button',
  standalone: true,
  imports: [NgComponentOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  host: {
    class: 'cngx-close-button',
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
  styleUrls: ['./close-button.css'],
})
export class CngxCloseButton {
  /**
   * Required accessible label for the inner `<button>` (`aria-label`).
   * Describe the dismissable artifact, not the affordance:
   * `"Close session-expired alert"`, not `"Close"`. A bare `"Close"`
   * reads identically across every dismiss target on the page.
   */
  readonly label = input.required<string>();

  /** @internal — global icon from CNGX_CLOSE_ICON token. */
  protected readonly customIcon = inject(CNGX_CLOSE_ICON, { optional: true });
}
