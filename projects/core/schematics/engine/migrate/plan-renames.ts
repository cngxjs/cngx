import { type Tree } from '../fs/tree';
import { listFiles } from '../fs/walk';
import { type Change, createNote, type Provenance, type StepResult } from '../plan/change';
import { errorMessage } from '../plan/text';
import {
  createSourceRenamer,
  createTemplateRenamer,
  isEmptyRenameTable,
  type RenameResult,
  type RenameTable,
} from './rename-table';

// Installed packages, build output and tool state are not the app's source.
const SKIPPED_DIRS = new Set([
  'node_modules',
  'dist',
  'out-tsc',
  'coverage',
  '.angular',
  '.git',
  '.cngx',
]);

function isSourceFile(path: string): boolean {
  return path.endsWith('.html') || (path.endsWith('.ts') && !path.endsWith('.d.ts'));
}

function filePlan(
  path: string,
  content: string,
  rename: (content: string) => RenameResult,
  provenance: Provenance,
): readonly Change[] {
  const label = `Rename cngx APIs in ${path}`;
  let result: RenameResult;
  try {
    result = rename(content);
  } catch (error) {
    return [
      createNote({
        id: `rename:${path}`,
        label,
        reason: `does not parse, rename it by hand: ${errorMessage(error)}`,
        provenance,
      }),
    ];
  }
  const edit: readonly Change[] =
    result.content === content
      ? []
      : [
          {
            kind: 'edit-file',
            id: `rename:${path}`,
            label,
            reason: 'renamed in this cngx release',
            provenance,
            path,
            edit: (current) => rename(current).content,
          },
        ];
  const manual: readonly Change[] = result.manual.map((reason, index) =>
    createNote({
      id: `rename-manual:${path}:${index}`,
      label: `Review ${path}`,
      reason,
      provenance,
    }),
  );
  return [...edit, ...manual];
}

/**
 * The rename table as planned changes: one edit per `.ts` or `.html` file
 * of the workspace it changes, and a note for every spot it cannot reach
 * (a template that does not parse, a dynamic import, a microsyntax key).
 * It reads the tree and never writes it; `applyChangePlan` applies the edits.
 */
export function planRenames(table: RenameTable, tree: Tree, provenance: Provenance): StepResult {
  if (isEmptyRenameTable(table)) {
    return { changes: [], skipped: [] };
  }
  const inSource = createSourceRenamer(table);
  const inTemplate = createTemplateRenamer(table);
  const files = listFiles(tree, '/', { skipDirs: SKIPPED_DIRS, accept: isSourceFile });
  const changes = files.flatMap((path) =>
    filePlan(path, tree.readText(path), path.endsWith('.html') ? inTemplate : inSource, provenance),
  );
  return { changes, skipped: [] };
}
