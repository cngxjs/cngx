import { type Report } from '../../engine';

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

/**
 * The closing lines of a run, rendered by `renderer.summary`. `planListed`
 * says whether the plan list ran before it (every run except `--quiet`).
 */
export function createSummary(report: Report, planListed: boolean): readonly string[] {
  const headline =
    report.changes.length === 0
      ? 'cngx is already set up; nothing changed.'
      : `cngx planned ${plural(report.changes.length, 'change')}.`;
  return [
    headline,
    ...section('Files', report.files),
    ...skippedLines(report, planListed),
    ...section('Next steps', report.nextSteps),
    ...section(
      'Docs',
      report.links.map((link) => `${link.label}: ${link.url}`),
    ),
  ];
}
