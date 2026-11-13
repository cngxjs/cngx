import { NgComponentOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, ViewEncapsulation } from '@angular/core';
import { CngxButtonBrain, provideButtonHost } from '@cngx/common/button';
import { CngxIcon, CngxIconSvg } from '@cngx/common/display';
import { CngxMenuTrigger } from '@cngx/common/interactive';
import { CngxPopoverTrigger } from '@cngx/common/popover';
import { CNGX_ICON_CHEVRON_DOWN } from '@cngx/utils';

import { injectButtonCaretIcon } from './caret-icon.token';
import { injectMenuToggle } from './internal/menu-toggle';
import { CngxSplitCaret } from './split-caret.directive';

/**
 * A square, icon-only button that opens a menu: the kebab or "more" button of a row, a toolbar or
 * a card, and the caret of a `cngxSplitButton`. It has the bindings and keyboard model of
 * `cngxMenuButton` on the `cngxIconButton` skin, `ghost` by default.
 *
 * Outside a split it renders the glyph you project, and the name is yours. Without
 * `aria-label`, `aria-labelledby` or `title` it warns [`CNGX1071`](/error-codes/cngx1071.md) in
 * development.
 *
 * As the direct child of a `cngxSplitButton` it is the caret: it renders the caret glyph in place
 * of the projected content, takes its name and its blocked state from the split, and needs
 * neither a glyph nor a label. `CngxSplitButton` describes that role.
 *
 * ```html
 * <button cngxIconMenuButton aria-label="Row actions" [menu]="menu" [popover]="pop">
 *   <svg aria-hidden="true" viewBox="0 0 24 24" fill="currentColor">
 *     <circle cx="12" cy="5" r="2" />
 *     <circle cx="12" cy="12" r="2" />
 *     <circle cx="12" cy="19" r="2" />
 *   </svg>
 * </button>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/menu-button/icon-menu-button.component.ts
 * @since 0.1.0
 * @relatedTo CngxMenuButton, CngxButtonBrain, CngxSplitButton, CngxSplitCaret, CngxIconButton, CngxMenuTrigger, CNGX_MENU_BUTTON_I18N, CNGX_BUTTON_CARET_ICON, CngxPopoverTrigger
 * <example-url>/#/common/menu-button/icon-menu-button/kebab</example-url>
 * <example-url>/#/common/menu-button/split-button/basic</example-url>
 * @axis level molecule
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- attribute selector by design (sits on the native button)
  selector: 'button[cngxIconMenuButton]',
  standalone: true,
  exportAs: 'cngxIconMenuButton',
  imports: [NgComponentOutlet, CngxIcon, CngxIconSvg],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [
    {
      directive: CngxButtonBrain,
      inputs: [
        'variant: cngxIconMenuButton',
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
    CngxSplitCaret,
  ],
  providers: [provideButtonHost('cngxIconMenuButton', { defaultVariant: 'ghost', iconOnly: true })],
  host: {
    class: 'cngx-button cngx-icon-button cngx-icon-menu-button',
    '[attr.data-expanded]': 'expanded() ? "true" : "false"',
    '(click)': 'toggle.handleClick()',
  },
  template: `
    <span class="cngx-button__label cngx-icon-button__glyph" aria-hidden="true">
      @if (caret.isCaret()) {
        <cngx-icon class="cngx-menu-button__caret">
          @if (customCaret) {
            <ng-container *ngComponentOutlet="customCaret" />
          } @else {
            <svg [cngxIconSvg]="caretIcon"></svg>
          }
        </cngx-icon>
      } @else {
        <ng-content />
      }
    </span>
    @if (caret.isCaret()) {
      <span class="cngx-sr-only">{{ caret.label() }}</span>
      <span [id]="caret.busyNoteId" hidden>{{ caret.busyNote() }}</span>
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
  styleUrls: [
    '../button/button.component.css',
    '../button/icon-button.component.css',
    './menu-button.component.css',
  ],
})
export class CngxIconMenuButton {
  /** @internal */
  protected readonly brain = inject(CngxButtonBrain);

  /** @internal - the caret role inside a `cngxSplitButton`. */
  protected readonly caret = inject(CngxSplitCaret);

  /**
   * @internal - refuses to open the menu while the button is blocked; an
   * open menu still closes on click.
   */
  protected readonly toggle = injectMenuToggle(this.brain.blocked);

  /** `true` while the menu is open. Mirrors the popover's visibility. */
  readonly expanded = this.toggle.expanded;

  /** @internal - app-wide glyph from `CNGX_BUTTON_CARET_ICON`. */
  protected readonly customCaret = injectButtonCaretIcon();

  /** @internal - default chevron from the shared icon set. */
  protected readonly caretIcon = CNGX_ICON_CHEVRON_DOWN;
}
