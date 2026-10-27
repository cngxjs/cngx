// Source: the command registry (COMMANDS in the core copy) and the global flags
// of cli-adapter.ts; README.md must document all of them and nothing else, and
// must give `npx @cngx/cli` as the out-of-project invocation (plan, process
// matrix row "npx cngx with no @cngx/cli installed", D35).
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { COMMANDS } from './core/registry.js';

const README = readFileSync(fileURLToPath(new URL('../README.md', import.meta.url)), 'utf8');
const GLOBAL_FLAGS = ['--format', '--version', '-v', '--help', '-h', '--cngx-version'];

/** Every `cngx <word>` the README names as a command (backticked usages and code blocks). */
const documentedCommands = (readme: string) =>
  [...readme.matchAll(/`cngx ([a-z][\w-]*)/g), ...readme.matchAll(/^npx (?:cngx|@cngx\/cli) ([a-z][\w-]*)/gm)]
    .map((match) => match[1])
    .filter((word, i, all) => all.indexOf(word) === i);

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

  it('gives npx @cngx/cli as the out-of-project invocation', () => {
    expect(README).toContain('npx @cngx/cli <command>');
  });
});
