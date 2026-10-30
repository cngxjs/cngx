// Source of expected values: the exit-code and output contract locked in the
// cli-core plan (0 answered, 1 not found or unresolved, 2 usage error, 3 internal error; stdout
// data only, stderr diagnostics only, never ANSI) and the sample fixture
// packages/mcp/test/fixtures/documentation.sample.json (cngxVersion 0.1.0-rc.6),
// read through the cli's own core copy. `--version` is read from
// packages/cli/package.json.
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { CliIo } from './cli-adapter.js';
import { EXIT_INTERNAL, EXIT_NOT_FOUND, EXIT_OK, EXIT_USAGE, commandHelp, generalHelp, main, runCli } from './cli-adapter.js';
import type { CngxCommand, CommandContext } from './core/registry.js';
import { COMMANDS } from './core/registry.js';
import type { DocsResolverDeps } from './core/data/docs-resolver.js';
import { createDocsResolver } from './core/data/docs-resolver.js';
import { createDocsIndex, loadBundledDocs, loadDocsFromFile } from './core/data/loader.js';
import { assertNoAnsi } from './output-guards.js';

const FIXTURE = fileURLToPath(new URL('../../mcp/test/fixtures/documentation.sample.json', import.meta.url));
const PACKAGE_JSON = new URL('../package.json', import.meta.url);
const CLI_VERSION = (JSON.parse(readFileSync(PACKAGE_JSON, 'utf8')) as { version: string }).version;

const bundled = loadDocsFromFile(FIXTURE);

/** `cngx example CngxTreeSelect --format json` over the bundled snapshot. */
const EXAMPLE_TREE_SELECT_JSON = `{
  "cngxVersion": "0.1.0-rc.9",
  "result": {
    "name": "CngxTreeSelect",
    "kind": "component",
    "exampleUrls": [
      "https://cngxjs.github.io/cngx/examples/#/forms/select/tree-select/basic-single-level-toggle",
      "https://cngxjs.github.io/cngx/examples/#/forms/select/tree-select/cascade-children-parent-toggle-selects-the-whole-subtree",
      "https://cngxjs.github.io/cngx/examples/#/forms/select/tree-select/custom-cngxtreeselectnode-template",
      "https://cngxjs.github.io/cngx/examples/#/forms/select/tree-select/chip-display-parents-leaves-all",
      "https://cngxjs.github.io/cngx/examples/#/forms/select/tree-select/custom-count-footer-and-overflow-slots",
      "https://cngxjs.github.io/cngx/examples/#/forms/select/tree-select/touch-row-tap-expands-checkbox-selects",
      "https://cngxjs.github.io/cngx/examples/#/forms/select/mobile-sheet/all-variants"
    ],
    "stackblitzUrl": null,
    "sourceReferences": [
      {
        "title": "Material theme",
        "fileRef": "./examples/material-theme/material-theme.component.ts",
        "line": 0
      }
    ]
  }
}
`;

/** A fetch that never reaches the network: every non-bundled version is an absent asset. */
const offlineDeps: DocsResolverDeps = {
  fetchSnapshot: async (version) => ({ ok: false, reason: 'asset-missing', message: `no asset for v${version}` }),
  loadDocs: loadDocsFromFile,
};

interface Run {
  code: number;
  stdout: string;
  stderr: string;
}

async function cli(...argv: string[]): Promise<Run> {
  let stdout = '';
  let stderr = '';
  const io: CliIo = { stdout: (text) => (stdout += text), stderr: (text) => (stderr += text) };
  const context: CommandContext = { bundled, resolve: createDocsResolver(bundled, offlineDeps) };
  const code = await runCli(argv, { commands: COMMANDS, loadContext: () => context, cliVersion: CLI_VERSION, io });
  assertNoAnsi(stdout);
  assertNoAnsi(stderr);
  return { code, stdout, stderr };
}

