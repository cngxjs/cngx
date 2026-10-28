import { describe, expect, it } from 'vitest';

import * as fieldApi from './public-api';

describe('@cngx/forms/field public API', () => {
  it('exports CngxFieldBox without the removed CngxAffixRow alias', () => {
    expect('CngxFieldBox' in fieldApi).toBe(true);
    expect('CngxAffixRow' in fieldApi).toBe(false);
  });
});
