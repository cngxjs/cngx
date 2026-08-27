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

import { pathToFileURL } from 'node:url';
import { runChecks } from './doctor/checks.mjs';
import { scan } from './doctor/scan.mjs';

/**
 * @param {string[]} argv  process.argv.slice(2)
 * @returns {{ projectDir: string, json: boolean }}
 */
export function parseArgs(argv) {
  let projectDir = '.';
  let json = false;
  for (const arg of argv) {
    if (arg === '--json') {
      json = true;
    } else if (!arg.startsWith('-')) {
      projectDir = arg;
    }
  }
  return { projectDir, json };
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
 * @returns {{ findings: import('./doctor/checks.mjs').Finding[], output: string, exitCode: number }}
 */
export function runDoctor(argv) {
  const { projectDir, json } = parseArgs(argv);
  const findings = runChecks(scan(projectDir));
  const output = json ? `${JSON.stringify(findings)}\n` : formatHuman(findings);
  // Severity gates the exit code the way a lint run does: an error fails the
  // job, a warn is reported in the output (human or JSON) without failing it.
  const hasError = findings.some((f) => f.severity === 'error');
  return { findings, output, exitCode: hasError ? 1 : 0 };
}

function main() {
  const { output, exitCode } = runDoctor(process.argv.slice(2));
  process.stdout.write(output);
  process.exitCode = exitCode;
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
