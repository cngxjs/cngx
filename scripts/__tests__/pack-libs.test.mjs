import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { manifestFileRefs, missingRefs, missingRuntimeFiles, stampStagedSchematics } from '../pack-libs.mjs';
import { readPackageVersion, refreshMigrationKey } from '../publish.mjs';

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

describe('missingRuntimeFiles', () => {
  const stage = [
    'package.json',
    'schematics/ng-add/index.js',
    'schematics/ng-add/files/starter/app.ts.tpl',
    'schematics/ng-add/files/starter/favicon.svg',
  ];

  it('is empty when the tarball carries every file a schematic reads at run time', () => {
    expect(missingRuntimeFiles(stage, stage)).toEqual([]);
  });

  it('names a run-time file the tarball lacks and ignores everything else', () => {
    expect(missingRuntimeFiles(stage, ['package.json', 'schematics/ng-add/files/starter/app.ts.tpl'])).toEqual([
      'schematics/ng-add/files/starter/favicon.svg',
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

describe('stampStagedSchematics', () => {
  function stageCore() {
    const stage = mkdtempSync(join(tmpdir(), 'cngx-pack-stage-'));
    mkdirSync(join(stage, 'schematics', 'migrations', 'refresh'), { recursive: true });
    writeFileSync(join(stage, 'schematics', 'migrations', 'refresh', 'index.js'), '');
    writeFileSync(join(stage, 'schematics', 'migrations', 'migrations.json'), JSON.stringify({ schematics: {} }));
    return stage;
  }

  it('writes versions.json and the refresh entry into a staged core', () => {
    const stage = stageCore();
    try {
      const pkg = { name: '@cngx/core', peerDependencies: { '@angular/core': '^21.2.0' } };

      expect(stampStagedSchematics('core', stage, pkg, '0.2.0')).toBe(true);
      expect(JSON.parse(readFileSync(join(stage, 'schematics', 'versions.json'), 'utf8'))).toEqual({
        cngx: '0.2.0',
        mcp: readPackageVersion('mcp'),
        eslintPlugin: readPackageVersion('eslint-plugin'),
        angular: '^21.2.0',
      });
      const migrations = JSON.parse(readFileSync(join(stage, 'schematics', 'migrations', 'migrations.json'), 'utf8'));
      expect(Object.keys(migrations.schematics)).toEqual([refreshMigrationKey('0.2.0')]);
    } finally {
      rmSync(stage, { recursive: true, force: true });
    }
  });

  it('leaves a lib without the core schematics alone', () => {
    const stage = mkdtempSync(join(tmpdir(), 'cngx-pack-stage-'));
    try {
      expect(stampStagedSchematics('ui', stage, { name: '@cngx/ui' }, '0.2.0')).toBe(false);
    } finally {
      rmSync(stage, { recursive: true, force: true });
    }
  });
});
