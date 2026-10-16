import { parseVersion, type PreflightItem } from '../../engine';
import { ANGULAR_CORE_MANIFEST, type ProjectFacts } from '../detect/detect';
import { type GitState } from './git-state';

/** What the preflight checklist reads, gathered once in the shell. */
export interface PreflightInput {
  readonly facts: ProjectFacts;
  /** The `@angular/core` range @cngx/core peers on, from versions.json. */
  readonly peerRange: string;
  readonly git: GitState;
  /** `--project` as passed; without it a workspace with several applications gets a picked project. */
  readonly projectFlag?: string;
}

/** The app's Angular against the floor cngx supports. */
export interface AngularSupport {
  /** `undefined` when no version can be read: nothing installed and a specifier that carries none. */
  readonly supported: boolean | undefined;
  /** `major.minor` of the peer range. */
  readonly floor: string;
  /** The app's declared `@angular/core` specifier, or why there is none. */
  readonly declared: string;
}

const NO_ANGULAR_DEPENDENCY = 'no @angular/core dependency';

export function angularSupport(facts: ProjectFacts, peerRange: string): AngularSupport {
  const { major: minMajor, minor: minMinor } = parseVersion(peerRange) ?? { major: 0, minor: 0 };
  const app = parseVersion(facts.angularVersion);
  const supported =
    app === undefined ? undefined : app.major > minMajor || (app.major === minMajor && app.minor >= minMinor);
  return {
    supported,
    floor: `${minMajor}.${minMinor}`,
    declared: facts.angularRange ?? NO_ANGULAR_DEPENDENCY,
  };
}

/**
 * What the app's Angular reads as, for a refusal: the installed version when
 * cngx read it from the package, so a `catalog:` app is not told it declares
 * the version that refused it.
 */
export function angularReading(facts: ProjectFacts): string {
  const declared = `declares ${facts.angularRange ?? NO_ANGULAR_DEPENDENCY}`;
  return facts.angularSource === 'installed' ? `has ${facts.angularVersion} installed (${declared})` : declared;
}

// The preflight line names what it read: the installed version beside the
// specifier, or the specifier alone when the version comes from it.
function angularLabel(facts: ProjectFacts, declared: string): string {
  return facts.angularSource === 'installed'
    ? `Angular ${facts.angularVersion} (installed, declares ${declared})`
    : `Angular ${declared}`;
}

function angularDetail(facts: ProjectFacts, supported: boolean | undefined, floor: string): string {
  const needs = `cngx needs ${floor} or newer`;
  if (facts.angularSource === 'unreadable') {
    return supported === undefined
      ? `${ANGULAR_CORE_MANIFEST} cannot be read and the specifier carries no version; ${needs}`
      : `read from the declared range, ${ANGULAR_CORE_MANIFEST} cannot be read; ${needs}`;
  }
  return supported === undefined ? `no version to read from it and no installed @angular/core; ${needs}` : needs;
}

function angularStatus(supported: boolean | undefined): PreflightItem['status'] {
  if (supported === undefined) {
    return 'warn';
  }
  return supported ? 'ok' : 'fail';
}

const GIT_ITEMS: Readonly<Record<GitState, PreflightItem>> = {
  clean: {
    label: 'Git working tree clean',
    status: 'ok',
    detail: 'review the cngx changes with git diff afterwards',
  },
  'install-only': {
    label: 'Git working tree clean apart from the package install of ng add',
    status: 'ok',
    detail: 'review the cngx changes with git diff afterwards',
  },
  dirty: {
    label: 'Git working tree has uncommitted changes',
    status: 'warn',
    detail: 'the cngx changes will mix with them in git diff',
  },
  'no-repository': {
    label: 'No git repository',
    status: 'warn',
    detail: 'there is no diff to review the cngx changes against',
  },
  'no-git': {
    label: 'Git is not installed',
    status: 'warn',
    detail: 'there is no diff to review the cngx changes against',
  },
  unknown: {
    label: 'Git state unreadable',
    status: 'warn',
    detail: 'git status failed in this folder; review the cngx changes by hand',
  },
};

// One project line, worst status first: a missing build target fails, a
// project picked from several applications without --project warns.
function projectItem(facts: ProjectFacts, projectFlag: string | undefined): PreflightItem {
  const others = facts.applications.filter((name) => name !== facts.project);
  const picked = projectFlag === undefined && others.length > 0;
  const label = picked ? `Project ${facts.project} (picked; pass --project to choose)` : `Project ${facts.project}`;
  if (!facts.hasBuildTarget) {
    return {
      label,
      status: 'fail',
      detail: 'no build target in angular.json; cngx wires styles and providers through it',
    };
  }
  const maturity = facts.maturity === 'fresh' ? 'fresh app' : 'existing app';
  return picked
    ? { label, status: 'warn', detail: `${maturity}; other applications: ${others.join(', ')}` }
    : { label, status: 'ok', detail: maturity };
}

function stylesheetsItem(missing: readonly string[]): readonly PreflightItem[] {
  if (missing.length === 0) {
    return [];
  }
  return [
    {
      label: `${missing.length === 1 ? 'Stylesheet' : 'Stylesheets'} ${missing.join(', ')}`,
      status: 'fail',
      detail: 'listed under styles in angular.json but missing on disk',
    },
  ];
}

/**
 * The checklist printed before any question: the Angular version against
 * the supported floor, the project with its maturity (only an existing app
 * is asked to confirm the plan; a project picked from several applications
 * is a `warn`), a listed stylesheet missing on disk, and the git state. An
 * Angular version below the floor, a project without a build target and a
 * missing stylesheet are the `fail` lines; the
 * shell renders them before it refuses the run. A version it cannot read is
 * a `warn`, and the run goes on.
 */
export function preflightItems({
  facts,
  peerRange,
  git,
  projectFlag,
}: PreflightInput): readonly PreflightItem[] {
  const angular = angularSupport(facts, peerRange);
  return [
    {
      label: angularLabel(facts, angular.declared),
      status: angularStatus(angular.supported),
      detail: angularDetail(facts, angular.supported, angular.floor),
    },
    projectItem(facts, projectFlag),
    ...stylesheetsItem(facts.missingStyleEntries),
    GIT_ITEMS[git],
  ];
}
