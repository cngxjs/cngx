import { describeChangePlan } from '../plan/plan';
import { type PreflightItem, type Renderer, type RendererOptions } from './renderer';

type PlainOptions = Pick<RendererOptions, 'color' | 'quiet' | 'logger'>;

/** Line output through the logger: CI, `NO_COLOR`, `--quiet`, no terminal. */
export function createPlainRenderer({ color, quiet, logger }: PlainOptions): Renderer {

  function preflightLine(item: PreflightItem): void {
    const text = item.detail === undefined ? item.label : `${item.label} (${item.detail})`;
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
