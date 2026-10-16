import { type Change, type SkippedStep } from './change';
import { type ChangePlan } from './plan';

export interface ReportLink {
  readonly label: string;
  readonly url: string;
}

/**
 * What a finished run did, derived from the plan alone: the CLI commits the
 * whole tree or nothing, so there is no applied state to read back.
 */
export interface Report {
  /** Every planned change's label, in plan order; notes are listed apart. */
  readonly changes: readonly string[];
  /** What a step communicated instead of changing a file: `label - reason`. */
  readonly notes: readonly string[];
  /** Files the plan touches, each once, in first-touch order. */
  readonly files: readonly string[];
  readonly skipped: readonly SkippedStep[];
  readonly warnings: readonly string[];
  readonly nextSteps: readonly string[];
  readonly links: readonly ReportLink[];
}

const DOCS: ReportLink = { label: 'cngx documentation', url: 'https://cngxjs.github.io/cngx/' };

// The doctor checks the wiring the virtual tree cannot see, so it leads.
const DOCTOR = 'Run `npx @cngx/doctor` to check the wiring.';

function touchedFile(change: Change): string | undefined {
  switch (change.kind) {
    case 'create-file':
    case 'edit-file':
    case 'add-style-import':
    case 'write-json':
      return change.path;
    case 'add-dependency':
      return 'package.json';
    case 'add-style-entry':
      return 'angular.json';
    case 'add-provider':
      return change.path;
    case 'note':
      return undefined;
    default: {
      const unmapped: never = change;
      throw new Error(`No file for change ${JSON.stringify(unmapped)}.`);
    }
  }
}

/**
 * `unchanged` holds the ids `applyChangePlan` reported as already in place;
 * those move from the changes to the skipped steps.
 */
export function createReport(plan: ChangePlan, unchanged: ReadonlySet<string> = new Set()): Report {
  const applied = plan.changes.filter((change) => !unchanged.has(change.id));
  const inPlace = plan.changes.filter((change) => unchanged.has(change.id));
  const files = applied.map(touchedFile).filter((file): file is string => file !== undefined);
  const notes = applied.filter((change) => change.kind === 'note');
  return {
    changes: applied.filter((change) => change.kind !== 'note').map((change) => change.label),
    notes: notes.map((note) => `${note.label} - ${note.reason}`),
    files: [...new Set(files)],
    skipped: [
      ...plan.skipped,
      ...inPlace.map((change): SkippedStep => ({ id: change.id, label: change.label, reason: 'already in place' })),
    ],
    warnings: [...plan.warnings],
    nextSteps: [DOCTOR],
    links: [DOCS],
  };
}
