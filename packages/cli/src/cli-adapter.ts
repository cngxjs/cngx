// Turns the command registry into `cngx` subcommands. Every subcommand, flag,
// help text and output path is derived from the definitions in core/: a field of
// a definition's zod `input` becomes a flag (renamed through `cliFlags`, or taken
// positionally through `positional`), `run` answers, and `toMarkdown` or JSON
// renders the payload. There is no per-command code here.
//
// Exit codes: 0 answered; 1 the query ran and found nothing, or a snapshot could
// not be resolved; 2 usage error (unknown command or flag, invalid input); 3
// internal error (a throw in a command, its rendering or the bootstrap).
// stdout carries data only, stderr diagnostics only; neither is ever coloured.
// The answer is rendered into one string before anything is written, so a run
// that fails never leaves part of an answer on stdout. Under `--format json`
// every run that gets past usage prints exactly one document: a failure carries
// `error: { reason, message }` next to `result: null` (reason `internal` for
// exit 3), a not-found answer has no `error`.

import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import type { ParseArgsConfig } from 'node:util';
import { z } from 'zod';
import type { CngxCommand, CommandContext } from './core/registry.js';
import { COMMANDS, isFound, unwrapAnswer } from './core/registry.js';
import { createDocsResolver } from './core/data/docs-resolver.js';
import { isReleaseVersion } from './core/diff/snapshot-fetch.js';
import { loadBundledDocs } from './core/data/loader.js';

export const EXIT_OK = 0;
export const EXIT_NOT_FOUND = 1;
export const EXIT_USAGE = 2;
export const EXIT_INTERNAL = 3;

export const FORMATS = ['md', 'json'] as const;
export type OutputFormat = (typeof FORMATS)[number];

/** Where a run writes; injected so specs capture both streams. */
export interface CliIo {
  stdout(text: string): void;
  stderr(text: string): void;
}

/** Everything one invocation needs besides argv. */
export interface CliEnv {
  readonly commands: readonly CngxCommand[];
  /** Builds the command context; called only when a command runs, so help and --version never parse the snapshot. */
  loadContext(): CommandContext;
  readonly cliVersion: string;
  readonly io: CliIo;
}

type Options = NonNullable<ParseArgsConfig['options']>;

const GLOBAL_OPTIONS: Options = {
  help: { type: 'boolean', short: 'h' },
  version: { type: 'boolean', short: 'v' },
  format: { type: 'string' },
};

const usageError = (io: CliIo, message: string, hint: string): number => {
  io.stderr(`cngx: ${message}\n${hint}\n`);
  return EXIT_USAGE;
};

/**
 * Why a command rejects `--cngx-version`: one that names its own release (a
 * migration) takes its versions through its own inputs, every other one answers
 * from the bundled snapshot.
 */
function versionHint(def: CngxCommand): string {
  if (def.answeredVersion === undefined) {
    return 'it always answers from the bundled snapshot';
  }
  const inputs = Object.keys(def.input).map((field) => (field === def.positional ? `<${field}>` : `--${flagName(def, field)}`));
  return `it takes its versions as ${inputs.join(' and ')}`;
}

/** The json document of a run that failed; `cngxVersion` is null because nothing was answered. */
const failureDocument = (reason: string, message: string): string =>
  `${JSON.stringify({ cngxVersion: null, result: null, error: { reason, message } }, null, 2)}\n`;

/**
 * One stderr line for a throw nobody expected; the message only, never the stack.
 * With a known json format the same failure also goes to stdout as a document.
 */
const internalError = (io: CliIo, prefix: string, error: unknown, format?: OutputFormat): number => {
  io.stderr(`${prefix}: internal error: ${errorMessage(error)}\n`);
  if (format === 'json') {
    io.stdout(failureDocument('internal', errorMessage(error)));
  }
  return EXIT_INTERNAL;
};

/** The flag name of an input field: its `cliFlags` rename, else the field name in kebab case. */
export function flagName(def: CngxCommand, field: string): string {
  return def.cliFlags?.[field] ?? field.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
}

