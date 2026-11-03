import { describe, expect, it } from 'vitest';

import { PACKED_LIBS } from '../cngx-libs.mjs';
import { missingDist, missingDocsJson } from '../require-dist.mjs';

describe('missingDist', () => {
  it('finds nothing missing once every package is built', () => {
    expect(missingDist('/repo', () => true)).toEqual([]);
  });

  it('names each package whose dist manifest is missing, in build order', () => {
    const built = new Set(['/repo/dist/utils/package.json', '/repo/dist/core/package.json']);

    expect(missingDist('/repo', (path) => built.has(path))).toEqual(PACKED_LIBS.filter((lib) => !['utils', 'core'].includes(lib)));
  });
});

describe('missingDocsJson', () => {
  it('finds nothing missing once docs:json has run', () => {
    const built = (path) => path === '/repo/.compodoc/documentation.json';

    expect(missingDocsJson('/repo', built)).toBeNull();
  });

  it('names the compodoc JSON when docs:json has not run', () => {
    expect(missingDocsJson('/repo', () => false)).toBe('.compodoc/documentation.json');
  });
});
