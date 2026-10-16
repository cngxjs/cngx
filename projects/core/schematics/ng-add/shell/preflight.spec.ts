import { describe, expect, it } from 'vitest';

import { parseManifest } from '../../engine';
import { createFacts } from '../../testing/onboarding';
import { angularSupport, preflightItems } from './preflight';

const PEER_RANGE = '^21.2.0';

const withAngular = (range: string | undefined, angularVersion = range?.replace(/^\D*/, '')) =>
  createFacts({
    angularVersion,
    angularRange: range,
    manifest: parseManifest(
      JSON.stringify({ dependencies: range === undefined ? {} : { '@angular/core': range } }),
    ),
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

  it('warns about uncommitted changes and a missing repository', () => {
    const git = (state: 'dirty' | 'unknown') =>
      preflightItems({ facts: createFacts(), peerRange: PEER_RANGE, git: state })[2];

    expect(git('dirty')).toEqual({
      label: 'Git working tree has uncommitted changes',
      status: 'warn',
      detail: 'the cngx changes will mix with them in git diff',
    });
    expect(git('unknown')).toEqual({
      label: 'No git repository',
      status: 'warn',
      detail: 'there is no diff to review the cngx changes against',
    });
  });
});
