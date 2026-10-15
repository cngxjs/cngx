import { type Change, mergeStepResults, type SkippedStep, type StepResult } from './change';

/**
 * The one derived source of an onboarding run. The todo list, `--dry-run`
 * output, the summary and the install manifest are projections of it.
 */
export interface ChangePlan {
  readonly changes: readonly Change[];
  /** Idempotent hits: changes whose effect is already in place. */
  readonly skipped: readonly SkippedStep[];
  readonly warnings: readonly string[];
}

/** Concatenates the step results in step order. */
export function createChangePlan(results: readonly StepResult[], warnings: readonly string[] = []): ChangePlan {
  return { ...mergeStepResults(results), warnings: [...warnings] };
}

function section(title: string, marker: string, lines: readonly string[]): readonly string[] {
  if (lines.length === 0) {
    return [];
  }
  return [`${title} (${lines.length}):`, ...lines.map((line) => `  ${marker} ${line}`)];
}

/** Plain text of the plan for `--dry-run` output and snapshots. */
export function describeChangePlan(plan: ChangePlan): string {
  const describe = (change: Change): string => `${change.label} - ${change.reason}`;
  const lines = [
    ...section('Planned', '+', plan.changes.filter((change) => change.kind !== 'note').map(describe)),
    ...section('Notes', '-', plan.changes.filter((change) => change.kind === 'note').map(describe)),
    ...section('Already in place', '=', plan.skipped.map((step) => `${step.label} - ${step.reason}`)),
    ...section('Warnings', '!', plan.warnings),
  ];
  return lines.length === 0 ? 'Nothing to change.' : lines.join('\n');
}
