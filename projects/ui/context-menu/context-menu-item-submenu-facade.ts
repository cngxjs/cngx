import type { CngxMenuSubmenuPopoverRef } from '@cngx/common/interactive';

import type { CngxContextMenu } from './context-menu.component';

/**
 * Build the popover-facade adapter the submenu brain (`CngxMenuItemSubmenu`)
 * drives instead of a `[cngxMenuItemSubmenu]` popover input. Every member
 * delegates to the target panel's own `CngxPopover`, reading `target()` lazily
 * so the facade stays valid across `[submenu]` changes and inert (no visible,
 * empty id) while the target is unbound. `show()` delegates to the supplied
 * `open` routing rather than `popover.show()`, so opening goes through the
 * trigger's focus stack (Pillar 1) instead of bypassing it.
 *
 * Internal decompose glue, not a consumer contract - NOT exported from
 * `public-api.ts`. Extracting it keeps `CngxContextMenuItem`'s class body a
 * thin shell (reference_atomic_decompose rule 1).
 *
 * @category ui/context-menu
 * @github https://github.com/cngxjs/cngx/blob/main/projects/ui/context-menu/context-menu-item-submenu-facade.ts
 * @since 0.1.0
 */
export function createContextMenuItemSubmenuFacade(
  target: () => CngxContextMenu<unknown> | undefined,
  open: () => void,
): CngxMenuSubmenuPopoverRef {
  return {
    isVisible: () => target()?.popover.isVisible() ?? false,
    show: () => open(),
    hide: () => target()?.popover.hide(),
    anchorElement: { set: (el) => target()?.popover.anchorElement.set(el) },
    id: () => target()?.popover.id() ?? '',
    elementRef: {
      get nativeElement(): HTMLElement {
        return target()!.popover.elementRef.nativeElement;
      },
    },
  };
}
