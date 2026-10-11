import { type workspaces } from '@angular-devkit/core';
import { posix } from 'node:path';

import { declaredRange, type PackageManifest, parseManifest, type Tree } from '../../engine';

export type MaterialThemeShape = 'map-api' | 'define-theme' | 'm2' | 'prebuilt' | 'none';

export interface MaterialFacts {
  readonly present: boolean;
  readonly themeShape: MaterialThemeShape;
  /** The style entry the theme was found in; `undefined` without a theme. */
  readonly themePath: string | undefined;
  /** The density the theme declares; 0 when it declares none. */
  readonly density: number;
}

export interface EditorFacts {
  readonly claude: boolean;
  readonly cursor: boolean;
  readonly vscode: boolean;
}

/** Everything the plan steps branch on, read once before any question. */
export interface ProjectFacts {
  readonly project: string;
  /** The app's `package.json`; steps read declared ranges from it. */
  readonly manifest: PackageManifest;
  readonly angularVersion: string | undefined;
  readonly bootstrap: 'standalone' | 'ngmodule';
  readonly zoneless: boolean;
  readonly signalForms: boolean;
  readonly stylesKind: 'css' | 'scss';
  /** The global stylesheet; `undefined` when the build lists none. */
  readonly stylesPath: string | undefined;
  /** The file holding the root providers: `app.config.ts` or the root NgModule. */
  readonly appConfigPath: string;
  readonly material: MaterialFacts;
  readonly editors: EditorFacts;
  readonly eslintConfigPath: string | undefined;
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

const ESLINT_FLAT_CONFIGS = ['eslint.config.js', 'eslint.config.mjs', 'eslint.config.cjs'];

const PREBUILT_THEME = '@angular/material/prebuilt-themes/';

function isRecord(value: unknown): value is Readonly<Record<string, unknown>> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

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
    if (typeof entry === 'string') {
      return [entry];
    }
    return isRecord(entry) && typeof entry['input'] === 'string' ? [entry['input']] : [];
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
  const defineTheme = new RegExp(`${ns}define-theme\\s*\\(`).exec(content);
  if (defineTheme !== null) {
    const density = integerAfter(content, defineTheme.index, /density\s*:\s*\(\s*scale\s*:\s*(-?\d+)/);
    return { present: true, themeShape: 'define-theme', themePath: path, density };
  }
  if (new RegExp(`${ns}(m2-)?define-(light|dark)-theme\\s*\\(`).test(content)) {
    return { present: true, themeShape: 'm2', themePath: path, density: 0 };
  }
  const mapApi = new RegExp(`${ns}theme\\s*\\(\\s*\\(`).exec(content);
  if (mapApi !== null) {
    const density = integerAfter(content, mapApi.index, /density\s*:\s*(-?\d+)/);
    return { present: true, themeShape: 'map-api', themePath: path, density };
  }
  return undefined;
}

function detectMaterial(tree: Tree, manifest: PackageManifest, entries: readonly string[]): MaterialFacts {
  const none: MaterialFacts = { present: false, themeShape: 'none', themePath: undefined, density: 0 };
  if (declaredRange(manifest, '@angular/material') === undefined) {
    return none;
  }
  for (const entry of entries) {
    if (entry.includes(PREBUILT_THEME)) {
      return { present: true, themeShape: 'prebuilt', themePath: entry, density: 0 };
    }
    const theme = entry.endsWith('.scss') && tree.exists(entry) ? themeInFile(entry, tree.readText(entry)) : undefined;
    if (theme !== undefined) {
      return theme;
    }
  }
  return { ...none, present: true };
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

function providerNames(content: string): readonly string[] {
  return [...content.matchAll(/\b(provide\w+)\s*\(/g)].map((match) => match[1]);
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

  const mainOption = options['browser'] ?? options['main'];
  const mainPath = typeof mainOption === 'string' ? mainOption : posix.join(sourceRoot, 'main.ts');
  const main = tree.exists(mainPath) ? tree.readText(mainPath) : '';
  const standalone = !/bootstrapModule\s*\(/.test(main);
  const appConfigPath = rootProvidersPath(mainPath, main, standalone, sourceRoot);
  const appConfig = tree.exists(appConfigPath) ? tree.readText(appConfigPath) : '';
  const providers = providerNames(appConfig);

  const entries = styleEntries(options);
  const stylesPath = globalStylesheet(entries);
  const sources = sourceFiles(tree, sourceRoot);
  const appSources = sources.filter((path) => path.startsWith(posix.join(sourceRoot, 'app') + '/'));
  const componentCount = appSources.filter((path) => /@Component\s*\(/.test(tree.readText(path))).length;

  const hasOtherUi = OTHER_UI_LIBRARIES.some((library) => declaredRange(manifest, library) !== undefined);
  const hasOwnProviders = providers.some((provider) => !SCAFFOLD_PROVIDERS.has(provider));

  return {
    project: projectName,
    manifest,
    angularVersion: versionOf(declaredRange(manifest, '@angular/core')),
    bootstrap: standalone ? 'standalone' : 'ngmodule',
    zoneless: !includesZone(options['polyfills']) && !providers.includes('provideZoneChangeDetection'),
    signalForms: sources.some((path) => /['"]@angular\/forms\/signals['"]/.test(tree.readText(path))),
    stylesKind: stylesPath?.endsWith('.scss') === true ? 'scss' : 'css',
    stylesPath,
    appConfigPath,
    material: detectMaterial(tree, manifest, entries),
    editors: {
      claude: tree.exists('CLAUDE.md') || hasEntries(tree, '.claude'),
      cursor: tree.exists('.cursorrules') || hasEntries(tree, '.cursor'),
      vscode: hasEntries(tree, '.vscode'),
    },
    eslintConfigPath: ESLINT_FLAT_CONFIGS.find((path) => tree.exists(path)),
    ssr:
      options['server'] !== undefined ||
      options['ssr'] !== undefined ||
      declaredRange(manifest, '@angular/ssr') !== undefined,
    sourceLocale: sourceLocaleOf(project),
    maturity: componentCount > 1 || hasOtherUi || hasOwnProviders ? 'existing' : 'fresh',
  };
}
