import { describe, expect, it } from 'vitest';

import { parseManifest } from '../../engine';
import { createFacts } from '../../testing/onboarding';
import { type ProjectFacts } from '../detect/detect';
import { type GitState } from './git-state';
import { angularReading, angularSupport, preflightItems } from './preflight';

const PEER_RANGE = '^21.2.0';

const withAngular = (
  range: string | undefined,
  angularVersion = range?.replace(/^\D*/, ''),
  angularSource: ProjectFacts['angularSource'] = angularVersion === undefined ? undefined : 'range',
) =>
  createFacts({
    angularVersion,
    angularSource,
    angularRange: range,
    manifest: parseManifest(
      JSON.stringify({ dependencies: range === undefined ? {} : { '@angular/core': range } }),
    ),
  });

describe('angularReading', () => {
  it('names the declared range when the version comes from it', () => {
    expect(angularReading(withAngular('^20.3.0'))).toBe('declares ^20.3.0');
  });

  it('names the installed version behind a specifier that carries none', () => {
    expect(angularReading(withAngular('catalog:', '19.2.3', 'installed'))).toBe('has 19.2.3 installed (declares catalog:)');
  });

  it('names the installed version when it differs from the declared range', () => {
    expect(angularReading(withAngular('^21.1.0', '21.1.4', 'installed'))).toBe('has 21.1.4 installed (declares ^21.1.0)');
  });

  it('names the installed version even when the declared range names the same one', () => {
    expect(angularReading(withAngular('^21.2.0', '21.2.0', 'installed'))).toBe(
      'has 21.2.0 installed (declares ^21.2.0)',
    );
  });

  it('says when no @angular/core is declared', () => {
    expect(angularReading(withAngular(undefined, undefined))).toBe('declares no @angular/core dependency');
  });
});

describe('angularSupport', () => {
  it.each(['^21.2.0', '~21.3.1', '22.0.0'])('supports %s against a 21.2 floor', (range) => {
    expect(angularSupport(withAngular(range), PEER_RANGE)).toEqual({
      supported: true,
      floor: '21.2',
      declared: range,
    });
  });

  it('refuses an older minor and names what the app declares', () => {
    expect(angularSupport(withAngular('^21.1.0'), PEER_RANGE)).toEqual({
      supported: false,
      floor: '21.2',
      declared: '^21.1.0',
    });
  });

  it('reads an installed prerelease at its major and minor', () => {
    expect(angularSupport(withAngular('catalog:', '21.2.0-rc.1'), PEER_RANGE).supported).toBe(true);
    expect(angularSupport(withAngular('catalog:', '21.1.9-rc.1'), PEER_RANGE).supported).toBe(false);
  });

  it('refuses a caret major below the floor', () => {
    expect(angularSupport(withAngular('^19', '19.0.0'), PEER_RANGE).supported).toBe(false);
  });

  it('reads the installed version behind a specifier that carries none', () => {
    expect(angularSupport(withAngular('catalog:', '21.2.5'), PEER_RANGE)).toEqual({
      supported: true,
      floor: '21.2',
      declared: 'catalog:',
    });
  });

  it('names a devDependency-only @angular/core', () => {
    const facts = createFacts({
      angularRange: '^21.2.0',
      manifest: parseManifest(JSON.stringify({ devDependencies: { '@angular/core': '^21.2.0' } })),
    });
    expect(angularSupport(facts, PEER_RANGE).declared).toBe('^21.2.0');
  });

  it.each(['catalog:', 'workspace:*', 'latest'])('cannot tell for %s without an installed package', (range) => {
    expect(angularSupport(withAngular(range, undefined), PEER_RANGE)).toEqual({
      supported: undefined,
      floor: '21.2',
      declared: range,
    });
  });

  it('cannot tell for an app without an @angular/core dependency', () => {
    expect(angularSupport(withAngular(undefined), PEER_RANGE)).toEqual({
      supported: undefined,
      floor: '21.2',
      declared: 'no @angular/core dependency',
    });
  });
});

