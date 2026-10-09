import { type Report } from '../../engine';

function section(title: string, lines: readonly string[]): readonly string[] {
  return lines.length === 0 ? [] : [`${title}:`, ...lines.map((line) => `  ${line}`)];
}

/** The closing lines of a run, rendered by `renderer.summary`. */
export function createSummary(report: Report): readonly string[] {
  const headline =
    report.changes.length === 0
      ? 'cngx is already set up; nothing changed.'
      : `cngx planned ${report.changes.length} change${report.changes.length === 1 ? '' : 's'}.`;
  return [
    headline,
    ...section('Files', report.files),
    ...section(
      'Already in place',
      report.skipped.map((step) => step.label),
    ),
    ...section('Next steps', report.nextSteps),
    ...section(
      'Docs',
      report.links.map((link) => `${link.label}: ${link.url}`),
    ),
  ];
}
