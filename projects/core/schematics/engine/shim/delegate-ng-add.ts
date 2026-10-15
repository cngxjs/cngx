import {
  chain,
  externalSchematic,
  type Rule,
  type SchematicContext,
  SchematicsException,
  type Tree,
} from '@angular-devkit/schematics';
import { NodePackageInstallTask, RunSchematicTask } from '@angular-devkit/schematics/tasks';

import { addLockstepDependency } from '../manifest/lockstep';
import { readOwnVersion } from '../manifest/manifest';
import { type NgAddOptions } from '../options';
import { errorMessage } from '../plan/text';

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
    throw new SchematicsException(
      `${CORE} is installed but its ng-add collection failed to load: ${errorMessage(error)}`,
    );
  }
}

/**
 * The `ng-add` of every @cngx package but core: each answers `ng add` with
 * the same onboarding, owned by @cngx/core. When the package manager already
 * placed core (npm installs peers), the shim delegates in the same run;
 * otherwise it installs core first and runs its ng-add as a follow-up task.
 * A shim re-exports this as its `ngAdd` factory; the CLI passes only the
 * options, so `bundleDir` is the shim bundle's own folder.
 */
export function delegateNgAdd(options: NgAddOptions, bundleDir: string = __dirname): Rule {
  return (_tree: Tree, context: SchematicContext) => {
    const addCore = addLockstepDependency(CORE, readOwnVersion(bundleDir));

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
