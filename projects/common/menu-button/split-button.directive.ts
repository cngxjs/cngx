import {
  afterNextRender,
  computed,
  contentChild,
  contentChildren,
  Directive,
  ElementRef,
  inject,
} from '@angular/core';
import { CNGX_BUTTON_STATE, CngxButtonGroup } from '@cngx/common/button';
import { cngxDevWarn } from '@cngx/utils';

import { CngxIconMenuButton } from './icon-menu-button.component';
import { CNGX_SPLIT_BUTTON, type CngxSplitButtonContext } from './split-button.token';

/**
 * A split button: a main `cngxButton` that runs the default action and a
 * `cngxIconMenuButton` caret that opens the alternatives, framed as one
 * button group. The group carries `role="group"` and needs a name
 * (`aria-label` or `aria-labelledby`, `CNGX1072`); `variant` and `size`
 * pass to both buttons.
 *
 * The caret derives its state from the main button: while the main action
 * is disabled, running its `cngxAsyncClick` or refused by
 * `[enabled]="false"`, the caret renders `aria-disabled`, opens on neither
 * click nor key, and an open menu closes. The caret carries no reason of its
 * own in that state: the main button already owns `aria-busy` and the
 * announcement. Inside the split the caret renders the caret glyph and is
 * named "More options" from the active language pack
 * (`CNGX_MENU_BUTTON_I18N`) unless it has an `aria-label`.
 *
 * Both roles are direct children (an `ng-container` in between is fine): the
 * caret is the `cngxIconMenuButton`, the main action the first other button
 * (`cngxButton` or `cngxIconButton`). Without a main button the directive
 * warns `CNGX1073`. Buttons deeper inside the split, for example in a
 * projected panel, take neither role.
 *
 * ```html
 * <div cngxSplitButton variant="solid" aria-label="Publish">
 *   <button cngxButton [cngxAsyncClick]="publish">Publish</button>
 *   <button cngxIconMenuButton [menu]="menu" [popover]="pop"></button>
 * </div>
 * <div cngxPopover placement="bottom-end" #pop="cngxPopover">
 *   <ul cngxMenu label="Publish options" #menu="cngxMenu">
 *     <li cngxMenuItem value="schedule">Schedule</li>
 *     <li cngxMenuItem value="draft">Save as draft</li>
 *   </ul>
 * </div>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/menu-button/split-button.directive.ts
 * @since 0.1.0
 * @relatedTo CngxIconMenuButton, CngxButton, CngxButtonGroup, CNGX_BUTTON_STATE, CngxAsyncClick, CNGX_MENU_BUTTON_I18N
 * <example-url>http://localhost:4200/#/common/menu-button/split-button/basic</example-url>
 * <example-url>http://localhost:4200/#/common/menu-button/split-button/busy-and-disabled</example-url>
 * @axis level molecule
 */
@Directive({
  selector: '[cngxSplitButton]',
  standalone: true,
  exportAs: 'cngxSplitButton',
  hostDirectives: [{ directive: CngxButtonGroup, inputs: ['variant', 'size'] }],
  providers: [{ provide: CNGX_SPLIT_BUTTON, useExisting: CngxSplitButton }],
  host: { class: 'cngx-split-button' },
})
export class CngxSplitButton implements CngxSplitButtonContext {
  // Direct children only, for both roles: a button inside a projected panel
  // is neither the main action nor the caret.
  private readonly buttons = contentChildren(CNGX_BUTTON_STATE, { descendants: false });

  /** The caret: the direct child `cngxIconMenuButton`. */
  readonly caret = contentChild(CngxIconMenuButton, { descendants: false });

  private readonly main = computed(() => this.buttons().find((button) => button !== this.caret()));

  /** `true` while the main button refuses activation; `false` without one. */
  readonly mainBlocked = computed(() => this.main()?.blocked() ?? false);

  constructor() {
    if (typeof ngDevMode !== 'undefined' && ngDevMode) {
      const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
      afterNextRender(() => {
        if (this.main()) {
          return;
        }
        cngxDevWarn(
          'CNGX1073',
          '[cngxSplitButton] has no main cngxButton. Place a <button cngxButton> as a direct child; the caret derives its blocked state from it.',
          host,
        );
      });
    }
  }
}
