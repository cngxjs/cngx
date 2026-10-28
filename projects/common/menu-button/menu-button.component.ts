import { NgComponentOutlet } from '@angular/common';
import {
  booleanAttribute,
  ChangeDetectionStrategy,
  Component,
  computed,
  contentChild,
  effect,
  inject,
  Injector,
  input,
  untracked,
  ViewEncapsulation,
} from '@angular/core';
import {
  CngxButtonEnd,
  CngxButtonStart,
  injectButtonCore,
  provideButtonDescribedBy,
  type CngxButtonSize,
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

import { CNGX_BUTTON_CARET_ICON } from './caret-icon.token';

/**
 * A button that opens a menu: the WAI-ARIA APG Menu Button Pattern as its
 * own button type. Sits on the native `<button>` and renders on the shared
 * button core, so variant, tone, size, group, disabled and busy behave
 * exactly as on `cngxButton`.
 *
 * Two bindings wire it: `[menu]` is the `cngxMenu` it drives and
 * `[popover]` the `cngxPopover` that wraps the menu. The button composes
 * `CngxMenuTrigger` (keyboard model, `aria-expanded`, focus kept on the
 * button, dismissal) and `CngxPopoverTrigger` (anchor, `aria-controls`) as
 * host directives, tells the popover it holds a menu so `aria-haspopup`
 * reads `menu` (a sheet or fullscreen presentation reads `dialog`), and
 * toggles the popover on click. ArrowDown, Enter or Space opens the menu
 * and highlights the first item, ArrowUp the last; Escape closes it and
 * focus stays on the button.
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
    {
      provide: CNGX_HOST_INTERACTION_STATE,
      useFactory: (): CngxHostInteractionState => inject(CngxMenuButton).hostInteraction,
    },
    provideButtonDescribedBy('CngxMenuButton'),
  ],
  host: {
    class: 'cngx-button cngx-menu-button',
    '[attr.data-variant]': 'core.variant()',
    '[attr.data-tone]': 'core.tone()',
    '[attr.data-size]': 'core.size()',
    '[attr.data-busy]': 'core.busy() ? "true" : null',
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
    @if (core.busy()) {
      <span class="cngx-button__busy" aria-hidden="true">
        <span class="cngx-button__spinner"></span>
      </span>
    }
    <span class="cngx-button__reason" [id]="core.reasonId" hidden>{{ disabledReason() }}</span>
  `,
  styleUrls: ['../button/button.component.css', './menu-button.component.css'],
})
export class CngxMenuButton {
  // Host directives are created before this component, and CngxMenuTrigger
  // injects the CNGX_HOST_INTERACTION_STATE this component provides; an eager
  // inject of either trigger here would be a cycle, so both resolve on first read.
  private readonly injector = inject(Injector);
  private menuTriggerRef: CngxMenuTrigger | undefined;
  private popoverTriggerRef: CngxPopoverTrigger | undefined;
  private get menuTrigger(): CngxMenuTrigger {
    return (this.menuTriggerRef ??= this.injector.get(CngxMenuTrigger, undefined, { self: true }));
  }
  private get popoverTrigger(): CngxPopoverTrigger {
    return (this.popoverTriggerRef ??= this.injector.get(CngxPopoverTrigger, undefined, {
      self: true,
    }));
  }

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
   * on neither click nor key and closes it when it is open.
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
  readonly expanded = computed(() => this.menuTrigger.isOpen());

  protected readonly startSlot = contentChild(CngxButtonStart);
  protected readonly endSlot = contentChild(CngxButtonEnd);

  /** @internal - app-wide glyph from `CNGX_BUTTON_CARET_ICON`. */
  protected readonly customCaret = inject(CNGX_BUTTON_CARET_ICON, { optional: true });

  /**
   * @internal - read by the co-hosted `CngxMenuTrigger` (keyboard guard,
   * close on block) and a co-hosted `CngxAsyncClick`: the same `disabled`
   * the core renders as `aria-disabled` and guards clicks with.
   */
  readonly hostInteraction: CngxHostInteractionState = { disabled: this.disabled };

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

  constructor() {
    // The popover is told it holds a menu, so the trigger's aria-haspopup
    // reads `menu` without a consumer [haspopup]; released on swap and destroy.
    effect((onCleanup) => {
      const pop = this.popoverTrigger.popoverRef();
      untracked(() => pop.setHaspopup('menu'));
      onCleanup(() => pop.setHaspopup(undefined));
    });
  }

  /** The core's capture-phase guard swallows the click while the button is blocked. */
  protected handleClick(): void {
    this.popoverTrigger.popoverRef().toggle();
  }
}
