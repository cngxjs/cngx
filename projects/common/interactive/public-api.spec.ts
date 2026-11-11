import { describe, expect, it } from 'vitest';

import * as api from './public-api';

describe('@cngx/common/interactive public API shape', () => {
  it('exports CNGX_NAV_DEFAULTS next to the nav config token', () => {
    expect('CNGX_NAV_CONFIG' in api).toBe(true);
    expect(api.CNGX_NAV_DEFAULTS).toEqual({
      indent: 12,
      singleAccordion: false,
      animationDuration: 150,
    });
  });

  it('exports the nav icon slot', () => {
    expect(typeof api.CngxNavIcon).toBe('function');
  });

  it('exports the nav header, footer, mark and name slots', () => {
    for (const slot of [api.CngxNavHeader, api.CngxNavFooter, api.CngxNavMark, api.CngxNavName]) {
      expect(typeof slot).toBe('function');
    }
  });
});
