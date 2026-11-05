import { describe, expect, it } from 'vitest';

import * as api from './public-api';

describe('@cngx/common/button public API shape', () => {
  // Snapshot of the runtime (value) export list. A new or removed export is a
  // deliberate public-surface change; update this list in the same commit so a
  // leak of an internal helper or an accidental drop fails the guard.
  it('exports exactly the pinned value surface', () => {
    expect(Object.keys(api).sort()).toEqual([
      'CNGX_BUTTON_CONFIG',
      'CNGX_BUTTON_GROUP',
      'CNGX_BUTTON_HOST',
      'CNGX_BUTTON_HOST_STATE',
      'CNGX_BUTTON_SPINNER',
      'CNGX_BUTTON_STATE',
      'CNGX_CLOSE_ICON',
      'CngxButton',
      'CngxButtonBrain',
      'CngxButtonEnd',
      'CngxButtonGroup',
      'CngxButtonGroupAddon',
      'CngxButtonGroupSeparator',
      'CngxButtonStart',
      'CngxCloseButton',
      'CngxIconButton',
      'injectButtonConfig',
      'injectButtonSpinner',
      'injectCloseIcon',
      'provideButtonConfig',
      'provideButtonConfigAt',
      'provideButtonHost',
      'provideButtonSpinner',
      'provideCloseIcon',
      'withButtonSize',
      'withButtonTone',
      'withButtonVariant',
    ]);
  });

  it('keeps the internal button core helpers off the barrel', () => {
    const keys = Object.keys(api);
    for (const internal of ['injectButtonCore', 'provideButtonDescribedBy', 'hasAccessibleName']) {
      expect(keys).not.toContain(internal);
    }
  });
});
