import { describe, expect, it } from 'vitest';

import { companionRange } from './companion';

describe('companionRange', () => {
  it.each([
    ['^21.2.0', '21.2.4', '^21.2.0'],
    ['~22.1.3', undefined, '~22.1.3'],
    ['22.2.3', '22.2.3', '22.2.3'],
    ['catalog:', '22.2.3', '^22.2.0'],
    ['workspace:*', '21.1.0-rc.1', '^21.1.0-rc.1'],
    ['latest', undefined, undefined],
    [undefined, undefined, undefined],
  ])('reads %s (installed %s) as %s', (declared, installed, expected) => {
    expect(companionRange(declared, installed)).toBe(expected);
  });
});
