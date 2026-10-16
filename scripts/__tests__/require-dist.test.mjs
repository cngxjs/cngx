import { describe, expect, it } from 'vitest';

import { PACKED_LIBS } from '../cngx-libs.mjs';
import { missingDist } from '../require-dist.mjs';

describe('missingDist', () => {
  it('finds nothing missing once every package is built', () => {
    expect(missingDist('/repo', () => true)).toEqual([]);
  });

  it('names each package whose dist manifest is missing, in build order', () => {
    const built = new Set(['/repo/dist/utils/package.json', '/repo/dist/core/package.json']);

    expect(missingDist('/repo', (path) => built.has(path))).toEqual(PACKED_LIBS.filter((lib) => !['utils', 'core'].includes(lib)));
  });
});
