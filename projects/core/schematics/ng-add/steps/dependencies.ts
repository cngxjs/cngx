import {
  type Change,
  CNGX_LIBS,
  type CngxLib,
  declaredRange,
  type PackageManifest,
  type Provenance,
  type StepResult,
} from '../../engine';
import { type ProjectFacts } from '../detect/detect';
import { type OnboardingAnswers, type Versions } from './model';

// The @cngx peers each package declares (projects/<lib>/package.json).
const LIB_PEERS: Readonly<Record<CngxLib, readonly CngxLib[]>> = {
  utils: [],
  core: ['utils'],
  common: ['utils', 'core'],
  interop: ['utils', 'core', 'common'],
  forms: ['utils', 'core', 'common'],
  'data-display': ['utils', 'core', 'common'],
  ui: ['utils', 'core', 'common'],
};

// cngx.css @imports the CSS of each, so @cngx/themes keeps them as required peers.
const THEME_PEERS: readonly CngxLib[] = ['core', 'common', 'forms', 'data-display', 'ui'];

const NEEDS_CDK: readonly CngxLib[] = ['common', 'data-display', 'ui'];

const FLOATING_UI = '@floating-ui/dom';
const FLOATING_UI_RANGE = '^1.0.0';

/** The selected libs plus their @cngx peers, in package order. */
export function selectedLibs(libs: readonly CngxLib[]): readonly CngxLib[] {
  const wanted = new Set(libs.flatMap((lib) => [lib, ...LIB_PEERS[lib]]));
  return CNGX_LIBS.filter((lib) => wanted.has(lib));
}

/** The libs `@cngx/themes` needs that `libs` lacks; empty when the theme can be installed. */
export function missingThemePeers(libs: readonly CngxLib[]): readonly CngxLib[] {
  return THEME_PEERS.filter((lib) => !libs.includes(lib));
}

function list(names: readonly string[]): string {
  return names.length <= 1 ? names.join('') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`;
}

function cngxDependency(manifest: PackageManifest, name: string, version: string, provenance: Provenance): StepResult {
  const existing = declaredRange(manifest, name);
  const change: Change = {
    kind: 'add-dependency',
    id: `dependency:${name}`,
    label: `Add ${name}@${version}`,
    reason:
      existing === undefined
        ? 'every @cngx package stays on one version'
        : `replaces ${existing}; every @cngx package stays on one version`,
    provenance,
    name,
    version,
  };
  if (existing === version) {
    return { changes: [], skipped: [{ id: change.id, label: change.label, reason: 'already pinned' }] };
  }
  return { changes: [change], skipped: [] };
}

function thirdPartyDependency(
  manifest: PackageManifest,
  name: string,
  range: string,
  reason: string,
  provenance: Provenance,
): StepResult {
  const id = `dependency:${name}`;
  const label = `Add ${name}@${range}`;
  const existing = declaredRange(manifest, name);
  if (existing !== undefined) {
    return { changes: [], skipped: [{ id, label, reason: `already declared as ${existing}` }] };
  }
  return { changes: [{ kind: 'add-dependency', id, label, reason, provenance, name, version: range }], skipped: [] };
}

function themeRefusal(missing: readonly CngxLib[], provenance: Provenance): StepResult {
  const names = missing.map((lib) => `@cngx/${lib}`);
  return {
    changes: [
      {
        kind: 'note',
        id: 'dependency:@cngx/themes',
        label: 'Skip @cngx/themes',
        reason: `cngx.css imports the CSS of ${list(names)}; select them or pass --theme=none`,
        provenance,
      },
    ],
    skipped: [],
  };
}

function merge(results: readonly StepResult[]): StepResult {
  return {
    changes: results.flatMap((result) => result.changes),
    skipped: results.flatMap((result) => result.skipped),
  };
}

/**
 * Pins every selected @cngx package and its peers to the exact release,
 * `@cngx/themes` when a theme is wanted and installable, the CDK at the app's
 * Angular range when a package needs it, and `@floating-ui/dom` on request
 * when `@cngx/common` (which provides the fallback) is selected.
 * `@angular/material` is never added: the bridge themes an app that has it.
 */
export function planDependencies(facts: ProjectFacts, answers: OnboardingAnswers, versions: Versions): StepResult {
  const provenance: Provenance = { source: 'ng-add', version: versions.cngx };
  const libs = selectedLibs(answers.libs);
  const missing = answers.theme === 'none' ? [] : missingThemePeers(libs);
  const withTheme = answers.theme !== 'none' && missing.length === 0;
  const packages = [...libs.map((lib) => `@cngx/${lib}`), ...(withTheme ? ['@cngx/themes'] : [])];
  const angularRange = declaredRange(facts.manifest, '@angular/core') ?? `^${facts.angularVersion ?? '21.2.0'}`;

  return merge([
    ...packages.map((name) => cngxDependency(facts.manifest, name, versions.cngx, provenance)),
    ...(missing.length > 0 ? [themeRefusal(missing, provenance)] : []),
    ...(libs.some((lib) => NEEDS_CDK.includes(lib))
      ? [thirdPartyDependency(facts.manifest, '@angular/cdk', angularRange, 'a peer of the selected @cngx packages', provenance)]
      : []),
    ...(answers.floatingFallback && libs.includes('common')
      ? [thirdPartyDependency(facts.manifest, FLOATING_UI, FLOATING_UI_RANGE, 'positions popovers where CSS anchor positioning is missing', provenance)]
      : []),
  ]);
}
