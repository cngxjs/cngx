import { defineMenuConfigFeature, type CngxMenuAriaLabels, type CngxMenuConfigFeature } from './menu-config';

/**
 * Override one or more ARIA strings (English defaults). Unset keys keep
 * their default value, so consumers can supply only the locale strings
 * they care about.
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
 */
export function withTypeaheadDebounce(ms: number): CngxMenuConfigFeature {
  return defineMenuConfigFeature((cfg) => ({ ...cfg, typeaheadDebounce: ms }));
}

/**
 * Override the delay between hovering a submenu parent and opening the
 * submenu (milliseconds). Default: `0` (open immediately on activation).
 * Reserved for hover-driven menubar implementations.
 */
export function withSubmenuOpenDelay(ms: number): CngxMenuConfigFeature {
  return defineMenuConfigFeature((cfg) => ({ ...cfg, submenuOpenDelay: ms }));
}

/**
 * Override the delay between leaving a submenu parent and closing the
 * submenu (milliseconds). Default: `0`. Reserved for hover-driven
 * menubar implementations.
 */
export function withSubmenuCloseDelay(ms: number): CngxMenuConfigFeature {
  return defineMenuConfigFeature((cfg) => ({ ...cfg, submenuCloseDelay: ms }));
}

/**
 * Whether activating a leaf item closes the menu. Default: `true`
 * (menu semantics — distinct from listbox/combobox which stay open).
 */
export function withCloseOnSelect(close: boolean): CngxMenuConfigFeature {
  return defineMenuConfigFeature((cfg) => ({ ...cfg, closeOnSelect: close }));
}
