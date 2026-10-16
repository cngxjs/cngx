import { execFileSync } from 'node:child_process';

/**
 * `install-only`: the only changes are the package install `ng add` ran
 * first. `no-repository`: the folder is outside a repository; `no-git`: git
 * is not installed; `unknown`: git ran and failed otherwise.
 */
export type GitState = 'clean' | 'install-only' | 'dirty' | 'no-repository' | 'no-git' | 'unknown';

export type GitExec = (
  file: string,
  args: readonly string[],
  options: { readonly cwd: string; readonly encoding: 'utf8'; readonly stdio: readonly ['ignore', 'pipe', 'ignore'] },
) => string;

const run: GitExec = (file, args, options) =>
  execFileSync(file, [...args], { ...options, stdio: [...options.stdio] });

// `ng add` installs the package before the schematic runs, so the root
// manifest and lockfile are already modified when the checklist reads git.
const INSTALL_FILES: ReadonlySet<string> = new Set([
  'package.json',
  'package-lock.json',
  'npm-shrinkwrap.json',
  'yarn.lock',
  'pnpm-lock.yaml',
  'bun.lock',
  'bun.lockb',
]);

// A porcelain v1 line is `XY path`, the path relative to the repository
// root, so an app in a subfolder strips its own prefix first; a rename
// (`old -> new`) never matches.
function isInstallChange(line: string, prefix: string): boolean {
  const path = line.slice(3);
  return path.startsWith(prefix) && INSTALL_FILES.has(path.slice(prefix.length));
}

function stateOf(status: string, prefix: string): GitState {
  const lines = status.split('\n').filter((line) => line !== '');
  if (lines.length === 0) {
    return 'clean';
  }
  return lines.every((line) => isInstallChange(line, prefix)) ? 'install-only' : 'dirty';
}

// git exits 128 outside a repository; a missing binary fails the spawn.
function failureOf(error: unknown): GitState {
  const { status, code } = (error ?? {}) as { readonly status?: unknown; readonly code?: unknown };
  if (code === 'ENOENT') {
    return 'no-git';
  }
  return status === 128 ? 'no-repository' : 'unknown';
}

/**
 * Whether the app has uncommitted work, for the git line of the preflight
 * checklist. Shell only: no plan step reads it, and a failing git is a
 * state of its own, never an error.
 */
export function readGitState(cwd: string, exec: GitExec = run): GitState {
  const options = { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] } as const;
  try {
    const prefix = exec('git', ['rev-parse', '--show-prefix'], options).trim();
    return stateOf(exec('git', ['status', '--porcelain'], options), prefix);
  } catch (error) {
    return failureOf(error);
  }
}
