import { type ColorEnv, createPalette } from './palette';
import { type RendererOptions, type RenderLogger } from './renderer';

/** The slice of `process.stdout` the terminal check reads and the live renderer writes to. */
export interface TerminalStream {
  readonly isTTY?: boolean;
  write?(chunk: string): unknown;
}

// The Angular CLI's reading of a boolean env variable
// (`@angular/cli/src/utilities/environment-options.js`): `1` / `true` and
// `0` / `false`, any case; anything else is unset.
function tristate(value: string | undefined): boolean | undefined {
  const lower = value?.toLowerCase();
  if (lower === '1' || lower === 'true') {
    return true;
  }
  return lower === '0' || lower === 'false' ? false : undefined;
}

/**
 * Whether the run is under CI, read the way the Angular CLI reads it: only
 * `CI=1` and `CI=true` count. The renderer options read it, and `ng add`
 * names it as the reason an existing app is applied without a confirm.
 */
export function isCi(env: ColorEnv): boolean {
  return tristate(env['CI']) === true;
}

// `NG_FORCE_TTY` overrides the stream and CI both, as in the CLI's `isTTY`.
function isTerminal(env: ColorEnv, stream: TerminalStream): boolean {
  return tristate(env['NG_FORCE_TTY']) ?? (stream.isTTY === true && !isCi(env));
}

/**
 * Whether a question can be asked and answered: the output is a terminal
 * and so is stdin, else a prompt waits on a pipe that never answers.
 */
export function canReachPrompts(env: ColorEnv, isTTY: boolean, stdin: TerminalStream): boolean {
  return isTTY && isTerminal(env, stdin);
}

/**
 * The renderer options of one run, built the same way by `ng add` and every
 * `ng update` migration, so both pick the same renderer: a live task list on
 * an interactive, coloured terminal, plain lines everywhere else. A CI
 * runner with a pseudo terminal counts as no terminal unless `NG_FORCE_TTY`
 * says otherwise; `isTTY` with `canReachPrompts` decides whether `ng add`
 * may prompt.
 */
export function createShellRendererOptions(
  env: ColorEnv,
  stdout: TerminalStream,
  stderr: TerminalStream,
  logger: RenderLogger,
  quiet: boolean,
): RendererOptions {
  const isTTY = isTerminal(env, stdout);
  return {
    isTTY,
    color: createPalette(env, isTTY),
    quiet,
    logger,
    terminal: isTTY ? streamLogger(stdout, stderr) : undefined,
  };
}

// The CLI hands a schematic an indenting child logger, so every line through
// `context.logger` lands two levels in. On a terminal both renderers write
// beside the prompts and the task list, which go to the stream straight, so
// their lines go there too and start at the left edge like theirs. Warnings
// and errors take stderr, as `context.logger` routes them off a terminal.
function streamLogger(stdout: TerminalStream, stderr: TerminalStream): RenderLogger | undefined {
  if (stdout.write === undefined) {
    return undefined;
  }
  const lineTo =
    (stream: TerminalStream) =>
    (message: string): void => {
      stream.write?.(`${message}\n`);
    };
  const problem = lineTo(stderr.write === undefined ? stdout : stderr);
  return { info: lineTo(stdout), warn: problem, error: problem };
}
