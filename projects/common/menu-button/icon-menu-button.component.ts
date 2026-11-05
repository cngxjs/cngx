import { NgComponentOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  ViewEncapsulation,
} from '@angular/core';
import {
  CNGX_BUTTON_HOST_STATE,
  CNGX_BUTTON_STATE,
  CngxButtonBrain,
  provideButtonHost,
  type CngxButtonHostState,
} from '@cngx/common/button';
import { CngxIcon, CngxIconSvg } from '@cngx/common/display';
import { CngxMenuTrigger } from '@cngx/common/interactive';
import { CngxPopoverTrigger } from '@cngx/common/popover';
import { injectDescribedByContribution, nextUid } from '@cngx/core/utils';
import { CNGX_ICON_CHEVRON_DOWN } from '@cngx/utils';

import { injectButtonCaretIcon } from './caret-icon.token';
import { injectMenuButtonI18n } from './i18n/menu-button-i18n';
import { injectMenuToggle } from './menu-toggle';
import { CNGX_SPLIT_BUTTON } from './split-button.token';
import { CNGX_SPLIT_CARET } from './split-caret.token';

/**
 * A square, icon-only button that opens a menu: the kebab or "more" button
 * of a row, a toolbar or a card, and the caret half of a `cngxSplitButton`.
 * Same brain as `cngxIconButton` (variant, tone, size, group, disabled with a
 * reason, busy layer; `ghost` by default) and the same two bindings as
 * `cngxMenuButton`: `[menu]` is the `cngxMenu`, `[popover]` the
 * `cngxPopover` around it. Keyboard model, `aria-expanded`,
 * `aria-haspopup="menu"`, anchor and click toggle work as on
 * `cngxMenuButton`: after open, focus moves into the menu, which carries
 * `aria-activedescendant`; Escape returns focus to the button, Tab closes
 * the menu.
 *
 * Outside a split button the glyph is whatever you project (a kebab icon,
 * an ellipsis) and the name is yours: set `aria-label` (or
 * `aria-labelledby` / `title`); a host without one warns `CNGX1071` in
 * development mode.
 *
 * As the direct child of a `cngxSplitButton` it renders the caret (the
 * shared chevron; `provideButtonCaretIcon` swaps it) instead of the projected content, is named by content: the
 * `menuButton.splitToggle` copy ("More options") of the active language pack
 * as visually hidden text, so a consumer `aria-label` still wins and the
 * button never writes one itself. It is blocked
 * while the main action is: `aria-disabled`, no click, no key, an open menu
 * closes. Its `aria-describedby` then references the main's reason (main
 * disabled with one) or a hidden "The main action is running" note
 * (`menuButton.splitMainBusy`, main action pending); its own
 * `disabledReason` only describes its own `[disabled]`.
 *
 * ```html
 * <button cngxIconMenuButton aria-label="Row actions" [menu]="menu" [popover]="pop">
 *   <cngx-icon name="more_vert" />
 * </button>
 * ```
 *
 * @wcag AA
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/menu-button/icon-menu-button.component.ts
 * @since 0.1.0
 * @relatedTo CngxMenuButton, CngxButtonBrain, CngxSplitButton, CngxIconButton, CngxMenuTrigger, CNGX_MENU_BUTTON_I18N
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
  ],
  providers: [
    provideButtonHost('cngxIconMenuButton', { defaultVariant: 'ghost', iconOnly: true }),
    {
      provide: CNGX_BUTTON_HOST_STATE,
      useFactory: (): CngxButtonHostState => inject(CngxIconMenuButton).hostState,
    },
    // Same instance as CNGX_BUTTON_STATE, so the split compares main and caret as states.
    { provide: CNGX_SPLIT_CARET, useExisting: CNGX_BUTTON_STATE },
  ],
  host: {
    class: 'cngx-button cngx-icon-button cngx-icon-menu-button',
    '[attr.data-expanded]': 'expanded() ? "true" : "false"',
    '(click)': 'toggle.handleClick()',
  },
  template: `
    <span class="cngx-button__label cngx-icon-button__glyph" aria-hidden="true">
      @if (isSplitCaret()) {
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
    @if (isSplitCaret()) {
      <span class="cngx-sr-only">{{ i18n().splitToggle }}</span>
      <span [id]="mainBusyId" hidden>{{ i18n().splitMainBusy }}</span>
    }
    @if (brain.busyVisible()) {
      <span class="cngx-button__busy" aria-hidden="true">
        <span class="cngx-button__spinner"></span>
      </span>
    }
    <span class="cngx-button__reason" [id]="brain.reasonId" hidden>{{ reason() }}</span>
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

  private readonly split = inject(CNGX_SPLIT_BUTTON, { optional: true });
  /** @internal */
  protected readonly i18n = injectMenuButtonI18n();

  /** @internal - `true` when this button is the caret of a split (its direct child). */
  protected readonly isSplitCaret = computed(() => this.split?.caret() === this.brain);

  /**
   * @internal - refuses to open the menu while the button is blocked; an
   * open menu still closes on click.
   */
  protected readonly toggle = injectMenuToggle(this.brain.blocked);

  /** `true` while the menu is open. Mirrors the popover's visibility. */
  readonly expanded = this.toggle.expanded;

  /**
   * @internal - the caret of a split refuses while the main action is
   * blocked; the brain folds it in without referencing the own reason.
   */
  readonly hostState: CngxButtonHostState = {
    refusing: computed(() => this.isSplitCaret() && (this.split?.mainBlocked() ?? false)),
  };

  /** @internal - id of the caret's busy note, referenced while the main action runs. */
  protected readonly mainBusyId = nextUid('cngx-split-caret-busy-');

  // The cause of a refusal that comes from the main: its reason, or the busy
  // note while it runs.
  private readonly mainDescriptionIds = computed(() => {
    if (!this.isSplitCaret() || !this.split) {
      return null;
    }
    const ids = [this.split.mainReasonId(), this.split.mainBusy() ? this.mainBusyId : null];
    return ids.filter(Boolean).join(' ') || null;
  });

  /** @internal - the reason renders for the own `disabled` only. */
  protected readonly reason = computed(() =>
    this.brain.disabled() ? this.brain.disabledReason() : undefined,
  );

  /** @internal - app-wide glyph from `CNGX_BUTTON_CARET_ICON`. */
  protected readonly customCaret = injectButtonCaretIcon();

  /** @internal - default chevron from the shared icon set. */
  protected readonly caretIcon = CNGX_ICON_CHEVRON_DOWN;

  constructor() {
    injectDescribedByContribution(this.mainBusyId, this.mainDescriptionIds);
  }
}
