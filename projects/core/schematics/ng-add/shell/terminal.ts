/** What a run can show and ask: a live terminal, and whether CI runs it. */
export interface Terminal {
  /** Interactive terminal and not CI; the renderer and the prompts read it. */
  readonly isTTY: boolean;
  readonly ci: boolean;
}

/** The slice of `process.stdout` the terminal check reads. */
export interface TerminalStream {
  readonly isTTY?: boolean;
}

// `CI=false` and `CI=0` are how some runners say "not CI".
function isCi(env: NodeJS.ProcessEnv): boolean {
  const ci = env['CI'];
  return ci !== undefined && ci !== '' && ci !== 'false' && ci !== '0';
}

/**
 * Resolved once per run by `ng add` and every `ng update` migration, so both
 * commands pick the same renderer and prompt behaviour. A CI runner with a
 * pseudo terminal still counts as no terminal.
 */
export function readTerminal(env: NodeJS.ProcessEnv, stdout: TerminalStream): Terminal {
  const ci = isCi(env);
  return { isTTY: stdout.isTTY === true && !ci, ci };
}
