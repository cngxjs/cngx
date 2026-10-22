import {
  type Change,
  CNGX_LIBS,
  companionRange,
  type CngxLib,
  createNote,
  createProvenance,
  declaredRange,
  isUnstampedVersion,
  joinNames,
  LOCKSTEP_REASON,
  mergeStepResults,
  type PackageManifest,
  planThirdPartyDependency,
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
      existing === undefined ? LOCKSTEP_REASON : `replaces ${existing}; ${LOCKSTEP_REASON}`,
    provenance,
    name,
    version,
  };
  if (existing === version) {
    return { changes: [], skipped: [skipChange(change, 'already pinned')] };
  }
  return { changes: [change], skipped: [] };
}

// An unstamped local build carries a version no registry serves, so it pins
// nothing: a declared range stays, and one note says how to get real pins.
function unstampedDependencies(manifest: PackageManifest, packages: readonly string[], version: string, provenance: Provenance): StepResult {
  const declared = packages.filter((name) => declaredRange(manifest, name) !== undefined);
  const undeclared = packages.filter((name) => declaredRange(manifest, name) === undefined);
  const add = undeclared.length === 0 ? '' : `; add ${joinNames(undeclared)} that way`;
  return {
    changes: [
      createNote({
        id: 'dependency:@cngx',
        label: 'Keep the declared @cngx versions',
        reason: `this is an unstamped local build (${version}), which pins no @cngx version; pack the libs with node scripts/pack-libs.mjs and install the tarballs${add}`,
        provenance,
      }),
    ],
    skipped: declared.map((name) => ({
      id: `dependency:${name}`,
      label: `Pin ${name}`,
      reason: `kept at ${declaredRange(manifest, name)}; an unstamped local build pins no version`,
    })),
  };
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

/** The CDK range for the app's Angular; see `companionRange`. */
function cdkRange(facts: ProjectFacts): string | undefined {
  return companionRange(facts.angularRange, facts.angularVersion);
}

function cdkDependency(facts: ProjectFacts, provenance: Provenance): StepResult {
  const range = cdkRange(facts);
  if (range === undefined) {
    return {
      changes: [
        createNote({
          id: 'dependency:@angular/cdk',
          label: 'Add @angular/cdk yourself',
          reason:
            facts.angularRange === undefined
              ? 'package.json declares no @angular/core range to match it to'
              : `cngx cannot read an Angular version from ${facts.angularRange}; add the @angular/cdk matching your @angular/core`,
          provenance,
        }),
      ],
      skipped: [],
    };
  }
  return planThirdPartyDependency(
    facts.manifest,
    { name: '@angular/cdk', range, reason: 'a peer of the selected @cngx packages' },
    provenance,
  );
}

/**
 * Pins every selected @cngx package and its peers to the exact release,
 * `@cngx/themes` when a theme is wanted and installable, the CDK matching the
 * app's Angular when a package needs it, and `@floating-ui/dom` on request
 * when `@cngx/common` (which provides the fallback) is selected.
 * `@angular/material` is never added: the bridge themes an app that has it.
 * `pins` are the packages a shim handed over; each is pinned the same way,
 * so a declined confirm leaves them out with the rest of the plan.
 */
export function planDependencies(
  facts: ProjectFacts,
  answers: OnboardingAnswers,
  versions: Versions,
  pins: readonly string[] = [],
): StepResult {
  const provenance = createProvenance('ng-add', versions.cngx);
  const libs = selectedLibs(answers.libs);
  const missing = answers.theme === 'none' ? [] : missingThemePeers(libs);
  const selected = cngxPackages(libs, answers.theme);
  const packages = [...selected, ...pins.filter((name, index) => !selected.includes(name) && pins.indexOf(name) === index)];

  return mergeStepResults([
    ...(isUnstampedVersion(versions.cngx)
      ? [unstampedDependencies(facts.manifest, packages, versions.cngx, provenance)]
      : packages.map((name) => cngxDependency(facts.manifest, name, versions.cngx, provenance))),
    ...(missing.length > 0 ? [themeRefusal(missing, provenance)] : []),
    ...(libs.some((lib) => NEEDS_CDK.includes(lib)) ? [cdkDependency(facts, provenance)] : []),
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
