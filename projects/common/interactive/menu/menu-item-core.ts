import { computed, ElementRef, inject, type Signal } from '@angular/core';

import { CngxActiveDescendant } from '@cngx/common/a11y';
import { nextUid } from '@cngx/core/utils';

import { CNGX_MENU_ANNOUNCER_FACTORY } from './menu-announcer';
import { injectMenuConfig } from './menu-config';

/**
 * Options for {@link injectMenuItemCore}.
 *
 * @category common/interactive/menu
 */
export interface CngxMenuItemCoreOptions<T = unknown> {
  /** The item's payload value, forwarded to `highlightByValue`. */
  readonly value: Signal<T | undefined>;
  /** Disabled state - gates click activation and pointer highlight. */
  readonly disabled: Signal<boolean>;
  /** Explicit label input; `label()` falls back to the host's text content. */
  readonly labelInput: Signal<string | undefined>;
  /**
   * Variant activation step, run between `highlightByValue` and
   * `activateCurrent` on the active-descendant path only (checkbox:
   * toggle `checked`; radio: select in the group; plain item: omitted).
   */
  readonly onActivate?: () => void;
}

/**
 * The shared interaction bundle {@link injectMenuItemCore} returns. Menu
 * item variants re-export `id`/`isHighlighted`/`label` (their
 * `CngxAdItemHandle` surface) and delegate their host listeners to the
 * handler pair.
 *
 * @category common/interactive/menu
 */
export interface CngxMenuItemCore {
  /** Stable unique item id used for `aria-activedescendant` targeting. */
  readonly id: string;
  /** `true` while the surrounding active-descendant highlights this item. */
  readonly isHighlighted: Signal<boolean>;
  /** Label accessor: explicit input wins over the host's trimmed text content. */
  label(): string;
  /** Bind to the host's `(click)` listener. */
  handleClick(): void;
  /** Bind to the host's `(pointerenter)` listener. */
  handlePointerEnter(): void;
}

/**
 * Shared interaction core of the three menu item variants
 * (`CngxMenuItem`, `CngxMenuItemCheckbox`, `CngxMenuItemRadio`) -
 * previously a tripled block. Owns the AD registration surface
 * (`id`, `isHighlighted`, `label`), the disabled-aware click handler with
 * the announcer's `itemDisabled` phrase, and the pointer-highlight
 * handler; only the activation step stays per-variant via `onActivate`.
 *
 * Call from a field initializer (injection context required - the core
 * injects `ElementRef`, the optional surrounding `CngxActiveDescendant`,
 * the announcer factory, and the menu config). Interaction contract,
 * preserved verbatim from the variants: a disabled click announces and
 * stops; without a surrounding active-descendant a click is a complete
 * no-op (no `onActivate` either); on the AD path the order is
 * `highlightByValue` -> `onActivate` -> `activateCurrent`.
 *
 * @category common/interactive/menu
 * @github https://github.com/cngxjs/cngx/blob/main/projects/common/interactive/menu/menu-item-core.ts
 * @since 0.1.0
 * @relatedTo CngxMenuItem, CngxMenuItemCheckbox, CngxMenuItemRadio, CngxMenu
 */
export function injectMenuItemCore<T = unknown>(
  options: CngxMenuItemCoreOptions<T>,
): CngxMenuItemCore {
  const elementRef = inject(ElementRef<HTMLElement>);
  const ad = inject(CngxActiveDescendant, { optional: true });
  const announcer = inject(CNGX_MENU_ANNOUNCER_FACTORY)();
  const menuConfig = injectMenuConfig();

  const id = nextUid('cngx-menu-item');

  return {
    id,
    isHighlighted: computed<boolean>(() => ad?.activeId() === id),
    label(): string {
      const explicit = options.labelInput();
      if (explicit) {
        return explicit;
      }
      const el = elementRef.nativeElement as HTMLElement;
      return (el.textContent ?? '').trim();
    },
    handleClick(): void {
      if (options.disabled()) {
        announcer.announce(menuConfig.ariaLabels.itemDisabled);
        return;
      }
      if (!ad) {
        return;
      }
      ad.highlightByValue(options.value());
      options.onActivate?.();
      ad.activateCurrent();
    },
    handlePointerEnter(): void {
      if (options.disabled()) {
        return;
      }
      ad?.highlightByValue(options.value());
    },
  };
}
