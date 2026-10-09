import { readFileSync } from 'node:fs';
import { join } from 'node:path';

import { chain, type Rule, type SchematicContext, type Tree } from '@angular-devkit/schematics';
import { NodePackageInstallTask, RunSchematicTask } from '@angular-devkit/schematics/tasks';
import { addDependency, InstallBehavior } from '@schematics/angular/utility';

export interface NgAddOptions {
  readonly project?: string;
  readonly preset?: 'minimal' | 'recommended' | 'full';
}

/**
 * The bundle sits at `dist/core/schematics/ng-add/index.js`; the package
 * manifest two folders up carries the release version once publish.mjs
 * has stamped it.
 */
function readOwnVersion(): string {
  const manifest = JSON.parse(readFileSync(join(__dirname, '..', '..', 'package.json'), 'utf8')) as {
    readonly version: string;
  };
  return manifest.version;
}

/**
 * Stage one. Plans the dependency changes, installs once, then chains the
 * setup stage so detection and prompts run against the installed packages.
 */
export function ngAdd(options: NgAddOptions): Rule {
  return (_tree: Tree, context: SchematicContext) => {
    const version = readOwnVersion();
    context.logger.info(`cngx ng-add: stage one (version ${version})`);

    return chain([
      addDependency('@cngx/utils', version, { install: InstallBehavior.None }),
      (_innerTree: Tree, innerContext: SchematicContext) => {
        const installTask = innerContext.addTask(new NodePackageInstallTask());
        innerContext.addTask(new RunSchematicTask('ng-add-setup', { ...options }), [installTask]);
      },
    ]);
  };
}
