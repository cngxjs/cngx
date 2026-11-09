import { describe, expect, it } from 'vitest';

import * as api from './public-api';

// Type-level half of the guard: the core types behind CngxButtonBrain were
// public before the brain and stay internal now. A re-export makes the
// directive unused and fails the build.
// @ts-expect-error CngxButtonCore is internal to the brain
export type RemovedButtonCore = import('./public-api').CngxButtonCore;
// @ts-expect-error CngxButtonCoreDefaults is internal to the brain
export type RemovedButtonCoreDefaults = import('./public-api').CngxButtonCoreDefaults;
// @ts-expect-error CngxButtonCoreInputs is internal to the brain
export type RemovedButtonCoreInputs = import('./public-api').CngxButtonCoreInputs;

describe('@cngx/common/button public API shape', () => {
  // Snapshot of the runtime (value) export list. A new or removed export is a
  // deliberate public-surface change; update this list in the same commit so a
  // leak of an internal helper or an accidental drop fails the guard.
  it('exports exactly the pinned value surface', () => {
    expect(Object.keys(api).sort()).toEqual([
      'CNGX_BUTTON_CLOSE_ICON',
      'CNGX_BUTTON_CONFIG',
      'CNGX_BUTTON_GROUP',
      'CNGX_BUTTON_HOST',
      'CNGX_BUTTON_HOST_STATE',
      'CNGX_BUTTON_SPINNER',
      'CNGX_BUTTON_STATE',
      'CngxButton',
      'CngxButtonBrain',
      'CngxButtonEnd',
      'CngxButtonGroup',
      'CngxButtonGroupAddon',
      'CngxButtonGroupSeparator',
      'CngxButtonStart',
      'CngxCloseButton',
      'CngxIconButton',
      'injectButtonCloseIcon',
      'injectButtonConfig',
      'injectButtonSpinner',
      'provideActionStatusHost',
      'provideButtonCloseIcon',
      'provideButtonConfig',
      'provideButtonConfigAt',
      'provideButtonHost',
      'provideButtonSpinner',
      'provideCngxButton',
      'provideCngxButtonAt',
      'withButtonCloseIcon',
      'withButtonSize',
      'withButtonSpinner',
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
