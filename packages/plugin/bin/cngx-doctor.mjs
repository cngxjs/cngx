#!/usr/bin/env node
/**
 * The `@cngx/doctor` CLI: a deterministic project-wiring scan.
 *
 * Usage: `cngx-doctor [projectDir] [--json]`
 *
 * Runs the three project-level checks (toaster-without-withtoasts,
 * track-b-css-not-imported, floating-fallback-missing) over a consumer project
 * and reports the findings in human (default) or `--json` form. Exits non-zero
 * only when an error-severity finding exists, so consumer CI gates on errors
 * while warn findings are reported without failing the job - the same
 * error-gates/warn-reports split a lint run gives.
 */

import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { runChecks } from './doctor/checks.mjs';
import { scan } from './doctor/scan.mjs';

export const USAGE = `Usage: cngx-doctor [projectDir] [options]

Deterministic project-wiring scan for cngx consumer apps.

  projectDir     project root to scan (default: current directory)
  --json         emit the machine contract (a findings array) instead of text
  -h, --help     print this usage and exit
  -v, --version  print the @cngx/doctor version and exit

Exit code: 0 when clean or only warn findings exist, 1 on any error finding.
`;

/**
 * @param {string[]} argv  process.argv.slice(2)
 * @returns {{ projectDir: string, json: boolean, help: boolean, version: boolean, unknownFlags: string[] }}
 */
export function parseArgs(argv) {
  let projectDir = '.';
  let json = false;
  let help = false;
  let version = false;
  const unknownFlags = [];
  for (const arg of argv) {
    if (arg === '--json') {
      json = true;
    } else if (arg === '--help' || arg === '-h') {
      help = true;
    } else if (arg === '--version' || arg === '-v') {
      version = true;
    } else if (arg.startsWith('-')) {
      // An unrecognised flag must not silently pass as a no-op - a typo like
      // --jsno would otherwise flip the caller onto human output unnoticed.
      unknownFlags.push(arg);
    } else {
      projectDir = arg;
    }
  }
  return { projectDir, json, help, version, unknownFlags };
}

function ownVersion() {
  try {
    const pkg = JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8'));
    return pkg.version ?? 'unknown';
  } catch {
    return 'unknown';
  }
}

function formatHuman(findings) {
  if (findings.length === 0) {
    return 'cngx-doctor: no project-wiring findings.\n';
  }
  const lines = [`cngx-doctor: ${findings.length} finding(s).`, ''];
  for (const f of findings) {
    const where = f.file ? ` (${f.file})` : '';
    lines.push(`  [${f.severity}] ${f.id}${where}`);
    lines.push(`    ${f.message}`);
    lines.push(`    fix: ${f.fixHint}`);
    lines.push('');
  }
  return lines.join('\n');
}

/**
 * @param {string[]} argv  process.argv.slice(2)
 * @returns {{ findings: import('./doctor/checks.mjs').Finding[], output: string, warnings: string[], exitCode: number }}
 */
export function runDoctor(argv) {
  const { projectDir, json, help, version, unknownFlags } = parseArgs(argv);
  const warnings = unknownFlags.map((flag) => `cngx-doctor: unknown option '${flag}' (see --help)`);

  if (help) {
    return { findings: [], output: USAGE, warnings, exitCode: 0 };
  }
  if (version) {
    return { findings: [], output: `${ownVersion()}\n`, warnings, exitCode: 0 };
  }

  const findings = runChecks(scan(projectDir));
  const output = json ? `${JSON.stringify(findings)}\n` : formatHuman(findings);
  // Severity gates the exit code the way a lint run does: an error fails the
  // job, a warn is reported in the output (human or JSON) without failing it.
  const hasError = findings.some((f) => f.severity === 'error');
  return { findings, output, warnings, exitCode: hasError ? 1 : 0 };
}

function main() {
  const { output, warnings, exitCode } = runDoctor(process.argv.slice(2));
  // Warnings go to stderr so the --json stdout contract stays parseable.
  for (const warning of warnings) {
    process.stderr.write(`${warning}\n`);
  }
  process.stdout.write(output);
  process.exitCode = exitCode;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
