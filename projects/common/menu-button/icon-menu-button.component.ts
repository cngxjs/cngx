import { NgComponentOutlet } from '@angular/common';
import {
  afterNextRender,
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  input,
  untracked,
  ViewEncapsulation,
} from '@angular/core';
import {
  CNGX_BUTTON_STATE,
  hasAccessibleName,
  injectButtonCore,
  provideButtonDescribedBy,
  type CngxButtonSize,
  type CngxButtonState,
  type CngxButtonTone,
  type CngxButtonType,
  type CngxButtonVariant,
} from '@cngx/common/button';
import { CngxIcon } from '@cngx/common/display';
import {
  CNGX_HOST_INTERACTION_STATE,
  CngxMenuTrigger,
  type CngxHostInteractionState,
} from '@cngx/common/interactive';
import { CngxPopoverTrigger } from '@cngx/common/popover';
import { cngxDevWarn } from '@cngx/utils';

import { CNGX_BUTTON_CARET_ICON } from './caret-icon.token';
import { injectMenuButtonI18n } from './i18n/menu-button-i18n';
import { injectLazyHostDirective } from './internal/inject-lazy-host-directive';
import { CNGX_SPLIT_BUTTON } from './split-button.token';

/**
 * A square, icon-only button that opens a menu: the kebab or "more" button
 * of a row, a toolbar or a card, and the caret half of a `cngxSplitButton`.
 * Same brain as `cngxIconButton` (variant, tone, size, group, disabled with a
 * reason, busy layer; `ghost` by default) and the same two bindings as
 * `cngxMenuButton`: `[menu]` is the `cngxMenu`, `[popover]` the
 * `cngxPopover` around it. Keyboard model, `aria-expanded`,
 * `aria-haspopup="menu"`, anchor and click toggle work as on
 * `cngxMenuButton`.
 *
 * Outside a split button the glyph is whatever you project (a kebab icon,
 * an ellipsis) and the name is yours: set `aria-label` (or
 * `aria-labelledby` / `title`); a host without one warns `CNGX1071` in
 * development mode.
 *
 * As the direct child of a `cngxSplitButton` it renders the caret (`CNGX_BUTTON_CARET_ICON`
 * swaps it) instead of the projected content, is named "More options" from
 * the active language pack unless it has an `aria-label`, and is blocked
 * while the main action is: `aria-disabled`, no click, no key, an open menu
 * closes. Its `disabledReason` only describes its own `[disabled]`.
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
 * @relatedTo CngxMenuButton, CngxSplitButton, CngxIconButton, CngxMenuTrigger, CNGX_MENU_BUTTON_I18N
 * <example-url>/#/common/menu-button/icon-menu-button/kebab</example-url>
 * <example-url>/#/common/menu-button/split-button/basic</example-url>
 * @axis level molecule
 */
@Component({
  // eslint-disable-next-line @angular-eslint/component-selector -- attribute selector by design (sits on the native button)
  selector: 'button[cngxIconMenuButton]',
  standalone: true,
  exportAs: 'cngxIconMenuButton',
  imports: [NgComponentOutlet, CngxIcon],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None,
  hostDirectives: [
    { directive: CngxMenuTrigger, inputs: ['cngxMenuTrigger: menu', 'popover'] },
    { directive: CngxPopoverTrigger, inputs: ['cngxPopoverTrigger: popover'] },
  ],
  providers: [
    {
      provide: CNGX_HOST_INTERACTION_STATE,
      useFactory: () => inject(CngxIconMenuButton).hostInteraction,
    },
    { provide: CNGX_BUTTON_STATE, useExisting: CngxIconMenuButton },
    provideButtonDescribedBy('CngxIconMenuButton'),
  ],
  host: {
    class: 'cngx-button cngx-icon-button cngx-icon-menu-button',
    '[attr.data-variant]': 'core.variant()',
    '[attr.data-tone]': 'core.tone()',
    '[attr.data-size]': 'core.size()',
    '[attr.data-busy]': 'core.busy() ? "true" : null',
    '[attr.data-expanded]': 'expanded() ? "true" : "false"',
    '[attr.aria-label]': 'resolvedAriaLabel()',
    '[attr.aria-disabled]': 'core.ariaDisabled()',
    '[attr.aria-describedby]': 'core.describedBy()',
    '[attr.type]': 'core.hostType()',
    '[attr.disabled]': 'null',
    '(click)': 'handleClick()',
  },
  template: `
    <span class="cngx-button__label cngx-icon-button__glyph" aria-hidden="true">
      @if (isSplitCaret()) {
        <cngx-icon class="cngx-menu-button__caret">
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
      } @else {
        <ng-content />
      }
    </span>
    @if (core.busy()) {
      <span class="cngx-button__busy" aria-hidden="true">
        <span class="cngx-button__spinner"></span>
      </span>
    }
    <span class="cngx-button__reason" [id]="core.reasonId" hidden>{{ reason() }}</span>
  `,
  styleUrls: [
    '../button/button.component.css',
    '../button/icon-button.component.css',
    './menu-button.component.css',
  ],
})
export class CngxIconMenuButton implements CngxButtonState {
  // Host directives are created before this component, and CngxMenuTrigger
  // injects the CNGX_HOST_INTERACTION_STATE this component provides.
  private readonly menuTrigger = injectLazyHostDirective(CngxMenuTrigger);
  private readonly popoverTrigger = injectLazyHostDirective(CngxPopoverTrigger);

