import { computed, type Signal } from '@angular/core';
import { CngxMenuTrigger } from '@cngx/common/interactive';
import { CngxPopoverTrigger } from '@cngx/common/popover';
import { injectLazySelf } from '@cngx/core/utils';

/**
 * Open state and click toggle of a menu button host.
 *
 * @internal
 */
export interface CngxMenuToggle {
  /** `true` while the menu is open. */
  readonly expanded: Signal<boolean>;
  /**
   * Toggles the popover. Refuses to open while `blocked`, but an open menu
   * still closes, so a run started by the opening click never leaves a menu
   * that cannot be clicked shut.
   */
  readonly handleClick: () => void;
}

/**
 * Open/toggle glue shared by `cngxMenuButton` and `cngxIconMenuButton`.
 * Both triggers are host directives on the same element, read lazily.
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
