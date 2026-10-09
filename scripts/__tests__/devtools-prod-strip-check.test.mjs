import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { describe, expect, it } from 'vitest';

import { MARKER, deriveNeedles, scanBundle } from '../devtools-prod-strip-check.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '../..');
const SCRIPT = join(ROOT, 'scripts', 'devtools-prod-strip-check.mjs');

function fixture(files) {
  const dir = mkdtempSync(join(tmpdir(), 'prod-strip-'));
  for (const [path, text] of Object.entries(files)) {
    mkdirSync(dirname(join(dir, path)), { recursive: true });
    writeFileSync(join(dir, path), text);
  }
  return dir;
}

function check(dist, source) {
  return spawnSync(process.execPath, [SCRIPT, '--dist', dist, '--source', source], {
    cwd: ROOT,
    encoding: 'utf8',
  });
}

const CLEAN_SOURCE = { 'lib/a.ts': 'export const a = 1;\n' };

describe('devtools-prod-strip-check - needle derivation', () => {
  it('always includes the cngx-dev marker', () => {
    expect(deriveNeedles([]).needles).toEqual([MARKER]);
  });

  it('finds single- and double-quoted dotted debugName literals', () => {
    const { needles, violations } = deriveNeedles([
      {
        path: 'lib/tracker.ts',
        text: "computed(fn, DEV ? { debugName: 'transitionTracker.current' } : undefined);",
      },
      {
        path: 'lib/core.ts',
        text: 'computed(fn, { equal, ...(DEV ? { debugName: "selectCore.errorContext" } : {}) });',
      },
    ]);

    expect(violations).toEqual([]);
    expect(needles).toEqual([MARKER, 'transitionTracker.current', 'selectCore.errorContext']);
  });

  it('ignores spec files', () => {
    const { needles, violations } = deriveNeedles([
      { path: 'lib/tracker.spec.ts', text: "signal(0, { debugName: 'value' });" },
    ]);

    expect(needles).toEqual([MARKER]);
    expect(violations).toEqual([]);
  });

  it('rejects a bare-word name with file, line and value', () => {
    const { violations } = deriveNeedles([
      { path: 'lib/a.ts', text: "const x = 1;\nsignal(0, { debugName: 'value' });" },
    ]);

    expect(violations).toEqual([
      { file: 'lib/a.ts', line: 2, value: 'value', reason: 'not a dotted <owner>.<signal> name' },
    ]);
  });

  it('rejects a template-literal value', () => {
    const { violations } = deriveNeedles([
      { path: 'lib/a.ts', text: 'signal(0, { debugName: `tracker.${name}` });' },
    ]);

    expect(violations).toHaveLength(1);
    expect(violations[0].reason).toBe('not a plain string literal');
  });

  it('finds no non-conforming debugName in the real projects/** tree', () => {
    const result = spawnSync(
      process.execPath,
      [SCRIPT, '--dist', fixture({ 'main.js': 'console.log(1);' }), '--source', 'projects'],
      { cwd: ROOT, encoding: 'utf8' },
    );

    expect(result.stderr).toBe('');
    expect(result.status).toBe(0);
  });
});

describe('devtools-prod-strip-check - bundle scan', () => {
  it('reports each needle occurrence with file and offset', () => {
    const hits = scanBundle([{ path: 'main.js', text: `a${MARKER}factory b${MARKER}x` }], [MARKER]);

    expect(hits).toEqual([
      { file: 'main.js', offset: 1, needle: MARKER },
      { file: 'main.js', offset: 19, needle: MARKER },
    ]);
  });

  it('counts a debugName only as a whole quoted string, never as a member chain', () => {
    const name = 'treeController.isExpanded';
    const text = `o=r.host.${name}(n.id);a="${name}";b='${name}';c=\`${name}\`;d="${name}.x"`;

    const hits = scanBundle([{ path: 'main.js', text }], [MARKER, name]);

    expect(hits.map((hit) => text[hit.offset - 1])).toEqual(['"', "'", '`']);
  });

  it('passes a clean bundle', () => {
    const result = check(fixture({ 'main.js': 'console.log(1);' }), fixture(CLEAN_SOURCE));

    expect(result.status).toBe(0);
  });

  it('fails a bundle carrying the marker and names the file', () => {
    const result = check(
      fixture({ 'chunk-a.js': `x.tag(m, { kind: "${MARKER}override-merge" });` }),
      fixture(CLEAN_SOURCE),
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('chunk-a.js');
  });

  it('fails a bundle carrying a derived debugName', () => {
    const source = fixture({
      'lib/t.ts': "computed(fn, { debugName: 'transitionTracker.current' });",
    });
    const result = check(
      fixture({ 'main.js': 'computed(f,{debugName:"transitionTracker.current"})' }),
      source,
    );

    expect(result.status).toBe(1);
    expect(result.stderr).toContain('transitionTracker.current');
  });

  it('exits 2 when the bundle directory is missing', () => {
    const result = check(join(tmpdir(), 'prod-strip-missing-dir'), fixture(CLEAN_SOURCE));

    expect(result.status).toBe(2);
    expect(result.stderr).toContain('npm run build:examples');
  });

  it('exits 3 when a hand-written debugName breaks the naming contract', () => {
    const result = check(
      fixture({ 'main.js': '' }),
      fixture({ 'lib/a.ts': "signal(0, { debugName: 'value' });" }),
    );

    expect(result.status).toBe(3);
    expect(result.stderr).toContain('a.ts:1');
  });
});