// One known and one unknown query per command, from the sample fixture.
const CASES: readonly { cli: string; known: string[]; unknown: string[]; md: string }[] = [
  { cli: 'find', known: ['select'], unknown: ['zzz-nothing'], md: '|`CngxSelect`|component|' },
  { cli: 'list', known: [], unknown: ['--lib=nope'], md: '|`CngxRipple`|directive|' },
  { cli: 'api', known: ['CngxSelect'], unknown: ['NoSuchThing'], md: '# CngxSelect' },
  { cli: 'slots', known: ['CngxSelect'], unknown: ['NoSuchThing'], md: '|`cngxSelectCaret`|' },
  { cli: 'theme', known: ['CngxSelect'], unknown: ['NoSuchThing'], md: '`--cngx-select-panel-border`' },
  { cli: 'di', known: ['SELECT'], unknown: ['ZZZ_NOTHING'], md: '|`CNGX_SELECT_CONFIG`|' },
  { cli: 'config', known: ['CNGX_SELECT_CONFIG'], unknown: ['NoSuchThing'], md: '# CNGX_SELECT_CONFIG' },
  { cli: 'example', known: ['CngxSelect'], unknown: ['NoSuchThing'], md: '# CngxSelect examples' },
  { cli: 'migrate', known: ['0.1.0-rc.6'], unknown: ['9.9.9'], md: '# Migrating 0.1.0-rc.6 -> 0.1.0-rc.6' },
];

describe('cngx subcommands', () => {
  it('covers every registry command', () => {
    expect(CASES.map((c) => c.cli).sort()).toEqual(COMMANDS.map((def) => def.cliName).sort());
  });

  describe.each(CASES)('$cli', ({ cli: name, known, unknown, md }) => {
    it('answers a known query as markdown with exit 0', async () => {
      const run = await cli(name, ...known);

      expect(run.code).toBe(EXIT_OK);
      expect(run.stdout).toContain(md);
      expect(run.stderr).toBe('');
    });

    it('answers a known query as JSON with exit 0', async () => {
      const run = await cli(name, ...known, '--format=json');

      expect(run.code).toBe(EXIT_OK);
      expect(JSON.parse(run.stdout)).toMatchObject({ cngxVersion: '0.1.0-rc.6', result: expect.anything() });
      expect(run.stderr).toBe('');
    });

    it('names the answering cngx version on the first markdown line', async () => {
      const run = await cli(name, ...known);

      expect(run.stdout.split('\n')[0]).toBe('> cngx 0.1.0-rc.6');
    });

    it('exits 1 for an unknown query', async () => {
      const run = await cli(name, ...unknown);

      expect(run.code).toBe(EXIT_NOT_FOUND);
    });

    it('exits 2 for an unknown flag, naming it on stderr only', async () => {
      const run = await cli(name, ...known, '--bogus');

      expect(run.code).toBe(EXIT_USAGE);
      expect(run.stdout).toBe('');
      expect(run.stderr).toContain('--bogus');
    });

    it('prints its generated help with exit 0', async () => {
      const run = await cli(name, '--help');

      expect(run.code).toBe(EXIT_OK);
      expect(run.stdout).toContain(`Usage: cngx ${name}`);
    });
  });
});

describe('usage errors', () => {
  it('rejects --cngx-version on a command without a version input', async () => {
    const run = await cli('list', '--cngx-version=0.2.0');

    expect(run.code).toBe(EXIT_USAGE);
    expect(run.stderr).toContain('list does not take --cngx-version');
  });

  it('rejects a schema violation', async () => {
    const run = await cli('list', '--kind=widget');

    expect(run.code).toBe(EXIT_USAGE);
    expect(run.stderr).toContain('--kind');
  });

  it('rejects an empty name', async () => {
    const run = await cli('api', '');

    expect(run.code).toBe(EXIT_USAGE);
    expect(run.stdout).toBe('');
    expect(run.stderr).toContain('<name>');
  });

  it('rejects a missing required positional', async () => {
    const run = await cli('api');

    expect(run.code).toBe(EXIT_USAGE);
    expect(run.stderr).toContain('<name> is required');
  });

  it('rejects a second positional', async () => {
    const run = await cli('api', 'CngxSelect', 'CngxChip');

    expect(run.code).toBe(EXIT_USAGE);
    expect(run.stderr).toContain('CngxChip');
  });

  it('rejects an unknown command, listing the commands', async () => {
    const run = await cli('explain', 'x');

    expect(run.code).toBe(EXIT_USAGE);
    expect(run.stderr).toContain('unknown command "explain"');
    expect(run.stderr).toContain('api');
  });

  it('rejects an unknown output format', async () => {
    const run = await cli('api', 'CngxSelect', '--format=yaml');

    expect(run.code).toBe(EXIT_USAGE);
  });

  it('prints the help to stderr with exit 2 when no command is given', async () => {
    const run = await cli();

    expect(run.code).toBe(EXIT_USAGE);
    expect(run.stdout).toBe('');
    expect(run.stderr).toContain('Commands:');
  });
});

