// Source of expected values: the exit-code and output contract locked in the
// cli-core plan (0 answered, 1 not found or unresolved, 2 usage error; stdout
// data only, stderr diagnostics only, never ANSI) and the sample fixture
// packages/mcp/test/fixtures/documentation.sample.json (cngxVersion 0.1.0-rc.6),
// read through the cli's own core copy. `--version` is read from
// packages/cli/package.json.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import type { CliIo } from './cli-adapter.js';
import { EXIT_NOT_FOUND, EXIT_OK, EXIT_USAGE, commandHelp, generalHelp, main, runCli } from './cli-adapter.js';
import type { CommandContext } from './core/registry.js';
import { COMMANDS } from './core/registry.js';
import type { DocsResolverDeps } from './core/data/docs-resolver.js';
import { createDocsResolver } from './core/data/docs-resolver.js';
import { loadDocsFromFile } from './core/data/loader.js';
import { assertNoAnsi } from './output-guards.js';

const FIXTURE = fileURLToPath(new URL('../../mcp/test/fixtures/documentation.sample.json', import.meta.url));
const PACKAGE_JSON = new URL('../package.json', import.meta.url);
const CLI_VERSION = (JSON.parse(readFileSync(PACKAGE_JSON, 'utf8')) as { version: string }).version;

const bundled = loadDocsFromFile(FIXTURE);

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

  it('exits 1 when the bundled snapshot cannot be loaded, never for --version', async () => {
    let stderr = '';
    const io: CliIo = { stdout: () => undefined, stderr: (text) => (stderr += text) };
    const loadContext = () => {
      throw new Error('ENOENT documentation.json');
    };
    const env = { commands: COMMANDS, loadContext, cliVersion: CLI_VERSION, io };

    expect(await runCli(['api', 'CngxSelect'], env)).toBe(EXIT_NOT_FOUND);
    expect(stderr).toContain('ENOENT');
    expect(await runCli(['--version'], env)).toBe(EXIT_OK);
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

  it('shows a command positional and its renamed version flag', () => {
    const api = COMMANDS.find((def) => def.cliName === 'api');

    expect(api).toBeDefined();
    expect(commandHelp(api!)).toContain('Usage: cngx api <name> [--cngx-version <value>] [--format md|json]');
  });
});
