import { describe, expect, it } from 'vitest';

import * as api from './public-api';

describe('@cngx/forms/select public API shape', () => {
  it('exposes the action config through injectActionSelectConfig, not the internal resolver', () => {
    expect('resolveActionSelectConfig' in api).toBe(false);
    expect('injectActionSelectConfig' in api).toBe(true);
  });
});