describe('version and snapshot resolution', () => {
  it.each([['--version'], ['-v'], ['api', 'CngxSelect', '--version']])('%s prints the @cngx/cli version', async (...argv) => {
    const run = await cli(...argv);

    expect(run.code).toBe(EXIT_OK);
    expect(run.stdout).toBe(`${CLI_VERSION}\n`);
  });

  it('answers --cngx-version equal to the bundled version without a fetch', async () => {
    const run = await cli('api', 'CngxSelect', '--cngx-version=0.1.0-rc.6');

    expect(run.code).toBe(EXIT_OK);
    expect(run.stdout).toContain('# CngxSelect');
  });

  it('names a fetched release, not the bundled one, as the answering version', async () => {
    const NEW = fileURLToPath(new URL('../../mcp/test/fixtures/documentation.v-new.sample.json', import.meta.url));
    const deps: DocsResolverDeps = { fetchSnapshot: async () => ({ ok: true, path: NEW }), loadDocs: loadDocsFromFile };
    let stdout = '';
    const io: CliIo = { stdout: (text) => (stdout += text), stderr: () => undefined };
    const context: CommandContext = { bundled, resolve: createDocsResolver(bundled, deps) };

    const code = await runCli(['api', 'CngxSelect', '--cngx-version=0.2.0', '--format=json'], {
      commands: COMMANDS,
      loadContext: () => context,
      cliVersion: CLI_VERSION,
      io,
    });

    expect(code).toBe(EXIT_OK);
    expect(JSON.parse(stdout)).toMatchObject({ cngxVersion: '0.2.0', result: { name: 'CngxSelect' } });
  });

  it('names the migration target, not the bundled release, as the answering version', async () => {
    const NEW = fileURLToPath(new URL('../../mcp/test/fixtures/documentation.v-new.sample.json', import.meta.url));
    const deps: DocsResolverDeps = { fetchSnapshot: async () => ({ ok: true, path: NEW }), loadDocs: loadDocsFromFile };
    let stdout = '';
    const io: CliIo = { stdout: (text) => (stdout += text), stderr: () => undefined };
    const context: CommandContext = { bundled, resolve: createDocsResolver(bundled, deps) };

    const code = await runCli(['migrate', '0.1.0-rc.6', '--to=0.2.0'], {
      commands: COMMANDS,
      loadContext: () => context,
      cliVersion: CLI_VERSION,
      io,
    });

    expect(code).toBe(EXIT_OK);
    expect(stdout.split('\n')[0]).toBe('> cngx 0.2.0');
  });

  it('exits 1 on a JSON answer whose result is not found', async () => {
    const run = await cli('api', 'NoSuchThing', '--format=json');

    expect(run.code).toBe(EXIT_NOT_FOUND);
    expect(JSON.parse(run.stdout)).toEqual({ cngxVersion: '0.1.0-rc.6', result: null });
  });

  // The README's json-shape table: list commands answer `[]`, object commands `null`,
  // and an unresolvable migrate release is a failure document.
  const NOT_FOUND_JSON: Record<string, unknown> = {
    find: { cngxVersion: '0.1.0-rc.6', result: [] },
    list: { cngxVersion: '0.1.0-rc.6', result: [] },
    di: { cngxVersion: '0.1.0-rc.6', result: [] },
    api: { cngxVersion: '0.1.0-rc.6', result: null },
    slots: { cngxVersion: '0.1.0-rc.6', result: null },
    theme: { cngxVersion: '0.1.0-rc.6', result: null },
    config: { cngxVersion: '0.1.0-rc.6', result: null },
    example: { cngxVersion: '0.1.0-rc.6', result: null },
    migrate: { cngxVersion: null, result: null, error: { reason: 'asset-missing', message: 'no asset for v9.9.9' } },
  };

  it('covers every command in the not-found json table', () => {
    expect(Object.keys(NOT_FOUND_JSON).sort()).toEqual(COMMANDS.map((def) => def.cliName).sort());
  });

  it.each(CASES)('$cli prints the documented not-found json shape and exits 1', async ({ cli: name, unknown }) => {
    const run = await cli(name, ...unknown, '--format=json');

    expect(run.code).toBe(EXIT_NOT_FOUND);
    expect(JSON.parse(run.stdout)).toEqual(NOT_FOUND_JSON[name]);
  });

  it('exits 1 with the candidates when a selector matches several entries', async () => {
    const ambiguous = createDocsIndex({
      schemaVersion: 6,
      components: [],
      directives: [
        { name: 'CngxSyncB', selector: 'cngx-b[cngxSync]' },
        { name: 'CngxSyncA', selector: 'cngx-a[cngxSync]' },
      ],
      injectables: [],
    });
    const context: CommandContext = { bundled: ambiguous, resolve: createDocsResolver(ambiguous, offlineDeps) };
    let stdout = '';
    const io: CliIo = { stdout: (text) => (stdout += text), stderr: () => undefined };

    const code = await runCli(['api', 'cngxSync', '--format=json'], { commands: COMMANDS, loadContext: () => context, cliVersion: CLI_VERSION, io });

    expect(code).toBe(EXIT_NOT_FOUND);
    expect(JSON.parse(stdout).result).toEqual({
      ambiguous: true,
      candidates: [
        { name: 'CngxSyncA', kind: 'directive', selector: 'cngx-a[cngxSync]' },
        { name: 'CngxSyncB', kind: 'directive', selector: 'cngx-b[cngxSync]' },
      ],
    });
  });

  it('documents the ambiguity row in the not-found json table', () => {
    expect(readFileSync(new URL('../README.md', import.meta.url), 'utf8')).toContain('`{ "ambiguous": true, "candidates": [{ "name", "kind", "selector" }] }`');
  });

  it('exits 2 on an empty --cngx-version, before any resolution', async () => {
    const run = await cli('api', 'CngxSelect', '--cngx-version=');

    expect(run.code).toBe(EXIT_USAGE);
    expect(run.stdout).toBe('');
    expect(run.stderr).toContain('--cngx-version');
  });

  it('exits 1 with the reason on stderr when a requested release cannot be resolved', async () => {
    const run = await cli('api', 'CngxSelect', '--cngx-version=9.9.9');

    expect(run.code).toBe(EXIT_NOT_FOUND);
    expect(run.stdout).toBe('');
    expect(run.stderr).toContain('asset-missing');
    expect(run.stderr).toContain('9.9.9');
  });

  it('prints a json failure document when a requested release cannot be resolved', async () => {
    const run = await cli('migrate', '0.0.1', '--format', 'json');

    expect(run.code).toBe(EXIT_NOT_FOUND);
    expect(JSON.parse(run.stdout)).toEqual({
      cngxVersion: null,
      result: null,
      error: { reason: 'asset-missing', message: 'no asset for v0.0.1' },
    });
    expect(run.stderr).toContain('asset-missing');
  });

  it('keeps markdown failures off stdout', async () => {
    const run = await cli('migrate', '0.0.1');

    expect(run.code).toBe(EXIT_NOT_FOUND);
    expect(run.stdout).toBe('');
  });

  it.each([
    ['md', []],
    ['json', ['--format', 'json']],
  ] as const)('exits 3 under %s when the bundled snapshot cannot be loaded, never for --version', async (format, flags) => {
    let stdout = '';
    let stderr = '';
    const io: CliIo = { stdout: (text) => (stdout += text), stderr: (text) => (stderr += text) };
    const loadContext = () => {
      throw new Error('ENOENT documentation.json');
    };
    const env = { commands: COMMANDS, loadContext, cliVersion: CLI_VERSION, io };

    expect(await runCli(['api', 'CngxSelect', ...flags], env)).toBe(EXIT_INTERNAL);
    expect(stderr).toBe('cngx: internal error: ENOENT documentation.json\n');
    if (format === 'md') {
      expect(stdout).toBe('');
    } else {
      expect(JSON.parse(stdout)).toEqual({
        cngxVersion: null,
        result: null,
        error: { reason: 'internal', message: 'ENOENT documentation.json' },
      });
    }
    stdout = '';
    expect(await runCli(['--version'], env)).toBe(EXIT_OK);
    expect(stdout).toBe(`${CLI_VERSION}\n`);
  });
});

