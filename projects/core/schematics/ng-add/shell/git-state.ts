import { execFileSync } from 'node:child_process';

/** `install-only`: the only changes are the package install `ng add` ran first. */
export type GitState = 'clean' | 'install-only' | 'dirty' | 'unknown';

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

// A porcelain v1 line is `XY path`; a rename (`old -> new`) never matches.
function isInstallChange(line: string): boolean {
  return INSTALL_FILES.has(line.slice(3));
}

function stateOf(status: string): GitState {
  const lines = status.split('\n').filter((line) => line !== '');
  if (lines.length === 0) {
    return 'clean';
  }
  return lines.every(isInstallChange) ? 'install-only' : 'dirty';
}

/**
 * Whether the app has uncommitted work, for the git line of the preflight
 * checklist. Shell only: no plan step reads it, and outside a
 * repository (or without git) it is `unknown`, never an error.
 */
export function readGitState(cwd: string, exec: GitExec = run): GitState {
  try {
    const status = exec('git', ['status', '--porcelain'], { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] });
    return stateOf(status);
  } catch {
    return 'unknown';
  }
}
