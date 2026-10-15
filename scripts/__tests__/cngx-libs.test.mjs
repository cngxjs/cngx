import { describe, expect, it } from 'vitest';

import { CNGX_LIBS } from '../../projects/core/schematics/engine/options';
import { PACKED_LIBS, PUBLISHED_LIBS } from '../cngx-libs.mjs';

describe('the published lib list', () => {
  it('names the packages ng add selects from, in the same order', () => {
    expect(PUBLISHED_LIBS).toEqual([...CNGX_LIBS]);
  });

  it('packs @cngx/themes on top of the libs', () => {
    expect(PACKED_LIBS).toEqual([...PUBLISHED_LIBS, 'themes']);
  });
});
