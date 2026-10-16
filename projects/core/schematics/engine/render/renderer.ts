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

/** How the plan list reads: `pending` when nothing has run yet and may not. */
export interface TodoOptions {
  /** A confirm comes next or the run is a dry run: no task may read as done. */
  readonly pending?: boolean;
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
   * The terminal itself, for the live renderer: its lines start at the left
   * edge next to the prompts and the task list instead of under the CLI's
   * logger indent. `undefined` without a terminal.
   */
  readonly terminal?: RenderLogger;
  /** Overrides for the TTY task list; specs pass listr2's `test` renderer. */
  readonly listr?: TtyListrOptions;
}

/**
 * The live task list needs an interactive, coloured terminal and a run that
 * wants more than the summary. Everything else gets plain lines through the
 * logger, which is what CI logs and `NO_COLOR` users read.
 */
export function createRenderer(options: RendererOptions): Renderer {
  const live = options.isTTY && options.color.enabled && !options.quiet;
  return live
    ? createTtyRenderer({ ...options, logger: options.terminal ?? options.logger })
    : createPlainRenderer(options);
}