describe('a missing bundled snapshot', () => {
  it('exits 3 with the reinstall hint instead of a bare ENOENT', async () => {
    const empty = mkdtempSync(join(tmpdir(), 'cngx-cli-data-'));
    let stderr = '';
    const io: CliIo = { stdout: () => undefined, stderr: (text) => (stderr += text) };
    const loadContext = (): CommandContext => {
      const docs = loadBundledDocs(empty);
      return { bundled: docs, resolve: createDocsResolver(docs, offlineDeps) };
    };

    expect(await runCli(['api', 'CngxSelect'], { commands: COMMANDS, loadContext, cliVersion: CLI_VERSION, io })).toBe(EXIT_INTERNAL);
    expect(stderr).toBe(
      'cngx: internal error: documentation.json cannot be read (ENOENT); reinstall the package that bundles this snapshot.\n',
    );
  });
});

describe('argument scan', () => {
  it('skips the value of a value flag given before the command', async () => {
    const run = await cli('--cngx-version', '0.1.0-rc.6', 'api', 'CngxSelect');

    expect(run.code).toBe(EXIT_OK);
    expect(run.stdout).toContain('# CngxSelect');
  });

  it('skips --format and its value before the command', async () => {
    const run = await cli('--format', 'json', 'api', 'CngxSelect');

    expect(run.code).toBe(EXIT_OK);
    expect(JSON.parse(run.stdout)).toMatchObject({ result: { name: 'CngxSelect' } });
  });

  it('exits 2 on a --cngx-version that is not a release version, before any resolution', async () => {
    const run = await cli('api', 'CngxSelect', '--cngx-version=../x');

    expect(run.code).toBe(EXIT_USAGE);
    expect(run.stdout).toBe('');
    expect(run.stderr).toContain('--cngx-version');
    expect(run.stderr).not.toContain('asset-missing');
  });

  it('exits 2 on a --cngx-version with a leading zero', async () => {
    const run = await cli('api', 'CngxSelect', '--cngx-version', '01.2.3');

    expect(run.code).toBe(EXIT_USAGE);
    expect(run.stdout).toBe('');
    expect(run.stderr).toContain('"01.2.3" is not a release version');
  });
});