const unwrapOptional = (schema: z.ZodType): z.ZodType => (schema instanceof z.ZodOptional ? unwrapOptional(schema.unwrap() as z.ZodType) : schema);

const isOptional = (schema: z.ZodType): boolean => schema.safeParse(undefined).success;

const isBoolean = (schema: z.ZodType): boolean => unwrapOptional(schema) instanceof z.ZodBoolean;

/** The `parseArgs` options of one command: its input flags plus the globals. */
function commandOptions(def: CngxCommand): Options {
  const options: Options = { ...GLOBAL_OPTIONS };
  for (const [field, schema] of Object.entries(def.input)) {
    options[flagName(def, field)] = { type: isBoolean(schema) ? 'boolean' : 'string' };
  }
  return options;
}

function valueHint(schema: z.ZodType): string {
  const inner = unwrapOptional(schema);
  if (inner instanceof z.ZodEnum) {
    return inner.options.join('|');
  }
  return isBoolean(schema) ? '' : '<value>';
}

const describe = (schema: z.ZodType): string => schema.description ?? unwrapOptional(schema).description ?? '';

function commandUsage(def: CngxCommand): string {
  const parts = [`cngx ${def.cliName}`];
  for (const [field, schema] of Object.entries(def.input)) {
    const optional = isOptional(schema);
    const token = field === def.positional ? `<${field}>` : `--${flagName(def, field)}${valueHint(schema) ? ` ${valueHint(schema)}` : ''}`;
    parts.push(optional ? `[${token}]` : token);
  }
  parts.push('[--format md|json]');
  return parts.join(' ');
}

const pad = (text: string, width: number) => text.padEnd(width);

/** Help for one command, generated from its definition. */
export function commandHelp(def: CngxCommand): string {
  const rows = Object.entries(def.input).map(([field, schema]) => {
    const hint = valueHint(schema);
    const name = field === def.positional ? `<${field}>` : `--${flagName(def, field)}${hint ? ` ${hint}` : ''}`;
    return [name, `${describe(schema)}${isOptional(schema) ? '' : ' Required.'}`] as const;
  });
  rows.push(['--format md|json', 'Output format, default md.']);
  const width = Math.max(...rows.map(([name]) => name.length)) + 2;
  return [
    `Usage: ${commandUsage(def)}`,
    '',
    def.description,
    '',
    'Arguments and flags:',
    ...rows.map(([name, text]) => `  ${pad(name, width)}${text}`),
    '',
  ].join('\n');
}

/** The command list and the global flags. */
export function generalHelp(commands: readonly CngxCommand[], cliVersion: string): string {
  const width = Math.max(...commands.map((def) => def.cliName.length)) + 2;
  return [
    `cngx ${cliVersion} - the cngx public API on the command line`,
    '',
    'Usage: cngx <command> [args] [--format md|json]',
    '',
    'Commands:',
    ...commands.map((def) => `  ${pad(def.cliName, width)}${def.title}`),
    '',
    'Global flags:',
    '  --format md|json  Output format, default md.',
    '  --version, -v     Print the @cngx/cli version.',
    '  --help, -h        Show this help; after a command, that command\'s help.',
    '',
    'Exit codes: 0 answered, 1 nothing found or the snapshot could not be resolved, 2 usage error, 3 internal error.',
    'Run `cngx <command> --help` for a command\'s arguments.',
    '',
  ].join('\n');
}

/** Every flag the CLI accepts, long and short, across the globals and all commands. */
export function knownFlags(commands: readonly CngxCommand[]): ReadonlySet<string> {
  const flags = new Set<string>();
  for (const options of [GLOBAL_OPTIONS, ...commands.map(commandOptions)]) {
    for (const [name, option] of Object.entries(options)) {
      flags.add(`--${name}`);
      if (option.short !== undefined) {
        flags.add(`-${option.short}`);
      }
    }
  }
  return flags;
}

