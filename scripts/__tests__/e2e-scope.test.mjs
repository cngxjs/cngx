import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  cngxNames,
  FULL_SHARDS,
  readGraph,
  scopeFor,
  shardsFor,
  sourceImports,
  specFilters,
  specRoutes,
  sweepGrep,
  withDependents,
} from '../e2e-scope.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

// A small graph: forms/select imports common/popover; the select demo
// reaches forms/select, the tabs demo ui/tabs; the shell imports core.
function graph(overrides = {}) {
  return {
    entries: ['@cngx/core', '@cngx/common/popover', '@cngx/forms/select', '@cngx/ui/tabs'],
    imports: {
      '@cngx/core': new Set(),
      '@cngx/common/popover': new Set(['@cngx/core']),
      '@cngx/forms/select': new Set(['@cngx/common/popover']),
      '@cngx/ui/tabs': new Set(['@cngx/core']),
    },
    demos: {
      'forms/select/single-select': new Set(['@cngx/forms/select']),
      'ui/tabs/basic': new Set(['@cngx/ui/tabs']),
    },
    specs: {
      'examples/e2e/forms/select.e2e-spec.ts': ['forms/select'],
      'examples/e2e/ui/tabs/keyboard.e2e-spec.ts': ['ui/tabs/basic'],
      'examples/e2e/core/density.e2e-spec.ts': [],
    },
    shell: new Set(['@cngx/core']),
    ...overrides,
  };
}

describe('scopeFor', () => {
  it('runs nothing for a change that never reaches the examples app', () => {
    expect(
      scopeFor(['README.md', 'core-concepts/install.md', 'projects/forms/select/select.spec.ts', 'packages/mcp/src/x.ts', 'projects/core/schematics/ng-add/index.ts'], graph()),
    ).toEqual({ mode: 'none' });
  });

  it.each([
    '.github/workflows/ci.yml',
    'package-lock.json',
    'angular.json',
    'projects/themes/cngx.css',
    'examples/src/app/app.ts',
    'examples/e2e/_helpers.ts',
    'examples/e2e-sweep/console-allowlist.ts',
    'examples/playwright.config.ts',
    'scripts/examples-gen/index.mjs',
    'scripts/e2e-scope.mjs',
    'something/new.txt',
  ])('runs everything for %s', (file) => {
    expect(scopeFor([file], graph())).toMatchObject({ mode: 'all', reason: file });
  });

  it('runs the demos that reach a changed entry through its dependents, and the specs that visit them', () => {
    expect(scopeFor(['projects/common/popover/popover.ts'], graph())).toEqual({
      mode: 'some',
      demos: ['forms/select/single-select'],
      specs: ['examples/e2e/core/density.e2e-spec.ts', 'examples/e2e/forms/select.e2e-spec.ts'],
    });
  });

  it('runs a changed story demo and a changed spec or baseline on their own', () => {
    expect(scopeFor(['examples/stories/ui/tabs/basic/basic.story.ts'], graph()).specs).toContain('examples/e2e/ui/tabs/keyboard.e2e-spec.ts');
    expect(scopeFor(['examples/e2e/ui/tabs/keyboard.e2e-spec.ts'], graph())).toEqual({
      mode: 'some',
      demos: [],
      specs: ['examples/e2e/ui/tabs/keyboard.e2e-spec.ts'],
    });
    expect(scopeFor(['examples/e2e/ui/tabs/keyboard.e2e-spec.ts-snapshots/tabs-chromium-darwin.png'], graph()).specs).toEqual([
      'examples/e2e/ui/tabs/keyboard.e2e-spec.ts',
    ]);
  });

  it('runs everything when only the app shell is reached and no demo would render it', () => {
    const shellOnly = graph({
      imports: { '@cngx/core': new Set(), '@cngx/common/popover': new Set(), '@cngx/forms/select': new Set(), '@cngx/ui/tabs': new Set() },
    });

    expect(scopeFor(['projects/core/utils/x.ts'], shellOnly)).toMatchObject({ mode: 'all', reason: '@cngx/core (the examples app shell imports it)' });
  });
});

