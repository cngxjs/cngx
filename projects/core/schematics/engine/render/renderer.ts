import { type ChangePlan } from '../plan/plan';
import { type Palette } from './palette';
import { createPlainRenderer } from './plain-renderer';
import { createTtyRenderer, type TtyListrOptions } from './tty-renderer';

/** `quiet` prints only the summary; `verbose` adds what each change touches. */
export type Verbosity = 'quiet' | 'normal' | 'verbose';

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
 * Every terminal projection of a run. It only renders: the plan comes from
 * `createChangePlan`, the summary lines from the caller.
 */
export interface Renderer {
  preflight(items: readonly PreflightItem[]): void;
  todo(plan: ChangePlan): Promise<void>;
  summary(lines: readonly string[]): void;
  note(text: string): void;
}

export interface RendererOptions {
  /** Interactive terminal and not CI; the shell resolves it once. */
  readonly isTTY: boolean;
  readonly color: Palette;
  readonly verbosity: Verbosity;
  readonly logger: RenderLogger;
  /** Overrides for the TTY task list; specs pass listr2's `test` renderer. */
  readonly listr?: TtyListrOptions;
}

/**
 * The live task list needs an interactive, coloured terminal and a run that
 * wants more than the summary. Everything else gets plain lines through the
 * logger, which is what CI logs and `NO_COLOR` users read.
 */
export function createRenderer(options: RendererOptions): Renderer {
  const live = options.isTTY && options.color.enabled && options.verbosity !== 'quiet';
  return live ? createTtyRenderer(options) : createPlainRenderer(options);
}
