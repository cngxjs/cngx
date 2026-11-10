import {
  afterNextRender,
  computed,
  contentChild,
  contentChildren,
  Directive,
  effect,
  ElementRef,
  inject,
  untracked,
} from '@angular/core';
import { CNGX_BUTTON_STATE, CngxButtonGroup } from '@cngx/common/button';
import { cngxDevWarn } from '@cngx/utils';

import { CngxSplitCaret } from './split-caret.directive';
import { CNGX_SPLIT_CARET } from './split-caret.token';
import { CNGX_SPLIT_BUTTON, type CngxSplitButtonContext } from './split-button.token';

/**
 * A split button: a main `cngxButton` that runs the default action and a
 * `cngxIconMenuButton` caret that opens the alternatives, framed as one
 * button group. The group carries `role="group"` and needs a name
 * (`aria-label` or `aria-labelledby`, [`CNGX1072`](/error-codes/cngx1072.md)); `variant` and `size`
 * pass to both buttons.
 *
 * The caret derives its state from the main button: while the main action
 * is disabled, running its `cngxAsyncClick` or refused by
 * `[enabled]="false"`, the caret renders `aria-disabled`, opens on neither
 * click nor key, and an open menu closes. Its `aria-describedby` says why:
 * the main button's reason while the main is disabled with one, and "The
 * main action is running" (`menuButton.splitMainBusy`) while the main
 * action runs; the main button keeps `aria-busy` and the announcement.
 * Inside the split the caret renders the caret glyph and is named "More
 * options" from the active language pack (`CNGX_MENU_BUTTON_I18N`) unless it
 * has an `aria-label`.
 *
 * The caret's menu hangs under the whole group, not under the caret: the
 * split claims the explicit anchor slot of the caret's popover (the slot
 * `CngxPopoverAnchor` uses) and emits its `anchor-name`. A consumer
 * `[cngxPopoverAnchor]` on the same popover keeps precedence; the split
 * claims the slot only while it is free. Dismissal is unchanged: a
 * pointerdown on the main button still closes an open menu.
 *
 * Both roles are direct children (an `ng-container` in between is fine): the
 * caret is the `cngxIconMenuButton` (or any host on `CngxSplitCaret`), the
 * main action the first other cngx button (`cngxButton`, `cngxIconButton`,
 * `cngxActionButton` or a custom host on `CngxButtonBrain`). Without a main button the directive
 * warns [`CNGX1073`](/error-codes/cngx1073.md). Buttons deeper inside the split, for example in a
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
 * @relatedTo CngxIconMenuButton, CngxSplitCaret, CngxButton, CngxButtonGroup, CNGX_BUTTON_STATE, CngxAsyncClick, CNGX_MENU_BUTTON_I18N
 * <example-url>/#/common/menu-button/split-button/basic</example-url>
 * <example-url>/#/common/menu-button/split-button/busy-and-disabled</example-url>
 * @axis level molecule
 */
@Directive({
  selector: '[cngxSplitButton]',
  standalone: true,
  exportAs: 'cngxSplitButton',
  hostDirectives: [{ directive: CngxButtonGroup, inputs: ['variant', 'size'] }],
  providers: [{ provide: CNGX_SPLIT_BUTTON, useExisting: CngxSplitButton }],
  host: {
    class: 'cngx-split-button',
    '[style.anchor-name]': 'anchorName()',
  },
})
export class CngxSplitButton implements CngxSplitButtonContext {
  // Direct children only, for both roles: a button inside a projected panel
  // is neither the main action nor the caret.
  private readonly buttons = contentChildren(CNGX_BUTTON_STATE, { descendants: false });

  /** The button state of the caret: the direct child host of `CngxSplitCaret`. */
  readonly caret = contentChild(CNGX_SPLIT_CARET, { descendants: false });

  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;

  private readonly caretRole = contentChild(CngxSplitCaret, { descendants: false });

  private readonly menuPopover = computed(() => this.caretRole()?.popover() ?? null);

  /** `anchor-name` of the caret popover while the host holds its explicit anchor slot. */
  protected readonly anchorName = computed(() => {
    const pop = this.menuPopover();
    return pop?.explicitAnchorElement() === this.host ? `--cngx-pop-${pop.id()}` : null;
  });

  private readonly main = computed(() => this.buttons().find((button) => button !== this.caret()));

  /** `true` while the main button refuses activation; `false` without one. */
  readonly mainBlocked = computed(() => this.main()?.blocked() ?? false);

  /** `true` while the main button runs; `false` without one. */
  readonly mainBusy = computed(() => this.main()?.busy() ?? false);

  /** Id of the main button's reason while it is disabled with one, else `null`. */
  readonly mainReasonId = computed(() => this.main()?.activeReasonId() ?? null);

  constructor() {
    // Same shape as CngxPopoverAnchor, but yields to a consumer anchor that
    // already holds the slot.
    effect((onCleanup) => {
      const pop = this.menuPopover();
      if (!pop) {
        return;
      }
      untracked(() => {
        if (pop.explicitAnchorElement() === null) {
          pop.registerAnchorElement(this.host);
        }
      });
      onCleanup(() => pop.unregisterAnchorElement(this.host));
    });

    if (typeof ngDevMode !== 'undefined' && ngDevMode) {
      const host = this.host;
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
