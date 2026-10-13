import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { describe, expect, it } from 'vitest';

import {
  CODE_RANGES,
  DOCS_BASE_URL,
  MANIFEST_PATH,
  REPO_ROOT,
  SCHEMA_VERSION,
  SUMMARY_NODE_TITLE,
  SUMMARY_PATH,
  buildCodes,
  collectHelperCalls,
  generate,
  manifestOf,
  parsePage,
  withSummaryNode,
} from '../error-codes-manifest.mjs';
import { DEFAULT_BASE_URL } from '../llms-publish.mjs';

const SCHEMA = JSON.parse(
  readFileSync(resolve(REPO_ROOT, 'scripts/manifests/error-codes.schema.json'), 'utf-8'),
);

const call = (file, code, severity = 'warn') => ({ file, line: 1, code, severity });
const page = (code, title = `Title of ${code}`, extra = '') =>
  parsePage(`${code.toLowerCase()}.md`, `# ${code}\n\n## ${title}\n\n${extra}### Why\n\n### Fix\n`);

/** Every schema violation in a manifest, as readable rows. */
const schemaViolations = (manifest) => {
  const out = [];
  const allowed = (def) => new Set(Object.keys(def.properties));
  const top = allowed(SCHEMA);
  for (const key of Object.keys(manifest)) {
    if (!top.has(key)) {
      out.push(`top-level key ${key}`);
    }
  }
  for (const key of SCHEMA.required) {
    if (!(key in manifest)) {
      out.push(`missing ${key}`);
    }
  }
  const codeDef = SCHEMA.$defs.code;
  const codeKeys = allowed(codeDef);
  const pattern = new RegExp(codeDef.properties.code.pattern);
  for (const entry of manifest.codes) {
    for (const key of Object.keys(entry)) {
      if (!codeKeys.has(key)) {
        out.push(`${entry.code} key ${key}`);
      }
    }
    for (const key of codeDef.required) {
      if (!(key in entry)) {
        out.push(`${entry.code} missing ${key}`);
      }
    }
    if (!pattern.test(entry.code)) {
      out.push(`${entry.code} pattern`);
    }
    if (!codeDef.properties.severity.enum.includes(entry.severity)) {
      out.push(`${entry.code} severity ${entry.severity}`);
    }
    if (!codeDef.properties.status.enum.includes(entry.status)) {
      out.push(`${entry.code} status ${entry.status}`);
    }
  }
  const rangeKeys = allowed(SCHEMA.$defs.range);
  for (const range of manifest.ranges) {
    if (Object.keys(range).sort().join() !== [...rangeKeys].sort().join()) {
      out.push(`range ${JSON.stringify(range)}`);
    }
  }
  return out;
};

