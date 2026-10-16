import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { describe, expect, it } from 'vitest';

import { type AddDependency, CNGX_LIBS, parseManifest } from '../../engine';
import { createAnswers, createFacts, deepFreeze, VERSIONS } from '../../testing/onboarding';
import { canInstallTheme, missingThemePeers, planDependencies, selectedLibs } from './dependencies';

function added(result: ReturnType<typeof planDependencies>): readonly string[] {
  return result.changes
    .filter((change): change is AddDependency => change.kind === 'add-dependency')
    .map((change) => `${change.name}@${change.version}`);
}

function withDependencies(dependencies: Record<string, string>) {
  return createFacts({
    manifest: parseManifest(JSON.stringify({ dependencies: { '@angular/core': '^21.2.0', ...dependencies } })),
  });
}

describe('selectedLibs', () => {
  it('adds the @cngx peers of every selected lib in package order', () => {
    expect(selectedLibs(['forms'])).toEqual(['utils', 'core', 'common', 'forms']);
    expect(selectedLibs(['utils'])).toEqual(['utils']);
    expect(selectedLibs(['ui', 'core'])).toEqual(['utils', 'core', 'common', 'ui']);
  });
});

describe('missingThemePeers', () => {
  it('lists the packages @cngx/themes imports CSS from that are not selected', () => {
    expect(missingThemePeers(selectedLibs(['forms']))).toEqual(['data-display', 'ui']);
    expect(missingThemePeers(selectedLibs(['forms', 'ui', 'data-display']))).toEqual([]);
  });
});

// projects/<lib>/package.json, the source the peer tables repeat.
function cngxPeers(lib: string): readonly string[] {
  const path = join(__dirname, '..', '..', '..', '..', lib, 'package.json');
  const manifest = JSON.parse(readFileSync(path, 'utf8')) as {
    readonly peerDependencies?: Readonly<Record<string, string>>;
  };
  return Object.keys(manifest.peerDependencies ?? {})
    .filter((name) => name.startsWith('@cngx/'))
    .map((name) => name.slice('@cngx/'.length))
    .sort();
}

describe('the @cngx peer tables', () => {
  it.each(CNGX_LIBS)('select the peers projects/%s/package.json declares', (lib) => {
    const peers = selectedLibs([lib]).filter((selected) => selected !== lib);

    expect([...peers].sort()).toEqual(cngxPeers(lib));
  });

  it('refuse the theme for exactly the peers projects/themes/package.json declares', () => {
    expect([...missingThemePeers([])].sort()).toEqual(cngxPeers('themes'));
  });
});

describe('canInstallTheme', () => {
  it('installs a wanted theme only over the full set of theme peers', () => {
    expect(canInstallTheme(selectedLibs(['forms', 'ui', 'data-display']), 'cngx')).toBe(true);
    expect(canInstallTheme(selectedLibs(['forms', 'ui', 'data-display']), 'material')).toBe(true);
    expect(canInstallTheme(selectedLibs(['forms', 'ui', 'data-display']), 'none')).toBe(false);
    expect(canInstallTheme(selectedLibs(['forms']), 'cngx')).toBe(false);
  });
});

