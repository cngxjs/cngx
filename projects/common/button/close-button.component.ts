import { NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  InjectionToken,
  inject,
  type Provider,
  type Type,
  ViewEncapsulation,
} from '@angular/core';
import { CngxIconSvg } from '@cngx/common/display';
import { CNGX_ICON_X } from '@cngx/utils';

import { CngxButtonBrain } from './button-brain.directive';
import { provideButtonHost } from './button-host.token';

/**
 * Close glyph for every `button[cngxCloseButton]` that projects none.
 * `provideFeedback(withCloseIcon(MyIcon))` forwards to it.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/close-button.component.ts
 * @since 0.1.0
 * @relatedTo provideButtonCloseIcon, injectButtonCloseIcon, CngxCloseButton, withButtonCloseIcon
 * <example-url>/#/common/button/close-button/provided-icon</example-url>
 */
export const CNGX_BUTTON_CLOSE_ICON = new InjectionToken<Type<unknown>>('CngxButtonCloseIcon');

/**
 * Close glyph for every close button below that projects none. `providers` or `viewProviders`;
 * the nearest wins.
 *
 * ```ts
 * bootstrapApplication(App, { providers: [provideButtonCloseIcon(MaterialCloseIcon)] });
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/close-button.component.ts
 * @since 0.1.0
 * @relatedTo CNGX_BUTTON_CLOSE_ICON, injectButtonCloseIcon, CngxCloseButton
 * <example-url>/#/common/button/close-button/provided-icon</example-url>
 */
export function provideButtonCloseIcon(component: Type<unknown>): Provider {
  return { provide: CNGX_BUTTON_CLOSE_ICON, useValue: component };
}

/**
 * The {@link provideButtonCloseIcon} glyph, or `null` for the default X. For custom dismiss hosts.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/close-button.component.ts
 * @since 0.1.0
 * @relatedTo CNGX_BUTTON_CLOSE_ICON, provideButtonCloseIcon
 */
export function injectButtonCloseIcon(): Type<unknown> | null {
  return inject(CNGX_BUTTON_CLOSE_ICON, { optional: true });
}

/**
 * Dismiss button with the X glyph, on the icon-button geometry. Name the dismissed thing in
 * `aria-label` (`"Close session-expired alert"`, not `"Close"`), else it warns
 * [`CNGX1071`](/error-codes/cngx1071.md).
 *
 * Pins `ghost`, `sm` and `neutral` against the group and the config; inputs still win. Under the
 * Material bridge the default `sm` takes the 40px M3 icon-button box with a 24px glyph.
 *
 * ```html
 * <button cngxCloseButton aria-label="Dismiss toast" [disabled]="saving()" disabledReason="Saving">
 *   <svg aria-hidden="true" viewBox="0 0 24 24">...</svg>
 * </button>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/close-button.component.ts
 * @since 0.1.0
 * @relatedTo provideButtonCloseIcon, CngxIconButton, CngxButtonBrain, CngxAlert, CngxToastOutlet, CngxPopoverPanel, withButtonCloseIcon, withCloseIcon
 * <example-url>/#/common/button/close-button/basic</example-url>
 * <example-url>/#/common/button/close-button/projected-icon</example-url>
 * <example-url>/#/common/button/close-button/provided-icon</example-url>
 * <example-url>/#/common/button/close-button/contextual-labels</example-url>
 * <example-url>/#/common/button/close-button/inside-a-dismissible-card</example-url>
 * @axis level molecule
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- attribute selector by design (sits on the native button)
  selector: 'button[cngxCloseButton]',
  standalone: true,
  exportAs: 'cngxCloseButton',
  imports: [NgComponentOutlet, CngxIconSvg],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [
    {
      directive: CngxButtonBrain,
      inputs: [
        'variant: cngxCloseButton',
        'tone',
        'size',
        'disabled',
        'disabledReason',
        'cngxDescribedBy',
        'type',
      ],
    },
  ],
  providers: [
    provideButtonHost('cngxCloseButton', {
      defaultVariant: 'ghost',
      fixed: { variant: 'ghost', size: 'sm', tone: 'neutral' },
      iconOnly: true,
    }),
  ],
  host: { class: 'cngx-button cngx-icon-button cngx-close-button' },
  template: `
    <span class="cngx-button__label cngx-icon-button__glyph" aria-hidden="true">
      <ng-content>
        @if (customIcon) {
          <ng-container *ngComponentOutlet="customIcon" />
        } @else {
          <svg class="cngx-close-button__icon" [cngxIconSvg]="closeIcon"></svg>
        }
      </ng-content>
    </span>
    @if (brain.busyVisible()) {
      <span class="cngx-button__busy" aria-hidden="true">
        @if (brain.spinner; as spinner) {
          <ng-container *ngComponentOutlet="spinner" />
        } @else {
          <span class="cngx-button__spinner"></span>
        }
      </span>
    }
    @if (brain.disabledReason(); as reason) {
      <span class="cngx-button__reason" [id]="brain.reasonId" hidden>{{ reason }}</span>
    }
  `,
  styleUrls: [
    './button.component.css',
    './icon-button.component.css',
    './close-button.component.css',
  ],
})
export class CngxCloseButton {
  /** @internal */
  protected readonly brain = inject(CngxButtonBrain);

  /** @internal - app-wide glyph from `CNGX_BUTTON_CLOSE_ICON`. */
  protected readonly customIcon = injectButtonCloseIcon();

  /** @internal - default X glyph from the shared icon set. */
  protected readonly closeIcon = CNGX_ICON_X;
}
