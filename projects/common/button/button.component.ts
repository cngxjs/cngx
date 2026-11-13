import { NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  contentChild,
  inject,
  ViewEncapsulation,
} from '@angular/core';

import { CngxButtonBrain } from './button-brain.directive';
import { provideButtonHost } from './button-host.token';
import { CngxButtonEnd, CngxButtonStart } from './slots';

/**
 * The cngx base button, an attribute component on the native `<button>` or `<a>`. Forms,
 * `routerLink` and every attribute you write keep working on the real element.
 *
 * `variant` is the selector's own value, `tone` and `size` are inputs. Each resolves
 * `input ?? fixed ?? group ?? config ?? default`, see `CngxButtonConfig`.
 *
 * `disabled` renders `aria-disabled="true"`, so the button stays focusable and `disabledReason`
 * is read through `aria-describedby`. Clicks, `routerLink` and form submission are swallowed
 * while it is set.
 *
 * Co-host `cngxAsyncClick` for an async action. The label keeps its width under a busy layer
 * that follows the `CNGX_LOADING_CONFIG` show delay and min-dwell.
 *
 * State, axes and ARIA come from the `CngxButtonBrain` host directive. Read them through
 * `CngxButtonBrain` or `CNGX_BUTTON_STATE` on the element injector.
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
 * @since 0.1.0
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
  imports: [NgComponentOutlet],
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
  styleUrl: './button.component.css',
})
export class CngxButton {
  /** @internal */
  protected readonly brain = inject(CngxButtonBrain);

  protected readonly startSlot = contentChild(CngxButtonStart);
  protected readonly endSlot = contentChild(CngxButtonEnd);
}
