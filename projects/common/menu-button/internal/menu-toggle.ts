import { computed, type Signal } from '@angular/core';
import { CngxMenuTrigger } from '@cngx/common/interactive';
import { CngxPopoverTrigger } from '@cngx/common/popover';
import { injectLazySelf } from '@cngx/core/utils';

/**
 * What a menu button host binds: whether the menu is open and its click
 * toggle.
 *
 * @internal
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
 * The open / toggle glue shared by `cngxMenuButton` and
 * `cngxIconMenuButton`. Both triggers are host directives on the same
 * element and inject the `CNGX_HOST_INTERACTION_STATE` the button brain
 * provides, so they resolve on first read. Call it in an injection context.
 *
 * @internal
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
