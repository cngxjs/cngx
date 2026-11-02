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
});
