#!/usr/bin/env node
// Usage:
//   npm run schematics:scaffold   # rewrite the generated module
//
// Renders the `ng new` application templates of every installed
// @schematics/angular (the toolchain's own and each
// `@schematics/angular-<major>` npm alias in package.json) for every
// supported variant and writes their bodies, keyed by the CLI major, into
// the catalog ng add compares an app against. A new CLI major is one alias
// devDependency and one regenerate. Each major keeps its full set, also the
// bodies another major shares, so dropping a major drops nothing else. A
// file counts as the untouched scaffold only on an exact match with an
// entry, never on a heuristic, so the templates are the single source and
// `scripts/__tests__/scaffold-catalog.test.mjs` fails when an installed
// @schematics/angular release changes one until the catalog is regenerated
// and reviewed.
//
// Each body is stored raw and, where it differs, formatted with the
// `.prettierrc` `ng new` writes: the Angular CLI runs the app's Prettier over
// every file a schematic edits, so both forms are what an app can hold. The
// project name, its class-cased form and the root selector are placeholders;
// detection substitutes them before comparing.

import { createHash } from 'node:crypto';
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, posix, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

export const OUT = 'projects/core/schematics/ng-add/detect/scaffold-catalog.generated.ts';

/** Stands in for the project name in every body; never a valid project name itself. */
export const NAME_PLACEHOLDER = '__cngx_scaffold_name__';

/**
 * Stands in for the root selector (`<prefix>-root`). A custom element name,
 * so Prettier's HTML parser reads `<cngx-scaffold-selector>` in `index.html`
 * as the element it stands for, not as text.
 */
export const SELECTOR_PLACEHOLDER = 'cngx-scaffold-selector';

/** Stands in for the class-cased project name, the `<title>` of `index.html`. */
export const TITLE_PLACEHOLDER = '__cngx_scaffold_title__';

const PRETTIERRC = 'workspace/files/.prettierrc.template';

// Template path inside @schematics/angular, the variant it is rendered for,
// and the options that variant passes. `zoneless` is the `ng new` default;
// the component files are the `ng new` standalone defaults (`templateUrl`,
// `styleUrl`, no `displayBlock`), with routing on or off and a CSS or SCSS
// stylesheet. Inline templates, inline styles, Sass and Less have no entry,
// so such an app is never the untouched scaffold.
const COMPONENT = { inlineTemplate: false, inlineStyle: false, displayBlock: false };
const STYLES = ['css', 'scss'];
const ROUTING = [
  { routing: true, name: 'routing' },
  { routing: false, name: 'no-routing' },
];

export const TEMPLATES = [
  {
    file: 'app.spec.ts',
    template: 'application/files/standalone-files/src/app/app__suffix__.spec.ts.template',
    variants: [
      { variant: 'zoneless', options: { zoneless: true } },
      { variant: 'zone', options: { zoneless: false } },
    ],
  },
  {
    file: 'app.ts',
    template: 'application/files/standalone-files/src/app/app__suffix__.ts.template',
    variants: ROUTING.flatMap(({ routing, name }) =>
      STYLES.map((style) => ({ variant: `${name}-${style}`, options: { ...COMPONENT, routing, style } })),
    ),
  },
  {
    file: 'app.html',
    template: 'application/files/common-files/src/app/app__suffix__.html.template',
    variants: ROUTING.map(({ routing, name }) => ({ variant: name, options: { ...COMPONENT, routing } })),
  },
  ...STYLES.map((style) => ({
    file: `app.${style}`,
    template: 'component/files/__name@dasherize@if-flat__/__name@dasherize__.__type@dasherize__.__style__.template',
    variants: [{ variant: style, options: { ...COMPONENT, style } }],
  })),
  ...STYLES.map((style) => ({
    file: `styles.${style}`,
    dir: 'src',
    template: 'application/files/common-files/src/styles.__style__.template',
    variants: [{ variant: style, options: { style } }],
  })),
  {
    file: 'index.html',
    dir: 'src',
    template: 'application/files/common-files/src/index.html.template',
    variants: [{ variant: 'default', options: {} }],
  },
];

/** The toolchain's own templates; their major is the workspace CLI major. */
export const TOOLCHAIN_PACKAGE = '@schematics/angular';

/** An npm alias of @schematics/angular that holds the templates of another CLI major. */
const ALIAS = /^@schematics\/angular-\d+$/;

function schematicsRoot(name = TOOLCHAIN_PACKAGE) {
  return dirname(require.resolve(`${name}/package.json`));
}

/**
 * The template packages the catalog renders: the toolchain's own first, then
 * every alias devDependency in package.json, in the order listed. A major
 * an earlier package already renders is left out, so a toolchain that
 * `scripts/toolchain-overlay.mjs` moved onto an alias's major renders it once.
 */
export function schematicsRoots() {
  const { devDependencies = {} } = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf8'));
  const names = [TOOLCHAIN_PACKAGE, ...Object.keys(devDependencies).filter((name) => ALIAS.test(name))];
  const roots = [];
  for (const root of names.map((name) => schematicsRoot(name))) {
    if (!roots.some((kept) => majorOf(kept) === majorOf(root))) {
      roots.push(root);
    }
  }
  return roots;
}

/** The installed @schematics/angular version, read from its own package.json. */
export function schematicsVersion(root = schematicsRoot()) {
  return JSON.parse(readFileSync(resolve(root, 'package.json'), 'utf8')).version;
}

function majorOf(root) {
  return Number(schematicsVersion(root).split('.')[0]);
}

function normalize(text) {
  return text.replace(/\r\n/g, '\n');
}

