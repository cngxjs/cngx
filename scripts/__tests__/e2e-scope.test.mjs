import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import {
  covers,
  FULL_SHARDS,
  importStrings,
  readGraph,
  routeCalls,
  scopeFor,
  storyRelativeTargets,
  shardsFor,
  sourceImports,
  specFilters,
  specRoutes,
  sweepGrep,
  withDependents,
} from '../e2e-scope.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');

const reach = (entries, files = []) => ({ entries: new Set(entries), files: new Set(files) });

// A small graph: forms/select imports common/popover; the select route
// reaches forms/select and a fixture, the empty-state route ui/tabs; the
// shell imports core and its own fixture.
function graph(overrides = {}) {
  return {
    entries: ['@cngx/core', '@cngx/common/popover', '@cngx/forms/select', '@cngx/ui/tabs'],
    imports: {
      '@cngx/core': new Set(),
      '@cngx/common/popover': new Set(['@cngx/core']),
      '@cngx/forms/select': new Set(['@cngx/common/popover']),
      '@cngx/ui/tabs': new Set(['@cngx/core']),
    },
    routes: {
      'forms/select/single-select/clearable': reach(['@cngx/forms/select'], ['examples/fixtures/people.fixture.ts']),
      'ui/empty-state/basic': reach(['@cngx/ui/tabs']),
    },
    specs: {
      'examples/e2e/forms/select.e2e-spec.ts': ['forms/select'],
      'examples/e2e/ui/empty-state.e2e-spec.ts': ['ui/empty-state'],
      'examples/e2e/core/density.e2e-spec.ts': [],
      'examples/e2e/core/i18n/de-pack.e2e-spec.ts': undefined,
    },
    shell: reach(['@cngx/core'], ['examples/fixtures/i18n-de.fixture.ts']),
    ...overrides,
  };
}

describe('scopeFor', () => {
  it('runs nothing for a change that never reaches the examples app', () => {
    expect(
      scopeFor(
        [
          'README.md',
          'core-concepts/install.md',
          'projects/forms/select/select.spec.ts',
          'packages/mcp/src/x.ts',
          'projects/core/schematics/ng-add/index.ts',
        ],
        graph(),
      ),
    ).toEqual({ mode: 'none' });
  });

  it.each([
    '.github/workflows/ci.yml',
    'package-lock.json',
    'angular.json',
    'projects/themes/cngx.css',
    'projects/forms/theming/components/cngx-field-skin.css',
    'projects/common/theming/components/cngx-badge.css',
    'projects/core/theming/system-tokens.css',
    'examples/src/app/app.ts',
    'examples/e2e/_helpers.ts',
    'examples/e2e-sweep/console-allowlist.ts',
    'examples/playwright.config.ts',
    'examples/fixtures/i18n-de.fixture.ts',
    'scripts/examples-gen/index.mjs',
    'scripts/e2e-scope.mjs',
    'something/new.txt',
  ])('runs everything for %s', (file) => {
    expect(scopeFor([file], graph())).toMatchObject({ mode: 'all', reason: file });
  });

  it('runs everything for an example helper no story reaches', () => {
    expect(scopeFor(['examples/stories/ui/tabs/_unused.component.ts'], graph())).toMatchObject({ mode: 'all' });
  });

  it('runs the routes that reach a changed entry through its dependents, the specs that visit them, and the unreadable ones', () => {
    expect(scopeFor(['projects/common/popover/popover.ts'], graph())).toEqual({
      mode: 'some',
      routes: ['forms/select/single-select/clearable'],
      specs: [
        'examples/e2e/core/density.e2e-spec.ts',
        'examples/e2e/core/i18n/de-pack.e2e-spec.ts',
        'examples/e2e/forms/select.e2e-spec.ts',
      ],
    });
  });

  it('runs a route whose story sits right in its category folder', () => {
    expect(scopeFor(['examples/stories/ui/empty-state/basic.story.ts'], graph()).specs).toContain(
      'examples/e2e/ui/empty-state.e2e-spec.ts',
    );
  });

  it('runs the routes whose story reaches a changed fixture by a relative import', () => {
    expect(scopeFor(['examples/fixtures/people.fixture.ts'], graph())).toMatchObject({
      mode: 'some',
      routes: ['forms/select/single-select/clearable'],
    });
  });

  it('runs a changed spec or baseline on its own', () => {
    expect(scopeFor(['examples/e2e/ui/empty-state.e2e-spec.ts'], graph())).toEqual({
      mode: 'some',
      routes: [],
      specs: ['examples/e2e/ui/empty-state.e2e-spec.ts'],
    });
    expect(scopeFor(['examples/e2e/ui/empty-state.e2e-spec.ts-snapshots/basic-chromium-linux.png'], graph()).specs).toEqual([
      'examples/e2e/ui/empty-state.e2e-spec.ts',
    ]);
  });

  it('runs everything when only the app shell is reached and no route would render it', () => {
    const shellOnly = graph({
      imports: { '@cngx/core': new Set(), '@cngx/common/popover': new Set(), '@cngx/forms/select': new Set(), '@cngx/ui/tabs': new Set() },
    });

    expect(scopeFor(['projects/core/utils/x.ts'], shellOnly)).toMatchObject({
      mode: 'all',
      reason: '@cngx/core (the examples app shell imports it)',
    });
  });
});

