import { type Change } from '../plan/change';
import { describeChangePlan } from '../plan/plan';
import { type PreflightItem, type Renderer, type RendererOptions } from './renderer';

type PlainOptions = Pick<RendererOptions, 'color' | 'verbosity' | 'logger'>;

function changeTarget(change: Change): string {
  switch (change.kind) {
    case 'create-file':
    case 'edit-file':
    case 'add-import':
    case 'add-style-import':
    case 'write-json':
      return change.path;
    case 'add-dependency':
      return `${change.name}@${change.version}`;
    case 'add-provider':
      return `${change.call.symbol} in project ${change.project}`;
    case 'note':
      return '';
    default: {
      const unmapped: never = change;
      throw new Error(`No target for change ${JSON.stringify(unmapped)}.`);
    }
  }
}

function detailLine(change: Change): string {
  const target = changeTarget(change);
  return target === ''
    ? `  ${change.id}: ${change.kind}`
    : `  ${change.id}: ${change.kind} ${target}`;
}

/** Line output through the logger: CI, `NO_COLOR`, `--quiet`, no terminal. */
export function createPlainRenderer({ color, verbosity, logger }: PlainOptions): Renderer {
  const quiet = verbosity === 'quiet';

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
        if (verbosity === 'verbose' && plan.changes.length > 0) {
          logger.info('Details:');
          plan.changes.map(detailLine).forEach((line) => logger.info(line));
        }
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
