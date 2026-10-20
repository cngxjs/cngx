import { type Rule, type SchematicContext, type Tree } from '@angular-devkit/schematics';
import { ExistingBehavior, InstallBehavior } from '@schematics/angular/utility';

import { addDependency } from './add-dependency';
import { declaredRange, installedVersion, parseManifest } from './manifest';

const MANIFEST = 'package.json';

// A specifier a companion range can copy: plain semver, no protocol
// (`catalog:`, `workspace:*`, `npm:`) and no dist-tag.
const PLAIN_SEMVER_RANGE = /^[\s\d.^~<>=|xX*v-]+$/;

/**
 * The range for an Angular companion package (`@angular/cdk`) that matches
 * the app's Angular: the declared `@angular/core` range verbatim when it is
 * plain semver, so a tilde or exact pin stays one; else, behind a protocol or
 * dist-tag, `^<major>.<minor>.0` of the resolved version, or `^<version>` for
 * a prerelease, which no stable `^x.y.0` range would match; else `undefined`.
 *
 * The @cngx packages peer on `@angular/cdk` across two Angular majors. Left to
 * itself, npm installs a missing peer at the newest version the range allows,
 * whose own peers then name the next Angular major, so the companion is
 * always declared at the app's Angular instead.
 */
export function companionRange(angularRange: string | undefined, angularVersion: string | undefined): string | undefined {
  if (angularRange !== undefined && PLAIN_SEMVER_RANGE.test(angularRange) && /\d/.test(angularRange)) {
    return angularRange;
  }
  const version = /^(\d+)\.(\d+)\.\d+(-.+)?/.exec(angularVersion ?? '');
  if (version === null) {
    return undefined;
  }
  return version[3] === undefined ? `^${version[1]}.${version[2]}.0` : `^${angularVersion}`;
}

/** Where the companion rule reports what it did. */
export interface CompanionLog {
  info(message: string): void;
}

/**
 * Declares `name` at the app's Angular range before an install the caller
 * schedules, unless the app already declares it at any range (kept as it is).
 * Without a readable Angular version it adds nothing and says what to add.
 */
export function addAngularCompanion(name: string, log?: CompanionLog): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const out = log ?? context.logger;
    const manifest = parseManifest(tree.readText(MANIFEST));
    if (declaredRange(manifest, name) !== undefined) {
      return;
    }
    const range = companionRange(declaredRange(manifest, '@angular/core'), installedVersion(tree, '@angular/core'));
    if (range === undefined) {
      out.info(`Add ${name} matching your @angular/core yourself; cngx cannot read an Angular version to match it to.`);
      return;
    }
    out.info(`Adding ${name}@${range} to match @angular/core, so the install does not pick the ${name} of a newer Angular.`);
    return addDependency(name, range, { install: InstallBehavior.None, existing: ExistingBehavior.Skip });
  };
}
