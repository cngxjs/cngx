import { type ChangePlan } from '../plan/plan';
import { type Palette } from './palette';
import { createPlainRenderer } from './plain-renderer';
import { createTtyRenderer, type TtyListrOptions } from './tty-renderer';

export type PreflightStatus = 'ok' | 'warn' | 'fail';

/** One line of the preflight checklist (Angular version, workspace, git state). */
export interface PreflightItem {
  readonly label: string;
  readonly status: PreflightStatus;
  readonly detail?: string;
}

/** The slice of `context.logger` the renderer writes through. */
export interface RenderLogger {
  info(message: string): void;
  warn(message: string): void;
  error(message: string): void;
}

/**
 * What follows the plan list: `apply` (the default) ticks the tasks as they
 * run; ahead of a `dry-run` or a `confirm` nothing has run yet and no task
 * may read as done, and ahead of a `confirm` the plan prints even under
 * `--quiet`, so the question has something to answer.
 */
export type TodoNext = 'apply' | 'dry-run' | 'confirm';

/** How the plan list reads. */
export interface TodoOptions {
  readonly next?: TodoNext;
}

/**
 * Every terminal projection of a run. It only renders: the plan comes from
 * `createChangePlan`, the summary lines from the caller.
 */
export interface Renderer {
  /** A line that opens a run, such as the release a migration belongs to. */
  heading(text: string): void;
  preflight(items: readonly PreflightItem[]): void;
  todo(plan: ChangePlan, options?: TodoOptions): Promise<void>;
  summary(lines: readonly string[]): void;
  note(text: string): void;
}

export interface RendererOptions {
  /** Interactive terminal and not CI; the shell resolves it once. */
  readonly isTTY: boolean;
  readonly color: Palette;
  /** `--quiet`: print only the summary. */
  readonly quiet: boolean;
  readonly logger: RenderLogger;
  /**
   * The terminal itself: on a TTY both renderers write there, so their lines
   * start at the left edge next to the prompts and the task list instead of
   * under the CLI's logger indent. `undefined` without a terminal, where the
   * plain lines stay on the logger for CI logs.
   */
  readonly terminal?: RenderLogger;
  /** Overrides for the TTY task list; specs pass listr2's `test` renderer. */
  readonly listr?: TtyListrOptions;
}

/**
 * The live task list needs an interactive, coloured terminal and a run that
 * wants more than the summary. Everything else gets plain lines: on the
 * terminal for `NO_COLOR` and `--quiet`, through the logger for CI logs.
 */
export function createRenderer(options: RendererOptions): Renderer {
  const live = options.isTTY && options.color.enabled && !options.quiet;
  const writer = { ...options, logger: options.terminal ?? options.logger };
  return live ? createTtyRenderer(writer) : createPlainRenderer(writer);
}
