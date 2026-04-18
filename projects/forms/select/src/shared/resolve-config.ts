import { inject } from '@angular/core';

import {
  CNGX_SELECT_CONFIG,
  CNGX_SELECT_DEFAULTS,
  type CngxSelectConfig,
} from './config';

/**
 * Resolve the effective {@link CngxSelectConfig} for the current injector,
 * merging user-provided values with the library defaults. Always returns a
 * fully populated object.
 *
 * @internal
 */
export function resolveSelectConfig(): Required<
  Omit<CngxSelectConfig, 'panelClass' | 'templates' | 'announcer'>
> & Pick<typeof CNGX_SELECT_DEFAULTS, 'panelClass' | 'templates' | 'announcer'> {
  const user = inject(CNGX_SELECT_CONFIG, { optional: true }) ?? {};
  return {
    panelWidth: user.panelWidth ?? CNGX_SELECT_DEFAULTS.panelWidth,
    loadingVariant: user.loadingVariant ?? CNGX_SELECT_DEFAULTS.loadingVariant,
    skeletonRowCount: user.skeletonRowCount ?? CNGX_SELECT_DEFAULTS.skeletonRowCount,
    refreshingVariant: user.refreshingVariant ?? CNGX_SELECT_DEFAULTS.refreshingVariant,
    commitErrorDisplay: user.commitErrorDisplay ?? CNGX_SELECT_DEFAULTS.commitErrorDisplay,
    panelClass: user.panelClass ?? CNGX_SELECT_DEFAULTS.panelClass,
    typeaheadDebounceInterval:
      user.typeaheadDebounceInterval ?? CNGX_SELECT_DEFAULTS.typeaheadDebounceInterval,
    typeaheadWhileClosed:
      user.typeaheadWhileClosed ?? CNGX_SELECT_DEFAULTS.typeaheadWhileClosed,
    showSelectionIndicator:
      user.showSelectionIndicator ?? CNGX_SELECT_DEFAULTS.showSelectionIndicator,
    showCaret: user.showCaret ?? CNGX_SELECT_DEFAULTS.showCaret,
    restoreFocus: user.restoreFocus ?? CNGX_SELECT_DEFAULTS.restoreFocus,
    dismissOn: user.dismissOn ?? CNGX_SELECT_DEFAULTS.dismissOn,
    openOn: user.openOn ?? CNGX_SELECT_DEFAULTS.openOn,
    announcer: {
      ...CNGX_SELECT_DEFAULTS.announcer,
      ...user.announcer,
      format: user.announcer?.format ?? CNGX_SELECT_DEFAULTS.announcer.format,
    },
    templates: {
      ...CNGX_SELECT_DEFAULTS.templates,
      ...user.templates,
    },
  };
}
