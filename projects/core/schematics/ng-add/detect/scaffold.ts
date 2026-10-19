import { strings } from '@angular-devkit/core';
import { posix } from 'node:path';

import { contentFingerprint, isRecord, readDecorator } from '../../engine';
import { type AppShell, type AppShellUnfollowed } from './app-shell';
import {
  SCAFFOLD_CATALOG,
  SCAFFOLD_NAME_PLACEHOLDER,
  SCAFFOLD_SELECTOR_PLACEHOLDER,
  SCAFFOLD_TITLE_PLACEHOLDER,
} from './scaffold-catalog.generated';
import { type Read } from './workspace';

/**
 * The names `ng new` rendered the scaffold with: the project name and the
 * root selector (`<prefix>-root`); `undefined` when angular.json gives no
 * prefix, so nothing reads as the untouched scaffold.
 */
export interface ScaffoldNames {
  readonly project: string;
  readonly selector: string | undefined;
}

/** The three files of the root component the starter replaces. */
export interface ScaffoldFiles {
  readonly component: string;
  readonly template: string;
  readonly stylesheet: string;
}

/**
 * What the root component's files are: the untouched `ng new` scaffold of a
 * catalog variant, a cngx starter (every file carries a starter fingerprint
 * line, the fingerprints are what a run compares with its own render), or
 * anything else.
 */
export type AppScaffold =
  | {
      readonly kind: 'untouched';
      readonly files: ScaffoldFiles;
      readonly routing: boolean;
      /** The `app.ts` catalog variant the component matched; an apply-time re-check compares against the same variant. */
      readonly variant: string;
      /** The names the match substituted, the selector included. */
      readonly names: ScaffoldNames & { readonly selector: string };
    }
  | {
      readonly kind: 'starter';
      readonly files: ScaffoldFiles;
      readonly fingerprints: Readonly<Record<keyof ScaffoldFiles, string>>;
      /** The root selector `ng new` gave the app, which the starter keeps; `undefined` without a prefix. */
      readonly selector: string | undefined;
    }
  | { readonly kind: 'custom' };

/** Which catalog entry a starter file replaces: the file name and the variant. */
export interface ScaffoldEntryKey {
  readonly file: string;
  readonly variant: string;
}

/** The catalog entries the three files of an untouched scaffold matched. */
export function scaffoldEntries(scaffold: Extract<AppScaffold, { kind: 'untouched' }>): Readonly<Record<keyof ScaffoldFiles, ScaffoldEntryKey>> {
  const style = scaffold.variant.slice(scaffold.variant.lastIndexOf('-') + 1);
  return {
    component: { file: 'app.ts', variant: scaffold.variant },
    template: { file: 'app.html', variant: scaffold.routing ? 'routing' : 'no-routing' },
    stylesheet: { file: `app.${style}`, variant: style },
  };
}

/**
 * Whether `content` is exactly the catalog entry `key` with `names`
 * substituted, line endings normalised; the apply-time re-check of a file
 * detection read as untouched.
 */
export function matchesScaffoldEntry(content: string, key: ScaffoldEntryKey, names: ScaffoldNames): boolean {
  return matchingVariants(content, key.file, names).includes(key.variant);
}

/** `src/index.html`: missing, the untouched `ng new` file, that file with the starter favicon link, or anything else. */
export type IndexHtmlState = 'absent' | 'untouched' | 'starter' | 'custom';

export interface IndexHtmlFacts {
  readonly path: string;
  readonly state: IndexHtmlState;
}

/** The icon link `ng new` writes into `index.html`, as rendered and as Prettier formats it. */
const STOCK_FAVICON_LINKS = [
  '<link rel="icon" type="image/x-icon" href="favicon.ico">',
  '<link rel="icon" type="image/x-icon" href="favicon.ico" />',
] as const;

/** The icon link the starter writes instead, in the same two forms. */
const STARTER_FAVICON_LINKS = [
  '<link rel="icon" type="image/svg+xml" href="favicon.svg">',
  '<link rel="icon" type="image/svg+xml" href="favicon.svg" />',
] as const;

