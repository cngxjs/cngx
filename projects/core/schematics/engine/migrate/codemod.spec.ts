import { describe, expect, it } from 'vitest';

import { createMemoryTree } from '../fs/memory-tree';
import { type Change } from '../plan/change';
import { type Codemod, planCodemods } from './codemod';

interface Manifest {
  readonly theme: string;
}

const PROVENANCE = { source: 'migration', version: '0.2.0' };

function note(id: string): Change {
  return { kind: 'note', id, label: id, reason: 'spec', provenance: PROVENANCE };
}

const READS_CONFIG: Codemod<Manifest> = {
  id: 'reads-config',
  plan: (tree) => ({ changes: tree.exists('src/app/app.config.ts') ? [note('config')] : [], skipped: [] }),
};

const READS_MANIFEST: Codemod<Manifest> = {
  id: 'reads-manifest',
  plan: (_tree, manifest) => ({
    changes: [],
    skipped: [{ id: `theme:${manifest.theme}`, label: 'Theme', reason: 'already migrated' }],
  }),
};

describe('planCodemods', () => {
  it('concatenates the codemod results in list order', () => {
    const tree = createMemoryTree({ 'src/app/app.config.ts': 'export const appConfig = {};\n' });

    const plan = planCodemods([READS_CONFIG, READS_MANIFEST], tree, { theme: 'cngx' });

    expect(plan.changes.map((change) => change.id)).toEqual(['config']);
    expect(plan.skipped.map((step) => step.id)).toEqual(['theme:cngx']);
    expect(plan.warnings).toEqual([]);
  });

  it('plans nothing without codemods', () => {
    expect(planCodemods([], createMemoryTree(), { theme: 'cngx' })).toEqual({ changes: [], skipped: [], warnings: [] });
  });

  it('never writes the tree', () => {
    const tree = createMemoryTree({ 'src/app/app.config.ts': 'export const appConfig = {};\n' });

    planCodemods([READS_CONFIG, READS_MANIFEST], tree, { theme: 'cngx' });

    expect(tree.actions).toEqual([]);
  });
});
