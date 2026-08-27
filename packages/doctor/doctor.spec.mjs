import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';
import { parseArgs, runDoctor, USAGE } from './cngx-doctor.mjs';
import { runChecks } from './doctor/checks.mjs';
import { scan } from './doctor/scan.mjs';
import { TRACK_B_SYMBOLS } from './doctor/track-b-symbols.mjs';

const CLI = fileURLToPath(new URL('./cngx-doctor.mjs', import.meta.url));
const created = [];

// Build a throwaway project on disk rather than committing a fixture tree - the
// repo gitignores node_modules dirs and the CLI walks the real filesystem, so a
// tmp dir outside the repo exercises the true scan path.
function project(layout) {
  const dir = mkdtempSync(join(tmpdir(), 'cngx-doctor-'));
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

// Spawn the real CLI so the exit code and stdout are the genuine contract.
function runCli(dir, args = []) {
  try {
    const stdout = execFileSync(process.execPath, [CLI, dir, ...args], { encoding: 'utf8' });
    return { status: 0, stdout };
  } catch (err) {
    return { status: err.status, stdout: err.stdout ?? '' };
  }
}

afterEach(() => {
  while (created.length > 0) {
    rmSync(created.pop(), { recursive: true, force: true });
  }
});

describe('cngx-doctor CLI', () => {
  it('a clean project produces no findings and exits 0 (JSON is [])', () => {
    const dir = project({
      pkg: { name: 'clean', dependencies: { '@cngx/forms': '0.1.0-rc.0' } },
      sources: {
        'src/app.ts': "import { CngxSelect } from '@cngx/forms/select';\nexport class App {}\n",
      },
      styles: { 'src/styles.css': "@import '@cngx/themes/cngx.css';\n" },
    });
    const { status, stdout } = runCli(dir, ['--json']);
    expect(status).toBe(0);
    expect(JSON.parse(stdout)).toEqual([]);
  });

  it('flags a toaster used without withToasts()', () => {
    const dir = project({
      sources: {
        'src/app.ts': "import { CngxToaster } from '@cngx/ui/feedback';\nexport class App {}\n",
      },
    });
    const json = runCli(dir, ['--json']);
    const findings = JSON.parse(json.stdout);
    expect(json.status).toBe(1);
    expect(findings).toHaveLength(1);
    expect(findings[0].id).toBe('toaster-without-withtoasts');
    expect(findings[0].severity).toBe('error');
  });

  it('does not flag a toaster when withToasts() is present (both branches)', () => {
    const dir = project({
      sources: {
        'src/app.ts': "import { CngxToaster } from '@cngx/ui/feedback';\nexport class App {}\n",
        'src/main.ts':
          "import { provideFeedback, withToasts } from '@cngx/ui/feedback';\nexport const providers = [provideFeedback(withToasts())];\n",
      },
    });
    const { status, stdout } = runCli(dir, ['--json']);
    expect(status).toBe(0);
    expect(JSON.parse(stdout)).toEqual([]);
  });

  it('reports a Track-B directive without the stylesheet, but a warn alone exits 0', () => {
    const dir = project({
      sources: {
        'src/app.ts': "import { CngxTooltip } from '@cngx/common';\nexport class App {}\n",
      },
      styles: { 'src/styles.css': 'body { margin: 0; }\n' },
    });
    const json = runCli(dir, ['--json']);
    const findings = JSON.parse(json.stdout);
    // warn severity: reported in the JSON contract, but the job is not failed.
    expect(json.status).toBe(0);
    expect(findings).toHaveLength(1);
    expect(findings[0].id).toBe('track-b-css-not-imported');
    expect(findings[0].severity).toBe('warn');
  });

  it('does not flag a Track-B directive when the stylesheet is imported', () => {
    const dir = project({
      sources: {
        'src/app.ts': "import { CngxTooltip } from '@cngx/common';\nexport class App {}\n",
      },
      styles: { 'src/styles.css': "@import '@cngx/themes/cngx.css';\n" },
    });
    const { status, stdout } = runCli(dir, ['--json']);
    expect(status).toBe(0);
    expect(JSON.parse(stdout)).toEqual([]);
  });

  it('does not flag when the stylesheet is listed in an angular.json styles array by path', () => {
    const dir = project({
      sources: {
        'src/app.ts': "import { CngxTooltip } from '@cngx/common';\nexport class App {}\n",
      },
      styles: {
        'angular.json': JSON.stringify({
          projects: {
            app: { architect: { build: { options: { styles: ['node_modules/@cngx/themes/cngx.css'] } } } },
          },
        }),
        // The published file's text carries no self-referencing marker - the
        // path alone must satisfy the check.
        'node_modules/@cngx/themes/cngx.css': '@layer cngx.components { .cngx-tooltip { opacity: 1; } }\n',
      },
    });
    const { status, stdout } = runCli(dir, ['--json']);
    expect(status).toBe(0);
    expect(JSON.parse(stdout)).toEqual([]);
  });

  it('resolves style entries from Nx project.json files (no angular.json)', () => {
    const clean = project({
      sources: {
        'apps/web/src/app.ts': "import { CngxTooltip } from '@cngx/common';\nexport class App {}\n",
      },
      styles: {
        'apps/web/project.json': JSON.stringify({
          name: 'web',
          targets: { build: { options: { styles: ['apps/web/src/styles.css'] } } },
        }),
        'apps/web/src/styles.css': "@import '@cngx/themes/cngx.css';\n",
      },
    });
    const cleanRun = runCli(clean, ['--json']);
    expect(JSON.parse(cleanRun.stdout)).toEqual([]);

    // Same layout without the import: the Nx-declared entry is read, found
    // lacking, and the warn is reported.
    const tripping = project({
      sources: {
        'apps/web/src/app.ts': "import { CngxTooltip } from '@cngx/common';\nexport class App {}\n",
      },
      styles: {
        'apps/web/project.json': JSON.stringify({
          name: 'web',
          targets: { build: { options: { styles: ['apps/web/src/styles.css'] } } },
        }),
        'apps/web/src/styles.css': 'body { margin: 0; }\n',
      },
    });
    const trippingRun = runCli(tripping, ['--json']);
    expect(JSON.parse(trippingRun.stdout).map((f) => f.id)).toEqual(['track-b-css-not-imported']);
  });

  it('does not flag a Track-B directive styled via the by-hand partial import', () => {
    const dir = project({
      sources: {
        'src/app.ts': "import { CngxTooltip } from '@cngx/common';\nexport class App {}\n",
      },
      styles: { 'src/styles.css': "@import '@cngx/common/theming/components/cngx-tooltip.css';\n" },
    });
    const { status, stdout } = runCli(dir, ['--json']);
    expect(status).toBe(0);
    expect(JSON.parse(stdout)).toEqual([]);
  });

  it('does not flag a type-only import of a feedback symbol', () => {
    const dir = project({
      sources: { 'src/app.ts': "import type { CngxToaster } from '@cngx/ui/feedback';\n" },
    });
    const { status, stdout } = runCli(dir, ['--json']);
    expect(status).toBe(0);
    expect(JSON.parse(stdout)).toEqual([]);
  });

  it('still flags when the only withToasts() reference is commented out', () => {
    const dir = project({
      sources: {
        'src/app.ts': "import { CngxToaster } from '@cngx/ui/feedback';\n// provideFeedback(withToasts())\n",
      },
    });
    const json = runCli(dir, ['--json']);
    const findings = JSON.parse(json.stdout);
    expect(json.status).toBe(1);
    expect(findings[0].id).toBe('toaster-without-withtoasts');
  });

  it('reports @floating-ui/dom without provideFloatingFallback() as a warn (exit 0)', () => {
    const dir = project({
      pkg: { name: 'floating', dependencies: { '@floating-ui/dom': '^1.6.0' } },
      sources: { 'src/app.ts': 'export class App {}\n' },
    });
    const json = runCli(dir, ['--json']);
    const findings = JSON.parse(json.stdout);
    expect(json.status).toBe(0);
    expect(findings).toHaveLength(1);
    expect(findings[0].id).toBe('floating-fallback-missing');
  });

  it('gates the exit code on error severity: one error among warns exits 1', () => {
    const dir = project({
      sources: {
        // toaster-without-withtoasts is error severity; the missing Track-B
        // stylesheet for CngxTooltip is warn - the error decides the exit code.
        'src/app.ts':
          "import { CngxToaster } from '@cngx/ui/feedback';\nimport { CngxTooltip } from '@cngx/common';\n",
      },
      styles: { 'src/styles.css': 'body { margin: 0; }\n' },
    });
    const json = runCli(dir, ['--json']);
    const findings = JSON.parse(json.stdout);
    expect(json.status).toBe(1);
    expect(findings.map((f) => f.severity).sort()).toEqual(['error', 'warn']);
  });

  it('does not flag @floating-ui/dom when provideFloatingFallback() is called', () => {
    const dir = project({
      pkg: { name: 'floating', dependencies: { '@floating-ui/dom': '^1.6.0' } },
      sources: {
        'src/app.ts':
          "import { provideFloatingFallback } from '@cngx/common/popover';\nimport { computePosition } from '@floating-ui/dom';\nexport const providers = [provideFloatingFallback(computePosition)];\n",
      },
    });
    const { status, stdout } = runCli(dir, ['--json']);
    expect(status).toBe(0);
    expect(JSON.parse(stdout)).toEqual([]);
  });

  it('prints human findings (no --json) and exits non-zero', () => {
    const dir = project({
      sources: { 'src/app.ts': "import { CngxToaster } from '@cngx/ui/feedback';\n" },
    });
    const { status, stdout } = runCli(dir);
    expect(status).toBe(1);
    expect(stdout).toContain('toaster-without-withtoasts');
    expect(stdout).toContain('fix:');
  });
});

describe('CLI flags', () => {
  it('--help prints the usage and exits 0 without scanning', () => {
    const { status, stdout } = runCli('.', ['--help']);
    expect(status).toBe(0);
    expect(stdout).toBe(USAGE);
  });

  it('--version prints the package version and exits 0', () => {
    const { status, stdout } = runCli('.', ['--version']);
    expect(status).toBe(0);
    expect(stdout.trim()).toMatch(/^\d+\.\d+\.\d+/);
  });

  it('collects an unknown flag as a warning instead of silently ignoring it', () => {
    const dir = project({ sources: { 'src/app.ts': 'export class App {}\n' } });
    const { warnings, exitCode } = runDoctor(['--jsno', dir]);
    expect(warnings).toEqual(["cngx-doctor: unknown option '--jsno' (see --help)"]);
    expect(exitCode).toBe(0);
  });

  it('parseArgs keeps the positional projectDir alongside flags', () => {
    expect(parseArgs(['some/dir', '--json'])).toEqual({
      projectDir: 'some/dir',
      json: true,
      help: false,
      version: false,
      unknownFlags: [],
    });
  });
});

describe('track-b-symbols drift guard', () => {
  it('equals the cngx.components layer set in projects/themes/cngx.css', () => {
    // Repo root is two levels up from packages/doctor.
    const repoRoot = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
    const css = readFileSync(join(repoRoot, 'projects', 'themes', 'cngx.css'), 'utf8');
    // Slice the `cngx.components` bullet up to the next `* - ` layer bullet.
    const start = css.indexOf('`cngx.components`');
    expect(start).toBeGreaterThan(-1);
    const rest = css.slice(start);
    const end = rest.indexOf('* - `');
    const block = end > -1 ? rest.slice(0, end) : rest;
    const symbols = [...block.matchAll(/`(Cngx\w+)`/g)].map((m) => m[1]);
    expect([...symbols].sort()).toEqual([...TRACK_B_SYMBOLS].sort());
  });
});

describe('incremental scan style resolution', () => {
  it('clears a Track-B finding on the warm path when a stylesheet appears', () => {
    const dir = project({
      sources: { 'src/app.ts': "import { CngxTooltip } from '@cngx/common';\n" },
    });
    const cold = scan(dir);
    expect(runChecks(cold).some((f) => f.id === 'track-b-css-not-imported')).toBe(true);
    // Consumer follows the fixHint: add the global stylesheet that was absent
    // at cold-walk time. The warm path must pick up the new candidate.
    writeFileSync(join(dir, 'src', 'styles.css'), "@import '@cngx/themes/cngx.css';\n");
    const warm = scan(dir, { prior: cold, changedFile: join(dir, 'src', 'app.ts') });
    expect(runChecks(warm).some((f) => f.id === 'track-b-css-not-imported')).toBe(false);
  });
});
