import {
  Listr,
  type ListrBaseClassOptions,
  type ListrContext,
  type ListrRendererValue,
  type ListrTask,
} from 'listr2';

import { type ChangePlan, describePlanItem, planSections } from '../plan/plan';
import { type Palette } from './palette';
import { createPlainRenderer, formatPlanHeading, formatPlanItem } from './plain-renderer';
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

// One task per planned line in plan order (the lockstep @cngx additions
// fold into one), then the idempotent hits as skipped tasks, folded the
// same way, so the list shows the whole plan. The tasks carry no work: the tree changes run in
// `applyChangePlan` and the CLI commits them after the rule, so the list is
// the plan's projection, not a progress meter. A note changes nothing, so it
// is no task: a ticked note would read as done.
function todoTasks(plan: ChangePlan, color: Palette): ListrTask[] {
  const sections = planSections(plan);
  const planned = sections.find((section) => section.marker === '+');
  const inPlace = sections.find((section) => section.marker === '=');
  return [
    ...(planned?.items ?? []).map(
      (item): ListrTask => ({
        title: item.reason === undefined ? item.label : `${item.label} ${color.dim(`- ${item.reason}`)}`,
        task: () => undefined,
      }),
    ),
    ...(inPlace?.items ?? []).map(
      (item): ListrTask => ({
        title: item.label,
        skip: () => describePlanItem(item),
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
    async todo(plan, todoOptions) {
      // A ticked task reads as done; before a confirm or under a dry run
      // nothing is, so the plan prints as the plain renderer's lines.
      if (todoOptions?.next !== undefined && todoOptions.next !== 'apply') {
        return plain.todo(plan, todoOptions);
      }
      const tasks = todoTasks(plan, color);
      const notes = planSections(plan).find((section) => section.marker === '-');
      if (tasks.length === 0 && notes === undefined) {
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
      if (notes !== undefined) {
        logger.info(formatPlanHeading(notes.title, notes.count, color));
        notes.items.forEach((item) => logger.info(formatPlanItem(notes.marker, item, color)));
      }
      plan.warnings.forEach((warning) => logger.warn(`${color.yellow('!')} ${warning}`));
    },
  };
}
