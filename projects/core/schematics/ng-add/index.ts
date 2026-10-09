import { chain, type Rule, type SchematicContext, type Tree } from '@angular-devkit/schematics';
import { NodePackageInstallTask, RunSchematicTask } from '@angular-devkit/schematics/tasks';

import { addLockstepDependency } from '../shared/lockstep';
import { type NgAddOptions, readOwnVersion } from '../shared/manifest';

/**
 * Stage one. Plans the dependency changes, installs once, then chains the
 * setup stage so detection and prompts run against the installed packages.
 */
export function ngAdd(options: NgAddOptions): Rule {
  return (_tree: Tree, context: SchematicContext) => {
    const version = readOwnVersion(__dirname);
    context.logger.info(`cngx ng-add: stage one (version ${version})`);

    return chain([
      addLockstepDependency('@cngx/utils', version),
      (_innerTree: Tree, innerContext: SchematicContext) => {
        const installTask = innerContext.addTask(new NodePackageInstallTask());
        innerContext.addTask(new RunSchematicTask('ng-add-setup', { ...options }), [installTask]);
      },
    ]);
  };
}
