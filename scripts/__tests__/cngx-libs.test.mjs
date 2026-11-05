import { describe, expect, it } from 'vitest';

import { CNGX_LIBS } from '../../projects/core/schematics/engine/options';
import { LOCKSTEP_PACKAGES, PACKED_LIBS, PUBLISHED_LIBS, TOOLING_PACKAGES } from '../cngx-libs.mjs';

describe('the published lib list', () => {
  it('names the packages ng add selects from, in the same order', () => {
    expect(PUBLISHED_LIBS).toEqual([...CNGX_LIBS]);
  });

  it('packs @cngx/themes on top of the libs', () => {
    expect(PACKED_LIBS).toEqual([...PUBLISHED_LIBS, 'themes']);
  });
});

describe('the lockstep package list', () => {
  it('publishes @cngx/mcp before @cngx/cli', () => {
    expect(TOOLING_PACKAGES).toEqual(['mcp', 'cli']);
  });

  it('is the libs plus the tooling packages, each once', () => {
    expect(LOCKSTEP_PACKAGES).toEqual([...PACKED_LIBS, ...TOOLING_PACKAGES]);
    expect(new Set(LOCKSTEP_PACKAGES).size).toBe(LOCKSTEP_PACKAGES.length);
  });

  it('leaves the tooling packages out of the libs-only list', () => {
    for (const name of TOOLING_PACKAGES) {
      expect(PACKED_LIBS).not.toContain(name);
    }
  });
});