const STARTER_FINGERPRINT = /^(?:\/\* cngx:fingerprint ([0-9a-f]{8}) \*\/|<!-- cngx:fingerprint ([0-9a-f]{8}) -->)\r?$/m;

/**
 * The line that records the fingerprint of a starter file's rendered body in
 * the file itself: a block comment for TypeScript and CSS, an HTML comment
 * for the template. The CLI runs the app's Prettier over every file a
 * schematic writes, so a later run compares this line, never the text.
 */
export function starterFingerprintLine(fingerprint: string, comment: 'block' | 'html'): string {
  return comment === 'html' ? `<!-- cngx:fingerprint ${fingerprint} -->` : `/* cngx:fingerprint ${fingerprint} */`;
}

/** The starter fingerprint a file records; `undefined` when it records none. */
export function starterFingerprintOf(content: string): string | undefined {
  const match = STARTER_FINGERPRINT.exec(content);
  return match?.[1] ?? match?.[2];
}

function normalize(content: string): string {
  return content.replace(/\r\n/g, '\n');
}

// A catalog body with the names `ng new` used put back in.
function substitute(body: string, names: ScaffoldNames, selector: string): string {
  return body
    .split(SCAFFOLD_NAME_PLACEHOLDER)
    .join(names.project)
    .split(SCAFFOLD_TITLE_PLACEHOLDER)
    .join(strings.classify(names.project))
    .split(SCAFFOLD_SELECTOR_PLACEHOLDER)
    .join(selector);
}

// The catalog variants of `file` whose body is exactly `content`, CLI 21
// only; raw and Prettier-formatted bodies alike.
function matchingVariants(content: string | undefined, file: string, names: ScaffoldNames): readonly string[] {
  const { selector } = names;
  if (content === undefined || selector === undefined) {
    return [];
  }
  const normalized = normalize(content);
  return SCAFFOLD_CATALOG.filter(
    (entry) => entry.major === 21 && entry.file === file && substitute(entry.body, names, selector) === normalized,
  ).map((entry) => entry.variant);
}

// The files the decorator of a standalone root component names through
// `templateUrl` and `styleUrl`; `undefined` when it names them otherwise.
function filesOf(read: Read, shell: AppShell): ScaffoldFiles | undefined {
  const content = read(shell.componentFile);
  const decorator = content === undefined ? undefined : readDecorator(content, shell.className, 'Component');
  if (decorator?.kind !== 'object') {
    return undefined;
  }
  const template = decorator.properties.get('templateUrl');
  const stylesheet = decorator.properties.get('styleUrl');
  if (template?.kind !== 'string' || stylesheet?.kind !== 'string') {
    return undefined;
  }
  const dir = posix.dirname(shell.componentFile);
  return { component: shell.componentFile, template: posix.join(dir, template.text), stylesheet: posix.join(dir, stylesheet.text) };
}

// Exact matches only: the component against the `app.ts` entries, the
// template against the `app.html` entry of the same routing, the stylesheet
// against the empty `app.<style>` entry its `styleUrl` names.
function untouched(read: Read, files: ScaffoldFiles, names: ScaffoldNames): AppScaffold | undefined {
  const [variant] = matchingVariants(read(files.component), 'app.ts', names);
  if (variant === undefined) {
    return undefined;
  }
  const { selector } = names;
  if (selector === undefined) {
    return undefined;
  }
  const scaffold = { kind: 'untouched', files, routing: variant.startsWith('routing-'), variant, names: { ...names, selector } } as const;
  const entries = scaffoldEntries(scaffold);
  const matches = (path: string, key: ScaffoldEntryKey): boolean => {
    const content = read(path);
    return content !== undefined && matchesScaffoldEntry(content, key, names);
  };
  const template = matches(files.template, entries.template);
  const stylesheet = matches(files.stylesheet, entries.stylesheet);
  return template && stylesheet ? scaffold : undefined;
}

