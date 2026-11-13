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
 * Injection token for a custom close icon component, rendered by every
 * `button[cngxCloseButton]` that projects no glyph of its own. Set it with
 * {@link provideButtonCloseIcon}, or through `provideFeedback(withCloseIcon(MyIcon))`,
 * which forwards to it.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/close-button.component.ts
 * @since 0.1.0
 * @relatedTo provideButtonCloseIcon, injectButtonCloseIcon, CngxCloseButton
 * <example-url>/#/common/button/close-button/provided-icon</example-url>
 */
export const CNGX_BUTTON_CLOSE_ICON = new InjectionToken<Type<unknown>>('CngxButtonCloseIcon');

/**
 * Provides `component` as the glyph of every close button below the provider that projects none
 * (`CNGX_BUTTON_CLOSE_ICON`). Works in `providers` and `viewProviders`. The nearest provider
 * wins.
 *
 * ```ts
 * bootstrapApplication(App, { providers: [provideButtonCloseIcon(MaterialCloseIcon)] });
 * ```
 *
 * @param component The glyph component; it renders inside the `aria-hidden` glyph span.
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
 * Reads the close glyph component provided through {@link provideButtonCloseIcon},
 * or `null` when none is set and the default X renders. Runs in an
 * injection context; a custom dismiss host reads its glyph through it.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/close-button.component.ts
 * @since 0.1.0
 * @relatedTo CNGX_BUTTON_CLOSE_ICON, provideButtonCloseIcon
 */
export function injectButtonCloseIcon(): Type<unknown> | null {
  return inject(CNGX_BUTTON_CLOSE_ICON, { optional: true });
}

/**
 * Close or dismiss button on the native `<button>`, built on the icon-button geometry.
 *
 * It renders the default X glyph unless you project one or `provideButtonCloseIcon` swaps it.
 * The glyph is `aria-hidden`, so set `aria-label` on the host and name the dismissed thing, not
 * the affordance: `"Close session-expired alert"`, not `"Close"`. Without a name the host warns
 * [`CNGX1071`](/error-codes/cngx1071.md) in development.
 *
 * It pins `ghost`, `sm` and `neutral` against the group and the button config, so an app
 * default never makes a dismiss loud. Set `cngxCloseButton="outline"`, `size` or `tone` per
 * instance. `--cngx-close-button-size` and `--cngx-close-button-icon-size` size the box and the
 * glyph. Under the Material bridge the default `sm` close button takes the 40px M3 icon-button
 * box with a 24px glyph, and a value you set on the host still wins.
 *
 * ```html
 * <button cngxCloseButton aria-label="Close settings dialog" (click)="close()"></button>
 * <button cngxCloseButton aria-label="Dismiss toast" [disabled]="saving()" disabledReason="Saving">
 *   <svg aria-hidden="true" viewBox="0 0 24 24">...</svg>
 * </button>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/close-button.component.ts
 * @since 0.1.0
 * @relatedTo provideButtonCloseIcon, CngxIconButton, CngxButtonBrain, CngxAlert, CngxToastOutlet, CngxPopoverPanel
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
