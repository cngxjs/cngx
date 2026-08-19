import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { evaluate } from './post-tool-use.mjs';
import * as scanModule from '../bin/doctor/scan.mjs';

const HOOK = fileURLToPath(new URL('./post-tool-use.mjs', import.meta.url));
const created = [];

function project(layout) {
  const dir = mkdtempSync(join(tmpdir(), 'cngx-hook-'));
  created.push(dir);
  writeFileSync(join(dir, 'package.json'), JSON.stringify(layout.pkg ?? { name: 'fixture' }));
  for (const [rel, text] of Object.entries(layout.sources ?? {})) {
    const abs = join(dir, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, text);
  }
  for (const [rel, text] of Object.entries(layout.styles ?? {})) {
    const abs = join(dir, rel);
    mkdirSync(dirname(abs), { recursive: true });
    writeFileSync(abs, text);
  }
  return dir;
}

// Spawn the hook with a PostToolUse payload on stdin, isolating the snapshot
// cache into the project dir so afterEach cleans it up.
function runHook(dir, payload) {
  const stdout = execFileSync(process.execPath, [HOOK], {
    input: JSON.stringify(payload),
    encoding: 'utf8',
    env: { ...process.env, CNGX_DOCTOR_CACHE_DIR: join(dir, '.cache') },
  });
  return stdout;
}

function editPayload(dir, relFile) {
  return {
    tool_name: 'Edit',
    tool_input: { file_path: join(dir, relFile) },
    cwd: dir,
  };
}

afterEach(() => {
  vi.restoreAllMocks();
  while (created.length > 0) {
    rmSync(created.pop(), { recursive: true, force: true });
  }
});

describe('post-tool-use hook', () => {
  it('emits PostToolUse feedback for a @cngx edit over a tripping project', () => {
    const dir = project({
      sources: { 'src/app.ts': "import { CngxToaster } from '@cngx/ui/feedback';\n" },
    });
    const out = runHook(dir, editPayload(dir, 'src/app.ts'));
    const parsed = JSON.parse(out);
    expect(parsed.hookSpecificOutput.hookEventName).toBe('PostToolUse');
    expect(parsed.hookSpecificOutput.additionalContext).toContain('toaster-without-withtoasts');
  });

  it('stays silent on a clean @cngx project', () => {
    const dir = project({
      sources: { 'src/app.ts': "import { CngxSelect } from '@cngx/forms/select';\n" },
    });
    const out = runHook(dir, editPayload(dir, 'src/app.ts'));
    expect(out).toBe('');
  });

  it('stays silent when the edited file imports no @cngx symbol', () => {
    const dir = project({
      sources: { 'src/app.ts': "import { of } from 'rxjs';\nimport { CngxToaster } from '@cngx/ui/feedback';\n" },
      // The edited file itself does not import @cngx, even though a sibling does.
    });
    writeFileSync(join(dir, 'src', 'plain.ts'), "import { of } from 'rxjs';\n");
    const out = runHook(dir, editPayload(dir, 'src/plain.ts'));
    expect(out).toBe('');
  });

  it('stays silent for a non-Edit/Write tool (cheap-gate short-circuit)', () => {
    const dir = project({
      sources: { 'src/app.ts': "import { CngxToaster } from '@cngx/ui/feedback';\n" },
    });
    const out = runHook(dir, {
      tool_name: 'Read',
      tool_input: { file_path: join(dir, 'src/app.ts') },
      cwd: dir,
    });
    expect(out).toBe('');
  });

  it('does not re-walk src/** on a warm-cache edit', () => {
    const dir = project({
      sources: { 'src/app.ts': "import { CngxToaster } from '@cngx/ui/feedback';\n" },
    });
    const cacheDir = join(dir, '.cache');
    const spy = vi.spyOn(scanModule, 'scan');
    const payload = editPayload(dir, 'src/app.ts');

    evaluate(payload, { scan: scanModule.scan, cacheDir });
    evaluate(payload, { scan: scanModule.scan, cacheDir });

    // First call is a cold full walk (no prior); the second must take the
    // incremental path (prior + changedFile), proving no second full re-walk.
    expect(spy).toHaveBeenCalledTimes(2);
    expect(spy.mock.calls[0][1]).toBeUndefined();
    expect(spy.mock.calls[1][1]).toMatchObject({ changedFile: payload.tool_input.file_path });
    expect(spy.mock.calls[1][1].prior).toBeTruthy();
  });
});