function fingerprint(body) {
  return `sha256:${createHash('sha256').update(body).digest('hex')}`;
}

// The renderer @schematics/angular applies its own templates with, the
// @angular-devkit/core that package resolves (an alias brings its own).
// `utils` stands in for `strings` of @angular-devkit/core: `classify` turns
// the name into the title placeholder, so detection substitutes the
// classified name.
function render(text, options, root) {
  const { template } = createRequire(resolve(root, 'package.json'))('@angular-devkit/core');
  const utils = { classify: (name) => (name === NAME_PLACEHOLDER ? TITLE_PLACEHOLDER : name) };
  return template(text, {})({ suffix: '', name: NAME_PLACEHOLDER, selector: SELECTOR_PLACEHOLDER, utils, ...options });
}

async function format(body, path, prettierrc) {
  const prettier = await import('prettier');
  return prettier.format(body, { ...prettierrc, filepath: path });
}

/**
 * Every catalog entry for the templates of one @schematics/angular package:
 * one per file and variant, raw first; the formatted body is a second entry
 * only when Prettier changes the raw one.
 */
export async function collectEntries(root = schematicsRoot()) {
  const major = majorOf(root);
  const prettierrc = JSON.parse(readFileSync(resolve(root, PRETTIERRC), 'utf8'));
  const entries = [];
  for (const { file, dir = 'src/app', template, variants } of TEMPLATES) {
    const text = readFileSync(resolve(root, template), 'utf8');
    for (const { variant, options } of variants) {
      const raw = normalize(render(text, options, root));
      const formatted = normalize(await format(raw, posix.join(dir, file), prettierrc));
      const bodies = formatted === raw ? [['raw', raw]] : [['raw', raw], ['prettier', formatted]];
      for (const [form, body] of bodies) {
        entries.push({ major, file, variant, form, template, body, fingerprint: fingerprint(body) });
      }
    }
  }
  return entries;
}

const quote = (text) => `'${text.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;

/** A body detection has to substitute names into before it compares; every other body is compared by fingerprint. */
export function holdsPlaceholder(body) {
  return [NAME_PLACEHOLDER, SELECTOR_PLACEHOLDER, TITLE_PLACEHOLDER].some((placeholder) => body.includes(placeholder));
}

// The welcome page holds no name, so its four bodies (20 KB each) stay out
// of the bundle and are compared by fingerprint alone.
function entry({ major, file, variant, form, template, body, fingerprint: print }) {
  return [
    '  {',
    `    major: ${major},`,
    `    file: ${quote(file)},`,
    `    variant: ${quote(variant)},`,
    `    form: ${quote(form)},`,
    `    template: ${quote(template)},`,
    `    fingerprint: ${quote(print)},`,
    ...(holdsPlaceholder(body) ? [`    body: ${JSON.stringify(body)},`] : []),
    '  },',
  ].join('\n');
}

/** Every catalog entry for every template package `schematicsRoots` names, by major. */
export async function collectAllEntries(roots = schematicsRoots()) {
  const entries = [];
  for (const root of roots) {
    entries.push(...(await collectEntries(root)));
  }
  return entries;
}

/** The generated module for the installed templates of every CLI major. */
export async function renderCatalogModule(roots = schematicsRoots()) {
  const entries = await collectAllEntries(roots);
  const versions = roots.map((root) => schematicsVersion(root)).join(', ');
  return [
    `// Generated by scripts/generate-scaffold-catalog.mjs from @schematics/angular ${versions}.`,
    '// Do not edit; run `npm run schematics:scaffold`.',
    '',
    '/** Stands in for the project name in every body; detection substitutes it before comparing. */',
    `export const SCAFFOLD_NAME_PLACEHOLDER = ${quote(NAME_PLACEHOLDER)};`,
    '',
    '/** Stands in for the root selector (`<prefix>-root`) in every body. */',
    `export const SCAFFOLD_SELECTOR_PLACEHOLDER = ${quote(SELECTOR_PLACEHOLDER)};`,
    '',
    '/** Stands in for the class-cased project name, the `<title>` of `index.html`. */',
    `export const SCAFFOLD_TITLE_PLACEHOLDER = ${quote(TITLE_PLACEHOLDER)};`,
    '',
    '/** One `ng new` file as @schematics/angular renders it for one variant. */',
    'export interface ScaffoldEntry {',
    '  /** The Angular CLI major the templates belong to. */',
    '  readonly major: number;',
    '  /** The file name in `src/app`; `index.html` is the one in `src`. */',
    '  readonly file: string;',
    '  readonly variant: string;',
    '  /** `raw` as rendered, `prettier` as formatted with the `ng new` `.prettierrc`. */',
    "  readonly form: 'raw' | 'prettier';",
    '  /** The template path inside @schematics/angular. */',
    '  readonly template: string;',
    '  /** `sha256:<hex>` of the body with LF line endings. */',
    '  readonly fingerprint: string;',
    '  /**',
    '   * The body with LF line endings and the project name, title and selector',
    '   * as placeholders; absent when it holds none, then the fingerprint alone',
    '   * is compared.',
    '   */',
    '  readonly body?: string;',
    '}',
    '',
    'export const SCAFFOLD_CATALOG: readonly ScaffoldEntry[] = [',
    ...entries.map(entry),
    '];',
    '',
  ].join('\n');
}

async function main() {
  const module = await renderCatalogModule();
  writeFileSync(resolve(ROOT, OUT), module);
  const count = (await collectAllEntries()).length;
  process.stdout.write(`${OUT}: ${count} entries\n`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  await main();
}