describe('planDependencies', () => {
  it('pins the whole lockstep graph, the theme package and the CDK by default', () => {
    expect(added(planDependencies(createFacts(), createAnswers(), VERSIONS))).toEqual([
      '@cngx/utils@0.1.0',
      '@cngx/core@0.1.0',
      '@cngx/common@0.1.0',
      '@cngx/interop@0.1.0',
      '@cngx/forms@0.1.0',
      '@cngx/data-display@0.1.0',
      '@cngx/ui@0.1.0',
      '@cngx/themes@0.1.0',
      '@angular/cdk@^21.2.0',
    ]);
  });

  it('adds only utils for a utils-only install without a theme', () => {
    const result = planDependencies(createFacts(), createAnswers({ libs: ['utils'], theme: 'none' }), VERSIONS);
    expect(added(result)).toEqual(['@cngx/utils@0.1.0']);
    expect(result.skipped).toEqual([]);
  });

  it('refuses the theme for a narrowed set and names what it lacks', () => {
    const result = planDependencies(createFacts(), createAnswers({ libs: ['forms'] }), VERSIONS);
    expect(added(result)).toEqual([
      '@cngx/utils@0.1.0',
      '@cngx/core@0.1.0',
      '@cngx/common@0.1.0',
      '@cngx/forms@0.1.0',
      '@angular/cdk@^21.2.0',
    ]);
    expect(result.changes.find((change) => change.kind === 'note')).toMatchObject({
      id: 'dependency:@cngx/themes',
      label: 'Skip @cngx/themes',
      reason: 'cngx.css imports the CSS of @cngx/data-display and @cngx/ui; select them or pass --theme=none',
    });
  });

  it('rewrites the caret range the CLI writes for the entry package', () => {
    const result = planDependencies(withDependencies({ '@cngx/ui': '^0.1.0' }), createAnswers(), VERSIONS);
    expect(result.changes.find((change) => change.id === 'dependency:@cngx/ui')).toMatchObject({
      kind: 'add-dependency',
      version: '0.1.0',
      reason: 'replaces ^0.1.0; every @cngx package stays on one version',
    });
  });

  it('skips packages already pinned to the release and third-party packages already declared', () => {
    const result = planDependencies(
      withDependencies({ '@cngx/utils': '0.1.0', '@angular/cdk': '~21.2.1' }),
      createAnswers(),
      VERSIONS,
    );
    expect(result.skipped).toEqual([
      { id: 'dependency:@cngx/utils', label: 'Add @cngx/utils@0.1.0', reason: 'already pinned' },
      { id: 'dependency:@angular/cdk', label: 'Add @angular/cdk@^21.2.0', reason: 'already declared as ~21.2.1' },
    ]);
  });

  it('pins the CDK to the major and minor of the resolved Angular version', () => {
    const facts = createFacts({
      angularVersion: '21.2.5',
      angularRange: 'catalog:',
      manifest: parseManifest(JSON.stringify({ dependencies: { '@angular/core': 'catalog:' } })),
    });
    expect(added(planDependencies(facts, createAnswers(), VERSIONS))).toContain('@angular/cdk@^21.2.0');
  });

  it('follows a plain declared range when no version can be resolved from it', () => {
    const facts = createFacts({
      angularVersion: undefined,
      angularRange: '21.x',
      manifest: parseManifest(JSON.stringify({ dependencies: { '@angular/core': '21.x' } })),
    });
    expect(added(planDependencies(facts, createAnswers(), VERSIONS))).toContain('@angular/cdk@21.x');
  });

  it('plans a note instead of a CDK pin for a specifier that is no range', () => {
    const facts = createFacts({
      angularVersion: undefined,
      angularRange: 'workspace:*',
      manifest: parseManifest(JSON.stringify({ dependencies: { '@angular/core': 'workspace:*' } })),
    });
    const result = planDependencies(facts, createAnswers(), VERSIONS);

    expect(added(result).some((name) => name.startsWith('@angular/cdk@'))).toBe(false);
    expect(result.changes.find((change) => change.id === 'dependency:@angular/cdk')).toMatchObject({
      kind: 'note',
      label: 'Add @angular/cdk yourself',
      reason: 'cngx cannot read an Angular version from workspace:*; add the @angular/cdk matching your @angular/core',
    });
  });

  it('plans a note instead of a guessed CDK pin when no Angular range is declared', () => {
    const facts = createFacts({
      manifest: parseManifest(JSON.stringify({ dependencies: {} })),
      angularVersion: undefined,
      angularRange: undefined,
    });
    const result = planDependencies(facts, createAnswers(), VERSIONS);

    expect(added(result).some((name) => name.startsWith('@angular/cdk@'))).toBe(false);
    expect(result.changes.find((change) => change.id === 'dependency:@angular/cdk')).toMatchObject({
      kind: 'note',
      label: 'Add @angular/cdk yourself',
    });
  });

  it('adds @floating-ui/dom only on request and only with @cngx/common', () => {
    expect(
      added(planDependencies(createFacts(), createAnswers({ floatingFallback: true, libs: ['utils'], theme: 'none' }), VERSIONS)),
    ).toEqual(['@cngx/utils@0.1.0']);
    expect(added(planDependencies(createFacts(), createAnswers(), VERSIONS))).not.toContain('@floating-ui/dom@^1.0.0');
    expect(added(planDependencies(createFacts(), createAnswers({ floatingFallback: true }), VERSIONS))).toContain(
      '@floating-ui/dom@^1.0.0',
    );
  });

  it('never adds @angular/material, not even for the Material bridge', () => {
    const result = planDependencies(createFacts(), createAnswers({ theme: 'material' }), VERSIONS);
    expect(added(result).some((entry) => entry.startsWith('@angular/material'))).toBe(false);
  });

  it('stamps every change with its provenance', () => {
    const result = planDependencies(createFacts(), createAnswers(), VERSIONS);
    expect(result.changes.every((change) => change.provenance.source === 'ng-add' && change.provenance.version === '0.1.0')).toBe(
      true,
    );
  });

  it('does not mutate its inputs', () => {
    expect(() =>
      planDependencies(deepFreeze(createFacts()), deepFreeze(createAnswers({ libs: ['forms'] })), deepFreeze(VERSIONS)),
    ).not.toThrow();
  });
});
