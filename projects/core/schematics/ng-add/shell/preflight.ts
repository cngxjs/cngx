import { type PreflightItem } from '../../engine';
import { type ProjectFacts } from '../detect/detect';
import { type GitState } from './git-state';

/** What the preflight checklist reads, gathered once in the shell. */
export interface PreflightInput {
  readonly facts: ProjectFacts;
  /** The `@angular/core` range @cngx/core peers on, from versions.json. */
  readonly peerRange: string;
  readonly git: GitState;
}

/** The app's Angular against the floor cngx supports. */
export interface AngularSupport {
  readonly supported: boolean;
  /** `major.minor` of the peer range. */
  readonly floor: string;
  /** The app's declared `@angular/core` range, or why there is none. */
  readonly declared: string;
}

function majorMinor(version: string | undefined): readonly [number, number] | undefined {
  const match = /(\d+)\.(\d+)/.exec(version ?? '');
  return match === null ? undefined : [Number(match[1]), Number(match[2])];
}

export function angularSupport(facts: ProjectFacts, peerRange: string): AngularSupport {
  const [minMajor, minMinor] = majorMinor(peerRange) ?? [0, 0];
  const app = majorMinor(facts.angularVersion);
  const supported =
    app !== undefined && (app[0] > minMajor || (app[0] === minMajor && app[1] >= minMinor));
  return {
    supported,
    floor: `${minMajor}.${minMinor}`,
    declared: facts.manifest.dependencies['@angular/core'] ?? 'no @angular/core dependency',
  };
}

const GIT_ITEMS: Readonly<Record<GitState, PreflightItem>> = {
  clean: {
    label: 'Git working tree clean',
    status: 'ok',
    detail: 'review the cngx changes with git diff afterwards',
  },
  dirty: {
    label: 'Git working tree has uncommitted changes',
    status: 'warn',
    detail: 'the cngx changes will mix with them in git diff',
  },
  unknown: {
    label: 'No git repository',
    status: 'warn',
    detail: 'there is no diff to review the cngx changes against',
  },
};

/**
 * The checklist printed before any question: the Angular version against
 * the supported floor, the project with its maturity (only an existing app
 * is asked to confirm the plan) and the git state. An unsupported Angular is
 * the one `fail`; the shell renders it before it refuses the run.
 */
export function preflightItems({
  facts,
  peerRange,
  git,
}: PreflightInput): readonly PreflightItem[] {
  const angular = angularSupport(facts, peerRange);
  return [
    {
      label: `Angular ${angular.declared}`,
      status: angular.supported ? 'ok' : 'fail',
      detail: `cngx needs ${angular.floor} or newer`,
    },
    {
      label: `Project ${facts.project}`,
      status: 'ok',
      detail: facts.maturity === 'fresh' ? 'fresh app' : 'existing app',
    },
    GIT_ITEMS[git],
  ];
}
