import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';
import { CNGX_HOST_INTERACTION_STATE } from '@cngx/common/interactive';
import { cngxDevWarn } from '@cngx/utils';

import { injectButtonCore, provideButtonDescribedBy } from './button-core';
import type {
  CngxButtonSize,
  CngxButtonTone,
  CngxButtonType,
  CngxButtonVariant,
} from './button.types';

/**
 * Square, icon-only button on the same brain as `CngxButton`: the same
 * variant / tone / size axes, `aria-disabled` with a `disabledReason`, the
 * activation guard, `type="button"` by default and the busy layer of a
 * co-hosted `cngxAsyncClick`. The variant defaults to `ghost` unless a group
 * or `provideButtonConfig` picks one.
 *
 * The glyph carries no text, so the accessible name is the consumer's job:
 * set `aria-label` (or `aria-labelledby` / `title`). A host without any of
 * them warns `CNGX1071` in development mode. A tooltip is a separate,
 * per-icon decision; co-host `[cngxTooltip]` where the icon alone is
 * ambiguous. Its id joins the button's `aria-describedby` through
 * `CNGX_DESCRIBED_BY`, next to the static ids and the disabled reason.
 *
 * The visual box follows `size` and stays square; on a coarse pointer the
 * hit area grows to `--cngx-target-min` through a pseudo-element, so the
 * icon keeps its design size.
 *
 * ```html
 * <button cngxIconButton aria-label="Delete row" tone="danger" (click)="remove()">
 *   <cngx-icon name="delete" />
 * </button>
 * ```
 *
 * @category common/button
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/icon-button.component.ts
 * @since 0.1.0
 * @relatedTo CngxButton, CngxAsyncClick, provideButtonConfig
 * <example-url>http://localhost:4200/#/common/button/icon-button/basic</example-url>
 * <example-url>http://localhost:4200/#/common/button/icon-button/with-badge</example-url>
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- attribute selector by design (sits on the native button / anchor)
  selector: 'button[cngxIconButton], a[cngxIconButton]',
  standalone: true,
  exportAs: 'cngxIconButton',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  providers: [
    { provide: CNGX_HOST_INTERACTION_STATE, useExisting: CngxIconButton },
    provideButtonDescribedBy('CngxIconButton'),
  ],
  host: {
    class: 'cngx-button cngx-icon-button',
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
    <span class="cngx-button__label cngx-icon-button__glyph"><ng-content /></span>
    @if (core.busy()) {
      <span class="cngx-button__busy" aria-hidden="true">
        <span class="cngx-button__spinner"></span>
      </span>
    }
    <span class="cngx-button__reason" [id]="core.reasonId" hidden>{{ disabledReason() }}</span>
  `,
  styleUrls: ['./button.component.css', './icon-button.component.css'],
})
export class CngxIconButton {
  /**
   * Emphasis, bound through the selector: `cngxIconButton="solid"`. The bare
   * attribute falls through to the group, the config and `ghost`.
   */
  readonly variant = input<CngxButtonVariant | undefined, CngxButtonVariant | '' | undefined>(
    undefined,
    { alias: 'cngxIconButton', transform: (v) => (v === '' ? undefined : v) },
  );

  /** Intent. Falls through to the config and `neutral`. */
  readonly tone = input<CngxButtonTone | undefined>(undefined);

  /** Visual size of the square box. Falls through to the group, the config and `md`. */
  readonly size = input<CngxButtonSize | undefined>(undefined);

  /** Rendered as `aria-disabled`; the element stays focusable and activation is swallowed. */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Why the button is disabled; referenced through `aria-describedby` while disabled. */
  readonly disabledReason = input<string | undefined>(undefined);

  /** Native `type` on a `<button>` host. Defaults to `'button'`; ignored on `<a>`. */
  readonly type = input<CngxButtonType | undefined>(undefined);

  /** @internal */
  protected readonly core = injectButtonCore(
    {
      variant: this.variant,
      tone: this.tone,
      size: this.size,
      disabled: this.disabled,
      disabledReason: this.disabledReason,
      type: this.type,
    },
    { variant: 'ghost' },
  );

  constructor() {
    if (typeof ngDevMode !== 'undefined' && ngDevMode) {
      const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
      afterNextRender(() => {
        const named = ['aria-label', 'aria-labelledby', 'title'].some(
          (attr) => (host.getAttribute(attr) ?? '').trim() !== '',
        );
        if (named) {
          return;
        }
        cngxDevWarn(
          'CNGX1071',
          '[cngxIconButton] has no accessible name. Set aria-label, aria-labelledby or title on the host; the icon alone is silent to assistive technology.',
          host,
        );
      });
    }
  }
}
