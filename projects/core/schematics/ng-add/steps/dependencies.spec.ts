import { describe, expect, it } from 'vitest';

import { type AddDependency, parseManifest } from '../../engine';
import { createAnswers, createFacts, deepFreeze, VERSIONS } from '../../testing/onboarding';
import {
  canInstallTheme,
  missingThemePeers,
  planDependencies,
  planThirdPartyDependency,
  selectedLibs,
} from './dependencies';

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

describe('canInstallTheme', () => {
  it('installs a wanted theme only over the full set of theme peers', () => {
    expect(canInstallTheme(selectedLibs(['forms', 'ui', 'data-display']), 'cngx')).toBe(true);
    expect(canInstallTheme(selectedLibs(['forms', 'ui', 'data-display']), 'material')).toBe(true);
    expect(canInstallTheme(selectedLibs(['forms', 'ui', 'data-display']), 'none')).toBe(false);
    expect(canInstallTheme(selectedLibs(['forms']), 'cngx')).toBe(false);
  });
});

describe('planThirdPartyDependency', () => {
  const PROVENANCE = { source: 'ng-add', version: VERSIONS.cngx };
  const PARSER = {
    name: '@angular-eslint/template-parser',
    range: '21.3.0',
    reason: 'parses templates',
    dev: true,
  };

  it('adds a package the app lacks under its range', () => {
    const result = planThirdPartyDependency(withDependencies({}).manifest, PARSER, PROVENANCE);

    expect(result).toEqual({
      changes: [
        {
          kind: 'add-dependency',
          id: 'dependency:@angular-eslint/template-parser',
          label: 'Add @angular-eslint/template-parser@21.3.0',
          reason: 'parses templates',
          provenance: PROVENANCE,
          name: '@angular-eslint/template-parser',
          version: '21.3.0',
          dev: true,
        },
      ],
      skipped: [],
    });
  });

  it('keeps a declared package at its own range under the planned id and label', () => {
    const manifest = withDependencies({ '@angular-eslint/template-parser': '^20.0.0' }).manifest;
    const planned = planThirdPartyDependency(withDependencies({}).manifest, PARSER, PROVENANCE);
    const kept = planThirdPartyDependency(manifest, PARSER, PROVENANCE);

    expect(kept.changes).toEqual([]);
    expect(kept.skipped).toEqual([
      {
        id: planned.changes[0]?.id,
        label: planned.changes[0]?.label,
        reason: 'already declared as ^20.0.0',
      },
    ]);
  });

  it('adds a runtime dependency without a dev flag', () => {
    const result = planThirdPartyDependency(
      withDependencies({}).manifest,
      { name: '@angular/cdk', range: '^21.2.0', reason: 'a peer' },
      PROVENANCE,
    );

    expect(result.changes[0]).not.toHaveProperty('dev');
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

  it('follows the declared Angular range for the CDK', () => {
    const facts = createFacts({ manifest: parseManifest(JSON.stringify({ dependencies: { '@angular/core': '~21.2.4' } })) });
    expect(added(planDependencies(facts, createAnswers(), VERSIONS))).toContain('@angular/cdk@~21.2.4');
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
