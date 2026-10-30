import { NgComponentOutlet } from '@angular/common';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  InjectionToken,
  inject,
  input,
  type Type,
  ViewEncapsulation,
} from '@angular/core';
import { CngxIconSvg } from '@cngx/common/display';
import { CNGX_HOST_INTERACTION_STATE } from '@cngx/common/interactive';
import { CNGX_ICON_X, cngxDevWarn } from '@cngx/utils';

import { hasAccessibleName } from './accessible-name';
import { injectButtonCore, provideButtonDescribedBy } from './button-core';
import type {
  CngxButtonSize,
  CngxButtonTone,
  CngxButtonType,
  CngxButtonVariant,
} from './button.types';

/**
 * Injection token for a custom close icon component, rendered by every
 * `button[cngxCloseButton]` that projects no glyph of its own. Set via
 * `provideFeedback(withCloseIcon(MyIcon))`, which forwards to this token, or
 * provide it directly.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/close-button.component.ts
 * @since 0.1.0
 * @relatedTo CngxCloseButton
 */
export const CNGX_CLOSE_ICON = new InjectionToken<Type<unknown>>('CngxCloseIcon');

/**
 * Close / dismiss button on the icon-button brain. Sits on the native
 * `<button>`, so every attribute the consumer writes (`aria-label`,
 * `(click)`, `data-*`, a co-hosted `cngxRipple` or `cngxTooltip`) lands on
 * the real element.
 *
 * It renders the default X glyph unless the consumer projects one or
 * `CNGX_CLOSE_ICON` swaps it app-wide; the glyph is hidden from assistive
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
 * The emphasis stays `ghost` and the size `sm` wherever the button sits: a
 * dismiss affordance does not take the group or `provideButtonConfig`
 * axes. Set `cngxCloseButton="outline"`, `size` or `tone` per instance; size
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
 * @relatedTo CNGX_CLOSE_ICON, CngxIconButton, CngxAlert, CngxToastOutlet, CngxPopoverPanel
 * <example-url>/#/common/button/close-button/basic</example-url>
 * <example-url>/#/common/button/close-button/projected-icon</example-url>
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
  providers: [
    { provide: CNGX_HOST_INTERACTION_STATE, useExisting: CngxCloseButton },
    provideButtonDescribedBy('CngxCloseButton'),
  ],
  host: {
    class: 'cngx-button cngx-icon-button cngx-close-button',
    '[attr.data-variant]': 'core.variant()',
    '[attr.data-tone]': 'core.tone()',
    '[attr.data-size]': 'core.size()',
    '[attr.data-busy]': 'core.busy() ? "true" : null',
    '[attr.aria-disabled]': 'core.ariaDisabled()',
    '[attr.aria-describedby]': 'core.describedBy()',
    '[attr.type]': 'core.hostType()',
    '[attr.disabled]': 'null',
  },
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
    @if (core.busy()) {
      <span class="cngx-button__busy" aria-hidden="true">
        <span class="cngx-button__spinner"></span>
      </span>
    }
    <span class="cngx-button__reason" [id]="core.reasonId" hidden>{{ disabledReason() }}</span>
  `,
  styleUrls: [
    './button.component.css',
    './icon-button.component.css',
    './close-button.component.css',
  ],
})
export class CngxCloseButton {
  /**
   * Emphasis, bound through the selector: `cngxCloseButton="outline"`. The
   * bare attribute keeps `ghost`.
   */
  readonly variant = input<CngxButtonVariant, CngxButtonVariant | '' | undefined>('ghost', {
    alias: 'cngxCloseButton',
    transform: (v) => (v === '' || v === undefined ? 'ghost' : v),
  });

  /** Intent. Defaults to `neutral`, which rests in the muted hint colour. */
  readonly tone = input<CngxButtonTone | undefined>(undefined);

  /** Visual size of the square box. Defaults to `sm`. */
  readonly size = input<CngxButtonSize>('sm');

  /** Rendered as `aria-disabled`; the element stays focusable and activation is swallowed. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Why the button is disabled; referenced through `aria-describedby` while disabled. */
  readonly disabledReason = input<string | undefined>(undefined);

  /**
   * Ids of external description elements, space-separated, joined into the
   * button's `aria-describedby` after a static `aria-describedby` and before
   * the disabled reason.
   */
  readonly describedBy = input<string | null>(null, {
    alias: 'cngxDescribedBy',
  });

  /** Native `type`. Defaults to `'button'`. */
  readonly type = input<CngxButtonType | undefined>(undefined);

  /** @internal - app-wide glyph from `CNGX_CLOSE_ICON`. */
  protected readonly customIcon = inject(CNGX_CLOSE_ICON, { optional: true });

  /** @internal - default X glyph from the shared icon set. */
  protected readonly closeIcon = CNGX_ICON_X;

  /** @internal */
  protected readonly core = injectButtonCore(
    {
      variant: this.variant,
      tone: this.tone,
      size: this.size,
      disabled: this.disabled,
      disabledReason: this.disabledReason,
      describedBy: this.describedBy,
      type: this.type,
    },
    { variant: 'ghost' },
  );

  constructor() {
    if (typeof ngDevMode !== 'undefined' && ngDevMode) {
      const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
      afterNextRender(() => {
        if (hasAccessibleName(host)) {
          return;
        }
        cngxDevWarn(
          'CNGX1071',
          '[cngxCloseButton] has no accessible name. Set aria-label, aria-labelledby or title on the host and name what it closes; the glyph alone is silent to assistive technology.',
          host,
        );
      });
    }
  }
}