describe('a malformed migrate version', () => {
  /** A cli run whose resolver counts every fetch, so a spec proves none ran. */
  async function counted(...argv: string[]): Promise<Run & { fetches: number }> {
    let stdout = '';
    let stderr = '';
    let fetches = 0;
    const io: CliIo = { stdout: (text) => (stdout += text), stderr: (text) => (stderr += text) };
    const deps: DocsResolverDeps = {
      ...offlineDeps,
      fetchSnapshot: async (version) => {
        fetches += 1;
        return offlineDeps.fetchSnapshot(version);
      },
    };
    const context: CommandContext = { bundled, resolve: createDocsResolver(bundled, deps) };
    const code = await runCli(argv, { commands: COMMANDS, loadContext: () => context, cliVersion: CLI_VERSION, io });
    return { code, stdout, stderr, fetches };
  }

  it('exits 2 on a positional that is not a release version, with the message and the hint', async () => {
    const run = await counted('migrate', '1.2');

    expect(run.code).toBe(EXIT_USAGE);
    expect(run.stdout).toBe('');
    expect(run.stderr).toMatch(/^cngx: "1\.2" is not a release version.*\nRun `cngx migrate --help` for usage\.\n$/);
    expect(run.fetches).toBe(0);
  });

  it('exits 2 on a malformed --to without any fetch of the valid from', async () => {
    const run = await counted('migrate', '0.1.0', '--to', ' bad');

    expect(run.code).toBe(EXIT_USAGE);
    expect(run.stderr).toMatch(/^cngx: "bad" is not a release version/);
    expect(run.fetches).toBe(0);
  });

  it.each(['01.2.3', '1.2.3-.', '1.2.3-rc.'])('exits 2 on the positional %j', async (version) => {
    expect((await counted('migrate', version)).code).toBe(EXIT_USAGE);
  });

  it('leaves stdout empty under --format json', async () => {
    const run = await counted('migrate', '1.2', '--format', 'json');

    expect(run.code).toBe(EXIT_USAGE);
    expect(run.stdout).toBe('');
  });
});

