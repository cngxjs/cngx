import { type workspaces } from '@angular-devkit/core';
import { JSONFile } from '@schematics/angular/utility/json-file';
import { posix } from 'node:path';

import {
  type AiTool,
  declaredRange,
  hasArrayLiteral,
  hasProvenanceStamp,
  hasStyleImport,
  isRecord,
  type LanguagePackArgument,
  type PackageManifest,
  parseManifest,
  readProviderCalls,
  styleEntryPath,
  type Tree,
} from '../../engine';

export type MaterialThemeShape = 'map-api' | 'define-theme' | 'm2' | 'prebuilt' | 'none';

export interface MaterialFacts {
  readonly present: boolean;
  readonly themeShape: MaterialThemeShape;
  /** The style entry the theme was found in; `undefined` without a theme. */
  readonly themePath: string | undefined;
  /** The Sass variable holding a `define-theme` or M2 theme object. */
  readonly themeVariable: string | undefined;
  /** The density the theme declares; 0 when it declares none. */
  readonly density: number;
}

export interface EslintConfigFacts {
  readonly path: string;
  readonly module: 'esm' | 'cjs';
  /** The default export is an array literal, bare or wrapped in `defineConfig([...])`. */
  readonly editable: boolean;
  /** `@cngx/eslint-plugin` is already loaded. */
  readonly wired: boolean;
}

/** An `.eslintrc*` config ESLint 9 no longer reads. */
export interface LegacyEslintConfigFacts {
  readonly path: string;
}

/** The ESLint packages the app declares; the plugin runs on ESLint 9 or later. */
export interface EslintStackFacts {
  /**
   * The highest major the declared `eslint` range admits (`^8 || ^9` is 9);
   * `undefined` when none is declared or the range is open upward or
   * unreadable, so an unknown range never blocks.
   */
  readonly eslintMajor: number | undefined;
  /** `@angular-eslint/template-parser` is declared; the plugin loads it for templates. */
  readonly templateParser: boolean;
  /** `typescript-eslint`, `@typescript-eslint/parser` or `angular-eslint` is declared. */
  readonly typescriptParser: boolean;
  /** The declared `angular-eslint` range; the template parser follows its version line. */
  readonly angularEslint: string | undefined;
  /**
   * The highest major of the template parser line the app ends up on: its own
   * declared range, else the `angular-eslint` one; `undefined` when neither is
   * declared or the range is open upward or unreadable.
   */
  readonly templateParserMajor: number | undefined;
}

export interface EditorFacts {
  readonly claude: boolean;
  readonly cursor: boolean;
  readonly vscode: boolean;
}

/** Where each editor reads a project-local MCP server, and under which key. */
export const MCP_CONFIGS: Readonly<Record<AiTool, { readonly path: string; readonly key: string }>> = {
  claude: { path: '.mcp.json', key: 'mcpServers' },
  cursor: { path: '.cursor/mcp.json', key: 'mcpServers' },
  vscode: { path: '.vscode/mcp.json', key: 'servers' },
};

/**
 * An editor's MCP config: missing, present without a `cngx` server, already
 * declaring one, or not JSON cngx can edit.
 */
export type McpConfigState = 'absent' | 'present' | 'wired' | 'invalid';

/** The helper README the AI tooling step writes. */
export const HELPER_README_PATH = '.cngx/README.md';

export interface HelperReadmeFacts {
  /** It starts with a cngx provenance stamp; otherwise someone else wrote it. */
  readonly generated: boolean;
  /** The fingerprint of the render cngx wrote; `undefined` when the file carries none. */
  readonly fingerprint: string | undefined;
}

/**
 * Records the fingerprint of the rendered README in the file itself. The CLI
 * may run the app's Prettier over generated files, so hashing what is on disk
 * would read a formatted current README as stale; the comment line survives.
 */
export function helperReadmeFingerprintLine(fingerprint: string): string {
  return `<!-- cngx:fingerprint ${fingerprint} -->`;
}

const FINGERPRINT_LINE = /<!-- cngx:fingerprint ([0-9a-f]{8}) -->/;

/** An agent instruction file: missing, present, or already carrying the cngx block. */
export type InstructionState = 'absent' | 'present' | 'wired';

export interface ClaudeInstructions {
  readonly path: 'CLAUDE.md' | '.claude/CLAUDE.md';
  readonly state: Exclude<InstructionState, 'absent'>;
}