describe('preflightItems', () => {
  it('lists the Angular version, the project and the git state in that order', () => {
    expect(preflightItems({ facts: createFacts(), peerRange: PEER_RANGE, git: 'clean' })).toEqual([
      { label: 'Angular ^21.2.0', status: 'ok', detail: 'cngx needs 21.2 or newer' },
      { label: 'Project fixture-app', status: 'ok', detail: 'fresh app' },
      {
        label: 'Git working tree clean',
        status: 'ok',
        detail: 'review the cngx changes with git diff afterwards',
      },
    ]);
  });

  it('warns on the project line when it picked one of several applications', () => {
    const [, project] = preflightItems({
      facts: createFacts({ applications: ['fixture-app', 'admin-app', 'docs-app'] }),
      peerRange: PEER_RANGE,
      git: 'clean',
    });

    expect(project).toEqual({
      label: 'Project fixture-app (picked; pass --project to choose)',
      status: 'warn',
      detail: 'fresh app; other applications: admin-app, docs-app',
    });
  });

  it('keeps the project line ok when --project named it or it is the only application', () => {
    const named = preflightItems({
      facts: createFacts({ applications: ['fixture-app', 'admin-app'] }),
      peerRange: PEER_RANGE,
      git: 'clean',
      projectFlag: 'fixture-app',
    })[1];
    const only = preflightItems({ facts: createFacts(), peerRange: PEER_RANGE, git: 'clean' })[1];

    expect(named).toEqual({ label: 'Project fixture-app', status: 'ok', detail: 'fresh app' });
    expect(only).toEqual(named);
  });

  it('keeps the fail of a missing build target when it also picked', () => {
    const [, project] = preflightItems({
      facts: createFacts({ applications: ['fixture-app', 'admin-app'], hasBuildTarget: false }),
      peerRange: PEER_RANGE,
      git: 'clean',
    });

    expect(project?.status).toBe('fail');
    expect(project?.label).toBe('Project fixture-app (picked; pass --project to choose)');
  });

  it('fails the Angular line for an unsupported version', () => {
    const [angular] = preflightItems({
      facts: withAngular('^20.3.0'),
      peerRange: PEER_RANGE,
      git: 'clean',
    });

    expect(angular).toEqual({
      label: 'Angular ^20.3.0',
      status: 'fail',
      detail: 'cngx needs 21.2 or newer',
    });
  });

  it('warns on the Angular line when no version can be read', () => {
    const [angular] = preflightItems({
      facts: withAngular('catalog:', undefined),
      peerRange: PEER_RANGE,
      git: 'clean',
    });

    expect(angular).toEqual({
      label: 'Angular catalog:',
      status: 'warn',
      detail: 'no version to read from it and no installed @angular/core; cngx needs 21.2 or newer',
    });
  });

  it('labels the Angular line with the installed version it read', () => {
    const [angular] = preflightItems({
      facts: withAngular('catalog:', '19.2.3', 'installed'),
      peerRange: PEER_RANGE,
      git: 'clean',
    });

    expect(angular).toEqual({
      label: 'Angular 19.2.3 (installed, declares catalog:)',
      status: 'fail',
      detail: 'cngx needs 21.2 or newer',
    });
  });

  it('says when the installed @angular/core cannot be read', () => {
    const [unreadable, fallback] = [undefined, '21.2.0'].map(
      (version) =>
        preflightItems({
          facts: withAngular(version === undefined ? 'catalog:' : '^21.2.0', version, 'unreadable'),
          peerRange: PEER_RANGE,
          git: 'clean',
        })[0],
    );

    expect(unreadable).toEqual({
      label: 'Angular catalog:',
      status: 'warn',
      detail:
        'node_modules/@angular/core/package.json cannot be read and the specifier carries no version; cngx needs 21.2 or newer',
    });
    expect(fallback).toEqual({
      label: 'Angular ^21.2.0',
      status: 'ok',
      detail: 'read from the declared range, node_modules/@angular/core/package.json cannot be read; cngx needs 21.2 or newer',
    });
  });

  it('fails the project line for a project without a build target', () => {
    const [, project] = preflightItems({
      facts: createFacts({ hasBuildTarget: false }),
      peerRange: PEER_RANGE,
      git: 'clean',
    });

    expect(project).toEqual({
      label: 'Project fixture-app',
      status: 'fail',
      detail: 'no build target in angular.json; cngx wires styles and providers through it',
    });
  });

  it('names an existing app', () => {
    const [, project] = preflightItems({
      facts: createFacts({ maturity: 'existing' }),
      peerRange: PEER_RANGE,
      git: 'clean',
    });

    expect(project).toEqual({ label: 'Project fixture-app', status: 'ok', detail: 'existing app' });
  });

  it('reads the package install ng add ran first as a clean tree', () => {
    const [, , git] = preflightItems({
      facts: createFacts(),
      peerRange: PEER_RANGE,
      git: 'install-only',
    });

    expect(git).toEqual({
      label: 'Git working tree clean apart from the package install of ng add',
      status: 'ok',
      detail: 'review the cngx changes with git diff afterwards',
    });
  });

  it('fails on a listed stylesheet that is missing on disk and lists nothing when every one exists', () => {
    const items = (missing: readonly string[]) =>
      preflightItems({ facts: createFacts({ missingStyleEntries: missing }), peerRange: PEER_RANGE, git: 'clean' });

    expect(items(['src/missing.css', 'src/gone.scss']).find((item) => item.label.startsWith('Stylesheet'))).toEqual({
      label: 'Stylesheets src/missing.css, src/gone.scss',
      status: 'fail',
      detail: 'listed under styles in angular.json but missing on disk',
    });
    expect(items([]).some((item) => item.label.startsWith('Stylesheet'))).toBe(false);
  });

  it('warns about uncommitted changes and a missing repository', () => {
    const git = (state: GitState) =>
      preflightItems({ facts: createFacts(), peerRange: PEER_RANGE, git: state })[2];

    expect(git('dirty')).toEqual({
      label: 'Git working tree has uncommitted changes',
      status: 'warn',
      detail: 'the cngx changes will mix with them in git diff',
    });
    expect(git('no-repository')).toEqual({
      label: 'No git repository',
      status: 'warn',
      detail: 'there is no diff to review the cngx changes against',
    });
    expect(git('no-git')).toEqual({
      label: 'Git is not installed',
      status: 'warn',
      detail: 'there is no diff to review the cngx changes against',
    });
    expect(git('unknown')).toEqual({
      label: 'Git state unreadable',
      status: 'warn',
      detail: 'git status failed in this folder; review the cngx changes by hand',
    });
  });
});
