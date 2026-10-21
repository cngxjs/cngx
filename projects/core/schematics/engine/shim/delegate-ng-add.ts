import {
  chain,
  externalSchematic,
  type Rule,
  type SchematicContext,
  SchematicsException,
  type Tree,
} from '@angular-devkit/schematics';
import { NodePackageInstallTask, RunSchematicTask } from '@angular-devkit/schematics/tasks';

import { addAngularCompanion } from '../manifest/companion';
import { addLockstepDependency } from '../manifest/lockstep';
import { compareVersions, installedVersion, readOwnName, readOwnVersion } from '../manifest/manifest';
import { CNGX_LIBS, type CngxLib, type NgAddFlags, parseNgAddOptions } from '../options';
import { errorMessage } from '../plan/text';
import { type RenderLogger } from '../render/renderer';
import { createShellRendererOptions } from '../render/terminal';
import { isUnstampedVersion } from '../versions';

const CORE = '@cngx/core';
const CDK = '@angular/cdk';

// Every @cngx package but utils peers on @cngx/common, which peers on the CDK.
function needsCdk(ownName: string): boolean {
  return ownName !== '@cngx/utils';
}

/**
 * Matched by name, not `instanceof`: the CLI and the app can each carry their
 * own copy of `@angular-devkit/schematics`, and the engine throws from the
 * CLI's copy.
 */
function isUnresolvedCollection(error: unknown): boolean {
  return error instanceof Error && error.constructor.name === 'CollectionCannotBeResolvedException';
}

/**
 * Loads the installed core's collection. Only reached once the installed
 * version is known to be current, so any failure (a broken or incompatible
 * install) is reported, not retried.
 */
function loadCore(context: SchematicContext): void {
  try {
    context.engine.createCollection(CORE);
  } catch (error: unknown) {
    const reason = isUnresolvedCollection(error) ? 'it cannot be resolved' : errorMessage(error);
    throw new SchematicsException(`${CORE} is installed but its ng-add collection failed to load: ${reason}`);
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

// The CLI indents `context.logger`; on a terminal the shim's line goes to
// the stream at the left edge, like the output of core's renderer after it.
function shimLogger(context: SchematicContext): RenderLogger {
  const options = createShellRendererOptions(process.env, process.stdout, context.logger, false);
  return options.terminal ?? options.logger;
}

function installReason(installed: string | undefined, order: number | undefined, ownName: string, version: string): string {
  if (installed === undefined) {
    return `${CORE} is not installed yet; installing it before its ng-add runs.`;
  }
  if (order === undefined) {
    return `${CORE} ${installed} is installed with a version cngx cannot read; installing ${version} before its ng-add runs.`;
  }
  return `${CORE} ${installed} is installed, older than ${ownName} ${version}; installing ${version} before its ng-add runs.`;
}

/**
 * The `ng-add` of every @cngx package but core: each answers `ng add` with
 * the same onboarding, owned by @cngx/core. The shim reads the installed
 * core version from its package.json before it loads anything, because the
 * engine caches the first collection it creates for a name:
 *
 * - missing or older than the shim: pin core and the shim's own package,
 *   install, then run the new core's ng-add as a follow-up task;
 * - the shim's version: pin both and delegate in the same run;
 * - newer than the shim: never downgrade; pin nothing and delegate to the
 *   installed core, whose dependency step pins every selected package to
 *   its own version.
 *
 * A shim re-exports this as its `ngAdd` factory; the CLI passes only the
 * options, so `bundleDir` is the shim bundle's own folder. `ng add
 * @cngx/<lib>` always installs and records `<lib>`; the other flags go to
 * core as the CLI handed them over.
 */
export function delegateNgAdd(options: NgAddFlags, bundleDir: string = __dirname): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const version = readOwnVersion(bundleDir);
    const ownName = readOwnName(bundleDir);
    const forwarded = withOwnLib(options, ownName);
    const log = shimLogger(context);
    const installed = installedVersion(tree, CORE);
    const order = installed === undefined ? undefined : compareVersions(installed, version);

    // A local build's placeholder is no version to pin or compare: follow
    // whatever core is installed, or stop when there is none.
    if (isUnstampedVersion(version)) {
      if (installed === undefined) {
        throw new SchematicsException(
          `${ownName} is an unstamped local build (${version}) and ${CORE} is not installed; pack the libs with node scripts/pack-libs.mjs and install the tarballs.`,
        );
      }
      log.info(`${ownName} is an unstamped local build (${version}); pinning nothing and following the installed ${CORE} ${installed}.`);
      loadCore(context);
      return externalSchematic(CORE, 'ng-add', forwarded);
    }

    if (order !== undefined && order > 0) {
      log.info(`${CORE} ${installed} is installed, newer than ${ownName} ${version}; following the installed core.`);
      loadCore(context);
      return externalSchematic(CORE, 'ng-add', forwarded);
    }

    const pins = chain([addLockstepDependency(CORE, version, true), addLockstepDependency(ownName, version, true)]);
    if (order === 0) {
      loadCore(context);
      return chain([pins, externalSchematic(CORE, 'ng-add', forwarded)]);
    }

    log.info(installReason(installed, order, ownName, version));
    // The shim's own install runs before core plans anything, so the CDK the
    // packages peer on is declared at the app's Angular first; npm would
    // otherwise fetch the newest CDK the peer range allows.
    return chain([
      pins,
      ...(needsCdk(ownName) ? [addAngularCompanion(CDK, log)] : []),
      (_innerTree: Tree, innerContext: SchematicContext) => {
        const installTask = innerContext.addTask(new NodePackageInstallTask());
        innerContext.addTask(new RunSchematicTask(CORE, 'ng-add', { ...forwarded }), [installTask]);
      },
    ]);
  };
}
