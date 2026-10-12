import { describe, expect, it } from 'vitest';

import { createMemoryTree } from '../../engine';
import { createAnswers, createFacts, VERSIONS } from '../../testing/onboarding';
import { planManifest } from '../steps/manifest';
import { readInstallManifest } from './install-manifest';

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
  return Object.fromEntries(change.entries.map(([path, value]) => [path[0], value]));
}

describe('readInstallManifest', () => {
  it('reads the install manifest from the tree', () => {
    const tree = createMemoryTree({ '.cngx/install.json': JSON.stringify(firstRun()) });

    expect(readInstallManifest(tree)).toEqual(firstRun());
  });

  it('reads no manifest from a tree without one or with a foreign file', () => {
    expect(readInstallManifest(createMemoryTree())).toBeUndefined();
    expect(readInstallManifest(createMemoryTree({ '.cngx/install.json': '[]' }))).toBeUndefined();
  });
});