function starter(read: Read, files: ScaffoldFiles, selector: string | undefined): AppScaffold | undefined {
  const component = starterFingerprintOf(read(files.component) ?? '');
  const template = starterFingerprintOf(read(files.template) ?? '');
  const stylesheet = starterFingerprintOf(read(files.stylesheet) ?? '');
  if (component === undefined || template === undefined || stylesheet === undefined) {
    return undefined;
  }
  return { kind: 'starter', files, fingerprints: { component, template, stylesheet }, selector };
}

/**
 * What the root component's files are. `untouched` only for a standalone
 * root component whose `app.ts`, `app.html` and stylesheet each equal a
 * catalog entry of one variant exactly, after the project name and selector
 * are substituted and line endings normalised; `starter` when every file
 * records a starter fingerprint; else `custom`. No substring or marker
 * heuristic decides `untouched`, so one changed character makes it `custom`.
 */
export function scaffoldOf(read: Read, shell: AppShell | AppShellUnfollowed, names: ScaffoldNames): AppScaffold {
  if (shell.kind === 'unfollowed' || shell.importsHost.kind !== 'component') {
    return { kind: 'custom' };
  }
  const files = filesOf(read, shell);
  if (files === undefined) {
    return { kind: 'custom' };
  }
  return untouched(read, files, names) ?? starter(read, files, names.selector) ?? { kind: 'custom' };
}

// The content with one icon link of `from` swapped for the one of `to` in
// the same form; `undefined` unless the file holds exactly one of them.
function swapLink(content: string, from: readonly string[], to: readonly string[]): string | undefined {
  const found = from.flatMap((link, index) => (content.split(link).length === 2 ? [index] : []));
  const total = from.reduce((count, link) => count + content.split(link).length - 1, 0);
  if (found.length !== 1 || total !== 1) {
    return undefined;
  }
  return content.replace(from[found[0]], to[found[0]]);
}

/** `index.html` with the starter favicon link instead of the stock one; the content unchanged when it holds no single stock link. */
export function withStarterFavicon(content: string): string {
  return swapLink(content, STOCK_FAVICON_LINKS, STARTER_FAVICON_LINKS) ?? content;
}

/**
 * Compares `index.html` with the catalog entry, the project name, title and
 * selector substituted: `untouched` on an exact match, `starter` when it
 * matches once the starter favicon link is swapped back, else `custom`.
 */
export function indexHtmlStateOf(content: string | undefined, names: ScaffoldNames): IndexHtmlState {
  if (content === undefined) {
    return 'absent';
  }
  const normalized = normalize(content);
  if (matchingVariants(normalized, 'index.html', names).length > 0) {
    return 'untouched';
  }
  const stock = swapLink(normalized, STARTER_FAVICON_LINKS, STOCK_FAVICON_LINKS);
  return stock !== undefined && matchingVariants(stock, 'index.html', names).length > 0 ? 'starter' : 'custom';
}

/**
 * The favicon file the starter writes into the folder the build copies as
 * a whole (an assets entry with the glob of every file and an `input`
 * folder, as `ng new` writes for `public`), and the fingerprint of what is
 * there; `undefined` when the build copies no such folder.
 */
export interface FaviconFacts {
  readonly path: string;
  /** `contentFingerprint` of the file; `undefined` when it is missing. */
  readonly fingerprint: string | undefined;
}

/** `favicon.svg` in the public folder the build options list, read through `read`. */
export function faviconOf(read: Read, options: Readonly<Record<string, unknown>>): FaviconFacts | undefined {
  const assets: readonly unknown[] = Array.isArray(options['assets']) ? options['assets'] : [];
  const input = assets
    .filter(isRecord)
    .filter((asset) => asset['glob'] === '**/*' && [undefined, '', '/'].includes(asset['output'] as string | undefined))
    .map((asset) => asset['input'])
    .find((candidate): candidate is string => typeof candidate === 'string');
  if (input === undefined) {
    return undefined;
  }
  const path = posix.join(input, 'favicon.svg');
  const content = read(path);
  return { path, fingerprint: content === undefined ? undefined : contentFingerprint(content) };
}
