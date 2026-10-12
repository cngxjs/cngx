import { describe, expect, it } from 'vitest';

import { createMemoryTree } from '../fs/memory-tree';
import { type EditFile } from '../plan/change';
import { EMPTY_RENAME_TABLE, type RenameTable } from './rename-table';
import { planRenames } from './plan-renames';

const PROVENANCE = { source: 'ng-update', version: '0.2.0' } as const;

const TABLE: RenameTable = {
  ...EMPTY_RENAME_TABLE,
  classes: { CngxOldCard: 'CngxCard' },
  selectors: { 'cngx-old-card': 'cngx-card' },
};

const COMPONENT =
  "import { CngxOldCard } from '@cngx/common/card';\nexport const IMPORTS = [CngxOldCard];\n";

function edits(changes: readonly unknown[]): readonly EditFile[] {
  return changes.filter((change): change is EditFile => (change as EditFile).kind === 'edit-file');
}

describe('planRenames', () => {
  it('plans one edit per TypeScript source and HTML template that changes', () => {
    const tree = createMemoryTree({
      'src/app/app.ts': COMPONENT,
      'src/app/app.html': '<cngx-old-card></cngx-old-card>\n',
      'src/app/other.ts': 'export const x = 1;\n',
    });

    const result = planRenames(TABLE, tree, PROVENANCE);
    const planned = edits(result.changes);

    expect(planned.map((change) => [change.id, change.label])).toEqual([
      ['rename:src/app/app.html', 'Rename cngx APIs in src/app/app.html'],
      ['rename:src/app/app.ts', 'Rename cngx APIs in src/app/app.ts'],
    ]);
    expect(planned[1]?.edit(COMPONENT)).toBe(
      "import { CngxCard } from '@cngx/common/card';\nexport const IMPORTS = [CngxCard];\n",
    );
    expect(result.skipped).toEqual([]);
  });

  it('skips node_modules, build output and declaration files', () => {
    const tree = createMemoryTree({
      'node_modules/lib/index.ts': COMPONENT,
      'dist/app/main.ts': COMPONENT,
      'src/typings.d.ts': COMPONENT,
    });

    expect(planRenames(TABLE, tree, PROVENANCE).changes).toEqual([]);
  });

  it('names a template that does not parse instead of failing', () => {
    const tree = createMemoryTree({
      'src/app/broken.html': '<cngx-old-card>@if (</cngx-old-card>',
    });

    const [note] = planRenames(TABLE, tree, PROVENANCE).changes;

    expect(note).toMatchObject({
      kind: 'note',
      id: 'rename:src/app/broken.html',
      label: 'Rename cngx APIs in src/app/broken.html',
    });
    expect(note?.reason).toMatch(/^does not parse, rename it by hand: Cannot parse/);
  });

  it('names every spot the renamer cannot reach', () => {
    const tree = createMemoryTree({
      'src/app/lazy.ts':
        "export const card = () => import('@cngx/common/card').then((m) => m.CngxOldCard);\n",
    });

    expect(planRenames(TABLE, tree, PROVENANCE).changes).toEqual([
      {
        kind: 'note',
        id: 'rename-manual:src/app/lazy.ts:0',
        label: 'Review src/app/lazy.ts',
        reason: "dynamic import of '@cngx/common/card': rename its members by hand",
        provenance: PROVENANCE,
      },
    ]);
  });

  it('plans nothing for the empty table and never writes the tree', () => {
    const tree = createMemoryTree({ 'src/app/app.ts': COMPONENT });

    expect(planRenames(EMPTY_RENAME_TABLE, tree, PROVENANCE)).toEqual({ changes: [], skipped: [] });
    planRenames(TABLE, tree, PROVENANCE);
    expect(tree.actions).toEqual([]);
  });
});
