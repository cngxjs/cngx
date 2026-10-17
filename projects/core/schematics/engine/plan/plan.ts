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

// A package on the release line: what one fold line stands for.
interface Lockstep {
  readonly name: string;
  readonly version: string;
}

// A lockstep dependency: an @cngx package on the release line, not a
// devDependency on its own version line (`@cngx/eslint-plugin`).
function lockstepChange(change: Change): Lockstep | undefined {
  const lockstep = change.kind === 'add-dependency' && change.name.startsWith(CNGX_SCOPE) && change.dev !== true;
  return lockstep ? { name: change.name, version: change.version } : undefined;
}

// The packages on their own version line; a skipped step carries no `dev`
// flag, so they are named.
const OWN_VERSION_LINE: ReadonlySet<string> = new Set(['@cngx/eslint-plugin', '@cngx/mcp']);
const SKIPPED_DEPENDENCY = /^Add (@cngx\/[a-z-]+)@(\S+)$/;

// A skipped step reads as lockstep from its id and label, the same ones the
// planned change carries (`dependency:@cngx/core`, `Add @cngx/core@0.1.0`).
function lockstepSkip(step: SkippedStep): Lockstep | undefined {
  const match = SKIPPED_DEPENDENCY.exec(step.label);
  if (match === null || step.id !== `dependency:${match[1]}` || OWN_VERSION_LINE.has(match[1])) {
    return undefined;
  }
  return { name: match[1], version: match[2] };
}

// The lockstep entries that share a version and a reason read as one line
// (`Add 8 @cngx packages at 0.1.0`), placed where the first of them stood;
// the plan keeps every change and skip, so the manifest and the report are
// unaffected. `foldedReason` says what the one line carries after the dash.
function foldLockstep<T extends { readonly label: string; readonly reason: string }>(
  entries: readonly T[],
  lockstepOf: (entry: T) => Lockstep | undefined,
  foldedReason: (group: readonly Lockstep[], reason: string) => string,
): readonly PlanItem[] {
  const keyOf = (entry: T, lockstep: Lockstep): string => `${lockstep.version}\n${entry.reason}`;
  const groups = new Map<string, Lockstep[]>();
  for (const entry of entries) {
    const lockstep = lockstepOf(entry);
    if (lockstep !== undefined) {
      const key = keyOf(entry, lockstep);
      groups.set(key, [...(groups.get(key) ?? []), lockstep]);
    }
  }
  const items: PlanItem[] = [];
  const placed = new Set<string>();
  for (const entry of entries) {
    const lockstep = lockstepOf(entry);
    const key = lockstep === undefined ? undefined : keyOf(entry, lockstep);
    const group = key === undefined ? undefined : groups.get(key);
    if (key === undefined || group === undefined || group.length < 2) {
      items.push({ label: entry.label, reason: entry.reason });
      continue;
    }
    if (placed.has(key)) {
      continue;
    }
    placed.add(key);
    items.push({ label: `Add ${group.length} @cngx packages at ${group[0].version}`, reason: foldedReason(group, entry.reason) });
  }
  return items;
}

const packageNames = (group: readonly Lockstep[]): string =>
  group.map((lockstep) => lockstep.name.slice(CNGX_SCOPE.length)).join(', ');

/** The plan list in print order, empty sections left out. */
export function planSections(plan: ChangePlan): readonly PlanSection[] {
  const planned = plan.changes.filter((change) => change.kind !== 'note');
  const notes = plan.changes.filter((change) => change.kind === 'note');
  const sections: PlanSection[] = [
    { title: 'Planned', marker: '+', count: planned.length, items: foldLockstep(planned, lockstepChange, packageNames) },
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
      items: foldLockstep(plan.skipped, lockstepSkip, (_group, reason) => reason),
    },
    { title: 'Warnings', marker: '!', count: plan.warnings.length, items: plan.warnings.map((label) => ({ label })) },
  ];
  return sections.filter((section) => section.count > 0);
}

/** One plan line without colour: `label - reason`. */
export function describePlanItem(item: PlanItem): string {
  return item.reason === undefined ? item.label : `${item.label} - ${item.reason}`;
}
