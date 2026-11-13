import { NgComponentOutlet } from '@angular/common';
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
import { CngxIcon, CngxIconSvg } from '@cngx/common/display';
import { CngxMenuTrigger } from '@cngx/common/interactive';
import { CngxPopoverTrigger } from '@cngx/common/popover';
import { CNGX_ICON_CHEVRON_DOWN } from '@cngx/utils';

import { injectButtonCaretIcon } from './caret-icon.token';
import { injectMenuToggle } from './internal/menu-toggle';

/**
 * A button that opens a menu, after the WAI-ARIA APG Menu Button Pattern. Variant, tone, size,
 * `disabled` with a reason and the busy layer come from `CngxButtonBrain`, as on `cngxButton`.
 *
 * `[menu]` takes the `cngxMenu`, `[popover]` the `cngxPopover` around it. `aria-haspopup` and
 * `aria-controls` follow without a binding. ArrowDown, Enter or Space opens on the first item,
 * ArrowUp on the last; Escape or an activation closes and returns focus to the button.
 *
 * The button has no action of its own: put async work on the menu items, not on a co-hosted
 * `cngxAsyncClick`. A disabled menu button does not open, and an open menu closes when it becomes
 * disabled.
 *
 * The end renders a decorative chevron caret. `provideButtonCaretIcon` swaps it, a projected
 * `cngxButtonEnd` replaces it on one button.
 *
 * ```html
 * <button cngxMenuButton="outline" [menu]="menu" [popover]="pop">Export</button>
 * <div cngxPopover placement="bottom-start" #pop="cngxPopover">
 *   <ul cngxMenu label="Export format" #menu="cngxMenu">
 *     <li cngxMenuItem value="pdf">PDF</li>
 *     <li cngxMenuItem value="csv">CSV</li>
 *   </ul>
 * </div>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/menu-button/menu-button.component.ts
 * @since 0.1.0
 * @relatedTo CngxButton, CngxButtonBrain, CngxMenuTrigger, CngxPopoverTrigger, CngxMenu, provideButtonCaretIcon, CngxIconMenuButton, CNGX_BUTTON_CARET_ICON
 * <example-url>/#/common/menu-button/menu-button/basic</example-url>
 * <example-url>/#/common/menu-button/menu-button/disabled-with-reason</example-url>
 * <example-url>/#/common/menu-button/menu-button/custom-caret</example-url>
 * @axis level molecule
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- attribute selector by design (sits on the native button)
  selector: 'button[cngxMenuButton]',
  standalone: true,
  exportAs: 'cngxMenuButton',
  imports: [NgComponentOutlet, CngxIcon, CngxIconSvg],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [
    {
      directive: CngxButtonBrain,
      inputs: [
        'variant: cngxMenuButton',
        'tone',
        'size',
        'disabled',
        'disabledReason',
        'cngxDescribedBy',
        'type',
      ],
    },
    { directive: CngxMenuTrigger, inputs: ['cngxMenuTrigger: menu', 'popover'] },
    { directive: CngxPopoverTrigger, inputs: ['cngxPopoverTrigger: popover'] },
  ],
  providers: [provideButtonHost('cngxMenuButton', { defaultVariant: 'solid' })],
  host: {
    class: 'cngx-button cngx-menu-button',
    '[attr.data-start]': 'startSlot() ? "" : null',
    // The end is never empty: a projected cngxButtonEnd or the caret.
    'data-end': '',
    '[attr.data-expanded]': 'expanded() ? "true" : "false"',
    '(click)': 'toggle.handleClick()',
  },
  template: `
    <ng-content select="[cngxButtonStart]" />
    <span class="cngx-button__label"><ng-content /></span>
    <ng-content select="[cngxButtonEnd]" />
    @if (!endSlot()) {
      <cngx-icon class="cngx-button__slot cngx-button__slot--end cngx-menu-button__caret">
        @if (customCaret) {
          <ng-container *ngComponentOutlet="customCaret" />
        } @else {
          <svg [cngxIconSvg]="caretIcon"></svg>
        }
      </cngx-icon>
    }
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
  styleUrls: ['../button/button.component.css', './menu-button.component.css'],
})
export class CngxMenuButton {
  /** @internal */
  protected readonly brain = inject(CngxButtonBrain);

  /**
   * @internal - refuses to open while the button is blocked; an open menu
   * still closes. The brain's capture guard swallows every other click while
   * blocked, consumer `(click)` handlers included.
   */
  protected readonly toggle = injectMenuToggle(this.brain.blocked);

  /** `true` while the menu is open. */
  readonly expanded = this.toggle.expanded;

  protected readonly startSlot = contentChild(CngxButtonStart);
  protected readonly endSlot = contentChild(CngxButtonEnd);

  /** @internal - app-wide glyph from `CNGX_BUTTON_CARET_ICON`. */
  protected readonly customCaret = injectButtonCaretIcon();

  /** @internal - default chevron from the shared icon set. */
  protected readonly caretIcon = CNGX_ICON_CHEVRON_DOWN;
}
