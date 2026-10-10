import {
  Listr,
  type ListrBaseClassOptions,
  type ListrContext,
  type ListrRendererValue,
  type ListrTask,
} from 'listr2';

import { type ChangePlan } from '../plan/plan';
import { type Palette } from './palette';
import { createPlainRenderer } from './plain-renderer';
import { type Renderer, type RendererOptions } from './renderer';

/** listr2 options merged over the defaults; specs swap in the `test` renderer. */
export type TtyListrOptions = Omit<
  ListrBaseClassOptions<ListrContext, ListrRendererValue, ListrRendererValue>,
  'concurrent' | 'exitOnError'
>;

/**
 * listr2 defaults for the plan list. A collapsed skip renders as one
 * `↓ label - reason` line; uncollapsed, listr2 marks it with the warning
 * icon and repeats the message on a second line, which reads as a problem
 * for what is an idempotent hit.
 */
export const TTY_LISTR_DEFAULTS = { rendererOptions: { collapseSkips: true } } as const;

type TtyOptions = Pick<RendererOptions, 'color' | 'verbosity' | 'logger' | 'listr'>;

// One task per planned change in plan order, then the idempotent hits as
// skipped tasks, so the list shows the whole plan. The tasks carry no work:
// the tree changes run in `applyChangePlan` and the CLI commits them after
// the rule, so the list is the plan's projection, not a progress meter.
function todoTasks(plan: ChangePlan, color: Palette): ListrTask[] {
  return [
    ...plan.changes.map(
      (change): ListrTask => ({
        title: `${change.label} ${color.dim(`- ${change.reason}`)}`,
        task: () => undefined,
      }),
    ),
    ...plan.skipped.map(
      (step): ListrTask => ({
        title: step.label,
        skip: () => `${step.label} - ${step.reason}`,
        task: () => undefined,
      }),
    ),
  ];
}

/**
 * The interactive renderer: a `listr2` task list for the plan, everything
 * else (preflight, summary, notes) as the same lines the plain renderer
 * prints.
 */
export function createTtyRenderer(options: TtyOptions): Renderer {
  const plain = createPlainRenderer(options);
  const { color, logger, listr = {} } = options;

  return {
    ...plain,
    async todo(plan) {
      if (plan.changes.length === 0 && plan.skipped.length === 0) {
        logger.info('Nothing to change.');
      } else {
        await new Listr<ListrContext, ListrRendererValue, ListrRendererValue>(
          todoTasks(plan, color),
          {
            ...TTY_LISTR_DEFAULTS,
            ...listr,
            concurrent: false,
            exitOnError: false,
          },
        ).run();
      }
      plan.warnings.forEach((warning) => logger.warn(`${color.yellow('!')} ${warning}`));
    },
  };
}