/**
 * Every flag that takes a separate value, across the globals and all commands. A
 * value flag given before the command name (`cngx --cngx-version 0.1.0 api X`)
 * has its value skipped through this set, so a new value flag needs no scan edit.
 */
function valueFlags(commands: readonly CngxCommand[]): ReadonlySet<string> {
  const flags = new Set<string>();
  for (const options of [GLOBAL_OPTIONS, ...commands.map(commandOptions)]) {
    for (const [name, option] of Object.entries(options)) {
      if (option.type === 'string') {
        flags.add(`--${name}`);
      }
    }
  }
  return flags;
}

/** The index of the command token: the first argument that is neither a flag nor a flag's separate value. */
function commandIndex(argv: readonly string[], takesValue: ReadonlySet<string>): number {
  for (let i = 0; i < argv.length; i++) {
    const token = argv[i];
    if (takesValue.has(token)) {
      i++;
      continue;
    }
    if (!token.startsWith('-')) {
      return i;
    }
  }
  return -1;
}

const errorMessage = (error: unknown) => (error instanceof Error ? error.message : String(error));

function parseFormat(value: unknown): OutputFormat | null {
  if (value === undefined) {
    return 'md';
  }
  return FORMATS.find((format) => format === value) ?? null;
}

/** Run one invocation and return its exit code. Never throws for user input. */
export async function runCli(argv: readonly string[], env: CliEnv): Promise<number> {
  const { commands, io } = env;
  const at = commandIndex(argv, valueFlags(commands));

  if (at === -1) {
    let parsed;
    try {
      parsed = parseArgs({ args: [...argv], options: GLOBAL_OPTIONS, strict: true, allowPositionals: false });
    } catch (error) {
      return usageError(io, errorMessage(error), 'Run `cngx --help` for usage.');
    }
    if (parsed.values.version) {
      io.stdout(`${env.cliVersion}\n`);
      return EXIT_OK;
    }
    if (parsed.values.help) {
      io.stdout(generalHelp(commands, env.cliVersion));
      return EXIT_OK;
    }
    io.stderr(generalHelp(commands, env.cliVersion));
    return EXIT_USAGE;
  }

  const name = argv[at];
  const def = commands.find((command) => command.cliName === name);
  if (!def) {
    const known = commands.map((command) => command.cliName).join(', ');
    return usageError(io, `unknown command "${name}".`, `Commands: ${known}. Run \`cngx --help\` for usage.`);
  }

  const rest = [...argv.slice(0, at), ...argv.slice(at + 1)];
  const hint = `Run \`cngx ${def.cliName} --help\` for usage.`;
  if (def.cliFlags === undefined || !Object.values(def.cliFlags).includes('cngx-version')) {
    // Everything after `--` is a positional, never a flag.
    const end = rest.indexOf('--');
    const flags = end === -1 ? rest : rest.slice(0, end);
    if (flags.some((token) => token === '--cngx-version' || token.startsWith('--cngx-version='))) {
      return usageError(io, `${def.cliName} does not take --cngx-version; ${versionHint(def)}.`, hint);
    }
  }

  let parsed;
  try {
    parsed = parseArgs({ args: rest, options: commandOptions(def), strict: true, allowPositionals: true });
  } catch (error) {
    return usageError(io, errorMessage(error), hint);
  }
  const { values, positionals } = parsed;

  if (values.version) {
    io.stdout(`${env.cliVersion}\n`);
    return EXIT_OK;
  }
  if (values.help) {
    io.stdout(commandHelp(def));
    return EXIT_OK;
  }
  const format = parseFormat(values.format);
  if (format === null) {
    return usageError(io, `--format must be one of ${FORMATS.join(', ')}.`, hint);
  }

  const pinned = values['cngx-version'];
  if (typeof pinned === 'string' && pinned.trim() === '') {
    return usageError(io, '--cngx-version needs a version, e.g. --cngx-version=0.1.0.', hint);
  }
  if (typeof pinned === 'string' && !isReleaseVersion(pinned)) {
    return usageError(io, `--cngx-version must be a release version like 0.1.0 or 0.2.0-rc.1, got "${pinned}".`, hint);
  }

  const maxPositionals = def.positional === undefined ? 0 : 1;
  if (positionals.length > maxPositionals) {
    return usageError(io, `unexpected argument "${positionals[maxPositionals]}".`, hint);
  }

  const input: Record<string, unknown> = {};
  for (const field of Object.keys(def.input)) {
    const value = values[flagName(def, field)];
    if (value !== undefined) {
      input[field] = value;
    }
  }
  if (def.positional !== undefined && positionals.length === 1) {
    if (input[def.positional] !== undefined) {
      return usageError(io, `<${def.positional}> given twice.`, hint);
    }
    input[def.positional] = positionals[0];
  }

  const validated = z.object(def.input).strict().safeParse(input);
  if (!validated.success) {
    const issues = validated.error.issues.map((issue) => {
      const field = String(issue.path[0] ?? '');
      const label = field === def.positional ? `<${field}>` : `--${flagName(def, field)}`;
      return issue.code === 'invalid_type' && input[field] === undefined ? `${label} is required` : `${label}: ${issue.message}`;
    });
    return usageError(io, issues.join('; '), hint);
  }

  let context: CommandContext;
  try {
    context = env.loadContext();
  } catch (error) {
    io.stderr(`cngx: the bundled API snapshot could not be loaded: ${errorMessage(error)}\n`);
    return EXIT_NOT_FOUND;
  }

  let rendered: Rendered;
  try {
    rendered = await answer(def, context, validated.data, format);
  } catch (error) {
    return internalError(io, `cngx ${def.cliName}`, error, format);
  }
  if (rendered.stderr !== '') {
    io.stderr(rendered.stderr);
  }
  if (rendered.stdout !== '') {
    io.stdout(rendered.stdout);
  }
  return rendered.exitCode;
}

