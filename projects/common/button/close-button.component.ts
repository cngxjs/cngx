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
 * {@link provideCloseIcon}, or through `provideFeedback(withCloseIcon(MyIcon))`,
 * which forwards to it.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/close-button.component.ts
 * @since 0.1.0
 * @relatedTo provideCloseIcon, injectCloseIcon, CngxCloseButton
 * <example-url>/#/common/button/close-button/provided-icon</example-url>
 */
export const CNGX_CLOSE_ICON = new InjectionToken<Type<unknown>>('CngxCloseIcon');

/**
 * Provides `component` as the glyph of every close button below the
 * provider that projects none (`CNGX_CLOSE_ICON`). Works in `providers` and
 * `viewProviders`; the nearest provider wins. Alerts, toasts and banners get
 * it through `provideFeedback(withCloseIcon(...))`, which uses this function.
 *
 * ```ts
 * bootstrapApplication(App, { providers: [provideCloseIcon(MaterialCloseIcon)] });
 * ```
 *
 * @param component The glyph component; it renders inside the `aria-hidden` glyph span.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/close-button.component.ts
 * @since 0.1.0
 * @relatedTo CNGX_CLOSE_ICON, injectCloseIcon, CngxCloseButton
 * <example-url>/#/common/button/close-button/provided-icon</example-url>
 */
export function provideCloseIcon(component: Type<unknown>): Provider {
  return { provide: CNGX_CLOSE_ICON, useValue: component };
}

/**
 * Reads the close glyph component provided through {@link provideCloseIcon},
 * or `null` when none is set and the default X renders. Runs in an
 * injection context; a custom dismiss host reads its glyph through it.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/close-button.component.ts
 * @since 0.1.0
 * @relatedTo CNGX_CLOSE_ICON, provideCloseIcon
 */
export function injectCloseIcon(): Type<unknown> | null {
  return inject(CNGX_CLOSE_ICON, { optional: true });
}

/**
 * Close / dismiss button on the icon-button brain. Sits on the native
 * `<button>`, so every attribute the consumer writes (`aria-label`,
 * `(click)`, `data-*`, a co-hosted `cngxRipple` or `cngxTooltip`) lands on
 * the real element.
 *
 * It renders the default X glyph unless the consumer projects one or
 * `provideCloseIcon` swaps it app-wide; the glyph is hidden from assistive
 * technology, so the name is the consumer's copy: set `aria-label` on the
 * host and name the dismissed artifact, not the affordance (`"Close
 * session-expired alert"`, not `"Close"`). A host without `aria-label`,
 * `aria-labelledby` or `title` warns `CNGX1071` in development mode.
 *
 * Shares the button family's state surface: `disabled` renders
 * `aria-disabled` (the button stays focusable and swallows activation) and
 * `disabledReason` is read through `aria-describedby`, so a blocked close
 * still says why it does nothing.
 *
 * The emphasis stays `ghost`, the size `sm` and the tone `neutral`
 * wherever the button sits: a dismiss affordance does not take the group or
 * `provideButtonConfig` axes. Set `cngxCloseButton="outline"`, `size` or `tone` per instance; size
 * the box and the glyph with `--cngx-close-button-size` and
 * `--cngx-close-button-icon-size`.
 *
 * ```html
 * <button cngxCloseButton aria-label="Close settings dialog" (click)="close()"></button>
 * <button cngxCloseButton aria-label="Dismiss toast" [disabled]="saving()" disabledReason="Saving">
 *   <cngx-icon name="close" />
 * </button>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/close-button.component.ts
 * @since 0.1.0
 * @relatedTo provideCloseIcon, CngxIconButton, CngxButtonBrain, CngxAlert, CngxToastOutlet, CngxPopoverPanel
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

  /** @internal - app-wide glyph from `CNGX_CLOSE_ICON`. */
  protected readonly customIcon = injectCloseIcon();

  /** @internal - default X glyph from the shared icon set. */
  protected readonly closeIcon = CNGX_ICON_X;
}