// One version contract (trim, one leading v or V, then a release version) on every
// surface: accepted means the run reached the bundled answer or a fetch of the
// normalised version, rejected means no fetch and no answer.
describe('version parity across cli api, cli migrate and the mcp resolver', () => {
  const TABLE: readonly [string, string | null][] = [
    ['', null],
    [' ', null],
    ['v', null],
    ['V1.0.0', '1.0.0'],
    ['v0.1.0-rc.6', '0.1.0-rc.6'],
    [' 0.1.0-rc.6 ', '0.1.0-rc.6'],
    ['vv0.2.0', null],
  ];

  function spied() {
    const fetched: string[] = [];
    const deps: DocsResolverDeps = {
      fetchSnapshot: async (version) => {
        fetched.push(version);
        return { ok: false, reason: 'asset-missing', message: `no asset for v${version}` };
      },
      loadDocs: loadDocsFromFile,
    };
    return { fetched, resolve: createDocsResolver(bundled, deps) };
  }

  /** The version a surface went on to answer for, or null when it rejected the input. */
  async function viaCli(argv: string[]): Promise<string | null> {
    const { fetched, resolve } = spied();
    const io: CliIo = { stdout: () => undefined, stderr: () => undefined };
    const code = await runCli(argv, { commands: COMMANDS, loadContext: () => ({ bundled, resolve }), cliVersion: CLI_VERSION, io });
    if (code === EXIT_OK) {
      return '0.1.0-rc.6';
    }
    return fetched[0] ?? null;
  }

  it.each(TABLE)('cli api --cngx-version %j answers for %j', async (input, expected) => {
    expect(await viaCli(['api', 'CngxSelect', '--cngx-version', input])).toBe(expected);
  });

  it.each(TABLE)('cli migrate %j answers for %j', async (input, expected) => {
    expect(await viaCli(['migrate', input, '--to', '0.1.0-rc.6'])).toBe(expected);
  });

  it.each(TABLE)('mcp resolver %j answers for %j', async (input, expected) => {
    const { fetched, resolve } = spied();
    const resolution = await resolve(input);

    expect(resolution.ok ? resolution.version : (fetched[0] ?? null)).toBe(expected);
  });

  it('echoes the original input when --cngx-version is not a release version', async () => {
    const run = await cli('api', 'CngxSelect', '--cngx-version=vv0.2.0');

    expect(run.code).toBe(EXIT_USAGE);
    expect(run.stderr).toContain('"vv0.2.0" is not a release version');
  });
});

describe('--cngx-version checks', () => {
  it('points migrate at <from> and --to instead of the bundled snapshot', async () => {
    const run = await cli('migrate', '0.1.0-rc.6', '--cngx-version=0.2.0');

    expect(run.code).toBe(EXIT_USAGE);
    expect(run.stderr).toContain('<from> and --to');
    expect(run.stderr).not.toContain('bundled snapshot');
  });

  it('keeps the bundled-snapshot hint for a command without any version input', async () => {
    const run = await cli('list', '--cngx-version=0.2.0');

    expect(run.code).toBe(EXIT_USAGE);
    expect(run.stderr).toContain('bundled snapshot');
  });

  it.each([[' '], ['\t']])('exits 2 on a blank --cngx-version %j', async (blank) => {
    const run = await cli('api', 'CngxSelect', '--cngx-version', blank);

    expect(run.code).toBe(EXIT_USAGE);
    expect(run.stdout).toBe('');
    expect(run.stderr).toContain('needs a version');
  });

  it.each([[['migrate', '']], [['migrate', '0.1.0-rc.6', '--to', '']]])('exits 2 on a blank migrate version: %j', async (argv) => {
    const run = await cli(...argv);

    expect(run.code).toBe(EXIT_USAGE);
    expect(run.stdout).toBe('');
  });

  it('does not read a token after -- as a flag', async () => {
    const run = await cli('example', '--', '--cngx-version');

    expect(run.code).toBe(EXIT_NOT_FOUND);
    expect(run.stderr).not.toContain('does not take --cngx-version');
  });
});

