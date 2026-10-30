import { describe, expect, it } from 'vitest';

import * as api from './public-api';
import type { CngxSelectCompareFn } from './public-api';

describe('@cngx/forms/select public API shape', () => {
  it('exposes the action config through injectActionSelectConfig, not the internal resolver', () => {
    expect('resolveActionSelectConfig' in api).toBe(false);
    expect('injectActionSelectConfig' in api).toBe(true);
  });

  it('exports CngxSelectCompareFn for typing a [compareWith] comparator', () => {
    const byId: CngxSelectCompareFn<{ id: number }> = (a, b) => a?.id === b?.id;
    expect(byId({ id: 1 }, { id: 1 })).toBe(true);
    expect(byId({ id: 1 }, { id: 2 })).toBe(false);
  });
});
