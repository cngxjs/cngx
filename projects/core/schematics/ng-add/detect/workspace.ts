import { type workspaces } from '@angular-devkit/core';
import { SchematicsException } from '@angular-devkit/schematics';

import { isInjectedStyleEntry, isRecord, parseManifest, styleEntryPath } from '../../engine';

// File content by path, read once per detection run; `undefined` when absent.
export type Read = (path: string) => string | undefined;

/** Every application project in angular.json, in file order. */
export function applicationsOf(workspace: workspaces.WorkspaceDefinition): readonly string[] {
  return [...workspace.projects]
    .filter(([, project]) => project.extensions['projectType'] === 'application')
    .map(([name]) => name);
}

export function resolveProject(
  workspace: workspaces.WorkspaceDefinition,
  name: string | undefined,
): readonly [string, workspaces.ProjectDefinition] {
  const defaultProject = workspace.extensions['defaultProject'];
  const candidate =
    name ??
    (typeof defaultProject === 'string' ? defaultProject : undefined) ??
    applicationsOf(workspace)[0] ??
    [...workspace.projects.keys()][0];
  if (candidate === undefined) {
    throw new SchematicsException('angular.json lists no projects.');
  }
  const project = workspace.projects.get(candidate);
  if (project === undefined) {
    throw new SchematicsException(`Project "${candidate}" not found in angular.json.`);
  }
  if (project.extensions['projectType'] === 'library') {
    throw new SchematicsException(`Project "${candidate}" is a library; cngx ng-add sets up an application.`);
  }
  return [candidate, project];
}

export function hasBuildTarget(project: workspaces.ProjectDefinition): boolean {
  return project.targets.has('build');
}

export function buildOptions(project: workspaces.ProjectDefinition): Readonly<Record<string, unknown>> {
  return project.targets.get('build')?.options ?? {};
}

// The stylesheets the build injects into the page; a lazy bundle
// (`inject: false`) is loaded by the app itself, so it is no global style.
export function styleEntries(options: Readonly<Record<string, unknown>>): readonly string[] {
  const styles = options['styles'];
  if (!Array.isArray(styles)) {
    return [];
  }
  return styles.flatMap((entry: unknown) => {
    const path = isInjectedStyleEntry(entry) ? styleEntryPath(entry) : undefined;
    return path === undefined ? [] : [path];
  });
}

export function isLocalStylesheet(path: string): boolean {
  return /\.s?css$/.test(path) && !path.startsWith('@') && !path.startsWith('node_modules/');
}

// Same preference as `getProjectStyleFile` in @schematics/angular: a file
// named `styles.*` wins, otherwise the first local stylesheet.
export function globalStylesheet(entries: readonly string[]): string | undefined {
  const local = entries.filter(isLocalStylesheet);
  return local.find((path) => /(^|\/)styles\.s?css$/.test(path)) ?? local[0];
}

export function sourceLocaleOf(project: workspaces.ProjectDefinition): string | undefined {
  const i18n = project.extensions['i18n'];
  const locale = isRecord(i18n) ? i18n['sourceLocale'] : undefined;
  if (typeof locale === 'string') {
    return locale;
  }
  return isRecord(locale) && typeof locale['code'] === 'string' ? locale['code'] : undefined;
}

// A plain semver specifier (`^21.2.0`, `~21.2`, `>=21.2.0 <22`, `21.2.5`)
// reads as its lowest version. A protocol (`catalog:`, `workspace:*`,
// `npm:`), a dist-tag or a wildcard minor carries none.
const PLAIN_RANGE = /^[\s^~<>=v]*(\d+)(?:\.(\d+))?(?:\.(\d+))?(-[\w.]+)?(?![.\w*])/;

export function versionOf(range: string | undefined): string | undefined {
  const match = PLAIN_RANGE.exec(range ?? '');
  if (match === null) {
    return undefined;
  }
  const [, major, minor = '0', patch = '0', prerelease = ''] = match;
  return `${major}.${minor}.${patch}${prerelease}`;
}

/** Where the package manager put `@angular/core`, relative to the workspace root. */
export const ANGULAR_CORE_MANIFEST = 'node_modules/@angular/core/package.json';

/**
 * Where the Angular version was read: the installed package, the declared
 * range, or the range because the installed `package.json` is present but
 * cannot be read; `undefined` when nothing carries a version.
 */
export type AngularSource = 'installed' | 'range' | 'unreadable';

export interface AngularVersion {
  readonly version: string | undefined;
  readonly source: AngularSource | undefined;
}

function installedVersion(content: string): string | undefined {
  try {
    return versionOf(parseManifest(content).version);
  } catch {
    return undefined;
  }
}

/**
 * The app's Angular version: the installed `@angular/core` first, since the
 * CLI installs packages before `ng add` runs, else the lowest version the
 * declared range allows.
 */
export function angularVersionOf(read: Read, range: string | undefined): AngularVersion {
  const content = read(ANGULAR_CORE_MANIFEST);
  const installed = content === undefined ? undefined : installedVersion(content);
  if (installed !== undefined) {
    return { version: installed, source: 'installed' };
  }
  const version = versionOf(range);
  if (content !== undefined) {
    return { version, source: 'unreadable' };
  }
  return { version, source: version === undefined ? undefined : 'range' };
}
