import { defineMenuConfigFeature, type CngxMenuAriaLabels, type CngxMenuConfigFeature } from './menu-config';

/**
 * Override one or more ARIA strings (English defaults). Unset keys keep
 * their default value, so consumers can supply only the locale strings
 * they care about.
 *
 * @category common/interactive/menu
 */
export function withAriaLabels(partial: Partial<CngxMenuAriaLabels>): CngxMenuConfigFeature {
  return defineMenuConfigFeature((cfg) => ({
    ...cfg,
    ariaLabels: { ...cfg.ariaLabels, ...partial },
  }));
}

/**
 * Override the typeahead debounce window (milliseconds) for menu
 * navigation. Default: `300`.
 *
 * @category common/interactive/menu
 */
export function withTypeaheadDebounce(ms: number): CngxMenuConfigFeature {
  return defineMenuConfigFeature((cfg) => ({ ...cfg, typeaheadDebounce: ms }));
}

/**
 * Override the delay between hovering a submenu parent and opening the
 * submenu (milliseconds). Default: `0` (open immediately on activation).
 * Reserved for hover-driven menubar implementations.
 *
 * @category common/interactive/menu
 */
export function withSubmenuOpenDelay(ms: number): CngxMenuConfigFeature {
  return defineMenuConfigFeature((cfg) => ({ ...cfg, submenuOpenDelay: ms }));
}

/**
 * Override the delay between leaving a submenu parent and closing the
 * submenu (milliseconds). Default: `0`. Reserved for hover-driven
 * menubar implementations.
 *
 * @category common/interactive/menu
 */
export function withSubmenuCloseDelay(ms: number): CngxMenuConfigFeature {
  return defineMenuConfigFeature((cfg) => ({ ...cfg, submenuCloseDelay: ms }));
}

/**
 * Whether activating a leaf item closes the menu. Default: `true`
 * (menu semantics — distinct from listbox/combobox which stay open).
 *
 * @category common/interactive/menu
 */
export function withCloseOnSelect(close: boolean): CngxMenuConfigFeature {
  return defineMenuConfigFeature((cfg) => ({ ...cfg, closeOnSelect: close }));
}

/**
 * Whether `pointerdown` outside the menu's popover and the trigger host
 * dismisses the menu. Default: `true`. Pass `false` for ESC-only
 * semantics (e.g. a tutorial overlay that wants to keep the menu open
 * while the user clicks through other UI).
 *
 * @category common/interactive/menu
 */
export function withDismissOnOutsideClick(dismiss: boolean): CngxMenuConfigFeature {
  return defineMenuConfigFeature((cfg) => ({ ...cfg, dismissOnOutsideClick: dismiss }));
}

/**
 * Whether window `scroll` while the menu is open dismisses it. Default:
 * `false`. Opt in when the menu should follow native context-menu
 * behaviour and close as soon as the page scrolls. Scroll-dismiss
 * listens to `window` only - the nearest scrollable ancestor is not
 * traversed.
 *
 * @category common/interactive/menu
 */
export function withDismissOnScroll(dismiss: boolean): CngxMenuConfigFeature {
  return defineMenuConfigFeature((cfg) => ({ ...cfg, dismissOnScroll: dismiss }));
}

/**
 * Whether the "context lost" bundle dismisses the menu. The bundle
 * covers BOTH window `blur` (system notification, OS-native menu
 * overlaying, tab switch) AND document `pointercancel` outside the
 * popover and trigger host (palm rejection on touch, gesture cancelled
 * by the browser). The two sources share one toggle because consumers
 * who want one rarely want the other off; consumers needing one
 * without the other replace the entire handler via
 * {@link CNGX_MENU_DISMISS_HANDLER_FACTORY}. Set to `false` to keep
 * both listeners off; `lastDismissSource` will then never report
 * `'blur'` or `'pointer-cancel'`.
 *
 * Default: `true`.
 *
 * @category common/interactive/menu
 */
export function withDismissOnBlur(dismiss: boolean): CngxMenuConfigFeature {
  return defineMenuConfigFeature((cfg) => ({ ...cfg, dismissOnBlur: dismiss }));
}
