import { computed, type Signal } from '@angular/core';
import { CngxMenuTrigger } from '@cngx/common/interactive';
import { CngxPopoverTrigger } from '@cngx/common/popover';
import { injectLazySelf } from '@cngx/core/utils';

/**
 * What a menu button host binds: whether the menu is open and its click
 * toggle.
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/menu-button/menu-toggle.ts
 * @since 0.1.0
 * @relatedTo injectMenuToggle
 */
export interface CngxMenuToggle {
  /** `true` while the menu is open. Mirrors the popover's visibility. */
  readonly expanded: Signal<boolean>;
  /**
   * Toggles the popover, but refuses to open it while `blocked`; an open
   * menu still closes, so a run that started with the opening click never
   * leaves a menu that cannot be clicked shut.
   */
  readonly handleClick: () => void;
}

/**
 * The open / toggle glue of a menu button host: `cngxMenuButton`,
 * `cngxIconMenuButton`, or a custom host on `CngxButtonBrain` that declares
 * `CngxMenuTrigger` and `CngxPopoverTrigger` in its `hostDirectives`. Bind
 * `handleClick` to the host's `(click)` and pass the brain's `blocked`, so
 * a refusing button never opens its menu while an open one still closes.
 *
 * Both triggers inject the `CNGX_HOST_INTERACTION_STATE` the brain
 * provides, so they resolve on first read. Call it in an injection context.
 *
 * ```ts
 * @Component({
 *   selector: 'button[appMenuButton]',
 *   hostDirectives: [
 *     { directive: CngxButtonBrain, inputs: ['variant: appMenuButton', 'disabled'] },
 *     { directive: CngxMenuTrigger, inputs: ['cngxMenuTrigger: menu', 'popover'] },
 *     { directive: CngxPopoverTrigger, inputs: ['cngxPopoverTrigger: popover'] },
 *   ],
 *   providers: [provideButtonHost('appMenuButton', { defaultVariant: 'outline' })],
 *   host: { '(click)': 'toggle.handleClick()' },
 *   template: '<ng-content />',
 * })
 * class AppMenuButton {
 *   protected readonly toggle = injectMenuToggle(inject(CngxButtonBrain).blocked);
 * }
 * ```
 *
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/menu-button/menu-toggle.ts
 * @since 0.1.0
 * @relatedTo CngxMenuButton, CngxIconMenuButton, CngxSplitCaret, CngxMenuTrigger, CngxPopoverTrigger
 * <example-url>/#/common/menu-button/split-button/custom-caret-host</example-url>
 */
export function injectMenuToggle(blocked: Signal<boolean>): CngxMenuToggle {
  const menuTrigger = injectLazySelf(CngxMenuTrigger);
  const popoverTrigger = injectLazySelf(CngxPopoverTrigger);
  const expanded = computed(() => menuTrigger().isOpen());
  return {
    expanded,
    handleClick: () => {
      if (blocked() && !expanded()) {
        return;
      }
      popoverTrigger().popoverRef().toggle();
    },
  };
}
