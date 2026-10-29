// Source: the command registry (COMMANDS in the core copy) and the global flags
// of cli-adapter.ts; README.md must document all of them and nothing else, and
// must give `npx @cngx/cli` as the out-of-project invocation (plan, process
// matrix row "npx cngx with no @cngx/cli installed", D35). The reverse direction
// holds too: every flag the README shows exists in the adapter's option set.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { knownFlags } from './cli-adapter.js';
import { COMMANDS } from './core/registry.js';
import { documentedCommands, documentedFlags, unknownFlags } from './readme-guard.js';

const README = readFileSync(fileURLToPath(new URL('../README.md', import.meta.url)), 'utf8');
const GLOBAL_FLAGS = ['--format', '--version', '-v', '--help', '-h', '--cngx-version'];

describe('README', () => {
  it.each(COMMANDS.map((def) => def.cliName))('documents cngx %s', (cliName) => {
    expect(README).toContain(`\`cngx ${cliName}`);
  });

  it.each(GLOBAL_FLAGS)('documents %s', (flag) => {
    expect(README).toContain(`\`${flag}`);
  });

  it('names no command the registry lacks', () => {
    const known = new Set(COMMANDS.map((def) => def.cliName));

    expect(documentedCommands(README).filter((word) => !known.has(word))).toEqual([]);
  });

  it('mutation: a README naming an unregistered command fails', () => {
    const planted = `${README}\n|\`cngx explain <code>\`|-|-|\n`;

    expect(documentedCommands(planted)).toContain('explain');
  });

  it('documents no flag the adapter lacks', () => {
    expect(documentedFlags(README).length).toBeGreaterThan(5);
    expect(unknownFlags(README, knownFlags(COMMANDS))).toEqual([]);
  });

  it('mutation: a README row for a nonexistent flag fails (GP15)', () => {
    const planted = `${README}\n|\`--offline\`|Never fetch.|\n`;

    expect(unknownFlags(planted, knownFlags(COMMANDS))).toEqual(['--offline']);
  });

  it('never reads a version or a hyphenated name as a flag', () => {
    expect(documentedFlags('`0.2.0-rc.1` and `--cngx-version` and `cngx-snapshot-x`')).toEqual(['--cngx-version']);
  });

  it('gives npx @cngx/cli as the out-of-project invocation', () => {
    expect(README).toContain('npx @cngx/cli <command>');
  });
});
