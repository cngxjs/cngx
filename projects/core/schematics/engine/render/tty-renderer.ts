import {
  Listr,
  type ListrBaseClassOptions,
  type ListrContext,
  type ListrRendererValue,
  type ListrTask,
} from 'listr2';

import { type Change } from '../plan/change';
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

type TtyOptions = Pick<RendererOptions, 'color' | 'quiet' | 'logger' | 'listr'>;

const isNote = (change: Change): boolean => change.kind === 'note';

// One task per planned change in plan order, then the idempotent hits as
// skipped tasks, so the list shows the whole plan. The tasks carry no work:
// the tree changes run in `applyChangePlan` and the CLI commits them after
// the rule, so the list is the plan's projection, not a progress meter. A
// note changes nothing, so it is no task: a ticked note would read as done.
function todoTasks(plan: ChangePlan, color: Palette): ListrTask[] {
  return [
    ...plan.changes
      .filter((change) => !isNote(change))
      .map(
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
 * The interactive renderer: a `listr2` task list for the plan's changes and
 * idempotent hits; the plan's notes below the list, the preflight, the
 * summary and every other line as the plain renderer prints them.
 */
export function createTtyRenderer(options: TtyOptions): Renderer {
  const plain = createPlainRenderer(options);
  const { color, logger, listr = {} } = options;

  return {
    ...plain,
    async todo(plan) {
      const tasks = todoTasks(plan, color);
      const notes = plan.changes.filter(isNote);
      if (tasks.length === 0 && notes.length === 0) {
        logger.info('Nothing to change.');
      }
      if (tasks.length > 0) {
        await new Listr<ListrContext, ListrRendererValue, ListrRendererValue>(tasks, {
          ...TTY_LISTR_DEFAULTS,
          ...listr,
          concurrent: false,
          exitOnError: false,
        }).run();
      }
      if (notes.length > 0) {
        logger.info(`Notes (${notes.length}):`);
        notes.forEach((note) => logger.info(`  - ${note.label} ${color.dim(`- ${note.reason}`)}`));
      }
      plan.warnings.forEach((warning) => logger.warn(`${color.yellow('!')} ${warning}`));
    },
  };
}