/** A finished run, rendered but not yet written. */
interface Rendered {
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode: number;
}

/** Run `def` and render its answer; any throw here is an internal error of the caller's. */
async function answer(def: CngxCommand, context: CommandContext, input: unknown, format: OutputFormat): Promise<Rendered> {
  const result = unwrapAnswer(await def.run(context, input as never));
  if (!result.ok) {
    return {
      stdout: format === 'json' ? failureDocument(result.reason, result.message) : '',
      stderr: `cngx ${def.cliName}: ${result.reason}: ${result.message}\n`,
      exitCode: EXIT_NOT_FOUND,
    };
  }

  // Versioned commands report the release they grounded against, a migration its
  // target; the others answer from the bundled snapshot.
  const cngxVersion =
    result.groundedVersion ?? def.answeredVersion?.(result.payload) ?? context.bundled.meta.cngxVersion;
  const stdout =
    format === 'json'
      ? `${JSON.stringify({ cngxVersion, result: result.payload ?? null }, null, 2)}\n`
      : `> cngx ${cngxVersion ?? 'unknown'}\n\n${def.toMarkdown(result.payload, {})}`;
  return { stdout, stderr: '', exitCode: isFound(def, result.payload) ? EXIT_OK : EXIT_NOT_FOUND };
}

/** Package-relative locations the entry module resolves against its own URL. */
export interface EntryPaths {
  /** The bundled snapshot directory, `<package>/data/`. */
  readonly dataDir: URL;
  /** The package manifest, for `--version`. */
  readonly packageJson: URL;
}

/** Load the bundled snapshot and run `argv` against the full registry. */
export async function main(argv: readonly string[], paths: EntryPaths, io: CliIo): Promise<number> {
  let cliVersion: string;
  try {
    cliVersion = (JSON.parse(readFileSync(paths.packageJson, 'utf8')) as { version: string }).version;
  } catch (error) {
    return internalError(io, 'cngx', error);
  }
  const loadContext = (): CommandContext => {
    const bundled = loadBundledDocs(fileURLToPath(paths.dataDir));
    return { bundled, resolve: createDocsResolver(bundled) };
  };
  return runCli(argv, { commands: COMMANDS, loadContext, cliVersion, io });
}
