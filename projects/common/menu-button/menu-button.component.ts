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
import { CngxIcon } from '@cngx/common/display';
import { CngxMenuTrigger } from '@cngx/common/interactive';
import { CngxPopoverTrigger } from '@cngx/common/popover';

import { CNGX_BUTTON_CARET_ICON } from './caret-icon.token';
import { injectMenuToggle } from './internal/menu-toggle';

/**
 * A button that opens a menu: the WAI-ARIA APG Menu Button Pattern as its
 * own button type. Sits on the native `<button>` and renders on
 * `CngxButtonBrain`, so variant, tone, size, group, disabled and busy behave
 * exactly as on `cngxButton`.
 *
 * Two bindings wire it: `[menu]` is the `cngxMenu` it drives and
 * `[popover]` the `cngxPopover` that wraps the menu. The button composes
 * `CngxMenuTrigger` (keyboard model, focus, dismissal, the `menu` haspopup
 * hint) and `CngxPopoverTrigger` (anchor, `aria-haspopup`, `aria-expanded`,
 * `aria-controls`) as host directives, and toggles the popover on click.
 * `aria-haspopup` reads `menu` and `aria-controls` names the `role="menu"`
 * element; a sheet or fullscreen presentation reads `dialog` and names the
 * popover. ArrowDown, Enter or Space opens the menu and highlights the
 * first item, ArrowUp the last. After open, focus moves into the menu,
 * which carries `aria-activedescendant`. Escape or an activation closes it
 * and returns focus to the button; Tab or Shift+Tab closes it and leaves
 * focus where it went.
 *
 * The end of the button renders a caret that turns while the menu is open.
 * Swap the glyph app-wide with `CNGX_BUTTON_CARET_ICON`, or project your
 * own `cngxButtonEnd` content, which replaces the caret. The caret is
 * decorative and hidden from assistive technology.
 *
 * `disabled` renders `aria-disabled`: the button stays focusable, opens on
 * neither click nor key, closes an open menu, and reads its
 * `disabledReason` through `aria-describedby`.
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
 * @relatedTo CngxButton, CngxButtonBrain, CngxMenuTrigger, CngxPopoverTrigger, CngxMenu, CNGX_BUTTON_CARET_ICON
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
  imports: [NgComponentOutlet, CngxIcon],
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
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <path d="m6 9 6 6 6-6" />
          </svg>
        }
      </cngx-icon>
    }
    @if (brain.busyVisible()) {
      <span class="cngx-button__busy" aria-hidden="true">
        <span class="cngx-button__spinner"></span>
      </span>
    }
    <span class="cngx-button__reason" [id]="brain.reasonId" hidden>{{
      brain.disabledReason()
    }}</span>
  `,
  styleUrls: ['../button/button.component.css', './menu-button.component.css'],
})
export class CngxMenuButton {
  /** @internal */
  protected readonly brain = inject(CngxButtonBrain);

  /**
   * @internal - refuses to open the menu while the button is blocked
   * (disabled, a pending co-hosted `cngxAsyncClick`, or its
   * `[enabled]="false"`); an open menu still closes on click. The brain's
   * capture guard handles only refusal, so consumer `(click)` handlers
   * still run.
   */
  protected readonly toggle = injectMenuToggle(this.brain.blocked);

  /** `true` while the menu is open. Mirrors the popover's visibility. */
  readonly expanded = this.toggle.expanded;

  protected readonly startSlot = contentChild(CngxButtonStart);
  protected readonly endSlot = contentChild(CngxButtonEnd);

  /** @internal - app-wide glyph from `CNGX_BUTTON_CARET_ICON`. */
  protected readonly customCaret = inject(CNGX_BUTTON_CARET_ICON, { optional: true });
}
