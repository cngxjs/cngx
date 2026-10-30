// Turns the command registry into `cngx` subcommands. Every subcommand, flag,
// help text and output path is derived from the definitions in core/: a field of
// a definition's zod `input` becomes a flag (renamed through `cliFlags`, or taken
// positionally through `positional`), `run` answers, and `toMarkdown` or JSON
// renders the payload. There is no per-command code here.
//
// Exit codes: 0 answered; 1 the query ran and found nothing, or a snapshot could
// not be resolved; 2 usage error (unknown command or flag, invalid input,
// including a `migrate` version answered `invalid-version`); 3 a throw outside
// the versioned-query and `migrate` nets (snapshot load, rendering, bootstrap).
// A throw inside those nets answers `asset-missing` with an `internal:` message
// and exits 1. stdout carries data only, stderr diagnostics only; neither is ever
// coloured. The answer is rendered into one string before anything is written, so
// a run that fails never leaves part of an answer on stdout. A usage error prints
// no json document; under `--format json` every other run prints exactly one: a
// failure carries `error: { reason, message }` next to `result: null` (reason
// `internal` for exit 3), a not-found answer has no `error`.

import { readFileSync, statSync } from 'node:fs';
import { homedir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
import type { ParseArgsConfig } from 'node:util';
import { z } from 'zod';
import type { CngxCommand, CommandContext, RenderOptions } from './core/registry.js';
import { COMMANDS, isFound, unwrapAnswer } from './core/registry.js';
import type { DocsResolver } from './core/data/docs-resolver.js';
import { createDocsResolver } from './core/data/docs-resolver.js';
import { fetchSnapshot, normalizeReleaseVersion, removeTempDir } from './core/diff/snapshot-fetch.js';
import { loadBundledDocs, loadDocsFromFile } from './core/data/loader.js';
import { createSnapshotCache, resolveCacheDir } from './core/data/snapshot-cache.js';
import type { InstalledVersion } from './core/installed-version.js';
import { resolveInstalledCngxVersion } from './core/installed-version.js';
import { readCngxNames } from './from-file.js';
import type * as DoctorExports from '@cngx/doctor/cngx-doctor.mjs';

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

/** How the context of one run resolves releases. */
export interface ContextOptions {
  /** Answer from the disk cache or the bundled snapshot only; never fetch. */
  readonly offline: boolean;
  /** One diagnostic line, e.g. a cache that cannot write. */
  readonly warn: (line: string) => void;
}

/** Everything one invocation needs besides argv. */
export interface CliEnv {
  readonly commands: readonly CngxCommand[];
  /** Builds the command context; called only when a command runs, so help and --version never parse the snapshot. */
  loadContext(options: ContextOptions): CommandContext;
  /**
   * The cngx release the current project uses; run only for a command that takes
   * `--cngx-version` when the flag is absent. Without it, such a command answers
   * from the bundled snapshot.
   */
  detectVersion?(): InstalledVersion;
  /** Loads `@cngx/doctor` for `cngx doctor`; without it, `doctor` is an unknown command. */
  readonly loadDoctor?: () => Promise<DoctorModule>;
  readonly cliVersion: string;
  readonly io: CliIo;
}

const VERSION_FLAG = 'cngx-version';

/** What `cngx doctor` needs from `@cngx/doctor`. */
export type DoctorModule = Pick<typeof DoctorExports, 'parseArgs' | 'runDoctor'>;

/** Commands the adapter runs itself, outside the registry: they answer no snapshot query. */
export const ADAPTER_COMMANDS = ['doctor'] as const;

type Options = NonNullable<ParseArgsConfig['options']>;

const GLOBAL_OPTIONS: Options = {
  help: { type: 'boolean', short: 'h' },
  version: { type: 'boolean', short: 'v' },
  format: { type: 'string' },
};

/** The stderr of a usage error: the message, then where to read the usage. */
const usageText = (message: string, hint: string): string => `cngx: ${message}\n${hint}\n`;

const usageError = (io: CliIo, message: string, hint: string): number => {
  io.stderr(usageText(message, hint));
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
export const failureDocument = (reason: string, message: string): string =>
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

/**
 * The input field a command takes as `--cngx-version`, if any. It decides which
 * commands accept `--cngx-version` and `--offline` and which get the detected
 * default version.
 */
export function versionField(def: CngxCommand): string | undefined {
  return Object.keys(def.input).find((field) => flagName(def, field) === VERSION_FLAG);
}

/** Help text of the version flag: the CLI's default differs from the MCP tool's, so the adapter owns it. */
const VERSION_FLAG_HELP =
  'The cngx release to answer for, e.g. 0.2.0; a leading v or V is accepted. Default: the @cngx version ' +
  'installed in the current project, else the bundled snapshot. A non-bundled release is fetched once ' +
  '(through gh, or over HTTPS) and cached on disk.';

const OFFLINE_HELP = 'Never fetch: answer from the disk cache, else the bundled snapshot.';

const FROM_FLAG = 'from';

/**
 * Whether a command looks up names (`api`, `slots`, `theme`, `config`,
 * `example`): it then takes several names, `--from <file>` and `--compact`.
 */
export function isNameTaking(def: CngxCommand): boolean {
  return def.positional === 'name';
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
  if (versionField(def) !== undefined) {
    options.offline = { type: 'boolean' };
  }
  if (isNameTaking(def)) {
    options[FROM_FLAG] = { type: 'string' };
    options.compact = { type: 'boolean' };
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
    const name = isNameTaking(def) && field === def.positional ? `<${field}>...` : `<${field}>`;
    const token = field === def.positional ? name : `--${flagName(def, field)}${valueHint(schema) ? ` ${valueHint(schema)}` : ''}`;
    parts.push(optional ? `[${token}]` : token);
  }
  if (isNameTaking(def)) {
    parts.push(`[--${FROM_FLAG} <file>]`, '[--compact]');
  }
  if (versionField(def) !== undefined) {
    parts.push('[--offline]');
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
    const text = field === versionField(def) ? VERSION_FLAG_HELP : describe(schema);
    return [name, `${text}${isOptional(schema) ? '' : ' Required.'}`] as const;
  });
  if (isNameTaking(def)) {
    rows.push([`--${FROM_FLAG} <file>`, 'Also answer for every name the file imports from @cngx/*.']);
    rows.push(['--compact', 'Shorter markdown: names and types without descriptions.']);
  }
  if (versionField(def) !== undefined) {
    rows.push(['--offline', OFFLINE_HELP]);
  }
  rows.push(['--format md|json', 'Output format, default md.']);
  const width = Math.max(...rows.map(([name]) => name.length)) + 2;
  return [
    `Usage: ${commandUsage(def)}`,
    '',
    def.cliSummary ?? def.description,
    '',
    'Arguments and flags:',
    ...rows.map(([name, text]) => `  ${pad(name, width)}${text}`),
    '',
  ].join('\n');
}

/** Help for `cngx doctor`, which is not a registry command. */
export function doctorHelp(): string {
  return [
    'Usage: cngx doctor [<projectDir>] [--format md|json]',
    '',
    'Scan the project wiring with @cngx/doctor, the same scan as `npx cngx-doctor`.',
    '',
    'Arguments and flags:',
    '  <projectDir>      Project root to scan, default the current directory; must be a directory.',
    "  --format md|json  Output format, default md; json prints doctor's findings array.",
    '',
    'Exit codes: 0 clean or warnings only, 1 an error-severity finding, 2 usage error, 3 internal error.',
    '',
  ].join('\n');
}

/** The command list and the global flags. */
export function generalHelp(commands: readonly CngxCommand[], cliVersion: string): string {
  const width = Math.max(...[...commands.map((def) => def.cliName), ...ADAPTER_COMMANDS].map((name) => name.length)) + 2;
  return [
    `cngx ${cliVersion} - the cngx public API on the command line`,
    '',
    'Usage: cngx <command> [args] [--format md|json]',
    '',
    'Commands:',
    ...commands.map((def) => `  ${pad(def.cliName, width)}${def.title}`),
    `  ${pad('doctor', width)}Scan the project wiring (runs @cngx/doctor)`,
    '',
    'Global flags:',
    '  --format md|json  Output format, default md.',
    '  --version, -v     Print the @cngx/cli version.',
    '  --help, -h        Show this help; after a command, that command\'s help.',
    '',
    'Exit codes: 0 answered, 1 nothing found or the snapshot could not be resolved (doctor: an error finding), 2 usage error, 3 internal error.',
    'Run `cngx <command> --help` for a command\'s arguments.',
    '',
  ].join('\n');
}

/** The flags every command accepts, long and short. */
export function globalFlags(): string[] {
  return Object.entries(GLOBAL_OPTIONS).flatMap(([name, option]) =>
    option.short === undefined ? [`--${name}`] : [`--${name}`, `-${option.short}`],
  );
}

/** The flags of one command's own inputs; its positional is not a flag. */
export function commandFlags(def: CngxCommand): string[] {
  return Object.keys(def.input)
    .filter((field) => field !== def.positional)
    .map((field) => `--${flagName(def, field)}`);
}

/** The flags the adapter adds to a command beyond its inputs. */
export function adapterFlags(def: CngxCommand): string[] {
  return [...(versionField(def) === undefined ? [] : ['--offline']), ...(isNameTaking(def) ? [`--${FROM_FLAG}`, '--compact'] : [])];
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
  if (name === 'doctor' && env.loadDoctor) {
    return runDoctorCommand([...argv.slice(0, at), ...argv.slice(at + 1)], env.loadDoctor, env.cliVersion, io);
  }
  const def = commands.find((command) => command.cliName === name);
  if (!def) {
    const known = [...commands.map((command) => command.cliName), ...(env.loadDoctor ? ADAPTER_COMMANDS : [])].join(', ');
    return usageError(io, `unknown command "${name}".`, `Commands: ${known}. Run \`cngx --help\` for usage.`);
  }

  const rest = [...argv.slice(0, at), ...argv.slice(at + 1)];
  const hint = `Run \`cngx ${def.cliName} --help\` for usage.`;
  if (versionField(def) === undefined) {
    // Everything after `--` is a positional, never a flag.
    const end = rest.indexOf('--');
    const flags = end === -1 ? rest : rest.slice(0, end);
    for (const flag of [`--${VERSION_FLAG}`, '--offline']) {
      if (flags.some((token) => token === flag || token.startsWith(`${flag}=`))) {
        return usageError(io, `${def.cliName} does not take ${flag}; ${versionHint(def)}.`, hint);
      }
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

  const pinned = values[VERSION_FLAG];
  if (typeof pinned === 'string' && pinned.trim() === '') {
    return usageError(io, '--cngx-version needs a version, e.g. --cngx-version=0.1.0.', hint);
  }
  const normalized = typeof pinned === 'string' ? normalizeReleaseVersion(pinned) : undefined;
  if (normalized !== undefined && !normalized.ok) {
    return usageError(io, `--cngx-version must be a release version like 0.1.0 or 0.2.0-rc.1: ${normalized.message}`, hint);
  }

  const takesNames = isNameTaking(def);
  const maxPositionals = def.positional === undefined ? 0 : takesNames ? Infinity : 1;
  if (positionals.length > maxPositionals) {
    return usageError(io, `unexpected argument "${positionals[maxPositionals]}".`, hint);
  }

  const base: Record<string, unknown> = {};
  for (const field of Object.keys(def.input)) {
    const value = values[flagName(def, field)];
    if (value !== undefined) {
      base[field] = value;
    }
  }
  const named = [...positionals];
  const fromFile = values[FROM_FLAG];
  if (takesNames && typeof fromFile === 'string') {
    let fromNames: string[];
    try {
      fromNames = readCngxNames(fromFile);
    } catch (error) {
      return usageError(io, `--${FROM_FLAG}: cannot read ${fromFile}: ${errorMessage(error)}`, hint);
    }
    named.push(...fromNames);
    // Checked on the file alone: positionals beside it do not excuse a file that names nothing.
    if (fromNames.length === 0) {
      io.stderr(`cngx ${def.cliName}: no named @cngx imports in ${fromFile}.\n`);
      if (format === 'json') {
        io.stdout(`${JSON.stringify({ cngxVersion: null, result: [] }, null, 2)}\n`);
      }
      return EXIT_NOT_FOUND;
    }
  }
  const names = [...new Set(named)];
  if (def.positional !== undefined && names.length > 0 && base[def.positional] !== undefined) {
    return usageError(io, `<${def.positional}> given twice.`, hint);
  }
  const rawInputs = def.positional === undefined || names.length === 0 ? [base] : names.map((name) => ({ ...base, [def.positional!]: name }));

  const inputs: Record<string, unknown>[] = [];
  for (const input of rawInputs) {
    const validated = z.object(def.input).strict().safeParse(input);
    if (!validated.success) {
      const issues = validated.error.issues.map((issue) => {
        const field = String(issue.path[0] ?? '');
        const label = field === def.positional ? `<${field}>` : `--${flagName(def, field)}`;
        return issue.code === 'invalid_type' && input[field] === undefined ? `${label} is required` : `${label}: ${issue.message}`;
      });
      return usageError(io, issues.join('; '), hint);
    }
    inputs.push(validated.data as Record<string, unknown>);
  }

  const offline = values.offline === true;
  let context: CommandContext;
  try {
    context = env.loadContext({ offline, warn: (line) => io.stderr(`${line}\n`) });
  } catch (error) {
    // A broken install is not a miss: exit 3, like any other throw nobody expected.
    return internalError(io, 'cngx', error, format);
  }

  const field = versionField(def);
  if (field !== undefined && inputs[0][field] === undefined && env.detectVersion) {
    let detected: InstalledVersion;
    try {
      detected = env.detectVersion();
    } catch (error) {
      return internalError(io, 'cngx', error, format);
    }
    const pinnedTo = pinDetected(detected, context, offline, io);
    if (pinnedTo !== null) {
      for (const input of inputs) {
        input[field] = pinnedTo.version;
      }
      context = pinnedTo.context;
    }
  }

  let rendered: Rendered;
  try {
    rendered = await answer(def, context, inputs, format, hint, { compact: values.compact === true });
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

/**
 * Print the detector's notes and, for a detected release other than the bundled
 * one, a context whose resolver falls back to the bundled snapshot when that
 * release cannot be resolved. An explicit `--cngx-version` never comes here, so
 * it never falls back.
 */
function pinDetected(
  detected: InstalledVersion,
  context: CommandContext,
  offline: boolean,
  io: CliIo,
): { version: string; context: CommandContext } | null {
  for (const note of detected.notes) {
    io.stderr(`cngx: ${note}\n`);
  }
  const bundledVersion = context.bundled.meta.cngxVersion;
  if (detected.version === null || detected.version === bundledVersion) {
    return null;
  }
  const version = detected.version;
  if (detected.source === 'installed') {
    io.stderr(`cngx: answering for the installed cngx ${version}; the bundled snapshot is ${bundledVersion ?? 'unstamped'}.\n`);
  }
  const base = context.resolve;
  // The resolver memoises successes only; several names would otherwise refetch
  // and re-announce the failed release once per name.
  let failed = false;
  const resolve: DocsResolver = async (requested) => {
    if (failed && requested === version) {
      return base(undefined);
    }
    const resolution = await base(requested);
    if (resolution.ok || requested !== version) {
      return resolution;
    }
    failed = true;
    const skip = offline ? '' : ' Pass --offline to skip the fetch.';
    io.stderr(
      `cngx: cngx ${version} could not be resolved (${resolution.reason}: ${resolution.message}); ` +
        `answering from the bundled snapshot ${bundledVersion ?? 'unstamped'}.${skip}\n`,
    );
    return base(undefined);
  };
  return { version, context: { ...context, resolve } };
}

/**
 * `cngx doctor`: the `@cngx/doctor` wiring scan with the CLI's flag and exit
 * contract. `--version` / `--help` are the CLI's, never doctor's; `--format json`
 * becomes doctor's `--json` (its findings array is the document); an unknown flag,
 * `--cngx-version` or `--offline` is a usage error before any scan; 0 and 1 pass
 * through (1: an error-severity finding); a throw is exit 3.
 */
async function runDoctorCommand(
  rest: readonly string[],
  loadDoctor: () => Promise<DoctorModule>,
  cliVersion: string,
  io: CliIo,
): Promise<number> {
  const hint = 'Run `cngx doctor --help` for usage.';
  const args: string[] = [];
  const dirs: string[] = [];
  let format: OutputFormat = 'md';
  let version = false;
  let help = false;
  let afterDashes = false;
  for (let i = 0; i < rest.length; i++) {
    const token = rest[i];
    if (afterDashes || !token.startsWith('-')) {
      dirs.push(token);
      continue;
    }
    if (token === '--') {
      afterDashes = true;
      continue;
    }
    if (token === '--json') {
      return usageError(io, 'doctor takes --format json, not --json.', hint);
    }
    if (token === '--version' || token === '-v') {
      version = true;
      continue;
    }
    if (token === '--help' || token === '-h') {
      help = true;
      continue;
    }
    const inline = token.startsWith('--format=') ? token.slice('--format='.length) : undefined;
    if (token === '--format' || inline !== undefined) {
      const value = inline ?? rest[++i];
      // A bare trailing --format is a missing value, not the md default.
      const parsed = value === undefined ? null : parseFormat(value);
      if (parsed === null) {
        return usageError(io, `--format must be one of ${FORMATS.join(', ')}.`, hint);
      }
      format = parsed;
      continue;
    }
    if ([`--${VERSION_FLAG}`, '--offline'].some((flag) => token === flag || token.startsWith(`${flag}=`))) {
      return usageError(io, `doctor does not take ${token.split('=')[0]}; it scans the project, not a snapshot.`, hint);
    }
    args.push(token);
  }
  if (version) {
    io.stdout(`${cliVersion}\n`);
    return EXIT_OK;
  }
  if (help) {
    io.stdout(doctorHelp());
    return EXIT_OK;
  }
  if (dirs.length > 1) {
    return usageError(io, `doctor takes one <projectDir>, got ${dirs.length}.`, hint);
  }
  // The scan reads what it finds and reports nothing for a missing directory, so a
  // mistyped path would pass as a clean project.
  if (dirs.length === 1) {
    if (statSync(dirs[0], { throwIfNoEntry: false })?.isDirectory() !== true) {
      return usageError(io, `doctor: ${dirs[0]} is not a directory.`, hint);
    }
    args.push(dirs[0].startsWith('-') ? `./${dirs[0]}` : dirs[0]);
  }
  if (format === 'json') {
    args.push('--json');
  }

  try {
    const doctor = await loadDoctor();
    const { unknownFlags } = doctor.parseArgs(args);
    if (unknownFlags.length > 0) {
      return usageError(io, `unknown option '${unknownFlags[0]}' for doctor.`, hint);
    }
    const { output, warnings, exitCode } = doctor.runDoctor(args);
    for (const warning of warnings) {
      io.stderr(`${warning}\n`);
    }
    io.stdout(output);
    return exitCode;
  } catch (error) {
    return internalError(io, 'cngx doctor', error, format);
  }
}

/** A finished run, rendered but not yet written. */
interface Rendered {
  readonly stdout: string;
  readonly stderr: string;
  readonly exitCode: number;
}

/**
 * Run `def` once per input and render the answers; any throw here is an internal
 * error of the caller's. One input keeps the single-answer shapes. Several inputs
 * (several names) render one block per name in md and a `result` array in json;
 * a name that is not found still leaves the found ones printed and exits 1. A
 * resolve failure is per release, not per name, so the first one ends the run.
 */
async function answer(
  def: CngxCommand,
  context: CommandContext,
  inputs: readonly Record<string, unknown>[],
  format: OutputFormat,
  hint: string,
  opts: RenderOptions,
): Promise<Rendered> {
  const payloads: unknown[] = [];
  let groundedVersion: string | null | undefined;
  for (const input of inputs) {
    const result = unwrapAnswer(await def.run(context, input as never));
    // A malformed version is the caller's input, rejected before any fetch: a usage
    // error like a malformed --cngx-version, with no json document under either format.
    if (!result.ok && result.reason === 'invalid-version') {
      return { stdout: '', stderr: usageText(result.message, hint), exitCode: EXIT_USAGE };
    }
    if (!result.ok) {
      return {
        stdout: format === 'json' ? failureDocument(result.reason, result.message) : '',
        stderr: `cngx ${def.cliName}: ${result.reason}: ${result.message}\n`,
        exitCode: EXIT_NOT_FOUND,
      };
    }
    payloads.push(result.payload);
    groundedVersion ??= result.groundedVersion;
  }

  // Versioned commands report the release they grounded against, a migration its
  // target; the others answer from the bundled snapshot.
  const cngxVersion = groundedVersion ?? def.answeredVersion?.(payloads[0]) ?? context.bundled.meta.cngxVersion;
  const missing = inputs.filter((_, i) => !isFound(def, payloads[i]));
  const exitCode = missing.length === 0 ? EXIT_OK : EXIT_NOT_FOUND;
  const header = `> cngx ${cngxVersion ?? 'unknown'}\n\n`;
  if (inputs.length === 1) {
    const stdout =
      format === 'json'
        ? `${JSON.stringify({ cngxVersion, result: payloads[0] ?? null }, null, 2)}\n`
        : `${header}${def.toMarkdown(payloads[0], opts)}`;
    return { stdout, stderr: '', exitCode };
  }
  const stdout =
    format === 'json'
      ? `${JSON.stringify({ cngxVersion, result: payloads.map((payload) => payload ?? null) }, null, 2)}\n`
      : `${header}${payloads.map((payload) => def.toMarkdown(payload, opts)).join('\n')}`;
  const label = (input: Record<string, unknown>) => String(input[def.positional!]);
  const stderr = missing.length === 0 ? '' : `cngx ${def.cliName}: not found: ${missing.map(label).join(', ')}\n`;
  return { stdout, stderr, exitCode };
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
  const loadContext = ({ offline, warn }: ContextOptions): CommandContext => {
    const bundled = loadBundledDocs(fileURLToPath(paths.dataDir));
    const cache = createSnapshotCache({ dir: resolveCacheDir(process.env, process.platform, homedir()), warn });
    const resolve = createDocsResolver(bundled, { fetchSnapshot, loadDocs: loadDocsFromFile, removeDir: removeTempDir, cache, offline });
    return { bundled, resolve };
  };
  const detectVersion = () => resolveInstalledCngxVersion(process.cwd());
  const loadDoctor = () => import('@cngx/doctor/cngx-doctor.mjs');
  return runCli(argv, { commands: COMMANDS, loadContext, detectVersion, loadDoctor, cliVersion, io });
}
