import { type Report } from '../plan/report';

function section(title: string, lines: readonly string[]): readonly string[] {
  return lines.length === 0 ? [] : [`${title}:`, ...lines.map((line) => `  ${line}`)];
}

function plural(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? '' : 's'}`;
}

// When the plan list was printed it already names every idempotent hit, so
// the summary only counts them; under `--quiet` the summary is all there is.
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

/** The first summary line: `changed` gets the counted changes ("2 changes"). */
export interface SummaryHeadlines {
  readonly changed: (changes: string) => string;
  readonly unchanged: string;
}

const NG_ADD_HEADLINES: SummaryHeadlines = {
  changed: (changes) => `cngx planned ${changes}.`,
  unchanged: 'cngx is already set up; nothing changed.',
};

/**
 * The closing lines of a run, rendered by `renderer.summary`: the files the
 * plan touches, what a step refused or left to the user, the steps already
 * in place, the next steps with the doctor first, and the docs. `planListed`
 * says whether the plan list ran before it (every run except `--quiet`);
 * `headlines` name the command, `ng add` by default.
 */
export function createSummary(
  report: Report,
  planListed: boolean,
  headlines: SummaryHeadlines = NG_ADD_HEADLINES,
): readonly string[] {
  const headline =
    report.changes.length === 0
      ? headlines.unchanged
      : headlines.changed(plural(report.changes.length, 'change'));
  return [
    headline,
    ...section('Files', report.files),
    ...section('Notes', report.notes),
    ...skippedLines(report, planListed),
    ...section('Next steps', report.nextSteps),
    ...section(
      'Docs',
      report.links.map((link) => `${link.label}: ${link.url}`),
    ),
  ];
}