describe('internal errors', () => {
  const api = COMMANDS.find((def) => def.cliName === 'api')!;

  async function cliWith(def: CngxCommand, ...argv: string[]): Promise<Run> {
    let stdout = '';
    let stderr = '';
    const io: CliIo = { stdout: (text) => (stdout += text), stderr: (text) => (stderr += text) };
    const context: CommandContext = { bundled, resolve: createDocsResolver(bundled, offlineDeps) };
    const code = await runCli(argv, { commands: [def], loadContext: () => context, cliVersion: CLI_VERSION, io });
    return { code, stdout, stderr };
  }

  const boom = () => {
    throw new Error('boom');
  };

  it.each([
    ['run', { ...api, run: async () => boom() }],
    ['toMarkdown', { ...api, toMarkdown: boom }],
    ['found', { ...api, found: boom }],
  ] as const)('a throwing %s gives one stderr line, no stack, exit 3 and no stdout', async (_, def) => {
    const run = await cliWith(def as CngxCommand, 'api', 'CngxSelect');

    expect(run.code).toBe(EXIT_INTERNAL);
    expect(run.stderr).toBe('cngx api: internal error: boom\n');
    expect(run.stdout).toBe('');
  });

  // toMarkdown never runs under --format json, so only run and found can throw there.
  it.each([
    ['run', { ...api, run: async () => boom() }],
    ['found', { ...api, found: boom }],
  ] as const)('a throwing %s under --format json prints one internal failure document', async (_, def) => {
    const run = await cliWith(def as CngxCommand, 'api', 'CngxSelect', '--format=json');

    expect(run.code).toBe(EXIT_INTERNAL);
    expect(JSON.parse(run.stdout)).toEqual({ cngxVersion: null, result: null, error: { reason: 'internal', message: 'boom' } });
    expect(run.stderr).toBe('cngx api: internal error: boom\n');
  });

  it('exits 3 when the package manifest cannot be read', async () => {
    let stderr = '';
    const io: CliIo = { stdout: () => undefined, stderr: (text) => (stderr += text) };
    const missing = new URL('./no-such-dir/package.json', import.meta.url);

    const code = await main(['api', 'CngxSelect'], { dataDir: new URL('../data/', import.meta.url), packageJson: missing }, io);

    expect(code).toBe(EXIT_INTERNAL);
    expect(stderr).toMatch(/^cngx: internal error: ENOENT/);
    expect(stderr.trim().split('\n')).toHaveLength(1);
  });
});

describe('main over the real package paths', () => {
  it('reads --version from packages/cli/package.json', async () => {
    let stdout = '';
    const io: CliIo = { stdout: (text) => (stdout += text), stderr: () => undefined };

    const code = await main(['--version'], { dataDir: new URL('../data/', import.meta.url), packageJson: PACKAGE_JSON }, io);

    expect(code).toBe(EXIT_OK);
    expect(stdout).toBe(`${CLI_VERSION}\n`);
  });

  // Pinned from the output before get_story_example moved into the versioned envelope:
  // the envelope is an MCP wire change, the cli document must not move.
  it('prints the CngxTreeSelect example document unchanged', async () => {
    let stdout = '';
    const io: CliIo = { stdout: (text) => (stdout += text), stderr: () => undefined };

    const code = await main(['example', 'CngxTreeSelect', '--format', 'json'], { dataDir: new URL('../data/', import.meta.url), packageJson: PACKAGE_JSON }, io);

    expect(code).toBe(EXIT_OK);
    expect(stdout).toBe(EXAMPLE_TREE_SELECT_JSON);
  });
});

describe('generated help', () => {
  it('lists every command and global flag', () => {
    const help = generalHelp(COMMANDS, CLI_VERSION);

    for (const def of COMMANDS) {
      expect(help).toContain(`  ${def.cliName} `);
    }
    for (const flag of ['--format', '--version', '-v', '--help', '-h']) {
      expect(help).toContain(flag);
    }
  });

  it.each(COMMANDS.map((def) => [def.cliName, def] as const))('%s help speaks CLI, not MCP', (_, def) => {
    const help = commandHelp(def);

    expect(help).not.toMatch(/Returns null|\{ ok: false|\b(?:get|find|list|migrate)_[a-z_]+\b/);
  });

  it('prints cliSummary in place of the MCP description when a definition sets it', () => {
    const list = COMMANDS.find((def) => def.cliName === 'list')!;

    expect(commandHelp({ ...list, cliSummary: 'CLI words.' })).toContain('\nCLI words.\n');
    expect(commandHelp({ ...list, cliSummary: undefined })).toContain(`\n${list.description}\n`);
  });

  it('shows a command positional and its renamed version flag', () => {
    const api = COMMANDS.find((def) => def.cliName === 'api');

    expect(api).toBeDefined();
    expect(commandHelp(api!)).toContain('Usage: cngx api <name> [--cngx-version <value>] [--format md|json]');
  });
});
