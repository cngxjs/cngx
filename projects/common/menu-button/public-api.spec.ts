import { describe, expect, it } from 'vitest';

import * as api from './public-api';

describe('@cngx/common/menu-button public API shape', () => {
  // Snapshot of the runtime (value) export list. A new or removed export is a
  // deliberate public-surface change; update this list in the same commit so a
  // leak of an internal helper or an accidental drop fails the guard.
  it('exports exactly the pinned value surface', () => {
    expect(Object.keys(api).sort()).toEqual([
      'CNGX_BUTTON_CARET_ICON',
      'CNGX_MENU_BUTTON_I18N',
      'CNGX_MENU_BUTTON_LANGUAGE_EN',
      'CNGX_SPLIT_BUTTON',
      'CngxIconMenuButton',
      'CngxMenuButton',
      'CngxSplitButton',
      'CngxSplitCaret',
      'injectButtonCaretIcon',
      'injectMenuButtonI18n',
      'provideButtonCaretIcon',
      'provideCngxMenuButton',
      'provideCngxMenuButtonAt',
      'provideMenuButtonI18n',
      'withButtonCaretIcon',
      'withMenuButtonI18nLabels',
    ]);
  });

  it('keeps the internal menu glue off the barrel', () => {
    const keys = Object.keys(api);
    for (const internal of ['injectMenuToggle', 'CNGX_SPLIT_CARET']) {
      expect(keys).not.toContain(internal);
    }
  });
});
