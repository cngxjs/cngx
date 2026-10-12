import { type DirEntry, noop, type Rule, type SchematicContext, type Tree } from '@angular-devkit/schematics';

import { isEmptyRenameTable, type RenameTable, renameInSource, renameInTemplate } from '../migrate/rename-table';

// Installed packages, build output and tool state are not the app's source.
const SKIPPED_DIRS = new Set(['node_modules', 'dist', 'out-tsc', 'coverage', '.angular', '.git', '.cngx']);

function sourceFiles(dir: DirEntry): readonly string[] {
  const files = dir.subfiles
    .filter((file) => file.endsWith('.html') || (file.endsWith('.ts') && !file.endsWith('.d.ts')))
    .map((file) => dir.file(file)?.path.slice(1))
    .filter((path): path is string => path !== undefined);
  const nested = dir.subdirs.filter((name) => !SKIPPED_DIRS.has(name)).flatMap((name) => sourceFiles(dir.dir(name)));
  return [...files, ...nested];
}

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

/**
 * Maps a rename table over every `.ts` and `.html` file of the workspace.
 * The transforms in `engine/migrate` are pure; this Rule is the only place
 * they touch the tree. A file that does not parse is left as it is and
 * named, so one broken template never stops `ng update`.
 */
export function applyRenameTable(table: RenameTable): Rule {
  if (isEmptyRenameTable(table)) {
    return noop();
  }
  const inSource = renameInSource(table);
  const inTemplate = renameInTemplate(table);
  return (tree: Tree, context: SchematicContext) => {
    for (const path of sourceFiles(tree.getDir('/'))) {
      const rename = path.endsWith('.html') ? inTemplate : inSource;
      try {
        const content = tree.readText(path);
        const next = rename(content);
        if (next !== content) {
          tree.overwrite(path, next);
          context.logger.info(`Renamed cngx APIs in ${path}`);
        }
      } catch (error) {
        context.logger.warn(`Skipped ${path}: ${errorMessage(error)}`);
      }
    }
  };
}