/**
 * A file cngx generates (`cngx-layers.css`, `cngx-language.ts`): missing,
 * written by cngx (it carries the provenance stamp), or someone else's.
 */
export type GeneratedFileState = 'absent' | 'generated' | 'foreign';

/** Tailwind CSS as the app declares and loads it. */
export interface TailwindFacts {
  /** The major of the declared `tailwindcss` range. */
  readonly major: number;
  /** A global stylesheet imports `tailwindcss` (v4), so its rules sit in cascade layers. */
  readonly layered: boolean;
  /**
   * The first local stylesheet in the build styles. The bundle starts with
   * it, so the layer order file is imported there.
   */
  readonly orderTarget: string | undefined;
  /**
   * A global stylesheet already imports `cngx-layers.css`. An inline
   * `@layer` statement does not count: the bundler places it after every
   * imported file, so it cannot order layers the imports already declared.
   */
  readonly orderDeclared: boolean;
  /** `cngx-layers.css` next to the order target. */
  readonly layersFile: GeneratedFileState;
}

/** The file that orders the Tailwind and cngx cascade layers; it loads before every other import. */
export const CNGX_LAYERS_FILE = 'cngx-layers.css';

/** The theme file cngx generates in the source root: CSS for the default theme, SCSS for a Material map. */
export const CNGX_THEME_FILES = { css: 'cngx-theme.css', scss: 'cngx-theme.scss' } as const;

/** The file holding the runtime language switch signal, next to the root providers file. */
export const CNGX_LANGUAGE_FILE = 'cngx-language.ts';

/** Opens the block cngx writes into agent instruction files; a later run finds it. */
export const AGENTS_MARKER = '<!-- cngx:agents -->';

/** Everything the plan steps branch on, read once before any question. */
export interface ProjectFacts {
  readonly project: string;
  /** The app's `package.json`; steps read declared ranges from it. */
  readonly manifest: PackageManifest;
  readonly sourceRoot: string;
  readonly angularVersion: string | undefined;
  readonly bootstrap: 'standalone' | 'ngmodule';
  readonly zoneless: boolean;
  readonly signalForms: boolean;
  readonly stylesKind: 'css' | 'scss';
  /** The global stylesheet; `undefined` when the build lists none. */
  readonly stylesPath: string | undefined;
  /** `@cngx/themes/cngx.css` is imported by a global stylesheet or listed as a style entry. */
  readonly cngxStylesheet: boolean;
  /** The file already wiring a cngx theme: a `cngx-theme.*` file or a stylesheet using the Material bridge. */
  readonly cngxThemePath: string | undefined;
  /** A generated `cngx-theme.*` is listed in the build styles, whether or not the file is still there. */
  readonly cngxThemeListed: boolean;
  /** `undefined` when the app does not declare `tailwindcss`. */
  readonly tailwind: TailwindFacts | undefined;
  /** The file holding the root providers: `app.config.ts` or the root NgModule. */
  readonly appConfigPath: string;
  /** Every `provide*()` call already in that file. */
  readonly rootProviders: readonly string[];
  /** `cngx-language.ts` next to `appConfigPath`. */
  readonly languageFile: GeneratedFileState;
  /** The pack a `provideCngxI18n(withPack(...))` there passes; `undefined` when none. */
  readonly languagePack: LanguagePackArgument | undefined;
  readonly material: MaterialFacts;
  readonly editors: EditorFacts;
  readonly mcpConfigs: Readonly<Record<AiTool, McpConfigState>>;
  /** The `@cngx/mcp` version a `wired` config pins; `undefined` when none is found. */
  readonly mcpPins: Readonly<Record<AiTool, string | undefined>>;
  /** `AGENTS.md`: missing, present, or already carrying the cngx block. */
  readonly agentsMd: InstructionState;
  /**
   * The project instructions Claude Code reads: `CLAUDE.md`, else
   * `.claude/CLAUDE.md` (where `ng new --ai-config=claude` puts it);
   * `undefined` when there is neither. Claude Code reads `AGENTS.md` only
   * without one.
   */
  readonly claudeInstructions: ClaudeInstructions | undefined;
  /** `.cngx/README.md`; `undefined` when there is none. */
  readonly helperReadme: HelperReadmeFacts | undefined;
  /** The eslint flat config; `undefined` when the app has none. */
  readonly eslintConfig: EslintConfigFacts | undefined;
  /** An `.eslintrc*` config ESLint 9 no longer reads; `undefined` when there is none. */
  readonly legacyEslintConfig: LegacyEslintConfigFacts | undefined;
  readonly eslintStack: EslintStackFacts;
  readonly ssr: boolean;
  readonly sourceLocale: string | undefined;
  readonly maturity: 'fresh' | 'existing';
}

