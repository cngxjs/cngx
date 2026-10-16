import { type ChangePlan, type PlanItem, type PlanMarker, planSections } from '../plan/plan';
import { type Palette } from './palette';
import { type PreflightItem, type Renderer, type RendererOptions } from './renderer';

type PlainOptions = Pick<RendererOptions, 'color' | 'quiet' | 'logger'>;

// The Angular CLI's colours: green for what is added, yellow for what needs a
// look, the reason dimmed so the label reads first.
function marker(symbol: PlanMarker, color: Palette): string {
  switch (symbol) {
    case '+':
      return color.green(symbol);
    case '-':
    case '!':
      return color.yellow(symbol);
    case '=':
      return color.dim(symbol);
  }
}

/** One plan line as the terminal shows it: `  + label - reason`. */
export function formatPlanItem(symbol: PlanMarker, item: PlanItem, color: Palette): string {
  const reason = item.reason === undefined ? '' : ` ${color.dim(`- ${item.reason}`)}`;
  return `  ${marker(symbol, color)} ${item.label}${reason}`;
}

/** A section heading of the plan list, `Planned (3):`. */
export function formatPlanHeading(title: string, count: number, color: Palette): string {
  return color.bold(`${title} (${count}):`);
}

function planLines(plan: ChangePlan, color: Palette): readonly string[] {
  const sections = planSections(plan);
  if (sections.length === 0) {
    return ['Nothing to change.'];
  }
  return sections.flatMap((section) => [
    formatPlanHeading(section.title, section.count, color),
    ...section.items.map((item) => formatPlanItem(section.marker, item, color)),
  ]);
}

// A summary section heading (`Next steps:`) starts at the left edge and ends
// in a colon; the headline and the indented lines do neither.
const SUMMARY_HEADING = /^\S.*:$/;

// One parenthetical per line: a label that already ends in one (`Angular
// 21.2.25 (installed, declares ^21.2.0)`) takes the detail inside it.
function preflightText({ label, detail }: PreflightItem): string {
  if (detail === undefined) {
    return label;
  }
  return label.endsWith(')') ? `${label.slice(0, -1)}; ${detail})` : `${label} (${detail})`;
}

/** Line output for CI, `NO_COLOR`, `--quiet` and no terminal. */
export function createPlainRenderer({ color, quiet, logger }: PlainOptions): Renderer {

  function preflightLine(item: PreflightItem): void {
    const text = preflightText(item);
    switch (item.status) {
      case 'ok':
        logger.info(`  ${color.green('ok')} ${text}`);
        return;
      case 'warn':
        logger.warn(`  ${color.yellow('!')} ${text}`);
        return;
      case 'fail':
        logger.error(`  ${color.red('x')} ${text}`);
        return;
    }
  }

  return {
    heading(text) {
      if (!quiet) {
        logger.info(color.bold(text));
      }
    },
    preflight(items) {
      if (quiet || items.length === 0) {
        return;
      }
      logger.info(color.bold('Preflight:'));
      items.forEach(preflightLine);
    },
    todo(plan) {
      if (!quiet) {
        planLines(plan, color).forEach((line) => logger.info(line));
      }
      return Promise.resolve();
    },
    summary(lines) {
      lines.forEach((line) => logger.info(SUMMARY_HEADING.test(line) ? color.bold(line) : line));
    },
    note(text) {
      if (!quiet) {
        logger.info(color.dim(text));
      }
    },
  };
}
