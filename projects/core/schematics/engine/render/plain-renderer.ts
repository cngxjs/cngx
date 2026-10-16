import { describeChangePlan } from '../plan/plan';
import { type PreflightItem, type Renderer, type RendererOptions } from './renderer';

type PlainOptions = Pick<RendererOptions, 'color' | 'quiet' | 'logger'>;

// One parenthetical per line: a label that already ends in one (`Angular
// 21.2.25 (installed, declares ^21.2.0)`) takes the detail inside it.
function preflightText({ label, detail }: PreflightItem): string {
  if (detail === undefined) {
    return label;
  }
  return label.endsWith(')') ? `${label.slice(0, -1)}; ${detail})` : `${label} (${detail})`;
}

/** Line output through the logger: CI, `NO_COLOR`, `--quiet`, no terminal. */
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
    preflight(items) {
      if (quiet || items.length === 0) {
        return;
      }
      logger.info(color.bold('Preflight:'));
      items.forEach(preflightLine);
    },
    todo(plan) {
      if (!quiet) {
        describeChangePlan(plan)
          .split('\n')
          .forEach((line) => logger.info(line));
      }
      return Promise.resolve();
    },
    summary(lines) {
      lines.forEach((line) => logger.info(line));
    },
    note(text) {
      if (!quiet) {
        logger.info(color.dim(text));
      }
    },
  };
}
