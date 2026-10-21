import { chain, type Rule, type Tree } from '@angular-devkit/schematics';
import { addDependency as addAngularDependency } from '@schematics/angular/utility';

import { newlineOf } from '../plan/text';

const MANIFEST = 'package.json';

/**
 * `addDependency` from `@schematics/angular/utility`, keeping the line endings
 * and the trailing newline of package.json. Angular rewrites the manifest
 * through `JSON.stringify`, which writes LF and drops the newline npm and
 * every editor leave behind; the file's own newline comes back, and the
 * trailing one only when the file had one.
 */
export function addDependency(...args: Parameters<typeof addAngularDependency>): Rule {
  return (tree: Tree) => {
    const original = tree.exists(MANIFEST) ? tree.readText(MANIFEST) : undefined;
    return chain([
      addAngularDependency(...args),
      (after: Tree) => {
        if (original === undefined || !after.exists(MANIFEST)) {
          return;
        }
        const content = after.readText(MANIFEST);
        const newline = newlineOf(original);
        const ended = original.endsWith('\n') && !content.endsWith('\n') ? `${content}\n` : content;
        const restored = newline === '\n' ? ended : ended.replace(/\r?\n/g, newline);
        if (restored !== content) {
          after.overwrite(MANIFEST, restored);
        }
      },
    ]);
  };
}
