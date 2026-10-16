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

/** The marker in front of a plan line: planned, note, already in place, warning. */
export type PlanMarker = '+' | '-' | '=' | '!';

/** One line of the plan as a renderer prints it. */
export interface PlanItem {
  readonly label: string;
  readonly reason?: string;
}

/** A titled block of the plan list; `count` is the changes it stands for. */
export interface PlanSection {
  readonly title: string;
  readonly marker: PlanMarker;
  readonly count: number;
  readonly items: readonly PlanItem[];
}

const CNGX_SCOPE = '@cngx/';

// A lockstep dependency: an @cngx package on the release line, not a
// devDependency on its own version line (`@cngx/eslint-plugin`).
function isLockstep(change: Change): change is Extract<Change, { kind: 'add-dependency' }> {
  return change.kind === 'add-dependency' && change.name.startsWith(CNGX_SCOPE) && change.dev !== true;
}

// The lockstep additions that share a version and a reason read as one line
// (`Add 8 @cngx packages at 0.1.0`), placed where the first of them stood;
// the plan keeps every change, so the manifest and the report are unaffected.
function plannedItems(changes: readonly Change[]): readonly PlanItem[] {
  const groups = new Map<string, Extract<Change, { kind: 'add-dependency' }>[]>();
  for (const change of changes.filter(isLockstep)) {
    const key = `${change.version}\n${change.reason}`;
    groups.set(key, [...(groups.get(key) ?? []), change]);
  }
  const items: PlanItem[] = [];
  const placed = new Set<string>();
  for (const change of changes) {
    const key = isLockstep(change) ? `${change.version}\n${change.reason}` : undefined;
    const group = key === undefined ? undefined : groups.get(key);
    if (key === undefined || group === undefined || group.length < 2) {
      items.push({ label: change.label, reason: change.reason });
      continue;
    }
    if (placed.has(key)) {
      continue;
    }
    placed.add(key);
    items.push({
      label: `Add ${group.length} @cngx packages at ${group[0].version}`,
      reason: group.map((dependency) => dependency.name.slice(CNGX_SCOPE.length)).join(', '),
    });
  }
  return items;
}

/** The plan list in print order, empty sections left out. */
export function planSections(plan: ChangePlan): readonly PlanSection[] {
  const planned = plan.changes.filter((change) => change.kind !== 'note');
  const notes = plan.changes.filter((change) => change.kind === 'note');
  const sections: PlanSection[] = [
    { title: 'Planned', marker: '+', count: planned.length, items: plannedItems(planned) },
    {
      title: 'Notes',
      marker: '-',
      count: notes.length,
      items: notes.map((note) => ({ label: note.label, reason: note.reason })),
    },
    {
      title: 'Already in place',
      marker: '=',
      count: plan.skipped.length,
      items: plan.skipped.map((step) => ({ label: step.label, reason: step.reason })),
    },
    { title: 'Warnings', marker: '!', count: plan.warnings.length, items: plan.warnings.map((label) => ({ label })) },
  ];
  return sections.filter((section) => section.count > 0);
}

/** One plan line without colour: `label - reason`. */
export function describePlanItem(item: PlanItem): string {
  return item.reason === undefined ? item.label : `${item.label} - ${item.reason}`;
}

/** Plain text of the plan for `--dry-run` output and snapshots. */
export function describeChangePlan(plan: ChangePlan): string {
  const lines = planSections(plan).flatMap((section) => [
    `${section.title} (${section.count}):`,
    ...section.items.map((item) => `  ${section.marker} ${describePlanItem(item)}`),
  ]);
  return lines.length === 0 ? 'Nothing to change.' : lines.join('\n');
}