describe('withDependents', () => {
  it('follows imports upward only', () => {
    expect([...withDependents(graph(), ['@cngx/common/popover'])].sort()).toEqual(['@cngx/common/popover', '@cngx/forms/select']);
  });
});

describe('the import readers', () => {
  it('reads story import strings, escaped quotes and relative fixtures included', () => {
    expect(
      importStrings("'import { CngxSelect } from \\'@cngx/forms/select\\';', 'import { people } from \\'../../../../fixtures\\';'"),
    ).toEqual(['@cngx/forms/select', '../../../../fixtures']);
  });

  it('reads source imports and ignores a module named in a comment', () => {
    const source =
      "// import { X } from '@cngx/forms/field'\n/** `@cngx/ui/tabs` */\nimport { clamp } from '@cngx/utils';\nexport { Y } from '@cngx/core/tokens';";

    expect(sourceImports(source)).toEqual(['@cngx/utils', '@cngx/core/tokens']);
  });

  it('reads route helpers and route literals of any depth', () => {
    const spec = [
      "routesIn('common', 'data', 'smart-data-source');",
      "routesUnder('ui', 'empty-state');",
      "gotoDemo(page, 'common/interactive/button-toggle/group/basic-view-switcher');",
      "gotoDemo(page, '/ui/tabs/basic/x');",
      "const n = 'a/b/c';",
    ].join('\n');

    expect(specRoutes(spec, ['common', 'ui'])).toEqual([
      'common/data/smart-data-source',
      'ui/empty-state',
      'common/interactive/button-toggle/group/basic-view-switcher',
      'ui/tabs/basic/x',
    ]);
  });

  it('cannot read a route helper call that takes anything but string literals', () => {
    expect(specRoutes('for (const s of all) routesIn(...s);', ['ui'])).toBeUndefined();
  });

  it('covers a route by whole segments only', () => {
    expect(covers('ui/tabs', 'ui/tabs/basic/x')).toBe(true);
    expect(covers('ui/tabs', 'ui/tabs-overflow/x')).toBe(false);
  });
});

describe('the playwright arguments', () => {
  it('filters the sweep to the allowlist checks and exactly the selected routes', () => {
    const grep = new RegExp(sweepGrep(['ui/tabs/basic/with-icons']));

    expect(grep.test('chromium console-sweep.sweep-spec.ts console sweep ui/tabs/basic/with-icons')).toBe(true);
    expect(grep.test('chromium console-sweep.sweep-spec.ts console allowlist holds at most 3 rows')).toBe(true);
    expect(grep.test('chromium console-sweep.sweep-spec.ts console sweep ui/tabs/basic/with-icons-rtl')).toBe(false);
    expect(grep.test('chromium console-sweep.sweep-spec.ts console sweep mat-ui/tabs/basic/with-icons')).toBe(false);
  });

  it('sweeps every route when the filter would outgrow a command line argument', () => {
    const many = Array.from({ length: 2000 }, (_, index) => `ui/tabs/basic/route-${index}`);

    expect(sweepGrep(many)).toBe('');
    expect(shardsFor({ mode: 'some', specs: ['a'], routes: many }).sweep).toHaveLength(FULL_SHARDS.sweep);
  });

  it('always runs the app smoke next to the selected specs, from the repo root', () => {
    expect(specFilters(['examples/e2e/ui/tabs/keyboard.e2e-spec.ts'])).toEqual([
      'examples/e2e/00-smoke.e2e-spec.ts',
      'examples/e2e/ui/tabs/keyboard.e2e-spec.ts',
    ]);
  });

  it('shards a full run fully and a small selection on one runner', () => {
    expect(shardsFor({ mode: 'all' })).toEqual({ examples: [1, 2, 3], sweep: [1, 2] });
    expect(shardsFor({ mode: 'some', specs: ['a'], routes: ['x/y'] })).toEqual({ examples: [1], sweep: [1] });
    expect(shardsFor({ mode: 'some', specs: Array(500).fill('a'), routes: ['x/y'] }).examples).toHaveLength(FULL_SHARDS.examples);
  });
});

