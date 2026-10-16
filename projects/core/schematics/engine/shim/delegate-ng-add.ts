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
import { readOwnName, readOwnVersion } from '../manifest/manifest';
import { CNGX_LIBS, type CngxLib, type NgAddFlags, parseNgAddOptions } from '../options';
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

/** The lib id of a package name; `@cngx/themes` has none, the theme answer decides it. */
function libOf(name: string): CngxLib | undefined {
  return CNGX_LIBS.find((lib) => `@cngx/${lib}` === name);
}

/**
 * The flags with the shim's own lib folded into a given `libs`, in package
 * order. Without the flag, core asks or takes every lib, and it reads the
 * shim's package as declared because the shim pinned it first.
 */
function withOwnLib(options: NgAddFlags, ownName: string): NgAddFlags {
  const own = libOf(ownName);
  const flagged = parseNgAddOptions({ libs: options.libs }).libs;
  if (flagged === undefined || own === undefined) {
    return options;
  }
  const libs = new Set<CngxLib>([...flagged, own]);
  return { ...options, libs: CNGX_LIBS.filter((lib) => libs.has(lib)) };
}

/**
 * The `ng-add` of every @cngx package but core: each answers `ng add` with
 * the same onboarding, owned by @cngx/core. When the package manager already
 * placed core (npm installs peers), the shim delegates in the same run;
 * otherwise it installs core first and runs its ng-add as a follow-up task.
 * A shim re-exports this as its `ngAdd` factory; the CLI passes only the
 * options, so `bundleDir` is the shim bundle's own folder. The shim pins its
 * own package beside core, so `ng add @cngx/<lib>` always installs and
 * records `<lib>`; the other flags go to core as the CLI handed them over.
 */
export function delegateNgAdd(options: NgAddFlags, bundleDir: string = __dirname): Rule {
  return (_tree: Tree, context: SchematicContext) => {
    const version = readOwnVersion(bundleDir);
    const ownName = readOwnName(bundleDir);
    const pins = chain([addLockstepDependency(CORE, version), addLockstepDependency(ownName, version)]);
    const forwarded = withOwnLib(options, ownName);

    if (isCoreResolvable(context)) {
      return chain([pins, externalSchematic(CORE, 'ng-add', forwarded)]);
    }

    context.logger.info(`${CORE} is not installed yet; installing it before its ng-add runs.`);
    return chain([
      pins,
      (_innerTree: Tree, innerContext: SchematicContext) => {
        const installTask = innerContext.addTask(new NodePackageInstallTask());
        innerContext.addTask(new RunSchematicTask(CORE, 'ng-add', { ...forwarded }), [installTask]);
      },
    ]);
  };
}