const OTHER_UI_LIBRARIES = ['@angular/material', 'primeng', 'tailwindcss', 'bootstrap'];

// What `ng new` 21 puts into the root providers; anything else means someone
// has already wired the app.
const SCAFFOLD_PROVIDERS = new Set([
  'provideBrowserGlobalErrorListeners',
  'provideRouter',
  'provideZoneChangeDetection',
  'provideZonelessChangeDetection',
  'provideClientHydration',
]);

const ESLINT_FLAT_CONFIGS = [
  'eslint.config.js',
  'eslint.config.mjs',
  'eslint.config.cjs',
  'eslint.config.ts',
  'eslint.config.mts',
  'eslint.config.cts',
];

const ESLINT_LEGACY_CONFIGS = [
  '.eslintrc',
  '.eslintrc.json',
  '.eslintrc.js',
  '.eslintrc.cjs',
  '.eslintrc.yaml',
  '.eslintrc.yml',
];

function detectLegacyEslintConfig(tree: Tree): LegacyEslintConfigFacts | undefined {
  const path = ESLINT_LEGACY_CONFIGS.find((candidate) => tree.exists(candidate));
  return path === undefined ? undefined : { path };
}

const TYPESCRIPT_PARSERS = ['typescript-eslint', '@typescript-eslint/parser', 'angular-eslint'];

const PREBUILT_THEME = '@angular/material/prebuilt-themes/';

/** The one stylesheet every cngx app loads. */
export const CNGX_STYLESHEET = '@cngx/themes/cngx.css';
const MATERIAL_BRIDGE = '@cngx/themes/material/theme';


function resolveProject(
  workspace: workspaces.WorkspaceDefinition,
  name: string | undefined,
): readonly [string, workspaces.ProjectDefinition] {
  const defaultProject = workspace.extensions['defaultProject'];
  const candidate =
    name ??
    (typeof defaultProject === 'string' ? defaultProject : undefined) ??
    [...workspace.projects].find(([, project]) => project.extensions['projectType'] === 'application')?.[0] ??
    [...workspace.projects.keys()][0];
  const project = candidate === undefined ? undefined : workspace.projects.get(candidate);
  if (candidate === undefined || project === undefined) {
    throw new Error(`Project "${candidate ?? ''}" not found in angular.json.`);
  }
  if (project.extensions['projectType'] === 'library') {
    throw new Error(`Project "${candidate}" is a library; cngx ng-add sets up an application.`);
  }
  return [candidate, project];
}

function buildOptions(project: workspaces.ProjectDefinition): Readonly<Record<string, unknown>> {
  return project.targets.get('build')?.options ?? {};
}

function styleEntries(options: Readonly<Record<string, unknown>>): readonly string[] {
  const styles = options['styles'];
  if (!Array.isArray(styles)) {
    return [];
  }
  return styles.flatMap((entry: unknown) => {
    const path = styleEntryPath(entry);
    return path === undefined ? [] : [path];
  });
}

function isLocalStylesheet(path: string): boolean {
  return /\.s?css$/.test(path) && !path.startsWith('@') && !path.startsWith('node_modules/');
}

// Same preference as `getProjectStyleFile` in @schematics/angular: a file
// named `styles.*` wins, otherwise the first local stylesheet.
function globalStylesheet(entries: readonly string[]): string | undefined {
  const local = entries.filter(isLocalStylesheet);
  return local.find((path) => /(^|\/)styles\.s?css$/.test(path)) ?? local[0];
}

