import { type workspaces } from '@angular-devkit/core';

import { isRecord, parseManifest, styleEntryPath } from '../../engine';

// File content by path, read once per detection run; `undefined` when absent.
export type Read = (path: string) => string | undefined;

export function resolveProject(
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

export function buildOptions(project: workspaces.ProjectDefinition): Readonly<Record<string, unknown>> {
  return project.targets.get('build')?.options ?? {};
}

export function styleEntries(options: Readonly<Record<string, unknown>>): readonly string[] {
  const styles = options['styles'];
  if (!Array.isArray(styles)) {
    return [];
  }
  return styles.flatMap((entry: unknown) => {
    const path = styleEntryPath(entry);
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

function installedVersion(content: string | undefined): string | undefined {
  if (content === undefined) {
    return undefined;
  }
  try {
    return versionOf(parseManifest(content).version);
  } catch {
    return undefined;
  }
}

/**
 * The app's Angular version: the installed `@angular/core` first, since the
 * CLI installs packages before `ng add` runs, else the lowest version the
 * declared range allows; `undefined` when neither carries one.
 */
export function angularVersionOf(read: Read, range: string | undefined): string | undefined {
  return installedVersion(read(ANGULAR_CORE_MANIFEST)) ?? versionOf(range);
}
