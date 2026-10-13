import { chain, type Rule, type SchematicContext, type Tree } from '@angular-devkit/schematics';
import { addDependency, ExistingBehavior, InstallBehavior } from '@schematics/angular/utility';
import { JSONFile } from '@schematics/angular/utility/json-file';

import { declaredRange, parseManifest } from './manifest';

const MANIFEST = 'package.json';

/**
 * Runs `rule` and puts back the trailing newline of package.json when the
 * file had one before. `addDependency` rewrites the manifest through
 * `JSON.stringify`, which drops the newline npm and every editor leave behind.
 */
export function keepManifestNewline(rule: Rule): Rule {
  return (tree: Tree) => {
    const ended = tree.exists(MANIFEST) && tree.readText(MANIFEST).endsWith('\n');
    return chain([
      rule,
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

/**
 * Pins `name` to the exact release being added. Every `@cngx/*` package peers
 * on the others at one version, so an older pin the app already declares is
 * replaced, never kept, and the replacement is logged. The caller schedules
 * the install.
 */
export function addLockstepDependency(name: string, version: string): Rule {
  return keepManifestNewline((tree: Tree, context: SchematicContext) => {
    const existing = declaredRange(parseManifest(tree.readText(MANIFEST)), name);
    if (existing !== undefined && existing !== version) {
      context.logger.info(`Replacing ${name}@${existing} with ${version} so every @cngx package stays on one version.`);
      // addDependency warns about every replaced specifier on its own and
      // never looks at devDependencies; with the old entry gone from both it
      // only adds, so the replacement is announced once and no stale pin stays.
      const manifest = new JSONFile(tree, MANIFEST);
      manifest.remove(['dependencies', name]);
      manifest.remove(['devDependencies', name]);
    }
    return addDependency(name, version, { install: InstallBehavior.None, existing: ExistingBehavior.Replace });
  });
}