  private readonly split = inject(CNGX_SPLIT_BUTTON, { optional: true });

  /** @internal - `true` when this button is the caret of a split (its direct child). */
  protected readonly isSplitCaret = computed(() => this.split?.caret() === this);
  private readonly i18n = injectMenuButtonI18n();

  /**
   * Emphasis, bound through the selector: `cngxIconMenuButton="outline"`.
   * The bare attribute falls through to the group, the config and `ghost`.
   */
  readonly variant = input<CngxButtonVariant | undefined, CngxButtonVariant | '' | undefined>(
    undefined,
    { alias: 'cngxIconMenuButton', transform: (v) => (v === '' ? undefined : v) },
  );

  /** Intent. Falls through to the config and `neutral`. */
  readonly tone = input<CngxButtonTone | undefined>(undefined);

  /** Visual size of the square box. Falls through to the group, the config and `md`. */
  readonly size = input<CngxButtonSize | undefined>(undefined);

  /**
   * Rendered as `aria-disabled`; the button stays focusable, opens the menu
   * on neither click nor key and closes it when it is open. As the caret of
   * a split button the main action's blocked state adds to it.
   */
  readonly disabled = input(false, { transform: booleanAttribute });

  /**
   * Why the button is disabled; referenced through `aria-describedby` while
   * its own `disabled` is set, never while only the split's main action
   * blocks it.
   */
  readonly disabledReason = input<string | undefined>(undefined);

  /**
   * Ids of external description elements, joined into the button's
   * `aria-describedby` after a static `aria-describedby` and before the
   * disabled reason.
   */
  readonly describedBy = input<string | null>(null, { alias: 'cngxDescribedBy' });

  /** Native `type`. Defaults to `'button'`. */
  readonly type = input<CngxButtonType | undefined>(undefined);

  /**
   * Accessible name. As the caret of a split button it defaults to the
   * `menuButton.splitToggle` copy of the active language pack.
   */
  readonly ariaLabel = input<string | undefined>(undefined, { alias: 'aria-label' });

  /** `true` while the menu is open. Mirrors the popover's visibility. */
  readonly expanded = computed(() => this.menuTrigger().isOpen());

  // Own `disabled`, or the main action of the split this is the caret of.
  private readonly refusing = computed(
    () => this.disabled() || (this.isSplitCaret() && (this.split?.mainBlocked() ?? false)),
  );

  /** @internal - the reason applies to the own `disabled` only. */
  protected readonly reason = computed(() => (this.disabled() ? this.disabledReason() : undefined));

  /** @internal */
  protected readonly resolvedAriaLabel = computed(
    () => this.ariaLabel() ?? (this.isSplitCaret() ? this.i18n().splitToggle : null),
  );

  /** @internal - one disabled truth for the click guard, `aria-disabled` and the trigger guard. */
  readonly hostInteraction: CngxHostInteractionState = { disabled: this.refusing };

  /** @internal - app-wide glyph from `CNGX_BUTTON_CARET_ICON`. */
  protected readonly customCaret = inject(CNGX_BUTTON_CARET_ICON, { optional: true });

  /** @internal */
  protected readonly core = injectButtonCore(
    {
      variant: this.variant,
      tone: this.tone,
      size: this.size,
      disabled: this.refusing,
      disabledReason: this.reason,
      describedBy: this.describedBy,
      type: this.type,
    },
    { variant: 'ghost' },
  );

  /**
   * `true` while the button refuses activation: its own `disabled`, the
   * split's blocked main action when it is the caret, or a co-hosted
   * `cngxAsyncClick` that runs or refuses.
   */
  readonly blocked = this.core.blocked;

  constructor() {
    // The popover is told it holds a menu, so the trigger's aria-haspopup
    // reads `menu` without a consumer [haspopup]; released on swap and destroy.
    effect((onCleanup) => {
      const pop = this.popoverTrigger().popoverRef();
      untracked(() => pop.setHaspopup('menu'));
      onCleanup(() => pop.setHaspopup(undefined));
    });

    if (typeof ngDevMode !== 'undefined' && ngDevMode) {
      const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
      afterNextRender(() => {
        if (this.isSplitCaret() || hasAccessibleName(host)) {
          return;
        }
        cngxDevWarn(
          'CNGX1071',
          '[cngxIconMenuButton] has no accessible name. Set aria-label, aria-labelledby or title on the host; the icon alone is silent to assistive technology.',
          host,
        );
      });
    }
  }

  /** The core's capture-phase guard swallows the click while the button is blocked. */
  protected handleClick(): void {
    this.popoverTrigger().popoverRef().toggle();
  }
}
