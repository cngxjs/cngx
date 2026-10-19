import { strings } from '@angular-devkit/core';
import { posix } from 'node:path';

import { readDecorator } from '../../engine';
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
  | { readonly kind: 'untouched'; readonly files: ScaffoldFiles; readonly routing: boolean }
  | { readonly kind: 'starter'; readonly files: ScaffoldFiles; readonly fingerprints: Readonly<Record<keyof ScaffoldFiles, string>> }
  | { readonly kind: 'custom' };

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
  const routing = variant.startsWith('routing-');
  const style = variant.slice(variant.lastIndexOf('-') + 1);
  const template = matchingVariants(read(files.template), 'app.html', names).includes(routing ? 'routing' : 'no-routing');
  const stylesheet = matchingVariants(read(files.stylesheet), `app.${style}`, names).includes(style);
  return template && stylesheet ? { kind: 'untouched', files, routing } : undefined;
}

function starter(read: Read, files: ScaffoldFiles): AppScaffold | undefined {
  const component = starterFingerprintOf(read(files.component) ?? '');
  const template = starterFingerprintOf(read(files.template) ?? '');
  const stylesheet = starterFingerprintOf(read(files.stylesheet) ?? '');
  if (component === undefined || template === undefined || stylesheet === undefined) {
    return undefined;
  }
  return { kind: 'starter', files, fingerprints: { component, template, stylesheet } };
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
  return untouched(read, files, names) ?? starter(read, files) ?? { kind: 'custom' };
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
