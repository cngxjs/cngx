import {
  afterNextRender,
  computed,
  contentChild,
  Directive,
  ElementRef,
  inject,
} from '@angular/core';
import { CngxButton, CngxButtonGroup } from '@cngx/common/button';
import { cngxDevWarn } from '@cngx/utils';

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
 * The main button is the first direct `cngxButton` child (an `ng-container`
 * in between is fine); without one the directive warns `CNGX1073`.
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
 * @relatedTo CngxIconMenuButton, CngxButton, CngxButtonGroup, CngxAsyncClick, CNGX_MENU_BUTTON_I18N
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
  // Direct children only: a cngxAsyncClick button inside a projected menu
  // must never count as the main action.
  private readonly main = contentChild(CngxButton, { descendants: false });

  /** `true` while the main `cngxButton` refuses activation; `false` without one. */
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
