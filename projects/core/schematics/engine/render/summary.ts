import { type Report } from '../plan/report';

function section(title: string, lines: readonly string[]): readonly string[] {
  return lines.length === 0 ? [] : [`${title}:`, ...lines.map((line) => `  ${line}`)];
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

function skippedLines(report: Report, planListed: boolean): readonly string[] {
  if (report.skipped.length === 0) {
    return [];
  }
  if (planListed) {
    return [`${plural(report.skipped.length, 'step')} already in place.`];
  }
  return section(
    'Already in place',
    report.skipped.map((step) => step.label),
  );
}

/** What the run did with its changes: written into the tree, or only planned under `--dry-run`. */
export type SummaryOutcome = 'applied' | 'planned';

/** The first summary line: `changed` gets the counted changes ("2 changes"). */
export interface SummaryHeadlines {
  readonly changed: (changes: string, outcome: SummaryOutcome) => string;
  readonly unchanged: string;
}

/** How the summary reads the run before it: the plan list printed, and whether it applies. */
export interface SummaryContext {
  /** The plan list ran before it (every run except `--quiet`). */
  readonly planListed: boolean;
  readonly outcome: SummaryOutcome;
}

const NG_ADD_HEADLINES: SummaryHeadlines = {
  changed: (changes, outcome) => `cngx ${outcome} ${changes}.`,
  unchanged: 'cngx is already set up; nothing changed.',
};

/**
 * The closing lines of a run, rendered by `renderer.summary`: the files the
 * plan touches, what a step refused or left to the user, the warnings, the
 * steps already in place, the next steps with the doctor first, and the docs. When the plan
 * list ran before it, that list already named every file, note, warning and
 * idempotent hit, so the summary only counts the hits; under `--quiet` the
 * summary is all there is and lists them. `headlines` name the command,
 * `ng add` by default.
 */
export function createSummary(
  report: Report,
  { planListed, outcome }: SummaryContext,
  headlines: SummaryHeadlines = NG_ADD_HEADLINES,
): readonly string[] {
  const headline =
    report.changes.length === 0
      ? headlines.unchanged
      : headlines.changed(plural(report.changes.length, 'change'), outcome);
  return [
    headline,
    ...(planListed ? [] : section('Files', report.files)),
    ...(planListed ? [] : section('Notes', report.notes)),
    ...(planListed ? [] : section('Warnings', report.warnings)),
    ...skippedLines(report, planListed),
    ...section('Next steps', report.nextSteps),
    ...section(
      'Docs',
      report.links.map((link) => `${link.label}: ${link.url}`),
    ),
  ];
}
