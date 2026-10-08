import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { chain, externalSchematic, type Rule, type SchematicContext, type Tree } from '@angular-devkit/schematics';
import { NodePackageInstallTask, RunSchematicTask } from '@angular-devkit/schematics/tasks';
import { addDependency, ExistingBehavior, InstallBehavior } from '@schematics/angular/utility';

const CORE = '@cngx/core';

/**
 * The bundle sits at `dist/<lib>/schematics/ng-add/index.js`; the package
 * manifest two folders up carries the release version every @cngx package
 * shares.
 */
function readOwnVersion(): string {
  const manifest = JSON.parse(readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf8')) as {
    readonly version: string;
  };
  return manifest.version;
}

function isCoreResolvable(context: SchematicContext): boolean {
  try {
    context.engine.createCollection(CORE);
    return true;
  } catch {
    return false;
  }
}

/**
 * Every @cngx package answers `ng add` with the same onboarding, owned by
 * @cngx/core. When the package manager already placed core (npm installs
 * peers), the shim delegates in the same run; otherwise it installs core
 * first and runs its ng-add as a follow-up task.
 */
export function ngAdd(options: Readonly<Record<string, unknown>>): Rule {
  return (_tree: Tree, context: SchematicContext) => {
    const addCore = addDependency(CORE, readOwnVersion(), {
      install: InstallBehavior.None,
      existing: ExistingBehavior.Skip,
    });

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
