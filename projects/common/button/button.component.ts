import { ChangeDetectionStrategy, Component, contentChild, ViewEncapsulation } from '@angular/core';

import { CngxButtonAdornment } from './button-adornment.component';
import { CngxButtonBrain } from './button-brain.directive';
import { provideButtonHost } from './button-host.token';
import { CngxButtonEnd, CngxButtonStart } from './slots';

/**
 * The base button, an attribute component on the native `<button>` or `<a>`. `variant` is the
 * selector value. State and ARIA come from `CngxButtonBrain`; see the README for the axes and
 * accessibility.
 *
 * ```html
 * <button cngxButton="outline" tone="primary">Save draft</button>
 * <button [cngxButton]="variant()" type="submit">Submit</button>
 * <a cngxButton="link" routerLink="/help">Help</a>
 * <button cngxButton [cngxAsyncClick]="save">
 *   <svg cngxButtonStart aria-hidden="true" viewBox="0 0 24 24">...</svg>
 *   Save
 * </button>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button.component.ts
 * @since 0.3.0
 * @relatedTo CngxIconButton, CngxButtonBrain, CngxButtonStart, CngxButtonEnd, CngxAsyncClick, provideButtonConfig, CngxMenuButton, CngxButtonGroup, CngxActionButton
 * <example-url>/#/common/button/button/variants</example-url>
 * <example-url>/#/common/button/button/tones</example-url>
 * <example-url>/#/common/button/button/sizes</example-url>
 * <example-url>/#/common/button/button/start-and-end-slots</example-url>
 * <example-url>/#/common/button/button/disabled-with-reason</example-url>
 * <example-url>/#/common/button/button/async-click-busy</example-url>
 * <example-url>/#/common/button/button/aligned-with-inputs</example-url>
 * <example-url>/#/common/button/button/link-host</example-url>
 * @axis level atom
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- attribute selector by design (sits on the native button / anchor)
  selector: 'button[cngxButton], a[cngxButton]',
  standalone: true,
  exportAs: 'cngxButton',
  imports: [CngxButtonAdornment],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [
    {
      directive: CngxButtonBrain,
      inputs: [
        'variant: cngxButton',
        'tone',
        'size',
        'disabled',
        'disabledReason',
        'cngxDescribedBy',
        'type',
      ],
    },
  ],
  providers: [provideButtonHost('cngxButton', { defaultVariant: 'solid' })],
  host: {
    class: 'cngx-button',
    '[attr.data-start]': 'startSlot() ? "" : null',
    '[attr.data-end]': 'endSlot() ? "" : null',
  },
  template: `
    <ng-content select="[cngxButtonStart]" />
    <span class="cngx-button__label"><ng-content /></span>
    <ng-content select="[cngxButtonEnd]" />
    <cngx-button-adornment />
  `,
})
export class CngxButton {
  protected readonly startSlot = contentChild(CngxButtonStart);
  protected readonly endSlot = contentChild(CngxButtonEnd);
}
