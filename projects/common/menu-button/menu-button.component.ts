import { NgComponentOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  inject,
  input,
  ViewEncapsulation,
} from '@angular/core';
import {
  CNGX_BUTTON_STATE,
  CngxButtonEnd,
  CngxButtonStart,
  injectButtonCore,
  provideButtonDescribedBy,
  type CngxButtonSize,
  type CngxButtonState,
  type CngxButtonTone,
  type CngxButtonType,
  type CngxButtonVariant,
} from '@cngx/common/button';
import { CngxIcon } from '@cngx/common/display';
import { CNGX_HOST_INTERACTION_STATE, CngxMenuTrigger } from '@cngx/common/interactive';
import { CngxPopoverTrigger } from '@cngx/common/popover';

import { CNGX_BUTTON_CARET_ICON } from './caret-icon.token';
import { injectLazyHostDirective } from './internal/inject-lazy-host-directive';

/**
 * A button that opens a menu: the WAI-ARIA APG Menu Button Pattern as its
 * own button type. Sits on the native `<button>` and renders on the shared
 * button core, so variant, tone, size, group, disabled and busy behave
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
 * @relatedTo CngxButton, CngxMenuTrigger, CngxPopoverTrigger, CngxMenu, CNGX_BUTTON_CARET_ICON
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
    { directive: CngxMenuTrigger, inputs: ['cngxMenuTrigger: menu', 'popover'] },
    { directive: CngxPopoverTrigger, inputs: ['cngxPopoverTrigger: popover'] },
  ],
  providers: [
    { provide: CNGX_HOST_INTERACTION_STATE, useExisting: CngxMenuButton },
    { provide: CNGX_BUTTON_STATE, useExisting: CngxMenuButton },
    provideButtonDescribedBy('CngxMenuButton'),
  ],
  host: {
    class: 'cngx-button cngx-menu-button',
    '[attr.data-variant]': 'core.variant()',
    '[attr.data-tone]': 'core.tone()',
    '[attr.data-size]': 'core.size()',
    '[attr.data-busy]': 'core.busyVisible() ? "true" : null',
    '[attr.data-pending]': 'core.busy() ? "true" : null',
    '[attr.data-start]': 'startSlot() ? "" : null',
    // The end is never empty: a projected cngxButtonEnd or the caret.
    'data-end': '',
    '[attr.data-expanded]': 'expanded() ? "true" : "false"',
    '[attr.aria-disabled]': 'core.ariaDisabled()',
    '[attr.aria-describedby]': 'core.describedBy()',
    '[attr.type]': 'core.hostType()',
    '[attr.disabled]': 'null',
    '(click)': 'handleClick()',
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
    @if (core.busyVisible()) {
      <span class="cngx-button__busy" aria-hidden="true">
        <span class="cngx-button__spinner"></span>
      </span>
    }
    <span class="cngx-button__reason" [id]="core.reasonId" hidden>{{ disabledReason() }}</span>
  `,
  styleUrls: ['../button/button.component.css', './menu-button.component.css'],
})
export class CngxMenuButton implements CngxButtonState {
  // Host directives are created before this component, and CngxMenuTrigger
  // injects the CNGX_HOST_INTERACTION_STATE this component provides; an eager
  // inject of either trigger here would be a cycle, so both resolve on first read.
  private readonly menuTrigger = injectLazyHostDirective(CngxMenuTrigger);
  private readonly popoverTrigger = injectLazyHostDirective(CngxPopoverTrigger);

  /**
   * Emphasis, bound through the selector: `cngxMenuButton="outline"`. The
   * bare attribute falls through to the group, the config and `solid`.
   */
  readonly variant = input<CngxButtonVariant | undefined, CngxButtonVariant | '' | undefined>(
    undefined,
    { alias: 'cngxMenuButton', transform: (v) => (v === '' ? undefined : v) },
  );

  /** Intent. Falls through to the config and `neutral`. */
  readonly tone = input<CngxButtonTone | undefined>(undefined);

  /** Size. `md` matches the form-control row. Falls through to the group, the config and `md`. */
  readonly size = input<CngxButtonSize | undefined>(undefined);

  /**
   * Rendered as `aria-disabled`; the button stays focusable, opens the menu
   * on neither click nor key and closes it when it is open. Published to the
   * co-hosted `CngxMenuTrigger` through `CNGX_HOST_INTERACTION_STATE`, so the
   * click guard, `aria-disabled` and the keyboard guard read one signal.
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  /** Why the button is disabled; referenced through `aria-describedby` while disabled. */
  readonly disabledReason = input<string | undefined>(undefined);

  /**
   * Ids of external description elements, joined into the button's
   * `aria-describedby` after a static `aria-describedby` and before the
   * disabled reason.
   */
  readonly describedBy = input<string | null>(null, { alias: 'cngxDescribedBy' });

  /** Native `type`. Defaults to `'button'`. */
  readonly type = input<CngxButtonType | undefined>(undefined);

  /** `true` while the menu is open. Mirrors the popover's visibility. */
  readonly expanded = computed(() => this.menuTrigger().isOpen());

  protected readonly startSlot = contentChild(CngxButtonStart);
  protected readonly endSlot = contentChild(CngxButtonEnd);

  /** @internal - app-wide glyph from `CNGX_BUTTON_CARET_ICON`. */
  protected readonly customCaret = inject(CNGX_BUTTON_CARET_ICON, { optional: true });

  /** @internal */
  protected readonly core = injectButtonCore(
    {
      variant: this.variant,
      tone: this.tone,
      size: this.size,
      disabled: this.disabled,
      disabledReason: this.disabledReason,
      describedBy: this.describedBy,
      type: this.type,
    },
    { variant: 'solid' },
  );

  /**
   * `true` while the button refuses activation: disabled, running a
   * co-hosted `cngxAsyncClick`, or refused by its `[enabled]="false"`.
   */
  readonly blocked = this.core.blocked;

  /**
   * Refuses to open the menu while the button is blocked (disabled, a
   * pending co-hosted `cngxAsyncClick`, or its `[enabled]="false"`); an
   * open menu still closes on click, so a run that started with the opening
   * click never leaves a menu that cannot be clicked shut. The core's
   * capture guard handles only `disabled`, so consumer `(click)` handlers
   * still run.
   */
  protected handleClick(): void {
    if (this.core.blocked() && !this.expanded()) {
      return;
    }
    this.popoverTrigger().popoverRef().toggle();
  }
}
