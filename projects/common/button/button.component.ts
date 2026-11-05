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
 * The cngx base button. Sits on the native `<button>` or `<a>`, so native
 * semantics, forms and `routerLink` keep working and every attribute the
 * consumer writes lands on the real element.
 *
 * Two orthogonal axes plus a size: `variant` (emphasis: `solid`,
 * `secondary`, `outline`, `ghost`, `link`) is the selector's own value,
 * `tone` (intent: `neutral`, `primary`, `danger`) and `size`
 * (`xs`..`lg`) are inputs. `variant` and `size` resolve `input ?? group ??
 * config ?? default`; `tone` skips the group, which passes only variant and
 * size. Density, text scale, touch floor, motion and contrast come from
 * the preference axes in `@cngx/core`, not from inputs.
 *
 * `disabled` renders `aria-disabled="true"` instead of the native
 * attribute, so the button stays focusable and a `disabledReason` can be
 * read through `aria-describedby`. Activation is swallowed while disabled:
 * `(click)`, `routerLink`, link navigation and form submission do not run.
 * The button owns `aria-describedby` through `CNGX_DESCRIBED_BY`: a static
 * `aria-describedby`, the `[cngxDescribedBy]` ids, the reason and a
 * co-hosted `[cngxTooltip]` id are merged, so none of them is lost.
 *
 * Co-host `cngxAsyncClick` for an async action: the label stays in place
 * (width stable) under a busy layer while the action runs, and the
 * directive keeps owning `aria-busy` and the announcement. The layer
 * follows the directive's busy gate: it appears once the run outlasts
 * `CNGX_LOADING_CONFIG.showDelay` and stays for at least `minDwell`;
 * `aria-busy` is immediate.
 *
 * ```html
 * <button cngxButton="outline" tone="primary">Save draft</button>
 * <button [cngxButton]="variant()" type="submit">Submit</button>
 * <a cngxButton="link" routerLink="/help">Help</a>
 * <button cngxButton [cngxAsyncClick]="save">
 *   <cngx-icon cngxButtonStart name="save" /> Save
 * </button>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/button/button.component.ts
 * @since 0.1.0
 * State, axes and ARIA come from the `CngxButtonBrain` host directive;
 * read them programmatically through `CngxButtonBrain` or
 * `CNGX_BUTTON_STATE` on the element injector.
 *
 * @relatedTo CngxIconButton, CngxButtonBrain, CngxButtonStart, CngxButtonEnd, CngxAsyncClick, provideButtonConfig, CngxMenuButton
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
  providers: [provideButtonHost('CngxButton', { defaultVariant: 'solid' })],
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
        <span class="cngx-button__spinner"></span>
      </span>
    }
    <span class="cngx-button__reason" [id]="brain.reasonId" hidden>{{
      brain.disabledReason()
    }}</span>
  `,
  styleUrl: './button.component.css',
})
export class CngxButton {
  /** @internal */
  protected readonly brain = inject(CngxButtonBrain);

  protected readonly startSlot = contentChild(CngxButtonStart);
  protected readonly endSlot = contentChild(CngxButtonEnd);
}
