// A one-entry migrations collection in memory, shaped like the source one
// (`projects/core/schematics/migrations` plus its fixture pairs), so the
// per-entry rules of migrations-well-formed run even while the real
// collection holds no hand-written entry.

export const SELF_TEST_ENTRIES = {
  'migration-v0.2.0': {
    version: '0.2.0',
    description: 'Renames cngxTrigger to cngxOpener.',
    factory: './0.2.0/index#migrate',
  },
};

export const SELF_TEST_FILES = {
  '0.2.0/index.ts': `import { createMigration, EMPTY_RENAME_TABLE } from '../migration';

export function migrate() {
  return createMigration({ renames: EMPTY_RENAME_TABLE, bundleDir: __dirname });
}
`,
  '0.2.0/index.spec.ts': `import { createMemoryTree } from '../../engine';
import { readMigrationFixture, readTree, runRule } from '../../testing/run-schematic';
import { migrate } from './index';

it('renames the trigger', async () => {
  const { before, after } = readMigrationFixture('0.2.0');
  const { tree } = await runRule(migrate(), createMemoryTree(before));
  expect(readTree(tree)).toEqual(after);
});
`,
};

export const SELF_TEST_FIXTURES = {
  '0.2.0/before': { 'src/app/app.html': '<button cngxTrigger></button>\n' },
  '0.2.0/after': { 'src/app/app.html': '<button cngxOpener></button>\n' },
};
