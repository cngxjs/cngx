import { type ColorEnv, createPalette } from './palette';
import { type RendererOptions, type RenderLogger } from './renderer';

/** The slice of `process.stdout` the terminal check reads. */
export interface TerminalStream {
  readonly isTTY?: boolean;
}

/**
 * Whether the run is under CI. `CI=false` and `CI=0` are how some runners
 * say "not CI". The renderer options read it, and `ng add` names it as the
 * reason an existing app is applied without a confirm.
 */
export function isCi(env: ColorEnv): boolean {
  const ci = env['CI'];
  return ci !== undefined && ci !== '' && ci !== 'false' && ci !== '0';
}

/**
 * The renderer options of one run, built the same way by `ng add` and every
 * `ng update` migration, so both pick the same renderer: a live task list on
 * an interactive, coloured terminal, plain lines everywhere else. A CI
 * runner with a pseudo terminal counts as no terminal; `isTTY` also decides
 * whether `ng add` may prompt.
 */
export function createShellRendererOptions(
  env: ColorEnv,
  stdout: TerminalStream,
  logger: RenderLogger,
  quiet: boolean,
): RendererOptions {
  const isTTY = stdout.isTTY === true && !isCi(env);
  return {
    isTTY,
    color: createPalette(env, isTTY),
    verbosity: quiet ? 'quiet' : 'normal',
    logger,
  };
}
