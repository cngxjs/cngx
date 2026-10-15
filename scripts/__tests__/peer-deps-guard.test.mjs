import { describe, expect, it } from 'vitest';

import { CNGX_LIBS } from '../../projects/core/schematics/engine/options';
import {
  checkLib,
  checkRangeDrift,
  collectEntryImports,
  externalPackageName,
  PACKED_LIBS,
  PUBLISHED_LIBS,
  runGuard,
} from '../peer-deps-guard.mjs';

describe('the published lib list', () => {
  it('names the packages ng add selects from, in the same order', () => {
    expect(PUBLISHED_LIBS).toEqual([...CNGX_LIBS]);
  });

  it('packs @cngx/themes on top of the libs', () => {
    expect(PACKED_LIBS).toEqual([...PUBLISHED_LIBS, 'themes']);
  });
});

describe('externalPackageName', () => {
  it('reduces deep specifiers to the package', () => {
    expect(externalPackageName('rxjs/operators')).toBe('rxjs');
    expect(externalPackageName('@angular/core/rxjs-interop')).toBe('@angular/core');
  });

  it('ignores relative paths and node builtins', () => {
    expect(externalPackageName('./a')).toBeNull();
    expect(externalPackageName('../b/c')).toBeNull();
    expect(externalPackageName('node:fs')).toBeNull();
    expect(externalPackageName('path')).toBeNull();
  });
});

describe('collectEntryImports', () => {
  const files = {
    '/e/public-api.ts': `export * from './a'; import type { X } from '@angular/router';`,
    '/e/a.ts': `import { y } from 'rxjs'; // import 'commented-out'\nconst z = import('lazy-pkg');`,
    '/e/unreached.ts': `import 'never-reached';`,
  };
  const read = (file) => files[file] ?? null;
  const exists = (file) => file in files;

  it('follows relative imports and records externals with their files', () => {
    const found = collectEntryImports('/e/public-api.ts', read, exists);
    expect([...found.keys()].sort()).toEqual(['@angular/router', 'lazy-pkg', 'rxjs']);
    expect([...found.get('rxjs')]).toEqual(['/e/a.ts']);
  });

  it('skips comments and unreachable files', () => {
    const found = collectEntryImports('/e/public-api.ts', read, exists);
    expect(found.has('commented-out')).toBe(false);
    expect(found.has('never-reached')).toBe(false);
  });
});

describe('checkLib', () => {
  const site = (entry, primary = false) => [{ entry, primary }];
  const pkg = {
    peerDependencies: { '@angular/core': '^21.2.0', rxjs: '^7.8.0', '@cngx/core': '0.0.0-PLACEHOLDER' },
    peerDependenciesMeta: { rxjs: { optional: true } },
    dependencies: { tslib: '^2.3.0' },
  };

  it('passes a consistent lib', () => {
    const imports = new Map([['@angular/core', site('a', true)], ['rxjs', site('b')]]);
    expect(checkLib({ lib: 'x', pkg, imports })).toEqual([]);
  });

  it('flags an import with no declaration', () => {
    const imports = new Map([['@angular/core', site('a')], ['rxjs', site('a')], ['left-pad', site('b')]]);
    expect(checkLib({ lib: 'x', pkg, imports }).map((v) => v.rule)).toEqual(['undeclared']);
  });

  it('flags a declared peer that nothing imports, but not @cngx peers', () => {
    const imports = new Map([['@angular/core', site('a')]]);
    const violations = checkLib({ lib: 'x', pkg, imports });
    expect(violations.map((v) => v.detail)).toEqual(['rxjs']);
  });

  it('flags an optional peer imported by the primary entry', () => {
    const imports = new Map([['@angular/core', site('a')], ['rxjs', site('x (primary)', true)]]);
    expect(checkLib({ lib: 'x', pkg, imports }).map((v) => v.rule)).toEqual(['optional-in-primary']);
  });

  it('flags tilde peers and stray runtime dependencies', () => {
    const bad = {
      ...pkg,
      peerDependencies: { ...pkg.peerDependencies, rxjs: '~7.8.0' },
      dependencies: { tslib: '^2.3.0', lodash: '^4.0.0' },
    };
    const imports = new Map([['@angular/core', site('a')], ['rxjs', site('a')]]);
    expect(checkLib({ lib: 'x', pkg: bad, imports }).map((v) => v.rule).sort()).toEqual([
      'stray-dependency',
      'tilde-peer',
    ]);
  });
});

describe('checkRangeDrift', () => {
  it('flags one package carrying two ranges', () => {
    const drift = checkRangeDrift({
      a: { peerDependencies: { rxjs: '^7.8.0' } },
      b: { peerDependencies: { rxjs: '^7.4.0' } },
    });
    expect(drift).toHaveLength(1);
    expect(drift[0].detail).toContain('rxjs');
  });

  it('ignores @cngx placeholders', () => {
    expect(
      checkRangeDrift({
        a: { peerDependencies: { '@cngx/core': '0.0.0-PLACEHOLDER' } },
        b: { peerDependencies: { '@cngx/core': '1.0.0' } },
      }),
    ).toEqual([]);
  });
});

describe('the real libs', () => {
  it('declare every peer their shipped code needs', () => {
    expect(runGuard()).toEqual([]);
  });
});
