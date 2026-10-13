import { chain, type Rule, type Tree } from '@angular-devkit/schematics';
import { addDependency as addAngularDependency } from '@schematics/angular/utility';

const MANIFEST = 'package.json';

/**
 * `addDependency` from `@schematics/angular/utility`, keeping the trailing
 * newline of package.json. Angular rewrites the manifest through
 * `JSON.stringify`, which drops the newline npm and every editor leave behind;
 * it is put back only when the file had one.
 */
export function addDependency(...args: Parameters<typeof addAngularDependency>): Rule {
  return (tree: Tree) => {
    const ended = tree.exists(MANIFEST) && tree.readText(MANIFEST).endsWith('\n');
    return chain([
      addAngularDependency(...args),
      (after: Tree) => {
        if (!ended || !after.exists(MANIFEST)) {
          return;
        }
        const content = after.readText(MANIFEST);
        if (!content.endsWith('\n')) {
          after.overwrite(MANIFEST, `${content}\n`);
        }
      },
    ]);
  };
}
