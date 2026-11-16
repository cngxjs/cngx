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
   * Toggles the popover. A blocked trigger neither opens nor closes on click;
   * an open menu closes by Escape, Tab, an outside press or an item
   * activation.
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
      // Unreachable behind the brain's capture guard; kept as the host
      // contract, so a custom host never relies on listener order.
      if (blocked()) {
        return;
      }
      popoverTrigger().popoverRef().toggle();
    },
  };
}
