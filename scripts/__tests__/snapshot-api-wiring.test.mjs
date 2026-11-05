// Proves snapshot-api.yml publishes the error-code asset, not just that the text
// mentions it: both workflow shell blocks are extracted and executed with a stub
// `gh` first on PATH, in a temp directory, so the push and the workflow_dispatch
// branches run before a merge and no real release is touched. Actions runs a
// `run` block with `bash -e`, which is how the blocks run here too.
import { spawnSync } from 'node:child_process';
import { chmodSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { delimiter, dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import yaml from 'js-yaml';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { ERROR_CODE_ASSET } from '../mcp-snapshot.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const ASSET_PATH = relative(ROOT, ERROR_CODE_ASSET).replaceAll('\\', '/');
const steps = yaml.load(readFileSync(join(ROOT, '.github', 'workflows', 'snapshot-api.yml'), 'utf8')).jobs.snapshot.steps;

const stepNamed = (name) => steps.find((step) => step.name === name);
const GENERATE_DOCS = 'Generate API snapshots';
const GENERATE_ASSET = 'Generate the error-code asset';
const UPLOAD = 'Upload snapshots as release assets';

describe('snapshot-api.yml wiring', () => {
  it('generates the asset after docs:json, unconditionally', () => {
    const names = steps.map((step) => step.name);
    expect(stepNamed(GENERATE_DOCS).run).toContain('npm run docs:json');
    expect(names.indexOf(GENERATE_ASSET)).toBe(names.indexOf(GENERATE_DOCS) + 1);
    expect(names.indexOf(UPLOAD)).toBe(names.indexOf(GENERATE_ASSET) + 1);
    expect(stepNamed(GENERATE_ASSET).if).toBeUndefined();
    expect(stepNamed(GENERATE_ASSET)['continue-on-error']).toBeUndefined();
    expect(stepNamed(GENERATE_ASSET).run).toContain('node scripts/mcp-snapshot.mjs');
  });

  it('uploads the path the snapshot script writes', () => {
    expect(stepNamed(UPLOAD).run).toContain(ASSET_PATH);
    expect(stepNamed(UPLOAD).if).toBeUndefined();
  });
});

describe('snapshot-api.yml shell', () => {
  let dir;
  let log;
  let bin;

  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), 'snapshot-api-wiring-'));
    log = join(dir, 'gh.log');
    bin = join(dir, 'stub-bin');
    mkdirSync(bin);
    const gh = join(bin, 'gh');
    writeFileSync(
      gh,
      '#!/usr/bin/env bash\nprintf \'%s\\n\' "$*" >> "$GH_LOG"\nif [ "$1 $2" = "release view" ]; then exit "${GH_VIEW_EXIT:-0}"; fi\n',
    );
    chmodSync(gh, 0o755);
  });

  afterEach(() => rmSync(dir, { recursive: true, force: true }));

  function runStep(name, event, env = {}) {
    const work = join(dir, 'work');
    mkdirSync(work, { recursive: true });
    return spawnSync('bash', ['-e', '-c', stepNamed(name).run], {
      cwd: work,
      encoding: 'utf8',
      env: {
        ...process.env,
        PATH: `${bin}${delimiter}${process.env.PATH}`,
        GH_LOG: log,
        GITHUB_EVENT_NAME: event,
        TAG: 'v9.9.9',
        ...env,
      },
    });
  }

  function seed(...paths) {
    for (const path of paths) {
      const file = join(dir, 'work', path);
      mkdirSync(dirname(file), { recursive: true });
      writeFileSync(file, '{}');
    }
  }

  const ghCalls = () => {
    try {
      return readFileSync(log, 'utf8').trim().split('\n');
    } catch {
      return [];
    }
  };
  const uploads = () => ghCalls().filter((call) => call.startsWith('release upload'));

  const RAW = ['.compodoc/documentation.json', '.compodoc-llm/llm-context.md'];

  describe('generate', () => {
    it('fails a tag push when the script does not run', () => {
      expect(runStep(GENERATE_ASSET, 'push').status).not.toBe(0);
    });

    it('warns and passes a backfill whose checkout has no such script', () => {
      const result = runStep(GENERATE_ASSET, 'workflow_dispatch');
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('::warning::v9.9.9 predates the error-code asset');
    });
  });

  describe('upload', () => {
    it('uploads all three assets when the asset exists', () => {
      seed(...RAW, ASSET_PATH);
      const result = runStep(UPLOAD, 'push');
      expect(result.status).toBe(0);
      expect(uploads()).toEqual([`release upload v9.9.9 ${[...RAW, ASSET_PATH].join(' ')} --clobber`]);
      expect(result.stdout).toContain('Snapshotted v9.9.9: documentation.json llm-context.md error-codes.json.');
    });

    it('names the uploaded assets in the notes of a new release', () => {
      seed(...RAW, ASSET_PATH);
      expect(runStep(UPLOAD, 'push', { GH_VIEW_EXIT: '1' }).status).toBe(0);
      const create = ghCalls().find((call) => call.startsWith('release create'));
      expect(create).toContain('documentation.json llm-context.md error-codes.json');
    });

    it('fails a tag push without the asset before touching the release', () => {
      seed(...RAW);
      const result = runStep(UPLOAD, 'push', { GH_VIEW_EXIT: '1' });
      expect(result.status).not.toBe(0);
      expect(result.stdout).toContain('::error::');
      expect(ghCalls()).toEqual([]);
    });

    it('warns and uploads the other two on a backfill without the asset', () => {
      seed(...RAW);
      const result = runStep(UPLOAD, 'workflow_dispatch');
      expect(result.status).toBe(0);
      expect(result.stdout).toContain('::warning::');
      expect(uploads()).toEqual([`release upload v9.9.9 ${RAW.join(' ')} --clobber`]);
    });
  });
});
