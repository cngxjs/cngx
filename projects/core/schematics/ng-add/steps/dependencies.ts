import {
  type Change,
  CNGX_LIBS,
  type CngxLib,
  createNote,
  createProvenance,
  declaredRange,
  joinNames,
  mergeStepResults,
  type PackageManifest,
  type Provenance,
  skipChange,
  type StepResult,
  type ThemeChoice,
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

/** A theme is wanted and the selected libs (from `selectedLibs`) carry every peer it needs. */
export function canInstallTheme(libs: readonly CngxLib[], theme: ThemeChoice): boolean {
  return theme !== 'none' && missingThemePeers(libs).length === 0;
}

/**
 * Every `@cngx/*` package installed for the selected libs (from `selectedLibs`),
 * `@cngx/themes` only when it can be.
 */
export function cngxPackages(libs: readonly CngxLib[], theme: ThemeChoice): readonly string[] {
  return [
    ...libs.map((lib) => `@cngx/${lib}`),
    ...(canInstallTheme(libs, theme) ? ['@cngx/themes'] : []),
  ];
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
    return { changes: [], skipped: [skipChange(change, 'already pinned')] };
  }
  return { changes: [change], skipped: [] };
}

/** A package outside the cngx lockstep, added at `range` unless the app already declares it. */
export interface ThirdPartyDependency {
  readonly name: string;
  readonly range: string;
  readonly reason: string;
  /** Added to devDependencies. */
  readonly dev?: boolean;
}

/**
 * Adds a third-party package the app lacks. One the app already declares,
 * at any range, is kept and skipped under the same id and label, so a
 * planned and a skipped run read the same.
 */
export function planThirdPartyDependency(
  manifest: PackageManifest,
  { name, range, reason, dev }: ThirdPartyDependency,
  provenance: Provenance,
): StepResult {
  const change: Change = {
    kind: 'add-dependency',
    id: `dependency:${name}`,
    label: `Add ${name}@${range}`,
    reason,
    provenance,
    name,
    version: range,
    ...(dev === true ? { dev } : {}),
  };
  const existing = declaredRange(manifest, name);
  if (existing !== undefined) {
    return { changes: [], skipped: [skipChange(change, `already declared as ${existing}`)] };
  }
  return { changes: [change], skipped: [] };
}

function themeRefusal(missing: readonly CngxLib[], provenance: Provenance): StepResult {
  const names = missing.map((lib) => `@cngx/${lib}`);
  return {
    changes: [
      createNote({
        id: 'dependency:@cngx/themes',
        label: 'Skip @cngx/themes',
        reason: `cngx.css imports the CSS of ${joinNames(names)}; select them or pass --theme=none`,
        provenance,
      }),
    ],
    skipped: [],
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
  const provenance = createProvenance('ng-add', versions.cngx);
  const libs = selectedLibs(answers.libs);
  const missing = answers.theme === 'none' ? [] : missingThemePeers(libs);
  const packages = cngxPackages(libs, answers.theme);
  const angularRange = declaredRange(facts.manifest, '@angular/core') ?? `^${facts.angularVersion ?? '21.2.0'}`;

  return mergeStepResults([
    ...packages.map((name) => cngxDependency(facts.manifest, name, versions.cngx, provenance)),
    ...(missing.length > 0 ? [themeRefusal(missing, provenance)] : []),
    ...(libs.some((lib) => NEEDS_CDK.includes(lib))
      ? [
          planThirdPartyDependency(
            facts.manifest,
            {
              name: '@angular/cdk',
              range: angularRange,
              reason: 'a peer of the selected @cngx packages',
            },
            provenance,
          ),
        ]
      : []),
    ...(answers.floatingFallback && libs.includes('common')
      ? [
          planThirdPartyDependency(
            facts.manifest,
            {
              name: FLOATING_UI,
              range: FLOATING_UI_RANGE,
              reason: 'positions popovers where CSS anchor positioning is missing',
            },
            provenance,
          ),
        ]
      : []),
  ]);
}
