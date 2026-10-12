import { type Tree } from '@angular-devkit/schematics';
import { describe, expect, it } from 'vitest';

import { runRule } from '../../testing/run-schematic';
import { createMemoryTree } from '../fs/memory-tree';
import { EMPTY_RENAME_TABLE, type RenameTable } from '../migrate/rename-table';
import { applyRenameTable } from './rename';

const TABLE: RenameTable = {
  ...EMPTY_RENAME_TABLE,
  classes: { CngxOldCard: 'CngxCard' },
  selectors: { 'cngx-old-card': 'cngx-card' },
};

const COMPONENT = "import { CngxOldCard } from '@cngx/common/card';\nexport const IMPORTS = [CngxOldCard];\n";

async function apply(table: RenameTable, tree: Tree): Promise<{ tree: Tree; logs: readonly string[] }> {
  return runRule(applyRenameTable(table), tree);
}

describe('applyRenameTable', () => {
  it('renames in TypeScript sources and HTML templates', async () => {
    const tree = createMemoryTree({
      'src/app/app.ts': COMPONENT,
      'src/app/app.html': '<cngx-old-card></cngx-old-card>\n',
    });

    const { tree: result, logs } = await apply(TABLE, tree);

    expect(result.readText('src/app/app.ts')).toBe(
      "import { CngxCard } from '@cngx/common/card';\nexport const IMPORTS = [CngxCard];\n",
    );
    expect(result.readText('src/app/app.html')).toBe('<cngx-card></cngx-card>\n');
    expect([...logs].sort()).toEqual(['Renamed cngx APIs in src/app/app.html', 'Renamed cngx APIs in src/app/app.ts']);
  });

  it('skips node_modules, build output and declaration files', async () => {
    const tree = createMemoryTree({
      'node_modules/lib/index.ts': COMPONENT,
      'dist/app/main.ts': COMPONENT,
      'src/typings.d.ts': COMPONENT,
    });

    const { tree: result } = await apply(TABLE, tree);

    expect(result.actions).toEqual([]);
  });

  it('warns and leaves a template alone that does not parse', async () => {
    const tree = createMemoryTree({ 'src/app/broken.html': '<cngx-old-card>@if (</cngx-old-card>' });

    const { tree: result, logs } = await apply(TABLE, tree);

    expect(result.readText('src/app/broken.html')).toBe('<cngx-old-card>@if (</cngx-old-card>');
    expect(logs).toEqual([expect.stringMatching(/^Skipped src\/app\/broken\.html: Cannot parse/)]);
  });

  it('touches no file for the empty table', async () => {
    const { tree: result, logs } = await apply(EMPTY_RENAME_TABLE, createMemoryTree({ 'src/app/app.ts': COMPONENT }));

    expect(result.actions).toEqual([]);
    expect(logs).toEqual([]);
  });
});
