import { execFileSync } from 'node:child_process';

export type GitState = 'clean' | 'dirty' | 'unknown';

export type GitExec = (
  file: string,
  args: readonly string[],
  options: { readonly cwd: string; readonly encoding: 'utf8'; readonly stdio: readonly ['ignore', 'pipe', 'ignore'] },
) => string;

const run: GitExec = (file, args, options) =>
  execFileSync(file, [...args], { ...options, stdio: [...options.stdio] });

/**
 * Whether the app has uncommitted work, for the confirm line an existing app
 * sees before apply. Shell only: no plan step reads it, and outside a
 * repository (or without git) it is `unknown`, never an error.
 */
export function readGitState(cwd: string, exec: GitExec = run): GitState {
  try {
    const status = exec('git', ['status', '--porcelain'], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return status.trim() === '' ? 'clean' : 'dirty';
  } catch {
    return 'unknown';
  }
}
