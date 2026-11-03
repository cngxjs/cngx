import { mkdirSync, mkdtempSync, readFileSync, rmSync, utimesSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { checkDist, compiledSources } from '../package-dist-check.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DIST_CHECK = 'node ../../scripts/package-dist-check.mjs --package-dir=. && ';
const created = [];

// The exclude forms of packages/cli and packages/mcp today.
const EXCLUDE = ['dist', 'node_modules', 'src/**/*.spec.ts', 'src/testing/**', 'src/readme-guard.ts'];

function pkg(files, { exclude = EXCLUDE, dist = true, tsconfig } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'cngx-dist-check-'));
  created.push(dir);
  writeFileSync(join(dir, 'package.json'), JSON.stringify({ name: '@cngx/cli' }));
  writeFileSync(join(dir, 'tsconfig.json'), JSON.stringify(tsconfig ?? { include: ['src/**/*.ts'], exclude }));
  for (const file of ['src/index.ts', ...files]) {
    mkdirSync(dirname(join(dir, file)), { recursive: true });
    writeFileSync(join(dir, file), '');
    setAge(dir, file, 100);
  }
  if (dist) {
    mkdirSync(join(dir, 'dist'));
    writeFileSync(join(dir, 'dist', 'index.js'), '');
    setAge(dir, 'dist/index.js', 50);
  }
  return dir;
}

/** Sets a file's mtime to `secondsAgo` before now. */
function setAge(dir, file, secondsAgo) {
  const at = Date.now() / 1000 - secondsAgo;
  utimesSync(join(dir, file), at, at);
}

/** Whether a prepublishOnly chain runs the dist check before anything else. */
const startsWithDistCheck = (chain) => typeof chain === 'string' && chain.startsWith(DIST_CHECK);

afterEach(() => {
  while (created.length > 0) {
    rmSync(created.pop(), { recursive: true, force: true });
  }
});

describe('package-dist-check', () => {
  it('fails without dist/index.js and names the build script', () => {
    const result = checkDist(pkg([], { dist: false }));

    expect(result.ok).toBe(false);
    expect(result.message).toContain('dist/index.js is missing. Run npm run build:cli.');
  });

  it('passes a dist newer than every compiled source', () => {
    expect(checkDist(pkg(['src/core/a.ts']))).toEqual({ ok: true, count: 2 });
  });

  it('fails a dist older than a compiled source', () => {
    const dir = pkg(['src/core/a.ts']);
    setAge(dir, 'src/core/a.ts', 10);

    const result = checkDist(dir);
    expect(result.ok).toBe(false);
    expect(result.message).toContain('src/core/a.ts');
  });

  it('passes a dist older than only excluded files', () => {
    const dir = pkg(['src/a.spec.ts', 'src/testing/helper.ts', 'src/readme-guard.ts']);
    for (const file of ['src/a.spec.ts', 'src/testing/helper.ts', 'src/readme-guard.ts']) {
      setAge(dir, file, 10);
    }

    expect(checkDist(dir).ok).toBe(true);
    expect(compiledSources(dir)).toEqual(['src/index.ts']);
  });

  it('fails an exclude form it does not understand, naming it', () => {
    const result = checkDist(pkg([], { exclude: ['src/**/fixtures/*.ts'] }));

    expect(result).toEqual({ ok: false, message: "unsupported tsconfig exclude form 'src/**/fixtures/*.ts'" });
  });

  it.each([
    [{ exclude: EXCLUDE }, 'tsconfig has no include'],
    [{ include: [], exclude: EXCLUDE }, 'tsconfig has no include'],
    [{ extends: './base.json', include: ['src/**/*.ts'] }, "tsconfig field 'extends' is not read"],
    [{ files: ['src/index.ts'], include: ['src/**/*.ts'] }, "tsconfig field 'files' is not read"],
  ])('fails a tsconfig it cannot read fully: %j', (tsconfig, message) => {
    const result = checkDist(pkg([], { tsconfig }));

    expect(result.ok).toBe(false);
    expect(result.message).toContain(message);
  });

  it('reads the real cli and mcp tsconfigs', () => {
    for (const name of ['cli', 'mcp']) {
      const sources = compiledSources(join(ROOT, 'packages', name));
      expect(sources).toContain('src/index.ts');
      expect(sources.some((path) => path.endsWith('.spec.ts'))).toBe(false);
    }
  });
});

describe('prepublishOnly wiring', () => {
  it('the cli and mcp chains start with the dist check', () => {
    for (const name of ['cli', 'mcp']) {
      const { scripts } = JSON.parse(readFileSync(join(ROOT, 'packages', name, 'package.json'), 'utf8'));
      expect(startsWithDistCheck(scripts.prepublishOnly), `${name}: ${scripts.prepublishOnly}`).toBe(true);
    }
  });

  it('mutation: a chain without the dist check fails the same assertion', () => {
    expect(startsWithDistCheck('node ../../scripts/mcp-bundle-check.mjs')).toBe(false);
  });
});
