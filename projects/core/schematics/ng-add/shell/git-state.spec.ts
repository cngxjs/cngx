import { describe, expect, it, vi } from 'vitest';

import { type GitExec, readGitState } from './git-state';

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
    expect(readGitState('/app', () => ' M src/app/app.config.ts\n?? notes.md\n')).toBe('dirty');
  });

  it('reads the package install ng add ran before the schematic as install-only', () => {
    expect(readGitState('/app', () => ' M package.json\n M package-lock.json\n')).toBe(
      'install-only',
    );
    expect(readGitState('/app', () => ' M package.json\n?? pnpm-lock.yaml\n')).toBe('install-only');
  });

  it('reads the install plus any other change as dirty', () => {
    expect(readGitState('/app', () => ' M package.json\n M src/main.ts\n')).toBe('dirty');
    expect(readGitState('/app', () => ' M libs/ui/package.json\n')).toBe('dirty');
  });

  it('reads a folder outside a repository or without git as unknown', () => {
    const fail: GitExec = () => {
      throw new Error('fatal: not a git repository');
    };
    expect(readGitState('/app', fail)).toBe('unknown');
  });
});
