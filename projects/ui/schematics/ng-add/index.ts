import {
  chain,
  externalSchematic,
  type Rule,
  type SchematicContext,
  SchematicsException,
  type Tree,
} from '@angular-devkit/schematics';
import { NodePackageInstallTask, RunSchematicTask } from '@angular-devkit/schematics/tasks';

import { addLockstepDependency, type NgAddOptions, readOwnVersion } from '../../../core/schematics/engine';

const CORE = '@cngx/core';

/**
 * Matched by name, not `instanceof`: the CLI and the app can each carry their
 * own copy of `@angular-devkit/schematics`, and the engine throws from the
 * CLI's copy.
 */
function isUnresolvedCollection(error: unknown): boolean {
  return error instanceof Error && error.constructor.name === 'CollectionCannotBeResolvedException';
}

/**
 * `false` only when the package manager has not placed core yet. Any other
 * failure (a broken or incompatible core install) is reported, not retried.
 */
function isCoreResolvable(context: SchematicContext): boolean {
  try {
    context.engine.createCollection(CORE);
    return true;
  } catch (error: unknown) {
    if (isUnresolvedCollection(error)) {
      return false;
    }
    const reason = error instanceof Error ? error.message : String(error);
    throw new SchematicsException(`${CORE} is installed but its ng-add collection failed to load: ${reason}`);
  }
}

/**
 * Every @cngx package answers `ng add` with the same onboarding, owned by
 * @cngx/core. When the package manager already placed core (npm installs
 * peers), the shim delegates in the same run; otherwise it installs core
 * first and runs its ng-add as a follow-up task.
 */
export function ngAdd(options: NgAddOptions): Rule {
  return (_tree: Tree, context: SchematicContext) => {
    const addCore = addLockstepDependency(CORE, readOwnVersion(__dirname));

    if (isCoreResolvable(context)) {
      return chain([addCore, externalSchematic(CORE, 'ng-add', options)]);
    }

    context.logger.info(`${CORE} is not installed yet; installing it before its ng-add runs.`);
    return chain([
      addCore,
      (_innerTree: Tree, innerContext: SchematicContext) => {
        const installTask = innerContext.addTask(new NodePackageInstallTask());
        innerContext.addTask(new RunSchematicTask(CORE, 'ng-add', { ...options }), [installTask]);
      },
    ]);
  };
}