describe('error-code manifest generator', () => {
  it('collects literal codes and the channel from helper calls, skipping comments', () => {
    const calls = collectHelperCalls([
      {
        path: 'projects/core/a.ts',
        text: [
          "// cngxDevWarn('CNGX0009', 'in a comment')",
          "cngxDevWarn('CNGX0001', 'a');",
          "cngxDevError('CNGX0002', 'b', el);",
          "cngxDevWarn(code, 'c');",
        ].join('\n'),
      },
    ]);
    expect(calls.map(({ code, severity, line }) => ({ code, severity, line }))).toEqual([
      { code: 'CNGX0001', severity: 'warn', line: 2 },
      { code: 'CNGX0002', severity: 'error', line: 3 },
      { code: null, severity: 'warn', line: 4 },
    ]);
  });

  it('builds one entry per code, files sorted, title from the page', () => {
    const { codes, errors } = buildCodes(
      [call('projects/core/b.ts', 'CNGX0001'), call('projects/core/a.ts', 'CNGX0001')],
      [page('CNGX0001', 'Locale is not BCP 47')],
    );
    expect(errors).toEqual([]);
    expect(codes).toEqual([
      {
        code: 'CNGX0001',
        lib: 'core',
        severity: 'warn',
        title: 'Locale is not BCP 47',
        page: 'core-concepts/error-codes/cngx0001.md',
        url: `${DOCS_BASE_URL}cngx0001.html`,
        status: 'active',
        files: ['projects/core/a.ts', 'projects/core/b.ts'],
      },
    ]);
  });

  it('fails on a code without a page', () => {
    expect(buildCodes([call('projects/core/a.ts', 'CNGX0001')], []).errors).toEqual([
      'CNGX0001 has no page at core-concepts/error-codes/cngx0001.md',
    ]);
  });

  it('fails on a page without a code and without the retired marker', () => {
    expect(buildCodes([], [page('CNGX0001')]).errors).toEqual([
      'cngx0001.md has no call site; mark it "> Retired in <version>." or remove it',
    ]);
  });

  it('keeps a retired page as a retired entry', () => {
    const { codes, errors } = buildCodes([], [page('CNGX0001', 'Gone', '> Retired in 0.2.0.\n\n')]);
    expect(errors).toEqual([]);
    expect(codes[0]).toMatchObject({ status: 'retired', severity: null, files: [], lib: 'core' });
  });

  it('fails on a call site naming a retired code', () => {
    const { errors } = buildCodes(
      [call('projects/core/a.ts', 'CNGX0001')],
      [page('CNGX0001', 'Gone', '> Retired in 0.2.0.\n\n')],
    );
    expect(errors).toEqual(['CNGX0001 is retired but still called in projects/core/a.ts']);
  });

  it('fails on one code with two severities', () => {
    const { errors } = buildCodes(
      [
        call('projects/core/a.ts', 'CNGX0001', 'warn'),
        call('projects/core/b.ts', 'CNGX0001', 'error'),
      ],
      [page('CNGX0001')],
    );
    expect(errors).toEqual(['CNGX0001 is emitted with two severities (warn, error)']);
  });

  it('fails on a code reused across libs', () => {
    const { errors } = buildCodes(
      [call('projects/common/a.ts', 'CNGX1001'), call('projects/ui/b.ts', 'CNGX1001')],
      [page('CNGX1001')],
    );
    expect(errors).toContain('CNGX1001 is reused across libs (common, ui)');
  });

  it('fails on a code outside its lib range', () => {
    const { errors } = buildCodes([call('projects/forms/a.ts', 'CNGX1001')], [page('CNGX1001')]);
    expect(errors).toEqual([
      'projects/forms/a.ts:1 CNGX1001 lies outside the forms range (it belongs to common)',
    ]);
  });

  it('fails on a page whose H1 does not pin its file name', () => {
    const { errors } = buildCodes([], [parsePage('cngx0001.md', '# CNGX0002\n\n## T\n')]);
    expect(errors).toEqual(['cngx0001.md: the H1 must be "# CNGX0001", found "CNGX0002"']);
  });

  it('nests one child per code under the Error Codes node, and writes none without codes', () => {
    const summary = [{ title: 'Install', file: 'install.md' }];
    expect(withSummaryNode(summary, [])).toEqual(summary);
    const next = withSummaryNode(summary, [{ code: 'CNGX0001' }, { code: 'CNGX0901' }]);
    expect(next).toEqual([
      { title: 'Install', file: 'install.md' },
      {
        title: SUMMARY_NODE_TITLE,
        file: 'error-codes/index.md',
        children: [
          { title: 'CNGX0001', file: 'error-codes/cngx0001.md' },
          { title: 'CNGX0901', file: 'error-codes/cngx0901.md' },
        ],
      },
    ]);
    expect(withSummaryNode(next, [])).toEqual(summary);
  });

  it('keeps the ranges disjoint and inside 0001-5999', () => {
    const sorted = [...CODE_RANGES].sort((a, b) => a.from - b.from);
    for (let i = 0; i < sorted.length; i++) {
      expect(sorted[i].from).toBeLessThanOrEqual(sorted[i].to);
      if (i > 0) {
        expect(sorted[i].from).toBe(sorted[i - 1].to + 1);
      }
    }
    expect(sorted[0].from).toBe(1);
    expect(sorted.at(-1).to).toBe(5999);
  });
});

describe('error-code manifest', () => {
  const generated = generate();

  it('is consistent (every code has a page, every page a code)', async () => {
    expect((await generated).errors).toEqual([]);
  });

  it('matches the source (run `npm run manifest:error-codes` after changing a code)', async () => {
    expect(
      (await generated).manifest === readFileSync(MANIFEST_PATH, 'utf-8'),
      'scripts/manifests/error-codes.json is stale. Run `npm run manifest:error-codes`.',
    ).toBe(true);
  });

  it('matches the Error Codes node of core-concepts/summary.json', async () => {
    expect(
      (await generated).summary === readFileSync(SUMMARY_PATH, 'utf-8'),
      'core-concepts/summary.json is stale. Run `npm run manifest:error-codes`.',
    ).toBe(true);
  });

  it('conforms to the schema', () => {
    const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
    expect(schemaViolations(manifest)).toEqual([]);
  });

  it('admits every shape the generator produces', () => {
    const { codes } = buildCodes(
      [call('projects/core/a.ts', 'CNGX0001'), call('projects/core/a.ts', 'CNGX0002', 'error')],
      [page('CNGX0001'), page('CNGX0002'), page('CNGX0003', 'Gone', '> Retired in 0.2.0.\n\n')],
    );
    expect(schemaViolations(manifestOf(codes))).toEqual([]);
  });

  it('carries the schema version of the schema and the generator', () => {
    const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
    expect(manifest.schemaVersion).toBe(SCHEMA.properties.schemaVersion.const);
    expect(manifest.schemaVersion).toBe(SCHEMA_VERSION);
  });

  it('links the runtime helper to the published doc pages', () => {
    const source = readFileSync(resolve(REPO_ROOT, 'projects/utils/dev-message.ts'), 'utf-8');
    const literal = /CNGX_ERROR_DOCS_URL\s*=\s*'([^']+)'/.exec(source)?.[1];
    expect(literal).toBe(`${DEFAULT_BASE_URL}/additional-documentation/error-codes/`);
    expect(literal).toBe(DOCS_BASE_URL);
  });
});
