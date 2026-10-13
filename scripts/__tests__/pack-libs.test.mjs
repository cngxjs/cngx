import { describe, expect, it } from 'vitest';

import { manifestFileRefs, missingRefs } from '../pack-libs.mjs';

const pkg = {
  module: 'fesm2022/cngx-core.mjs',
  typings: 'types/cngx-core.d.ts',
  exports: {
    './package.json': { default: './package.json' },
    '.': { types: './types/cngx-core.d.ts', default: './fesm2022/cngx-core.mjs' },
    './theming/*.css': './theming/*.css',
  },
  schematics: './schematics/collection.json',
};

describe('manifestFileRefs', () => {
  it('collects exports, entry fields and the schematics collection, without leading ./', () => {
    expect(manifestFileRefs(pkg).sort()).toEqual([
      'fesm2022/cngx-core.mjs',
      'package.json',
      'schematics/collection.json',
      'theming/*.css',
      'types/cngx-core.d.ts',
    ]);
  });
});

describe('missingRefs', () => {
  const present = [
    'package.json',
    'fesm2022/cngx-core.mjs',
    'types/cngx-core.d.ts',
    'theming/tokens.css',
    'schematics/collection.json',
  ];

  it('is empty when every reference resolves, patterns included', () => {
    expect(missingRefs(pkg, present)).toEqual([]);
  });

  it('names a missing file and an unmatched pattern', () => {
    const without = present.filter((file) => file !== 'fesm2022/cngx-core.mjs' && !file.startsWith('theming/'));
    expect(missingRefs(pkg, without).sort()).toEqual(['fesm2022/cngx-core.mjs', 'theming/*.css']);
  });
});
