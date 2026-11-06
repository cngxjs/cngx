import {
  ChangeDetectionStrategy,
  Component,
  contentChild,
  inject,
  ViewEncapsulation,
} from '@angular/core';
import {
  CngxButtonBrain,
  CngxButtonEnd,
  CngxButtonStart,
  provideButtonHost,
} from '@cngx/common/button';

import { CngxPopover } from './popover.directive';

/**
 * Footer button that closes the popover it sits in. A `CngxButtonBrain`
 * host on the native `<button>`, painted by the button stylesheet: the
 * variant is the selector's own value (default `outline`), `tone` and
 * `size` are inputs, and the size is pinned to `sm` against the group and
 * the config (the input still wins).
 *
 * `disabled` renders `aria-disabled="true"`, keeps the button focusable,
 * swallows the click (the popover stays open) and references a
 * `disabledReason` through `aria-describedby`. Focus returns to the
 * trigger through the composing `CngxPopoverPanel`, which claims the
 * restore; the button has no restore of its own. Outside a popover the
 * click does nothing.
 *
 * For an async confirm next to it, use `button[cngxPopoverAction]`.
 *
 * ```html
 * <div cngxPopoverFooter>
 *   <button cngxPopoverDismiss>Cancel</button>
 *   <button cngxPopoverAction="solid" tone="danger" [action]="delete">Delete</button>
 * </div>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/popover/popover-dismiss.component.ts
 * @since 0.1.0
 * @relatedTo CngxPopoverAction, CngxPopoverPanel, CngxPopoverFooter, CngxButtonBrain
 * <example-url>/#/common/popover/popover-panel/with-footer-actions</example-url>
 * <example-url>/#/common/popover/popover-panel/with-dividers</example-url>
 * <example-url>/#/common/popover/popover-panel/footer-actions-plain</example-url>
 * @axis level molecule
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- attribute selector by design (sits on the native button)
  selector: 'button[cngxPopoverDismiss]',
  standalone: true,
  exportAs: 'cngxPopoverDismiss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [
    {
      directive: CngxButtonBrain,
      inputs: [
        'variant: cngxPopoverDismiss',
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
    provideButtonHost('cngxPopoverDismiss', { defaultVariant: 'outline', fixed: { size: 'sm' } }),
  ],
  host: {
    class: 'cngx-button cngx-popover-dismiss',
    '[attr.data-start]': 'startSlot() ? "" : null',
    '[attr.data-end]': 'endSlot() ? "" : null',
    '(click)': 'handleClick()',
  },
  template: `
    <ng-content select="[cngxButtonStart]" />
    <span class="cngx-button__label"><ng-content /></span>
    <ng-content select="[cngxButtonEnd]" />
    @if (brain.disabledReason(); as reason) {
      <span class="cngx-button__reason" [id]="brain.reasonId" hidden>{{ reason }}</span>
    }
  `,
  styleUrls: ['../button/button.component.css'],
})
export class CngxPopoverDismiss {
  private readonly popover = inject(CngxPopover, { optional: true });

  /** @internal */
  protected readonly brain = inject(CngxButtonBrain);

  protected readonly startSlot = contentChild(CngxButtonStart);
  protected readonly endSlot = contentChild(CngxButtonEnd);

  protected handleClick(): void {
    if (this.brain.blocked()) {
      return;
    }
    this.popover?.hide();
  }
}
