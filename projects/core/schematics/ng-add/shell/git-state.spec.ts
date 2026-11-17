import { describe, expect, it, vi } from 'vitest';

import { type GitExec, readGitState, workspaceRootOf } from './git-state';

// Answers `git rev-parse --show-prefix` with the folder the app sits in
// inside its repository, and `git status --porcelain` with the given lines.
const repo =
  (status: string, prefix = ''): GitExec =>
  (_file, args) =>
    args[0] === 'rev-parse' ? `${prefix}\n` : status;

const failing = (error: Partial<NodeJS.ErrnoException> & { status?: number }): GitExec => () => {
  throw Object.assign(new Error('git failed'), error);
};

describe('readGitState', () => {
  it('reads a clean working tree', () => {
    const exec = vi.fn<GitExec>(() => '');
    expect(readGitState('/app', exec)).toBe('clean');
    expect(exec).toHaveBeenCalledWith('git', ['status', '--porcelain'], {
      cwd: '/app',
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
  });

  it('reads uncommitted changes as dirty', () => {
    expect(readGitState('/app', repo(' M src/app/app.config.ts\n?? notes.md\n'))).toBe('dirty');
  });

  it('reads the package install ng add ran before the schematic as install-only', () => {
    expect(readGitState('/app', repo(' M package.json\n M package-lock.json\n'))).toBe(
      'install-only',
    );
    expect(readGitState('/app', repo(' M package.json\n?? pnpm-lock.yaml\n'))).toBe('install-only');
  });

  it('reads the install plus any other change as dirty', () => {
    expect(readGitState('/app', repo(' M package.json\n M src/main.ts\n'))).toBe('dirty');
    expect(readGitState('/app', repo(' M libs/ui/package.json\n'))).toBe('dirty');
  });

  it('reads the install of an app in a subfolder of its repository as install-only', () => {
    expect(readGitState('/repo/apps/web', repo(' M apps/web/package.json\n M apps/web/package-lock.json\n', 'apps/web/'))).toBe(
      'install-only',
    );
    expect(readGitState('/repo/apps/web', repo(' M apps/web/package.json\n M package.json\n', 'apps/web/'))).toBe(
      'dirty',
    );
  });

  it('tells a folder outside a repository from a missing git and any other failure', () => {
    expect(readGitState('/app', failing({ status: 128 }))).toBe('no-repository');
    expect(readGitState('/app', failing({ code: 'ENOENT' }))).toBe('no-git');
    expect(readGitState('/app', failing({ status: 1 }))).toBe('unknown');
  });
});

describe('workspaceRootOf', () => {
  const workspace =
    (...files: readonly string[]) =>
    (path: string): boolean =>
      files.includes(path);

  it('walks up from a subfolder to the folder with angular.json', () => {
    expect(workspaceRootOf('/repo/app/src/app', workspace('/repo/app/angular.json'))).toBe('/repo/app');
  });

  it('accepts a hidden .angular.json', () => {
    expect(workspaceRootOf('/repo/app/src', workspace('/repo/app/.angular.json'))).toBe('/repo/app');
  });

  it('stops at the nearest workspace file', () => {
    expect(workspaceRootOf('/repo/app/src', workspace('/repo/angular.json', '/repo/app/angular.json'))).toBe('/repo/app');
  });

  it('keeps the start folder when no folder above has one', () => {
    expect(workspaceRootOf('/repo/app/src', workspace())).toBe('/repo/app/src');
  });
});