function escape(text: string): string {
  return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function materialNamespace(content: string): string | undefined {
  const use = /@use\s+['"]@angular\/material['"](?:\s+as\s+([\w-]+|\*))?\s*;/.exec(content);
  if (use === null) {
    return undefined;
  }
  return use[1] ?? 'mat';
}

function integerAfter(content: string, from: number, pattern: RegExp): number {
  const match = pattern.exec(content.slice(from));
  return match === null ? 0 : Number(match[1]);
}

function themeInFile(path: string, content: string): MaterialFacts | undefined {
  const namespace = materialNamespace(content);
  if (namespace === undefined) {
    return undefined;
  }
  const ns = namespace === '*' ? '' : `${escape(namespace)}\\.`;
  const themeVariable = new RegExp(
    `\\$([\\w-]+)\\s*:\\s*${ns}(?:define-theme|(?:m2-)?define-(?:light|dark)-theme)\\s*\\(`,
  ).exec(content)?.[1];
  const defineTheme = new RegExp(`${ns}define-theme\\s*\\(`).exec(content);
  if (defineTheme !== null) {
    const density = integerAfter(content, defineTheme.index, /density\s*:\s*\(\s*scale\s*:\s*(-?\d+)/);
    return { present: true, themeShape: 'define-theme', themePath: path, themeVariable, density };
  }
  if (new RegExp(`${ns}(m2-)?define-(light|dark)-theme\\s*\\(`).test(content)) {
    return { present: true, themeShape: 'm2', themePath: path, themeVariable, density: 0 };
  }
  const mapApi = new RegExp(`${ns}theme\\s*\\(\\s*\\(`).exec(content);
  if (mapApi !== null) {
    const density = integerAfter(content, mapApi.index, /density\s*:\s*(-?\d+)/);
    return { present: true, themeShape: 'map-api', themePath: path, themeVariable: undefined, density };
  }
  return undefined;
}

// File content by path, read once per detection run; `undefined` when absent.
type Read = (path: string) => string | undefined;

function detectMaterial(read: Read, manifest: PackageManifest, entries: readonly string[]): MaterialFacts {
  const none: MaterialFacts = {
    present: false,
    themeShape: 'none',
    themePath: undefined,
    themeVariable: undefined,
    density: 0,
  };
  if (declaredRange(manifest, '@angular/material') === undefined) {
    return none;
  }
  for (const entry of entries) {
    if (entry.includes(PREBUILT_THEME)) {
      return { present: true, themeShape: 'prebuilt', themePath: entry, themeVariable: undefined, density: 0 };
    }
    const content = entry.endsWith('.scss') ? read(entry) : undefined;
    const theme = content === undefined ? undefined : themeInFile(entry, content);
    if (theme !== undefined) {
      return theme;
    }
  }
  return { ...none, present: true };
}

function importsCngxStylesheet(read: Read, entries: readonly string[]): boolean {
  return (
    entries.includes(CNGX_STYLESHEET) ||
    entries
      .filter(isLocalStylesheet)
      .some((entry) => hasStyleImport(read(entry) ?? '', `@import '${CNGX_STYLESHEET}';`))
  );
}

// The major of a declared range; an unreadable range (`latest`) falls back
// to the generation the stylesheet import shape implies.
function majorOf(range: string, layered: boolean): number {
  const major = /\d+/.exec(range)?.[0];
  if (major !== undefined) {
    return Number(major);
  }
  return layered ? 4 : 3;
}

function detectTailwind(read: Read, manifest: PackageManifest, entries: readonly string[]): TailwindFacts | undefined {
  const range = declaredRange(manifest, 'tailwindcss');
  if (range === undefined) {
    return undefined;
  }
  const local = entries.filter(isLocalStylesheet);
  const contents = local.map((entry) => read(entry) ?? '');
  const layered = contents.some((content) => hasStyleImport(content, "@import 'tailwindcss';"));
  const layersImport = new RegExp(`@import\\s+(['"])(?:[^'"]*/)?${escape(CNGX_LAYERS_FILE)}\\1`);
  const orderTarget = local[0];
  const layersContent = orderTarget === undefined ? undefined : read(posix.join(posix.dirname(orderTarget), CNGX_LAYERS_FILE));
  return {
    major: majorOf(range, layered),
    layered,
    orderTarget,
    orderDeclared: contents.some((content) => layersImport.test(content)),
    layersFile: generatedFileState(layersContent),
  };
}

function generatedFileState(content: string | undefined): GeneratedFileState {
  if (content === undefined) {
    return 'absent';
  }
  return hasProvenanceStamp(content) ? 'generated' : 'foreign';
}

function existingCngxTheme(tree: Tree, read: Read, sourceRoot: string, entries: readonly string[]): string | undefined {
  const generated = Object.values(CNGX_THEME_FILES)
    .map((name) => posix.join(sourceRoot, name))
    .find((path) => tree.exists(path));
  return (
    generated ??
    entries.find((entry) => entry.endsWith('.scss') && (read(entry) ?? '').includes(MATERIAL_BRIDGE))
  );
}

function detectEslintConfig(tree: Tree): EslintConfigFacts | undefined {
  const path = ESLINT_FLAT_CONFIGS.find((candidate) => tree.exists(candidate));
  if (path === undefined) {
    return undefined;
  }
  const content = tree.readText(path);
  // `.js` and `.ts` follow their syntax; the explicit extensions fix the format.
  const esm = /\.m[jt]s$/.test(path) || (/\.[jt]s$/.test(path) && /^\s*(import\s|export\s)/m.test(content));
  return {
    path,
    module: esm ? 'esm' : 'cjs',
    editable: hasArrayLiteral(content, { kind: 'default-export' }),
    wired: content.includes('@cngx/eslint-plugin'),
  };
}

// `A - B` reaches B; `<N` reaches N - 1 (`<9.1` still reaches 9), `<=N`
// reaches N; `^X`, `~X` and `X.x` stay on X; `>`/`>=` alone are open.
// A prerelease or build suffix (`-rc.1`, `+sha`) is consumed with its
// version, so its digits never read as a version of their own.
function highestMajorOf(alternative: string): number | undefined {
  const hyphen = /^\S+\s+-\s+v?(\d+)/.exec(alternative);
  if (hyphen !== null) {
    return Number(hyphen[1]);
  }
  const uppers: number[] = [];
  let pinned: number | undefined;
  for (const [, operator, major, rest] of alternative.matchAll(/(<=|<|>=|>|\^|~|=)?\s*v?(\d+)((?:\.(?:\d+|[xX*]))*)(?:[-+][0-9A-Za-z.+-]*)?/g)) {
    if (operator === '<') {
      uppers.push(/[1-9]/.test(rest) ? Number(major) : Number(major) - 1);
    } else if (operator === '<=') {
      uppers.push(Number(major));
    } else if (operator !== '>' && operator !== '>=') {
      pinned = Number(major);
    }
  }
  return uppers.length > 0 ? Math.min(...uppers) : pinned;
}

function highestMajor(range: string | undefined): number | undefined {
  if (range === undefined) {
    return undefined;
  }
  let highest = 0;
  for (const alternative of range.split('||')) {
    const major = highestMajorOf(alternative.trim());
    if (major === undefined) {
      return undefined;
    }
    highest = Math.max(highest, major);
  }
  return highest;
}

function detectEslintStack(manifest: PackageManifest): EslintStackFacts {
  return {
    eslintMajor: highestMajor(declaredRange(manifest, 'eslint')),
    templateParser: declaredRange(manifest, '@angular-eslint/template-parser') !== undefined,
    typescriptParser: TYPESCRIPT_PARSERS.some((name) => declaredRange(manifest, name) !== undefined),
    angularEslint: declaredRange(manifest, 'angular-eslint'),
    templateParserMajor: highestMajor(
      declaredRange(manifest, '@angular-eslint/template-parser') ?? declaredRange(manifest, 'angular-eslint'),
    ),
  };
}

function sourceFiles(tree: Tree, root: string): readonly string[] {
  const files: string[] = [];
  tree.getDir(root).visit((path) => {
    if (path.endsWith('.ts') && !path.endsWith('.spec.ts')) {
      files.push(path.replace(/^\//, ''));
    }
  });
  return files;
}

interface McpConfigFacts {
  readonly state: McpConfigState;
  readonly pin: string | undefined;
}

const MCP_PACKAGE = /^@cngx\/mcp@(.+)$/;

// The version an existing cngx entry runs, read from `npx -y @cngx/mcp@<v>`.
function mcpPinOf(entry: unknown): string | undefined {
  const args = isRecord(entry) ? entry['args'] : undefined;
  if (!Array.isArray(args)) {
    return undefined;
  }
  const match = args.map((arg) => (typeof arg === 'string' ? MCP_PACKAGE.exec(arg) : null)).find((found) => found !== null);
  return match?.[1];
}

// JSONFile reads JSONC, so a commented `.vscode/mcp.json` still counts as editable.
function mcpConfigOf(tree: Tree, path: string, key: string): McpConfigFacts {
  if (!tree.exists(path)) {
    return { state: 'absent', pin: undefined };
  }
  let root: unknown;
  try {
    root = new JSONFile(tree, path).get([]);
  } catch {
    return { state: 'invalid', pin: undefined };
  }
  const servers = isRecord(root) ? root[key] : undefined;
  if (!isRecord(root) || (servers !== undefined && !isRecord(servers))) {
    // Not an object cngx can add an entry to: the JSON write would throw at apply time.
    return { state: 'invalid', pin: undefined };
  }
  const entry = servers?.['cngx'];
  return entry === undefined ? { state: 'present', pin: undefined } : { state: 'wired', pin: mcpPinOf(entry) };
}

function instructionState(read: Read, path: string): InstructionState {
  const content = read(path);
  if (content === undefined) {
    return 'absent';
  }
  return content.includes(AGENTS_MARKER) ? 'wired' : 'present';
}

function claudeInstructionsOf(read: Read): ClaudeInstructions | undefined {
  for (const path of ['CLAUDE.md', '.claude/CLAUDE.md'] as const) {
    const state = instructionState(read, path);
    if (state !== 'absent') {
      return { path, state };
    }
  }
  return undefined;
}

function helperReadmeOf(read: Read): HelperReadmeFacts | undefined {
  const content = read(HELPER_README_PATH);
  return content === undefined
    ? undefined
    : { generated: hasProvenanceStamp(content), fingerprint: FINGERPRINT_LINE.exec(content)?.[1] };
}

function hasEntries(tree: Tree, dir: string): boolean {
  const entry = tree.getDir(dir);
  return entry.subfiles.length > 0 || entry.subdirs.length > 0;
}

// Follows the import of the second `bootstrapApplication` argument or the
// `bootstrapModule` argument; an inline config falls back to the scaffold path.
function rootProvidersPath(mainPath: string, main: string, standalone: boolean, sourceRoot: string): string {
  const fallback = posix.join(sourceRoot, 'app', 'app.config.ts');
  const call = standalone ? /bootstrapApplication\s*\(\s*\w+\s*,\s*(\w+)/ : /bootstrapModule\s*\(\s*(\w+)/;
  const identifier = call.exec(main)?.[1];
  if (identifier === undefined) {
    return fallback;
  }
  const specifier = new RegExp(`import\\s*\\{[^}]*\\b${identifier}\\b[^}]*\\}\\s*from\\s*['"](\\.[^'"]+)['"]`).exec(main)?.[1];
  return specifier === undefined ? fallback : `${posix.join(posix.dirname(mainPath), specifier)}.ts`;
}

function includesZone(polyfills: unknown): boolean {
  const entries = Array.isArray(polyfills) ? polyfills : [polyfills];
  return entries.some((entry) => entry === 'zone.js');
}

function sourceLocaleOf(project: workspaces.ProjectDefinition): string | undefined {
  const i18n = project.extensions['i18n'];
  const locale = isRecord(i18n) ? i18n['sourceLocale'] : undefined;
  if (typeof locale === 'string') {
    return locale;
  }
  return isRecord(locale) && typeof locale['code'] === 'string' ? locale['code'] : undefined;
}

function versionOf(range: string | undefined): string | undefined {
  return range === undefined ? undefined : /\d+\.\d+\.\d+(?:-[\w.]+)?/.exec(range)?.[0];
}

/**
 * Reads the facts every onboarding step branches on from the tree and the
 * parsed workspace. Pure: it only reads, and git state, time and the
 * environment are not facts (a devkit `Tree` carries no `.git`).
 */
export function detectProject(tree: Tree, workspace: workspaces.WorkspaceDefinition, name?: string): ProjectFacts {
  const [projectName, project] = resolveProject(workspace, name);
  const sourceRoot = project.sourceRoot ?? posix.join(project.root, 'src');
  const options = buildOptions(project);
  const manifest = parseManifest(tree.readText('package.json'));

  // One read per source file feeds every source-derived fact.
  const sources = sourceFiles(tree, sourceRoot).map((path) => ({ path, content: tree.readText(path) }));
  const contents = new Map<string, string | undefined>(sources.map(({ path, content }) => [path, content]));
  const read: Read = (path) => {
    if (!contents.has(path)) {
      contents.set(path, tree.exists(path) ? tree.readText(path) : undefined);
    }
    return contents.get(path);
  };

  const mainOption = options['browser'] ?? options['main'];
  const mainPath = typeof mainOption === 'string' ? mainOption : posix.join(sourceRoot, 'main.ts');
  const main = read(mainPath) ?? '';
  const standalone = !/bootstrapModule\s*\(/.test(main);
  const appConfigPath = rootProvidersPath(mainPath, main, standalone, sourceRoot);
  const providerCalls = readProviderCalls(read(appConfigPath) ?? '');
  const providers = providerCalls.names;

  const entries = styleEntries(options);
  const stylesPath = globalStylesheet(entries);
  const appRoot = `${posix.join(sourceRoot, 'app')}/`;
  const componentCount = sources.filter(
    ({ path, content }) => path.startsWith(appRoot) && /@Component\s*\(/.test(content),
  ).length;

  const mcpConfigs: Readonly<Record<AiTool, McpConfigFacts>> = {
    claude: mcpConfigOf(tree, MCP_CONFIGS.claude.path, MCP_CONFIGS.claude.key),
    cursor: mcpConfigOf(tree, MCP_CONFIGS.cursor.path, MCP_CONFIGS.cursor.key),
    vscode: mcpConfigOf(tree, MCP_CONFIGS.vscode.path, MCP_CONFIGS.vscode.key),
  };

  const hasOtherUi = OTHER_UI_LIBRARIES.some((library) => declaredRange(manifest, library) !== undefined);
  const hasOwnProviders = providers.some((provider) => !SCAFFOLD_PROVIDERS.has(provider));

  return {
    project: projectName,
    manifest,
    sourceRoot,
    angularVersion: versionOf(declaredRange(manifest, '@angular/core')),
    bootstrap: standalone ? 'standalone' : 'ngmodule',
    zoneless: !includesZone(options['polyfills']) && !providers.includes('provideZoneChangeDetection'),
    signalForms: sources.some(({ content }) => /['"]@angular\/forms\/signals['"]/.test(content)),
    stylesKind: stylesPath?.endsWith('.scss') === true ? 'scss' : 'css',
    stylesPath,
    cngxStylesheet: importsCngxStylesheet(read, entries),
    cngxThemePath: existingCngxTheme(tree, read, sourceRoot, entries),
    cngxThemeListed: Object.values(CNGX_THEME_FILES).some((name) =>
      entries.includes(posix.join(sourceRoot, name)),
    ),
    tailwind: detectTailwind(read, manifest, entries),
    appConfigPath,
    rootProviders: providers,
    languageFile: generatedFileState(read(posix.join(posix.dirname(appConfigPath), CNGX_LANGUAGE_FILE))),
    languagePack: providerCalls.languagePack,
    material: detectMaterial(read, manifest, entries),
    editors: {
      claude: tree.exists('CLAUDE.md') || hasEntries(tree, '.claude'),
      cursor: tree.exists('.cursorrules') || hasEntries(tree, '.cursor'),
      vscode: hasEntries(tree, '.vscode'),
    },
    mcpConfigs: {
      claude: mcpConfigs.claude.state,
      cursor: mcpConfigs.cursor.state,
      vscode: mcpConfigs.vscode.state,
    },
    mcpPins: {
      claude: mcpConfigs.claude.pin,
      cursor: mcpConfigs.cursor.pin,
      vscode: mcpConfigs.vscode.pin,
    },
    agentsMd: instructionState(read, 'AGENTS.md'),
    claudeInstructions: claudeInstructionsOf(read),
    helperReadme: helperReadmeOf(read),
    eslintConfig: detectEslintConfig(tree),
    legacyEslintConfig: detectLegacyEslintConfig(tree),
    eslintStack: detectEslintStack(manifest),
    ssr:
      options['server'] !== undefined ||
      options['ssr'] !== undefined ||
      declaredRange(manifest, '@angular/ssr') !== undefined,
    sourceLocale: sourceLocaleOf(project),
    maturity: componentCount > 1 || hasOtherUi || hasOwnProviders ? 'existing' : 'fresh',
  };
}
