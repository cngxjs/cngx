import { inject } from '@angular/core';

import {
  CNGX_SELECT_CONFIG,
  CNGX_SELECT_DEFAULTS,
  type CngxSelectConfig,
} from '../config';
import { type CngxResolvedSelectLabels, resolveSelectLabels } from './resolve-labels';

const NO_CONFIG: CngxSelectConfig = {};

/**
 * The nearest `CNGX_SELECT_CONFIG` as provided, or an empty config. The one
 * lookup every select-config reader starts from. Injection context required.
 *
 * @internal
 */
export function injectSelectConfigSource(): CngxSelectConfig {
  return inject(CNGX_SELECT_CONFIG, { optional: true }) ?? NO_CONFIG;
}

/**
 * The one coercion for a chip cap, shared by the config path and the
 * per-instance `[maxVisibleChips]` input: a finite number is floored and
 * clamped to at least 1; `undefined` or a non-finite value falls back to
 * the library default.
 *
 * @internal
 */
export function coerceMaxVisibleChips(count: number | undefined): number {
  if (count === undefined || !Number.isFinite(count)) {
    return CNGX_SELECT_DEFAULTS.maxVisibleChips;
  }
  return Math.max(1, Math.floor(count));
}

/**
 * Effective {@link CngxSelectConfig} for the current injector, merged
 * with library defaults. Always fully populated. The copy keys
 * (`ariaLabels`, `fallbackLabels`, `announcer`) are `Signal`s, read lazily
 * so a runtime language switch reaches every select.
 *
 * @internal
 */
export function resolveSelectConfig(): Required<
  Omit<
    CngxSelectConfig,
    'panelClass' | 'templates' | 'announcer' | 'ariaLabels' | 'fallbackLabels'
  >
> &
  Pick<typeof CNGX_SELECT_DEFAULTS, 'panelClass' | 'templates'> &
  CngxResolvedSelectLabels {
  const user = injectSelectConfigSource();
  return {
    ...resolveSelectLabels(user),
    // `null` means natural width, so only an unset key takes the default.
    panelWidth:
      user.panelWidth === undefined ? CNGX_SELECT_DEFAULTS.panelWidth : user.panelWidth,
    loadingVariant: user.loadingVariant ?? CNGX_SELECT_DEFAULTS.loadingVariant,
    skeletonRowCount: user.skeletonRowCount ?? CNGX_SELECT_DEFAULTS.skeletonRowCount,
    refreshingVariant: user.refreshingVariant ?? CNGX_SELECT_DEFAULTS.refreshingVariant,
    commitErrorDisplay: user.commitErrorDisplay ?? CNGX_SELECT_DEFAULTS.commitErrorDisplay,
    commitErrorAnnouncePolicy:
      user.commitErrorAnnouncePolicy ?? CNGX_SELECT_DEFAULTS.commitErrorAnnouncePolicy,
    popoverPlacement: user.popoverPlacement ?? CNGX_SELECT_DEFAULTS.popoverPlacement,
    inputMode: user.inputMode ?? CNGX_SELECT_DEFAULTS.inputMode,
    enterKeyHint:
      user.enterKeyHint === undefined
        ? CNGX_SELECT_DEFAULTS.enterKeyHint
        : user.enterKeyHint,
    chipOverflow: user.chipOverflow ?? CNGX_SELECT_DEFAULTS.chipOverflow,
    maxVisibleChips: coerceMaxVisibleChips(user.maxVisibleChips),
    virtualization:
      user.virtualization === undefined
        ? CNGX_SELECT_DEFAULTS.virtualization
        : user.virtualization,
    panelClass: user.panelClass ?? CNGX_SELECT_DEFAULTS.panelClass,
    typeaheadDebounceInterval:
      user.typeaheadDebounceInterval ?? CNGX_SELECT_DEFAULTS.typeaheadDebounceInterval,
    typeaheadWhileClosed:
      user.typeaheadWhileClosed ?? CNGX_SELECT_DEFAULTS.typeaheadWhileClosed,
    searchMatchFn: user.searchMatchFn ?? CNGX_SELECT_DEFAULTS.searchMatchFn,
    showSelectionIndicator:
      user.showSelectionIndicator ?? CNGX_SELECT_DEFAULTS.showSelectionIndicator,
    selectionIndicatorPosition:
      user.selectionIndicatorPosition ?? CNGX_SELECT_DEFAULTS.selectionIndicatorPosition,
    selectionIndicatorVariant:
      user.selectionIndicatorVariant ?? CNGX_SELECT_DEFAULTS.selectionIndicatorVariant,
    showCaret: user.showCaret ?? CNGX_SELECT_DEFAULTS.showCaret,
    restoreFocus: user.restoreFocus ?? CNGX_SELECT_DEFAULTS.restoreFocus,
    dismissOn: user.dismissOn ?? CNGX_SELECT_DEFAULTS.dismissOn,
    openOn: user.openOn ?? CNGX_SELECT_DEFAULTS.openOn,
    mobileSheet: user.mobileSheet ?? CNGX_SELECT_DEFAULTS.mobileSheet,
    templates: {
      ...CNGX_SELECT_DEFAULTS.templates,
      ...user.templates,
    },
  };
}
