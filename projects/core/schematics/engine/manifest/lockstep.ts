import { type Rule, type SchematicContext, type Tree } from '@angular-devkit/schematics';
import { ExistingBehavior, InstallBehavior } from '@schematics/angular/utility';
import { JSONFile } from '@schematics/angular/utility/json-file';

import { addDependency } from './add-dependency';
import { declaredRange, parseManifest } from './manifest';

const MANIFEST = 'package.json';

/**
 * Pins `name` to the exact release being added. Every `@cngx/*` package peers
 * on the others at one version, so an older pin the app already declares is
 * replaced, never kept. A plan step names the replacement itself (`replaces
 * ^0.0.9`); a caller with no plan for the pin, the ng-add shim, passes
 * `announce` to have it logged. The caller schedules the install.
 */
export function addLockstepDependency(name: string, version: string, announce = false): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const existing = declaredRange(parseManifest(tree.readText(MANIFEST)), name);
    if (existing !== undefined && existing !== version) {
      if (announce) {
        context.logger.info(`Replacing ${name}@${existing} with ${version} so every @cngx package stays on one version.`);
      }
      // addDependency warns about every replaced specifier on its own and
      // never looks at devDependencies; with the old entry gone from both it
      // only adds, so the replacement is named once and no stale pin stays.
      const manifest = new JSONFile(tree, MANIFEST);
      manifest.remove(['dependencies', name]);
      manifest.remove(['devDependencies', name]);
    }
    return addDependency(name, version, { install: InstallBehavior.None, existing: ExistingBehavior.Replace });
  };
}
