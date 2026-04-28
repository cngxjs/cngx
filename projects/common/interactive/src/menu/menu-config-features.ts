import type { CngxMenuAriaLabels, CngxMenuConfigFeature } from './menu-config';

/**
 * Override one or more ARIA strings (English defaults). Unset keys keep
 * their default value, so consumers can supply only the locale strings
 * they care about.
 *
 * @category interactive
 */
export function withAriaLabels(partial: Partial<CngxMenuAriaLabels>): CngxMenuConfigFeature {
  return (cfg) => ({
    ...cfg,
    ariaLabels: { ...cfg.ariaLabels, ...partial },
  });
}

/**
 * Override the typeahead debounce window (milliseconds) for menu
 * navigation. Default: `300`.
 *
 * @category interactive
 */
export function withTypeaheadDebounce(ms: number): CngxMenuConfigFeature {
  return (cfg) => ({ ...cfg, typeaheadDebounce: ms });
}

/**
 * Override the delay between hovering a submenu parent and opening the
 * submenu (milliseconds). Default: `0` (open immediately on activation).
 * Reserved for hover-driven menubar implementations.
 *
 * @category interactive
 */
export function withSubmenuOpenDelay(ms: number): CngxMenuConfigFeature {
  return (cfg) => ({ ...cfg, submenuOpenDelay: ms });
}

/**
 * Override the delay between leaving a submenu parent and closing the
 * submenu (milliseconds). Default: `0`. Reserved for hover-driven
 * menubar implementations.
 *
 * @category interactive
 */
export function withSubmenuCloseDelay(ms: number): CngxMenuConfigFeature {
  return (cfg) => ({ ...cfg, submenuCloseDelay: ms });
}

/**
 * Whether activating a leaf item closes the menu. Default: `true`
 * (menu semantics — distinct from listbox/combobox which stay open).
 *
 * @category interactive
 */
export function withCloseOnSelect(close: boolean): CngxMenuConfigFeature {
  return (cfg) => ({ ...cfg, closeOnSelect: close });
}
