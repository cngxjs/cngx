import { posix } from 'node:path';

import {
  declaredRange,
  hasProvenanceStamp,
  hasStyleImport,
  type PackageManifest,
  styleImportUrls,
  type Tree,
} from '../../engine';
import { isLocalStylesheet, type Read } from './workspace';

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

const PREBUILT_THEME = '@angular/material/prebuilt-themes/';

/** The one stylesheet every cngx app loads. */
export const CNGX_STYLESHEET = '@cngx/themes/cngx.css';
const MATERIAL_BRIDGE = '@cngx/themes/material/theme';

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

export function detectMaterial(read: Read, manifest: PackageManifest, entries: readonly string[]): MaterialFacts {
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

// A url Sass resolves next to the importing file, not a package or a
// built-in module (`sass:map`).
function isRelativeUrl(url: string): boolean {
  return !url.startsWith('@') && !url.includes(':') && !url.startsWith('/');
}

// The files a relative url can load, the way Sass resolves it: the url as
// written when it names an extension, else `name.scss`, `_name.scss`, `name.css`.
function localCandidates(from: string, url: string): readonly string[] {
  const path = posix.join(posix.dirname(from), url);
  if (/\.s?css$/.test(path)) {
    return [path];
  }
  const partial = posix.join(posix.dirname(path), `_${posix.basename(path)}`);
  return [`${path}.scss`, `${partial}.scss`, `${path}.css`];
}

// The stylesheet itself and every local file it loads, one level deep.
function withLocalImports(read: Read, entry: string): readonly string[] {
  const content = read(entry) ?? '';
  const imported = styleImportUrls(content)
    .filter(isRelativeUrl)
    .flatMap((url) => localCandidates(entry, url).map(read).find((file) => file !== undefined) ?? []);
  return [content, ...imported];
}

export function importsCngxStylesheet(read: Read, entries: readonly string[]): boolean {
  const statement = `@import '${CNGX_STYLESHEET}';`;
  return (
    entries.includes(CNGX_STYLESHEET) ||
    entries
      .filter(isLocalStylesheet)
      .some((entry) => withLocalImports(read, entry).some((content) => hasStyleImport(content, statement)))
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

export function detectTailwind(
  read: Read,
  manifest: PackageManifest,
  entries: readonly string[],
): TailwindFacts | undefined {
  const range = declaredRange(manifest, 'tailwindcss');
  if (range === undefined) {
    return undefined;
  }
  const local = entries.filter(isLocalStylesheet);
  const contents = local.map((entry) => read(entry) ?? '');
  const layered = contents.some((content) => hasStyleImport(content, "@import 'tailwindcss';"));
  const orderTarget = local[0];
  const layersContent = orderTarget === undefined ? undefined : read(posix.join(posix.dirname(orderTarget), CNGX_LAYERS_FILE));
  return {
    major: majorOf(range, layered),
    layered,
    orderTarget,
    orderDeclared: contents.some((content) =>
      styleImportUrls(content).some((url) => posix.basename(url) === CNGX_LAYERS_FILE),
    ),
    layersFile: generatedFileState(layersContent),
  };
}

export function generatedFileState(content: string | undefined): GeneratedFileState {
  if (content === undefined) {
    return 'absent';
  }
  return hasProvenanceStamp(content) ? 'generated' : 'foreign';
}

export function existingCngxTheme(
  tree: Tree,
  read: Read,
  sourceRoot: string,
  entries: readonly string[],
): string | undefined {
  const generated = Object.values(CNGX_THEME_FILES)
    .map((name) => posix.join(sourceRoot, name))
    .find((path) => tree.exists(path));
  return (
    generated ??
    entries.find((entry) => entry.endsWith('.scss') && hasStyleImport(read(entry) ?? '', `@use '${MATERIAL_BRIDGE}';`))
  );
}
