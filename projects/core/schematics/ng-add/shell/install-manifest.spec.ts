import { describe, expect, it } from 'vitest';

import { createMemoryTree } from '../../engine';
import { createAnswers, createFacts, VERSIONS } from '../../testing/onboarding';
import { planManifest } from '../steps/manifest';
import { readInstallManifest, readManifestOf, unreadableCopyPath } from './install-manifest';

function firstRun(): unknown {
  const [change] = planManifest(
    createFacts(),
    createAnswers(),
    VERSIONS,
    { changes: [], skipped: [], warnings: [] },
    undefined,
    '2026-10-11T10:00:00.000Z',
  ).changes;
  if (change?.kind !== 'write-json') {
    throw new Error('no manifest write planned');
  }
  return {
    schemaVersion: 2,
    projects: Object.fromEntries(
      change.entries.filter(([path]) => path[0] === 'projects').map(([path, value]) => [path[1], value]),
    ),
  };
}

describe('readInstallManifest', () => {
  it('reads the install manifest from the tree', () => {
    const tree = createMemoryTree({ '.cngx/install.json': JSON.stringify(firstRun()) });

    expect(readInstallManifest(tree)).toEqual({ state: 'read', manifest: firstRun() });
  });

  it('reads a tree without one as absent', () => {
    expect(readInstallManifest(createMemoryTree())).toEqual({ state: 'absent' });
  });

  it.each(['[]', 'not json', '{ "schemaVersion": 1 }', '{ "schemaVersion": 2, "projects": { "app": {} } }'])(
    'reads a present file cngx cannot parse as unreadable: %s',
    (content) => {
      expect(readInstallManifest(createMemoryTree({ '.cngx/install.json': content }))).toEqual({
        state: 'unreadable',
        content,
      });
    },
  );
});

describe('readManifestOf', () => {
  it('hands over only a read manifest', () => {
    const tree = createMemoryTree({ '.cngx/install.json': JSON.stringify(firstRun()) });

    expect(readManifestOf(readInstallManifest(tree))).toEqual(firstRun());
    expect(readManifestOf({ state: 'unreadable', content: 'x' })).toBeUndefined();
    expect(readManifestOf({ state: 'absent' })).toBeUndefined();
  });
});

describe('unreadableCopyPath', () => {
  it('counts past every copy that exists', () => {
    const taken = new Set(['.cngx/install.json.unreadable', '.cngx/install.json.unreadable-2']);

    expect(unreadableCopyPath(() => false)).toBe('.cngx/install.json.unreadable');
    expect(unreadableCopyPath((path) => taken.has(path))).toBe('.cngx/install.json.unreadable-3');
  });
});