describe('withDependents', () => {
  it('follows imports upward only', () => {
    expect([...withDependents(graph(), ['@cngx/common/popover'])].sort()).toEqual(['@cngx/common/popover', '@cngx/forms/select']);
  });
});

describe('the import readers', () => {
  it('reads story import strings, escaped quotes included', () => {
    expect(cngxNames("'import { CngxSelect } from \\'@cngx/forms/select\\';', 'import { of } from \\'rxjs\\';'")).toEqual(['@cngx/forms/select']);
  });

  it('reads source imports and ignores a module named in a comment', () => {
    const source = "// import { X } from '@cngx/forms/field'\n/** `@cngx/ui/tabs` */\nimport { clamp } from '@cngx/utils';\nexport { Y } from '@cngx/core/tokens';";

    expect(sourceImports(source)).toEqual(['@cngx/utils', '@cngx/core/tokens']);
  });

  it('reads the route helpers and route literals of a spec', () => {
    const spec = "routesIn('common', 'data', 'smart-data-source'); routesUnder('forms', 'select'); gotoDemo(page, 'ui/paginator/paginator-skins/numbered'); gotoDemo(page, '/ui/tabs/basic/x'); const n = 'a/b/c';";

    expect(specRoutes(spec, ['common', 'forms', 'ui'])).toEqual([
      'common/data/smart-data-source',
      'forms/select',
      'ui/paginator/paginator-skins',
      'ui/tabs/basic',
    ]);
  });
});

describe('the playwright arguments', () => {
  it('filters the sweep to the allowlist checks and the routes of the demos', () => {
    const grep = new RegExp(sweepGrep(['ui/tabs/basic']));

    expect(grep.test('chromium console-sweep.sweep-spec.ts console sweep ui/tabs/basic/with-icons')).toBe(true);
    expect(grep.test('chromium console-sweep.sweep-spec.ts console allowlist holds at most 3 rows')).toBe(true);
    expect(grep.test('chromium console-sweep.sweep-spec.ts console sweep ui/tabs/basic-skins/x')).toBe(false);
    expect(grep.test('chromium console-sweep.sweep-spec.ts console sweep mat-ui/tabs/basic/x')).toBe(false);
  });

  it('always runs the app smoke next to the selected specs, from the repo root', () => {
    expect(specFilters(['examples/e2e/ui/tabs/keyboard.e2e-spec.ts'])).toEqual([
      'examples/e2e/00-smoke.e2e-spec.ts',
      'examples/e2e/ui/tabs/keyboard.e2e-spec.ts',
    ]);
  });

  it('shards a full run fully and a small selection on one runner', () => {
    expect(shardsFor({ mode: 'all' })).toEqual({ examples: [1, 2, 3], sweep: [1, 2] });
    expect(shardsFor({ mode: 'some', specs: ['a'], demos: ['x'] })).toEqual({ examples: [1], sweep: [1] });
    expect(shardsFor({ mode: 'some', specs: Array(500).fill('a'), demos: Array(500).fill('x') }).examples).toHaveLength(FULL_SHARDS.examples);
  });
});

describe('the scope on this repo', () => {
  const real = readGraph(ROOT);

  it('reads the entries, demos and specs', () => {
    expect(real.entries).toContain('@cngx/forms/select');
    expect(Object.keys(real.demos).length).toBeGreaterThan(100);
    expect(Object.keys(real.specs).length).toBeGreaterThan(50);
  });

  it('does not take a module named in a doc comment for an import', () => {
    expect([...real.imports['@cngx/core/tokens']]).not.toContain('@cngx/forms/field');
  });

  it('runs the breadcrumb spec for a breadcrumb change, not the whole suite', () => {
    const scope = scopeFor(['projects/ui/breadcrumb/breadcrumb-bar.component.ts'], real);

    expect(scope.mode).toBe('some');
    expect(scope.specs).toContain('examples/e2e/ui/breadcrumb/responsive-collapse.e2e-spec.ts');
    expect(scope.specs.length).toBeLessThan(Object.keys(real.specs).length / 4);
  });
});