describe('the scope on this repo', () => {
  const real = readGraph(ROOT);
  const routes = Object.keys(real.routes);

  it('reads every story as a route, at any folder depth', () => {
    expect(routes.length).toBeGreaterThan(500);
    expect(routes.some((route) => route.split('/').length === 3)).toBe(true);
    expect(routes.some((route) => route.split('/').length >= 5)).toBe(true);
  });

  // A spec route that matches no story would never be selected by a lib
  // change; a spec without readable routes runs on every selection instead.
  it('resolves every relative import of every story, as the generator rewrites it', () => {
    expect(real.unresolved).toEqual([]);
  });

  it('points every route helper call of every spec at a story route', () => {
    const lost = Object.keys(real.specs).flatMap((path) =>
      (routeCalls(readFileSync(join(ROOT, path), 'utf8')) ?? [])
        .filter((prefix) => !routes.some((route) => covers(prefix, route)))
        .map((prefix) => `${path}: ${prefix}`),
    );

    expect(lost).toEqual([]);
  });

  it('reads the fixture paths of a story the way the generator rewrites them', () => {
    const story = join(ROOT, 'examples/stories/forms/filter-builder/filter-builder-async-state/x.story.ts');

    expect(storyRelativeTargets(ROOT, story, '../../../fixtures')).toEqual([join(ROOT, 'examples/fixtures/index.ts')]);
    expect(storyRelativeTargets(ROOT, story, '../../../../../_fixtures/demo-mount-counter.component')).toEqual([
      join(ROOT, 'examples/src/app/_fixtures/demo-mount-counter.component.ts'),
    ]);
  });

  it('runs a story whose fixture import only resolves through the generator rewrite', () => {
    expect(scopeFor(['examples/fixtures/filter-builder-fixtures.ts'], real).routes).toContain(
      'forms/filter-builder/filter-builder-async-state/loading-error-content-branches-via-cngx-async-container',
    );
  });

  // projects/themes/cngx.css pulls every lib's theming folder into the
  // global stylesheet, which every route loads.
  it.each([
    'projects/forms/theming/components/cngx-field-skin.css',
    'projects/common/theming/components/cngx-badge.css',
    'projects/data-display/theming/system-tokens.css',
    'projects/ui/theming/system-tokens.css',
  ])('runs everything for the global theming file %s', (file) => {
    expect(scopeFor([file], real)).toEqual({ mode: 'all', reason: file });
  });

  it('reads the same app shell as a CI checkout, without the generated routes', () => {
    expect([...real.shell.files].some((file) => file.includes('/app/features/') || file.endsWith('app.routes.ts'))).toBe(false);
  });

  it('maps every spec to at least one story route, or runs it on every selection', () => {
    const lost = Object.entries(real.specs)
      .filter(([, visits]) => visits !== undefined && visits.length > 0)
      .filter(([, visits]) => !visits.some((prefix) => routes.some((route) => covers(prefix, route))))
      .map(([path]) => path);

    expect(lost).toEqual([]);
  });

  it('does not take a module named in a doc comment for an import', () => {
    expect([...real.imports['@cngx/core/tokens']]).not.toContain('@cngx/forms/field');
  });

  it.each([
    ['projects/common/interactive/public-api.ts', 'examples/e2e/common/interactive/button-toggle-group.e2e-spec.ts'],
    ['projects/ui/empty-state/empty-state.component.ts', 'examples/e2e/ui/empty-state.e2e-spec.ts'],
    ['projects/forms/filter-builder/public-api.ts', 'examples/e2e/core/i18n/de-pack.e2e-spec.ts'],
    ['projects/ui/breadcrumb/breadcrumb-bar.component.ts', 'examples/e2e/ui/breadcrumb/responsive-collapse.e2e-spec.ts'],
  ])('a change to %s runs %s', (file, spec) => {
    expect(scopeFor([file], real).specs).toContain(spec);
  });

  it('runs a fraction of the suite for a leaf organism', () => {
    const scope = scopeFor(['projects/ui/breadcrumb/breadcrumb-bar.component.ts'], real);

    expect(scope.mode).toBe('some');
    expect(scope.specs.length).toBeLessThan(Object.keys(real.specs).length / 4);
  });
});
