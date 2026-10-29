// Source: the command registry (COMMANDS in the core copy) and the global flags
// of cli-adapter.ts; README.md must document all of them and nothing else, and
// must give `npx @cngx/cli` as the out-of-project invocation (plan, process
// matrix row "npx cngx with no @cngx/cli installed", D35). The reverse direction
// holds too: every flag the README shows exists in the adapter's option set.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { EXIT_INTERNAL, EXIT_NOT_FOUND, EXIT_OK, EXIT_USAGE, commandFlags, globalFlags, knownFlags } from './cli-adapter.js';
import { COMMANDS } from './core/registry.js';
import {
  commandRowFlags,
  documentedCommands,
  documentedExitCodes,
  documentedFlags,
  flagRowCommands,
  unknownFlags,
} from './readme-guard.js';

const README = readFileSync(fileURLToPath(new URL('../README.md', import.meta.url)), 'utf8');
// --cngx-version is a per-command flag, documented once in the Flags table with
// the commands that take it.
const VERSION_FLAG = '--cngx-version';
const ownFlags = (cliName: string): string[] =>
  commandFlags(COMMANDS.find((def) => def.cliName === cliName)!).filter((flag) => flag !== VERSION_FLAG);

describe('README', () => {
  it.each(COMMANDS.map((def) => def.cliName))('documents cngx %s', (cliName) => {
    expect(README).toContain(`\`cngx ${cliName}`);
  });

  it.each([...globalFlags(), VERSION_FLAG])('documents %s', (flag) => {
    expect(README).toContain(`\`${flag}`);
  });

  it.each(COMMANDS.map((def) => def.cliName))('shows exactly the own flags of cngx %s in its Commands row', (cliName) => {
    expect(commandRowFlags(README, cliName)?.sort()).toEqual(ownFlags(cliName).sort());
  });

  it('names exactly the commands that take --cngx-version in its Flags row', () => {
    const taking = COMMANDS.filter((def) => commandFlags(def).includes(VERSION_FLAG)).map((def) => def.cliName);

    expect(flagRowCommands(README, VERSION_FLAG).sort()).toEqual(taking.sort());
  });

  it('mutation: a fake flag on one Commands row fails', () => {
    const planted = README.replace('|`cngx api <name>`|', '|`cngx api <name> [--depth <n>]`|');

    expect(planted).not.toBe(README);
    expect(commandRowFlags(planted, 'api')).toEqual(['--depth']);
    expect(commandRowFlags(planted, 'api')).not.toEqual(ownFlags('api'));
  });

  it('documents exactly the exit codes the adapter returns', () => {
    expect(documentedExitCodes(README)).toEqual([EXIT_OK, EXIT_NOT_FOUND, EXIT_USAGE, EXIT_INTERNAL]);
  });

  it('mutation: a missing exit-3 row fails', () => {
    const planted = README.replace(/^\|`3`\|.*\n/m, '');

    expect(planted).not.toBe(README);
    expect(documentedExitCodes(planted)).not.toEqual([EXIT_OK, EXIT_NOT_FOUND, EXIT_USAGE, EXIT_INTERNAL]);
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
