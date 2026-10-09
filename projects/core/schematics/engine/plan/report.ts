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
  /** Every planned change's label, in plan order. */
  readonly changes: readonly string[];
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

// `add-provider` names no file: `addRootProvider` finds the app config or
// the bootstrap call itself, so the label carries it instead.
function touchedFile(change: Change): string | undefined {
  switch (change.kind) {
    case 'create-file':
    case 'edit-file':
    case 'add-import':
    case 'add-style-import':
    case 'write-json':
      return change.path;
    case 'add-dependency':
      return 'package.json';
    case 'add-provider':
    case 'note':
      return undefined;
    default: {
      const unmapped: never = change;
      throw new Error(`No file for change ${JSON.stringify(unmapped)}.`);
    }
  }
}

export function createReport(plan: ChangePlan): Report {
  const files = plan.changes.map(touchedFile).filter((file): file is string => file !== undefined);
  return {
    changes: plan.changes.map((change) => change.label),
    files: [...new Set(files)],
    skipped: [...plan.skipped],
    warnings: [...plan.warnings],
    nextSteps: [DOCTOR],
    links: [DOCS],
  };
}
