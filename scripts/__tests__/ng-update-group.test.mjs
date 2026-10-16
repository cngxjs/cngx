import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { PACKED_LIBS } from '../cngx-libs.mjs';

// `ng update @cngx/<any>` moves every cngx package together only when each
// manifest names the whole group; the CLI reads the group from the package
// the user names, so one member without it updates alone.
const GROUP = PACKED_LIBS.map((lib) => `@cngx/${lib}`);

const ngUpdateOf = (lib) =>
  JSON.parse(readFileSync(join(import.meta.dirname, '..', '..', 'projects', lib, 'package.json'), 'utf8'))['ng-update'];

describe('the ng update package group', () => {
  it.each(PACKED_LIBS)('@cngx/%s names every cngx package', (lib) => {
    expect(ngUpdateOf(lib)?.packageGroup).toEqual(GROUP);
  });

  it('names core as the group and carries the migrations on core only', () => {
    expect(ngUpdateOf('core')).toEqual({
      migrations: './schematics/migrations/migrations.json',
      packageGroupName: '@cngx/core',
      packageGroup: GROUP,
    });
    for (const lib of PACKED_LIBS.filter((name) => name !== 'core')) {
      expect(Object.keys(ngUpdateOf(lib))).toEqual(['packageGroup']);
    }
  });
});
